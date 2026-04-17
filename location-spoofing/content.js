// content.js
// Runs in ISOLATED world at document_start

chrome.storage.local.get(['enabled', '_activeTimezone'], (result) => {
  if (!result.enabled || !result._activeTimezone) return;

  const targetTimezone = result._activeTimezone;

  const scriptContent = `
    (function() {
      const targetTimezone = "${targetTimezone}";
      
      try {
        const OriginalDateTimeFormat = Intl.DateTimeFormat;
        Intl.DateTimeFormat = function(...args) {
          let options = args[1] || {};
          if (!options.timeZone) {
            options.timeZone = targetTimezone;
          }
          return new OriginalDateTimeFormat(args[0], options);
        };
        
        Object.assign(Intl.DateTimeFormat, OriginalDateTimeFormat);
        Intl.DateTimeFormat.prototype = OriginalDateTimeFormat.prototype;

        const calculateOffset = (tz) => {
          try {
            const date = new Date();
            const tzString = date.toLocaleString('en-US', { timeZone: tz });
            const localString = date.toLocaleString('en-US');
            return Math.round((new Date(localString) - new Date(tzString)) / 60000);
          } catch(e) {
            return new Date().getTimezoneOffset();
          }
        };

        const customOffset = calculateOffset(targetTimezone);
        
        const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
        Date.prototype.getTimezoneOffset = function() {
          return customOffset;
        };

        console.log("[Location Simulator] Timezone successfully mocked to: " + targetTimezone);
      } catch (e) {
        console.error("[Location Simulator] Failed to mock timezone:", e);
      }
    })();
  `;

  const script = document.createElement('script');
  script.textContent = scriptContent;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
});

// Floating widget
(function initFloatingWidget() {
  let widgetContainer = null;

  function updateWidget(enabled, activeCountryId, allCountries) {
    if (!enabled || !activeCountryId) {
      if (widgetContainer) {
        widgetContainer.remove();
        widgetContainer = null;
      }
      return;
    }

    const country = (allCountries || []).find(c => c.id === activeCountryId || c.code === activeCountryId);
    if (!country) return;

    if (!widgetContainer) {
      widgetContainer = document.createElement('div');
      widgetContainer.id = 'loc-spoof-widget-root';
      // Use shadow DOM to isolate styles
      try {
        widgetContainer.attachShadow({ mode: 'open' });
      } catch (e) {
        // Fallback if shadow DOM isn't supported or fails
      }
      document.body.appendChild(widgetContainer);
    }

    const root = widgetContainer.shadowRoot || widgetContainer;
    root.innerHTML = `
      <style>
        .floating-ball {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 102, 255, 0.15);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          border-radius: 30px;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          font-size: 13px;
          color: #1d1d1f;
          z-index: 2147483647;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
        }
        .floating-ball:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 24px rgba(0, 102, 255, 0.15);
          background: rgba(255, 255, 255, 0.95);
        }
        .status-dot {
          width: 8px;
          height: 8px;
          background-color: #34c759;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(52, 199, 89, 0.6);
          position: relative;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(52, 199, 89, 0); }
          100% { box-shadow: 0 0 0 0 rgba(52, 199, 89, 0); }
        }
        .status-dot {
          animation: pulse 2s infinite;
        }
        .node-code {
          font-weight: 700;
          color: #0066ff;
          letter-spacing: 0.5px;
        }
        .node-name {
          color: #86868b;
          font-weight: 500;
        }
        .close-btn {
          margin-left: 4px;
          cursor: pointer;
          opacity: 0.4;
          transition: opacity 0.2s;
          display: flex;
        }
        .close-btn:hover {
          opacity: 1;
        }
      </style>
      <div class="floating-ball" title="位置模拟器：当前正在模拟此节点">
        <div class="status-dot"></div>
        <span class="node-code">${country.code}</span>
        <span class="node-name">${country.name}</span>
      </div>
    `;
  }

  function renderOrWait() {
    chrome.storage.local.get(['enabled', 'activeCountry', 'allCountries'], (result) => {
      const render = () => {
        if (document.body) {
          updateWidget(result.enabled, result.activeCountry, result.allCountries);
        } else {
          // If no body yet, wait for DOMContentLoaded
          document.addEventListener('DOMContentLoaded', () => {
            updateWidget(result.enabled, result.activeCountry, result.allCountries);
          });
        }
      };
      // For cases where document.readyState is already interactive or complete
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', render);
      } else {
        render();
      }
    });
  }

  // Initial render
  renderOrWait();

  // Listen for changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && (changes.enabled || changes.activeCountry || changes.allCountries)) {
      chrome.storage.local.get(['enabled', 'activeCountry', 'allCountries'], (newResult) => {
        if (document.body) {
          updateWidget(newResult.enabled, newResult.activeCountry, newResult.allCountries);
        }
      });
    }
  });
})();
