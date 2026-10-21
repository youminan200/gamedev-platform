import express from 'express';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import axios from 'axios';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'devground_super_secret';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch {}

app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

// Initialize SQLite Database
const db = new Database('database.sqlite', { verbose: console.log });

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    username TEXT UNIQUE NOT NULL,
    password TEXT,
    profile_image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS oauth_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    provider TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(provider, provider_id)
  );

  CREATE TABLE IF NOT EXISTS devlogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    content TEXT,
    likes INTEGER DEFAULT 0,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS devlog_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    devlog_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (devlog_id) REFERENCES devlogs(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(devlog_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    devlog_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (devlog_id) REFERENCES devlogs(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT '2D',
    file_url TEXT,
    tags TEXT,
    likes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS asset_feedbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rating INTEGER DEFAULT 5,
    feedback_type TEXT DEFAULT 'General',
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Schema migration for image_url
try {
  db.exec(`ALTER TABLE devlogs ADD COLUMN image_url TEXT;`);
} catch {}
try {
  db.exec(`ALTER TABLE assets ADD COLUMN image_url TEXT;`);
} catch {}

db.exec(`
  CREATE TABLE IF NOT EXISTS asset_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(asset_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    ref_type TEXT,
    ref_id INTEGER,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const createNotification = (userId: any, actorId: any, type: string, message: string, refType: string, refId: any) => {
  if (!userId || Number(userId) === Number(actorId)) return;
  try {
    db.prepare('INSERT INTO notifications (user_id, type, message, ref_type, ref_id) VALUES (?, ?, ?, ?, ?)')
      .run(userId, type, message, refType, Number(refId));
  } catch (e) {
    console.error('notification error', e);
  }
};

// Seed Initial Community Data for Official Launch
const initializeSeedData = () => {
  try {
    db.prepare(`DELETE FROM devlogs WHERE title = '하' AND content = '하'`).run();

    const ensureUser = (username: string, email: string): number => {
      const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as any;
      if (existing) return existing.id;
      const res = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, 'devground_seed');
      return Number(res.lastInsertRowid);
    };

    const devlogCount = (db.prepare('SELECT COUNT(*) as count FROM devlogs').get() as any).count;
    if (devlogCount === 0) {
      const u1 = ensureUser('PixelKnight', 'pixel@devground.io');
      const u2 = ensureUser('ShaderWizard', 'shader@devground.io');
      const u3 = ensureUser('IndieSoundLab', 'sound@devground.io');
      const u4 = ensureUser('GodotCrafter', 'godot@devground.io');

      const insertDevlog = db.prepare(
        'INSERT INTO devlogs (user_id, title, content, likes, tags, image_url) VALUES (?, ?, ?, ?, ?, ?)'
      );

      const d1 = insertDevlog.run(
        u1,
        '[DevLog #12] 2D 로그라이크 던전 보스 패턴 & 타격감 개선기',
        '이번 주에는 보스 페이즈 전환 시 카메라 쉐이크(Camera Shake)와 히트스톱(Hit-stop) 프레임을 0.06초로 조정해 타격감을 대폭 끌어올렸습니다.\n\n특히 패링 성공 시 파티클 이펙트와 사운드 싱크를 맞추니 손맛이 훨씬 좋아졌네요! 모바일 조작감 피드백 환영합니다.',
        24,
        JSON.stringify(['Unity', 'C#', 'Action', 'Roguelike']),
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80'
      );

      const d2 = insertDevlog.run(
        u2,
        '언리얼 엔진 5 카툰 렌더링(Cel Shader) 외곽선 최적화 공유',
        '모바일/저사양 환경에서도 프레임 드랍 없이 깔끔한 애니메이션풍 외곽선을 표현하기 위해 Post-Process 머티리얼 대신 Inverted Hull 방식과 노멀 맵 보정을 결합했습니다.\n\n드로우콜은 늘어나지만 셰이더 복잡도가 낮아져 평균 60FPS 방어에 성공했습니다!',
        19,
        JSON.stringify(['Unreal', 'Graphics', 'Shader']),
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
      );

      const d3 = insertDevlog.run(
        u4,
        'Godot 4.3으로 1인 개발 중인 픽셀 농장 시뮬레이션 첫 공개!',
        '퇴근 후 2시간씩 반년 동안 만든 힐링 농장 시뮬레이션입니다. 타일맵 오토타일링 시스템과 계절별 날씨 변화(비, 눈, 반딧불이)까지 구현 완료했습니다.\n\n다음 주 데모 빌드 배포 전 UI 배치에 대한 의견을 듣고 싶습니다!',
        31,
        JSON.stringify(['Godot', 'PixelArt', 'Release']),
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80'
      );

      const d4 = insertDevlog.run(
        u3,
        '인디 게임에서 무료로 쓸 수 있는 효과음(SFX) 레이어링 팁 3가지',
        '1. 검 베기 소리는 금속성 마찰음 + 짧은 바람 소리(White Noise Fade)를 겹치면 묵직해집니다.\n2. UI 버튼 클릭음은 피치(Pitch)를 ±5% 랜덤화하면 반복 피로도가 확 줄어듭니다.\n3. Asset Hub에 제가 직접 만든 8비트 효과음 팩도 공유해 두었으니 자유롭게 쓰세요!',
        15,
        JSON.stringify(['Audio', 'Tip', 'IndieDev']),
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'
      );

      const insertComment = db.prepare(
        'INSERT INTO comments (devlog_id, user_id, content) VALUES (?, ?, ?)'
      );
      insertComment.run(d1.lastInsertRowid, u2, '히트스톱 0.06초 디테일 너무 좋네요! 기대됩니다 🔥');
      insertComment.run(d1.lastInsertRowid, u4, '패링 타이밍 판정 프레임은 몇 프레임 정도로 잡으셨나요?');
      insertComment.run(d3.lastInsertRowid, u1, '색감이 진짜 따뜻하네요. 데모 나오면 꼭 플레이해보겠습니다!');
    } else {
      // Backfill sample thumbnails for existing seed posts if image_url is null
      db.prepare(`UPDATE devlogs SET image_url = ? WHERE title LIKE '[DevLog #12]%' AND (image_url IS NULL OR image_url = '')`).run('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80');
      db.prepare(`UPDATE devlogs SET image_url = ? WHERE title LIKE '언리얼 엔진 5%' AND (image_url IS NULL OR image_url = '')`).run('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80');
      db.prepare(`UPDATE devlogs SET image_url = ? WHERE title LIKE 'Godot 4.3%' AND (image_url IS NULL OR image_url = '')`).run('https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80');
      db.prepare(`UPDATE devlogs SET image_url = ? WHERE title LIKE '인디 게임에서 무료로%' AND (image_url IS NULL OR image_url = '')`).run('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80');
    }

    const assetCount = (db.prepare('SELECT COUNT(*) as count FROM assets').get() as any).count;
    if (assetCount === 0) {
      const u1 = ensureUser('PixelKnight', 'pixel@devground.io');
      const u2 = ensureUser('ShaderWizard', 'shader@devground.io');
      const u3 = ensureUser('IndieSoundLab', 'sound@devground.io');
      const u4 = ensureUser('GodotCrafter', 'godot@devground.io');

      const insertAsset = db.prepare(
        'INSERT INTO assets (user_id, title, description, category, file_url, tags, likes, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      );

      insertAsset.run(
        u1,
        '16x16 다크 판타지 던전 타일셋 & 캐릭터 스프라이트 팩',
        '벽면, 바닥, 함정, 보물상자 및 기본 기사 캐릭터 4방향 애니메이션이 포함된 픽셀아트 에셋 팩입니다. 상업/비상업 프로젝트 모두 무료 사용 가능합니다.',
        '2D',
        'https://gamedev-platform-expo-client.vercel.app',
        JSON.stringify(['2D', 'PixelArt', 'Tileset']),
        28,
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80'
      );

      insertAsset.run(
        u2,
        '로우폴리(Low-Poly) 판타지 무기 & 포션 3D 모델 20종 (FBX)',
        '모바일 RPG에 최적화된 평균 300 폴리곤 이하의 검, 방패, 지팡이, 포션 3D 에셋 모음입니다. 단일 컬러 팔레트 텍스처를 사용해 배칭 효율이 뛰어납니다.',
        '3D',
        'https://gamedev-platform-expo-client.vercel.app',
        JSON.stringify(['3D', 'LowPoly', 'RPG']),
        22,
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
      );

      insertAsset.run(
        u3,
        '레트로 8비트 & 신스웨이브 BGM / 효과음 스타터 팩 (WAV/OGG)',
        '타이틀 화면, 보스전 루프 BGM 4곡과 점프/공격/코인/클릭 효과음 30종이 포함된 오디오 팩입니다. 끊김 없는 루프(Seamless Loop) 처리가 완료되어 있습니다.',
        'Audio',
        'https://gamedev-platform-expo-client.vercel.app',
        JSON.stringify(['Audio', 'BGM', 'SFX']),
        35,
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'
      );

      insertAsset.run(
        u4,
        '모바일 게임용 뉴모피즘 & 픽셀 UI 프레임 키트 (PNG/SVG)',
        '체력바, 인벤토리 슬롯, 대화창, 스킬 쿨타임 아이콘 등 모바일 화면 비율에 맞춘 고해상도 UI 컴포넌트 세트입니다.',
        'UI',
        'https://gamedev-platform-expo-client.vercel.app',
        JSON.stringify(['UI', 'HUD', 'Mobile']),
        17,
        'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?auto=format&fit=crop&w=800&q=80'
      );

      insertAsset.run(
        u1,
        'Unity 2D 플랫포머 코요테 타임 & 점프 버퍼 컨트롤러 스크립트',
        '셀레스트(Celeste) 스타일의 쫀득한 점프 조작감을 구현하는 C# 캐릭터 컨트롤러입니다. 코요테 타임, 점프 버퍼링, 대시 잔상 로직이 포함되어 있습니다.',
        'Code',
        'https://gamedev-platform-expo-client.vercel.app',
        JSON.stringify(['Code', 'Unity', 'C#']),
        41,
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80'
      );
    }
  } catch (err) {
    console.error('Seed data initialization error:', err);
  }
};

initializeSeedData();

app.get('/', (_req, res) => {
  res.json({
    status: 'online',
    service: 'DevGround Official API',
    web_url: 'https://gamedev-platform-expo-client.vercel.app',
    admin_dashboard: 'https://gamedev-platform.onrender.com/admin',
    endpoints: ['/api/stats', '/api/devlogs', '/api/assets']
  });
});

app.get('/api/stats', (_req, res) => {
  const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  const totalDevlogs = (db.prepare('SELECT COUNT(*) as count FROM devlogs').get() as any).count;
  const totalAssets = (db.prepare('SELECT COUNT(*) as count FROM assets').get() as any).count;
  const totalComments = (db.prepare('SELECT COUNT(*) as count FROM comments').get() as any).count;

  const users = db.prepare(`
    SELECT u.id, u.username, u.email, u.created_at,
      o.provider as login_type,
      (SELECT COUNT(*) FROM devlogs d WHERE d.user_id = u.id) as devlog_count,
      (SELECT COUNT(*) FROM assets a WHERE a.user_id = u.id) as asset_count
    FROM users u
    LEFT JOIN oauth_accounts o ON o.user_id = u.id
    ORDER BY u.id DESC
  `).all();

  res.json({
    summary: {
      total_users: totalUsers,
      total_devlogs: totalDevlogs,
      total_assets: totalAssets,
      total_comments: totalComments,
    },
    users,
  });
});

db.exec(`
  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

const getSetting = (key: string, fallback = ''): string => {
  const row = db.prepare('SELECT value FROM site_settings WHERE key = ?').get(key) as any;
  return row ? String(row.value) : fallback;
};

const setSetting = (key: string, value: string) => {
  db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)').run(key, value);
};

app.get('/api/system-status', (_req, res) => {
  const maintenance = getSetting('maintenance_mode', '0') === '1';
  const message = getSetting('maintenance_message', '🚧 현재 서버 점검 및 업데이트가 진행 중입니다. 잠시 후 다시 접속해 주세요.');
  res.json({ maintenance, message });
});

app.post('/admin/maintenance', express.urlencoded({ extended: true }), (req, res) => {
  const mode = req.body?.mode === '1' ? '1' : '0';
  const message = (req.body?.message || '🚧 현재 서버 점검 및 업데이트가 진행 중입니다. 잠시 후 다시 접속해 주세요.').trim();
  setSetting('maintenance_mode', mode);
  setSetting('maintenance_message', message);
  res.redirect('/admin');
});

app.get('/admin/backup.sqlite', (_req, res) => {
  res.download('database.sqlite', 'database.sqlite');
});

app.get('/admin', (_req, res) => {
  const totalDevlogs = (db.prepare('SELECT COUNT(*) as count FROM devlogs').get() as any).count;
  const totalAssets = (db.prepare('SELECT COUNT(*) as count FROM assets').get() as any).count;
  const totalComments = (db.prepare('SELECT COUNT(*) as count FROM comments').get() as any).count;
  const isMaintenance = getSetting('maintenance_mode', '0') === '1';
  const maintenanceMsg = getSetting('maintenance_message', '🚧 현재 서버 점검 및 업데이트가 진행 중입니다. 잠시 후 다시 접속해 주세요.');

  const users = db.prepare(`
    SELECT u.id, u.username, u.email, u.created_at, u.password,
      COALESCE(o.provider, CASE WHEN u.password = 'devground_seed' THEN 'sample' ELSE 'local' END) as login_type,
      (SELECT COUNT(*) FROM devlogs d WHERE d.user_id = u.id) as devlog_count,
      (SELECT COUNT(*) FROM assets a WHERE a.user_id = u.id) as asset_count
    FROM users u
    LEFT JOIN oauth_accounts o ON o.user_id = u.id
    ORDER BY u.id DESC
  `).all() as any[];

  const realUsersCount = users.filter(u => u.login_type !== 'sample').length;

  const rowsHtml = users.map(u => `
    <tr>
      <td>#${u.id}</td>
      <td><strong>${u.username}</strong></td>
      <td><span class="badge ${u.login_type}">${u.login_type === 'sample' ? 'SAMPLE (예시)' : u.login_type.toUpperCase()}</span></td>
      <td>${u.devlog_count}개</td>
      <td>${u.asset_count}개</td>
      <td>${u.created_at || '-'}</td>
    </tr>
  `).join('');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DevGround 관리자 대시보드 (이용자 현황 & 서버 관리)</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 32px; }
    .container { max-width: 960px; margin: 0 auto; }
    .top-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 8px; }
    h1 { font-size: 26px; margin: 0; }
    .sub { color: #94a3b8; margin-bottom: 24px; font-size: 14px; }
    .btn { background: #38bdf8; color: #0f172a; padding: 10px 16px; border-radius: 10px; font-weight: 800; font-size: 13px; text-decoration: none; border: none; cursor: pointer; display: inline-block; }
    .btn-danger { background: #ef4444; color: #fff; }
    .btn-success { background: #10b981; color: #0f172a; }
    .btn-outline { background: #1e293b; color: #f8fafc; border: 1px solid #334155; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 14px; padding: 20px; }
    .card-label { color: #94a3b8; font-size: 13px; font-weight: 600; }
    .card-val { font-size: 32px; font-weight: 800; color: #38bdf8; margin-top: 6px; }
    .panel { background: #1e293b; border: 1px solid #334155; border-radius: 14px; padding: 20px; margin-bottom: 24px; }
    .panel h2 { margin-top: 0; font-size: 18px; margin-bottom: 12px; }
    .links-grid { display: flex; flex-wrap: wrap; gap: 10px; }
    .input-text { width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: #f8fafc; font-size: 14px; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 14px; overflow: hidden; border: 1px solid #334155; }
    th, td { padding: 14px 16px; text-align: left; border-bottom: 1px solid #334155; font-size: 14px; }
    th { background: #0f172a; color: #94a3b8; font-weight: 700; }
    .badge { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
    .badge.kakao { background: #FEE500; color: #000; }
    .badge.naver { background: #03C75A; color: #fff; }
    .badge.local { background: #38bdf8; color: #0f172a; }
    .badge.sample { background: #334155; color: #94a3b8; }
    a { color: #38bdf8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="top-row">
      <h1>📊 DevGround 실시간 이용자 현황 & 서버 관리</h1>
      <a class="btn" href="/admin/backup.sqlite">📥 실서버 DB 백업 다운로드 (.sqlite)</a>
    </div>
    <div class="sub">새로고침(F5)하면 실시간 가입자 및 게시글 통계를 확인할 수 있습니다. | <a href="https://gamedev-platform-expo-client.vercel.app" target="_blank">서비스 바로가기 ↗</a></div>

    <div class="panel">
      <h2>🛠️ 홈페이지 점검 모드 (Maintenance Mode) 제어 — 현재 상태: <span style="color:${isMaintenance ? '#ef4444' : '#10b981'}">${isMaintenance ? '🚧 점검 중 (ON)' : '✅ 정상 운영 중 (OFF)'}</span></h2>
      <form method="POST" action="/admin/maintenance">
        <input type="hidden" name="mode" value="${isMaintenance ? '0' : '1'}" />
        <label style="font-size:13px;color:#94a3b8;">점검 시 홈페이지 상단에 표시할 안내 문구:</label>
        <input class="input-text" type="text" name="message" value="${maintenanceMsg.replace(/"/g, '&quot;')}" />
        <button type="submit" class="btn ${isMaintenance ? 'btn-success' : 'btn-danger'}">
          ${isMaintenance ? '✅ 점검 해제하고 정상 운영으로 전환' : '🚧 서버 점검 모드 켜기 (홈페이지에 점검 배너 표시)'}
        </button>
      </form>
    </div>

    <div class="panel">
      <h2>🌐 배포 · 검색엔진(SEO) · 클라우드 통합 관리 바로가기</h2>
      <div class="links-grid">
        <a class="btn btn-outline" href="https://gamedev-platform-expo-client.vercel.app" target="_blank">🌐 공식 웹앱 열기 ↗</a>
        <a class="btn btn-outline" href="https://search.google.com/search-console/inspect?resource_id=https%3A%2F%2Fgamedev-platform-expo-client.vercel.app%2F&id=PfCul0SZcMUaqlf7hVYiIQ&alt_id=Ds96KPGXgnE7o9nFk7hFyw" target="_blank">🔍 Google Search Console (색인/URL 검사) ↗</a>
        <a class="btn btn-outline" href="https://dashboard.render.com/web/srv-db8argvavr4c73arnk0g" target="_blank">⚡ Render 백엔드 서버 관리 ↗</a>
        <a class="btn btn-outline" href="https://github.com/youminan200/gamedev-platform/actions" target="_blank">🛡️ GitHub 24/7 자동 점검 리포트 ↗</a>
      </div>
    </div>

    <div class="cards">
      <div class="card"><div class="card-label">👥 실제 가입 회원</div><div class="card-val">${realUsersCount}명</div></div>
      <div class="card"><div class="card-label">📜 등록된 개발일지</div><div class="card-val">${totalDevlogs}개</div></div>
      <div class="card"><div class="card-label">🎨 공유된 에셋</div><div class="card-val">${totalAssets}개</div></div>
      <div class="card"><div class="card-label">💬 전체 피드백 댓글</div><div class="card-val">${totalComments}개</div></div>
    </div>
    <h2>전체 계정 목록 (실제 회원 ${realUsersCount}명 + 예시 계정 ${users.length - realUsersCount}명)</h2>
    <table>
      <thead>
        <tr><th>ID</th><th>닉네임(아이디)</th><th>구분</th><th>작성 개발일지</th><th>등록 에셋</th><th>가입 일시(UTC)</th></tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </div>
</body>
</html>`);
});

// Middleware
export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.status(401).json({ error: 'Token required' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

export const optionalAuthenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (!err) req.user = user;
      next();
    });
  } else {
    next();
  }
};

const generateToken = (user: any) => {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
};

// Authentication Routes (Local)
app.post('/api/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    const info = stmt.run(username, password);
    const token = generateToken({ id: info.lastInsertRowid, username });
    res.status(201).json({ user: { id: info.lastInsertRowid, username }, token });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const stmt = db.prepare('SELECT id, username FROM users WHERE username = ? AND password = ?');
  const user = stmt.get(username, password);

  if (user) {
    const token = generateToken(user);
    res.status(200).json({ message: 'Login successful', user, token });
  } else {
    res.status(401).json({ error: 'Invalid username or password' });
  }
});

// Social Login Routes
app.post('/api/auth/kakao', async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ error: 'Access token is required' });

  try {
    // 1. Get user info from Kakao
    const response = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const { id, kakao_account } = response.data;
    const providerId = id.toString();
    const email = kakao_account?.email || `kakao_${providerId}@devground.local`;
    const username = `kakao_${providerId}`;

    // 2. Find or Create User
    let stmt = db.prepare('SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_id = ?');
    let oauthAccount: any = stmt.get('kakao', providerId);
    let userId: any;

    if (!oauthAccount) {
      const insertUser = db.prepare('INSERT INTO users (username, email) VALUES (?, ?)');
      const userInfo = insertUser.run(username, email);
      userId = userInfo.lastInsertRowid;

      const insertOauth = db.prepare('INSERT INTO oauth_accounts (user_id, provider, provider_id, access_token) VALUES (?, ?, ?, ?)');
      insertOauth.run(userId, 'kakao', providerId, accessToken);
    } else {
      userId = oauthAccount.user_id;
    }

    const token = generateToken({ id: userId, username });
    res.status(200).json({ message: 'Kakao login successful', token });
  } catch (error) {
    res.status(401).json({ error: 'Invalid Kakao token' });
  }
});

app.post('/api/auth/naver', async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ error: 'Access token is required' });
  
  try {
    const response = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const { id, email } = response.data.response;
    const providerId = id.toString();
    const username = `naver_${providerId}`;

    let stmt = db.prepare('SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_id = ?');
    let oauthAccount: any = stmt.get('naver', providerId);
    let userId: any;

    if (!oauthAccount) {
      const insertUser = db.prepare('INSERT INTO users (username, email) VALUES (?, ?)');
      const userInfo = insertUser.run(username, email || `naver_${providerId}@devground.local`);
      userId = userInfo.lastInsertRowid;

      const insertOauth = db.prepare('INSERT INTO oauth_accounts (user_id, provider, provider_id, access_token) VALUES (?, ?, ?, ?)');
      insertOauth.run(userId, 'naver', providerId, accessToken);
    } else {
      userId = oauthAccount.user_id;
    }

    const token = generateToken({ id: userId, username });
    res.status(200).json({ message: 'Naver login successful', token });
  } catch (error) {
    res.status(401).json({ error: 'Invalid Naver token' });
  }
});

app.post('/api/auth/apple', (req, res) => {
  // Apple ID token verification requires decoding the JWT from Apple and verifying signature.
  // Using 'apple-auth' or 'jsonwebtoken' with Apple's JWKS.
  res.status(501).json({ message: 'Apple login not implemented yet. Needs ID token verification.' });
});

app.post('/api/auth/facebook', (req, res) => {
  // Facebook requires a GET to graph API: /me?access_token=...
  res.status(501).json({ message: 'Facebook login not implemented yet.' });
});

// DevLogs Routes
app.get('/api/devlogs', optionalAuthenticateToken, (req: any, res: any) => {
  const { search, tag } = req.query;
  let query = `
    SELECT d.*, u.username as author,
      (SELECT COUNT(*) FROM comments c WHERE c.devlog_id = d.id) as comment_count
    FROM devlogs d 
    LEFT JOIN users u ON d.user_id = u.id 
    WHERE 1=1
  `;
  const params: any[] = [];

  if (search) {
    query += ` AND (d.title LIKE ? OR d.content LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (tag) {
    query += ` AND d.tags LIKE ?`;
    params.push(`%"${tag}"%`);
  }

  query += ` ORDER BY d.id DESC`;

  const stmt = db.prepare(query);
  const logs = stmt.all(...params).map((log: any) => {
    let isLiked = false;
    if (req.user) {
      const likeStmt = db.prepare('SELECT 1 FROM devlog_likes WHERE devlog_id = ? AND user_id = ?');
      isLiked = !!likeStmt.get(log.id, req.user.id);
    }
    return {
      ...log,
      id: log.id.toString(),
      tags: log.tags ? JSON.parse(log.tags) : [],
      comment_count: log.comment_count || 0,
      is_liked: isLiked
    };
  });
  res.json(logs);
});

app.get('/api/devlogs/:id', optionalAuthenticateToken, (req: any, res: any) => {
  const devlogId = req.params.id;
  const stmt = db.prepare(`
    SELECT d.*, u.username as author,
      (SELECT COUNT(*) FROM comments c WHERE c.devlog_id = d.id) as comment_count
    FROM devlogs d 
    LEFT JOIN users u ON d.user_id = u.id 
    WHERE d.id = ?
  `);
  const devlog: any = stmt.get(devlogId);
  if (!devlog) return res.status(404).json({ error: 'DevLog not found' });

  devlog.id = devlog.id.toString();
  devlog.tags = devlog.tags ? JSON.parse(devlog.tags) : [];

  if (req.user) {
    const likeStmt = db.prepare('SELECT 1 FROM devlog_likes WHERE devlog_id = ? AND user_id = ?');
    devlog.is_liked = !!likeStmt.get(devlogId, req.user.id);
  } else {
    devlog.is_liked = false;
  }

  const commentsStmt = db.prepare(`
    SELECT c.*, u.username as author 
    FROM comments c 
    JOIN users u ON c.user_id = u.id 
    WHERE c.devlog_id = ? 
    ORDER BY c.created_at ASC
  `);
  const comments = commentsStmt.all(devlogId).map((c: any) => ({
    ...c,
    id: c.id.toString(),
    devlog_id: c.devlog_id.toString()
  }));

  devlog.comments = comments;
  res.json(devlog);
});

app.post('/api/devlogs', authenticateToken, (req: any, res: any) => {
  const { title, content, tags, image_url } = req.body;
  const userId = req.user.id;
  const stmt = db.prepare('INSERT INTO devlogs (user_id, title, content, tags, image_url) VALUES (?, ?, ?, ?, ?)');
  const tagsString = JSON.stringify(tags || []);
  const info = stmt.run(userId, title || 'Untitled', content || '', tagsString, image_url || null);
  
  res.status(201).json({
    id: info.lastInsertRowid.toString(),
    title: title || 'Untitled',
    content: content || '',
    image_url: image_url || null,
    author: req.user.username,
    likes: 0,
    comment_count: 0,
    tags: tags || []
  });
});

app.put('/api/devlogs/:id', authenticateToken, (req: any, res: any) => {
  const devlogId = req.params.id;
  const { title, content, tags, image_url } = req.body;
  const existing: any = db.prepare('SELECT * FROM devlogs WHERE id = ?').get(devlogId);
  if (!existing) return res.status(404).json({ error: 'DevLog not found' });
  if (Number(existing.user_id) !== Number(req.user.id)) {
    return res.status(403).json({ error: 'Not authorized to edit this DevLog' });
  }

  const updatedTitle = title !== undefined ? title : existing.title;
  const updatedContent = content !== undefined ? content : existing.content;
  const updatedTags = tags !== undefined ? JSON.stringify(tags) : existing.tags;
  const updatedImage = image_url !== undefined ? image_url : existing.image_url;

  db.prepare('UPDATE devlogs SET title = ?, content = ?, tags = ?, image_url = ? WHERE id = ?')
    .run(updatedTitle, updatedContent, updatedTags, updatedImage, devlogId);

  res.json({
    id: String(devlogId),
    title: updatedTitle,
    content: updatedContent,
    image_url: updatedImage,
    tags: tags !== undefined ? tags : (existing.tags ? JSON.parse(existing.tags) : [])
  });
});

app.delete('/api/devlogs/:id', authenticateToken, (req: any, res: any) => {
  const devlogId = req.params.id;
  const existing: any = db.prepare('SELECT * FROM devlogs WHERE id = ?').get(devlogId);
  if (!existing) return res.status(404).json({ error: 'DevLog not found' });
  if (Number(existing.user_id) !== Number(req.user.id)) {
    return res.status(403).json({ error: 'Not authorized to delete this DevLog' });
  }

  db.prepare('DELETE FROM comments WHERE devlog_id = ?').run(devlogId);
  db.prepare('DELETE FROM devlog_likes WHERE devlog_id = ?').run(devlogId);
  db.prepare('DELETE FROM devlogs WHERE id = ?').run(devlogId);
  res.json({ success: true });
});

app.post('/api/devlogs/:id/like', authenticateToken, (req: any, res: any) => {
  const devlogId = req.params.id;
  const userId = req.user.id;

  const devlogStmt = db.prepare('SELECT id, likes FROM devlogs WHERE id = ?');
  const devlog: any = devlogStmt.get(devlogId);
  if (!devlog) return res.status(404).json({ error: 'DevLog not found' });

  const existingStmt = db.prepare('SELECT id FROM devlog_likes WHERE devlog_id = ? AND user_id = ?');
  const existing = existingStmt.get(devlogId, userId);

  let isLiked = false;
  let newLikes = devlog.likes;

  if (existing) {
    db.prepare('DELETE FROM devlog_likes WHERE devlog_id = ? AND user_id = ?').run(devlogId, userId);
    newLikes = Math.max(0, devlog.likes - 1);
    db.prepare('UPDATE devlogs SET likes = ? WHERE id = ?').run(newLikes, devlogId);
    isLiked = false;
  } else {
    db.prepare('INSERT INTO devlog_likes (devlog_id, user_id) VALUES (?, ?)').run(devlogId, userId);
    newLikes = devlog.likes + 1;
    db.prepare('UPDATE devlogs SET likes = ? WHERE id = ?').run(newLikes, devlogId);
    isLiked = true;
  }

  res.json({ liked: isLiked, likes: newLikes });
});

app.post('/api/devlogs/:id/comments', authenticateToken, (req: any, res: any) => {
  const devlogId = req.params.id;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content) return res.status(400).json({ error: 'Content is required' });

  const stmt = db.prepare('INSERT INTO comments (devlog_id, user_id, content) VALUES (?, ?, ?)');
  const info = stmt.run(devlogId, userId, content);

  const targetLog: any = db.prepare('SELECT user_id, title FROM devlogs WHERE id = ?').get(devlogId);
  if (targetLog) {
    createNotification(targetLog.user_id, userId, 'comment', `${req.user.username}님이 "${targetLog.title}"에 댓글을 남겼습니다.`, 'devlog', devlogId);
  }

  res.status(201).json({
    id: info.lastInsertRowid.toString(),
    devlog_id: devlogId,
    content,
    author: req.user.username,
    created_at: new Date().toISOString()
  });
});

app.delete('/api/devlogs/:id/comments/:commentId', authenticateToken, (req: any, res: any) => {
  const { commentId } = req.params;
  const existing: any = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId);
  if (!existing) return res.status(404).json({ error: 'Comment not found' });
  if (Number(existing.user_id) !== Number(req.user.id)) {
    return res.status(403).json({ error: 'Not authorized to delete this comment' });
  }
  db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
  res.json({ success: true });
});

// Asset Hub Routes
app.get('/api/assets', optionalAuthenticateToken, (req: any, res: any) => {
  const { category, search } = req.query;
  let query = `
    SELECT a.*, u.username as author,
      (SELECT AVG(rating) FROM asset_feedbacks WHERE asset_id = a.id) as avg_rating,
      (SELECT COUNT(*) FROM asset_feedbacks WHERE asset_id = a.id) as feedback_count
    FROM assets a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (category) {
    query += ` AND a.category = ?`;
    params.push(category);
  }

  if (search) {
    query += ` AND (a.title LIKE ? OR a.description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY a.id DESC`;

  const stmt = db.prepare(query);
  const assets = stmt.all(...params).map((asset: any) => ({
    ...asset,
    id: asset.id.toString(),
    tags: asset.tags ? JSON.parse(asset.tags) : [],
    is_liked: req.user
      ? !!db.prepare('SELECT 1 FROM asset_likes WHERE asset_id = ? AND user_id = ?').get(asset.id, req.user.id)
      : false,
    avg_rating: asset.avg_rating ? Math.round(asset.avg_rating * 10) / 10 : 0
  }));

  res.json(assets);
});

app.get('/api/assets/:id', optionalAuthenticateToken, (req: any, res: any) => {
  const assetId = req.params.id;
  const stmt = db.prepare(`
    SELECT a.*, u.username as author,
      (SELECT AVG(rating) FROM asset_feedbacks WHERE asset_id = a.id) as avg_rating,
      (SELECT COUNT(*) FROM asset_feedbacks WHERE asset_id = a.id) as feedback_count
    FROM assets a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.id = ?
  `);
  const asset: any = stmt.get(assetId);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  asset.id = asset.id.toString();
  asset.tags = asset.tags ? JSON.parse(asset.tags) : [];
  asset.avg_rating = asset.avg_rating ? Math.round(asset.avg_rating * 10) / 10 : 0;
  asset.is_liked = req.user
    ? !!db.prepare('SELECT 1 FROM asset_likes WHERE asset_id = ? AND user_id = ?').get(assetId, req.user.id)
    : false;

  const feedbackStmt = db.prepare(`
    SELECT f.*, u.username as author
    FROM asset_feedbacks f
    JOIN users u ON f.user_id = u.id
    WHERE f.asset_id = ?
    ORDER BY f.created_at DESC
  `);
  asset.feedbacks = feedbackStmt.all(assetId).map((f: any) => ({
    ...f,
    id: f.id.toString(),
    asset_id: f.asset_id.toString()
  }));

  res.json(asset);
});

app.post('/api/assets', authenticateToken, (req: any, res: any) => {
  const { title, description, category, file_url, image_url, tags } = req.body;
  const userId = req.user.id;

  if (!title) return res.status(400).json({ error: 'Title is required' });

  const stmt = db.prepare('INSERT INTO assets (user_id, title, description, category, file_url, image_url, tags) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(userId, title, description || '', category || '2D', file_url || '', image_url || null, JSON.stringify(tags || []));

  res.status(201).json({
    id: info.lastInsertRowid.toString(),
    title,
    description: description || '',
    category: category || '2D',
    file_url: file_url || '',
    image_url: image_url || null,
    author: req.user.username,
    tags: tags || [],
    likes: 0,
    avg_rating: 0,
    feedback_count: 0
  });
});

app.delete('/api/assets/:id', authenticateToken, (req: any, res: any) => {
  const assetId = req.params.id;
  const existing: any = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId);
  if (!existing) return res.status(404).json({ error: 'Asset not found' });
  if (Number(existing.user_id) !== Number(req.user.id)) {
    return res.status(403).json({ error: 'Not authorized to delete this asset' });
  }

  db.prepare('DELETE FROM asset_feedbacks WHERE asset_id = ?').run(assetId);
  db.prepare('DELETE FROM assets WHERE id = ?').run(assetId);
  res.json({ success: true });
});

app.post('/api/assets/:id/feedbacks', authenticateToken, (req: any, res: any) => {
  const assetId = req.params.id;
  const { rating, feedback_type, content } = req.body;
  const userId = req.user.id;

  if (!content) return res.status(400).json({ error: 'Feedback content is required' });

  const stmt = db.prepare('INSERT INTO asset_feedbacks (asset_id, user_id, rating, feedback_type, content) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(assetId, userId, rating || 5, feedback_type || 'General', content);

  const targetAsset: any = db.prepare('SELECT user_id, title FROM assets WHERE id = ?').get(assetId);
  if (targetAsset) {
    createNotification(targetAsset.user_id, userId, 'feedback', `${req.user.username}님이 에셋 "${targetAsset.title}"에 리뷰를 남겼습니다.`, 'asset', assetId);
  }

  res.status(201).json({
    id: info.lastInsertRowid.toString(),
    asset_id: assetId,
    rating: rating || 5,
    feedback_type: feedback_type || 'General',
    content,
    author: req.user.username,
    created_at: new Date().toISOString()
  });
});

app.put('/api/assets/:id', authenticateToken, (req: any, res: any) => {
  const assetId = req.params.id;
  const { title, description, category, file_url, image_url, tags } = req.body;
  const existing: any = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId);
  if (!existing) return res.status(404).json({ error: 'Asset not found' });
  if (Number(existing.user_id) !== Number(req.user.id)) {
    return res.status(403).json({ error: 'Not authorized to edit this asset' });
  }

  const next = {
    title: title !== undefined ? title : existing.title,
    description: description !== undefined ? description : existing.description,
    category: category !== undefined ? category : existing.category,
    file_url: file_url !== undefined ? file_url : existing.file_url,
    image_url: image_url !== undefined ? image_url : existing.image_url,
    tags: tags !== undefined ? JSON.stringify(tags) : existing.tags,
  };
  db.prepare('UPDATE assets SET title = ?, description = ?, category = ?, file_url = ?, image_url = ?, tags = ? WHERE id = ?')
    .run(next.title, next.description, next.category, next.file_url, next.image_url, next.tags, assetId);

  res.json({ ...next, id: String(assetId), tags: next.tags ? JSON.parse(next.tags) : [] });
});

app.post('/api/assets/:id/like', authenticateToken, (req: any, res: any) => {
  const assetId = req.params.id;
  const userId = req.user.id;
  const asset: any = db.prepare('SELECT id, user_id, title, likes FROM assets WHERE id = ?').get(assetId);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  const existing = db.prepare('SELECT id FROM asset_likes WHERE asset_id = ? AND user_id = ?').get(assetId, userId);
  let liked = false;
  let newLikes = asset.likes || 0;
  if (existing) {
    db.prepare('DELETE FROM asset_likes WHERE asset_id = ? AND user_id = ?').run(assetId, userId);
    newLikes = Math.max(0, newLikes - 1);
  } else {
    db.prepare('INSERT INTO asset_likes (asset_id, user_id) VALUES (?, ?)').run(assetId, userId);
    newLikes += 1;
    liked = true;
    createNotification(asset.user_id, userId, 'like', `${req.user.username}님이 에셋 "${asset.title}"을(를) 좋아합니다.`, 'asset', assetId);
  }
  db.prepare('UPDATE assets SET likes = ? WHERE id = ?').run(newLikes, assetId);
  res.json({ liked, likes: newLikes });
});

// Notifications
app.get('/api/notifications', authenticateToken, (req: any, res: any) => {
  const items = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50').all(req.user.id)
    .map((n: any) => ({ ...n, id: String(n.id), ref_id: n.ref_id != null ? String(n.ref_id) : null, is_read: !!n.is_read }));
  const unread = items.filter((n: any) => !n.is_read).length;
  res.json({ unread, items });
});

app.post('/api/notifications/read', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ success: true });
});

app.post('/api/notifications/:id/read', authenticateToken, (req: any, res: any) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

// Image upload (base64 JSON, max ~5MB). Uses Cloudinary (unsigned preset) when configured, else local disk.
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;

app.post('/api/upload', authenticateToken, async (req: any, res: any) => {
  const { data } = req.body || {};
  if (!data || typeof data !== 'string') return res.status(400).json({ error: 'data is required' });

  const match = data.match(/^data:(image\/(png|jpeg|jpg|gif|webp));base64,(.+)$/);
  if (!match) return res.status(400).json({ error: 'Only png/jpeg/gif/webp images are allowed' });

  const buffer = Buffer.from(match[3], 'base64');
  if (buffer.length > 5 * 1024 * 1024) return res.status(413).json({ error: 'File too large (max 5MB)' });

  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
    try {
      const form = new URLSearchParams({ file: data, upload_preset: CLOUDINARY_UPLOAD_PRESET });
      const cloudRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        form.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, maxBodyLength: Infinity }
      );
      return res.status(201).json({ url: cloudRes.data.secure_url, storage: 'cloudinary' });
    } catch (e: any) {
      console.error('Cloudinary upload failed, falling back to local disk:', e.response?.data || e.message);
    }
  }

  const ext = match[2] === 'jpeg' ? 'jpg' : match[2];
  const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, safeName), buffer);

  const host = req.get('host');
  const rawProto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const protocol = rawProto.split(',')[0].trim();
  res.status(201).json({ url: `${protocol}://${host}/uploads/${safeName}`, storage: 'local' });
});

// User Profile Route
app.get('/api/users/:username', (req, res) => {
  const username = req.params.username;
  const userStmt = db.prepare('SELECT id, username, profile_image, created_at FROM users WHERE username = ?');
  const user: any = userStmt.get(username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const devlogCountStmt = db.prepare('SELECT COUNT(*) as count FROM devlogs WHERE user_id = ?');
  const devlogCount = (devlogCountStmt.get(user.id) as any).count;

  const assetCountStmt = db.prepare('SELECT COUNT(*) as count FROM assets WHERE user_id = ?');
  const assetCount = (assetCountStmt.get(user.id) as any).count;

  const totalLikesStmt = db.prepare('SELECT SUM(likes) as likes FROM devlogs WHERE user_id = ?');
  const totalLikes = (totalLikesStmt.get(user.id) as any).likes || 0;

  const recentDevlogsStmt = db.prepare(`
    SELECT d.id, d.title, d.likes, d.image_url, d.created_at,
      (SELECT COUNT(*) FROM comments c WHERE c.devlog_id = d.id) as comment_count
    FROM devlogs d
    WHERE d.user_id = ?
    ORDER BY d.id DESC
    LIMIT 20
  `);
  const recentDevlogs = recentDevlogsStmt.all(user.id).map((d: any) => ({
    ...d,
    id: d.id.toString()
  }));

  const recentAssetsStmt = db.prepare(`
    SELECT a.id, a.title, a.category, a.likes, a.image_url, a.file_url, a.created_at
    FROM assets a
    WHERE a.user_id = ?
    ORDER BY a.id DESC
    LIMIT 20
  `);
  const recentAssets = recentAssetsStmt.all(user.id).map((a: any) => ({
    ...a,
    id: a.id.toString()
  }));

  res.json({
    user: {
      id: user.id.toString(),
      username: user.username,
      profile_image: user.profile_image,
      created_at: user.created_at
    },
    stats: {
      devlog_count: devlogCount,
      asset_count: assetCount,
      total_likes: totalLikes
    },
    recent_devlogs: recentDevlogs,
    recent_assets: recentAssets
  });
});

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY || '3561b2d56ccfedbef1d54c2172b29aa5';
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET || 'A5nhmU4K7cvzDgapPKvAYYkiLk1WNZ7b';

app.get('/api/auth/kakao/login', (req: any, res: any) => {
  const returnUrl = req.query.state || 'https://gamedev-platform-expo-client.vercel.app';
  const host = req.get('host');
  const rawProto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const protocol = rawProto.split(',')[0].trim();
  const callbackUrl = host?.includes('onrender.com')
    ? 'https://gamedev-platform.onrender.com/api/auth/kakao/callback'
    : `${protocol}://${host}/api/auth/kakao/callback`;

  const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&state=${encodeURIComponent(returnUrl)}`;
  return res.redirect(authUrl);
});

app.get('/api/auth/kakao/callback', async (req: any, res: any) => {
  const code = req.query.code;
  const returnUrl = req.query.state || `https://gamedev-platform-expo-client.vercel.app`;
  if (!code) return res.status(400).send('No code provided');

  try {
    // 1. Exchange code for Kakao access token
    const host = req.get('host');
    const rawProto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    const protocol = rawProto.split(',')[0].trim();
    const dynamicRedirectUri = host?.includes('onrender.com')
      ? 'https://gamedev-platform.onrender.com/api/auth/kakao/callback'
      : `${protocol}://${host}/api/auth/kakao/callback`;

    const formBody = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: KAKAO_REST_API_KEY,
      client_secret: KAKAO_CLIENT_SECRET,
      redirect_uri: dynamicRedirectUri,
      code: String(code),
    }).toString();

    const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', formBody, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    });

    const accessToken = tokenResponse.data.access_token;

    // 2. Fetch Kakao user info
    const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const { id, properties, kakao_account } = userResponse.data;
    const providerId = id.toString();
    const displayName = properties?.nickname || kakao_account?.profile?.nickname || `kakao_${providerId.slice(0, 6)}`;
    const email = kakao_account?.email || `kakao_${providerId}@devground.local`;

    // 3. Create or get user
    let stmt = db.prepare('SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_id = ?');
    let oauthAccount: any = stmt.get('kakao', providerId);
    let userId;
    let username = displayName;

    if (!oauthAccount) {
      const existingUser: any = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
      if (existingUser) {
        username = `${displayName}_${providerId.slice(0, 4)}`;
      }
      const insertUser = db.prepare('INSERT INTO users (username, email) VALUES (?, ?)');
      const userInfo = insertUser.run(username, email);
      userId = userInfo.lastInsertRowid;

      const insertOauth = db.prepare('INSERT OR REPLACE INTO oauth_accounts (user_id, provider, provider_id, access_token) VALUES (?, ?, ?, ?)');
      insertOauth.run(userId, 'kakao', providerId, accessToken);
    } else {
      userId = oauthAccount.user_id;
      const existingUser: any = db.prepare('SELECT username FROM users WHERE id = ?').get(userId);
      if (existingUser?.username) {
        username = existingUser.username;
      }
      const updateOauth = db.prepare('UPDATE oauth_accounts SET access_token = ? WHERE user_id = ? AND provider = ?');
      updateOauth.run(accessToken, userId, 'kakao');
    }

    // 4. Generate JWT
    const jwtToken = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '7d' });

    // 5. Redirect back to app or web with token
    const separator = returnUrl.includes('?') ? '&' : '?';
    res.redirect(`${returnUrl}${separator}token=${jwtToken}&username=${encodeURIComponent(username)}`);
  } catch (error: any) {
    console.error('Kakao callback error:', error.response?.data || error.message);
    res.status(500).send('Kakao authentication failed.');
  }
});

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || 'yF0dOdVNbAfFQitfKcYv';
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || 'VRLVlIVRdE';

app.get('/api/auth/naver/login', (req: any, res: any) => {
  const returnUrl = req.query.state || 'https://gamedev-platform-expo-client.vercel.app';
  const host = req.get('host');
  const rawProto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const protocol = rawProto.split(',')[0].trim();
  const callbackUrl = host?.includes('onrender.com')
    ? 'https://gamedev-platform.onrender.com/api/auth/naver/callback'
    : `${protocol}://${host}/api/auth/naver/callback`;

  const authUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${encodeURIComponent(returnUrl)}`;
  return res.redirect(authUrl);
});

app.get('/api/auth/naver/callback', async (req: any, res: any) => {
  const { code, state } = req.query;
  const returnUrl = state ? decodeURIComponent(String(state)) : 'https://gamedev-platform-expo-client.vercel.app';

  if (!code) {
    return res.redirect(returnUrl);
  }

  try {
    const tokenRes = await axios.get('https://nid.naver.com/oauth2.0/token', {
      params: {
        grant_type: 'authorization_code',
        client_id: NAVER_CLIENT_ID,
        client_secret: NAVER_CLIENT_SECRET,
        code: String(code),
        state: String(state || ''),
      }
    });

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) {
      console.error('Naver token exchange failed:', tokenRes.data);
      return res.redirect(returnUrl);
    }

    const profileRes = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const naverProfile = profileRes.data?.response || {};
    const providerId = String(naverProfile.id);
    const displayName = naverProfile.nickname || naverProfile.name || `naver_${providerId.slice(0, 6)}`;
    const email = naverProfile.email || `naver_${providerId}@devground.local`;

    let oauthAccount: any = db.prepare('SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_id = ?').get('naver', providerId);
    let userId: any;
    let username = displayName;

    if (!oauthAccount) {
      const existingByName: any = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
      if (existingByName) {
        username = `${displayName}_${providerId.slice(0, 4)}`;
      }
      const insertUser = db.prepare('INSERT INTO users (username, email) VALUES (?, ?)');
      const userInfo = insertUser.run(username, email);
      userId = userInfo.lastInsertRowid;

      db.prepare('INSERT OR REPLACE INTO oauth_accounts (user_id, provider, provider_id, access_token) VALUES (?, ?, ?, ?)').run(userId, 'naver', providerId, accessToken);
    } else {
      userId = oauthAccount.user_id;
      const existingUser: any = db.prepare('SELECT username FROM users WHERE id = ?').get(userId);
      if (existingUser?.username) {
        username = existingUser.username;
      }
      db.prepare('UPDATE oauth_accounts SET access_token = ? WHERE user_id = ? AND provider = ?').run(accessToken, userId, 'naver');
    }

    const jwtToken = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '7d' });
    const separator = returnUrl.includes('?') ? '&' : '?';
    res.redirect(`${returnUrl}${separator}token=${jwtToken}&username=${encodeURIComponent(username)}`);
  } catch (error: any) {
    console.error('Naver callback error:', error.response?.data || error.message);
    res.status(500).send('Naver authentication failed.');
  }
});

app.listen(port as number, '0.0.0.0', () => {
  console.log(`DevGround API server running at http://0.0.0.0:${port}`);
});
