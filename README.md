# 🎮 DevGround (인디 게임 개발자 개발일지 & 에셋 공유 플랫폼)

[![Live Web App](https://img.shields.io/badge/🌐_Live_Web_App-gamedev--platform--expo--client.vercel.app-4F46E5?style=for-the-badge)](https://gamedev-platform-expo-client.vercel.app)
[![Admin Dashboard](https://img.shields.io/badge/📊_이용자_현황_대시보드-/admin-0EA5E9?style=for-the-badge)](https://gamedev-platform.onrender.com/admin)
[![Backend API](https://img.shields.io/badge/⚡_24/7_API_Server-Render_Live-10B981?style=for-the-badge)](https://gamedev-platform.onrender.com/api/devlogs)

---

## 🔗 공식 서비스 바로가기 (24시간 상시 가동)

| 구분 | 바로가기 링크 | 설명 |
| :--- | :--- | :--- |
| 🌐 **공식 웹앱 (유저용)** | **[https://gamedev-platform-expo-client.vercel.app](https://gamedev-platform-expo-client.vercel.app)** | 설치·로그인 없이 즉시 개발일지 및 에셋 허브 열람 가능 |
| 📊 **이용자 현황 대시보드** | **[https://gamedev-platform.onrender.com/admin](https://gamedev-platform.onrender.com/admin)** | 실시간 가입자 수, 게시글/에셋 통계 및 가입 회원 목록 표 |
| 📈 **실시간 통계 JSON API** | **[https://gamedev-platform.onrender.com/api/stats](https://gamedev-platform.onrender.com/api/stats)** | 전체 이용자 및 콘텐츠 통계 JSON 응답 |
| ⚡ **백엔드 상태 확인** | **[https://gamedev-platform.onrender.com/](https://gamedev-platform.onrender.com/)** | 24/7 Render 클라우드 API 서버 상태 확인 |

---

## ✨ 프로젝트 소개
**DevGround**는 인디 게임 개발자와 1인 창작자가 모바일(iOS/Android) 및 웹 환경에서 **개발 일지(DevLog)**와 **인게임 에셋(2D/3D/Audio/UI/Code)**을 실시간으로 공유하고, 플레이어 및 동료 개발자들로부터 빠른 피드백을 주고받을 수 있는 크로스 플랫폼 커뮤니티 허브입니다.

---

## 🚀 주요 기능 (v1.0.0 정식 출시)

1. **📜 DevLogs Hub (개발일지 피드)**
   - Unity, Unreal, Godot 등 엔진·주제별 태그 검색 및 최신순(`⚡ Latest`) / 인기순(`🔥 Most Liked`) 정렬
   - 로그인 없이도 즉시 모든 개발일지 열람 가능 (게스트 둘러보기 지원)
   - 실시간 좋아요(❤️) 및 댓글 피드백 소통

2. **🎨 Asset Hub (게임 개발 에셋 공유소)**
   - `2D`, `3D`, `Audio`, `UI`, `Code` 카테고리별 에셋 필터링 및 키워드 검색
   - 인디 개발자들이 직접 제작한 타일셋, 3D 모델, 효과음, C# 스크립트 공유 및 평점/피드백 제공

3. **🔑 간편 로그인 & 자동 로그인 유지**
   - **카카오 1초 로그인 (Kakao OAuth)** 및 일반 계정 회원가입 지원
   - 브라우저 재접속·새로고침 시에도 풀리지 않는 자동 세션 유지
   - 모바일/PC 브라우저에서 **홈 화면에 앱처럼 추가(PWA)** 및 원클릭 공유(`🔗 공유`) 지원

4. **📊 실시간 이용자 및 콘텐츠 대시보드 (`/admin`)**
   - 총 가입자 수, 등록된 개발일지/에셋/댓글 수 및 가입 방식(`KAKAO`, `NAVER`, `LOCAL`)별 회원 현황 실시간 조회

---

## 🛠️ Tech Stack
- **Frontend (Web & Mobile):** React Native, Expo (Web / iOS / Android), TypeScript, Vercel
- **Backend (24/7 Cloud API):** Node.js, Express, TypeScript, SQLite (`better-sqlite3`), JWT & Kakao OAuth 2.0, Render

---

## 👤 Team
- **안유민** — Fullstack & Mobile Lead


