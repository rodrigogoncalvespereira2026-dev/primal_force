// ── SISTEMA DE DIÁLOGO ESTILO RPG ────────────────────────────────────
const DialogSystem = {
  lines: [],
  current: 0,
  onComplete: null,
  typing: false,
  typedText: '',
  fullText: '',
  typeTimer: 0,
  TYPE_SPEED: 2, // frames por letra

  show(lines, onComplete) {
    this.lines      = lines;
    this.current    = 0;
    this.onComplete = onComplete;
    document.getElementById('screen-dialog').classList.add('active');
    this._showLine(0);
    this._startLoop();
  },

  _showLine(i) {
    if (i >= this.lines.length) { this._finish(); return; }
    const line = this.lines[i];
    this.fullText  = line.text;
    this.typedText = '';
    this.typing    = true;
    this.typeTimer = 0;

    document.getElementById('dlg-speaker').textContent = line.speaker;
    document.getElementById('dlg-speaker').style.color = line.color;
    document.getElementById('dlg-portrait').textContent = line.emoji;
    document.getElementById('dlg-portrait').style.borderColor = line.color;
    document.getElementById('dlg-text').textContent = '';
    document.getElementById('dlg-progress').textContent = `${i+1}/${this.lines.length}`;
    document.getElementById('dlg-continue').style.opacity = '0';
  },

  _startLoop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    const loop = () => {
      if (!document.getElementById('screen-dialog').classList.contains('active')) return;
      this._update();
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  },

  _update() {
    if (!this.typing) return;
    this.typeTimer++;
    if (this.typeTimer >= this.TYPE_SPEED) {
      this.typeTimer = 0;
      if (this.typedText.length < this.fullText.length) {
        this.typedText = this.fullText.slice(0, this.typedText.length + 1);
        document.getElementById('dlg-text').textContent = this.typedText;
      } else {
        this.typing = false;
        document.getElementById('dlg-continue').style.opacity = '1';
      }
    }
  },

  advance() {
    if (this.typing) {
      // Completa o texto instantaneamente
      this.typedText = this.fullText;
      document.getElementById('dlg-text').textContent = this.fullText;
      this.typing = false;
      document.getElementById('dlg-continue').style.opacity = '1';
      return;
    }
    this.current++;
    if (this.current >= this.lines.length) { this._finish(); return; }
    this._showLine(this.current);
  },

  _finish() {
    if (this._raf) cancelAnimationFrame(this._raf);
    document.getElementById('screen-dialog').classList.remove('active');
    if (this.onComplete) this.onComplete();
  },

  init() {
    const screen = document.getElementById('screen-dialog');
    screen.addEventListener('click', () => this.advance());
    document.getElementById('dlg-btn-skip').onclick = (e) => {
      e.stopPropagation();
      this._finish();
    };
  },
};
