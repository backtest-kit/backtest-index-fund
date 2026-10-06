@echo off
rem Шард 9/10 offline-генератора сигналов (generate-signals.mjs: messages.jsonl -> signals.jsonl
rem через LLM, без backtest-kit), хронологически. Запуск из корня репо:
rem   scripts\win\generate_test_9.bat
rem Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

call node .\content\oct_2025\generate-signals.mjs
call node .\content\nov_2025\generate-signals.mjs
call node .\content\dec_2025\generate-signals.mjs
call node .\content\jan_2026\generate-signals.mjs
call node .\content\feb_2026\generate-signals.mjs
call node .\content\mar_2026\generate-signals.mjs

echo === generate_test_9: oct_2025..mar_2026 прогнан ===
