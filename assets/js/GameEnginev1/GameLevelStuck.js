/**
 * @file GameLevelAlienPlanet.js
 * @description A custom RPG game level set on an alien planet.
 *              The player (an astronaut) navigates a hostile alien environment
 *              and must avoid a blocking Slime NPC that prevents level progression.
 *              A barrier wall is placed at the top-left to restrict movement.
 *
 * @level       AlienPlanet
 * @author      Team Member
 * @module      GameBuilder
 */

import GameEnvBackground from '/assets/js/GameEnginev1/essentials/GameEnvBackground.js';
import Player from '/assets/js/GameEnginev1/essentials/Player.js';
import Npc from '/assets/js/GameEnginev1/essentials/Npc.js';
import Barrier from '/assets/js/GameEnginev1/essentials/Barrier.js';

/**
 * @class GameLevelAlienPlanet
 * @classdesc Defines the "Alien Planet" game level.
 *
 * Game Concept:
 *   The player is an astronaut stranded on an alien planet. A hostile slime alien
 *   blocks the path forward, taunting the player and preventing level completion.
 *   The player must navigate around a barrier wall and interact with the NPC,
 *   but the NPC's dialogue signals a dead end — the only escape is to restart (E key).
 *
 * Objects in this level:
 *   1. GameEnvBackground — Alien planet background image (static scene)
 *   2. Player            — Astronaut sprite, WASD-controlled
 *   3. Npc               — Slime alien blocker with hostile dialogue
 *   4. Barrier           — Invisible wall at top-left corner
 */
class GameLevelAlienPlanet {

