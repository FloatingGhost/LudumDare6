/**
* @author       Chris Campbell <iforce2d@gmail.com>
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
* @class Phaser.Physics.Box2D
* @classdesc Physics World Constructor
* @constructor
* @param {Phaser.Game} game - Reference to the current game instance.
*/
Phaser.Physics.Box2D = function (game, config) {
    
    /**
    * @property {Phaser.Game} game - Local reference to game.
    */
    this.game = game;
    
    /**
    * @property {string} version - The version of the Box2D Plugin that is running.
    */
    this.version = '1.0.2';

    /**
    * @property {number} ptmRatio - Pixels to Meters ratio.
    * @default 50
    */
    this.ptmRatio = 50;
    
    /**
    * @property {box2d.b2World} world - The Box2D world in which the simulation is run.
    * @protected
    */
    this.world = new box2d.b2World(new box2d.b2Vec2(0, 0));

    /**
    * @property {Phaser.Physics.Box2D.DefaultDebugDraw} - used for rendering debug information
    * @default
    */
    this.debugDraw = new Phaser.Physics.Box2D.DefaultDebugDraw(this.mpx(1));
    this.world.SetDebugDraw(this.debugDraw);

    /**
    * @property {Phaser.Physics.Box2D.DefaultContactListener} - used to check if bodies have contact callbacks set
    * @default
    */
    this.contactListener = new Phaser.Physics.Box2D.DefaultContactListener();
    this.world.SetContactListener(this.contactListener);

    /**
    * @property {number} nextBodyId - The id to give the next created body
    * @protected
    */
    this.nextBodyId = 0;

    /**
    * @property {number} nextFixtureId - The id to give the next created fixture
    * @protected
    */
    this.nextFixtureId = 0;

    /**
    * @property {box2d.b2Vec2} gravity - The gravity of the Box2D world.
    * @protected
    */
    this.gravity = new Phaser.Physics.Box2D.PointProxy(this, this.world, this.world.GetGravity, this.world.SetGravity);

    /**
    * @property {number} friction - The default friction for fixtures created by 'enable', or other functions like setRectangle, setPolygon etc
    * @default
    */
    this.friction = 0.2;

    /**
    * @property {number} restitution - The default restitution for fixtures created by 'enable', or other functions like setRectangle, setPolygon etc
    * @default
    */
    this.restitution = 0.0;

    /**
    * @property {number} density - The default density for fixtures created by 'enable', or other functions like setRectangle, setPolygon etc
    * @default
    */
    this.density = 1.0;

    /**
    * @property {number} frameRate - The frame rate the world will be stepped at. Defaults to 1 / 60, but you can change here. Also see useElapsedTime property.
    * @default
    */
    this.frameRate = 1 / 60;

    /**
    * @property {number} velocityIterations - The maximum number of iterations allowed to adjust velocities to match constraints. Defaults to 8.
    * @default
    */
    this.velocityIterations = 8;

    /**
    * @property {number} positionIterations - The maximum number of iterations allowed to adjust positions to match constraints. Defaults to 3.
    * @default
    */
    this.positionIterations = 3;

    /**
    * @property {boolean} useElapsedTime - If true the frameRate value will be ignored and instead Box2D will step with the value of Game.Time.physicsElapsed, which is a delta time value.
    * @default
    */
    this.useElapsedTime = false;

    /**
    * @property {boolean} paused - The paused state of the Box2D world.
    * @default
    */
    this.paused = false;

    /**
    * @property {box2d.b2ParticleSystem} particleSystem - The World Particle System. Enabled with World.createParticleSystem.
    */
    this.particleSystem = null;

    /**
    * @property {box2d.b2Body} mouseJointBody - A static body with no fixtures, used internally as the 'body A' for mouse joints when dragging dynamic bodies.
    * @default
    */
    var bd = new box2d.b2BodyDef();
    this.mouseJointBody = this.world.CreateBody(bd);

    /**
    * @property {box2d.b2MouseJoint} mouseJoint - The active mouse joint for dragging dynamic bodies.
    * @default
    */
    this.mouseJoint = null;

    //  Pixel to meter function overrides. 
    if (config.hasOwnProperty('mpx') && config.hasOwnProperty('pxm'))
    {
        this.mpx = config.mpx;
        this.pxm = config.pxm;
    }

    /**
    * @property {object} walls - An object containing the 4 wall bodies that bound the physics world.
    */
    this.walls = { left: null, right: null, top: null, bottom: null };

    /**
    * @property {Phaser.Signal} onBodyAdded - Dispatched when a new Body is added to the World.
    */
    this.onBodyAdded = new Phaser.Signal();

    /**
    * @property {Phaser.Signal} onBodyRemoved - Dispatched when a Body is removed from the World.
    */
    this.onBodyRemoved = new Phaser.Signal();

    /**
    * @property {array} _toRemove - Internal var used to hold references to bodies to remove from the world on the next step.
    * @private
    */
    this._toRemove = [];

};

// By default Box2D uses a 16bit value for collision filter category and mask. Most commonly,
// users will use categories starting from 1, 2, 4, 8 etc. The value 0x8000 sets the highest
// bit of a 16bit value and should cause the least interference with this method.
Phaser.Physics.Box2D.worldBoundsFilterCategory = 0x8000;

