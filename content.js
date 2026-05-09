(function () {
  if (window.sf3LiveMonitorLoaded) {
    return;
  }

  window.sf3LiveMonitorLoaded = true;

  const SNAPSHOT_STORAGE_KEY = "sf3LiveMonitorSnapshot";
  const THRESHOLD_LABEL_SELECTOR = "text.highcharts-plot-line-label";
  const PRICE_SELECTOR = "span.higlight-number.shade1";
  const METRICS_MODAL_SELECTOR = "#movableModal .movable-modal-content > div[style*='padding: 30px']";
  const METRICS_MODAL_XPATH = "/html/body/div/div[1]/main/div[6]/div/div[1]/div/div[2]";
  const FALLBACK_SF3_THRESHOLD_XPATHS = [
    "/html/body/div/div[1]/main/div[1]/div[2]/div[3]/div[1]/svg/text[10]",
    "/html/body/div/div[1]/main/div[1]/div[2]/div[3]/div[1]/svg/text[11]"
  ];
  const MODAL_LABEL_TO_KEY = {
    "MomoFlow:": "momoFlow",
    "NOFA:": "nof",
    "Net GEX:": "gex",
    "Call HP All:": "callHpAll",
    "Put HP All:": "putHpAll",
    "Zero HP All:": "zeroHpAll",
    "Gravity HP All:": "gravityHpAll",
    "Call HP 7:": "callHp7",
    "Put HP 7:": "putHp7",
    "Zero HP 7:": "zeroHp7",
    "Gravity HP 7:": "gravityHp7",
    "Call HP 0:": "callHp0",
    "Put HP 0:": "putHp0",
    "Zero HP 0:": "zeroHp0",
    "Gravity HP 0:": "gravityHp0"
  };
  const MODAL_METRIC_KEYS = Object.values(MODAL_LABEL_TO_KEY);

  let observer = null;
  let intervalId = null;
  let scanTimeoutId = null;
  let scanQueued = false;
  let forcePending = false;
  let lastSignature = "";

  function stopMonitoring() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    if (intervalId != null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }

    if (scanTimeoutId != null) {
      window.clearTimeout(scanTimeoutId);
      scanTimeoutId = null;
    }

    window.sf3LiveMonitorLoaded = false;
  }

  function normalizeText(value) {
    return String(value || "").replace(/\u200b/g, " ").replace(/\s+/g, " ").trim();
  }

  function parseCompactNumber(value) {
    const normalized = normalizeText(value).replace(/,/g, "");
    if (!normalized) {
      return null;
    }

    const match = normalized.match(/^([+-]?\d*\.?\d+)([KMBT])?$/i);
    if (!match) {
      return null;
    }

    const number = Number.parseFloat(match[1]);
    if (!Number.isFinite(number)) {
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

    return number * multiplier;
  }

  function getLiveTileValues() {
    const values = {};
    const groups = [...document.querySelectorAll(".live-updates-graph")];

    for (const group of groups) {
      const headingParagraphs = [...group.querySelectorAll(".heading-mobile p")];
      const label = normalizeText(
        headingParagraphs[0]?.textContent ||
        group.querySelector("textPath")?.textContent ||
        group.querySelector(".heading p")?.textContent ||
        ""
      ).toUpperCase();
      const value = normalizeText(
        group.querySelector(".graph-block .value.svelte-kxaiyw")?.textContent ||
        headingParagraphs[1]?.textContent ||
        group.querySelector(".value.svelte-kxaiyw")?.textContent ||
        ""
      );

      if (label && value) {
        values[label] = value;
      }
    }

    return values;
  }

  function nodeHasMetricsRows(node) {
    if (!(node instanceof Element)) {
      return false;
    }

    const text = normalizeText(node.textContent || "");
    return text.includes("MomoFlow:") && text.includes("NOFA:");
  }

  function getMetricsModalContainer() {
    const directMatch = document.querySelector(METRICS_MODAL_SELECTOR);
    if (nodeHasMetricsRows(directMatch)) {
      return directMatch;
    }

    const modalRoot = document.querySelector("#movableModal");
    if (modalRoot) {
      const candidates = [...modalRoot.querySelectorAll("div")];
      const contentMatch = candidates.find((candidate) => nodeHasMetricsRows(candidate));
      if (contentMatch) {
        return contentMatch;
      }
    }

    try {
      const result = document.evaluate(METRICS_MODAL_XPATH, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      const xpathMatch = result.singleNodeValue;
      if (nodeHasMetricsRows(xpathMatch)) {
        return xpathMatch;
      }
    } catch {
      return null;
    }

    return null;
  }

  function getModalMetrics() {
    const container = getMetricsModalContainer();
    if (!container) {
      return {};
    }

    const result = {};
    const children = [...container.children];

    for (const child of children) {
      const spans = child.querySelectorAll("span");
      if (!spans.length) {
        continue;
      }

      const label = normalizeText(spans[0].textContent);
      const value = normalizeText(child.textContent.replace(spans[0].textContent, ""));

      const metricKey = MODAL_LABEL_TO_KEY[label];
      if (metricKey) {
        result[metricKey] = value;
      }
    }

    return result;
  }

  function getCurrentPrice() {
    const element = document.querySelector(PRICE_SELECTOR);
    const text = normalizeText(element?.textContent || "");

    return {
      text,
      value: parseCompactNumber(text),
      source: text ? "banner" : ""
    };
  }

  function formatDecimal(value) {
    if (!Number.isFinite(value)) {
      return "";
    }

    return value.toFixed(2).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
  }

  function getLatestDarkPoolFromChart() {
    const charts = window.Highcharts?.charts;
    if (!Array.isArray(charts) || !charts.length) {
      return { text: "", value: null, source: "" };
    }

    let latestPoint = null;
    for (const chart of charts) {
      for (const series of chart?.series || []) {
        const className = normalizeText(series?.options?.className || series?.userOptions?.className || "").toLowerCase();
        const seriesName = normalizeText(series?.name || "").toLowerCase();
        const isDarkPool = className.includes("darkpool") || seriesName.includes("dark pool");
        if (!isDarkPool) {
          continue;
        }

        const points = Array.isArray(series.points) && series.points.length
          ? series.points
          : Array.isArray(series.data)
            ? series.data
            : [];

        for (const point of points) {
          const x = Number(point?.x);
          const y = Number(point?.y);
          if (!Number.isFinite(x) || !Number.isFinite(y)) {
            continue;
          }

          if (!latestPoint || x > latestPoint.x) {
            latestPoint = { x, y };
          }
        }
      }
    }

    if (!latestPoint) {
      return { text: "", value: null, source: "" };
    }

    return {
      text: formatDecimal(latestPoint.y),
      value: latestPoint.y,
      source: "chart"
    };
  }

  function queryXPathText(xpath) {
    try {
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return normalizeText(result.singleNodeValue?.textContent || "");
    } catch {
      return "";
    }
  }

  function getThresholds() {
    const thresholds = {
      sf3: { upperText: "", lowerText: "", upper: null, lower: null },
      nof: { upperText: "", lowerText: "", upper: null, lower: null },
      mf: { upperText: "", lowerText: "", upper: null, lower: null }
    };

    const labels = [...document.querySelectorAll(THRESHOLD_LABEL_SELECTOR)].map((node) => normalizeText(node.textContent));

    for (const text of labels) {
      const match = text.match(/^(SF3|NOF|MF)\s+(.+)$/i);
      if (!match) {
        continue;
      }

      const metric = match[1].toUpperCase() === "MF" ? "mf" : match[1].toLowerCase();
      const valueText = normalizeText(match[2]);
      const value = parseCompactNumber(valueText);
      if (value == null) {
        continue;
      }

      if (value >= 0) {
        thresholds[metric].upper = value;
        thresholds[metric].upperText = valueText;
      } else {
        thresholds[metric].lower = value;
        thresholds[metric].lowerText = valueText;
      }
    }

    if (!thresholds.sf3.upperText || !thresholds.sf3.lowerText) {
      for (const xpath of FALLBACK_SF3_THRESHOLD_XPATHS) {
        const text = queryXPathText(xpath);
        const match = text.match(/^(SF3)\s+(.+)$/i);
        if (!match) {
          continue;
        }

        const valueText = normalizeText(match[2]);
        const value = parseCompactNumber(valueText);
        if (value == null) {
          continue;
        }

        if (value >= 0) {
          thresholds.sf3.upper = value;
          thresholds.sf3.upperText = valueText;
        } else {
          thresholds.sf3.lower = value;
          thresholds.sf3.lowerText = valueText;
        }
      }
    }

    return thresholds;
  }

  function buildSnapshot() {
    const liveTiles = getLiveTileValues();
    const modalMetrics = getModalMetrics();
    const price = getCurrentPrice();
    const darkPool = getLatestDarkPoolFromChart();
    const thresholds = getThresholds();

    const values = {
      sf3: liveTiles.SF3 || "",
      nof: modalMetrics.nof || "",
      darkPool: darkPool.text || "",
      momoFlow: modalMetrics.momoFlow || "",
      gex: modalMetrics.gex || "",
      callHpAll: modalMetrics.callHpAll || "",
      putHpAll: modalMetrics.putHpAll || "",
      zeroHpAll: modalMetrics.zeroHpAll || "",
      gravityHpAll: modalMetrics.gravityHpAll || "",
      callHp7: modalMetrics.callHp7 || "",
      putHp7: modalMetrics.putHp7 || "",
      zeroHp7: modalMetrics.zeroHp7 || "",
      gravityHp7: modalMetrics.gravityHp7 || "",
      callHp0: modalMetrics.callHp0 || "",
      putHp0: modalMetrics.putHp0 || "",
      zeroHp0: modalMetrics.zeroHp0 || "",
      gravityHp0: modalMetrics.gravityHp0 || "",
      price: price.text || ""
    };

    const hasModalMetric = MODAL_METRIC_KEYS.some((key) => Boolean(values[key]));
    if (!values.sf3 && !hasModalMetric && price.value == null) {
      return null;
    }

    const numericValues = {
      sf3: parseCompactNumber(values.sf3),
      darkPool: parseCompactNumber(values.darkPool),
      price: price.value
    };
    for (const key of MODAL_METRIC_KEYS) {
      numericValues[key] = parseCompactNumber(values[key]);
    }

    const sources = {
      sf3: liveTiles.SF3 ? "tile" : "",
      darkPool: modalMetrics.darkPool ? "modal" : darkPool.source,
      price: price.source
    };
    for (const key of MODAL_METRIC_KEYS) {
      sources[key] = modalMetrics[key] ? "modal" : "";
    }

    return {
      timestamp: new Date().toISOString(),
      pageUrl: window.location.href,
      values,
      numericValues,
      thresholds,
      sources
    };
  }

  async function persistSnapshot(snapshot) {
    try {
      await chrome.runtime.sendMessage({
        type: "sf3-live-monitor-publish-snapshot",
        snapshot
      });
    } catch (error) {
      const message = String(error?.message || error || "");
      if (message.includes("Extension context invalidated")) {
        stopMonitoring();
        return;
      }

      console.warn("[SF3 Goblin] Failed to persist snapshot:", error);
    }
  }

  function flushScanQueue() {
    scanQueued = false;
    scanTimeoutId = null;

    const force = forcePending;
    forcePending = false;

    const snapshot = buildSnapshot();
    if (!snapshot) {
      return;
    }

    const signature = JSON.stringify({
      values: snapshot.values,
      thresholds: snapshot.thresholds,
      sources: snapshot.sources
    });

    if (!force && signature === lastSignature) {
      return;
    }

    lastSignature = signature;
    void persistSnapshot(snapshot);
  }

  function queueScan(options = {}) {
    const { force = false } = options;
    forcePending = forcePending || force;

    if (scanQueued) {
      return;
    }

    scanQueued = true;
    scanTimeoutId = window.setTimeout(flushScanQueue, 0);
  }

  function startObserver() {
    if (observer) {
      return;
    }

    observer = new MutationObserver(() => {
      queueScan();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["style", "class", "opacity", "visibility", "transform"]
    });
  }

  function init() {
    chrome.runtime.onMessage.addListener((message) => {
      if (message?.type === "sf3-live-monitor-force-scan") {
        queueScan({ force: true });
      }
    });

    startObserver();
    intervalId = window.setInterval(queueScan, 1000);
    queueScan({ force: true });
  }

  init();
})();