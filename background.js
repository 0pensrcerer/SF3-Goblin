const SNAPSHOT_STORAGE_KEY = "sf3LiveMonitorSnapshot";
const MONITOR_TARGET_STORAGE_KEY = "sf3LiveMonitorTarget";
const MONITOR_HISTORY_STORAGE_KEY = "sf3LiveMonitorHistory";
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
const MAX_MINUTE_HISTORY_MS = 60 * 60 * 1000;
const MAX_FIVE_MINUTE_HISTORY_MS = 48 * 60 * 60 * 1000;

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

function calculatePriceChangeCents(basePrice, currentPrice) {
  if (!Number.isFinite(basePrice) || !Number.isFinite(currentPrice)) {
    return null;
  }

  return Number(((currentPrice - basePrice) * 100).toFixed(2));
}

function buildMetricObject(valueFactory) {
  return TRACKED_METRIC_KEYS.reduce((accumulator, key) => {
    accumulator[key] = valueFactory(key);
    return accumulator;
  }, {});
}

function createEmptyMonitorHistory() {
  return {
    minuteSeries: buildMetricObject(() => []),
    lastMetricValues: buildMetricObject(() => null),
    fiveMinuteMetricBases: buildMetricObject((key) => (FIVE_MINUTE_RESET_METRICS.has(key) ? null : undefined)),
    priceMinuteChanges: [],
    sf3FiveMinuteBuckets: []
  };
}

function hydrateTimestampMap(entries) {
  const map = new Map();

  for (const entry of entries || []) {
    if (!entry || !Number.isFinite(entry.timestamp)) {
      continue;
    }

    map.set(entry.timestamp, entry);
  }

  return map;
}

function serializeTimestampMap(map) {
  return [...map.values()].sort((left, right) => left.timestamp - right.timestamp);
}

function pruneMap(map, referenceTime, maxAgeMs) {
  for (const [key] of map.entries()) {
    if (referenceTime - key > maxAgeMs) {
      map.delete(key);
    }
  }
}

function isSupportedUrl(url) {
  return typeof url === "string" && (
    url.startsWith("https://app.bigshort.com/") ||
    url.startsWith("file://")
  );
}

async function getMonitorTarget() {
  const data = await chrome.storage.local.get(MONITOR_TARGET_STORAGE_KEY);
  return data[MONITOR_TARGET_STORAGE_KEY] || null;
}

async function getMonitorHistory() {
  const data = await chrome.storage.local.get(MONITOR_HISTORY_STORAGE_KEY);
  const storedHistory = data[MONITOR_HISTORY_STORAGE_KEY];
  const emptyHistory = createEmptyMonitorHistory();

  return {
    minuteSeries: {
      ...emptyHistory.minuteSeries,
      ...(storedHistory?.minuteSeries || {})
    },
    lastMetricValues: {
      ...emptyHistory.lastMetricValues,
      ...(storedHistory?.lastMetricValues || {})
    },
    fiveMinuteMetricBases: {
      ...emptyHistory.fiveMinuteMetricBases,
      ...(storedHistory?.fiveMinuteMetricBases || {})
    },
    priceMinuteChanges: storedHistory?.priceMinuteChanges || [],
    sf3FiveMinuteBuckets: storedHistory?.sf3FiveMinuteBuckets || []
  };
}

async function clearStoredMonitorState() {
  await chrome.storage.local.remove([SNAPSHOT_STORAGE_KEY, MONITOR_HISTORY_STORAGE_KEY]);
}

async function saveMonitorTarget(target) {
  await chrome.storage.local.set({
    [MONITOR_TARGET_STORAGE_KEY]: target
  });
  return target;
}

async function setMonitorTarget(tab) {
  if (!tab?.id || !isSupportedUrl(tab.url)) {
    return null;
  }

  await clearStoredMonitorState();

  return saveMonitorTarget({
    tabId: tab.id,
    windowId: tab.windowId ?? null,
    url: tab.url || "",
    title: tab.title || "",
    status: "active",
    pinnedAt: new Date().toISOString()
  });
}

