// content.js
// Runs in ISOLATED world at document_start

chrome.storage.local.get(['enabled', '_activeTimezone'], (result) => {
  if (!result.enabled || !result._activeTimezone) return;

  const targetTimezone = result._activeTimezone;

  // Since we cannot run inline scripts without hitting CSP violations on strict sites,
  // we pass the necessary data to inject.js (which runs in the MAIN world organically) via message.
  window.postMessage({ type: 'LOC_SPOOF_INIT', tz: targetTimezone }, '*');
});

// Floating widget
// Floating widget
(function initFloatingWidget() {
  let widgetContainer = null;
  let isDragging = false;
  let startY, startTop;
  let currentTop = null;

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

    if (!widgetContainer || !document.body.contains(widgetContainer)) {
      if (widgetContainer) widgetContainer.remove();
      widgetContainer = document.createElement('div');
      widgetContainer.id = 'loc-spoof-widget-root';
      try {
        widgetContainer.attachShadow({ mode: 'open' });
      } catch (e) { }
      document.body.appendChild(widgetContainer);
    }

    const root = widgetContainer.shadowRoot || widgetContainer;

    // Remember previous Top if we had one
    const savedTopStyle = currentTop !== null ? `top: ${currentTop}px; transform: none;` : 'top: 50%; transform: translateY(-50%);';

    root.innerHTML = `
      <style>
        .floating-wrapper {
          position: fixed;
          right: 0;
          ${savedTopStyle}
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 102, 255, 0.15);
          border-right: none;
          box-shadow: -4px 4px 16px rgba(0, 0, 0, 0.08);
          border-radius: 24px 0 0 24px;
          height: 48px;
          display: flex;
          align-items: center;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #1d1d1f;
          z-index: 2147483647;
          width: 48px;
          transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s;
          cursor: grab;
          user-select: none;
          -webkit-user-select: none;
        }
        .floating-wrapper:hover, .floating-wrapper.dragging {
          width: 140px;
          background: rgba(255, 255, 255, 0.95);
          box-shadow: -4px 8px 24px rgba(0, 102, 255, 0.15);
        }
        .floating-wrapper:active {
          cursor: grabbing;
        }
        .status-indicator {
          width: 48px;
          min-width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .status-dot {
          width: 10px;
          height: 10px;
          background-color: #34c759;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(52, 199, 89, 0.6);
          position: relative;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(52, 199, 89, 0); }
          100% { box-shadow: 0 0 0 0 rgba(52, 199, 89, 0); }
        }
        .content-area {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-right: 16px;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          font-size: 13px;
        }
        .floating-wrapper:hover .content-area, .floating-wrapper.dragging .content-area {
          opacity: 1;
          transition-delay: 0.1s;
        }
        .node-code {
          font-weight: 700;
          color: #0066ff;
          letter-spacing: 0.5px;
        }
        .node-name {
          color: #86868b;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      </style>
      <div class="floating-wrapper" id="loc-spoof-widget" title="位置模拟器：当前正在模拟此节点">
        <div class="status-indicator">
          <span style="font-size: 20px; position: relative; line-height: 1; display: inline-block;">
            🌍
            <div class="status-dot" style="position: absolute; bottom: -2px; right: -4px;"></div>
          </span>
        </div>
        <div class="content-area">
          <span class="node-code">${country.code}</span>
          <span class="node-name">${country.name}</span>
        </div>
      </div>
    `;

    bindDragEvents(root.querySelector('#loc-spoof-widget'));
  }

  function bindDragEvents(el) {
    if (!el) return;

    const onMouseDown = (e) => {
      isDragging = true;
      startY = e.clientY;
      const rect = el.getBoundingClientRect();
      startTop = rect.top;

      el.style.top = startTop + 'px';
      el.style.transform = 'none';
      el.classList.add('dragging');

      e.preventDefault();
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaY = e.clientY - startY;
      let newTop = startTop + deltaY;

      if (newTop < 0) newTop = 0;
      if (newTop + el.offsetHeight > window.innerHeight) {
        newTop = window.innerHeight - el.offsetHeight;
      }

      currentTop = newTop;
      el.style.top = newTop + 'px';
    };

    const onMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        el.classList.remove('dragging');
      }
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function renderOrWait() {
    chrome.storage.local.get(['enabled', 'activeCountry', 'allCountries'], (result) => {
      const tryRender = () => {
        if (document.body) {
          updateWidget(result.enabled, result.activeCountry, result.allCountries);
        } else {
          requestAnimationFrame(tryRender);
        }
      };
      tryRender();
    });
  }

  renderOrWait();

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && (changes.enabled || changes.activeCountry || changes.allCountries)) {
      chrome.storage.local.get(['enabled', 'activeCountry', 'allCountries'], (newResult) => {
        if (document.body) {
          updateWidget(newResult.enabled, newResult.activeCountry, newResult.allCountries);
        }
      });
    }
  });

  // Re-check periodically in case the SPA clears the body or the node gets removed
  setInterval(() => {
    if (widgetContainer && document.body && !document.body.contains(widgetContainer)) {
      chrome.storage.local.get(['enabled', 'activeCountry', 'allCountries'], (result) => {
        updateWidget(result.enabled, result.activeCountry, result.allCountries);
      });
    }
  }, 2000);

})();
