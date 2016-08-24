/**
* @author       Chris Campbell <iforce2d@gmail.com>
* @author       Richard Davey <rich@photonstorm.com>
* @copyright    2015 Photon Storm Ltd.
* @license      {@link http://choosealicense.com/licenses/no-license/|No License}
*/

/**
* A generic polygon class. Includes functions for decomposing into convex polygons.
* Use one of the 'set' functions to define the vertices.
*
* @class Phaser.Physics.Box2D.Polygon
*/
Phaser.Physics.Box2D.Polygon = function () {
    this.vertices = [];
};

/**
 * Sets the vertices of this polygon from a flat array of xy coords, eg [x, y, x, y, x, y, ...]
 * @param {Array} flatXYCoords - a flat array of xy coordinates
 */
Phaser.Physics.Box2D.Polygon.prototype.setFromFlatXYCoords = function(flatXYCoords) {

    this.vertices = [];

    for (var i = 0; i < flatXYCoords.length / 2; i++) {
        this.vertices.push( { x: flatXYCoords[2*i], y: flatXYCoords[2*i+1] } );
    }

};

/**
 * Sets the vertices of this polygon from an array of xy objects, eg [ {x, y}, {x, y}, {x, y}, ...]
 * @param {Array} xyObjects - 
 */
Phaser.Physics.Box2D.Polygon.prototype.setFromXYObjects = function(xyObjects) {
    this.vertices = xyObjects.concat();
};

/**
 * Appends a vertex to this polygon
 * @param {object} vertex - an object containing x and y number properties
 */
Phaser.Physics.Box2D.Polygon.prototype.addVertex = function(vertex) {
    this.vertices.push(vertex);
};

/**
 * Returns the vertex at the given position
 */
Phaser.Physics.Box2D.Polygon.prototype.at = function(i) {

    var s = this.vertices.length;
    return this.vertices[i < 0 ? i % s + s : i % s];

};

/**
 * Checks if two indices are adjacent or the same on this polygon
 * For example, on a polygon with 5 vertices, indices 4 and 0 are adjacent.
 * @param {number} a - first index
 * @param {number} b - second index
 * @return {boolean} true if the two indices are adjacent or equal
 */
Phaser.Physics.Box2D.Polygon.prototype.indicesAreAdjacent = function (a, b) {

    a = a % this.vertices.length;
    b = b % this.vertices.length;
    
    if ( a == b ) { return true; }
    var diff = Math.abs(a-b);
    if ( diff < 2 ) { return true; }
    if ( diff == this.vertices.length-1 ) { return true; }
    
    return false;
};

/**
 * Returns the area of the triangle formed by three vertices of this polygon.
 * Result will be negative for clockwise windings.
 * @param {number} a - index of first vertex
 * @param {number} b - index of second vertex
 * @param {number} c - index of third vertex
 * @return {number} The area of the triangle formed by the three vertices
 */
Phaser.Physics.Box2D.Polygon.prototype.areaInTriangle = function (a, b, c) {

    a = this.at(a);
    b = this.at(b);
    c = this.at(c);

    return (((b.x - a.x)*(c.y - a.y))-((c.x - a.x)*(b.y - a.y))) * 0.5;

};

/**
 * Checks if the polygon outline turns left at the given vertex, when moving around
 * the outline in counter-clockwise order. Polygon must be made CCW first!
 * @return {boolean} True if outline turns left at the given vertex
 */
Phaser.Physics.Box2D.Polygon.prototype.left = function(a, b, c) {    

    return this.areaInTriangle(a, b, c) > 0;

};

/**
 * Checks if the polygon outline turns left or stays straight at the given vertex, when moving around
 * the outline in counter-clockwise order. Polygon must be made CCW first!
 * @return {boolean} True if outline turns left at the given vertex or stays straight
 */
Phaser.Physics.Box2D.Polygon.prototype.leftOn = function(a, b, c) {

    return this.areaInTriangle(a, b, c) >= 0;

};

/**
 * Checks if the polygon outline turns right at the given vertex, when moving around
 * the outline in counter-clockwise order. Polygon must be made CCW first!
 * @return {boolean} True if outline turns right at the given vertex
 */
Phaser.Physics.Box2D.Polygon.prototype.right = function(a, b, c) {

    return this.areaInTriangle(a, b, c) < 0;

};

/**
 * Checks if the polygon outline turns right or stays straight at the given vertex, when moving around
 * the outline in counter-clockwise order. Polygon must be made CCW first!
 * @return {boolean} True if outline turns right at the given vertex or stays straight
 */
Phaser.Physics.Box2D.Polygon.prototype.rightOn = function(a, b, c) {

    return this.areaInTriangle(a, b, c) <= 0;

};

/**
 * Finds the squared distance between two points
 * @param {object} a - an object with x and y number properties
 * @param {object} b - an object with x and y number properties
 * @return {number} The square of the distance between the two points
 */
