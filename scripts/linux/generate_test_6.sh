#!/usr/bin/env bash
# Шард 6/10 offline-генератора сигналов (generate-signals.mjs: messages.jsonl -> signals.jsonl
# через LLM, без backtest-kit), хронологически. Запуск из корня репо:
#   ./scripts/linux/generate_test_6.sh
# Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

node ./content/apr_2024/scripts/generate-signals.mjs
node ./content/may_2024/scripts/generate-signals.mjs
node ./content/jun_2024/scripts/generate-signals.mjs
node ./content/jul_2024/scripts/generate-signals.mjs
node ./content/aug_2024/scripts/generate-signals.mjs
node ./content/sep_2024/scripts/generate-signals.mjs

echo "=== generate_test_6: apr_2024..sep_2024 прогнан ==="
