/**
 * @file GameLevelHome.js
 * @description Homescreen Level — Alien Planet Hub
 *
 * Three AI-powered NPCs guide the player to the three main levels:
 *   • Chill Guy  → Level 1 (GameLevelSpacelevel3 / alien planet)
 *   • R2D2       → Level 2 (GameLevel2 / alien maze)
 *   • Slime      → Level 3 (GameLevelstuck_final / chase survival)
 *
 * A collectible coin bounces around the screen just like in GameLevelDesert.
 *
 * Each NPC runs a full AI conversation via AiNpc.showInteraction(), then
 * appends a level-launch button ("Find me in Level X!" / "Try to beat me!").
 *
 * Controls: W / A / S / D  (astronaut sprite)
 */

import GameEnvBackground from './essentials/GameEnvBackground.js';
import Player            from './essentials/Player.js';
import Npc               from './essentials/Npc.js';
import AiNpc             from './essentials/AiNpc.js';
import Coin              from './Coin.js';

// ─── Level imports (lazy-loaded on button click) ──────────────────────────────
import GameLevelSpacelevel3  from './GameLevelSpace3.js';
import GameLevel2            from './GameLevel2.js';
import GameLevelstuck_final  from './GameLevelstuck_final.js';

// =============================================================================
// HELPER — injects a styled "Go to Level" button into an open dialogue box.
// Called after AiNpc.showInteraction() so the box already exists in the DOM.
//
// @param {DialogueSystem} dialogueSystem - The NPC's active dialogue system
// @param {string}         label          - Button text
// @param {Function}       onClick        - What happens when the player clicks
// =============================================================================
function _injectLevelButton(dialogueSystem, label, onClick) {
    if (!dialogueSystem) return;

    // Poll until the dialogue box is in the DOM (AiNpc renders it async)
    const attempt = (tries = 0) => {
        const box = document.getElementById('custom-dialogue-box-' + dialogueSystem.safeId);
        if (!box) {
            if (tries < 20) setTimeout(() => attempt(tries + 1), 80);
            return;
        }

        // Don't duplicate
        if (box.querySelector('.home-level-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'home-level-btn';
        btn.textContent = label;
        Object.assign(btn.style, {
            display:      'block',
            margin:       '14px auto 4px',
            padding:      '10px 28px',
            background:   'linear-gradient(135deg, #00e5ff, #00b0ff)',
            color:        '#001020',
            border:       'none',
            borderRadius: '8px',
            fontSize:     '0.95rem',
            fontWeight:   '700',
            letterSpacing:'1px',
            cursor:       'pointer',
            boxShadow:    '0 0 18px rgba(0,229,255,0.45)',
            transition:   'transform 0.15s, box-shadow 0.15s',
        });
        btn.onmouseenter = () => {
            btn.style.transform  = 'scale(1.06)';
            btn.style.boxShadow  = '0 0 28px rgba(0,229,255,0.7)';
        };
        btn.onmouseleave = () => {
            btn.style.transform  = 'scale(1)';
            btn.style.boxShadow  = '0 0 18px rgba(0,229,255,0.45)';
        };
        btn.onclick = onClick;

        // Insert before the close button so it sits above it
        const closeBtn = document.getElementById('dialogue-close-btn-' + dialogueSystem.safeId);
        if (closeBtn?.parentNode === box) {
            box.insertBefore(btn, closeBtn);
        } else {
            box.appendChild(btn);
        }
    };

    attempt();
}

// =============================================================================
// HELPER — transition to a level class using the standard gameControl pattern.
// Fades to black, swaps levelClasses, then transitions.
// =============================================================================
function _transitionToLevel(gameEnv, LevelClass) {
    const gameControl = gameEnv?.gameControl;
    if (!gameControl) return;

    const fade = document.createElement('div');
    Object.assign(fade.style, {
        position:   'fixed', inset: '0',
        background: '#000', opacity: '0',
        transition: 'opacity 0.8s ease-in-out',
        zIndex:     '99999',
        pointerEvents: 'none',
    });
    document.body.appendChild(fade);

    requestAnimationFrame(() => {
        fade.style.opacity = '1';
        setTimeout(() => {
            // Store originals so the engine can return if needed
            gameControl._originalLevelClasses = gameControl.levelClasses;

            gameControl.levelClasses      = [LevelClass];
            gameControl.currentLevelIndex = 0;
            gameControl.isPaused          = false;

            gameControl.transitionToLevel?.();

            setTimeout(() => {
                fade.style.opacity = '0';
                setTimeout(() => fade.remove(), 900);
            }, 400);
        }, 850);
    });
}

// =============================================================================
// HOMESCREEN LEVEL CLASS
// =============================================================================
class GameLevelHome {

    constructor(gameEnv) {
        this.gameEnv = gameEnv;
        const path   = gameEnv.path;

        // ── Startup story popup ─────────────────────────────────────────────
        initialize() {
    if (this.gameEnv?.gameControl) {
        this.gameEnv.gameLevelTransitionTriggered = false;
    }

    GameLevelHome._showStartupPopup();
}

        // ── Background ─────────────────────────────────────────────────────
        const bgData = {
            name:   'home_bg',
            src:    path + '/images/gamebuilder/bg/alien_planet_home.png',
            pixels: { height: 772, width: 1134 }
        };

        // ── Player — astronaut with WASD ────────────────────────────────────
        const playerData = {
            id: 'playerData',
            src: path + '/images/gamebuilder/sprites/astro.png',
            SCALE_FACTOR:   5,
            STEP_FACTOR:    1000,
            ANIMATION_RATE: 50,
            INIT_POSITION:  { x: 0.08, y: 0.5 },
            pixels:      { height: 770, width: 513 },
            orientation: { rows: 4, columns: 4 },
            down:      { row: 0, start: 0, columns: 3 },
            downRight: { row: 1, start: 0, columns: 3, rotate:  Math.PI / 16 },
            downLeft:  { row: 0, start: 0, columns: 3, rotate: -Math.PI / 16 },
            left:      { row: 2, start: 0, columns: 3 },
            right:     { row: 1, start: 0, columns: 3 },
            up:        { row: 3, start: 0, columns: 3 },
            upLeft:    { row: 2, start: 0, columns: 3, rotate:  Math.PI / 16 },
            upRight:   { row: 3, start: 0, columns: 3, rotate: -Math.PI / 16 },
            hitbox:  { widthPercentage: 0.2, heightPercentage: 0.4 },
            keypress: { up: 87, left: 65, down: 83, right: 68 }
        };

        // ── Coin ────────────────────────────────────────────────────────────
        const coinData = {
            id:            'coin',
            greeting:      false,
            INIT_POSITION: { x: 0.55, y: 0.55 },
            width:  40,
            height: 70,
            color:  '#FFD700',
            hitbox: { widthPercentage: 0.0, heightPercentage: 0.0 },
            zIndex: 12,
            value:  1,
        };

        // ── NPC 1 — Chill Guy → Level 1 ─────────────────────────────────────
        const npcChillGuy = {
            id: 'ChillGuyHome',
            greeting: "Hey, I'm just hanging out here on the alien planet. Want to know more about space exploration? Chat with me — then come find me in Level 1!",
            src:  path + '/images/gamify/chillguy.png',
            SCALE_FACTOR:   8,
            ANIMATION_RATE: 50,
            INIT_POSITION:  { x: 0.28, y: 0.15 },
            pixels:      { height: 512, width: 384 },
            orientation: { rows: 4, columns: 3 },
            down:      { row: 0, start: 0, columns: 3 },
            right:     { row: 1, start: 0, columns: 3 },
            left:      { row: 2, start: 0, columns: 3 },
            up:        { row: 3, start: 0, columns: 3 },
            upRight:   { row: 3, start: 0, columns: 3 },
            downRight: { row: 1, start: 0, columns: 3 },
            upLeft:    { row: 2, start: 0, columns: 3 },
            downLeft:  { row: 0, start: 0, columns: 3 },
            hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },

            // AI conversation properties
            expertise:    'space exploration',
            chatHistory:  [],
            dialogues: [
                "Hey, I'm just vibing out here on this alien rock. Ask me about space!",
                "The universe is big, man. Like, really big. Ask me anything.",
                "Life out here is chill. What do you want to know about the cosmos?",
                "I've been exploring this planet for a while. Curious about space travel?",
            ],
            knowledgeBase: {
                'space exploration': [
                    { question: "What is the nearest star to Earth?", answer: "Proxima Centauri, about 4.24 light-years away!" },
                    { question: "How long does it take to reach Mars?", answer: "Between 6–9 months depending on orbital alignment." },
                    { question: "What is the ISS?", answer: "The International Space Station — a habitable satellite orbiting Earth at ~400 km altitude." },
                    { question: "Can humans live on other planets?", answer: "Mars is the top candidate, but it would require terraforming or pressurised habitats." },
                ]
            },

            reaction: function () {
                if (this.dialogueSystem) this.showReactionDialogue();
            },

            interact: function () {
                AiNpc.showInteraction(this);
                _injectLevelButton(
                    this.dialogueSystem,
                    '🌍 Find me in Level 1!',
                    () => _transitionToLevel(gameEnv, GameLevelSpacelevel3)
                );
            }
        };

        // ── NPC 2 — R2D2 → Level 2 ──────────────────────────────────────────
        const npcR2D2 = {
            id: 'R2D2Home',
            greeting: "Beep boop! I'm R2-D2. Ask me about robots and AI — then navigate the maze to find me in Level 2!",
            src:  path + '/images/gamify/r2_idle.png',
            SCALE_FACTOR:   8,
            ANIMATION_RATE: 100,
            INIT_POSITION:  { x: 0.55, y: 0.60 },
            pixels:      { width: 505, height: 223 },
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

            // AI conversation properties
            expertise:   'robotics and AI',
            chatHistory: [],
            dialogues: [
                "Bleep bloop! Ask me about robots and artificial intelligence!",
                "I've served Jedi and rebels alike. What do you want to know about AI?",
                "My circuits are buzzing. Got a question about robotics?",
                "Whirr... I can tell you a lot about how robots think.",
            ],
            knowledgeBase: {
                'robotics and AI': [
                    { question: "What is machine learning?", answer: "A branch of AI where computers learn from data instead of being explicitly programmed." },
                    { question: "What are neural networks?", answer: "Computing systems loosely inspired by the human brain, used to recognise patterns." },
                    { question: "What is a robot?", answer: "A machine that can carry out complex actions automatically, often programmable." },
                    { question: "What is the Turing Test?", answer: "A test of a machine's ability to exhibit intelligent behaviour indistinguishable from a human." },
                ]
            },

            reaction: function () {
                if (this.dialogueSystem) this.showReactionDialogue();
            },

            interact: function () {
                AiNpc.showInteraction(this);
                _injectLevelButton(
                    this.dialogueSystem,
                    '🤖 Find me in the Maze (Level 2)!',
                    () => _transitionToLevel(gameEnv, GameLevel2)
                );
            }
        };

        // ── NPC 3 — Slime → Level 3 ─────────────────────────────────────────
        const npcSlime = {
            id: 'SlimeHome',
            greeting: "Hehehe… you think you can outrun me? Ask me anything about survival — then try to beat me in Level 3. I dare you.",
            src:  path + '/images/gamebuilder/sprites/slime.png',
            SCALE_FACTOR:   6,
            ANIMATION_RATE: 50,
            INIT_POSITION:  { x: 0.80, y: 0.20 },
            pixels:      { height: 225, width: 225 },
            orientation: { rows: 4, columns: 4 },
            down:      { row: 0,                  start: 0, columns: 3 },
            right:     { row: Math.min(1, 3),      start: 0, columns: 3 },
            left:      { row: Math.min(2, 3),      start: 0, columns: 3 },
            up:        { row: Math.min(3, 3),      start: 0, columns: 3 },
            upRight:   { row: Math.min(3, 3),      start: 0, columns: 3 },
            downRight: { row: Math.min(1, 3),      start: 0, columns: 3 },
            upLeft:    { row: Math.min(2, 3),      start: 0, columns: 3 },
            downLeft:  { row: 0,                   start: 0, columns: 3 },
            hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },

            // AI conversation properties
            expertise:   'survival strategies',
            chatHistory: [],
            dialogues: [
                "Hehehe… think you can survive my chase? Ask me about survival first.",
                "I've caught every astronaut who came before you. Want some tips?",
                "Speed, strategy, endurance — that's what you'll need. Ask me anything.",
                "Don't just stand there… I'm already plotting my route to you.",
            ],
            knowledgeBase: {
                'survival strategies': [
                    { question: "What is the most important survival rule?", answer: "Stay calm. Panic wastes energy and clouds decision-making." },
                    { question: "How do you avoid being caught?", answer: "Keep moving, vary your direction, and never get cornered." },
                    { question: "What is stamina?", answer: "Your body's ability to sustain physical activity over time — train it!" },
                    { question: "How do predators track prey?", answer: "By predicting movement patterns — so be unpredictable!" },
                ]
            },

            reaction: function () {
                if (this.dialogueSystem) this.showReactionDialogue();
            },

            interact: function () {
                AiNpc.showInteraction(this);
                _injectLevelButton(
                    this.dialogueSystem,
                    '☠️ Try to beat me in Level 3… if you dare!',
                    () => _transitionToLevel(gameEnv, GameLevelstuck_final)
                );
            }
        };

        // ── Class registry ──────────────────────────────────────────────────
        this.classes = [
            { class: GameEnvBackground, data: bgData       },
            { class: Player,            data: playerData   },
            { class: Coin,              data: coinData     },
            { class: Npc,               data: npcChillGuy  },
            { class: Npc,               data: npcR2D2      },
            { class: Npc,               data: npcSlime     },
        ];
    }

    // =========================================================================
    // STARTUP STORY POPUP
    // =========================================================================
    static _showStartupPopup() {
    const renderPopup = () => {
        const existing = document.getElementById('home-startup-popup');
        if (existing) existing.remove();

        if (!document.body) return;

        const overlay = document.createElement('div');
        overlay.id = 'home-startup-popup';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.92);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            font-family: 'Courier New', Courier, monospace;
            animation: home-fadein 0.6s ease forwards;
        `;

        if (!document.getElementById('home-popup-styles')) {
            const style = document.createElement('style');
            style.id = 'home-popup-styles';
            style.textContent = `
                @keyframes home-fadein {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes home-scanline {
                    0%   { transform: translateY(-100%); }
                    100% { transform: translateY(100vh); }
                }
                @keyframes home-pulse-border {
                    0%, 100% { box-shadow: 0 0 24px rgba(0,120,255,0.4), inset 0 0 24px rgba(0,60,180,0.08); }
                    50%      { box-shadow: 0 0 48px rgba(0,160,255,0.7), inset 0 0 40px rgba(0,80,220,0.15); }
                }
                @keyframes home-glyph-flicker {
                    0%, 95%, 100% { opacity: 1; }
                    96%           { opacity: 0.2; }
                    98%           { opacity: 0.8; }
                }
                #home-start-btn:hover {
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
                    animation: home-scanline 4s linear infinite;
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
                animation: home-pulse-border 3s ease-in-out infinite;
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
                    animation: home-glyph-flicker 5s infinite;
                ">◈ SECTOR ZERO ◈</div>

                <h1 style="
                    text-align: center;
                    font-size: 1.9rem;
                    color: #1a90ff;
                    margin: 0 0 4px;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    text-shadow: 0 0 24px rgba(0,140,255,0.6);
                ">ASTRO ODYSSEY</h1>

                <div style="
                    text-align: center;
                    font-size: 10px;
                    color: #004499;
                    letter-spacing: 5px;
                    margin-bottom: 28px;
                    text-transform: uppercase;
                ">MISSION BRIEFING — CLASSIFIED</div>

                <div style="
                    height: 1px;
                    background: linear-gradient(to right, transparent, #0060cc, transparent);
                    margin-bottom: 24px;
                "></div>

                <p style="font-size: 0.93rem; line-height: 1.8; margin: 0 0 14px; color: #89bcee;">
                    You are <strong style="color:#4db8ff;">ASTRO-7</strong>, an elite explorer
                    deployed to an uncharted alien world. Your ship's logs are corrupted.
                    Your crew — scattered.
                </p>
                <p style="font-size: 0.93rem; line-height: 1.8; margin: 0 0 14px; color: #89bcee;">
                    Three contacts have been detected across the planet's surface.
                    Seek them out. Each holds a fragment of the data you need to
                    <strong style="color:#4db8ff;">restore the mission</strong> — but
                    you'll have to earn it.
                </p>
                <p style="font-size: 0.93rem; line-height: 1.8; margin: 0 0 24px; color: #89bcee;">
                    One will ask you to <strong style="color:#4db8ff;">explore</strong>.
                    One will ask you to <strong style="color:#4db8ff;">navigate</strong>.
                    One will ask you to <strong style="color:#ff4466;">survive</strong>.
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
                    <span style="color:#4db8ff;">E</span> Interact with contacts<br>
                    <span style="color:#4db8ff;">Coins</span> scattered — collect them all
                </div>

                <div style="text-align:center;">
                    <button id="home-start-btn" style="
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

        const startBtn = document.getElementById('home-start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                overlay.style.transition = 'opacity 0.4s ease';
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 420);
            });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderPopup, { once: true });
    } else {
        renderPopup();
    }
}

    /**
     * Called by the engine after the level is constructed.
     * Resets any stale transition flags.
     */
    initialize() {
        if (this.gameEnv?.gameControl) {
            this.gameEnv.gameLevelTransitionTriggered = false;
        }
    }
}

export default GameLevelHome;