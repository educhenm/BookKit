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

var _parsed_cfis = BookKit._parsed_cfis = {};

// BookKit.CFI
// ===========
// The CFI model disconnects parsing the CFI string from resolving the
// steps in the DOM, so that BookKit could potentially be passed a list
// of steps that have already been parsed.
var CFI = BookKit.CFI = function(attributes) {
    BookKit.BaseClass.apply(this, arguments);
};

// Class Methods
// -------------
// These are intended for the construction of BookKit.CFI objects and
// CFI strings.
_.extend(BookKit.CFI, {
    // A CFI for the top location currently on screen.
    // This is intended to be useful for bookmarking.
    currentCFI: function() {
        var range = BookKit.Utils.rangeForCurrentColumn();
        var contentDocumentCFI = BookKit.CFI.contentCFIForRange(range);
        var cfiString = "epubcfi(" + BookKit.Config.Document.cfi + contentDocumentCFI + ")";
        return new BookKit.CFI({cfi: cfiString}).parseAndResolve();
    },

    // A CFI for the current window's selection. 
    // This is intended to be useful for annotating.
    selectionCFI: function() {
        var contentDocumentCFI = BookKit.CFI.contentCFIForRange(window.getSelection().getRangeAt(0));
        var cfiString = "epubcfi(" + BookKit.Config.Document.cfi + contentDocumentCFI + ")";
        return new BookKit.CFI({cfi: cfiString}).parseAndResolve();
    },

    // Semi-private utility methods for generating CFI strings. These DO
    // NOT return BookKit.CFI obejcts.
    
    // Return the content document portion of a CFI for the given range.
    // It will not include the package location, etc.
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

    // Return an array of CFI 'steps'—the node indicies within their
    // parent's children for the given node and its parents.
    cfiStepsForNode: function(node) {
        var steps = [];
        while(node) { 
            // Filter out all non element or text nodes
            var numCommentNodes = 0;
      
            _.each(node.parentNode.childNodes, function(element, index, list) {
                if (element.nodeType == Node.COMMENT_NODE)
                    numCommentNodes++;
            });

            // epubcfi dictates that text nodes are always odd numbered
            // and element notes are always even numbered. This can be a
            // problem in WebKit when we start off at, for example,
            // <p><i>foo</i> bar</p>. WebKit does not offer a text node
            // before the italic node. 
            var leadingElementAdjustment = 0;
            if (node.parentNode.childNodes[0].nodeType == Node.ELEMENT_NODE)
                leadingElementAdjustment = 1;

            var index = _.indexOf(node.parentNode.childNodes, node) + 1 - 
                (numCommentNodes * 2) + leadingElementAdjustment;

            if (node.parentNode.nodeType != Node.ELEMENT_NODE)
                break;

            if (index > 0)
                steps.push(index);
            node = node.parentNode;
        }
        return steps.reverse();
    }
});

// Instance Methods
// ----------------
// These methods are intended for the parsing and resolution of CFI
// strings.
_.extend(BookKit.CFI.prototype, BookKit.BaseClass.prototype, {
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

    // This is the primary method called for parsing this object's CFI
    // string and resolving it within the content document.
    parseAndResolve: function() {
        this.parse();
        this.resolve();
        return this;
    },

    // Genreate a CSS-safe string corrosponding to the CFI. Intended to
    // be useful in the event that elements are added to the DOM to
    // represent annotations that corrospond to CFIs.
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
    
    // ### Parsing CFIs to node indexes
    // These functions are semi-private and not intended to be called
    // directly.

    // Parse the CFI into a list of steps.
    parse: function() {
        var cfi = this.get("cfi");

        // Check the cache.
        if (BookKit._parsed_cfis[cfi] != null)
            return BookKit._parsed_cfis[cfi].get("steps");

        // XXX: Throw up some kind of error
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
        BookKit._parsed_cfis[cfi] = this;

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

    // Parse each step string in the given array and return an array of
    // matching step objects which include the node index the step
    // refers to and any additional information, such as offsets that
    // are present in the step string.
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

    // ### Resolving CFIs
    // These functions are semi-private and not intended to be called
    // directly.

    // Resolve this CFI once it has been parsed
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
            if (offset >= (end.length - 1)) 
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

    // Resolve a specific step, represented by the step object, within
    // the given parent node
    resolveStep: function(stepDict, parentNode) {
        var nodeIndex = -1;
        var node = null;

        var leadingElementAdjustment = 0;

        if (stepDict.step % 2 == 0) {
            var children = $(parentNode).children();
            // This is an element
            nodeIndex = stepDict.step / 2 - 1;
            if (nodeIndex <= children.length)
                node = $(children).eq(nodeIndex)[0];

        } else {
            // This is a text node.
            nodeIndex = stepDict.step - 1;

            // epubcfi dictates that text nodes are always odd numbered
            // and element notes are always even numbered. This can be a
            // problem in WebKit when we start off at, for example,
            // <p><i>foo</i> bar</p>. WebKit does not offer a text node
            // before the italic node. 
            if (parentNode.childNodes[0].nodeType == Node.ELEMENT_NODE)
                nodeIndex = nodeIndex - 1;
            
            if (nodeIndex <= parentNode.childNodes.length)
                node = parentNode.childNodes.item(nodeIndex);
        }

        return node;
    }

});


