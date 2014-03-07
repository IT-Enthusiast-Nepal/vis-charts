// TODO: turn Stack into a Mixin?

/**
 * @constructor Stack
 * Stacks items on top of each other.
 * @param {Object} [options]
 */
function Stack (options) {
  this.options = options || {};
  this.defaultOptions = {
    order: function (a, b) {
      // Order: ranges over non-ranges, ranged ordered by width,
      //        and non-ranges ordered by start.
      if (a instanceof ItemRange) {
        if (b instanceof ItemRange) {
          var aInt = (a.data.end - a.data.start);
          var bInt = (b.data.end - b.data.start);
          return (aInt - bInt) || (a.data.start - b.data.start);
        }
        else {
          return -1;
        }
      }
      else {
        if (b instanceof ItemRange) {
          return 1;
        }
        else {
          return (a.data.start - b.data.start);
        }
      }
    },
    margin: {
      item: 10,
      axis: 20
    }
  };
}

/**
 * Set options for the stack
 * @param {Object} options  Available options:
 *                          {Number} [margin.item=10]
 *                          {Number} [margin.axis=20]
 *                          {function} [order]  Stacking order
 */
Stack.prototype.setOptions = function setOptions (options) {
  util.extend(this.options, options);
};

/**
 * Order an array with items using a predefined order function for items
 * @param {Item[]} items
 */
Stack.prototype.order = function order(items) {
  //order the items
  var order = this.options.order || this.defaultOptions.order;
  if (!(typeof order === 'function')) {
    throw new Error('Option order must be a function');
  }
  items.sort(order);
};

/**
 * Order items by their start data
 * @param {Item[]} items
 */
Stack.prototype.orderByStart = function orderByStart(items) {
  items.sort(function (a, b) {
    return a.data.start - b.data.start;
  });
};

/**
 * Order items by their end date. If they have no end date, their start date
 * is used.
 * @param {Item[]} items
 */
Stack.prototype.orderByEnd = function orderByEnd(items) {
  items.sort(function (a, b) {
    var aTime = ('end' in a.data) ? a.data.end : a.data.start,
        bTime = ('end' in b.data) ? b.data.end : b.data.start;

    return aTime - bTime;
  });
};

/**
 * Adjust vertical positions of the events such that they don't overlap each
 * other.
 * @param {Item[]} items           All visible items
 * @private
 */
Stack.prototype.stack = function stack (items) {
  var i,
      iMax,
      options = this.options,
      marginItem,
      marginAxis;

  if (options.margin && options.margin.item !== undefined) {
    marginItem = options.margin.item;
  }
  else {
    marginItem = this.defaultOptions.margin.item
  }
  if (options.margin && options.margin.axis !== undefined) {
    marginAxis = options.margin.axis;
  }
  else {
    marginAxis = this.defaultOptions.margin.axis
  }

  // calculate new, non-overlapping positions
  for (i = 0, iMax = items.length; i < iMax; i++) {
    var item = items[i];
    if (item.top === null) {
      // initialize top position
      item.top = marginAxis;

      do {
        // TODO: optimize checking for overlap. when there is a gap without items,
        //       you only need to check for items from the next item on, not from zero
        var collidingItem = null;
        for (var j = 0, jj = items.length; j < jj; j++) {
          var other = items[j];
          if (other.top !== null && other !== item && this.collision(item, other, marginItem)) {
            collidingItem = other;
            break;
          }
        }

        if (collidingItem != null) {
          // There is a collision. Reposition the event above the colliding element
          item.top = collidingItem.top + collidingItem.height + marginItem;
        }
      } while (collidingItem);
    }
  }
};

/**
 * Test if the two provided items collide
 * The items must have parameters left, width, top, and height.
 * @param {Component} a     The first item
 * @param {Component} b     The second item
 * @param {Number} margin   A minimum required margin.
 *                          If margin is provided, the two items will be
 *                          marked colliding when they overlap or
 *                          when the margin between the two is smaller than
 *                          the requested margin.
 * @return {boolean}        true if a and b collide, else false
 */
Stack.prototype.collision = function collision (a, b, margin) {
  return ((a.left - margin) < (b.left + b.width) &&
      (a.left + a.width + margin) > b.left &&
      (a.top - margin) < (b.top + b.height) &&
      (a.top + a.height + margin) > b.top);
};
