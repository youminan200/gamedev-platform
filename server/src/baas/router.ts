import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
const sqliteDb = new Database('database.sqlite');
const JWT_SECRET = process.env.JWT_SECRET || 'devground_super_secret';
const router = Router();

// SQLite 폴백 테이블 생성 (PostgreSQL DATABASE_URL 미설정 시에도 100% 작동 보장)
sqliteDb.exec(`
  CREATE TABLE IF NOT EXISTS baas_games (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    developerId TEXT NOT NULL,
    apiKey TEXT UNIQUE NOT NULL,
    createdAt TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS baas_builds (
    id TEXT PRIMARY KEY,
    gameId TEXT NOT NULL,
    version TEXT NOT NULL,
    platform TEXT NOT NULL,
    artifactUrl TEXT NOT NULL,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS baas_leaderboards (
    id TEXT PRIMARY KEY,
    gameId TEXT NOT NULL,
    userId TEXT NOT NULL,
    username TEXT NOT NULL,
    score REAL NOT NULL,
    metadata TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS baas_feedbacks (
    id TEXT PRIMARY KEY,
    gameId TEXT NOT NULL,
    buildVer TEXT NOT NULL,
    type TEXT DEFAULT 'BUG',
    message TEXT NOT NULL,
    screenshot TEXT,
    deviceInfo TEXT,
    position TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  );
`);

// 기본 샘플 BaaS 게임 & 리더보드/피드백 시드 데이터
try {
  const cnt = (sqliteDb.prepare('SELECT COUNT(*) as c FROM baas_games').get() as any).c;
  if (cnt === 0) {
    const sampleGameId = 'game_shadow_dungeon_01';
    const sampleKey = 'pl_live_shadow_dungeon_demo_key_2026';
    sqliteDb.prepare('INSERT INTO baas_games (id, title, slug, developerId, apiKey) VALUES (?, ?, ?, ?, ?)')
      .run(sampleGameId, 'Shadow Dungeon: Roguelike', 'shadow-dungeon', '1', sampleKey);
    sqliteDb.prepare('INSERT INTO baas_leaderboards (id, gameId, userId, username, score, metadata) VALUES (?, ?, ?, ?, ?, ?)')
      .run('lb_1', sampleGameId, 'u_1', 'PixelKnight', 18450, JSON.stringify({ stage: 'Abyss Floor 12', weapon: 'Obsidian Blade' }));
    sqliteDb.prepare('INSERT INTO baas_leaderboards (id, gameId, userId, username, score, metadata) VALUES (?, ?, ?, ?, ?, ?)')
      .run('lb_2', sampleGameId, 'u_2', 'GodotCrafter', 15200, JSON.stringify({ stage: 'Abyss Floor 10', weapon: 'Twin Daggers' }));
    sqliteDb.prepare('INSERT INTO baas_leaderboards (id, gameId, userId, username, score, metadata) VALUES (?, ?, ?, ?, ?, ?)')
      .run('lb_3', sampleGameId, 'u_3', 'ShaderWizard', 12900, JSON.stringify({ stage: 'Abyss Floor 8', weapon: 'Arcane Staff' }));
    sqliteDb.prepare('INSERT INTO baas_feedbacks (id, gameId, buildVer, type, message, deviceInfo, position) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run('fb_1', sampleGameId, 'v0.3.2', 'BUG', '2페이즈 보스 돌진 패턴에서 벽 모서리에 끼이는 현상이 있습니다.', 'Windows 11 / RTX 3060 / 60FPS', '(14.2, -3.5, 0)');
    sqliteDb.prepare('INSERT INTO baas_feedbacks (id, gameId, buildVer, type, message, deviceInfo, position) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run('fb_2', sampleGameId, 'v0.3.2', 'SUGGESTION', '패링 성공 시 히트스톱이 아주 찰집니다! 대시 쿨타임 표시기가 캐릭터 머리 위에도 있으면 좋겠어요.', 'WebGL Chrome 128', '(2.0, 1.1, 0)');
  }
} catch {}

const usePg = Boolean(process.env.DATABASE_URL);
const genId = (prefix: string) => `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
const genApiKey = () => `pl_live_${crypto.randomBytes(12).toString('hex')}`;

const wrap = (fn: (req: any, res: Response) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

// ── 인증 ──────────────────────────────────────────────
function devAuth(req: any, res: Response, next: NextFunction) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

async function apiKeyAuth(req: any, res: Response, next: NextFunction) {
  const key = req.headers['x-api-key'];
  if (typeof key !== 'string') return res.status(401).json({ error: 'X-API-Key required' });
  if (usePg) {
    const game = await prisma.game.findUnique({ where: { apiKey: key } });
    if (!game) return res.status(403).json({ error: 'Invalid API key' });
    req.game = game;
    return next();
  }
  const game = sqliteDb.prepare('SELECT * FROM baas_games WHERE apiKey = ?').get(key) as any;
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
  const finalSlug = slug ? slugify(slug) : `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;
  if (usePg) {
    try {
      const game = await prisma.game.create({
        data: { title, slug: finalSlug, developerId: String(req.user.id) },
      });
      return res.status(201).json(game);
    } catch (e: any) {
      if (e.code === 'P2002') return res.status(409).json({ error: 'slug already exists' });
      throw e;
    }
  }
  const id = genId('game');
  const apiKey = genApiKey();
  sqliteDb.prepare('INSERT INTO baas_games (id, title, slug, developerId, apiKey) VALUES (?, ?, ?, ?, ?)')
    .run(id, String(title).trim(), finalSlug, String(req.user.id), apiKey);
  const created = sqliteDb.prepare('SELECT * FROM baas_games WHERE id = ?').get(id);
  res.status(201).json(created);
}));

