@echo off
rem Полный прогон (все 65 месяцев) offline-генератора сигналов (generate-signals.mjs: messages.jsonl -> signals.jsonl
rem через LLM, без backtest-kit), хронологически. Запуск из корня репо:
rem   scripts\win\generate_test_all.bat
rem Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

call node .\content\may_2021\generate-signals.mjs
call node .\content\jun_2021\generate-signals.mjs
call node .\content\jul_2021\generate-signals.mjs
call node .\content\aug_2021\generate-signals.mjs
call node .\content\sep_2021\generate-signals.mjs
call node .\content\oct_2021\generate-signals.mjs
call node .\content\nov_2021\generate-signals.mjs
call node .\content\dec_2021\generate-signals.mjs
call node .\content\jan_2022\generate-signals.mjs
call node .\content\feb_2022\generate-signals.mjs
call node .\content\mar_2022\generate-signals.mjs
call node .\content\apr_2022\generate-signals.mjs
call node .\content\may_2022\generate-signals.mjs
call node .\content\jun_2022\generate-signals.mjs
call node .\content\jul_2022\generate-signals.mjs
call node .\content\aug_2022\generate-signals.mjs
call node .\content\sep_2022\generate-signals.mjs
call node .\content\oct_2022\generate-signals.mjs
call node .\content\nov_2022\generate-signals.mjs
call node .\content\dec_2022\generate-signals.mjs
call node .\content\jan_2023\generate-signals.mjs
call node .\content\feb_2023\generate-signals.mjs
call node .\content\mar_2023\generate-signals.mjs
call node .\content\apr_2023\generate-signals.mjs
call node .\content\may_2023\generate-signals.mjs
call node .\content\jun_2023\generate-signals.mjs
call node .\content\jul_2023\generate-signals.mjs
call node .\content\aug_2023\generate-signals.mjs
call node .\content\sep_2023\generate-signals.mjs
call node .\content\oct_2023\generate-signals.mjs
call node .\content\nov_2023\generate-signals.mjs
call node .\content\dec_2023\generate-signals.mjs
call node .\content\jan_2024\generate-signals.mjs
call node .\content\feb_2024\generate-signals.mjs
call node .\content\mar_2024\generate-signals.mjs
call node .\content\apr_2024\generate-signals.mjs
call node .\content\may_2024\generate-signals.mjs
call node .\content\jun_2024\generate-signals.mjs
call node .\content\jul_2024\generate-signals.mjs
call node .\content\aug_2024\generate-signals.mjs
call node .\content\sep_2024\generate-signals.mjs
call node .\content\oct_2024\generate-signals.mjs
call node .\content\nov_2024\generate-signals.mjs
call node .\content\dec_2024\generate-signals.mjs
call node .\content\jan_2025\generate-signals.mjs
call node .\content\feb_2025\generate-signals.mjs
call node .\content\mar_2025\generate-signals.mjs
call node .\content\apr_2025\generate-signals.mjs
call node .\content\may_2025\generate-signals.mjs
call node .\content\jun_2025\generate-signals.mjs
call node .\content\jul_2025\generate-signals.mjs
call node .\content\aug_2025\generate-signals.mjs
call node .\content\sep_2025\generate-signals.mjs
call node .\content\oct_2025\generate-signals.mjs
call node .\content\nov_2025\generate-signals.mjs
call node .\content\dec_2025\generate-signals.mjs
call node .\content\jan_2026\generate-signals.mjs
call node .\content\feb_2026\generate-signals.mjs
call node .\content\mar_2026\generate-signals.mjs
call node .\content\apr_2026\generate-signals.mjs
call node .\content\may_2026\generate-signals.mjs
call node .\content\jun_2026\generate-signals.mjs
call node .\content\jul_2026\generate-signals.mjs
call node .\content\aug_2026\generate-signals.mjs
call node .\content\sep_2026\generate-signals.mjs

echo === generate_test_all: may_2021..sep_2026 прогнан ===
