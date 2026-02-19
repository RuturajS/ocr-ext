/* OCR Engine - Wrapper for Tesseract.js */

window.OCREngine = {
    worker: null,
    isProcessing: false,

    /**
     * Run OCR on an image source (url, blob, or canvas)
     * @param {string|HTMLImageElement|HTMLCanvasElement|Blob} imageSource 
     * @param {Function} progressCallback - receives percentage 0-1
     * @returns {Promise<string>}
     */
    async recognize(imageSource, progressCallback) {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            // Lazy load worker
            const worker = await Tesseract.createWorker({
                workerPath: chrome.runtime.getURL('ocr/lib/worker.min.js'),
                corePath: chrome.runtime.getURL('ocr/lib/tesseract-core.wasm.js'),
                logger: m => {
                    if (m.status === 'recognizing text') {
                        if (progressCallback) progressCallback(m.progress);
                    }
                }
            });

            await worker.loadLanguage('eng');
            await worker.initialize('eng');

            const { data: { text } } = await worker.recognize(imageSource);

            await worker.terminate();
            return text.trim();
        } catch (error) {
            console.error("OCR Error:", error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }
};
