#!/usr/bin/env bash
# Шард 10/10 бэктеста (@backtest-kit/cli: main.test.ts, сигналы из assets/signals.jsonl), хронологически. Запуск из корня репо:
#   ./scripts/linux/generate_test_10.sh
# Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

node ./node_modules/@backtest-kit/cli/build/index.mjs --backtest --entry ./content/apr_2026/main.test.ts
node ./node_modules/@backtest-kit/cli/build/index.mjs --backtest --entry ./content/may_2026/main.test.ts
node ./node_modules/@backtest-kit/cli/build/index.mjs --backtest --entry ./content/jun_2026/main.test.ts
node ./node_modules/@backtest-kit/cli/build/index.mjs --backtest --entry ./content/jul_2026/main.test.ts
node ./node_modules/@backtest-kit/cli/build/index.mjs --backtest --entry ./content/aug_2026/main.test.ts
node ./node_modules/@backtest-kit/cli/build/index.mjs --backtest --entry ./content/sep_2026/main.test.ts

echo "=== generate_test_10: apr_2026..sep_2026 прогнан ==="
