/**
 * @file GameLevel2.js
 * @description Adventure Game — Level 2: "Alien Maze"
 *
 * Barriers are invisible by default. They glow at regular intervals
 * (matching the popup's hint that the walls pulse). Hitting any barrier
 * resets the player to spawn (INIT_POSITION).
 */

import GameEnvBackground from '../GameEnginev1.1/essentials/GameEnvBackground.js';
import Player from '../GameEnginev1.1/essentials/Player.js';
import Npc from '../GameEnginev1.1/essentials/Npc.js';
import Barrier from '../GameEnginev1.1/essentials/Barrier.js';

// ─── Passive barrier glow ────────────────────────────────────────────────────
// Called on an interval; briefly illuminates every registered barrier.
function _pulseAllBarriers(barrierDataList, canvas) {
    const cr = canvas
        ? canvas.getBoundingClientRect()
        : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };

    barrierDataList.forEach(data => {
        const glowId = 'barrier-glow-' + (data.id || 'unknown');
        const old = document.getElementById(glowId);
        if (old) old.remove();

        const bx = (data.x ?? 0) * cr.width;
        const by = (data.y ?? 0) * cr.height;
        const bw = (data.width  ?? 0) * cr.width;
        const bh = (data.height ?? 0) * cr.height;

        const glow = document.createElement('div');
        glow.id = glowId;
        glow.style.cssText = `
            position: fixed;
            left: ${cr.left + bx}px;
            top:  ${cr.top  + by}px;
            width:  ${bw}px;
            height: ${bh}px;
            border: 2px solid rgba(0, 180, 255, 0.75);
            background: rgba(0, 140, 255, 0.12);
            box-shadow: 0 0 14px 4px rgba(0, 180, 255, 0.55),
                        0 0 32px 8px rgba(0, 100, 255, 0.25);
            border-radius: 4px;
            pointer-events: none;
            z-index: 999998;
            opacity: 1;
            transition: opacity 0.8s ease;
        `;
        document.body.appendChild(glow);

        // Fade out after 600 ms, remove after 1.5 s
        setTimeout(() => { glow.style.opacity = '0'; }, 600);
        setTimeout(() => { glow.remove(); }, 1500);
    });
}

