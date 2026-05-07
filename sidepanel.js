const SNAPSHOT_STORAGE_KEY = "sf3LiveMonitorSnapshot";
const MONITOR_TARGET_STORAGE_KEY = "sf3LiveMonitorTarget";
const MONITOR_HISTORY_STORAGE_KEY = "sf3LiveMonitorHistory";

const SERIES_META = {
  sf3: {
    label: "SF3",
    color: "#3ddc84",
    negativeColor: "#ff5d73",
    cardClass: "metric-sf3",
    emptyMessage: "Waiting for live SF3 samples..."
  },
  nof: {
    label: "NOF / NOFA",
    color: "#7ee787",
    negativeColor: "#ff7b72",
    cardClass: "metric-nof",
    emptyMessage: "Waiting for NOFA samples from the metrics modal..."
  },
  momoFlow: {
    label: "MomoFlow",
    color: "#2fbf71",
    negativeColor: "#e5484d",
    cardClass: "metric-mf",
    emptyMessage: "Waiting for MomoFlow samples..."
  }
};

const USER_ALARM_METRIC_META = {
  nof: {
    label: "NOFA",
    placeholder: "250M",
    helper: "Tracks the live minute change-sum bar for NOFA.",
    examples: "Examples: 250M, -100M, 1.2B"
  },
  momoFlow: {
    label: "MomoFlow",
    placeholder: "80M",
    helper: "Tracks the live 5-minute reset delta bar for MomoFlow.",
    examples: "Examples: 80M, -40M, 500M"
  },
  sf3: {
    label: "SF3",
    placeholder: "300M",
    helper: "Tracks the live 5-minute reset delta bar for SF3.",
    examples: "Examples: 300M, -150M, 2B"
  },
  price: {
    label: "Price",
    placeholder: "0.05",
    helper: "Tracks the live minute delta bar in dollars. 0.05 means five cents.",
    examples: "Examples: 0.05, -0.10, 0.25"
  }
};

const HISTORICAL_SF3_THRESHOLDS = {
  hourly: {
    top10: 386200000,
    top5: 969900000,
    top1: 3300000000,
    bottom10: -320800000,
    bottom5: -636500000,
    bottom1: -1300000000
  },
  daily: {
    top10: 11600000000000,
    top5: 28800000000000,
    top1: 36700000000000,
    bottom10: -9700000000000,
    bottom5: -19900000000000,
    bottom1: -43300000000000
  }
};

const METRIC_CHART_ORDER = ["nof", "momoFlow", "sf3"];
const MINUTE_CHANGE_SUM_METRICS = new Set(["nof"]);
const FIVE_MINUTE_RESET_METRICS = new Set(["sf3", "momoFlow"]);
const WICKY_METRIC_SCALE_STEP = 5_000_000;
const WICKY_STYLE_SCALE_METRICS = new Set(["sf3", "momoFlow"]);
const CHART_DIMENSIONS = {
  width: 640,
  height: 190,
  margin: { top: 14, right: 18, bottom: 34, left: 68 }
};
const MAX_ALERTS = 12;
const MAX_MINUTE_HISTORY_MS = 60 * 60 * 1000;
const MAX_FIVE_MINUTE_HISTORY_MS = 48 * 60 * 60 * 1000;

const state = {
  snapshot: null,
  monitorTarget: null,
  minuteSeries: {
    sf3: new Map(),
    nof: new Map(),
    momoFlow: new Map()
  },
  lastMetricValues: {
    sf3: null,
    nof: null,
    momoFlow: null
  },
  fiveMinuteMetricBases: {
    sf3: null,
    momoFlow: null
  },
  priceMinuteChanges: new Map(),
  sf3FiveMinuteBuckets: new Map(),
  alerts: [],
  alertState: {
    sf3FiveMinute: "inside",
    nof: "inside",
    momoFlow: "inside",
    hourlyBand: null,
    dailyBand: null
  },
  audioArmed: false
};

const elements = {};

function normalizeText(value) {
  return String(value || "").replace(/\u200b/g, " ").replace(/\s+/g, " ").trim();
}

function parseCompactNumber(value) {
  if (value == null) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const normalized = normalizeText(value).replace(/,/g, "");
  if (!normalized) {
    return null;
  }

  const match = normalized.match(/^([+-]?\d*\.?\d+)([KMBT])?$/i);
  if (!match) {
    return null;
  }

  const base = Number.parseFloat(match[1]);
  if (!Number.isFinite(base)) {
    return null;
  }

  const suffix = (match[2] || "").toUpperCase();
  const multiplier = suffix === "K"
    ? 1e3
    : suffix === "M"
      ? 1e6
      : suffix === "B"
        ? 1e9
        : suffix === "T"
          ? 1e12
          : 1;

  return base * multiplier;
}

