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
        this.game.load.spritesheet('bullet', 'assets/bullet-sheet.png', 12, 25)
        this.game.load.spritesheet('foesBullet', 'assets/foesBullet-sheet.png', 12, 25)
        this.game.load.image('gamepad','assets/gamepad.png')
        this.game.load.spritesheet('crosshair', 'assets/crosshair-sheet.png', 64, 64)

        this.game.load.image('particule1','assets/particules/particule1.png')
        this.game.load.image('particule2','assets/particules/particule2.png')
        this.game.load.image('particule3','assets/particules/particule3.png')
        this.game.load.image('particule4','assets/particules/particule4.png')
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

        this.playerEmitter = this.game.add.emitter(game.world.centerX, game.world.centerY, 150);
        this.playerEmitter.makeParticles( [ 'particule1', 'particule2', 'particule3', 'particule4' ] );
        this.playerEmitter.setAlpha(.7, 0, 2000);
        this.playerEmitter.setScale(0.8, 0, 0.8, 0, 2000);
        this.playerEmitter.start(false, 2000, 5);

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
            b.animations.add('live');
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
            b.animations.add('live')
            b.checkWorldBounds = true
            b.events.onOutOfBounds.add((bullet) => bullet.kill(), this);
        }

        // UI
        this.gamepadIcon = this.game.add.sprite(10,10,'gamepad')
        this.gamepadIcon.opacity = 1
        this.crosshair = this.game.add.sprite(-999,-999,'crosshair')
        this.crosshair.anchor.setTo(0.5,0.5)
        this.crosshair.animations.add('live')
        this.crosshair.animations.play('live', 5, true)


        // Inputs
        this.gamepad = null
        this.setupInputs()
        this.setupGamepadInputs()
        // Physique
        this.game.physics.enable(this.player,Phaser.Physics.ARCADE)
    }

    setupInputs () {
      this.bindKey('up', [Phaser.Keyboard.Z, Phaser.Keyboard.UP])
      this.bindKey('down', [Phaser.Keyboard.S, Phaser.Keyboard.DOWN])
      this.bindKey('left', [Phaser.Keyboard.Q, Phaser.Keyboard.LEFT])
      this.bindKey('right', [Phaser.Keyboard.D, Phaser.Keyboard.RIGHT])
      this.bindKey('shoot',[Phaser.Keyboard.SPACEBAR],() => this.foesShoot())

      this.bindKey(null, [Phaser.Keyboard.G], () => this.addFoe())
      this.bindKey('wow',[Phaser.Keyboard.A])
    }

    setupGamepadInputs () {
      this.game.input.gamepad.start()
      this.gamepad = this.game.input.gamepad.pad1;
    }

    update () {
        this.game.physics.arcade.overlap(this.bullets, this.foes, (bullet,foe) => {
            bullet.kill()
            foe.kill()
            foe.destroy()
        } , null, this);
        this.game.physics.arcade.overlap(this.foesBullets, this.player, (player,foeBullet) => {
            foeBullet.kill()
            console.log("hit")
        } , null, this);

        this.player.body.velocity.y = 0
        this.player.body.velocity.x = 0
        this.movePlayer()
        if (!this.game.input.gamepad.supported || !this.game.input.gamepad.active || !this.gamepad.connected) {
          this.player.rotation = game.physics.arcade.angleToPointer(this.player) + Math.PI / 2;
          this.crosshair.x = game.input.x
          this.crosshair.y = game.input.y
        }
        this.playerEmitter.x = this.player.x - 30  * Math.sin(this.player.rotation)
        this.playerEmitter.y = this.player.y + 30  * Math.cos(this.player.rotation)
        this.playerEmitter.on = (Math.abs(this.player.body.velocity.x) + Math.abs(this.player.body.velocity.y) > .5)

        this.foes.forEachAlive(foe => foe.rotation = game.physics.arcade.angleBetween(this.player, foe) - Math.PI / 2)
        this.updateGamePad()
    }
    updateGamePad () {
      if (this.game.input.gamepad.supported && this.game.input.gamepad.active && this.gamepad.connected) {
          this.gamepadIcon.visible = true
          this.keys.left = this.gamepad.isDown(Phaser.Gamepad.XBOX360_DPAD_LEFT) || this.gamepad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) < -0.1
          this.keys.right = this.gamepad.isDown(Phaser.Gamepad.XBOX360_DPAD_RIGHT) || this.gamepad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) > 0.1
          this.keys.up = this.gamepad.isDown(Phaser.Gamepad.XBOX360_DPAD_UP) || this.gamepad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) < -0.1
          this.keys.down = this.gamepad.isDown(Phaser.Gamepad.XBOX360_DPAD_DOWN) || this.gamepad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) > 0.1
          if(this.gamepad.axis(Phaser.Gamepad.XBOX360_RIGHT_BUMPER)  !== false && this.gamepad.axis(Phaser.Gamepad.XBOX360_RIGHT_BUMPER) > -1) this.shoot()
          if(this.gamepad.isDown(Phaser.Gamepad.BUTTON_7)) this.shoot()
          let rightStickX = this.gamepad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_X) * -1;
          let rightStickY = this.gamepad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_Y) * -1;
          if(Math.abs(rightStickX) + Math.abs(rightStickY) > .1) {
            this.angle = Math.atan2(rightStickY, rightStickX) - Math.PI / 2
            this.player.rotation = this.angle
          }

      } else {
          this.gamepadIcon.visible = false
      }
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
        }
        if (this.keys.wow) {
            console.log("hey" + this.foes.length)
        }
    }
    shoot () {
        if (this.game.time.now > this.bulletTime) {
            const bullet = this.bullets.getFirstExists(false)

            if (bullet) {
                let angle = this.player.rotation - Math.PI / 2
                bullet.reset(this.player.x + 30 * Math.cos(angle), this.player.y + 30 * Math.sin(angle))
                bullet.anchor.setTo(0.5,0.5)
                bullet.animations.play('live', 10, true);
                bullet.body.velocity.x = this.bulletSpeed * Math.cos(angle)
                bullet.body.velocity.y = this.bulletSpeed * Math.sin(angle)
                bullet.rotation = angle  + Math.PI / 2
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
            const bullet = this.foesBullets.getFirstExists(false)

            if (bullet) {
                console.log(foe.name)
                bullet.reset(foe.x, foe.y )
                bullet.anchor.setTo(0.5,0.5)
                let angle = this.game.physics.arcade.angleBetween(foe,this.player)
                bullet.body.velocity.x = this.bulletSpeed * Math.cos(angle)
                bullet.animations.play('live', 10, true);
                bullet.body.velocity.y = this.bulletSpeed * Math.sin(angle)
                bullet.rotation = angle  + Math.PI / 2
                foe.bulletTime = this.game.time.now + 200

            }
        }
    }
    playerGetHit () {

    }

}
