class SnakeGameJS {

    constructor() {
        this.blankSpaceCode = 0;
        this.snakeHeadCode = 1;
        this.snakeBodyCode = 2;
        this.foodCode = 3;

        this.fieldWidth = 32;
        this.fieldHeight = 16;
        this.field = [];

        this.pixelSize = 25;

        this.player = {
            posX: parseInt(this.fieldWidth / 2),
            posY: parseInt(this.fieldHeight / 2),
            dirX: 0,
            dirY: 0
        }

        this.snakeColor = '#54eb7c';
        this.snakeBorderColor = '#FFFFFF';
        this.foodColor = '#FF0000';
        this.backgroundColor = '#b0c6e8';

        this.framerate = 25;
        this.tickInterval = 1000 / this.framerate;

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.fieldWidth * this.pixelSize;
        this.canvas.height = this.fieldHeight * this.pixelSize;

        this.canvas.tabIndex = 1;

        this.score = 0;
        this.scoreFont = "30px Arial";
        this.scoreColor = "black";
        this.scorePosition = {
            x: 10,
            y: this.canvas.height - 10
        }

        this.bodyLength = 3;
        this.body = [];

        this.isAnyKeyPressed = false;
    }

    init() {
        this.player.dirX = 1;

        this.field = this.clearField();
        this.field[this.player.posX][this.player.posY] = this.snakeHeadCode;
        document.body.appendChild(this.canvas);

        this.context = this.canvas.getContext('2d');

        this.spawnFood();

        //Key mapping
        this.canvas.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowDown':
                    if (this.player.dirY != -1 && !this.isAnyKeyPressed) {
                        this.player.dirX = 0;
                        this.player.dirY = 1;
                        this.isAnyKeyPressed = true;
                    }
                    break;
                case 'ArrowUp':
                    if (this.player.dirY != 1 && !this.isAnyKeyPressed) {
                        this.player.dirX = 0;
                        this.player.dirY = -1;
                        this.isAnyKeyPressed = true;
                    }
                    break;
                case 'ArrowRight':
                    if (this.player.dirX != -1 && !this.isAnyKeyPressed) {
                        this.player.dirX = 1;
                        this.player.dirY = 0;
                        this.isAnyKeyPressed = true;
                    }
                    break;
                case 'ArrowLeft':
                    if (this.player.dirX != 1 && !this.isAnyKeyPressed) {
                        this.player.dirX = -1;
                        this.player.dirY = 0;
                        this.isAnyKeyPressed = true;
                    }
                    break;

            }
        });

        setInterval(() => this.renderFrame(), this.tickInterval);
    }

    //Rendering functions
    getPixelPositionWithCoordinates(x, y) {
        x *= this.pixelSize;
        y *= this.pixelSize;

        const width = this.pixelSize;
        const height = this.pixelSize;

        return {
            x,
            y,
            width,
            height
        }
    }

    drawSnakePixel(px, py) {
        this.context.fillStyle = this.snakeColor;
        this.context.strokeStyle = this.snakeBorderColor;

        const { x, y, width, height } = this.getPixelPositionWithCoordinates(px, py);

        this.context.fillRect(x, y, width, height);
        this.context.filter = "brightness(100%)";
        this.context.strokeRect(x, y, width, height);
    }

    drawFood(px, py) {
        this.context.fillStyle = this.foodColor;

        const { x, y, width, height } = this.getPixelPositionWithCoordinates(px, py);

        this.context.fillRect(x, y, width, height);
    }

    renderFrame() {
        this.context.filter = "brightness(100%)";
        this.context.fillStyle = this.backgroundColor;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.moveSnake();

        for (let x = 0; x < this.fieldWidth; x++) {
            for (let y = 0; y < this.fieldHeight; y++) {

                switch (this.field[x][y]) {
                    case this.snakeHeadCode:
                        this.context.filter = "brightness(30%)";
                        this.drawSnakePixel(x, y);
                        break;
                    case this.foodCode:
                        this.context.filter = "brightness(100%)";
                        this.drawFood(x, y);
                        break;
                }
            }
        }

        for (let i = 0; i < this.body.length; i++) {
            const pixel = this.body[i];

            const scale = ((70 * i) / this.body.length);

            this.context.filter = `brightness(${100 - scale}%)`;
            this.drawSnakePixel(pixel.x, pixel.y);
        }

        this.context.font = this.scoreFont;
        this.context.fillStyle = this.scoreColor;
        this.context.fillText(`Score: ${this.score}`, this.scorePosition.x, this.scorePosition.y);

        this.isAnyKeyPressed = false
    }

    //Snake function
    moveSnake() {

        const processBody = () => {
            for (let x = 0; x < this.fieldWidth; x++) {
                for (let y = 0; y < this.fieldHeight; y++) {
                    if (this.field[x][y] == this.snakeBodyCode) {
                        this.field[x][y] = this.blankSpaceCode;
                    }
                }
            }

            for (let i = 0; i < this.body.length; i++) {
                const { x, y } = this.body[i];
                this.field[x][y] = this.snakeBodyCode;
            }
        }

        const move = (x, y) => {
            this.player.posX = x + this.player.dirX;
            this.player.posY = y + this.player.dirY;

            this.field[x][y] = this.blankSpaceCode;
            this.field[this.player.posX][this.player.posY] = this.snakeHeadCode;

            if (this.body.length >= this.bodyLength) {
                this.body.shift();
            }
            this.body.push({ x, y });

            processBody();
        }

        for (let x = 0; x < this.fieldWidth; x++) {
            for (let y = 0; y < this.fieldHeight; y++) {


                if (this.field[x][y] == this.snakeHeadCode) {
                    try {
                        switch (this.field[x + this.player.dirX][y + this.player.dirY]) {
                            case this.blankSpaceCode:
                                move(x, y);
                                return;

                            case this.foodCode:
                                this.score += 1;
                                this.bodyLength += 1;
                                move(x, y);
                                this.spawnFood();
                                return;
                            
                        }
                    } catch (err) {
                        //alert("You died"); 
                        return;
                    }

                }
            }
        }
    }

    clearField = () => {
        const tmpField = [];

        for (let i = 0; i < this.fieldWidth; i++) {
            const row = [];
            for (let j = 0; j < this.fieldHeight; j++) {
                row.push(this.blankSpaceCode);
            }
            tmpField.push(row);
        }

        return tmpField;
    };


    spawnFood() {
        let x, y;
        do {
            x = Math.floor(Math.random() * this.fieldWidth);
            y = Math.floor(Math.random() * this.fieldHeight);
        } while (this.field[x][y] != 0);

        this.field[x][y] = this.foodCode;
    }



}