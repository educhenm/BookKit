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

/* 
 * The Annotation model corrosponds to notes, bookmarks, and higlights
 * which are subsequently drawn (if done so using BookKit) using an
 * AnnotationCanvas. 
 *
 * Annotation Types:
 *    BKAnnotationTypeBookmark
 *    BKAnnotationTypeHighlight
 *    BKAnnotationTypeNote
 *
 * Annotation Styles (not valid for all types):
 *    BKAnnotationStyleIcon (Bookmark and Note types)
 *    BKAnnotationStyleHighlight (Highlight type)
 *    BKAnnotationStyleUnderline (Highlight type)
 *    BKAnnotationStyleInline (Note type)
 *
 * Annotaton Colors (different effects per type, nothing for bookmarks)
 *    BKAnnotationColorYellow
 *    BKAnnotationColorPink
 *    BKAnnotationColorRed
 *    BKAnnotationColorPurple
 *    BKAnnotationColorBlue
 *    BKAnnotationColorGreen
 *    BKAnnotationColorBlack (Underline & Note only)
 *
 */

var Annotation = BookKit.Annotation = function(attributes) {
    BookKit.BaseClass.apply(this, arguments);
};
_.extend(BookKit.Annotation.prototype, BookKit.BaseClass.prototype, {
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
    },

    pixelRects: function() {
        var cfi = this.get("cfi");
        var rects = [];
        _.each(cfi.ranges, function(range, index, ranges) {
            _.each(range.getClientRects(), function(rect, index, rects) {
                console.log(rect);
                rects.push(rect);
            }, this);
        }, this);
        return rects;
    },

});

var AnnotationCanvas = BookKit.AnnotationCanvas = function(attributes) {
    BookKit.BaseClass.apply(this, arguments);
};
_.extend(BookKit.AnnotationCanvas.prototype, BookKit.BaseClass.prototype, {
    annotations: {},
    canvas: undefined,
    
    initialize: function() {
        var canvas = document.createElement("canvas");
        $(canvas).attr('id', '-BookKit-Annotation-Canvas');
        $(canvas).attr('width', $(window).innerWidth());
        $(canvas).attr('height', $(window).innerHeight());
        $(canvas).css('position', 'fixed');
        $(canvas).appendTo('--BookKit-Annotations');

        var annotationsContainer = document.createElement("div");
        $(annotationsContainer).attr('id', '-BookKit-Annotations');
        $(annotationsContainer).appendTo('body');

        this.canvas = canvas;
        this.el = annotationsContainer;
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

        // console.log("annotation", annotation, cfi.get("cfi"));

        this.annotations[cfi] = { annotation: annotation, rects: [] };
        this.apply(annotation);
        this.refresh();
        console.log("Done drawing", cfi.get("cfi"));
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

        /*
        _.each(annotation.pixelRects(), function(rect, index, rects) {
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
        */

        _.each(cfi.ranges, function(range, index, ranges) {
            // console.log("highlight range", range.startContainer, range.endContainer);
            _.each(range.getClientRects(), function(rect, index, rects) {
                // console.log(rect, index, rects);
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
        var cfi = annotation.get("cfi");
        var style = annotation.get("style");
        // console.log("applying bookmark");

        if (style == BookKit.Constants.BKAnnotationStyleIcon) {
            // If we're to show the bookmark, add some content to the
            // anchor and style and position it appropriately. 
            var canvas_context = this.canvas.getContext('2d');
            var columnWidth = $(window).innerWidth();
            var rect = cfi.ranges[0].getClientRects()[0];
            var columnNumber = BookKit.Utils.columnNumberForPosition(rect.left);
            var left = columnWidth * columnNumber + BookKit.Config.Annotations.padding;
            var top = rect.top; // + BookKit.Config.Annotations.padding;

            canvas_context.fillStyle = "#000000";
            canvas_context.textAlign = 'left';
            canvas_context.fillText("B", left, top);
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

        console.log("note cfi", cfi.get("cfi"));

        if (style == BookKit.Constants.BKAnnotationStyleInline) {
            // Insert the note inline into the HTML at the end of the
            // CFI
            var range = _.last(cfi.ranges);
            range.collapse(false);

            // var newRange = document.createRange();
            // newRange.setStart(lastRange.endContainer, lastRange.endOffset);
            // newRange.setEnd(lastRange.endContainer, lastRange.endOffset);
            // console.log("new range", newRange);

            console.log("range", range);

            var noteElement = document.createElement("div");
            $(noteElement).attr('class', '-BookKit-Annotations');
            $(noteElement).attr('id', '-BookKit-Annotations-' + 
                BookKit.Utils.makeSafeForCSS(cfi.get('cfi')))
            $(noteElement).css('font-family', BookKit.Config.Annotations.noteFont);

            // Disable selection of the note element
            $(noteElement).attr('unselectable','on')
                .css({'-moz-user-select':'-moz-none',
                      '-moz-user-select':'none',
                      '-o-user-select':'none',
                      '-khtml-user-select':'none',
                      '-webkit-user-select':'none',
                      '-ms-user-select':'none',
                      'user-select':'none'})
                .bind('selectstart', function() { return false; })
                .bind('mouseup', function() { return false; });

            $(noteElement).html(note);
            range.insertNode(noteElement);
        } 

        if (style == BookKit.Constants.BKAnnotationStyleIcon) {
            var canvas_context = this.canvas.getContext('2d');
            var columnWidth = $(window).innerWidth();
            var rect = cfi.ranges[0].getClientRects()[0];
            var columnNumber = BookKit.Utils.columnNumberForPosition(rect.left);
            var left = columnWidth * columnNumber + BookKit.Config.Annotations.padding;
            var top = rect.top; // + BookKit.Config.Annotations.padding;

            canvas_context.fillStyle = BookKit.Config.Colors.Highlight[color];
            canvas_context.textAlign = 'left';
            canvas_context.fillText("N", left, top);
        }

    },

    removeNote: function(annotation) {

    }
   
});



