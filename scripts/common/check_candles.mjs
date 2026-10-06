import ccxt from "ccxt";
import { appendFileSync, writeFileSync } from "fs";

// Проверка минутных свечей Binance spot на непрерывность (без пропусков)
// по символам из symbolList каждого месяца и диапазонам его фрейма.
// Запуск из корня репо: node ./scripts/common/check_candles.mjs [report.txt]

const OUT = process.argv[2] ?? "./candle-report.txt";
const MINUTE = 60_000;

const MONTHS = [
  { month: "apr_2022", start: "2022-04-01T00:00:00Z", end: "2022-05-01T23:59:59Z", symbols: ["CELOUSDT", "XLMUSDT", "XMRUSDT", "ZRXUSDT"] },
  { month: "apr_2023", start: "2023-04-01T00:00:00Z", end: "2023-05-01T23:59:59Z", symbols: ["BALUSDT", "BLZUSDT", "CELOUSDT", "CFXUSDT", "CRVUSDT", "CTSIUSDT", "DOTUSDT", "ENSUSDT", "ETHUSDT", "GRTUSDT", "HOTUSDT", "IMXUSDT", "JOEUSDT", "KSMUSDT", "LINAUSDT", "LPTUSDT", "REEFUSDT", "ROSEUSDT", "SUSHIUSDT", "UNFIUSDT", "WOOUSDT", "ZILUSDT"] },
  { month: "apr_2024", start: "2024-04-01T00:00:00Z", end: "2024-05-01T23:59:59Z", symbols: ["AGIXUSDT", "APEUSDT", "BNBUSDT", "CFXUSDT", "CHRUSDT", "CHZUSDT", "EOSUSDT", "FETUSDT", "HBARUSDT", "IDEXUSDT", "JASMYUSDT", "LPTUSDT", "MKRUSDT", "NEARUSDT", "ONEUSDT", "QNTUSDT", "RLCUSDT", "ROSEUSDT", "SOLUSDT", "TLMUSDT", "TRXUSDT"] },
  { month: "apr_2025", start: "2025-04-01T00:00:00Z", end: "2025-05-01T23:59:59Z", symbols: ["1000WHYUSDT", "1000XUSDT", "BANANAUSDT", "BTCUSDT", "CELRUSDT", "HIVEUSDT", "LEVERUSDT", "ONDOUSDT", "QTUMUSDT", "RAREUSDT", "SLERFUSDT", "SOLUSDT", "STORJUSDT", "WHYUSDT", "XVGUSDT"] },
  { month: "apr_2026", start: "2026-04-01T00:00:00Z", end: "2026-05-01T23:59:59Z", symbols: ["CHILLGUYUSDT"] },
  { month: "aug_2021", start: "2021-08-01T00:00:00Z", end: "2021-09-01T23:59:59Z", symbols: ["ANKRUSDT", "BLZUSDT", "CTKUSDT", "ETHUSDT", "FLMUSDT", "GRTUSDT", "LONGUSDT", "ONEUSDT", "SOLUSDT", "ZRXUSDT"] },
  { month: "aug_2022", start: "2022-08-01T00:00:00Z", end: "2022-09-01T23:59:59Z", symbols: ["1INCHUSDT", "ADAUSDT", "AUDIOUSDT", "BNBUSDT", "DENTUSDT", "EGLDUSDT", "ENJUSDT", "JASMYUSDT", "MKRUSDT", "NEARUSDT", "RENUSDT", "THETAUSDT", "XRPUSDT", "ZRXUSDT"] },
  { month: "aug_2023", start: "2023-08-01T00:00:00Z", end: "2023-09-01T23:59:59Z", symbols: ["1000SHIBUSDT", "APEUSDT", "AUDIOUSDT", "AVAUSDT", "AVAXUSDT", "BLZUSDT", "C98USDT", "CKBUSDT", "DUSKUSDT", "DYDXUSDT", "EDUUSDT", "EOSUSDT", "ICXUSDT", "JASMYUSDT", "KAVAUSDT", "KLAYUSDT", "LTCUSDT", "LUNA2USDT", "MANAUSDT", "MATICUSDT", "OCEANUSDT", "ONTUSDT", "ROSEUSDT", "RSRUSDT", "SFPUSDT", "SHIBUSDT", "SNXUSDT", "THETAUSDT", "XTZUSDT"] },
  { month: "aug_2024", start: "2024-08-01T00:00:00Z", end: "2024-09-01T23:59:59Z", symbols: ["ALGOUSDT", "BCHUSDT", "BLZUSDT", "CRVUSDT", "ETHUSDT", "FLOKIUSDT", "IOTXUSDT", "JASMYUSDT", "LITUSDT", "TLMUSDT", "ZENUSDT"] },
  { month: "aug_2025", start: "2025-08-01T00:00:00Z", end: "2025-09-01T23:59:59Z", symbols: ["ACXUSDT", "ADAUSDT", "AIUSDT", "ALPHAUSDT", "ARBUSDT", "AXLUSDT", "BDXNUSDT", "BRETTUSDT", "CELRUSDT", "COMPUSDT", "DFUSDT", "ENAUSDT", "GEMUSDT", "HEIUSDT", "IMXUSDT", "KNCUSDT", "MLNUSDT", "MORPHOUSDT", "OBOLUSDT", "OMUSDT", "SANTOSUSDT", "SNXUSDT", "TRXUSDT", "USTCUSDT", "VETUSDT", "XLMUSDT", "ZECUSDT"] },
  { month: "aug_2026", start: "2026-08-01T00:00:00Z", end: "2026-09-01T23:59:59Z", symbols: ["ALTUSDT", "ANKRUSDT", "BNBUSDT", "EGLDUSDT", "ETHUSDT", "KSMUSDT", "MEWUSDT", "SUSHIUSDT", "VELODROMEUSDT"] },
  { month: "dec_2021", start: "2021-12-01T00:00:00Z", end: "2022-01-01T23:59:59Z", symbols: ["ADAUSDT", "ATOMUSDT", "AVAXUSDT", "BNBUSDT", "LRCUSDT", "QTUMUSDT", "SOLUSDT", "VETUSDT"] },
  { month: "dec_2022", start: "2022-12-01T00:00:00Z", end: "2023-01-01T23:59:59Z", symbols: ["ANTUSDT", "DGBUSDT", "ENSUSDT", "IOSTUSDT", "KAVAUSDT", "UNIUSDT"] },
  { month: "dec_2023", start: "2023-12-01T00:00:00Z", end: "2024-01-01T23:59:59Z", symbols: ["1INCHUSDT", "AGIXUSDT", "AVAXUSDT", "AXSUSDT", "CHRUSDT", "DEFIUSDT", "DENTUSDT", "DYDXUSDT", "EGLDUSDT", "ETCUSDT", "ETHUSDT", "FLOWUSDT", "LPTUSDT", "LUNA2USDT", "OCEANUSDT", "OPUSDT", "RENUSDT", "SUSHIUSDT", "ZRXUSDT"] },
  { month: "dec_2024", start: "2024-12-01T00:00:00Z", end: "2025-01-01T23:59:59Z", symbols: ["1000PEPEUSDT", "DEGENUSDT", "DOTUSDT", "EIGENUSDT", "ETHUSDT", "HBARUSDT", "LEVERUSDT", "LINKUSDT", "MKRUSDT", "SCRUSDT", "TLMUSDT", "TURBOUSDT", "XRPUSDT"] },
  { month: "dec_2025", start: "2025-12-01T00:00:00Z", end: "2026-01-01T23:59:59Z", symbols: ["ALTUSDT", "AVAUSDT", "AXLUSDT", "CHESSUSDT", "HBARUSDT", "ZROUSDT"] },
  { month: "feb_2022", start: "2022-02-01T00:00:00Z", end: "2022-03-01T23:59:59Z", symbols: ["ALPHAUSDT", "CHRUSDT", "CRVUSDT", "ETHUSDT", "FTMUSDT", "OMGUSDT", "UNFIUSDT"] },
  { month: "feb_2023", start: "2023-02-01T00:00:00Z", end: "2023-03-01T23:59:59Z", symbols: ["GMTUSDT"] },
  { month: "feb_2024", start: "2024-02-01T00:00:00Z", end: "2024-03-01T23:59:59Z", symbols: ["AAVEUSDT", "BANDUSDT", "DOGEUSDT", "DYDXUSDT", "IOTAUSDT", "LINAUSDT", "MTLUSDT", "OCEANUSDT", "ONEUSDT", "RVNUSDT", "SNXUSDT", "WAVESUSDT", "WOOUSDT", "ZENUSDT"] },
  { month: "feb_2025", start: "2025-02-01T00:00:00Z", end: "2025-03-01T23:59:59Z", symbols: ["DEFIUSDT", "ENSUSDT", "RSRUSDT", "SANDUSDT", "SOLUSDT", "XLMUSDT"] },
  { month: "feb_2026", start: "2026-02-01T00:00:00Z", end: "2026-03-01T23:59:59Z", symbols: ["ARKUSDT", "BATUSDT", "DOTUSDT", "FLOWUSDT", "GRTUSDT", "INJUSDT", "IOSTUSDT", "IOTAUSDT", "MORPHOUSDT"] },
  { month: "jan_2022", start: "2022-01-01T00:00:00Z", end: "2022-02-01T23:59:59Z", symbols: ["ATOMUSDT", "BATUSDT", "HNTUSDT", "KAVAUSDT"] },
  { month: "jan_2024", start: "2024-01-01T00:00:00Z", end: "2024-02-01T23:59:59Z", symbols: ["ANKRUSDT", "ATOMUSDT", "AVAXUSDT", "BALUSDT", "BNBUSDT", "CHZUSDT", "CTSIUSDT", "GRTUSDT", "GTCUSDT", "HBARUSDT", "IOTXUSDT", "ROSEUSDT", "RUNEUSDT", "XLMUSDT", "XRPUSDT", "XTZUSDT", "YFIUSDT"] },
  { month: "jan_2025", start: "2025-01-01T00:00:00Z", end: "2025-02-01T23:59:59Z", symbols: ["AAVEUSDT", "BANDUSDT", "EGLDUSDT", "ETHUSDT", "FILUSDT", "HBARUSDT", "ICPUSDT", "LTCUSDT", "MTLUSDT", "REZUSDT", "RUNEUSDT", "XRPUSDT", "ZRXUSDT"] },
  { month: "jan_2026", start: "2026-01-01T00:00:00Z", end: "2026-02-01T23:59:59Z", symbols: ["AIXBTUSDT", "ARCUSDT", "CHRUSDT", "NEARUSDT", "PHAUSDT", "TRBUSDT", "TURBOUSDT", "XMRUSDT"] },
  { month: "jul_2021", start: "2021-07-01T00:00:00Z", end: "2021-08-01T23:59:59Z", symbols: ["AAVEUSDT", "AKROUSDT", "ALPHAUSDT", "AXSUSDT", "BAKEUSDT", "BALUSDT", "BELUSDT", "BLZUSDT", "BNBUSDT", "COMPUSDT", "COTIUSDT", "CTKUSDT", "CVCUSDT", "DODOUSDT", "FLMUSDT", "LRCUSDT", "LUNAUSDT", "MTLUSDT", "NKNUSDT", "OCEANUSDT", "SHORTUSDT", "SKLUSDT", "STMXUSDT", "TROYUSDT"] },
  { month: "jul_2022", start: "2022-07-01T00:00:00Z", end: "2022-08-01T23:59:59Z", symbols: ["ALICEUSDT", "ARUSDT", "LINAUSDT", "THETAUSDT", "UNIUSDT", "XLMUSDT", "XMRUSDT", "XRPUSDT"] },
  { month: "jul_2023", start: "2023-07-01T00:00:00Z", end: "2023-08-01T23:59:59Z", symbols: ["1000XECUSDT", "AGIXUSDT", "ALICEUSDT", "ARPAUSDT", "AUDIOUSDT", "AVAXUSDT", "BLZUSDT", "BNBUSDT", "CELRUSDT", "CFXUSDT", "DEFIUSDT", "IOSTUSDT", "KSMUSDT", "LINAUSDT", "LPTUSDT", "LTCUSDT", "NKNUSDT", "RLCUSDT", "RVNUSDT", "STMXUSDT", "TLMUSDT", "XRPUSDT", "ZENUSDT"] },
  { month: "jul_2024", start: "2024-07-01T00:00:00Z", end: "2024-08-01T23:59:59Z", symbols: ["AAVEUSDT", "ASTRUSDT", "BCHUSDT", "ENSUSDT", "IOTAUSDT", "MTLUSDT", "RUNEUSDT", "SFPUSDT", "YFIUSDT"] },
  { month: "jul_2025", start: "2025-07-01T00:00:00Z", end: "2025-08-01T23:59:59Z", symbols: ["AVAXUSDT", "COSUSDT", "DOTUSDT", "EPICUSDT", "ETCUSDT", "ETHUSDT", "FXSUSDT", "GLMUSDT", "NEIROETHUSDT", "REZUSDT", "SOLUSDT", "STGUSDT", "SUNUSDT", "XAIUSDT"] },
  { month: "jul_2026", start: "2026-07-01T00:00:00Z", end: "2026-08-01T23:59:59Z", symbols: ["1000SATSUSDT", "DASHUSDT", "HFTUSDT", "MORPHOUSDT", "VELODROMEUSDT", "XRPUSDT"] },
  { month: "jun_2021", start: "2021-06-01T00:00:00Z", end: "2021-07-01T23:59:59Z", symbols: ["AVAUSDT", "AXSUSDT", "BANDUSDT", "BATUSDT", "BTCUSDT", "BZRXUSDT", "KNCUSDT", "LTCUSDT", "REEFUSDT", "WABIUSDT"] },
  { month: "jun_2022", start: "2022-06-01T00:00:00Z", end: "2022-07-01T23:59:59Z", symbols: ["BNXUSDT", "GMTUSDT", "HNTUSDT", "MANAUSDT", "PEOPLEUSDT", "SHIBUSDT", "SOLUSDT"] },
  { month: "jun_2023", start: "2023-06-01T00:00:00Z", end: "2023-07-01T23:59:59Z", symbols: ["ANKRUSDT", "APTUSDT", "BANDUSDT", "BNBUSDT", "CHRUSDT", "CHZUSDT", "COMPUSDT", "CTSIUSDT", "DASHUSDT", "ETCUSDT", "GRTUSDT", "GTCUSDT", "LINAUSDT", "MKRUSDT", "NKNUSDT", "OCEANUSDT", "OPUSDT", "PEOPLEUSDT", "QTUMUSDT", "RLCUSDT", "RVNUSDT", "SFPUSDT", "WOOUSDT"] },
  { month: "jun_2024", start: "2024-06-01T00:00:00Z", end: "2024-07-01T23:59:59Z", symbols: ["CKBUSDT", "COTIUSDT", "EDUUSDT", "FETUSDT", "GTCUSDT", "NEOUSDT"] },
  { month: "jun_2025", start: "2025-06-01T00:00:00Z", end: "2025-07-01T23:59:59Z", symbols: ["1000CHEEMSUSDT", "AKTUSDT", "ARKMUSDT", "FXSUSDT", "GOATUSDT", "GRIFFAINUSDT", "GRTUSDT", "PIXELUSDT", "PNUTUSDT", "ROSEUSDT", "SNXUSDT", "VINEUSDT", "XLMUSDT", "ZEREBROUSDT"] },
  { month: "jun_2026", start: "2026-06-01T00:00:00Z", end: "2026-07-01T23:59:59Z", symbols: ["ACEUSDT", "GPSUSDT", "JASMYUSDT", "ONDOUSDT"] },
  { month: "mar_2022", start: "2022-03-01T00:00:00Z", end: "2022-04-01T23:59:59Z", symbols: ["BAKEUSDT", "BCHUSDT", "DASHUSDT", "EOSUSDT", "ETCUSDT", "VETUSDT", "ZENUSDT"] },
  { month: "mar_2023", start: "2023-03-01T00:00:00Z", end: "2023-04-01T23:59:59Z", symbols: ["DEFIUSDT", "ENSUSDT", "ETCUSDT", "FLOWUSDT", "GRTUSDT", "HNTUSDT", "MANAUSDT", "MASKUSDT", "NEOUSDT", "VETUSDT", "ZECUSDT"] },
  { month: "mar_2024", start: "2024-03-01T00:00:00Z", end: "2024-04-01T23:59:59Z", symbols: ["1000SHIBUSDT", "APEUSDT", "ARUSDT", "AXSUSDT", "DOTUSDT", "FLMUSDT", "FRONTUSDT", "GRTUSDT", "HBARUSDT", "LPTUSDT", "LRCUSDT", "ONEUSDT", "ONTUSDT", "REEFUSDT", "SHIBUSDT", "WOOUSDT", "XRPUSDT", "ZILUSDT"] },
  { month: "mar_2025", start: "2025-03-01T00:00:00Z", end: "2025-04-01T23:59:59Z", symbols: ["ALGOUSDT", "AXSUSDT", "BANDUSDT", "CRVUSDT", "EOSUSDT", "HBARUSDT", "KDAUSDT", "MTLUSDT", "NEARUSDT", "OGNUSDT", "ONEUSDT", "PEOPLEUSDT"] },
  { month: "mar_2026", start: "2026-03-01T00:00:00Z", end: "2026-04-01T23:59:59Z", symbols: ["SWARMSUSDT"] },
  { month: "may_2021", start: "2021-05-07T00:00:00Z", end: "2021-06-01T23:59:59Z", symbols: ["1INCHUSDT", "ALGOUSDT", "ARPAUSDT", "ASTUSDT", "ATOMUSDT", "BCDUSDT", "BQXUSDT", "BZRXUSDT", "DOGEUSDT", "EOSUSDT", "FIOUSDT", "GRTUSDT", "KAVAUSDT", "OCEANUSDT", "PONDUSDT", "REEFUSDT", "SRMUSDT", "SUSHIUSDT", "TRXUSDT", "XTZUSDT", "ZRXUSDT"] },
  { month: "may_2022", start: "2022-05-01T00:00:00Z", end: "2022-06-01T23:59:59Z", symbols: ["BATUSDT", "COINUSDT", "SHIBUSDT", "TRXUSDT"] },
  { month: "may_2023", start: "2023-05-01T00:00:00Z", end: "2023-06-01T23:59:59Z", symbols: ["ALICEUSDT", "ARPAUSDT", "BALUSDT", "BNXUSDT", "CELRUSDT", "CFXUSDT", "CHZUSDT", "EGLDUSDT", "ENSUSDT", "FILUSDT", "FTMUSDT", "HBARUSDT", "IOTXUSDT", "JASMYUSDT", "LINAUSDT", "NEOUSDT", "ONEUSDT", "REEFUSDT", "ROSEUSDT", "RSRUSDT", "SFPUSDT", "SOLUSDT", "STORJUSDT", "THETAUSDT", "TRBUSDT", "VETUSDT", "WOOUSDT", "XRPUSDT"] },
  { month: "may_2024", start: "2024-05-01T00:00:00Z", end: "2024-06-01T23:59:59Z", symbols: ["ALICEUSDT", "ARUSDT", "ASTRUSDT", "COTIUSDT", "GALAUSDT", "HOTUSDT", "IDEXUSDT", "IOSTUSDT", "IOTXUSDT", "NEARUSDT", "NEOUSDT", "OGNUSDT", "PEOPLEUSDT", "QTUMUSDT", "SFPUSDT", "STMXUSDT", "TRBUSDT", "VETUSDT"] },
  { month: "may_2025", start: "2025-05-01T00:00:00Z", end: "2025-06-01T23:59:59Z", symbols: ["AIUSDT", "AXSUSDT", "CFXUSDT", "DODOXUSDT", "DOGEUSDT", "DOTUSDT", "FLMUSDT", "KSMUSDT", "LPTUSDT", "MAGICUSDT", "RDNTUSDT", "SPXUSDT", "XVGUSDT", "XVSUSDT", "ZECUSDT"] },
  { month: "may_2026", start: "2026-05-01T00:00:00Z", end: "2026-06-01T23:59:59Z", symbols: ["APTUSDT", "ARKMUSDT", "CTSIUSDT", "MOVEUSDT", "OPUSDT", "SAGAUSDT", "VIRTUALUSDT", "YGGUSDT", "ZECUSDT"] },
  { month: "nov_2021", start: "2021-11-01T00:00:00Z", end: "2021-12-01T23:59:59Z", symbols: ["ALICEUSDT", "BCHUSDT", "CAKEUSDT", "CHZUSDT", "DASHUSDT", "ETHUSDT", "FILUSDT", "LINAUSDT", "LUNAUSDT", "MANAUSDT", "NEARUSDT", "ONEUSDT", "SPOTUSDT", "TRXUSDT", "XRPUSDT"] },
  { month: "nov_2022", start: "2022-11-01T00:00:00Z", end: "2022-12-01T23:59:59Z", symbols: ["ANTUSDT", "APEUSDT", "BCHUSDT", "CHZUSDT", "DASHUSDT", "DGBUSDT", "DOGEUSDT", "EOSUSDT", "ETHUSDT", "OCEANUSDT", "RAYUSDT", "RLCUSDT", "XRPUSDT", "ZECUSDT"] },
  { month: "nov_2023", start: "2023-11-01T00:00:00Z", end: "2023-12-01T23:59:59Z", symbols: ["1INCHUSDT", "APTUSDT", "BELUSDT", "ETHUSDT", "IDEXUSDT", "PLANETUSDT", "RENUSDT", "RLCUSDT", "SKLUSDT", "TRUUSDT", "ZECUSDT"] },
  { month: "nov_2024", start: "2024-11-01T00:00:00Z", end: "2024-12-01T23:59:59Z", symbols: ["ARUSDT", "ATOMUSDT", "CFXUSDT", "CKBUSDT", "CRVUSDT", "CTSIUSDT", "GRTUSDT", "IMXUSDT", "IOTAUSDT", "KAVAUSDT", "LUNA2USDT", "MASKUSDT", "MKRUSDT", "NEARUSDT", "QNTUSDT", "REZUSDT", "RVNUSDT", "WOOUSDT", "ZILUSDT"] },
  { month: "nov_2025", start: "2025-11-01T00:00:00Z", end: "2025-12-01T23:59:59Z", symbols: ["AIXBTUSDT", "ALTUSDT", "HOOKUSDT", "SOLUSDT", "TRUMPUSDT", "XVGUSDT"] },
  { month: "oct_2021", start: "2021-10-01T00:00:00Z", end: "2021-11-01T23:59:59Z", symbols: ["ADAUSDT", "ALGOUSDT", "ALICEUSDT", "AVAXUSDT", "BCHUSDT", "BNBUSDT", "CVCUSDT", "DOGEUSDT", "DOTUSDT", "ETCUSDT", "FTMUSDT", "HBARUSDT", "ICPUSDT", "KSMUSDT", "LINKUSDT", "NEARUSDT", "NULSUSDT", "ONTUSDT", "PERLUSDT", "RLCUSDT", "SANDUSDT", "SKLUSDT", "VETUSDT", "XRPUSDT", "XTZUSDT", "ZRXUSDT"] },
  { month: "oct_2022", start: "2022-10-01T00:00:00Z", end: "2022-11-01T23:59:59Z", symbols: ["1000SHIBUSDT", "AAVEUSDT", "ADAUSDT", "API3USDT", "ARPAUSDT", "DUSKUSDT", "LTCUSDT", "ONEUSDT", "RSRUSDT", "SUSHIUSDT", "YFIUSDT"] },
  { month: "oct_2023", start: "2023-10-01T00:00:00Z", end: "2023-11-01T23:59:59Z", symbols: ["1INCHUSDT", "AGIXUSDT", "ALICEUSDT", "BALUSDT", "DOTUSDT", "EOSUSDT", "GMTUSDT", "KLAYUSDT", "MASKUSDT", "ONEUSDT", "ONTUSDT", "OPUSDT", "REEFUSDT", "STMXUSDT", "TLMUSDT", "XLMUSDT"] },
  { month: "oct_2024", start: "2024-10-01T00:00:00Z", end: "2024-11-01T23:59:59Z", symbols: ["COMPUSDT", "QTUMUSDT", "UNFIUSDT", "XRPUSDT"] },
  { month: "oct_2025", start: "2025-10-01T00:00:00Z", end: "2025-11-01T23:59:59Z", symbols: ["1000RATSUSDT", "APTUSDT", "BDXNUSDT", "BEAMXUSDT", "BNBUSDT", "ETHUSDT", "FREESIGNALUSDT", "JUPUSDT", "KNCUSDT", "PHBUSDT", "SEIUSDT", "UNIUSDT", "XVGUSDT", "ZENUSDT"] },
  { month: "sep_2021", start: "2021-09-01T00:00:00Z", end: "2021-10-01T23:59:59Z", symbols: ["ALICEUSDT", "AVAXUSDT", "BAKEUSDT", "BELUSDT", "BNBUSDT", "COMPUSDT", "CTKUSDT", "DASHUSDT", "DOTUSDT", "FTMUSDT", "MATICUSDT", "RLCUSDT", "SANDUSDT", "SOLUSDT", "THETAUSDT", "TRBUSDT", "WAVESUSDT", "WRXUSDT", "XRPUSDT", "XVGUSDT"] },
  { month: "sep_2022", start: "2022-09-01T00:00:00Z", end: "2022-10-01T23:59:59Z", symbols: ["ARPAUSDT", "BAKEUSDT", "RLCUSDT"] },
  { month: "sep_2023", start: "2023-09-01T00:00:00Z", end: "2023-10-01T23:59:59Z", symbols: ["1000XECUSDT", "AAVEUSDT", "ASTRUSDT", "AVAXUSDT", "BALUSDT", "BANDUSDT", "BELUSDT", "COTIUSDT", "FLMUSDT", "INJUSDT", "IOSTUSDT", "NEOUSDT", "OMGUSDT", "REEFUSDT", "RENUSDT", "RVNUSDT", "SANDUSDT", "SKLUSDT", "TOMOUSDT", "UNIUSDT"] },
  { month: "sep_2024", start: "2024-09-01T00:00:00Z", end: "2024-10-01T23:59:59Z", symbols: ["1000SHIBUSDT", "1000XECUSDT", "ATOMUSDT", "COMPUSDT", "EOSUSDT", "FILUSDT", "HBARUSDT", "IOTXUSDT", "OPUSDT", "QTUMUSDT", "UNFIUSDT", "YFIUSDT"] },
  { month: "sep_2025", start: "2025-09-01T00:00:00Z", end: "2025-10-01T23:59:59Z", symbols: ["AIXBTUSDT", "BNBUSDT", "C98USDT", "CHESSUSDT", "HBARUSDT", "JUPUSDT", "KNCUSDT", "LINKUSDT", "LUMIAUSDT", "MINAUSDT", "MUBARAKUSDT", "WLDUSDT", "XRPUSDT"] },
  { month: "sep_2026", start: "2026-09-01T00:00:00Z", end: "2026-10-01T23:59:59Z", symbols: ["1000CATUSDT", "CGPTUSDT", "CHZUSDT", "EGLDUSDT", "ETHUSDT", "FLOWUSDT", "GRTUSDT", "GTCUSDT", "NOTUSDT", "PIXELUSDT", "RSRUSDT", "SHELLUSDT", "SPELLUSDT", "TRXUSDT"] },
];

