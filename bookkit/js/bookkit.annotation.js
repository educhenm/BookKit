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


