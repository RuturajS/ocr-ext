document.addEventListener('DOMContentLoaded', () => {
    const autoCopyToggle = document.getElementById('autoCopy');
    const scanBtn = document.getElementById('scanBtn');

    // Load saved settings
    chrome.storage.local.get(['autoCopy'], (result) => {
        if (result.autoCopy !== undefined) {
            autoCopyToggle.checked = result.autoCopy;
        }
    });

    // Save settings on change
    autoCopyToggle.addEventListener('change', () => {
        chrome.storage.local.set({ autoCopy: autoCopyToggle.checked });
    });

    // Trigger scan with retry logic
    scanBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab) return;

        // Attempt to send message
        chrome.tabs.sendMessage(tab.id, { action: 'start-selection' }, (response) => {
            if (chrome.runtime.lastError) {
                // Content script might not be loaded. Inject scripts and retry.
                console.log("Content script not ready. Injecting...", chrome.runtime.lastError.message);

                chrome.scripting.insertCSS({
                    target: { tabId: tab.id },
                    files: ['styles/minimal.css']
                });

                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: [
                        'ocr/lib/tesseract.min.js',
                        'ocr/engine.js',
                        'content/ui.js',
                        'content/selection.js',
                        'content/inject.js'
                    ]
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error("Injection failed:", chrome.runtime.lastError.message);
                        alert("Could not start OCR. Please refresh the page.");
                        return;
                    }
                    // Retry sending message after injection
                    setTimeout(() => {
                        chrome.tabs.sendMessage(tab.id, { action: 'start-selection' });
                        window.close();
                    }, 100);
                });
            } else {
                window.close();
            }
        });
    });
});
