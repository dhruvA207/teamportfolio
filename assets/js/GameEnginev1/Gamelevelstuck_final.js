// Adventure Game Custom Level
// Exported from GameBuilder on 2026-03-06T05:44:19.568Z
// How to use this file:
// 1) Save as assets/js/adventureGame/GameLevelGamelevelstuck.js in your repo.
// 2) Reference it in your runner or level selector. Examples:
//    import GameLevelPlanets from '/assets/js/GameEnginev1/GameLevelPlanets.js';
//    import GameLevelGamelevelstuck from '/assets/js/adventureGame/GameLevelGamelevelstuck.js';
//    export const gameLevelClasses = [GameLevelPlanets, GameLevelGamelevelstuck];
//    // or pass it directly to your GameControl as the only level.
// 3) Ensure images exist and paths resolve via 'path' provided by the engine.
// 4) You can add more objects to this.classes inside the constructor.
/**
 * @file GameLevelAlienPlanet.js
 * @description FA2 Update (v3) — Interaction, Behavior Design + Chase AI
 *
 *   This level extends FA1/FA2 with a chase AI behavior on the Alien NPC:
 *
 *   INTERACTION:  Proximity collision between the Player and the Alien NPC.
 *                 When the player moves within the NPC's hitbox range, a
 *                 "danger" trigger fires via the NPC's reaction() callback.
 *
 *   REACTION:     The HUD score counter decrements by 10 points on each
 *                 collision tick (with cooldown). The HUD pulses red visually.
 *                 If score reaches 0, a "Game Over — Press E to Restart"
 *                 overlay is displayed as a terminal state change.
 *
 *   CHASE AI:     AlienChaseAI runs on a setInterval loop. Each tick it reads
 *                 the player's canvas position, computes a direction vector
 *                 toward the player, and nudges the NPC's canvas position
 *                 by CHASE_SPEED pixels. The NPC accelerates as it closes in
 *                 (speed scales with distance). Chase pauses on game-over and
 *                 resets to INIT_POSITION on E-key restart.
 *
 * @level       AlienPlanet
 * @version     4.0 (FA2 + Chase + Survive Timer)
 * @author      Team Member
 * @module      GameBuilder
 */

import GameEnvBackground from './essentials/GameEnvBackground.js';
import Player from './essentials/Player.js';
import Npc from './essentials/Npc.js';
import Barrier from './essentials/Barrier.js';

// =============================================================================
/**
 * @constant INTERACTION_CONFIG
 * @description Central configuration for all interaction and reaction parameters.
 *              Centralising these values makes tuning straightforward without
 *              hunting through object definitions.
 *
 * Game Loop Role:
 *   These values are consumed inside the NPC's reaction() method, which the
 *   engine invokes each game-loop tick that it detects a hitbox overlap
 *   between the Player canvas and this NPC's canvas.
 *
 * @property {number} SCORE_START        - Player's starting score
 * @property {number} SCORE_PENALTY      - Points deducted per collision tick
 * @property {number} COLLISION_COOLDOWN - Milliseconds between penalty ticks
 *                                         (prevents score draining every frame)
 * @property {string} HUD_ELEMENT_ID     - DOM id of the on-screen score display
 * @property {string} OVERLAY_ELEMENT_ID - DOM id of the game-over overlay element
 */
// =============================================================================
const INTERACTION_CONFIG = {
    SURVIVE_MS:        10000,   // milliseconds the player must survive
    HUD_ELEMENT_ID:    'alien-planet-hud',
    CAUGHT_OVERLAY_ID: 'alien-planet-caught',
    WIN_OVERLAY_ID:    'alien-planet-win',
    CATCH_COOLDOWN_MS: 1200     // brief grace period after restart before re-catch
};

// =============================================================================
/**
 * @constant CHASE_CONFIG
 * @description Tuning values for the Alien's chase AI and stillness-penalty system.
 *
 * @property {number} TICK_MS             - How often (ms) the AI loop fires (~30fps).
 * @property {number} BASE_SPEED          - Normal constant chase speed (px/tick).
 * @property {number} RAGE_SPEED          - Speed when player has been still >= STILL_THRESHOLD_MS.
 * @property {number} STILL_THRESHOLD_MS  - Ms of stillness needed to trigger rage mode.
 * @property {number} STILL_RADIUS        - Player movement < this px counts as "still".
 * @property {number} STOP_RADIUS         - Distance (px) at which alien stops nudging.
 * @property {{x,y}}  INIT_POSITION       - Spawn position; must match npcData1.INIT_POSITION.
 */
