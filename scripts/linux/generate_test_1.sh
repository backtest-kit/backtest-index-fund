#!/usr/bin/env bash
# Шард 1/10 offline-генератора сигналов (generate-signals.mjs: messages.jsonl -> signals.jsonl
# через LLM, без backtest-kit), хронологически. Запуск из корня репо:
#   ./scripts/linux/generate_test_1.sh
# Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

node ./content/may_2021/scripts/generate-signals.mjs
node ./content/jun_2021/scripts/generate-signals.mjs
node ./content/jul_2021/scripts/generate-signals.mjs
node ./content/aug_2021/scripts/generate-signals.mjs
node ./content/sep_2021/scripts/generate-signals.mjs
node ./content/oct_2021/scripts/generate-signals.mjs
node ./content/nov_2021/scripts/generate-signals.mjs

echo "=== generate_test_1: may_2021..nov_2021 прогнан ==="
