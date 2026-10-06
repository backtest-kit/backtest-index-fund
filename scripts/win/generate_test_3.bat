@echo off
rem Шард 3/10 бэктеста (@backtest-kit/cli: main.test.ts, сигналы из assets/signals.jsonl), хронологически. Запуск из корня репо:
rem   scripts\win\generate_test_3.bat
rem Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\jul_2022\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\aug_2022\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\sep_2022\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\oct_2022\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\nov_2022\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\dec_2022\main.test.ts
call node .\node_modules\@backtest-kit\cli\build\index.mjs --backtest --entry .\content\jan_2023\main.test.ts

echo === generate_test_3: jul_2022..jan_2023 прогнан ===
