@echo off
rem Шард 2/10 бэктеста (@backtest-kit/cli: main.test.ts, сигналы из assets/signals.jsonl), хронологически. Запуск из корня репо:
rem   scripts\win\generate_test_2.bat
rem Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\dec_2021\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\jan_2022\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\feb_2022\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\mar_2022\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\apr_2022\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\may_2022\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\jun_2022\main.test.ts

echo === generate_test_2: dec_2021..jun_2022 прогнан ===
