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

// Annotation Model
// ----------------
// The Annotation model corrosponds to notes, bookmarks, and higlights
// which are subsequently drawn (if done so using BookKit) using an
// AnnotationCanvas. 
var Annotation = BookKit.Annotation = function(attributes) {
    BookKit.BaseClass.apply(this, arguments);
};
_.extend(BookKit.Annotation.prototype, BookKit.BaseClass.prototype, {
    defaults: {
        cfi: null,
        bookmark: false,
        bookmarkStyle: BookKit.Constants.BKAnnotationStyleNone,
        bookmarkColor: BookKit.Constants.BKAnnotationColorNone,

        highlight: false,
        highlightStyle: BookKit.Constants.BKAnnotationStyleNone,
        highlightColor: BookKit.Constants.BKAnnotationColorNone,

        note: false,
        noteStyle: BookKit.Constants.BKAnnotationStyleNone,
        noteColor: BookKit.Constants.BKAnnotationColorNone,
        noteText: "",
    },

    cfi: undefined,
    rects: [],

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
                rects.push(rect);
            }, this);
        }, this);
        return rects;
    },

});

// Annotation Canvas
// -----------------
// The annotation canvas handles the drawing of annotations. Highlights
// are actually drawn on an HTML5 canvas element (rather than inline in
// the HTML, potentially complicating our resolution of new CFIs).
var AnnotationCanvas = BookKit.AnnotationCanvas = function(attributes) {
    BookKit.BaseClass.apply(this, arguments);
};
_.extend(BookKit.AnnotationCanvas.prototype, BookKit.BaseClass.prototype, {
    annotations: {},
    canvas: undefined,

    // Mouse event handling
    mouseIsDown: false,
    mousePosition: {},
    
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

        // Because the canvas is the background of the window, we need
        // to check for window events, rather than canvas events.
        $(window).on('mousedown', function(e) {
            console.log("mouse is down", e);
        });
        $(window).on('mouseup',  {
            annotations: this.annotations
        }, function(e) {
            // See if the event happened in one of our annotation rects.
            var x = e.pageX;
            var y = e.pageY;
            var annotations = e.data.annotations;
            _.each(annotations, function(annotation, index, annotations) {
                _.each(annotation.rects, function(rect, index, rects) {
                    if (x >= rect.left && x <= rect.left + rect.width &&
                        y >= rect.top && y <= rect.top + rect.height) {
                        // This annotation has been clicked!
                        $.event.trigger({
                            type: "annotationClick",
                            annotation: annotation
                        });
                    }
                }, this);
            }, this);
        });
    },

    // Redraw the entire annotation canvas.
    refresh: function() {
        $('body').css({'background-image':"url(" + this.canvas.toDataURL("image/png")+ ")" });
    },

    // Add an annotation to the annotation canvas for a CFI of the given 
    // type with the given style and color.
    // Example:
    //    annotationCanvas.addAnnotation(
    //        "epubcfi(/6/12!/4/2/10,/1:530,/1:533)",
    //        {
    //            highlight: true,
    //            highlightStyle: BookKit.Constants.BKAnnotationStyleHighlight,
    //            highlightColor: BookKit.Constants.BKAnnotationColorRed
    //        });
    addAnnotation: function(cfiOrString, annotationProps) {
        var annotaiton = undefined;
        var cfi = undefined;

        // We were given a string. Parse it.
        if ((typeof cfiOrString == 'string') || (cfiOrString instanceof String))
            cfi = new BookKit.CFI({cfi: cfiOrString}).parseAndResolve();
        else
            cfi = cfiOrString;

        annotationProps.cfi = cfi;
        annotation = new BookKit.Annotation(annotationProps);

        this.annotations[cfi.get("cfi")] = annotation;
        this.render(annotation);
        this.refresh();
    },

    // Remove an annotation from the canvas.
    removeAnnotation: function(annotationOrCFI) {
        var annotaiton = undefined;
        var cfi = undefined;

        if ((typeof annotationOrCFI == 'string') || 
            (annotationOrCFI instanceof String) || 
            (annotationOrCFI instanceof BookKit.CFI)) {

            if ((typeof annotationOrCFI == 'string') || (annotationOrCFI instanceof String))
                cfi = new BookKit.CFI({cfi: annotationOrCFI}).parseAndResolve();
            else
                cfi = annotationOrCFI;

        } else {
            cfi = annotation.get("cfi");
        }

        var annotation = this.annotations[cfi.get("cfi")];
        this.remove(annotation);

        var index = this.annotations.indexOf(cfi.get("cfi"));
        this.annotations.splice(index, 1);
    },

    render: function(annotation) {
        this.annotations[annotation.get("cfi").get("cfi")].rects = [];

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
        var rects = this.annotations[cfi.get("cfi")].rects;
        var canvas_context = this.canvas.getContext('2d');
        _.each(rects, function(rect, index, rects) {
            canvas_context.clearRect(rect.left, rect.top, rect.width, rect.height);
        });
        this.annotations[cfi.get("cfi")].rects = [];
    },

    renderHighlight: function(annotation) {
        var cfi = annotation.get("cfi");
        var style = annotation.get("highlightStyle");
        var color = annotation.get("highlightColor");
        var canvas_context = this.canvas.getContext('2d');

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
                canvas_context.fillRect(rect.left, rect.top, rect.width, rect.height);
                this.annotations[cfi.get("cfi")].rects.push(rect);
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
            var canvas_context = this.canvas.getContext('2d');
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

            this.annotations[cfi.get("cfi")].rects.push(rect);
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
            
            var canvas_context = this.canvas.getContext('2d');
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

            this.annotations[cfi.get("cfi")].rects.push(rect);
        }

    },

});



