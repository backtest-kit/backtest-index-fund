#!/usr/bin/env bash
# Шард 5/10 offline-генератора сигналов (generate-signals.mjs: messages.jsonl -> signals.jsonl
# через LLM, без backtest-kit), хронологически. Запуск из корня репо:
#   ./scripts/linux/generate_test_5.sh
# Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

node ./content/sep_2023/scripts/generate-signals.mjs
node ./content/oct_2023/scripts/generate-signals.mjs
node ./content/nov_2023/scripts/generate-signals.mjs
node ./content/dec_2023/scripts/generate-signals.mjs
node ./content/jan_2024/scripts/generate-signals.mjs
node ./content/feb_2024/scripts/generate-signals.mjs
node ./content/mar_2024/scripts/generate-signals.mjs

echo "=== generate_test_5: sep_2023..mar_2024 прогнан ==="
