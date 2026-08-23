@echo off
rem Wrapper for Windows Task Scheduler. See tools/svodka.py for what it does.
rem Deliberately ASCII-only: Russian text in a .cmd depends on the console code page
rem and reaches Claude mangled about half the time. The prompt lives in svodka.py.
cd /d "%~dp0.."
python tools\svodka.py %*