class GameLevel2 {
    constructor(gameEnv) {
        this.gameEnv = gameEnv;
        this.levelTransitionTriggered = false;
        this._glowInterval = null;

        const path   = gameEnv.path;
        const width  = gameEnv.innerWidth;
        const height = gameEnv.innerHeight;

        GameLevel2._startTime = null;
        this._showStartupPopup();

        const bgData = {
            name: "custom_bg",
            src: path + "/images/gamebuilder/bg/alien_planet.jpg",
            pixels: { height: 772, width: 1134 }
        };

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

        const npcData1 = {
            id: 'NPC_r2',
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
            // No dialogues — victory screen replaces the prompt
            interact: function () {
                GameLevel2._showVictoryScreen(gameEnv);
            }
        };

        const makeBarrier = (id, x, y, w, h) => ({
            id,
            x, y,
            width: w,
            height: h,
            visible: false,
            onCollide: function () {
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

        const mazeTop         = makeBarrier('maze_top',         0.20, 0.15, 0.60, 0.02);
        const mazeBottom      = makeBarrier('maze_bottom',      0.20, 0.83, 0.60, 0.02);
        const mazeLeftTop     = makeBarrier('maze_left_top',    0.20, 0.15, 0.02, 0.20);
        const mazeLeftBottom  = makeBarrier('maze_left_bottom', 0.20, 0.55, 0.02, 0.30);
        const mazeRight       = makeBarrier('maze_right',       0.78, 0.15, 0.02, 0.70);
        const mazeWall1 = makeBarrier('maze_wall_1', 0.30, 0.25, 0.02, 0.30);
        const mazeWall2 = makeBarrier('maze_wall_2', 0.45, 0.35, 0.25, 0.02);
        const mazeWall3 = makeBarrier('maze_wall_3', 0.45, 0.55, 0.02, 0.20);
        const mazeWall4 = makeBarrier('maze_wall_4', 0.55, 0.45, 0.15, 0.02);
        const mazeWall5 = makeBarrier('maze_wall_5', 0.60, 0.25, 0.02, 0.35);

        this._barrierDataList = [
            mazeTop, mazeBottom, mazeLeftTop, mazeLeftBottom, mazeRight,
            mazeWall1, mazeWall2, mazeWall3, mazeWall4, mazeWall5,
        ];

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

    // =========================================================================
    // VICTORY SCREEN
    // =========================================================================
    static _showVictoryScreen(gameEnv) {
        if (document.getElementById('level2-victory-overlay')) return;

        if (!document.getElementById('level2-victory-styles')) {
            const style = document.createElement('style');
            style.id = 'level2-victory-styles';
            style.textContent = `
                @keyframes l2-win-fadein {
                    from { opacity: 0; transform: scale(0.96); }
                    to   { opacity: 1; transform: scale(1); }
                }
                @keyframes l2-win-pulse {
                    0%, 100% { box-shadow: 0 0 24px rgba(0,120,255,0.4), inset 0 0 24px rgba(0,60,180,0.08); }
                    50%      { box-shadow: 0 0 52px rgba(0,160,255,0.7), inset 0 0 40px rgba(0,80,220,0.15); }
                }
                @keyframes l2-win-beep {
                    0%, 100% { transform: translateY(0px) rotate(-2deg); }
                    50%      { transform: translateY(-6px) rotate(2deg); }
                }
            `;
            document.head.appendChild(style);
        }

        const overlay = document.createElement('div');
        overlay.id = 'level2-victory-overlay';
        Object.assign(overlay.style, {
            position:   'fixed',
            inset:      '0',
            background: 'rgba(0, 0, 0, 0.88)',
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex:     '10000',
            fontFamily: "'Courier New', Courier, monospace",
        });

        overlay.innerHTML = `
            <div style="
                background: linear-gradient(160deg, #00020f 0%, #000c26 60%, #000518 100%);
                border: 1px solid #0050cc;
                border-radius: 4px;
                padding: 52px 56px 44px;
                max-width: 520px;
                width: 92%;
                color: #a8d4ff;
                text-align: center;
                animation: l2-win-fadein 0.5s ease forwards, l2-win-pulse 3s ease-in-out infinite;
                position: relative;
                overflow: hidden;
            ">
                <div style="position:absolute;top:10px;left:10px;width:18px;height:18px;border-top:2px solid #0080ff;border-left:2px solid #0080ff;"></div>
                <div style="position:absolute;top:10px;right:10px;width:18px;height:18px;border-top:2px solid #0080ff;border-right:2px solid #0080ff;"></div>
                <div style="position:absolute;bottom:10px;left:10px;width:18px;height:18px;border-bottom:2px solid #0080ff;border-left:2px solid #0080ff;"></div>
                <div style="position:absolute;bottom:10px;right:10px;width:18px;height:18px;border-bottom:2px solid #0080ff;border-right:2px solid #0080ff;"></div>

                <div style="
                    font-size: 64px;
                    animation: l2-win-beep 1.6s ease-in-out infinite;
                    margin-bottom: 8px;
                    line-height: 1;
                ">🤖</div>

                <div style="
                    font-size: 11px; letter-spacing: 6px; color: #0070dd;
                    text-transform: uppercase; margin-bottom: 10px;
                ">◈ SECTOR TWO — CLEARED ◈</div>

                <h1 style="
                    font-size: 2rem; color: #1a90ff; margin: 0 0 6px;
                    letter-spacing: 3px; text-transform: uppercase;
                    text-shadow: 0 0 28px rgba(0,140,255,0.65);
                ">MAZE COMPLETE!</h1>

                <p style="
                    font-size: 0.95rem; line-height: 1.8;
                    color: #89bcee; margin: 18px 0 10px;
                ">
                    <strong style="color:#4db8ff;">R2-D2</strong> beeps excitedly:<br>
                    <em style="color:#a8d4ff;">"bwEEP bwoop — ✔ Navigator confirmed.<br>
                    Sector Three is locked and loaded. Move out!"</em>
                </p>

                <p style="font-size: 0.85rem; color: #004499; letter-spacing: 2px; margin: 0 0 32px; text-transform: uppercase;">
                    Advancing to Level 3…
                </p>
            </div>
        `;

        document.body.appendChild(overlay);

        // Stop barrier glow since we're leaving
        // (instance not reachable here, but the interval clears on destroy())

        setTimeout(() => {
            if (gameEnv && gameEnv.gameControl && !gameEnv.gameLevelTransitionTriggered) {
                gameEnv.gameLevelTransitionTriggered = true;
                if (gameEnv.gameControl.currentLevel) {
                    gameEnv.gameControl.currentLevel.continue = false;
                }
            }
        }, 3200);

        setTimeout(() => {
            overlay.style.transition = 'opacity 0.5s ease';
            overlay.style.opacity = '0';
        }, 2800);
    }

    // =========================================================================
    // PASSIVE BARRIER GLOW — pulses every 4 seconds
    // =========================================================================
    _startBarrierGlow() {
        if (this._glowInterval) return;

        const pulse = () => {
            const canvas = document.querySelector('canvas');
            _pulseAllBarriers(this._barrierDataList, canvas);
        };

        pulse();
        this._glowInterval = setInterval(pulse, 4000);
    }

    _stopBarrierGlow() {
        if (this._glowInterval) {
            clearInterval(this._glowInterval);
            this._glowInterval = null;
        }
        this._barrierDataList?.forEach(data => {
            document.getElementById('barrier-glow-' + (data.id || 'unknown'))?.remove();
        });
    }

    // =========================================================================
    // STARTUP POPUP
    // =========================================================================
    _showStartupPopup() {
        const renderPopup = () => {
            const existing = document.getElementById('level2-startup-popup');
            if (existing) existing.remove();

            if (!document.body) return;

            const overlay = document.createElement('div');
            overlay.id = 'level2-startup-popup';
            overlay.style.cssText = `
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.92);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                font-family: 'Courier New', Courier, monospace;
                animation: l2-fadein 0.6s ease forwards;
            `;

            if (!document.getElementById('level2-popup-styles')) {
                const style = document.createElement('style');
                style.id = 'level2-popup-styles';
                style.textContent = `
                    @keyframes l2-fadein {
                        from { opacity: 0; }
                        to   { opacity: 1; }
                    }
                    @keyframes l2-scanline {
                        0%   { transform: translateY(-100%); }
                        100% { transform: translateY(100vh); }
                    }
                    @keyframes l2-pulse-border {
                        0%, 100% { box-shadow: 0 0 24px rgba(0,120,255,0.4), inset 0 0 24px rgba(0,60,180,0.08); }
                        50%      { box-shadow: 0 0 48px rgba(0,160,255,0.7), inset 0 0 40px rgba(0,80,220,0.15); }
                    }
                    @keyframes l2-glyph-flicker {
                        0%, 95%, 100% { opacity: 1; }
                        96%           { opacity: 0.2; }
                        98%           { opacity: 0.8; }
                    }
                    #level2-start-btn:hover {
                        background: linear-gradient(135deg, #0050cc, #0090ff) !important;
                        box-shadow: 0 0 32px rgba(0,160,255,0.8) !important;
                        letter-spacing: 4px !important;
                    }
                `;
                document.head.appendChild(style);
            }

            overlay.innerHTML = `
                <div style="
                    position: absolute; inset: 0; overflow: hidden;
                    pointer-events: none; z-index: 0;
                ">
                    <div style="
                        position: absolute; left: 0; right: 0; height: 3px;
                        background: linear-gradient(to bottom, transparent, rgba(0,140,255,0.18), transparent);
                        animation: l2-scanline 4s linear infinite;
                    "></div>
                </div>

                <div style="
                    position: relative; z-index: 1;
                    background: linear-gradient(160deg, #00020f 0%, #000c26 60%, #000518 100%);
                    border: 1px solid #0050cc;
                    border-radius: 4px;
                    padding: 48px 52px 40px;
                    max-width: 540px;
                    width: 92%;
                    color: #a8d4ff;
                    animation: l2-pulse-border 3s ease-in-out infinite;
                    overflow: hidden;
                ">
                    <div style="position:absolute;top:10px;left:10px;width:18px;height:18px;border-top:2px solid #0080ff;border-left:2px solid #0080ff;"></div>
                    <div style="position:absolute;top:10px;right:10px;width:18px;height:18px;border-top:2px solid #0080ff;border-right:2px solid #0080ff;"></div>
                    <div style="position:absolute;bottom:10px;left:10px;width:18px;height:18px;border-bottom:2px solid #0080ff;border-left:2px solid #0080ff;"></div>
                    <div style="position:absolute;bottom:10px;right:10px;width:18px;height:18px;border-bottom:2px solid #0080ff;border-right:2px solid #0080ff;"></div>

                    <div style="
                        text-align: center;
                        font-size: 11px;
                        letter-spacing: 6px;
                        color: #0070dd;
                        text-transform: uppercase;
                        margin-bottom: 10px;
                        animation: l2-glyph-flicker 5s infinite;
                    ">◈ SECTOR TWO ◈</div>

                    <h1 style="
                        text-align: center;
                        font-size: 1.9rem;
                        color: #1a90ff;
                        margin: 0 0 4px;
                        letter-spacing: 3px;
                        text-transform: uppercase;
                        text-shadow: 0 0 24px rgba(0,140,255,0.6);
                    ">ALIEN MAZE</h1>

                    <div style="
                        text-align: center;
                        font-size: 10px;
                        color: #004499;
                        letter-spacing: 5px;
                        margin-bottom: 28px;
                        text-transform: uppercase;
                    ">LEVEL 2 BRIEFING — NAVIGATION</div>

                    <div style="
                        height: 1px;
                        background: linear-gradient(to right, transparent, #0060cc, transparent);
                        margin-bottom: 24px;
                    "></div>

                    <p style="font-size: 0.93rem; line-height: 1.8; margin: 0 0 14px; color: #89bcee;">
                        Signal detected: <strong style="color:#4db8ff;">R2-D2</strong> is somewhere
                        inside this alien maze — the walls
                        <strong style="color:#4db8ff;">pulse with blue light</strong> every few seconds
                        to reveal themselves.
                    </p>
                    <p style="font-size: 0.93rem; line-height: 1.8; margin: 0 0 14px; color: #89bcee;">
                        Touch a hidden wall and you'll be sent
                        back to the start. Memory and patience are your only tools.
                    </p>
                    <p style="font-size: 0.93rem; line-height: 1.8; margin: 0 0 24px; color: #89bcee;">
                        Reach R2 and press <strong style="color:#4db8ff;">E</strong> to interact
                        and advance to <strong style="color:#4db8ff;">Level 3</strong>.
                    </p>

                    <div style="
                        background: rgba(0, 60, 150, 0.12);
                        border: 1px solid rgba(0,100,220,0.3);
                        border-radius: 3px;
                        padding: 14px 18px;
                        margin-bottom: 28px;
                        font-size: 0.85rem;
                        line-height: 1.9;
                        color: #6aaee8;
                    ">
                        <div style="color:#0080ff;letter-spacing:3px;font-size:10px;margin-bottom:6px;text-transform:uppercase;">▸ Field Controls</div>
                        <span style="color:#4db8ff;">W</span> Move Up &nbsp;·&nbsp;
                        <span style="color:#4db8ff;">S</span> Move Down<br>
                        <span style="color:#4db8ff;">A</span> Move Left &nbsp;·&nbsp;
                        <span style="color:#4db8ff;">D</span> Move Right<br>
                        <span style="color:#4db8ff;">E</span> Interact with R2-D2<br>
                        <span style="color:#4db8ff;">Walls pulse blue</span> every few seconds — memorize the path!
                    </div>

                    <div style="text-align:center;">
                        <button id="level2-start-btn" style="
                            background: linear-gradient(135deg, #003fa3, #0070e0);
                            color: #c8e8ff;
                            border: 1px solid #0070e0;
                            border-radius: 3px;
                            padding: 13px 44px;
                            font-family: 'Courier New', Courier, monospace;
                            font-size: 0.95rem;
                            font-weight: 700;
                            letter-spacing: 3px;
                            text-transform: uppercase;
                            cursor: pointer;
                            box-shadow: 0 0 22px rgba(0,120,255,0.5);
                            transition: background 0.2s, box-shadow 0.2s, letter-spacing 0.2s;
                        ">DEPLOY →</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const startBtn = document.getElementById('level2-start-btn');
            if (startBtn) {
                startBtn.addEventListener('click', () => {
                    overlay.style.transition = 'opacity 0.4s ease';
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        overlay.remove();
                        GameLevel2._startTime = Date.now();
                        this._startBarrierGlow();
                    }, 420);
                });
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', renderPopup, { once: true });
        } else {
            renderPopup();
        }
    }

    static _showRestartFlash() {
        if (document.getElementById('maze-restart-flash')) return;
        const flash = document.createElement('div');
        flash.id = 'maze-restart-flash';
        flash.style.cssText = `
            position:fixed; inset:0; background:rgba(180,0,0,.50);
            display:flex; align-items:center; justify-content:center;
            z-index:9998; pointer-events:none; font-family:'Courier New',Courier,monospace;
        `;
        flash.innerHTML = `<div style="
            color:#fff; font-size:2rem; font-weight:800; letter-spacing:3px;
            text-shadow:0 0 20px rgba(255,80,80,.9); text-transform:uppercase;
        ">⚠️ You hit a wall! Restarting…</div>`;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 900);
    }

    initialize() {
        if (this.gameEnv && this.gameEnv.gameControl) {
            this.gameEnv.gameLevelTransitionTriggered = false;
        }
        if (GameLevel2._startTime) {
            this._startBarrierGlow();
        }
    }

    destroy() {
        this._stopBarrierGlow();
    }
}

GameLevel2._startTime = null;

export default GameLevel2;