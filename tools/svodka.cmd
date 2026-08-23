@echo off
rem Ежедневная сводка отдела продаж ИП «ТехноХолод» — версия для Планировщика заданий
rem Windows. Смысл и ограничения те же, что в tools/svodka.sh: журнал сделок в git не
rem хранится, поэтому сводка собирается только на машине, где он лежит.
chcp 65001 >nul
cd /d "%~dp0.."

for /f %%d in ('python -c "from datetime import datetime, timedelta, timezone; print((datetime.now(timezone(timedelta(hours=5))) - timedelta(days=1)).strftime('%%Y-%%m-%%d'))"') do set DEN=%%d

claude -p "Собери сводку отдела продаж за вчера (%DEN%). Вызови агента nachalnik-otdela-prodazh и положи его документ в otdel-prodazh/otchety/%DEN%.md. Журнал пуст — так и напиши, файл всё равно создай: «движения не было» и «записывать было некому» — разные утверждения." ^
  --permission-mode acceptEdits ^
  --allowedTools "Bash(python3 tools/ledger.py:*)" "Bash(python3 tools/catalog.py:*)" "Read" "Glob" "Grep" "Write"

echo Сводка: otdel-prodazh\otchety\%DEN%.md