Phaser.Physics.Box2D.prototype = {

    /**
    * Returns the next id to use to keep body ids unique
    *
    * @method Phaser.Physics.Box2D#getNextBodyId
    * @return {number} The next unique id for a body to be created with.
    */
    getNextBodyId: function () {

        var id = this.nextBodyId;
        this.nextBodyId += 1;
        return id;

    },

    /**
    * Returns the next id to use to keep fixture ids unique
    *
    * @method Phaser.Physics.Box2D#getNextFixtureId
    * @return {number} The next unique id for a fixture to be created with.
    */
    getNextFixtureId: function () {

        var id = this.nextFixtureId;
        this.nextFixtureId += 1;
        return id;

    },

    /**
    * This will add a Box2D physics body into the removal list for the next step.
    *
    * @method Phaser.Physics.Box2D#removeBodyNextStep
    * @param {Phaser.Physics.Box2D.Body} body - The body to remove at the start of the next step.
    */
    removeBodyNextStep: function (body) {

        this._toRemove.push(body);

    },

    /**
    * Called at the start of the core update loop. Purges flagged bodies from the world.
    *
    * @method Phaser.Physics.Box2D#preUpdate
    */
    preUpdate: function () {

        var i = this._toRemove.length;

        while (i--)
        {
            this.removeBody(this._toRemove[i]);
        }

        this._toRemove.length = 0;

    },

    /**
    * This will create a Box2D physics body on the given game object or array of game objects.
    * A game object can only have 1 physics body active at any one time, and it can't be changed until the object is destroyed.
    * Note: When the game object is enabled for Box2D physics it has its anchor x/y set to 0.5 so it becomes centered.
    *
    * @method Phaser.Physics.Box2D#enable
    * @param {object|array|Phaser.Group} object - The game object to create the physics body on. Can also be an array or Group of objects, a body will be created on every child that has a `body` property.
    * @param {boolean} [children=true] - Should a body be created on all children of this object? If true it will recurse down the display list as far as it can go.
    */
    enable: function (object, children) {

        if (typeof children === 'undefined') { children = true; }

        var i = 1;

        if (Array.isArray(object))
        {
            i = object.length;

            while (i--)
            {
                if (object[i] instanceof Phaser.Group)
                {
                    //  If it's a Group then we do it on the children regardless
                    this.enable(object[i].children, children);
                }
                else
                {
                    this.enableBody(object[i]);

                    if (children && object[i].hasOwnProperty('children') && object[i].children.length > 0)
                    {
                        this.enable(object[i], true);
                    }
                }
            }
        }
        else
        {
            if (object instanceof Phaser.Group)
            {
                //  If it's a Group then we do it on the children regardless
                this.enable(object.children, children);
            }
            else
            {
                this.enableBody(object);

                if (children && object.hasOwnProperty('children') && object.children.length > 0)
                {
                    this.enable(object.children, true);
                }
            }
        }

    },

    /**
    * Creates a Box2D physics body on the given game object.
    * A game object can only have 1 physics body active at any one time, and it can't be changed until the body is nulled.
    *
    * @method Phaser.Physics.Box2D#enableBody
    * @param {object} object - The game object to create the physics body on. A body will only be created if this object has a null `body` property.
    */
    enableBody: function (object) {

        if (object.hasOwnProperty('body') && object.body === null)
        {
            object.body = new Phaser.Physics.Box2D.Body(this.game, object, object.x, object.y, 2);
            object.anchor.set(0.5);
        }

    },

    /**
    * Sets the bounds of the Physics world to match the Game.World dimensions.
    * You can optionally set which 'walls' to create: left, right, top or bottom.
    *
    * @method Phaser.Physics#setBoundsToWorld
    * @param {boolean} [left=true] - If true will create the left bounds wall.
    * @param {boolean} [right=true] - If true will create the right bounds wall.
    * @param {boolean} [top=true] - If true will create the top bounds wall.
    * @param {boolean} [bottom=true] - If true will create the bottom bounds wall.
    * @param {number} [collisionCategory=1] - The category (bitmask) to use for the walls.
    * @param {number} [collisionMask=0xFFFFFFFF] - The mask (bitmask) to use for the walls.
    */
    setBoundsToWorld: function (left, right, top, bottom, collisionCategory, collisionMask) {

        if (typeof left === 'undefined') { left = true; }
        if (typeof right === 'undefined') { right = true; }
        if (typeof top === 'undefined') { top = true; }
        if (typeof bottom === 'undefined') { bottom = true; }
        if (typeof collisionCategory === 'undefined') { collisionCategory = 1; }
        if (typeof collisionMask === 'undefined') { collisionCategory = 0xFFFFFFFF; }
        
        this.setBounds(this.game.world.bounds.x, this.game.world.bounds.y, this.game.world.bounds.width, this.game.world.bounds.height, left, right, top, bottom, collisionCategory, collisionMask);

    },

    /**
    * Sets the bounds of the Physics world to match the given world pixel dimensions.
    * You can optionally set which 'walls' to create: left, right, top or bottom.
    *
    * @method Phaser.Physics.Box2D#setBounds
    * @param {number} x - The x coordinate of the top-left corner of the bounds.
    * @param {number} y - The y coordinate of the top-left corner of the bounds.
    * @param {number} width - The width of the bounds.
    * @param {number} height - The height of the bounds.
    * @param {boolean} [left=true] - If true will create the left bounds wall.
    * @param {boolean} [right=true] - If true will create the right bounds wall.
    * @param {boolean} [top=true] - If true will create the top bounds wall.
    * @param {boolean} [bottom=true] - If true will create the bottom bounds wall.
    * @param {number} [collisionCategory=1] - The category (bitmask) to use for the walls.
    * @param {number} [collisionMask=0xFFFFFFFF] - The mask (bitmask) to use for the walls.
    */
    setBounds: function (x, y, width, height, left, right, top, bottom, collisionCategory, collisionMask) {

        if (typeof left === 'undefined') { left = true; }
        if (typeof right === 'undefined') { right = true; }
        if (typeof top === 'undefined') { top = true; }
        if (typeof bottom === 'undefined') { bottom = true; }
        if (typeof collisionCategory === 'undefined') { collisionCategory = 1; }
        if (typeof collisionMask === 'undefined') { collisionMask = 0xFFFFFFFF; }

        if (this.walls.left)
        {
            this.removeBody(this.walls.left);
        }

        if (this.walls.right)
        {
            this.removeBody(this.walls.right);
        }

        if (this.walls.top)
        {
            this.removeBody(this.walls.top);
        }

        if (this.walls.bottom)
        {
            this.removeBody(this.walls.bottom);
        }
        
        // Prepare shape and fixture definitions for use below
        var polygonShape = new box2d.b2PolygonShape();

        var fixtureDef = new box2d.b2FixtureDef();
        fixtureDef.shape = polygonShape;

        fixtureDef.filter.categoryBits = Phaser.Physics.Box2D.worldBoundsFilterCategory;
        fixtureDef.filter.maskBits = 0xFFFF;

        // We could also use edge shapes, but polygons will make sure that if anything
        // should somehow get outside the bounds, it will be brought back (provided it
        // didn't get all the way outside the polygon wall as well of course)
        var boundThickness = this.pxm(100);
        
        var bounds = this.game.world.bounds;

        if (left)
        {
            this.walls.left = this.createBody(0, 0, 0);
            
            polygonShape.SetAsOrientedBox(boundThickness, this.pxm(bounds.height) + boundThickness, new box2d.b2Vec2(boundThickness, 0), 0);
            
            var f = this.walls.left.data.CreateFixture(fixtureDef);
            f.id = this.getNextFixtureId();
        }

        if (right)
        {
            this.walls.right = this.createBody(0, 0, 0);
            
            polygonShape.SetAsOrientedBox(boundThickness, this.pxm(bounds.height) + boundThickness, new box2d.b2Vec2(this.pxm(-bounds.width) - boundThickness, 0), 0);
            
            var f = this.walls.right.data.CreateFixture(fixtureDef);
            f.id = this.getNextFixtureId();
        }

        if (top)
        {
            this.walls.top = this.createBody(0, 0, 0);

            polygonShape.SetAsOrientedBox(this.pxm(bounds.width) + boundThickness, boundThickness, new box2d.b2Vec2(0, boundThickness), 0);
    
            var f = this.walls.top.data.CreateFixture(fixtureDef);
            f.id = this.getNextFixtureId();
        }

        if (bottom)
        {
            this.walls.bottom = this.createBody(0, 0, 0);

            polygonShape.SetAsOrientedBox(this.pxm(bounds.width) + boundThickness, boundThickness, new box2d.b2Vec2(0, this.pxm(-bounds.height) - boundThickness), 0);
    
            var f = this.walls.bottom.data.CreateFixture(fixtureDef);
            f.id = this.getNextFixtureId();
        }

    },

    /**
    * Pauses the Box2D world independent of the game pause state.
    *
    * @method Phaser.Physics.Box2D#pause
    */
    pause: function() {

        this.paused = true;

    },
    
    /**
    * Resumes a paused Box2D world.
    *
    * @method Phaser.Physics.Box2D#resume
    */
    resume: function() {

        this.paused = false;

    },

    /**
    * Internal Box2D update loop.
    *
    * @method Phaser.Physics.Box2D#update
    */
    update: function () {

        // Do nothing when the physics engine was paused before
        if (this.paused)
        {
            return;
        }
        
        if (this.useElapsedTime)
        {
            this.world.Step(this.game.time.physicsElapsed, this.velocityIterations, this.positionIterations);
        }
        else
        {
            this.world.Step(this.frameRate, this.velocityIterations, this.positionIterations);
        }

    },

    /**
    * Clears all bodies from the simulation, resets callbacks.
    *
    * @method Phaser.Physics.Box2D#reset
    */
    reset: function () {

        this.clear();

    },

    /**
    * Clears all bodies from the simulation, resets callbacks.
    *
    * @method Phaser.Physics.Box2D#clear
    */
    clear: function () {

        var gravity = this.world.GetGravity().Clone();

        this.world = new box2d.b2World(gravity);
        this.world.SetDebugDraw(this.debugDraw);
        this.world.SetContactListener(this.contactListener);
        this._toRemove = [];

    },

    /**
    * Clears all bodies from the simulation and unlinks World from Game. Should only be called on game shutdown. Call `clear` on a State change.
    *
    * @method Phaser.Physics.Box2D#destroy
    */
    destroy: function () {

        this.clear();

        this.gravity = null;
        this.world = null;

        this.game = null;

    },

    /**
    * Creates a new Body and adds it to the World.
    *
    * @method Phaser.Physics.Box2D#createBody
    * @param {number} [x=0] - The x coordinate of this Body.
    * @param {number} [y=0] - The y coordinate of this Body.
    * @param {number} [density=2] - The default density of this Body (0 = static, 1 = kinematic, 2 = dynamic, 3 = bullet).
    * @return {Phaser.Physics.P2.Body} The body
    */
    createBody: function (x, y, density) {

        var body = new Phaser.Physics.Box2D.Body(this.game, null, x, y, density, this);

        return body;

    },

    /**
    * Creates a new dynamic Body and adds a Circle fixture to it of the given size.
    *
    * @method Phaser.Physics.Box2D#createCircle
    * @param {number} [x=0] - The x coordinate of this Body.
    * @param {number} [y=0] - The y coordinate of this Body.
    * @param {number} [radius=32] - The radius of this circle in pixels.
    * @param {number} [offsetX=0] - Local horizontal offset of the shape relative to the body center of mass.
    * @param {number} [offsetY=0] - Local vertical offset of the shape relative to the body center of mass.
    * @return {Phaser.Physics.P2.Body} The body
    */
    createCircle: function (x, y, radius, offsetX, offsetY) {
    
        var body = this.createBody(x, y, 2);

        return body.setCircle(radius, offsetX, offsetY);

    },

    /**
    * Creates a new dynamic Body and adds a Rectangle fixture to it of the given dimensions.
    *
    * @method Phaser.Physics.Box2D#createRectangle
    * @param {number} [x=0] - The x coordinate of this Body.
    * @param {number} [y=0] - The y coordinate of this Body.
    * @param {number} [width=16] - The width of the rectangle in pixels.
    * @param {number} [height=16] - The height of the rectangle in pixels.
    * @param {number} [offsetX=0] - Local horizontal offset of the shape relative to the body center of mass.
    * @param {number} [offsetY=0] - Local vertical offset of the shape relative to the body center of mass.
    * @param {number} [rotation=0] - Local rotation of the shape relative to the body center of mass, specified in radians.
    * @return {Phaser.Physics.P2.Body} The body
    */
    createRectangle: function (x, y, width, height, offsetX, offsetY, rotation) {
    
        var body = this.createBody(x, y, 2);

        return body.setRectangle(width, height, offsetX, offsetY, rotation);

    },

    /**
    * Creates a new dynamic Body and adds a Polygon fixture to it.
    *
    * @method Phaser.Physics.Box2D#createPolygon
    * @param {number} [x=0] - The x coordinate of this Body.
    * @param {number} [y=0] - The y coordinate of this Body.
    * @param {Array} vertices - Local positions of the vertices relative to the body center. Format is [x1, y1, x2, y2, ...]
    * @param {number} [firstIndex=0] - The index of the x-value of the starting vertex.
    * @param {number} count - The number of vertices to use. If this parameter is not passed, all vertices above firstIndex will be used.
    * @return {Phaser.Physics.P2.Body} The body
    */
    createPolygon: function (x, y, vertices, firstIndex, count) {
    
        var body = this.createBody(x, y, 2);

        return body.setPolygon(vertices, firstIndex, count);

    },

    /**
    * Adds an already created Box2D Body to this Box2D world.
    *
    * @method Phaser.Physics.Box2D#addBody
    * @param {Phaser.Physics.Box2D.Body} body - The Body to add to the World. Must already exist and not be part of another Box2D world.
    * @return {boolean} True if the Body was added successfully, otherwise false.
    */
    addBody: function (body) {

        if (body.data.world)
        {
            return false;
        }
        else
        {
            body.data = this.world.CreateBody(body.bodyDef);
            body.data.world = this.world;
            body.data.parent = body;

            this.onBodyAdded.dispatch(body);

            return true;
        }

    },

    /**
    * Removes a body from the world. This will silently fail if the body wasn't part of the world to begin with.
    *
    * @method Phaser.Physics.Box2D#removeBody
    * @param {Phaser.Physics.Box2D.Body} body - The Body to remove from the World.
    * @return {Phaser.Physics.Box2D.Body} The Body that was removed.
    */
    removeBody: function (body) {

        if (body.data.world == this.world)
        {
            this.world.DestroyBody(body.data);

            this.onBodyRemoved.dispatch(body);
        }

        return body;

    },

    /**
    * Populates and returns an array with references to of all current Bodies in the world.
    *
    * @method Phaser.Physics.Box2D#getBodies
    * @return {array<Phaser.Physics.Box2D.Body>} An array containing all current Bodies in the world.
    */
    getBodies: function () {

        var output = [];
        
        for (var b = this.world.GetBodyList(); b; b = b.GetNext())
        {
            output.push(b);
        }

        return output;

    },

    /**
    * Checks the given object to see if it has a Box2D body and if so returns it.
    *
    * @method Phaser.Physics.Box2D#getBody
    * @param {object} object - The object to check for a box2d.b2Body on.
    * @return {box2d.b2Body} The Box2D body, or null if not found.
    */
    getBody: function (object) {

        if (object instanceof box2d.b2Body)
        {
            //  Native Box2D body
            return object;
        }
        else if (object instanceof Phaser.Physics.Box2D.Body)
        {
            //  Phaser Box2D Body
            return object.data;
        }
        else if (object['body'] && object['body'].type === Phaser.Physics.BOX2D)
        {
            //  Sprite, TileSprite, etc
            return object.body.data;
        }

        return null;

    },

    /**
    * Converts the current world into a JSON object.
    *
    * @method Phaser.Physics.Box2D#toJSON
    * @return {object} A JSON representation of the world.
    */
    toJSON: function () {

        return this.world.toJSON();

    },

    /**
    * Convert Box2D physics value (meters) to pixel scale.
    * By default we use a scale of 50px per meter.
    * If you need to modify this you can over-ride these functions via the Physics Configuration object.
    *
    * @method Phaser.Physics.Box2D#mpx
    * @param {number} v - The value to convert.
    * @return {number} The scaled value.
    */
    mpx: function (v) {

        return v *= this.ptmRatio;

    },

    /**
    * Convert pixel value to Box2D physics scale (meters).
    * By default we use a scale of 50px per meter.
    * If you need to modify this you can over-ride these functions via the Physics Configuration object.
    *
    * @method Phaser.Physics.Box2D#pxm
    * @param {number} v - The value to convert.
    * @return {number} The scaled value.
    */
    pxm: function (v) {

        return v / this.ptmRatio;

    },
    
    /**
    * Runs the standard 'debug draw' rendering. What actually gets drawn will depend
    * on the current status of the flags set in the debug draw object held by the b2World.
    * This could perhaps be made modifiable at runtime, but for now it is just rendering
    * shapes (see usage of b2Shapes flag below).
    *
    * @method Phaser.Physics.Box2D#renderDebugDraw
    * @param {object} context - The context to render to.
    */
    renderDebugDraw: function(context) {
        
        if (!this.game.physics.box2d)
        {
            return;
        }
        
        var world = this.game.physics.box2d;
        
        world.debugDraw.start(context);
    
        world.world.DrawDebugData();
        
        world.debugDraw.stop();

    },
    
    /**
    * Renders information about the body as text. This is intended to be used internally by Phaser.Utils.Debug.
    * To make use of this from your code you would call something like game.debug.bodyInfo(sprite, x, y)
    *
    * @method Phaser.Physics.Box2D#renderBodyInfo
    * @param {Phaser.Utils.Debug} debug - The Debug class to use.
    * @param {Phaser.Physics.Box2D} body - The Body to render the info of.
    */
    renderBodyInfo: function (debug, body) {
    
        debug.line('Position: x: ' + body.x.toFixed(3) + ' y: ' + body.y.toFixed(3));
        debug.line('Rotation: ' + body.rotation.toFixed(3) + ' degrees');
        debug.line('Velocity: x: ' + body.velocity.x.toFixed(3) + ' y: ' + body.velocity.y.toFixed(3));
        debug.line('Angular velocity: ' + body.angularVelocity.toFixed(3) + ' degrees/sec');
    
    },

    /**
    * Returns all fixtures found under the given point. Set the onlyOne parameter to true if you only
    * care about finding one fixture under the point.
    *
    * @method Phaser.Physics.Box2D#getFixturesAtPoint
    * @param {Phaser.Pointer} x - The x coordinate of the location to test for (pixel coordinates)
    * @param {Phaser.Pointer} y - The y coordinate of the location to test for (pixel coordinates)
    * @param {boolean} [onlyOne=false] - If true, this function will return after finding just one fixture.
    * @param {boolean} [onlyDynamic=false] - If true, only fixtures on dynamic bodies will be returned.
    * @return {Array} All fixtures found at the given point.
    */
    getFixturesAtPoint: function (x, y, onlyOne, onlyDynamic) {
        
        if (typeof onlyOne === 'undefined') { onlyOne = false; }
        if (typeof onlyDynamic === 'undefined') { onlyDynamic = false; }
        
        var worldx = this.pxm(-x);
        var worldy = this.pxm(-y);
        var worldPoint = new box2d.b2Vec2(worldx, worldy);
        
        // Make a small box.
        var aabb = new box2d.b2AABB();
        var d = new box2d.b2Vec2();

        d.SetXY(0.001, 0.001);

        box2d.b2SubVV(worldPoint, d, aabb.lowerBound);
        box2d.b2AddVV(worldPoint, d, aabb.upperBound);

        var hitFixtures = [];

        // Query the world for overlapping shapes.
        // Here we return true to keep checking, or false to quit.
        var callback = function (fixture)
        {
            if (onlyDynamic && fixture.GetBody().GetType() !== box2d.b2BodyType.b2_dynamicBody)
            {
                return true;
            }
         
            if (fixture.TestPoint(worldPoint))
            {
                hitFixtures.push(fixture);
                return !onlyOne;
            }
         
            return true;
        };

        this.world.QueryAABB(callback, aabb);
        
        return hitFixtures;

    },

    /**
    * Returns all bodies (Phaser.Physics.Box2D.Body) found under the given coordinates. Set the onlyOne
    * parameter to true if you only care about finding one body.
    *
    * @method Phaser.Physics.Box2D#getBodiesAtPoint
    * @param {number} x - The x coordinate of the location to test for (pixel coordinates)
    * @param {number} y - The y coordinate of the location to test for (pixel coordinates)
    * @param {boolean} [onlyOne=false] - If true, this function will return after finding just one body.
    * @param {boolean} [onlyDynamic=false] - If true, only dynamic bodies will be returned.
    * @return {Array} All bodies that have fixtures at the given point.
    */
    getBodiesAtPoint: function (x, y, onlyOne, onlyDynamic) {
        
        if (typeof onlyOne === 'undefined') { onlyOne = false; }
        if (typeof onlyDynamic === 'undefined') { onlyDynamic = false; }
        
        var fixtures = this.getFixturesAtPoint(x, y, onlyOne, onlyDynamic);
        
        if (fixtures.length < 1)
        {
            return fixtures;
        }
        
        var bodies = [];

        for (var i = 0; i < fixtures.length; i++)
        {
            bodies.push(fixtures[i].GetBody().parent);
        }
        
        // http://stackoverflow.com/questions/9229645/remove-duplicates-from-javascript-array/9229821
        bodies.filter(function(elem, pos) {
            return bodies.indexOf(elem) === pos;
        });
        
        return bodies;

    },    
    
    /**
    * If there is a dynamic body under the given point, a mouse joint will be created
    * to drag that body around. Use the mouseDragMove and mouseDragEnd functions to
    * continue the drag action. Any mouse drag already in progress will be canceled.
    *
    * @method Phaser.Physics.Box2D#mouseDragStart
    * @param {Phaser.Point} point - The location for the drag start (pixel coordinates)
    */
    mouseDragStart: function (point) {
        
        this.mouseDragEnd();
        
        var fixturesAtPoint = this.getFixturesAtPoint(point.x, point.y, true, true);
        
        if ( fixturesAtPoint.length < 1 ) {
            return;
        }
        
        var worldx = this.pxm(-point.x);
        var worldy = this.pxm(-point.y);
        var worldPoint = new box2d.b2Vec2(worldx, worldy);
        
        var jd = new box2d.b2MouseJointDef();
        jd.bodyA = this.mouseJointBody;
        jd.bodyB = fixturesAtPoint[0].GetBody();
        jd.target.Copy(worldPoint);
        jd.maxForce = 1000 * jd.bodyB.GetMass();
        this.mouseJoint = this.world.CreateJoint(jd);
        jd.bodyB.SetAwake(true);
    },
    
    /**
    * Updates the target location of the active mouse joint, if there is one. If there
    * is no mouse joint active, this does nothing.
    *
    * @method Phaser.Physics.Box2D#mouseDragMove
    * @param {Phaser.Point} point - The location for the drag move (pixel coordinates)
    */
    mouseDragMove: function (point) {

        if (!this.mouseJoint)
        {
            return;
        }
        
        var worldx = this.pxm(-point.x);
        var worldy = this.pxm(-point.y);
        var worldPoint = new box2d.b2Vec2(worldx, worldy);
    
        this.mouseJoint.SetTarget(worldPoint);
    
    },
    
    /**
    * Ends the active mouse joint if there is one. If there is no mouse joint active, does nothing.
    *
    * @method Phaser.Physics.Box2D#mouseDragEnd
    */
    mouseDragEnd: function () {

        if (this.mouseJoint)
        {
            this.world.DestroyJoint(this.mouseJoint);
            this.mouseJoint = null;
        }
    
    },
    
    /**
    * Creates a distance joint.
    *
    * @method Phaser.Physics.Box2D#distanceJoint
    * @param {Phaser.Physics.Box2D.Body|Phaser.Sprite} bodyA - first body to be joined
    * @param {Phaser.Physics.Box2D.Body|Phaser.Sprite} bodyB - second body to be joined
    * @param {number} length - target length of joint. If not given, the current position of the anchor points will be used to calculate the joint length.
    * @param {number} [ax=0] - local x position of the anchor in bodyA
    * @param {number} [ay=0] - local y position of the anchor in bodyA
    * @param {number} [bx=0] - local x position of the anchor in bodyB
    * @param {number} [by=0] - local y position of the anchor in bodyB
    * @param {number} [frequency=0] - frequency of joint
    * @param {number} [damping=0] - damping of joint
    * @return {box2d.b2DistanceJoint} The created joint.
    */
    distanceJoint: function (bodyA, bodyB, length, ax, ay, bx, by, frequency, damping) {
        
        if ( typeof ax === 'undefined' ) { ax = 0; }
        if ( typeof ay === 'undefined' ) { ay = 0; }
        if ( typeof bx === 'undefined' ) { bx = 0; }
        if ( typeof by === 'undefined' ) { by = 0; }        
        if ( typeof frequency === 'undefined' ) { frequency = 0; }
        if ( typeof damping === 'undefined' ) { damping = 0; }
        
        ax = this.pxm(-ax);
        ay = this.pxm(-ay);
        bx = this.pxm(-bx);
        by = this.pxm(-by);        
        
        // Could be a sprite
        if (bodyA['body'])
        {
            bodyA = bodyA['body'];
        }

        if (bodyB['body'])
        {
            bodyB = bodyB['body'];
        }
        
        var jd = new box2d.b2DistanceJointDef();

        jd.bodyA = bodyA.data;
        jd.bodyB = bodyB.data;

        jd.localAnchorA.SetXY( ax, ay );
        jd.localAnchorB.SetXY( bx, by );
        
        if (length === null || typeof length === 'undefined')
        {
            // Set length to current
            var worldAnchorA = new box2d.b2Vec2();
            var worldAnchorB = new box2d.b2Vec2();

            jd.bodyA.GetWorldPoint(jd.localAnchorA, worldAnchorA);
            jd.bodyB.GetWorldPoint(jd.localAnchorB, worldAnchorB);

            worldAnchorA.SelfSub(worldAnchorB);
            length = worldAnchorA.Length();
        }
        else
        {
            length = this.pxm(length);
        }
        
        jd.length = length;
        jd.frequencyHz = frequency;
        jd.dampingRatio = damping;
        
        return this.world.CreateJoint(jd);

    },
    
    /**
    * Creates a rope joint.
    *
    * @method Phaser.Physics.Box2D#ropeJoint
    * @param {Phaser.Physics.Box2D.Body|Phaser.Sprite} bodyA - first body to be joined
    * @param {Phaser.Physics.Box2D.Body|Phaser.Sprite} bodyB - second body to be joined
    * @param {number} length - target length of joint. If not given, the current position of the anchor points will be used to calculate the joint length.
    * @param {number} [ax=0] - local x position of the anchor in bodyA
    * @param {number} [ay=0] - local y position of the anchor in bodyA
    * @param {number} [bx=0] - local x position of the anchor in bodyB
    * @param {number} [by=0] - local y position of the anchor in bodyB
    * @return {box2d.b2RopeJoint} The created joint.
    */
    ropeJoint: function (bodyA, bodyB, length, ax, ay, bx, by) {
        
        if ( typeof ax === 'undefined' ) { ax = 0; }
        if ( typeof ay === 'undefined' ) { ay = 0; }
        if ( typeof bx === 'undefined' ) { bx = 0; }
        if ( typeof by === 'undefined' ) { by = 0; }
        
        ax = this.pxm(-ax);
        ay = this.pxm(-ay);
        bx = this.pxm(-bx);
        by = this.pxm(-by);        
        
        // Could be a sprite
        if (bodyA['body'])
        {
            bodyA = bodyA['body'];
        }

        if (bodyB['body'])
        {
            bodyB = bodyB['body'];
        }
        
        var jd = new box2d.b2RopeJointDef();

        jd.bodyA = bodyA.data;
        jd.bodyB = bodyB.data;

        jd.localAnchorA.SetXY( ax, ay );
        jd.localAnchorB.SetXY( bx, by );
        
        if (length === null || typeof length === 'undefined')
        {
            // Set length to current
            var worldAnchorA = new box2d.b2Vec2();
            var worldAnchorB = new box2d.b2Vec2();

            jd.bodyA.GetWorldPoint(jd.localAnchorA, worldAnchorA);
            jd.bodyB.GetWorldPoint(jd.localAnchorB, worldAnchorB);

            worldAnchorA.SelfSub(worldAnchorB);
            length = worldAnchorA.Length();
        }
        else
        {
            length = this.pxm(length);
        }
        
        jd.maxLength = length;
        
        return this.world.CreateJoint(jd);

    },
    
    /**
    * Creates a revolute joint.
    *
    * @method Phaser.Physics.Box2D#revoluteJoint
    * @param {Phaser.Physics.Box2D.Body|Phaser.Sprite} bodyA - first body to be joined
    * @param {Phaser.Physics.Box2D.Body|Phaser.Sprite} bodyB - second body to be joined
    * @param {number} [ax=0] - local x position of the anchor in bodyA
    * @param {number} [ay=0] - local y position of the anchor in bodyA
    * @param {number} [bx=0] - local x position of the anchor in bodyB
    * @param {number} [by=0] - local y position of the anchor in bodyB
    * @param {number} [motorSpeed=0] - target speed (degrees/second), measured as the angle of bodyB relative to bodyA, counter-clockwise being positive
    * @param {number} [motorTorque=0] - maximum torque the joint motor can exert to maintain the target speed
    * @param {boolean} [motorEnabled=false] - Is the motor enabled or not?
    * @param {number} [lowerLimit=0] - the lower limit angle (degrees), measured as the angle of bodyB relative to bodyA
    * @param {number} [upperLimit=0] - the upper limit angle (degrees), measured as the angle of bodyB relative to bodyA
    * @param {boolean} [limitEnabled=false] - Is the limit enabled?
    * @return {box2d.b2RevoluteJoint} The created joint.
    */
    revoluteJoint: function (bodyA, bodyB, ax, ay, bx, by, motorSpeed, motorTorque, motorEnabled, lowerLimit, upperLimit, limitEnabled) {
        
        if ( typeof ax === 'undefined' ) { ax = 0; }
        if ( typeof ay === 'undefined' ) { ay = 0; }
        if ( typeof bx === 'undefined' ) { bx = 0; }
        if ( typeof by === 'undefined' ) { by = 0; }
        if ( typeof motorSpeed === 'undefined' ) { motorSpeed = 0; }
        if ( typeof motorTorque === 'undefined' ) { motorTorque = 0; }
        if ( typeof motorEnabled === 'undefined' ) { motorEnabled = false; }
        if ( typeof lowerLimit === 'undefined' ) { lowerLimit = 0; }
        if ( typeof upperLimit === 'undefined' ) { upperLimit = 0; }
        if ( typeof limitEnabled === 'undefined' ) { limitEnabled = false; }
        
        ax = this.pxm(-ax);
        ay = this.pxm(-ay);
        bx = this.pxm(-bx);
        by = this.pxm(-by);        
        
        // Could be a sprite
        if (bodyA['body'])
        {
            bodyA = bodyA['body'];
        }

        if (bodyB['body'])
        {
            bodyB = bodyB['body'];
        }
        
        var jd = new box2d.b2RevoluteJointDef();

        jd.bodyA = bodyA.data;
        jd.bodyB = bodyB.data;

        jd.localAnchorA.SetXY( ax, ay );
        jd.localAnchorB.SetXY( bx, by );
        
        jd.motorSpeed = Phaser.Math.degToRad(-motorSpeed);
        jd.maxMotorTorque = motorTorque;
        jd.enableMotor = motorEnabled;
        jd.lowerAngle = Phaser.Math.degToRad(lowerLimit);
        jd.upperAngle = Phaser.Math.degToRad(upperLimit);
        jd.enableLimit = limitEnabled;
        
        return this.world.CreateJoint(jd);

    },
    
    /**
    * Creates a prismatic joint.
    *
    * @method Phaser.Physics.Box2D#prismaticJoint
    * @param {Phaser.Physics.Box2D.Body|Phaser.Sprite} bodyA - first body to be joined
    * @param {Phaser.Physics.Box2D.Body|Phaser.Sprite} bodyB - second body to be joined
    * @param {number} [axisX=1] - the x component of the joint axis
    * @param {number} [axisY=0] - the y component of the joint axis
    * @param {number} [ax=0] - local x position of the anchor in bodyA
    * @param {number} [ay=0] - local y position of the anchor in bodyA
    * @param {number} [bx=0] - local x position of the anchor in bodyB
    * @param {number} [by=0] - local y position of the anchor in bodyB
    * @param {number} [motorSpeed=0] - target speed (pixels/second), measured along the joint axis
    * @param {number} [motorForce=0] - maximum torque the joint motor can exert to maintain the target speed
    * @param {boolean} [motorEnabled=false] -Is the motor enabled?
    * @param {number} [lowerLimit=0] - the lower limit angle (pixels), measured along the joint axis
    * @param {number} [upperLimit=0] - the upper limit angle (pixels), measured along the joint axis
    * @param {boolean} [limitEnabled=false] - Is the joint limit enabled?
    * @param {number} [offsetAngle=0] - angle (degrees) relative to bodyA, to which bodyB should be rotated, counter-clockwise being positive
    * @return {box2d.b2PrismaticJoint} The created joint.
    */
    prismaticJoint: function (bodyA, bodyB, axisX, axisY, ax, ay, bx, by, motorSpeed, motorForce, motorEnabled, lowerLimit, upperLimit, limitEnabled, offsetAngle) {
        
        if ( typeof axisX === 'undefined' ) { axisX = 1; }
        if ( typeof axisY === 'undefined' ) { axisY = 0; }
        if ( typeof ax === 'undefined' ) { ax = 0; }
        if ( typeof ay === 'undefined' ) { ay = 0; }
        if ( typeof bx === 'undefined' ) { bx = 0; }
        if ( typeof by === 'undefined' ) { by = 0; }
        if ( typeof motorSpeed === 'undefined' ) { motorSpeed = 0; }
        if ( typeof motorForce === 'undefined' ) { motorForce = 0; }
        if ( typeof lowerLimit === 'undefined' ) { lowerLimit = 0; }
        if ( typeof upperLimit === 'undefined' ) { upperLimit = 0; }
        if ( typeof limitEnabled === 'undefined' ) { limitEnabled = false; }
        if ( typeof motorEnabled === 'undefined' ) { motorEnabled = false; }
        if ( typeof offsetAngle === 'undefined' ) { offsetAngle = 0; }
        
        // Axis is only for direction, so don't need pxm conversion
        axisX *= -1;
        axisY *= -1;
        
        ax = this.pxm(-ax);
        ay = this.pxm(-ay);
        bx = this.pxm(-bx);
        by = this.pxm(-by);
        
        // These are relative to axis, which has been converted already, so only do size change
        motorSpeed = this.pxm(motorSpeed);
        lowerLimit = this.pxm(lowerLimit);
        upperLimit = this.pxm(upperLimit);
        
        // Could be a sprite
        if (bodyA['body'])
        {
            bodyA = bodyA['body'];
        }

        if (bodyB['body'])
        {
            bodyB = bodyB['body'];
        }
        
        var jd = new box2d.b2PrismaticJointDef();

        jd.bodyA = bodyA.data;
        jd.bodyB = bodyB.data;

        jd.localAxisA.SetXY( axisX, axisY );
        jd.localAnchorA.SetXY( ax, ay );
        jd.localAnchorB.SetXY( bx, by );
        
        jd.motorSpeed = motorSpeed;
        jd.maxMotorForce = motorForce;
        jd.enableMotor = motorEnabled;
        jd.lowerTranslation = lowerLimit;
        jd.upperTranslation = upperLimit;
        jd.enableLimit = limitEnabled;
        jd.referenceAngle = Phaser.Math.degToRad(-offsetAngle);
        
        return this.world.CreateJoint(jd);

    },
    
    /**
    * Creates a friction joint.
    *
    * @method Phaser.Physics.Box2D#frictionJoint
    * @param {Phaser.Physics.Box2D.Body|Phaser.Sprite} bodyA - first body to be joined
    * @param {Phaser.Physics.Box2D.Body|Phaser.Sprite} bodyB - second body to be joined
    * @param {number} [ax=0] - local x position of the anchor in bodyA
    * @param {number} [ay=0] - local y position of the anchor in bodyA
    * @param {number} [bx=0] - local x position of the anchor in bodyB
    * @param {number} [by=0] - local y position of the anchor in bodyB
    * @param {number} [maxForce=0] - maximum force the joint can exert to maintain zero linear velocity between the two bodies
    * @param {number} [maxTorque=0] - maximum torque the joint can exert to maintain zero angular velocity between the two bodies
    * @return {box2d.b2FrictionJoint} The created joint.
    */
    frictionJoint: function (bodyA, bodyB, maxForce, maxTorque, ax, ay, bx, by) {
        
        if ( typeof ax === 'undefined' ) { ax = 0; }
        if ( typeof ay === 'undefined' ) { ay = 0; }
        if ( typeof bx === 'undefined' ) { bx = 0; }
        if ( typeof by === 'undefined' ) { by = 0; }
        if ( typeof maxForce === 'undefined' ) { maxForce = 0; }
        if ( typeof maxTorque === 'undefined' ) { maxTorque = 0; }
        
        ax = this.pxm(-ax);
        ay = this.pxm(-ay);
        bx = this.pxm(-bx);
        by = this.pxm(-by);
        
        // Could be a sprite
        if (bodyA['body'])
        {
            bodyA = bodyA['body'];
        }

        if (bodyB['body'])
        {
            bodyB = bodyB['body'];
        }
        
        var jd = new box2d.b2FrictionJointDef();

        jd.bodyA = bodyA.data;
        jd.bodyB = bodyB.data;

        jd.localAnchorA.SetXY( ax, ay );
        jd.localAnchorB.SetXY( bx, by );
        
        jd.maxForce = maxForce;
        jd.maxTorque = maxTorque;
        
        return this.world.CreateJoint(jd);

    },
    
    /**
    * Creates a weld joint.
    *
    * @method Phaser.Physics.Box2D#weldJoint
    * @param {Phaser.Physics.Box2D.Body|Phaser.Sprite} bodyA - first body to be joined
    * @param {Phaser.Physics.Box2D.Body|Phaser.Sprite} bodyB - second body to be joined
    * @param {number} [ax=0] - local x position of the anchor in bodyA
    * @param {number} [ay=0] - local y position of the anchor in bodyA
    * @param {number} [bx=0] - local x position of the anchor in bodyB
    * @param {number} [by=0] - local y position of the anchor in bodyB
    * @param {number} [frequency=0] - frequency of joint
    * @param {number} [damping=0] - damping of joint
    * @return {box2d.b2WeldJoint} The created joint.
    */
    weldJoint: function (bodyA, bodyB, ax, ay, bx, by, frequency, damping) {
        
        if ( typeof ax === 'undefined' ) { ax = 0; }
        if ( typeof ay === 'undefined' ) { ay = 0; }
        if ( typeof bx === 'undefined' ) { bx = 0; }
        if ( typeof by === 'undefined' ) { by = 0; }
        if ( typeof frequency === 'undefined' ) { frequency = 0; }
        if ( typeof damping === 'undefined' ) { damping = 0; }
        
        ax = this.pxm(-ax);
        ay = this.pxm(-ay);
        bx = this.pxm(-bx);
        by = this.pxm(-by);
        
        // Could be a sprite
        if (bodyA['body'])
        {
            bodyA = bodyA['body'];
        }

        if (bodyB['body'])
        {
            bodyB = bodyB['body'];
        }
        
        var jd = new box2d.b2WeldJointDef();

        jd.bodyA = bodyA.data;
        jd.bodyB = bodyB.data;

        jd.localAnchorA.SetXY( ax, ay );
        jd.localAnchorB.SetXY( bx, by );
        
        jd.frequencyHz = frequency;
        jd.dampingRatio = damping;
        
        return this.world.CreateJoint(jd);

    },
    
    /**
    * Creates a motor joint.
    *
    * @method Phaser.Physics.Box2D#motorJoint
    * @param {Phaser.Physics.Box2D.Body|Phaser.Sprite} bodyA - first body to be joined
    * @param {Phaser.Physics.Box2D.Body|Phaser.Sprite} bodyB - second body to be joined
    * @param {number} [offsetX=0] - local x position in bodyA to which bodyB should be moved
    * @param {number} [offsetY=0] - local y position in bodyA to which bodyB should be moved
    * @param {number} [offsetAngle=0] - angle (degrees) relative to bodyA, to which bodyB should be rotated
    * @param {number} [maxForce=0] - maximum force the joint can exert to move bodyB to the offset position
    * @param {number} [maxTorque=0] - maximum torque the joint can exert to rotate bodyB to the offset angle
    * @param {number} [correctionFactor=1] - how quickly the joint should attempt to correct the position of bodyB
    * @return {box2d.b2MotorJoint} The created joint.
    */
    motorJoint: function (bodyA, bodyB, maxForce, maxTorque, correctionFactor, offsetX, offsetY, offsetAngle) {
        
        if ( typeof offsetX === 'undefined' ) { offsetX = 0; }
        if ( typeof offsetY === 'undefined' ) { offsetY = 0; }
        if ( typeof offsetAngle === 'undefined' ) { offsetAngle = 0; }
        if ( typeof maxForce === 'undefined' ) { maxForce = 0; }
        if ( typeof maxTorque === 'undefined' ) { maxTorque = 0; }
        if ( typeof correctionFactor === 'undefined' ) { correctionFactor = 1; }
        
        offsetX = this.pxm(-offsetX);
        offsetY = this.pxm(-offsetY);
        
        // Could be a sprite
        if (bodyA['body'])
        {
            bodyA = bodyA['body'];
        }

        if (bodyB['body'])
        {
            bodyB = bodyB['body'];
        }
        
        var jd = new box2d.b2MotorJointDef();

        jd.bodyA = bodyA.data;
        jd.bodyB = bodyB.data;
        jd.linearOffset.SetXY( offsetX, offsetY );
        
        jd.maxForce = maxForce;
        jd.maxTorque = maxTorque;
        jd.angularOffset = Phaser.Math.degToRad(-offsetAngle);
        jd.correctionFactor = correctionFactor;
        
        return this.world.CreateJoint(jd);

    },
    
    /**
    * Creates a wheel joint.
    *
    * @method Phaser.Physics.Box2D#wheelJoint
    * @param {Phaser.Physics.Box2D.Body|Phaser.Sprite} bodyA - first body to be joined
    * @param {Phaser.Physics.Box2D.Body|Phaser.Sprite} bodyB - second body to be joined
    * @param {number} [ax=0] - local x position of the anchor in bodyA
    * @param {number} [ay=0] - local y position of the anchor in bodyA
    * @param {number} [bx=0] - local x position of the anchor in bodyB
    * @param {number} [by=0] - local y position of the anchor in bodyB
    * @param {number} [axisX=0] - the x component of the joint axis
    * @param {number} [axisY=1] - the y component of the joint axis
    * @param {number} [frequency=0] - frequency of joint
    * @param {number} [damping=0] - damping of joint
    * @param {number} [motorSpeed=0] - target speed (degrees/second), measured as the angle of bodyB relative to bodyA, counter-clockwise being positive.
    * @param {number} [motorTorque=0] - maximum torque the joint motor can exert to maintain the target speed
    * @param {boolean} [motorEnabled=false] - Is the motor enabled?
    * @return {box2d.b2WheelJoint} The created joint.
    */
    wheelJoint: function (bodyA, bodyB, ax, ay, bx, by, axisX, axisY, frequency, damping, motorSpeed, motorTorque, motorEnabled) {
        
        if ( typeof axisX === 'undefined' ) { axisX = 0; }
        if ( typeof axisY === 'undefined' ) { axisY = 1; }
        if ( typeof ax === 'undefined' ) { ax = 0; }
        if ( typeof ay === 'undefined' ) { ay = 0; }
        if ( typeof bx === 'undefined' ) { bx = 0; }
        if ( typeof by === 'undefined' ) { by = 0; }
        if ( typeof motorSpeed === 'undefined' ) { motorSpeed = 0; }
        if ( typeof motorTorque === 'undefined' ) { motorTorque = 0; }
        if ( typeof motorEnabled === 'undefined' ) { motorEnabled = false; }
        if ( typeof frequency === 'undefined' ) { frequency = 0; }
        if ( typeof damping === 'undefined' ) { damping = 0; }
                
        // Axis is only for direction, so don't need pxm conversion
        axisX *= -1;
        axisY *= -1;
        
        ax = this.pxm(-ax);
        ay = this.pxm(-ay);
        bx = this.pxm(-bx);
        by = this.pxm(-by);

        // Could be a sprite
        if (bodyA['body'])
        {
            bodyA = bodyA['body'];
        }

        if (bodyB['body'])
        {
            bodyB = bodyB['body'];
        }
        
        var jd = new box2d.b2WheelJointDef();

        jd.bodyA = bodyA.data;
        jd.bodyB = bodyB.data;

        jd.localAxisA.SetXY( axisX, axisY );
        jd.localAnchorA.SetXY( ax, ay );
        jd.localAnchorB.SetXY( bx, by );
        
        jd.motorSpeed = Phaser.Math.degToRad(-motorSpeed);
        jd.maxMotorTorque = motorTorque;
        jd.enableMotor = motorEnabled;
        jd.frequencyHz = frequency;
        jd.dampingRatio = damping;

        return this.world.CreateJoint(jd);

    },
    
    /**
    * Creates a pulley joint.
    *
    * @method Phaser.Physics.Box2D#pulleyJoint
    * @param {Phaser.Physics.Box2D.Body|Phaser.Sprite} bodyA - first body to be joined
    * @param {Phaser.Physics.Box2D.Body|Phaser.Sprite} bodyB - second body to be joined
    * @param {number} [ax=0] - local x position of the anchor in bodyA
    * @param {number} [ay=0] - local y position of the anchor in bodyA
    * @param {number} [bx=0] - local x position of the anchor in bodyB
    * @param {number} [by=0] - local y position of the anchor in bodyB
    * @param {number} [gax=0] - world x position of the ground anchor of bodyA
    * @param {number} [gay=0] - world y position of the ground anchor of bodyA
    * @param {number} [gbx=0] - world x position of the ground anchor of bodyB
    * @param {number} [gby=0] - world y position of the ground anchor of bodyB
    * @param {number} [ratio=1] - the ratio of movement between the two sides of the pulley
    * @param {number} [lengthA=100] - the length of pulley between bodyA and the ground anchor A
    * @param {number} [lengthB=100] - the length of pulley between bodyB and the ground anchor B
    * @return {box2d.b2PulleyJoint} The created joint.
    */
    pulleyJoint: function (bodyA, bodyB, ax, ay, bx, by, gax, gay, gbx, gby, ratio, lengthA, lengthB) {
        
        if ( typeof ax === 'undefined' ) { ax = 0; }
        if ( typeof ay === 'undefined' ) { ay = 0; }
        if ( typeof bx === 'undefined' ) { bx = 0; }
        if ( typeof by === 'undefined' ) { by = 0; }
        if ( typeof gax === 'undefined' ) { gax = 0; }
        if ( typeof gay === 'undefined' ) { gay = 0; }
        if ( typeof gbx === 'undefined' ) { gbx = 0; }
        if ( typeof gby === 'undefined' ) { gby = 0; }
        if ( typeof ratio === 'undefined' ) { ratio = 1; }
        if ( typeof lengthA === 'undefined' ) { lengthA = 100; }
        if ( typeof lengthB === 'undefined' ) { lengthB = 100; }
        
        ax = this.pxm(-ax);
        ay = this.pxm(-ay);
        bx = this.pxm(-bx);
        by = this.pxm(-by);
        gax = this.pxm(-gax);
        gay = this.pxm(-gay);
        gbx = this.pxm(-gbx);
        gby = this.pxm(-gby);
        lengthA = this.pxm(lengthA);
        lengthB = this.pxm(lengthB);
                
        // Could be a sprite
        if (bodyA['body'])
        {
            bodyA = bodyA['body'];
        }

        if (bodyB['body'])
        {
            bodyB = bodyB['body'];
        }
        
        var jd = new box2d.b2PulleyJointDef();

        jd.bodyA = bodyA.data;
        jd.bodyB = bodyB.data;

        jd.localAnchorA.SetXY( ax, ay );
        jd.localAnchorB.SetXY( bx, by );
        jd.groundAnchorA.SetXY( gax, gay );
        jd.groundAnchorB.SetXY( gbx, gby );
        
        jd.lengthA = lengthA;
        jd.lengthB = lengthB;
        jd.ratio = ratio;
        
        return this.world.CreateJoint(jd);

    },
    
    /**
    * Creates a gear joint.
    *
    * @method Phaser.Physics.Box2D#gearJoint
    * @param {box2d.b2Joint} joint1 - first joint to be gear-joined
    * @param {box2d.b2Joint} joint2 - second joint to be gear-joined
    * @param {number} [ratio=1] - ratio for gearing
    * @return {box2d.b2PulleyJoint} The created joint.
    */
    gearJoint: function (joint1, joint2, ratio) {
        
        if ( typeof ratio === 'undefined' ) { ratio = 1; }
        
        var jd = new box2d.b2GearJointDef();
        jd.joint1 = joint1;
        jd.joint2 = joint2;
        jd.ratio = -ratio;

        jd.bodyA = joint1.GetBodyA();
        jd.bodyB = joint2.GetBodyB();
        
        return this.world.CreateJoint(jd);

    },

    /**
    * Clears all physics bodies from the given TilemapLayer that were created with `World.convertTilemap`.
    *
    * @method Phaser.Physics.Box2D#clearTilemapLayerBodies
    * @param {Phaser.Tilemap} map - The Tilemap to get the map data from.
    * @param {number|string|Phaser.TilemapLayer} [layer] - The layer to operate on. If not given will default to map.currentLayer.
    */
    clearTilemapLayerBodies: function (map, layer) {

        layer = map.getLayer(layer);

        var i = map.layers[layer].bodies.length;

        while (i--)
        {
            map.layers[layer].bodies[i].destroy();
        }

        map.layers[layer].bodies.length = 0;

    },

    /**
    * Goes through all tiles in the given Tilemap and TilemapLayer and converts those set to collide into physics bodies.
    * Only call this *after* you have specified all of the tiles you wish to collide with calls like Tilemap.setCollisionBetween, etc.
    * Every time you call this method it will destroy any previously created bodies and remove them from the world.
    * Therefore understand it's a very expensive operation and not to be done in a core game update loop.
    *
    * @method Phaser.Physics.Box2D#convertTilemap
    * @param {Phaser.Tilemap} map - The Tilemap to get the map data from.
    * @param {number|string|Phaser.TilemapLayer} [layer] - The layer to operate on. If not given will default to map.currentLayer.
    * @param {boolean} [addToWorld=true] - If true it will automatically add each body to the world, otherwise it's up to you to do so.
    * @param {boolean} [optimize=true] - If true adjacent colliding tiles will be combined into a single body to save processing. However it means you cannot perform specific Tile to Body collision responses.
    * @return {array} An array of the Phaser.Physics.Box2D.Body objects that were created.
    */
    convertTilemap: function (map, layer, addToWorld, optimize) {

        layer = map.getLayer(layer);

        if (typeof addToWorld === 'undefined') { addToWorld = true; }
        if (typeof optimize === 'undefined') { optimize = true; }

        //  If the bodies array is already populated we need to nuke it
        this.clearTilemapLayerBodies(map, layer);

        var width = 0;
        var sx = 0;
        var sy = 0;

        for (var y = 0, h = map.layers[layer].height; y < h; y++)
        {
            width = 0;

            for (var x = 0, w = map.layers[layer].width; x < w; x++)
            {
                var tile = map.layers[layer].data[y][x];

                if (tile && tile.index > -1 && tile.collides)
                {
                    if (optimize)
                    {
                        var right = map.getTileRight(layer, x, y);

                        if (width === 0)
                        {
                            sx = tile.x * tile.width;
                            sy = tile.y * tile.height;
                            width = tile.width;
                        }

                        if (right && right.collides)
                        {
                            width += tile.width;
                        }
                        else
                        {
                            var body = new Phaser.Physics.Box2D.Body(this.game, null, sx, sy, 0);

                            body.addRectangle(width, tile.height, width / 2, tile.height / 2, 0);

                            if (addToWorld)
                            {
                                this.addBody(body);
                            }

                            map.layers[layer].bodies.push(body);

                            width = 0;
                        }
                    }
                    else
                    {
                        var body = this.createBody(tile.x * tile.width, tile.y * tile.height, 0, false);

                        body.addRectangle(tile.width, tile.height, tile.width / 2, tile.height / 2, 0);

                        if (addToWorld)
                        {
                            this.addBody(body);
                        }

                        map.layers[layer].bodies.push(body);
                    }
                }
            }
        }

        return map.layers[layer].bodies;

    },
    
    /**
    * Casts a ray and finds intersecting fixtures in the world.
    *
    * @method Phaser.Physics.Box2D#raycast
    * @param {number} x1 - x location of start point (pixels)
    * @param {number} y1 - y location of start point (pixels)
    * @param {number} x2 - x location of end point (pixels)
    * @param {number} y2 - y location of end point (pixels)
    * @param {boolean} [closestHitOnly=true] - set to true if you want only the closest hit
    * @param {function} [filterFunction=null] - a function to be called for each hit, to decide which should be ignored
    * @return {Array} array of hits, as objects with body, fixture, point and normal properties. Eg. [ {body,fixture,point:{x,y},normal:{x,y}}, {body,fixture,point:{x,y},normal:{x,y}} ]
    */
    raycast: function (x1, y1, x2, y2, closestHitOnly, filterFunction) {
        
        if ( typeof closestHitOnly === 'undefined' ) { closestHitOnly = true; }
        if ( typeof filterFunction === 'undefined' ) { filterFunction = null; }
        
        x1 = this.pxm(-x1);
        y1 = this.pxm(-y1);
        x2 = this.pxm(-x2);
        y2 = this.pxm(-y2);

        var point1 = new box2d.b2Vec2(x1, y1);
        var point2 = new box2d.b2Vec2(x2, y2);
        
        var output = [];
                
        var callback = new Phaser.Physics.Box2D.RayCastCallback(this, closestHitOnly, filterFunction);
        this.world.RayCast(callback, point1, point2);
        
        // Need to convert coordinates of hit points to pixels before returning
        for (var i = 0; i < callback.hits.length; i++ )
        {
            var hit = callback.hits[i];
            hit.point = { x: this.mpx(-hit.point.x), y: this.mpx(-hit.point.y) };
            hit.normal = { x: -hit.normal.x, y: -hit.normal.y };
            output.push(hit);
        }
        
        return output;

    },
    
    /**
    * Finds all fixtures with AABBs overlapping the given area. This does NOT mean
    * that the fixtures themselves are actually overlapping the given area.
    *
    * @method Phaser.Physics.Box2D#queryAABB
    * @param {number} x - x location of AABB corner (pixels)
    * @param {number} y - y location of AABB corner (pixels)
    * @param {number} width - AABB width (pixels)
    * @param {number} height - AABB width (pixels)
    * @return {Array} array of hits, as objects with body and fixture properties. Eg. [ {body,fixture}, {body,fixture} ]
    */
    queryAABB: function (x, y, width, height) {
                
        x = this.pxm(-x);
        y = this.pxm(-y);
        width = this.pxm(width);
        height = this.pxm(height);
        
        var aabb = new box2d.b2AABB();
        aabb.lowerBound.SetXY( x - width, y - height );
        aabb.upperBound.SetXY( x, y );
        
        var callback = new Phaser.Physics.Box2D.QueryCallback(this);
        this.world.QueryAABB(callback, aabb);
        
        return callback.hits;

    },
    
    /**
    * Finds all fixtures that overlap the given fixture.
    *
    * @method Phaser.Physics.Box2D#queryFixture
    * @param {box2d.b2Fixture} fixture - the fixture to test overlapping for
    * @return {Array} array of hits, as objects with body and fixture properties. Eg. [ {body,fixture}, {body,fixture} ]
    */
    queryFixture: function (fixture) {
                
        var callback = new Phaser.Physics.Box2D.QueryCallback(this);
        this.world.QueryShape(callback, fixture.GetShape(), fixture.GetBody().GetTransform());
        
        return callback.hits;

    },

    /**
     * If the PTM ratio is changed after creating the world, the debug draw scale needs to be updated.
     *
     * @method Phaser.Physics.Box2D#setPTMRatio
     * @param {number} newRatio - The new ratio to be used for the DebugDraw.
     */
    setPTMRatio: function (newRatio) {
        
        this.ptmRatio = newRatio;
        this.debugDraw = new Phaser.Physics.Box2D.DefaultDebugDraw(this.ptmRatio);
        this.world.SetDebugDraw(this.debugDraw);
        
    }

};

