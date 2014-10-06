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

    initialize: function() {
        this.$el = $(BookKit.Config.Presentation.presentationElement);

        $(document).on('presented', function() {
            this.set('width', BookKit.Presentation.width());
            this.set('height', BookKit.Presentation.viewportHeight());

            this.$el = $(BookKit.Config.Presentation.presentationElement);

            var canvas = document.createElement("canvas");
            $(canvas).attr('id', '-BookKit-Annotation-Canvas');
            $(canvas).attr('width', this.get('width'));
            $(canvas).attr('height', this.get('height'));
            $(canvas).css('position', 'fixed');

            // This is webkit only.
            this.$el.css('background', '-webkit-canvas(-BookKit-Annotation-Canvas) no-repeat');

            this.canvas = canvas;
            this.refresh();

            // Render existing annotations
            _.each(BookKit.Annotations, function(annotation, cfi) {
                this.render(annotation);
                this.refresh();
            }.bind(this));
        }.bind(this));

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
        BookKit.Annotations[annotation.cfi.cfistring].rects = [];

        if (annotation.options.bookmark)
            this.renderBookmark(annotation);

        if (annotation.options.highlight)
            this.renderHighlight(annotation);

        if (annotation.options.note)
            this.renderNote(annotation);
    },

    remove: function(annotation) {
        // It doesn't matter whether we're removing a bookmark, note, or
        // highlight. We need to clear the canvas rects for all types.
        var rects = BookKit.Annotations[cfi.cfistring].rects;
        // var canvas_context = this.canvas.getContext('2d');
        var canvas_context = this.canvasContext();

        _.each(rects, function(rect, index, rects) {
            canvas_context.clearRect(rect.left, rect.top, rect.width, rect.height);
        });
        BookKit.Annotations[cfi.cfistring].rects = [];
    },

    renderHighlight: function(annotation) {
        var cfi = annotation.cfi;
        var style = annotation.options.highlightStyle;
        var color = annotation.options.highlightColor;
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
                var left_offset = this.$el.scrollLeft();
                var top_offset = this.$el.scrollTop();
                canvas_context.fillRect(rect.left + left_offset, rect.top + top_offset, 
                    rect.width, rect.height);
                BookKit.Annotations[cfi.cfistring].rects.push(rect);
            }, this);
        }, this);
    },

    renderBookmark: function(annotation) {
        var cfi = annotation.cfi;
        var style = annotation.options.bookmarkStyle;
        var color = annotation.options.bookmarkColor;

        if (style == BookKit.Constants.BKAnnotationStyleIcon) {
            // If we're to show the bookmark, add some content to the
            // anchor and style and position it appropriately. 
            // var canvas_context = this.canvas.getContext('2d');
            var canvas_context = this.canvasContext();
            var columnWidth = BookKit.Presentation.actualColumnWidth();
            var originalRect = cfi.ranges[0].getClientRects()[0];
            var columnNumber = BookKit.Presentation.columnNumberForPosition(originalRect.left);
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

            BookKit.Annotations[cfi.cfistring].rects.push(rect);
        }
    },

    renderNote: function(annotation) {
        var cfi = annotation.cfi;
        var note = annotation.options.noteText;
        var style = annotation.options.noteStyle;
        var color = annotation.options.noteColor;

        if (style == BookKit.Constants.BKAnnotationStyleIcon) {
            // If the annotation spans more than one character, apply it
            // as a highlight as well.
            
            // var canvas_context = this.canvas.getContext('2d');
            var canvas_context = this.canvasContext();
            var columnWidth = BookKit.Presentation.actualColumnWidth();
            var originalRect = cfi.ranges[0].getClientRects()[0];
            var columnNumber = BookKit.Presentation.columnNumberForPosition(originalRect.left);
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

            BookKit.Annotations[cfi.cfistring].rects.push(rect);
        }

    },

});


