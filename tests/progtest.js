const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..') + path.sep;

global.COIN_SVG = '$';
global.GEM_SVG = '♦';

const src = fs.readFileSync(path.join(root, 'js/core/progression.js'), 'utf8');
(0, eval)(src + '\nglobalThis.Progression = Progression;');

let fails = 0;
function check(label, cond) {
  if (!cond) { fails++; console.log('FAIL: ' + label); }
  else console.log('ok:   ' + label);
}

Progression.data.trophies = 0;
Progression.addTrophies(10);
check('marco de 10 troféus desbloqueia Mar', Progression.isRangerUnlocked('mar'));
check('Marc continua bloqueado', !Progression.isRangerUnlocked('marc'));

Progression.data.battlePassTier = 3;
const coinsBefore = Progression.data.coins;
const ok = Progression.claimBPReward(2, 'free');
check('resgate free do nível 2 devolve moedas', ok && Progression.data.coins > coinsBefore);
check('segundo resgate do mesmo nível é recusado', !Progression.claimBPReward(2, 'free'));
check('nível acima do tier não pode ser resgatado', !Progression.canClaimBPReward(10, 'free'));
check('premium bloqueado sem compra', !Progression.canClaimBPReward(2, 'premium'));

Progression.data.gems = 100;
check('comprar premium custa joias', Progression.buyBPPremium(50) && Progression.data.gems === 50 && Progression.data.bpPremium);
check('premium já ativo não cobra de novo', Progression.buyBPPremium(50) && Progression.data.gems === 50);
check('depois de comprar, premium pode ser resgatado', Progression.canClaimBPReward(2, 'premium'));
check('resgate premium dá recompensas', Progression.claimBPReward(2, 'premium'));

check('skin desconhecida não é equipável', !Progression.equipSkin('nope'));
Progression.data.unlockedSkins.push('golden_ranger');
check('skin desbloqueada é equipável', Progression.equipSkin('golden_ranger') && Progression.data.equippedSkin === 'golden_ranger');
check('getSkin devolve cor', /^#|^hsl/.test(Progression.getSkin('golden_ranger').color));
check('getSkin de id gerado funciona', Progression.getSkin('skin_free_3').color.length > 3);
check('ownedSkins lista as desbloqueadas', Progression.ownedSkins().length >= 1);

console.log(fails === 0 ? '\nTODOS OS TESTES PASSARAM' : '\n' + fails + ' FALHAS');
process.exit(fails === 0 ? 0 : 1);
