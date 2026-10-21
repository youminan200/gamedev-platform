const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'dist', 'index.html');
if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  const seoTags = `
  <meta name="application-name" content="DevGround" />
  <link rel="icon" type="image/png" sizes="192x192" href="/favicon.png" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/manifest.json" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="DevGround" />
  <script>
    window.__deferredInstallPrompt = null;
    window.addEventListener('beforeinstallprompt', function(e) {
      e.preventDefault();
      window.__deferredInstallPrompt = e;
    });
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').catch(function(){});
      });
    }
  </script>
  <link rel="alternate" hreflang="ko" href="https://gamedev-platform-expo-client.vercel.app/" />
  <link rel="alternate" hreflang="en" href="https://gamedev-platform-expo-client.vercel.app/" />
  <link rel="alternate" hreflang="x-default" href="https://gamedev-platform-expo-client.vercel.app/" />
  <meta name="keywords" content="DevGround, gamedev platform, indie game developer community, indie game devlog, free game assets, Unity, Unreal Engine, Godot, 게임 개발자 커뮤니티, 인디 게임 개발, 개발일지, 게임 에셋 공유" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="ko_KR" />
  <meta property="og:locale:alternate" content="en_US" />
  <meta property="og:site_name" content="DevGround" />
  <meta property="og:title" content="🎮 DevGround - Indie Game DevLog &amp; Free Asset Hub | 인디 게임 개발자 커뮤니티" />
  <meta property="og:description" content="Share indie game devlogs, playable demos, and free 2D/3D/Audio/Code assets! 설치·로그인 없이 인디 게임 개발일지와 무료 에셋을 공유하고 피드백을 나누세요." />
  <meta property="og:url" content="https://gamedev-platform-expo-client.vercel.app/" />
  <meta property="og:image" content="https://gamedev-platform-expo-client.vercel.app/og-banner.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="🎮 DevGround - Indie Game DevLog &amp; Free Asset Hub" />
  <meta name="twitter:description" content="Indie Game Developer Community for DevLogs, Playable Demos &amp; Free Game Assets (Unity, Unreal, Godot)." />
  <meta name="twitter:image" content="https://gamedev-platform-expo-client.vercel.app/og-banner.png" />
  <link rel="canonical" href="https://gamedev-platform-expo-client.vercel.app/" />
  <link rel="alternate" type="application/rss+xml" title="DevGround RSS Feed" href="https://gamedev-platform-expo-client.vercel.app/rss.xml" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "DevGround",
    "alternateName": ["DevGround Indie Game Dev Community", "DevGround 게임 개발자 커뮤니티", "gamedev-platform", "GameDev Platform"],
    "url": "https://gamedev-platform-expo-client.vercel.app/",
    "inLanguage": ["ko", "en"],
    "description": "Global Indie Game Developer Community for sharing DevLogs, playable demos, and free 2D/3D/Audio/Code assets. 인디 게임 개발자들의 개발일지(DevLog) 및 무료 에셋 공유 플랫폼."
  }
  </script>`;

  if (!html.includes('og:title')) {
    html = html.replace('</head>', `${seoTags}\n</head>`);
    html = html.replace('<html lang="en">', '<html lang="ko">');
    html = html.replace(
      '<title>DevGround - 게임 개발자 커뮤니티</title>',
      '<title>DevGround - Indie Game DevLog & Asset Hub | 게임 개발자 커뮤니티 (GameDev Platform)</title>'
    );
    html = html.replace(
      /<noscript>[\s\S]*?<\/noscript>/,
      `<noscript>
      <h1>DevGround - Indie Game DevLog &amp; Free Asset Sharing Platform | 인디 게임 개발자 개발일지 &amp; 무료 에셋 허브</h1>
      <p>DevGround is a global cross-platform indie game developer community where creators share Unity, Unreal Engine, and Godot DevLogs, playable web demos, and free 2D, 3D, Audio, UI, and Code assets. 인디 게임 개발자와 1인 창작자가 개발일지(DevLog)와 무료 에셋을 공유하고 실시간 피드백을 주고받는 게임 개발 커뮤니티입니다.</p>
    </noscript>`
    );
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log('Injected global EN/KO bilingual SEO & hreflang into dist/index.html');
  }
}
