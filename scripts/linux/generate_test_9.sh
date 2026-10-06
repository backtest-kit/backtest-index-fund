#!/usr/bin/env bash
# Шард 9/10 offline-генератора сигналов (generate-signals.mjs: messages.jsonl -> signals.jsonl
# через LLM, без backtest-kit), хронологически. Запуск из корня репо:
#   ./scripts/linux/generate_test_9.sh
# Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

node ./content/oct_2025/scripts/generate-signals.mjs
node ./content/nov_2025/scripts/generate-signals.mjs
node ./content/dec_2025/scripts/generate-signals.mjs
node ./content/jan_2026/scripts/generate-signals.mjs
node ./content/feb_2026/scripts/generate-signals.mjs
node ./content/mar_2026/scripts/generate-signals.mjs

echo "=== generate_test_9: oct_2025..mar_2026 прогнан ==="
