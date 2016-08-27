function generateWorld(width, height) {
  var rooms = []
  for (i = 0; i < width; i++) {
    rooms.push([])
    for (j = 0; j < height; j++) {
      rooms[i].push(null);
    }
  }

  //Pick a starting location
  var k = Math.floor(width * Math.random());
  var l = Math.floor(height* Math.random());
  var startLocation = {x:k, y:l};
  for (m = 0; m < width*height; m++) {
    //30% chance of a room generating
    if (Math.random() > 0.3) {
      rooms[k][l] = 1;
      //Traverse in a random direction
      var n = Math.floor(Math.random()*4);
      switch (n) {
        case 3:
          if (k == width-1) n--;
          else k++;
        case 2:
          if (k == 0) n--;
          else k--;
        case 1:
          if (l == height - 1) n--;
          else l++;
        case 0:
          if (l == 0) n--;
          else l--;
      }
    }
  }
  return [rooms, startLocation];
}

function Room(tilemap) {
  this.tilemap = tilemap;
  this.doors = [];
}


Room.prototype = {
  tilemap: null,
  enemies: null,  
  addDoor: function(x, y) {
                this.doors.push(new Door({x:x, y:y}));
  }
}

function Door(toPosition) {
  this.toPosition = toPosition;
}

Door.prototype = {
  toPosition : {x:0, y:0}
}
