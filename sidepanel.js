const SNAPSHOT_STORAGE_KEY = "sf3LiveMonitorSnapshot";
const MONITOR_TARGET_STORAGE_KEY = "sf3LiveMonitorTarget";
const MONITOR_HISTORY_STORAGE_KEY = "sf3LiveMonitorHistory";
const HP_AUDIO_MUTE_STORAGE_KEY = "sf3LiveMonitorHpAudioMuteScopes";
const HP_AUDIO_SETTINGS_STORAGE_KEY = "sf3LiveMonitorHpAudioSettings";
const DEFAULT_HP_AUDIO_SETTINGS = {
  repeatSeconds: 0.8
};

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
  },
  gex: {
    label: "GEX",
    color: "#60a5fa",
    negativeColor: "#f87171",
    cardClass: "metric-gex",
    emptyMessage: "Waiting for GEX samples from the metrics modal..."
  },
  callHpAll: {
    label: "Call HP All",
    color: "#34d399",
    negativeColor: "#f87171",
    cardClass: "metric-hp",
    emptyMessage: "Waiting for Call HP All samples..."
  },
  putHpAll: {
    label: "Put HP All",
    color: "#fbbf24",
    negativeColor: "#ef4444",
    cardClass: "metric-hp",
    emptyMessage: "Waiting for Put HP All samples..."
  },
  zeroHpAll: {
    label: "Zero HP All",
    color: "#a78bfa",
    negativeColor: "#f472b6",
    cardClass: "metric-hp",
    emptyMessage: "Waiting for Zero HP All samples..."
  },
  gravityHpAll: {
    label: "Gravity HP All",
    color: "#f59e0b",
    negativeColor: "#ef4444",
    cardClass: "metric-hp",
    emptyMessage: "Waiting for Gravity HP All samples..."
  },
  callHp7: {
    label: "Call HP 7",
    color: "#22c55e",
    negativeColor: "#ef4444",
    cardClass: "metric-hp",
    emptyMessage: "Waiting for Call HP 7 samples..."
  },
  putHp7: {
    label: "Put HP 7",
    color: "#f97316",
    negativeColor: "#ef4444",
    cardClass: "metric-hp",
    emptyMessage: "Waiting for Put HP 7 samples..."
  },
  zeroHp7: {
    label: "Zero HP 7",
    color: "#818cf8",
    negativeColor: "#f472b6",
    cardClass: "metric-hp",
    emptyMessage: "Waiting for Zero HP 7 samples..."
  },
  gravityHp7: {
    label: "Gravity HP 7",
    color: "#eab308",
    negativeColor: "#ef4444",
    cardClass: "metric-hp",
    emptyMessage: "Waiting for Gravity HP 7 samples..."
  },
  callHp0: {
    label: "Call HP 0",
    color: "#10b981",
    negativeColor: "#ef4444",
    cardClass: "metric-hp",
    emptyMessage: "Waiting for Call HP 0 samples..."
  },
  putHp0: {
    label: "Put HP 0",
    color: "#f97316",
    negativeColor: "#ef4444",
    cardClass: "metric-hp",
    emptyMessage: "Waiting for Put HP 0 samples..."
  },
  zeroHp0: {
    label: "Zero HP 0",
    color: "#818cf8",
    negativeColor: "#f472b6",
    cardClass: "metric-hp",
    emptyMessage: "Waiting for Zero HP 0 samples..."
  },
  gravityHp0: {
    label: "Gravity HP 0",
    color: "#eab308",
    negativeColor: "#ef4444",
    cardClass: "metric-hp",
    emptyMessage: "Waiting for Gravity HP 0 samples..."
  },
  darkPool: {
    label: "Dark Pool",
    color: "#8b5cf6",
    negativeColor: "#d1d5db",
    cardClass: "metric-dp",
    emptyMessage: "Waiting for Dark Pool data..."
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

const TRACKED_METRIC_KEYS = [
  "sf3",
  "nof",
  "momoFlow",
  "gex",
  "callHpAll",
  "putHpAll",
  "zeroHpAll",
  "gravityHpAll",
  "callHp7",
  "putHp7",
  "zeroHp7",
  "gravityHp7",
  "callHp0",
  "putHp0",
  "zeroHp0",
  "gravityHp0"
];
const METRIC_CHART_ORDER = [...TRACKED_METRIC_KEYS];
const MINUTE_CHANGE_SUM_METRICS = new Set(["nof"]);
const FIVE_MINUTE_RESET_METRICS = new Set([
  "sf3",
  "momoFlow",
  "gex",
  "callHpAll",
  "putHpAll",
  "zeroHpAll",
  "gravityHpAll",
  "callHp7",
  "putHp7",
  "zeroHp7",
  "gravityHp7",
  "callHp0",
  "putHp0",
  "zeroHp0",
  "gravityHp0"
]);
const WICKY_METRIC_SCALE_STEP = 5_000_000;
const WICKY_STYLE_SCALE_METRICS = new Set(["sf3", "momoFlow"]);
const METRIC_SCALE_STEP_OVERRIDES = {
  gex: 10
};

const DASHBOARD_METRICS = [
  { key: "sf3", label: "SF3" },
  { key: "nof", label: "NOF" },
  { key: "momoFlow", label: "MomoFlow" },
  { key: "gex", label: "GEX" },
  { key: "callHpAll", label: "Call HP All" },
  { key: "putHpAll", label: "Put HP All" },
  { key: "zeroHpAll", label: "Zero HP All" },
  { key: "gravityHpAll", label: "Gravity HP All" },
  { key: "callHp7", label: "Call HP 7" },
  { key: "putHp7", label: "Put HP 7" },
  { key: "zeroHp7", label: "Zero HP 7" },
  { key: "gravityHp7", label: "Gravity HP 7" },
  { key: "callHp0", label: "Call HP 0" },
  { key: "putHp0", label: "Put HP 0" },
  { key: "zeroHp0", label: "Zero HP 0" },
  { key: "gravityHp0", label: "Gravity HP 0" },
  { key: "price", label: "Price" },
  { key: "darkPool", label: "Dark Pool", isSpecial: true }
];
const CHART_DIMENSIONS = {
  width: 640,
  height: 190,
  margin: { top: 14, right: 18, bottom: 34, left: 68 }
};
const MAX_ALERTS = 12;
const MAX_MINUTE_HISTORY_MS = 60 * 60 * 1000;
const MAX_FIVE_MINUTE_HISTORY_MS = 48 * 60 * 60 * 1000;

const HP_ALARM_SCOPE_CONFIG = [
  { id: "all", callKey: "callHpAll", putKey: "putHpAll" },
  { id: "7", callKey: "callHp7", putKey: "putHp7" },
  { id: "0", callKey: "callHp0", putKey: "putHp0" }
];

function buildMetricStateObject(valueFactory) {
  return TRACKED_METRIC_KEYS.reduce((accumulator, key) => {
    accumulator[key] = valueFactory(key);
    return accumulator;
  }, {});
}

const state = {
  snapshot: null,
  monitorTarget: null,
  selectedCharts: new Set(),
  minuteSeries: buildMetricStateObject(() => new Map()),
  lastMetricValues: buildMetricStateObject(() => null),
  fiveMinuteMetricBases: buildMetricStateObject((key) => (FIVE_MINUTE_RESET_METRICS.has(key) ? null : undefined)),
  priceMinuteChanges: new Map(),
  sf3FiveMinuteBuckets: new Map(),
  darkPoolMinuteSeries: new Map(),
  alerts: [],
  alertState: {
    sf3FiveMinute: "inside",
    nof: "inside",
    momoFlow: "inside",
    hourlyBand: null,
    dailyBand: null
  },
  hpAudioMuteScopes: new Set(),
  hpAudioRepeatSeconds: DEFAULT_HP_AUDIO_SETTINGS.repeatSeconds,
  hpTrackSourceLabels: {
    terminalRed: "Built-in",
    pretiumAvaritiae: "Built-in"
  },
  audioArmed: false,
  lastDarkPoolAlarmDistance: null,
  darkPoolState: {
    previousValue: null,
    previousFormationTime: null,
    priceCrossed: false
  }
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

function normalizeHpAudioMuteScopes(rawScopes) {
  const allowed = new Set(HP_ALARM_SCOPE_CONFIG.map((scope) => scope.id));
  if (!Array.isArray(rawScopes)) {
    return new Set();
  }

  return new Set(rawScopes.filter((scope) => allowed.has(scope)));
}

function sanitizeRepeatSeconds(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return DEFAULT_HP_AUDIO_SETTINGS.repeatSeconds;
  }

  return Math.min(30, Math.max(0, numeric));
}

function updateHpTrackSourceLabels() {
  if (elements.redSongSourceText) {
    elements.redSongSourceText.textContent = state.hpTrackSourceLabels.terminalRed;
  }

  if (elements.greenSongSourceText) {
    elements.greenSongSourceText.textContent = state.hpTrackSourceLabels.pretiumAvaritiae;
  }
}

function applyHpAudioRepeatSetting() {
  if (!window.audioAlarmNotifier?.setTrackReplayCooldownMs) {
    return;
  }

  window.audioAlarmNotifier.setTrackReplayCooldownMs(state.hpAudioRepeatSeconds * 1000);
}

function updateHpAudioMuteButtonLabel() {
  if (!elements.hpAudioMuteButton) {
    return;
  }

  const mutedCount = state.hpAudioMuteScopes.size;
  elements.hpAudioMuteButton.textContent = mutedCount ? `Audio Settings (${mutedCount} muted)` : "Audio Settings";
}

async function loadHpAudioMuteSettings() {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    applyHpAudioRepeatSetting();
    updateHpTrackSourceLabels();
    updateHpAudioMuteButtonLabel();
    return;
  }

  const data = await chrome.storage.local.get([
    HP_AUDIO_MUTE_STORAGE_KEY,
    HP_AUDIO_SETTINGS_STORAGE_KEY
  ]);

  const settings = data[HP_AUDIO_SETTINGS_STORAGE_KEY] || {};
  state.hpAudioMuteScopes = normalizeHpAudioMuteScopes(data[HP_AUDIO_MUTE_STORAGE_KEY]);
  state.hpAudioRepeatSeconds = sanitizeRepeatSeconds(settings.repeatSeconds);
  applyHpAudioRepeatSetting();
  updateHpTrackSourceLabels();
  updateHpAudioMuteButtonLabel();
}

