@echo off
rem Скачивание messages.jsonl (сырые посты канала) - 65 из 65 месяцев - из HuggingFace-датасета tripolskypetr/telegram-trading-channel-dump в content\<mon>_<year>\assets\, хронологически. Запуск из корня репо:
rem   scripts\win\fetch_messages.bat
rem Без остановки при сбое - упавший месяц не прерывает остальные; файлы перезаписываются.

call curl -L --fail --create-dirs -o .\content\may_2021\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/may_2021/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\jun_2021\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/jun_2021/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\jul_2021\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/jul_2021/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\aug_2021\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/aug_2021/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\sep_2021\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/sep_2021/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\oct_2021\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/oct_2021/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\nov_2021\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/nov_2021/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\dec_2021\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/dec_2021/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\jan_2022\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/jan_2022/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\feb_2022\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/feb_2022/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\mar_2022\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/mar_2022/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\apr_2022\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/apr_2022/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\may_2022\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/may_2022/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\jun_2022\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/jun_2022/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\jul_2022\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/jul_2022/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\aug_2022\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/aug_2022/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\sep_2022\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/sep_2022/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\oct_2022\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/oct_2022/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\nov_2022\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/nov_2022/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\dec_2022\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/dec_2022/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\jan_2023\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/jan_2023/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\feb_2023\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/feb_2023/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\mar_2023\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/mar_2023/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\apr_2023\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/apr_2023/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\may_2023\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/may_2023/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\jun_2023\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/jun_2023/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\jul_2023\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/jul_2023/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\aug_2023\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/aug_2023/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\sep_2023\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/sep_2023/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\oct_2023\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/oct_2023/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\nov_2023\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/nov_2023/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\dec_2023\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/dec_2023/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\jan_2024\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/jan_2024/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\feb_2024\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/feb_2024/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\mar_2024\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/mar_2024/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\apr_2024\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/apr_2024/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\may_2024\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/may_2024/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\jun_2024\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/jun_2024/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\jul_2024\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/jul_2024/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\aug_2024\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/aug_2024/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\sep_2024\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/sep_2024/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\oct_2024\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/oct_2024/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\nov_2024\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/nov_2024/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\dec_2024\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/dec_2024/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\jan_2025\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/jan_2025/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\feb_2025\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/feb_2025/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\mar_2025\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/mar_2025/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\apr_2025\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/apr_2025/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\may_2025\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/may_2025/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\jun_2025\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/jun_2025/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\jul_2025\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/jul_2025/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\aug_2025\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/aug_2025/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\sep_2025\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/sep_2025/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\oct_2025\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/oct_2025/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\nov_2025\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/nov_2025/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\dec_2025\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/dec_2025/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\jan_2026\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/jan_2026/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\feb_2026\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/feb_2026/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\mar_2026\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/mar_2026/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\apr_2026\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/apr_2026/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\may_2026\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/may_2026/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\jun_2026\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/jun_2026/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\jul_2026\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/jul_2026/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\aug_2026\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/aug_2026/assets/messages.jsonl
call curl -L --fail --create-dirs -o .\content\sep_2026\assets\messages.jsonl https://huggingface.co/datasets/tripolskypetr/telegram-trading-channel-dump/resolve/main/content/sep_2026/assets/messages.jsonl

echo === fetch_messages: may_2021..sep_2026 скачан ===
