/**
 * @file GameLevel2.js
 * @description Adventure Game — Level 2: "Alien Maze"
 *
 * The player spawns on an alien planet and must navigate a maze of invisible
 * barriers to reach R2, a robot NPC waiting at the end. Touching any barrier
 * resets the player to the starting position. An instructional popup is shown
 * on load to explain the objective and controls.
 *
 * Exported from GameBuilder on 2026-03-05T17:10:57.847Z (then hand-edited).
 *
 * Usage:
 *   1) Save as assets/js/adventureGame/GameLevel2.js in your repo.
 *   2) Reference in your runner or level selector:
 *        import GameLevel2 from '/assets/js/adventureGame/GameLevel2.js';
 *        export const gameLevelClasses = [GameLevel2];
 *   3) Ensure all image paths resolve via the `path` value provided by gameEnv.
 *   4) Additional objects can be appended to this.classes inside the constructor.
 */

import GameEnvBackground from './essentials/GameEnvBackground.js';
import Player from './essentials/Player.js';
import Npc from './essentials/Npc.js';
import Barrier from './essentials/Barrier.js';

/**
 * @class GameLevel2
 * @description Defines all game objects, maze barrier layout, interaction callbacks,
 * and observable reactions for Level 2. The constructor populates `this.classes`
 * with object descriptors the GameEngine uses to instantiate and render each element.
 */
class GameLevel2 {
    /**
     * @constructor
     * @param {Object} gameEnv - Shared game environment provided by GameControl.
     * @param {string} gameEnv.path        - Base asset path for images/sprites.
     * @param {number} gameEnv.innerWidth  - Current canvas width in pixels.
     * @param {number} gameEnv.innerHeight - Current canvas height in pixels.
     */
    constructor(gameEnv) {
        const path   = gameEnv.path;
        const width  = gameEnv.innerWidth;
        const height = gameEnv.innerHeight;

        // ─────────────────────────────────────────────
        // STARTUP POPUP + TIMER
        // Shows the mission briefing. The elapsed-time clock starts the moment
        // the player clicks "Start Mission" so only active play time is tracked.
        // ─────────────────────────────────────────────
        GameLevel2._startTime = null;
        this._showStartupPopup();

        // ─────────────────────────────────────────────
        // BACKGROUND
        // ─────────────────────────────────────────────

        /**
         * @type {Object} bgData
         * @description Full-screen alien planet background.
         * alien_planet.jpg (1134×772) is larger than 720p so it covers the canvas
         * edge-to-edge on common screen sizes without visible gaps or seams.
         */
        const bgData = {
            name: "custom_bg",
            src: path + "/images/gamebuilder/bg/alien_planet.jpg",
            /** @property {Object} pixels - Native image dimensions used for scaling. */
            pixels: { height: 772, width: 1134 }
        };

        // ─────────────────────────────────────────────
        // PLAYER
        // ─────────────────────────────────────────────

        /**
         * @type {Object} playerData
         * @description The user-controlled astronaut character.
         *
         * Key decisions:
         * - SCALE_FACTOR 7   → slightly smaller than default so the player fits
         *                       comfortably through maze corridors.
         * - STEP_FACTOR 1000 → brisk movement that keeps navigation snappy.
         * - ANIMATION_RATE 50ms → ~20 fps sprite cycling for a smooth walk cycle.
         * - INIT_POSITION x:100, y:300 → left-side spawn, mid-height, clear of all walls.
         * - hitbox 0%/0%   → collision with barriers uses the engine's positional
         *                     overlap check rather than a shrunk hitbox rectangle.
         * - keypress WASD  → standard scheme (W=87, A=65, S=83, D=68).
         * - Diagonal rotation ±Math.PI/16 (~11°) → subtle tilt on diagonals.
         *
         * Interaction / Reaction:
         * - onBarrierCollision() [INTERACTION 1] resets position to INIT_POSITION
         *   and fires the red restart flash overlay (900ms auto-dismiss).
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
            /** @property down - Idle/facing-down animation (row 0, 3 frames). */
            down:      { row: 0, start: 0, columns: 3 },
            /** @property downRight - Moving down-right with a slight clockwise tilt. */
            downRight: { row: 1, start: 0, columns: 3, rotate:  Math.PI / 16 },
            /** @property downLeft  - Moving down-left with a counter-clockwise tilt. */
            downLeft:  { row: 0, start: 0, columns: 3, rotate: -Math.PI / 16 },
            left:      { row: 2, start: 0, columns: 3 },
            right:     { row: 1, start: 0, columns: 3 },
            up:        { row: 3, start: 0, columns: 3 },
            upLeft:    { row: 2, start: 0, columns: 3, rotate:  Math.PI / 16 },
            upRight:   { row: 3, start: 0, columns: 3, rotate: -Math.PI / 16 },
            hitbox: { widthPercentage: 0, heightPercentage: 0 },
            keypress: { up: 87, left: 65, down: 83, right: 68 },
            /**
             * @method onBarrierCollision
             * @description INTERACTION 1 — Maze barrier collision.
             * Called by the engine whenever the player overlaps a Barrier object.
             * REACTION: Teleports the player back to INIT_POSITION (restart) and
             * shows a brief red "⚠️ You hit a wall!" overlay for 900ms.
             */
            onBarrierCollision: function () {
                this.x = this.data.INIT_POSITION.x;
                this.y = this.data.INIT_POSITION.y;
                GameLevel2._showRestartFlash();
            }
        };

