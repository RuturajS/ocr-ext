/* OCR Reader Kit - Selection Manager */

window.OCRSelection = {
    canvas: null,
    ctx: null,
    isSelecting: false,
    startPos: { x: 0, y: 0 },
    rect: { x: 0, y: 0, w: 0, h: 0 },
    callback: null,

    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'ocr-selection-canvas';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.zIndex = '2147483647';
        this.canvas.style.cursor = 'crosshair';
        this.canvas.style.display = 'none'; // Hidden by default

        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        // Bind events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));

        // Esc to cancel
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isSelecting) {
                this.stopSelection();
            }
        });
    },

    startSelection(callback) {
        if (!this.canvas) this.init();
        this.callback = callback;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.display = 'block';
        this.isSelecting = false;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    stopSelection() {
        if (this.canvas) {
            this.canvas.style.display = 'none';
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.isSelecting = false;
    },

    onMouseDown(e) {
        this.isSelecting = true;
        this.startPos = { x: e.clientX, y: e.clientY };
        this.rect = { x: 0, y: 0, w: 0, h: 0 };
    },

    onMouseMove(e) {
        if (!this.isSelecting) return;

        const currentX = e.clientX;
        const currentY = e.clientY;

        const x = Math.min(this.startPos.x, currentX);
        const y = Math.min(this.startPos.y, currentY);
        const w = Math.abs(currentX - this.startPos.x);
        const h = Math.abs(currentY - this.startPos.y);

        this.rect = { x, y, w, h };
        this.draw();
    },

    onMouseUp(e) {
        if (!this.isSelecting) return;
        this.isSelecting = false;
        this.stopSelection();

        if (this.rect.w > 5 && this.rect.h > 5 && this.callback) {
            this.callback(this.rect);
        }
    },

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw semi-transparent background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Clear the selection area (so it's transparent)
        this.ctx.clearRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h);

        // Draw border
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h);
    }
};
