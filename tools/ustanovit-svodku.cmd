@echo off
rem ============================================================================
rem  Registers the daily sales-department digest in Windows Task Scheduler.
rem  Run once, by double-click. No admin rights needed: the task runs as you.
rem
rem  ASCII-only on purpose. Russian text in a .cmd depends on the console code
rem  page and comes out mangled about half the time; the Russian lives in
rem  tools/svodka.py, which is read as UTF-8.
rem
rem  Weekdays 08:30. To change the time, edit TIME below and run again.
rem  To remove the task: tools\udalit-svodku.cmd
rem ============================================================================
setlocal
set TASK=TehnoHolod-svodka-otdela-prodazh
set TIME_=08:30
set RUNNER=%~dp0svodka.cmd

if not exist "%RUNNER%" (
  echo ERROR: %RUNNER% not found. Run this file from the tools folder of the repo.
  pause
  exit /b 1
)

where python >nul 2>&1 || (
  echo ERROR: python not found in PATH. Install Python 3 and try again.
  pause
  exit /b 1
)
where claude >nul 2>&1 || (
  echo ERROR: claude not found in PATH. Install Claude Code and try again.
  pause
  exit /b 1
)

schtasks /create /tn "%TASK%" /tr "\"%RUNNER%\"" /sc weekly /d MON,TUE,WED,THU,FRI /st %TIME_% /f
if errorlevel 1 (
  echo.
  echo Task was NOT created. See the message above.
  pause
  exit /b 1
)

echo.
echo Done. Digest for the previous day runs on weekdays at %TIME_%.
echo Reports go to otdel-prodazh\otchety\
echo.
echo Check it now without waiting:  schtasks /run /tn "%TASK%"
echo Remove it:                     tools\udalit-svodku.cmd
pause