        // ─────────────────────────────────────────────
        // NPC — R2 ROBOT (maze goal)
        // ─────────────────────────────────────────────

        /**
         * @type {Object} npcData1
         * @description R2, the robot NPC at the far-right exit of the maze.
         * Acts as the level's win condition — reaching and interacting with R2
         * triggers the victory overlay with elapsed time.
         *
         * Key decisions:
         * - SCALE_FACTOR 7  → matches player scale for visual consistency.
         * - INIT_POSITION x:820, y:242 → placed at the maze exit; requires
         *                                navigating all corridors to reach it.
         * - Single-row sprite (rows:1) → r2_idle.png has only one animation row;
         *   all directional row indices are clamped to 0 with Math.min to prevent
         *   out-of-bounds sprite-sheet reads.
         * - hitbox 10%/20% → reliable zone; player must genuinely arrive at R2's
         *   position before dialogue and victory fire.
         *
         * Interaction / Reaction:
         * - reaction()  [INTERACTION 2] → passive proximity: dialogue bubble appears.
         * - interact()  [INTERACTION 3] → active key press: shows dialogue THEN fires
         *   the green victory overlay with elapsed run time. This is the primary
         *   observable completion reaction for the maze mini-game.
         */
        const npcData1 = {
            id: 'NPC_r2',
            greeting: 'You made it through the maze! Ready for the next level?',
            src: path + "/images/gamify/r2_idle.png",
            SCALE_FACTOR: 7,
            ANIMATION_RATE: 50,
            INIT_POSITION: { x: 820, y: 242 },
            pixels: { height: 223, width: 505 },
            orientation: { rows: 1, columns: 3 },
            down:      { row: 0,              start: 0, columns: 3 },
            right:     { row: Math.min(1, 0), start: 0, columns: 3 },
            left:      { row: Math.min(2, 0), start: 0, columns: 3 },
            up:        { row: Math.min(3, 0), start: 0, columns: 3 },
            upRight:   { row: Math.min(3, 0), start: 0, columns: 3 },
            downRight: { row: Math.min(1, 0), start: 0, columns: 3 },
            upLeft:    { row: Math.min(2, 0), start: 0, columns: 3 },
            downLeft:  { row: 0,              start: 0, columns: 3 },
            hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
            dialogues: ['You made it through the maze! Ready for the next level?'],
            /**
             * @method reaction
             * @description INTERACTION 2 — Passive NPC proximity trigger.
             * REACTION: Dialogue bubble appears above R2 when player enters radius.
             */
            reaction: function () {
                if (this.dialogueSystem) { this.showReactionDialogue(); }
                else { console.log(this.greeting); }
            },
            /**
             * @method interact
             * @description INTERACTION 3 — Active NPC interact key press.
             * REACTION: Shows the R2 completion dialogue, then after 800ms fires
             * the green victory overlay displaying elapsed time since run started.
             * This is the primary observable reaction confirming maze completion.
             */
            interact: function () {
                if (this.dialogueSystem) { this.showRandomDialogue(); }
                setTimeout(() => {
                    const elapsed = GameLevel2._startTime
                        ? Math.floor((Date.now() - GameLevel2._startTime) / 1000)
                        : null;
                    GameLevel2._showVictoryScreen(elapsed);
                }, 800);
            }
        };

