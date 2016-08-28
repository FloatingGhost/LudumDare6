var Hitler = function() {};
SAND = 5
IMPASSE = 7
WATER = 8
CLAY = 6
WETSAND = 3
CRACKEDSTONE = 4
LADDER_BL = 23
LADDER_BR = 24
LADDER_TL = 13
LADDER_TR = 14
OTHERSAND = 2
GREENTHING = 9
introText = [
 ["???", "Guten Tag, mein kind"],
 ["???", "You have braved much to see me."],
 ["Timothy",  "What. Are. You."],
 ["???", "The relic of a time gone by. The creator of this great pyramid."],
 ["Timothy", "But this was created by aliens from the gamma sector!"],
 ["Timothy", "There should be proof here!"],
 ["Squidler", "Nein, it is I that built it. All of it."],
 ["Timothy", "YOU'RE WRONG! YOU'RE HIDING THE EVIDENCE AND I KNOW IT!"],
 ["Squidler", "Calm down, klein one."],
 ["Timothy", "That's enough. Too many people have hidden the truth from me."],
 ["Timothy", "NO MORE. Stand aside, SSquid."],
 ["Squidler", "So be it, but let it be known that you shall never find your proof."]
]
introIndex = 0;
Hitler.prototype = {
  RELOAD_RATE: 300,
  PLAYER_VEL: 300, 
  can_fire: false,
  MAP_BODY: 100, 
  hitlerTime: 200,

  preload: function() {
   
    game.load.image("msgbox", "res/img/entities/MsgBox.png"); 
    game.load.spritesheet("hitler", "res/img/entities/Hitlersquid.png",150,150);
    game.load.tilemap("floor", "res/maps/Hitler.json", null, Phaser.Tilemap.TILED_JSON)
    game.load.image("Tiles",  "res/img/TILES.png"); 
    game.load.spritesheet("player", "res/img/entities/Player_Anim.png", 50, 55)
    game.load.image("gun", "res/img/entities/Gun.png");
    game.load.image("bullet", "res/img/entities/Bullet.png");
    game.load.audio("intro", "res/snd/Hitler_Intro.wav");
    game.load.audio("theme", "res/snd/Hitler_Theme.wav");
    game.load.image("tank", "res/img/entities/Tank.png");
  },

  create: function() {
    game.physics.startSystem(Phaser.Physics.BOX2D);
    this.intro = game.add.audio("intro");
    this.intro.loop = 1
    this.intro.play();
    this.theme = game.add.audio("theme");
    this.theme.loop =1;
    this.alert = new Alert();
    this.map = game.add.tilemap("floor");
    this.map.addTilesetImage("Main", "Tiles");
    this.layer = this.map.createLayer("Tile Layer 1");
    this.layer.resizeWorld();
    this.map.setCollision([LADDER_BL, LADDER_BR, LADDER_TL, LADDER_TR,
                           CRACKEDSTONE, WETSAND, IMPASSE, WATER, CLAY], true);

    converted = game.physics.box2d.convertTilemap(this.map, this.layer);
    for (var i = 0; i < converted.length; i++) {
      var ind = this.map.getTile(
        Math.floor(converted[i].x / 32),
        Math.floor(converted[i].y / 32)).index;

      if ([LADDER_TL, LADDER_TR, LADDER_BR, LADDER_BL].includes(ind))
        converted[i].setCollisionCategory(2000)
      if ([IMPASSE, WATER, CLAY, CRACKEDSTONE, WETSAND].includes(ind))
        converted[i].setCollisionCategory(this.MAP_BODY);
    }

    this.hitler = game.add.sprite(325, 150, "hitler");
    this.hitler.anim = this.hitler.animations.add("squid");
    this.hitler.animations.play("squid", 5, true);
    this.player = game.add.sprite(10*32, 12*32, "player");
    this.gun    = game.add.sprite(0,0,"gun");
    game.physics.box2d.enable(this.hitler);
    game.physics.box2d.enable(this.player);
    this.hitler.HEALTH = 1000
    this.hitler.MAXHEALTH = 1000
    this.hitler.body.setCircle(50);
    this.player.body.fixedRotation = true;
    this.hitler.body.static = true;
    this.player.walk_away = this.player.animations.add("walk_away",
                                                        [0,1,2,3,4,5,6,7,8,9]);
    this.player.walk_to   = this.player.animations.add("walk_to",
                                                        [10,11,12,13,14,15,16,17,18,19])
    this.player.walk_right = this.player.animations.add("walk_right",
                                                        [20,21,22,23,24,25,26])
    this.player.walk_left = this.player.animations.add("walk_left",
                                                        [27,28,29,30,31,32,33]);

    this.bullets = game.add.group();  
    this.hitler.body.setCollisionCategory(1001);
    this.hitler.body.name = "hitler"
    this.player.body.setCollisionCategory(1002);
    //CREATE KEYBOARD STUFFS
    this.cursors = game.input.keyboard.createCursorKeys();
    this.player.health = 100;
    this.tinfoilStr = game.add.text(0, 460, "Tinfoil Hat Strength: "+this.player.health+"%", {font:"16pt Arial", fill: "black"});
    this.tinfoilStr.fixedToCamera = true;

    //CREATE MUSIC
    this.shoot = game.add.audio("shoot");
    this.healthBar = game.add.graphics();

  },
  
  hitlerAction: function() {
    var i = Math.floor(Math.random() * 5);
    switch (i) {
      case 0:
        this.fireCircle();
        break;
      default:
        this.fireCircle();
        break;

    }
    this.hitlerTime = 200;
  },
  update: function() {
    if (this.alert.interrupt) {
      this.alert.update();
      return;
    }
    if (introIndex < introText.length) {
      txt = introText[introIndex];
      introIndex++;
      this.alert.showMessage(txt[0], txt[1]);
    } else {
      if (introIndex != 100) {
      this.intro.stop();
      this.theme.play();
      introIndex = 100;
      this.can_fire = true;
      
      }
    }

    if (this.hitlerTime == 0) {
      this.hitlerAction();
    } else {

    this.hitlerTime-=1;
    }
    //Stop the player
    this.player.body.setZeroVelocity();
    var angle_to_mouse = game.math.angleBetweenPoints({
            x:game.input.activePointer.worldX,
            y:game.input.activePointer.worldY},
            {x: this.player.world.x, y:this.player.world.y});
    
    //ANGLE THE GUN
    var rot = angle_to_mouse+ Math.PI/2;
    this.gun.rotation = (rot+ Math.PI/2)
    this.gun.x = this.player.world.x + Math.sin(-rot)*15
    this.gun.y = this.player.world.y + Math.cos(rot)*15    
  
//UP/DOWN
    if (this.cursors.up.isDown || game.input.keyboard.isDown(Phaser.Keyboard.W)) {
      this.player.body.velocity.y = -(this.PLAYER_VEL);
    }
    else if (this.cursors.down.isDown || game.input.keyboard.isDown(Phaser.Keyboard.S)) {
      this.player.body.velocity.y = (this.PLAYER_VEL);
    }
    //LEFT/RIGHT
    if (this.cursors.left.isDown || game.input.keyboard.isDown(Phaser.Keyboard.A)) {
      this.player.body.velocity.x = -(this.PLAYER_VEL);
    }
    else if (this.cursors.right.isDown || game.input.keyboard.isDown(Phaser.Keyboard.D)) {
      this.player.body.velocity.x = (this.PLAYER_VEL);
    }

    if (this.player.body.velocity.x < 0) {
      //left
      this.player.animations.play("walk_left", 15, true);
    } else if (this.player.body.velocity.x > 0) {
      // right
      this.player.animations.play("walk_right", 15, true);
    } else if (this.player.body.velocity.y < 0) {
      //up
      this.player.animations.play("walk_away", 15, true);
    } else if (this.player.body.velocity.y > 0) {
      //down
this.player.animations.play("walk_to", 15, true);
    } else {
      this.player.animations.stop();
    }
    //CLICK
    if (game.input.activePointer.isDown) {
      if (this.can_fire) {
        xOff = 50 * Math.sin(-rot);
        yOff = 50 * Math.cos(rot);
        this.fire(xOff + this.player.world.x, 
                  yOff + this.player.world.y, rot);
        this.can_fire = false;
        setTimeout(function(that){that.can_fire = true}, this.RELOAD_RATE, this);
      }
    }
  },

  render: function() {
    if (introIndex != 100) return;
    x = 50
    y = 10
    game.world.bringToTop(this.healthBar);
    this.healthBar.moveTo(x,y);

    this.healthBar.lineStyle(3, 0x00000, 0.8);
    this.healthBar.beginFill(0x00000);
    this.healthBar.drawRect(x, y,
                            500, 30);
    this.healthBar.beginFill(0xff0000);
    this.healthBar.drawRect(x,y,
                            500*(this.hitler.HEALTH/this.hitler.MAXHEALTH), 30);
    this.healthBar.endFill();

  },

  fireCircle: function() {
    num = 5;
    angOffset = Math.random() * (Math.PI/4);
    offset = 100
    for ( i = angOffset + (-Math.PI/2); i <angOffset +  Math.PI/2 ; i += Math.PI/num) {
      xOff = Math.sin(-i) * offset;
      yOff = Math.cos(i)*offset;
      this.fire(this.hitler.world.x + xOff, yOff+this.hitler.world.y, i, 10, "tank");
    }
  },

  fire: function(x, y, angle, vel, sprite,cat,snd,speed) {
    if (!sprite) sprite = "bullet";
    if (!cat) cat = 1000;
    if (!speed) speed = 300;
    if (snd) snd.play();
    
    magicboolet = game.add.sprite(x,y,sprite);
    game.physics.box2d.enable(magicboolet);
    magicboolet.body.bullet = true;
    magicboolet.body.setCircle(magicboolet.width / 2);
    magicboolet.body.setCollisionCategory(cat);
    magicboolet.body.velocity.x = speed * Math.sin(-angle);
    magicboolet.body.velocity.y = speed * Math.cos(angle);
    magicboolet.body.setCategoryContactCallback(1001, this.hitHitler, this);
    magicboolet.body.setCategoryContactCallback(1002, this.hitPlayer, this);
    magicboolet.body.name = sprite;
    setTimeout(function(spr){if(spr)spr.destroy()}, 1500, magicboolet);
  },


  hitHitler: function(b1, b2, f1, f2, begin) {
    if (!begin) return;
    if (b1.name == "tank") return;
    b1.sprite.destroy(); 
    this.hitler.HEALTH -= 20;
    if (this.hitler.HEALTH == 0) {
      game.state.start("victory");
    }
  },

  hitPlayer: function(b1, b2, f1, f2, begin) {
    if (!begin) return;
    if (b1.name == "bullet") return;
    this.player.health -= 5;
    this.tinfoilStr.text = "Tinfoil Hat Strength: "+this.player.health+"%";
    b1.sprite.destroy();
  
    if (this.player.health == 0) {
      game.state.start("gameover");
    }
  }

  
}
