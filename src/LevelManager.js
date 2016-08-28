var LevelManager = function() {
}

LevelManager.prototype = {
  MAP_BODY: 100,
  
  
  loadLevel: function(levelID) {
    this.completed = false
    this.enemies = [];
    this.buttons = [];
    this.lamps = [];

    var levelJSON = levels[levelID];
    var map = levelJSON.mapname;
    this.target = levelJSON.teleportTo;
    //LOAD MAPS
    this.map = game.add.tilemap(map);
    this.map.addTilesetImage("Main", "Tiles");
    this.layer = this.map.createLayer("Tile Layer 1");
    this.layer.resizeWorld();
    this.map.setCollision([CRACKEDSTONE, WETSAND, IMPASSE, WATER, CLAY], true);
    //LIGHTS
    this.setupLighting();

    //Enable pathfinder
    var dat = []
    dat = _.cloneDeep(this.map.layers[0].data)
    dat = this.mapToPath(dat);
    this.pf = new PF.Grid(dat);
    this.path = new PF.AStarFinder({allowDiagonal:true,
                                    heuristic:PF.Heuristic.Euclidian,
                                    weight: 100});

    var buttons = levelJSON.buttons;
    this.door  = levelJSON.door; 
    for (i = 0; i < buttons.length; i++) {
      var j = buttons[i];
      
      //Add a lomp
      lomp = game.add.illuminated.lamp(32*j.x, 32*j.y, {
                            color: 'rgb(255,0,0)'});
      
      var b = game.add.sprite(32*j.x, 32*j.y, j.type);
      b.lamp = lomp;
      this.lamps.push(b.lamp);
      game.physics.box2d.enable(b);
      b.body.fixedRotation = true;
      b.body.mass = 0.1
      b.click = game.add.audio("click");
      this.buttons.push(b);
      
    }

    //Load in goals
    this.goals = levelJSON.goals;

    var enemies_to_spawn = levelJSON.enemies;
    
    for (i = 0; i < enemies_to_spawn.length; i++) {
      var e = enemies_to_spawn[i];
      console.log("Spawning ",e.type," at ",e.x*32, e.y*32);
      var en = new AI(e.x*32, e.y*32, e.type, 
                    e.category, this.path, this.pf.clone());
      this.enemies.push(en);
    }

  },

  update: function(playerX, playerY) {
    for (i = 0; i < this.enemies.length; i++) {
      this.enemies[i].update(playerX, playerY)
    }

    this.mask.refresh();
    this.lamp.x = playerX-200;
    this.lamp.y = playerY-200;

    this.lamp.refresh();
    var yay = 0;
    //Check for success
    for (i = 0; i < this.buttons.length; i++) {
      //Check for intersection with goals
      button = this.buttons[i];
      button.body.setZeroVelocity();
      button.lamp.x = button.body.x-200;
      button.lamp.y = button.body.y-200;
      button.lamp.refresh();
      for (j = 0; j < this.goals.length; j++ ) {
        goal = this.goals[i];
        //Check in each of the 4 corners
        var x1 = 32*goal.x;
        var y1 = 32*goal.y;
        var x2 = x1 + (32*goal.width);
        var y2 = y1 + (32*goal.height);
        var centreX = (x1 + x2)/2;
        var centreY = (y1 + y2)/2;
        if (game.math.within(centreX, button.body.x, 64) &&
            game.math.within(centreY, button.body.y, 64)) {
          yay++;
          if (!goal.activated) {
            goal.activated = true;
            button.click.play();
          }
        } else {
          if (goal.activated) {
            goal.activated = false;
            button.click.play();
          }
        }
      }
      if (yay == this.goals.length && !this.completed) {
        this.completed = true;
        //Open the door
        game.add.audio("tele").play();
      }
    }
    
  }, 

  render: function() {
    for (i = 0; i < this.enemies.length; i++) {
      this.enemies[i].render();
    }
  },
    
  setupLighting: function() {
     //ALLOW JEWS TO CONTROL THE WORLD
    converted = game.physics.box2d.convertTilemap(this.map, this.layer);
    sightBlockers = []
    for (var i = 0; i < converted.length; i++) {
      converted[i].setCollisionCategory(this.MAP_BODY);
    }
    //Save it for later
    this.collisionMap = converted;
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

    this.lamp = game.add.illuminated.lamp(0,0,{distance:200});
    this.lamp.createLighting(sightBlockers);
    this.lamps.push(this.lamp);
    this.mask = game.add.illuminated.darkMask(this.lamps, "#000");
    this.mask.fixedToCamera = false;
    this.mask.x = 0; this.mask.y = 0;
    this.mask.width = 200*32;
    this.mask.height = 150*32;
    this.mask.alpha = 0.7;

    this.lamp.bringToTop()
    
   
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
}

//lovely JSONs
levels = [{
  mapname: "Floor1",
  enemies: [
    {
     type:"mummy",
     category: AI.prototype.MELEE,
     x: 10,
     y: 10,
    }
  ],
  buttons: [
    {
      type: "button",
      x: 20,
      y: 10
    }
  ],
  goals: [
    {
      type: "button",
      x: 38,
      y: 35,
      width: 6,
      height: 6,
      activated: 0,
    }
  ],
  door: {
    x:43,
    y:39,
    width: 6,
    height: 1
  },
  teleportTo: {
    x: 45,
    y: 46
  
  }
}]