        // ─────────────────────────────────────────────
        // MOON BARRIER — informational
        // ─────────────────────────────────────────────

        /**
         * @type {Object} dbarrier_moon
         * @description Invisible barrier over the moon graphic in the top-left
         * corner of the background. Blocks entry to that decorative region and
         * shows an informational "can't go there" message on collision.
         *
         * Key decisions:
         * - x:10, y:10, 120×120 → snugly covers the moon without spilling into
         *   the playable corridor area.
         * - visible: false → purely a collision object; no sprite rendered.
         * - hitbox 0%/0%   → collision box equals the full declared width/height.
         * - fromOverlay: true → coordinates originate from the overlay/map editor.
         *
         * Interaction / Reaction:
         * - onCollide() [INTERACTION 4] shows "⛔ You can't go there!" for 2 s.
         *   _msgShowing debounce prevents stacking on held key presses.
         */
        const dbarrier_moon = {
            id: 'dbarrier_moon', x: 10, y: 10, width: 120, height: 120,
            visible: false,
            hitbox: { widthPercentage: 0.0, heightPercentage: 0.0 },
            fromOverlay: true,
            /**
             * @method onCollide
             * @description INTERACTION 4 — Moon barrier collision.
             * REACTION: Injects a styled "⛔ You can't go there!" message div into
             * the DOM and removes it after 2 seconds. _msgShowing debounce prevents
             * stacking on held key presses.
             */
            onCollide: function () {
                if (this._msgShowing) return;
                this._msgShowing = true;
                const msg = document.createElement('div');
                msg.textContent = "⛔ You can't go there!";
                msg.style.cssText = `
                    position:fixed; top:20%; left:50%; transform:translateX(-50%);
                    background:rgba(0,0,0,.75); color:#ff4444;
                    font-size:1.5rem; font-weight:bold; font-family:Arial,sans-serif;
                    padding:12px 28px; border-radius:10px; border:2px solid #ff4444;
                    z-index:9999; pointer-events:none;
                    text-shadow:0 0 8px #ff0000; box-shadow:0 0 16px rgba(255,68,68,.5);
                `;
                document.body.appendChild(msg);
                setTimeout(() => { msg.remove(); this._msgShowing = false; }, 2000);
            }
        };

        // ─────────────────────────────────────────────
        // MAZE BARRIERS
        // All invisible (visible: false). Touching any triggers onBarrierCollision
        // on the player → reset to spawn + red flash.
        //
        // Route: right → up → right → down → right → up → right → [R2 at x:820]
        // Canvas ~1134×772, player spawns at x:100 y:300.
        // ─────────────────────────────────────────────

        /** @description Outer top wall — prevents escaping upward. */
        const wall_top    = { id: 'wall_top',    x: 80,  y: 120, width: 900, height: 18,  visible: false, hitbox: { widthPercentage: 0, heightPercentage: 0 }, fromOverlay: true };
        /** @description Outer bottom wall — prevents escaping downward. */
        const wall_bottom = { id: 'wall_bottom', x: 80,  y: 560, width: 900, height: 18,  visible: false, hitbox: { widthPercentage: 0, heightPercentage: 0 }, fromOverlay: true };
        /** @description Outer left wall — closes the left edge behind spawn. */
        const wall_left   = { id: 'wall_left',   x: 80,  y: 120, width: 18,  height: 440, visible: false, hitbox: { widthPercentage: 0, heightPercentage: 0 }, fromOverlay: true };
        /** @description Outer right wall — caps everything past R2. */
        const wall_right  = { id: 'wall_right',  x: 962, y: 120, width: 18,  height: 440, visible: false, hitbox: { widthPercentage: 0, heightPercentage: 0 }, fromOverlay: true };