async function saveHpAudioMuteSettings() {
  const scopes = [...state.hpAudioMuteScopes];
  const settings = {
    repeatSeconds: state.hpAudioRepeatSeconds
  };

  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    applyHpAudioRepeatSetting();
    updateHpAudioMuteButtonLabel();
    return;
  }

  await chrome.storage.local.set({
    [HP_AUDIO_MUTE_STORAGE_KEY]: scopes,
    [HP_AUDIO_SETTINGS_STORAGE_KEY]: settings
  });
  applyHpAudioRepeatSetting();
  updateHpAudioMuteButtonLabel();
}

function openHpAudioMuteModal() {
  if (!elements.hpAudioMuteModal) {
    return;
  }

  elements.muteHpAllCheckbox.checked = state.hpAudioMuteScopes.has("all");
  elements.muteHp7Checkbox.checked = state.hpAudioMuteScopes.has("7");
  elements.muteHp0Checkbox.checked = state.hpAudioMuteScopes.has("0");
  elements.hpAudioRepeatSecondsInput.value = String(state.hpAudioRepeatSeconds);
  updateHpTrackSourceLabels();
  elements.hpAudioMuteModal.classList.add("open");
  elements.hpAudioMuteModal.setAttribute("aria-hidden", "false");
}

function closeHpAudioMuteModal() {
  if (!elements.hpAudioMuteModal) {
    return;
  }

  elements.hpAudioMuteModal.classList.remove("open");
  elements.hpAudioMuteModal.setAttribute("aria-hidden", "true");
}

