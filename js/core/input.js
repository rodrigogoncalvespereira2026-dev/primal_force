const Input = {
  keys: {},
  mobile: { up: false, down: false, left: false, right: false },

  init() {
    document.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      e.preventDefault && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code) && e.preventDefault();
    });
    document.addEventListener('keyup', e => { this.keys[e.code] = false; });
    this._bindMobile();
  },

  isDown(code) { return !!this.keys[code]; },

  getDirX() {
    if (this.keys['ArrowLeft']  || this.keys['KeyA'] || this.mobile.left)  return -1;
    if (this.keys['ArrowRight'] || this.keys['KeyD'] || this.mobile.right) return  1;
    return 0;
  },

  getDirY() {
    if (this.keys['ArrowUp']   || this.keys['KeyW'] || this.mobile.up)   return -1;
    if (this.keys['ArrowDown'] || this.keys['KeyS'] || this.mobile.down) return  1;
    return 0;
  },

  _bindMobile() {
    const bind = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      const on  = () => this.mobile[key] = true;
      const off = () => this.mobile[key] = false;
      el.addEventListener('pointerdown',  on);
      el.addEventListener('pointerup',   off);
      el.addEventListener('pointerleave',off);
    };
    bind('d-up',    'up');
    bind('d-down',  'down');
    bind('d-left',  'left');
    bind('d-right', 'right');
  },
};