        /**
         * @description First vertical divider.
         * Gap at y:300–380 — player passes through at mid-height going right.
         */
        const div1_top    = { id: 'div1_top',    x: 260, y: 138, width: 20, height: 162, visible: false, hitbox: { widthPercentage: 0, heightPercentage: 0 }, fromOverlay: true };
        const div1_bottom = { id: 'div1_bottom', x: 260, y: 380, width: 20, height: 198, visible: false, hitbox: { widthPercentage: 0, heightPercentage: 0 }, fromOverlay: true };

        /**
         * @description Horizontal shelf after div1 — forces player UP before
         * they can pass through the second divider.
         */
        const shelf1 = { id: 'shelf1', x: 280, y: 300, width: 160, height: 20, visible: false, hitbox: { widthPercentage: 0, heightPercentage: 0 }, fromOverlay: true };

        /**
         * @description Second vertical divider.
         * Gap at y:138–220 — player must hug the top wall to pass through.
         */
        const div2_top = { id: 'div2_top', x: 440, y: 220, width: 20, height: 358, visible: false, hitbox: { widthPercentage: 0, heightPercentage: 0 }, fromOverlay: true };

        /**
         * @description Horizontal shelf after div2 — forces player DOWN from
         * the top passage into the lower section of the next corridor.
         */
        const shelf2 = { id: 'shelf2', x: 460, y: 220, width: 160, height: 20, visible: false, hitbox: { widthPercentage: 0, heightPercentage: 0 }, fromOverlay: true };

        /**
         * @description Third vertical divider.
         * Gap at y:400–500 — player must drop toward the bottom to squeeze through.
         */
        const div3_top    = { id: 'div3_top',    x: 620, y: 138, width: 20, height: 262, visible: false, hitbox: { widthPercentage: 0, heightPercentage: 0 }, fromOverlay: true };
        const div3_bottom = { id: 'div3_bottom', x: 620, y: 500, width: 20, height:  78, visible: false, hitbox: { widthPercentage: 0, heightPercentage: 0 }, fromOverlay: true };

        /**
         * @description Horizontal shelf after div3 — forces player back UP
         * toward the top passage of the final corridor.
         */
        const shelf3 = { id: 'shelf3', x: 640, y: 400, width: 180, height: 20, visible: false, hitbox: { widthPercentage: 0, heightPercentage: 0 }, fromOverlay: true };

        /**
         * @description Fourth (final) vertical divider.
         * Gap at y:138–260 — last hurdle before the player reaches R2.
         */
        const div4_top = { id: 'div4_top', x: 820, y: 260, width: 20, height: 318, visible: false, hitbox: { widthPercentage: 0, heightPercentage: 0 }, fromOverlay: true };

        // ─────────────────────────────────────────────
        // CLASS REGISTRY
        // ─────────────────────────────────────────────

