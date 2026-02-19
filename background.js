/* OCR Reader Kit - Background Service Worker */

chrome.runtime.onInstalled.addListener(() => {
    // Create Context Menus
    chrome.contextMenus.create({
        id: "ocr-scan-image",
        title: "Read Text from Image",
        contexts: ["image"]
    });

    chrome.contextMenus.create({
        id: "ocr-scan-area",
        title: "Scan Screen Area",
        contexts: ["page", "selection", "link"]
    });
});

// Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab.id) return;

    if (info.menuItemId === "ocr-scan-image") {
        chrome.tabs.sendMessage(tab.id, {
            action: "scan-image",
            srcUrl: info.srcUrl
        });
    } else if (info.menuItemId === "ocr-scan-area") {
        chrome.tabs.sendMessage(tab.id, {
            action: "start-selection"
        });
    }
});

// Handle Keyboard Shortcuts
chrome.commands.onCommand.addListener((command) => {
    if (command === "scan-area") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "start-selection"
                });
            }
        });
    }
});

// Handle internal messages for screen capture and image fetching
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "capture-screen") {
        // Capture the visible area of the currently active tab
        chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
            sendResponse({ dataUrl: dataUrl });
        });
        return true; // Indicates async response
    }

    if (request.action === "fetch-image") {
        fetch(request.srcUrl)
            .then(response => response.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => sendResponse({ dataUrl: reader.result });
                reader.readAsDataURL(blob);
            })
            .catch(error => sendResponse({ error: error.toString() }));
        return true;
    }
});
