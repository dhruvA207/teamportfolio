/**
 * @file GameLevel2.js
 * @description Adventure Game — Level 2: "Alien Maze"
 *
 * Barriers are invisible by default. On collision they briefly glow red.
 * Hitting any barrier resets the player to spawn (INIT_POSITION).
 *
 * Usage:
 *   1) Save as assets/js/adventureGame/GameLevel2.js in your repo.
 *   2) Reference in your runner or level selector:
 *        import GameLevel2 from '/assets/js/adventureGame/GameLevel2.js';
 *        export const gameLevelClasses = [GameLevel2];
 *   3) Ensure all image paths resolve via the `path` value provided by gameEnv.
 */

import GameEnvBackground from './essentials/GameEnvBackground.js';
import Player from './essentials/Player.js';
import Npc from './essentials/Npc.js';
import Barrier from './essentials/Barrier.js';

// ─────────────────────────────────────────────
// HELPER — flash a glowing rectangle at the barrier's rendered position.
// Called from onCollide on each barrier (where `this` = barrier instance).
// Injects an absolutely-positioned div that matches the barrier's canvas
// coordinates, then fades it out over ~800ms.
// ─────────────────────────────────────────────
function _glowBarrier(barrierInstance) {
    const glowId = 'barrier-glow-' + barrierInstance.data.id;
    if (document.getElementById(glowId)) return;

    // The engine exposes rendered pixel coords on the instance
    const bx = barrierInstance.x      ?? 0;
    const by = barrierInstance.y      ?? 0;
    const bw = barrierInstance.width  ?? 20;
    const bh = barrierInstance.height ?? 20;

    // Offset by canvas position on the page
    const canvas = document.querySelector('canvas');
    const cr = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };

    const glow = document.createElement('div');
    glow.id = glowId;
    glow.style.cssText = `
        position: fixed;
        left:   ${cr.left + bx}px;
        top:    ${cr.top  + by}px;
        width:  ${bw}px;
        height: ${bh}px;
        border: 3px solid rgba(255, 80, 80, 1);
        background: rgba(255, 60, 60, 0.35);
        box-shadow: 0 0 18px 6px rgba(255, 60, 60, 0.8),
                    0 0 40px 12px rgba(255, 0, 0, 0.45);
        border-radius: 4px;
        pointer-events: none;
        z-index: 9997;
        opacity: 1;
        transition: opacity 0.5s ease;
    `;
    document.body.appendChild(glow);
    // Start fade shortly after appearing
    setTimeout(() => { glow.style.opacity = '0'; }, 300);
    setTimeout(() => { glow.remove(); }, 820);
}