Phaser.Physics.Box2D.Polygon.sqdist = function(a, b) {

    var dx = b.x - a.x;
    var dy = b.y - a.y;

    return dx * dx + dy * dy;

};

/**
 * Ensures this polygon is wound counter-clockwise.
 * @return {boolean} true if the polygon winding was reversed
 */
Phaser.Physics.Box2D.Polygon.prototype.makeCCW = function() {
    
    // Find bottom right point
    var br = 0;

    for (var i = 1, len = this.vertices.length; i < len; i++)
    {
        if (this.at(i).y < this.at(br).y || (this.at(i).y === this.at(br).y && this.at(i).x > this.at(br).x))
        {
            br = i;
        }
    }

    // Reverse poly if clockwise
    if (!this.left(br - 1, br, br + 1))
    {
        this.vertices.reverse();
        return true;
    }
    
    return false;

};

/**
 * Checks if this polygon is convex.
 * @return {boolean} True if the polygon is convex.
 */
Phaser.Physics.Box2D.Polygon.prototype.isConvex = function () {
    
    var havePositive = false;
    var haveNegative = false;
    
    for (var i = 0, len = this.vertices.length; i < len; i++)
    {
        var i0 = i;
        var i1 = (i + 1) % len;
        var i2 = (i + 2) % len;

        if (this.areaInTriangle(this.vertices[i0], this.vertices[i1], this.vertices[i2]) > 0)
        {
            havePositive = true;
        }
        else
        {
            haveNegative = true;
        }
    }

    return haveNegative ^ havePositive;

};

/**
 * Checks if the given vertex is reflex (concave causing). Polygon must be made CCW first!
 * @param {object} i - the index of the vertex to check
 * @return {number} true if the given vertex is a reflex vertex
 */
Phaser.Physics.Box2D.Polygon.prototype.isReflex = function (i) {

    return this.right(i - 1, i, i + 1);

};

/**
 * Check if two vectors are equal.
 * @param {object} v0 - an object with x and y properties
 * @param {object} v1 - an object with x and y properties
 * @return {boolean} true if the two vector are the same
 */
Phaser.Physics.Box2D.Polygon.areVecsEqual = function(v0, v1) {

    return v0.x == v1.x && v0.y == v1.y;

};

/**
 * Check if two lines intersect each other.
 * @param {object} v0 - an object with x and y properties (first point of first line)
 * @param {object} v1 - an object with x and y properties (second point of first line)
 * @param {object} t0 - an object with x and y properties (first point of second line)
 * @param {object} t1 - an object with x and y properties (second point of second line)
 * @return {number} The intersection point, or null if the lines do not cross
 */
Phaser.Physics.Box2D.Polygon.linesCross = function(v0, v1, t0, t1) {

    if (Phaser.Physics.Box2D.Polygon.areVecsEqual(v1,t0) || Phaser.Physics.Box2D.Polygon.areVecsEqual(v0,t0) || Phaser.Physics.Box2D.Polygon.areVecsEqual(v1,t1) || Phaser.Physics.Box2D.Polygon.areVecsEqual(v0,t1))
    {
        return null;
    }

    var vnormal = {};

    box2d.b2SubVV(v1, v0, vnormal);
    box2d.b2CrossVS(vnormal, 1, vnormal);

    var v0d = box2d.b2DotVV(vnormal, v0);
    var t0d = box2d.b2DotVV(vnormal, t0);
    var t1d = box2d.b2DotVV(vnormal, t1);

    if ( t0d > v0d && t1d > v0d )
    {
        return null;
    }

    if ( t0d < v0d && t1d < v0d )
    {
        return null;
    }

    var tnormal = {};
    box2d.b2SubVV(t1, t0, tnormal);
    box2d.b2CrossVS(tnormal, 1, tnormal);

    var t0d = box2d.b2DotVV(tnormal, t0);
    var v0d = box2d.b2DotVV(tnormal, v0);
    var v1d = box2d.b2DotVV(tnormal, v1);

    if ( v0d > t0d && v1d > t0d )
    {
        return null;
    }

    if ( v0d < t0d && v1d < t0d )
    {
        return null;
    }

    var f = (t0d - v0d) / (v1d - v0d);

    var intersectionPoint = { x: v0.x + f * (v1.x-v0.x), y: v0.y + f * (v1.y-v0.y) };

    return intersectionPoint;

};

/**
 * Check if two vertices of a polygon have a clear line of sight to each other. "Line of sight" means
 * that the line between them is not intersected by any other edges of the polygon.
 * @param {Array} vertices - array of vertices representing the polygon
 * @param {number} a - index of first vertex
 * @param {number} b - index of second vertex
 * @return {boolean} true if the two vertices are not adjacent and can 'see' each other.
 */
