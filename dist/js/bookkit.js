/*
 * BookKit JavaScript ePub3 Reader Utilities
 *
 * Copyright 2012-2014 Will Barton.
 * All rights reserved. See LICENSE for full license details.
 */ 


var BookKit = BookKit || {};

// A list of annotation objects associated with this particular XHTML document
BookKit.Annotations = BookKit.Annotations || {};

// Annotation Model
// ----------------
// The Annotation model corrosponds to notes, bookmarks, and higlights
// which are subsequently drawn (if done so using BookKit) using an
// AnnotationCanvas. 
BookKit.Annotation = (function () {
    var Annotation = function(options) {
        var base = this;

        // The main options. `cfi` is required, the rest as only really
        // useful if using another layer on top of BookKit.Annotation to
        // display them, with BookKit.Annotation as the data model for
        // Annotations.
        var defaults = {
            // A BookKit.CFI object or a string EPUB CFI for this
            // annotation
            cfi: null,

            // If the annotation is a bookmark, what's its style and
            // color?
            bookmark: false,
            bookmarkStyle: 'none',
            bookmarkColor: 'none',

            // If the annotation is a highlight, what's its style and
            // color?
            highlight: false,
            highlightStyle: 'none',
            highlightColor: 'none',

            // If the annotation is a note, what's its style, color, and
            // text?
            note: false,
            noteStyle: 'none',
            noteColor: 'none',
            noteText: "",
        };

        base.options = $.extend(true, {}, defaults, options);

        // The BookKit.CFI object associated with this annotation. If
        // `options.cfi` is not a BookKit.CFI object, one will be
        // created from it.
        base.cfi = undefined;

        // Initialization
        base.init = function() {
            if ((typeof base.options.cfi == 'string') || 
                    (base.options.cfi instanceof String)) {
                // We were given a string. Parse it.
                base.cfi = new BookKit.CFI(base.options.cfi).parseAndResolve();
            } else {
                base.cfi = base.options.cfi;
            }
        };

        // Run initializer
        base.init();

    };

    return function(options) {
        return new Annotation(options);
    };
})();

// Add an annotation to BookKit's global list of annotations for this
// document. 
BookKit.Annotation.addAnnotation = function(cfiOrString, annotationProps) {
    var cfistring;
    if ((typeof cfiOrString == 'string') || (cfiOrString instanceof String)) {
        cfistring = cfiOrString;
    } else {
        cfistring = cfiOrString.cfistring;
    }

    annotationProps.cfi = cfiOrString;
    var annotation = new BookKit.Annotation(annotationProps);

    BookKit.Annotations[cfistring] = annotation;
    $(document).trigger('addedAnnotation', [annotation]);

    return annotation;
};

// Remove an annotation from BookKit's global list of annotations for this
// document. 
// Can be given a cfi string, a BookKit.CFI object or a
// BookKit.Annotation object to identify a particular annotation.
BookKit.Annotation.removeAnnotation = function(annotationOrCFI) {
    var annotaiton = undefined;
    var cfi = undefined;

    if ((typeof annotationOrCFI == 'string') || 
        (annotationOrCFI instanceof String) || 
        (annotationOrCFI instanceof BookKit.CFI)) {

        if ((typeof annotationOrCFI == 'string') || (annotationOrCFI instanceof String))
            cfi = new BookKit.CFI(annotationOrCFI).parseAndResolve();
        else
            cfi = annotationOrCFI;

    } else {
        cfi = annotation.cfi;
    }

    var annotation = BookKit.Annotations[cfi.cfistring];
    var index = BookKit.Annotations.indexOf(cfi.cfistring);
    BookKit.Annotations.splice(index, 1);
    $(document).trigger('removedAnnotation', [annotation]);
};


;/*
 * BookKit JavaScript ePub3 Reader Utilities
 *
 * Copyright 2012-2014 Will Barton.
 * All rights reserved. See LICENSE for full license details.
 */ 

var BookKit = BookKit || {};
BookKit.Behavior = BookKit.Behavior || {};