// BookKit Presentation Instance Methods
// =====================================
_.extend(BookKit.Presentation.prototype, BookKit.BaseClass.prototype, {
    defaults: {
        behaviors: {
            navigation: new BookKit.Behaviors.Navigate(),
            highlights: new BookKit.Behaviors.HighlightImmediately(),
        },
        presentations: {
            // pagination: new BookKit.Presentation.Paginate(),
            annotation: new BookKit.Presentation.Annotate(),
        }
    },

    // annotationCanvas: new AnnotationCanvas(),
    presentationContainer: undefined,

    behaviors: {},
    presentations: {},

    initialize: function() {
        $(document).on('ready', function() {
            // Use the font loader for FontAwesome, which we use for
            // annotations. We don't need to do any special success/error
            // handling (though we probably should do error handling if the
            // font fails to load) to get polyfill.
            document.fontloader.loadFont({font: '16px FontAwesome'});

            // Add a container for presentation-layer elements to the BOTTOM
            // of the body (bottom so we don't interfere with any CFIs)
            this.presentationContainer = document.createElement("div");
            $(this.presentationContainer).attr('id', '-BookKit-Presentation');
            $(this.presentationContainer).appendTo(BookKit.Config.Presentation.presentationElement);

            // CSS adjustments that are relevent to pagination
            $(document).ready(this.setColumnSizes);
        }.bind(this));

        $(window).resize(this.setColumnSizes);

    },

    setColumnSizes: function() {
        var $el = $(BookKit.Config.Presentation.presentationElement);
        var height = BookKit.Presentation.height();
        var column_gap = BookKit.Config.Presentation.horizontalPadding * 2;
        var column_width = BookKit.Presentation.innerColumnWidth();

        $el.css('overflow', 'hidden');
        $el.css('margin', 0);
        $el.css('padding-top', BookKit.Config.Presentation.verticalPadding);
        $el.css('padding-bottom', BookKit.Config.Presentation.verticalPadding);
        $el.css('padding-left', BookKit.Config.Presentation.horizontalPadding);
        $el.css('padding-right', BookKit.Config.Presentation.horizontalPadding);
        $el.css('height', height + 'px');
        $el.css('-webkit-column-width', column_width + 'px');
        $el.css('-webkit-column-gap', column_gap + 'px');
        $el.css('-webkit-column-rule',  '1px outset #eeeeee');
        $el.css('width', BookKit.Presentation.width());

        $(document).trigger('presented');

    },

});
// Helpful class methods
_.extend(BookKit.Presentation, {
    // The height of the viewport.
    viewportHeight: function() {
        return $(BookKit.Config.Presentation.viewportElement).height();
    },

    // The height of the reader itself, within the viewport (accounts
    // for padding).
    height: function() {
        return parseInt(BookKit.Presentation.viewportHeight() - 
                (BookKit.Config.Presentation.verticalPadding * 2));
    },

    // The width of the viewport containing the content.
    viewportWidth: function() {
        // XXX: Why are these different?
        var width = BookKit.Config.Presentation.viewportElement.innerWidth;
        // var width = $(BookKit.Config.Presentation.viewportElement).innerWidth();
        return width;
    },
      
    // The total width of the content — this is the scroll width of the
    // content-holding element.
    width: function() {
        return $(BookKit.Config.Presentation.presentationElement)[0].scrollWidth + 
                BookKit.Config.Presentation.horizontalPadding;
    },

    // The total width of a column including the gaps.
    columnWidth: function() {
        return parseInt(BookKit.Presentation.viewportWidth()/BookKit.Config.Presentation.columns);
        // return parseInt(BookKit.Presentation.viewportWidth()/BookKit.Config.Presentation.columns) + 4;
    },

    // The width of a column without the gaps
    innerColumnWidth: function () {
        return parseInt(BookKit.Presentation.columnWidth() - 
                BookKit.Config.Presentation.horizontalPadding * 2);
    },

    // CSS3 column-width is merely a "hint" according to MDN. This gets
    // our actual column width after the columns have been set up.
    actualColumnWidth: function() {
        // An approximate column number for our actual width calculation
        var columnsNumber = Math.floor(
            (BookKit.Presentation.width() - BookKit.Config.Presentation.horizontalPadding)/
            (BookKit.Presentation.columnWidth())
        );
        if (isNaN(columnsNumber) || columnsNumber < 1) 
            columnsNumber = 1;

        var actualWidth = $(BookKit.Config.Presentation.presentationElement)[0].scrollWidth / columnsNumber;
        return Math.ceil(actualWidth);
    },

    // Total number of columns (based on actual column width rather than
    // the css3 column-width hint).
    totalColumns: function() {
        var columnsNumber = Math.floor(
            (BookKit.Presentation.width() - BookKit.Config.Presentation.horizontalPadding)/
            (BookKit.Presentation.actualColumnWidth())
        );
        if (isNaN(columnsNumber) || columnsNumber < 1) 
            columnsNumber = 1;
        return columnsNumber;
    },

    // Column number for a given left offset
    columnNumberForPosition: function(left) {
        var columnWidth = BookKit.Presentation.columnWidth();
        var columnNumber = parseInt(left / columnWidth);
        return columnNumber;
    },

    // Return the current column number in view
    currentColumnNumber: function(columnElm) {
        var leftPosition = $(BookKit.Config.Presentation.presentationElement).scrollLeft();
        var columnNumber = BookKit.Presentation.columnNumberForPosition(leftPosition);
        return Math.ceil(columnNumber);
    },

    // Returns a Javascript range for the top of the current column
    rangeForCurrentColumn: function() {
        var columnNumber = BookKit.Presentation.currentColumnNumber();
        var range = document.caretRangeFromPoint(columnNumber, 0);
        return range;
    },

});

