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
// This is the (completely optional) presentation layer of BookKit. It
// takes care to arrange the content of given document in a pleasing way
// for reading, and handle navigation within that document.
//
// Presentation also handles the UI for adding/editing/removing
// annotations.

var Presentation = BookKit.Presentation = function(attributes) {
    BookKit.BaseClass.apply(this, arguments);
};
_.extend(BookKit.Presentation.prototype, BookKit.BaseClass.prototype, {

    annotationCanvas: new AnnotationCanvas(),
    presentationContainer: undefined,

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

        // Listen for tap events on our annotations.
        // Because the canvas is the background of the window, we need
        // to check for window events, rather than canvas events.
        $('html').on('tap', {
              annotations: this.annotationCanvas.annotations,
              success: this.annotationTap,
              failure: this.nonAnnotationTap 
          }, function(e, data) {
            // See if the event happened in one of our annotation rects.
            var x = data.x;
            var y = data.y;
            var annotationTap = false;

            var annotations = e.data.annotations;
            _.each(annotations, function(annotation, index, annotations) {
                _.each(annotation.rects, function(rect, index, rects) {
                    if (x >= rect.left && x <= rect.left + rect.width &&
                        y >= rect.top && y <= rect.top + rect.height) {
                        annotationTap = true;
                        e.data.success(annotation, rect);
                    }
                }, this);
            }, this);

            if (!annotationTap)
                e.data.failure(e, data);
            
        });

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

        /*
        html2canvas($("body"), { 
            onrendered: function(canvas) {
                $(menuController).css({'background-image':"url(" + canvas.toDataURL("image/png")+ ")" });
            }
        });
        */

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


var AnnotationPresentation = BookKit.AnnotationPresentation = function(attributes) {
    BookKit.BaseClass.apply(this, arguments);
};
_.extend(BookKit.AnnotationPresentation.prototype, BookKit.BaseClass.prototype, {

});

