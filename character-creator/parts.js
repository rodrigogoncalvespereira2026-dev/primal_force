const RangerParts = {
  helmets: [
    { id: 'dino',    name: 'Dino',     emoji: '🦖', build: 'helmetDino' },
    { id: 'phoenix', name: 'Fénix',    emoji: '🔥', build: 'helmetPhoenix' },
    { id: 'dragon',  name: 'Dragão',   emoji: '🐉', build: 'helmetDragon' },
    { id: 'wolf',    name: 'Lobo',     emoji: '🐺', build: 'helmetWolf' },
    { id: 'shark',   name: 'Tubarão',  emoji: '🦈', build: 'helmetShark' },
    { id: 'eagle',   name: 'Águia',    emoji: '🦅', build: 'helmetEagle' },
    { id: 'tiger',   name: 'Tigre',    emoji: '🐯', build: 'helmetTiger' },
    { id: 'scorpion',name: 'Escorpião',emoji: '🦂', build: 'helmetScorpion' },
    { id: 'samurai', name: 'Samurai',  emoji: '⛩️', build: 'helmetSamurai' },
    { id: 'ninja',   name: 'Ninja',    emoji: '🥷', build: 'helmetNinja' },
  ],

  chests: [
    { id: 'classic',  name: 'Clássico',    emoji: '👕', build: 'chestClassic' },
    { id: 'armor',    name: 'Armadura',    emoji: '🛡️', build: 'chestArmor' },
    { id: 'slim',     name: 'Esbelto',     emoji: '🏃', build: 'chestSlim' },
    { id: 'heavy',    name: 'Pesado',      emoji: '⚙️', build: 'chestHeavy' },
    { id: 'captor',   name: 'Captador',    emoji: '🧲', build: 'chestCaptor' },
    { id: 'primal',   name: 'Primordial',  emoji: '🌋', build: 'chestPrimal' },
  ],

  weapons: [
    { id: 'sword',    name: 'Espada',       emoji: '⚔️', build: 'weaponSword' },
    { id: 'lance',    name: 'Lança',        emoji: '🗡️', build: 'weaponLance' },
    { id: 'axe',      name: 'Machado',      emoji: '🪓', build: 'weaponAxe' },
    { id: 'hammer',   name: 'Martelo',      emoji: '🔨', build: 'weaponHammer' },
    { id: 'staff',    name: 'Cajado',       emoji: '🪄', build: 'weaponStaff' },
    { id: 'blaster',  name: 'Blaster',      emoji: '🔫', build: 'weaponBlaster' },
    { id: 'claws',    name: 'Garras',       emoji: '🐾', build: 'weaponClaws' },
    { id: 'shield',   name: 'Escudo',       emoji: '🛡️', build: 'weaponShield' },
    { id: 'none',     name: 'Mãos Nuas',    emoji: '👊', build: 'weaponNone' },
  ],

  boots: [
    { id: 'standard', name: 'Standard',    emoji: '👢', build: 'bootsStandard' },
    { id: ' armored', name: 'Blindado',    emoji: '🦶', build: 'bootsArmored' },
    { id: 'ninja',    name: 'Ninja',       emoji: '🥷', build: 'bootsNinja' },
    { id: 'heavy',    name: 'Pesado',      emoji: '⚙️', build: 'bootsHeavy' },
  ],

  accessories: [
    { id: 'none',     name: 'Nenhum',       emoji: '—',  build: null },
    { id: 'cape',     name: 'Capa',         emoji: '🦸', build: 'accCape' },
    { id: 'shoulder', name: 'Ombreira',     emoji: '🛡️', build: 'accShoulder' },
    { id: 'wings',    name: 'Asas',         emoji: '🪽', build: 'accWings' },
    { id: 'aura',     name: 'Aura',         emoji: '✨', build: 'accAura' },
    { id: 'antenna',  name: 'Antena',       emoji: '📡', build: 'accAntenna' },
  ],

  classes: {
    warrior: { name: 'Guerreiro', emoji: '⚔️', hp: 100, atk: 14, spd: 4, def: 8 },
    ranger:  { name: 'Ranger',    emoji: '🔫', hp: 85,  atk: 12, spd: 6, def: 5 },
    mage:    { name: 'Mago',      emoji: '⚡', hp: 75,  atk: 18, spd: 5, def: 4 },
    tank:    { name: 'Tanque',    emoji: '🛡️', hp: 140, atk: 8,  spd: 3, def: 14 },
  },
};
