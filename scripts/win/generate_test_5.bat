@echo off
rem Шард 5/10 offline-генератора сигналов (generate-signals.mjs: messages.jsonl -> signals.jsonl
rem через LLM, без backtest-kit), хронологически. Запуск из корня репо:
rem   scripts\win\generate_test_5.bat
rem Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

call node .\content\sep_2023\generate-signals.mjs
call node .\content\oct_2023\generate-signals.mjs
call node .\content\nov_2023\generate-signals.mjs
call node .\content\dec_2023\generate-signals.mjs
call node .\content\jan_2024\generate-signals.mjs
call node .\content\feb_2024\generate-signals.mjs
call node .\content\mar_2024\generate-signals.mjs

echo === generate_test_5: sep_2023..mar_2024 прогнан ===
