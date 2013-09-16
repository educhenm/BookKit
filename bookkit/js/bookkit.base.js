/*
 * BookKit JavaScript ePub3 Reader Utilities
 *
 * Copyright 2012-2013 Will Barton.
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
    // Events: {},
    // Helpers: {},
    Utils: {},
    Models: {}
};


BookKit.Constants = {
    // Constants
    BKAnnotationTypeBookmark: 0,
    BKAnnotationTypeHighlight: 1,
    BKAnnotationTypeNote: 2,

    BKAnnotationStyleNone: 0,
    BKAnnotationStyleIcon: 1,
    BKAnnotationStyleHighlight: 2,  
    BKAnnotationStyleUnderline: 3,
    BKAnnotationStyleMarginLeft: 4,
    BKAnnotationStyleMarginRight: 5,

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
    Document: {
        cfi: "",
    },
    Annotations: {
        totalMargin: 200,
        padding: 10,
        underlineThickness: 2,
        noteWidth: 200,
        noteHeight: 100,
        noteFont: "Noteworthy",
        noteFontSize: 14,
        notePadding: 25,
    },
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
    }
};

var _parsed_cfis = {};

var _bookkit_annotations = {};
var _bookkit_annotation_canvas = null;


/*
 * Immediate Javascript tasks for Marginalia:
 *
 *  - Annotations
 *    - Bookmarks:
 *      - Get a CFI for the currently visible page
 *      - Test if a CFI is on the currently visible page
 *      - Add a bookmark marker for a given CFI
 *      - Remove the bookmark marker for a given CFI
 *    - Highlights:
 *      - Get a CFI for the current selection range
 *      - Add a highlight to a given CFI
 *      - Remove a highlight for a given CFI
 *    - Notes:
 *      - Get a CFI for the current selection range
 *      - Get the pixel location of a CFI
 *      - Add a note marker for a given CFI
 *      - Remove a note marker for a given CFI
 *
 *  - Search Terms
 *    - Highlight search terms
 *
 */


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

// Based losely on:
// http://stackoverflow.com/questions/5419134/how-to-detect-if-two-divs-touch-with-jquery
// Takes a parameter that, if true, rotates the element's frame 90
// degrees before comparing.
BookKit.Utils.overlaps = function(a, b, rotated) {
    rotated = rotated || false;

    function getFrame(elm) {
        var x, y, height, width;
        if (rotated) {
            x = $(elm).offset().top;
            y = $(elm).offset().left;
            height = $(elm).outerWidth(true);
            width = $(elm).outerHeight(true);
        } else {
            x = $(elm).offset().left;
            y = $(elm).offset().top;
            height = $(elm).outerHeight(true);
            width = $(elm).outerWidth(true);
        }

        var bottom = y + height;
        var right = x + width;
        return { x: x, y: y, 
                 bottom: bottom, right: right, 
                 height: height, width: width }
    };

    function compareFrames(aFrame, bFrame) {
        console.log(aFrame, bFrame);
        console.log(aFrame.bottom < bFrame.y, aFrame.y > bFrame.bottom);
        console.log(aFrame.right< bFrame.x, aFrame.x > bFrame.right);

        if ((aFrame.bottom < bFrame.y) ||
            (aFrame.y > bFrame.bottom) ||
            (aFrame.right < bFrame.x) ||
            (aFrame.x > bFrame.right))
            return false;
        else {
            console.log(aFrame, bFrame);
            // By how much do they overlap and where?
            var x_over = aFrame.right > bFrame.y ? bFrame.right - aFrame.x : 0;
            var y_over = aFrame.y < bFrame.bottom ? bFrame.bottom - aFrame.y : 0;
            var bottom_over = aFrame.bottom > bFrame.y ? aFrame.bottom - bFrame.y : 0;
            var right_over = aFrame.right > bFrame.y ? aFrame.right - bFrame.x : 0;

            return {
                x: x_over,
                y: y_over,
                bottom: bottom_over,
                right: right_over
            }
        }
    };

    if ($(a).is($(b))) {
        return false;
    }
    console.log("Comparing", a, b);

    return compareFrames(getFrame(a), getFrame(b));
};


