const https = require('https');
const fs = require('fs');
const path = require('path');

const BACKUP_URL = 'https://gamedev-platform.onrender.com/admin/backup.sqlite';
const TARGET_PATH = path.resolve(__dirname, 'database.sqlite');

function syncLiveDatabase() {
  return new Promise((resolve) => {
    const req = https.get(BACKUP_URL, { timeout: 10000 }, (res) => {
      if (res.statusCode !== 200) {
        console.log(`[sync-db] Live backup endpoint returned ${res.statusCode}, keeping existing database.sqlite`);
        res.resume();
        return resolve();
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const header = buffer.slice(0, 15).toString('utf8');
        if (header === 'SQLite format 3') {
          fs.writeFileSync(TARGET_PATH, buffer);
          console.log(`[sync-db] Successfully preserved live database.sqlite (${buffer.length} bytes)`);
        } else {
          console.log('[sync-db] Downloaded content is not a valid SQLite file, keeping existing database.sqlite');
        }
        resolve();
      });
    });

    req.on('timeout', () => {
      console.log('[sync-db] Timeout fetching live DB, keeping existing database.sqlite');
      req.destroy();
      resolve();
    });

    req.on('error', (err) => {
      console.log(`[sync-db] Error fetching live DB (${err.message}), keeping existing database.sqlite`);
      resolve();
    });
  });
}

syncLiveDatabase();
