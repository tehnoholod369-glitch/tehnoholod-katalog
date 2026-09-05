@echo off
rem Removes the scheduled sales-department digest. Files and reports stay.
setlocal
set TASK=TehnoHolod-svodka-otdela-prodazh
schtasks /delete /tn "%TASK%" /f
if errorlevel 1 (
  echo Task not found or not removed. Nothing changed.
) else (
  echo Removed. Reports already written stay in otdel-prodazh\otchety\
)
pause
