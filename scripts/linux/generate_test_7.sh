#!/usr/bin/env bash
# Шард 7/10 offline-генератора сигналов (generate-signals.mjs: messages.jsonl -> signals.jsonl
# через LLM, без backtest-kit), хронологически. Запуск из корня репо:
#   ./scripts/linux/generate_test_7.sh
# Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

node ./content/oct_2024/scripts/generate-signals.mjs
node ./content/nov_2024/scripts/generate-signals.mjs
node ./content/dec_2024/scripts/generate-signals.mjs
node ./content/jan_2025/scripts/generate-signals.mjs
node ./content/feb_2025/scripts/generate-signals.mjs
node ./content/mar_2025/scripts/generate-signals.mjs

echo "=== generate_test_7: oct_2024..mar_2025 прогнан ==="
