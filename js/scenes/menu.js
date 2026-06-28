const MenuScene = {
  init() {
    document.getElementById('btn-jogar').onclick   = () => App.goTo('game');
    document.getElementById('btn-rangers').onclick = () => App.goTo('select');
    document.getElementById('btn-mundo').onclick   = () => App.goTo('worldmap');
    document.getElementById('btn-trofeus').onclick = () => App.goTo('trophies');
    document.getElementById('btn-passe').onclick   = () => App.goTo('battlepass');
    document.getElementById('btn-missoes').onclick = () => alert('Missões — em breve!');
    document.getElementById('btn-perfil').onclick  = () => alert('Perfil — em breve!');
    document.getElementById('btn-loja').onclick    = () => App.goTo('shop');

    const sidebar = document.getElementById('opcoes-sidebar');
    document.getElementById('btn-opcoes').onclick = () => {
      sidebar.classList.toggle('open');
    };
    // Fechar ao clicar fora
    document.getElementById('screen-menu').addEventListener('click', e => {
      if (!e.target.closest('#opcoes-sidebar') && !e.target.closest('#btn-opcoes')) {
        sidebar.classList.remove('open');
      }
    });
    // Cada botão — placeholder
    sidebar.querySelectorAll('.op-btn').forEach(btn => {
      btn.onclick = () => {
        const opcao = btn.dataset.opcao;
        const nome = btn.querySelector('span:last-child').textContent;
        sidebar.classList.remove('open');
        if (opcao === 'mapas') {
          setTimeout(() => App.goTo('mapmaker'), 150);
        } else {
          setTimeout(() => alert(`${nome} — em breve!`), 150);
        }
      };
    });
  },
};