function setHpTrackToBuiltIn(trackName) {
  if (!window.audioAlarmNotifier?.resetTrackSource) {
    return;
  }

  window.audioAlarmNotifier.resetTrackSource(trackName);
  state.hpTrackSourceLabels[trackName] = "Built-in";
  updateHpTrackSourceLabels();
}

function handleHpTrackFileSelection(trackName, file) {
  if (!file || !window.audioAlarmNotifier?.setTrackSource) {
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  window.audioAlarmNotifier.setTrackSource(trackName, objectUrl, { objectUrl: true });
  state.hpTrackSourceLabels[trackName] = `${file.name} (local)`;
  updateHpTrackSourceLabels();
}

// ── Indicator tile dashboard ──────────────────────────────────────────────────

function renderIndicatorTiles() {
  const grid = document.getElementById("indicatorTileGrid");
  if (!grid) return;

  DASHBOARD_METRICS.forEach((metric) => {
    const { key, label, isSpecial } = metric;
    let tile = grid.querySelector(`.indicator-tile[data-metric="${key}"]`);

    if (!tile) {
      tile = document.createElement("article");
      tile.className = "indicator-tile";
      if (isSpecial && key === "darkPool") {
        tile.classList.add("darkpool-tile");
      }
      tile.dataset.metric = key;
      tile.innerHTML = `
        <div class="tile-label">${label}</div>
        ${isSpecial && key === "darkPool" ? `
          <div class="tile-value" id="darkPoolValueDisplay">--</div>
          <div class="tile-status"><span class="crossed-indicator" id="darkPoolCrossedIndicator"></span><span id="darkPoolCrossedText">--</span></div>
        ` : `
          <div class="tile-caption">Show chart</div>
        `}
      `;
      // All tiles (including darkPool) are now clickable for chart selection
      tile.addEventListener("click", () => toggleChartSelection(key));
      grid.appendChild(tile);
    }

    // Update selected state for all metrics
    const selected = state.selectedCharts.has(key);
    tile.classList.toggle("selected", selected);
    const caption = tile.querySelector(".tile-caption");
    if (caption) {
      caption.textContent = selected ? "Chart selected" : "Show chart";
    }
  });
  renderDarkPoolTile();
}

function createChartPanel(metric) {
  const section = document.getElementById("charts-section");
  if (!section || document.getElementById(`chart-panel-${metric}`)) return;

  let label = "Unknown";
  if (metric === "price") {
    label = "Price";
  } else if (metric === "darkPool") {
    label = "Dark Pool";
  } else if (SERIES_META[metric]) {
    label = SERIES_META[metric].label;
  }

  const panel = document.createElement("section");
  panel.className = "panel chart-panel";
  panel.id = `chart-panel-${metric}`;
  panel.style.opacity = "0";
  panel.style.transition = "opacity 0.25s ease";
  
  if (metric === "darkPool") {
    // Dark pool has special layout: chart on left, status circle on right
    panel.innerHTML = `
      <div class="chart-header">
        <div><h2 class="section-title">${label}</h2></div>
        <button class="chart-card-close" data-metric="${metric}" title="Remove chart">&#x2715;</button>
      </div>
      <div class="chart-frame dark-pool-frame">
        <div class="dark-pool-chart-container">
          <svg class="chart-svg" id="chart-svg-${metric}" viewBox="0 0 320 190" preserveAspectRatio="none"></svg>
        </div>
        <div class="dark-pool-indicator-container">
          <div id="darkPoolChartIndicator" class="dark-pool-circle"></div>
        </div>
      </div>
    `;
    elements.darkPoolChart = document.getElementById(`chart-svg-${metric}`);
  } else {
    panel.innerHTML = `
      <div class="chart-header">
        <div><h2 class="section-title">${label}</h2></div>
        <button class="chart-card-close" data-metric="${metric}" title="Remove chart">&#x2715;</button>
      </div>
      <div class="chart-frame">
        <svg class="chart-svg" id="chart-svg-${metric}" viewBox="0 0 640 190" preserveAspectRatio="none"></svg>
      </div>
    `;
    
    // Store SVG ref
    if (metric === "price") {
      elements.priceChart = document.getElementById(`chart-svg-${metric}`);
    } else {
      elements.metricCharts[metric] = document.getElementById(`chart-svg-${metric}`);
    }
  }
  
  section.appendChild(panel);

  // Wire close button
  panel.querySelector(".chart-card-close").addEventListener("click", (e) => {
    deselectChart(e.currentTarget.dataset.metric);
  });

  // Animate in then render
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { panel.style.opacity = "1"; });
  });

  if (metric === "darkPool") {
    renderDarkPoolChart();
  } else if (metric === "price") {
    renderPriceChart();
  } else {
    renderMetricBarChart(metric);
  }
}

