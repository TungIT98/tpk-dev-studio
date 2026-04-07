@echo off
REM ================================================================================
REM TKP DEV STUDIO - ONE COMMAND APP GENERATOR
REM ================================================================================
REM
REM Usage:
REM   create-app.bat <type> <name>
REM
REM Examples:
REM   create-app.bat game tictactoe
REM   create-app.bat web portfolio
REM   create-app.bat mobile fitness-app
REM
REM Types:
REM   game    - HTML5/JS game (Phaser.js)
REM   web     - Next.js web app
REM   mobile  - React Native app
REM   api     - Backend API service
REM
REM ================================================================================

setlocal enabledelayedexpansion

set "COMPANY_ID=7fbb2529-7d69-4177-bb6b-988404c35965"
set "PAPERCLIP_API=http://127.0.0.1:3100"
set "WORKSPACE=C:\Users\PC\.paperclip\instances\default\workspaces\tkp-dev-studio"

set "TYPE=%1"
set "APP_NAME=%2"

if "%TYPE%"=="" (
    echo ERROR: Missing app type
    echo Usage: create-app.bat [game^|web^|mobile^|api] [app-name]
    exit /b 1
)

if "%APP_NAME%"=="" (
    echo ERROR: Missing app name
    echo Usage: create-app.bat [game^|web^|mobile^|api] [app-name]
    exit /b 1
)

echo ================================================================================
echo TKP DEV STUDIO - Creating %TYPE% app: %APP_NAME%
echo ================================================================================

REM Create project folder
set "PROJECT_DIR=%WORKSPACE%\projects\%APP_NAME%"
mkdir "%PROJECT_DIR%" 2>nul
mkdir "%PROJECT_DIR%\src" 2>nul
mkdir "%PROJECT_DIR%\docs" 2>nul
mkdir "%PROJECT_DIR%\tests" 2>nul

echo [1/5] Project structure created: %PROJECT_DIR%

REM Create SPEC.md
call :create_spec "%PROJECT_DIR%" "%TYPE%" "%APP_NAME%"
echo [2/5] SPEC.md created

REM Create initial project files based on type
call :create_project_files "%PROJECT_DIR%" "%TYPE%" "%APP_NAME%"
echo [3/5] Project files created

REM Create Paperclip Goal
call :create_goal "%TYPE%" "%APP_NAME%"
echo [4/5] Goal created in Paperclip

REM Create Issues for the project
call :create_issues "%TYPE%" "%APP_NAME%"
echo [5/5] Issues created and assigned

echo.
echo ================================================================================
echo APP '%APP_NAME%' SETUP COMPLETE!
echo.
echo Project: %PROJECT_DIR%
echo Type: %TYPE%
echo.
echo Next: CEO will assign tasks to agents via Paperclip
echo ================================================================================

goto :end

:create_spec
set "PROJECT_DIR=%~1"
set "TYPE=%~2"
set "APP_NAME=%~3"

if "%TYPE%"=="game" (
    (
        echo # %APP_NAME% - Game Specification
        echo.
        echo ## Project Overview
        echo - Name: %APP_NAME%
        echo - Type: HTML5 Game
        echo - Engine: Phaser 3
        echo - Target: Browser, Mobile
        echo.
        echo ## Game Mechanics
        echo - Core gameplay loop
        echo - Win/lose conditions
        echo - Scoring system
        echo.
        echo ## Technical Requirements
        echo - Single HTML file with embedded JS
        echo - Responsive design
        echo - Touch controls for mobile
        echo - Sound effects (optional)
        echo.
        echo ## Art Style
        echo - Minimalist pixel art
        echo - Vibrant colors
        echo - Smooth animations
    ) > "%PROJECT_DIR%\SPEC.md"
)

if "%TYPE%"=="web" (
    (
        echo # %APP_NAME% - Web App Specification
        echo.
        echo ## Project Overview
        echo - Name: %APP_NAME%
        echo - Type: Next.js Web Application
        echo - Target: Web browsers
        echo.
        echo ## Features
        echo - Landing page
        echo - User authentication
        echo - Dashboard
        echo - API integration
        echo.
        echo ## Technical Stack
        echo - Frontend: Next.js 14, React, Tailwind CSS
        echo - Backend: Node.js API routes
        echo - Database: PostgreSQL with Prisma
        echo.
        echo ## Design
        echo - Modern, clean UI
        echo - Mobile responsive
        echo - Dark mode support
    ) > "%PROJECT_DIR%\SPEC.md"
)