        /**
         * @property {Array<{class: Function, data: Object}>} this.classes
         * @description Ordered list of game object descriptors passed to the engine.
         * Render order: background first, then interactive objects, barriers last.
         */
        this.classes = [
            { class: GameEnvBackground, data: bgData        },
            { class: Player,            data: playerData    },
            { class: Npc,               data: npcData1      },
            // Informational barrier (moon, top-left)
            { class: Barrier,           data: dbarrier_moon },
            // Outer boundary walls
            { class: Barrier,           data: wall_top      },
            { class: Barrier,           data: wall_bottom   },
            { class: Barrier,           data: wall_left     },
            { class: Barrier,           data: wall_right    },
            // Interior maze dividers
            { class: Barrier,           data: div1_top      },
            { class: Barrier,           data: div1_bottom   },
            { class: Barrier,           data: shelf1        },
            { class: Barrier,           data: div2_top      },
            { class: Barrier,           data: shelf2        },
            { class: Barrier,           data: div3_top      },
            { class: Barrier,           data: div3_bottom   },
            { class: Barrier,           data: shelf3        },
            { class: Barrier,           data: div4_top      },
        ];
    }

    // ─────────────────────────────────────────────
    // DOM HELPERS — self-contained popup/overlay utilities.
    // ─────────────────────────────────────────────

    /**
     * @method _showStartupPopup
     * @description Injects the mission-briefing overlay into the DOM on level load.
     * Explains objective, invisible-wall rules, timer, and WASD controls.
     * The elapsed-time clock (GameLevel2._startTime) starts when the player
     * clicks "Start Mission" so only active play time is counted.
     */
    _showStartupPopup() {
        const existing = document.getElementById('maze-startup-popup');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'maze-startup-popup';
        overlay.style.cssText = `
            position:fixed; inset:0; background:rgba(0,0,0,.78);
            display:flex; align-items:center; justify-content:center;
            z-index:9999; font-family:'Segoe UI',Arial,sans-serif;
        `;
        overlay.innerHTML = `
            <div style="
                background:linear-gradient(145deg,#0d1b2a,#1b2d45);
                border:2px solid #4fc3f7; border-radius:16px;
                padding:40px 48px; max-width:480px; width:90%;
                text-align:center; box-shadow:0 0 40px rgba(79,195,247,.35); color:#e0f0ff;
            ">
                <div style="font-size:48px;margin-bottom:12px;">🤖</div>
                <h2 style="font-size:1.6rem;color:#4fc3f7;margin:0 0 8px;letter-spacing:1px;">ALIEN MAZE</h2>
                <p style="font-size:.85rem;color:#90caf9;margin:0 0 24px;letter-spacing:2px;text-transform:uppercase;">
                    Level 2 Briefing
                </p>
                <p style="font-size:1rem;line-height:1.65;margin:0 0 16px;">
                    R2 is waiting somewhere in this alien maze —
                    but the walls are <strong style="color:#f48fb1;">invisible</strong>.
                </p>
                <p style="font-size:1rem;line-height:1.65;margin:0 0 16px;">
                    Navigate by feel. Touch a hidden wall and
                    <strong style="color:#f48fb1;">you restart from the beginning.</strong>
                </p>
                <p style="font-size:1rem;line-height:1.65;margin:0 0 24px;">
                    Reach R2 and press <strong style="color:#4fc3f7;">interact</strong>
                    to finish. Your time is being tracked! ⏱️
                </p>
                <div style="
                    background:rgba(79,195,247,.08); border:1px solid rgba(79,195,247,.3);
                    border-radius:8px; padding:14px 20px; margin-bottom:28px;
                    font-size:.92rem; line-height:1.8; text-align:left;
                ">
                    <strong style="color:#4fc3f7;">Controls</strong><br>
                    <span style="color:#b3e5fc;">W</span> — Up &nbsp;|&nbsp;
                    <span style="color:#b3e5fc;">S</span> — Down<br>
                    <span style="color:#b3e5fc;">A</span> — Left &nbsp;|&nbsp;
                    <span style="color:#b3e5fc;">D</span> — Right
                </div>
                <button id="maze-start-btn" style="
                    background:#4fc3f7; color:#0d1b2a; border:none; border-radius:8px;
                    padding:12px 40px; font-size:1rem; font-weight:700; cursor:pointer; letter-spacing:1px;
                ">START MISSION</button>
            </div>
        `;
        document.body.appendChild(overlay);

        const btn = document.getElementById('maze-start-btn');
        btn.addEventListener('mouseenter', () => { btn.style.background = '#81d4fa'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = '#4fc3f7'; });
        btn.addEventListener('click', () => {
            overlay.remove();
            GameLevel2._startTime = Date.now(); // timer starts here
        });
    }

    /**
     * @static
     * @method _showRestartFlash
     * @description REACTION for INTERACTION 1 (barrier collision).
     * Displays a red full-screen "⚠️ You hit a wall! Restarting…" flash for 900ms,
     * then auto-removes. Guards against stacking with an element id check.
     */
    static _showRestartFlash() {
        if (document.getElementById('maze-restart-flash')) return;
        const flash = document.createElement('div');
        flash.id = 'maze-restart-flash';
        flash.style.cssText = `
            position:fixed; inset:0; background:rgba(180,0,0,.55);
            display:flex; align-items:center; justify-content:center;
            z-index:9998; pointer-events:none; font-family:'Segoe UI',Arial,sans-serif;
        `;
        flash.innerHTML = `<div style="
            color:#fff; font-size:2rem; font-weight:800; letter-spacing:3px;
            text-shadow:0 0 20px rgba(255,80,80,.9); text-transform:uppercase;
        ">⚠️ You hit a wall! Restarting…</div>`;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 900);
    }

    /**
     * @static
     * @method _showVictoryScreen
     * @description REACTION for INTERACTION 3 (NPC interact — maze completion).
     * Injects a full-screen green victory overlay showing a congratulations message
     * and the player's elapsed run time. A "Continue" button dismisses the overlay.
     *
     * @param {number|null} elapsedSeconds - Seconds since the timer started,
     *                                       or null if the timer was never set.
     */
    static _showVictoryScreen(elapsedSeconds) {
        if (document.getElementById('maze-victory-screen')) return;

        const timeStr = elapsedSeconds !== null
            ? `${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, '0')}`
            : '—';

        const overlay = document.createElement('div');
        overlay.id = 'maze-victory-screen';
        overlay.style.cssText = `
            position:fixed; inset:0; background:rgba(0,0,0,.85);
            display:flex; align-items:center; justify-content:center;
            z-index:10000; font-family:'Segoe UI',Arial,sans-serif;
        `;
        overlay.innerHTML = `
            <div style="
                background:linear-gradient(145deg,#0a2a1a,#0d3b26);
                border:2px solid #69f0ae; border-radius:16px;
                padding:48px 56px; max-width:460px; width:90%;
                text-align:center; box-shadow:0 0 50px rgba(105,240,174,.4); color:#e0fff0;
            ">
                <div style="font-size:56px;margin-bottom:16px;">🎉</div>
                <h2 style="font-size:2rem;color:#69f0ae;margin:0 0 8px;letter-spacing:2px;">YOU MADE IT!</h2>
                <p style="font-size:.85rem;color:#a5d6a7;margin:0 0 28px;letter-spacing:3px;text-transform:uppercase;">
                    Maze Complete
                </p>
                <p style="font-size:1.05rem;line-height:1.7;margin:0 0 24px;">
                    You navigated the alien maze and found R2.<br>
                    Well done, astronaut! 🚀
                </p>
                <div style="
                    background:rgba(105,240,174,.08); border:1px solid rgba(105,240,174,.3);
                    border-radius:10px; padding:16px 24px; margin-bottom:32px;
                ">
                    <div style="font-size:.85rem;color:#a5d6a7;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">
                        Your Time
                    </div>
                    <div style="font-size:2.4rem;font-weight:800;color:#69f0ae;letter-spacing:4px;">
                        ${timeStr}
                    </div>
                </div>
                <button id="maze-continue-btn" style="
                    background:#69f0ae; color:#0a2a1a; border:none; border-radius:8px;
                    padding:12px 40px; font-size:1rem; font-weight:700; cursor:pointer; letter-spacing:1px;
                ">CONTINUE →</button>
            </div>
        `;
        document.body.appendChild(overlay);

        const btn = document.getElementById('maze-continue-btn');
        btn.addEventListener('mouseenter', () => { btn.style.background = '#b9f6ca'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = '#69f0ae'; });
        btn.addEventListener('click', () => overlay.remove());
    }
}

/** @static {number|null} _startTime - Unix timestamp (ms) when the run timer started. */
GameLevel2._startTime = null;

export default GameLevel2;