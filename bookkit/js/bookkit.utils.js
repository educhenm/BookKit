/*
 * BookKit JavaScript ePub3 Reader Utilities
 *
 * Copyright 2012-2014 Will Barton.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 
 *   1. Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *   2. Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *   3. The name of the author may not be used to endorse or promote products
 *      derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES,
 * INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL
 * THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */ 

// BookKit.Utils
// =============
// Utility and convenience functions for BookKit. 

BookKit.Utils.columnNumberForPosition = function(left) {
    var columnWidth = $(window).innerWidth();
    var columnNumber = parseInt(left / columnWidth);
    return columnNumber;
};

// Return the current column number in view
BookKit.Utils.currentColumnNumber = function(columnElm) {
    var leftPosition = $('body').scrollLeft();
    var columnNumber = BookKit.Utils.columnNumberForPosition(leftPosition);
    return Math.ceil(columnNumber);
};

// Returns a Javascript range for the top of the current column
BookKit.Utils.rangeForCurrentColumn = function() {
    var columnNumber = BookKit.Utils.currentColumnNumber();
    var range = document.caretRangeFromPoint(columnNumber, 0);
    return range;
};

// Take a given selection range that may span DOM elements and return 
// an array of equivelent ranges that do not.
// http://stackoverflow.com/a/12823606
BookKit.Utils.getSafeRanges = function(dangerous) {
    var a = dangerous.commonAncestorContainer;

    // Starts -- Work inward from the start, selecting the largest safe range
    var s = new Array(0), rs = new Array(0);
    if (dangerous.startContainer != a)
        for(var i = dangerous.startContainer; i != a; i = i.parentNode)
            s.push(i);

    if (0 < s.length) for(var i = 0; i < s.length; i++) {
        var xs = document.createRange();
        if (i) {
            xs.setStartAfter(s[i-1]);
            xs.setEndAfter(s[i].lastChild);
        }
        else {
            xs.setStart(s[i], dangerous.startOffset);
            xs.setEndAfter(
                           (s[i].nodeType == Node.TEXT_NODE)
                           ? s[i] : s[i].lastChild
                           );
        }
        rs.push(xs);
    }
    
    // Ends -- basically the same code reversed
    var e = new Array(0), re = new Array(0);
    if (dangerous.endContainer != a)
        for(var i = dangerous.endContainer; i != a; i = i.parentNode)
            e.push(i);

    if (0 < e.length) for(var i = 0; i < e.length; i++) {
        var xe = document.createRange();
        if (i) {
            xe.setStartBefore(e[i].firstChild);
            xe.setEndBefore(e[i-1]);
        }
        else {
            xe.setStartBefore(
                              (e[i].nodeType == Node.TEXT_NODE)
                              ? e[i] : e[i].firstChild
                              );
            xe.setEnd(e[i], dangerous.endOffset);
        }
        re.unshift(xe);
    }
    
    // Middle -- the uncaptured middle
    if ((0 < s.length) && (0 < e.length)) {
        // create a new range for every individual non-empty node within the middle range, so 
        var s_node = s[s.length - 1];
        var e_node = e[e.length - 1];

        var s_index = _.indexOf(a.childNodes, s_node);
        var e_index = _.indexOf(a.childNodes, e_node);
        var siblings = _.toArray(a.childNodes).splice(s_index + 1, e_index - s_index - 1);

        // Remove any blank text nodes
        siblings = _.filter(siblings, function(n) { 
            return ((n.nodeType != Node.TEXT_NODE) || n.nodeValue.trim()); });

        var rm = [];
        _.each(siblings, function(m, index, siblings) {
            // Create a range that encompasses this node.
            var xm = document.createRange();
            xm.selectNodeContents(m);
            rm.push(xm);
        });
    }
    else {
        return [dangerous];
    }
    
    // Concat
    rs.push(rm);
    rs = _.flatten(rs);
    response = rs.concat(re);    
    
    // Send to Console
    return response;
};

// Make a given string "safe" as a CSS identifier or class name.
BookKit.Utils.makeSafeForCSS = function(name) {
    return name.replace(/[^a-z0-9]/g, function(s) {
        var c = s.charCodeAt(0);
        if (c == 32) return '-';
        if (c >= 65 && c <= 90) return '_' + s.toLowerCase();
        return '__' + ('000' + c.toString(16)).slice(-4);
    });
}


/////////////////////////////////////////////////////////////////////// 
// BookKit.BaseClass
// -----------------
// Lightweight internal model class for BookKit that handles default
// attributes/setting/getting.
// Meant to be roughly compatible with Backbone.Model in terms of
// initialization and attributes.
var BaseClass = BookKit.BaseClass = function(attributes) {
    var attrs = attributes || {};
    // attrs = _.defaults({}, attrs, _.result(this, 'defaults'));
    var allowed = {};
    _.map(attrs, function(val, key){ if(!_.isUndefined(this[key])) { allowed[key] = val; } }, this.defaults);
    this.attributes = _.extend({}, this.defaults, allowed);  
  
    this.initialize.apply(this, arguments);
};
_.extend(BaseClass.prototype, {
    defaults: {},

    initialize: function() {
    },

    set: function(attr, value) {
        if (_.isString(attr) && !_.isUndefined(this.defaults[attr])) { 
            this.attributes[attr] = value;
        } else {
            _.each(attr, function(value, attr) {
                if (!_.isUndefined(this.defaults[key])) {
                    this.attributes[attr] = value;
                }
            }, this);
        }
    },
 
    // Get the value of an attribute
    get: function(attr) {
        return (this.attributes[attr]);
    }

});

