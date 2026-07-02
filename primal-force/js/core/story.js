// ── DADOS DA HISTÓRIA E DIÁLOGOS ─────────────────────────────────────
const Story = {
  // Diálogos por zona — Roro conta a história, tu forneces o lore!
  dialogues: {
    forest_intro: [
      { speaker: 'Roro',     color: '#e24b4a', emoji: '🦖', text: 'Esta floresta... sinto uma energia estranha. Os Dinos Primal estão a chamar-nos.' },
      { speaker: 'Mar',      color: '#888',    emoji: '🦕', text: 'Cuidado Roro. Os soldados de Lorde Arcano já chegaram aqui. Vejo rastos.' },
      { speaker: 'Roro',     color: '#e24b4a', emoji: '🦖', text: 'Então não há tempo a perder. Rangers — é hora de morfar!' },
      { speaker: 'Sistema',  color: '#fac775', emoji: '⚡', text: 'MISSÃO 1: Elimina todos os inimigos na Floresta Primordial!' },
    ],
    forest_complete: [
      { speaker: 'Mira',     color: '#af56f5', emoji: '🌊', text: 'Conseguimos! Mas sinto que isto é só o começo...' },
      { speaker: 'Roro',     color: '#e24b4a', emoji: '🦖', text: 'Tens razão. Lorde Arcano não vai parar aqui. Temos de avançar.' },
    ],
    city_intro: [
      { speaker: 'Marc',     color: '#378add', emoji: '🦏', text: 'A cidade está destruída... as pessoas fugiram todas.' },
      { speaker: 'Roro',     color: '#e24b4a', emoji: '🦖', text: 'Maltherion esteve aqui. Reconheço o padrão de destruição dos seus robôs.' },
      { speaker: 'Mar',      color: '#888',    emoji: '🦕', text: 'Vido está algures nesta cidade. Temos de o encontrar antes que Vordax o controle completamente.' },
      { speaker: 'Sistema',  color: '#fac775', emoji: '⚡', text: 'MISSÃO: Limpa a cidade e procura pistas sobre Vido!' },
    ],
    city_complete: [
      { speaker: 'Marc',     color: '#378add', emoji: '🦏', text: 'Encontrei uma mensagem de Vido... ele está na Base Inimiga.' },
      { speaker: 'Roro',     color: '#e24b4a', emoji: '🦖', text: 'Vamos buscá-lo. Ninguém fica para trás.' },
    ],
    enemy_base_intro: [
      { speaker: 'Zenowing', color: '#c0c0c0', emoji: '⚔️', text: 'Esta base é uma armadilha. Sinto-o.' },
      { speaker: 'Roro',     color: '#e24b4a', emoji: '🦖', text: 'Pode ser. Mas Vido está lá dentro. Como Guardian do Portão, é minha responsabilidade.' },
      { speaker: 'Mira',     color: '#af56f5', emoji: '🌊', text: 'Juntos conseguimos. Sempre.' },
      { speaker: 'Sistema',  color: '#fac775', emoji: '⚡', text: 'MISSÃO: Infiltra a Base Inimiga e resgata Vido!' },
    ],
    volcano_intro: [
      { speaker: 'Roro',     color: '#e24b4a', emoji: '🦖', text: 'O vulcão está instável... Valtherion deve estar a usar a energia geotérmica.' },
      { speaker: 'Mar',      color: '#888',    emoji: '🦕', text: 'Se ele ativar o núcleo, meio continente fica destruído.' },
      { speaker: 'Sistema',  color: '#fac775', emoji: '⚡', text: 'MISSÃO URGENTE: Para Valtherion antes que seja tarde demais!' },
    ],
    ocean_intro: [
      { speaker: 'Mira',     color: '#af56f5', emoji: '🌊', text: 'O oceano é o meu domínio. Aqui o Plesiosauros é mais forte do que nunca.' },
      { speaker: 'Roro',     color: '#e24b4a', emoji: '🦖', text: 'Mira, precisamos de ti para liderar aqui. É a tua missão.' },
      { speaker: 'Sistema',  color: '#fac775', emoji: '⚡', text: 'MISSÃO: Elimina a frota inimiga na costa!' },
    ],
    desert_intro: [
      { speaker: 'Vido',     color: '#fac775', emoji: '🦅', text: '...Roro... não consigo... Vordax está a lutar pelo controlo...' },
      { speaker: 'Roro',     color: '#e24b4a', emoji: '🦖', text: 'Vido! Aguenta! Vamos chegar até ti!' },
      { speaker: 'Sistema',  color: '#fac775', emoji: '⚡', text: 'MISSÃO: Atravessa o deserto e encontra Vido!' },
    ],
    mountains_intro: [
      { speaker: 'Zenowing', color: '#c0c0c0', emoji: '⚔️', text: 'As montanhas guardam um segredo antigo. O Titanossauro dormia aqui.' },
      { speaker: 'Roro',     color: '#e24b4a', emoji: '🦖', text: 'O poder Primal está a despertar em todo o lado. É sinal de que o momento decisivo se aproxima.' },
      { speaker: 'Sistema',  color: '#fac775', emoji: '⚡', text: 'MISSÃO: Desperta o poder ancestral das Montanhas!' },
    ],
    base_intro: [
      { speaker: 'Roro',     color: '#e24b4a', emoji: '🦖', text: 'A nossa base. O único lugar seguro que nos resta.' },
      { speaker: 'Mar',      color: '#888',    emoji: '🦕', text: 'Daqui planeamos o ataque final a Lorde Arcano.' },
      { speaker: 'Marc',     color: '#378add', emoji: '🦏', text: 'Estou a analisar os dados. Lorde Arcano está mais fraco depois das nossas vitórias.' },
      { speaker: 'Sistema',  color: '#fac775', emoji: '⚡', text: 'BASE DOS RANGERS: Descansa e prepara o ataque final!' },
    ],

    // ── DIÁLOGOS DOS BOSSES ──────────────────────────────────────────
    boss_maltherion: [
      { speaker: 'Sistema',    color: '#ff4444', emoji: '⚠️', text: 'ALERTA! PRESENÇA INIMIGA DETECTADA!' },
      { speaker: 'Maltherion', color: '#8a2de0', emoji: '🤖', text: 'Rangers... cometerem um erro ao vir até aqui. Valtherion e eu vamos destruir-vos!' },
      { speaker: 'Roro',       color: '#e24b4a', emoji: '🦖', text: 'Maltherion! Vais parar os teus ataques — aqui e agora!' },
      { speaker: 'Maltherion', color: '#8a2de0', emoji: '🤖', text: 'Tolo. O poder de Lorde Arcano flui em mim. Não tens hipótese!' },
      { speaker: 'Sistema',    color: '#fac775', emoji: '⚡', text: 'BOSS FIGHT: Derrota Maltherion!' },
    ],
    boss_maltherion_defeat: [
      { speaker: 'Maltherion', color: '#8a2de0', emoji: '🤖', text: '...Como...? Não é possível... Lorde Arcano não vai perdoar esta derrota...' },
      { speaker: 'Roro',       color: '#e24b4a', emoji: '🦖', text: 'Diz ao teu irmão Valtherion que é o próximo.' },
      { speaker: 'Mar',        color: '#888',    emoji: '🦕', text: 'Bem feito, equipa. Mas não baixemos a guarda.' },
    ],

    boss_valtherion: [
      { speaker: 'Sistema',    color: '#ff4444', emoji: '⚠️', text: 'ALERTA! ENERGIA CAÓTICA DETETADA!' },
      { speaker: 'Valtherion', color: '#e05a00', emoji: '🦾', text: 'Hahahaha! Vieram até mim! Que sorte a minha... mais Rangers para destruir!' },
      { speaker: 'Mira',       color: '#af56f5', emoji: '🌊', text: 'Este é Valtherion. Mais caótico e imprevisível que o irmão.' },
      { speaker: 'Valtherion', color: '#e05a00', emoji: '🦾', text: 'Imprevisível? Prefiro dizer... LETAL!' },
      { speaker: 'Sistema',    color: '#fac775', emoji: '⚡', text: 'BOSS FIGHT: Derrota Valtherion!' },
    ],
    boss_valtherion_defeat: [
      { speaker: 'Valtherion', color: '#e05a00', emoji: '🦾', text: 'N-não... Maltherion... perdemos os dois...' },
      { speaker: 'Marc',       color: '#378add', emoji: '🦏', text: 'Os robôs gémeos derrotados! Lorde Arcano ficou mais fraco.' },
      { speaker: 'Roro',       color: '#e24b4a', emoji: '🦖', text: 'A batalha está longe de acabar. Continuemos.' },
    ],

    boss_vordax: [
      { speaker: 'Sistema',    color: '#ff4444', emoji: '⚠️', text: 'ALERTA! ASSINATURA DE VIDO DETETADA — COM DISTORÇÃO INIMIGA!' },
      { speaker: 'Vordax',     color: '#20a050', emoji: '👁️', text: 'Rangers... tão ingénuos. Vieram salvar o vosso amigo? Ele pertence-me agora.' },
      { speaker: 'Vido',       color: '#fac775', emoji: '🦅', text: '...Roro... não... não consigo parar... Vordax é demasiado forte...' },
      { speaker: 'Roro',       color: '#e24b4a', emoji: '🦖', text: 'VIDO! Aguenta! Vamos libertá-lo, aconteça o que acontecer!' },
      { speaker: 'Vordax',     color: '#20a050', emoji: '👁️', text: 'Para libertar o teu amigo, terás de me destruir. Serás capaz?' },
      { speaker: 'Sistema',    color: '#fac775', emoji: '⚡', text: 'BOSS FIGHT: Derrota Vordax e liberta Vido!' },
    ],
    boss_vordax_defeat: [
      { speaker: 'Vordax',     color: '#20a050', emoji: '👁️', text: 'Impossível... derrotado... o meu controlo sobre Vido... a quebrar...' },
      { speaker: 'Vido',       color: '#fac775', emoji: '🦅', text: 'Roro...! Conseguiste! Estou de volta! Obrigado... obrigado a todos!' },
      { speaker: 'Roro',       color: '#e24b4a', emoji: '🦖', text: 'Vido! Bem-vindo de volta, irmão. Nunca te esquecemos.' },
      { speaker: 'Mar',        color: '#888',    emoji: '🦕', text: 'A equipa está completa de novo. Agora vamos acabar com Lorde Arcano.' },
    ],

    boss_arcano: [
      { speaker: 'Sistema',    color: '#ff4444', emoji: '⚠️', text: 'ALERTA MÁXIMO! LORDE ARCANO DETETADO!' },
      { speaker: 'Arcano',     color: '#d4af37', emoji: '💀', text: 'Então chegaram até mim. Impres... não. Não estou impressionado. Estou... entretido.' },
      { speaker: 'Roro',       color: '#e24b4a', emoji: '🦖', text: 'Lorde Arcano! Acabou para ti! Os teus servos foram derrotados!' },
      { speaker: 'Arcano',     color: '#d4af37', emoji: '💀', text: 'Maltherion, Valtherion, Vordax... meros instrumentos. O meu verdadeiro poder ainda não viram.' },
      { speaker: 'Zenowing',   color: '#c0c0c0', emoji: '⚔️', text: 'Está a ganhar tempo. Rangers — juntos! Esta é a batalha final!' },
      { speaker: 'Arcano',     color: '#d4af37', emoji: '💀', text: 'Força Primal contra poder das Trevas. Que comecem os jogos finais.' },
      { speaker: 'Sistema',    color: '#fac775', emoji: '⚡', text: 'BATALHA FINAL: Derrota Lorde Arcano!' },
    ],
    boss_arcano_defeat: [
      { speaker: 'Arcano',     color: '#d4af37', emoji: '💀', text: 'Como ousam... séculos de poder... destruídos... por... crianças com dinossauros...' },
      { speaker: 'Roro',       color: '#e24b4a', emoji: '🦖', text: 'A força Primal sempre vence as trevas. Este mundo está salvo!' },
      { speaker: 'Mar',        color: '#888',    emoji: '🦕', text: 'Fizemos história hoje.' },
      { speaker: 'Vido',       color: '#fac775', emoji: '🦅', text: 'Juntos somos imparáveis!' },
      { speaker: 'Mira',       color: '#af56f5', emoji: '🌊', text: 'Sempre.' },
      { speaker: 'Marc',       color: '#378add', emoji: '🦏', text: 'Power Rangers...' },
      { speaker: 'Zenowing',   color: '#c0c0c0', emoji: '⚔️', text: 'Primal Force!' },
      { speaker: 'Sistema',    color: '#fac775', emoji: '⚡', text: '🎉 VITÓRIA! Power Rangers Primal Force salvaram o mundo!' },
    ],
  },
};