    /**
     * @constructor
     * @param {Object} gameEnv - The game environment context, providing dimensions,
     *                           asset path, and the container element.
     *
     * @property {string}  gameEnv.path        - Base path to asset files
     * @property {number}  gameEnv.innerWidth  - Canvas/viewport width in pixels
     * @property {number}  gameEnv.innerHeight - Canvas/viewport height in pixels
     */
    constructor(gameEnv) {
        const path = gameEnv.path;
        const width = gameEnv.innerWidth;
        const height = gameEnv.innerHeight;

        // =====================================================================
        /**
         * @object bgData
         * @type {GameEnvBackground}
         * @description Sets the visual scene for the level.
         *
         * Purpose:
         *   Renders a full-screen alien planet landscape as the level backdrop.
         *
         * Key Properties:
         *   - src: Points to "alien_planet.jpg" from the shared gamebuilder assets
         *   - pixels: Native image resolution (1134×772) used for proper scaling
         *   - name: Unique identifier "custom_bg" for this background instance
         */
        // =====================================================================
        const bgData = {
            name: "custom_bg",
            src: path + "/images/gamebuilder/bg/alien_planet.jpg",
            pixels: { height: 772, width: 1134 }
        };

        // =====================================================================
        /**
         * @object playerData
         * @type {Player}
         * @description The user-controlled astronaut character.
         *
         * Purpose:
         *   Represents the player navigating the alien planet level.
         *   Controlled via WASD keys with 8-directional movement and animations.
         *
         * Key Properties:
         *   - src: Astronaut sprite sheet (4 rows × 4 columns)
         *   - SCALE_FACTOR: 5 — renders the sprite at 1/5 of the canvas height
         *   - STEP_FACTOR: 1000 — controls movement speed relative to canvas size
         *   - ANIMATION_RATE: 50ms per frame — smooth walk cycle
         *   - INIT_POSITION: Spawns at (100, 300) — left-center of screen
         *   - keypress: WASD mapped (W=87, A=65, S=83, D=68)
         *   - hitbox: Set to 0% — no collision padding on the player
         *   - Directional rows: down=0, right/downRight=1, left/upLeft=2, up/upRight=3
         *   - Diagonal movement uses slight rotation (±Math.PI/16) for visual polish
         */
        // =====================================================================
        const playerData = {
            id: 'playerData',
            src: path + "/images/gamebuilder/sprites/astro.png",
            SCALE_FACTOR: 5,
            STEP_FACTOR: 1000,
            ANIMATION_RATE: 50,
            INIT_POSITION: { x: 100, y: 300 },
            pixels: { height: 770, width: 513 },
            orientation: { rows: 4, columns: 4 },
            down:      { row: 0, start: 0, columns: 3 },
            downRight: { row: 1, start: 0, columns: 3, rotate: Math.PI / 16 },
            downLeft:  { row: 0, start: 0, columns: 3, rotate: -Math.PI / 16 },
            left:      { row: 2, start: 0, columns: 3 },
            right:     { row: 1, start: 0, columns: 3 },
            up:        { row: 3, start: 0, columns: 3 },
            upLeft:    { row: 2, start: 0, columns: 3, rotate: Math.PI / 16 },
            upRight:   { row: 3, start: 0, columns: 3, rotate: -Math.PI / 16 },
            hitbox: { widthPercentage: 0, heightPercentage: 0 },
            keypress: { up: 87, left: 65, down: 83, right: 68 }
        };

        // =====================================================================
        /**
         * @object npcData1
         * @type {Npc}
         * @description A hostile slime alien that blocks level progression.
         *
         * Purpose:
         *   Acts as a "blocker" NPC. When the player interacts with it (E key),
         *   it delivers a taunting dialogue indicating the level cannot be completed
         *   and prompts the player to restart. This creates a puzzle/challenge dynamic.
         *
         * Key Properties:
         *   - id: 'Alien' — unique identifier for this NPC
         *   - src: Slime sprite sheet (4 rows × 4 columns, 225×225px native)
         *   - SCALE_FACTOR: 5 — matches player scale for visual consistency
         *   - INIT_POSITION: (500, 300) — center-right of screen, blocking the path
         *   - hitbox: widthPercentage=0.1, heightPercentage=0.2 — slight collision margin
         *   - dialogues: Single hostile message telling the player they're stuck
         *   - reaction(): Triggers dialogue display via the dialogueSystem if available
         *   - interact(): Shows a random dialogue on player interaction (E key)
         *   - Directional sprite rows use Math.min() guards to prevent out-of-bounds
         */
        // =====================================================================
        const npcData1 = {
            id: 'Alien',
            greeting: 'Hah! Got you! You can\'t advance to the next level. Press E to restart.',
            src: path + "/images/gamebuilder/sprites/slime.png",
            SCALE_FACTOR: 5,
            ANIMATION_RATE: 50,
            INIT_POSITION: { x: 500, y: 300 },
            pixels: { height: 225, width: 225 },
            orientation: { rows: 4, columns: 4 },
            down:      { row: 0, start: 0, columns: 3 },
            right:     { row: Math.min(1, 4 - 1), start: 0, columns: 3 },
            left:      { row: Math.min(2, 4 - 1), start: 0, columns: 3 },
            up:        { row: Math.min(3, 4 - 1), start: 0, columns: 3 },
            upRight:   { row: Math.min(3, 4 - 1), start: 0, columns: 3 },
            downRight: { row: Math.min(1, 4 - 1), start: 0, columns: 3 },
            upLeft:    { row: Math.min(2, 4 - 1), start: 0, columns: 3 },
            downLeft:  { row: 0, start: 0, columns: 3 },
            hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
            dialogues: ['Hah! Got you! You can\'t advance to the next level. Press E to restart.'],
            /**
             * @method reaction
             * @description Called when the NPC reacts to a nearby player.
             *              Triggers the dialogue system's reaction display if available,
             *              otherwise falls back to a console log.
             */
            reaction: function () {
                if (this.dialogueSystem) { this.showReactionDialogue(); }
                else { console.log(this.greeting); }
            },
            /**
             * @method interact
             * @description Called when the player presses E near the NPC.
             *              Displays a random dialogue from the dialogues array.
             */
            interact: function () {
                if (this.dialogueSystem) { this.showRandomDialogue(); }
            }
        };

        // =====================================================================
        /**
         * @object dbarrier_1
         * @type {Barrier}
         * @description An invisible wall placed at the top-left corner of the level.
         *
         * Purpose:
         *   Blocks the player from moving into the top-left region of the map,
         *   reinforcing level boundaries and guiding the player toward the NPC.
         *
         * Key Properties:
         *   - id: 'dbarrier_1' — unique identifier
         *   - position: x=0, y=1 (top-left corner, anchored to screen edge)
         *   - size: 235×134 pixels — covers a rectangular boundary zone
         *   - visible: true — rendered visibly in the builder for debugging;
         *              toggled at runtime via builder's wall-visibility controls
         *   - hitbox: 0% padding — exact boundary matching with no margin
         *   - fromOverlay: true — marks this as a builder-drawn overlay barrier
         */
        // =====================================================================
        const dbarrier_1 = {
            id: 'dbarrier_1',
            x: 0, y: 1,
            width: 235, height: 134,
            visible: true,
            hitbox: { widthPercentage: 0.0, heightPercentage: 0.0 },
            fromOverlay: true
        };

        /**
         * @property {Array} classes
         * @description Ordered list of game objects to instantiate for this level.
         *              Render order: Background → Player → NPC → Barrier
         */
        this.classes = [
            { class: GameEnvBackground, data: bgData },
            { class: Player,            data: playerData },
            { class: Npc,               data: npcData1 },
            { class: Barrier,           data: dbarrier_1 }
        ];

        /* BUILDER_ONLY_START */
        // Post object summary to builder (debugging visibility of NPCs/walls)
        try {
            setTimeout(() => {
                try {
                    const objs = Array.isArray(gameEnv?.gameObjects) ? gameEnv.gameObjects : [];
                    const summary = objs.map(o => ({
                        cls: o?.constructor?.name || 'Unknown',
                        id: o?.canvas?.id || '',
                        z: o?.canvas?.style?.zIndex || ''
                    }));
                    if (window && window.parent) window.parent.postMessage({ type: 'rpg:objects', summary }, '*');
                } catch (_) {}
            }, 250);
        } catch (_) {}

        // Report environment metrics (like top offset) to builder
        try {
            if (window && window.parent) {
                try {
                    const rect = (gameEnv && gameEnv.container && gameEnv.container.getBoundingClientRect)
                        ? gameEnv.container.getBoundingClientRect()
                        : { top: gameEnv.top || 0, left: 0 };
                    window.parent.postMessage({ type: 'rpg:env-metrics', top: rect.top, left: rect.left }, '*');
                } catch (_) {
                    try { window.parent.postMessage({ type: 'rpg:env-metrics', top: gameEnv.top, left: 0 }, '*'); } catch (__) {}
                }
            }
        } catch (_) {}

        // Listen for in-game wall visibility toggles from builder
        try {
            window.addEventListener('message', (e) => {
                if (!e || !e.data) return;
                if (e.data.type === 'rpg:toggle-walls') {
                    const show = !!e.data.visible;
                    if (Array.isArray(gameEnv?.gameObjects)) {
                        for (const obj of gameEnv.gameObjects) {
                            if (obj instanceof Barrier) { obj.visible = show; }
                        }
                    }
                } else if (e.data.type === 'rpg:set-drawn-barriers') {
                    const arr = Array.isArray(e.data.barriers) ? e.data.barriers : [];
                    window.__overlayBarriers = window.__overlayBarriers || [];
                    try {
                        for (const ob of window.__overlayBarriers) {
                            if (ob && typeof ob.destroy === 'function') ob.destroy();
                        }
                    } catch (_) {}
                    window.__overlayBarriers = [];
                    for (const bd of arr) {
                        try {
                            const data = {
                                id: bd.id, x: bd.x, y: bd.y,
                                width: bd.width, height: bd.height,
                                visible: !!bd.visible,
                                hitbox: { widthPercentage: 0.0, heightPercentage: 0.0 },
                                fromOverlay: true
                            };
                            const bobj = new Barrier(data, gameEnv);
                            gameEnv.gameObjects.push(bobj);
                            window.__overlayBarriers.push(bobj);
                        } catch (_) {}
                    }
                }
            });
        } catch (_) {}
        /* BUILDER_ONLY_END */
    }
}

export const gameLevelClasses = [GameLevelAlienPlanet];
