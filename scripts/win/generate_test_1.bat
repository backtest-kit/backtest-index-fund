@echo off
rem Шард 1/10 offline-генератора сигналов (generate-signals.mjs: messages.jsonl -> signals.jsonl
rem через LLM, без backtest-kit), хронологически. Запуск из корня репо:
rem   scripts\win\generate_test_1.bat
rem Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

call node .\content\may_2021\generate-signals.mjs
call node .\content\jun_2021\generate-signals.mjs
call node .\content\jul_2021\generate-signals.mjs
call node .\content\aug_2021\generate-signals.mjs
call node .\content\sep_2021\generate-signals.mjs
call node .\content\oct_2021\generate-signals.mjs
call node .\content\nov_2021\generate-signals.mjs

echo === generate_test_1: may_2021..nov_2021 прогнан ===
