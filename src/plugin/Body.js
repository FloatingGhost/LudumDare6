/**
* @author       Chris Campbell <iforce2d@gmail.com>
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
* The Physics Body is typically linked to a single Sprite and defines properties that determine how the physics body is simulated.
* These properties affect how the body reacts to forces, what forces it generates on itself (to simulate friction), and how it reacts to collisions in the scene.
* In most cases, the properties are used to simulate physical effects. Each body also has its own property values that determine exactly how it reacts to forces and collisions in the scene.
* By default a single Rectangle shape is added to the Body that matches the dimensions of the parent Sprite. See addShape, removeShape, clearFixtures to add extra shapes around the Body.
* Note: When bound to a Sprite to avoid single-pixel jitters on mobile devices we strongly recommend using Sprite sizes that are even on both axis, i.e. 128x128 not 127x127.
* Note: When a game object is given a Box2D body it has its anchor x/y set to 0.5, so it becomes centered.
*
* @class Phaser.Physics.Box2D.Body
* @classdesc Physics Body Constructor
* @constructor
* @param {Phaser.Game} game - Game reference to the currently running game.
* @param {Phaser.Sprite} [sprite] - The Sprite object this physics body belongs to.
* @param {number} [x=0] - The x coordinate of this Body.
* @param {number} [y=0] - The y coordinate of this Body.
* @param {number} [density=2] - The default density of this Body (0 = static, 1 = kinematic, 2 = dynamic, 3 = bullet).
* @param {Phaser.Physics.Box2D} [world] - Reference to the Box2D World.
*/
Phaser.Physics.Box2D.Body = function (game, sprite, x, y, density, world) {

    if (typeof sprite === 'undefined') { sprite = null; }
    if (typeof x === 'undefined') { x = 0; }
    if (typeof y === 'undefined') { y = 0; }
    if (typeof density === 'undefined') { density = 2; }
    if (typeof world === 'undefined') { world = game.physics.box2d; }

    /**
    * @property {Phaser.Game} game - Local reference to game.
    */
    this.game = game;

    /**
    * @property {Phaser.Physics.Box2D} world - Local reference to the Box2D World.
    */
    this.world = world;

    /**
    * @property {number} id - a unique id for this body in the world
    */
    this.id = this.world.getNextBodyId();

    /**
    * @property {Phaser.Sprite} sprite - Reference to the parent Sprite.
    */
    this.sprite = sprite;

    /**
    * @property {number} type - The type of physics system this body belongs to.
    */
    this.type = Phaser.Physics.BOX2D;

    /**
    * @property {Phaser.Point} offset - The offset of the Physics Body from the Sprite x/y position.
    */
    this.offset = new Phaser.Point();

    /**
    * @property {box2d.b2BodyDef} bodyDef - The Box2D body definition
    * @protected
    */
    this.bodyDef = new box2d.b2BodyDef();

    this.bodyDef.position.SetXY(-this.world.pxm(x), -this.world.pxm(y));

    if (density === 0)
    {
        this.bodyDef.type = box2d.b2BodyType.b2_staticBody;
    }
    else if (density === 1)
    {
        this.bodyDef.type = box2d.b2BodyType.b2_kinematicBody;
    }
    else if (density === 2)
    {
        this.bodyDef.type = box2d.b2BodyType.b2_dynamicBody;
    }
    else if (density === 3)
    {
        this.bodyDef.type = box2d.b2BodyType.b2_bulletBody;
    }

    /**
    * @property {box2d.b2Body} data - The Box2D body data.
    * @protected
    */
    this.data = this.world.world.CreateBody(this.bodyDef);
    this.data.world = this.world.world;
    this.data.parent = this;

    /**
    * @property {Phaser.Physics.Box2D.PointProxy} velocity - The velocity of the body. Set velocity.x to a negative value to move to the left, position to the right. velocity.y negative values move up, positive move down.
    */
    this.velocity = new Phaser.Physics.Box2D.PointProxy(this.world, this.data, this.data.GetLinearVelocity, this.data.SetLinearVelocity);

    /**
    * @property {boolean} removeNextStep - To avoid deleting this body during a physics step, and causing all kinds of problems, set removeNextStep to true to have it removed in the next preUpdate.
    */
    this.removeNextStep = false;

    /**
    * @property {object} _fixtureContactCallbacks - Array of contact callbacks, triggered when this body begins or ends contact with a specific fixture.
    * @private
    */
    this._fixtureContactCallbacks = {};

    /**
    * @property {object} _fixtureContactCallbackContext - Array of fixture contact callback contexts.
    * @private
    */
    this._fixtureContactCallbackContext = {};

    /**
    * @property {object} _bodyContactCallbacks - Array of contact callbacks, triggered when this body begins or ends contact with a specific body.
    * @private
    */
    this._bodyContactCallbacks = {};

    /**
    * @property {object} _bodyContactCallbackContext - Array of body contact callback contexts.
    * @private
    */
    this._bodyContactCallbackContext = {};

    /**
    * @property {object} _categoryContactCallbacks - Array of contact callbacks, triggered when this body begins or ends contact with fixtures matching a specific mask.
    * @private
    */
    this._categoryContactCallbacks = {};

    /**
    * @property {object} _categoryContactCallbackContext - Array of category contact callback contexts.
    * @private
    */
    this._categoryContactCallbackContext = {};

    /**
    * @property {object} _fixtureCallbacks - Array of presolve callbacks, triggered while this body continues contact with a specific fixture.
    * @private
    */
    this._fixturePresolveCallbacks = {};

    /**
    * @property {object} _fixtureCallbackContext - Array of fixture presolve callback contexts.
    * @private
    */
    this._fixturePresolveCallbackContext = {};

    /**
    * @property {object} _bodyCallbacks - Array of presolve callbacks, triggered while this body continues contact with a specific body.
    * @private
    */
    this._bodyPresolveCallbacks = {};

    /**
    * @property {object} _bodyCallbackContext - Array of body presolve callback contexts.
    * @private
    */
    this._bodyPresolveCallbackContext = {};

    /**
    * @property {object} _categoryCallbacks - Array of presolve callbacks, triggered while this body continues contact with fixtures matching a specific mask.
    * @private
    */
    this._categoryPresolveCallbacks = {};

    /**
    * @property {object} _categoryCallbackContext - Array of category presolve callback contexts.
    * @private
    */
    this._categoryPresolveCallbackContext = {};

    /**
    * @property {object} _fixturePostsolveCallbacks - Array of postsolve callbacks, triggered while this body continues contact with a specific fixture.
    * @private
    */
    this._fixturePostsolveCallbacks = {};

    /**
    * @property {object} _fixturePostsolveCallbackContext - Array of fixture postsolve callback contexts.
    * @private
    */
    this._fixturePostsolveCallbackContext = {};

    /**
    * @property {object} _bodyPostsolveCallbacks - Array of postsolve callbacks, triggered while this body continues contact with a specific body.
    * @private
    */
    this._bodyPostsolveCallbacks = {};

    /**
    * @property {object} _bodyPostsolveCallbackContext - Array of body postsolve callback contexts.
    * @private
    */
    this._bodyPostsolveCallbackContext = {};

    /**
    * @property {object} _categoryPostsolveCallbacks - Array of postsolve callbacks, triggered while this body continues contact with a specific fixture.
    * @private
    */
    this._categoryPostsolveCallbacks = {};

    /**
    * @property {object} _categoryPostsolveCallbackContext - Array of category postsolve callback contexts.
    * @private
    */
    this._categoryPostsolveCallbackContext = {};
    
    //  Set-up the default shape
    if (sprite)
    {
        this.setRectangleFromSprite(sprite);
    }

};