function removeChartPanel(metric) {
  const panel = document.getElementById(`chart-panel-${metric}`);
  if (panel) {
    panel.style.opacity = "0";
    setTimeout(() => { if (panel.parentNode) panel.parentNode.removeChild(panel); }, 280);
  }
  if (metric === "price") {
    elements.priceChart = null;
  } else if (metric === "darkPool") {
    elements.darkPoolChart = null;
  } else {
    delete elements.metricCharts[metric];
  }
}

function toggleChartSelection(metric) {
  if (state.selectedCharts.has(metric)) {
    deselectChart(metric);
  } else {
    state.selectedCharts.add(metric);
    createChartPanel(metric);
    const tile = document.querySelector(`.indicator-tile[data-metric="${metric}"]`);
    if (tile) tile.classList.add("selected");
  }
}

function deselectChart(metric) {
  state.selectedCharts.delete(metric);
  removeChartPanel(metric);
  const tile = document.querySelector(`.indicator-tile[data-metric="${metric}"]`);
  if (tile) tile.classList.remove("selected");
}

// ─────────────────────────────────────────────────────────────────────────────

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

  // Track dark pool volume changes
  const darkPoolValue = parseCompactNumber(snapshot.numericValues?.darkPool);
  if (darkPoolValue != null) {
    const series = state.darkPoolMinuteSeries;
    const previousEntry = Array.from(series.values()).pop();
    const changeValue = previousEntry && Number.isFinite(previousEntry.value) ? darkPoolValue - previousEntry.value : 0;
    
    series.set(minuteBucket, {
      timestamp: minuteBucket,
      value: darkPoolValue,
      change: changeValue
    });
    
    pruneMap(series, minuteBucket, MAX_MINUTE_HISTORY_MS);
  }

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

  state.lastMetricValues = buildMetricStateObject((key) => history?.lastMetricValues?.[key] ?? null);
  state.fiveMinuteMetricBases = buildMetricStateObject((key) => {
    if (!FIVE_MINUTE_RESET_METRICS.has(key)) {
      return undefined;
    }

    return history?.fiveMinuteMetricBases?.[key] || null;
  });

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

