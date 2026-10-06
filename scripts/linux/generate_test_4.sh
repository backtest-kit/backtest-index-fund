#!/usr/bin/env bash
# Шард 4/10 offline-генератора сигналов (generate-signals.mjs: messages.jsonl -> signals.jsonl
# через LLM, без backtest-kit), хронологически. Запуск из корня репо:
#   ./scripts/linux/generate_test_4.sh
# Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

node ./content/feb_2023/scripts/generate-signals.mjs
node ./content/mar_2023/scripts/generate-signals.mjs
node ./content/apr_2023/scripts/generate-signals.mjs
node ./content/may_2023/scripts/generate-signals.mjs
node ./content/jun_2023/scripts/generate-signals.mjs
node ./content/jul_2023/scripts/generate-signals.mjs
node ./content/aug_2023/scripts/generate-signals.mjs

echo "=== generate_test_4: feb_2023..aug_2023 прогнан ==="
