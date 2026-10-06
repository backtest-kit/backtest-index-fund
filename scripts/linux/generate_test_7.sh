#!/usr/bin/env bash
# Шард 7/10 бэктеста (@backtest-kit/cli: main.test.ts, сигналы из assets/signals.jsonl), хронологически. Запуск из корня репо:
#   ./scripts/linux/generate_test_7.sh
# Без остановки при сбое - упавший месяц не прерывает остальные; скрипты резюмятся.

node ./node_modules/@backtest-kit/cli/build/index.mjs --backtest --entry ./content/oct_2024/main.test.ts
node ./node_modules/@backtest-kit/cli/build/index.mjs --backtest --entry ./content/nov_2024/main.test.ts
node ./node_modules/@backtest-kit/cli/build/index.mjs --backtest --entry ./content/dec_2024/main.test.ts
node ./node_modules/@backtest-kit/cli/build/index.mjs --backtest --entry ./content/jan_2025/main.test.ts
node ./node_modules/@backtest-kit/cli/build/index.mjs --backtest --entry ./content/feb_2025/main.test.ts
node ./node_modules/@backtest-kit/cli/build/index.mjs --backtest --entry ./content/mar_2025/main.test.ts

echo "=== generate_test_7: oct_2024..mar_2025 прогнан ==="
