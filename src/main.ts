import Phaser from 'phaser'
import './style.css'

type TouchInput = {
  left: boolean
  right: boolean
  jump: boolean
  fire: boolean
}

const touchInput: TouchInput = { left: false, right: false, jump: false, fire: false }
const GAME_WIDTH = 960
const GAME_HEIGHT = 540
const WORLD_WIDTH = 2700
const GROUND_TOP = 488
const BOSS_MAX_HEALTH = 36
const BOSS_DOOR_X = 2000
const BOSS_ARENA_LEFT = 2100
const BOSS_ARENA_RIGHT = WORLD_WIDTH - 60

class BossSelectScene extends Phaser.Scene {
  private selected = 0
  private frames: Phaser.GameObjects.Rectangle[] = []
  private statusText!: Phaser.GameObjects.Text
  private buttonText!: Phaser.GameObjects.Text

  constructor() {
    super('boss-select')
  }

  create() {
    const backdrop = this.add.graphics()
    backdrop.fillGradientStyle(0x14292d, 0x14292d, 0x203f41, 0x203f41, 1)
    backdrop.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    backdrop.fillStyle(0x102326, 0.75).fillRect(0, 350, GAME_WIDTH, 190)
    backdrop.fillStyle(0x72ddc6, 0.7)
    for (let index = 0; index < 38; index += 1) {
      backdrop.fillRect((index * 137 + 41) % GAME_WIDTH, 35 + ((index * 61) % 310), 2, 2)
    }

    this.add.text(480, 68, 'GUARDIAN SELECT', {
      fontFamily: 'Oxanium, sans-serif', fontSize: '32px', color: '#f3edda',
    }).setOrigin(0.5)
    this.add.text(480, 108, 'CHOOSE A ROUTE THROUGH BORDEAUX', {
      fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', color: '#9fb6aa',
    }).setOrigin(0.5)

    const guardians = [
      { name: 'CHOCOLATINEMAN', color: 0x75463b, status: 'ROUTE READY' },
      { name: 'MIROIR BOT', color: 0x4a8982, status: 'SIGNAL LOST' },
      { name: 'CANELÉ CORE', color: 0xc98b4e, status: 'SIGNAL LOST' },
      { name: 'TRAM-33', color: 0x8d6250, status: 'SIGNAL LOST' },
    ]

    guardians.forEach((guardian, index) => {
      const x = 120 + index * 240
      const frame = this.add.rectangle(x, 245, 190, 218, 0x183033, 0.96)
        .setStrokeStyle(1, 0x54716b)
        .setInteractive({ useHandCursor: index === 0 })
      frame.on('pointerdown', () => {
        this.setSelection(index)
        if (index === 0) this.launchRoute()
      })
      this.frames.push(frame)

      const portrait = this.add.graphics()
      portrait.fillStyle(guardian.color).fillRect(x - 29, 160, 58, 59)
      portrait.fillStyle(index === 0 ? 0x241d1c : 0x173033).fillRect(x - 21, 174, 42, 33)
      portrait.fillStyle(index === 0 ? 0xf0c46a : 0x6ab9a8).fillRect(x - 16, 179, 32, 8)
      portrait.fillStyle(index === 0 ? 0x4d302c : 0x26484a).fillRect(x - 24, 207, 48, 8)
      if (index === 0) {
        portrait.fillStyle(0xf3ddad).fillRect(x - 25, 153, 50, 7)
        portrait.fillStyle(0xff785c).fillRect(x - 6, 190, 12, 10)
      } else {
        portrait.fillStyle(0x9fb6aa).fillRect(x - 4, 190, 8, 8)
      }

      this.add.text(x, 294, guardian.name, {
        fontFamily: 'Oxanium, sans-serif', fontSize: index === 0 ? '13px' : '15px',
        color: index === 0 ? '#f3edda' : '#9fb6aa', align: 'center',
      }).setOrigin(0.5)
      this.add.text(x, 320, guardian.status, {
        fontFamily: 'IBM Plex Mono, monospace', fontSize: '9px',
        color: index === 0 ? '#73ddc6' : '#718985',
      }).setOrigin(0.5)
      if (index > 0) {
        this.add.text(x, 360, '— — —', {
          fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', color: '#56716c',
        }).setOrigin(0.5)
      }
    })

    this.statusText = this.add.text(480, 382, '', {
      fontFamily: 'IBM Plex Mono, monospace', fontSize: '10px', color: '#ffcb70',
    }).setOrigin(0.5)

    const button = this.add.rectangle(480, 448, 250, 42, 0x254541)
      .setStrokeStyle(1, 0x73ddc6).setInteractive({ useHandCursor: true })
    button.on('pointerdown', () => this.launchRoute())
    this.buttonText = this.add.text(480, 448, '', {
      fontFamily: 'Oxanium, sans-serif', fontSize: '15px', color: '#f3edda',
    }).setOrigin(0.5)

    this.add.text(480, 502, 'ARROWS TO BROWSE   /   ENTER TO CONFIRM', {
      fontFamily: 'IBM Plex Mono, monospace', fontSize: '9px', color: '#8fa89e',
    }).setOrigin(0.5)

    this.input.keyboard!.on('keydown-LEFT', () => this.setSelection((this.selected + guardians.length - 1) % guardians.length))
    this.input.keyboard!.on('keydown-RIGHT', () => this.setSelection((this.selected + 1) % guardians.length))
    this.input.keyboard!.on('keydown-ENTER', () => this.launchRoute())
    this.input.keyboard!.on('keydown-SPACE', () => this.launchRoute())
    this.setSelection(0)
  }

