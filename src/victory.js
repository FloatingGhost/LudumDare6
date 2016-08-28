var Victory = function() {};

Victory.prototype = {
   
  preload:function() {
    game.load.image("bg", "res/img/entities/Victory.png");  
  },

  init:   function() {
  },  

  create: function() {
    game.add.sprite(0,0, "bg");

  },

  update: function() {

  },

  render: function() {

  },

}
