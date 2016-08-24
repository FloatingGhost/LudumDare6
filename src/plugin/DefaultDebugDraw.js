/**
* @author       Chris Campbell <iforce2d@gmail.com>
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/*
* Copyright (c) 2006-2007 Erin Catto http://www.box2d.org
*
* This software is provided 'as-is', without any express or implied
* warranty.  In no event will the authors be held liable for any damages
* arising from the use of this software.
* Permission is granted to anyone to use this software for any purpose,
* including commercial applications, and to alter it and redistribute it
* freely, subject to the following restrictions:
* 1. The origin of this software must not be misrepresented; you must not
* claim that you wrote the original software. If you use this software
* in a product, an acknowledgment in the product documentation would be
* appreciated but is not required.
* 2. Altered source versions must be plainly marked as such, and must not be
* misrepresented as being the original software.
* 3. This notice may not be removed or altered from any source distribution.
*/

/** 
 * This class implements debug drawing callbacks
 * @constructor
 * @param {number} pixelsPerMeter
 */
Phaser.Physics.Box2D.DefaultDebugDraw = function (pixelsPerMeter)
{
    this.context = null;
    this.pixelsPerMeter = pixelsPerMeter;
    this.flags = box2d.b2DrawFlags.e_shapeBit;
};

Phaser.Physics.Box2D.DefaultDebugDraw.prototype.color = new box2d.b2Color(1, 1, 1);

/**
 * Sets which aspects of the world to render
 *
 * @export 
 * @return {void}
 * @param {number} flags - a bitflag made from one or more of the following:
 *     box2d.b2DrawFlags = { e_none, e_shapeBit, e_jointBit, e_aabbBit, e_pairBit, e_centerOfMassBit, e_all }
 */
Phaser.Physics.Box2D.DefaultDebugDraw.prototype.SetFlags = function (flags)
{
    this.flags = flags;
};

/**
 * Gets which aspects of the world are currently set to be rendered
 *
 * @export 
 * @return {number} - the flags currently set
 */
Phaser.Physics.Box2D.DefaultDebugDraw.prototype.GetFlags = function ()
{
    return this.flags;
};

/**
 * Sets the canvas context to use in subsequent rendering and applies overall transform.
 *
 * @export 
 * @return {void} 
 * @param {CanvasRenderingContext2D} context
 */
Phaser.Physics.Box2D.DefaultDebugDraw.prototype.start = function (context)
{
    this.context = context;
    this.context.save();
    this.context.scale(-1, -1);
    this.context.scale(this.pixelsPerMeter, this.pixelsPerMeter);
};

/**
 * Resets transform state to original
 *
 * @export 
 * @return {void} 
 */
Phaser.Physics.Box2D.DefaultDebugDraw.prototype.stop = function ()
{
    this.context.restore();
};

/**
 * @export 
 * @return {void} 
 * @param {box2d.b2Transform} xf 
 */
Phaser.Physics.Box2D.DefaultDebugDraw.prototype.PushTransform = function (xf)
{
    var ctx = this.context;
    ctx.save();
    ctx.translate(xf.p.x, xf.p.y);
    ctx.rotate(xf.q.GetAngleRadians());
};

/**
 * @export 
 * @return {void} 
 * @param {box2d.b2Transform} xf 
 */
Phaser.Physics.Box2D.DefaultDebugDraw.prototype.PopTransform = function ()
{
    var ctx = this.context;
    ctx.restore();
};

/**
 * @export 
 * @return {void} 
 * @param {Array.<box2d.b2Vec2>} vertices 
 * @param {number} vertexCount 
 * @param {box2d.b2Color} color 
 */
Phaser.Physics.Box2D.DefaultDebugDraw.prototype.DrawPolygon = function (vertices, vertexCount, color)
{
    if (!vertexCount)
    {
        return;
    }

    var ctx = this.context;
    
    ctx.lineWidth = 1 / this.pixelsPerMeter;

    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);

    for (var i = 1; i < vertexCount; i++)
    {
        ctx.lineTo(vertices[i].x, vertices[i].y);
    }

    ctx.closePath();
    ctx.strokeStyle = color.MakeStyleString(1);
    ctx.stroke();
};

