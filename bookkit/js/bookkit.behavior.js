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
            console.log("base.presentation", base.presentation);
            var current_column = base.presentation.currentContentPosition();
            var total_columns = base.presentation.contentDivisions();
            var next_column = current_column + base.options.columnsToScroll;
            console.log(current_column, total_columns, next_column);
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
            $(document).on('presented', function(e) {
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
            $(document).on('presented', function() {
                $(base.presentation.options.presentationElement).on('mouseup', function(e) {
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

        // When an annotation with a note is tapped, find the bottom
        // element of the annotation, close it and open its 

        base.init = function() {
            $(document).on('presented', function() {
                $(base.presentation.options.presentationElement).on('click', function(e) {
                    console.log("clicked");

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

