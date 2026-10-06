#!/usr/bin/env bash
# Шард 9/10 бэктеста (@backtest-kit/cli: main.test.ts, сигналы из assets/signals.jsonl), хронологически. Запуск из корня репо:
#   ./scripts/linux/generate_test_9.sh
# Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

node ./node_modules/@backtest-kit/cli/build/index.mjs --backtest --entry ./content/oct_2025/main.test.ts
node ./node_modules/@backtest-kit/cli/build/index.mjs --backtest --entry ./content/nov_2025/main.test.ts
node ./node_modules/@backtest-kit/cli/build/index.mjs --backtest --entry ./content/dec_2025/main.test.ts
node ./node_modules/@backtest-kit/cli/build/index.mjs --backtest --entry ./content/jan_2026/main.test.ts
node ./node_modules/@backtest-kit/cli/build/index.mjs --backtest --entry ./content/feb_2026/main.test.ts
node ./node_modules/@backtest-kit/cli/build/index.mjs --backtest --entry ./content/mar_2026/main.test.ts

echo "=== generate_test_9: oct_2025..mar_2026 прогнан ==="