Phaser.Physics.Box2D.Body.prototype = {

    /**
    * Sets a callback to be fired any time a fixture in this Body begins or ends contact with a fixture in the given Body. 
    * The callback will be sent 6 parameters:
    *     this body
    *     the body that was contacted
    *     the fixture in this body (box2d.b2Fixture)
    *     the fixture in the other body that was contacted (box2d.b2Fixture)
    *     a boolean to say whether it was a begin or end event
    *     the contact object itself (box2d.b2Contact)
    * Note that the impact event happens after collision resolution, so it cannot be used to prevent a collision from happening.
    *
    * @method Phaser.Physics.Box2D.Body#setBodyContactCallback
    * @param {Phaser.Sprite|Phaser.Physics.Box2D.Body} object - The object to do callbacks for.
    * @param {function} callback - The callback to fire on contact. Set to null to clear a previously set callback.
    * @param {object} callbackContext - The context under which the callback will fire.
    */
    setBodyContactCallback: function (object, callback, callbackContext) {

        var id = -1;

        if (object['id'])
        {
            id = object.id;
        }
        else if (object['body'])
        {
            id = object.body.id;
        }

        if (id > -1)
        {
            if (callback === null)
            {
                delete (this._bodyContactCallbacks[id]);
                delete (this._bodyContactCallbackContext[id]);
            }
            else
            {
                this._bodyContactCallbacks[id] = callback;
                this._bodyContactCallbackContext[id] = callbackContext;
            }
        }

    },

    /**
    * Sets a callback to be fired any time the given fixture begins or ends contact something
    * The callback will be sent 6 parameters:
    *     this body
    *     the body that was contacted
    *     the fixture in this body (box2d.b2Fixture)
    *     the fixture in the other body that was contacted (box2d.b2Fixture)
    *     a boolean to say whether it was a begin or end event
    *     the contact object itself (box2d.b2Contact)
    * Note that the impact event happens after collision resolution, so it cannot be used to prevent a collision from happening.
    *
    * @method Phaser.Physics.Box2D.Body#setFixtureContactCallback
    * @param {box2d.b2Fixture} fixture - The fixture to do callbacks for.
    * @param {function} callback - The callback to fire on contact. Set to null to clear a previously set callback.
    * @param {object} callbackContext - The context under which the callback will fire.
    */
    setFixtureContactCallback: function (fixture, callback, callbackContext) {

        var id = fixture.id;

        if (id > -1)
        {
            if (callback === null)
            {
                delete (this._fixtureContactCallbacks[id]);
                delete (this._fixtureContactCallbackContext[id]);
            }
            else
            {
                this._fixtureContactCallbacks[id] = callback;
                this._fixtureContactCallbackContext[id] = callbackContext;
            }
        }

    },

    /**
    * Sets a callback to be fired any time a fixture in this body begins contact with a fixture in another body that matches given category set.
    * The callback will be sent 6 parameters:
    *     this body
    *     the body that was contacted
    *     the fixture in this body (box2d.b2Fixture)
    *     the fixture in the other body that was contacted (box2d.b2Fixture)
    *     a boolean to say whether it was a begin or end event
    *     the contact object itself (box2d.b2Contact)
    * Note that the impact event happens after collision resolution, so it cannot be used to prevent a collision from happening.
    *
    * @method Phaser.Physics.Box2D.Body#setCategoryContactCallback
    * @param {number} category - A bitmask specifying the category(s) to trigger for.
    * @param {function} callback - The callback to fire on contact. Set to null to clear a previously set callback.
    * @param {object} callbackContext - The context under which the callback will fire.
    */
    setCategoryContactCallback: function (category, callback, callbackContext) {

        if (callback === null)
        {
            delete (this._categoryContactCallbacks[category]);
            delete (this._categoryContactCallbacksContext[category]);
        }
        else
        {
            this._categoryContactCallbacks[category] = callback;
            this._categoryContactCallbackContext[category] = callbackContext;
        }

    },
    
    /**
    * Sets a callback to be fired when PreSolve is done for contacts between a fixture in this body and a fixture in the given Body.
    * The callback will be sent 6 parameters:
    *     this body
    *     the body that was contacted
    *     the fixture in this body (box2d.b2Fixture)
    *     the fixture in the other body that was contacted (box2d.b2Fixture)
    *     a boolean to say whether it was a begin or end event
    *     the contact object itself (box2d.b2Contact)
    * Note that the impact event happens after collision resolution, so it cannot be used to prevent a collision from happening.
    *
    * @method Phaser.Physics.Box2D.Body#setBodyPresolveCallback
    * @param {Phaser.Sprite|Phaser.Physics.Box2D.Body} object - The object to do callbacks for.
    * @param {function} callback - The callback to fire on contact. Set to null to clear a previously set callback.
    * @param {object} callbackContext - The context under which the callback will fire.
    */
    setBodyPresolveCallback: function (object, callback, callbackContext) {

        var id = -1;

        if (object['id'])
        {
            id = object.id;
        }
        else if (object['body'])
        {
            id = object.body.id;
        }

        if (id > -1)
        {
            if (callback === null)
            {
                delete (this._bodyPresolveCallbacks[id]);
                delete (this._bodyPresolveCallbackContext[id]);
            }
            else
            {
                this._bodyPresolveCallbacks[id] = callback;
                this._bodyPresolveCallbackContext[id] = callbackContext;
            }
        }

    },

    /**
    * Sets a callback to be fired when PreSolve is done for contacts between a fixture in this body the given fixture.
    * The callback will be sent 6 parameters:
    *     this body
    *     the body that was contacted
    *     the fixture in this body (box2d.b2Fixture)
    *     the fixture in the other body that was contacted (box2d.b2Fixture)
    *     a boolean to say whether it was a begin or end event
    *     the contact object itself (box2d.b2Contact)
    * Note that the impact event happens after collision resolution, so it cannot be used to prevent a collision from happening.
    *
    * @method Phaser.Physics.Box2D.Body#setFixturePresolveCallback
    * @param {box2d.b2Fixture} fixture - The fixture to do callbacks for.
    * @param {function} callback - The callback to fire on contact. Set to null to clear a previously set callback.
    * @param {object} callbackContext - The context under which the callback will fire.
    */
    setFixturePresolveCallback: function (fixture, callback, callbackContext) {

        var id = fixture.id;

        if (id > -1)
        {
            if (callback === null)
            {
                delete (this._fixturePresolveCallbacks[id]);
                delete (this._fixturePresolveCallbackContext[id]);
            }
            else
            {
                this._fixturePresolveCallbacks[id] = callback;
                this._fixturePresolveCallbackContext[id] = callbackContext;
            }
        }

    },

    /**
    * Sets a callback to be fired when PreSolve is done for contacts between a fixture in this body and a fixture in another body that matches given category set.
    * The callback will be sent 6 parameters:
    *     this body
    *     the body that was contacted
    *     the fixture in this body (box2d.b2Fixture)
    *     the fixture in the other body that was contacted (box2d.b2Fixture)
    *     a boolean to say whether it was a begin or end event
    *     the contact object itself (box2d.b2Contact)
    * Note that the impact event happens after collision resolution, so it cannot be used to prevent a collision from happening.
    *
    * @method Phaser.Physics.Box2D.Body#setCategoryPresolveCallback
    * @param {number} category - A bitmask specifying the category(s) to trigger for.
    * @param {function} callback - The callback to fire on contact. Set to null to clear a previously set callback.
    * @param {object} callbackContext - The context under which the callback will fire.
    */
    setCategoryPresolveCallback: function (category, callback, callbackContext) {

        if (callback === null)
        {
            delete (this._categoryPresolveCallbacks[category]);
            delete (this._categoryPresolveCallbacksContext[category]);
        }
        else
        {
            this._categoryPresolveCallbacks[category] = callback;
            this._categoryPresolveCallbackContext[category] = callbackContext;
        }

    },
    
    /**
    * Sets a callback to be fired when PostSolve is done for contacts between a fixture in this body and a fixture in the given Body.
    * The callback will be sent 6 parameters:
    *     this body
    *     the body that was contacted
    *     the fixture in this body (box2d.b2Fixture)
    *     the fixture in the other body that was contacted (box2d.b2Fixture)
    *     a boolean to say whether it was a begin or end event
    *     the contact object itself (box2d.b2Contact)
    * Note that the impact event happens after collision resolution, so it cannot be used to prevent a collision from happening.
    *
    * @method Phaser.Physics.Box2D.Body#setBodyPostsolveCallback
    * @param {Phaser.Sprite|Phaser.Physics.Box2D.Body} object - The object to do callbacks for.
    * @param {function} callback - The callback to fire on contact. Set to null to clear a previously set callback.
    * @param {object} callbackContext - The context under which the callback will fire.
    */
    setBodyPostsolveCallback: function (object, callback, callbackContext) {

        var id = -1;

        if (object['id'])
        {
            id = object.id;
        }
        else if (object['body'])
        {
            id = object.body.id;
        }

        if (id > -1)
        {
            if (callback === null)
            {
                delete (this._bodyPostsolveCallbacks[id]);
                delete (this._bodyPostsolveCallbackContext[id]);
            }
            else
            {
                this._bodyPostsolveCallbacks[id] = callback;
                this._bodyPostsolveCallbackContext[id] = callbackContext;
            }
        }

    },

    /**
    * Sets a callback to be fired when PostSolve is done for contacts between a fixture in this body the given fixture.
    * The callback will be sent 6 parameters:
    *     this body
    *     the body that was contacted
    *     the fixture in this body (box2d.b2Fixture)
    *     the fixture in the other body that was contacted (box2d.b2Fixture)
    *     a boolean to say whether it was a begin or end event
    *     the contact object itself (box2d.b2Contact)
    * Note that the impact event happens after collision resolution, so it cannot be used to prevent a collision from happening.
    *
    * @method Phaser.Physics.Box2D.Body#setFixturePostsolveCallback
    * @param {box2d.b2Fixture} fixture - The fixture to do callbacks for.
    * @param {function} callback - The callback to fire on contact. Set to null to clear a previously set callback.
    * @param {object} callbackContext - The context under which the callback will fire.
    */
    setFixturePostsolveCallback: function (fixture, callback, callbackContext) {

        var id = fixture.id;

        if (id > -1)
        {
            if (callback === null)
            {
                delete (this._fixturePostsolveCallbacks[id]);
                delete (this._fixturePostsolveCallbackContext[id]);
            }
            else
            {
                this._fixturePostsolveCallbacks[id] = callback;
                this._fixturePostsolveCallbackContext[id] = callbackContext;
            }
        }

    },

    /**
    * Sets a callback to be fired when PostSolve is done for contacts between a fixture in this body and a fixture in another body that matches given category set.
    * The callback will be sent 6 parameters:
    *     this body
    *     the body that was contacted
    *     the fixture in this body (box2d.b2Fixture)
    *     the fixture in the other body that was contacted (box2d.b2Fixture)
    *     a boolean to say whether it was a begin or end event
    *     the contact object itself (box2d.b2Contact)
    * Note that the impact event happens after collision resolution, so it cannot be used to prevent a collision from happening.
    *
    * @method Phaser.Physics.Box2D.Body#setCategoryPostsolveCallback
    * @param {number} category - A bitmask specifying the category(s) to trigger for.
    * @param {function} callback - The callback to fire on contact. Set to null to clear a previously set callback.
    * @param {object} callbackContext - The context under which the callback will fire.
    */
    setCategoryPostsolveCallback: function (category, callback, callbackContext) {

        if (callback === null)
        {
            delete (this._categoryPostsolveCallbacks[category]);
            delete (this._categoryPostsolveCallbacksContext[category]);
        }
        else
        {
            this._categoryPostsolveCallbacks[category] = callback;
            this._categoryPostsolveCallbackContext[category] = callbackContext;
        }

    },

    /**
    * Sets the given collision category for all fixtures in this Body, unless a specific fixture is given.
    *
    * @method Phaser.Physics.Box2D.Body#setCollisionCategory
    * @param {number} category - A bitmask representing the category(s) to include
    * @param {box2d.b2Fixture} [fixture] - An optional fixture. If not provided the collision category will be added to all fixtures in this body.
    */
    setCollisionCategory: function (category, fixture) {

        if (typeof fixture === 'undefined')
        {
            for (var f = this.data.GetFixtureList(); f; f = f.GetNext())
            {
                var filter = f.GetFilterData();
                filter.categoryBits = category;
            }
        }
        else
        {
            var filter = fixture.GetFilterData();
            filter.categoryBits = category;
        }

    },

    /**
    * Sets the given collision mask for all fixtures in this Body, unless a specific fixture is given.
    *
    * @method Phaser.Physics.Box2D.Body#setCollisionMask
    * @param {number} mask - A bitmask representing the category(s) to include
    * @param {box2d.b2Fixture} [fixture] - An optional fixture. If not provided the collision mask will be added to all fixtures in this body.
    */
    setCollisionMask: function (mask, fixture) {

        if (typeof fixture === 'undefined')
        {
            for (var f = this.data.GetFixtureList(); f; f = f.GetNext())
            {
                var filter = f.GetFilterData();
                filter.maskBits = mask;
            }
        }
        else
        {
            var filter = fixture.GetFilterData();
            filter.maskBits = mask;
        }

    },

    /**
    * Apply force at the center of mass. This will not cause any rotation.
    *
    * @method Phaser.Physics.Box2D.Body#applyForce
    * @param {number} x - 
    * @param {number} y - 
    */
    applyForce: function (x, y) {

        this.data.ApplyForce(new box2d.b2Vec2(-x,-y), this.data.GetWorldCenter(), true);

    },

    /**
    * If this Body is dynamic then this will zero its angular velocity.
    *
    * @method Phaser.Physics.Box2D.Body#setZeroRotation
    */
    setZeroRotation: function () {

        this.data.SetAngularVelocity(0);

    },

    /**
    * If this Body is dynamic then this will zero its velocity on both axis.
    *
    * @method Phaser.Physics.Box2D.Body#setZeroVelocity
    */
    setZeroVelocity: function () {

        this.data.SetLinearVelocity(box2d.b2Vec2.ZERO);

    },

    /**
    * Sets the linear damping and angular damping to zero.
    *
    * @method Phaser.Physics.Box2D.Body#setZeroDamping
    */
    setZeroDamping: function () {

        this.data.SetLinearDamping(0);
        this.data.SetAngularDamping(0);

    },

    /**
    * Transform a world point to local body frame.
    *
    * @method Phaser.Physics.Box2D.Body#toLocalPoint
    * @param {box2d.b2Vec2} out - The point to store the result in.
    * @param {box2d.b2Vec2} worldPoint - The input world point.
    */
    toLocalPoint: function (out, worldPoint) {
    
        out.x = this.world.pxm(-worldPoint.x);
        out.y = this.world.pxm(-worldPoint.y);
        this.data.GetLocalPoint(out, out);        
        out.x = this.world.mpx(-out.x);
        out.y = this.world.mpx(-out.y);
        
        return out;

    },

    /**
    * Transform a local point to world frame.
    *
    * @method Phaser.Physics.Box2D.Body#toWorldPoint
    * @param {box2d.b2Vec2} out - The point to store the result in.
    * @param {box2d.b2Vec2} localPoint - The input local point.
    */
    toWorldPoint: function (out, localPoint) {

        out.x = this.world.pxm(-localPoint.x);
        out.y = this.world.pxm(-localPoint.y);
        this.data.GetWorldPoint(out, out);        
        out.x = this.world.mpx(-out.x);
        out.y = this.world.mpx(-out.y);

        return out;
    },

    /**
    * Transform a world vector to local body frame.
    *
    * @method Phaser.Physics.Box2D.Body#toLocalVector
    * @param {box2d.b2Vec2} out - The vector to store the result in.
    * @param {box2d.b2Vec2} worldVector - The input world vector.
    */
    toLocalVector: function (out, worldVector) {

        out.x = this.world.pxm(-worldVector.x);
        out.y = this.world.pxm(-worldVector.y);
        this.data.GetLocalVector(out, out);        
        out.x = this.world.mpx(-out.x);
        out.y = this.world.mpx(-out.y);
        
        return out;

    },

    /**
    * Transform a local vector to world frame.
    *
    * @method Phaser.Physics.Box2D.Body#toWorldVector
    * @param {box2d.b2Vec2} out - The vector to store the result in.
    * @param {box2d.b2Vec2} localVector - The input local vector.
    */
    toWorldVector: function (out, localVector) {

        out.x = this.world.pxm(-localVector.x);
        out.y = this.world.pxm(-localVector.y);
        this.data.GetWorldVector(out, out);        
        out.x = this.world.mpx(-out.x);
        out.y = this.world.mpx(-out.y);

    },

    /**
    * This will rotate the Body by the given speed to the left (counter-clockwise).
    *
    * @method Phaser.Physics.Box2D.Body#rotateLeft
    * @param {number} speed - The speed at which it should rotate.
    */
    rotateLeft: function (speed) {

        this.data.SetAngularVelocity(this.world.pxm(-speed));

    },

    /**
    * This will rotate the Body by the given speed to the left (clockwise).
    *
    * @method Phaser.Physics.Box2D.Body#rotateRight
    * @param {number} speed - The speed at which it should rotate.
    */
    rotateRight: function (speed) {

        this.data.SetAngularVelocity(this.world.pxm(speed));

    },

    /**
    * Moves the Body forwards based on its current angle and the given speed.
    * The speed is represented in pixels per second. So a value of 100 would move 100 pixels in 1 second.
    *
    * @method Phaser.Physics.Box2D.Body#moveForward
    * @param {number} speed - The speed at which body should move forwards.
    */
    moveForward: function (speed) {

        var magnitude = this.world.pxm(speed);
        var direction = new box2d.b2Vec2();
        this.toWorldVector(direction, {x:0,y:magnitude});
        this.data.SetLinearVelocity(direction);
        
    },

    /**
    * Moves the Body backwards based on its current angle and the given speed.
    * The speed is represented in pixels per second. So a value of 100 would move 100 pixels in 1 second.
    *
    * @method Phaser.Physics.Box2D.Body#moveBackward
    * @param {number} speed - The speed at which body should move backwards.
    */
    moveBackward: function (speed) {

        var magnitude = this.world.pxm(-speed);
        var direction = new box2d.b2Vec2();
        this.toWorldVector(direction, {x:0,y:magnitude});
        this.data.SetLinearVelocity(direction);

    },

    /**
    * Applies a force to the Body that causes it to 'thrust' forwards, based on its current angle and the given speed.
    *
    * @method Phaser.Physics.Box2D.Body#thrust
    * @param {number} power - The magnitude of the thrust force.
    */
    thrust: function (power) {
    
        // Magnitude should be multiplied by the mass of the body, so that user  
        // will see the same results regardless of the size of the sprite.
        var magnitude = this.world.pxm(power) * this.data.GetMass();
        
        var force = new box2d.b2Vec2();
        this.toWorldVector(force, {x:0,y:magnitude});
        
        this.data.ApplyForce( force, this.data.GetWorldCenter(), true );

    },

    /**
    * Applies a force to the Body that causes it to 'thrust' backwards (in reverse), based on its current angle and the given speed.
    *
    * @method Phaser.Physics.Box2D.Body#reverse
    * @param {number} power - The magnitude of the thrust force.
    */
    reverse: function (power) {
    
        // Magnitude should be multiplied by the mass of the body, so that user  
        // will see the same results regardless of the size of the sprite.
        var magnitude = -this.world.pxm(power) * this.data.GetMass();
        
        var force = new box2d.b2Vec2();
        this.toWorldVector(force, {x:0,y:magnitude});
        
        this.data.ApplyForce( force, this.data.GetWorldCenter(), true );

    },

    /**
    * If this Body is dynamic then this will move it to the left by setting its x velocity to the given speed.
    * The speed is represented in pixels per second. So a value of 100 would move 100 pixels in 1 second.
    *
    * @method Phaser.Physics.Box2D.Body#moveLeft
    * @param {number} speed - The speed at which it should move to the left, in pixels per second.
    */
    moveLeft: function (speed) {

        this.velocity.x = -speed;

    },

    /**
    * If this Body is dynamic then this will move it to the right by setting its x velocity to the given speed.
    * The speed is represented in pixels per second. So a value of 100 would move 100 pixels in 1 second.
    *
    * @method Phaser.Physics.Box2D.Body#moveRight
    * @param {number} speed - The speed at which it should move to the right, in pixels per second.
    */
    moveRight: function (speed) {

        this.velocity.x = speed;

    },

    /**
    * If this Body is dynamic then this will move it up by setting its y velocity to the given speed.
    * The speed is represented in pixels per second. So a value of 100 would move 100 pixels in 1 second.
    *
    * @method Phaser.Physics.Box2D.Body#moveUp
    * @param {number} speed - The speed at which it should move up, in pixels per second.
    */
    moveUp: function (speed) {

        this.velocity.y = -speed;

    },

    /**
    * If this Body is dynamic then this will move it down by setting its y velocity to the given speed.
    * The speed is represented in pixels per second. So a value of 100 would move 100 pixels in 1 second.
    *
    * @method Phaser.Physics.Box2D.Body#moveDown
    * @param {number} speed - The speed at which it should move down, in pixels per second.
    */
    moveDown: function (speed) {

        this.velocity.y = speed;

    },

    /**
    * Internal method. This is called directly before the sprites are sent to the renderer and after the update function has finished.
    *
    * @method Phaser.Physics.Box2D.Body#preUpdate
    * @protected
    */
    preUpdate: function () {

        if (this.removeNextStep)
        {
            this.removeFromWorld();
            this.removeNextStep = false;
        }

    },

    /**
    * Internal method. This is called directly before the sprites are sent to the renderer and after the update function has finished.
    *
    * @method Phaser.Physics.Box2D.Body#postUpdate
    * @protected
    */
    postUpdate: function () {

        if (this.sprite)
        {
            this.sprite.x = this.world.mpx(-this.data.GetPosition().x);
            this.sprite.y = this.world.mpx(-this.data.GetPosition().y);
            this.sprite.rotation = this.data.GetAngle();
        }

    },

    /**
    * Sets this body as inactive. It will not participate in collisions or
    * any other aspect of the physics simulation. Intended for use by Phaser.Sprite.kill()
    *
    * @method Phaser.Physics.Box2D.Body#kill
    */
    kill: function () {

        this.data.SetActive(false);

    },

    /**
    * Restores the active status of this body.
    *
    * @method Phaser.Physics.Box2D.Body#reset
    * @param {number} x - The new x position of the Body.
    * @param {number} y - The new x position of the Body.
    */
    reset: function (x, y) {

        this.data.SetPositionXY( this.world.pxm(-x), this.world.pxm(-y) );
        this.data.SetActive(true);

    },

    /**
    * Removes this physics body from the world.
    *
    * @method Phaser.Physics.Box2D.Body#removeFromWorld
    */
    removeFromWorld: function () {

        if (this.data.world === this.game.physics.box2d.world)
        {
            this.game.physics.box2d.removeBodyNextStep(this);
        }

    },

    /**
    * Destroys this Body and all references it holds to other objects.
    *
    * @method Phaser.Physics.Box2D.Body#destroy
    */
    destroy: function () {

        this.removeFromWorld();

        this._bodyCallbacks = {};
        this._bodyCallbackContext = {};
        this._categoryCallbacks = {};
        this._categoryCallbackContext = {};

        this.sprite = null;

    },

    /**
    * Removes all fixtures from this Body.
    *
    * @method Phaser.Physics.Box2D.Body#clearFixtures
    */
    clearFixtures: function () {

        var fixtures = [];
        for (var f = this.data.GetFixtureList(); f; f = f.GetNext()) {
            fixtures.push(f);
        }

        var i = fixtures.length;

        while (i--)
        {
            this.data.DestroyFixture(fixtures[i]);
        }

    },

    /**
    * Adds a Circle fixture to this Body. You can control the offset from the center of the body and the rotation.
    * It will use the World friction, restitution and density by default.
    *
    * @method Phaser.Physics.Box2D.Body#addCircle
    * @param {number} radius - The radius of this circle (in pixels)
    * @param {number} [offsetX=0] - Local horizontal offset of the shape relative to the body center of mass.
    * @param {number} [offsetY=0] - Local vertical offset of the shape relative to the body center of mass.
    * @return {box2d.b2Fixture} The fixture that was added to the Body.
    */
    addCircle: function (radius, offsetX, offsetY) {

        var circleShape = new box2d.b2CircleShape(this.world.pxm(radius));
        circleShape.m_p.SetXY(this.world.pxm(-offsetX), this.world.pxm(-offsetY));

        var fixtureDef = new box2d.b2FixtureDef();
        fixtureDef.shape = circleShape;
        fixtureDef.friction = this.world.friction;
        fixtureDef.restitution = this.world.restitution;
        fixtureDef.density = this.world.density;

        var f = this.data.CreateFixture(fixtureDef);
        f.id = this.world.getNextFixtureId();

        return f;

    },

    /**
    * Adds a Rectangle fixture to this Body. You can control the offset from the center of the body and the rotation.
    * It will use the World friction, restitution and density by default.
    *
    * @method Phaser.Physics.Box2D.Body#addRectangle
    * @param {number} [width=16] - The width of the rectangle in pixels.
    * @param {number} [height=16] - The height of the rectangle in pixels.
    * @param {number} [offsetX=0] - Local horizontal offset (pixels) of the shape relative to the body center.
    * @param {number} [offsetY=0] - Local vertical offset (pixels) of the shape relative to the body center.
    * @param {number} [rotation=0] - Local rotation of the shape relative to the body center of mass, specified in radians.
    * @return {box2d.b2Fixture} The fixture that was added to the Body.
    */
    addRectangle: function (width, height, offsetX, offsetY, rotation) {

        if (typeof width === 'undefined') { width = 16; }
        if (typeof height === 'undefined') { height = 16; }
        if (typeof offsetX === 'undefined') { offsetX = 0; }
        if (typeof offsetY === 'undefined') { offsetY = 0; }
        if (typeof rotation === 'undefined') { rotation = 0; }   
    
        width = this.world.pxm(width);
        height = this.world.pxm(height);

        var polygonShape = new box2d.b2PolygonShape();
        polygonShape.SetAsOrientedBox(0.5 * width, 0.5 * height, new box2d.b2Vec2(this.world.pxm(-offsetX), this.world.pxm(-offsetY)), rotation);

        var fixtureDef = new box2d.b2FixtureDef();
        fixtureDef.shape = polygonShape;
        fixtureDef.friction = this.world.friction;
        fixtureDef.restitution = this.world.restitution;
        fixtureDef.density = this.world.density;

        var f = this.data.CreateFixture(fixtureDef);
        f.id = this.world.getNextFixtureId();

        return f;

    },

    /**
    * Creates a new Edge Shape and adds it to this Body.
    * It will use the World friction, restitution and density by default.
    *
    * @method Phaser.Physics.Box2D.Body#addEdge
    * @param {number} [x1=0] - Local horizontal offset of the first point relative to the body center.
    * @param {number} [y1=0] - Local vertical offset of the first point relative to the body center.
    * @param {number} [x2=0] - Local horizontal offset of the second point relative to the body center.
    * @param {number} [y2=0] - Local vertical offset of the second point relative to the body center.
    * @return {box2d.b2Fixture} The fixture that was added to the Body.
    */
    addEdge: function (x1, y1, x2, y2) {

        var edgeShape = new box2d.b2EdgeShape();
        edgeShape.Set( new box2d.b2Vec2(this.world.pxm(-x1), this.world.pxm(-y1)), new box2d.b2Vec2(this.world.pxm(-x2), this.world.pxm(-y2)) );

        var fixtureDef = new box2d.b2FixtureDef();
        fixtureDef.shape = edgeShape;
        fixtureDef.friction = this.world.friction;
        fixtureDef.restitution = this.world.restitution;
        fixtureDef.density = this.world.density;

        var f = this.data.CreateFixture(fixtureDef);
        f.id = this.world.getNextFixtureId();

        return f;

    },

    /**
    * Creates a new chain shape and adds it to this Body.
    * It will use the World friction, restitution and density by default.
    *
    * @method Phaser.Physics.Box2D.Body#addChain
    * @param {Array} vertices - Local positions of the vertices relative to the body center. Format is [x1, y1, x2, y2, ...]
    * @param {number} [firstIndex=0] - The index of the x-value of the starting vertex.
    * @param {number} [count] - The number of vertices to use. If this parameter is not passed, all vertices above firstIndex will be used.
    * @param {boolean} [loop=false] - Whether the chain should form a closed loop.
    * @return {box2d.b2Fixture} The fixture that was added to the Body.
    */
    addChain: function (vertices, firstIndex, count, loop) {
    
        if (typeof vertices === 'undefined') { return null; }
        if (vertices.length < 4) { return null; }
    
        if (typeof firstIndex === 'undefined') { firstIndex = 0; }
        if (typeof count === 'undefined') { count = (vertices.length - firstIndex) / 2; }

        var b2Vertices = [];
        for (var i = firstIndex; i < (firstIndex+count); i++) {
            b2Vertices.push( new box2d.b2Vec2(this.world.pxm(-vertices[2*i]), this.world.pxm(-vertices[2*i+1])) );
        }

        var chainShape = new box2d.b2ChainShape();
        if (loop) {
            chainShape.CreateLoop( b2Vertices, b2Vertices.length );
        }
        else {
            chainShape.CreateChain( b2Vertices, b2Vertices.length );
        }

        var fixtureDef = new box2d.b2FixtureDef();
        fixtureDef.shape = chainShape;
        fixtureDef.friction = this.world.friction;
        fixtureDef.restitution = this.world.restitution;
        fixtureDef.density = this.world.density;

        var f = this.data.CreateFixture(fixtureDef);
        f.id = this.world.getNextFixtureId();
        return f;

    },

    /**
    * Creates a new loop shape and adds it to this Body.
    *
    * @method Phaser.Physics.Box2D.Body#addLoop
    * @param {Array} vertices - Local positions of the vertices relative to the body center. Format is [x1, y1, x2, y2, ...]
    * @param {number} [firstIndex=0] - The index of the x-value of the starting vertex.
    * @param {number} count - The number of vertices to use. If this parameter is not passed, all vertices above firstIndex will be used.
    * @return {box2d.b2Fixture} The fixture that was added to the Body.
    */
    addLoop: function (vertices, firstIndex, count) {
        
        return this.addChain(vertices, firstIndex, count, true);
        
    },

    /**
    * Creates a new polygon shape and adds it to this Body.
    *
    * @method Phaser.Physics.Box2D.Body#addPolygon
    * @param {Array} vertices - Local positions of the vertices relative to the body center. Format is [x1, y1, x2, y2, ...]
    * @param {number} [firstIndex=0] - The index of the x-value of the starting vertex.
    * @param {number} count - The number of vertices to use. If this parameter is not passed, all vertices above firstIndex will be used.
    * @return {box2d.b2Fixture} The last fixture that was added to the Body.
    */
    addPolygon: function (vertices, firstIndex, count) {
    
        if (typeof vertices === 'undefined') { return null; }
        if (vertices.length < 6) { return null; } // need at least three vertices
    
        if (typeof firstIndex === 'undefined') { firstIndex = 0; }
        if (typeof count === 'undefined') { count = (vertices.length - firstIndex) / 2; }

        var b2Vertices = [];
        for (var i = firstIndex; i < (firstIndex+count); i++) {
            b2Vertices.push( { x: this.world.pxm(-vertices[2*i]), y: this.world.pxm(-vertices[2*i+1]) } );
        }
        
        var poly = new Phaser.Physics.Box2D.Polygon();
        poly.setFromXYObjects(b2Vertices);
        var convexPolygons = poly.decompose(b2Vertices);
        
        var lastFixture = null;
        
        for (var i = 0; i < convexPolygons.length; i++)
        {
            var polygonShape = new box2d.b2PolygonShape();
            polygonShape.Set( convexPolygons[i], convexPolygons[i].length );
    
            var fixtureDef = new box2d.b2FixtureDef();
            fixtureDef.shape = polygonShape;
            fixtureDef.friction = this.world.friction;
            fixtureDef.restitution = this.world.restitution;
            fixtureDef.density = this.world.density;
    
            lastFixture = this.data.CreateFixture(fixtureDef);
            lastFixture.id = this.world.getNextFixtureId();
        }

        return lastFixture;
    },

    /**
    * Remove a shape from the body. Will automatically update the mass properties and bounding radius.
    *
    * @method Phaser.Physics.Box2D.Body#removeFixture
    * @param {box2d.b2Fixture} fixture - The fixture to remove from the body.
    * @return {boolean} True if the fixture was found and removed, else false.
    */
    removeFixture: function (fixture) {

        if ( fixture.GetBody() != this.data ) {
            return false;
        }
    
        this.data.DestroyFixture(fixture);

        return true;
    },

    /**
    * Clears any previously set fixtures. Then creates a new Circle shape and adds it to this Body.
    *
    * @method Phaser.Physics.Box2D.Body#setCircle
    * @param {number} [radius=32] - The radius of this circle in pixels.
    * @param {number} [offsetX=0] - Local horizontal offset of the shape relative to the body center of mass.
    * @param {number} [offsetY=0] - Local vertical offset of the shape relative to the body center of mass.
    * @return {box2d.b2Fixture} The fixture that was added to the Body.
    */
    setCircle: function (radius, offsetX, offsetY) {
    
        if (typeof radius === 'undefined') { radius = 32; }
        if (typeof offsetX === 'undefined') { offsetX = 0; }
        if (typeof offsetY === 'undefined') { offsetY = 0; }
    
        this.clearFixtures();

        return this.addCircle(radius, offsetX, offsetY);

    },

    /**
    * Clears any previously set fixtures. The creates a new Rectangle fixture at the given size and offset, and adds it to this Body.
    * If you wish to create a Rectangle to match the size of a Sprite or Image see Body.setRectangleFromSprite.
    *
    * @method Phaser.Physics.Box2D.Body#setRectangle
    * @param {number} [width=16] - The width of the rectangle in pixels.
    * @param {number} [height=16] - The height of the rectangle in pixels.
    * @param {number} [offsetX=0] - Local horizontal offset of the shape relative to the body center of mass.
    * @param {number} [offsetY=0] - Local vertical offset of the shape relative to the body center of mass.
    * @param {number} [rotation=0] - Local rotation of the shape relative to the body center of mass, specified in radians.
    * @return {box2d.b2Fixture} The fixture that was added to the Body.
    */
    setRectangle: function (width, height, offsetX, offsetY, rotation) {

        this.clearFixtures();

        return this.addRectangle(width, height, offsetX, offsetY, rotation);

    },

    /**
    * Clears any previously set fixtures.
    * Then creates a Rectangle shape sized to match the dimensions and orientation of the Sprite given.
    * If no Sprite is given it defaults to using the parent of this Body.
    *
    * @method Phaser.Physics.Box2D.Body#setRectangleFromSprite
    * @param {Phaser.Sprite|Phaser.Image} [sprite] - The Sprite on which the Rectangle will get its dimensions.
    * @return {box2d.b2Fixture} The fixture that was added to the Body.
    */
    setRectangleFromSprite: function (sprite) {

        if (typeof sprite === 'undefined') { sprite = this.sprite; }

        this.clearFixtures();

        return this.addRectangle(sprite.width, sprite.height, 0, 0, sprite.rotation);

    },

    /**
    * Clears any previously set fixtures. Then creates a new edge shape and adds it to this Body.
    *
    * @method Phaser.Physics.Box2D.Body#setEdge
    * @param {number} [x1=0] - Local horizontal offset of the first point relative to the body center.
    * @param {number} [y1=0] - Local vertical offset of the first point relative to the body center.
    * @param {number} [x2=0] - Local horizontal offset of the second point relative to the body center.
    * @param {number} [y2=0] - Local vertical offset of the second point relative to the body center.
    * @return {box2d.b2Fixture} The fixture that was added to the Body.
    */
    setEdge: function (x1, y1, x2, y2) {
    
        if (typeof x1 === 'undefined') { x1 = 0; }
        if (typeof y1 === 'undefined') { y1 = 0; }
        if (typeof x2 === 'undefined') { x2 = 0; }
        if (typeof y2 === 'undefined') { y2 = 0; }
    
        this.clearFixtures();        

        return this.addEdge(x1, y1, x2, y2);

    },

    /**
    * Clears any previously set fixtures. Then creates a new chain shape and adds it to this Body.
    *
    * @method Phaser.Physics.Box2D.Body#setChain
    * @param {Array} vertices - Local positions of the vertices relative to the body center. Format is [x1, y1, x2, y2, ...]
    * @param {number} [firstIndex=0] - The index of the x-value of the starting vertex.
    * @param {number} count - The number of vertices to use. If this parameter is not passed, all vertices above firstIndex will be used.
    * @param {boolean} [loop=false] - Whether the chain should form a closed loop.
    * @return {box2d.b2Fixture} The fixture that was added to the Body.
    */
    setChain: function (vertices, firstIndex, count, loop) {
    
        if (typeof vertices === 'undefined') { return null; }
        if (vertices.length < 4) { return null; }
    
        if (typeof firstIndex === 'undefined') { firstIndex = 0; }
        if (typeof count === 'undefined') { count = (vertices.length - firstIndex) / 2; }
    
        this.clearFixtures();

        return this.addChain(vertices, firstIndex, count, loop);

    },

    /**
    * An alias for setChain.
    *
    * @method Phaser.Physics.Box2D.Body#setLoop
    * @param {Array} vertices - Local positions of the vertices relative to the body center. Format is [x1, y1, x2, y2, ...]
    * @param {number} [firstIndex=0] - The index of the x-value of the starting vertex.
    * @param {number} count - The number of vertices to use. If this parameter is not passed, all vertices above firstIndex will be used.
    * @return {box2d.b2Fixture} The fixture that was added to the Body.
    */
    setLoop: function (vertices, firstIndex, count) {
        
        return this.setChain(vertices, firstIndex, count, true);
        
    },

    /**
    * Clears any previously set fixtures. Then creates a new polygon shape and adds it to this Body.
    *
    * @method Phaser.Physics.Box2D.Body#setPolygon
    * @param {Array} vertices - Local positions of the vertices relative to the body center. Format is [x1, y1, x2, y2, ...]
    * @param {number} [firstIndex=0] - The index of the x-value of the starting vertex.
    * @param {number} count - The number of vertices to use. If this parameter is not passed, all vertices above firstIndex will be used.
    * @return {box2d.b2Fixture} The fixture that was added to the Body.
    */
    setPolygon: function (vertices, firstIndex, count) {
    
        if (typeof vertices === 'undefined') { return null; }
        if (vertices.length < 4) { return null; }
    
        if (typeof firstIndex === 'undefined') { firstIndex = 0; }
        if (typeof count === 'undefined') { count = (vertices.length - firstIndex) / 2; }
    
        this.clearFixtures();

        return this.addPolygon(vertices, firstIndex, count);

    },

    /**
    * Reads the shape data from a physics data file stored in the Game.Cache and adds it as a polygon to this Body.
    *
    * @method Phaser.Physics.Box2D.Body#loadPolygon
    * @param {string} key - The key of the Physics Data file as stored in Game.Cache.
    * @param {string} object - The key of the object within the Physics data file that you wish to load the shape data from.
    * @return {boolean} True on success, else false.
    */
    loadPolygon: function (key, object, sprite) {

        if (typeof sprite === 'undefined') { sprite = null; }
    
        var data = this.game.cache.getPhysicsData(key, object);

        for (var i = 0; i < data.length; i++)
        {
            var vertices = [];

            for (var s = 0; s < data[i].shape.length; s += 2)
            {
                vertices.push( new box2d.b2Vec2( this.world.pxm(-data[i].shape[s]), this.world.pxm(-data[i].shape[s + 1]) ) );
            }

            if (sprite) {
                var offsetx = this.world.pxm(-0.5 * sprite.width);
                var offsety = this.world.pxm(-0.5 * sprite.height);
                for (var k = 0; k < vertices.length; k++) {
                    vertices[k].x -= offsetx;
                    vertices[k].y -= offsety;
                }
            }

            var polygonShape = new box2d.b2PolygonShape();
            polygonShape.Set(vertices, vertices.length);
    
            var fixtureDef = new box2d.b2FixtureDef();
            fixtureDef.shape = polygonShape;
            fixtureDef.friction = data[i].friction;
            fixtureDef.restitution = data[i].bounce;
            fixtureDef.density = data[i].density;
            fixtureDef.filter.categoryBits = data[i].filter.categoryBits;
            fixtureDef.filter.maskBits = data[i].filter.maskBits;

            var f = this.data.CreateFixture(fixtureDef);
            f.id = this.world.getNextFixtureId();
        }

        return true;

    },

    /**
    * Checks if the given point (pixel coords) is contained by any of the fixtures on this body.
    * Not efficient for checking a large number of bodies to find which is under the mouse. (Use
    * Phaser.Physics.Box2D.getBodiesAtPoint for that.)
    *
    * @method Phaser.Physics.Box2D.Body#containsPoint
    * @param {Phaser.Pointer} point - The location to test for (pixel coordinates)
    * @return {boolean} True on success, else false.
    */
    containsPoint: function (point) {
        
        var worldx = this.world.pxm(-point.x);
        var worldy = this.world.pxm(-point.y);
        var worldPoint = new box2d.b2Vec2(worldx, worldy);
        
        for (var f = this.data.GetFixtureList(); f; f = f.GetNext())
        {
            if (f.TestPoint(worldPoint))
            {
                return true;
            }
        }
        
        return false;

    }

};

