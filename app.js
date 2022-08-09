import { endGame, restartGame } from "./game.js";

function returnToIntroduction(evt) {
    if (evt.key == 'Escape') {
        window.removeEventListener('keydown', returnToIntroduction);
        endGame();
        showIntroduction();
    }
}


function startGame(mode) {
    const app = document.getElementById('app');
    const template = document.getElementById('game');
    const view = template.content.cloneNode(true);

    window.addEventListener('keydown', returnToIntroduction);

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

    const songButton = document.getElementById('birthday-song');
    songButton.onclick = () => {
        if (!birthdaySong.paused) {
            birthdaySong.pause();
        } else {
            birthdaySong.play();
        }
    };
}

let birthdaySong = new Audio('asset/birthday_song.mp3');

window.onload = async () => showIntroduction();
