var Alert = function() {
  this.msgBox = game.add.sprite(50, 250, "msgbox");
  this.msgBox.alpha = 0;
  this.msgBox.fixedToCamera = true;
}

Alert.prototype = {
  interrupt: false,
  text: [],
  nameStyle: {
              font: 'bold 30pt Arial', 
              fill: 'white'
            },
  msgStyle: {
              font: '15pt Arial',
              wordWrap: true,
              wordWrapWidth: 450,
              fill: 'white'
            },
  nextStyle: {
              font: '10pt Arial',
              fill: 'white'
            },

  showMessage: function(name, message) {
    this.interrupt = true;
    this.msgBox.alpha = 1;
    game.world.bringToTop(this.msgBox);
    this.time = 20;
    var nametext = game.add.text(60, 270, name, this.nameStyle);
    game.world.bringToTop(nametext);
    nametext.fixedToCamera =true;
    this.text.push(nametext);
    var msgtext = game.add.text(60, 320, message, this.msgStyle);
    game.world.bringToTop(msgtext);
    msgtext.fixedToCamera = true;
    this.text.push(msgtext);
    var nextText = game.add.text(430, 430, "LMB to continue", this.nextStyle);
    game.world.bringToTop(nextText);
    nextText.fixedToCamera = true;
    this.text.push(nextText);
  },

  update: function() {
    if (this.time != 0) {
      this.time -= 1
      return;
    }
    if (game.input.activePointer.isDown) {
      this.interrupt = false;
      this.msgBox.alpha = 0;
      for (i = 0; i < this.text.length; i++) {
        this.text[i].destroy();
      }
    }
  }
}
