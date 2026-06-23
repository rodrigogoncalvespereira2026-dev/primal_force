const MenuScene = {
  init() {
    document.getElementById('btn-jogar').onclick   = () => App.goTo('select');
    document.getElementById('btn-rangers').onclick = () => App.goTo('select');
    document.getElementById('btn-mundo').onclick   = () => App.goTo('worldmap');
    document.getElementById('btn-trofeus').onclick = () => App.goTo('trophies');
    document.getElementById('btn-loja').onclick    = () => App.goTo('shop');

    const popup = document.getElementById('popup-opcoes');
    document.getElementById('btn-opcoes').onclick = () => {
      popup.classList.add('active');
      popup.querySelector('.popup-box').style.animation = 'slideUp 0.2s ease';
    };
    document.getElementById('btn-fechar-opcoes').onclick = () => {
      popup.classList.remove('active');
    };
    popup.addEventListener('click', e => {
      if (e.target === popup) popup.classList.remove('active');
    });
    // Cada botão do popup — placeholder
    popup.querySelectorAll('.popup-btn').forEach(btn => {
      btn.onclick = () => {
        const nome = btn.querySelector('span:last-child').textContent;
        popup.classList.remove('active');
        setTimeout(() => alert(`${nome} — em breve!`), 150);
      };
    });
  },
};
