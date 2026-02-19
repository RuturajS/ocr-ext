/* OCR Reader Kit - UI Manager */

window.OCRUI = {
    panel: null,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },

    init() {
        // Check if panel already exists
        if (document.getElementById('ocr-result-panel')) return;
    },

    createPanel() {
        if (this.panel) return this.panel;

        const panel = document.createElement('div');
        panel.id = 'ocr-result-panel';
        panel.innerHTML = `
      <div class="ocr-panel-header">
        <span class="ocr-panel-title">OCR Reader Result</span>
        <div class="ocr-panel-controls">
          <button class="ocr-icon-btn copy" title="Copy Text">📋</button>
          <button class="ocr-icon-btn close" title="Close">✕</button>
        </div>
      </div>
      <div class="ocr-panel-content">
        <div class="ocr-loading">
          <span>Initializing...</span>
          <div class="ocr-progress-bar">
            <div class="ocr-progress-fill"></div>
          </div>
        </div>
      </div>
      <div class="ocr-panel-footer">
        <button class="ocr-btn primary copy">Copy Text</button>
        <button class="ocr-btn close">Close</button>
      </div>
    `;

        document.body.appendChild(panel);
        this.panel = panel;

        // Center panel
        const rect = panel.getBoundingClientRect();
        panel.style.left = `${(window.innerWidth - rect.width) / 2}px`;
        panel.style.top = `${(window.innerHeight - rect.height) / 2}px`;

        // Event listeners
        this.setupDrag(panel.querySelector('.ocr-panel-header'));

        panel.querySelectorAll('.close').forEach(btn =>
            btn.addEventListener('click', () => this.hidePanel())
        );

        panel.querySelectorAll('.copy').forEach(btn =>
            btn.addEventListener('click', () => this.copyResult())
        );

        return panel;
    },

    showPanel() {
        if (!this.panel) this.createPanel();
        this.panel.style.display = 'flex';
        this.panel.style.opacity = '1';

        // Reset view
        const content = this.panel.querySelector('.ocr-panel-content');
        content.innerHTML = `
      <div class="ocr-loading">
        <span>Initializing OCR engine...</span>
        <div class="ocr-progress-bar">
          <div class="ocr-progress-fill" style="width: 0%"></div>
        </div>
      </div>
    `;
    },

    hidePanel() {
        if (this.panel) {
            this.panel.style.opacity = '0';
            setTimeout(() => {
                this.panel.style.display = 'none';
            }, 200);
        }
    },

    updateProgress(progress) {
        if (!this.panel) return;
        const fill = this.panel.querySelector('.ocr-progress-fill');
        const text = this.panel.querySelector('.ocr-loading span');
        if (fill) fill.style.width = `${progress * 100}%`;
        if (text) text.innerText = `Reading Text (${Math.round(progress * 100)}%)...`;
    },

    showResult(text) {
        if (!this.panel) return;
        const content = this.panel.querySelector('.ocr-panel-content');
        content.innerHTML = text || '<span style="color: #64748b; font-style: italic;">No text found.</span>';
    },

    showError(err) {
        if (!this.panel) return;
        const content = this.panel.querySelector('.ocr-panel-content');
        content.innerHTML = `<span style="color: #ef4444;">Error: ${err.message || err}</span>`;
    },

    copyResult() {
        if (!this.panel) return;
        const text = this.panel.querySelector('.ocr-panel-content').innerText;
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Text copied to clipboard!');
        });
    },

    showToast(msg) {
        const toast = document.createElement('div');
        toast.className = 'ocr-toast';
        toast.innerText = msg;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    },

    setupDrag(header) {
        header.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            const rect = this.panel.getBoundingClientRect();
            this.dragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            header.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging || !this.panel) return;
            this.panel.style.left = `${e.clientX - this.dragOffset.x}px`;
            this.panel.style.top = `${e.clientY - this.dragOffset.y}px`;
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            if (header) header.style.cursor = 'grab';
        });
    }
};
