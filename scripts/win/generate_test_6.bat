@echo off
rem Шард 6/10 offline-генератора сигналов (generate-signals.mjs: messages.jsonl -> signals.jsonl
rem через LLM, без backtest-kit), хронологически. Запуск из корня репо:
rem   scripts\win\generate_test_6.bat
rem Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

call node .\content\apr_2024\generate-signals.mjs
call node .\content\may_2024\generate-signals.mjs
call node .\content\jun_2024\generate-signals.mjs
call node .\content\jul_2024\generate-signals.mjs
call node .\content\aug_2024\generate-signals.mjs
call node .\content\sep_2024\generate-signals.mjs

echo === generate_test_6: apr_2024..sep_2024 прогнан ===
