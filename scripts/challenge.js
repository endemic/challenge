const EMPTY = 0;
const PLAYER = {
    'left': 10,
    'right': 11,
    'up': 12,
    'down': 13
};
const WALL = 2;
const CHIP = 3;
const ENEMY = 4;
const BLOCK = 5; // movable block, sokoban style
const EXIT = 6;
const WATER = 7;
const GREEN_KEY = 14;
const GREEN_LOCK = 15;
const BLUE_KEY = 16;
const BLUE_LOCK = 17;
const RED_KEY = 18;
const RED_LOCK = 19;
const YELLOW_KEY = 20;
const YELLOW_LOCK = 21;
const SOCKET = 22;

// TODO: need a map editor :(
// need to include map width/height in data structure
// in this representation, the upper left corner is (0,0); x increases
// as you go down, y increases as you go right
const MAP = [
    [0, 0, 0, 2,  2,  2,  2, 2,  2,  2,  0, 0, 0,  0],
    [0, 0, 0, 2,  0,  0,  2, 0,  0,  2,  0, 0, 0,  0],
    [2, 2, 2, 2,  20, 3,  2, 3,  0,  2,  0, 0, 0,  0],
    [2, 0, 0, 2,  0,  0,  2, 0,  0,  2,  0, 0, 0,  0],
    [2, 0, 3, 2,  17, 2,  2, 2,  19, 2,  2, 2, 2,  2],
    [2, 0, 0, 15, 0,  16, 3, 16, 0,  2,  0, 0, 0,  2],
    [2, 2, 2, 2,  0,  0,  0, 0,  0,  21, 0, 3, 14, 2],
    [0, 2, 6, 22, 0,  0,  0, 0,  3,  2,  2, 2, 2,  2],
    [2, 2, 2, 2,  0,  0,  0, 0,  0,  21, 0, 3, 0,  2],
    [2, 0, 0, 15, 0,  18, 3, 18, 0,  2,  0, 0, 0,  2],
    [2, 0, 3, 2,  19, 2,  2, 2,  17, 2,  2, 2, 2,  2],
    [2, 0, 0, 2,  0,  0,  2, 0,  0,  2,  0, 0, 0,  0],
    [2, 2, 2, 2,  20, 3,  2, 3,  0,  2,  0, 0, 0,  0],
    [0, 0, 0, 2,  0,  0,  2, 0,  0,  2,  0, 0, 0,  0],
    [0, 0, 0, 2,  2,  2,  2, 2,  2,  2,  0, 0, 0,  0],
];

const MAP_WIDTH = 15;
const MAP_HEIGHT = 14;

// enemies and items should be able to be placed in the map
// items can be kept in the map data; when the player moves on to them they are "collected"
// and then the cell data is changed to "empty"
// enemy positions will be parsed into an in-memory data structure (because they have the ability to move)
// and the original value of the cell can be changed to "empty" after that initial read

// need to have an update loop that runs independently of player movement, so enemies can move
// even when the player is not moving

class Challenge extends Grid {
    cssClassMap = {
        0: 'empty',
        1: 'player',
        2: 'wall',
        3: 'chip',
        4: 'enemy',
        5: 'block',
        6: 'exit',
        7: 'water',
        10: 'player-left',
        11: 'player-right',
        12: 'player-up',
        13: 'player-down',
        14: 'green-key',
        15: 'green-lock',
        16: 'blue-key',
        17: 'blue-lock',
        18: 'red-key',
        19: 'red-lock',
        20: 'yellow-key',
        21: 'yellow-lock',
        22: 'socket'
    };

    constructor() {
        let rows = 11;
        let columns = 11;

        super(rows, columns);

        // TODO: parse map data to find player position
        this.player = {
            x: 7,
            y: 6,
            direction: 'down'
        };

        this.inventory = [];

        // hard-coded for first level
        this.chipsLeft = 11;

        this.time = 100;

        this.renderMap();

        this.gameOver = false;

        window.addEventListener('keydown', this.onKeyDown.bind(this));

        const gridRef = document.querySelector('#grid');
        grid.addEventListener('touchstart', e => console.log('TODO touchstart'));

        // update enemy state independently of player movement
        window.setInterval(this.moveEnemies.bind(this), 500);

        // decrease timer
        window.setInterval(() => {
          this.time -= 1;

          // TODO: update display

          if (this.time === 0) {
            alert('ran out of time, or something!');
          }
        }, 1000);
    }

