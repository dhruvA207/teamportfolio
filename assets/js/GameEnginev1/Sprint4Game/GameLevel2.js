// Adventure Game Custom Level
// Exported from GameBuilder on 2026-03-05T17:10:57.847Z
// How to use this file:
// 1) Save as assets/js/adventureGame/GameLevel2.js in your repo.
// 2) Reference it in your runner or level selector. Examples:
//    import GameLevelPlanets from '/assets/js/GameEnginev1/GameLevelPlanets.js';
//    import GameLevel2 from '/assets/js/adventureGame/GameLevel2.js';
//    export const gameLevelClasses = [GameLevelPlanets, GameLevel2];
//    // or pass it directly to your GameControl as the only level.
// 3) Ensure images exist and paths resolve via 'path' provided by the engine.
// 4) You can add more objects to this.classes inside the constructor.

import GameEnvBackground from '/assets/js/GameEnginev1/essentials/GameEnvBackground.js';
import Player from '/assets/js/GameEnginev1/essentials/Player.js';
import Npc from '/assets/js/GameEnginev1/essentials/Npc.js';
import Barrier from '/assets/js/GameEnginev1/essentials/Barrier.js';

class GameLevel2 {
    constructor(gameEnv) {
        const path = gameEnv.path;
        const width = gameEnv.innerWidth;
        const height = gameEnv.innerHeight;

        const bgData = {
            name: "custom_bg",
            src: path + "/images/gamebuilder/bg/alien_planet.jpg",
            pixels: { height: 772, width: 1134 }
        };

        const playerData = {
            id: 'playerData',
            src: path + "/images/gamebuilder/sprites/astro.png",
            SCALE_FACTOR: 5,
            STEP_FACTOR: 1000,
            ANIMATION_RATE: 50,
            INIT_POSITION: { x: 100, y: 300 },
            pixels: { height: 770, width: 513 },
            orientation: { rows: 4, columns: 4 },
            down: { row: 0, start: 0, columns: 3 },
            downRight: { row: 1, start: 0, columns: 3, rotate: Math.PI/16 },
            downLeft: { row: 0, start: 0, columns: 3, rotate: -Math.PI/16 },
            left: { row: 2, start: 0, columns: 3 },
            right: { row: 1, start: 0, columns: 3 },
            up: { row: 3, start: 0, columns: 3 },
            upLeft: { row: 2, start: 0, columns: 3, rotate: Math.PI/16 },
            upRight: { row: 3, start: 0, columns: 3, rotate: -Math.PI/16 },
            hitbox: { widthPercentage: 0, heightPercentage: 0 },
            keypress: { up: 87, left: 65, down: 83, right: 68 }
            };

        const npcData1 = {
            id: 'NPC',
            greeting: 'Hi! Ready to move to the next level?',
            src: path + "/images/gamify/r2_idle.png",
            SCALE_FACTOR: 8,
            ANIMATION_RATE: 50,
            INIT_POSITION: { x: 504, y: 242 },
            pixels: { height: 223, width: 505 },
            orientation: { rows: 1, columns: 3 },
            down: { row: 0, start: 0, columns: 3 },
            right: { row: Math.min(1, 1 - 1), start: 0, columns: 3 },
            left: { row: Math.min(2, 1 - 1), start: 0, columns: 3 },
            up: { row: Math.min(3, 1 - 1), start: 0, columns: 3 },
            upRight: { row: Math.min(3, 1 - 1), start: 0, columns: 3 },
            downRight: { row: Math.min(1, 1 - 1), start: 0, columns: 3 },
            upLeft: { row: Math.min(2, 1 - 1), start: 0, columns: 3 },
            downLeft: { row: 0, start: 0, columns: 3 },
            hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
            dialogues: ['Hi! Ready to move to the next level?'],
            reaction: function() { if (this.dialogueSystem) { this.showReactionDialogue(); } else { console.log(this.greeting); } },
            interact: function() { if (this.dialogueSystem) { this.showRandomDialogue(); } }
        };
        const dbarrier_1 = {
            id: 'dbarrier_1', x: 263, y: 149, width: 32, height: 124, visible: false,
            hitbox: { widthPercentage: 0.0, heightPercentage: 0.0 },
            fromOverlay: true
        };
this.classes = [      { class: GameEnvBackground, data: bgData },
      { class: Player, data: playerData },
      { class: Npc, data: npcData1 },
      { class: Barrier, data: dbarrier_1 }
];

        
    }
}

export default GameLevel2;