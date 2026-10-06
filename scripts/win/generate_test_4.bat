@echo off
rem Шард 4/10 offline-генератора сигналов (generate-signals.mjs: messages.jsonl -> signals.jsonl
rem через LLM, без backtest-kit), хронологически. Запуск из корня репо:
rem   scripts\win\generate_test_4.bat
rem Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

call node .\content\feb_2023\generate-signals.mjs
call node .\content\mar_2023\generate-signals.mjs
call node .\content\apr_2023\generate-signals.mjs
call node .\content\may_2023\generate-signals.mjs
call node .\content\jun_2023\generate-signals.mjs
call node .\content\jul_2023\generate-signals.mjs
call node .\content\aug_2023\generate-signals.mjs

echo === generate_test_4: feb_2023..aug_2023 прогнан ===
