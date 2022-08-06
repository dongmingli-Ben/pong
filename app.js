import { restartGame } from "./game.js";


function startGame(mode) {
    const app = document.getElementById('app');
    const template = document.getElementById('game');
    const view = template.content.cloneNode(true);

    app.innerHTML = '';
    app.appendChild(view);
    if (mode === "fishing") {
        restartGame('asset/vscode.png', 1.0, 0.5, "grey");
    } else {
        restartGame('asset/pong_table.jpeg', 0.5, 1.0, "white");
    }
}


function showIntroduction() {
    const app = document.getElementById('app');
    const template = document.getElementById('intro');
    const view = template.content.cloneNode(true);

    app.innerHTML = '';
    app.appendChild(view);

    const fishButton = document.getElementById('fishing');
    const playBotton = document.getElementById('playing');
    fishButton.onclick = () => startGame('fishing');
    playBotton.onclick = () => startGame('playing');
}

// let gameStarted = false;

// window.addEventListener('click', (e) => {
//     if (gameStarted === false) {
//         gameStarted = true;
//         startGame();
//     }
// });

window.onload = async () => showIntroduction();
