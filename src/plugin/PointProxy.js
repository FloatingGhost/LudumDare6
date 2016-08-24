/**
* @author       Chris Campbell <iforce2d@gmail.com>
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
* A PointProxy is an internal class that allows for direct getter/setter style property access to box2d.b2Vec2 objects but inverses the values on set.
* The value of the vector is not stored in this class. Instead, it holds a reference to the object that actually stores the value, along with the functions used to get and set from that object.
*
* @xclass Phaser.Physics.Box2D.PointProxy
* @classdesc PointProxy
* @constructor
* @param {Phaser.Physics.Box2D} world - A reference to the Box2D world, used for pixel/meter conversions.
* @param {any} object - The object to bind to, which holds the actual value.
* @param {function} gettor - The function of the bound object which gets the value from it.
* @param {function} settor - The function of the bound object which sets the value in it.
*/
Phaser.Physics.Box2D.PointProxy = function (world, object, gettor, settor) {

    this.world = world;
    this.object = object;
    this.gettor = gettor;
    this.settor = settor;

};

Phaser.Physics.Box2D.PointProxy.prototype.constructor = Phaser.Physics.Box2D.PointProxy;

/**
* @name Phaser.Physics.Box2D.PointProxy#x
* @property {number} x - The x property of this PointProxy.
*/
Object.defineProperty(Phaser.Physics.Box2D.PointProxy.prototype, "x", {

    get: function () {

        return this.world.mpx(-this.gettor.call(this.object).x);

    },

    set: function (value) {
        
        var v = this.gettor.call(this.object);
        v.x = this.world.pxm(-value);
        this.settor.call(this.object, v);

    }

});

/**
* @name Phaser.Physics.Box2D.PointProxy#y
* @property {number} y - The y property of this PointProxy.
*/
Object.defineProperty(Phaser.Physics.Box2D.PointProxy.prototype, "y", {

    get: function () {

        return this.world.mpx(-this.gettor.call(this.object).y);

    },

    set: function (value) {

        var v = this.gettor.call(this.object);
        v.y = this.world.pxm(-value);
        this.settor.call(this.object, v);

    }

});
