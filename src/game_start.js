var GameStart = function() {};

GameStart.prototype = {
   
  player:0,
  can_fire: true,
  world:false,
  doors:false,
  allowDoors: true,
  
  BULLET_VEL: 500,
  RELOAD_RATE: 100,
  PLAYER_VEL: 200,
  MAP_BODY : 100,
  
  INVENTORY : {}, 

  preload:function() {
    game.load.image("bullet_img", "res/img/entities/Bullet.png");
    game.load.tilemap("Floor1",  "res/maps/Main_Map.json", 
                      null, Phaser.Tilemap.TILED_JSON);
    game.load.image("Tiles",  "res/img/TILES.png");
    game.load.image("Door", "res/img/entities/Door.png"); 
    game.load.image("pistol", "res/img/entities/Gun.png"); 
    game.load.spritesheet("player", "res/img/entities/Player_Anim.png",50,50); 

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
    this.player.sprite = game.add.sprite(32*88, 32*147, 
                          "player");
    this.player.walk_away = this.player.sprite.animations.add("walk_away", 
                                                              [0,1,2,3,4,5,6,7,8,9]);
    this.player.walk_to   = this.player.sprite.animations.add("walk_to", 
                                                       [11,12,13,14,15,16,17,18,19,20]);
    this.player.sprite.animations.play("walk_away", 15, true);
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
    
    SAND = 5
    IMPASSE = 7
    WATER = 8
    CLAY = 6
    WETSAND = 3
    CRACKEDSTONE = 4 
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
        if ([IMPASSE, CLAY, CRACKEDSTONE].includes(tile.index)) {
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
    this.path = new PF.AStarFinder();
    
    game.world.bringToTop(this.bullets)
    game.world.bringToTop(this.gun);
    
    this.lamps = [];

    this.player.lamp = game.add.illuminated.lamp(400,400, {distance:0});
    //this.player.lamp.createLighting(this.player.sprite);
    //this.mask.addLampSprite(this.player.sprite);
    game.world.bringToTop(this.player.sprite);  
    
    this.player.lamp.createLighting(sightBlockers);
    this.lamps.push(this.player.lamp);
    this.mask = game.add.illuminated.darkMask(this.lamps, "#120b0b");
  },

  mapToPath: function(bk) {
    for (i = 0; i < bk.length; i++) {
      for (j = 0; j < bk[i].length; j++) {
        index = bk[i][j].index;
        if ([2,3].includes(index)) {
          bk[i][j] = 0
        } else {bk[i][j] = 1}
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
    }
    else if (this.cursors.right.isDown || game.input.keyboard.isDown(Phaser.Keyboard.D)) {
      this.player.sprite.body.velocity.x = (this.PLAYER_VEL);
    
    }
    //CLICK
    if (game.input.activePointer.isDown) {
      if (this.can_fire) {
        this.fire(this.player.sprite.world.x, this.player.sprite.world.y, angle_to_mouse);
        this.can_fire = false;
        setTimeout(function(that){that.can_fire = true}, this.RELOAD_RATE, this);
      }
    }
    this.player.lamp.x = this.player.sprite.world.x-200;
    this.player.lamp.y = this.player.sprite.world.y-200;
    this.player.lamp.refresh();
    //this.mask.refresh();
  },

  fire: function(x, y, ang) {
    var offset = this.player.sprite.width;
    var angle_to_mouse = ang + Math.PI/2;
    var new_bullet = this.bullets.create(x+offset*Math.sin( - angle_to_mouse ), y+offset*Math.cos( angle_to_mouse), "bullet_img");
    game.physics.box2d.enable(new_bullet);
    new_bullet.body.setCircle(2.5);
    new_bullet.bullet = true;
    new_bullet.body.velocity.x = this.BULLET_VEL * Math.sin(- angle_to_mouse);
    new_bullet.body.velocity.y = this.BULLET_VEL * Math.cos(angle_to_mouse);
    new_bullet.body.setCategoryContactCallback(this.MAP_BODY, this.kill, this);
    new_bullet.body.setCategoryContactCallback(this.DOOR_BODY, this.kill, this);
    //ADD TTL
    setTimeout(function(b){b.destroy()}, 500, new_bullet);

  },

  kill: function(body1, body2, fixture1, fixture2, begin) {
    if (!begin) return;
    setTimeout(function(thingy){thingy.sprite.destroy();}, 100, body1);
  },

}