(function () {

    // BookKit Navigation Behavior
    // ===========================
    // Set up a "page" using columns, scroll to a specific "page" offset
    // (optionally), and configure navigation elements.
    BookKit.Behavior.Navigate = function(options) {
        var base = this;
        
        var defaults = {
            // Scroll horizontally
            horizontal: true,

            // Number of columns to scroll when moving to next "page"
            columnsToScroll: 2,

            // Column to start at
            columnToStart: 0,
        };

        base.options = $.extend({}, defaults, options);
        
        base.presentation = undefined;

        base.nextColumn = function() {
            var current_column = base.presentation.currentContentPosition();
            var total_columns = base.presentation.contentDivisions();
            var next_column = current_column + base.options.columnsToScroll;
            if (next_column < total_columns) {
                base.scrollTo(next_column, true);
            }
        };

        base.previousColumn = function() {
            var current_column = base.presentation.currentContentPosition();
            var prev_column = current_column - base.options.columnsToScroll;
            if (prev_column >= 0) {
                base.scrollTo(prev_column, true);
            }
        };

        base.scrollTo = function(column, animate) {
            // Scroll to the appropriate column
            var offset = column * base.presentation.actualContentWidth();

            if (base.options.horizontal) {
                if (animate) {
                    base.$el.animate({scrollLeft: offset}, 
                        base.presentation.options.animationDuration);
                } else {
                    base.$el.scrollLeft(offset);
                }
            } else {
                base.$el.scrollTop(offset);
            }
        };
            
        base.init = function() {

            // Window load offset scrolling
            $(document).on('presented', function(e, presentation) {
                base.presentation = presentation;
                base.$el = $(base.presentation.options.presentationElement);

                // WebKit seems to call ready before it applies css3
                // columns.
                base.scrollTo(base.options.columnToStart);
                setTimeout(function() {
                }, 500);
            });

            // Keyboard left/right navigation
            $(document).keydown(function(e) {
              if(e.keyCode == 37) {
                  console.log("prev");
                  base.previousColumn();
              } else if(e.keyCode == 39) {
                  base.nextColumn();
              }
            });
            // $(document).on('swipeleft',this.previousColumn);
            // $(document).on('swiperight',this.nextColumn);
                        
            // Keyboard up/down navigation
            // Swipe left/right navigation

        };

        // Run initializer
        base.init();
    };

    // BookKit Highlight Immediately Behavior
    // ====================
    // This is a behavior for highlighting immediately upon a selection,
    // iBooks-style.
    BookKit.Behavior.HighlightImmediately = function(options) {
        var base = this;

        var defaults = {
            // Default highlight style
            style: 'highlight',

            // Default highlight color
            color: 'blue',
        };

        base.options = $.extend({}, defaults, options);
        
        base.init = function() {
            $(document).on('presented', function(e, presentation) {
                base.presentation = presentation;
                base.$el = $(base.presentation.options.presentationElement);
            
                base.$el.on('mouseup', function(e) {
                    var cfi = BookKit.CFI.selectionCFI();

                    // For highlights, make sure we have ranges
                    if (cfi && cfi.ranges != undefined) {
                        console.log(cfi.cfistring);
                        window.getSelection().removeAllRanges();
                        BookKit.Annotation.addAnnotation(cfi, {
                            highlight: cfi,
                            highlightStyle: base.options.style,
                            highlightColor: base.options.color,
                        });
                    }
                });
            });
        };

        // Run initializer
        base.init();
    };

    // Note Splitter
    // -----------------
    // Splits the content at the bottom of an annotation to reveal a
    // note.
    BookKit.Behavior.NoteSplitter = function(options) {
        var base = this;
        
        var defaults = {

        };

        base.options = $.extend({}, defaults, options);

        base.presentation = undefined;

        base.openNote = function(annotation) {
            // Check to see if the note is already open
            var existing = $('#-BookKit-Behavior-NoteSplitter-Note-' + annotation.cfi.safeAttr());
            if ((existing.length) > 0)
                return;

            // Using the ending range of the annotation, close its
            // endContainer and add a new DOM element immediately after
            // containing the note. Then open an identical DOM element
            // to the endContainer after our new element — IF the end of
            // the range was not at the end of the container. If it was,
            // use a data- attribute to communicate that.
            var endRange = annotation.cfi.ranges[annotation.cfi.ranges.length - 1];
            var endNode = endRange.endContainer;
            var enclosingNode;
  
            // If the end node is a text node, get its parent.
            if (endNode.nodeType == Node.TEXT_NODE) {
                enclosingNode = endNode.parentNode
            } else {
                enclosingNode = endNode;
                console.log(enclosingNode, "is not", endNode);
            }

            // Create a new text node at the offset and detach it.
            var textNodeAfterOffset = $(endNode.splitText(endRange.endOffset))
                                        .detach();

            // Clone the original enclosing container, empty it, and add
            // the text node.
            var enclosingNodeCopy = $(enclosingNode)
                                      .clone()
                                      .empty()
                                      .append(textNodeAfterOffset);

            // Insert the enclosing node copy after the enclosing node.
            $(enclosingNodeCopy).insertAfter($(enclosingNode));

            // Now create a new node for the note text.
            var noteNode = document.createElement("div");
            $(noteNode).attr('class', '-BookKit-Behavior-NoteSplitter-Note');
            $(noteNode).attr('id', 
                '-BookKit-Behavior-NoteSplitter-Note-' + annotation.cfi.safeAttr());
            $(noteNode).html(annotation.options.noteText);
            $(noteNode).insertAfter($(enclosingNode));

            // Trigger a layout change, since this shifts all content
            // below the new nodes down the page.
            $(document).trigger('presentationChanged');
       
        };

        // Remove our custom DOM element, and merge the ending range
        // of the annotation's endContainer with the element
        // following our custom element — IF the end of the
        // range was not at the end of the container originally. 
        //
        // If annotation is not given any matching note element will be
        // closed.
        base.closeNote = function(annotation) {
            var existing;

            if (annotation != undefined)
                existing = $('.-BookKit-Behavior-NoteSplitter-Note-' + annotation.cfi.safeAttr());
            else
                existing = $('.-BookKit-Behavior-NoteSplitter-Note');

            $(existing).each(function() {
                // Get the original node and the copy we made when we
                // split it into two.
                var noteElement = this;
                console.log(noteElement);
                var enclosingNode = $(noteElement).prev();
                console.log("enclosingNode", enclosingNode);
                var enclosingNodeCopy = $(noteElement).next();
                console.log("enclosingNodeCopy", enclosingNodeCopy);

                // Get the text out of the copy node to add back into
                // the original node.
                var textNodeAfterOffset = $(enclosingNodeCopy[0].firstChild).detach();

                // Append the text node to the original node
                $(enclosingNode).append(textNodeAfterOffset);

                // Remove the copy node.
                $(enclosingNodeCopy).remove();
                
                // Normalize the original node (so that new CFIs don't
                // have unresolvable steps).
                enclosingNode[0].normalize();

                // Remove the note node
                $(noteElement).remove();
            });

            // Trigger a layout change, since this shifts all content
            // back to its original position
            $(document).trigger('presentationChanged');
        };

        base.init = function() {
            $(document).on('presented', function(e, presentation) {
                base.presentation = presentation;
                base.$el = $(base.presentation.options.presentationElement);
                
                base.$el.on('click', function(e) {
                    var clickedAnnotation;
                    $.each(BookKit.Annotations, function(index, annotation) {
                        if (annotation.cfi.containsPoint(e.clientX, e.clientY) && 
                                annotation.options.note) {
                            clickedAnnotation = annotation;
                        }
                    });

                    if (clickedAnnotation != undefined) {
                        // If we have a clicked note annotation and it's not
                        // already opened, open it
                        base.openNote(clickedAnnotation);
                    } else {
                        // If we don't have a clicked note annotation, close
                        // any open ones.
                        var existing = $('.-BookKit-Behavior-NoteSplitter-Note');
                        if (existing.length > 0) {
                            console.log("closing notes");
                            base.closeNote();
                        }
                    }
                    
                });
            });
        };

        // Run initializer
        base.init();

    };
    

})();
        