/**
 * Raycast callback, can return either all hits or just the closest, and use a function to filter hits.
 * Intended for internal use by the 'raycast' function
 * @constructor
 * @extends {box2d.b2RayCastCallback}
 * @param {Phaser.Physics.Box2D} world
 * @param {boolean} closestHitOnly
 * @param {function} filterFunction
 */
Phaser.Physics.Box2D.RayCastCallback = function(world, closestHitOnly, filterFunction)
{
    this.world = world;
    this.closestHitOnly = closestHitOnly;
    this.filterFunction = filterFunction;    
    this.hits = [];
};

goog.inherits(Phaser.Physics.Box2D.RayCastCallback, box2d.b2RayCastCallback);

/**
 * Internally used callback function for raycasting. Checks each reported fixture as it is discovered,
 * to see which should be ignored and which should be used.
 * 
 * @param {box2d.b2Fixture} fixture 
 * @param {box2d.b2Vec2} point 
 * @param {box2d.b2Vec2} normal 
 * @param {number} fraction 
 * @return {number} 
 */
Phaser.Physics.Box2D.RayCastCallback.prototype.ReportFixture = function (fixture, point, normal, fraction)
{
    // If a filter function was given, use that to decide if this hit should be ignored
    if (this.filterFunction !== null )
    {
        var pxPoint = { x: this.world.mpx(-point.x), y: this.world.mpx(-point.y) };
        var pxNormal = { x: -normal.x, y: -normal.y };
        var body = fixture.GetBody().parent;

        if (!this.filterFunction.call(this, body, fixture, pxPoint, pxNormal))
        {
            return -1;
        }
    }
    
    // If we are looking for the closest hit, we will have returned 'fraction' from any previously
    // reported hits to clip the ray length, so we know this hit is closer than what we already had.
    if (this.closestHitOnly)
    {
        this.hits = [];
    }
    
    var hit = {};
    hit.body = fixture.GetBody().parent;
    hit.fixture = fixture;
    hit.point = { x: point.x, y: point.y };
    hit.normal = { x: normal.x, y: normal.y };
    this.hits.push(hit);
    
    if (this.closestHitOnly)
    {
        return fraction;
    }
    else
    {
        return 1;
    }

};

