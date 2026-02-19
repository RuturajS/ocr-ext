/* OCR Reader Kit - Injection Logic */

// Initialize components
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    if (window.OCR_INITIALIZED) return;
    window.OCR_INITIALIZED = true;

    // Listen for messages from background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'start-selection') {
            startSelectionMode();
        } else if (request.action === 'scan-image') {
            scanImage(request.srcUrl);
        }
    });

    // Optional: Add hover icon on images (Configurable)
    // document.addEventListener('mouseover', handleImageHover);
}

function startSelectionMode() {
    OCRSelection.startSelection((rect) => {
        processSelection(rect);
    });
}

async function processSelection(rect) {
    try {
        OCRUI.showPanel();
        OCRUI.updateProgress(0);

        // Capture screen via background to avoid CORS
        const screenshotUrl = await captureScreen();

        // specific handling for high DPI displays
        const pixelRatio = window.devicePixelRatio || 1;

        // Crop image
        const croppedImage = await cropImage(screenshotUrl, rect, pixelRatio);

        // Run OCR
        const text = await OCREngine.recognize(croppedImage, (progress) => {
            OCRUI.updateProgress(progress);
        });

        OCRUI.showResult(text);

        // Auto Copy Logic
        chrome.storage.local.get(['autoCopy'], (result) => {
            if (result.autoCopy && text) {
                OCRUI.copyResult();
            }
        });

    } catch (err) {
        console.error(err);
        OCRUI.showError(err.message || "Failed to process selection");
    }
}

async function scanImage(url) {
    try {
        OCRUI.showPanel();
        OCRUI.updateProgress(0);

        // Fetch image data via background script to bypass CORS
        const dataUrl = await fetchImageFromBackground(url);

        const text = await OCREngine.recognize(dataUrl, (progress) => {
            OCRUI.updateProgress(progress);
        });

        OCRUI.showResult(text);
    } catch (err) {
        console.error("Scan failed", err);
        OCRUI.showError("Failed to read image. " + (err.message || ""));
    }
}

function fetchImageFromBackground(url) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'fetch-image', srcUrl: url }, (response) => {
            if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
            if (response && response.error) return reject(new Error(response.error));
            if (response && response.dataUrl) resolve(response.dataUrl);
            else reject(new Error("Failed to fetch image data"));
        });
    });
}

function captureScreen() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'capture-screen' }, (response) => {
            if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
            if (response && response.dataUrl) resolve(response.dataUrl);
            else reject("Failed to capture screen");
        });
    });
}

function cropImage(dataUrl, rect, pixelRatio = 1) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Adjust for pixel ratio if the screenshot is high-res
            // captureVisibleTab usually returns the image in physical pixels (device pixels), 
            // but 'rect' is in CSS pixels.
            // So we scale rect by pixelRatio.

            const scale = img.width / window.innerWidth;

            const x = rect.x * scale;
            const y = rect.y * scale;
            const w = rect.w * scale;
            const h = rect.h * scale;

            canvas.width = w;
            canvas.height = h;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, x, y, w, h, 0, 0, w, h);

            resolve(canvas.toDataURL('image/png'));
        };
        img.src = dataUrl;
    });
}