// The CFI model disconnects parsing the CFI string from resolving the
// steps in the DOM, so that BookKit could potentially be passed a list
// of steps that have already been parsed.
BookKit.CFI = Backbone.Model.extend({
    defaults: {
        // The CFI string
        cfi: "",
        steps: null,
        book: null
    },

    contentDocumentItem: undefined,

    contentDocument: undefined,

    // The UNSAFE complete range of the CFI.
    range: undefined,

    // The ranges referred to by a ranged CFI. Array to hold 
    // the multiple elements, element fragments selected, safe
    // for operating across elements.
    ranges: undefined,

    // The node referred to by a non-ranged CFI
    target: undefined,

    initialize: function() {

    },

    parseAndResolve: function() {
        this.parse();
        this.resolve();
        return this;
    },

    safeAttr: function() {
        // Convert this:
        //    epubcfi(/6/12!/4/2[episode-01]/68/1:2)
        // Into this:
        //    epubcfi_6_12_4_2episode-01_68_1_2
        // For use in id attributes on elements. It's a lossy
        // conversion, not intended for reconstituting the string.
        var epubcfi = this.get("cfi");
        return epubcfi.replace(/[\:\/\,]/g, '_').replace(/[\!\(\)\[\]]/g, '');
    },
    
    /****
     * Parsing CFIs to node indexes
     ****/

    // Parse the CFI into a list of steps.
    parse: function() {
        var cfi = this.get("cfi");

        // Check the cache.
        if (_parsed_cfis[cfi] != null)
            return _parsed_cfis[cfi].get("steps");

        if (cfi.indexOf("epubcfi(") != 0)
            return;

        cfi = cfi.substring(8, cfi.length -1);

        var rangeComponents = this.rangeComponents(cfi);
        if (rangeComponents.length == 1) {
            // This is not a ranged CFI
            var steps = this.parseSteps(cfi.split('/'));
            this.set("steps", [steps, [], []]);
        } else {
            var parentSteps = this.parseSteps(rangeComponents[0].split('/'));
            var startSteps = this.parseSteps(rangeComponents[1].split('/'));
            var endSteps = this.parseSteps(rangeComponents[2].split('/'));

            this.set("steps", [parentSteps, startSteps, endSteps]);
        }

        // Cache the result
        _parsed_cfis[cfi] = this;

        return this.get("steps");
    },

    // Break the CFI into its parent, start, end ranges, if they exist.
    rangeComponents: function(cfi) {
        var scanLocation = 0;
        var componentStartLocation = 0;
        var components = [];

        while (scanLocation < cfi.length) {
            var openingBraceLocation = cfi.indexOf('[', scanLocation);
            var closingBraceLocation = cfi.indexOf(']', scanLocation);
            var commaLocation = cfi.indexOf(',', scanLocation);

            // If there's no comma at all, there are no ranges.
            if (commaLocation == -1)
                break;

            // If we have braces, and the comma is inside of them, then 
            // it's not a range comma.
            // If the comma is beyond the last brace, advance the scan 
            // until we're past these braces and try again.
            if (((commaLocation > openingBraceLocation) && 
                 (commaLocation < closingBraceLocation)) || 
                ((commaLocation > closingBraceLocation) &&
                 (closingBraceLocation > 0))) {

                if ((closingBraceLocation + 1) < cfi.length) 
                    scanLocation = closingBraceLocation + 1;
                else
                    break;

            } else {
                // The comma is not inside of the braces, and not past 
                // the closing brace. It's a range comma.
                components.push(
                    cfi.substring(componentStartLocation, commaLocation));

                componentStartLocation = commaLocation + 1;
                scanLocation = componentStartLocation;
            }
        }

        // Add the last component
        if (componentStartLocation < cfi.length)
            components.push(
                cfi.substring(componentStartLocation, cfi.length));

        return components;
    },

    parseSteps: function(stepStrings) {
        var steps = [];

        _.each(stepStrings, function(stepString, index, stepStrings) {
            if (stepString.length == 0)
                return;

            var step = {
                step: -1,
                assertion: null,
                offset: -1,
                redirection: false,
            }

            var redirectionLocation = stepString.indexOf('!');
            if (redirectionLocation > 0)
                step.redirection = true;
            
            var assertionLocation = stepString.indexOf('[');
            if (assertionLocation > 0) {
                var assertionCloseLocation = stepString.indexOf(']');
                step.assertion = stepString.substring(assertionLocation+1, 
                    assertionCloseLocation);
            }

            var offsetLocation = stepString.indexOf(":");
            if (offsetLocation > 0)
                step.offset = parseInt(stepString.substring(offsetLocation+1));

            step.step = parseInt(stepString);
            steps.push(step);
        }, this);

        return steps;
    },

    /****
     * Resolving CFIs
     ****/

    resolve: function() {
        if (this.ranges)
            return this.ranges;

        var steps = this.get("steps");
        var parentSteps = steps[0];
        var startSteps = steps[1];
        var endSteps = steps[2];
        
        // Strip out the package spine location manually, and grab the
        // item out of the spine.
        if (parentSteps[0].step != 6) {
            // Then something is dreadfully wrong somewhere
            console.log("Malformed CFI. Spine should be sixth element of package", 
                parentSteps[0]);
        }
        parentSteps.splice(0, 1);

        // Get the root of the current document (and assume it's the
        // content document referred to before the redirection in the
        // CFI.
        this.contentDocument = document;
        var immediateParentNode = this.contentDocument.documentElement;

        // Lop off the redirection step. This should put us in the
        // content document.
        parentSteps.splice(0, 1);

        var parent = null;
        var start = null;
        var startOffset = null;
        var end = null;
        var endOffset = null

        // Find the parent node. This is common to both the start and 
        // end point of the range (or, simply the target node if there 
        // is no range).
        _.each(parentSteps, function(stepDict, index, steps) {
            node = this.resolveStep(stepDict, immediateParentNode);
            immediateParentNode = node;
        }, this);
        parent = immediateParentNode;
        this.node = parent;

        // Find the start node of the range, if startSteps is given.
        if (startSteps.length > 0) {
            immediateParentNode = parent;
            _.each(startSteps, function(stepDict, index, steps) {
                node = this.resolveStep(stepDict, immediateParentNode);
                immediateParentNode = node;
            }, this);
            if (_.last(startSteps).offset != null)
                startOffset = _.last(startSteps).offset;
            start = immediateParentNode;
        }

        // Find the end node of the range, if endSteps is given.
        if (endSteps.length > 0) {
            immediateParentNode = parent;
            _.each(endSteps, function(stepDict, index, steps) {
                node = this.resolveStep(stepDict, immediateParentNode);
                immediateParentNode = node;
            }, this);
            if (_.last(endSteps).offset != null)
                endOffset = _.last(endSteps).offset;
            end = immediateParentNode;
        }

        // XXX: handle assertions
        
        // Set the range(s) of the CFI's location. 
        var range = this.contentDocument.createRange();
        if (start != null && startOffset != null && 
                end != null && endOffset != null) {
            // If we're given a ranged CFI, get its collective,
            // cross-element ranges.
            range.setStart(start, startOffset);
            range.setEnd(end, endOffset);

            this.range = range;
            this.ranges = BookKit.Utils.getSafeRanges(range);
        } else {
            // If we're not given a ranged CFI, create a 1-char range at
            // the CFI's location. This will be used for locating
            // bookmarks and notes locations in the document.
            var offset = 0;
            if (_.last(parentSteps).offset != null)
                offset = _.last(parentSteps).offset;

            // Back up one character if we're at the end of the node.The
            // range needs a length of at least 1 from start offset to
            // end.
            if (offset >= (node.length - 1)) 
                offset = offset - 1;

            if (offset >= 0) {
              range.setStart(node, offset);
              range.setEnd(node, offset + 1);

              this.range = range;
              this.ranges = [range];
            }
        }

        return this.ranges;
    },

    resolveStep: function(stepDict, parentNode) {
        var nodeIndex = -1;
        var node = null;

        if (stepDict.step % 2 == 0) {
            var children = $(parentNode).children();
            // This is an element
            nodeIndex = stepDict.step / 2 - 1;
            if (nodeIndex <= children.length)
                node = $(children).eq(nodeIndex)[0];

        } else {
            // This is a text node.
            nodeIndex = stepDict.step - 1;
            if (nodeIndex <= parentNode.childNodes.length)
                node = parentNode.childNodes.item(nodeIndex);
        }

        return node;
    }

}, {
    // Class Methods: CFI Generation
    
    // A CFI for the top location currently on screen
    currentCFI: function() {
        var range = BookKit.Utils.rangeForCurrentColumn();
        var contentDocumentCFI = BookKit.CFI.contentCFIForRange(range);
        var cfiString = "epubcfi(" + BookKit.Config.Document.cfi + contentDocumentCFI + ")";
        return new BookKit.CFI({cfi: cfiString}).parseAndResolve();
    },

    selectionCFI: function() {
        // A CFI for the top location currently on screen
        var contentDocumentCFI = BookKit.CFI.contentCFIForRange(window.getSelection().getRangeAt(0));
        var cfiString = "epubcfi(" + BookKit.Config.Document.cfi + contentDocumentCFI + ")";
        return new BookKit.CFI({cfi: cfiString}).parseAndResolve();
    },

    // Semi-private utility methods for generating CFI strings. These DO
    // NOT return BookKit.CFI obejcts.

    contentCFIForRange: function(range) {
        var startSteps = BookKit.CFI.cfiStepsForNode(range.startContainer);
        var endSteps = BookKit.CFI.cfiStepsForNode(range.endContainer);

        var parentSteps = []
        _.every(startSteps, function(element, index, list) {
            // Don't include the final element
            if ((startSteps[index] == endSteps[index]) && 
                (index < startSteps.length - 1) && (index < endSteps.length - 1)) {
                parentSteps.push(element);
            } else {
                return false;
            }
            return true;
        });

        var parentCFI = "/" + parentSteps.join("/");
        var startCFI = "/" + startSteps.join("/") + ":" + range.startOffset;
        var endCFI = "/" + endSteps.join("/") + ":" + range.endOffset;

        startCFI = startCFI.replace(parentCFI, '');
        endCFI = endCFI.replace(parentCFI, '');

        var contentDocumentCFI = null
        if (startCFI != endCFI)
            contentDocumentCFI = parentCFI + "," + startCFI + "," + endCFI;
        else
            contentDocumentCFI = parentCFI + startCFI;

        // This does NOT include the package location for the content
        // document this cfi references.
        return contentDocumentCFI;
    },

    cfiStepsForNode: function(node) {
        var steps = [];
        while(node) { 
            // Filter out all non element or text nodes
            var numCommentNodes = 0;
      
            _.each(node.parentNode.childNodes, function(element, index, list) {
                if (element.nodeType == Node.COMMENT_NODE)
                    numCommentNodes++;
            });


            var index = _.indexOf(node.parentNode.childNodes, node) + 1 - (numCommentNodes * 2);

            if (node.parentNode.nodeType != Node.ELEMENT_NODE)
                break;

            if (index > 0)
                steps.push(index);
            node = node.parentNode;
        }
        return steps.reverse();
    }

});