Phaser.Physics.Box2D.Body.prototype.constructor = Phaser.Physics.Box2D.Body;

/**
* @name Phaser.Physics.Box2D.Body#static
* @property {boolean} static - Returns true if the Body is static. Setting Body.static to 'false' will make it dynamic.
*/
Object.defineProperty(Phaser.Physics.Box2D.Body.prototype, "static", {

    get: function () {

        return (this.data.GetType() === box2d.b2BodyType.b2_staticBody);

    },

    set: function (value) {

        if (value && this.data.GetType() !== box2d.b2BodyType.b2_staticBody)
        {
            this.data.SetType(box2d.b2BodyType.b2_staticBody);
        }
        else if (!value && this.data.GetType() === box2d.b2BodyType.b2_staticBody)
        {
            this.data.SetType(box2d.b2BodyType.b2_dynamicBody);
        }

    }

});

/**
* @name Phaser.Physics.Box2D.Body#dynamic
* @property {boolean} dynamic - Returns true if the Body is dynamic. Setting Body.dynamic to 'false' will make it static.
*/
Object.defineProperty(Phaser.Physics.Box2D.Body.prototype, "dynamic", {

    get: function () {

        return (this.data.GetType() === box2d.b2BodyType.b2_dynamicBody);

    },

    set: function (value) {

        if (value && this.data.GetType() !== box2d.b2BodyType.b2_dynamicBody)
        {
            this.data.SetType(box2d.b2BodyType.b2_dynamicBody);
        }
        else if (!value && this.data.GetType() === box2d.b2BodyType.b2_dynamicBody)
        {
            this.data.SetType(box2d.b2BodyType.b2_staticBody);
        }

    }

});

