const Messages = {
    KEY_EVENT_UP: "KEY_EVENT_UP",
    KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
    BALL_HIT_EVENT: "BALL_HIT_EVENT",
    GAME_END_WIN: "GAME_END_WIN",
    GAME_END_LOSE: "GAME_END_LOSE",
    KEY_EVENT_SPACE: "KEY_EVENT_SPACE", // to pause and continue the game
    KEY_EVENT_ENTER: "KEY_EVENT_ENTER", // to restart the game
}


class EventEmitter {

    constructor() {
        this.listeners = {};
    }

    on(message, listener) {
        if (!this.listeners[message]) {
            this.listeners[message] = [];
        }
        this.listeners[message].push(listener);
    }

    emit(message, payload = null) {
        this.listeners[message].forEach(l => l(message, payload));
    }

    clear() {
        this.listeners = {};
    }
}

const canvas = document.getElementById("mycanvas");
const ctx = canvas.getContext("2d");
const FREQ = 5;

let enemy,
    human,
    ball,
    isPaused = false,
    gameLoopId,
    eventEmitter = new EventEmitter();

class gameObject {
    
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.height = 0;
        this.width = 0;
        this.type = "";
        this.color = "white";
        this.speed = 0;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class player extends gameObject {

    constructor(x, y) {
        super(x, y);
        this.width = 20;
        this.height = 80;
        this.speed = 40 / FREQ;
    }
}

class humanPlayer extends player {

    constructor(x, y) {
        super(x, y);
        this.color = "green";
        this.score = 0;
    }
}

class computerPlayer extends player {

    constructor(x, y) {
        super(x, y);
        this.color = "yellow";
        let id = setInterval(() => {
            let bottom = this.y + this.height;
            let top = this.y;
            let mid = this.y + this.height / 2;
            if (mid < ball.y) {
                this.y += this.speed;
            } else if (mid > ball.y) {
                this.y -= this.speed;
            }
            if (isPaused) {
                clearInterval(id);
            }
        }, 200 / FREQ)
    }

    continue() {
        let id = setInterval(() => {
            let bottom = this.y + this.height;
            let top = this.y;
            if (bottom < ball.y) {
                this.y += this.speed;
            } else if (top > ball.y) {
                this.y -= this.speed;
            }
            if (isPaused) {
                clearInterval(id);
            }
        }, 200 / FREQ)
    }
}

class ballObject extends gameObject {

    constructor(x, y) {
        // x, y is the center of the ball
        super(x, y);
        this.speed = 50 / FREQ
        this.radius = 10;
        let angle = Math.random() * Math.PI * 2;
        this.dx = this.speed * Math.cos(angle);
        this.dy = this.speed * Math.sin(angle);
        // move the ball
        let id = setInterval(() => {
            this.y += this.dy;
            this.x += this.dx;
            if (isPaused) {
                clearInterval(id);
            }
        }, 200 / FREQ)
    }
    
    checkStatus() {
        // check boundary
        if (this.y < 0 + this.radius) {
            // hit upper wall
            eventEmitter.emit(Messages.BALL_HIT_EVENT, {hitDirection: "up", hitObject: "wall"});
        }
        if (this.y + this.radius > canvas.height) {
            // hit lower wall
            eventEmitter.emit(Messages.BALL_HIT_EVENT, {hitDirection: "down", hitObject: "wall"});
        }
        if (this.x + this.radius > canvas.width - human.width) {
            // check if the player hit the ball
            if (this.y < human.y || this.y > human.y + human.height) {
                console.log('human', this.y, 'lower', human.y + human.height, 'upper', human.y);
                console.log(this.x, this.y);
                eventEmitter.emit(Messages.GAME_END_LOSE);
            } else {
                console.log('hit!');
                eventEmitter.emit(Messages.BALL_HIT_EVENT, {hitDirection: "right", hitObject: "human"});
            }
        }
        if (this.x - this.radius < enemy.width) {
            // check if the player hit the ball
            if (this.y < enemy.y || this.y > enemy.y + enemy.height) {
                console.log('enemy', this.y, 'lower', enemy.y + enemy.height, 'upper', enemy.y);
                console.log(this.x, this.y);
                eventEmitter.emit(Messages.GAME_END_WIN);
            } else {
                eventEmitter.emit(Messages.BALL_HIT_EVENT, {hitDirection: "left", hitObject: "enemy"});
            }
        } 
    }