function evaluateHpPriceAudio(previousSnapshot, currentSnapshot, isInitial) {
  if (isInitial || !state.audioArmed || !window.audioAlarmNotifier?.playTrack || !previousSnapshot || !currentSnapshot) {
    return;
  }

  const previousPrice = previousSnapshot.numericValues?.price;
  const currentPrice = currentSnapshot.numericValues?.price;
  if (![previousPrice, currentPrice].every(Number.isFinite)) {
    return;
  }

  let shouldPlayTerminalRed = false;
  let shouldPlayPretium = false;

  for (const scopeConfig of HP_ALARM_SCOPE_CONFIG) {
    if (state.hpAudioMuteScopes.has(scopeConfig.id)) {
      continue;
    }

    const previousCallHp = previousSnapshot.numericValues?.[scopeConfig.callKey];
    const previousPutHp = previousSnapshot.numericValues?.[scopeConfig.putKey];
    const currentCallHp = currentSnapshot.numericValues?.[scopeConfig.callKey];
    const currentPutHp = currentSnapshot.numericValues?.[scopeConfig.putKey];

    if (![previousCallHp, previousPutHp, currentCallHp, currentPutHp].every(Number.isFinite)) {
      continue;
    }

    const callDelta = currentCallHp - previousCallHp;
    const putDelta = currentPutHp - previousPutHp;
    const isCallAbovePrice = currentCallHp > currentPrice;
    const isPriceAbovePut = currentPrice > currentPutHp;

    shouldPlayTerminalRed = shouldPlayTerminalRed ||
      (isCallAbovePrice && callDelta < 0) ||
      (isPriceAbovePut && putDelta < 0);

    shouldPlayPretium = shouldPlayPretium ||
      (isCallAbovePrice && callDelta > 0) ||
      (isPriceAbovePut && putDelta > 0);
  }

  // Priority: Terminal Red when structure weakens against price, else Pretium Avaritiae.

  if (shouldPlayTerminalRed) {
    void window.audioAlarmNotifier.playTrack("terminalRed");
    return;
  }

  if (shouldPlayPretium) {
    void window.audioAlarmNotifier.playTrack("pretiumAvaritiae");
  }
}