/**
* @name Phaser.Physics.Box2D.Body#kinematic
* @property {boolean} kinematic - Returns true if the Body is kinematic. Setting Body.kinematic to 'false' will make it static.
*/
Object.defineProperty(Phaser.Physics.Box2D.Body.prototype, "kinematic", {

    get: function () {

        return (this.data.GetType() === box2d.b2BodyType.b2_kinematicBody);

    },

    set: function (value) {

        if (value && this.data.GetType() !== box2d.b2BodyType.b2_kinematicBody)
        {
            this.data.SetType(box2d.b2BodyType.b2_kinematicBody);
        }
        else if (!value && this.data.GetType() === box2d.b2BodyType.b2_kinematicBody)
        {
            this.data.SetType(box2d.b2BodyType.b2_staticBody);
        }

    }

});


/**
* The angle of the Body in degrees from its original orientation. Values from 0 to 180 represent clockwise rotation; values from 0 to -180 represent counterclockwise rotation.
* Values outside this range are added to or subtracted from 360 to obtain a value within the range. For example, the statement Body.angle = 450 is the same as Body.angle = 90.
* If you wish to work in radians instead of degrees use the property Body.rotation instead. Working in radians is faster as it doesn't have to convert values.
*
* @name Phaser.Physics.Box2D.Body#angle
* @property {number} angle - The angle of this Body in degrees.
*/
Object.defineProperty(Phaser.Physics.Box2D.Body.prototype, "angle", {

    get: function() {

        return Phaser.Math.wrapAngle(Phaser.Math.radToDeg(this.data.GetAngle()));

    },

    set: function(value) {

        this.data.SetAngle( Phaser.Math.degToRad(Phaser.Math.wrapAngle(value)) );

    }

});

