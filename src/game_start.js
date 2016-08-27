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

  DOOR_BODY: 200,
  MAP_BODY : 100,
  

  preload:function() {
    game.load.image("player_img", "res/img/entities/Player.png");        
    game.load.image("bullet_img", "res/img/entities/Bullet.png");
    game.load.tilemap("TESTMAP",  "res/maps/Test_Map.json", 
                      null, Phaser.Tilemap.TILED_JSON);
    game.load.image("Tile1",  "res/img/TILES.png");
    game.load.image("Door", "res/img/entities/Door.png"); 
  },

  init:   function() {
    console.log("Entering game_start...");
  },  

  create: function() {
    //GENERATE WORLD
    [this.worldMap, this.mapPos] = generateWorld(5, 5);

    //GENERATE ROOM OBJECTS
    this.tilemaps = ["TESTMAP"]

    //CREATE STARTING ROOM
    this.worldMap[this.mapPos.x][this.mapPos.y] = new Room("TESTMAP");
    //CREATE DOORS
    for (k = -1; k <= 1; k++) {          
      for (l = -1; l <=1; l++) {
        try {
          var xor = Math.abs(k) ^ Math.abs(l);
          if (xor && this.worldMap[this.mapPos.x+k][this.mapPos.y + l] != null) { 
            //We need a door             
            this.worldMap[this.mapPos.x][this.mapPos.y].addDoor(this.mapPos.x + k, this.mapPos.y + l);
          } 
        } catch (e) { console.log(e) }
      }
    }
    //ASSIGN EACH ROOM A MAP
    for (i = 0; i < this.worldMap.length; i++) {
      for (j = 0; j < this.worldMap[i].length; j++) {
        if (this.worldMap[i][j] === 1) {
          m = this.tilemaps[Math.floor(Math.random()*this.tilemaps.length)]
          this.worldMap[i][j] = new Room(m);
          //CREATE DOORS
          for (k = -1; k <= 1; k++) {
            for (l = -1; l <=1; l++) {
              try {
                var xor = Math.abs(k) ^ Math.abs(l);
                if (xor && this.worldMap[i+k][j+l] != null) {
                  //We need a door
                  this.worldMap[i][j].addDoor(i+k, j+l);
                }
              } catch (e) {}
            }
          }
        }    
      }
    }
    document.getElementById("map").innerHTML = JSON.stringify(this.worldMap, null, 4);

    //START JEWISH PHYSICS
    game.physics.startSystem(Phaser.Physics.BOX2D);

    //CREATE SPRITES  
    this.player = new Entity();   
    this.player.sprite = game.add.sprite(game.world.centerX, game.world.centerY, "player_img");
    //CREATE GROUPS
    this.bullets = game.add.group(); 
    this.doors   = game.add.physicsGroup(Phaser.Physics.BOX2D);

    //ENABLE THE JEWISH PHYSIKS TO CONTROL SPRITE
    game.physics.box2d.enable(this.player.sprite);
    this.player.sprite.body.setCategoryContactCallback(this.DOOR_BODY, this.moveRoom, this);
    
    //CREATE KEYBOARD STUFFS
    this.cursors = game.input.keyboard.createCursorKeys();
  
    //START PATHFINDER
    this.pathfinder = game.plugins.add(Phaser.Plugin.PathFinderPlugin);
    

    //ENTER THE STARTING ROOM
    this.enterRoom()
  },

  enterRoom: function(x,y) {
    console.log("ENTERING ("+this.mapPos.x+","+this.mapPos.y+")");
   
    if (x != undefined) {
      console.log("MOVEMENT: ",x,y);
      if (x ==-1) this.player.sprite.body.x = 80;
      if (x ==1)this.player.sprite.body.x = 560;
      if (y ==1)this.player.sprite.body.y = 400;
      if (y ==-1)this.player.sprite.body.y=80;
    }
    for (i = 0; i < this.doors.length; i++) {
      this.doors.children[i].destroy()
    } 
    this.bullets.removeAll();
    if (this.map) this.map.destroy();
    if (this.layer) this.layer.destroy();
 
    //FIGURE OUT WHERE WE ARE
    position = this.mapPos 
    room = this.worldMap[position.x][position.y];
    
    //LOAD MAPS
    this.map = game.add.tilemap(room.tilemap);
    
    this.map.addTilesetImage("Tile1");
    this.layer = this.map.createLayer("Tile Layer 1");
    this.layer.resizeWorld();
    this.map.setCollisionBetween(3,4);

    //ALLOW JEWS TO CONTROL THE WORLD
    converted = game.physics.box2d.convertTilemap(this.map, this.layer);    
    for (var i = 0; i < converted.length; i++) {
      converted[i].setCollisionCategory(this.MAP_BODY);
    }
    
    for (i = 0; i < room.doors.length; i++) {
      var door = room.doors[i];
      var yDiff = this.mapPos.y - door.toPosition.y;
      var xDiff = this.mapPos.x - door.toPosition.x;
      if (yDiff == -1) {
        a = this.doors.create(game.world.centerX, 25, "Door");
      } else if (yDiff == 1) { 
        a = this.doors.create(game.world.centerX, 480-25, "Door");
      } else if (xDiff == -1) {
        a = this.doors.create(25, game.world.centerY, "Door");
      } else {
        a = this.doors.create(640-25, game.world.centerY, "Door");
      }
      a.body.toPosition = door.toPosition;
    }
    for (i = 0; i < this.doors.length; i++) {
      this.doors.children[i].body.static = true;
      this.doors.children[i].body.setCollisionCategory(this.DOOR_BODY);
    
    }
    //Enable pathfinder
    console.log(this.map.layers[0].data)
    var dat = []
    dat = _.cloneDeep(this.map.layers[0].data)
    dat = this.mapToPath(dat);
    console.log(dat);
    this.pf = new PF.Grid(dat);
    this.path = new PF.AStarFinder();
    game.world.bringToTop(this.player.sprite);  
    game.world.bringToTop(this.bullets)
    game.world.bringToTop(this.doors);
    console.log(this.path.findPath(0,0,2,2,this.pf));

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
    var angle_to_mouse = game.math.angleBetweenPoints(game.input.activePointer.position, this.player.sprite.position);    

    this.player.sprite.body.rotation = angle_to_mouse;
    
    //UP/DOWN
    if (this.cursors.up.isDown || game.input.keyboard.isDown(Phaser.Keyboard.W)) {
      this.player.sprite.body.velocity.y = -(this.PLAYER_VEL);
    }                          
    else if (this.cursors.down.isDown || game.input.keyboard.isDown(Phaser.Keyboard.S)) {
      this.player.sprite.body.velocity.y = (this.PLAYER_VEL);
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
        this.fire(this.player.sprite.x, this.player.sprite.y);
        this.can_fire = false;
        setTimeout(function(that){that.can_fire = true}, this.RELOAD_RATE, this);
      }
    }

  },

  fire: function(x, y) {
    var offset = this.player.sprite.width;
    var angle_to_mouse = this.player.sprite.body.rotation + Math.PI/2;
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

  moveRoom: function(b1, b2, f1, f2, begin) {
    if (!begin) return;
    if (!this.allowDoors) return;
    this.allowDoors = false;
    pos = b2.toPosition;
    xDiff = (pos.x - this.mapPos.x)
    yDiff = (pos.y - this.mapPos.y)
    //Strange bug
    if (xDiff && yDiff) xDiff = 0;
    this.mapPos = pos;

    console.log("MOVING BODY");
    console.log(this.player.sprite);

    setTimeout(function(that){ that.allowDoors = true;
                              that.enterRoom(xDiff,yDiff); }, 1, this,xDiff,yDiff);
  },

  findPathTo: function(tilex, tiley) {
    console.log("Finding path...",tilex, tiley);
  
  },
}

