#!/usr/bin/env bash
# Шард 2/10 offline-генератора сигналов (generate-signals.mjs: messages.jsonl -> signals.jsonl
# через LLM, без backtest-kit), хронологически. Запуск из корня репо:
#   ./scripts/linux/generate_test_2.sh
# Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

node ./content/dec_2021/scripts/generate-signals.mjs
node ./content/jan_2022/scripts/generate-signals.mjs
node ./content/feb_2022/scripts/generate-signals.mjs
node ./content/mar_2022/scripts/generate-signals.mjs
node ./content/apr_2022/scripts/generate-signals.mjs
node ./content/may_2022/scripts/generate-signals.mjs
node ./content/jun_2022/scripts/generate-signals.mjs

echo "=== generate_test_2: dec_2021..jun_2022 прогнан ==="