// The Annotation model corrosponds to notes, bookmarks, and higlights. 
// Annotation Types:
//    BKAnnotationTypeBookmark
//    BKAnnotationTypeHighlight
//    BKAnnotationTypeNote
//
// Annotation Styles (not valid for all types):
//    BKAnnotationStyleIcon (Bookmark and Note types)
//    BKAnnotationStyleHighlight (Highlight type)
//    BKAnnotationStyleUnderline (Highlight type)
//    BKAnnotationStyleMarginLeft (Note type)
//    BKAnnotationStyleMarginRight (Note type)
//
// Annotaton Colors (different effects per type, nothing for bookmarks)
//    BKAnnotationColorYellow
//    BKAnnotationColorPink
//    BKAnnotationColorRed
//    BKAnnotationColorPurple
//    BKAnnotationColorBlue
//    BKAnnotationColorGreen
//    BKAnnotationColorBlack (Underline & Note only)
//
BookKit.Annotation = Backbone.Model.extend({
    defaults: {
        cfi: null,
        type: BookKit.Constants.BKAnnotationTypeHighlight,
        style: BookKit.Constants.BKAnnotationStyleHighlight,
        color: BookKit.Constants.BKAnnotationColorYellow,
        note: ""
    },

    cfi: undefined,
    noteCanvas: undefined,
    annotationCanvas: undefined,

    initialize : function() {
        var cfi = this.get('cfi');

        if ((typeof cfi == 'string') || (cfi instanceof String)) {
            // We were given a string. Parse it.
            cfi = new BookKit.CFI({cfi: cfi}).parseAndResolve();
            this.set('cfi', cfi);
        }
        
    }
});

