#!/usr/bin/env bash
# Шард 3/10 offline-генератора сигналов (generate-signals.mjs: messages.jsonl -> signals.jsonl
# через LLM, без backtest-kit), хронологически. Запуск из корня репо:
#   ./scripts/linux/generate_test_3.sh
# Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

node ./content/jul_2022/scripts/generate-signals.mjs
node ./content/aug_2022/scripts/generate-signals.mjs
node ./content/sep_2022/scripts/generate-signals.mjs
node ./content/oct_2022/scripts/generate-signals.mjs
node ./content/nov_2022/scripts/generate-signals.mjs
node ./content/dec_2022/scripts/generate-signals.mjs
node ./content/jan_2023/scripts/generate-signals.mjs

echo "=== generate_test_3: jul_2022..jan_2023 прогнан ==="