async function updateMonitorTargetForTab(tabId, tab, status) {
  const target = await getMonitorTarget();
  if (!target || target.tabId !== tabId) {
    return null;
  }

  return saveMonitorTarget({
    ...target,
    windowId: tab?.windowId ?? target.windowId ?? null,
    url: tab?.url || target.url || "",
    title: tab?.title || target.title || "",
    status,
    lastUpdatedAt: new Date().toISOString()
  });
}

async function markMonitorTargetClosed(tabId) {
  const target = await getMonitorTarget();
  if (!target || target.tabId !== tabId) {
    return;
  }

  await clearStoredMonitorState();

  await saveMonitorTarget({
    ...target,
    tabId: null,
    windowId: null,
    status: "closed",
    closedAt: new Date().toISOString()
  });
}

async function ensureContentScript(tabId) {
  if (!tabId) {
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
  } catch (error) {
    const message = String(error?.message || error || "");
    if (!message.includes("Cannot access") && !message.includes("No tab with id")) {
      console.warn("[SF3 Goblin] Failed to inject content script:", message);
    }
  }
}

async function requestImmediateScan(tabId) {
  if (!tabId) {
    return;
  }

  try {
    await chrome.tabs.sendMessage(tabId, {
      type: "sf3-live-monitor-force-scan"
    });
  } catch (error) {
    const message = String(error?.message || error || "");
    if (!message.includes("Receiving end does not exist") && !message.includes("No tab with id")) {
      console.warn("[SF3 Goblin] Failed to request a scan:", message);
    }
  }
}

