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


// BookKit Presentation
// ====================
var Presentation = BookKit.Presentation = function(attributes) {
    BookKit.BaseClass.apply(this, arguments);
};

// BookKit Pagination Presentation
// ===========================
// Set up a "page" using columns. Goes along with
// BookKit.Behavior.Navigation for navigating the columns.
var Paginate = BookKit.Presentation.Paginate = function(attributes) {
    BookKit.BaseClass.apply(this, arguments);
};
_.extend(BookKit.Presentation.Paginate.prototype, BookKit.BaseClass.prototype, {
    defaults: {
        verticalPadding: 100,
        horizontalPadding: 200,
    },
    
    presentation: undefined,

    initialize: function(presentation) {
        this.presentation = presentation;

        // CSS adjustments that are relevent to pagination
        // $('body').css('overflow', 'hidden');
        $('body').css('margin', 0);
        $('body').css('padding', 
            this.get('verticalPadding') + 'px ' + 
            this.get('horizontalPadding') + 'px');
        $('body').css('-webkit-column-gap', 
            (this.get('horizontalPadding') * 2) +'px');
        $('body').css('height', 
            $(window).innerHeight() - (this.get('verticalPadding') * 2) + 'px');
        $('body').css('-webkit-column-width', 
            $(window).innerWidth() - this.get('horizontalPadding') + 'px');

    },

});


// Annotation Canvas
// -----------------
// The annotation canvas handles the drawing of annotations. Highlights
// are actually drawn on an HTML5 canvas element (rather than inline in
// the HTML, potentially complicating our resolution of new CFIs).
var Annotate = BookKit.Presentation.Annotate = function(attributes) {
    BookKit.BaseClass.apply(this, arguments);
};
_.extend(BookKit.Presentation.Annotate.prototype, BookKit.BaseClass.prototype, {
    defaults: {
        width: null,
        height: null,
    },

    canvas: undefined,

    // Mouse event handling
    mouseIsDown: false,
    mousePosition: {},

    presentation: undefined,
    
    initialize: function(presentation) {
        this.set('width', $('body')[0].scrollWidth);
        this.set('height', $('body')[0].scrollHeight);

        var canvas = document.createElement("canvas");
        $(canvas).attr('id', '-BookKit-Annotation-Canvas');
        $(canvas).attr('width', this.get('width'));
        $(canvas).attr('height', this.get('height'));
        $(canvas).css('position', 'fixed');

        // This is webkit only.
        $('body').css('background', '-webkit-canvas(-BookKit-Annotation-Canvas) no-repeat');

        this.canvas = canvas;
        this.refresh();

        $(document).on('addedAnnotation', function(e, annotation) {
            this.render(annotation);
            this.refresh();
        }.bind(this));

        $(document).on('removedAnnotation', function(e, annotation) {
            this.remove(annotation);
        }.bind(this));

    },

    canvasContext: function() {
        var canvas_context = document.getCSSCanvasContext('2d', '-BookKit-Annotation-Canvas', this.get('width'), this.get('height'));
        return canvas_context;
    },

    // Redraw the entire annotation canvas.
    refresh: function() {
        // $('body').css({'background-image':"url(" + this.canvas.toDataURL("image/png")+ ")" });
    },

    render: function(annotation) {
        BookKit.Annotations[annotation.get("cfi").get("cfi")].rects = [];

        if (annotation.get("bookmark"))
            this.renderBookmark(annotation);

        if (annotation.get("highlight"))
            this.renderHighlight(annotation);

        if (annotation.get("note"))
            this.renderNote(annotation);
    },

    remove: function(annotation) {
        // It doesn't matter whether we're removing a bookmark, note, or
        // highlight. We need to clear the canvas rects for all types.
        var rects = BookKit.Annotations[cfi.get("cfi")].rects;
        // var canvas_context = this.canvas.getContext('2d');
        var canvas_context = this.canvasContext();

        _.each(rects, function(rect, index, rects) {
            canvas_context.clearRect(rect.left, rect.top, rect.width, rect.height);
        });
        BookKit.Annotations[cfi.get("cfi")].rects = [];
    },

    renderHighlight: function(annotation) {
        var cfi = annotation.get("cfi");
        var style = annotation.get("highlightStyle");
        var color = annotation.get("highlightColor");
        // var canvas_context = this.canvas.getContext('2d');
        var canvas_context = this.canvasContext();

        _.each(cfi.ranges, function(range, index, ranges) {
            _.each(range.getClientRects(), function(rect, index, rects) {
                if (style == BookKit.Constants.BKAnnotationStyleHighlight) {
                    canvas_context.fillStyle = BookKit.Config.Colors.Highlight[color];
                }
                if (style == BookKit.Constants.BKAnnotationStyleUnderline) {
                    var top = rect.top + rect.height - BookKit.Config.Annotations.underlineThickness;
                    canvas_context.fillStyle = BookKit.Config.Colors.Underline[color];
                    rect.top = top;
                    rect.height = BookKit.Config.Annotations.underlineThickness;
                }

                // Fill the rect.
                var left_offset = $('body')[0].scrollLeft;
                var top_offset = $('body')[0].scrollTop;
                canvas_context.fillRect(rect.left + left_offset, rect.top + top_offset, 
                    rect.width, rect.height);
                BookKit.Annotations[cfi.get("cfi")].rects.push(rect);
            }, this);
        }, this);
    },

    renderBookmark: function(annotation) {
        var cfi = annotation.get("cfi");
        var style = annotation.get("bookmarkStyle");
        var color = annotation.get("bookmarkColor");

        if (style == BookKit.Constants.BKAnnotationStyleIcon) {
            // If we're to show the bookmark, add some content to the
            // anchor and style and position it appropriately. 
            // var canvas_context = this.canvas.getContext('2d');
            var canvas_context = this.canvasContext();
            var columnWidth = $(window).innerWidth();
            var originalRect = cfi.ranges[0].getClientRects()[0];
            var columnNumber = BookKit.Utils.columnNumberForPosition(originalRect.left);
            var left = columnWidth * columnNumber + BookKit.Config.Annotations.padding;
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
            canvas_context.font = originalRect.height + "px FontAwesome";
            canvas_context.fillText("\uf02e", rect.left, rect.top);

            BookKit.Annotations[cfi.get("cfi")].rects.push(rect);
        }
    },

    renderNote: function(annotation) {
        var cfi = annotation.get("cfi");
        var note = annotation.get("noteText");
        var style = annotation.get("noteStyle");
        var color = annotation.get("noteColor");

        if (style == BookKit.Constants.BKAnnotationStyleIcon) {
            // If the annotation spans more than one character, apply it
            // as a highlight as well.
            
            // var canvas_context = this.canvas.getContext('2d');
            var canvas_context = this.canvasContext();
            var columnWidth = $(window).innerWidth();
            var originalRect = cfi.ranges[0].getClientRects()[0];
            var columnNumber = BookKit.Utils.columnNumberForPosition(originalRect.left);
            var left = columnWidth * columnNumber + BookKit.Config.Annotations.padding;
            var rect = {
                left: left, 
                top: originalRect.top, 
                right: left + originalRect.height,
                width: originalRect.height, 
                height: originalRect.height
            };

            canvas_context.fillStyle = BookKit.Config.Colors.Highlight[color];
            canvas_context.textAlign = 'left';
            canvas_context.textBaseline = 'top';
            canvas_context.font = rect.height + "px FontAwesome";
            canvas_context.fillText("\uF075", rect.left, rect.top);

            BookKit.Annotations[cfi.get("cfi")].rects.push(rect);
        }

    },

});