/**
 * @export 
 * @return {void} 
 * @param {Array.<box2d.b2Vec2>} vertices 
 * @param {number} vertexCount 
 * @param {box2d.b2Color} color 
 */
Phaser.Physics.Box2D.DefaultDebugDraw.prototype.DrawSolidPolygon = function (vertices, vertexCount, color)
{
    if (!vertexCount)
    {
        return;
    }

    var ctx = this.context;
    
    ctx.lineWidth = 1 / this.pixelsPerMeter;

    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);

    for (var i = 1; i < vertexCount; i++)
    {
        ctx.lineTo(vertices[i].x, vertices[i].y);
    }

    ctx.closePath();
    ctx.fillStyle = color.MakeStyleString(0.5);
    ctx.fill();
    ctx.strokeStyle = color.MakeStyleString(1);
    ctx.stroke();
};

/**
 * @export 
 * @return {void} 
 * @param {box2d.b2Vec2} center 
 * @param {number} radius 
 * @param {box2d.b2Color} color 
 */
Phaser.Physics.Box2D.DefaultDebugDraw.prototype.DrawCircle = function (center, radius, color)
{
    if (!radius)
    {
        return;
    }

    var ctx = this.context;

    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2, true);
    ctx.strokeStyle = color.MakeStyleString(1);
    ctx.stroke();
};

/**
 * @export 
 * @return {void} 
 * @param {box2d.b2Vec2} center 
 * @param {number} radius 
 * @param {box2d.b2Vec2} axis 
 * @param {box2d.b2Color} color 
 */
Phaser.Physics.Box2D.DefaultDebugDraw.prototype.DrawSolidCircle = function (center, radius, axis, color)
{
    if (!radius)
    {
        return;
    }

    var ctx = this.context;
    
    ctx.lineWidth = 1 / this.pixelsPerMeter;

    var cx = center.x;
    var cy = center.y;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2, true);
    ctx.moveTo(cx, cy);
    ctx.lineTo((cx + axis.x * radius), (cy + axis.y * radius));
    ctx.fillStyle = color.MakeStyleString(0.5);
    ctx.fill();
    ctx.strokeStyle = color.MakeStyleString(1);
    ctx.stroke();
};

/**
 * @export 
 * @return {void} 
 * @param {box2d.b2Vec2} p1 
 * @param {box2d.b2Vec2} p2 
 * @param {box2d.b2Color} color 
 */
Phaser.Physics.Box2D.DefaultDebugDraw.prototype.DrawSegment = function (p1, p2, color)
{
    var ctx = this.context;
    
    ctx.lineWidth = 1 / this.pixelsPerMeter;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = color.MakeStyleString(1);
    ctx.stroke();
};

/**
 * @export 
 * @return {void} 
 * @param {box2d.b2Transform} xf 
 */
Phaser.Physics.Box2D.DefaultDebugDraw.prototype.DrawTransform = function (xf)
{
    var ctx = this.context;
    
    ctx.lineWidth = 1 / this.pixelsPerMeter;

    this.PushTransform(xf);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(1, 0);
    ctx.strokeStyle = box2d.b2Color.RED.MakeStyleString(1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 1);
    ctx.strokeStyle = box2d.b2Color.GREEN.MakeStyleString(1);
    ctx.stroke();

    this.PopTransform(xf);
};

/**
 * @export 
 * @return {void} 
 * @param {box2d.b2Vec2} p 
 * @param {number} size 
 * @param {box2d.b2Color} color 
 */
Phaser.Physics.Box2D.DefaultDebugDraw.prototype.DrawPoint = function (p, size, color)
{
    var ctx = this.context;

    ctx.fillStyle = color.MakeStyleString();
    //size /= this.m_settings.viewZoom;
    //size /= this.m_settings.canvasScale;
    var hsize = size / 2;
    ctx.fillRect(p.x - hsize, p.y - hsize, size, size);
};