// =============================================================================
const CHASE_CONFIG = {
    TICK_MS:            33,
    BASE_SPEED:         1.2,   // normal flat speed
    RAGE_SPEED:         3.8,   // speed when player stands still too long
    STILL_THRESHOLD_MS: 3000,  // 3 seconds of stillness triggers rage
    STILL_RADIUS:       4,     // px — movement smaller than this = "still"
    STOP_RADIUS:        18,
    INIT_POSITION:      { x: 500, y: 300 }
};

// =============================================================================
/**
 * @namespace AlienChaseAI
 * @description Autonomous chase behaviour for the Alien NPC, with a stillness
 *              penalty: if the player stands still for STILL_THRESHOLD_MS ms,
 *              the alien switches to RAGE_SPEED until the player moves again.
 *
 * Design:
 *   Uses its own setInterval (TICK_MS cadence). Each tick:
 *     1. Reads player/NPC canvas positions via getBoundingClientRect().
 *     2. Compares player position to previous tick to detect stillness.
 *     3. If still for >= STILL_THRESHOLD_MS: currentSpeed → RAGE_SPEED, HUD pulses red.
 *     4. As soon as player moves: currentSpeed → BASE_SPEED, HUD reverts.
 *     5. Moves NPC toward player at currentSpeed via CSS transform.
 */
