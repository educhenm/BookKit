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
    BookKit.Layer.AnnotationCanvass = function(options) {
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

        canvasContext = function() {
            var canvas_context = document.getCSSCanvasContext('2d', 
                '-BookKit-Annotation-Canvas', base.width, base.height);
            return canvas_context;
        };

        renderHighlight = function(annotation) {
            var cfi = annotation.cfi;
            var style = annotation.options.highlightStyle;
            var color = annotation.options.highlightColor;
            var canvas_context = canvasContext();

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

        renderBookmark = function(annotation) {
            var cfi = annotation.cfi;
            var style = annotation.options.bookmarkStyle;
            var color = annotation.options.bookmarkColor;

            if (style == 'icon') {
                // If we're to show the bookmark, add some content to the
                // anchor and style and position it appropriately. 
                // var canvas_context = this.canvas.getContext('2d');
                var canvas_context = canvasContext();
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
                canvas_context.font = originalRect.height + "px FontAwesome";
                canvas_context.fillText("\uf02e", rect.left, rect.top);

                BookKit.Annotations[cfi.cfistring].rects.push(rect);
            }
        };

        renderNote = function(annotation) {
            var cfi = annotation.cfi;
            var note = annotation.options.noteText;
            var style = annotation.options.noteStyle;
            var color = annotation.options.noteColor;

            if (style == 'icon') {
                // If the annotation spans more than one character, apply it
                // as a highlight as well.
                
                // var canvas_context = this.canvas.getContext('2d');
                var canvas_context = canvasContext();
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
                canvas_context.font = rect.height + "px FontAwesome";
                canvas_context.fillText("\uF075", rect.left, rect.top);

                BookKit.Annotations[cfi.cfistring].rects.push(rect);
            }

        };
        
        // Redraw the entire annotation canvas.
        refresh = function() {
            // $('body').css({'background-image':"url(" + this.canvas.toDataURL("image/png")+ ")" });
        };

        render = function(annotation) {
            BookKit.Annotations[annotation.cfi.cfistring].rects = [];

            if (annotation.options.bookmark)
                renderBookmark(annotation);

            if (annotation.options.highlight)
                renderHighlight(annotation);

            if (annotation.options.note)
                renderNote(annotation);
        };

        base.remove = function(annotation) {
            // It doesn't matter whether we're removing a bookmark, note, or
            // highlight. We need to clear the canvas rects for all types.
            var rects = BookKit.Annotations[cfi.cfistring].rects;
            // var canvas_context = this.canvas.getContext('2d');
            var canvas_context = canvasContext();

            _.each(rects, function(rect, index, rects) {
                canvas_context.clearRect(rect.left, rect.top, rect.width, rect.height);
            });
            BookKit.Annotations[cfi.cfistring].rects = [];
        };
          
        // Initialization
        base.init = function() {
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
                refresh();

                // Render existing annotations
                _.each(BookKit.Annotations, function(annotation, cfi) {
                    render(annotation);
                    refresh();
                });
            });

            $(document).on('addedAnnotation', function(e, annotation) {
                render(annotation);
                refresh();
            });

            $(document).on('removedAnnotation', function(e, annotation) {
                remove(annotation);
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

