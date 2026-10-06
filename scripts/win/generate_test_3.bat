@echo off
rem Шард 3/10 offline-генератора сигналов (generate-signals.mjs: messages.jsonl -> signals.jsonl
rem через LLM, без backtest-kit), хронологически. Запуск из корня репо:
rem   scripts\win\generate_test_3.bat
rem Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

call node .\content\jul_2022\generate-signals.mjs
call node .\content\aug_2022\generate-signals.mjs
call node .\content\sep_2022\generate-signals.mjs
call node .\content\oct_2022\generate-signals.mjs
call node .\content\nov_2022\generate-signals.mjs
call node .\content\dec_2022\generate-signals.mjs
call node .\content\jan_2023\generate-signals.mjs

echo === generate_test_3: jul_2022..jan_2023 прогнан ===