/**
* Linear damping acts like drag to cause a body to slow down.
* @name Phaser.Physics.Box2D.Body#linearDamping
* @property {number} linearDamping - The linear damping acting acting on the body.
*/
Object.defineProperty(Phaser.Physics.Box2D.Body.prototype, "linearDamping", {

    get: function () {

        return this.data.GetLinearDamping();

    },

    set: function (value) {

        this.data.SetLinearDamping(value);

    }

});

/**
* Linear damping acts like drag to cause rotation of a body to slow down.
* @name Phaser.Physics.Box2D.Body#angularDamping
* @property {number} angularDamping - The angular damping acting acting on the body.
*/
Object.defineProperty(Phaser.Physics.Box2D.Body.prototype, "angularDamping", {

    get: function () {

        return this.data.GetAngularDamping();

    },

    set: function (value) {

        this.data.SetAngularDamping(value);

    }

});

/**
* @name Phaser.Physics.Box2D.Body#angularVelocity
* @property {number} angularVelocity - The angular velocity of the body.
*/
Object.defineProperty(Phaser.Physics.Box2D.Body.prototype, "angularVelocity", {

    get: function () {

        return this.data.GetAngularVelocity();

    },

    set: function (value) {

        this.data.SetAngularVelocity(value);

    }

});

