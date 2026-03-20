---
layout: page
title: Space Adventure Hub
permalink: /space-hub
---

<style>
  body {
    background: linear-gradient(180deg, #000011 0%, #000033 50%, #000011 100%);
    color: white;
    font-family: 'Arial', sans-serif;
    overflow-x: hidden;
    margin: 0;
    padding: 0;
  }

  .stars {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .star {
    position: absolute;
    background: white;
    border-radius: 50%;
    animation: twinkle 2s infinite ease-in-out;
  }

  @keyframes twinkle {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }

  .container {
    text-align: center;
    padding: 100px 20px;
    position: relative;
    z-index: 1;
  }

  h1 {
    font-size: 3em;
    margin-bottom: 50px;
    text-shadow: 0 0 20px #00ffff;
    animation: glow 2s ease-in-out infinite alternate;
  }

  @keyframes glow {
    from { text-shadow: 0 0 20px #00ffff; }
    to { text-shadow: 0 0 30px #00ffff, 0 0 40px #00ffff; }
  }

  .button {
    display: inline-block;
    margin: 20px;
    padding: 20px 40px;
    font-size: 1.5em;
    color: white;
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
    border: none;
    border-radius: 10px;
    text-decoration: none;
    transition: all 0.3s ease;
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
    position: relative;
    overflow: hidden;
  }

  .button:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  .button:hover {
    transform: scale(1.1);
    box-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
  }

  .button:hover:before {
    left: 100%;
  }

  .planet {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle, #8e44ad, #3498db);
    animation: orbit 20s linear infinite;
  }

  .planet1 {
    width: 50px;
    height: 50px;
    top: 20%;
    left: 10%;
    animation-duration: 15s;
  }

  .planet2 {
    width: 30px;
    height: 30px;
    top: 60%;
    right: 15%;
    animation-duration: 25s;
  }

  @keyframes orbit {
    from { transform: rotate(0deg) translateX(100px) rotate(0deg); }
    to { transform: rotate(360deg) translateX(100px) rotate(-360deg); }
  }
</style>

<div class="stars" id="stars"></div>
<div class="planet planet1"></div>
<div class="planet planet2"></div>

<div class="container">
  <h1>Welcome to Space Adventure!</h1>
  <p>Embark on an epic journey through the cosmos. Choose your path:</p>
  
  <a href="/notebooks/2026-03-18-space-blog/" class="button">Read the Space Blog</a>
  <a href="/gamify/space" class="button">Play the Space Game</a>
</div>

<script>
  // Create stars
  const starsContainer = document.getElementById('stars');
  for (let i = 0; i < 100; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.width = Math.random() * 3 + 1 + 'px';
    star.style.height = star.style.width;
    star.style.animationDelay = Math.random() * 2 + 's';
    starsContainer.appendChild(star);
  }

  // Add some interactivity
  document.querySelectorAll('.button').forEach(button => {
    button.addEventListener('mouseenter', () => {
      button.style.animation = 'pulse 1s infinite';
    });
    button.addEventListener('mouseleave', () => {
      button.style.animation = '';
    });
  });
</script>