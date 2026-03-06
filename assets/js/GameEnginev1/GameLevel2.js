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

import GameEnvBackground from './essentials/GameEnvBackground.js';
import Player from './essentials/Player.js';
import Npc from './essentials/Npc.js';
import Barrier from './essentials/Barrier.js';

/**
 * @class GameLevel2
 * @description Defines the second level of the adventure game, set on an alien planet.
 * Constructs and configures all game objects for this level — background, player,
 * NPC guide, and invisible collision barrier — by populating `this.classes` with
 * data descriptors consumed by the game engine at runtime.
 *
 * @param {Object} gameEnv - The game environment context provided by the engine.
 * @param {string} gameEnv.path   - Base asset path used to resolve image URLs.
 * @param {number} gameEnv.innerWidth  - Viewport width, used for responsive positioning.
 * @param {number} gameEnv.innerHeight - Viewport height, used for responsive positioning.
 */
class GameLevel2 {
    constructor(gameEnv) {
        const path = gameEnv.path;
        const width = gameEnv.innerWidth;
        const height = gameEnv.innerHeight;

        /**
         * @typedef {Object} bgData
         * @description Defines the scrolling background for Level 2.
         * Renders a full-screen alien planet scene behind all other game objects.
         *
         * @property {string} name   - Internal identifier for this background asset.
         * @property {string} src    - Path to the background image (alien_planet.jpg).
         * @property {Object} pixels - Native pixel dimensions of the source image,
         *                             used by the engine to scale the background to
         *                             fill the current viewport without distortion.
         */
        const bgData = {
            name: "custom_bg",
            src: path + "/images/gamebuilder/bg/alien_planet.jpg",
            pixels: { height: 772, width: 1134 }
        };

        /**
         * @typedef {Object} playerData
         * @description Configures the player-controlled astronaut character.
         * Defines the sprite sheet layout, movement speed, animation timing,
         * directional frame mappings, hitbox, and keyboard bindings.
         *
         * @property {string} id            - Unique identifier for the player instance.
         * @property {string} src           - Path to the astronaut sprite sheet (astro.png).
         * @property {number} SCALE_FACTOR  - Divisor applied to the sprite's native size;
         *                                    higher values produce a smaller rendered character.
         * @property {number} STEP_FACTOR   - Controls movement speed; higher values move
         *                                    the player further per key-press cycle.
         * @property {number} ANIMATION_RATE - Milliseconds between frame advances;
         *                                     lower values produce faster animation.
         * @property {Object} INIT_POSITION - Starting {x, y} coordinates in pixels,
         *                                    placing the player near the left side of the level.
         * @property {Object} pixels        - Native pixel dimensions of the full sprite sheet.
         * @property {Object} orientation   - Declares the sprite sheet grid (4 rows × 4 columns).
         * @property {Object} down/up/left/right/downLeft/downRight/upLeft/upRight
         *                                 - Per-direction animation descriptors, each specifying
         *                                   which sprite sheet row to read, the starting column,
         *                                   how many columns to cycle, and an optional `rotate`
         *                                   (radians) for diagonal movement tilt.
         * @property {Object} hitbox        - Shrinks the collision box as a percentage of the
         *                                    sprite's rendered size (0 = full sprite bounds).
         * @property {Object} keypress      - Maps movement directions to key codes
         *                                    (W/A/S/D by default).
         */
        const playerData = {
            id: 'playerData',
            src: path + "/images/gamebuilder/sprites/astro.png",
            SCALE_FACTOR: 7,
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

        /**
         * @typedef {Object} npcData1
         * @description Configures the R2-style NPC that acts as a level guide,
         * prompting the player to advance to the next level upon interaction.
         *
         * @property {string} id            - Unique identifier for this NPC instance.
         * @property {string} greeting      - Fallback text shown if the dialogue system
         *                                    is unavailable (logged to console).
         * @property {string} src           - Path to the NPC sprite sheet (r2_idle.png).
         * @property {number} SCALE_FACTOR  - Renders the NPC smaller relative to its
         *                                    native sprite size (higher = smaller).
         * @property {number} ANIMATION_RATE - Milliseconds per animation frame.
         * @property {Object} INIT_POSITION - Starting {x, y} position, placing the NPC
         *                                    roughly center-screen to the right.
         * @property {Object} pixels        - Native pixel dimensions of the sprite sheet.
         * @property {Object} orientation   - Sprite sheet grid (1 row × 3 columns);
         *                                    this NPC only has one animation row.
         * @property {Object} down/right/left/up/upRight/downRight/upLeft/downLeft
         *                                 - Directional frame mappings. Because the sprite
         *                                   sheet has only 1 row, all non-down directions
         *                                   clamp to row 0 via Math.min(n, 1-1).
         * @property {Object} hitbox        - Collision box inset as a percentage of the
         *                                    rendered sprite (10% width, 20% height).
         * @property {string[]} dialogues   - Array of dialogue strings cycled randomly
         *                                    when the player interacts with the NPC.
         * @property {Function} reaction    - Called on proximity trigger; displays a
         *                                    reaction dialogue bubble if the dialogue
         *                                    system is present, otherwise logs greeting.
         * @property {Function} interact    - Called on direct player interaction (e.g.
         *                                    key press); shows a random dialogue bubble.
         */
        const npcData1 = {
            id: 'NPC',
            greeting: 'Hi! Ready to move to the next level?',
            src: path + "/images/gamify/r2_idle.png",
            SCALE_FACTOR: 7,
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

        /**
         * @typedef {Object} dbarrier_1
         * @description An invisible collision barrier placed in the level to block
         * player movement through a specific map region (e.g. a wall or doorframe).
         * Sourced from the level overlay, so its coordinates map directly to the
         * overlay's coordinate space rather than being manually tuned.
         *
         * @property {string}  id      - Unique identifier for this barrier instance.
         * @property {number}  x       - Left edge position in overlay/level pixels.
         * @property {number}  y       - Top edge position in overlay/level pixels.
         * @property {number}  width   - Width of the barrier rectangle in pixels.
         * @property {number}  height  - Height of the barrier rectangle in pixels.
         * @property {boolean} visible - Set to false so the barrier is invisible at
         *                               runtime; purely a collision object.
         * @property {Object}  hitbox  - Zero-percentage inset keeps the collision box
         *                               flush with the full declared width/height.
         * @property {boolean} fromOverlay - Signals to the engine that coordinates
         *                                   originate from the level overlay tool,
         *                                   enabling correct scaling at runtime.
         */
        const dbarrier_1 = {
            id: 'dbarrier_1', x: 263, y: 149, width: 32, height: 124, visible: false,
            hitbox: { widthPercentage: 0.0, heightPercentage: 0.0 },
            fromOverlay: true
        };

        /**
         * @property {Array<{class: Function, data: Object}>} classes
         * @description Ordered list of game object descriptors for this level.
         * The engine instantiates each entry by calling `new class(data, gameEnv)`.
         * Order matters: GameEnvBackground must come first so it renders beneath
         * all other objects. Barriers should be included before or after characters
         * as needed by the engine's collision resolution pass.
         */
        this.classes = [
            { class: GameEnvBackground, data: bgData },
            { class: Player,            data: playerData },
            { class: Npc,               data: npcData1 },
            { class: Barrier,           data: dbarrier_1 }
        ];
    }
}

export default GameLevel2;