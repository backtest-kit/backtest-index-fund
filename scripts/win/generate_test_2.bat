@echo off
rem Шард 2/10 offline-генератора сигналов (generate-signals.mjs: messages.jsonl -> signals.jsonl
rem через LLM, без backtest-kit), хронологически. Запуск из корня репо:
rem   scripts\win\generate_test_2.bat
rem Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

call node .\content\dec_2021\generate-signals.mjs
call node .\content\jan_2022\generate-signals.mjs
call node .\content\feb_2022\generate-signals.mjs
call node .\content\mar_2022\generate-signals.mjs
call node .\content\apr_2022\generate-signals.mjs
call node .\content\may_2022\generate-signals.mjs
call node .\content\jun_2022\generate-signals.mjs

echo === generate_test_2: dec_2021..jun_2022 прогнан ===
