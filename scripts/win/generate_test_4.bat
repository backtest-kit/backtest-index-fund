@echo off
rem Шард 4/10 бэктеста (@backtest-kit/cli: main.test.ts, сигналы из assets/signals.jsonl), хронологически. Запуск из корня репо:
rem   scripts\win\generate_test_4.bat
rem Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\feb_2023\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\mar_2023\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\apr_2023\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\may_2023\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\jun_2023\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\jul_2023\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\aug_2023\main.test.ts

echo === generate_test_4: feb_2023..aug_2023 прогнан ===
