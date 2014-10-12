/*
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

