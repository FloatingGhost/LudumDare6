function AI(x, y, fname, aitype, pathfinder, pf) {
  this.sprite = game.add.sprite(x,y,fname);
  game.physics.box2d.enable(this.sprite); 
  this.sprite.body.setCollisionCategory(999);
  this.sprite.body.setCategoryContactCallback(1000, this.healthCallback, this);
  this.aitype = aitype;
  if ([undefined, null].includes(this.aitype)) this.aitype = 1;
  this.pathfinder = pathfinder;
  this.pf = pf;
  this.healthbar = game.add.graphics(0,0);
  this.sprite.body.fixedRotation = true;
  this.MAXHEALTH = this.HEALTH
  
}

AI.prototype = {
  RANGED: 0,
  MELEE : 1,
  HEALER: 2,
  HEALTH: 100, 
  SPEED: 10,
  can_fire: true,

  posToSquare: function(i) {
    return Math.floor(i/32);
  }, 

  update: function(playerX, playerY) {
    //Find a path
    if (this.HEALTH <= 0) return;
    bak = this.pf.clone(); 
    this.path = this.pathfinder.findPath(
                            this.posToSquare(this.sprite.world.x), 
                            this.posToSquare(this.sprite.world.y),
                            this.posToSquare(playerX), this.posToSquare(playerY),
                            this.pf);
    this.pf = bak;
    if (this.path == []) return;
    //RANGED WILL TRY TO SIT 5 SQUARES AWAY
    if (this.aitype == this.RANGED) {
      this.path = this.path.slice(0, this.path.length - 5);    
    }
    //MELEE WILL JUST BUMRUSH
    //CONVERT TO POSITIONS
    var xArr = [this.sprite.world.x];
    var yArr = [this.sprite.world.y];
    for (i = 1; i < this.path.length; i++) {
      xArr.push(this.path[i][0] * 32);
      yArr.push(this.path[i][1] * 32);
    }
    //Check for distance
    if (1 < xArr.length && xArr.length < 100) {
      
      movingTo = [xArr[1], yArr[1]]
      if (JSON.stringify(movingTo) == JSON.stringify(this.movingTo)) return;
 
       this.movingTo = movingTo;
       game.add.tween(this.sprite.body).to({x:xArr[2], y:yArr[2]}, 
                                              (10000) / this.SPEED).start();
        //if (xDiff < 0) this.sprite.body.moveLeft(Math.abs(xDiff));
        //if (xDiff > 0) this.sprite.body.moveRight(Math.abs(xDiff));
        //if (yDiff < 0) this.sprite.body.moveUp(Math.abs(yDiff));
        //if (yDiff < 0) this.sprite.body.moveDown(Math.abs(yDiff));
    }  else {
    //this.sprite.body.setZeroVelocity();
  }

  //Check for LoS, and fire if ranged
  xDiff = Math.abs(this.sprite.world.x - playerX);
  yDiff = Math.abs(this.sprite.world.y - playerY);
  distance = Math.sqrt((xDiff*xDiff) + (yDiff*yDiff));
  if (this.aitype == this.RANGED && distance < 500) {
    //Raycast from here to the player
    var ray = game.physics.box2d.raycast(this.sprite.world.x, 
                                         this.sprite.world.y,
                                         playerX, playerY,
                                         0, null);
    for (i = 0; i < ray.length; i++) {
      if (ray[i].body.name == "PLAYER" && this.can_fire) {
        //I see you!
        this.fire(playerX, playerY); 
        this.can_fire = false;
      }
    } 
  }
  },
  fire: function(pX, pY) {
    var offset = this.sprite.width;
    var angle_to_mouse = game.math.angleBetweenPoints(
                            {x:this.sprite.world.x, y:this.sprite.world.y},
                            {x:pX, y:pY})+ Math.PI/2;
    var new_bullet = game.add.sprite(this.sprite.world.x+offset*Math.sin( - angle_to_mouse ), this.sprite.world.y+offset*Math.cos( angle_to_mouse), "arrow");
    game.physics.box2d.enable(new_bullet);
    new_bullet.body.setCollisionCategory(1000);
    new_bullet.body.velocity.x = this.BULLET_VEL * Math.sin(- angle_to_mouse);
    new_bullet.body.velocity.y = this.BULLET_VEL * Math.cos(angle_to_mouse);
    new_bullet.body.setCategoryContactCallback(100, this.kill, this);
    //ADD TTL
    game.world.bringToTop(new_bullet)

  },

  kill: function(b1, b2, f1, f2, begin) {
    if (!begin)return;
    b1.destroy();
  },

  healthCallback: function(b1, b2, f1, f2, begin) {
    if (!begin) return;
    b2.destroy();
    this.HEALTH -= 25;
    if (this.HEALTH == 0) b1.sprite.destroy();
  },

  render: function() {
    
    this.healthbar.clear();
    if (!this.sprite.alive) return
    game.world.bringToTop(this.healthbar);
    this.healthbar.moveTo(this.sprite.world.x-this.sprite.height/2, 
                          this.sprite.world.y-this.sprite.height);

    this.healthbar.lineStyle(3, 0x00000, 0.8);
    this.healthbar.beginFill(0x00000);
    this.healthbar.drawRect(this.sprite.world.x-this.sprite.height/2,
                            this.sprite.world.y-this.sprite.height,
                            50, 10);
    this.healthbar.beginFill(0xff0000);
    this.healthbar.drawRect(this.sprite.world.x-this.sprite.height/2,
                            this.sprite.world.y-this.sprite.height,
                            50*(this.HEALTH/this.MAXHEALTH), 10);
    this.healthbar.endFill();
    
  }
}