Phaser.Physics.Box2D.Polygon.prototype.canSee = function (a, b) {

    if (this.indicesAreAdjacent(a, b) )
    {
        return false;
    }
        
    if (this.leftOn(a + 1, a, b) && this.rightOn(a - 1, a, b))
    {
        return false;
    }
    
    for (var i = 0; i < this.vertices.length; ++i)
    {
        // for each edge
        if ((i + 1) % this.vertices.length == a || i == a)
        {
            // ignore incident edges
            continue;
        } 

        if (this.leftOn(a, b, i + 1) && this.rightOn(a, b, i))
        { 
            // if diag intersects an edge
            if (Phaser.Physics.Box2D.Polygon.linesCross(this.at(a), this.at(b), this.at(i), this.at(i + 1)))
            {
                return false;
            }
        }
    }

    return true;
    
};

/** Copies a subset of the vertices of this polygon to make a new one. Start and end points will be included.
 * @param {number} i - index of the first vertex
 * @param {number} j - index of the second vertex
 * @return {Array} array representing a sub-polygon
 */
Phaser.Physics.Box2D.Polygon.prototype.subPolygon = function (i, j) {

    var p = new Phaser.Physics.Box2D.Polygon();

    if (i < j)
    {
        //p.v.insert(p.v.begin(), v.begin() + i, v.begin() + j + 1);
        for (var n = i; n < j + 1; n++)
        {
            p.addVertex( this.at(n) );
        }
    }
    else
    {
        //p.v.insert(p.v.begin(), v.begin() + i, v.end());
        //p.v.insert(p.v.end(), v.begin(), v.begin() + j + 1);
        for (var n = i; n < this.vertices.length; n++)
        {
            p.addVertex( this.at(n) );
        }

        for (var n = 0; n < j + 1; n++)
        {
            p.addVertex( this.at(n) );
        }
    }
    
    return p;

};

/**
 * Returns an array of the individual convex polygons which make up the given concave polygon.
 * This will return a near-optimal (lowest number of sub-polygons) decomposition and is
 * astoundingly slow for polygons with more than about 8 vertices. You most likely will
 * not want to use this at runtime, but it could be useful as a pre-process for something.
 * Please try the normal 'decompose' function instead.
 * @return {Array} Array of objects containing pairs of indices which should be joined
 */
Phaser.Physics.Box2D.Polygon.prototype.decomposeOptimal = function (level) {

    if (typeof level === 'undefined') { level = 0; }
    
    if (level > 1)
    {
        return this.vertices;
    }
        
    this.makeCCW();
      
    var min = [];
    var tmp1 = [];
    var tmp2 = [];    
    
    var nDiags = Number.MAX_VALUE;

    for (var i = 0; i < this.vertices.length; i++)
    {
        if (this.isReflex(i))
        {
            for (var j = 0; j < this.vertices.length; j++)
            {
                if (this.canSee(i, j))
                {
                    tmp1 = this.subPolygon(i, j).decompose(level+1);
                    tmp2 = this.subPolygon(j, i).decompose(level+1);                    

                    if (tmp1.length + tmp2.length < nDiags)
                    {
                        min = tmp1.concat(tmp2);
                        nDiags = min.length;
                    }
                }
            }
        }
    }
    
    if (min.length === 0)
    {
        min.push(this.vertices);
    }
    
    return min;

};

/**
 * Returns an array of the individual convex polygons which make up the given concave polygon.
 * @return {Array} Array of arrays containing the vertex positions of sub-polygons. Vertex positions are an object like {x,y}
 */
Phaser.Physics.Box2D.Polygon.prototype.decompose = function (level) {

    if (typeof level === 'undefined') { level = 0; }
    
    this.makeCCW();
      
    var min = [];
    
    var bestDivision = Number.MAX_VALUE;
    var bestI;
    var bestJ;
    var foundReflex = false;
    
    for (var i = 0; i < this.vertices.length; i++)
    {
        if (this.isReflex(i))
        {
            foundReflex = true;
            var v0 = this.at(i);

            for (var j = 0; j < this.vertices.length; j++)
            {
                if (this.canSee(i, j))
                {
                    var v1 = this.at(j);
                    var dx = v1.x - v0.x;
                    var dy = v1.y - v0.y;
                    var distanceSquared = (dx * dx) * (dy * dy);

                    if (distanceSquared < bestDivision)
                    {
                        bestI = i;
                        bestJ = j;
                        bestDivision = distanceSquared;
                    }
                }
            }
        }
    }
    
    // Specific to Box2D, force to 8 vertices or less
    if (!foundReflex && this.vertices.length > 8 )
    {
        bestI = 0;
        bestJ = Math.floor(this.vertices.length / 2);
        foundReflex = true;
    }
    
    if (foundReflex)
    {
        var tmp1 = this.subPolygon(bestI, bestJ).decompose(level+1);
        var tmp2 = this.subPolygon(bestJ, bestI).decompose(level+1);        
        min = tmp1.concat(tmp2);
    }
    
    if (min.length === 0)
    {
        min.push(this.vertices);
    }
    
    return min;

};
