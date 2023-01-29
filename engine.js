//Initializing game main variables
const BLANK_SPACE = 0;
const SNAKE_HEAD = 1;
const SNAKE_BODY = 2;
const FOOD = 3;

const FIELD_WIDTH = 32;
const FIELD_HEIGHT = 16;

const PIXEL_SIZE = 30;
const MARGIN_BETWEEN_PIXELS = 2;

const PLAYER = {
    posX: parseInt(FIELD_WIDTH / 2),
    posY: parseInt(FIELD_HEIGHT / 2),
    dirX: 1,
    dirY: 0
}

let FIELD = (() => {
    const FIELD = [];

    for(let i = 0; i < FIELD_WIDTH; i ++) {
        const row = [];
        for(let j = 0; j < FIELD_HEIGHT; j ++) {
            row.push(BLANK_SPACE);
        }
        FIELD.push(row);
    }

    return FIELD;
})();

FIELD[PLAYER.posX][PLAYER.posY] = SNAKE_HEAD;

const SNAKE_COLOR = '#54eb7c';
const SNAKE_BORDER_COLOR = 'white';
const FOOD_COLOR = 'red';
const BACKGROUND_COLOR = '#b0c6e8';

const FRAMERATE = 25;
const TICK_INTERVAL = 1000 / FRAMERATE;


const canvas = document.createElement('canvas');
canvas.width = FIELD_WIDTH * PIXEL_SIZE;
canvas.height = FIELD_HEIGHT * PIXEL_SIZE;

document.body.appendChild(canvas);

const context = canvas.getContext('2d');

let score = 0;
const SCORE_FONT = "30px Arial";
const SCORE_COLOR = "black";
const SCORE_POSITION = {
    x: 10,
    y: canvas.height - 10
}

let bodyLength = 3;
const BODY = [];


//Rendering functions
function getPixelPositionWithCoordinates (x, y) {
    // x *= PIXEL_SIZE + MARGIN_BETWEEN_PIXELS;
    // y *= PIXEL_SIZE + MARGIN_BETWEEN_PIXELS;

    // const width = PIXEL_SIZE - MARGIN_BETWEEN_PIXELS;
    // const height = PIXEL_SIZE - MARGIN_BETWEEN_PIXELS;

    x *= PIXEL_SIZE;
    y *= PIXEL_SIZE;

    const width = PIXEL_SIZE;
    const height = PIXEL_SIZE;

    return {
        x,
        y,
        width,
        height
    }
}

function drawSnakePixel(px, py) {
    
    context.fillStyle = SNAKE_COLOR;
    context.strokeStyle  = SNAKE_BORDER_COLOR;


    const {x, y, width, height} = getPixelPositionWithCoordinates(px, py);

    context.fillRect(x, y, width, height);
    context.filter = "brightness(100%)";
    context.strokeRect(x, y, width, height);
}

function drawFood(px, py) {
    context.fillStyle = FOOD_COLOR;

    const {x, y, width, height} = getPixelPositionWithCoordinates(px, py);

    context.fillRect(x, y, width, height);
}


//100 - 30
function renderFrame() {
    context.filter = "brightness(100%)";
    context.fillStyle = BACKGROUND_COLOR;
    context.fillRect(0, 0, canvas.width, canvas.height);

    moveSnake();

    
    for(let x = 0; x < FIELD_WIDTH; x ++) {
        for(let y = 0; y < FIELD_HEIGHT; y ++) {

            switch (FIELD[x][y]) {
                case SNAKE_HEAD: context.filter = "brightness(30%)"; drawSnakePixel(x, y); break;
                case FOOD: context.filter = "brightness(100%)"; drawFood(x, y); break;
            }
        }
    }   
    
    for(let i = 0; i < BODY.length; i ++) {
        const pixel = BODY[i];
        
        const scale = ((70 * i) / BODY.length);

        context.filter = `brightness(${100 - scale}%)`;
        drawSnakePixel(pixel.x, pixel.y);
    }
    
    
    context.font = SCORE_FONT;
    context.fillStyle = SCORE_COLOR;
    context.fillText(`Score: ${score}`, SCORE_POSITION.x, SCORE_POSITION.y);
}

//Food functions
function spawnFood() { 
    let x, y;
    do {
        x = Math.floor(Math.random() * FIELD_WIDTH);
        y = Math.floor(Math.random() * FIELD_HEIGHT);
    }while(FIELD[x][y] != 0);

    FIELD[x][y] = FOOD;
}

//Snake function
function moveSnake() {
    
    const processBody = () => {
        for(let x = 0; x < FIELD_WIDTH; x ++) {
            for(let y = 0; y < FIELD_HEIGHT; y ++) {
                if(FIELD[x][y] == SNAKE_BODY) {
                    FIELD[x][y] = BLANK_SPACE;
                }
            }
        }
        
        for(let i = 0; i < BODY.length; i ++) {
            const {x, y} = BODY[i];
            FIELD[x][y] = SNAKE_BODY;
        }


    }

    const move = (x, y) => {
        PLAYER.posX = x + PLAYER.dirX;
        PLAYER.posY = y + PLAYER.dirY;

        FIELD[x][y] = BLANK_SPACE;
        FIELD[PLAYER.posX][PLAYER.posY] = SNAKE_HEAD;

        if(BODY.length >= bodyLength) {
            BODY.shift();
        }
        BODY.push({x, y});

        processBody();
    }
    
    for(let x = 0; x < FIELD_WIDTH; x ++) {
        for(let y = 0; y < FIELD_HEIGHT; y ++) {

            if(FIELD[x][y] == SNAKE_HEAD) {

                try{
                    switch(FIELD[x + PLAYER.dirX][y + PLAYER.dirY]) {
                        case BLANK_SPACE: 
                            move(x, y); 
                            return;

                        case FOOD: 
                            score += 1;
                            bodyLength += 1; 
                            move(x, y); 
                            spawnFood(); 
                            return;
                    }
                }catch(err) {
                    //alert("You died"); 
                    return;
                }

            }       
        }
    }
}


//Key mapping
document.body.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowDown':
            if(PLAYER.dirY != -1){
                PLAYER.dirX = 0;
                PLAYER.dirY = 1;
            }    
            break;
        case 'ArrowUp':
            if(PLAYER.dirY != 1){
                PLAYER.dirX = 0;
                PLAYER.dirY = -1;
            }
            break;
        case 'ArrowRight':
            if(PLAYER.dirX != -1){
                PLAYER.dirX = 1;
                PLAYER.dirY = 0;
            }
            break;
        case 'ArrowLeft':
            if(PLAYER.dirX != 1){
                PLAYER.dirX = -1;
                PLAYER.dirY = 0;
            }
            break;
        
    }
})

spawnFood();


setInterval(renderFrame, TICK_INTERVAL);