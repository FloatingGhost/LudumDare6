var Intro = function() {};

text = ["Hey there. I'm Timothy. I'm a professional reptile exposer",
             "Now I know, you're all well aware of the lizard people that control government", "But what if I told you that I had proof of something more sinister?", "Well, that's precicely what I'm about to show you."]

index = 0
Intro.prototype = {
   
  preload:function() {
    game.load.image("i1", "res/img/entities/Intro_1.png");
    game.load.image("i2", "res/img/entities/Intro_2.png");
    game.load.image("msgbox", "res/img/entities/MsgBox.png");
  },

  init:   function() {
  },  

  create: function() {
    this.alerts = new Alert();
    this.alerts.y = 360;
    game.add.sprite(0,0,"i1");
  },

  update: function() {
    if (this.alerts.interrupt) {
      this.alerts.update();
      return;
    } 
    if (index != text.length) {
      if (index == 2){this.alerts.x += 100; game.add.sprite(0,0,"i2")};

      this.alerts.showMessage("Timothy", text[index]);
      index+=1;
    } else {
      this.alerts.x = 270; this.alerts.y = 60;
      game.state.start("game_start");
    }
  },

  render: function() {

  },

}
