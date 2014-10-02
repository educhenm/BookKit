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

BookKit = {
    Config: {},
    Events: {},
    Utils: {},
    Models: {}
};


BookKit.Constants = {
    BKAnnotationNone: false,

    // Annotation styles. Not all of these apply to all annotation
    // types. 
    BKAnnotationStyleNone: 0,         // Annotation is not displayed
    BKAnnotationStyleIcon: 1,         // Icon is displayed 
    BKAnnotationStyleHighlight: 2,    // Highlight is highlighted
    BKAnnotationStyleUnderline: 3,    // Highlight is underlined
    BKAnnotationStyleInline: 4,       // Note is inserted into the text

    BKAnnotationColorNone: 0,
    BKAnnotationColorYellow: 1,
    BKAnnotationColorPink: 2,
    BKAnnotationColorRed: 3,
    BKAnnotationColorPurple: 4,
    BKAnnotationColorBlue: 5,
    BKAnnotationColorGreen: 6,
    BKAnnotationColorBlack: 7,
};

BookKit.Config = {
    // For CFI purposes, this particular XHTML file needs a document
    // identifier.
    Document: {
        cfi: "",
    },

    // Have our CGI generation ignore all elements with the given
    // selectors.
    CFI: {
        ignore: '.-BookKit-Annotation',
    },

    // Annotation properties
    Annotations: {
        totalMargin: 200,
        padding: 100,
        underlineThickness: 2,
        noteWidth: 200,
        noteHeight: 100,
        noteFont: "Noteworthy",
        noteFontSize: 14,
        notePadding: 25,
    },

    // Colors used for annotations
    Colors: {
        Highlight: [
            'transparent', // BKAnnotationColorNone
            '#ffff6d', // BKAnnotationColorYellow Banana
            '#ff80d5', // BKAnnotationColorPink Carnation
            '#ff9380', // BKAnnotationColorRed Marachino
            '#b063ff', // BKAnnotationColorPurple Grape
            '#80caff', // BKAnnotationColorBlue Aqua
            '#b4ff6d', // BKAnnotationColorGreen Lime
            'transparent' // BKAnnotationColorBlack
        ],
        Underline: [
            'transparent', // BKAnnotationColorNone
            'transparent', // BKAnnotationColorYellow
            'transparent', // BKAnnotationColorPink
            '#fb0011', // BKAnnotationColorRed
            '#8000ff', // BKAnnotationColorPurple
            '#0080ff', // BKAnnotationColorBlue
            '#44b705', // BKAnnotationColorGreen
            '#000000'  // BKAnnotationColorBlack
        ],
        Note: [
            'transparent', // BKAnnotationColorNone
            'transparent', // BKAnnotationColorYellow
            'transparent', // BKAnnotationColorPink
            '#fb0011', // BKAnnotationColorRed
            '#8000ff', // BKAnnotationColorPurple
            '#0080ff', // BKAnnotationColorBlue
            '#44b705', // BKAnnotationColorGreen
            '#000000' // BKAnnotationColorBlack
        ]
    },

    Presentation: {
        // Number of columns in the viewport
        columns: 2,

        // Number of columns to scroll when moving to next "page"
        columnsToScroll: 2,

        // Horizontal padding within the viewport and between columns
        horizontalPadding: 100,

        // Vertical padding within the viewport
        verticalPadding: 100,

        // The element that will have columns and presentation attached
        presentationElement: 'body',

        // The viewport element
        viewportElement: window,

        // Duration for presentation animations
        animationDuration: 100,
    },

};

// A list of annotation objects associated with this particular XHTML document
BookKit.Annotations = [];

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