function trimTrailingZeros(value) {
  return String(value).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

function formatCompactNumber(value) {
  if (value == null || !Number.isFinite(value)) {
    return "--";
  }

  const abs = Math.abs(value);
  if (abs >= 1e12) {
    return `${trimTrailingZeros((value / 1e12).toFixed(2))}T`;
  }

  if (abs >= 1e9) {
    return `${trimTrailingZeros((value / 1e9).toFixed(2))}B`;
  }

  if (abs >= 1e6) {
    return `${trimTrailingZeros((value / 1e6).toFixed(2))}M`;
  }

  if (abs >= 1e3) {
    return `${trimTrailingZeros((value / 1e3).toFixed(2))}K`;
  }

  return trimTrailingZeros(value.toFixed(2));
}

function formatPrice(value) {
  return value == null || !Number.isFinite(value) ? "--" : trimTrailingZeros(value.toFixed(2));
}

function calculatePriceChangeCents(basePrice, currentPrice) {
  if (!Number.isFinite(basePrice) || !Number.isFinite(currentPrice)) {
    return null;
  }

  return Number(((currentPrice - basePrice) * 100).toFixed(2));
}

function formatPriceChangeCents(value, options = {}) {
  const {
    includeSign = false,
    includeUnit = true
  } = options;

  if (value == null || !Number.isFinite(value)) {
    return "--";
  }

  const absoluteValue = (Math.abs(value) / 100).toFixed(2);
  const sign = value < 0
    ? "-"
    : includeSign && value > 0
      ? "+"
      : "";

  void includeUnit;
  return `${sign}${absoluteValue}`;
}

function floorToMinute(date) {
  const result = new Date(date);
  result.setSeconds(0, 0);
  return result;
}

function floorToFiveMinutes(date) {
  const result = new Date(date);
  result.setMinutes(Math.floor(result.getMinutes() / 5) * 5, 0, 0);
  return result;
}

function getMostRecent5MinuteBoundary(date) {
  return floorToFiveMinutes(date);
}

function sameHour(left, right) {
  return left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate() &&
    left.getHours() === right.getHours();
}

function sameDay(left, right) {
  return left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function formatMinuteLabel(date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatMonitorTargetLabel(target) {
  const title = normalizeText(target?.title || "");
  if (title) {
    return title;
  }

  try {
    const url = new URL(target?.url || "");
    return `${url.host}${url.pathname === "/" ? "" : url.pathname}`;
  } catch {
    return normalizeText(target?.url || "selected BigShort tab");
  }
}

function describeMonitorTarget() {
  const target = state.monitorTarget;
  if (!target) {
    return "Pinned source: click the extension on the BigShort tab you want to monitor.";
  }

  const label = formatMonitorTargetLabel(target) || "selected BigShort tab";
  if (target.status === "closed") {
    return `Pinned source: ${label}. That tab was closed, so click the extension again on the tab you want to track.`;
  }

  if (target.status === "unsupported") {
    return `Pinned source: ${label}. That tab left a supported BigShort page.`;
  }

  return `Pinned source: ${label}. Monitoring stays on that tab even when this panel is closed.`;
}

function getReferenceTime() {
  return state.snapshot ? new Date(state.snapshot.timestamp) : new Date();
}

function getAlarmMetricLabel(metric) {
  return USER_ALARM_METRIC_META[metric]?.label || metric;
}

function getCurrentAlarmValue(metric, referenceTime = getReferenceTime()) {
  const minuteBucket = floorToMinute(referenceTime).getTime();

  if (metric === "price") {
    const priceEntry = state.priceMinuteChanges.get(minuteBucket);
    return priceEntry ? priceEntry.changeCents / 100 : null;
  }

  const seriesEntry = state.minuteSeries[metric]?.get(minuteBucket);
  return seriesEntry?.value ?? null;
}

function formatAlarmValue(metric, value, options = {}) {
  const { includeSign = false } = options;

  if (value == null || !Number.isFinite(value)) {
    return "--";
  }

  if (metric === "price") {
    return formatPriceChangeCents(value * 100, {
      includeSign,
      includeUnit: false
    });
  }

  const compactValue = formatCompactNumber(value);
  return includeSign && value > 0 ? `+${compactValue}` : compactValue;
}

function pruneMap(map, referenceTime, maxAgeMs) {
  for (const [key] of map.entries()) {
    if (referenceTime - key > maxAgeMs) {
      map.delete(key);
    }
  }
}

function getThresholdCrossState(value, thresholds) {
  if (value == null || !thresholds) {
    return "inside";
  }

  if (thresholds.upper != null && value >= thresholds.upper) {
    return "above-upper";
  }

  if (thresholds.lower != null && value <= thresholds.lower) {
    return "below-lower";
  }

  return "inside";
}

function getHistoricalBand(value, thresholds) {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  if (value >= thresholds.top1) {
    return "Top 1%";
  }

  if (value >= thresholds.top5) {
    return "Top 5%";
  }

  if (value >= thresholds.top10) {
    return "Top 10%";
  }

  if (value <= thresholds.bottom1) {
    return "Bottom 1%";
  }

  if (value <= thresholds.bottom5) {
    return "Bottom 5%";
  }

  if (value <= thresholds.bottom10) {
    return "Bottom 10%";
  }

  return null;
}

function computeRollingSf3Sum(scope) {
  if (!state.snapshot) {
    return null;
  }

  const referenceTime = getReferenceTime();
  let total = 0;
  let found = false;

  for (const entry of state.sf3FiveMinuteBuckets.values()) {
    const bucketTime = new Date(entry.timestamp);
    const inScope = scope === "hour"
      ? sameHour(bucketTime, referenceTime)
      : sameDay(bucketTime, referenceTime);

    if (inScope) {
      total += entry.value;
      found = true;
    }
  }

  return found ? total : null;
}

function buildAlert(message) {
  const alert = {
    time: new Date().toISOString(),
    message
  };

  state.alerts.unshift(alert);
  state.alerts = state.alerts.slice(0, MAX_ALERTS);

  if (state.audioArmed && window.audioAlarmNotifier) {
    void window.audioAlarmNotifier.playAlarm();
  }
}

function checkCustomAlarm(skipInitial) {
  if (skipInitial || !window.singleAlarmManager) {
    return;
  }

  const alarm = window.singleAlarmManager.getCurrentAlarm();
  if (!alarm) {
    return;
  }

  const referenceTime = getReferenceTime();
  const currentValue = getCurrentAlarmValue(alarm.metric, referenceTime);
  const triggerEvent = window.singleAlarmManager.checkAlarm(currentValue, alarm.metric, referenceTime);
  if (!triggerEvent) {
    return;
  }

  const thresholdText = formatAlarmValue(alarm.metric, alarm.threshold);
  const valueText = formatAlarmValue(alarm.metric, triggerEvent.value, { includeSign: true });
  const absoluteText = alarm.isAbsolute ? " absolute" : "";
  buildAlert(`${getAlarmMetricLabel(alarm.metric)} custom${absoluteText} alarm hit ${thresholdText} at ${valueText}.`);
}

function updatePriceHistory(snapshot, timestamp) {
  const minuteBucket = floorToMinute(timestamp).getTime();
  const priceValue = parseCompactNumber(snapshot.numericValues?.price ?? snapshot.values?.price);
  if (priceValue == null) {
    return;
  }

  const existingEntry = state.priceMinuteChanges.get(minuteBucket);
  const basePrice = existingEntry?.basePrice ?? priceValue;
  const changeCents = calculatePriceChangeCents(basePrice, priceValue);

  state.priceMinuteChanges.set(minuteBucket, {
    timestamp: minuteBucket,
    basePrice,
    currentPrice: priceValue,
    changeCents: changeCents ?? 0
  });
  pruneMap(state.priceMinuteChanges, minuteBucket, MAX_MINUTE_HISTORY_MS);
}

function updateMetricHistory(snapshot) {
  const timestamp = new Date(snapshot.timestamp);
  const minuteBucket = floorToMinute(timestamp).getTime();
  const fiveMinuteBucket = floorToFiveMinutes(timestamp).getTime();

  for (const key of Object.keys(state.minuteSeries)) {
    const series = state.minuteSeries[key];
    const numericValue = parseCompactNumber(snapshot.numericValues?.[key]);
    if (numericValue == null) {
      continue;
    }

    if (FIVE_MINUTE_RESET_METRICS.has(key)) {
      const currentBase = state.fiveMinuteMetricBases[key];
      const isNewBucket = !currentBase || currentBase.bucket !== fiveMinuteBucket || !Number.isFinite(currentBase.value);
      if (isNewBucket) {
        state.fiveMinuteMetricBases[key] = {
          bucket: fiveMinuteBucket,
          value: numericValue
        };
        state.lastMetricValues[key] = numericValue;
        series.set(minuteBucket, {
          timestamp: minuteBucket,
          baseValue: numericValue,
          currentValue: numericValue,
          value: 0
        });
      } else {
        const previousValue = state.lastMetricValues[key];
        state.lastMetricValues[key] = numericValue;
        const delta = Number.isFinite(previousValue) ? numericValue - previousValue : 0;
        series.set(minuteBucket, {
          timestamp: minuteBucket,
          baseValue: currentBase.value,
          currentValue: numericValue,
          value: delta
        });
      }
    } else if (MINUTE_CHANGE_SUM_METRICS.has(key)) {
      const previousValue = state.lastMetricValues[key];
      state.lastMetricValues[key] = numericValue;

      if (!Number.isFinite(previousValue)) {
        continue;
      }

      const existingEntry = series.get(minuteBucket);
      const changeValue = numericValue - previousValue;

      series.set(minuteBucket, {
        timestamp: minuteBucket,
        previousValue,
        currentValue: numericValue,
        value: (existingEntry?.value ?? 0) + changeValue,
        lastChange: changeValue
      });
    } else {
      series.set(minuteBucket, {
        timestamp: minuteBucket,
        value: numericValue
      });
    }

    pruneMap(series, minuteBucket, MAX_MINUTE_HISTORY_MS);
  }

  updatePriceHistory(snapshot, timestamp);

  const sf3Value = parseCompactNumber(snapshot.numericValues?.sf3);
  if (sf3Value != null) {
    const fiveMinuteBucket = floorToFiveMinutes(timestamp).getTime();
    state.sf3FiveMinuteBuckets.set(fiveMinuteBucket, {
      timestamp: fiveMinuteBucket,
      value: sf3Value
    });
    pruneMap(state.sf3FiveMinuteBuckets, fiveMinuteBucket, MAX_FIVE_MINUTE_HISTORY_MS);
  }
}

function hydrateTimestampMap(map, entries) {
  map.clear();

  for (const entry of entries || []) {
    if (!entry || !Number.isFinite(entry.timestamp)) {
      continue;
    }

    map.set(entry.timestamp, entry);
  }
}

function applyPersistedHistory(history) {
  const minuteSeries = history?.minuteSeries || {};

  for (const key of Object.keys(state.minuteSeries)) {
    hydrateTimestampMap(state.minuteSeries[key], minuteSeries[key]);
  }

  state.lastMetricValues = {
    sf3: history?.lastMetricValues?.sf3 ?? null,
    nof: history?.lastMetricValues?.nof ?? null,
    momoFlow: history?.lastMetricValues?.momoFlow ?? null
  };

  state.fiveMinuteMetricBases = {
    sf3: history?.fiveMinuteMetricBases?.sf3 || null,
    momoFlow: history?.fiveMinuteMetricBases?.momoFlow || null
  };

  hydrateTimestampMap(state.priceMinuteChanges, history?.priceMinuteChanges);
  hydrateTimestampMap(state.sf3FiveMinuteBuckets, history?.sf3FiveMinuteBuckets);

  return Object.values(state.minuteSeries).some((series) => series.size > 0) ||
    state.priceMinuteChanges.size > 0 ||
    state.sf3FiveMinuteBuckets.size > 0;
}

function evaluateAlerts(snapshot, isInitial) {
  const sf3ThresholdState = getThresholdCrossState(snapshot.numericValues?.sf3, snapshot.thresholds?.sf3);
  if (!isInitial && sf3ThresholdState !== state.alertState.sf3FiveMinute && sf3ThresholdState !== "inside") {
    const direction = sf3ThresholdState === "above-upper" ? "above" : "below";
    const thresholdText = sf3ThresholdState === "above-upper"
      ? snapshot.thresholds.sf3.upperText
      : snapshot.thresholds.sf3.lowerText;
    buildAlert(`SF3 crossed ${direction} the 5m percentile line (${thresholdText}) with ${snapshot.values.sf3}.`);
  }
  state.alertState.sf3FiveMinute = sf3ThresholdState;

  const nofThresholdState = getThresholdCrossState(snapshot.numericValues?.nof, snapshot.thresholds?.nof);
  if (!isInitial && nofThresholdState !== state.alertState.nof && nofThresholdState !== "inside") {
    const direction = nofThresholdState === "above-upper" ? "above" : "below";
    const thresholdText = nofThresholdState === "above-upper"
      ? snapshot.thresholds.nof.upperText
      : snapshot.thresholds.nof.lowerText;
    buildAlert(`NOF crossed ${direction} its percentile line (${thresholdText}) with ${snapshot.values.nof}.`);
  }
  state.alertState.nof = nofThresholdState;

  const momoThresholdState = getThresholdCrossState(snapshot.numericValues?.momoFlow, snapshot.thresholds?.mf);
  if (!isInitial && momoThresholdState !== state.alertState.momoFlow && momoThresholdState !== "inside") {
    const direction = momoThresholdState === "above-upper" ? "above" : "below";
    const thresholdText = momoThresholdState === "above-upper"
      ? snapshot.thresholds.mf.upperText
      : snapshot.thresholds.mf.lowerText;
    buildAlert(`MF crossed ${direction} its percentile line (${thresholdText}) with ${snapshot.values.momoFlow}.`);
  }
  state.alertState.momoFlow = momoThresholdState;

  const hourlySum = computeRollingSf3Sum("hour");
  const hourlyBand = getHistoricalBand(hourlySum, HISTORICAL_SF3_THRESHOLDS.hourly);
  if (!isInitial && hourlyBand && hourlyBand !== state.alertState.hourlyBand) {
    buildAlert(`Hourly SF3 entered ${hourlyBand} at ${formatCompactNumber(hourlySum)}.`);
  }
  state.alertState.hourlyBand = hourlyBand;

  const dailySum = computeRollingSf3Sum("day");
  const dailyBand = getHistoricalBand(dailySum, HISTORICAL_SF3_THRESHOLDS.daily);
  if (!isInitial && dailyBand && dailyBand !== state.alertState.dailyBand) {
    buildAlert(`Daily SF3 entered ${dailyBand} at ${formatCompactNumber(dailySum)}.`);
  }
  state.alertState.dailyBand = dailyBand;
}

function renderStatus() {
  elements.monitorTargetText.textContent = describeMonitorTarget();

  if (!state.snapshot || state.monitorTarget?.status && state.monitorTarget.status !== "active") {
    elements.statusBadge.className = "badge waiting";
    elements.statusBadge.textContent = "Waiting for BigShort data";
    elements.lastUpdatedText.textContent = "Last update: --";
    return;
  }

  elements.statusBadge.className = "badge live";
  elements.statusBadge.textContent = "Receiving live data";
  elements.lastUpdatedText.textContent = `Last update: ${formatTimestamp(state.snapshot.timestamp)}`;
}

function describeThresholdState(stateName, thresholds) {
  if (stateName === "above-upper") {
    return `above ${thresholds.upperText}`;
  }

  if (stateName === "below-lower") {
    return `below ${thresholds.lowerText}`;
  }

  return "inside range";
}

function renderCurrentMetrics() {
  const snapshot = state.snapshot;
  const sf3Status = snapshot ? getThresholdCrossState(snapshot.numericValues?.sf3, snapshot.thresholds?.sf3) : "inside";
  const nofStatus = snapshot ? getThresholdCrossState(snapshot.numericValues?.nof, snapshot.thresholds?.nof) : "inside";
  const momoStatus = snapshot ? getThresholdCrossState(snapshot.numericValues?.momoFlow, snapshot.thresholds?.mf) : "inside";

  const cards = [
    {
      key: "sf3",
      title: "SF3",
      value: snapshot?.values?.sf3 || "--",
      detail: ""
    },
    {
      key: "nof",
      title: "NOFA",
      value: snapshot?.values?.nof || "--",
      detail: ""
    },
    {
      key: "momoFlow",
      title: "MomoFlow",
      value: snapshot?.values?.momoFlow || "--",
      detail: ""
    },
    {
      key: "sf3",
      title: "Live Price",
      isPriceCard: true,
      value: snapshot?.values?.price || formatPrice(snapshot?.numericValues?.price),
      detail: ""
    }
  ];

  elements.currentMetricsGrid.innerHTML = cards.map((card) => `
    <article class="metric-card ${card.isPriceCard ? "" : SERIES_META[card.key].cardClass}">
      <h2>${card.title}</h2>
      <div class="metric-value"${card.isPriceCard ? ' style="color:#8be9fd;"' : ""}>${card.value}</div>
      <div class="metric-detail">${card.detail}</div>
    </article>
  `).join("");
}

function renderRollingMetrics() {
  const hourlySum = computeRollingSf3Sum("hour");
  const dailySum = computeRollingSf3Sum("day");
  const hourlyBand = getHistoricalBand(hourlySum, HISTORICAL_SF3_THRESHOLDS.hourly);
  const dailyBand = getHistoricalBand(dailySum, HISTORICAL_SF3_THRESHOLDS.daily);

  const cards = [
    {
      title: "Hourly Rolling SF3",
      value: formatCompactNumber(hourlySum),
      detail: hourlyBand || "Inside hourly bands",
      thresholds: `10% ${formatCompactNumber(HISTORICAL_SF3_THRESHOLDS.hourly.top10)} / ${formatCompactNumber(HISTORICAL_SF3_THRESHOLDS.hourly.bottom10)} | 5% ${formatCompactNumber(HISTORICAL_SF3_THRESHOLDS.hourly.top5)} / ${formatCompactNumber(HISTORICAL_SF3_THRESHOLDS.hourly.bottom5)} | 1% ${formatCompactNumber(HISTORICAL_SF3_THRESHOLDS.hourly.top1)} / ${formatCompactNumber(HISTORICAL_SF3_THRESHOLDS.hourly.bottom1)}`
    },
    {
      title: "Daily Rolling SF3",
      value: formatCompactNumber(dailySum),
      detail: dailyBand || "Inside daily bands",
      thresholds: `10% ${formatCompactNumber(HISTORICAL_SF3_THRESHOLDS.daily.top10)} / ${formatCompactNumber(HISTORICAL_SF3_THRESHOLDS.daily.bottom10)} | 5% ${formatCompactNumber(HISTORICAL_SF3_THRESHOLDS.daily.top5)} / ${formatCompactNumber(HISTORICAL_SF3_THRESHOLDS.daily.bottom5)} | 1% ${formatCompactNumber(HISTORICAL_SF3_THRESHOLDS.daily.top1)} / ${formatCompactNumber(HISTORICAL_SF3_THRESHOLDS.daily.bottom1)}`
    }
  ];

  elements.rollingMetricsGrid.innerHTML = cards.map((card) => `
    <article class="metric-card">
      <h2>${card.title}</h2>
      <div class="metric-value" style="font-size: 22px; color: #dce8ff;">${card.value}</div>
      <div class="metric-detail">${card.detail}</div>
      <div class="metric-detail" style="margin-top: 10px; color:#8ea3c5;">${card.thresholds}</div>
    </article>
  `).join("");
}

function renderAlarmDisplay() {
  if (!elements.alarmDisplay || !elements.createAlarmButton) {
    return;
  }

  const alarmManager = window.singleAlarmManager;
  const activeAlarm = alarmManager?.getCurrentAlarm();
  elements.createAlarmButton.textContent = activeAlarm ? "Replace Alarm" : "Create Alarm";

  if (!activeAlarm) {
    elements.alarmDisplay.innerHTML = `
      <div class="alarm-empty">No custom alarm set. Create one for NOFA, MomoFlow, SF3, or price and it will trigger once per 5-minute boundary like Wicky.</div>
    `;
    return;
  }

  const referenceTime = getReferenceTime();
  const currentValue = getCurrentAlarmValue(activeAlarm.metric, referenceTime);
  const hasTriggered = alarmManager.hasTriggeredCurrentBoundary(referenceTime);
  const triggerHistory = alarmManager.getTriggerHistory();
  const historyMarkup = triggerHistory.length
    ? triggerHistory.slice(0, 5).map((trigger) => `
      <div class="alarm-history-item">
        <span>${formatTimestamp(trigger.timestamp)} ${formatAlarmValue(trigger.metric, trigger.value, { includeSign: true })}</span>
        <span>${trigger.isAbsolute ? "Absolute" : "Directional"}</span>
      </div>
    `).join("")
    : `<div class="alarm-history-item"><span>No triggers yet</span><span>Waiting for live data</span></div>`;

  elements.alarmDisplay.innerHTML = `
    <div class="alarm-card">
      <div class="alarm-top-row">
        <div>
          <div class="alarm-status-chip ${hasTriggered ? "triggered" : "active"}">${hasTriggered ? "Triggered This 5m Window" : "Active"}</div>
          <div class="alarm-title">${getAlarmMetricLabel(activeAlarm.metric)}</div>
          <div class="alarm-subtitle">${activeAlarm.isAbsolute ? "Absolute magnitude" : "Directional"} threshold at ${formatAlarmValue(activeAlarm.metric, activeAlarm.threshold)}.</div>
        </div>
        <div class="alarm-actions">
          <button class="secondary" id="acknowledgeAlarmButton" type="button" ${hasTriggered ? "" : "disabled"}>Acknowledge</button>
          <button class="secondary" id="deleteAlarmButton" type="button">Delete Alarm</button>
        </div>
      </div>

      <div class="alarm-detail-grid">
        <div class="alarm-meta">
          <span class="alarm-meta-label">Current Chart Value</span>
          <strong>${formatAlarmValue(activeAlarm.metric, currentValue, { includeSign: true })}</strong>
        </div>
        <div class="alarm-meta">
          <span class="alarm-meta-label">Created</span>
          <strong>${formatTimestamp(activeAlarm.createdAt)}</strong>
        </div>
        <div class="alarm-meta">
          <span class="alarm-meta-label">Mode</span>
          <strong>${activeAlarm.isAbsolute ? "Absolute" : "Directional"}</strong>
        </div>
      </div>

      <div class="alarm-history">
        <div class="alarm-history-title">Recent Triggers</div>
        <div class="alarm-history-list">${historyMarkup}</div>
      </div>
    </div>
  `;

  const acknowledgeButton = document.getElementById("acknowledgeAlarmButton");
  if (acknowledgeButton) {
    acknowledgeButton.addEventListener("click", () => {
      alarmManager.acknowledgeAlarm();
    });
  }

  const deleteButton = document.getElementById("deleteAlarmButton");
  if (deleteButton) {
    deleteButton.addEventListener("click", () => {
      alarmManager.deleteAlarm();
      renderAlarmDisplay();
    });
  }
}

function updateAlarmFormState() {
  const metric = elements.alarmMetricSelect?.value || "nof";
  const metricMeta = USER_ALARM_METRIC_META[metric];
  if (!metricMeta) {
    return;
  }

  elements.alarmMetricHint.textContent = metricMeta.helper;
  elements.alarmThresholdInput.placeholder = metricMeta.placeholder;
  elements.alarmThresholdHint.textContent = metricMeta.examples;
}

function openAlarmModal() {
  if (!elements.alarmModal) {
    return;
  }

  const activeAlarm = window.singleAlarmManager?.getCurrentAlarm();
  elements.alarmMetricSelect.value = activeAlarm?.metric || "nof";
  elements.alarmThresholdInput.value = activeAlarm?.thresholdInput || "";
  elements.alarmAbsoluteCheckbox.checked = Boolean(activeAlarm?.isAbsolute);
  updateAlarmFormState();
  elements.alarmModal.classList.add("open");
  elements.alarmModal.setAttribute("aria-hidden", "false");
  elements.alarmThresholdInput.focus();
  elements.alarmThresholdInput.select();
}

function closeAlarmModal() {
  if (!elements.alarmModal) {
    return;
  }

  elements.alarmModal.classList.remove("open");
  elements.alarmModal.setAttribute("aria-hidden", "true");
}

function getVisibleMinuteWindow() {
  const reference = getReferenceTime();
  const start = getMostRecent5MinuteBoundary(reference);
  const result = [];

  for (let index = 0; index < 5; index += 1) {
    const pointTime = new Date(start);
    pointTime.setMinutes(start.getMinutes() + index);
    result.push(pointTime);
  }

  return result;
}

function buildSeriesPoints(metric) {
  const windowPoints = getVisibleMinuteWindow();
  const series = state.minuteSeries[metric];

  return windowPoints.map((time) => {
    const bucket = floorToMinute(time).getTime();
    const entry = series.get(bucket);
    return {
      time,
      value: entry ? entry.value : null
    };
  });
}

function buildPriceChangeBars() {
  const windowPoints = getVisibleMinuteWindow();

  return windowPoints.map((time) => {
    const bucket = floorToMinute(time).getTime();
    const entry = state.priceMinuteChanges.get(bucket);
    return {
      time,
      timestamp: bucket,
      hasData: Boolean(entry),
      basePrice: entry?.basePrice ?? null,
      currentPrice: entry?.currentPrice ?? null,
      changeCents: entry?.changeCents ?? 0
    };
  });
}

function snapMetricBoundary(value, direction, step) {
  if (direction === "max") {
    return Math.ceil(value / step) * step;
  }

  return Math.floor(value / step) * step;
}

function buildChartScales(minValue, maxValue, options = {}) {
  const { metric = null } = options;
  const { width, height, margin } = CHART_DIMENSIONS;
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const safeMin = Math.min(minValue, 0);
  const safeMax = Math.max(maxValue, 0);
  let adjustedMin = safeMin;
  let adjustedMax = safeMax;

  if (metric && WICKY_STYLE_SCALE_METRICS.has(metric)) {
    adjustedMin = Math.min(safeMin, -WICKY_METRIC_SCALE_STEP);
    adjustedMax = Math.max(safeMax, WICKY_METRIC_SCALE_STEP);
    adjustedMin = snapMetricBoundary(adjustedMin, "min", WICKY_METRIC_SCALE_STEP);
    adjustedMax = snapMetricBoundary(adjustedMax, "max", WICKY_METRIC_SCALE_STEP);
  }

  if (adjustedMin === adjustedMax) {
    const pad = Math.max(Math.abs(adjustedMax) * 0.1, 1);
    adjustedMin -= pad;
    adjustedMax += pad;
  }

  const safeRange = adjustedMax - adjustedMin || 1;
  const step = plotWidth / Math.max(5, 1);

  return {
    width,
    height,
    margin,
    plotWidth,
    plotHeight,
    minValue: adjustedMin,
    maxValue: adjustedMax,
    xScale(index) {
      return margin.left + step * index + step / 2;
    },
    yScale(value) {
      return margin.top + ((adjustedMax - value) / safeRange) * plotHeight;
    }
  };
}

function buildGridMarkup(scales, formatter) {
  const { width, height, margin, plotHeight, minValue, maxValue, yScale } = scales;
  const lines = [];
  const zeroTolerance = Math.max(Math.abs(maxValue - minValue) * 0.001, 1e-9);
  let hasZeroTick = false;

  for (let index = 0; index <= 4; index += 1) {
    const ratio = index / 4;
    const value = maxValue - (maxValue - minValue) * ratio;
    const y = margin.top + plotHeight * ratio;
    if (Math.abs(value) <= zeroTolerance) {
      hasZeroTick = true;
    }

    lines.push(`
      <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="rgba(142,163,197,0.14)" stroke-width="1"></line>
      <text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" fill="#8ea3c5" font-size="11">${formatter(value)}</text>
    `);
  }

  if (minValue <= 0 && maxValue >= 0 && !hasZeroTick) {
    const zeroY = yScale(0);
    lines.push(`
      <line x1="${margin.left}" y1="${zeroY}" x2="${width - margin.right}" y2="${zeroY}" stroke="rgba(220,236,255,0.22)" stroke-dasharray="4 4"></line>
      <text x="${margin.left - 10}" y="${zeroY + 4}" text-anchor="end" fill="#dce8ff" font-size="11" font-weight="700">${formatter(0)}</text>
    `);
  }

  return lines.join("");
}

function buildTimeAxisMarkup(scales, windowPoints) {
  const { height, margin, xScale } = scales;

  return windowPoints.map((time, index) => {
    const x = xScale(index);
    return `
      <line x1="${x}" y1="${margin.top}" x2="${x}" y2="${height - margin.bottom}" stroke="rgba(142,163,197,0.08)" stroke-width="1"></line>
      <text x="${x}" y="${height - 12}" text-anchor="middle" fill="#8ea3c5" font-size="11">${formatMinuteLabel(time)}</text>
    `;
  }).join("");
}

function renderEmptyChart(svg, message) {
  const { width, height } = CHART_DIMENSIONS;
  svg.innerHTML = `
    <rect x="0" y="0" width="${width}" height="${height}" fill="rgba(255,255,255,0.01)"></rect>
    <text class="chart-empty" x="${width / 2}" y="${height / 2}" text-anchor="middle">${message}</text>
  `;
}

function renderMetricBarChart(metric) {
  const svg = elements.metricCharts[metric];
  const meta = SERIES_META[metric];
  const points = buildSeriesPoints(metric);
  const values = points.map((point) => point.value).filter((value) => value != null && Number.isFinite(value));

  if (!values.length) {
    renderEmptyChart(svg, meta.emptyMessage);
    return;
  }

  const windowPoints = getVisibleMinuteWindow();
  const scales = buildChartScales(Math.min(...values, 0), Math.max(...values, 0), { metric });
  const barWidth = Math.min(42, (scales.plotWidth / windowPoints.length) * 0.6);
  const zeroY = scales.yScale(0);

  const bars = points.map((point, index) => {
    if (point.value == null || !Number.isFinite(point.value)) {
      return "";
    }

    const x = scales.xScale(index) - barWidth / 2;
    const y = scales.yScale(point.value);
    const rectY = Math.min(y, zeroY);
    const rectHeight = Math.max(Math.abs(zeroY - y), 1);
    const fill = point.value >= 0 ? meta.color : meta.negativeColor;

    return `
      <rect x="${x}" y="${rectY}" width="${barWidth}" height="${rectHeight}" rx="5" fill="${fill}" opacity="0.92">
        <title>${meta.label} ${formatMinuteLabel(point.time)}: ${formatCompactNumber(point.value)}</title>
      </rect>
    `;
  }).join("");

  svg.innerHTML = `
    <rect x="0" y="0" width="${scales.width}" height="${scales.height}" fill="rgba(255,255,255,0.01)"></rect>
    ${buildGridMarkup(scales, formatCompactNumber)}
    ${buildTimeAxisMarkup(scales, windowPoints)}
    ${bars}
  `;
}

function renderPriceChart() {
  const points = buildPriceChangeBars();
  const populatedPoints = points.filter((point) => point.hasData);
  const values = populatedPoints
    .map((point) => point.changeCents)
    .filter((value) => value != null && Number.isFinite(value));

  if (!populatedPoints.length) {
    renderEmptyChart(elements.priceChart, "Waiting for live price samples...");
    return;
  }

  const windowPoints = getVisibleMinuteWindow();
  const scales = buildChartScales(Math.min(...values, 0), Math.max(...values, 0));
  const barWidth = Math.min(42, (scales.plotWidth / windowPoints.length) * 0.6);
  const zeroY = scales.yScale(0);

  const markup = points.map((point, index) => {
    if (!point.hasData) {
      return "";
    }

    const x = scales.xScale(index) - barWidth / 2;
    const value = point.changeCents;
    const y = scales.yScale(value);
    const rectY = value === 0 ? zeroY - 1 : Math.min(y, zeroY);
    const rectHeight = value === 0 ? 2 : Math.max(Math.abs(zeroY - y), 1);
    const fill = value > 0
      ? "rgba(34, 197, 94, 0.88)"
      : value < 0
        ? "rgba(239, 68, 68, 0.88)"
        : "rgba(148, 163, 184, 0.75)";
    const stroke = value > 0
      ? "rgba(34, 197, 94, 1)"
      : value < 0
        ? "rgba(239, 68, 68, 1)"
        : "rgba(148, 163, 184, 1)";
    const labelText = value === 0 ? "" : formatPriceChangeCents(value, { includeSign: false, includeUnit: true });
    const labelY = value >= 0
      ? Math.max(scales.margin.top + 10, rectY - 6)
      : Math.min(scales.height - scales.margin.bottom - 4, rectY + rectHeight + 12);
    const directionText = value > 0 ? "up" : value < 0 ? "down" : "flat";
    const title = `Price ${formatMinuteLabel(point.time)} | Base ${formatPrice(point.basePrice)} Current ${formatPrice(point.currentPrice)} | delta ${formatPriceChangeCents(value, { includeSign: true, includeUnit: false })}`;

    return `
      <rect x="${x}" y="${rectY}" width="${barWidth}" height="${rectHeight}" rx="5" fill="${fill}" stroke="${stroke}" stroke-width="1.2">
        <title>${title}</title>
      </rect>
      ${labelText ? `<text x="${x + barWidth / 2}" y="${labelY}" text-anchor="middle" fill="#dce8ff" font-size="11" font-weight="700">${labelText}</text>` : ""}
    `;
  }).join("");

  elements.priceChart.innerHTML = `
    <rect x="0" y="0" width="${scales.width}" height="${scales.height}" fill="rgba(255,255,255,0.01)"></rect>
    ${buildGridMarkup(scales, formatPriceChangeCents)}
    ${buildTimeAxisMarkup(scales, windowPoints)}
    ${markup}
  `;
}

function renderAlerts() {
  if (!state.alerts.length) {
    elements.alertsList.innerHTML = `
      <li>
        <span class="alert-time">No alerts yet</span>
        <div class="alert-message">The panel will log built-in threshold crossings and custom alarm triggers here once live data moves into a new alert state.</div>
      </li>
    `;
    return;
  }

  elements.alertsList.innerHTML = state.alerts.map((alert) => `
    <li>
      <span class="alert-time">${formatTimestamp(alert.time)}</span>
      <div class="alert-message">${alert.message}</div>
    </li>
  `).join("");
}

function renderCharts() {
  for (const metric of METRIC_CHART_ORDER) {
    renderMetricBarChart(metric);
  }

  renderPriceChart();
}

function render() {
  renderStatus();
  renderCurrentMetrics();
  renderRollingMetrics();
  renderAlarmDisplay();
  renderCharts();
  renderAlerts();
}

function handleSnapshot(snapshot, options = {}) {
  if (!snapshot?.timestamp) {
    return;
  }

  if (snapshot.monitorTarget) {
    state.monitorTarget = snapshot.monitorTarget;
  }

  state.snapshot = {
    ...snapshot,
    numericValues: {
      sf3: parseCompactNumber(snapshot.numericValues?.sf3 ?? snapshot.values?.sf3),
      nof: parseCompactNumber(snapshot.numericValues?.nof ?? snapshot.values?.nof),
      momoFlow: parseCompactNumber(snapshot.numericValues?.momoFlow ?? snapshot.values?.momoFlow),
      price: parseCompactNumber(snapshot.numericValues?.price ?? snapshot.values?.price)
    }
  };

  if (options.rebuildHistory) {
    updateMetricHistory(state.snapshot);
  }
  checkCustomAlarm(Boolean(options.initial));
  evaluateAlerts(state.snapshot, Boolean(options.initial));
  render();
}

function resetMonitorData() {
  state.snapshot = null;

  state.lastMetricValues = {
    sf3: null,
    nof: null,
    momoFlow: null
  };

  state.fiveMinuteMetricBases = {
    sf3: null,
    momoFlow: null
  };

  for (const key of Object.keys(state.minuteSeries)) {
    state.minuteSeries[key].clear();
  }

  state.priceMinuteChanges.clear();
  state.sf3FiveMinuteBuckets.clear();
  state.alerts = [];
  state.alertState = {
    sf3FiveMinute: "inside",
    nof: "inside",
    momoFlow: "inside",
    hourlyBand: null,
    dailyBand: null
  };
}

async function clearSession() {
  resetMonitorData();

  if (window.singleAlarmManager) {
    window.singleAlarmManager.clearTriggerHistory();
    window.singleAlarmManager.resetBoundaryState(getReferenceTime());
  }

  render();

  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    try {
      await chrome.runtime.sendMessage({
        type: "sf3-live-monitor-reset-history"
      });
    } catch (error) {
      console.warn("[SF3 Live Monitor] Failed to reset persisted monitor history:", error);
    }
  }
}

async function loadInitialSnapshot() {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    render();
    return;
  }

  const data = await chrome.storage.local.get([
    SNAPSHOT_STORAGE_KEY,
    MONITOR_TARGET_STORAGE_KEY,
    MONITOR_HISTORY_STORAGE_KEY
  ]);
  state.monitorTarget = data[MONITOR_TARGET_STORAGE_KEY] || null;
  const hasPersistedHistory = applyPersistedHistory(data[MONITOR_HISTORY_STORAGE_KEY]);

  if (data[SNAPSHOT_STORAGE_KEY]) {
    handleSnapshot(data[SNAPSHOT_STORAGE_KEY], {
      initial: true,
      rebuildHistory: !hasPersistedHistory
    });
  } else {
    render();
  }
}

function openPopoutWindow() {
  const width = 980;
  const height = 1120;
  const left = Math.max(0, Math.round((window.screen.width - width) / 2));
  const top = Math.max(0, Math.round((window.screen.height - height) / 2));
  const url = typeof chrome !== "undefined" && chrome.runtime?.getURL
    ? chrome.runtime.getURL("sidepanel.html?mode=popout")
    : "sidepanel.html?mode=popout";

  const popoutWindow = window.open(
    url,
    "SF3LiveMonitorPopout",
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
  );

  if (popoutWindow) {
    popoutWindow.focus();
  }
}

function bindEvents() {
  elements.armAudioButton.addEventListener("click", async () => {
    await window.audioAlarmNotifier.initAudioContext();
    state.audioArmed = true;
    elements.armAudioButton.textContent = "Audio Armed";
  });

  elements.clearSessionButton.addEventListener("click", () => {
    void clearSession();
  });

  elements.popoutButton.addEventListener("click", () => {
    openPopoutWindow();
  });

  elements.createAlarmButton.addEventListener("click", () => {
    openAlarmModal();
  });

  elements.closeAlarmModalButton.addEventListener("click", () => {
    closeAlarmModal();
  });

  elements.cancelAlarmButton.addEventListener("click", () => {
    closeAlarmModal();
  });

  elements.alarmMetricSelect.addEventListener("change", () => {
    updateAlarmFormState();
  });

  elements.alarmForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!window.singleAlarmManager) {
      return;
    }

    try {
      window.singleAlarmManager.createAlarm({
        metric: elements.alarmMetricSelect.value,
        thresholdInput: elements.alarmThresholdInput.value.trim(),
        isAbsolute: elements.alarmAbsoluteCheckbox.checked
      });
      closeAlarmModal();
      renderAlarmDisplay();
    } catch (error) {
      elements.alarmThresholdHint.textContent = error.message;
    }
  });

  elements.alarmModal.addEventListener("click", (event) => {
    if (event.target === elements.alarmModal) {
      closeAlarmModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.alarmModal.classList.contains("open")) {
      closeAlarmModal();
    }
  });

  window.addEventListener("storage", (event) => {
    if (window.singleAlarmManager?.isStorageKey(event.key)) {
      window.singleAlarmManager.reloadFromStorage();
      renderAlarmDisplay();
    }
  });

  if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") {
        return;
      }

      if (changes[MONITOR_TARGET_STORAGE_KEY]) {
        state.monitorTarget = changes[MONITOR_TARGET_STORAGE_KEY].newValue || null;
        if (state.monitorTarget?.status && state.monitorTarget.status !== "active") {
          resetMonitorData();
        }
        render();
      }

      if (changes[MONITOR_HISTORY_STORAGE_KEY]) {
        applyPersistedHistory(changes[MONITOR_HISTORY_STORAGE_KEY].newValue);
      }

      if (changes[SNAPSHOT_STORAGE_KEY]) {
        if (changes[SNAPSHOT_STORAGE_KEY].newValue) {
          handleSnapshot(changes[SNAPSHOT_STORAGE_KEY].newValue);
        } else {
          resetMonitorData();
          render();
        }
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const isPopout = new URLSearchParams(window.location.search).get("mode") === "popout";
  if (isPopout) {
    document.body.classList.add("mode-popout");
  }

  elements.statusBadge = document.getElementById("statusBadge");
  elements.monitorTargetText = document.getElementById("monitorTargetText");
  elements.lastUpdatedText = document.getElementById("lastUpdatedText");
  elements.currentMetricsGrid = document.getElementById("currentMetricsGrid");
  elements.rollingMetricsGrid = document.getElementById("rollingMetricsGrid");
  elements.metricCharts = {
    nof: document.getElementById("nofChart"),
    momoFlow: document.getElementById("momoFlowChart"),
    sf3: document.getElementById("sf3Chart")
  };
  elements.priceChart = document.getElementById("priceChart");
  elements.alertsList = document.getElementById("alertsList");
  elements.popoutButton = document.getElementById("popoutButton");
  elements.armAudioButton = document.getElementById("armAudioButton");
  elements.clearSessionButton = document.getElementById("clearSessionButton");
  elements.createAlarmButton = document.getElementById("createAlarmButton");
  elements.alarmDisplay = document.getElementById("alarmDisplay");
  elements.alarmModal = document.getElementById("alarmModal");
  elements.closeAlarmModalButton = document.getElementById("closeAlarmModalButton");
  elements.cancelAlarmButton = document.getElementById("cancelAlarmButton");
  elements.alarmForm = document.getElementById("alarmForm");
  elements.alarmMetricSelect = document.getElementById("alarmMetricSelect");
  elements.alarmMetricHint = document.getElementById("alarmMetricHint");
  elements.alarmThresholdInput = document.getElementById("alarmThresholdInput");
  elements.alarmThresholdHint = document.getElementById("alarmThresholdHint");
  elements.alarmAbsoluteCheckbox = document.getElementById("alarmAbsoluteCheckbox");

  bindEvents();
  updateAlarmFormState();
  void loadInitialSnapshot();
});