/**
 * @export 
 * @return {void} 
 * @param {box2d.b2AABB} aabb 
 * @param {box2d.b2Color} color 
 */
Phaser.Physics.Box2D.DefaultDebugDraw.prototype.DrawAABB = function (aabb, color)
{
    var ctx = this.context;

    ctx.strokeStyle = color.MakeStyleString();
    var x = aabb.lowerBound.x;
    var y = aabb.lowerBound.y;
    var w = aabb.upperBound.x - aabb.lowerBound.x;
    var h = aabb.upperBound.y - aabb.lowerBound.y;
    ctx.strokeRect(x, y, w, h);
};

/**
* @name Phaser.Physics.Box2D.DefaultDebugDraw#shapes
* @property {boolean} shapes - Specifies whether the debug draw should render shapes.
*/
Object.defineProperty(Phaser.Physics.Box2D.DefaultDebugDraw.prototype, "shapes", {

    get: function () {

        return this.flags & box2d.b2DrawFlags.e_shapeBit;

    },

    set: function (value) {

        if (value)
        {
            this.flags |= box2d.b2DrawFlags.e_shapeBit;
        }
        else
        {
            this.flags &= ~box2d.b2DrawFlags.e_shapeBit;
        }

    }

});

/**
* @name Phaser.Physics.Box2D.DefaultDebugDraw#joints
* @property {boolean} joints - Specifies whether the debug draw should render joints.
*/
Object.defineProperty(Phaser.Physics.Box2D.DefaultDebugDraw.prototype, "joints", {

    get: function () {

        return this.flags & box2d.b2DrawFlags.e_jointBit;

    },

    set: function (value) {

        if (value)
        {
            this.flags |= box2d.b2DrawFlags.e_jointBit;
        }
        else
        {
            this.flags &= ~box2d.b2DrawFlags.e_jointBit;
        }

    }

});

/**
* @name Phaser.Physics.Box2D.DefaultDebugDraw#aabbs
* @property {boolean} aabbs - Specifies whether the debug draw should render fixture AABBs.
*/
Object.defineProperty(Phaser.Physics.Box2D.DefaultDebugDraw.prototype, "aabbs", {

    get: function () {

        return this.flags & box2d.b2DrawFlags.e_aabbBit;

    },

    set: function (value) {

        if (value)
        {
            this.flags |= box2d.b2DrawFlags.e_aabbBit;
        }
        else
        {
            this.flags &= ~box2d.b2DrawFlags.e_aabbBit;
        }

    }

});

/**
* @name Phaser.Physics.Box2D.DefaultDebugDraw#pairs
* @property {boolean} pairs - Specifies whether the debug draw should render contact pairs.
*/
Object.defineProperty(Phaser.Physics.Box2D.DefaultDebugDraw.prototype, "pairs", {

    get: function () {

        return this.flags & box2d.b2DrawFlags.e_pairBit;

    },

    set: function (value) {

        if (value)
        {
            this.flags |= box2d.b2DrawFlags.e_pairBit;
        }
        else
        {
            this.flags &= ~box2d.b2DrawFlags.e_pairBit;
        }

    }

});

/**
* @name Phaser.Physics.Box2D.DefaultDebugDraw#centerOfMass
* @property {boolean} centerOfMass - Specifies whether the debug draw should render the center of mass of bodies.
*/
Object.defineProperty(Phaser.Physics.Box2D.DefaultDebugDraw.prototype, "centerOfMass", {

    get: function () {

        return this.flags & box2d.b2DrawFlags.e_centerOfMassBit;

    },

    set: function (value) {

        if (value)
        {
            this.flags |= box2d.b2DrawFlags.e_centerOfMassBit;
        }
        else
        {
            this.flags &= ~box2d.b2DrawFlags.e_centerOfMassBit;
        }

    }

});
