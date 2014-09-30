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

BookKit.Behaviors = {};

// BookKit Navigation Behavior
// ===========================
// Set up a "page" using columns, scroll to a specific "page" offset
// (optionally), and configure navigation elements.
var Navigate = BookKit.Behaviors.Navigate = function(attributes) {
    BookKit.BaseClass.apply(this, arguments);
};
_.extend(BookKit.Behaviors.Navigate.prototype, BookKit.BaseClass.prototype, {
    defaults: {
        page: 5,
        horizontal: true,
    },
    
    presentation: undefined,

    initialize: function(presentation) {
        this.presentation = presentation;

        // Window load offset scrolling
        $(document).ready(function(e) {
            console.log("scroll on load");
            this.scrollTo(this.get('page'));
        }.bind(this));

        // Keyboard left/right navigation
        $(document).keydown(function(e) {
          if(e.keyCode == 37) {
              console.log("previous");
              this.previousPage();
          } else if(e.keyCode == 39) {
              console.log("next");
              this.nextPage();
          }
        }.bind(this));

        // Keyboard up/down navigation
        // Swipe left/right navigation
    },

    nextPage: function() {
        var current_page = BookKit.Utils.currentColumnNumber();
        var total_pages = BookKit.Utils.totalColumns();
        var next_page = current_page + 1;
        if (next_page <= total_pages) {
            console.log("scrolling to next", next_page, total_pages);
            this.scrollTo(next_page);
        }
    },

    previousPage: function() {
        var current_page = BookKit.Utils.currentColumnNumber();
        var prev_page = current_page - 1;
        if (prev_page >= 0) {
            console.log("scrolling to prev", prev_page);
            this.scrollTo(prev_page);
        }
    },

    scrollTo: function(page) {
        // Scroll to the appropriate page
        var offset = page * $(window).innerWidth();

        if (this.get('horizontal')) {
            setTimeout(function() {
              $('body').scrollLeft(offset);
              $('body').css('display', 'block');
            }, 50);
        } else {
          $('body').scrollTop(offset);
        }
    },

});

// BookKit Highlight Immediately Behavior
// ====================
// This is a behavior for highlighting immediately upon a selection,
// iBooks-style.
var HighlightImmediately = BookKit.Behaviors.HighlightImmediately = function(attributes) {
    BookKit.BaseClass.apply(this, arguments);
};
_.extend(BookKit.Behaviors.HighlightImmediately.prototype, BookKit.BaseClass.prototype, {
    defaults: {
        duration: 0,
    },

    presentation: undefined,

    initialize: function(presentation) {
        this.presentation = presentation;
        $('body').on('mouseup', function(e) {
            var cfi = BookKit.CFI.selectionCFI();
            console.log("Highlight Immediately Behavior", cfi);
            window.getSelection().removeAllRanges();
            BookKit.Annotation.addAnnotation(cfi, 
                {
                    highlight: cfi,
                    highlightStyle: BookKit.Constants.BKAnnotationStyleHighlight,
                    highlightColor: BookKit.Constants.BKAnnotationColorBlue
                });
        });
    },

});



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

