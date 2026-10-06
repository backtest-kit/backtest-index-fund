@echo off
rem Шард 10/10 offline-генератора сигналов (generate-signals.mjs: messages.jsonl -> signals.jsonl
rem через LLM, без backtest-kit), хронологически. Запуск из корня репо:
rem   scripts\win\generate_test_10.bat
rem Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

call node .\content\apr_2026\generate-signals.mjs
call node .\content\may_2026\generate-signals.mjs
call node .\content\jun_2026\generate-signals.mjs
call node .\content\jul_2026\generate-signals.mjs
call node .\content\aug_2026\generate-signals.mjs
call node .\content\sep_2026\generate-signals.mjs

echo === generate_test_10: apr_2026..sep_2026 прогнан ===
