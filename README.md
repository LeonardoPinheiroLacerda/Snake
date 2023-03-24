# How to use:

## Instalation

Using unpkg cnd:
~~~ html
    <script src="https://unpkg.com/snakegamejs-component@1.0.1/snakeGame.js"></script>
~~~

Using npm:
~~~ terminal
    npm i snakegamejs-component
~~~

All arguments on the constructor are optional

~~~js
const snakeGame = new SnakeGameJS(
    {
        dimensions: {
            fieldWidth: 32,
            fieldHeight: 16,
            pixelSize: 25
        },
        colors: {
            snake: {
                body: '#54eb7c',
                outlineColor: '#FFF',
                brightnessGradient: .5
            },
            food: '#FF0000',
            background: '#b0c6e8'
        },
        outlines: {
            snake: 2,
            font: 4,
        },
        texts: {
            font: 'Arial',
            color: 'black',
            outlineColor: 'white',
            score: {
                text: 'Pontos:',
                size: 25,
                margin: 10
            },
            pause: {
                text: 'Clique para jogar',
                size: 40,
            },
            countDown: {
                size: 50,
            },
            gameover: {
                mainText: 'Perdeu!',
                pressSpaceToContinueText: 'Pressione espaço para jogar novamente',
                size: 30,
                margin: 20
            },
            win: {
                mainText: 'Você venceu!',
                pressSpaceToContinueText: 'Pressione espaço para jogar novamente',
            }
        },
        difficulty: 2,
        initialBodyLength: 3,
        bodyIncrementPerScore: 2,
        secondsToReturnAfterPause: 0,
        initialFoodQuantity: 10,
        parentElement: document.querySelector('#game'),
    }
);
//To start the game use the function init
snakeGame.init();

//To stop the game process use the function dispose
~~~