BookKit.AnnotationCanvas = Backbone.View.extend({

    annotations: {},
    canvas: undefined,
    
    initialize: function() {
        var canvas = document.createElement("canvas");
        $(canvas).attr('id', '-BookKit-Annotation-Canvas');
        $(canvas).attr('width', $(window).innerWidth());
        $(canvas).attr('height', $(window).innerHeight());
        $(canvas).css('position', 'fixed');
        $(canvas).appendTo('--BookKit-Annotations');

        // Not strictly a canvas, but we need somewhere to put notes
        // that will be out of the way of CFIs.
        var annotationsContainer = document.createElement("div");
        $(annotationsContainer).attr('id', '-BookKit-Annotations');
        $(annotationsContainer).appendTo('body');

        this.canvas = canvas;
        this.setElement(annotationsContainer);
        this.refresh();
    },

    refresh: function() {
        $('body').css({'background-image':"url(" + this.canvas.toDataURL("image/png")+ ")" });
    },

    // annotationCanvas.addAnnotation(annotationObject);
    // annotationCanvas.addAnnotation('epubcfi(...)', 
    //    'BKAnnotationTypeHighlight', 'BKAnnotationStyleHighlight', 'BKAnnotationColorYellow', 
    //    noteText);
    addAnnotation: function() {
        var annotationOrCFI = arguments[0];
        var annotaiton = undefined;
        var cfi = undefined;

        if ((typeof annotationOrCFI == 'string') || 
            (annotationOrCFI instanceof String) || 
            (annotationOrCFI instanceof BookKit.CFI)) {
            // We were given a string. Parse it.
            var type = arguments[1]
            var style = arguments[2]
            var color = arguments[3]
            var note = arguments[4]

            if ((typeof annotationOrCFI == 'string') || (annotationOrCFI instanceof String))
                cfi = new BookKit.CFI({cfi: annotationOrCFI}).parseAndResolve();
            else
                cfi = annotationOrCFI;

            annotation = new BookKit.Annotation({
                cfi: cfi, type: type, style: style, color: color, note: note});
        } else {
            cfi = annotation.get("cfi");
        }

        console.log(annotation);

        this.annotations[cfi] = { annotation: annotation, rects: [] };
        this.apply(annotation);
        this.refresh();
    },

    removeAnnotation: function(annotation) {
        var annotationOrCFI = arguments[0];
        var annotaiton = undefined;
        var cfi = undefined;

        if ((typeof annotationOrCFI == 'string') || 
            (annotationOrCFI instanceof String) || 
            (annotationOrCFI instanceof BookKit.CFI)) {
            // We were given a string. Parse it.
            var type = arguments[1]
            var style = arguments[2]
            var color = arguments[3]
            var note = arguments[4]

            if ((typeof annotationOrCFI == 'string') || (annotationOrCFI instanceof String))
                cfi = new BookKit.CFI({cfi: annotationOrCFI}).parseAndResolve();
            else
                cfi = annotationOrCFI;

            annotation = new BookKit.Annotation({
                cfi: cfi, type: type, style: style, color: color, note: note});
        } else {
            cfi = annotation.get("cfi");
        }
        
        this.remove(annotation);

        var index = this.annotations.indexOf(cfi);
        this.annotations.splice(index, 1);
    },

    apply: function(annotation) {
        var type = annotation.get("type");
        if (type == BookKit.Constants.BKAnnotationTypeBookmark)
            this.applyBookmark(annotation);

        if (type == BookKit.Constants.BKAnnotationTypeHighlight)
            this.applyHighlight(annotation);

        if (type == BookKit.Constants.BKAnnotationTypeNote)
            this.applyNote(annotation);

    },

    remove: function(annotation) {
        var type = annotation.get("type");
        if (type == BookKit.Constants.BKAnnotationTypeBookmark)
            this.removeBookmark(annotation);

        if (type == BookKit.Constants.BKAnnotationTypeHighlight)
            this.removeHighlight(annotation);

        if (type == BookKit.Constants.BKAnnotationTypeNote)
            this.removeNote(annotation);
    },

    applyHighlight: function(annotation) {
        var cfi = annotation.get("cfi");
        var style = annotation.get("style");
        var color = annotation.get("color");

        var highlightRects = [];

        var canvas_context = this.canvas.getContext('2d');
        _.each(cfi.ranges, function(range, index, ranges) {
            // console.log("highlight range", range.startContainer, range.endContainer);
            _.each(range.getClientRects(), function(rect, index, rects) {
                if (style == BookKit.Constants.BKAnnotationStyleHighlight) {
                    canvas_context.fillStyle = BookKit.Config.Colors.Highlight[color];
                    canvas_context.fillRect(rect.left, rect.top, rect.width, rect.height);

                }
                if (style == BookKit.Constants.BKAnnotationStyleUnderline) {
                    var top = rect.top + rect.height - BookKit.Config.Annotations.underlineThickness;
                    canvas_context.fillStyle = BookKit.Config.Colors.Underline[color];
                    canvas_context.fillRect(rect.left, top, 
                        rect.width, BookKit.Config.Annotations.underlineThickness);
                }
            }, this);
        }, this);

        this.annotations[cfi].rects = highlightRects;

        // XXX: Not sure why this doesn't work.
        // this.canvas.add.apply(highlightRects);

    },

    removeHighlight: function(annotation) {
        var cfi = annotation.get("cfi");
        var highlightRects = this.annotations[cfi].rects;

        var canvas_context = this.canvas.getContext('2d');
        _.each(cfi.ranges, function(range, index, ranges) {
            // console.log("highlight range", range.startContainer, range.endContainer);
            _.each(range.getClientRects(), function(rect, index, rects) {
                if (style == BookKit.Constants.BKAnnotationStyleHighlight) {
                    canvas_context.clearRect(rect.left, rect.top, rect.width, rect.height);
                }
                if (style == BookKit.Constants.BKAnnotationStyleUnderline) {
                    var top = rect.top + rect.height - BookKit.Config.Annotations.underlineThickness;
                    canvas_context.clearRect(rect.left, top, 
                        rect.width, BookKit.Config.Annotations.underlineThickness);
                }
            });
        });

        this.annotations[cfi].rects = [];
    },

    applyBookmark: function(annotation) {
        var style = annotation.get("style");
        console.log("applying bookmark");

        if (style == BookKit.Constants.BKAnnotationStyleIcon) {
            // If we're to show the bookmark, add some content to the
            // anchor and style and position it appropriately. 
            var columnWidth = $(window).innerWidth();
            var rect = cfi.ranges[0].getClientRects()[0];
            var columnNumber = BookKit.Utils.columnNumberForPosition(rect.left);
            var left = columnWidth * columnNumber + BookKit.Config.Annotations.padding;
            var top = rect.top + BookKit.Config.Annotations.padding;

            /*
            canvas_context.fillStyle = "#000000";
            canvas_context.font = 'FontAwesome';
            canvas_context.textAlign = 'left';
            canvas_context.fillText("\uf013", left, top);
            */
        }
    },

    removeBookmark: function(annotation) {

    },

    // Where highlights make sense on the canvas, notes do not. There's
    // no reason to reinvent what the browser is already designed to do:
    // display text, structured with HTML and styled with CSS. On a
    // canvas, we'd have to style it, position it, account for text
    // wrapping and all sorts of other stuff we get for free with HTML.
    // So, in this case, the "Canvas" part of "AnnotationCanvas" is a
    // bit of a lie.
    applyNote: function(annotation) {
        var cfi = annotation.get("cfi");
        var note = annotation.get("note");
        var style = annotation.get("style");
        var color = annotation.get("color");

        if ((style == BookKit.Constants.BKAnnotationStyleMarginLeft) || 
            (style == BookKit.Constants.BKAnnotationStyleMarginRight)) {

            var columnWidth = $(window).innerWidth();
            var rect = cfi.ranges[0].getClientRects()[0];
            var left = 20;
            var top = rect.top + BookKit.Config.Annotations.padding;

            var noteContainer = document.createElement("div");
            $(noteContainer).addClass("-BookKit-BKAnnotationTypeNoteContainer");
            $(noteContainer).addClass("-BookKit-" + style);
            $(noteContainer).css('display', 'table-cell');
            $(noteContainer).css('padding', BookKit.Config.Annotations.notePadding + 'px');

            var noteNode = document.createElement("div");
            $(noteNode).addClass("-BookKit-Annotation");
            $(noteNode).addClass("-BookKit-BKAnnotationTypeNote");
            $(noteNode).addClass("-BookKit-" + color);
            $(noteNode).html(note);

            $(noteNode).css('width', BookKit.Config.Annotations.noteWidth + 'px');
            $(noteNode).css('max-height', BookKit.Config.Annotations.noteHeight + 'px');
            $(noteNode).css('font-family', BookKit.Config.Annotations.noteFont);
            $(noteNode).css('font-size', BookKit.Config.Annotations.noteFontSize);

            $(noteContainer).css('position', 'fixed');

            $(noteNode).css('position', 'relative');
            $(noteNode).appendTo(noteContainer);

            if (style == BookKit.Constants.BKAnnotationStyleMarginLeft) {
                $(noteContainer).css('left', 0 + 'px');
                $(noteContainer).css('top', top + 'px');

                $(noteNode).css('-webkit-transform-origin', 'right top');
                $(noteNode).css('-webkit-transform', 'rotate(-90deg)');
                $(noteNode).css('left', - BookKit.Config.Annotations.noteWidth + 'px');
            }
            if (style == BookKit.Constants.BKAnnotationStyleMarginRight) {
                $(noteNode).css('left', columnWidth * (columnNumber + 1) - (BookKit.Config.Pagination.padding / 2) + 'px');
                $(noteNode).css('top', top + 'px');
                $(noteNode).css('-webkit-transform', 'rotate(90deg)');
            }

            // Size the container to fit.
            $(noteContainer).css('max-width', BookKit.Config.Annotations.noteHeight + 'px');
            $(noteContainer).css('height', BookKit.Config.Annotations.noteWidth + 'px');
            $(noteContainer).appendTo(this.el);

            function repositionOnCollision(container) {
                collisions = $(noteContainer).collidesWith($('.-BookKit-BKAnnotationTypeNoteContainer.-BookKit-' + style), true);
                if (collisions.length == 0)
                    return;

                firstCollision = collisions[0];
            }

            collision = $(noteContainer).collidesWith($('.-BookKit-BKAnnotationTypeNoteContainer.-BookKit-' + style), true);
            console.log("collision", collision);

        }

        if (style == BookKit.Constants.BKAnnotationStyleIcon) {

        }

    },

    removeNote: function(annotation) {

    }
   
});


