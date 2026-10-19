@echo off
REM Прогон индексного фонда по всем кварталам, один процесс CLI на квартал. Нужны поднятые docker\mongo и docker\redis.
REM Отчёты: content\<квартал>\dump\report\backtest.jsonl. Запуск из корня репо: scripts\win\generate_strategy.bat
REM Каждый квартал завершается kill() с ненулевым кодом - это штатно, прогон продолжается; сводка: node scripts\common\summarize_reports.mjs
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q4_2020\main.strategy.ts
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q1_2021\main.strategy.ts
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q2_2021\main.strategy.ts
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q3_2021\main.strategy.ts
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q4_2021\main.strategy.ts
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q1_2022\main.strategy.ts
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q2_2022\main.strategy.ts
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q3_2022\main.strategy.ts
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q4_2022\main.strategy.ts
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q1_2023\main.strategy.ts
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q2_2023\main.strategy.ts
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q3_2023\main.strategy.ts
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q4_2023\main.strategy.ts
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q1_2024\main.strategy.ts
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q2_2024\main.strategy.ts
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q3_2024\main.strategy.ts
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q4_2024\main.strategy.ts
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q1_2025\main.strategy.ts
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q2_2025\main.strategy.ts
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q3_2025\main.strategy.ts
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q4_2025\main.strategy.ts
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q1_2026\main.strategy.ts
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q2_2026\main.strategy.ts
node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\q3_2026\main.strategy.ts