/**
 * Query callback, can use a function to filter hits.
 * Intended for internal use by the 'queryAABB' function
 * @constructor
 * @param {Phaser.Physics.Box2D} world
 * @extends {box2d.b2QueryCallback}
 */
Phaser.Physics.Box2D.QueryCallback = function(world)
{
    this.world = world;  
    this.hits = [];
};

goog.inherits(Phaser.Physics.Box2D.QueryCallback, box2d.b2QueryCallback);

/**
 * Internally used callback function for raycasting. Checks each reported fixture as it is discovered,
 * to see which should be ignored and which should be used.
 * 
 * @param {box2d.b2Fixture} fixture
 * @return {number} 
 */
Phaser.Physics.Box2D.QueryCallback.prototype.ReportFixture = function (fixture)
{    
    var hit = {};
    hit.body = fixture.GetBody().parent;
    hit.fixture = fixture;
    this.hits.push(hit);
    
    return true;
};

/**
* Renders the fixtures of the given body.
*
* @method Phaser.Physics.Box2D#renderBody
* @param {object} context - The context to render to.
* @param {Phaser.Physics.Box2D.Body} body - The Body to render.
* @param {string} [color='rgb(255,255,255)'] - color of the debug shape to be rendered. (format is css color string).
* @param {boolean} [filled=true] - Render the shape as a filled (default, true) or a stroked (false)
*/
Phaser.Physics.Box2D.renderBody = function(context, body, color, filled) {

    color = color || 'rgb(255,255,255)';

    if (typeof filled === 'undefined')
    {
        filled = true;
    }
    
    var b = body.data;
    var xf = b.GetTransform();
    var world = body.world;
    
    xf.p.x += -body.game.camera.x / world.ptmRatio;
    xf.p.y -= -body.game.camera.y / world.ptmRatio;
    
    world.debugDraw.start(context);
    
    world.debugDraw.PushTransform(xf);
    
    var rgbcolor = Phaser.Color.webToColor(color);
        
    var b2color = world.debugDraw.color;
    b2color.r = rgbcolor.r / 255;
    b2color.g = rgbcolor.g / 255;
    b2color.b = rgbcolor.b / 255;

    for (var f = b.GetFixtureList(); f; f = f.GetNext())
    {
        world.world.DrawShape(f, b2color);
    }

    world.debugDraw.PopTransform();
    
    world.debugDraw.stop();

};
