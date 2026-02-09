@echo off
setlocal enabledelayedexpansion

echo =======================================
echo    Neon Snake Game Git Setup ^& Push
echo =======================================

:: 1. Git Initialization
if not exist ".git" (
    echo [INFO] Git repository not found. Initializing...
    git init
)

:: 2. Check Git User Identity
git config user.email >nul 2>&1
if !errorlevel! neq 0 (
    echo [IMPORTANT] Git user identity not found.
    set /p uemail="Enter your GitHub Email: "
    set /p uname="Enter your GitHub Name: "
    git config user.email "!uemail!"
    git config user.name "!uname!"
    echo [SUCCESS] User identity configured locally.
)

:: 3. Set Remote URL
echo [1/4] Configuring remote URL...
git remote get-url origin >nul 2>&1
if !errorlevel! neq 0 (
    git remote add origin https://github.com/moonseekerer/snakegame.git
) else (
    git remote set-url origin https://github.com/moonseekerer/snakegame.git
)

:: 4. Add Files
echo [2/4] Adding files...
git add .

:: 5. Commit Changes
set timestamp=%DATE% %TIME%
echo [3/4] Committing changes...
git commit -m "Auto update: !timestamp!"
if !errorlevel! neq 0 (
    echo [INFO] No changes to commit.
)

:: 6. Push to GitHub
echo [4/4] Pushing to GitHub (main branch)...
:: Ensure we are on main branch or create it
git branch -M main

git push -u origin main
if !errorlevel! neq 0 (
    echo.
    echo [ERROR] Push failed. 
    echo [TIP] If this is a new repository, please make sure it's empty on GitHub.
    echo [TIP] If you already have files on GitHub, try: git pull origin main --rebase
) else (
    echo.
    echo [SUCCESS] Successfully updated your code on GitHub!
    echo Check your game at: https://moonseekerer.github.io/snakegame/
)

echo =======================================
pause