router.get('/games/mine', devAuth, wrap(async (req, res) => {
  if (usePg) {
    return res.json(await prisma.game.findMany({
      where: { developerId: String(req.user.id) },
      orderBy: { createdAt: 'desc' },
    }));
  }
  const mine = sqliteDb.prepare('SELECT * FROM baas_games WHERE developerId = ? OR id = ? ORDER BY createdAt DESC')
    .all(String(req.user.id), 'game_shadow_dungeon_01');
  res.json(mine);
}));

router.get('/games/demo', wrap(async (_req, res) => {
  const games = sqliteDb.prepare('SELECT * FROM baas_games ORDER BY createdAt DESC LIMIT 10').all();
  res.json(games);
}));

async function ownGame(req: any, res: Response) {
  if (usePg) {
    const game = await prisma.game.findUnique({ where: { id: req.params.gameId } });
    if (!game) { res.status(404).json({ error: 'Game not found' }); return null; }
    if (game.developerId !== String(req.user.id)) { res.status(403).json({ error: 'Forbidden' }); return null; }
    return game;
  }
  const game = sqliteDb.prepare('SELECT * FROM baas_games WHERE id = ?').get(req.params.gameId) as any;
  if (!game) { res.status(404).json({ error: 'Game not found' }); return null; }
  return game;
}

router.post('/games/:gameId/builds', devAuth, wrap(async (req, res) => {
  const game = await ownGame(req, res); if (!game) return;
  const { version, platform, artifactUrl } = req.body || {};
  if (!version || !platform || !artifactUrl)
    return res.status(400).json({ error: 'version, platform, artifactUrl required' });
  if (usePg) {
    const [, build] = await prisma.$transaction([
      prisma.build.updateMany({ where: { gameId: game.id, platform }, data: { isActive: false } }),
      prisma.build.create({ data: { gameId: game.id, version, platform, artifactUrl } }),
    ]);
    return res.status(201).json(build);
  }
  const id = genId('bld');
  sqliteDb.prepare('UPDATE baas_builds SET isActive = 0 WHERE gameId = ? AND platform = ?').run(game.id, platform);
  sqliteDb.prepare('INSERT INTO baas_builds (id, gameId, version, platform, artifactUrl, isActive) VALUES (?, ?, ?, ?, ?, 1)')
    .run(id, game.id, version, platform, artifactUrl);
  res.status(201).json(sqliteDb.prepare('SELECT * FROM baas_builds WHERE id = ?').get(id));
}));

router.get('/games/:gameId/feedbacks', wrap(async (req, res) => {
  const gameId = req.params.gameId;
  const type = req.query.type as string | undefined;
  if (usePg) {
    return res.json(await prisma.playtestFeedback.findMany({
      where: { gameId, ...(type ? { type } : {}) },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(req.query.limit) || 100, 500),
    }));
  }
  const rows = type
    ? sqliteDb.prepare('SELECT * FROM baas_feedbacks WHERE gameId = ? AND type = ? ORDER BY createdAt DESC LIMIT 100').all(gameId, type)
    : sqliteDb.prepare('SELECT * FROM baas_feedbacks WHERE gameId = ? ORDER BY createdAt DESC LIMIT 100').all(gameId);
  res.json(rows);
}));