const tasks = MONTHS.flatMap(({ month, start, end, symbols }) =>
  symbols.map((symbol) => ({
    month,
    symbol,
    start: new Date(start).getTime(),
    end: Math.floor(new Date(end).getTime() / MINUTE) * MINUTE,
  })),
);

writeFileSync(OUT, `задач: ${tasks.length}\n`);
console.log(`задач: ${tasks.length}`);

const exchange = new ccxt.binance({
  options: { defaultType: "spot", adjustForTimeDifference: true, recvWindow: 60000 },
  enableRateLimit: true,
});
exchange.rateLimit = 30;
await exchange.loadMarkets();

const fmt = (ts) => new Date(ts).toISOString().slice(0, 16).replace("T", " ");

const startedAt = Date.now();
let problems = 0;

function renderProgress(current, total, lastLabel) {
  const width = 30;
  const ratio = current / total;
  const filled = Math.round(ratio * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  const elapsed = (Date.now() - startedAt) / 1000;
  const eta = current ? Math.round((elapsed / current) * (total - current)) : 0;
  const etaText = `${Math.floor(eta / 60)}м${String(eta % 60).padStart(2, "0")}с`;
  const line = `[${bar}] ${current}/${total} (${(ratio * 100).toFixed(1)}%) проблем: ${problems} ETA ${etaText} ${lastLabel}`;
  if (process.stdout.isTTY) {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(line.slice(0, process.stdout.columns ?? 120));
  } else if (current % 25 === 0 || current === total) {
    console.log(line);
  }
}

async function checkOne({ month, symbol, start, end }) {
  // как в бэктесте символ передается сырым (CELOUSDT); ccxt резолвит по id
  let marketSymbol = symbol;
  try {
    exchange.market(marketSymbol);
  } catch {
    const unified = `${symbol.replace(/USDT$/, "")}/USDT`;
    if (exchange.markets[unified]) marketSymbol = unified;
    else return { month, symbol, status: "NO_MARKET", gaps: [] };
  }
  const gaps = [];
  let expected = start;
  let since = start;
  let total = 0;
  while (since <= end) {
    let candles;
    for (let attempt = 1; ; attempt++) {
      try {
        candles = await exchange.fetchOHLCV(marketSymbol, "1m", since, 1000);
        break;
      } catch (e) {
        if (attempt >= 5) return { month, symbol, status: `FETCH_ERROR: ${e.message}`.slice(0, 200), gaps };
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
    if (!candles.length) break;
    for (const [ts] of candles) {
      if (ts > end) break;
      total++;
      if (ts > expected) gaps.push([expected, ts]);
      expected = ts + MINUTE;
    }
    const last = candles[candles.length - 1][0];
    if (last >= end) break;
    since = last + MINUTE;
  }
  if (expected <= end) gaps.push([expected, end + MINUTE]);
  const status = gaps.length ? "GAPS" : "OK";
  return { month, symbol, status, gaps, total };
}

let done = 0;
const queue = [...tasks];
const results = [];
async function worker() {
  while (queue.length) {
    const task = queue.shift();
    const r = await checkOne(task);
    results.push(r);
    done++;
    if (r.status !== "OK") problems++;
    renderProgress(done, tasks.length, `${r.month} ${r.symbol}: ${r.status}`);
    const gapsText = r.gaps
      .slice(0, 5)
      .map(([a, b]) => `[${fmt(a)} .. ${fmt(b)}) ${(b - a) / MINUTE}м`)
      .join(", ");
    const extra = r.gaps.length > 5 ? ` и еще ${r.gaps.length - 5} пропусков` : "";
    appendFileSync(
      OUT,
      `${String(done).padStart(4)}/${tasks.length} ${r.month} ${r.symbol}: ${r.status}` +
        (r.gaps.length ? ` (${gapsText}${extra})` : ` (${r.total} свечей)`) +
        "\n",
    );
  }
}
await Promise.all(Array.from({ length: 8 }, worker));

const bad = results.filter((r) => r.status !== "OK");
appendFileSync(
  OUT,
  `\n=== ИТОГ: ${results.length - bad.length} OK, ${bad.length} проблемных ===\n` +
    bad.map((r) => `${r.month} ${r.symbol}: ${r.status} (${r.gaps.length} пропусков)`).join("\n") +
    "\n",
);
if (process.stdout.isTTY) process.stdout.write("\n");
console.log(`готово: ${results.length - bad.length} OK, ${bad.length} проблемных`);
process.exit(0);