/**
* @name Phaser.Physics.Box2D.Body#fixedRotation
* @property {boolean} fixedRotation - If true, the body will not rotate.
*/
Object.defineProperty(Phaser.Physics.Box2D.Body.prototype, "fixedRotation", {

    get: function () {

        return this.data.IsFixedRotation();

    },

    set: function (value) {

        this.data.SetFixedRotation(value);

    }

});

/**
* @name Phaser.Physics.Box2D.Body#gravityScale
* @property {boolean} gravityScale - Set to zero to completely ignore gravity, or negative values to reverse gravity for this body.
*/
Object.defineProperty(Phaser.Physics.Box2D.Body.prototype, "gravityScale", {

    get: function () {

        return this.data.GetGravityScale();

    },

    set: function (value) {

        this.data.SetGravityScale(value);

    }

});

/**
* @name Phaser.Physics.Box2D.Body#friction
* @property {number} friction - When setting, all fixtures on the body will be set to the given friction. When getting, the friction of the first fixture will be returned, or zero if no fixtures are present.
*/
Object.defineProperty(Phaser.Physics.Box2D.Body.prototype, "friction", {

    get: function () {

        var fixture = this.data.GetFixtureList();
        
        if (fixture) {
            return fixture.GetFriction();
        }

        return 0;

    },

    set: function (value) {

        for (var f = this.data.GetFixtureList(); f; f = f.GetNext()) {

            f.SetFriction(value);
            f.Refilter();

        }

    }

});

