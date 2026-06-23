const MenuScene = {
  init() {
    document.getElementById('btn-jogar').onclick   = () => App.goTo('select');
    document.getElementById('btn-rangers').onclick = () => App.goTo('select');
    document.getElementById('btn-mundo').onclick   = () => App.goTo('worldmap');
    document.getElementById('btn-trofeus').onclick = () => App.goTo('trophies');
    document.getElementById('btn-loja').onclick    = () => App.goTo('shop');
    document.getElementById('btn-opcoes').onclick  = () => alert('Opções em breve!');
  },
};
