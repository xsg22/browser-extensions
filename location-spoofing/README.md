# Location Spoofing

> A Chrome Extension for simulating geographic locations, timezones, and IP addresses — purpose-built for developers and QA engineers who test region-specific behavior.

---

## ✨ Features

### 🌍 Multi-Node Location Profiles
- **Import & Export**: Bulk import nodes via JSON, or export the entire node library as a dated backup file.
- **Add & Edit Nodes**: Use a visual form to add or edit individual nodes at any time. Fields include country code, display name, region, target IPs, target timezone, and User-Agent override.
- **Persistent Storage**: All nodes are saved in `chrome.storage.local`, persisted across browser restarts.
- **Default Node Library**: On first install, a rich selection of global nodes is pre-loaded automatically. Clearing the list will not restore the defaults.

### 📡 Multi-IP per Node
- Each node supports **multiple IP addresses**, displayed as a comma-separated list.
- In the popup, a dropdown selector lets you **switch between IPs instantly** without navigating to settings.

### ⏱ Timezone Simulation
- Injects a spoofed `Timezone` HTTP header on every request.
- Also overrides JavaScript's `Intl.DateTimeFormat` and `Date.prototype.getTimezoneOffset` via a content script injected at `document_start` so frontend code sees the correct timezone.
- Timezone can be **left blank** — when empty, no timezone header is sent and no JS override is applied.

### 🛡 IP Header Injection (via `declarativeNetRequest`)
- When an IP is configured, injects:
  - `X-Forwarded-For`
  - `X-Real-IP`
  - `Client-IP`
  - `X-Client-IP`
  - `True-Client-IP`
  - `WL-Proxy-Client-IP`
  - `CF-IPCountry` (always, based on country code)
- When IP is **blank**, none of the above headers are sent — making pure timezone-only simulation possible.

### 🧩 Flexible Node Management
- **Pin** nodes to the top of the list.
- **Search** by country name, code, region, or IP.
- **Batch delete** with checkbox selection and select-all.
- **Visibility toggle** per node — control which nodes appear in the popup.

### 🎨 Modern UI
- Light glassmorphism design with subtle gradients and micro-animations.
- Custom modal dialogs — no system-level `alert()` or `confirm()` dialogs.
- Toast notification system with slide-in animations for feedback.
- Compact, high-density node list layout up to `1000px` wide for easy scanning.

---

## 🗂 Project Structure

```
location-spoofing/
├── manifest.json          # Manifest V3 config
├── background.js          # Service worker — declarativeNetRequest rule manager
├── content.js             # Content script — overrides Intl/Date timezone in page JS
├── assets/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── data/
│   └── default_location_nodes.json   # Pre-bundled nodes (loaded on first install)
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── options/
│   ├── options.html
│   ├── options.css
│   └── options.js
└── shared/
    ├── countries.js       # IANA country code ↔ name mapping
    └── timezone_map.js    # Country/region → timezone inference helper
```

---

## 🔧 Node Data Schema

```json
{
  "id": "US_California_0p3t",
  "code": "US",
  "name": "美国-California",
  "region": "California",
  "ip": ["102.129.145.77", "104.128.72.34"],
  "timezone": "America/Los_Angeles",
  "userAgent": ""
}
```

| Field | Required | Notes |
|---|---|---|
| `code` | ✅ | ISO 3166-1 alpha-2 country code |
| `id` | Auto-generated | Unique identifier |
| `name` | Auto-generated | Falls back to `<CountryName>-<Region>` |
| `region` | Optional | Sub-region (e.g., state, province) |
| `ip` | Optional | String array. Empty = no IP spoofing |
| `timezone` | Optional | IANA tz string. Empty = no timezone spoofing |
| `userAgent` | Optional | Full UA string override |

---

## 🚀 Local Development

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer Mode** (top right toggle).
3. Click **Load unpacked** and select the project root directory.
4. Click the extension icon to open the popup.
5. Navigate to ⚙️ Settings to manage your node library.

---

## 📋 Permissions Used

| Permission | Reason |
|---|---|
| `declarativeNetRequest` | Modify outgoing request headers |
| `declarativeNetRequestWithHostAccess` | Apply rules to all URLs |
| `storage` | Persist node configurations |
| `activeTab` | Access current tab context |
| `scripting` | (reserved for future dynamic injection) |
| `<all_urls>` | Apply header rules globally |
