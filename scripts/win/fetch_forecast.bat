@echo off
rem Скачивание signals.jsonl из HuggingFace-датасета tripolskypetr/market-forecasting-dataset в assets\ корня репо. Запуск из корня репо:
rem   scripts\win\fetch_forecast.bat
rem Файл перезаписывается.

call curl -L --fail --create-dirs -o .\assets\signals.jsonl https://huggingface.co/datasets/tripolskypetr/market-forecasting-dataset/resolve/main/assets/signals.jsonl

echo === fetch_forecast: assets\signals.jsonl скачан ===