  private setSelection(index: number) {
    this.selected = index
    this.frames.forEach((frame, frameIndex) => {
      frame.setStrokeStyle(frameIndex === index ? 3 : 1, frameIndex === index ? 0xffcb70 : 0x54716b)
    })
    const ready = index === 0
    this.statusText.setText(ready ? 'QUAIS DE LA GARONNE  /  BORDEAUX' : 'ROUTE DATA NOT YET RECOVERED')
    this.buttonText.setText(ready ? 'ENTER ROUTE' : 'ROUTE SEALED')
  }

  private launchRoute() {
    if (this.selected === 0) this.scene.start('relay-run')
  }
}

class RelayScene extends Phaser.Scene {
  private readonly touch: TouchInput
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private player!: Phaser.Physics.Arcade.Sprite
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private hazards!: Phaser.Physics.Arcade.StaticGroup
  private enemies!: Phaser.Physics.Arcade.Group
  private shots!: Phaser.Physics.Arcade.Group
  private enemyShots!: Phaser.Physics.Arcade.Group
  private bossDoor!: Phaser.Physics.Arcade.Image
  private gatePrompt!: Phaser.GameObjects.Text
  private boss!: Phaser.Physics.Arcade.Image
  private coreText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text
  private progressFill!: Phaser.GameObjects.Rectangle
  private bossHealthFill!: Phaser.GameObjects.Rectangle
  private bossHealthText!: Phaser.GameObjects.Text
  private bossIntroText!: Phaser.GameObjects.Text
  private endShade!: Phaser.GameObjects.Rectangle
  private endText!: Phaser.GameObjects.Text
  private health = 5
  private score = 0
  private bossHealth = BOSS_MAX_HEALTH
  private bossState: 'idle' | 'charge' | 'return' = 'idle'
  private readonly bossAttacks = ['tornado', 'charge'] as const
  private bossAttackAt = 0
  private bossAttackIndex = 0
  private bossActive = false
  private bossDefeated = false
  private facing = 1
  private coyoteTime = 0
  private jumpBuffer = 0
  private touchJumpWasDown = false
  private jumpPressedThisFrame = false
  private damageCooldown = 0
  private nextShotAt = 0
  private ended = false

  constructor(touch: TouchInput) {
    super('relay-run')
    this.touch = touch
  }

  create() {
    this.createTextures()
    this.createBackdrop()
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT)

    this.platforms = this.physics.add.staticGroup()
    this.hazards = this.physics.add.staticGroup()
    this.enemies = this.physics.add.group()
    this.shots = this.physics.add.group()
    this.enemyShots = this.physics.add.group()

