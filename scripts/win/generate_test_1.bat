@echo off
rem Шард 1/10 бэктеста (@backtest-kit/cli: main.test.ts, сигналы из assets/signals.jsonl), хронологически. Запуск из корня репо:
rem   scripts\win\generate_test_1.bat
rem Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\may_2021\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\jun_2021\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\jul_2021\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\aug_2021\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\sep_2021\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\oct_2021\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\nov_2021\main.test.ts

echo === generate_test_1: may_2021..nov_2021 прогнан ===
