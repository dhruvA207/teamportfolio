/**
 * @file GameLevelstuck_final.js
 * @description FA2 Update (v3) — Interaction, Behavior Design + Chase AI
 */

import GameEnvBackground from '../GameEnginev1.1/essentials/GameEnvBackground.js';
import Player from '../GameEnginev1.1/essentials/Player.js';
import Npc from '../GameEnginev1.1/essentials/Npc.js';
import Barrier from '../GameEnginev1.1/essentials/Barrier.js';

const INTERACTION_CONFIG = {
    SURVIVE_MS:        20000,
    HUD_ELEMENT_ID:    'alien-planet-hud',
    CAUGHT_OVERLAY_ID: 'alien-planet-caught',
    WIN_OVERLAY_ID:    'alien-planet-win',
    CATCH_COOLDOWN_MS: 1200
};

const CHASE_CONFIG = {
    TICK_MS:            33,
    BASE_SPEED:         1.2,
    RAGE_SPEED:         3.8,
    STILL_THRESHOLD_MS: 3000,
    STILL_RADIUS:       4,
    STOP_RADIUS:        18,
    INIT_POSITION:      { x: 500, y: 300 }
};

const AlienChaseAI = {
    intervalId:    null,
    paused:        false,
    offsetX:       0,
    offsetY:       0,
    currentSpeed:  CHASE_CONFIG.BASE_SPEED,
    lastPlayerPos: null,
    stillSince:    null,

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

    stop() {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        const c = this._findCanvas('Alien');
        if (c) c.style.transform = '';
    },

    pause() { this.paused = true; },

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

    _findCanvas(id) {
        let el = document.getElementById(id);
        if (el) return el;
        const all = document.querySelectorAll('canvas');
        for (const c of all) { if (c.id === id) return c; }
        return null;
    },

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

        const now = Date.now();
        if (this.lastPlayerPos !== null) {
            const moved = Math.sqrt(
                Math.pow(px - this.lastPlayerPos.x, 2) +
                Math.pow(py - this.lastPlayerPos.y, 2)
            );

            if (moved < CHASE_CONFIG.STILL_RADIUS) {
                if (this.stillSince === null) this.stillSince = now;
                if ((now - this.stillSince) >= CHASE_CONFIG.STILL_THRESHOLD_MS) {
                    if (this.currentSpeed !== CHASE_CONFIG.RAGE_SPEED) {
                        this.currentSpeed = CHASE_CONFIG.RAGE_SPEED;
                        this._setRageVisual(true);
                    }
                }
            } else {
                if (this.stillSince !== null) {
                    this.stillSince   = null;
                    this.currentSpeed = CHASE_CONFIG.BASE_SPEED;
                    this._setRageVisual(false);
                }
            }
        }
        this.lastPlayerPos = { x: px, y: py };

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
};

