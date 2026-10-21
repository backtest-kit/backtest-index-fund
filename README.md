<img src="https://github.com/tripolskypetr/backtest-kit/raw/refs/heads/master/assets/consciousness.svg" height="45px" align="right">

# 🧿 backtest-dividend-capture

> Dividend capture on the Tashkent stock exchange (UzSE), built on [backtest-kit](https://github.com/tripolskypetr/backtest-kit): a share is bought ten days before the shareholders' meeting that decides a dividend worth at least 8% of the price, held through the decision, which credits the dividend to the position through `commitDividend`, and sold five days later. Position size is capped by the share's own turnover, idle capital earns the soum deposit rate. One folder per year, no shared code between years, daily bars and the dividend table taken from the exchange's own site, no API key, no broker connection.

![screenshot](https://raw.githubusercontent.com/tripolskypetr/backtest-kit/HEAD/assets/screenshots/screenshot16.png)

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/tripolskypetr/backtest-kit)
[![npm](https://img.shields.io/npm/v/backtest-kit.svg?style=flat-square)](https://npmjs.org/package/backtest-kit)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)]()
[![Build](https://github.com/tripolskypetr/backtest-kit/actions/workflows/webpack.yml/badge.svg)](https://github.com/tripolskypetr/backtest-kit/actions/workflows/webpack.yml)

A frontier stock market is a different animal from a crypto exchange: a handful of names trade every day, the spread on the best of them is a percent or more, a round trip costs more than a month of expected return, and a large share of the total return arrives as a dividend decided once a year by a shareholders' meeting. On UzSE that last fact has a twist: **the price does not fall by the dividend after the decision.** Over the window from ten days before the meeting to five days after it the price moves by a few percent either way while the dividend itself is worth 8–15% of the price, and the holder on the register collects it. This repo is built around that one effect and the constraints that come with it:

- **The universe is every dividend payer that trades.** For year Y the candidates are shares with an issuer in the exchange's dividend table that traded on at least half of the days of Y−1. Nothing from year Y is used to pick them; the size of each position is decided at entry from the share's own turnover.
- **One event, one round trip.** The position opens on the first tick ten days before the decision date, when the dividend yield at the current price is at least 8%, and is closed by the engine's time exit at 23:59 five days after the decision. Two or three weeks in the market per event, the rest of the year the capital sits in a soum deposit, which the summary credits at its rate.
- **Dividends are the trade, not a footnote.** On the decision date the strategy credits `dividend per share × shares` to the position with `commitDividend`. The engine folds it into `pnlCost` and `pnlPercentage`, publishes it as `pnlDividends`, and never lets it touch the stop or the take-profit.
- **Size follows liquidity.** A position is the smaller of a third of the deposit and a quarter of the share's median daily turnover accumulated over the ten entry days. The effect lives in semi-liquid names, and a position that cannot be bought and sold inside the window does not exist.
- **The exchange's own data, cached forever.** Daily bars come from the exchange's Excel export (one job per share, rate limited, downloaded once into a persistent cache through a `.part` file), the dividend table from the exchange's dividends page. Both live in `classes/` next to the strategy.

📚 **[API Reference](https://backtest-kit.github.io/documents/example_02_first_backtest.html)** | 🌟 **[Quick Start](https://github.com/tripolskypetr/backtest-kit/tree/master/example)** | 📰 **[Article](https://backtest-kit.github.io/documents/article_08_ai_liquidity_harvesting.html)**


## 🚀 Quick Start

**1. Install** (every store is an in-memory dummy in `config/setup.config.ts`, a backtest needs no database):

```bash
npm install
```

**2. Run one year** (the frame and the exchange adapter live next to the strategy, in [content/2021/modules/backtest.module.ts](content/2021/modules/backtest.module.ts)):

```bash
npm start -- --backtest --ui --entry ./content/2021/main.strategy.ts
```

The first run of a share orders its Excel export from the exchange. The exchange allows a few exports per half hour and the class waits out the limit it is told about, so a cold start of a five-name year can take an hour; every later run reads the cached file.

**3. Run every year** in chronological order, one engine process per year:

```bash
bash scripts/linux/run_strategy.sh      # scripts/win/run_strategy.bat on Windows
```

Each year writes `content/<year>/dump/report/backtest.jsonl` with the `opened` and `closed` rows and `strategy.jsonl` with one `dividend` row per credited decision. `node scripts/common/summarize_reports.mjs` folds all years into one table: net result, the part that came from prices and the part that came from dividends, the estimated cost of the round trips, the same result in dollars at the soum rate of the year, and every close that was not the time exit.


## 📐 How the Fund Works

The whole strategy is one file per year, [content/2021/main.strategy.ts](content/2021/main.strategy.ts) being the reference the others are stamped from. Reading it top to bottom:

### The costs

`setConfig` in `config/loader.config.ts` sets the engine's fee to 0.15% and slippage to 0.5% per transaction, i.e. 1.3% per round trip, and raises the minimum take-profit distance so that the engine's validator accepts them. `config/setup.config.ts` switches every persistence adapter to its in-memory dummy, so a backtest needs no database and the process ends by itself when the last symbol reaches the end of the frame. These are the numbers for a liquid UzSE share bought and sold at market inside the spread; the HOWTO explains where they come from and how to change them for your broker's tariff.

### The universe

The block between `// BASKET:BEGIN` and `// BASKET:END` is the list of tickers for the year, the block between `// ISSUERS:BEGIN` and `// ISSUERS:END` maps each ticker to the issuer's id in the exchange's dividend table (preferred shares, ticker suffix `P`, take the preferred dividend of the same issuer). Both are generated from [scripts/common/universe.json](scripts/common/universe.json) and [scripts/common/uzse_issuers.json](scripts/common/uzse_issuers.json) and are the only thing that differs between the strategies of two years.

### The entry

On every hourly tick `getSignal` asks the dividend class for the issuer's next decision within the ten-day horizon. If there is one and `dividend per share / current price` is at least 8%, it reads the last twenty daily bars through `getCandles`, takes the median of `close × volume` as the daily turnover, and sizes the position as the smaller of a third of the deposit and a quarter of that turnover times the ten entry days. Positions under 200 000 soum are not opened. `minuteEstimatedTime` runs to 23:59 five days after the decision. The stop at −50% and the take-profit at +2000% exist only to satisfy the validator.

### The dividend

A top-level `listenActivePing` subscription fires on every engine step for every open position. For the position's issuer it asks the dividend class for every decision dated on or before the current engine time, skips the ones taken before the position was opened and the ones already credited for this position and fiscal year, and commits the rest. The exchange publishes the decision date, not the record date, and the backtest treats the decision date and the dividend amount as known ten days in advance, which in reality is the meeting notice with the board's proposal; the HOWTO lists both among the known approximations.


## 🗂 One Folder Per Year, By Construction

`content/<yyyy>/` is a calendar year and is self-contained: the strategy, both data classes and the exchange adapter with the year's frame. There is no shared module between years, which is a rule of this repo rather than an omission. A backtest should be reproducible from the folder alone, years must never influence each other through a refactor, and the reference year is the only place where the strategy is edited by hand:

| Path | Role |
|---|---|
| `main.strategy.ts` | the strategy: deposit and slot size, entry and exit window, yield threshold, liquidity sizing, dividend crediting |
| `classes/UzSE.ts` | daily bars of a share from the exchange's Excel export, ticker → ISIN by the exchange's own list, persistent cache with `.part` downloads, waits out the export rate limit; compatible with `getCandlesFilled` / `getCandlesSampled` as a fetcher |
| `classes/UzSEDividends.ts` | the exchange's dividend table (decision date, dividend per common and preferred share, payout window) cached once, queried as "decisions known at `when`" and "decisions due within the horizon" |
| `modules/backtest.module.ts` | the exchange schema (`getCandlesSampled` over `UzSE.getCandles`), the year's frame |

The generator in [scripts/common/generate_months.mjs](scripts/common/generate_months.mjs) copies the reference folder into every finished year and substitutes exactly three things: the basket and issuer blocks in the strategy and the frame in the module. It also rewrites the two runner scripts so that they always list every year on disk.


## 📊 Data: Daily Bars Driving a Minute Engine

The engine simulates positions on minute candles and asks the exchange adapter for them. The exchange publishes daily bars. The adapter bridges the two with backtest-kit's own tools:

- every request goes through `getCandlesSampled`; a `1d` request is handed to `getCandlesFilled`, which puts the bars on a continuous calendar grid and repairs weekends, holidays and anomalous bars (zero closes on days without trades) with a flat bar from the neighbouring closes, and anything shorter repeats the repaired daily bar across its minutes or hours;
- `config/loader.config.ts` sets `CC_BACKTEST_STEP_MINUTES` to a full day, so the engine evaluates each position once per daily bar; `config/setup.config.ts` keeps candles and every other store in memory.

The accepted trade-off: every minute of a day carries that day's high, low and close. For a time exit five days after the decision this does not matter; for the −50% stop it means the stop fires on the day's low.

The exchange's series are not adjusted for splits. [scripts/common/build_universe.mjs](scripts/common/build_universe.mjs) flags a close-to-close jump of ×1.8 or ×0.55 between two traded days as a split and keeps that share out of the basket for that year; the HOWTO lists the cases it caught.

The summary in [scripts/common/summarize_reports.mjs](scripts/common/summarize_reports.mjs) rebuilds the deployed capital day by day from the opened and closed rows, credits the idle remainder at the soum deposit rate, flags days when concurrent events would have needed more than the deposit, and prints the result against a deposit-only year.


## 🧭 Design Rules of This Repo

- **Copy-paste over abstraction.** Years are stamped, not imported. A refactor must not be able to change the result of a year that already ran.
- **Engine parameters in one place.** Costs, the daily step and the validator distances live in `config/loader.config.ts`, shared by every year; the exchange module registers schemas only, the strategy holds the fund's own constants.
- **Constants describe the process, not the outcome.** Ten days before the meeting is the notice period the law requires, five days after is when the register effect has played out, 8% is where the dividend outweighs the spread, a quarter of daily turnover is what a position can take without moving the price. None of them is tuned to a PnL curve, and the README does not quote one.
- **Every approximation is written down.** [docs/HOWTO.md](docs/HOWTO.md) is the operating manual: prerequisites, the universe build, the issuer map, how to change the strategy (edit the reference year, regenerate), and the list of known gaps: decision date instead of record date, the meeting and its dividend taken as known ten days ahead, daily-bar sampling, market execution inside wide spreads, unadjusted splits, per-symbol accounting with a fixed deposit.


## 📜 Summary

| Aspect | This repo |
|---|---|
| **Subject** | Long-only dividend capture around shareholders' meetings on UzSE, replayed year by year |
| **Universe** | Every share with an issuer in the exchange's dividend table that traded on half of the days of the previous year; frozen per year, no survivorship |
| **Cycle** | Entry ten days before a decision with a dividend yield of 8% or more, time exit five days after it, size capped by turnover, idle capital at the deposit rate |
| **Dividends** | The decision the position was opened for is credited with `commitDividend` on its decision date |
| **Costs** | 0.15% fee and 0.5% slippage per side, set once in `config/loader.config.ts` |
| **Data** | Exchange Excel exports and dividend table, cached once, sampled to minutes by `getCandlesSampled`, one engine step per day |
| **Layout** | Self-contained year folders generated from one reference year; universe builder, issuer map and summary in `scripts/common/` |
| **Honesty budget** | Decision date for record date, meeting known ten days ahead, synthetic intraday path, market execution in wide spreads, unadjusted splits excluded by rule; all documented in `docs/HOWTO.md` |
