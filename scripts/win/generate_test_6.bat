@echo off
rem Шард 6/10 бэктеста (@backtest-kit/cli: main.test.ts, сигналы из assets/signals.jsonl), хронологически. Запуск из корня репо:
rem   scripts\win\generate_test_6.bat
rem Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\apr_2024\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\may_2024\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\jun_2024\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\jul_2024\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\aug_2024\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\sep_2024\main.test.ts

echo === generate_test_6: apr_2024..sep_2024 прогнан ===
