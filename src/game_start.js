var GameStart = function() {};

SAND = 5
IMPASSE = 7
WATER = 8
CLAY = 6
WETSAND = 3
CRACKEDSTONE = 4 

GameStart.prototype = {
   
  player:0,
  can_fire: true,
  world:false,
  doors:false,
  allowDoors: true,
  enemies: [],
  tinfoil: 100,
  levelMan: false, 

  BULLET_VEL: 500,
  RELOAD_RATE: 100,
  PLAYER_VEL: 200,
  MAP_BODY : 100,
  startedExit: false, 
  INVENTORY : {}, 

  preload:function() {
    game.load.image("bullet_img", "res/img/entities/Bullet.png");
    game.load.tilemap("Floor1",  "res/maps/Floor1.json", 
                      null, Phaser.Tilemap.TILED_JSON);
    game.load.image("Tiles",  "res/img/TILES.png");
    game.load.image("Door", "res/img/entities/Door.png"); 
    game.load.image("pistol", "res/img/entities/Gun.png"); 
    game.load.spritesheet("player", "res/img/entities/Player_Anim.png",50,55); 
    game.load.image("mummy", "res/img/entities/Player.png");
    game.load.audio("bomb", "res/snd/bomb.wav");
    game.load.audio("shoot", "res/snd/shoot.wav");
    game.load.audio("cavern", "res/snd/Proof_Cavern.wav");
    game.load.image("button", "res/img/entities/Ankh.png");
    game.load.audio("click", "res/snd/button-click.wav");
    game.load.audio("tele", "res/snd/tele.wav");
  },

  init:   function() {
    console.log("Entering game_start...");
  },  

  create: function() {
    game.plugins.add(Phaser.Plugin.PhaserIlluminated);
  
    //START JEWISH PHYSICS
    game.physics.startSystem(Phaser.Physics.BOX2D);

    //CREATE SPRITES  
    this.gun = game.add.sprite(game.world.centerX, game.world.centerY, "pistol")
    this.player = new Entity();   
    this.player.sprite = game.add.sprite(32*44, 32*98, 
                          "player");
    this.player.walk_away = this.player.sprite.animations.add("walk_away", 
                                                              [0,1,2,3,4,5,6,7,8,9]);
    this.player.walk_to   = this.player.sprite.animations.add("walk_to", 
                                                       [10,11,12,13,14,15,16,17,18,19])    
    
    this.player.walk_right = this.player.sprite.animations.add("walk_right",
                                                        [20,21,22,23,24,25,26]);
    this.player.walk_left = this.player.sprite.animations.add("walk_left",
                                                        [27,28,29,30,31,32,33]);
    game.camera.follow(this.player.sprite, Phaser.Camera.FOLLOW_TOPDOWN);
    
    //CREATE GROUPS
    this.bullets = game.add.group(); 

    //ENABLE THE JEWISH PHYSIKS TO CONTROL SPRITE
    game.physics.box2d.enable(this.player.sprite);
    this.player.sprite.body.setCategoryContactCallback(this.DOOR_BODY, this.moveRoom, this);
    this.player.sprite.body.setCategoryContactCallback(999, this.healthCallback, this);
    this.player.sprite.body.fixedRotation = true
        

    //CREATE KEYBOARD STUFFS
    this.cursors = game.input.keyboard.createCursorKeys();
  
    //START PATHFINDER
    this.pathfinder = game.plugins.add(Phaser.Plugin.PathFinderPlugin);
    
    
    //TEXT N STUF
    this.textStyle = {font:"12px Arial", fill:"#ffffff"} 
    this.tinfoilStr = game.add.text(0, 15, "Tinfoil Hat Strength: "+this.tinfoil+"%",
                                      this.textStyle);
    this.tinfoilStr.fixedToCamera = true;

    //CREATE MUSIC
    this.shoot = game.add.audio("shoot");
    this.bomb  = game.add.audio("bomb");
    this.theme = game.add.audio("cavern");
    this.theme.loop = 1
    this.theme.play();
  
    //CREATE MASTER LEVEL MANAGER
    this.levelMan = new LevelManager();  
  
    this.levelMan.loadLevel(0);
  

    game.world.bringToTop(this.bullets)
    game.world.bringToTop(this.gun);
    game.world.bringToTop(this.player.sprite);  
    game.world.bringToTop(this.tinfoilStr);
  },

  update: function() {
    this.player.sprite.body.setZeroVelocity();
    var angle_to_mouse = game.math.angleBetweenPoints({
            x:game.input.activePointer.worldX,
            y:game.input.activePointer.worldY},
            {x: this.player.sprite.world.x, y:this.player.sprite.world.y});    
    var rot = angle_to_mouse+ Math.PI/2;
    this.gun.rotation = (rot+ Math.PI/2)
    this.gun.x = this.player.sprite.world.x + Math.sin(-rot)*15
    this.gun.y = this.player.sprite.world.y + Math.cos(rot)*15
    //UP/DOWN
    if (this.cursors.up.isDown || game.input.keyboard.isDown(Phaser.Keyboard.W)) {
      this.player.sprite.body.velocity.y = -(this.PLAYER_VEL);
      this.player.sprite.animations.play("walk_away", 15, true)
    }                          
    else if (this.cursors.down.isDown || game.input.keyboard.isDown(Phaser.Keyboard.S)) {
      this.player.sprite.body.velocity.y = (this.PLAYER_VEL);
      this.player.sprite.animations.play("walk_to", 15, true);
    } else {
      this.player.sprite.animations.stop();
    }

    //LEFT/RIGHT
    if (this.cursors.left.isDown || game.input.keyboard.isDown(Phaser.Keyboard.A)) {
      this.player.sprite.body.velocity.x = -(this.PLAYER_VEL);
        this.player.sprite.animations.play("walk_left",15, true);
    }
    else if (this.cursors.right.isDown || game.input.keyboard.isDown(Phaser.Keyboard.D)) {
      this.player.sprite.body.velocity.x = (this.PLAYER_VEL);
      this.player.sprite.animations.play("walk_right", 15, true);
    }  
    //CLICK
    if (game.input.activePointer.isDown) {
      if (this.can_fire) {
        this.fire(this.player.sprite.world.x, this.player.sprite.world.y, angle_to_mouse);
        this.can_fire = false;
        setTimeout(function(that){that.can_fire = true}, this.RELOAD_RATE, this);
      }
    }
   
    this.levelMan.update(this.player.sprite.world.x, this.player.sprite.world.y);
    if (!this.startedExit && this.levelMan.completed) {
      this.startedExit = true;
      game.add.tween(this.player.sprite.body).to({rotation: 10*Math.PI}, 
                                                1000, "Linear").start();
      t = game.add.tween(this.player.sprite.body).to({x:this.levelMan.target.x*32,
                                               y:this.levelMan.target.y*32}, 1000,
                                               "Linear");
      t.start();
    }
  },

  fire: function(x, y, ang) {
    this.shoot.play();
    var offset = this.player.sprite.width;
    var angle_to_mouse = ang + Math.PI/2;
    var new_bullet = this.bullets.create(x+offset*Math.sin( - angle_to_mouse ), y+offset*Math.cos( angle_to_mouse), "bullet_img");
    game.physics.box2d.enable(new_bullet);
    new_bullet.body.setCircle(2.5);
    new_bullet.bullet = true;
    new_bullet.body.setCollisionCategory(1000);
    new_bullet.body.velocity.x = this.BULLET_VEL * Math.sin(- angle_to_mouse);
    new_bullet.body.velocity.y = this.BULLET_VEL * Math.cos(angle_to_mouse);
    new_bullet.body.setCategoryContactCallback(this.MAP_BODY, this.kill, this);
    new_bullet.body.setCategoryContactCallback(this.DOOR_BODY, this.kill, this);
    //ADD TTL
    this.world.bringToTop(new_bullet)
    setTimeout(function(b){b.destroy()}, 500, new_bullet);

  },

  kill: function(body1, body2, fixture1, fixture2, begin) {
    if (!begin) return;
    setTimeout(function(thingy){if(thingy.sprite)thingy.sprite.destroy();}, 10, body1);
  },
  
  render: function() {
    this.levelMan.render();
  },

  healthCallback: function(b1, b2, f1, f2, begin) {
    if (!begin) return;
    this.tinfoil -= 5;
    this.tinfoilStr.text = "Tinfoil Hat Strength: "+this.tinfoil+"%";
    if (this.tinfoil == 0) {
      this.player.sprite.destroy();
      this.gun.destroy();
      this.can_fire = false;
    }
  },

}

