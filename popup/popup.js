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

    // Trigger scan
    scanBtn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'start-selection' });
            window.close(); // Close popup
        });
    });
});