router.get('/games/:gameId/leaderboard', wrap(async (req, res) => {
  const gameId = req.params.gameId;
  if (usePg) {
    const rows = await prisma.leaderboardEntry.findMany({
      where: { gameId },
      orderBy: { score: 'desc' },
      distinct: ['userId'],
      take: 30,
    });
    return res.json(rows.map((r, i) => ({ rank: i + 1, ...r })));
  }
  const rows = sqliteDb.prepare(`
    SELECT id, gameId, userId, username, MAX(score) as score, metadata, MAX(createdAt) as createdAt
    FROM baas_leaderboards
    WHERE gameId = ?
    GROUP BY username
    ORDER BY score DESC
    LIMIT 30
  `).all(gameId) as any[];
  res.json(rows.map((r, i) => ({
    rank: i + 1,
    ...r,
    metadata: r.metadata ? (() => { try { return JSON.parse(r.metadata); } catch { return r.metadata; } })() : null,
  })));
}));

// ── 공개: 웹 런처용 (slug 기반) ────────────────────────
router.get('/public/games/:slug', wrap(async (req, res) => {
  if (usePg) {
    const game = await prisma.game.findUnique({
      where: { slug: req.params.slug },
      select: {
        id: true, title: true, slug: true, createdAt: true,
        builds: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    return res.json(game);
  }
  const game = sqliteDb.prepare('SELECT id, title, slug, createdAt FROM baas_games WHERE slug = ?').get(req.params.slug) as any;
  if (!game) return res.status(404).json({ error: 'Game not found' });
  const builds = sqliteDb.prepare('SELECT * FROM baas_builds WHERE gameId = ? AND isActive = 1 ORDER BY createdAt DESC').all(game.id);
  res.json({ ...game, builds });
}));

// ── 게임 클라이언트용 (API Key) ────────────────────────
router.post('/leaderboard', apiKeyAuth, wrap(async (req, res) => {
  const { userId, username, score, metadata } = req.body || {};
  if (!userId || !username || typeof score !== 'number' || !Number.isFinite(score))
    return res.status(400).json({ error: 'userId, username, numeric score required' });
  if (usePg) {
    const entry = await prisma.leaderboardEntry.create({
      data: { gameId: req.game.id, userId: String(userId), username: String(username).slice(0, 32), score, metadata },
    });
    return res.status(201).json(entry);
  }
  const id = genId('lb');
  sqliteDb.prepare('INSERT INTO baas_leaderboards (id, gameId, userId, username, score, metadata) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, req.game.id, String(userId), String(username).slice(0, 32), Number(score), metadata ? JSON.stringify(metadata) : null);
  res.status(201).json({ id, gameId: req.game.id, userId, username, score, metadata });
}));

router.get('/leaderboard', apiKeyAuth, wrap(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  if (usePg) {
    const rows = await prisma.leaderboardEntry.findMany({
      where: { gameId: req.game.id },
      orderBy: { score: 'desc' },
      distinct: ['userId'],
      take: limit,
    });
    return res.json(rows.map((r, i) => ({ rank: i + 1, ...r })));
  }
  const rows = sqliteDb.prepare(`
    SELECT id, gameId, userId, username, MAX(score) as score, metadata, MAX(createdAt) as createdAt
    FROM baas_leaderboards
    WHERE gameId = ?
    GROUP BY username
    ORDER BY score DESC
    LIMIT ?
  `).all(req.game.id, limit) as any[];
  res.json(rows.map((r, i) => ({ rank: i + 1, ...r })));
}));

router.post('/feedback', apiKeyAuth, wrap(async (req, res) => {
  const { buildVer, type, message, screenshot, deviceInfo, position } = req.body || {};
  if (!buildVer || !message || !deviceInfo)
    return res.status(400).json({ error: 'buildVer, message, deviceInfo required' });
  const t = String(type || 'BUG').toUpperCase();
  if (!['BUG', 'SUGGESTION', 'REVIEW'].includes(t))
    return res.status(400).json({ error: 'type must be BUG | SUGGESTION | REVIEW' });
  if (usePg) {
    const fb = await prisma.playtestFeedback.create({
      data: { gameId: req.game.id, buildVer, type: t, message, screenshot, deviceInfo, position },
    });
    return res.status(201).json({ id: fb.id });
  }
  const id = genId('fb');
  sqliteDb.prepare('INSERT INTO baas_feedbacks (id, gameId, buildVer, type, message, screenshot, deviceInfo, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, req.game.id, String(buildVer), t, String(message), screenshot || null, String(deviceInfo), position ? String(position) : null);
  res.status(201).json({ id });
}));

router.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[baas]', err);
  res.status(500).json({ error: 'Internal error' });
});

export default router;


