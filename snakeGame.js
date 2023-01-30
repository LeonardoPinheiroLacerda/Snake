class SnakeGameJS {

    constructor() {

        //Constants
        this.BLANK_SPACE = 0;
        this.SNAKE_HEAD = 1;
        this.SNAKE_BODY = 2;
        this.FOOD = 3;

        this.FIELD_WIDTH = 32;
        this.FIELD_HEIGHT = 16;

        this.PIXEL_SIZE = 25;

        this.PLAYER = {
            posX: 0,
            posY: 0,
            dirX: 0,
            dirY: 0
        }

        this.SNAKE_COLOR = '#54eb7c';
        this.SNAKE_BORDER_COLOR = '#FFFFFF';
        this.SNAKE_BRIGHTNESS_GRADIENT = 70;

        this.FOOD_COLOR = '#FF0000';
        this.BACKGROUND_COLOR = '#b0c6e8';

        this.FRAMERATE = 10;
        
        this.CANVAS = document.createElement('canvas');
        this.CANVAS.width = this.FIELD_WIDTH * this.PIXEL_SIZE;
        this.CANVAS.height = this.FIELD_HEIGHT * this.PIXEL_SIZE;

        this.CANVAS.tabIndex = 1;

        this.FONT = "Arial";        

        this.SCORE_TEXT = "Score:";
        this.SCORE_FONT_SIZE = 30;
        this.SCORE_FONT_COLOR = "black";
        this.SCORE_FONT = `${this.SCORE_FONT_SIZE}px ${this.FONT}`;
        this.SCORE_POSITION_MARGIN = 10;

        this.PAUSED_TEXT = "Click to play!";
        this.PAUSED_FONT_SIZE = 60;
        this.PAUSED_FONT_COLOR = "black";
        this.PAUSED_FONT = `${this.PAUSED_FONT_SIZE}px ${this.FONT}`;

        this.COUNT_DOWN_FONT_SIZE = 75;
        this.COUNT_DOWN_FONT_COLOR = "black";
        this.COUNT_DOWN_FONT = `${this.COUNT_DOWN_FONT_SIZE}px ${this.FONT}`;

        this.GAME_OVER_MAIN_TEXT = "Game over";
        this.GAME_OVER_PRESS_SPACE_TEXT = "Press space to continue.";
        this.GAME_OVER_FONT_SIZE = 45;
        this.GAME_OVER_FONT = `${this.GAME_OVER_FONT_SIZE}px ${this.FONT}`;
        this.GAME_OVER_FONT_COLOR = "black";
        this.GAME_OVER_MARGIN_BETWEEN_LINES = 25;

        this.INITIAL_BODY_LENGTH = 3;
        this.BODY_INCREMENT_PER_SCORE = 1;

        this.SECONDS_TO_RETURN_AFTER_PAUSE = 3;


        //Variables
        this.field = [];
        
        this.countDownInterval;
        
        this.tickInterval = 1000 / this.FRAMERATE;
        this.score = 0;
        
        this.bodyLength = this.INITIAL_BODY_LENGTH;
        this.body = [];

        this.actualSecondsToReturn = this.SECONDS_TO_RETURN_AFTER_PAUSE;

        this.isAnyKeyPressed = false;
        this.isGameRunning = false;
        this.isOnReturningCountDown = false;
        this.isGameOver = false;

    }

    init() {
        document.body.appendChild(this.CANVAS);
        this.CONTEXT = this.CANVAS.getContext('2d');

        this.startGame();

        this.CANVAS.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowDown':
                    this.moveDown();
                    break;
                case 'ArrowUp':
                    this.moveUp();
                    break;
                case 'ArrowRight':
                    this.moveRight();
                    break;
                case 'ArrowLeft':
                    this.moveLeft();
                    break;
                case ' ':
                    if (this.isGameOver) this.startGame(true);
                    break;

            }
        });

        this.CANVAS.addEventListener('focus', () => this.startCountDown());
        this.CANVAS.addEventListener('focusout', () => this.clearCountDown());

        setInterval(() => this.processAndRenderFrame(), this.tickInterval);
    }


    startGame(restart = false) {

        if (restart) {
            this.startCountDown();
        }

        this.PLAYER = {
            posX: parseInt(this.FIELD_WIDTH / 2),
            posY: parseInt(this.FIELD_HEIGHT / 2),
            dirX: 1,
            dirY: 0
        }

        this.bodyLength = this.INITIAL_BODY_LENGTH;
        this.body = this.buildInitialBody();

        this.score = 0;

        this.field = this.clearField();
        this.field[this.PLAYER.posX][this.PLAYER.posY] = this.SNAKE_HEAD;

        this.setBackground();
        this.spawnFood();

        this.isGameOver = false;
    }

    getPixelPositionWithCoordinates(x, y) {
        x *= this.PIXEL_SIZE;
        y *= this.PIXEL_SIZE;

        const width = this.PIXEL_SIZE;
        const height = this.PIXEL_SIZE;

        return {
            x,
            y,
            width,
            height
        }
    }

    drawSnakePixel(px, py) {
        this.CONTEXT.fillStyle = this.SNAKE_COLOR;
        this.CONTEXT.strokeStyle = this.SNAKE_BORDER_COLOR;

        const { x, y, width, height } = this.getPixelPositionWithCoordinates(px, py);

        this.CONTEXT.fillRect(x, y, width, height);
        this.CONTEXT.filter = "brightness(100%)";
        this.CONTEXT.strokeRect(x, y, width, height);
    }

    drawFood(px, py) {
        this.CONTEXT.fillStyle = this.FOOD_COLOR;

        const { x, y, width, height } = this.getPixelPositionWithCoordinates(px, py);

        this.CONTEXT.fillRect(x, y, width, height);
    }

    setBackground() {
        this.CONTEXT.filter = "brightness(100%)";
        this.CONTEXT.fillStyle = this.BACKGROUND_COLOR;
        this.CONTEXT.fillRect(0, 0, this.CANVAS.width, this.CANVAS.height);
    }

    /**
     * Processes and render the next frame
     */
    processAndRenderFrame() {

        this.setBackground();

        if (this.isGameRunning) {
            this.processNextSnakeStep();
        }

        for (let x = 0; x < this.FIELD_WIDTH; x++) {
            for (let y = 0; y < this.FIELD_HEIGHT; y++) {

                switch (this.field[x][y]) {
                    case this.SNAKE_HEAD:
                        this.CONTEXT.filter = `brightness(${100 - this.SNAKE_BRIGHTNESS_GRADIENT}%)`;
                        this.drawSnakePixel(x, y);
                        break;
                    case this.FOOD:
                        this.CONTEXT.filter = "brightness(100%)";
                        this.drawFood(x, y);
                        break;
                }
            }
        }

        for (let i = 0; i < this.body.length; i++) {
            const pixel = this.body[i];

            const scale = ((this.SNAKE_BRIGHTNESS_GRADIENT * i) / this.body.length);

            this.CONTEXT.filter = `brightness(${100 - scale}%)`;
            this.drawSnakePixel(pixel.x, pixel.y);
        }

        if (!this.isGameRunning) {
            if (this.isOnReturningCountDown) {
                this.printCenteredText(this.actualSecondsToReturn, this.COUNT_DOWN_FONT, this.COUNT_DOWN_FONT_COLOR);
            } else if (this.isGameOver) {
                this.printGameOverText();
            } else {
                this.printLostFocusText();
            }
        } else {
            this.printScore();
        }

        //Avoid moving the snake twice on the same frame
        this.isAnyKeyPressed = false;

    }

    printCenteredText(text, font, color, yOffset = 0) {
        this.CONTEXT.font = font;
        this.CONTEXT.fillStyle = color;
        this.CONTEXT.textAlign = 'center';
        this.CONTEXT.fillText(text, this.CANVAS.width / 2, this.CANVAS.height / 2 - yOffset);
    }

    printScore() {
        this.CONTEXT.font = this.SCORE_FONT;
        this.CONTEXT.fillStyle = this.SCORE_FONT_COLOR;
        this.CONTEXT.textAlign = 'left';
        this.CONTEXT.fillText(`${this.SCORE_TEXT} ${this.score}`, this.SCORE_POSITION_MARGIN, this.CANVAS.height - this.SCORE_POSITION_MARGIN);
    }

    printLostFocusText() {
        this.printCenteredText(this.PAUSED_TEXT, this.PAUSED_FONT, this.PAUSED_FONT_COLOR);
    }

    printGameOverText() {
        this.printCenteredText(this.GAME_OVER_MAIN_TEXT, this.GAME_OVER_FONT, this.GAME_OVER_FONT_COLOR, this.GAME_OVER_MARGIN_BETWEEN_LINES);
        this.printCenteredText(this.GAME_OVER_PRESS_SPACE_TEXT, this.GAME_OVER_FONT, this.GAME_OVER_FONT_COLOR, -this.GAME_OVER_MARGIN_BETWEEN_LINES);
    }


    moveDown() {
        if (this.PLAYER.dirY != -1 && !this.isAnyKeyPressed && this.isGameRunning) {
            this.PLAYER.dirX = 0;
            this.PLAYER.dirY = 1;
            this.isAnyKeyPressed = true;
        }
    }

    moveUp() {
        if (this.PLAYER.dirY != 1 && !this.isAnyKeyPressed && this.isGameRunning) {
            this.PLAYER.dirX = 0;
            this.PLAYER.dirY = -1;
            this.isAnyKeyPressed = true;
        }
    }

    moveRight() {
        if (this.PLAYER.dirX != -1 && !this.isAnyKeyPressed && this.isGameRunning) {
            this.PLAYER.dirX = 1;
            this.PLAYER.dirY = 0;
            this.isAnyKeyPressed = true;
        }
    }

    moveLeft() {
        if (this.PLAYER.dirX != 1 && !this.isAnyKeyPressed && this.isGameRunning) {
            this.PLAYER.dirX = -1;
            this.PLAYER.dirY = 0;
            this.isAnyKeyPressed = true;
        }
    }


    processNextSnakeStep() {

        const processBody = () => {
            for (let x = 0; x < this.FIELD_WIDTH; x++) {
                for (let y = 0; y < this.FIELD_HEIGHT; y++) {
                    if (this.field[x][y] == this.SNAKE_BODY) {
                        this.field[x][y] = this.BLANK_SPACE;
                    }
                }
            }

            for (let i = 0; i < this.body.length; i++) {
                const { x, y } = this.body[i];
                this.field[x][y] = this.SNAKE_BODY;
            }
        }

        const move = (x, y) => {
            this.PLAYER.posX = x + this.PLAYER.dirX;
            this.PLAYER.posY = y + this.PLAYER.dirY;

            this.field[x][y] = this.BLANK_SPACE;
            this.field[this.PLAYER.posX][this.PLAYER.posY] = this.SNAKE_HEAD;

            if (this.body.length >= this.bodyLength) {
                this.body.shift();
            }
            this.body.push({ x, y });

            processBody();
        }

        for (let x = 0; x < this.FIELD_WIDTH; x++) {
            for (let y = 0; y < this.FIELD_HEIGHT; y++) {


                if (this.field[x][y] == this.SNAKE_HEAD) {
                    try {
                        switch (this.field[x + this.PLAYER.dirX][y + this.PLAYER.dirY]) {
                            case this.BLANK_SPACE:
                                move(x, y);
                                return;

                            case this.FOOD:
                                this.eat();
                                move(x, y);
                                this.spawnFood();
                                return;
                            default:
                                this.gameOver();
                                return;
                        }
                    } catch (err) {
                        this.gameOver();
                        return;
                    }

                }
            }
        }
    }

    eat() {
        this.score += 1;
        this.bodyLength += this.BODY_INCREMENT_PER_SCORE;
    }

    startCountDown() {
        if(this.SECONDS_TO_RETURN_AFTER_PAUSE == 0){
            this.isGameRunning = true; 
            return;
        } 

        this.isOnReturningCountDown = true;

        this.countDownInterval = setInterval(() => {
            this.actualSecondsToReturn -= 1;
            if (this.actualSecondsToReturn == 0) {
                this.isGameRunning = true;
                this.isOnReturningCountDown = false;
                this.actualSecondsToReturn = this.SECONDS_TO_RETURN_AFTER_PAUSE;
                clearInterval(this.countDownInterval);
            }
        }, 1000);
    }

    clearCountDown() {
        if(this.isGameOver) return;

        clearInterval(this.countDownInterval);
        this.isOnReturningCountDown = false;
        this.actualSecondsToReturn = this.SECONDS_TO_RETURN_AFTER_PAUSE;
        this.isGameRunning = false;
    }

    gameOver() {
        this.isGameRunning = false;
        this.isGameOver = true;
    }

    clearField = () => {
        const tmpField = [];

        for (let i = 0; i < this.FIELD_WIDTH; i++) {
            const row = [];
            for (let j = 0; j < this.FIELD_HEIGHT; j++) {
                row.push(this.BLANK_SPACE);
            }
            tmpField.push(row);
        }

        return tmpField;
    };


    spawnFood() {
        let x, y;
        do {
            x = Math.floor(Math.random() * this.FIELD_WIDTH);
            y = Math.floor(Math.random() * this.FIELD_HEIGHT);
        } while (this.field[x][y] != 0);

        this.field[x][y] = this.FOOD;
    }

    buildInitialBody() {

        const obj = [];

        if (this.bodyLength > this.FIELD_WIDTH / 2) {
            throw "The initial snake body can't be larger than 50% of the FIELD width.";
        }

        for (let i = this.bodyLength; i > 0; i--) {
            try {
                obj.push({
                    x: this.PLAYER.posX - i,
                    y: this.PLAYER.posY
                });
            } catch (err) {
                break;
            }
        }

        return obj;
    }

}