/*
var AnnotationTap = BookKit.Behaviors.AnnotationTap = function(attributes) {
    BookKit.BaseClass.apply(this, arguments);
};
_.extend(BookKit.Behaviors.AnnotationTap.prototype, BookKit.BaseClass.prototype, {

    selector: 'html',
    event: 'tap',
    presentation: undefined,

    initialize: function() {

    },

    handler: function(e) {
        // See if the event happened in one of our annotation rects.
        var x = data.x;
        var y = data.y;
        var annotationTap = false;

        var annotations = this.presentation.annotationCanvas.annotations;
        _.each(annotations, function(annotation, index, annotations) {
            _.each(annotation.rects, function(rect, index, rects) {
                if (x >= rect.left && x <= rect.left + rect.width &&
                    y >= rect.top && y <= rect.top + rect.height) {
                    annotationTap = true;
                    this.annotationTap(annotation, rect);
                }
            }, this);
        }, this);

        if (!annotationTap)
            this.nonAnnotationTap(e, data);
    },

    annotationTap: function(annotation, rect) {
        // Clear any previous presentations.
        $('#-BookKit-Presentation').html('');

        console.log("annotation tap event", annotation);

        // Construct a menu controller for this annotation
        var menuController = $("\
            <div class='-BookKit-Presentation-MenuController'>\
                <ul class='-BookKit-Presentation-MenuController-Menu'>\
                    <li>Option</li>\
                    <li>Option</li>\
                    <li>Option</li>\
                </ul>\
            </div>\
        ");

        // html2canvas($("body"), { 
        //     onrendered: function(canvas) {
        //         $(menuController).css({'background-image':"url(" + canvas.toDataURL("image/png")+ ")" });
        //     }
        // });

        // Calculate the position of the menu controller
        var width = $(menuController).measure(function() { return this.width() });
        var height = $(menuController).measure(function() { return this.height() });
        var middle = (rect.width / 2);
        var top = rect.top - (rect.height / 4) - height;
        $(menuController).css('left', rect.left);
        $(menuController).css('top', top);
        $('#-BookKit-Presentation').append(menuController);

    },

    nonAnnotationTap: function(event, data) {
        // Do nothing except clear the presentation layer.
        console.log("non-annotation tap");
        $('#-BookKit-Presentation').html('');
    },

      
});
*/

