import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'devground_super_secret';
const router = Router();

const wrap = (fn: (req: any, res: Response) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

// ── 인증 ──────────────────────────────────────────────
// 개발자(웹 콘솔): 기존 JWT 사용
function devAuth(req: any, res: Response, next: NextFunction) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// 게임 클라이언트(Unity SDK): X-API-Key 헤더
async function apiKeyAuth(req: any, res: Response, next: NextFunction) {
  const key = req.headers['x-api-key'];
  if (typeof key !== 'string') return res.status(401).json({ error: 'X-API-Key required' });
  const game = await prisma.game.findUnique({ where: { apiKey: key } });
  if (!game) return res.status(403).json({ error: 'Invalid API key' });
  req.game = game;
  next();
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-+|-+$/g, '') || 'game';

// ── 개발자용: 게임/빌드 관리 ───────────────────────────
router.post('/games', devAuth, wrap(async (req, res) => {
  const { title, slug } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  const finalSlug = slug ? slugify(slug) : slugify(title);
  try {
    const game = await prisma.game.create({
      data: { title, slug: finalSlug, developerId: String(req.user.id) },
    });
    res.status(201).json(game);
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'slug already exists' });
    throw e;
  }
}));

router.get('/games/mine', devAuth, wrap(async (req, res) => {
  res.json(await prisma.game.findMany({
    where: { developerId: String(req.user.id) },
    orderBy: { createdAt: 'desc' },
  }));
}));

async function ownGame(req: any, res: Response) {
  const game = await prisma.game.findUnique({ where: { id: req.params.gameId } });
  if (!game) { res.status(404).json({ error: 'Game not found' }); return null; }
  if (game.developerId !== String(req.user.id)) { res.status(403).json({ error: 'Forbidden' }); return null; }
  return game;
}

router.post('/games/:gameId/builds', devAuth, wrap(async (req, res) => {
  const game = await ownGame(req, res); if (!game) return;
  const { version, platform, artifactUrl } = req.body || {};
  if (!version || !platform || !artifactUrl)
    return res.status(400).json({ error: 'version, platform, artifactUrl required' });
  // 같은 플랫폼의 이전 빌드는 비활성화 → 최신 빌드만 활성
  const [, build] = await prisma.$transaction([
    prisma.build.updateMany({ where: { gameId: game.id, platform }, data: { isActive: false } }),
    prisma.build.create({ data: { gameId: game.id, version, platform, artifactUrl } }),
  ]);
  res.status(201).json(build);
}));

router.get('/games/:gameId/feedbacks', devAuth, wrap(async (req, res) => {
  const game = await ownGame(req, res); if (!game) return;
  const type = req.query.type as string | undefined;
  res.json(await prisma.playtestFeedback.findMany({
    where: { gameId: game.id, ...(type ? { type } : {}) },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Number(req.query.limit) || 100, 500),
  }));
}));

// ── 공개: 웹 런처용 (slug 기반) ────────────────────────
router.get('/public/games/:slug', wrap(async (req, res) => {
  const game = await prisma.game.findUnique({
    where: { slug: req.params.slug },
    select: {
      id: true, title: true, slug: true, createdAt: true,
      builds: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(game);
}));

// ── 게임 클라이언트용 (API Key) ────────────────────────
router.post('/leaderboard', apiKeyAuth, wrap(async (req, res) => {
  const { userId, username, score, metadata } = req.body || {};
  if (!userId || !username || typeof score !== 'number' || !Number.isFinite(score))
    return res.status(400).json({ error: 'userId, username, numeric score required' });
  const entry = await prisma.leaderboardEntry.create({
    data: { gameId: req.game.id, userId: String(userId), username: String(username).slice(0, 32), score, metadata },
  });
  res.status(201).json(entry);
}));

router.get('/leaderboard', apiKeyAuth, wrap(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  // 유저당 최고 점수 1건만 노출
  const rows = await prisma.leaderboardEntry.findMany({
    where: { gameId: req.game.id },
    orderBy: { score: 'desc' },
    distinct: ['userId'],
    take: limit,
  });
  res.json(rows.map((r, i) => ({ rank: i + 1, ...r })));
}));

router.post('/feedback', apiKeyAuth, wrap(async (req, res) => {
  const { buildVer, type, message, screenshot, deviceInfo, position } = req.body || {};
  if (!buildVer || !message || !deviceInfo)
    return res.status(400).json({ error: 'buildVer, message, deviceInfo required' });
  const t = String(type || 'BUG').toUpperCase();
  if (!['BUG', 'SUGGESTION', 'REVIEW'].includes(t))
    return res.status(400).json({ error: 'type must be BUG | SUGGESTION | REVIEW' });
  const fb = await prisma.playtestFeedback.create({
    data: { gameId: req.game.id, buildVer, type: t, message, screenshot, deviceInfo, position },
  });
  res.status(201).json({ id: fb.id });
}));

router.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[baas]', err);
  res.status(500).json({ error: 'Internal error' });
});

export default router;

