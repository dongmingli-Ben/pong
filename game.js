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


const FREQ = 5;  // frequency of the game loop
let BACKGROUNDALPHA = 0.9; // transparency of the background image
let ALPHA = 0.5; //transparency of the game objects

let enemy,
    human,
    ball,
    isPaused = false,
    gameLoopId,
    backgroundImg = new Image(),
    hitSound = new Audio("./asset/pong_hit.wav"),
    winSound = new Audio("./asset/win.wav"),
    loseSound = new Audio("./asset/lose.wav"),
    eventEmitter = new EventEmitter();
    
backgroundImg.onload = () => {
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
}
// backgroundImg.src = "./asset/pong_table.jpeg";

class gameObject {
    
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.height = 0;
        this.width = 0;
        this.type = "";
        this.color = "gray";
        this.speed = 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = ALPHA;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
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
        this.initSpeed = 50 / FREQ;
        this.speed = this.initSpeed;
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
    
    checkStatus(canvas) {
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
                // increase the speed for fun
                let newSpeed = this.initSpeed * (Math.log(human.score/10 + 1) + 1);
                this.updateSpeed(newSpeed);
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

    updateSpeed(newSpeed) {
        this.dx = this.dx * newSpeed / this.speed;
        this.dy = this.dy * newSpeed / this.speed;
        this.speed = newSpeed;
        console.log('speed', Math.sqrt(this.dx**2 + this.dy**2));
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

    draw(ctx) {
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




function initGame(canvas, ctx) {
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
        restartGame(backgroundImg.src,
                    BACKGROUNDALPHA,
                    ALPHA,
                    ball.color);
    })

    eventEmitter.on(Messages.BALL_HIT_EVENT, (_, { hitDirection, hitObject }) => {
        hitSound.play();
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
            ctx.save();
            ctx.globalAlpha = BACKGROUNDALPHA;
            ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
            ctx.restore();
            displayMessage(canvas, ctx, "You have WON!! Press [Enter] to start another game!", "green");
            winSound.play();
        }, 100);
    })
    
    eventEmitter.on(Messages.GAME_END_LOSE, () => {
        clearInterval(gameLoopId);
        let id = setTimeout(() => {
            ctx.clearRect(0, 0, canvas.widht, canvas.height);
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.globalAlpha = BACKGROUNDALPHA;
            ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
            ctx.restore();
            displayMessage(canvas, ctx, "Ohh~ You LOSE :( Press [Enter] to start another game ...", "red");
            loseSound.play();
        }, 100);
    })

    ball = new ballObject(canvas.width/2, canvas.height/2);
    human = new humanPlayer(canvas.width-20, canvas.height/2-40);
    enemy = new computerPlayer(0, canvas.height/2-40);
}

function displayMessage(canvas, ctx, message, color) {
    ctx.font = "30px Arial";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(message, canvas.width/2, canvas.height/2);
}

function displayScore(canvas, ctx) {
    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(`Score: ${human.score}`, canvas.width/2, 30);
}

function displayPauseMessage(canvas, ctx) {
    ctx.font = "30px Arial";
    ctx.fillStyle = "red";
    ctx.textAlign = "center";
    ctx.fillText("Press [Spacebar] to continue to game", canvas.width/2, canvas.height/2);
}

function updateGameObjects(canvas) {
    ball.checkStatus(canvas);
}


function drawGameObjects(canvas, ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.globalAlpha = BACKGROUNDALPHA;
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    human.draw(ctx);
    enemy.draw(ctx);
    ball.draw(ctx);
    displayScore(canvas, ctx);
    if (isPaused) {
        displayPauseMessage(canvas, ctx);
    }
}

export function restartGame(backgroundPath = 'asset/pong_table.jpeg',
                            backgroundAlpha = 0.5,
                            gameAlpha = 1.0,
                            ballColor = "white") {
    const canvas = document.getElementById("mycanvas");
    const ctx = canvas.getContext("2d");
    if (gameLoopId) {
        clearInterval(gameLoopId);
    }
    eventEmitter.clear();
    initGame(canvas, ctx);
    // set game settings
    backgroundImg.src = backgroundPath;
    BACKGROUNDALPHA = backgroundAlpha;
    ALPHA = gameAlpha;
    ball.color = ballColor;

    gameLoopId = setInterval(() => {
        updateGameObjects(canvas);
        drawGameObjects(canvas, ctx);
    }, 200 / FREQ)
}