;/*
 * BookKit JavaScript ePub3 Reader Utilities
 *
 * Copyright 2012-2014 Will Barton.
 * All rights reserved. See LICENSE for full license details.
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
            var cfistring = base.cfistring;
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
        base.containsPoint = function(x, y, xOffset, yOffset) {
            rects = base.rects();
            var contains = false;
            $.each(rects, function(index, rect) {
                if (x >= rect.left && x <= rect.left + rect.width &&
                    y >= rect.top && y <= rect.top + rect.height) {
                    contains = true;
                }
            });
            return contains;
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




;/*
 * BookKit JavaScript ePub3 Reader Utilities
 *
 * Copyright 2012-2014 Will Barton.
 * All rights reserved. See LICENSE for full license details.
 */ 

BookKit.Introspection = {}

// Introspection
// =============
// Introspection is intended to give ereaders easy access to information
// that BookKit has about the XHTML document — how many pages is it with
// the current display settings, etc.
//
// Many of these are available with relative ease (like number of page,
// which just calls a Utils.totalColumns), but this gives us an exposed
// API.

// Number of Pages
// ---------------
// Returns the number of pages in this XHTML document (likely a
// chapter). BookKit can't know anything about the total number of pages
// in a particular eBook.
BookKit.Introspection.numberOfPages = function() {
    return BookKit.Presentation.totalColumns();
}

// Current Page
// ------------
// Returns the current page number.
BookKit.Introspection.currentPage = function() {
    return BookKit.Presentation.currentColumnNumber();
}


;/*
 * BookKit JavaScript ePub3 Reader Utilities
 *
 * Copyright 2012-2014 Will Barton.
 * All rights reserved. See LICENSE for full license details.
 */ 

var BookKit = BookKit || {};
BookKit.Layer = BookKit.Layer || {};

