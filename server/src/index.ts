import express from 'express';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'devground_super_secret';

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

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    devlog_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (devlog_id) REFERENCES devlogs(id),
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
app.get('/api/devlogs', (req, res) => {
  const stmt = db.prepare(`
    SELECT d.*, u.username as author 
    FROM devlogs d 
    LEFT JOIN users u ON d.user_id = u.id 
    ORDER BY d.id DESC
  `);
  const logs = stmt.all().map((log: any) => ({
    ...log,
    id: log.id.toString(),
    tags: log.tags ? JSON.parse(log.tags) : []
  }));
  res.json(logs);
});

app.get('/api/devlogs/:id', (req, res) => {
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

app.get('/api/auth/kakao/callback', async (req: any, res: any) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('No code provided');

  try {
    // 1. Exchange code for Kakao access token
    const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: '3561b2d56ccfedbef1d54c2172b29aa5',
        redirect_uri: 'http://192.168.0.5:3000/api/auth/kakao/callback',
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
    const returnUrl = req.query.state || 'exp://192.168.0.5:8081/--/login';
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
