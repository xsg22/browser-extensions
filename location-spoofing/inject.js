// inject.js
// Runs natively in the MAIN world at document_start to avoid CSP inline script violations

let isMocked = false;

window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.type !== 'LOC_SPOOF_INIT') {
        return;
    }

    if (isMocked) return;
    isMocked = true;

    const targetTimezone = event.data.tz;
    if (!targetTimezone) return;

    try {
        const OriginalDateTimeFormat = Intl.DateTimeFormat;
        Intl.DateTimeFormat = function (...args) {
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
            } catch (e) {
                return new Date().getTimezoneOffset();
            }
        };

        const customOffset = calculateOffset(targetTimezone);

        const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
        Date.prototype.getTimezoneOffset = function () {
            return customOffset;
        };

        console.log("[Location Simulator] Timezone successfully mocked to: " + targetTimezone);
    } catch (e) {
        console.error("[Location Simulator] Failed to mock timezone:", e);
    }
});
