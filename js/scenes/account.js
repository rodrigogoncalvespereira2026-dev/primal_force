// ── ECRÃ DE CRIAÇÃO DE CONTA ───────────────────────────────────────
// Aparece só na primeira vez que o jogo abre neste dispositivo.
// Depois de criada a conta, o jogo passa direto para o menu em
// todas as aberturas seguintes (App.init trata disso).

const AccountScene = {
  init() {
    const form = document.getElementById('account-form');
    const emailInput = document.getElementById('account-email');
    const ageInput = document.getElementById('account-age');
    const errorEl = document.getElementById('account-error');
    const submitBtn = document.getElementById('account-submit');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      errorEl.textContent = '';

      const result = Account.create(emailInput.value, ageInput.value);

      if (!result.ok) {
        const messages = {
          email: 'Escreve um email válido.',
          age: 'Escreve uma idade válida.',
          storage: 'Não foi possível guardar a conta neste dispositivo.'
        };
        errorEl.textContent = messages[result.error] || 'Algo correu mal.';
        return;
      }

      App.goTo('menu');
    });

    // Feedback visual simples enquanto o jogador escreve
    emailInput.addEventListener('input', () => { errorEl.textContent = ''; });
    ageInput.addEventListener('input', () => { errorEl.textContent = ''; });
  },

  show() {
    document.getElementById('account-email').value = '';
    document.getElementById('account-age').value = '';
    document.getElementById('account-error').textContent = '';
    setTimeout(() => document.getElementById('account-email').focus(), 100);
  }
};
