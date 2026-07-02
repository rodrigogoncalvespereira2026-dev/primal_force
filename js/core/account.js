// ── SISTEMA DE CONTA (LOCAL, POR DISPOSITIVO) ──────────────────────
// Guarda email + idade no localStorage. Não é uma conta sincronizada
// entre dispositivos — é uma "etiqueta" local, como um perfil offline.
// Se um dia quiseres migrar para contas reais (Firebase, etc.), só
// precisas de trocar load()/save() por chamadas à API — o resto do
// jogo (AccountScene, App.init) não precisa de mudar.

const Account = {
  STORAGE_KEY: 'prf_account',

  data: null, // { email, age, createdAt }

  /** Carrega a conta guardada neste dispositivo, se existir. */
  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      this.data = raw ? JSON.parse(raw) : null;
    } catch (e) {
      this.data = null;
    }
    return this.data;
  },

  /** Existe uma conta criada neste dispositivo? */
  exists() {
    if (this.data === null) this.load();
    return !!(this.data && this.data.email);
  },

  /** Valida formato de email simples. */
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
  },

  /** Valida idade (número entre 5 e 120 — ajusta os limites se quiseres). */
  isValidAge(age) {
    const n = Number(age);
    return Number.isInteger(n) && n >= 5 && n <= 120;
  },

  /**
   * Cria a conta neste dispositivo. Devolve { ok: true } ou
   * { ok: false, error: 'email' | 'age' }.
   */
  create(email, age) {
    email = String(email || '').trim().toLowerCase();
    age = Number(age);

    if (!this.isValidEmail(email)) return { ok: false, error: 'email' };
    if (!this.isValidAge(age)) return { ok: false, error: 'age' };

    this.data = {
      email,
      age,
      createdAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      return { ok: false, error: 'storage' };
    }

    return { ok: true };
  },

  /** Apaga a conta deste dispositivo (ex: botão "sair"/"trocar conta"). */
  clear() {
    this.data = null;
    try { localStorage.removeItem(this.STORAGE_KEY); } catch (e) {}
  }
};
