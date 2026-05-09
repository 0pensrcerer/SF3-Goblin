# SF3 Goblin

This extension is a separate side-panel monitor for the BigShort SF3 Segregated page.

## What it does

- Reads the live SF3 value from the top `SF3` tile (`span.value.svelte-kxaiyw` inside the SF3 live-updates card)
- Reads live `MomoFlow` and `NOF/NOFA` values from the pinned chart tooltip and falls back to the movable metrics modal if needed
- Reads the visible `SF3`, `MF`, and `NOF` percentile lines from the chart SVG labels
- Charts `SF3`, `NOF`, and `MF` together over the current 5-minute window
- Tracks rolling hourly and daily SF3 sums using the current 5-minute SF3 bucket values
- Plays an audio alert when:
  - SF3 crosses its 5-minute percentile line
  - NOF crosses its percentile line
  - MF crosses its percentile line
  - rolling hourly SF3 enters top/bottom 10%, 5%, or 1%
  - rolling daily SF3 enters top/bottom 10%, 5%, or 1%

## Historical defaults

The default hourly and daily SF3 band thresholds in `sidepanel.js` were derived from the local files:

- `dailysf3.csv`
- `sf3-3-22-to-5-6-hourly.csv`

If you want different percentile bands later, edit `HISTORICAL_SF3_THRESHOLDS` in `sidepanel.js`.

## Install

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `z:\devprojects\SF3Monitor\sf3-live-monitor`
5. If you want to test against saved local HTML files, open the extension details page and enable **Allow access to file URLs**

## Use

1. Open the BigShort SF3 Segregated page
2. Click the extension icon to open the side panel
3. Click **Arm Audio** once so Chrome allows sound playback
4. Keep the page open while the extension monitors live values

## Notes

- SF3 is intentionally sourced from the live card tile rather than the static tooltip
- NOF and MF are sourced from the chart tooltip first because those values align with the percentile bands shown in the chart panes
- If the page DOM changes, update the selectors in `content.js`