class GameLevel2 {
    constructor(gameEnv) {
        this.gameEnv = gameEnv;
        this.levelTransitionTriggered = false;
        const path   = gameEnv.path;
        const width  = gameEnv.innerWidth;
        const height = gameEnv.innerHeight;

        // ─────────────────────────────────────────────
        // STARTUP POPUP + TIMER
        // ─────────────────────────────────────────────
        GameLevel2._startTime = null;
        this._showStartupPopup();

        // ─────────────────────────────────────────────
        // BACKGROUND
        // ─────────────────────────────────────────────
        const bgData = {
            name: "custom_bg",
            src: path + "/images/gamebuilder/bg/alien_planet.jpg",
            pixels: { height: 772, width: 1134 }
        };

        // ─────────────────────────────────────────────
        // PLAYER — astronaut sprite
        // onBarrierCollision is called by the engine when THIS player
        // overlaps a Barrier. It resets position and shows the red flash.
        // ─────────────────────────────────────────────
        const playerData = {
            id: 'playerData',
            src: path + "/images/gamebuilder/sprites/astro.png",
            SCALE_FACTOR: 7,
            STEP_FACTOR: 1000,
            ANIMATION_RATE: 50,
            INIT_POSITION: { x: 100, y: 300 },
            pixels: { height: 770, width: 513 },
            orientation: { rows: 4, columns: 4 },
            down:      { row: 0, start: 0, columns: 3 },
            downRight: { row: 1, start: 0, columns: 3, rotate:  Math.PI / 16 },
            downLeft:  { row: 0, start: 0, columns: 3, rotate: -Math.PI / 16 },
            left:      { row: 2, start: 0, columns: 3 },
            right:     { row: 1, start: 0, columns: 3 },
            up:        { row: 3, start: 0, columns: 3 },
            upLeft:    { row: 2, start: 0, columns: 3, rotate:  Math.PI / 16 },
            upRight:   { row: 3, start: 0, columns: 3, rotate: -Math.PI / 16 },
            hitbox: { widthPercentage: 0.2, heightPercentage: 0.4 },
            keypress: { up: 87, left: 65, down: 83, right: 68 },
            onBarrierCollision: function () {
                // Reset all common position representations
                this.x = this.data.INIT_POSITION.x;
                this.y = this.data.INIT_POSITION.y;
                if (this.position) {
                    this.position.x = this.data.INIT_POSITION.x;
                    this.position.y = this.data.INIT_POSITION.y;
                }
                if (this.velocity) {
                    this.velocity.x = 0;
                    this.velocity.y = 0;
                }
                GameLevel2._showRestartFlash();
            }
        };

        // ─────────────────────────────────────────────
        // NPC — R2 robot at maze exit
        // ─────────────────────────────────────────────
        const npcData1 = {
            id: 'NPC_r2',
            greeting: 'You made it through the maze! Ready for the next level?',
            src: path + "/images/gamify/r2_idle.png",
            SCALE_FACTOR: 7,
            ANIMATION_RATE: 50,
            INIT_POSITION: { x: 0.7, y: 0.2 },
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
            reaction: function () {
                if (this.dialogueSystem) { this.showReactionDialogue(); }
                else { console.log(this.greeting); }
            },
            interact: function () {
                if (this.dialogueSystem) { this.showRandomDialogue(); }
                setTimeout(() => {
                    const elapsed = GameLevel2._startTime
                        ? Math.floor((Date.now() - GameLevel2._startTime) / 1000)
                        : null;
                    GameLevel2._showVictoryScreen(elapsed);
                    // Trigger level transition after victory screen shows
                    setTimeout(() => {
                        if (this.gameEnv && this.gameEnv.gameControl && 
                            !this.gameEnv.gameLevelTransitionTriggered) {
                            this.gameEnv.gameLevelTransitionTriggered = true;
                            this.gameEnv.gameControl.currentLevel.continue = false;
                        }
                    }, 4000);
                }, 800);
            }
        };

        // ─────────────────────────────────────────────
        // BARRIER FACTORY
        // All barriers are invisible (visible: false).
        // onCollide  → called by the engine on the barrier when any object hits it.
        // onBarrierCollision → called by the engine on the player when it hits any barrier.
        // Both paths are covered so whichever hook the engine uses will work.
        // ─────────────────────────────────────────────
        const makeBarrier = (id, x, y, w, h) => ({
            id,
            x, y,
            width: w,
            height: h,
            visible: false,
            hitbox: { widthPercentage: 0.0, heightPercentage: 0.0 },
            // Engine calls this ON THE BARRIER when a collision is detected
            onCollide: function () {
                _glowBarrier(this);
                // Locate the player and reset it
                const player = GameLevel2._findPlayer(gameEnv);
                if (player) {
                    const init = player.data?.INIT_POSITION ?? { x: 100, y: 300 };
                    player.x = init.x;
                    player.y = init.y;
                    if (player.position) {
                        player.position.x = init.x;
                        player.position.y = init.y;
                    }
                    if (player.velocity) {
                        player.velocity.x = 0;
                        player.velocity.y = 0;
                    }
                }
                GameLevel2._showRestartFlash();
            }
        });

        // ── Outer walls ──────────────────────────────
        const mazeTop         = makeBarrier('maze_top',         0.20, 0.15, 0.60, 0.02);
        const mazeBottom      = makeBarrier('maze_bottom',      0.20, 0.83, 0.60, 0.02);
        // Left wall has an entrance gap between y:0.35 and y:0.55
        const mazeLeftTop     = makeBarrier('maze_left_top',    0.20, 0.15, 0.02, 0.20);
        const mazeLeftBottom  = makeBarrier('maze_left_bottom', 0.20, 0.55, 0.02, 0.30);
        const mazeRight       = makeBarrier('maze_right',       0.78, 0.15, 0.02, 0.70);

        // ── Interior walls ───────────────────────────
        const mazeWall1 = makeBarrier('maze_wall_1', 0.30, 0.25, 0.02, 0.30);
        const mazeWall2 = makeBarrier('maze_wall_2', 0.45, 0.35, 0.25, 0.02);
        const mazeWall3 = makeBarrier('maze_wall_3', 0.45, 0.55, 0.02, 0.20);
        const mazeWall4 = makeBarrier('maze_wall_4', 0.55, 0.45, 0.15, 0.02);
        const mazeWall5 = makeBarrier('maze_wall_5', 0.60, 0.25, 0.02, 0.35);

        // ─────────────────────────────────────────────
        // CLASS REGISTRY
        // ─────────────────────────────────────────────
        this.classes = [
            { class: GameEnvBackground, data: bgData         },
            { class: Player,            data: playerData     },
            { class: Npc,               data: npcData1       },
            { class: Barrier,           data: mazeTop        },
            { class: Barrier,           data: mazeBottom     },
            { class: Barrier,           data: mazeLeftTop    },
            { class: Barrier,           data: mazeLeftBottom },
            { class: Barrier,           data: mazeRight      },
            { class: Barrier,           data: mazeWall1      },
            { class: Barrier,           data: mazeWall2      },
            { class: Barrier,           data: mazeWall3      },
            { class: Barrier,           data: mazeWall4      },
            { class: Barrier,           data: mazeWall5      },
        ];
    }

    // ─────────────────────────────────────────────
    // PLAYER FINDER — searches common engine object stores
    // ─────────────────────────────────────────────
    static _findPlayer(gameEnv) {
        const sources = [
            gameEnv?.gameObjects,
            gameEnv?.objects,
            gameEnv?.gameControl?.gameObjects,
        ].filter(Boolean);

        for (const list of sources) {
            const arr = Array.isArray(list) ? list : Object.values(list);
            const found = arr.find(o =>
                o?.data?.id === 'playerData' || o?.id === 'playerData'
            );
            if (found) return found;
        }
        return null;
    }

    // ─────────────────────────────────────────────
    // DOM HELPERS
    // ─────────────────────────────────────────────

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
                    Touch a hidden wall and it will
                    <strong style="color:#f48fb1;">glow red — then you restart.</strong>
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
            GameLevel2._startTime = Date.now();
        });
    }

    static _showRestartFlash() {
        if (document.getElementById('maze-restart-flash')) return;
        const flash = document.createElement('div');
        flash.id = 'maze-restart-flash';
        flash.style.cssText = `
            position:fixed; inset:0; background:rgba(180,0,0,.50);
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

/** @static {number|null} _startTime - Unix timestamp (ms) when the run timer started. */
GameLevel2._startTime = null;

export default GameLevel2;