    continue() {
        let id = setInterval(() => {
            this.y += this.dy;
            this.x += this.dx;
            if (isPaused) {
                clearInterval(id);
            }
        }, 200 / FREQ)
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
        ctx.fill();
    }
}


function pauseGame() {
    isPaused = true;
}

function continueGame()  {
    isPaused = false;
    ball.continue();
    enemy.continue();
}


// add event listeners to key events
window.addEventListener("keydown", (evt) => {
    if (evt.key === "ArrowUp") {
        eventEmitter.emit(Messages.KEY_EVENT_UP);
    } else if (evt.key === "ArrowDown") {
        eventEmitter.emit(Messages.KEY_EVENT_DOWN);
    } else if (evt.key === " ") {
        // evt.preventDefault();
        eventEmitter.emit(Messages.KEY_EVENT_SPACE);
    } else if (evt.key === "Enter") {
        eventEmitter.emit(Messages.KEY_EVENT_ENTER);
    }
})




function initGame() {
    isPaused = false;
    // create listeners
    eventEmitter.on(Messages.KEY_EVENT_UP, () => {
        if (!isPaused && human.y > 0) {
            human.y -= human.speed;
        }
    })

    eventEmitter.on(Messages.KEY_EVENT_DOWN, () => {
        if (!isPaused && human.y < canvas.height - human.height) {
            human.y += human.speed;
        }
    })

    eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
        if (isPaused) {
            continueGame();
        } else {
            pauseGame();
        }
    })

    eventEmitter.on(Messages.KEY_EVENT_ENTER, () => {
        restartGame();
    })

    eventEmitter.on(Messages.BALL_HIT_EVENT, (_, { hitDirection, hitObject }) => {
        if (hitObject === "human") {
            human.score += 10;
        }
        // bounce the ball
        if (hitDirection === "left" || hitDirection === "right") {
            ball.dx = -ball.dx;
        } else {
            ball.dy = -ball.dy;
        }
    })

    eventEmitter.on(Messages.GAME_END_WIN, () => {
        clearInterval(gameLoopId);
        let id = setTimeout(() => {
            ctx.clearRect(0, 0, canvas.widht, canvas.height);
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            displayMessage("You have WON!! Press [Enter] to start another game!", "green");
        }, 100);
    })
    
    eventEmitter.on(Messages.GAME_END_LOSE, () => {
        clearInterval(gameLoopId);
        let id = setTimeout(() => {
            ctx.clearRect(0, 0, canvas.widht, canvas.height);
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            displayMessage("Ohh~ You LOSE :( Press [Enter] to start another game ...", "red");
        }, 100);
    })

    ball = new ballObject(canvas.width/2, canvas.height/2);
    human = new humanPlayer(canvas.width-20, canvas.height/2-40);
    enemy = new computerPlayer(0, canvas.height/2-40);
}

function displayMessage(message, color) {
    ctx.font = "30px Arial";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(message, canvas.width/2, canvas.height/2);
}

function displayScore() {
    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(`Score: ${human.score}`, canvas.width/2, 30);
}

function displayPauseMessage() {
    ctx.font = "30px Arial";
    ctx.fillStyle = "red";
    ctx.textAlign = "center";
    ctx.fillText("Press [Spacebar] to continue to game", canvas.width/2, canvas.height/2);
}

function updateGameObjects() {
    ball.checkStatus();
}


function drawGameObjects() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    human.draw();
    enemy.draw();
    ball.draw();
    displayScore();
    if (isPaused) {
        displayPauseMessage();
    }
}

function restartGame() {
    if (gameLoopId) {
        clearInterval(gameLoopId);
        eventEmitter.clear();
        initGame();
        gameLoopId = setInterval(() => {
            updateGameObjects();
            drawGameObjects();
        }, 200 / FREQ)
    }
}


window.onload = async () => {
    initGame();
    gameLoopId = setInterval(() => {
        updateGameObjects();
        drawGameObjects();
    }, 200 / FREQ)
}