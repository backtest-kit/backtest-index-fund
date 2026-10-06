@echo off
rem Шард 8/10 offline-генератора сигналов (generate-signals.mjs: messages.jsonl -> signals.jsonl
rem через LLM, без backtest-kit), хронологически. Запуск из корня репо:
rem   scripts\win\generate_test_8.bat
rem Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

call node .\content\apr_2025\generate-signals.mjs
call node .\content\may_2025\generate-signals.mjs
call node .\content\jun_2025\generate-signals.mjs
call node .\content\jul_2025\generate-signals.mjs
call node .\content\aug_2025\generate-signals.mjs
call node .\content\sep_2025\generate-signals.mjs

echo === generate_test_8: apr_2025..sep_2025 прогнан ===