    renderMap() {
        let state = this.displayStateCopy();

        // similar to something like minesweeper, in this game the grid is just for display,
        // rather than both display _and_ game state. we have a level map stored in a separate
        // data structure, and use the player's current location in the map to determine
        // which parts to render to the screen (e.g. the bits that the player is close to)

        // determine where to start drawing the map onto the visible game grid
        let startX;
        let startY;

        // TODO: get rid of these magic numbers

        // player is too close to the right edge of the map
        if (this.player.x >= MAP_WIDTH - 5) {
            startX = MAP_WIDTH - 11;
        } else {
            // ensure no negative drawing index
            startX = this.player.x - 5 < 0 ? 0 : this.player.x - 5;
        }

        // player is too close to the bottom of the map
        if (this.player.y >= MAP_HEIGHT - 5) {
            startY = MAP_HEIGHT - 11;
        } else {
            // ensure no negative drawing index
            startY = this.player.y - 5 < 0 ? 0 : this.player.y - 5;
        }

        // draw the area of the map that the player is in
        for (let x = 0; x < this.columns; x += 1) {
            for (let y = 0; y < this.rows; y += 1) {
                state[x][y] = MAP[startX + x][startY + y];
            }
        }

        // NOTE: the player always will be rendered in the middle of the grid,
        // unless they are close to a wall
        let playerDrawX = 5;
        let playerDrawY = 5;

        // TODO: combine these conditions w/ the map drawing above

        if (startX === 0 && this.player.x < 5) {
            playerDrawX = this.player.x;
        }

        if (startY === 0 && this.player.y < 5) {
            playerDrawY = this.player.y;
        }

        if (startX === MAP_WIDTH - 11 && this.player.x >= MAP_WIDTH - 5) {
            // what should this value be?
            playerDrawX = this.player.x - startX;
        }

        if (startY === MAP_HEIGHT - 11 && this.player.y >= MAP_HEIGHT - 5) {
            playerDrawY = this.player.y - startY;
        }

        state[playerDrawX][playerDrawY] = PLAYER[this.player.direction];
        console.log(this.player.direction)

        this.render(state);
    }

    moveEnemies() {
        // enumerate through enemy list, and move them as needed;
        // call `renderMap` if they are within viewing bounds of the player
    }

    onKeyDown(event) {
        if (this.gameOver) {
            return;
        }

        let next = {
            x: this.player.x,
            y: this.player.y
        };

        switch (event.key) {
            case 'a':
            case 'ArrowLeft':
                // move left
                next.x -= 1;
                this.player.direction = 'left';
                break;
            case 'd':
            case 'ArrowRight':
                // move right
                next.x += 1;
                this.player.direction = 'right';
                break;
            case 'w':
            case 'ArrowUp':
                // move up
                next.y -= 1;
                this.player.direction = 'up';
                break;
            case 's':
            case 'ArrowDown':
                // move down
                next.y += 1;
                this.player.direction = 'down';
                break;
        }

        // basic collision detection
        if (MAP[next.x][next.y] === EMPTY) {
            this.player.x = next.x;
            this.player.y = next.y;
        }

        // allow pickups
        if (MAP[next.x][next.y] === CHIP) {
            this.chipsLeft -= 1;

            MAP[next.x][next.y] = EMPTY;

            // TODO: play sfx

            this.player.x = next.x;
            this.player.y = next.y;
        }

        // keys
        if ([GREEN_KEY, YELLOW_KEY, RED_KEY, BLUE_KEY].includes(MAP[next.x][next.y])) {
            this.inventory.push(MAP[next.x][next.y]);

            MAP[next.x][next.y] = EMPTY;

            // TODO: play sfx

            this.player.x = next.x;
            this.player.y = next.y;
        }

        // locks
        if (MAP[next.x][next.y] === BLUE_LOCK && this.inventory.includes(BLUE_KEY)) {
            // remove key from inventory
            this.inventory.splice(
                this.inventory.indexOf(BLUE_KEY),
                1
            );

            MAP[next.x][next.y] = EMPTY;

            // TODO: play sfx

            this.player.x = next.x;
            this.player.y = next.y;
        }

        if (MAP[next.x][next.y] === GREEN_LOCK && this.inventory.includes(GREEN_KEY)) {
            // weirdly, a green key can be used any number of times

            MAP[next.x][next.y] = EMPTY;

            // TODO: play sfx

            this.player.x = next.x;
            this.player.y = next.y;
        }

        if (MAP[next.x][next.y] === YELLOW_LOCK && this.inventory.includes(YELLOW_KEY)) {
            // remove key from inventory
            this.inventory.splice(
                this.inventory.indexOf(YELLOW_KEY),
                1
            );

            MAP[next.x][next.y] = EMPTY;

            // TODO: play sfx

            this.player.x = next.x;
            this.player.y = next.y;
        }

        if (MAP[next.x][next.y] === RED_LOCK && this.inventory.includes(RED_KEY)) {
            // remove key from inventory
            this.inventory.splice(
                this.inventory.indexOf(RED_KEY),
                1
            );

            MAP[next.x][next.y] = EMPTY;

            // TODO: play sfx

            this.player.x = next.x;
            this.player.y = next.y;
        }

        // socket
        if (MAP[next.x][next.y] === SOCKET && this.chipsLeft === 0) {
            MAP[next.x][next.y] = EMPTY;

            // TODO: play sfx

            this.player.x = next.x;
            this.player.y = next.y;
        }

        // move blocks
        if (MAP[next.x][next.y] === BLOCK) {
            // TODO
        }

        // TODO: if the player background image has transparency, CSS can be layered
        // such that we can show the player on top of another tile
        if (MAP[next.x][next.y] === EXIT) {
            this.player.x = -99;
            this.player.y = -99;

            window.alert('You found the exit!');
        }

        this.renderMap();
    }
}
