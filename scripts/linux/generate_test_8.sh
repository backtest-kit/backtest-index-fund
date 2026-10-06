#!/usr/bin/env bash
# Шард 8/10 offline-генератора сигналов (generate-signals.mjs: messages.jsonl -> signals.jsonl
# через LLM, без backtest-kit), хронологически. Запуск из корня репо:
#   ./scripts/linux/generate_test_8.sh
# Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

node ./content/apr_2025/scripts/generate-signals.mjs
node ./content/may_2025/scripts/generate-signals.mjs
node ./content/jun_2025/scripts/generate-signals.mjs
node ./content/jul_2025/scripts/generate-signals.mjs
node ./content/aug_2025/scripts/generate-signals.mjs
node ./content/sep_2025/scripts/generate-signals.mjs

echo "=== generate_test_8: apr_2025..sep_2025 прогнан ==="
