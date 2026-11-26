@echo off
chcp 65001 > nul
echo ============================================================
echo   🚀 DevGround (gamedev-platform-expo-client.vercel.app) 배포기
echo ============================================================
cd /d "E:\gamedev-platform"

set GIT_EXE=C:\Users\youmi\AppData\Local\GitHubDesktop\app-3.6.5\resources\app\git\cmd\git.exe
if not exist "%GIT_EXE%" set GIT_EXE=git

echo [1/3] 변경사항을 커밋하고 main 브랜치에 병합합니다...
"%GIT_EXE%" add -A
"%GIT_EXE%" commit -m "fix(ui): fix Top Story Bar BaaS modal handler and sync latest UI to main"
"%GIT_EXE%" checkout main
"%GIT_EXE%" merge devground/google-search-seo --no-edit

echo [2/3] GitHub (youminan200/gamedev-platform) main 브랜치로 푸시합니다...
"%GIT_EXE%" push origin main

echo [3/3] Expo 웹 빌드를 검증합니다...
cd /d "E:\gamedev-platform\expo-client"
call npx expo export -p web && node inject-seo.js

echo.
echo ✅ https://gamedev-platform-expo-client.vercel.app/ 업데이트 배포가 완료되었습니다!
pause

