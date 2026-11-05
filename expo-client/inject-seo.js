const fs = require('fs');
const path = require('path');
const https = require('https');

const distDir = path.join(__dirname, 'dist');
const htmlPath = path.join(distDir, 'index.html');

if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');

  const seoTags = `
  <style>
    @font-face {
      font-family: 'DungGeunMo';
      src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/DungGeunMo.woff') format('woff');
      font-weight: normal;
      font-style: normal;
    }
    * { box-sizing: border-box; }
    body { background-color: #11131C; }
  </style>
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

  const fallback = `<noscript>
    <main style="max-width:760px;margin:24px auto;padding:16px;color:#f4f4f6">
      <h1>DevGround · 인디 게임 개발자 커뮤니티</h1>
      <p>게임 개발일지를 공유하고, 에셋을 찾고, 인디 게임 데모를 둘러보세요. 앱을 사용하려면 JavaScript를 켜세요.</p>
      <ul>
        <li><a style="color:#bae6fd" href="/indie-game-community.html">개발일지 작성과 팀원 모집</a></li>
        <li><a style="color:#bae6fd" href="/free-game-assets.html">무료 게임 에셋 사용 가이드</a></li>
        <li><a style="color:#bae6fd" href="/game-devlog-showcase.html">Unity WebGL 빌드와 404 해결</a></li>
      </ul>
    </main>
  </noscript>`;

  if (!html.includes('og:title')) {
    html = html.replace('</head>', `${seoTags}\n</head>`);
    html = html.replace('<html lang="en">', '<html lang="ko">');
    html = html.replace(
      /<title>[\s\S]*?<\/title>/,
      '<title>DevGround · 인디 게임 개발자 커뮤니티</title>'
    );
    html = html.replace(/<noscript>[\s\S]*?<\/noscript>/i, fallback);
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
    },
    {
      file: 'free-game-assets.html',
      title: '무료 게임 에셋 공유 허브 (2D 도트 · 3D 모델 · 효과음 · Unity C# 코드) | DevGround',
      h1: '무료 게임 개발 에셋 허브 (2D / 3D / Audio / UI / C# Code Assets)',
      desc: 'Unity, Unreal Engine, Godot 인디 게임 개발에 바로 쓸 수 있는 무료 2D 픽셀아트 타일셋, 3D 로우폴리 모델, 8비트 효과음(SFX) 미리듣기, C# 스크립트 스니펫을 다운로드하세요.',
    },
    {
      file: 'game-devlog-showcase.html',
      title: 'Unity WebGL 빌드와 404 해결 가이드 | DevGround',
      h1: 'Unity WebGL 빌드와 404 해결 가이드',
      desc: 'SIGNAL BLACKOUT을 WebGL로 실행하면서 겪은 모듈 설치 오류, 404, 로컬 서버 연결 문제를 확인하는 방법입니다.',
    }
  ];

  const participation = {
    'indie-game-community.html': {
      heading: '첫 개발일지에 무엇을 쓰면 좋을까요?',
      steps: [
        '게임을 한 문장으로 소개하고, 지금 플레이할 수 있는 부분을 적으세요.',
        '직접 찍은 작업 화면을 올리고, 조작감이나 난이도처럼 의견을 받고 싶은 질문 하나를 덧붙이세요.',
        '팀원이 필요하다면 모집 보드에 엔진, 필요한 역할, 예상 작업량, 연락 방법을 적으세요.'
      ],
      href: '/',
      label: '개발일지와 팀원 모집 보기'
    },
    'free-game-assets.html': {
      heading: '프로젝트에 에셋을 넣기 전에',
      steps: [
        '2D, 3D, 오디오, 코드 중 필요한 유형부터 찾아보세요.',
        '제작자가 명시한 라이선스에서 상업적 사용, 수정, 출처 표기 조건을 확인하세요.',
        '샘플 씬에서 가져오기와 재생을 테스트한 뒤 본 프로젝트에 적용하세요.'
      ],
      href: '/?view=assets',
      label: '무료 에셋 둘러보기'
    },
    'game-devlog-showcase.html': {
      heading: 'Unity WebGL 데모를 공유하기 전 점검할 것',
      steps: [
        'Unity Hub에서 사용 중인 에디터 버전의 Web Build Support 설치를 완료하세요. SIGNAL BLACKOUT은 모듈 설치가 중단돼 기본 WebGL 템플릿이 빠졌고, 같은 버전의 모듈을 다시 설치한 뒤 빌드에 성공했습니다.',
        '빌드가 끝나면 index.html과 Build 폴더가 함께 있는지 확인하세요. Python이 설치돼 있다면 해당 폴더에서 python -m http.server 8081 --bind 127.0.0.1을 실행해 로컬 테스트를 시작할 수 있습니다.',
        '브라우저에서 http://127.0.0.1:8081/index.html을 여세요. 404라면 서버가 바라보는 폴더와 파일 이름을 확인하세요. 연결이 거부되면 서버 실행 여부와 포트를 확인하세요.',
        '개발자 도구의 Network에서 index.html, 로더 JavaScript, .data, .wasm 요청이 성공하는지 확인하세요. .wasm의 Content-Type은 application/wasm이어야 합니다.',
        '다른 기기에서 HTTPS 주소를 열어 로딩과 조작을 확인한 다음, 쇼케이스에 게임과 데모 주소를 등록하세요.'
      ],
      href: '/?view=showcase',
      label: '게임 쇼케이스 열기'
    }
  };


  for (const p of seoPages) {
    const entry = participation[p.file];
    const pageHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${p.title}</title>
  <meta name="description" content="${p.desc}" />
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
    nav { margin-top: 20px; font-size: 14px; }
    nav a { color: #bae6fd; }
    .btn { display: inline-block; background: #38bdf8; color: #0f172a; padding: 12px 22px; border-radius: 12px; font-weight: 800; text-decoration: none; margin-top: 16px; font-size: 15px; }
  </style>
</head>
<body>
  <main class="box">
    <h1>🎮 ${p.h1}</h1>
    <p>${p.desc}</p>
    <h2>${entry.heading}</h2>
    <ol>
      ${entry.steps.map((step) => `<li>${step}</li>`).join('\n      ')}
    </ol>
    <a class="btn" href="${entry.href}">${entry.label} →</a>
    <nav aria-label="DevGround 둘러보기">
      ${seoPages.filter((other) => other.file !== p.file).map((other) =>
        `<a href="/${other.file}">${participation[other.file].label}</a>`
      ).join(' · ')}
    </nav>
  </main>
</body>
</html>`;
    fs.writeFileSync(path.join(distDir, p.file), pageHtml, 'utf8');
  }
  console.log('Generated 3 static SEO landing pages in dist/');
}
