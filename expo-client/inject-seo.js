const fs = require('fs');
const path = require('path');
const https = require('https');

const distDir = path.join(__dirname, 'dist');
const htmlPath = path.join(distDir, 'index.html');

if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');

  const seoTags = `
  <meta name="application-name" content="DevGround (데브그라운드)" />
  <meta name="author" content="DevGround Indie Game Developer Community" />
  <meta name="description" content="DevGround(데브그라운드)는 인디 게임 개발자 커뮤니티입니다. Unity(유니티), Unreal Engine(언리얼), Godot(고도) 게임 개발일지(DevLog), 무료 2D·3D·오디오·코드 게임 에셋 공유, 인디게임 웹데모 홍보관, 팀원 모집 보드를 설치·로그인 없이 무료로 이용하세요." />
  <link rel="icon" type="image/png" sizes="192x192" href="/favicon.png" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/manifest.json" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="DevGround" />
  <link rel="alternate" hreflang="ko" href="https://gamedev-platform-expo-client.vercel.app/" />
  <link rel="alternate" hreflang="en" href="https://gamedev-platform-expo-client.vercel.app/" />
  <link rel="alternate" hreflang="x-default" href="https://gamedev-platform-expo-client.vercel.app/" />
  <meta name="keywords" content="DevGround, 데브그라운드, 게임 개발자 커뮤니티, 인디게임 개발자 커뮤니티, 인디 게임 개발, 게임 개발일지, DevLog, 무료 게임 에셋, 유니티 무료 에셋, 언리얼 무료 에셋, 고도 엔진, 인디게임 홍보, 인디게임 팀원 모집, 게임 프로그래밍, 도트 픽셀아트 에셋, Indie Game Developer Community, Indie Game DevLog, Free Game Assets, Unity, Unreal Engine 5, Godot 4, GameDev Platform" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="ko_KR" />
  <meta property="og:locale:alternate" content="en_US" />
  <meta property="og:site_name" content="DevGround (데브그라운드)" />
  <meta property="og:title" content="🎮 DevGround (데브그라운드) - 인디 게임 개발자 커뮤니티 · 개발일지(DevLog) &amp; 무료 에셋 허브" />
  <meta property="og:description" content="설치·로그인 없이 즐기는 인디 게임 개발일지(DevLog), 웹데모 쇼케이스, 팀원 모집, 2D·3D·Audio·Code 무료 게임 에셋 공유 플랫폼!" />
  <meta property="og:url" content="https://gamedev-platform-expo-client.vercel.app/" />
  <meta property="og:image" content="https://gamedev-platform-expo-client.vercel.app/og-banner.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="🎮 DevGround (데브그라운드) - 인디 게임 개발자 커뮤니티 &amp; 무료 에셋 허브" />
  <meta name="twitter:description" content="인디 게임 개발자들의 개발일지(DevLog), 웹데모 홍보, 팀원 모집 및 무료 에셋 공유 커뮤니티 (Unity, Unreal, Godot)." />
  <meta name="twitter:image" content="https://gamedev-platform-expo-client.vercel.app/og-banner.png" />
  <link rel="canonical" href="https://gamedev-platform-expo-client.vercel.app/" />
  <link rel="alternate" type="application/rss+xml" title="DevGround RSS Feed" href="https://gamedev-platform-expo-client.vercel.app/rss.xml" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "name": "DevGround (데브그라운드)",
        "alternateName": ["DevGround", "데브그라운드", "인디 게임 개발자 커뮤니티", "Indie Game DevLog & Asset Hub", "GameDev Platform"],
        "url": "https://gamedev-platform-expo-client.vercel.app/",
        "inLanguage": ["ko", "en"],
        "description": "인디 게임 개발자들과 1인 게임 창작자들이 Unity, Unreal Engine, Godot 개발일지(DevLog)와 무료 2D/3D/Audio/Code 게임 에셋을 공유하고 팀원을 모집하는 글로벌 커뮤니티 플랫폼입니다."
      },
      {
        "@type": "SoftwareApplication",
        "name": "DevGround - 게임 개발자 커뮤니티 & 무료 에셋 허브",
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "Web, Android, iOS, Windows, macOS",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "KRW"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "DevGround(데브그라운드)는 어떤 사이트인가요?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "DevGround(데브그라운드)는 인디 게임 개발자와 1인 개발자들이 Unity, Unreal Engine, Godot 개발일지(DevLog)를 기록하고, 2D 픽셀아트·3D 모델·8비트 효과음·C# 스크립트 등 무료 게임 에셋을 공유하며, 인디게임 웹데모 홍보와 팀원 모집을 할 수 있는 무료 게임 개발자 커뮤니티입니다."
            }
          },
          {
            "@type": "Question",
            "name": "무료 게임 에셋 다운로드와 인디게임 웹데모 홍보가 가능한가요?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "네, 회원가입이나 별도 프로그램 설치 없이도 누구나 2D 타일셋, 3D 로우폴리 에셋, 효과음(SFX) 미리듣기, Unity C# 코드를 즉시 열람·복사할 수 있으며, 본인이 개발한 인디게임 홈페이지나 스팀/Itch.io 데모 링크를 무료로 홍보할 수 있습니다."
            }
          },
          {
            "@type": "Question",
            "name": "What is DevGround Indie Game Developer Community?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "DevGround is a free global indie game developer hub for sharing DevLogs, playable HTML5/WebGL game demos, team recruitment posts, and royalty-free 2D, 3D, Audio, UI, and Code assets for Unity, Unreal Engine, and Godot."
            }
          }
        ]
      }
    ]
  }
  </script>
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
  </script>`;

  const semanticSeoBody = `
  <section id="devground-seo-index" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;">
    <h1>DevGround (데브그라운드) - 인디 게임 개발자 커뮤니티 · 개발일지(DevLog) · 무료 게임 에셋 공유 플랫폼</h1>
    <p>DevGround는 국내 및 글로벌 인디 게임 개발자, 1인 게임 개발자, 대학생 게임 제작 동아리, 게임잼(Game Jam) 참가자들을 위한 올인원 게임 개발 커뮤니티(GameDev Platform)입니다.</p>
    <h2>주요 기능 및 카테고리 안내</h2>
    <ul>
      <li><a href="/indie-game-community.html">인디 게임 개발자 커뮤니티 &amp; 개발일지(DevLog) 피드백 허브 (Unity, Unreal Engine 5, Godot 4)</a></li>
      <li><a href="/free-game-assets.html">무료 게임 에셋 허브 (2D 도트 픽셀아트 타일셋, 3D 로우폴리 모델, 8비트 BGM/효과음 오디오 미리듣기, Unity C# 코드 스니펫)</a></li>
      <li><a href="/game-devlog-showcase.html">인디게임 공식 홈페이지 &amp; 웹데모(WebGL/HTML5/Steam/Itch.io) 쇼케이스 홍보관 및 팀원 모집 보드</a></li>
      <li><a href="/arcade.html">DevGround 내장 미니게임 오락실: Bug Slayer (인디 개발자 버그 피하기 실시간 랭킹 게임)</a></li>
      <li><a href="/privacy.html">개인정보처리방침 및 이용약관 (Privacy Policy &amp; Terms)</a></li>
    </ul>
    <article>
      <h3>[DevLog] 2D 로그라이크 던전 보스 패턴 &amp; 타격감 개선기 (Unity C#)</h3>
      <p>카메라 쉐이크(Camera Shake)와 히트스톱(Hit-stop) 프레임을 활용한 인디 액션 로그라이크 타격감 최적화 개발일지.</p>
    </article>
    <article>
      <h3>[DevLog] 언리얼 엔진 5 카툰 렌더링(Cel Shader) 외곽선 최적화 공유 (Unreal 5)</h3>
      <p>모바일 및 저사양 PC에서도 60FPS를 방어하는 Inverted Hull 및 노멀 맵 보정 카툰 셰이더 제작 팁.</p>
    </article>
    <article>
      <h3>[DevLog] Godot 4.3으로 1인 개발 중인 픽셀 농장 시뮬레이션 공개 (Godot Engine)</h3>
      <p>오토타일링 시스템과 계절별 날씨 효과(비, 눈, 반딧불이)를 구현한 힐링 인디게임 개발일지.</p>
    </article>
    <article>
      <h3>[Free Asset] 16x16 다크 판타지 던전 타일셋, 로우폴리 3D 무기 에셋, 8비트 효과음 스타터 팩, 코요테 타임 C# 스크립트</h3>
      <p>상업/비상업 인디게임 프로젝트에 바로 사용할 수 있는 무료 2D, 3D, Audio, UI, Code 게임 개발 에셋 모음.</p>
    </article>
  </section>`;

  if (!html.includes('og:title')) {
    html = html.replace('</head>', `${seoTags}\n</head>`);
    html = html.replace('<html lang="en">', '<html lang="ko">');
    html = html.replace(
      /<title>[\s\S]*?<\/title>/,
      '<title>DevGround (데브그라운드) - 인디 게임 개발자 커뮤니티 · 개발일지(DevLog) & 무료 게임 에셋 허브</title>'
    );
    html = html.replace('<body>', `<body>\n${semanticSeoBody}`);
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log('Injected super-rich SEO schema & crawlable semantic HTML into dist/index.html');
  }

  // Generate static SEO topic landing pages so Google/Bing/Naver index multiple keyword-focused entry pages
  const seoPages = [
    {
      file: 'indie-game-community.html',
      title: '인디 게임 개발자 커뮤니티 & 팀원 모집 보드 | DevGround (데브그라운드)',
      h1: '인디 게임 개발자 커뮤니티 & 인디게임 팀원 모집 (DevGround)',
      desc: '1인 게임 개발자와 인디팀을 위한 개발일지(DevLog) 공유 및 프로그래머·2D 도트 아티스트·3D 모델러·사운드 디자이너 팀원 모집 커뮤니티입니다.',
      keywords: '인디게임 개발자 커뮤니티, 게임 개발자 커뮤니티, 1인 게임 개발, 인디게임 팀원 모집, 게임 개발 동아리, DevGround, 데브그라운드'
    },
    {
      file: 'free-game-assets.html',
      title: '무료 게임 에셋 공유 허브 (2D 도트 · 3D 모델 · 효과음 · Unity C# 코드) | DevGround',
      h1: '무료 게임 개발 에셋 허브 (2D / 3D / Audio / UI / C# Code Assets)',
      desc: 'Unity, Unreal Engine, Godot 인디 게임 개발에 바로 쓸 수 있는 무료 2D 픽셀아트 타일셋, 3D 로우폴리 모델, 8비트 효과음(SFX) 미리듣기, C# 스크립트 스니펫을 다운로드하세요.',
      keywords: '무료 게임 에셋, 유니티 무료 에셋, 언리얼 무료 에셋, 2D 도트 에셋, 게임 효과음 무료, Unity C# 스크립트, DevGround'
    },
    {
      file: 'game-devlog-showcase.html',
      title: '인디게임 개발일지(DevLog) & 웹데모 공식 홈페이지 홍보관 | DevGround',
      h1: '인디게임 개발일지(DevLog) & 플레이어블 웹데모 쇼케이스 홍보관',
      desc: '내가 만든 인디게임 공식 홈페이지, 스팀(Steam) 위시리스트 페이지, Itch.io 웹데모(WebGL/HTML5)를 전 세계 게이머와 동료 개발자들에게 무료로 홍보하세요.',
      keywords: '인디게임 홍보, 게임 개발일지, 인디게임 데모 플레이, 스팀 인디게임 홍보, Itch.io 웹게임, DevGround 쇼케이스'
    }
  ];

  for (const p of seoPages) {
    const pageHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${p.title}</title>
  <meta name="description" content="${p.desc}" />
  <meta name="keywords" content="${p.keywords}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="https://gamedev-platform-expo-client.vercel.app/${p.file}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${p.title}" />
  <meta property="og:description" content="${p.desc}" />
  <meta property="og:url" content="https://gamedev-platform-expo-client.vercel.app/${p.file}" />
  <meta property="og:image" content="https://gamedev-platform-expo-client.vercel.app/og-banner.png" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 36px 16px; line-height: 1.7; }
    .box { max-width: 820px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 18px; padding: 28px; }
    h1 { color: #38bdf8; font-size: 24px; margin-top: 0; }
    p, li { color: #cbd5e1; font-size: 15px; }
    .btn { display: inline-block; background: #38bdf8; color: #0f172a; padding: 12px 22px; border-radius: 12px; font-weight: 800; text-decoration: none; margin-top: 16px; font-size: 15px; }
  </style>
</head>
<body>
  <main class="box">
    <h1>🎮 ${p.h1}</h1>
    <p>${p.desc}</p>
    <ul>
      <li>설치나 회원가입 없이 브라우저와 모바일에서 즉시 열람 가능</li>
      <li>Unity · Unreal Engine 5 · Godot 4 전 엔진 개발자 교류 및 한↔영 자동 번역 지원</li>
      <li>실시간 A/B 개발 피드백 투표 및 원클릭 코드 스니펫 복사·오디오 미리듣기 제공</li>
    </ul>
    <a class="btn" href="https://gamedev-platform-expo-client.vercel.app/">🚀 DevGround 커뮤니티 바로 입장하기 →</a>
  </main>
</body>
</html>`;
    fs.writeFileSync(path.join(distDir, p.file), pageHtml, 'utf8');
  }
  console.log('Generated 3 static SEO landing pages in dist/');
}
