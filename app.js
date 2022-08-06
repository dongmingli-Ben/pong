import { restartGame } from "./game.js";


function startGame() {
    const app = document.getElementById('app');
    const template = document.getElementById('game');
    const view = template.content.cloneNode(true);

    app.innerHTML = '';
    app.appendChild(view);
    restartGame();
}


function showIntroduction() {
    const app = document.getElementById('app');
    const template = document.getElementById('intro');
    const view = template.content.cloneNode(true);

    app.innerHTML = '';
    app.appendChild(view);
}

let gameStarted = false;

window.addEventListener('click', (e) => {
    if (gameStarted === false) {
        gameStarted = true;
        startGame();
    }
});

window.onload = async () => showIntroduction();