function renderStatus() {
  if (!elements.monitorTargetText || !elements.statusBadge || !elements.lastUpdatedText) {
    return;
  }

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

function renderDarkPoolTile() {
  const darkPool = state.snapshot?.numericValues?.darkPool;
  const price = state.snapshot?.numericValues?.price;

  // Update dark pool state tracking
  if (Number.isFinite(darkPool)) {
    const hasMoved = state.darkPoolState.previousValue !== null && Math.abs(darkPool - state.darkPoolState.previousValue) > 0.01;
    const hasVolumeIncrease = state.darkPoolState.previousValue !== null && Math.abs(darkPool) > Math.abs(state.darkPoolState.previousValue) * 1.25;

    if (hasMoved || hasVolumeIncrease) {
      // DP moved or volume increased >25%, reset crossed state
      state.darkPoolState.priceCrossed = false;
      state.darkPoolState.previousFormationTime = Date.now();
    }

    state.darkPoolState.previousValue = darkPool;
  }

  // Update price crossed state
  if (Number.isFinite(darkPool) && Number.isFinite(price)) {
    const priceIsAboveDP = price > darkPool;
    if (state.darkPoolState.previousValue !== null) {
      const dpIsAbove = darkPool > price;
      if (dpIsAbove !== (state.darkPoolState.previousValue > price)) {
        state.darkPoolState.priceCrossed = true;
      }
    }
  }

  // Render tile display
  const valueDisplay = document.getElementById("darkPoolValueDisplay");
  const crossedIndicator = document.getElementById("darkPoolCrossedIndicator");
  const crossedText = document.getElementById("darkPoolCrossedText");

  if (valueDisplay) {
    valueDisplay.textContent = Number.isFinite(darkPool) ? formatPrice(darkPool) : "--";
  }

  if (crossedIndicator && crossedText) {
    if (Number.isFinite(darkPool) && Number.isFinite(price)) {
      crossedIndicator.classList.toggle("crossed", state.darkPoolState.priceCrossed);
      crossedText.textContent = state.darkPoolState.priceCrossed ? "Crossed" : "Not crossed";
    } else {
      crossedIndicator.className = "crossed-indicator";
      crossedText.textContent = "--";
    }
  }

  // Trigger alarm if distance >= $1.00 and armed
  if (Number.isFinite(darkPool) && Number.isFinite(price)) {
    const distance = Math.abs(darkPool - price);
    if (distance >= 1.0 && state.audioArmed && window.audioAlarmNotifier?.playTrack) {
      // Track last alarm distance to avoid spam (only fire on new significant crossings)
      if (!state.lastDarkPoolAlarmDistance || distance >= state.lastDarkPoolAlarmDistance + 0.5 || distance <= state.lastDarkPoolAlarmDistance - 0.5) {
        state.lastDarkPoolAlarmDistance = distance;
        void window.audioAlarmNotifier.playTrack("darkpool");
      }
    } else if (distance < 1.0) {
      // Reset alarm state when distance drops below threshold
      state.lastDarkPoolAlarmDistance = null;
    }
  }
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
  // Superseded by renderIndicatorTiles(). Kept as no-op to avoid breakage if called externally.
}

function renderRollingMetrics() {
  // Compact mode: rolling live-number summary cards are intentionally hidden.
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
  let tickStep = null;

  if (metric && WICKY_STYLE_SCALE_METRICS.has(metric)) {
    adjustedMin = Math.min(safeMin, -WICKY_METRIC_SCALE_STEP);
    adjustedMax = Math.max(safeMax, WICKY_METRIC_SCALE_STEP);
    adjustedMin = snapMetricBoundary(adjustedMin, "min", WICKY_METRIC_SCALE_STEP);
    adjustedMax = snapMetricBoundary(adjustedMax, "max", WICKY_METRIC_SCALE_STEP);
  }

  if (metric && Number.isFinite(METRIC_SCALE_STEP_OVERRIDES[metric])) {
    tickStep = METRIC_SCALE_STEP_OVERRIDES[metric];
    adjustedMin = snapMetricBoundary(adjustedMin, "min", tickStep);
    adjustedMax = snapMetricBoundary(adjustedMax, "max", tickStep);
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
    tickStep,
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
  const { width, height, margin, plotHeight, minValue, maxValue, yScale, tickStep } = scales;
  const lines = [];
  const zeroTolerance = Math.max(Math.abs(maxValue - minValue) * 0.001, 1e-9);
  let hasZeroTick = false;

  if (Number.isFinite(tickStep) && tickStep > 0) {
    const maxLines = 25;
    let lineCount = 0;
    for (let value = maxValue; value >= minValue && lineCount < maxLines; value -= tickStep, lineCount += 1) {
      const y = yScale(value);
      if (Math.abs(value) <= zeroTolerance) {
        hasZeroTick = true;
      }

      lines.push(`
      <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="rgba(142,163,197,0.14)" stroke-width="1"></line>
      <text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" fill="#8ea3c5" font-size="11">${formatter(value)}</text>
    `);
    }
  } else {
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

function renderDarkPoolChart() {
  if (!elements.darkPoolChart) {
    return;
  }

  const series = state.darkPoolMinuteSeries;
  const windowPoints = getVisibleMinuteWindow();
  
  // Map window points to dark pool entries
  const dataPoints = windowPoints.map((time) => {
    const bucket = floorToMinute(time).getTime();
    const entry = series.get(bucket);
    return {
      time,
      value: entry?.value ?? null,
      change: entry?.change ?? null
    };
  });

  const changes = dataPoints
    .map((point) => point.change)
    .filter((value) => value != null && Number.isFinite(value));

  if (!changes.length) {
    const meta = SERIES_META.darkPool;
    renderEmptyChart(elements.darkPoolChart, meta.emptyMessage);
    updateDarkPoolIndicator();
    return;
  }

  // Get chart dimensions for left half (320 viewBox width)
  const chartWidth = 320;
  const chartHeight = 190;
  const margin = { top: 14, right: 8, bottom: 34, left: 50 };
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;

  const minChange = Math.min(...changes, 0);
  const maxChange = Math.max(...changes, 0);
  const changeRange = maxChange - minChange || 1;
  const yPadding = changeRange * 0.1;
  const yMin = minChange - yPadding;
  const yMax = maxChange + yPadding;

  const yScale = (value) => {
    if (!Number.isFinite(value)) return plotHeight;
    const normalized = (value - yMin) / (yMax - yMin);
    return margin.top + plotHeight - (normalized * plotHeight);
  };

  const xScale = (index) => margin.left + (index / (windowPoints.length - 1)) * plotWidth;

  // Build bar markup for changes
  const barMarkup = dataPoints.map((point, index) => {
    if (point.change === null || !Number.isFinite(point.change)) return '';
    const barWidth = Math.max(2, plotWidth / (windowPoints.length * 1.5));
    const barX = xScale(index) - barWidth / 2;
    const baselineY = yScale(0);
    const height = Math.abs(baselineY - yScale(point.change));
    const barY = Math.min(yScale(point.change), baselineY);
    const color = point.change >= 0 ? '#8b5cf6' : '#d1d5db';
    
    return `<rect x="${barX}" y="${barY}" width="${barWidth}" height="${height}" fill="${color}" opacity="0.8"></rect>`;
  }).join('');

  // Build grid markup
  const gridMarkup = [];
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const ratio = i / gridLines;
    const value = yMin + (yMax - yMin) * ratio;
    const y = yScale(value);
    gridMarkup.push(`
      <line x1="${margin.left}" y1="${y}" x2="${chartWidth - margin.right}" y2="${y}" stroke="rgba(142,163,197,0.08)" stroke-width="1"></line>
      <text x="${margin.left - 4}" y="${y + 4}" text-anchor="end" fill="#8ea3c5" font-size="9">${formatPrice(value)}</text>
    `);
  }

  // Build time axis
  const timeAxisMarkup = windowPoints.map((time, index) => {
    const x = xScale(index);
    return `
      <line x1="${x}" y1="${margin.top}" x2="${x}" y2="${chartHeight - margin.bottom}" stroke="rgba(142,163,197,0.08)" stroke-width="1"></line>
      <text x="${x}" y="${chartHeight - 12}" text-anchor="middle" fill="#8ea3c5" font-size="11">${formatMinuteLabel(time)}</text>
    `;
  }).join('');

  elements.darkPoolChart.innerHTML = `
    <rect x="0" y="0" width="${chartWidth}" height="${chartHeight}" fill="rgba(255,255,255,0.01)"></rect>
    ${gridMarkup.join('')}
    ${timeAxisMarkup}
    ${barMarkup}
  `;

  updateDarkPoolIndicator();
}

function updateDarkPoolIndicator() {
  const indicator = document.getElementById("darkPoolChartIndicator");
  if (!indicator) return;

  const darkPool = state.snapshot?.numericValues?.darkPool;
  const price = state.snapshot?.numericValues?.price;
  const priceCrossed = state.darkPoolState.priceCrossed;

  indicator.className = "dark-pool-circle";
  
  if (!Number.isFinite(darkPool) || !Number.isFinite(price)) {
    return;
  }

  if (priceCrossed) {
    indicator.classList.add("dp-crossed");
  } else if (darkPool < price) {
    indicator.classList.add("dp-below");
  } else {
    indicator.classList.add("dp-above");
  }
}

function renderMetricBarChart(metric) {
  const svg = elements.metricCharts[metric];
  if (!svg) return;
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
  if (!elements.priceChart) return;
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
    if (state.selectedCharts.has(metric) && elements.metricCharts[metric]) {
      renderMetricBarChart(metric);
    }
  }

  if (state.selectedCharts.has("price") && elements.priceChart) {
    renderPriceChart();
  }

  if (state.selectedCharts.has("darkPool") && elements.darkPoolChart) {
    renderDarkPoolChart();
  }
}

function render() {
  renderStatus();
  renderIndicatorTiles();
  renderRollingMetrics();
  renderAlarmDisplay();
  renderCharts();
  renderAlerts();
}

function handleSnapshot(snapshot, options = {}) {
  if (!snapshot?.timestamp) {
    return;
  }

  const previousSnapshot = state.snapshot;

  if (snapshot.monitorTarget) {
    state.monitorTarget = snapshot.monitorTarget;
  }

  state.snapshot = {
    ...snapshot,
    numericValues: {
      ...TRACKED_METRIC_KEYS.reduce((accumulator, key) => {
        accumulator[key] = parseCompactNumber(snapshot.numericValues?.[key] ?? snapshot.values?.[key]);
        return accumulator;
      }, {}),
      darkPool: parseCompactNumber(snapshot.numericValues?.darkPool ?? snapshot.values?.darkPool),
      price: parseCompactNumber(snapshot.numericValues?.price ?? snapshot.values?.price)
    }
  };

  evaluateHpPriceAudio(previousSnapshot, state.snapshot, Boolean(options.initial));
  renderDarkPoolTile();

  if (options.rebuildHistory) {
    updateMetricHistory(state.snapshot);
  }
  checkCustomAlarm(Boolean(options.initial));
  evaluateAlerts(state.snapshot, Boolean(options.initial));
  render();
}

function resetMonitorData() {
  state.snapshot = null;

  state.lastMetricValues = buildMetricStateObject(() => null);
  state.fiveMinuteMetricBases = buildMetricStateObject((key) => (FIVE_MINUTE_RESET_METRICS.has(key) ? null : undefined));

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
      console.warn("[SF3 Goblin] Failed to reset persisted monitor history:", error);
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

  elements.hpAudioMuteButton.addEventListener("click", () => {
    openHpAudioMuteModal();
  });

  elements.closeAlarmModalButton.addEventListener("click", () => {
    closeAlarmModal();
  });

  elements.cancelAlarmButton.addEventListener("click", () => {
    closeAlarmModal();
  });

  elements.closeHpAudioMuteModalButton.addEventListener("click", () => {
    closeHpAudioMuteModal();
  });

  elements.cancelHpAudioMuteButton.addEventListener("click", () => {
    closeHpAudioMuteModal();
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

  elements.hpAudioMuteModal.addEventListener("click", (event) => {
    if (event.target === elements.hpAudioMuteModal) {
      closeHpAudioMuteModal();
    }
  });

  elements.hpAudioMuteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.hpAudioMuteScopes = new Set();
    if (elements.muteHpAllCheckbox.checked) state.hpAudioMuteScopes.add("all");
    if (elements.muteHp7Checkbox.checked) state.hpAudioMuteScopes.add("7");
    if (elements.muteHp0Checkbox.checked) state.hpAudioMuteScopes.add("0");
    state.hpAudioRepeatSeconds = sanitizeRepeatSeconds(elements.hpAudioRepeatSecondsInput.value);
    void saveHpAudioMuteSettings();
    closeHpAudioMuteModal();
  });

  elements.redSongFileInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    handleHpTrackFileSelection("terminalRed", file);
    event.target.value = "";
  });

  elements.greenSongFileInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    handleHpTrackFileSelection("pretiumAvaritiae", file);
    event.target.value = "";
  });

  elements.resetRedSongButton.addEventListener("click", () => {
    setHpTrackToBuiltIn("terminalRed");
  });

  elements.resetGreenSongButton.addEventListener("click", () => {
    setHpTrackToBuiltIn("pretiumAvaritiae");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.alarmModal.classList.contains("open")) {
      closeAlarmModal();
    }
    if (event.key === "Escape" && elements.hpAudioMuteModal.classList.contains("open")) {
      closeHpAudioMuteModal();
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

      if (changes[HP_AUDIO_MUTE_STORAGE_KEY]) {
        state.hpAudioMuteScopes = normalizeHpAudioMuteScopes(changes[HP_AUDIO_MUTE_STORAGE_KEY].newValue);
        updateHpAudioMuteButtonLabel();
      }

      if (changes[HP_AUDIO_SETTINGS_STORAGE_KEY]) {
        const settings = changes[HP_AUDIO_SETTINGS_STORAGE_KEY].newValue || {};
        state.hpAudioRepeatSeconds = sanitizeRepeatSeconds(settings.repeatSeconds);
        applyHpAudioRepeatSetting();
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
  elements.currentMetricsGrid = null; // replaced by indicator tiles
  elements.rollingMetricsGrid = null;
  elements.metricCharts = {};
  elements.priceChart = null;
  elements.alertsList = document.getElementById("alertsList");
  elements.popoutButton = document.getElementById("popoutButton");
  elements.armAudioButton = document.getElementById("armAudioButton");
  elements.hpAudioMuteButton = document.getElementById("hpAudioMuteButton");
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
  elements.hpAudioMuteModal = document.getElementById("hpAudioMuteModal");
  elements.closeHpAudioMuteModalButton = document.getElementById("closeHpAudioMuteModalButton");
  elements.cancelHpAudioMuteButton = document.getElementById("cancelHpAudioMuteButton");
  elements.hpAudioMuteForm = document.getElementById("hpAudioMuteForm");
  elements.muteHpAllCheckbox = document.getElementById("muteHpAllCheckbox");
  elements.muteHp7Checkbox = document.getElementById("muteHp7Checkbox");
  elements.muteHp0Checkbox = document.getElementById("muteHp0Checkbox");
  elements.hpAudioRepeatSecondsInput = document.getElementById("hpAudioRepeatSecondsInput");
  elements.redSongFileInput = document.getElementById("redSongFileInput");
  elements.greenSongFileInput = document.getElementById("greenSongFileInput");
  elements.resetRedSongButton = document.getElementById("resetRedSongButton");
  elements.resetGreenSongButton = document.getElementById("resetGreenSongButton");
  elements.redSongSourceText = document.getElementById("redSongSourceText");
  elements.greenSongSourceText = document.getElementById("greenSongSourceText");
  elements.darkPoolValueIndicator = document.getElementById("darkPoolValueIndicator");

  bindEvents();
  updateAlarmFormState();
  applyHpAudioRepeatSetting();
  updateHpTrackSourceLabels();
  void loadHpAudioMuteSettings();
  void loadInitialSnapshot();
});