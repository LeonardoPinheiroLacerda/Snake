class SnakeGameJS {

    constructor({dimensions, colors, outlines, difficulty, texts, initialBodyLength, bodyIncrementPerScore, secondsToReturnAfterPause, parentElement, initialFoodQuantity} = {}) {

        if(colors?.snake?.brightnessGradient && colors?.snake?.brightnessGradient > 1 || colors?.snake?.brightnessGradient < 0) {
            throw "The property colors.snake.brightnessGradient must be a number between 0 and 1.";
        }

        //Constants
        this.BLANK_SPACE = 0;
        this.SNAKE_HEAD = 1;
        this.SNAKE_BODY = 2;
        this.FOOD = 3;

        this.PLAYER = {
            posX: 0,
            posY: 0,
            dirX: 0,
            dirY: 0
        }

        this.SNAKE_BRIGHTNESS_GRADIENT          = (colors?.snake?.brightnessGradient * 100 || colors?.snake?.brightnessGradient == 0) || 70;
        this.SECONDS_TO_RETURN_AFTER_PAUSE      = (secondsToReturnAfterPause || secondsToReturnAfterPause == 0) ? secondsToReturnAfterPause : 3;

        this.FIELD_WIDTH                        = dimensions?.fieldWidth                        || 32;
        this.FIELD_HEIGHT                       = dimensions?.fieldHeight                       || 16;

        this.PIXEL_SIZE                         = dimensions?.pixelSize                         || 25;

        this.SNAKE_COLOR                        = colors?.snake?.body                           || '#24f03c';
        this.SNAKE_OUTLINE_COLOR                = colors?.snake?.outlineColor                   || '#FFFFFF';

        this.FOOD_COLOR                         = colors?.food                                  || '#FF0000';
        this.BACKGROUND_COLOR                   = colors?.background                            || '#212229';

        this.SNAKE_OUTLINE_WIDTH                = outlines?.snake                               || 2;
        this.FONT_OUTLINE_WIDTH                 = outlines?.font                                || 4;
        this.FONT_OUTLINE_COLOR                 = texts?.outlineColor                           || '#FFFFFF';
        
        this.FONT                               = texts?.font                                   || "Verdana";
        this.FONT_COLOR                         = texts?.color                                  || "#000000";

        this.SCORE_TEXT                         = texts?.score?.text                            || "Score:";
        this.SCORE_FONT_SIZE                    = texts?.score?.size                            || 30;
        this.SCORE_FONT                         = `${this.SCORE_FONT_SIZE}px ${this.FONT}`;
        this.SCORE_POSITION_MARGIN              = texts?.score?.margin                          || 10;

        this.PAUSED_TEXT                        = texts?.pause?.text                            || "Click to play!";
        this.PAUSED_FONT_SIZE                   = texts?.pause?.size                            || 60;
        this.PAUSED_FONT                        = `${this.PAUSED_FONT_SIZE}px ${this.FONT}`;

        this.COUNT_DOWN_FONT_SIZE               = texts?.countDown?.size                        || 75;
        this.COUNT_DOWN_FONT                    = `${this.COUNT_DOWN_FONT_SIZE}px ${this.FONT}`;

        this.YOU_WON_MAIN_TEXT                  = texts?.win?.mainText                          || "You won!";
        this.YOU_WON_PRESS_SPACE_TEXT           = texts?.win?.pressSpaceToContinueText          || "Press space to continue.";

        this.GAME_OVER_MAIN_TEXT                = texts?.gameover?.mainText                     || "Game over";
        this.GAME_OVER_FONT_SIZE                = texts?.gameover?.size                         || 45;
        this.GAME_OVER_MARGIN_BETWEEN_LINES     = texts?.gameover?.margin                       || 25;
        this.GAME_OVER_FONT                     = `${this.GAME_OVER_FONT_SIZE}px ${this.FONT}`;
        this.GAME_OVER_PRESS_SPACE_TEXT         = texts?.gameover?.pressSpaceToContinueText     || "Press space to continue.";

        this.INITIAL_BODY_LENGTH                = initialBodyLength                             || 3;
        this.INITIAL_FOOD_QUANTITY              = initialFoodQuantity                           || 1;
        this.BODY_INCREMENT_PER_SCORE           = bodyIncrementPerScore                         || 1;

        this.PARENT_ELEMENT                     = parentElement                                 || document.body;

        this.EASY_VELOCITY = 10;
        this.NORMAL_VELOCITY = 13;
        this.HARD_VELOCITY = 17;

        this.FRAMERATE = (() => {
            if(difficulty || difficulty == 0){
                switch(difficulty) {
                    case 0: return this.EASY_VELOCITY;
                    case 1: return this.NORMAL_VELOCITY;
                    case 2: return this.HARD_VELOCITY;
                    default: return this.HARD_VELOCITY;
                }
            }else {
                return this.NORMAL_VELOCITY;
            }
        })();

        this.CANVAS = document.createElement('canvas');
        this.CANVAS.width = this.FIELD_WIDTH * this.PIXEL_SIZE;
        this.CANVAS.height = this.FIELD_HEIGHT * this.PIXEL_SIZE;

        this.CANVAS.tabIndex = 1;

        //Variables
        this.field = [];

        this.countDownInterval;
        this.mainInterval;

        this.tickInterval = 1000 / this.FRAMERATE;
        this.score = 0;

        this.bodyLength = this.INITIAL_BODY_LENGTH;
        this.body = [];

        this.actualSecondsToReturn = this.SECONDS_TO_RETURN_AFTER_PAUSE;

        this.isAnyKeyPressed = false;
        this.isGameRunning = false;
        this.isOnReturningCountDown = false;
        this.isGameOver = false;
        this.isGameWon = false;

        this.movementBuffer = undefined;
    }

    init() {
        this.PARENT_ELEMENT.appendChild(this.CANVAS);
        this.CONTEXT = this.CANVAS.getContext('2d');

        this.startGame();

        this.CANVAS.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.moveDown();
                    break;
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.moveUp();
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.moveRight();
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.moveLeft();
                    break;
                case ' ':
                    if (this.isGameOver || this.isGameWon) this.startGame(true);
                    break;
                case 'Escape':
                    this.CANVAS.blur();
                    break;

            }
        });

        this.CANVAS.addEventListener('focus', () => {
            if(!this.isGameOver) this.startCountDown()
        });
        this.CANVAS.addEventListener('focusout', () => this.clearCountDown());

        this.mainInterval = setInterval(() => this.processAndRenderFrame(), this.tickInterval);
    }

    dispose() {
        clearInterval(this.mainInterval);
        this.PARENT_ELEMENT.removeChild(this.CANVAS);
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

        this.clearScreenAndSetBackground();
        
        for(let i = 0; i < this.INITIAL_FOOD_QUANTITY; i ++) {
            this.spawnFood();
        }


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
        this.CONTEXT.lineWidth = this.SNAKE_OUTLINE_WIDTH;
        this.CONTEXT.fillStyle = this.SNAKE_COLOR;
        this.CONTEXT.strokeStyle = this.SNAKE_OUTLINE_COLOR;

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

    clearScreenAndSetBackground() {
        this.CONTEXT.filter = "brightness(100%)";
        this.CONTEXT.fillStyle = this.BACKGROUND_COLOR;
        this.CONTEXT.fillRect(0, 0, this.CANVAS.width, this.CANVAS.height);
    }

    /**
     * Processes and render the next frame
     */
    processAndRenderFrame() {

        this.clearScreenAndSetBackground();

        if (this.isGameRunning) {

            this.processNextSnakeStep();

            //In case two buttons are pressed in the same frame, the second one will be fired after processing the current one
            if(this.movementBuffer != undefined){
                this.isAnyKeyPressed = false;
                switch(this.movementBuffer){
                    case 'down': this.moveDown(); break;
                    case 'up': this.moveUp(); break;
                    case 'right': this.moveRight(); break;
                    case 'left': this.moveLeft(); break;
                }
                this.movementBuffer = undefined;
            }
        }

        //Render next frame
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

        //Checks which text will br printed on the screen
        if (!this.isGameRunning) {
            if (this.isOnReturningCountDown) {
                this.printCenteredText(this.actualSecondsToReturn, this.COUNT_DOWN_FONT);
            } else if (this.isGameOver) {
                this.printGameOverText();
            } else if (this.isGameWon) {
                this.printGameWonText();
            } else {
                this.printLostFocusText();
            }
        } 

        this.printScore();

        //Avoid moving the snake twice on the same frame
        this.isAnyKeyPressed = false;

    }


    print(text, x, y) {
        this.CONTEXT.strokeStyle = this.FONT_OUTLINE_COLOR;
        this.CONTEXT.lineWidth = this.FONT_OUTLINE_WIDTH;
        this.CONTEXT.strokeText(text, x, y);
        this.CONTEXT.fillStyle = this.FONT_COLOR;
        this.CONTEXT.fillText(text, x, y);
    }

    printCenteredText(text, font, yOffset = 0) {
        this.CONTEXT.font = font;
        this.CONTEXT.textAlign = 'center';
        this.print(text, this.CANVAS.width / 2, this.CANVAS.height / 2 - yOffset);
    }

    printScore() {
        this.CONTEXT.font = this.SCORE_FONT;
        this.CONTEXT.textAlign = 'left';
        this.print(`${this.SCORE_TEXT} ${this.score}`, this.SCORE_POSITION_MARGIN, this.CANVAS.height - this.SCORE_POSITION_MARGIN)
    }

    printLostFocusText() {
        this.printCenteredText(this.PAUSED_TEXT, this.PAUSED_FONT);
    }

    printGameOverText() {
        this.printCenteredText(this.GAME_OVER_MAIN_TEXT, this.GAME_OVER_FONT, this.GAME_OVER_MARGIN_BETWEEN_LINES);
        this.printCenteredText(this.GAME_OVER_PRESS_SPACE_TEXT, this.GAME_OVER_FONT, -this.GAME_OVER_MARGIN_BETWEEN_LINES);
    }

    printGameWonText() {
        this.printCenteredText(this.YOU_WON_MAIN_TEXT, this.GAME_OVER_FONT, this.GAME_OVER_MARGIN_BETWEEN_LINES);
        this.printCenteredText(this.YOU_WON_PRESS_SPACE_TEXT, this.GAME_OVER_FONT, -this.GAME_OVER_MARGIN_BETWEEN_LINES);
    }


    moveDown() {
        if (this.PLAYER.dirY != -1 && !this.isAnyKeyPressed && this.isGameRunning) {
            this.PLAYER.dirX = 0;
            this.PLAYER.dirY = 1;
            this.isAnyKeyPressed = true;
        } else if (this.PLAYER.dirY != -1 && this.isAnyKeyPressed && this.isGameRunning) {
            this.addMovementToBuffer('down');
        }
    }

    moveUp() {
        if (this.PLAYER.dirY != 1 && !this.isAnyKeyPressed && this.isGameRunning) {
            this.PLAYER.dirX = 0;
            this.PLAYER.dirY = -1;
            this.isAnyKeyPressed = true;
        } else if (this.PLAYER.dirY != 1 && this.isAnyKeyPressed && this.isGameRunning) {
            this.addMovementToBuffer('up');
        }
    }

    moveRight() {
        if (this.PLAYER.dirX != -1 && !this.isAnyKeyPressed && this.isGameRunning) {
            this.PLAYER.dirX = 1;
            this.PLAYER.dirY = 0;
            this.isAnyKeyPressed = true;
        } else if (this.PLAYER.dirX != -1 && this.isAnyKeyPressed && this.isGameRunning) {
            this.addMovementToBuffer('right');
        }
    }

    moveLeft() {
        if (this.PLAYER.dirX != 1 && !this.isAnyKeyPressed && this.isGameRunning) {
            this.PLAYER.dirX = -1;
            this.PLAYER.dirY = 0;
            this.isAnyKeyPressed = true;
        } else if (this.PLAYER.dirX != 1 && this.isAnyKeyPressed && this.isGameRunning) {
            this.addMovementToBuffer('left');
        }
    }

    addMovementToBuffer(movement) {
        this.movementBuffer = movement
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
        if (this.SECONDS_TO_RETURN_AFTER_PAUSE == 0) {
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
        if (this.isGameOver) return;

        clearInterval(this.countDownInterval);
        this.isOnReturningCountDown = false;
        this.actualSecondsToReturn = this.SECONDS_TO_RETURN_AFTER_PAUSE;
        this.isGameRunning = false;
    }

    gameOver() {
        this.isGameRunning = false;
        this.isGameOver = true;
    }

    gameWon() {
        this.isGameRunning = false;
        this.isGameWon = true;
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
        if(this.checkIfHasSpaceToSpawnFood()){
            this.gameWon();
            return;
        }

        let x, y;
        do {
            x = Math.floor(Math.random() * this.FIELD_WIDTH);
            y = Math.floor(Math.random() * this.FIELD_HEIGHT);
        } while (this.field[x][y] != this.BLANK_SPACE);

        this.field[x][y] = this.FOOD;
    }

    checkIfHasSpaceToSpawnFood() {
        let flag = false;

        for(let x = 0; x < this.FIELD_WIDTH; x ++) {
            for(let y = 0; y < this.FIELD_HEIGHT; y ++) {
                if(this.field[x][y] === this.BLANK_SPACE) {
                    flag = true;
                    break;
                }
            }   
        }

        return !flag;
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