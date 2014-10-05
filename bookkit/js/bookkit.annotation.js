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
            cfi = new BookKit.CFI(cfi).parseAndResolve();
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
_.extend(BookKit.Annotation, {
    addAnnotation: function(cfiOrString, annotationProps) {
        var annotaiton = undefined;
        var cfi = undefined;

        // We were given a string. Parse it.
        if ((typeof cfiOrString == 'string') || (cfiOrString instanceof String))
            cfi = new BookKit.CFI(cfiOrString).parseAndResolve();
        else
            cfi = cfiOrString;

        annotationProps.cfi = cfi;
        annotation = new BookKit.Annotation(annotationProps);

        BookKit.Annotations[cfi.cfistring] = annotation;
        $(document).trigger('addedAnnotation', [annotation]);
    },

    // Remove an annotation 
    removeAnnotation: function(annotationOrCFI) {
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
            cfi = annotation.get("cfi");
        }

        var annotation = BookKit.Annotations[cfi.cfistring];
        var index = BookKit.Annotations.indexOf(cfi.cfistring);
        BookKit.Annotations.splice(index, 1);
        $(document).trigger('removedAnnotation', [annotation]);
    },

});

