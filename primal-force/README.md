# Power Rangers Primal Force 🦖

Jogo de ação/aventura/RPG original criado do zero.

## Como jogar no VS Code

### Opção 1 — Live Server (recomendado)
1. Instala a extensão **Live Server** no VS Code
2. Clica com o botão direito em `index.html`
3. Seleciona **"Open with Live Server"**
4. Abre automaticamente no browser!

### Opção 2 — Browser direto
1. Abre a pasta do projeto
2. Clica duas vezes em `index.html`
3. Abre no browser (pode não funcionar em todos os browsers por restrições de segurança — usa o Live Server de preferência)

---

## Controlos

### PC (Teclado)
| Tecla | Ação |
|-------|------|
| WASD / Setas | Mover |
| ESPAÇO | Ataque corpo a corpo |
| X | Disparo laser |
| C | Ataque especial |
| V | Escudo |
| Q | Zord (ataque definitivo) |
| ESC / P | Pausa |

### Telemóvel / Tablet
- D-pad no canto inferior esquerdo para mover
- Botões de ação no canto inferior direito

---

## Rangers disponíveis

| Ranger | Cor | Zord | Estilo |
|--------|-----|------|--------|
| Roro | Vermelho | T-Rex | Equilibrado |
| Mar | Preto | Stegossauro | Tank (muito HP) |
| Marc | Azul | Triceratops | Dash agressivo |
| Vido | Dourado | Pterodáctilo | Velocidade |
| Mira | Roxo | Plesiosauros | Magia/laser |
| Zenowing | Prata | Titanossauro | Ataque máximo |

---

## Estrutura do projeto

```
primal-force/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── core/
│   │   ├── utils.js       ← funções auxiliares
│   │   ├── input.js       ← teclado + mobile
│   │   ├── renderer.js    ← (reservado para expansão)
│   │   └── world.js       ← geração do mapa
│   ├── entities/
│   │   ├── ranger.js      ← player + dados dos rangers
│   │   ├── enemy.js       ← inimigos (4 tipos)
│   │   ├── projectile.js  ← projéteis, partículas, pickups
│   │   ├── particle.js    ← (stub)
│   │   └── pickup.js      ← (stub)
│   ├── ui/
│   │   └── hud.js         ← HUD, minimap, cooldowns
│   └── scenes/
│       ├── menu.js        ← menu principal
│       ├── select.js      ← seleção de ranger
│       └── game.js        ← loop principal do jogo
└── assets/
    ├── sprites/           ← (futuras sprites)
    ├── sounds/            ← (futuros sons)
    └── maps/              ← (futuros mapas)
```

---

## Roadmap — próximas funcionalidades

- [ ] Sistema de história com diálogos
- [ ] Boss fights (Lorde Arcano, Maltherion, Valtherion)
- [ ] Mapa do mundo com missões
- [ ] Sistema de inventário e equipamentos
- [ ] Sprites desenhadas para os Rangers
- [ ] Efeitos sonoros e música
- [ ] Multiplayer local (2 jogadores)
- [ ] Guardado de progresso (localStorage)
- [ ] Mais rangers (faltam 14!)
- [ ] Cutscenes entre missões