(function () {

    // Annotation Canvas
    // -----------------
    // The annotation canvas handles the drawing of annotations. Highlights
    // are actually drawn on an HTML5 canvas element (rather than inline in
    // the HTML, potentially complicating our resolution of new CFIs).
    //
    // WebKit-only because of the use of `webkit-canvas()` in
    // background.
    BookKit.Layer.AnnotationCanvas = function(options) {
        var base = this;
        
        var defaults = {
            underlineThickness: 2,
            padding: 50,

            colors: {
                highlight: {
                    none: 'transparent',
                    yellow: '#ffff6d',
                    pink: '#ff80d5',
                    red: '#ff9380',
                    purple: '#b063ff',
                    blue: '#80caff',
                    green: '#b4ff6d',
                    black: 'transparent'
                },
                underline: {
                    none: 'transparent',
                    yellow: 'transparent',
                    pink: 'transparent',
                    red: '#fb0011',
                    purple: '#8000ff',
                    blue: '#0080ff',
                    green: '#44b705',
                    black: '#000000' 

                },
                note: {
                    none: 'transparent',
                    yellow: 'transparent',
                    pink: 'transparent',
                    red: '#fb0011',
                    purple: '#8000ff',
                    blue: '#0080ff',
                    green: '#44b705',
                    black: '#000000' 
                }
            },
        };

        base.options = $.extend({}, defaults, options);
        
        base.presentation = undefined;
        base.canvas = undefined;
        base.width = null;
        base.height = null;

        base.canvasContext = function() {
            var canvas_context = document.getCSSCanvasContext('2d', 
                '-BookKit-Annotation-Canvas', base.width, base.height);
            return canvas_context;
        };

        base.renderHighlight = function(annotation) {
            var cfi = annotation.cfi;
            var style = annotation.options.highlightStyle;
            var color = annotation.options.highlightColor;
            var canvas_context = base.canvasContext();

            _.each(cfi.ranges, function(range, index, ranges) {
                _.each(range.getClientRects(), function(rect, index, rects) {
                    if (style == 'highlight') {
                        canvas_context.fillStyle = base.options.colors.highlight[color];
                    }
                    if (style == 'underline') {
                        var top = rect.top + rect.height - base.options.underlineThickness;
                        canvas_context.fillStyle = base.options.colors.underline[color];
                        rect.top = top;
                        rect.height = base.options.underlineThickness;
                    }

                    // Fill the rect.
                    var left_offset = base.$el.scrollLeft();
                    var top_offset = base.$el.scrollTop();
                    canvas_context.fillRect(rect.left + left_offset, rect.top + top_offset, 
                        rect.width, rect.height);
                    BookKit.Annotations[cfi.cfistring].rects.push(rect);
                });
            });
        };

        base.renderBookmark = function(annotation) {
            var cfi = annotation.cfi;
            var style = annotation.options.bookmarkStyle;
            var color = annotation.options.bookmarkColor;

            if (style == 'icon') {
                // If we're to show the bookmark, add some content to the
                // anchor and style and position it appropriately. 
                // var canvas_context = this.canvas.getContext('2d');
                var canvas_context = base.canvasContext();
                var columnWidth = base.presentation.actualContentWidth();
                var originalRect = cfi.ranges[0].getClientRects()[0];
                var columnNumber = base.presentation.currentContentPosition(originalRect.left);
                var left = columnWidth * columnNumber + base.options.padding;
                var rect = {
                    left: left, 
                    top: originalRect.top, 
                    right: left + originalRect.height,
                    width: originalRect.height, 
                    height: originalRect.height
                };

                // canvas_context.fillStyle = BookKit.Config.Colors.Highlight[color];
                canvas_context.fillStyle = "#000000";
                canvas_context.textAlign = 'left';
                canvas_context.textBaseline = 'top';
                // canvas_context.font = originalRect.height + "px FontAwesome";
                // canvas_context.fillText("\uf02e", rect.left, rect.top);

                BookKit.Annotations[cfi.cfistring].rects.push(rect);
            }
        };

        base.renderNote = function(annotation) {
            var cfi = annotation.cfi;
            var note = annotation.options.noteText;
            var style = annotation.options.noteStyle;
            var color = annotation.options.noteColor;

            if (style == 'icon') {
                // If the annotation spans more than one character, apply it
                // as a highlight as well.
                
                // var canvas_context = this.canvas.getContext('2d');
                var canvas_context = base.canvasContext();
                var columnWidth = base.presentation.actualContentWidth();
                var originalRect = cfi.ranges[0].getClientRects()[0];
                var columnNumber = base.presentation.currentContentPosition(originalRect.left);
                var left = columnWidth * columnNumber + base.options.padding;
                var rect = {
                    left: left, 
                    top: originalRect.top, 
                    right: left + originalRect.height,
                    width: originalRect.height, 
                    height: originalRect.height
                };

                canvas_context.fillStyle = base.options.colors.note[color];
                canvas_context.textAlign = 'left';
                canvas_context.textBaseline = 'top';
                // canvas_context.font = rect.height + "px FontAwesome";
                // canvas_context.fillText("\uF075", rect.left, rect.top);

                BookKit.Annotations[cfi.cfistring].rects.push(rect);
            }

        };
        
        // Redraw the entire annotation canvas.
        base.redraw = function() {
            $.each(BookKit.Annotations, function(index, annotation) {
                base.remove(annotation);
                base.render(annotation);
            });
        };

        base.render = function(annotation) {
            BookKit.Annotations[annotation.cfi.cfistring].rects = [];

            if (annotation.options.bookmark)
                base.renderBookmark(annotation);

            if (annotation.options.highlight)
                base.renderHighlight(annotation);

            if (annotation.options.note)
                base.renderNote(annotation);
        };

        remove = function(annotation) {
            // It doesn't matter whether we're removing a bookmark, note, or
            // highlight. We need to clear the canvas rects for all types.
            var rects = BookKit.Annotations[annotation.cfi.cfistring].rects;
            // var canvas_context = this.canvas.getContext('2d');
            var canvas_context = base.canvasContext();

            _.each(rects, function(rect, index, rects) {
                canvas_context.clearRect(rect.left, rect.top, rect.width, rect.height);
            });
            BookKit.Annotations[annotation.cfi.cfistring].rects = [];
        };
          
        // Initialization
        base.init = function() {
            // Use the font loader for FontAwesome, which we use for
            // annotations. We don't need to do any special success/error
            // handling (though we probably should do error handling if the
            // font fails to load) to get polyfill.
            // document.fontloader.loadFont({font: '16px FontAwesome'});
            
            $(document).on('presented', function(e, presentation) {
                base.presentation = presentation;
                base.$el = $(base.presentation.options.presentationElement);

                base.width = base.presentation.width();
                base.height = base.presentation.height();

                base.$el = $(base.presentation.options.presentationElement);

                var canvas = document.createElement("canvas");
                $(canvas).attr('id', '-BookKit-Annotation-Canvas');
                $(canvas).attr('width', base.width);
                $(canvas).attr('height', base.height);
                $(canvas).css('position', 'fixed');

                // This is webkit only.
                base.$el.css('background','-webkit-canvas(-BookKit-Annotation-Canvas) no-repeat');
                base.canvas = canvas;

                // Render existing annotations
                _.each(BookKit.Annotations, function(annotation, cfi) {
                    base.render(annotation);
                });
            });

            $(document).on('addedAnnotation', function(e, annotation) {
                base.render(annotation);
            });

            $(document).on('removedAnnotation', function(e, annotation) {
                base.remove(annotation);
            });

            $(document).on('presentationChanged', function(e) {
                base.redraw();
            });

        };

        // Run initializer
        base.init();
    };

    // Annotations HTML
    // -----------------
    // Create annotations using HTML within the DOM rather than with a
    // canvas (above).
    BookKit.Layer.HTMLAnnotations= function(options) {
        var base = this;
        
        var defaults = {

        };

        base.options = $.extend({}, defaults, options);

        // When an annotation with a note is tapped, find the bottom
        // element of the annotation, close it and open its 

        base.init = function() {
            $(document).on('presented', function(e, presentation) {
                base.presentation = presentation;
                base.$el = $(base.presentation.options.presentationElement);

            });


            $(document).on('addedAnnotation', function(e, annotation) {

            });

            $(document).on('removedAnnotation', function(e, annotation) {

            });
            
        };

        // Run initializer
        base.init();

    };
 

})();