if "%TYPE%"=="mobile" (
    (
        echo # %APP_NAME% - Mobile App Specification
        echo.
        echo ## Project Overview
        echo - Name: %APP_NAME%
        echo - Type: Cross-platform Mobile App
        echo - Framework: React Native
        echo.
        echo ## Features
        echo - Home screen with navigation
        echo - User profile
        echo - Push notifications
        echo - Offline support
        echo.
        echo ## Technical Stack
        echo - Framework: React Native Expo
        echo - Navigation: React Navigation
        echo - State: Zustand
        echo - API: REST backend
    ) > "%PROJECT_DIR%\SPEC.md"
)

if "%TYPE%"=="api" (
    (
        echo # %APP_NAME% - API Service Specification
        echo.
        echo ## Project Overview
        echo - Name: %APP_NAME%
        echo - Type: REST API Service
        echo - Language: Python/Node.js
        echo.
        echo ## Endpoints
        echo - GET /api/health
        echo - GET /api/users
        echo - POST /api/users
        echo.
        echo ## Technical Stack
        echo - Language: Python (FastAPI) or Node.js (Express)
        echo - Database: PostgreSQL
        echo - Auth: JWT
        echo - Docs: OpenAPI/Swagger
    ) > "%PROJECT_DIR%\SPEC.md"
)

exit /b

:create_goal
set "TYPE=%~1"
set "APP_NAME=%~2"

curl -s -X POST "%PAPERCLIP_API%/api/companies/%COMPANY_ID%/goals" ^
  -H "Content-Type: application/json" ^
  -d "{
    \"title\": \"[%TYPE%] %APP_NAME% - Complete Development\",
    \"description\": \"Develop and deploy %APP_NAME% %TYPE% application. From spec to production.\",
    \"priority\": \"high\"
  }" >nul

exit /b

:create_issues
set "TYPE=%~1"
set "APP_NAME=%~2"

REM Issue 1: Design
curl -s -X POST "%PAPERCLIP_API%/api/companies/%COMPANY_ID%/issues" ^
  -H "Content-Type: application/json" ^
  -d "{
    \"title\": \"[Design] %APP_NAME% - UI/UX Design\",
    \"description\": \"Create wireframes and UI design for %APP_NAME%. Assign to UX/UI Designer.\",
    \"priority\": \"high\",
    \"assigneeAgentId\": \"8e7459b0-e4bc-4362-8d0e-77d41df56611\"
  }" >nul

REM Issue 2: Frontend
curl -s -X POST "%PAPERCLIP_API%/api/companies/%COMPANY_ID%/issues" ^
  -H "Content-Type: application/json" ^
  -d "{
    \"title\": \"[Frontend] %APP_NAME% - Frontend Development\",
    \"description\": \"Implement frontend for %APP_NAME% based on SPEC.md. Assign to Frontend Engineer.\",
    \"priority\": \"high\",
    \"assigneeAgentId\": \"b7e8ffa5-23f5-4428-bced-3360f3dd4ffd\"
  }" >nul

REM Issue 3: Backend (if not game)
if not "%TYPE%"=="game" (
    curl -s -X POST "%PAPERCLIP_API%/api/companies/%COMPANY_ID%/issues" ^
      -H "Content-Type: application/json" ^
      -d "{
        \"title\": \"[Backend] %APP_NAME% - Backend Development\",
        \"description\": \"Implement backend API for %APP_NAME%. Assign to Backend Engineer.\",
        \"priority\": \"high\",
        \"assigneeAgentId\": \"d24ecb84-e046-417b-be50-41139991f6a9\"
      }" >nul
)

REM Issue 4: QA Testing
curl -s -X POST "%PAPERCLIP_API%/api/companies/%COMPANY_ID%/issues" ^
  -H "Content-Type: application/json" ^
  -d "{
    \"title\": \"[QA] %APP_NAME% - Testing and Bug Fixes\",
    \"description\": \"Test %APP_NAME% thoroughly. Fix any bugs found. Assign to QA Engineer.\",
    \"priority\": \"high\",
    \"assigneeAgentId\": \"71c1482f-fe71-45a8-b2bb-70feb34657c3\"
  }" >nul

REM Issue 5: Deploy
curl -s -X POST "%PAPERCLIP_API%/api/companies/%COMPANY_ID%/issues" ^
  -H "Content-Type: application/json" ^
  -d "{
    \"title\": \"[DevOps] %APP_NAME% - Deploy to Production\",
    \"description\": \"Deploy %APP_NAME% to production. Setup CI/CD. Assign to DevOps Engineer.\",
    \"priority\": \"high\",
    \"assigneeAgentId\": \"a8fbdb89-3fa8-4b92-9ae7-8b836f7af9da\"
  }" >nul

exit /b

:end
