@echo off
REM TKP Dev Studio Agent Heartbeat Script
REM Schedule with Task Scheduler: every 5 minutes

set API_BASE=http://127.0.0.1:3100
set COMPANY_ID=7fbb2529-7d69-4177-bb6b-988404c35965

echo [%date% %time%] Invoking TKP Dev Studio agent heartbeats...

REM CEO - d1ee87e8-76a9-4e23-8b88-3b5b186f1cc9
curl -s -X POST "%API_BASE%/api/agents/d1ee87e8-76a9-4e23-8b88-3b5b186f1cc9/heartbeat/invoke" >nul 2>&1
echo CEO: invoked

REM CTO - 3ff25e94-b11a-4982-84a7-25eaab5ade16
curl -s -X POST "%API_BASE%/api/agents/3ff25e94-b11a-4982-84a7-25eaab5ade16/heartbeat/invoke" >nul 2>&1
echo CTO: invoked

REM Game Developer - a3558240-0ce6-437e-988f-40c92bf45851
curl -s -X POST "%API_BASE%/api/agents/a3558240-0ce6-437e-988f-40c92bf45851/heartbeat/invoke" >nul 2>&1
echo Game Developer: invoked

echo [%date% %time%] All heartbeats invoked
