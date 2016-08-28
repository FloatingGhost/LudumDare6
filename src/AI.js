function AI(x, y, fname, aitype, pathfinder, pf) {
  this.sprite = game.add.sprite(x,y,fname);
  game.physics.box2d.enable(this.sprite); 
  this.aitype = aitype;
  if (!this.aitype) this.aitype = 1;
  this.pathfinder = pathfinder;
  this.pf = pf;
  console.log(pf);
  console.log("Creating ",fname,", TYPE ",this.aitype,", AT (",x,y,")");
}

AI.prototype = {
  RANGED: 0,
  MELEE : 1,
  HEALER: 2,
  
  SPEED: 10,
  
  posToSquare: function(i) {
    return Math.floor(i/32);
  }, 

  update: function(playerX, playerY) {
    //Find a path
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
    if (1 < xArr.length && xArr.length < 30) {
    
      
      movingTo = [xArr[1], yArr[1]]
      if (JSON.stringify(movingTo) != JSON.stringify(this.movingTo)) {
        console.log(movingTo);
        console.log("FROM", this.sprite.world.x, this.sprite.world.y)
        this.movingTo = movingTo;
        
        t = game.add.tween(this.sprite.body).to({x:xArr[1], y:yArr[1]}, 
                                              (10000) / this.SPEED);
        t.start();
        //if (xDiff < 0) this.sprite.body.moveLeft(Math.abs(xDiff));
        //if (xDiff > 0) this.sprite.body.moveRight(Math.abs(xDiff));
        //if (yDiff < 0) this.sprite.body.moveUp(Math.abs(yDiff));
        //if (yDiff < 0) this.sprite.body.moveDown(Math.abs(yDiff));
      }
    }
  }
}