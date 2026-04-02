// Adventure Game Custom Level
// Exported from GameBuilder on 2026-03-06T03:54:46.013Z

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

        GameLevelSpace._showStartupPopup();

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
            greeting: 'Hey! Nice to meet you, astronaut.',
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
            dialogues: ['Hey! Nice to meet you, astronaut.', 'Good luck on your adventure!', 'Time to move to the next level!'],
            reaction: function() {
                if (this.dialogueSystem) { this.showReactionDialogue(); }
                else { console.log(this.greeting); }
            },
            interact: function() {
                if (this.dialogueSystem) { this.showRandomDialogue(); }
                GameLevelSpace._showVictoryScreen(this.gameEnv);
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

        this.classes = [
            { class: GameEnvBackground, data: bgData },
            { class: Player, data: playerData },
            { class: Npc, data: npcData1 },
            { class: Barrier, data: dbarrier_1 },
            { class: Barrier, data: dbarrier_2 },
            { class: Barrier, data: dbarrier_3 },
            { class: Barrier, data: dbarrier_4 },
            { class: Barrier, data: dbarrier_5 }
        ];
    }

    // =========================================================================
    // VICTORY SCREEN
    // =========================================================================
    static _showVictoryScreen(gameEnv) {
        if (document.getElementById('level1-victory-overlay')) return;

        if (!document.getElementById('level1-victory-styles')) {
            const style = document.createElement('style');
            style.id = 'level1-victory-styles';
            style.textContent = `
                @keyframes l1-win-fadein {
                    from { opacity: 0; transform: scale(0.96); }
                    to   { opacity: 1; transform: scale(1); }
                }
                @keyframes l1-win-pulse {
                    0%, 100% { box-shadow: 0 0 24px rgba(0,220,150,0.4), inset 0 0 24px rgba(0,120,80,0.08); }
                    50%      { box-shadow: 0 0 52px rgba(0,255,180,0.7), inset 0 0 40px rgba(0,160,100,0.15); }
                }
                @keyframes l1-win-float {
                    0%, 100% { transform: translateY(0px); }
                    50%      { transform: translateY(-6px); }
                }
            `;
            document.head.appendChild(style);
        }

        const overlay = document.createElement('div');
        overlay.id = 'level1-victory-overlay';
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
                background: linear-gradient(160deg, #000f08 0%, #001a10 60%, #000c07 100%);
                border: 1px solid #00aa66;
                border-radius: 4px;
                padding: 52px 56px 44px;
                max-width: 520px;
                width: 92%;
                color: #a0ffd8;
                text-align: center;
                animation: l1-win-fadein 0.5s ease forwards, l1-win-pulse 3s ease-in-out infinite;
                position: relative;
                overflow: hidden;
            ">
                <div style="position:absolute;top:10px;left:10px;width:18px;height:18px;border-top:2px solid #00cc88;border-left:2px solid #00cc88;"></div>
                <div style="position:absolute;top:10px;right:10px;width:18px;height:18px;border-top:2px solid #00cc88;border-right:2px solid #00cc88;"></div>
                <div style="position:absolute;bottom:10px;left:10px;width:18px;height:18px;border-bottom:2px solid #00cc88;border-left:2px solid #00cc88;"></div>
                <div style="position:absolute;bottom:10px;right:10px;width:18px;height:18px;border-bottom:2px solid #00cc88;border-right:2px solid #00cc88;"></div>

                <div style="
                    font-size: 64px;
                    animation: l1-win-float 2.4s ease-in-out infinite;
                    margin-bottom: 8px;
                    line-height: 1;
                ">😎</div>

                <div style="
                    font-size: 11px; letter-spacing: 6px; color: #008855;
                    text-transform: uppercase; margin-bottom: 10px;
                ">◈ SECTOR ONE — CLEARED ◈</div>

                <h1 style="
                    font-size: 2rem; color: #00ffaa; margin: 0 0 6px;
                    letter-spacing: 3px; text-transform: uppercase;
                    text-shadow: 0 0 28px rgba(0,255,170,0.65);
                ">NICE TO MEET YOU!</h1>

                <p style="
                    font-size: 0.95rem; line-height: 1.8;
                    color: #80eecc; margin: 18px 0 10px;
                ">
                    <strong style="color:#00ffaa;">Chill Guy</strong> says:<br>
                    <em style="color:#a0ffd8;">"Hey, astronaut — good to finally meet you.<br>
                    Stay cool out there. Level 2 is a whole other vibe."</em>
                </p>

                <p style="font-size: 0.85rem; color: #009966; letter-spacing: 2px; margin: 0 0 32px; text-transform: uppercase;">
                    Advancing to Level 2…
                </p>
            </div>
        `;

        document.body.appendChild(overlay);

        // Transition to next level after a beat
        setTimeout(() => {
            if (gameEnv && gameEnv.gameControl && !gameEnv.gameLevelTransitionTriggered) {
                gameEnv.gameLevelTransitionTriggered = true;
                if (gameEnv.gameControl.currentLevel) {
                    gameEnv.gameControl.currentLevel.continue = false;
                }
            }
        }, 3200);

        // Fade out overlay as level transitions
        setTimeout(() => {
            overlay.style.transition = 'opacity 0.5s ease';
            overlay.style.opacity = '0';
        }, 2800);
    }

    // =========================================================================
    // STARTUP POPUP — matches GameLevelHome style
    // =========================================================================
    static _showStartupPopup() {
        const renderPopup = () => {
            const existing = document.getElementById('level1-startup-popup');
            if (existing) existing.remove();

            if (!document.body) return;

            const overlay = document.createElement('div');
            overlay.id = 'level1-startup-popup';
            overlay.style.cssText = `
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.92);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                font-family: 'Courier New', Courier, monospace;
                animation: l1-fadein 0.6s ease forwards;
            `;

            if (!document.getElementById('level1-popup-styles')) {
                const style = document.createElement('style');
                style.id = 'level1-popup-styles';
                style.textContent = `
                    @keyframes l1-fadein {
                        from { opacity: 0; }
                        to   { opacity: 1; }
                    }
                    @keyframes l1-scanline {
                        0%   { transform: translateY(-100%); }
                        100% { transform: translateY(100vh); }
                    }
                    @keyframes l1-pulse-border {
                        0%, 100% { box-shadow: 0 0 24px rgba(0,120,255,0.4), inset 0 0 24px rgba(0,60,180,0.08); }
                        50%      { box-shadow: 0 0 48px rgba(0,160,255,0.7), inset 0 0 40px rgba(0,80,220,0.15); }
                    }
                    @keyframes l1-glyph-flicker {
                        0%, 95%, 100% { opacity: 1; }
                        96%           { opacity: 0.2; }
                        98%           { opacity: 0.8; }
                    }
                    #level1-start-btn:hover {
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
                        animation: l1-scanline 4s linear infinite;
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
                    animation: l1-pulse-border 3s ease-in-out infinite;
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
                        animation: l1-glyph-flicker 5s infinite;
                    ">◈ SECTOR ONE ◈</div>

                    <h1 style="
                        text-align: center;
                        font-size: 1.9rem;
                        color: #1a90ff;
                        margin: 0 0 4px;
                        letter-spacing: 3px;
                        text-transform: uppercase;
                        text-shadow: 0 0 24px rgba(0,140,255,0.6);
                    ">ALIEN PLANET</h1>

                    <div style="
                        text-align: center;
                        font-size: 10px;
                        color: #004499;
                        letter-spacing: 5px;
                        margin-bottom: 28px;
                        text-transform: uppercase;
                    ">LEVEL 1 BRIEFING — EXPLORATION</div>

                    <div style="
                        height: 1px;
                        background: linear-gradient(to right, transparent, #0060cc, transparent);
                        margin-bottom: 24px;
                    "></div>

                    <p style="font-size: 0.93rem; line-height: 1.8; margin: 0 0 14px; color: #89bcee;">
                        You've landed on an alien world. <strong style="color:#4db8ff;">Chill Guy</strong> is
                        somewhere on this planet — find him and interact to progress.
                    </p>
                    <p style="font-size: 0.93rem; line-height: 1.8; margin: 0 0 14px; color: #89bcee;">
                        Watch out for the <strong style="color:#4db8ff;">terrain barriers</strong> scattered
                        across the landscape. Navigate carefully to reach your contact.
                    </p>
                    <p style="font-size: 0.93rem; line-height: 1.8; margin: 0 0 24px; color: #89bcee;">
                        When you find Chill Guy, press <strong style="color:#4db8ff;">E</strong> to interact
                        and unlock the path to <strong style="color:#4db8ff;">Level 2</strong>.
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
                        <span style="color:#4db8ff;">↑ ↓ ← →</span> Move (Arrow Keys)<br>
                        <span style="color:#4db8ff;">E</span> Interact with Chill Guy<br>
                        <span style="color:#4db8ff;">Objective</span> Reach Chill Guy to advance
                    </div>

                    <div style="text-align:center;">
                        <button id="level1-start-btn" style="
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

            const startBtn = document.getElementById('level1-start-btn');
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

    initialize() {
        if (this.gameEnv && this.gameEnv.gameControl) {
            this.gameEnv.gameLevelTransitionTriggered = false;
        }
    }
}

export default GameLevelSpace;