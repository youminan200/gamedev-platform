const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'dist', 'index.html');
if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  const seoTags = `
  <meta name="keywords" content="DevGround, gamedev platform, 게임 개발자 커뮤니티, 인디 게임 개발, 개발일지, DevLog, 게임 에셋 공유, Unity, Unreal Engine, Godot" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="ko_KR" />
  <meta property="og:site_name" content="DevGround" />
  <meta property="og:title" content="🎮 DevGround - 인디 게임 개발자 개발일지 & 무료 에셋 허브" />
  <meta property="og:description" content="설치·로그인 없이 즉시 열람! 인디 게임 개발자들의 실시간 개발일지(DevLog)와 2D·3D·Audio·Code 에셋을 공유하고 피드백을 나누세요." />
  <meta property="og:url" content="https://gamedev-platform-expo-client.vercel.app/" />
  <meta property="og:image" content="https://gamedev-platform-expo-client.vercel.app/og-banner.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="🎮 DevGround - 인디 게임 개발자 개발일지 & 무료 에셋 허브" />
  <meta name="twitter:description" content="설치·로그인 없이 즉시 열람! 인디 게임 개발자들의 실시간 개발일지(DevLog)와 무료 에셋 커뮤니티" />
  <meta name="twitter:image" content="https://gamedev-platform-expo-client.vercel.app/og-banner.png" />
  <link rel="canonical" href="https://gamedev-platform-expo-client.vercel.app/" />
  <link rel="alternate" type="application/rss+xml" title="DevGround RSS Feed" href="https://gamedev-platform-expo-client.vercel.app/rss.xml" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "DevGround",
    "alternateName": ["DevGround 게임 개발자 커뮤니티", "gamedev-platform", "GameDev Platform"],
    "url": "https://gamedev-platform-expo-client.vercel.app/",
    "description": "인디 게임 개발자들의 개발일지(DevLog) 및 2D/3D/Audio/UI/Code 무료 에셋 공유 플랫폼"
  }
  </script>`;

  if (!html.includes('og:title')) {
    html = html.replace('</head>', `${seoTags}\n</head>`);
    html = html.replace('<html lang="en">', '<html lang="ko">');
    html = html.replace(
      /<noscript>[\s\S]*?<\/noscript>/,
      `<noscript>
      <h1>DevGround - 인디 게임 개발자 개발일지(DevLog) & 무료 에셋 공유 플랫폼 (GameDev Platform)</h1>
      <p>DevGround는 인디 게임 개발자와 1인 창작자가 Unity, Unreal Engine, Godot 개발일지(DevLog)와 2D, 3D, Audio, UI, Code 에셋을 공유하고 실시간 피드백을 주고받는 게임 개발 커뮤니티 허브입니다.</p>
    </noscript>`
    );
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log('Injected static OG, JSON-LD & SEO crawlable content into dist/index.html');
  }
}
