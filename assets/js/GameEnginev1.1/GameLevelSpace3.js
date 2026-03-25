// Adventure Game Custom Level
// Exported from GameBuilder on 2026-03-06T03:54:46.013Z
// How to use this file:
// 1) Save as assets/js/adventureGame/GameLevelSpacelevel3.js in your repo.
// 2) Reference it in your runner or level selector. Examples:
//    import GameLevelPlanets from '/assets/js/GameEnginev1.1/GameLevelPlanets.js';
//    import GameLevelSpacelevel3 from '/assets/js/adventureGame/GameLevelSpacelevel3.js';
//    export const gameLevelClasses = [GameLevelPlanets, GameLevelSpacelevel3];
//    // or pass it directly to your GameControl as the only level.
// 3) Ensure images exist and paths resolve via 'path' provided by the engine.
// 4) You can add more objects to this.classes inside the constructor.

import GameEnvBackground from '../GameEnginev1.1/essentials/GameEnvBackground.js';
import Player from '../GameEnginev1.1/essentials/Player.js';
import Npc from '../GameEnginev1.1/essentials/Npc.js';
import Barrier from '../GameEnginev1.1/essentials/Barrier.js';

class GameLevelSpace {
    constructor(gameEnv) {
        this.gameEnv = gameEnv;
        this.levelTransitionTriggered = false;
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
            keypress: { up: 38, left: 37, down: 40, right: 39 }
            };

        const npcData1 = {
            id: '1',
            greeting: 'Hi, I am a chill guy. Touch the moon but don\'t fly too high.',
            src: path + "/images/gamify/chillguy.png",
            SCALE_FACTOR: 8,
            ANIMATION_RATE: 50,
            INIT_POSITION: { x: 800, y: 50 },
            pixels: { height: 512, width: 384 },
            orientation: { rows: 4, columns: 3 },
            down: { row: 0, start: 0, columns: 3 },
            right: { row: Math.min(1, 4 - 1), start: 0, columns: 3 },
            left: { row: Math.min(2, 4 - 1), start: 0, columns: 3 },
            up: { row: Math.min(3, 4 - 1), start: 0, columns: 3 },
            upRight: { row: Math.min(3, 4 - 1), start: 0, columns: 3 },
            downRight: { row: Math.min(1, 4 - 1), start: 0, columns: 3 },
            upLeft: { row: Math.min(2, 4 - 1), start: 0, columns: 3 },
            downLeft: { row: 0, start: 0, columns: 3 },
            hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
            dialogues: ['Hi, I am a chill guy. Touch the moon but don\'t fly too high.', 'Good luck on your adventure!', 'Time to move to the next level!'],
            reaction: function() { if (this.dialogueSystem) { this.showReactionDialogue(); } else { console.log(this.greeting); } },
            interact: function() { 
                // Show dialogue if available
                if (this.dialogueSystem) { 
                    this.showRandomDialogue(); 
                }
                // Trigger level transition immediately (same effect as hitting ESC)
                if (this.gameEnv && this.gameEnv.gameControl && this.gameEnv.gameControl.currentLevel) {
                    this.gameEnv.gameControl.currentLevel.continue = false;
                }
            }
        };
        const dbarrier_1 = {
            id: 'dbarrier_1', x: 700, y: 100, width: 150, height: 20, visible: true,
            hitbox: { widthPercentage: 0.0, heightPercentage: 0.0 },
            fromOverlay: true
        };

        const dbarrier_2 = {
            id: 'dbarrier_2', x: 800, y: 200, width: 50, height: 150, visible: true,
            hitbox: { widthPercentage: 0.0, heightPercentage: 0.0 },
            fromOverlay: true
        };

        const dbarrier_3 = {
            id: 'dbarrier_3', x: 600, y: 300, width: 40, height: 100, visible: true,
            hitbox: { widthPercentage: 0.0, heightPercentage: 0.0 },
            fromOverlay: true
        };

        const dbarrier_4 = {
            id: 'dbarrier_4', x: 300, y: 600, width: 400, height: 30, visible: true,
            hitbox: { widthPercentage: 0.0, heightPercentage: 0.0 },
            fromOverlay: true
        };

        const dbarrier_5 = {
            id: 'dbarrier_5', x: 900, y: 400, width: 150, height: 30, visible: true,
            hitbox: { widthPercentage: 0.0, heightPercentage: 0.0 },
            fromOverlay: true
        };
this.classes = [      { class: GameEnvBackground, data: bgData },
      { class: Player, data: playerData },
      { class: Npc, data: npcData1 },
      { class: Barrier, data: dbarrier_1 },
      { class: Barrier, data: dbarrier_2 },
      { class: Barrier, data: dbarrier_3 },
      { class: Barrier, data: dbarrier_4 },
      { class: Barrier, data: dbarrier_5 }
];

    }

    /**
     * Initialize method called after level creation
     * Sets up transition tracking on the gameEnv
     */
    initialize() {
        if (this.gameEnv && this.gameEnv.gameControl) {
            // Flag to track if transition has been triggered for this level
            this.gameEnv.gameLevelTransitionTriggered = false;
        }
    }
}

export default GameLevelSpace;