/**
* @name Phaser.Physics.Box2D.Body#restitution
* @property {number} restitution - When setting, all fixtures on the body will be set to the given restitution. When getting, the restitution of the first fixture will be returned, or zero if no fixtures are present.
*/
Object.defineProperty(Phaser.Physics.Box2D.Body.prototype, "restitution", {

    get: function () {

        var fixture = this.data.GetFixtureList();
        
        if (fixture) {
            return fixture.GetRestitution();
        }

        return 0;

    },

    set: function (value) {

        for (var f = this.data.GetFixtureList(); f; f = f.GetNext()) {

            f.SetRestitution(value);
            f.Refilter();

        }

    }

});

/**
* @name Phaser.Physics.Box2D.Body#sensor
* @property {boolean} sensor - When setting, all fixtures on the body will be set to the given sensor status. When getting, the sensor status of the first fixture will be returned, or false if no fixtures are present.
*/
Object.defineProperty(Phaser.Physics.Box2D.Body.prototype, "sensor", {

    get: function () {

        var fixture = this.data.GetFixtureList();
        
        if (fixture) {
            return fixture.IsSensor();
        }

        return 0;

    },

    set: function (value) {

        for (var f = this.data.GetFixtureList(); f; f = f.GetNext()) {

            f.SetSensor(value);
            f.Refilter();

        }

    }

});

