const SurgeIDScene = {
  mode: 'login',
  _off: null,

  init() {
    document.getElementById('btn-back-surgeid').onclick = () => App.goTo('menu');
    document.getElementById('surgeid-tab-login').onclick = () => this.setMode('login');
    document.getElementById('surgeid-tab-register').onclick = () => this.setMode('register');
    document.getElementById('surgeid-form').onsubmit = (e) => { e.preventDefault(); this.submit(); };
    document.getElementById('surgeid-sync').onclick = () => this.syncNow();
    document.getElementById('surgeid-pull').onclick = () => this.pullNow();
    document.getElementById('surgeid-logout').onclick = () => this.logout();
    if (typeof SurgeID !== 'undefined' && SurgeID.on) {
      this._off = SurgeID.on(() => this.render());
    }
  },

  show() {
    this.setMode(this.mode);
    this.render();
  },

  setMode(mode) {
    this.mode = mode;
    document.getElementById('surgeid-tab-login').classList.toggle('active', mode === 'login');
    document.getElementById('surgeid-tab-register').classList.toggle('active', mode === 'register');
    document.getElementById('surgeid-name-field').classList.toggle('surgeid-hidden', mode !== 'register');
    document.getElementById('surgeid-error').textContent = '';
    document.getElementById('surgeid-password').setAttribute(
      'autocomplete', mode === 'login' ? 'current-password' : 'new-password'
    );
    const label = document.querySelector('#surgeid-submit .corner-label');
    if (label) label.textContent = mode === 'login' ? 'ENTRAR' : 'CRIAR CONTA';
  },

  render() {
    if (typeof SurgeID === 'undefined') return;
    const status = SurgeID.status();
    document.getElementById('surgeid-signedout').classList.toggle('surgeid-hidden', status.signedIn);
    document.getElementById('surgeid-signedin').classList.toggle('surgeid-hidden', !status.signedIn);
    document.getElementById('surgeid-subtitle').textContent = status.signedIn
      ? 'Conta ligada — o progresso guarda-se na nuvem'
      : 'Uma conta para todos os teus jogos';
    if (!status.signedIn) return;

    const user = status.user || {};
    document.getElementById('surgeid-code').textContent = user.surge_id || 'SG-??????';
    document.getElementById('surgeid-email-view').textContent = user.email || '';
    document.getElementById('surgeid-state').textContent = status.online
      ? 'API ligada · sincronização automática ativa'
      : 'Sem ligação · guarda local e sincroniza depois';

    const data = (typeof Progression !== 'undefined' && Progression.data) || {};
    document.getElementById('surgeid-trophies').textContent = data.trophies || 0;
    document.getElementById('surgeid-coins').textContent = data.coins || 0;
    document.getElementById('surgeid-gems').textContent = data.gems || 0;
    document.getElementById('surgeid-bp').textContent = data.battlePassTier || 0;
  },

  errorMessage(res) {
    const messages = {
      invalid_email: 'Email inválido.',
      weak_password: 'A palavra-passe precisa de 8 caracteres ou mais.',
      email_taken: 'Já existe uma conta com este email.',
      invalid_credentials: 'Email ou palavra-passe errados.',
      offline: 'Sem ligação ao servidor. Tenta daqui a uns segundos.',
      signed_out: 'Entra na conta primeiro.',
    };
    if (res && res.offline) return messages.offline;
    return messages[res && res.error] || 'Algo correu mal (' + ((res && (res.error || res.status)) || '?') + ').';
  },

  message(text, isError) {
    const el = document.getElementById('surgeid-msg');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('surgeid-error', !!isError);
  },

  submit() {
    if (typeof SurgeID === 'undefined') return;
    const errorEl = document.getElementById('surgeid-error');
    const btn = document.getElementById('surgeid-submit');
    const label = btn.querySelector('.corner-label');
    const original = label.textContent;
    errorEl.textContent = '';
    btn.disabled = true;
    label.textContent = '...';

    const payload = {
      email: document.getElementById('surgeid-email').value.trim(),
      password: document.getElementById('surgeid-password').value,
      displayName: document.getElementById('surgeid-name').value.trim(),
    };
    const action = this.mode === 'login'
      ? SurgeID.login(payload)
      : SurgeID.register(payload);

    action.then((res) => {
      btn.disabled = false;
      label.textContent = original;
      if (!res.ok) {
        errorEl.textContent = this.errorMessage(res);
        return;
      }
      document.getElementById('surgeid-form').reset();
      this.setMode(this.mode);
      this.render();
      this.syncNow('Progresso local enviado para a conta.');
    });
  },

  syncNow(successText) {
    if (typeof SurgeID === 'undefined' || !SurgeID.isSignedIn()) {
      this.message('Entra na conta primeiro.', true);
      return;
    }
    this.message('A sincronizar...', false);
    SurgeID.sync(Progression.data).then((res) => {
      if (res.ok) {
        Object.assign(Progression.data, res.progress || {});
        Progression.saveLocal();
        this.render();
        this.message(typeof successText === 'string' ? successText : 'Progresso guardado na nuvem.', false);
        return;
      }
      this.message(this.errorMessage(res), true);
      this.render();
    });
  },

  pullNow() {
    if (typeof SurgeID === 'undefined' || !SurgeID.isSignedIn()) {
      this.message('Entra na conta primeiro.', true);
      return;
    }
    this.message('A carregar...', false);
    SurgeID.loadProgress().then((res) => {
      if (!res.ok) {
        this.message(this.errorMessage(res), true);
        this.render();
        return;
      }
      Object.assign(Progression.data, (res.data && res.data.progress) || {});
      Progression.saveLocal();
      this.render();
      this.message('Progresso da nuvem carregado.', false);
    });
  },

  logout() {
    if (typeof SurgeID === 'undefined') return;
    SurgeID.logout();
    this.setMode('login');
    this.render();
    this.message('Sessão terminada.', false);
  },
};
