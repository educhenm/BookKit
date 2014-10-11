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

var BookKit = BookKit || {};

// Hold our parsed CFIs
var _parsed_cfis = BookKit._parsed_cfis = {};

// BookKit.CFI
// ===========
// The CFI model disconnects parsing the CFI string from resolving the
// steps in the DOM, so that BookKit could potentially be passed a list
// of steps that have already been parsed.
(function () {
    BookKit.CFI = function(cfistring, steps, range, ranges) {
        var base = this;

        // The CFI string
        base.cfistring = cfistring;

        // The parsed CFI 'steps', node indexes, and any associated
        // ranges, etc. An array of three arrays: parent steps, start
        // steps, and end steps.
        //
        // Step objects contain: 
        //    * `index`: The node index within its parent
        //    * `assertion`: An assertion made in the CFI step
        //    * `offset`: Any offset within the selected node
        //    * `redirection`: boolean whether or not the step is a
        //      redirection.
        //
        // If `steps` are given as an argument, we'll assume they're 
        // valid for the given `cfistring` and we don't need to parse it.
        base.steps = steps || null;

        // The UNSAFE complete range of the CFI.
        //
        // If `range` is given as an argument, we'll assume its valid
        // for the given `cfistring` and we don't need to resolve it if
        // `ranges` is also given. Both are to be expected from a CFI
        // object.
        base.range = range || null,

        // The ranges referred to by a ranged CFI. Array to hold 
        // the multiple elements, element fragments selected, safe
        // for operating across elements.
        //
        // If `ranges` are given as an argument, we'll assume they're 
        // valid for the given `cfistring` and we don't need to resolve it
        // if `range` is also given. Both are to be expected from a CFI
        // object.
        base.ranges = ranges || null;

        // ### Parsing CFIs to node indexes

        // Break the CFI into its parent, start, end ranges, if they exist.
        var rangeComponents = function(cfistring) {
            var scanLocation = 0;
            var componentStartLocation = 0;
            var components = [];

            while (scanLocation < cfistring.length) {
                var openingBraceLocation = cfistring.indexOf('[', scanLocation);
                var closingBraceLocation = cfistring.indexOf(']', scanLocation);
                var commaLocation = cfistring.indexOf(',', scanLocation);

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

                    if ((closingBraceLocation + 1) < cfistring.length) 
                        scanLocation = closingBraceLocation + 1;
                    else
                        break;

                } else {
                    // The comma is not inside of the braces, and not past 
                    // the closing brace. It's a range comma.
                    components.push(
                        cfistring.substring(componentStartLocation, commaLocation));

                    componentStartLocation = commaLocation + 1;
                    scanLocation = componentStartLocation;
                }
            }

            // Add the last component
            if (componentStartLocation < cfistring.length)
                components.push(
                    cfistring.substring(componentStartLocation, cfistring.length));

            return components;
        };

        // Parse each step string in the given array and return an array of
        // matching step objects which include the node index the step
        // refers to and any additional information, such as offsets that
        // are present in the step string.
        var parseSteps = function(stepStrings) {
            var steps = [];

            _.each(stepStrings, function(stepString, index, stepStrings) {
                if (stepString.length == 0)
                    return;

                var step = {
                    index: -1,
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

                step.index = parseInt(stepString);
                steps.push(step);
            });

            return steps;
        };

        // Parse the CFI into a list of steps.
        var parse = function() {
            var cfistring = base.cfistring;

            // Check the cache.
            if (BookKit._parsed_cfis[cfistring] != null)
                return BookKit._parsed_cfis[cfistring].steps;

            // XXX: Throw up some kind of error
            if (cfistring.indexOf("epubcfi(") != 0)
                return;

            cfistring = cfistring.substring("epubcfi(".length, cfistring.length - ")".length);

            var components = rangeComponents(cfistring);
            if (components.length == 1) {
                // This is not a ranged CFI
                var steps = parseSteps(cfistring.split('/'));
                base.steps = [steps, [], []];
            } else {
                var parentSteps = parseSteps(components[0].split('/'));
                var startSteps = parseSteps(components[1].split('/'));
                var endSteps = parseSteps(components[2].split('/'));

                base.steps = [parentSteps, startSteps, endSteps];
            }

            // Cache the result
            BookKit._parsed_cfis[cfistring] = base;

            return base.steps;
        };

        // ### Resolving CFIs

        // Resolve a specific step, represented by the step object, within
        // the given parent node
        var resolveStep = function(stepDict, parentNode) {
            var nodeIndex = -1;
            var node = null;

            var leadingElementAdjustment = 0;

            if (stepDict.index % 2 == 0) {
                var children = $(parentNode).children();
                // This is an element
                nodeIndex = stepDict.index / 2 - 1;
                if (nodeIndex <= children.length)
                    node = $(children).eq(nodeIndex)[0];

            } else {
                // This is a text node.
                nodeIndex = stepDict.index - 1;

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
        };

        // Resolve this CFI once it has been parsed
        var resolve = function() {
            if (base.ranges)
                return base.ranges;

            var steps = base.steps;
            var parentSteps = steps[0];
            var startSteps = steps[1];
            var endSteps = steps[2];
            
            // Strip out the package spine location manually, and grab the
            // item out of the spine.
            if (parentSteps[0].index != 6) {
                // Then something is dreadfully wrong somewhere
                console.log("Malformed CFI. Spine should be sixth element of package", 
                    parentSteps[0]);
            }
            parentSteps.splice(0, 1);

            // Get the root of the current document (and assume it's the
            // content document referred to before the redirection in the
            // CFI.
            var contentDocument = document;
            var immediateParentNode = contentDocument.documentElement;

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
            // XXX: to jQuery $.each()
            _.each(parentSteps, function(stepDict, index, steps) {
                var node = resolveStep(stepDict, immediateParentNode);
                immediateParentNode = node;
            }, this);
            parent = immediateParentNode;
            base.node = parent;

            // Find the start node of the range, if startSteps is given.
            if (startSteps.length > 0) {
                immediateParentNode = parent;
                _.each(startSteps, function(stepDict, index, steps) {
                    var node = resolveStep(stepDict, immediateParentNode);
                    immediateParentNode = node;
                });
                if (_.last(startSteps).offset != null)
                    startOffset = _.last(startSteps).offset;
                start = immediateParentNode;
            }

            // Find the end node of the range, if endSteps is given.
            if (endSteps.length > 0) {
                immediateParentNode = parent;
                _.each(endSteps, function(stepDict, index, steps) {
                    var node = resolveStep(stepDict, immediateParentNode);
                    immediateParentNode = node;
                });
                if (_.last(endSteps).offset != null)
                    endOffset = _.last(endSteps).offset;
                end = immediateParentNode;
            }

            // XXX: handle assertions
            
            // Set the range(s) of the CFI's location. 
            var range = contentDocument.createRange();
            if (start != null && startOffset != null && 
                    end != null && endOffset != null) {
                // If we're given a ranged CFI, get its collective,
                // cross-element ranges.
                range.setStart(start, startOffset);
                range.setEnd(end, endOffset);

                base.range = range;
                base.ranges = BookKit.CFI.getSafeRanges(range);
            } else if (end != null) {
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
                    // XXX: does this even work?
                    range.setStart(node, offset);
                    range.setEnd(node, offset + 1);

                    base.range = range;
                    base.ranges = [range];
                }
            }

            return base.ranges;
        };

        // This is the primary method called for parsing this object's CFI
        // string and resolving it within the content document.
        // 
        // This is not done automatically in case one wishes to
        // initialize CFI objects without necessarily parsing and
        // resolving them immediately.
        base.parseAndResolve = function() {
            if (base.steps == null)
                parse();

            if (base.range == null || base.ranges == null)
                resolve();
            
            return base;
        };

        // Genreate a CSS-safe string corrosponding to the CFI. Intended to
        // be useful in the event that elements are added to the DOM to
        // represent annotations that corrospond to CFIs.
        base.safeAttr = function() {
            // Convert this:
            //    epubcfi(/6/12!/4/2[episode-01]/68/1:2)
            // Into this:
            //    epubcfi_6_12_4_2episode-01_68_1_2
            // For use in id attributes on elements. It's a lossy
            // conversion, not intended for reconstituting the string.
            var cfistring = this.options.cfistring;
            return cfistring.replace(/[\:\/\,]/g, '_').replace(/[\!\(\)\[\]]/g, '');
        };

        // Get rects for the CFI's ranges. Note: this may be subject to
        // change if the content layout changes.
        base.rects = function() {
            var rects = [];
            $.each(base.ranges, function(index, range) {
                $.each(range.getClientRects(), function(index, rect) {
                    rects.push(rect);
                });
            });
            return rects;
        };

        // Does this CFI contain the given x,y coordinates within its
        // rects?
        base.containsPoint = function(x, y) {
            rects = base.rects();
            $.each(rects, function(index, rect) {
                if (x >= rect.left && x <= rect.left + rect.width &&
                    y >= rect.top && y <= rect.top + rect.height) {
                    return true;
                }
            });
            return false;
        };

        // Make this CFI the active selection
        base.select = function() {
            var selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(base.range);
            console.log(selection.rangeCount);
        };


        // Does this CFI intersect with another CFI?
        // Internally this uses the CFI's parsed steps rather than DOM
        // ranges.
        base.intersects = function(anotherCfi) {
            var e2e = base.range.compareBoundaryPoints(Range.END_TO_END, anotherCfi.range);
            var e2s = base.range.compareBoundaryPoints(Range.END_TO_START, anotherCfi.range);
            var s2e = base.range.compareBoundaryPoints(Range.START_TO_END, anotherCfi.range);
            var s2s = base.range.compareBoundaryPoints(Range.START_TO_START, anotherCfi.range);

            //  |------|      (s2s == 0) && (e2e == 0)
            //                starts-equal ends-equal
            //      |------|  (s2e >= 0) && (e2s <= 0) 
            //                starts-after starts-before-end 
            // |-----|        (s2s <=0 ) && (s2e >= 0)
            //                starts-before ends-after-start
            // console.log("  starts-equal ends-equal", (s2s == 0) && (e2e == 0));
            // console.log("  starts-after starts-before-end", (s2e >= 0) && (e2s <= 0));
            // console.log("  starts-before ends-after-start", (s2s <=0 ) && (s2e >= 0));
            if (((s2s == 0) && (e2e == 0)) ||
                ((s2e >= 0) && (e2s <= 0)) ||
                ((s2s <= 0 ) && (s2e >= 0)))
                return true

            return false;
        };

        // Return a new CFI that is the given CFI merged with this one.
        base.merge = function(anotherCfi) {
            if (!base.intersects(anotherCfi)) 
                return null;

            var e2e = base.range.compareBoundaryPoints(Range.END_TO_END, anotherCfi.range);
            var e2s = base.range.compareBoundaryPoints(Range.END_TO_START, anotherCfi.range);
            var s2e = base.range.compareBoundaryPoints(Range.START_TO_END, anotherCfi.range);
            var s2s = base.range.compareBoundaryPoints(Range.START_TO_START, anotherCfi.range);
            
            return null;
        };
        
        // Initialization
        base.init = function() {
        };

        // Run initializer
        base.init();
    };

    // This MUST BE SET for CFIs that are generated to be valid.
    // It's the string that corropsonds to the document step of the
    // CFI, i.e. "/6/12!" in "epubcfi(/6/12!/4/2/4/2,/1:0,/1:22)"
    BookKit.CFI.documentStep = "";

    // A CFI for the current window's selection. 
    // This is intended to be useful for annotating.
    BookKit.CFI.selectionCFI = function() {
        var selection = window.getSelection();
        if (selection.rangeCount > 0) {
            var range = window.getSelection().getRangeAt(0);
            return BookKit.CFI.cfiForRange(range);
        }
        return;
    };

    // A CFI for the given range object
    BookKit.CFI.cfiForRange = function(range) {
        var contentDocumentCFI = BookKit.CFI.contentCFIForRange(range);
        var cfistring = "epubcfi(" + BookKit.CFI.documentStep + contentDocumentCFI + ")";
        return new BookKit.CFI(cfistring).parseAndResolve();
    };

    // Utility methods for generating CFI strings. These DO
    // NOT return BookKit.CFI obejcts.

    // Return the content document portion of a CFI for the given range.
    // It will not include the package location, etc.
    BookKit.CFI.contentCFIForRange = function(range) {
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
    };

    // Return an array of CFI 'steps'—the node indicies within their
    // parent's children for the given node and its parents.
    BookKit.CFI.cfiStepsForNode = function(node) {
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

    // Take a given selection range that may span DOM elements and return 
    // an array of equivelent ranges that do not.
    // http://stackoverflow.com/a/12823606
    BookKit.CFI.getSafeRanges = function(dangerous) {
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
        var response = rs.concat(re);    

        // Send to Console
        return response;
    };


})();




