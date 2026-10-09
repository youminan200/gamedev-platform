import express from 'express';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import axios from 'axios';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'devground_super_secret';

app.use(cors());
app.use(express.json());

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
    SELECT d.*, u.username as author 
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
      is_liked: isLiked
    };
  });
  res.json(logs);
});

app.get('/api/devlogs/:id', optionalAuthenticateToken, (req: any, res: any) => {
  const devlogId = req.params.id;
  const stmt = db.prepare(`
    SELECT d.*, u.username as author 
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
  const { title, content, tags } = req.body;
  const userId = req.user.id;
  const stmt = db.prepare('INSERT INTO devlogs (user_id, title, content, tags) VALUES (?, ?, ?, ?)');
  const tagsString = JSON.stringify(tags || []);
  const info = stmt.run(userId, title || 'Untitled', content || '', tagsString);
  
  res.status(201).json({
    id: info.lastInsertRowid.toString(),
    title: title || 'Untitled',
    content: content || '',
    author: req.user.username,
    likes: 0,
    tags: tags || []
  });
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

  res.status(201).json({
    id: info.lastInsertRowid.toString(),
    devlog_id: devlogId,
    content,
    author: req.user.username,
    created_at: new Date().toISOString()
  });
});

// Asset Hub Routes
app.get('/api/assets', (req, res) => {
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
    avg_rating: asset.avg_rating ? Math.round(asset.avg_rating * 10) / 10 : 0
  }));

  res.json(assets);
});

app.get('/api/assets/:id', (req, res) => {
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
  const { title, description, category, file_url, tags } = req.body;
  const userId = req.user.id;

  if (!title) return res.status(400).json({ error: 'Title is required' });

  const stmt = db.prepare('INSERT INTO assets (user_id, title, description, category, file_url, tags) VALUES (?, ?, ?, ?, ?, ?)');
  const info = stmt.run(userId, title, description || '', category || '2D', file_url || '', JSON.stringify(tags || []));

  res.status(201).json({
    id: info.lastInsertRowid.toString(),
    title,
    description: description || '',
    category: category || '2D',
    file_url: file_url || '',
    author: req.user.username,
    tags: tags || [],
    likes: 0,
    avg_rating: 0,
    feedback_count: 0
  });
});

app.post('/api/assets/:id/feedbacks', authenticateToken, (req: any, res: any) => {
  const assetId = req.params.id;
  const { rating, feedback_type, content } = req.body;
  const userId = req.user.id;

  if (!content) return res.status(400).json({ error: 'Feedback content is required' });

  const stmt = db.prepare('INSERT INTO asset_feedbacks (asset_id, user_id, rating, feedback_type, content) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(assetId, userId, rating || 5, feedback_type || 'General', content);

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

  const recentDevlogsStmt = db.prepare('SELECT id, title, likes, created_at FROM devlogs WHERE user_id = ? ORDER BY id DESC LIMIT 5');
  const recentDevlogs = recentDevlogsStmt.all(user.id).map((d: any) => ({
    ...d,
    id: d.id.toString()
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
    recent_devlogs: recentDevlogs
  });
});

app.get('/api/auth/kakao/callback', async (req: any, res: any) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('No code provided');

  try {
    // 1. Exchange code for Kakao access token
    const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: '3561b2d56ccfedbef1d54c2172b29aa5',
        redirect_uri: 'http://172.16.11.203:3001/api/auth/kakao/callback',
        code,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    });

    const accessToken = tokenResponse.data.access_token;

    // 2. Fetch Kakao user info
    const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const { id } = userResponse.data;
    const providerId = id.toString();
    const username = `kakao_${providerId}`;

    // 3. Create or get user
    let stmt = db.prepare('SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_id = ?');
    let oauthAccount: any = stmt.get('kakao', providerId);
    let userId;

    if (!oauthAccount) {
      const insertUser = db.prepare('INSERT INTO users (username, email) VALUES (?, ?)');
      const userInfo = insertUser.run(username, `kakao_${providerId}@devground.local`);
      userId = userInfo.lastInsertRowid;

      const insertOauth = db.prepare('INSERT INTO oauth_accounts (user_id, provider, provider_id, access_token) VALUES (?, ?, ?, ?)');
      insertOauth.run(userId, 'kakao', providerId, accessToken);
    } else {
      userId = oauthAccount.user_id;
      const updateOauth = db.prepare('UPDATE oauth_accounts SET access_token = ? WHERE user_id = ? AND provider = ?');
      updateOauth.run(accessToken, userId, 'kakao');
    }

    // 4. Generate JWT
    const jwtToken = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '7d' });

    // 5. Redirect back to Expo Go app with token
    const returnUrl = req.query.state || 'exp://172.16.11.203:8081/--/login';
    const separator = returnUrl.includes('?') ? '&' : '?';
    res.redirect(`${returnUrl}${separator}token=${jwtToken}`);
  } catch (error: any) {
    console.error('Kakao callback error:', error.response?.data || error.message);
    res.status(500).send('Kakao authentication failed.');
  }
});

app.listen(port as number, '0.0.0.0', () => {
  console.log(`DevGround API server running at http://0.0.0.0:${port}`);
});
