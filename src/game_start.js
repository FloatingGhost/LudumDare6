var GameStart = function() {};

GameStart.prototype = {
   
  player:0,
  can_fire: true,
  
  BULLET_VEL: 500,
  RELOAD_RATE: 100,

  preload:function() {
    game.load.image("player_img", "res/img/entities/Player.png");        
    game.load.image("bullet_img", "res/img/entities/Bullet.png");
  },

  init:   function() {
    console.log("Entering game_start...");
  },  

  create: function() {
    //START JEWISH PHYSICS
    game.physics.startSystem(Phaser.Physics.BOX2D);
  
    //CREATE SPRITES  
    this.player = new Entity();   
    this.player.sprite = game.add.sprite(game.world.centerX, game.world.centerY, "player_img");

    //CREATE GROUPS
    this.bullets = game.add.group(); 

    //ENABLE THE JEWISH PHYSIKS TO CONTROL SPRITE
    game.physics.box2d.enable(this.player.sprite);

    //CREATE KEYBOARD STUFFS
    this.cursors = game.input.keyboard.createCursorKeys();
  
  },

  update: function() {
    this.player.sprite.body.setZeroVelocity();
    var angle_to_mouse = game.math.angleBetweenPoints(game.input.activePointer.position, this.player.sprite.position);    

    this.player.sprite.body.rotation = angle_to_mouse;
    
    //UP/DOWN
    if (this.cursors.up.isDown || game.input.keyboard.isDown(Phaser.Keyboard.W)) {
      this.player.sprite.body.moveUp(400);
    }                          
    else if (this.cursors.down.isDown || game.input.keyboard.isDown(Phaser.Keyboard.S)) {
      this.player.sprite.body.moveDown(400);
    }

    //LEFT/RIGHT
    if (this.cursors.left.isDown || game.input.keyboard.isDown(Phaser.Keyboard.A)) {
      this.player.sprite.body.moveLeft(400);
    }
    else if (this.cursors.right.isDown || game.input.keyboard.isDown(Phaser.Keyboard.D)) {
      this.player.sprite.body.moveRight(400);
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
    var angle_to_mouse = this.player.sprite.body.rotation + Math.PI/2;
    var new_bullet = this.bullets.create(x+50*Math.sin( - angle_to_mouse ), y+50*Math.cos( angle_to_mouse), "bullet_img");
    game.physics.box2d.enable(new_bullet);
    new_bullet.body.setCircle(2.5);
    new_bullet.bullet = true;
    new_bullet.body.velocity.x = this.BULLET_VEL * Math.sin(- angle_to_mouse);
    new_bullet.body.velocity.y = this.BULLET_VEL * Math.cos(angle_to_mouse);
  },
}