// =============================================================================
const AlienChaseAI = {
    intervalId:    null,
    paused:        false,
    offsetX:       0,
    offsetY:       0,
    /** @type {number} Live speed — switches between BASE_SPEED and RAGE_SPEED */
    currentSpeed:  CHASE_CONFIG.BASE_SPEED,
    /** @type {{x:number,y:number}|null} Player centre-point sampled last tick */
    lastPlayerPos: null,
    /** @type {number|null} Date.now() timestamp of when player stopped moving */
    stillSince:    null,

    /**
     * @method start
     * @description Starts the chase loop after a short delay so the engine has
     *              time to create and position canvas elements.
     */
    start() {
        if (this.intervalId !== null) return;
        this.paused        = false;
        this.offsetX       = 0;
        this.offsetY       = 0;
        this.currentSpeed  = CHASE_CONFIG.BASE_SPEED;
        this.lastPlayerPos = null;
        this.stillSince    = null;
        setTimeout(() => {
            this.intervalId = setInterval(() => this._tick(), CHASE_CONFIG.TICK_MS);
        }, 500);
    },

    /**
     * @method stop
     * @description Clears the interval and removes any CSS transform.
     */
    stop() {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        const c = this._findCanvas('Alien');
        if (c) c.style.transform = '';
    },

    /** @method pause — Freezes movement (caught / win state). */
    pause() { this.paused = true; },

    /**
     * @method resume
     * @description Resets translation, stillness state, and speed; unpauses.
     *              Called by SurvivalManager.reset() on E-key restart.
     */
    resume() {
        this.offsetX       = 0;
        this.offsetY       = 0;
        this.currentSpeed  = CHASE_CONFIG.BASE_SPEED;
        this.lastPlayerPos = null;
        this.stillSince    = null;
        const c = this._findCanvas('Alien');
        if (c) c.style.transform = 'translate(0px, 0px)';
        this.paused = false;
    },

    /**
     * @method _findCanvas
     * @description Locates a canvas by id with a querySelectorAll fallback.
     * @param {string} id
     * @returns {HTMLCanvasElement|null}
     */
    _findCanvas(id) {
        let el = document.getElementById(id);
        if (el) return el;
        const all = document.querySelectorAll('canvas');
        for (const c of all) { if (c.id === id) return c; }
        return null;
    },

    /**
     * @method _setRageVisual
     * @description Pulses the HUD border/colour red when alien enters rage,
     *              reverts to teal when rage ends (unless timer is already in
     *              its own last-3s warning state).
     * @param {boolean} raging
     */
    _setRageVisual(raging) {
        const hud = document.getElementById(INTERACTION_CONFIG.HUD_ELEMENT_ID);
        if (!hud) return;
        if (raging) {
            hud.style.color      = '#ff4444';
            hud.style.textShadow = '0 0 18px #ff4444';
            hud.style.border     = '1px solid #ff444488';
        } else if ((SurvivalManager.remaining / 1000) > 3) {
            hud.style.color      = '#00ffcc';
            hud.style.textShadow = '0 0 10px #00ffcc';
            hud.style.border     = '1px solid #00ffcc55';
        }
    },

    /**
     * @method _tick
     * @description ── CHASE AI CORE — fires every TICK_MS ms ──
     *
     * Stillness detection (runs before movement each tick):
     *   Measures px moved since last tick. If < STILL_RADIUS, the player
     *   is considered still. Once they've been still for STILL_THRESHOLD_MS,
     *   currentSpeed → RAGE_SPEED and the HUD flashes red as a visual warning.
     *   First tick the player moves after being still: speed resets to BASE_SPEED.
     *
     * Object properties updated each tick:
     *   - this.lastPlayerPos : updated to current player centre
     *   - this.stillSince    : set on first still tick, cleared on movement
     *   - this.currentSpeed  : BASE_SPEED or RAGE_SPEED
     *   - this.offsetX/Y     : accumulate movement delta
     *   - npcCanvas.style.transform : updated with new translation
     */
    _tick() {
        if (this.paused) return;

        const playerCanvas = this._findCanvas('playerData');
        const npcCanvas    = this._findCanvas('Alien');
        if (!playerCanvas || !npcCanvas) return;

        const pr = playerCanvas.getBoundingClientRect();
        const nr = npcCanvas.getBoundingClientRect();

        const px = pr.left + pr.width  * 0.5;
        const py = pr.top  + pr.height * 0.5;
        const nx = nr.left + nr.width  * 0.5;
        const ny = nr.top  + nr.height * 0.5;

        // ── Stillness detection ──────────────────────────────────────────────
        const now = Date.now();
        if (this.lastPlayerPos !== null) {
            const moved = Math.sqrt(
                Math.pow(px - this.lastPlayerPos.x, 2) +
                Math.pow(py - this.lastPlayerPos.y, 2)
            );

            if (moved < CHASE_CONFIG.STILL_RADIUS) {
                // Player hasn't moved — start or continue stillness timer
                if (this.stillSince === null) this.stillSince = now;

                if ((now - this.stillSince) >= CHASE_CONFIG.STILL_THRESHOLD_MS) {
                    if (this.currentSpeed !== CHASE_CONFIG.RAGE_SPEED) {
                        this.currentSpeed = CHASE_CONFIG.RAGE_SPEED;
                        this._setRageVisual(true);
                    }
                }
            } else {
                // Player moved — disengage rage if active
                if (this.stillSince !== null) {
                    this.stillSince   = null;
                    this.currentSpeed = CHASE_CONFIG.BASE_SPEED;
                    this._setRageVisual(false);
                }
            }
        }
        this.lastPlayerPos = { x: px, y: py };
        // ────────────────────────────────────────────────────────────────────

        // Chase movement at currentSpeed
        const dx   = px - nx;
        const dy   = py - ny;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CHASE_CONFIG.STOP_RADIUS) return;

        const normX = dx / dist;
        const normY = dy / dist;

        this.offsetX += normX * this.currentSpeed;
        this.offsetY += normY * this.currentSpeed;

        npcCanvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px)`;
    }
}
// =============================================================================
/**
 * @namespace SurvivalManager
 * @description Manages the 10-second survival countdown, HUD timer display,
 *              caught overlay, and win overlay.
 *
 * Game Loop Role:
 *   SurvivalManager runs its own setInterval (every 100ms) for the countdown.
 *   Collision detection calls caught() from inside the NPC's reaction() callback.
 *   E-key press calls reset() from inside the NPC's interact() callback.
 */
// =============================================================================
const SurvivalManager = {
    /** @type {number} Milliseconds remaining */
    remaining: INTERACTION_CONFIG.SURVIVE_MS,

    /** @type {number|null} setInterval handle for the countdown */
    countdownId: null,

    /** @type {boolean} True while caught/win overlay is showing */
    frozen: false,

    /** @type {number|null} Timestamp of last restart — enforces catch cooldown */
    lastResetTime: null,

    /**
     * @method init
     * @description Creates the HUD timer, caught overlay, and win overlay in the DOM.
     *              Resets all state. Called once from the level constructor.
     */
    init() {
        this.remaining    = INTERACTION_CONFIG.SURVIVE_MS;
        this.frozen       = false;
        this.lastResetTime = null;
        if (this.countdownId !== null) { clearInterval(this.countdownId); this.countdownId = null; }

        // ── HUD countdown timer ──────────────────────────────────────────────
        let hud = document.getElementById(INTERACTION_CONFIG.HUD_ELEMENT_ID);
        if (!hud) {
            hud = document.createElement('div');
            hud.id = INTERACTION_CONFIG.HUD_ELEMENT_ID;
            Object.assign(hud.style, {
                position: 'fixed', top: '16px', right: '24px',
                color: '#00ffcc', fontFamily: 'monospace',
                fontSize: '26px', fontWeight: 'bold',
                textShadow: '0 0 10px #00ffcc', zIndex: '9999',
                pointerEvents: 'none', background: 'rgba(0,0,0,0.5)',
                padding: '6px 16px', borderRadius: '8px',
                border: '1px solid #00ffcc55',
                transition: 'color 0.2s, text-shadow 0.2s'
            });
            document.body.appendChild(hud);
        }
        this._updateHUD();

        // ── CAUGHT overlay ───────────────────────────────────────────────────
        if (!document.getElementById(INTERACTION_CONFIG.CAUGHT_OVERLAY_ID)) {
            const el = document.createElement('div');
            el.id = INTERACTION_CONFIG.CAUGHT_OVERLAY_ID;
            Object.assign(el.style, {
                display: 'none', position: 'fixed',
                top: '0', left: '0', width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.78)',
                color: '#ff4444', fontFamily: 'monospace',
                fontSize: '40px', fontWeight: 'bold',
                textAlign: 'center', paddingTop: '36vh',
                zIndex: '10000', letterSpacing: '2px',
                textShadow: '0 0 20px #ff4444'
            });
            el.innerHTML = '☠ CAUGHT!<br>' +
                '<span style="font-size:20px;color:#fff;">Press E near the Alien to restart</span>';
            document.body.appendChild(el);
        }

        // ── WIN overlay ──────────────────────────────────────────────────────
        if (!document.getElementById(INTERACTION_CONFIG.WIN_OVERLAY_ID)) {
            const el = document.createElement('div');
            el.id = INTERACTION_CONFIG.WIN_OVERLAY_ID;
            Object.assign(el.style, {
                display: 'none', position: 'fixed',
                top: '0', left: '0', width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.78)',
                color: '#00ffcc', fontFamily: 'monospace',
                fontSize: '40px', fontWeight: 'bold',
                textAlign: 'center', paddingTop: '36vh',
                zIndex: '10000', letterSpacing: '2px',
                textShadow: '0 0 20px #00ffcc'
            });
            el.innerHTML = '🛸 YOU SURVIVED!<br>' +
                '<span style="font-size:20px;color:#fff;">Level Complete — well done, astronaut!</span>';
            document.body.appendChild(el);
        }

        this._startCountdown();
    },

    /**
     * @method _updateHUD
     * @description Repaints the countdown timer text. Shows tenths of a second
     *              in the last 3 seconds for extra tension.
     */
    _updateHUD() {
        const el = document.getElementById(INTERACTION_CONFIG.HUD_ELEMENT_ID);
        if (!el) return;
        const secs = this.remaining / 1000;
        const display = secs <= 3
            ? `⏱ ${secs.toFixed(1)}s`
            : `⏱ ${Math.ceil(secs)}s`;
        el.textContent = display;

        // Pulse red when under 3 seconds
        if (secs <= 3) {
            el.style.color      = '#ff9900';
            el.style.textShadow = '0 0 14px #ff9900';
        } else {
            el.style.color      = '#00ffcc';
            el.style.textShadow = '0 0 10px #00ffcc';
        }
    },

    /**
     * @method _startCountdown
     * @description Starts the 100ms interval that ticks down this.remaining.
     *              Fires showWin() when remaining reaches zero.
     */
    _startCountdown() {
        if (this.countdownId !== null) return;
        this.countdownId = setInterval(() => {
            if (this.frozen) return;
            this.remaining = Math.max(0, this.remaining - 100);
            this._updateHUD();
            if (this.remaining <= 0) {
                clearInterval(this.countdownId);
                this.countdownId = null;
                this.showWin();
            }
        }, 100);
    },

    /**
     * @method caught
     * @description Called by the NPC reaction() when the player is touched.
     *              Stops the timer, freezes the alien, shows the CAUGHT overlay.
     *
     * Object properties updated:
     *   - this.frozen → true
     *   - countdownId cleared
     *   - CAUGHT overlay display → 'block'
     *   - AlienChaseAI paused
     */
    caught() {
        if (this.frozen) return; // already caught or won
        // Honour catch cooldown after a restart (grace period)
        if (this.lastResetTime !== null &&
            Date.now() - this.lastResetTime < INTERACTION_CONFIG.CATCH_COOLDOWN_MS) return;

        this.frozen = true;
        if (this.countdownId !== null) {
            clearInterval(this.countdownId);
            this.countdownId = null;
        }
        const el = document.getElementById(INTERACTION_CONFIG.CAUGHT_OVERLAY_ID);
        if (el) el.style.display = 'block';
        AlienChaseAI.pause();
    },

    /**
     * @method showWin
     * @description Fires when the countdown reaches zero — player survived!
     *              Freezes the alien and shows the win overlay.
     *
     * Object properties updated:
     *   - this.frozen → true
     *   - WIN overlay display → 'block'
     *   - AlienChaseAI paused
     */
    showWin() {
        this.frozen = true;
        AlienChaseAI.pause();
        const el = document.getElementById(INTERACTION_CONFIG.WIN_OVERLAY_ID);
        if (el) el.style.display = 'block';
    },

    /**
     * @method reset
     * @description Resets the timer and all overlays. Triggered by NPC.interact()
     *              (E key) — same key the caught overlay instructs the player to press.
     *
     * Object properties updated:
     *   - this.remaining → SURVIVE_MS (10000)
     *   - this.frozen    → false
     *   - this.lastResetTime → Date.now() (starts grace cooldown)
     *   - CAUGHT and WIN overlays hidden
     *   - HUD repainted
     *   - AlienChaseAI resumed (alien teleports to spawn)
     *   - Countdown restarted
     */
    reset() {
        this.remaining     = INTERACTION_CONFIG.SURVIVE_MS;
        this.frozen        = false;
        this.lastResetTime = Date.now();
        if (this.countdownId !== null) { clearInterval(this.countdownId); this.countdownId = null; }

        const caught = document.getElementById(INTERACTION_CONFIG.CAUGHT_OVERLAY_ID);
        const win    = document.getElementById(INTERACTION_CONFIG.WIN_OVERLAY_ID);
        if (caught) caught.style.display = 'none';
        if (win)    win.style.display    = 'none';

        this._updateHUD();
        AlienChaseAI.resume();
        this._startCountdown();
    }
};

// =============================================================================
/**
 * @class GameLevelAlienPlanet
 * @classdesc FA2 v3 — Alien Planet with collision scoring + chase AI.
 *
 * Interaction Design Summary:
 *   TRIGGER:   Player sprite enters the Alien NPC's hitbox bounding box
 *   HANDLER:   NPC.reaction() → SurvivalManager.caught()
 *   REACTIONS: (1) Score decrements on HUD  — score update
 *              (2) HUD pulses red           — animation / visual state change
 *              (3) Game-over overlay at 0   — terminal state change
 *   RESET:     Player presses E → NPC.interact() → SurvivalManager.reset()
 *
 * Chase AI:
 *   AlienChaseAI runs a setInterval at CHASE_CONFIG.TICK_MS (33ms ≈ 30fps).
 *   Each tick it reads the player and NPC canvas positions from the DOM,
 *   computes a normalised direction vector, scales speed by distance
 *   (constant speed: 1.2px/tick — BASE_SPEED == MAX_SPEED, no acceleration),
 *   and applies the offset to the NPC canvas CSS left/top.
 *   Chase pauses on game-over; alien teleports back to spawn on E-key reset.
 */
// =============================================================================
class GameLevelAlienPlanet {

    /**
     * @constructor
     * @param {Object} gameEnv - Game environment context
     * @param {string} gameEnv.path        - Base path to asset files
     * @param {number} gameEnv.innerWidth  - Viewport/canvas width in pixels
     * @param {number} gameEnv.innerHeight - Viewport/canvas height in pixels
     */
    constructor(gameEnv) {
        const path = gameEnv.path;

        // Initialise HUD and overlay before any game object is created
        SurvivalManager.init();

        // Start the alien chase AI loop
        AlienChaseAI.start();

        // =====================================================================
        /**
         * @object bgData
         * @type {GameEnvBackground}
         * @description Alien planet landscape backdrop — purely presentational.
         *
         * Purpose: Establishes the sci-fi visual context for the level.
         * No interactive properties; does not participate in the game loop
         * beyond being drawn first (behind all other objects).
         *
         * Key Properties:
         *   - src: alien_planet.jpg — purple/rocky alien terrain atmosphere
         *   - pixels: 1134×772 — native image resolution for correct auto-scaling
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
         * @description User-controlled astronaut — the source of all interactions.
         *
         * Purpose:
         *   The player navigates toward (or away from) the Alien NPC.
         *   The moment their canvas overlaps the NPC hitbox, the collision
         *   interaction chain begins.
         *
         * Key Properties:
         *   - SCALE_FACTOR: 5 — renders at 1/5 of the viewport height
         *   - STEP_FACTOR: 1000 — moderate speed; slow enough to react to danger
         *   - INIT_POSITION: (100, 300) — left-center spawn; NPC is to the right
         *   - hitbox: 0% — collision detection is owned entirely by the NPC side
         *   - keypress: WASD (W=87, A=65, S=83, D=68)
         *
         * Interaction role:
         *   Passive collision participant — the player's movement drives
         *   them into the NPC detection zone, triggering reaction().
         */
        // =====================================================================
        const playerData = {
            id: 'playerData',
            src: path + "/images/gamebuilder/sprites/astro.png",
            SCALE_FACTOR: 5,
            STEP_FACTOR: 700,   // faster player (lower = faster)
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
         * @description Hostile Alien Slime — the active interaction object.
         *
         * Purpose:
         *   Acts as the collision trigger. When the player enters its hitbox,
         *   the engine fires reaction(). Our overridden reaction() calls
         *   SurvivalManager.caught() to freeze the timer and show the CAUGHT overlay.
         *   Pressing E fires interact(), which calls SurvivalManager.reset().
         *
         * Key Properties:
         *   - INIT_POSITION: (500, 300) — center of map, directly in the player's path
         *   - hitbox: width=10%, height=20% — collision margin around the sprite
         *   - dialogues: 3 taunting messages rotated randomly on E-key interact
         *
         * ── INTERACTION POINT ──────────────────────────────────────────────
         * Where in the game loop:
         *   The NPC base class runs a proximity/hitbox check inside update()
         *   every frame. When player–NPC bounding boxes intersect, reaction()
         *   is invoked automatically by the engine.
         *
         * How object properties update during execution:
         *
         *   ON COLLISION (reaction):
         *     reaction() → SurvivalManager.caught()
         *       └─ SurvivalManager.frozen      → true
         *       └─ countdown timer             stopped
         *       └─ CAUGHT overlay              display → 'block'
         *       └─ AlienChaseAI               paused
         *
         *   ON INTERACT (E key):
         *     interact() → SurvivalManager.reset()
         *       └─ SurvivalManager.remaining   reset to 10000ms
         *       └─ SurvivalManager.frozen      → false
         *       └─ CAUGHT/WIN overlays         display → 'none'
         *       └─ AlienChaseAI               resumed to spawn
         * ───────────────────────────────────────────────────────────────────
         */
        // =====================================================================
        const npcData1 = {
            id: 'Alien',
            greeting: "Hah! Got you! You can't advance to the next level. Press E to restart.",
            src: path + "/images/gamebuilder/sprites/slime.png",
            SCALE_FACTOR: 5,
            ANIMATION_RATE: 50,
            INIT_POSITION: { x: 500, y: 300 },
            pixels: { height: 225, width: 225 },
            orientation: { rows: 4, columns: 4 },
            down:      { row: 0,                    start: 0, columns: 3 },
            right:     { row: Math.min(1, 4 - 1),   start: 0, columns: 3 },
            left:      { row: Math.min(2, 4 - 1),   start: 0, columns: 3 },
            up:        { row: Math.min(3, 4 - 1),   start: 0, columns: 3 },
            upRight:   { row: Math.min(3, 4 - 1),   start: 0, columns: 3 },
            downRight: { row: Math.min(1, 4 - 1),   start: 0, columns: 3 },
            upLeft:    { row: Math.min(2, 4 - 1),   start: 0, columns: 3 },
            downLeft:  { row: 0,                    start: 0, columns: 3 },
            hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
            dialogues: [
                "Hah! Got you! You can't advance to the next level. Press E to restart.",
                "Every second you stay near me, you lose more score!",
                "Your energy is draining... can you escape in time?"
            ],

            /**
             * @method reaction
             * @description ── COLLISION INTERACTION HANDLER ──
             *              Called by the engine each frame the player's bounding
             *              box overlaps this NPC's hitbox (collision positive).
             *
             * Game loop position:
             *   NPC.update() → hitbox overlap detected → this.reaction()
             *
             * Object properties updated during execution:
             *   - SurvivalManager.frozen:       set to true
             *   - SurvivalManager.countdownId:  cleared
             *   - CAUGHT overlay display:       → 'block'
             *   - AlienChaseAI:                 paused
             *
             * Observable reaction produced:
             *   Caught overlay appears; timer freezes; alien stops.
             */
            reaction: function () {
                SurvivalManager.caught();
                if (this.dialogueSystem) { this.showReactionDialogue(); }
            },

            /**
             * @method interact
             * @description ── E-KEY INTERACTION HANDLER ──
             *              Called when the player presses E within range of this NPC.
             *
             * Game loop position:
             *   Input handler → keyup E event → NPC.interact() → this method
             *
             * Object properties updated during execution:
             *   - SurvivalManager.remaining:    reset to 10000ms
             *   - SurvivalManager.frozen:       → false
             *   - CAUGHT/WIN overlays:          display → 'none'
             *   - AlienChaseAI:                 resumed to spawn
             *
             * Observable reaction produced:
             *   Timer resets to 10s; overlays hide; alien returns to spawn.
             */
            interact: function () {
                SurvivalManager.reset();
                if (this.dialogueSystem) { this.showRandomDialogue(); }
            }
        };

        // =====================================================================
        /**
         * @object dbarrier_1
         * @type {Barrier}
         * @description Invisible wall — top-left corner boundary restriction.
         *
         * Purpose:
         *   Blocks the player from retreating into the top-left corner,
         *   funneling them toward the Alien NPC and increasing the likelihood
         *   of collision. This amplifies the tension of the interaction.
         *
         * Key Properties:
         *   - position: (0, 1) — flush with the top-left screen edge
         *   - size: 235×134px  — covers the upper-left escape route
         *   - visible: true    — visible in builder; toggled at runtime
         *   - hitbox: 0%       — pixel-exact boundary with no margin
         *   - fromOverlay: true — builder-managed; supports runtime toggling
         *
         * Interaction role:
         *   Passive — restricts escape routes to increase NPC collision pressure.
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
         * @description Ordered list of game objects instantiated for this level.
         *
         * Render + update order per game-loop tick:
         *   1. GameEnvBackground — drawn first (behind everything)
         *   2. Player            — updated each frame; drives the collision source
         *   3. Npc               — updated each frame; fires reaction() on hit
         *   4. Barrier           — boundary only; no visual change at runtime
         */
        this.classes = [
            { class: GameEnvBackground, data: bgData },
            { class: Player,            data: playerData },
            { class: Npc,               data: npcData1 },
            { class: Barrier,           data: dbarrier_1 }
        ];

        
    }
}

export const gameLevelClasses = [GameLevelAlienPlanet];