    this.createLevel()
    this.createPlayer()
    this.createHud()
    this.createInput()
    this.createCollisions()

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
    this.cameras.main.setDeadzone(300, 140)
  }

  update(_time: number, delta: number) {
    if (this.ended) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.restart)) this.scene.start('boss-select')
      return
    }

    this.updatePlayer(delta)
    this.updateBossDoor()
    this.updateEnemies()
    this.updateShots(delta)
    this.updateBoss()
    this.updateHud()

    if (this.player.y > GAME_HEIGHT + 80) this.damagePlayer(true)
  }

  private createTextures() {
    const graphics = this.add.graphics()

    graphics.fillStyle(0x123c3e).fillRect(3, 5, 26, 31)
    graphics.fillStyle(0x56d9c7).fillRect(6, 2, 20, 12)
    graphics.fillStyle(0xf6c85f).fillRect(3, 8, 6, 7)
    graphics.fillStyle(0xf6c85f).fillRect(23, 8, 6, 7)
    graphics.fillStyle(0xf5f0d8).fillRect(10, 7, 14, 5)
    graphics.fillStyle(0xff785c).fillRect(12, 17, 9, 8)
    graphics.fillStyle(0x7af1d9).fillRect(5, 17, 5, 12)
    graphics.fillStyle(0x7af1d9).fillRect(22, 17, 5, 12)
    graphics.fillStyle(0x092527).fillRect(5, 31, 9, 7)
    graphics.fillStyle(0x092527).fillRect(19, 31, 9, 7)
    graphics.generateTexture('hero', 32, 40)
    graphics.clear()

    graphics.fillStyle(0x8c3d34).fillRect(3, 7, 30, 21)
    graphics.fillStyle(0xf07852).fillRect(7, 3, 22, 22)
    graphics.fillStyle(0xffd06a).fillRect(11, 10, 14, 6)
    graphics.fillStyle(0x173537).fillRect(6, 27, 8, 5)
    graphics.fillStyle(0x173537).fillRect(23, 27, 8, 5)
    graphics.generateTexture('drone', 36, 34)
    graphics.clear()

    graphics.fillStyle(0x9c552d).fillTriangle(6, 32, 13, 5, 35, 5)
    graphics.fillStyle(0xd89445).fillTriangle(11, 28, 16, 8, 32, 8)
    graphics.fillStyle(0xf3c36c).fillEllipse(24, 7, 18, 7)
    graphics.fillStyle(0xffe6a1).fillEllipse(19, 5, 7, 3)
    graphics.fillStyle(0x8c4128).fillRect(8, 29, 27, 4)
    graphics.lineStyle(2, 0x7f402d)
    graphics.lineBetween(14, 12, 30, 12)
    graphics.lineBetween(12, 19, 32, 19)
    graphics.lineBetween(10, 26, 34, 26)
    graphics.generateTexture('canele', 42, 38)
    graphics.clear()

    graphics.fillStyle(0x283e3c).fillRect(10, 10, 28, 37)
    graphics.fillStyle(0x78937b).fillRect(8, 4, 32, 13)
    graphics.fillStyle(0xb8c69b).fillRect(14, 8, 20, 5)
    graphics.fillStyle(0xd7b878).fillRect(15, 19, 18, 17)
    graphics.fillStyle(0x263937).fillRect(18, 23, 4, 4)
    graphics.fillStyle(0x263937).fillRect(27, 23, 4, 4)
    graphics.fillStyle(0x8e514a).fillRect(16, 36, 7, 11)
    graphics.fillStyle(0x8e514a).fillRect(27, 36, 7, 11)
    graphics.fillStyle(0xe4d8b8).fillRect(34, 24, 3, 10)
    graphics.fillStyle(0x8b2f3c).fillTriangle(34, 23, 39, 23, 36, 15)
    graphics.fillStyle(0xb75a5f).fillRect(34, 21, 6, 3)
    graphics.lineStyle(1, 0xf3ddad).lineBetween(37, 27, 37, 33)
    graphics.generateTexture('vintner', 48, 52)
    graphics.clear()

    graphics.fillStyle(0x7d2637).fillCircle(7, 9, 6)
    graphics.fillStyle(0xc75861).fillTriangle(2, 8, 12, 8, 7, 0)
    graphics.fillStyle(0xf4a29a).fillCircle(5, 6, 2)
    graphics.generateTexture('wine-drop', 14, 16)
    graphics.clear()

    graphics.fillStyle(0xa84626).fillCircle(8, 8, 7)
    graphics.fillStyle(0xf3b65a).fillCircle(6, 5, 3)
    graphics.generateTexture('caramel-drop', 16, 16)
    graphics.clear()

    graphics.fillStyle(0xf4ce69).fillRect(1, 2, 14, 5)
    graphics.fillStyle(0xffffff).fillRect(4, 3, 8, 3)
    graphics.generateTexture('bolt', 16, 9)
    graphics.clear()

    graphics.fillStyle(0x24494b).fillRect(0, 0, 64, 24)
    graphics.fillStyle(0x8bd1bb).fillRect(0, 0, 64, 4)
    graphics.fillStyle(0x527a70).fillRect(0, 4, 64, 3)
    graphics.fillStyle(0x183638).fillRect(0, 20, 64, 4)
    graphics.fillStyle(0xc39553).fillRect(8, 11, 8, 3)
    graphics.fillStyle(0xc39553).fillRect(40, 11, 8, 3)
    graphics.generateTexture('platform', 64, 24)
    graphics.clear()

    graphics.fillStyle(0x9d5346)
    for (let x = 0; x < 72; x += 18) {
      graphics.fillTriangle(x, 22, x + 9, 2, x + 18, 22)
    }
    graphics.fillStyle(0xff9670).fillRect(0, 20, 72, 4)
    graphics.generateTexture('spikes', 72, 24)
    graphics.clear()

    graphics.fillStyle(0x1d4142).fillRect(7, 2, 34, 68)
    graphics.fillStyle(0x60ddc6).fillRect(2, 0, 44, 8)
    graphics.fillStyle(0xffc767).fillRect(9, 12, 30, 52)
    graphics.fillStyle(0x163638).fillRect(14, 17, 20, 43)
    graphics.fillStyle(0x62e6d1).fillRect(19, 22, 10, 31)
    graphics.fillStyle(0xf5f0d8).fillRect(22, 27, 4, 18)
    graphics.generateTexture('relay', 48, 72)
    graphics.destroy()

    const bossArt = this.add.graphics()
    bossArt.fillStyle(0x362333).fillRect(20, 54, 15, 23)
    bossArt.fillStyle(0x362333).fillRect(42, 54, 15, 23)
    bossArt.fillStyle(0x8e3f37).fillRect(15, 34, 48, 29)
    bossArt.fillStyle(0xb86742).fillEllipse(39, 43, 42, 36)
    bossArt.fillStyle(0xe4ae65).fillEllipse(39, 39, 38, 13)
    bossArt.fillStyle(0xf1d28d).fillTriangle(22, 38, 31, 31, 36, 40)
    bossArt.fillStyle(0xf1d28d).fillTriangle(42, 40, 49, 31, 58, 38)
    bossArt.fillStyle(0x39212c).fillRect(25, 28, 29, 13)
    bossArt.fillStyle(0x6a3440).fillRect(28, 31, 7, 5)
    bossArt.fillStyle(0x6a3440).fillRect(43, 31, 7, 5)
    bossArt.fillStyle(0xf7dfaa).fillRect(31, 23, 5, 4)
    bossArt.fillStyle(0xf7dfaa).fillRect(44, 23, 5, 4)
    bossArt.fillStyle(0xf1d28d).fillRect(3, 39, 14, 11)
    bossArt.fillStyle(0xf1d28d).fillRect(61, 39, 9, 11)
    bossArt.fillStyle(0x5c302d).fillRect(18, 75, 20, 7)
    bossArt.fillStyle(0x5c302d).fillRect(40, 75, 20, 7)
    bossArt.lineStyle(2, 0xf3d294)
    bossArt.lineBetween(32, 44, 42, 52)
    bossArt.lineBetween(43, 44, 34, 52)
    bossArt.generateTexture('chocolatineman', 72, 84)
    bossArt.clear()

    bossArt.fillStyle(0x314b47).fillRect(8, 0, 40, 64)
    bossArt.fillStyle(0x6c9080).fillRect(3, 0, 50, 8)
    bossArt.fillStyle(0x182b2d).fillRect(14, 11, 28, 47)
    bossArt.fillStyle(0xf1c36d).fillRect(19, 14, 18, 4)
    bossArt.fillStyle(0x496761).fillRect(18, 25, 20, 26)
    bossArt.fillStyle(0xf1c36d).fillRect(0, 57, 56, 7)
    bossArt.generateTexture('boss-gate', 56, 64)
    bossArt.clear()

    bossArt.fillStyle(0x9b5738).fillTriangle(28, 2, 4, 56, 52, 56)
    bossArt.fillStyle(0xc78248).fillTriangle(28, 9, 12, 48, 44, 48)
    bossArt.fillStyle(0xf0cd88).fillEllipse(28, 20, 15, 9)
    bossArt.fillStyle(0x5c302d).fillRect(13, 30, 8, 5)
    bossArt.fillStyle(0x5c302d).fillRect(34, 38, 8, 5)
    bossArt.fillStyle(0xf0cd88).fillEllipse(28, 49, 13, 7)
    bossArt.lineStyle(2, 0xffdf9a, 0.8)
    bossArt.lineBetween(7, 49, 46, 49)
    bossArt.lineBetween(11, 35, 42, 35)
    bossArt.generateTexture('choco-tornado', 56, 64)
    bossArt.destroy()
  }

  private createBackdrop() {
    const graphics = this.add.graphics().setDepth(-20)
    graphics.fillGradientStyle(0x152c32, 0x152c32, 0x294a4c, 0x294a4c, 1)
    graphics.fillRect(0, 0, WORLD_WIDTH, GAME_HEIGHT)

    graphics.fillStyle(0xe4c36e, 0.14).fillCircle(1320, 132, 72)
    graphics.fillStyle(0xf5e4ad, 0.55).fillCircle(1320, 132, 42)
    graphics.fillStyle(0x183438, 0.85)
    for (let index = 0; index < 23; index += 1) {
      const x = index * 82 + 14
      const height = 50 + ((index * 37) % 110)
      graphics.fillRect(x, 390 - height, 48, height)
      graphics.fillStyle(0xe8c66c, 0.55)
      graphics.fillRect(x + 10, 405 - height, 5, 7)
      graphics.fillRect(x + 29, 405 - height, 5, 7)
      graphics.fillStyle(0x183438, 0.85)
    }

    graphics.fillStyle(0xf2e5ad, 0.8)
    for (let index = 0; index < 74; index += 1) {
      const x = (index * 127 + 31) % WORLD_WIDTH
      const y = 44 + ((index * 53) % 245)
      graphics.fillRect(x, y, index % 5 === 0 ? 3 : 2, 2)
    }

    graphics.fillStyle(0x102629, 0.88)
    graphics.fillRect(0, 438, WORLD_WIDTH, 102)
    graphics.fillStyle(0x3e6c63, 0.75)
    graphics.fillRect(0, 438, WORLD_WIDTH, 4)
    graphics.setScrollFactor(0.18)
  }

  private createLevel() {
    this.addPlatform(280, 488, 560, 52)
    this.addPlatform(890, 488, 480, 52)
    this.addPlatform(1450, 488, 460, 52)

    this.addPlatform(385, 384, 164, 24)
    this.addPlatform(605, 328, 128, 24)
    this.addPlatform(850, 412, 172, 24)
    this.addPlatform(1080, 356, 156, 24)
    this.addPlatform(1350, 404, 168, 24)
    this.addPlatform(1850, 488, 340, 52)
    this.addPlatform(2365, 488, 670, 52)

    this.hazards.create(605, 476, 'spikes')
    this.hazards.create(1175, 476, 'spikes')

    const drone = this.enemies.create(930, GROUND_TOP - 12.5, 'drone') as Phaser.Physics.Arcade.Sprite
    drone.setCollideWorldBounds(true)
    drone.setVelocityX(92)
    drone.body!.setSize(27, 25)
    drone.setData('health', 2)
    drone.setData('leftBound', 770)
    drone.setData('rightBound', 1060)

    const canele = this.enemies.create(430, GROUND_TOP - 14, 'canele') as Phaser.Physics.Arcade.Sprite
    canele.setCollideWorldBounds(true)
    canele.setVelocityX(90)
    canele.body!.setSize(32, 28)
    canele.setData('kind', 'canele')
    canele.setData('health', 3)
    canele.setData('leftBound', 350)
    canele.setData('rightBound', 500)
    canele.setData('nextFireAt', this.time.now + 1200)

    const vintner = this.enemies.create(1040, GROUND_TOP - 21.5, 'vintner') as Phaser.Physics.Arcade.Sprite
    vintner.setCollideWorldBounds(true)
    vintner.setImmovable(true)
    vintner.body!.setSize(28, 43)
    vintner.setData('kind', 'vintner')
    vintner.setData('health', 3)
    vintner.setData('nextFireAt', this.time.now + 900)

    this.add.image(1605, 444, 'relay')

    this.bossDoor = this.physics.add.staticImage(BOSS_DOOR_X, 456, 'boss-gate')
    this.bossDoor.setDisplaySize(56, 64)
    this.bossDoor.refreshBody()
    this.gatePrompt = this.add.text(BOSS_DOOR_X, 382, '↑  OPEN THE GATE', {
      fontFamily: 'IBM Plex Mono, monospace', fontSize: '10px', color: '#f1c36d',
      backgroundColor: '#14292d', padding: { x: 7, y: 5 },
    }).setOrigin(0.5).setVisible(false).setDepth(10)

    this.boss = this.physics.add.image(2580, 438, 'chocolatineman')
    this.boss.setDepth(6).setVisible(false)
    this.boss.setCollideWorldBounds(true)
    const bossBody = this.boss.body as Phaser.Physics.Arcade.Body
    bossBody.setSize(48, 64)
    bossBody.setAllowGravity(false)
    bossBody.checkCollision.none = true

    this.add.text(82, 452, 'FIELD ENTRY', {
      fontFamily: 'IBM Plex Mono, monospace', fontSize: '10px', color: '#b5c8a9',
    }).setAlpha(0.75)
    this.add.text(1485, 452, 'CHECKPOINT', {
      fontFamily: 'IBM Plex Mono, monospace', fontSize: '10px', color: '#b5c8a9',
    }).setAlpha(0.75)
  }

  private addPlatform(x: number, top: number, width: number, height: number) {
    const platform = this.platforms.create(x, top + height / 2, 'platform') as Phaser.Physics.Arcade.Image
    platform.setDisplaySize(width, height)
    platform.refreshBody()
  }

  private createPlayer() {
    this.player = this.physics.add.sprite(92, 448, 'hero')
    this.player.setCollideWorldBounds(true)
    this.player.setMaxVelocity(250, 900)
    this.player.setDragX(1700)
    this.player.body!.setSize(20, 34)
    this.player.setDepth(5)
  }

  private createHud() {
    const labelStyle = { fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: '#f5f0d8' }
    this.add.text(24, 20, 'STARLINE  /  RELAY RUN', {
      fontFamily: 'Oxanium, sans-serif', fontSize: '19px', color: '#f5f0d8',
    }).setScrollFactor(0).setDepth(30)
    this.add.text(26, 47, 'SECTOR 01     THE GLASSWORKS', {
      ...labelStyle, fontSize: '10px', color: '#9ebbb1',
    }).setScrollFactor(0).setDepth(30)
    this.coreText = this.add.text(748, 22, 'CORE 03', {
      ...labelStyle, color: '#ffcb70',
    }).setScrollFactor(0).setDepth(30)
    this.scoreText = this.add.text(846, 22, 'DRONES 00', {
      ...labelStyle, color: '#72e0ce',
    }).setScrollFactor(0).setDepth(30)

    this.add.rectangle(408, 31, 242, 6, 0x46635c).setOrigin(0, 0.5).setScrollFactor(0).setDepth(30)
    this.progressFill = this.add.rectangle(408, 31, 1, 4, 0xffcb70)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(31)

    this.bossHealthText = this.add.text(26, 72, 'CHOCOLATINEMAN', {
      ...labelStyle, fontSize: '10px', color: '#f1c36d',
    }).setScrollFactor(0).setDepth(31).setVisible(false)
    this.add.rectangle(26, 91, 214, 6, 0x46635c)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(30).setVisible(false)
    this.bossHealthFill = this.add.rectangle(26, 91, 214, 4, 0xff785c)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(31).setVisible(false)
    this.bossIntroText = this.add.text(480, 168, '', {
      fontFamily: 'Oxanium, sans-serif', fontSize: '27px', color: '#f3edda',
      align: 'center', lineSpacing: 7,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(42).setVisible(false)

    this.endShade = this.add.rectangle(480, 270, GAME_WIDTH, GAME_HEIGHT, 0x0b1c20, 0.82)
      .setScrollFactor(0).setDepth(50).setVisible(false)
    this.endText = this.add.text(480, 270, '', {
      fontFamily: 'Oxanium, sans-serif', fontSize: '34px', color: '#f5f0d8',
      align: 'center', lineSpacing: 10,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setVisible(false)
  }

  private createInput() {
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keys = this.input.keyboard!.addKeys({
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      fire: Phaser.Input.Keyboard.KeyCodes.X,
      restart: Phaser.Input.Keyboard.KeyCodes.R,
      interact: Phaser.Input.Keyboard.KeyCodes.E,
    }) as Record<string, Phaser.Input.Keyboard.Key>
  }

  private createCollisions() {
    this.physics.add.collider(this.player, this.platforms)
    this.physics.add.collider(this.player, this.bossDoor)
    this.physics.add.collider(this.enemies, this.platforms)
    this.physics.add.collider(this.shots, this.platforms, (shot) => shot.destroy())
    this.physics.add.collider(this.enemyShots, this.platforms, (shot) => shot.destroy())
    this.physics.add.collider(this.boss, this.platforms)
    this.physics.add.overlap(this.player, this.enemies, () => this.damagePlayer())
    this.physics.add.overlap(this.player, this.hazards, () => this.damagePlayer(true))
    this.physics.add.overlap(this.player, this.enemyShots, (_player, shot) => {
      shot.destroy()
      this.damagePlayer()
    })
    this.physics.add.overlap(this.player, this.boss, () => this.damagePlayer())
    this.physics.add.overlap(this.shots, this.enemies, (shot, enemy) => {
      this.hitEnemy(shot as Phaser.Physics.Arcade.Sprite, enemy as Phaser.Physics.Arcade.Sprite)
    })
    this.physics.add.overlap(this.shots, this.boss, (shot) => this.hitBoss(shot as Phaser.Physics.Arcade.Sprite))
  }

  private updatePlayer(delta: number) {
    const left = this.cursors.left.isDown || this.keys.a.isDown || this.touch.left
    const right = this.cursors.right.isDown || this.keys.d.isDown || this.touch.right
    const jumpDown = this.cursors.space.isDown || this.cursors.up.isDown || this.touch.jump
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space)
      || Phaser.Input.Keyboard.JustDown(this.cursors.up)
      || (this.touch.jump && !this.touchJumpWasDown)
    this.jumpPressedThisFrame = jumpPressed
    this.touchJumpWasDown = this.touch.jump

    if (left !== right) {
      this.facing = left ? -1 : 1
      this.player.setAccelerationX(this.facing * 1550)
      this.player.setFlipX(this.facing < 0)
    } else {
      this.player.setAccelerationX(0)
    }

    if (this.player.body!.blocked.down || this.player.body!.touching.down) this.coyoteTime = 105
    else this.coyoteTime = Math.max(0, this.coyoteTime - delta)

    if (jumpPressed) this.jumpBuffer = 115
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - delta)

    if (this.jumpBuffer > 0 && this.coyoteTime > 0) {
      this.player.setVelocityY(-520)
      this.jumpBuffer = 0
      this.coyoteTime = 0
    }

    if (!jumpDown && this.player.body!.velocity.y < -175) this.player.setVelocityY(-175)
    if (this.damageCooldown > 0) {
      this.damageCooldown = Math.max(0, this.damageCooldown - delta)
      this.player.setAlpha(Math.floor(this.time.now / 70) % 2 === 0 ? 0.45 : 1)
    } else {
      this.player.setAlpha(1)
    }

    const firePressed = Phaser.Input.Keyboard.JustDown(this.keys.fire) || this.touch.fire
    if (firePressed && this.time.now >= this.nextShotAt) this.fireShot()
  }

  private updateEnemies() {
    this.enemies.getChildren().forEach((child) => {
      const enemy = child as Phaser.Physics.Arcade.Sprite
      if (!enemy.active) return

      if (enemy.getData('kind') === 'vintner') {
        const distance = Math.abs(this.player.x - enemy.x)
        enemy.setFlipX(this.player.x < enemy.x)
        if (distance < 540 && this.time.now >= Number(enemy.getData('nextFireAt'))) {
          enemy.setData('nextFireAt', this.time.now + 1450)
          this.fireWineDrop(enemy)
        }
        this.keepEnemyAboveFloor(enemy)
        return
      }

      if (enemy.getData('kind') === 'canele') {
        const distance = Math.abs(this.player.x - enemy.x)
        enemy.setFlipX(enemy.body!.velocity.x < 0)
        if (distance < 430 && this.time.now >= Number(enemy.getData('nextFireAt'))) {
          enemy.setData('nextFireAt', this.time.now + 1850)
          this.fireCaneleDrop(enemy)
        }
      }

      if (enemy.x < enemy.getData('leftBound') || enemy.x > enemy.getData('rightBound')) {
        enemy.setVelocityX(-enemy.body!.velocity.x)
      }
      if (enemy.getData('kind') === 'canele') {
        const body = enemy.body as Phaser.Physics.Arcade.Body
        if (enemy.x <= Number(enemy.getData('leftBound'))) {
          enemy.setX(Number(enemy.getData('leftBound'))).setVelocityX(Math.abs(body.velocity.x))
        } else if (enemy.x >= Number(enemy.getData('rightBound'))) {
          enemy.setX(Number(enemy.getData('rightBound'))).setVelocityX(-Math.abs(body.velocity.x))
        }
      }
      this.keepEnemyAboveFloor(enemy)
    })
  }

  private keepEnemyAboveFloor(enemy: Phaser.Physics.Arcade.Sprite) {
    const body = enemy.body as Phaser.Physics.Arcade.Body
    const floorCenter = GROUND_TOP - body.height / 2
    if (enemy.y > floorCenter) {
      enemy.setY(floorCenter)
      body.velocity.y = 0
    }
  }

  private updateShots(delta: number) {
    this.shots.getChildren().forEach((child) => {
      const shot = child as Phaser.Physics.Arcade.Sprite
      if (shot.active && (shot.x < 0 || shot.x > WORLD_WIDTH || this.time.now > shot.getData('expiresAt'))) {
        shot.destroy()
      }
    })

    this.enemyShots.getChildren().forEach((child) => {
      const shot = child as Phaser.Physics.Arcade.Sprite
      if (!shot.active) return
      const body = shot.body as Phaser.Physics.Arcade.Body
      if (shot.getData('attack') === 'choco-tornado') {
        body.velocity.y = Number(shot.getData('baseVelocityY'))
          + Math.sin(this.time.now / 125 + Number(shot.getData('phase'))) * 34
      } else {
        body.velocity.y += 470 * delta / 1000
      }
      if (shot.x < 0 || shot.x > WORLD_WIDTH || shot.y > GAME_HEIGHT + 40 || this.time.now > shot.getData('expiresAt')) {
        shot.destroy()
      }
    })
  }

  private updateBossDoor() {
    if (this.bossActive || this.bossDefeated) {
      this.gatePrompt.setVisible(false)
      return
    }
    const nearDoor = Math.abs(this.player.x - BOSS_DOOR_X) < 82
    this.gatePrompt.setVisible(nearDoor)
    if (nearDoor && (this.jumpPressedThisFrame || Phaser.Input.Keyboard.JustDown(this.keys.interact))) {
      this.openBossDoor()
    }
  }

  private openBossDoor() {
    this.gatePrompt.setVisible(false)
    this.tweens.add({
      targets: this.bossDoor,
      alpha: 0,
      duration: 360,
      onComplete: () => {
        this.bossDoor.setVisible(false)
        this.bossDoor.body!.enable = false
        this.startBossFight()
      },
    })
  }

  private startBossFight() {
    this.bossActive = true
    this.bossHealth = BOSS_MAX_HEALTH
    this.bossState = 'idle'
    this.bossAttackIndex = 0
    this.bossAttackAt = this.time.now + 1700
    this.ensureBossBody()
    this.boss.setPosition(BOSS_ARENA_RIGHT - 250, 438).setVelocity(0, 0).setFlipX(true)
    this.boss.setVisible(true)
    this.boss.body!.checkCollision.none = false
    this.bossHealthText.setText(`CHOCOLATINEMAN  ${this.bossHealth}/${BOSS_MAX_HEALTH}`).setVisible(true)
    this.bossHealthFill.setVisible(true)
    this.bossHealthFill.width = 214
    this.bossIntroText.setText('CHOCOLATINEMAN\nTHE PASTRY CYCLONE').setVisible(true)
    this.cameras.main.stopFollow()
    const arenaCameraLeft = BOSS_DOOR_X - 260
    this.cameras.main.setBounds(arenaCameraLeft, 0, GAME_WIDTH, GAME_HEIGHT)
    this.cameras.main.centerOn(arenaCameraLeft + GAME_WIDTH / 2, GAME_HEIGHT / 2)
    this.cameras.main.shake(250, 0.003)
    this.time.delayedCall(1700, () => this.bossIntroText.setVisible(false))
  }

  private updateBoss() {
    if (!this.bossActive || this.bossDefeated) return
    this.ensureBossBody()
    this.boss.setActive(true).setVisible(true)

    if (this.bossState === 'charge' && this.boss.x <= BOSS_ARENA_LEFT) {
      this.bossState = 'return'
      this.boss.setFlipX(false).setVelocityX(300)
    } else if (this.bossState === 'return' && this.boss.x >= BOSS_ARENA_RIGHT) {
      this.bossState = 'idle'
      this.boss.setVelocityX(0)
      this.bossAttackAt = this.time.now + 700
    } else if (this.bossState === 'idle' && this.time.now >= this.bossAttackAt) {
      const attack = this.bossAttacks[this.bossAttackIndex]
      if (attack === 'tornado') this.startChocoTornado()
      else this.startBossCharge()
      this.bossAttackIndex = (this.bossAttackIndex + 1) % this.bossAttacks.length
    }
  }

  private ensureBossBody() {
    if (!this.boss.body) this.physics.world.enable(this.boss)
    const body = this.boss.body as Phaser.Physics.Arcade.Body
    body.setSize(48, 64)
    body.setAllowGravity(false)
    body.checkCollision.none = !this.bossActive || this.bossDefeated
  }

  private startChocoTornado() {
    this.bossAttackAt = this.time.now + 2600
    for (const [index, velocityY] of [-38, 38].entries()) {
      const shot = this.enemyShots.create(this.boss.x - 42, this.boss.y - 20 + index * 36, 'choco-tornado') as Phaser.Physics.Arcade.Sprite
      const body = shot.body as Phaser.Physics.Arcade.Body
      body.setAllowGravity(false)
      body.setSize(38, 48)
      shot.setVelocity(-260, velocityY)
      shot.setAngularVelocity(-100)
      shot.setDepth(8)
      shot.setData('attack', 'choco-tornado')
      shot.setData('baseVelocityY', velocityY)
      shot.setData('phase', index * 2)
      shot.setData('expiresAt', this.time.now + 2400)
    }
  }

  private startBossCharge() {
    this.bossState = 'charge'
    this.boss.setFlipX(true).setVelocityX(-470)
    this.bossAttackAt = this.time.now + 2400
    this.cameras.main.shake(140, 0.002)
  }

  private updateHud() {
    this.coreText.setText(`CORE 0${this.health}`)
    this.scoreText.setText(`THREATS ${String(this.score).padStart(2, '0')}`)
    this.progressFill.width = Math.max(1, 242 * Phaser.Math.Clamp(this.player.x / BOSS_DOOR_X, 0, 1))
  }

  private fireShot() {
    this.nextShotAt = this.time.now + 260
    const shot = this.shots.create(this.player.x + this.facing * 24, this.player.y - 2, 'bolt') as Phaser.Physics.Arcade.Sprite
    shot.setVelocityX(this.facing * 520)
    const body = shot.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    shot.setDepth(7)
    shot.setData('expiresAt', this.time.now + 1800)
  }

  private fireWineDrop(shooter: Phaser.Physics.Arcade.Sprite) {
    const direction = this.player.x < shooter.x ? -1 : 1
    const shot = this.enemyShots.create(shooter.x + direction * 24, shooter.y - 7, 'wine-drop') as Phaser.Physics.Arcade.Sprite
    const angle = Phaser.Math.Angle.Between(shot.x, shot.y, this.player.x, this.player.y)
    const body = shot.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    shot.setVelocity(Math.cos(angle) * 230, Math.sin(angle) * 230 - 55)
    shot.setDepth(7)
    shot.setData('expiresAt', this.time.now + 2200)
  }

  private fireCaneleDrop(shooter: Phaser.Physics.Arcade.Sprite) {
    const direction = this.player.x < shooter.x ? -1 : 1
    const shot = this.enemyShots.create(shooter.x + direction * 20, shooter.y, 'caramel-drop') as Phaser.Physics.Arcade.Sprite
    const angle = Phaser.Math.Angle.Between(shot.x, shot.y, this.player.x, this.player.y)
    const body = shot.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    shot.setVelocity(Math.cos(angle) * 195, Math.sin(angle) * 195 - 75)
    shot.setDepth(7)
    shot.setData('attack', 'canele')
    shot.setData('expiresAt', this.time.now + 1800)
  }

  private hitEnemy(shot: Phaser.Physics.Arcade.Sprite, enemy: Phaser.Physics.Arcade.Sprite) {
    if (!shot.active || !enemy.active) return
    shot.destroy()
    const health = Number(enemy.getData('health')) - 1
    enemy.setData('health', health)
    enemy.setTint(0xffffff)
    this.time.delayedCall(90, () => {
      if (enemy.active) enemy.clearTint()
    })
    if (health <= 0) {
      enemy.destroy()
      this.score += 1
    }
  }

  private hitBoss(shot: Phaser.Physics.Arcade.Sprite) {
    if (!shot.active || shot.getData('bossHit') || !this.bossActive || this.bossDefeated) return
    shot.setData('bossHit', true)
    shot.destroy()
    this.bossHealth -= 1
    this.bossHealthFill.width = 214 * Math.max(0, this.bossHealth / BOSS_MAX_HEALTH)
    this.bossHealthText.setText(`CHOCOLATINEMAN  ${this.bossHealth}/${BOSS_MAX_HEALTH}`)
    this.boss.setTint(0xff554b)
    this.cameras.main.shake(70, 0.001)
    const damageText = this.add.text(this.boss.x, this.boss.y - 52, '-1', {
      fontFamily: 'Oxanium, sans-serif', fontSize: '18px', color: '#ffcb70',
      stroke: '#281f24', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(15)
    this.tweens.add({
      targets: damageText,
      y: damageText.y - 28,
      alpha: 0,
      duration: 520,
      onComplete: () => damageText.destroy(),
    })
    this.time.delayedCall(90, () => {
      if (this.boss.active) this.boss.clearTint()
    })

    if (this.bossHealth <= 0) {
      this.bossDefeated = true
      this.bossActive = false
      this.boss.setVelocity(0, 0)
      this.boss.body!.checkCollision.none = true
      this.enemyShots.getChildren().forEach((child) => child.destroy())
      this.bossHealthText.setText('CHOCOLATINEMAN / CLEARED')
      this.endShade.setAlpha(0.55)
      this.showEnd('BORDEAUX SAVED', 'CHOCOLATINEMAN DEFEATED')
    }
  }

  private damagePlayer(force = false) {
    if (this.damageCooldown > 0 || this.ended) return
    this.damageCooldown = 950
    this.health -= 1
    this.player.setVelocity(this.facing * -220, -300)
    this.cameras.main.shake(110, 0.002)

    if (force) {
      this.player.setPosition(Math.max(92, this.player.x - this.facing * 230), 420)
      this.player.setVelocity(this.facing * -180, -260)
    }
    if (this.health <= 0) this.showEnd('SIGNAL LOST', 'PRESS R TO REBOOT')
  }

  private showEnd(title: string, subtitle: string) {
    this.ended = true
    this.endShade.setVisible(true)
    this.endText.setText(`${title}\n${subtitle}`).setVisible(true)
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#152c32',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 1250 }, debug: false },
  },
  scene: [new BossSelectScene(), new RelayScene(touchInput)],
})

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-control]')) {
  const control = button.dataset.control as keyof TouchInput
  const press = (event: PointerEvent) => {
    event.preventDefault()
    touchInput[control] = true
    button.setPointerCapture(event.pointerId)
  }
  const release = () => { touchInput[control] = false }
  button.addEventListener('pointerdown', press)
  button.addEventListener('pointerup', release)
  button.addEventListener('pointercancel', release)
  button.addEventListener('lostpointercapture', release)
}

if (import.meta.hot) import.meta.hot.dispose(() => game.destroy(true))
