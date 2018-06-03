/* global Phaser, console */
/* eslint no-unused-vars: "off"*/
class Game extends Phaser.State {
    constructor () {
        super()
    }

    preload () {
        this.game.load.image('player', 'assets/player.png')
        this.game.load.image('background', 'assets/background.png')
        this.game.load.image('foe', 'assets/foe.png')
        this.game.load.image('bullet','assets/bullet.png')
        this.game.load.image('foesBullet','assets/foesBullet.png')
    }


    create () {
        this.bulletTime = 0;
        this.bulletSpeed = 300;
        this.hp = 3;
        this.invincibilityTime = 0;
        this.keys = {
            up : 0,
            down : 0,
            shoot : 0,
            left : 0,
            right : 0
        }

        console.log("Game!")
        this.background = this.game.add.sprite(0,0,'background')
        this.background.width = this.game.width
        this.background.height = this.game.height
        this.background.inputEnabled = true
        this.background.events.onInputDown.add(() => this.shoot(),this)

        // Sprites
        this.player = this.game.add.sprite(0,0,'player')
        this.player.y = window.innerHeight - this.player.height / 2
        this.player.x = window.innerWidth / 2
        this.player.anchor.setTo(0.5,0.5)
        // Bullets
        this.foes = this.game.add.group();
        this.foes.enableBody = true;
        this.foes.physicsBodyType = Phaser.Physics.ARCADE

        this.bullets = this.game.add.group();
        this.bullets.enableBody = true;
        this.bullets.physicsBodyType = Phaser.Physics.ARCADE;

        for (let i = 0; i < 20; i++) {

            let b = this.bullets.create(0, 0, 'bullet');
            b.name = 'bullet' + i;
            b.exists = false;
            b.visible = false;
            b.checkWorldBounds = true;
            b.events.onOutOfBounds.add((bullet) => bullet.kill(), this);
        }
        this.foesBullets = this.game.add.group();
        this.foesBullets.enableBody = true;
        this.foesBullets.physicsBodyType = Phaser.Physics.ARCADE;

        for (let i = 0; i < 20; i++) {
            let b = this.foesBullets.create(0, 0, 'foesBullet');
            b.name = 'foesBullet' + i;
            b.exists = false;
            b.visible = false;
            b.checkWorldBounds = true;
            b.events.onOutOfBounds.add((bullet) => bullet.kill(), this);
        }


        // Inputs
        this.bindKey('up', [Phaser.Keyboard.Z, Phaser.Keyboard.UP])
        this.bindKey('down', [Phaser.Keyboard.S, Phaser.Keyboard.DOWN])
        this.bindKey('left', [Phaser.Keyboard.Q, Phaser.Keyboard.LEFT])
        this.bindKey('right', [Phaser.Keyboard.D, Phaser.Keyboard.RIGHT])
        this.bindKey('shoot',[Phaser.Keyboard.SPACEBAR],() => this.foesShoot())

        this.bindKey(null, [Phaser.Keyboard.G], () => this.addFoe())
        this.bindKey('wow',[Phaser.Keyboard.A])

        // Physique
        this.game.physics.enable(this.player,Phaser.Physics.ARCADE)

        // Interface
        console.log("Vies : " + this.hp)
        this.lives = this.game.add.text(0, 0,"Vies : " + this.hp, {font: "65px Arial", fill: "#ff0044", align: "center"});
    }

    update () {
        this.game.physics.arcade.overlap(this.bullets, this.foes, (bullet,foe) => {
            bullet.kill()
            foe.kill()
            foe.destroy()
        } , null, this);
        this.game.physics.arcade.overlap(this.foesBullets, this.player, (player,foeBullet) => {
            foeBullet.kill()
            this.playerGetHit();
        } , null, this);

        this.player.body.velocity.y = 0
        this.player.body.velocity.x = 0
        this.movePlayer()
        this.player.rotation = this.game.physics.arcade.angleToPointer(this.player) + Math.PI / 2;
        this.foes.forEachAlive(foe => foe.rotation = this.game.physics.arcade.angleBetween(this.player, foe) - Math.PI / 2)
    }
    bindKey (index, keys, onUp = null, onDown = null) {
        keys.forEach(key => {

            const registredKey = this.game.input.keyboard.addKey(key)
            registredKey.onDown.add(() => {
                if (index != null) {
                    this.keys[index] = 1
                } else if (onDown != null) {
                    onDown()
                }
            }, this)

            registredKey.onUp.add(() => {
                if (index != null) {
                    this.keys[index] = 0
                } else if (onUp != null) {
                    onUp()
                }
            }, this)
        })
    }
    _startGame () {
        console.log("hello")
    }
    movePlayer () {
        if (this.keys.left && !this.keys.right) {
            this.player.body.velocity.x = -300
        }else if (this.keys.right) {
            this.player.body.velocity.x = +300
        }
        if (this.keys.up && !this.keys.down) {
            this.player.body.velocity.y = -300
        }else if (this.keys.down) {
            this.player.body.velocity.y = +300
        }


        if (this.keys.shoot) {
            this.foesShoot()
            console.log(this.foesBullets.length); 
        }
        if (this.keys.wow) {
            console.log("hey" + this.foes.length)
        }
    }
    shoot () {

        if (this.game.time.now > this.bulletTime) {
            const bullet = this.bullets.getFirstExists(false)

            if (bullet) {
                bullet.reset(this.player.x, this.player.y )
                bullet.anchor.setTo(0.5,0.5)
                let angle = this.game.physics.arcade.angleToPointer(this.player)
                bullet.body.velocity.x = this.bulletSpeed * Math.cos(angle)
                bullet.body.velocity.y = this.bulletSpeed * Math.sin(angle)
                bullet.rotation = angle + Math.PI / 2
                this.bulletTime = this.game.time.now + 150
            }
        }


    }
    addFoe () {
        let c = this.foes.create(this.game.world.randomX, this.game.world.randomY, 'foe')
        c.body.immovable = true;
        c.anchor.setTo(0.5,0.5)
        c.bulletTime = 0
    }
    foesShoot () {
        this.foes.forEach((foe) => this.addFoesBullet(foe))
    }
    addFoesBullet (foe) {
        if (this.game.time.now > foe.bulletTime) {
            let bullet = this.foesBullets.getFirstExists(false)
            if (!bullet) {
                bullet = this.initFoesBullet();
            }

            // bullet can't be null
            console.log(foe.name)
            bullet.reset(foe.x, foe.y )
            bullet.anchor.setTo(0.5,0.5)
            let angle = this.game.physics.arcade.angleBetween(foe,this.player)
            bullet.body.velocity.x = this.bulletSpeed * Math.cos(angle)
            bullet.body.velocity.y = this.bulletSpeed * Math.sin(angle)
            bullet.rotation = angle + Math.PI / 2
            foe.bulletTime = this.game.time.now + 200
        }
    }
    playerGetHit () {
        if(this.game.time.now > this.invincibilityTime) {

            this.hp--;
            this.invincibilityTime = this.game.time.now + 1000
            this.lives.setText("Vies :" + this.hp);
        }
        if(this.hp <= 0) {
            // Game Over
            this.player.kill();
        }
    }
    initFoesBullet () {
        let b = this.foesBullets.create(0, 0, 'foesBullet');
        b.name = 'foesBullet' + (this.foesBullets.length + 1);
        b.exists = false;
        b.visible = false;
        b.checkWorldBounds = true;
        b.events.onOutOfBounds.add((bullet) => bullet.kill(), this);
        return b
    }

}