;/*
 * BookKit JavaScript ePub3 Reader Utilities
 *
 * Copyright 2012-2014 Will Barton.
 * All rights reserved. See LICENSE for full license details.
 */ 

var BookKit = BookKit || {};

// BookKit Presentation
// ====================
// Presentation is the basis for the BookKit UI. It is a modular
// approach that seperates the UI into three logical component types:
//
//  * Presentation: Handles the content layout.
//  * Layers: Handles any UI components that are added to the page (that
//    are not part of the content).
//  * Behaviors: Handles event listeners that modify the presentation in
//    some way.
//
// There would usually only ever be one presentation object created for
// one XHTML document. That presentation object would include multiple
// layers and behaviors. 
//
// For example: the default BookKit presentation creates CSS3 columns. A
// default layer creates a canvas on which annotations are drawn.
// Default behaviors include navigation (scrolling left and right to
// previous and next columns) and highlighting (creating a new
// annotation for a selection).

(function () {

    // ## Presentation
    //
    // The base presentation. Other presentations can inherit from this
    // presentaiton with:
    //
    //    base.__proto__ = BookKit.Presentation()
    //    
    // This is a continuous vertical presentation that does not divide the
    // content into columns.
    BookKit.Presentation = function(options) {
        var base = this;

        var defaults = {
            // Horizontal padding within the viewport and between columns
            horizontalPadding: 100,

            // Vertical padding within the viewport
            verticalPadding: 100,

            // The element that will have columns and presentation attached
            presentationElement: 'body',

            // The viewport element
            viewportElement: window,

            // Duration for presentation animations
            animationDuration: 0,
            
            // Behaviors
            behaviors: {
            },
            // Presentation Layers
            layers: {
            },
        };

        base.options = $.extend(true, {}, defaults, options);
        
        base.presentationContainer = undefined;

        // ## Dimensions

        // The height of the viewport.
        base.viewportHeight = function() {
            return $(base.options.viewportElement).height();
        };

        // The absolute height of the presentation element.
        base.height = function() {
            return $(base.options.presentationElement)[0].scrollHeight;
        };

        // The height of the reader itself, within the viewport (accounts
        // for padding).
        base.innerHeight = function() {
            return parseInt(base.height() - (base.options.verticalPadding * 2));
        };

        // The width of the viewport.
        base.viewportWidth = function() {
            return base.options.viewportElement.innerWidth;
        };

        // The absolute width of the presentation element;
        base.width = function() {
            return $(base.options.presentationElement)[0].scrollWidth;
        };
          
        // The inner width of the presentation element (excluding
        // padding);
        base.innerWidth = function() {
            return base.width() - (base.options.horizontalPadding * 2);
        };

        // The width of the content, including padding. 
        base.contentHeight = function() {
            return base.height();
        },

        // The width of the content without padding. See above.
        base.innerContentHeight = function () {
            return base.innerHeight();
        };
        
        // The width of the content, including padding. 
        base.contentWidth = function() {
            return base.width();
        },

        // The width of the content without padding. See above.
        base.innerContentWidth = function () {
            return base.innerWidth();
        };
        
        // `contentWidth()` returns the suggested content width based on
        // configuration. `actualContentWidth()` returns the content
        // width after presentation. This is to get around a quirk with
        // CSS3 columns: `column-width` is merely a "hint". 
        base.actualContentWidth = function() {
            return base.width();
        };

        // A number of times the content has been divided, such as when
        // using CSS3 columns. 
        base.contentDivisions = function() {
            return 1;
        };

        // Column number for a given left offset
        base.contentPositionForOffset = function(offset) {
            return 0;
        };

        // Return the current content position based on scroll offset.
        base.currentContentPosition = function() {
            return 0;
        },

        // Returns a Javascript range for the top of the current content
        // position.
        base.rangeForCurrentContentPosition = function() {
            var columnNumber = base.currentColumnNumber();
            var range = document.caretRangeFromPoint(columnNumber, 0);
            return range;
        };

        // Initialization
        base.init = function() {
            $(document).on('ready', function() {
                // Add a container for presentation-layer elements to the BOTTOM
                // of the body (bottom so we don't interfere with any CFIs)
                base.presentationContainer = document.createElement("div");
                $(base.presentationContainer).attr('id', '-BookKit-Presentation');
                $(base.presentationContainer).appendTo(
                    base.options.presentationElement);

                var $el = $(base.options.presentationElement);
                $el.css('margin', 0);
                $el.css('padding-top', base.options.verticalPadding);
                $el.css('padding-bottom', base.options.verticalPadding);
                $el.css('padding-left', base.options.horizontalPadding);
                $el.css('padding-right', base.options.horizontalPadding);
                $el.css('height', base.innerHeight());
                $el.css('width', base.innerWidth());

                $(document).trigger('presented', [base]);
            }.bind(base));

            $(window).resize();
        };

        // Run initializer
        base.init();
    };

    // ## ColumnedPresentation
    //
    // A presentation that divides the content into CSS3 columns.
    // ## ColumnedPresentation
    //
    // A presentation that divides the content into CSS3 columns.
    BookKit.ColumnedPresentation = function(options) {
        // basic presentation inheritance
        var base = this;
        var _super = new BookKit.Presentation(options);
        base = $.extend(true, _super, base);

        var defaults = {
            // Number of columns in the viewport
            columns: 1,

            // Number of columns to scroll when moving to next "page"
            columnsToScroll: 1,

            // Column to start at
            columnToStart: 0,

            // Behaviors
            behaviors: {
            },
        };

        base.options = $.extend(true, _super.options, defaults, options);

        // ## Dimensions

        // The absolute height of the presentation element.
        base.height = function() {
            return base.viewportHeight();
        };

        // The height of the reader itself, within the viewport (accounts
        // for padding).
        base.innerHeight = function() {
            return parseInt(base.height() - (base.options.verticalPadding * 2));
        };
        
        // The width of the viewport containing the content.
        base.viewportWidth = function() {
            var width = base.options.viewportElement.innerWidth;
            return width;
        };

        // The absolute width of the presentation element;
        base.width = function() {
            return $(base.options.presentationElement)[0].scrollWidth;
        };
          
        // The inner width of the presentation element (excluding
        // padding);
        base.innerWidth = function() {
            return base.width() - (base.options.horizontalPadding * 2);
        };
          
        // The width of the content, including padding. 
        base.contentHeight = function() {
            return base.height();
        },

        // The width of the content without padding. See above.
        base.innerContentHeight = function () {
            return base.innerHeight();
        };
        
        // The width of the content, including padding. This is not the
        // same as `width()`, as the content is paginated with CSS3
        // columns.
        base.contentWidth = function() {
            return parseInt(base.viewportWidth()/base.options.columns);
        },

        // The width of the content without padding. See above.
        base.innerContentWidth = function () {
            return parseInt(base.contentWidth() - base.options.horizontalPadding * 2);
        };

        // `contentWidth()` returns the suggested content width based on
        // configuration. `actualContentWidth()` returns the content
        // width after presentation. This is to get around a quirk with
        // CSS3 columns: `column-width` is merely a "hint". 
        base.actualContentWidth = function() {
            // An approximate column number for our actual width calculation
            var columnsNumber = Math.floor(
                (base.width() - base.options.horizontalPadding)/
                (base.contentWidth())
            );
            if (isNaN(columnsNumber) || columnsNumber < 1) 
                columnsNumber = 1;

            var actualWidth = $(base.options.presentationElement)[0].scrollWidth / columnsNumber;
            return Math.ceil(actualWidth);
        };

        // A number of times the content has been divided, such as when
        // using CSS3 columns. 
        base.contentDivisions = function() {
            var columnsNumber = Math.floor(
                (base.width() - base.options.horizontalPadding)/
                (base.actualContentWidth())
            );
            if (isNaN(columnsNumber) || columnsNumber < 1) 
                columnsNumber = 1;
            return columnsNumber;
        };

        // Column number for a given left offset
        base.contentPositionForOffset = function(offset) {
            var columnWidth = base.contentWidth();
            var columnNumber = parseInt(offset / columnWidth);
            return columnNumber;
        };

        // Return the current content position based on scroll offset.
        base.currentContentPosition = function() {
            var leftPosition = $(base.options.presentationElement).scrollLeft();
            var columnNumber = base.contentPositionForOffset(leftPosition);
            return Math.ceil(columnNumber);
        },

        // ## Columns
        setColumnSizes = function() {
            var $el = $(base.options.presentationElement);
            var height = base.innerHeight();
            var column_gap = base.options.horizontalPadding * 2;
            var column_width = base.innerContentWidth();

            $el.css('overflow', 'hidden');
            $el.css('margin', 0);
            $el.css('padding-top', base.options.verticalPadding);
            $el.css('padding-bottom', base.options.verticalPadding);
            $el.css('padding-left', base.options.horizontalPadding);
            $el.css('padding-right', base.options.horizontalPadding);
            $el.css('height', height + 'px');
            $el.css('-webkit-column-width', column_width + 'px');
            $el.css('-webkit-column-gap', column_gap + 'px');
            $el.css('-webkit-column-rule',  '1px outset #eeeeee');
            $el.css('width', base.innerWidth());

            $(document).trigger('presented', [base]);
        };

        // ## Initialization

        // Initialization
        base.init = function() {

            $(document).on('ready', function() {
                // Add a container for presentation-layer elements to the BOTTOM
                // of the body (bottom so we don't interfere with any CFIs)
                base.presentationContainer = document.createElement("div");
                $(base.presentationContainer).attr('id', '-BookKit-Presentation');
                $(base.presentationContainer).appendTo(
                    base.options.presentationElement);

                // CSS adjustments that are relevent to pagination
                $(document).ready(setColumnSizes);
            }.bind(base));

            $(window).resize(setColumnSizes);
        };

        // Run initializer
        base.init();
    };

})();



;// https://gist.github.com/simonsmith/5135933
!function(global) {
    function definition($) {
        $.fn.measure = function(fn) {
            var clone = $(this).clone(), result;
 
            clone.css({
                visibility: 'hidden',
                position: 'absolute'
            });
            clone.appendTo(document.body);
 
            if (typeof fn == 'function') {
                result = fn.apply(clone);
            }
            clone.remove();
 
            return result;
        };
    }
 
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], definition);
    } else {
        definition(global.jQuery);
    }
}(this);