// BookKit Presentation
// ====================
_.extend(BookKit.Presentation.prototype, BookKit.BaseClass.prototype, {
    defaults: {
        behaviors: {
            navigation: BookKit.Behaviors.Navigate,
            highlights: BookKit.Behaviors.HighlightImmediately,
        },
        presentations: {
            pagination: BookKit.Presentation.Paginate,
            annotation: BookKit.Presentation.Annotate,
        }
    },

    // annotationCanvas: new AnnotationCanvas(),
    presentationContainer: undefined,

    behaviors: {},
    presentations: {},

    initialize: function() {
        // Use the font loader for FontAwesome, which we use for
        // annotations. We don't need to do any special success/error
        // handling (though we probably should do error handling if the
        // font fails to load) to get polyfill.
        document.fontloader.loadFont({font: ' 16px FontAwesome'});

        // Add a container for presentation-layer elements to the BOTTOM
        // of the body (bottom so we don't interfere with any CFIs)
        this.presentationContainer = document.createElement("div");
        $(this.presentationContainer).attr('id', '-BookKit-Presentation');
        $(this.presentationContainer).appendTo('body');

        _.each(this.get('presentations'), function(value, key) {
            this.presentations[key] = new value(this);
        }.bind(this));
        
        _.each(this.get('behaviors'), function(value, key) {
            this.behaviors[key] = new value(this);
        }.bind(this));

    },

});


