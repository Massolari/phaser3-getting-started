let platforms;
let stars;
let cursors;
let player;
let turbo;
let particles;
let emitter;
let timer;
let score = 0;
let scoreText;
let turboText;

const turboDuration = 1500;
let counting = turboDuration;

let bombs;
let gameOver = false;
const touchDevice = ('ontouchstart' in document.documentElement);
let btnLeftPressed = false;
let btnRightPressed = false;

const enableTurbo = () => {
    clearInterval(timer);
    counting = turboDuration;
    turbo = true;
    emitter.start();
    timer = setInterval(() => {
        counting -= 100;
        if (counting > 0) {
            updateTurboText();
            return;
        }
        turbo = false;
        emitter.stop();
        clearInterval(timer);
        counting = turboDuration;
        clearTurboText();
    }, 100);
};

const updateScoreText = () => scoreText.setText(`Score: ${score}`);

const updateTurboText = () => turboText.setText(`Turbo: ${counting / 1000}`);

const clearTurboText = () => turboText.setText('');

const addScore = value => {
    score += value;
    updateScoreText();
};

const createBomb = () => {
    const x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
    const bomb = bombs.create(x, 16, 'bomb').setScale(2);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    bomb.setBounce(1);
};

const playerMove = (speed, anim) => {
    player.setVelocityX(speed);
    player.anims.play(anim, true);
};

const playerMoveLeft = () => playerMove(-((turbo) ? 320 : 160), 'left');


const playerMoveRight = () => playerMove((turbo) ? 320 : 160, 'right');

const playerStop = () => playerMove(0, 'turn');

const playerJump = () => player.setVelocityY(-500);

const createVirtualButtons = (context) => {
    const btnConfig = {
        fontSize: '30px',
        fill: '#FFF'
    };
    context.add.text(50, 550, 'Left', btnConfig)
        .setInteractive()
        .on('pointerdown', () => {
            btnLeftPressed = true;
            btnRightPressed = false;
        });

    context.add.text(180, 550, 'Right', btnConfig)
        .setInteractive()
        .on('pointerdown', () => {
            btnRightPressed = true;
            btnLeftPressed = false;
        });

    context.add.text(600, 550, 'Jump', btnConfig)
        .setInteractive()
        .on('pointerdown', () => {
            playerJump();
        });
};

const preload = function() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.image('red', 'http://labs.phaser.io/assets/particles/red.png');
    this.load.spritesheet('dude',
        'assets/dude.png',
        { frameWidth: 32, frameHeight: 48 }
    );
};

const create = function() {
    const { centerX, centerY } = this.cameras.main;
    const { width, height } = this.cameras.main.worldView;

    // this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'sky');
    this.add.image(centerX, centerY, 'sky');

    platforms = this.physics.add.staticGroup();
    platforms.create(centerX, height - 32, 'ground').setScale(2).refreshBody();
    platforms.create(centerX + 200, centerY + 100, 'ground');
    platforms.create(centerX - 350, centerY - 50, 'ground');
    platforms.create(centerX + 350, centerY - 80, 'ground');

    // this.add.image(0, centerY - 120, 'star').setOrigin(0, 0);
    particles = this.add.particles('red');

    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: {
            x: 12,
            y: 0,
            stepX: 70
        }
    });
    stars.children.iterate(child => child.setBounceY(Phaser.Math.FloatBetween(0.2, 0.5)));

    bombs = this.physics.add.group();

    player = this.physics.add.sprite(100, 450, 'dude');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    player.body.setGravityY(300);

    this.physics.add.collider(player, platforms);
    this.physics.add.collider(player, bombs, (player, bomb) => {
        this.physics.pause();
        player.setTint(0xff0000);
        player.anims.play('turn');
        gameOver = true;
    }, null, this);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms);
    this.physics.add.overlap(player, stars, (player, star) => {
        enableTurbo();
        star.disableBody(true, true);
        addScore(10);
        if (stars.countActive(true) === 0) {
            stars.children.iterate(child => child.enableBody(true, child.x, 0, true, true));
            createBomb();
        }
    }, null, this);

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', {
            start: 0,
            end: 3
        }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'turn',
        frames: [{
            key: 'dude',
            frame: 4
        }],
        frameRate: 20
    });
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', {
            start: 5,
            end: 8
        }),
        frameRate: 10,
        repeat: -1
    });

    cursors = this.input.keyboard.createCursorKeys();

    emitter = particles.createEmitter({
        speed: 1,
        scale: {
            start: 1,
            end: 0
        },
        blendMode: 'SCREEN'
    });
    emitter.startFollow(player);
    emitter.stop();

    const textConfig = {
        fontSize: '22px',
        fill: '#000'
    };
    scoreText = this.add.text(16, 10, `Score: ${score}`, textConfig);
    turboText = this.add.text(width - 150, 10, '', textConfig);
    createBomb();
    if (touchDevice) {
        createVirtualButtons(this);
    }
};

const update = function() {
    const { left, right, up, down } = cursors;
    if (left.isDown || btnLeftPressed) {
        playerMoveLeft();
    } else if (right.isDown || btnRightPressed) {
        playerMoveRight();
    } else {
        playerStop();
    }

    if (up.isDown && (player.body.touching.down || turbo)) {
        playerJump();
    }

    if (down.isDown && !turbo) {
        enableTurbo();
    }
};

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload,
        create,
        update
    }
};

const game = new Phaser.Game(config);