function buildNextMonitorHistory(history, snapshot) {
  const metricMaps = buildMetricObject((key) => hydrateTimestampMap(history.minuteSeries?.[key]));
  const nextLastMetricValues = buildMetricObject((key) => history.lastMetricValues?.[key] ?? null);
  const nextFiveMinuteMetricBases = buildMetricObject((key) => {
    if (!FIVE_MINUTE_RESET_METRICS.has(key)) {
      return undefined;
    }

    return history.fiveMinuteMetricBases?.[key] || null;
  });
  const priceMinuteChanges = hydrateTimestampMap(history.priceMinuteChanges);
  const sf3FiveMinuteBuckets = hydrateTimestampMap(history.sf3FiveMinuteBuckets);

  const timestamp = new Date(snapshot.timestamp);
  const minuteBucket = floorToMinute(timestamp).getTime();
  const fiveMinuteBucket = floorToFiveMinutes(timestamp).getTime();

  for (const key of Object.keys(metricMaps)) {
    const numericValue = parseCompactNumber(snapshot.numericValues?.[key] ?? snapshot.values?.[key]);
    if (numericValue == null) {
      continue;
    }

    const series = metricMaps[key];
    if (FIVE_MINUTE_RESET_METRICS.has(key)) {
      const currentBase = nextFiveMinuteMetricBases[key];
      const isNewBucket = !currentBase || currentBase.bucket !== fiveMinuteBucket || !Number.isFinite(currentBase.value);
      if (isNewBucket) {
        nextFiveMinuteMetricBases[key] = {
          bucket: fiveMinuteBucket,
          value: numericValue
        };
        nextLastMetricValues[key] = numericValue;
        series.set(minuteBucket, {
          timestamp: minuteBucket,
          baseValue: numericValue,
          currentValue: numericValue,
          value: 0
        });
      } else {
        const previousValue = nextLastMetricValues[key];
        nextLastMetricValues[key] = numericValue;
        const delta = Number.isFinite(previousValue) ? numericValue - previousValue : 0;
        series.set(minuteBucket, {
          timestamp: minuteBucket,
          baseValue: currentBase.value,
          currentValue: numericValue,
          value: delta
        });
      }
    } else if (MINUTE_CHANGE_SUM_METRICS.has(key)) {
      const previousValue = nextLastMetricValues[key];
      nextLastMetricValues[key] = numericValue;

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

  const priceValue = parseCompactNumber(snapshot.numericValues?.price ?? snapshot.values?.price);
  if (priceValue != null) {
    const existingEntry = priceMinuteChanges.get(minuteBucket);
    const basePrice = existingEntry?.basePrice ?? priceValue;
    const changeCents = calculatePriceChangeCents(basePrice, priceValue);

    priceMinuteChanges.set(minuteBucket, {
      timestamp: minuteBucket,
      basePrice,
      currentPrice: priceValue,
      changeCents: changeCents ?? 0
    });
    pruneMap(priceMinuteChanges, minuteBucket, MAX_MINUTE_HISTORY_MS);
  }

  const sf3Value = parseCompactNumber(snapshot.numericValues?.sf3 ?? snapshot.values?.sf3);
  if (sf3Value != null) {
    const fiveMinuteBucket = floorToFiveMinutes(timestamp).getTime();
    sf3FiveMinuteBuckets.set(fiveMinuteBucket, {
      timestamp: fiveMinuteBucket,
      value: sf3Value
    });
    pruneMap(sf3FiveMinuteBuckets, fiveMinuteBucket, MAX_FIVE_MINUTE_HISTORY_MS);
  }

  return {
    minuteSeries: buildMetricObject((key) => serializeTimestampMap(metricMaps[key])),
    lastMetricValues: nextLastMetricValues,
    fiveMinuteMetricBases: nextFiveMinuteMetricBases,
    priceMinuteChanges: serializeTimestampMap(priceMinuteChanges),
    sf3FiveMinuteBuckets: serializeTimestampMap(sf3FiveMinuteBuckets)
  };
}

async function resetMonitorHistory() {
  await clearStoredMonitorState();
  const target = await getMonitorTarget();
  if (target?.tabId && target.status === "active") {
    await requestImmediateScan(target.tabId);
  }

  return { ok: true };
}

async function handleSnapshotPublish(message, sender) {
  const senderTabId = sender.tab?.id;
  const target = await getMonitorTarget();

  if (!senderTabId || !target?.tabId || senderTabId !== target.tabId) {
    return { accepted: false, reason: "not-target" };
  }

  const history = await getMonitorHistory();
  const nextHistory = buildNextMonitorHistory(history, message.snapshot);

  await chrome.storage.local.set({
    [MONITOR_HISTORY_STORAGE_KEY]: nextHistory,
    [SNAPSHOT_STORAGE_KEY]: {
      ...message.snapshot,
      monitorTarget: {
        tabId: target.tabId,
        windowId: target.windowId,
        url: target.url,
        title: target.title,
        status: target.status,
        pinnedAt: target.pinnedAt
      }
    }
  });

  return { accepted: true };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "sf3-live-monitor-publish-snapshot") {
    void handleSnapshotPublish(message, sender)
      .then((response) => {
        sendResponse(response);
      })
      .catch((error) => {
        console.warn("[SF3 Goblin] Failed to handle snapshot publish:", String(error?.message || error || ""));
        sendResponse({ accepted: false, reason: "error" });
      });

    return true;
  }

  if (message?.type === "sf3-live-monitor-reset-history") {
    void resetMonitorHistory()
      .then((response) => {
        sendResponse(response);
      })
      .catch((error) => {
        console.warn("[SF3 Goblin] Failed to reset monitor history:", String(error?.message || error || ""));
        sendResponse({ ok: false });
      });

    return true;
  }

  return undefined;
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab?.windowId) {
    try {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    } catch (error) {
      console.warn("[SF3 Goblin] Failed to open side panel:", String(error?.message || error || ""));
    }
  }

  if (tab?.id && isSupportedUrl(tab.url)) {
    void setMonitorTarget(tab)
      .then(() => ensureContentScript(tab.id))
      .then(() => requestImmediateScan(tab.id));
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") {
    return;
  }

  if (isSupportedUrl(tab?.url)) {
    void ensureContentScript(tabId);
  }

  void getMonitorTarget().then((target) => {
    if (target?.tabId !== tabId) {
      return;
    }

    if (isSupportedUrl(tab?.url)) {
      void updateMonitorTargetForTab(tabId, tab, "active")
        .then(() => requestImmediateScan(tabId));
      return;
    }

    void clearStoredMonitorState()
      .then(() => updateMonitorTargetForTab(tabId, tab, "unsupported"));
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void markMonitorTargetClosed(tabId);
});