const SurvivalManager = {
    remaining: INTERACTION_CONFIG.SURVIVE_MS,
    countdownId: null,
    frozen: false,
    lastResetTime: null,

    init() {
        this.remaining     = INTERACTION_CONFIG.SURVIVE_MS;
        this.frozen        = false;
        this.lastResetTime = null;
        if (this.countdownId !== null) { clearInterval(this.countdownId); this.countdownId = null; }

        // ── HUD timer ────────────────────────────────────────────────────────
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
        // Remove stale overlay so the button wiring is always fresh
        const staleCaught = document.getElementById(INTERACTION_CONFIG.CAUGHT_OVERLAY_ID);
        if (staleCaught) staleCaught.remove();

        const caught = document.createElement('div');
        caught.id = INTERACTION_CONFIG.CAUGHT_OVERLAY_ID;
        Object.assign(caught.style, {
            display:        'none',
            position:       'fixed',
            top: '0', left: '0', width: '100%', height: '100%',
            background:     'rgba(0,0,0,0.85)',
            fontFamily:     "'Courier New', Courier, monospace",
            textAlign:      'center',
            paddingTop:     '28vh',
            zIndex:         '10000',
            boxSizing:      'border-box',
        });
        caught.innerHTML = `
            <div style="
                font-size:48px; font-weight:800; color:#ff4444;
                letter-spacing:4px; text-shadow:0 0 28px #ff4444;
                margin-bottom:10px;
            ">☠ CAUGHT!</div>
            <div style="
                font-size:18px; color:#ffaaaa; letter-spacing:2px;
                margin-bottom:36px;
            ">The Slime got you. Try again.</div>
            <div style="display:flex;gap:18px;justify-content:center;flex-wrap:wrap;">
                <button id="caught-restart-btn" style="
                    background: linear-gradient(135deg, #5a0010, #aa0025);
                    color: #ffc8d0;
                    border: 1px solid #cc0030;
                    border-radius: 3px;
                    padding: 13px 38px;
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 0.92rem;
                    font-weight: 700;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    cursor: pointer;
                    box-shadow: 0 0 18px rgba(200,0,50,0.5);
                    transition: background 0.2s, box-shadow 0.2s;
                ">↺ RETRY LEVEL</button>
            </div>
            <div style="
                margin-top:22px; font-size:13px; color:#884455;
                letter-spacing:2px;
            ">— or press <span style="color:#ff4466;">E</span> near the Slime —</div>
        `;
        document.body.appendChild(caught);

        // Wire the retry button — same as pressing E (SurvivalManager.reset)
        document.getElementById('caught-restart-btn').addEventListener('click', () => {
            SurvivalManager.reset();
        });

        // ── WIN overlay ──────────────────────────────────────────────────────
        const staleWin = document.getElementById(INTERACTION_CONFIG.WIN_OVERLAY_ID);
        if (staleWin) staleWin.remove();

        const win = document.createElement('div');
        win.id = INTERACTION_CONFIG.WIN_OVERLAY_ID;
        Object.assign(win.style, {
            display:        'none',
            position:       'fixed',
            top: '0', left: '0', width: '100%', height: '100%',
            background:     'rgba(0,0,0,0.88)',
            fontFamily:     "'Courier New', Courier, monospace",
            textAlign:      'center',
            paddingTop:     '26vh',
            zIndex:         '10000',
            boxSizing:      'border-box',
        });
        win.innerHTML = `
            <div style="
                font-size:52px; font-weight:800; color:#00ffcc;
                letter-spacing:4px; text-shadow:0 0 32px #00ffcc;
                margin-bottom:10px;
            ">🛸 YOU SURVIVED!</div>
            <div style="
                font-size:18px; color:#a0ffe8; letter-spacing:2px;
                margin-bottom:10px;
            ">Level Complete — well done, astronaut!</div>
            <div style="
                font-size:13px; color:#00aa88; letter-spacing:3px;
                text-transform:uppercase; margin-bottom:40px;
            ">◈ SECTOR THREE — CLEARED ◈</div>
            <div style="display:flex;gap:18px;justify-content:center;flex-wrap:wrap;">
                <button id="win-hub-btn" style="
                    background: linear-gradient(135deg, #003fa3, #0070e0);
                    color: #c8e8ff;
                    border: 1px solid #0070e0;
                    border-radius: 3px;
                    padding: 13px 38px;
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 0.92rem;
                    font-weight: 700;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    cursor: pointer;
                    box-shadow: 0 0 18px rgba(0,120,255,0.5);
                    transition: background 0.2s, box-shadow 0.2s;
                ">⬡ RETURN TO HUB</button>
            </div>
        `;
        document.body.appendChild(win);

        // Wire the hub button
        document.getElementById('win-hub-btn').addEventListener('click', () => {
            window.location.href = '/space-hub';
        });

        this._startCountdown();
    },

    _updateHUD() {
        const el = document.getElementById(INTERACTION_CONFIG.HUD_ELEMENT_ID);
        if (!el) return;
        const secs = this.remaining / 1000;
        const display = secs <= 3
            ? `⏱ ${secs.toFixed(1)}s`
            : `⏱ ${Math.ceil(secs)}s`;
        el.textContent = display;

        if (secs <= 3) {
            el.style.color      = '#ff9900';
            el.style.textShadow = '0 0 14px #ff9900';
        } else {
            el.style.color      = '#00ffcc';
            el.style.textShadow = '0 0 10px #00ffcc';
        }
    },

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

    caught() {
        if (this.frozen) return;
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

    showWin() {
        this.frozen = true;
        AlienChaseAI.pause();
        const el = document.getElementById(INTERACTION_CONFIG.WIN_OVERLAY_ID);
        if (el) el.style.display = 'block';

        if (this.gameEnv && this.gameEnv.gameControl && !this.gameLevelTransitionTriggered) {
            this.gameLevelTransitionTriggered = true;
            setTimeout(() => {
                if (this.gameEnv && this.gameEnv.gameControl &&
                    this.gameEnv.gameControl.currentLevel) {
                    this.gameEnv.gameControl.currentLevel.continue = false;
                }
            }, 4000);
        }
    },

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

class GameLevelstuck_final {

    constructor(gameEnv) {
        this.gameEnv = gameEnv;
        const path = gameEnv.path;

        SurvivalManager.gameEnv = gameEnv;

        GameLevelstuck_final._showStartupPopup(gameEnv);

        const bgData = {
            name: "custom_bg",
            src: path + "/images/gamebuilder/bg/alien_planet.jpg",
            pixels: { height: 772, width: 1134 }
        };

        const playerData = {
            id: 'playerData',
            src: path + "/images/gamebuilder/sprites/astro.png",
            SCALE_FACTOR: 5,
            STEP_FACTOR: 700,
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
            reaction: function () {
                SurvivalManager.caught();
                if (this.dialogueSystem) { this.showReactionDialogue(); }
            },
            interact: function () {
                SurvivalManager.reset();
                if (this.dialogueSystem) { this.showRandomDialogue(); }
            }
        };

        const dbarrier_1 = {
            id: 'dbarrier_1',
            x: 0, y: 1,
            width: 235, height: 134,
            visible: true,
            hitbox: { widthPercentage: 0.0, heightPercentage: 0.0 },
            fromOverlay: true
        };

        this.classes = [
            { class: GameEnvBackground, data: bgData },
            { class: Player,            data: playerData },
            { class: Npc,               data: npcData1 },
            { class: Barrier,           data: dbarrier_1 }
        ];
    }

    // =========================================================================
    // STARTUP POPUP — matches GameLevelHome style
    // Initialises HUD + AlienChaseAI only after the player clicks DEPLOY
    // =========================================================================
    static _showStartupPopup(gameEnv) {
        const renderPopup = () => {
            const existing = document.getElementById('level3-startup-popup');
            if (existing) existing.remove();

            if (!document.body) return;

            const overlay = document.createElement('div');
            overlay.id = 'level3-startup-popup';
            overlay.style.cssText = `
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.92);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                font-family: 'Courier New', Courier, monospace;
                animation: l3-fadein 0.6s ease forwards;
            `;

            if (!document.getElementById('level3-popup-styles')) {
                const style = document.createElement('style');
                style.id = 'level3-popup-styles';
                style.textContent = `
                    @keyframes l3-fadein {
                        from { opacity: 0; }
                        to   { opacity: 1; }
                    }
                    @keyframes l3-scanline {
                        0%   { transform: translateY(-100%); }
                        100% { transform: translateY(100vh); }
                    }
                    @keyframes l3-pulse-border {
                        0%, 100% { box-shadow: 0 0 24px rgba(180,0,60,0.4), inset 0 0 24px rgba(120,0,40,0.08); }
                        50%      { box-shadow: 0 0 48px rgba(255,40,80,0.7), inset 0 0 40px rgba(180,0,60,0.15); }
                    }
                    @keyframes l3-glyph-flicker {
                        0%, 95%, 100% { opacity: 1; }
                        96%           { opacity: 0.2; }
                        98%           { opacity: 0.8; }
                    }
                    #level3-start-btn:hover {
                        background: linear-gradient(135deg, #8b0000, #cc0030) !important;
                        box-shadow: 0 0 32px rgba(255,40,80,0.8) !important;
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
                        background: linear-gradient(to bottom, transparent, rgba(255,40,80,0.18), transparent);
                        animation: l3-scanline 4s linear infinite;
                    "></div>
                </div>

                <div style="
                    position: relative; z-index: 1;
                    background: linear-gradient(160deg, #0f0005 0%, #200010 60%, #0a0008 100%);
                    border: 1px solid #880022;
                    border-radius: 4px;
                    padding: 48px 52px 40px;
                    max-width: 540px;
                    width: 92%;
                    color: #ffb0c0;
                    animation: l3-pulse-border 3s ease-in-out infinite;
                    overflow: hidden;
                ">
                    <div style="position:absolute;top:10px;left:10px;width:18px;height:18px;border-top:2px solid #cc0030;border-left:2px solid #cc0030;"></div>
                    <div style="position:absolute;top:10px;right:10px;width:18px;height:18px;border-top:2px solid #cc0030;border-right:2px solid #cc0030;"></div>
                    <div style="position:absolute;bottom:10px;left:10px;width:18px;height:18px;border-bottom:2px solid #cc0030;border-left:2px solid #cc0030;"></div>
                    <div style="position:absolute;bottom:10px;right:10px;width:18px;height:18px;border-bottom:2px solid #cc0030;border-right:2px solid #cc0030;"></div>

                    <div style="
                        text-align: center;
                        font-size: 11px;
                        letter-spacing: 6px;
                        color: #880022;
                        text-transform: uppercase;
                        margin-bottom: 10px;
                        animation: l3-glyph-flicker 5s infinite;
                    ">◈ SECTOR THREE ◈</div>

                    <h1 style="
                        text-align: center;
                        font-size: 1.9rem;
                        color: #ff4466;
                        margin: 0 0 4px;
                        letter-spacing: 3px;
                        text-transform: uppercase;
                        text-shadow: 0 0 24px rgba(255,40,80,0.6);
                    ">SURVIVE THE HUNT</h1>

                    <div style="
                        text-align: center;
                        font-size: 10px;
                        color: #660018;
                        letter-spacing: 5px;
                        margin-bottom: 28px;
                        text-transform: uppercase;
                    ">LEVEL 3 BRIEFING — SURVIVAL</div>

                    <div style="
                        height: 1px;
                        background: linear-gradient(to right, transparent, #880022, transparent);
                        margin-bottom: 24px;
                    "></div>

                    <p style="font-size: 0.93rem; line-height: 1.8; margin: 0 0 14px; color: #ffb0c0;">
                        The <strong style="color:#ff4466;">Slime</strong> is hunting you.
                        It knows this planet better than you do — and it's
                        <strong style="color:#ff4466;">already moving</strong>.
                    </p>
                    <p style="font-size: 0.93rem; line-height: 1.8; margin: 0 0 14px; color: #ffb0c0;">
                        Survive for <strong style="color:#ff4466;">20 seconds</strong> without
                        being caught. If it touches you, the hunt resets.
                        Stand still too long and it enters
                        <strong style="color:#ff4466;">RAGE MODE</strong> — moving three times faster.
                    </p>
                    <p style="font-size: 0.93rem; line-height: 1.8; margin: 0 0 24px; color: #ffb0c0;">
                        If caught, press <strong style="color:#ff4466;">E</strong> near the Slime
                        to restart the timer and try again.
                    </p>

                    <div style="
                        background: rgba(150, 0, 30, 0.10);
                        border: 1px solid rgba(200,0,50,0.3);
                        border-radius: 3px;
                        padding: 14px 18px;
                        margin-bottom: 28px;
                        font-size: 0.85rem;
                        line-height: 1.9;
                        color: #dd8899;
                    ">
                        <div style="color:#cc0030;letter-spacing:3px;font-size:10px;margin-bottom:6px;text-transform:uppercase;">▸ Field Controls</div>
                        <span style="color:#ff4466;">W</span> Move Up &nbsp;·&nbsp;
                        <span style="color:#ff4466;">S</span> Move Down<br>
                        <span style="color:#ff4466;">A</span> Move Left &nbsp;·&nbsp;
                        <span style="color:#ff4466;">D</span> Move Right<br>
                        <span style="color:#ff4466;">E</span> Restart after being caught<br>
                        <span style="color:#ff4466;">⚠ Warning</span> Standing still triggers Rage Mode
                    </div>

                    <div style="text-align:center;">
                        <button id="level3-start-btn" style="
                            background: linear-gradient(135deg, #5a0010, #aa0025);
                            color: #ffc8d0;
                            border: 1px solid #cc0030;
                            border-radius: 3px;
                            padding: 13px 44px;
                            font-family: 'Courier New', Courier, monospace;
                            font-size: 0.95rem;
                            font-weight: 700;
                            letter-spacing: 3px;
                            text-transform: uppercase;
                            cursor: pointer;
                            box-shadow: 0 0 22px rgba(200,0,50,0.5);
                            transition: background 0.2s, box-shadow 0.2s, letter-spacing 0.2s;
                        ">DEPLOY →</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const startBtn = document.getElementById('level3-start-btn');
            if (startBtn) {
                startBtn.addEventListener('click', () => {
                    overlay.style.transition = 'opacity 0.4s ease';
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        overlay.remove();
                        // Start HUD and chase only after player deploys
                        SurvivalManager.init();
                        AlienChaseAI.start();
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

    initialize() {
        if (SurvivalManager && SurvivalManager.gameEnv && SurvivalManager.gameEnv.gameControl) {
            SurvivalManager.gameLevelTransitionTriggered = false;
        }
    }
}

export default GameLevelstuck_final;