/**
* @name Phaser.Physics.Box2D.Body#bullet
* @property {boolean} bullet - Set to true to give the body 'bullet' status, and use continous collision detection when moving it.
*/
Object.defineProperty(Phaser.Physics.Box2D.Body.prototype, "bullet", {

    get: function () {

        return this.data.IsBullet();

    },

    set: function (value) {

        this.data.SetBullet(value);

    }

});

/**
* @name Phaser.Physics.Box2D.Body#mass
* @property {number} mass - the new mass for the body. Setting this to zero will cause the body to become a static body.
*/
Object.defineProperty(Phaser.Physics.Box2D.Body.prototype, "mass", {

    get: function () {

        return this.data.GetMass();

    },

    set: function (value) {
        
        if (value === 0) {
            this.data.SetType(box2d.b2BodyType.b2_staticBody);
        }
        else {
            
            // Make sure the body is dynamic, before giving it a non-zero mass.
            if (this.data.GetType() !== box2d.b2BodyType.b2_dynamicBody) {
                
                this.data.SetType(box2d.b2BodyType.b2_dynamicBody);
                
            }
        
            // Mass is determined by (area * density) of attached fixtures.
            // We need to find the current mass and scale the density of all
            // fixtures so that the overall mass matches the desired mass.
            
            var oldMass = this.data.GetMass();
            var scaleby = value / oldMass;
    
            for (var f = this.data.GetFixtureList(); f; f = f.GetNext()) {
                var oldDensity = f.GetDensity();
                f.SetDensity(oldDensity * scaleby);
            }
            
            // Make sure the new fixture densities take effect in the body
            this.data.ResetMassData();
        
        }

    }

});

/**
* The angle of the Body in radians.
* If you wish to work in degrees instead of radians use the Body.angle property instead. Working in radians is faster as it doesn't have to convert values.
*
* @name Phaser.Physics.Box2D.Body#rotation
* @property {number} rotation - The angle of this Body in radians.
*/
Object.defineProperty(Phaser.Physics.Box2D.Body.prototype, "rotation", {

    get: function() {

        return this.data.GetAngle();

    },

    set: function(value) {

        this.data.SetAngle(value);

    }

});

/**
* @name Phaser.Physics.Box2D.Body#x
* @property {number} x - The x coordinate of this Body.
*/
Object.defineProperty(Phaser.Physics.Box2D.Body.prototype, "x", {

    get: function () {

        return this.world.mpx(-this.data.GetPosition().x);

    },

    set: function (value) {

        this.data.SetPositionXY(this.world.pxm(-value), this.data.GetPosition().y);

    }

});

/**
* @name Phaser.Physics.Box2D.Body#y
* @property {number} y - The y coordinate of this Body.
*/
Object.defineProperty(Phaser.Physics.Box2D.Body.prototype, "y", {

    get: function () {

        return this.world.mpx(-this.data.GetPosition().y);

    },

    set: function (value) {

        this.data.SetPositionXY(this.data.GetPosition().x, this.world.pxm(-value));

    }

});

/**
* A Body can be set to collide against the World bounds automatically if this is set to true. Otherwise it will leave the World.
* Note that this only applies if your World has bounds! When getting this property, the returned value will be true if any of the
* fixtures of this body are set to collide with the world bounds.
*
* @name Phaser.Physics.Box2D.Body#collideWorldBounds
* @property {boolean} collideWorldBounds - Should the Body collide with the World bounds?
*/
Object.defineProperty(Phaser.Physics.Box2D.Body.prototype, "collideWorldBounds", {

    get: function () {

        for (var f = this.data.GetFixtureList(); f; f = f.GetNext())
        {
            var filter = f.GetFilterData();

            if (filter.maskBits & Phaser.Physics.Box2D.worldBoundsFilterCategory)
            {
                return true;
            }
        }
        
        return false;

    },

    set: function (value) {

        for (var f = this.data.GetFixtureList(); f; f = f.GetNext())
        {
            var filter = f.GetFilterData();

            if (value)
            {
                filter.maskBits |=  Phaser.Physics.Box2D.worldBoundsFilterCategory;
            }
            else
            {
                filter.maskBits &= ~Phaser.Physics.Box2D.worldBoundsFilterCategory;
            }
        }
    }

});
