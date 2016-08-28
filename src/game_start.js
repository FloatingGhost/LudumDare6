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
 
  BULLET_VEL: 500,
  RELOAD_RATE: 100,
  PLAYER_VEL: 200,
  MAP_BODY : 100,
  
  INVENTORY : {}, 

  preload:function() {
    game.load.image("bullet_img", "res/img/entities/Bullet.png");
    game.load.tilemap("Floor1",  "res/maps/Floor1.json", 
                      null, Phaser.Tilemap.TILED_JSON);
    game.load.image("Tiles",  "res/img/TILES.png");
    game.load.image("Door", "res/img/entities/Door.png"); 
    game.load.image("pistol", "res/img/entities/Gun.png"); 
    game.load.spritesheet("player", "res/img/entities/Player_Anim.png",50,55); 
    game.load.image("enemy", "res/img/entities/Player.png");
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
    this.doors   = game.add.physicsGroup(Phaser.Physics.BOX2D);

    //ENABLE THE JEWISH PHYSIKS TO CONTROL SPRITE
    game.physics.box2d.enable(this.player.sprite);
    this.player.sprite.body.setCategoryContactCallback(this.DOOR_BODY, this.moveRoom, this);
    this.player.sprite.body.fixedRotation = true
    

    //CREATE KEYBOARD STUFFS
    this.cursors = game.input.keyboard.createCursorKeys();
  
    //START PATHFINDER
    this.pathfinder = game.plugins.add(Phaser.Plugin.PathFinderPlugin);
    
    //LOAD MAPS
    this.map = game.add.tilemap("Floor1");
    
    this.map.addTilesetImage("Main", "Tiles");

    this.layer = this.map.createLayer("Tile Layer 1");

    this.layer.resizeWorld();
    
    this.map.setCollision([CRACKEDSTONE, WETSAND, IMPASSE, WATER, CLAY], true);

    //ALLOW JEWS TO CONTROL THE WORLD
    converted = game.physics.box2d.convertTilemap(this.map, this.layer);    
    
    sightBlockers = []
    for (var i = 0; i < converted.length; i++) {
      converted[i].setCollisionCategory(this.MAP_BODY);
    }
   
    var dat = this.map.layers[0].data;

    for ( i = 0; i < dat.length; i++) {
      for (j = 0; j < dat[i].length; j++) {
        tile = dat[i][j]
        if ([WETSAND, IMPASSE, CLAY, CRACKEDSTONE].includes(tile.index)) {
          sightBlockers.push(game.add.illuminated.rectangleObject(
            tile.worldX, tile.worldY,33,33));
        } 
      }
    }
    //Enable pathfinder
    var dat = []
    dat = _.cloneDeep(this.map.layers[0].data)
    dat = this.mapToPath(dat);
    this.pf = new PF.Grid(dat);
    this.path = new PF.AStarFinder({allowDiagonal:true, dontCrossCorners:true});
    
    game.world.bringToTop(this.bullets)
    
    this.lamps = [];

    this.player.lamp = game.add.illuminated.lamp(0,00, {distance:200,
                                                           colour:'rgba(255,255,255,1)'});
     
    //this.player.lamp.createLighting(this.player.sprite);
    this.player.lamp.createLighting(sightBlockers);
    this.lamps.push(this.player.lamp);
    this.mask = game.add.illuminated.darkMask(this.lamps, "#000");
    
    //this.mask.addLampSprite(this.player.sprite);
    this.mask.fixedToCamera = false;
    this.mask.x = 0; this.mask.y = 0;
    this.mask.width = 200*32;
    this.mask.height = 150*32;
    this.player.lamp.bringToTop()
  
    this.mask.alpha = 0.7;
    game.world.bringToTop(this.gun);
    game.world.bringToTop(this.player.sprite);  
    
    this.enemies.push(new AI(40*32, 98*32, "enemy", AI.MELEE, this.path, this.pf));
    
  },

  mapToPath: function(bk) {
    for (i = 0; i < bk.length; i++) {
      for (j = 0; j < bk[i].length; j++) {
        index = bk[i][j].index;
        if ([IMPASSE, CLAY, CRACKEDSTONE, WETSAND].includes(index)) {
          bk[i][j] = 1
        } else {bk[i][j] = 0}
      }
    }
    return bk;
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
  
    this.mask.refresh();
    this.player.lamp.x = this.player.sprite.world.x-200;
    this.player.lamp.y = this.player.sprite.world.y-200;
    
    this.player.lamp.refresh();
   
    for (i = 0; i < this.enemies.length; i++) {
      this.enemies[i].update(this.player.sprite.world.x, this.player.sprite.world.y);
    } 
  },

  fire: function(x, y, ang) {
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

    for (i = 0; i < this.enemies.length; i++) {
      this.enemies[i].render();
    }
  }

}

