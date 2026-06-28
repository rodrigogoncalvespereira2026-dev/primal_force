const MapEditorData = {
  GRID_COLS: 42,
  GRID_ROWS: 34,
  TILE: 48,

  TILES: [
    { id: 0, name: 'Chão',       emoji: '🟫', color: '#111c11', solid: false },
    { id: 1, name: 'Relva',      emoji: '🌿', color: '#0a1a0a', solid: false },
    { id: 2, name: 'Pedra',      emoji: '🪨', color: '#1a1a1a', solid: false },
    { id: 3, name: 'Água',       emoji: '💧', color: '#0a1220', solid: true  },
    { id: 4, name: 'Ruínas',     emoji: '🏛️', color: '#1c1410', solid: false },
    { id: 5, name: 'Areia',      emoji: '🏜️', color: '#c2a050', solid: false },
    { id: 6, name: 'Lava',       emoji: '🌋', color: '#cc3300', solid: true  },
    { id: 7, name: 'Neve',       emoji: '❄️', color: '#e0e8f0', solid: false },
  ],

  OBJECTS: [
    { id: 'player_spawn',  name: 'Spawn Jogador',   emoji: '🚩', color: '#44ff44', category: 'spawn',  max: 1 },
    { id: 'enemy_spawn',   name: 'Spawn Inimigo',   emoji: '💀', color: '#ff4444', category: 'spawn',  max: 8 },
    { id: 'boss_spawn',    name: 'Spawn Boss',      emoji: '👹', color: '#ff00ff', category: 'spawn',  max: 1 },
    { id: 'waypoint',      name: 'Checkpoint',      emoji: '🏁', color: '#ffff00', category: 'spawn',  max: 4 },
    { id: 'crate',         name: 'Caixa',           emoji: '📦', color: '#8B6914', category: 'object', max: 99, solid: true },
    { id: 'barrel',        name: 'Barril',          emoji: '🛢️', color: '#6B4226', category: 'object', max: 99, solid: true },
    { id: 'bone',          name: 'Osso',            emoji: '🦴', color: '#d4c8a0', category: 'object', max: 99, solid: false },
    { id: 'bush',          name: 'Arbusto',         emoji: '🌾', color: '#2d7a1e', category: 'object', max: 99, solid: false },
    { id: 'cactus',        name: 'Cacto',           emoji: '🌵', color: '#2d8a2e', category: 'object', max: 99, solid: true },
    { id: 'log',           name: 'Tronco',          emoji: '🪵', color: '#5c3a1e', category: 'object', max: 99, solid: true },
    { id: 'chest',         name: 'Baú',             emoji: '🧰', color: '#c8a84a', category: 'loot',   max: 5,  solid: true },
    { id: 'health_pack',   name: 'Curativo',        emoji: '❤️', color: '#ff4444', category: 'loot',   max: 5,  solid: false },
    { id: 'power_pack',    name: 'Energia',         emoji: '⚡', color: '#4488ff', category: 'loot',   max: 5,  solid: false },
    { id: 'torch',         name: 'Tocha',           emoji: '🔥', color: '#ff8800', category: 'deco',   max: 99, solid: false },
    { id: 'skull',         name: 'Crânio',          emoji: '💀', color: '#cccccc', category: 'deco',   max: 99, solid: false },
    { id: 'flag',          name: 'Bandeira',        emoji: '🚩', color: '#ff2222', category: 'deco',   max: 10, solid: false },
    { id: 'fence',         name: 'Cerca',           emoji: '🪵', color: '#8B6914', category: 'deco',   max: 99, solid: true },
    { id: 'campfire',      name: 'Fogueira',        emoji: '🔥', color: '#ff6600', category: 'deco',   max: 5,  solid: false },
  ],

  ZONE_THEMES: {
    forest:    { name: 'Floresta',     tiles: [0,1,0,0,1], ground: '#111c11' },
    city:      { name: 'Cidade',       tiles: [0,2,0,4,0], ground: '#1a1a1a' },
    enemy_base:{ name: 'Base Inimiga', tiles: [0,2,6,2,0], ground: '#1a1020' },
    volcano:   { name: 'Vulcão',       tiles: [6,2,6,0,2], ground: '#2a1510' },
    ocean:     { name: 'Oceano',       tiles: [3,0,3,0,5], ground: '#102040' },
    desert:    { name: 'Deserto',      tiles: [5,5,0,5,2], ground: '#c2a050' },
    mountains: { name: 'Montanhas',    tiles: [2,7,2,0,7], ground: '#8a9aa0' },
  },

  TOOLS: {
    PAINT:   'paint',
    ERASE:   'erase',
    FILL:    'fill',
    PICK:    'pick',
    OBJECT:  'object',
    ERASE_OBJ: 'erase_obj',
  },

  MODES: {
    TILES:   'tiles',
    OBJECTS: 'objects',
  },
};
