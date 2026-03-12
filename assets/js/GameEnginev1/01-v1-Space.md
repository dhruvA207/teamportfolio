---
layout: opencs
title: RPG Space Example 
permalink: /gamify/space
---

<div id="gameContainer">
    <div id="promptDropDown" class="promptDropDown" style="z-index: 9999"></div>
    <!-- GameEnv will create canvas dynamically -->
</div>

<script type="module">
    // Adnventure Game assets locations
    import Core from "{{site.baseurl}}/assets/js/GameEnginev1/essentials/Game.js";
    import GameControl from "{{site.baseurl}}/assets/js/GameEnginev1/essentials/GameControl.js";
    import GameLevelSpace from "{{site.baseurl}}/assets/js/GameEnginev1/GameLevelSpace3.js";
    import GameLevel2 from "{{site.baseurl}}/assets/js/GameEnginev1/GameLevel2.js";
    import GameLevelstuck_final from "{{site.baseurl}}/assets/js/GameEnginev1/GameLevelstuck_final.js";
    import { pythonURI, javaURI, fetchOptions } from '{{site.baseurl}}/assets/js/api/config.js';

    const gameLevelClasses = [GameLevelSpace, GameLevel2, GameLevelstuck_final];

    // Web Server Environment data
    const environment = {
        path:"{{site.baseurl}}",
        pythonURI: pythonURI,
        javaURI: javaURI,
        fetchOptions: fetchOptions,
        gameContainer: document.getElementById("gameContainer"),
        gameLevelClasses: gameLevelClasses

    }
    // Launch Adventure Game using the central core and adventure GameControl
    Core.main(environment, GameControl);
</script>
