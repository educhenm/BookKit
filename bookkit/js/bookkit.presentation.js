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

// BookKit Presentation
// ====================
BookKit.Presentation = (function () {
    var Presentation = function(options) {
        var base = this;

        defaults = {
            // Number of columns in the viewport
            columns: 2,

            // Number of columns to scroll when moving to next "page"
            columnsToScroll: 2,

            // Column to start at
            columnToStart: 5,

            // Horizontal padding within the viewport and between columns
            horizontalPadding: 100,

            // Vertical padding within the viewport
            verticalPadding: 100,

            // The element that will have columns and presentation attached
            presentationElement: 'body',

            // The viewport element
            viewportElement: window,

            // Duration for presentation animations
            animationDuration: 0,
            
            // Behaviors
            behaviors: {
                // navigation: new BookKit.Behaviors.Navigate(),
                // highlights: new BookKit.Behaviors.HighlightImmediately(),
            },
            // Presentation Layers
            layers: {
                annotation: new BookKit.Layer.Annotations(),
            }
        };

        base.options = $.extend({}, defaults, options);
        
        base.presentationContainer = undefined;

        // ## Dimensions

        // The height of the viewport.
        base.viewportHeight = function() {
            return $(base.options.viewportElement).height();
        };

        // The height of the reader itself, within the viewport (accounts
        // for padding).
        base.height = function() {
            return parseInt(base.viewportHeight() - (base.options.verticalPadding * 2));
        };

        // The width of the viewport containing the content.
        base.viewportWidth = function() {
            var width = base.options.viewportElement.innerWidth;
            return width;
        };
          
        // The total width of the content — this is the scroll width of the
        // content-holding element.
        base.width = function() {
            return $(base.options.presentationElement)[0].scrollWidth + 
                base.options.horizontalPadding;
        };

        // The total width of a column including the gaps.
        base.columnWidth = function() {
            return parseInt(base.viewportWidth()/base.options.columns);
        },

        // The width of a column without the gaps
        base.innerColumnWidth = function () {
            return parseInt(base.columnWidth() - base.options.horizontalPadding * 2);
        };

        // CSS3 column-width is merely a "hint" according to MDN. This gets
        // our actual column width after the columns have been set up.
        base.actualColumnWidth = function() {
            // An approximate column number for our actual width calculation
            var columnsNumber = Math.floor(
                (base.width() - base.options.horizontalPadding)/
                (base.columnWidth())
            );
            if (isNaN(columnsNumber) || columnsNumber < 1) 
                columnsNumber = 1;

            var actualWidth = $(base.options.presentationElement)[0].scrollWidth / columnsNumber;
            return Math.ceil(actualWidth);
        };

        // Total number of columns (based on actual column width rather than
        // the css3 column-width hint).
        base.totalColumns = function() {
            var columnsNumber = Math.floor(
                (base.width() - base.options.horizontalPadding)/
                (base.actualColumnWidth())
            );
            if (isNaN(columnsNumber) || columnsNumber < 1) 
                columnsNumber = 1;
            return columnsNumber;
        };

        // Column number for a given left offset
        base.columnNumberForPosition = function(left) {
            var columnWidth = base.columnWidth();
            var columnNumber = parseInt(left / columnWidth);
            return columnNumber;
        };

        // Return the current column number in view
        base.currentColumnNumber = function(columnElm) {
            var leftPosition = $(base.options.presentationElement).scrollLeft();
            var columnNumber = base.columnNumberForPosition(leftPosition);
            return Math.ceil(columnNumber);
        },

        // Returns a Javascript range for the top of the current column
        base.rangeForCurrentColumn = function() {
            var columnNumber = base.currentColumnNumber();
            var range = document.caretRangeFromPoint(columnNumber, 0);
            return range;
        };

        // ## Columns

        setColumnSizes = function() {
            var $el = $(base.options.presentationElement);
            var height = base.height();
            var column_gap = base.options.horizontalPadding * 2;
            var column_width = base.innerColumnWidth();

            console.log(height, column_width);

            // $el.css('overflow', 'hidden');
            $el.css('margin', 0);
            $el.css('padding-top', base.options.verticalPadding);
            $el.css('padding-bottom', base.options.verticalPadding);
            $el.css('padding-left', base.options.horizontalPadding);
            $el.css('padding-right', base.options.horizontalPadding);
            $el.css('height', height + 'px');
            $el.css('-webkit-column-width', column_width + 'px');
            $el.css('-webkit-column-gap', column_gap + 'px');
            $el.css('-webkit-column-rule',  '1px outset #eeeeee');
            $el.css('width', base.width());

            $(document).trigger('presented');
        };

        // Initialization
        base.init = function() {

            $.each(base.options.layers, function(index, layer) {
                layer.presentation = base;
            });
            $.each(base.options.behaviors, function(index, behavior) {
                behavior.presentation = base;
            });

            $(document).on('ready', function() {
                // Use the font loader for FontAwesome, which we use for
                // annotations. We don't need to do any special success/error
                // handling (though we probably should do error handling if the
                // font fails to load) to get polyfill.
                document.fontloader.loadFont({font: '16px FontAwesome'});

                // Add a container for presentation-layer elements to the BOTTOM
                // of the body (bottom so we don't interfere with any CFIs)
                base.presentationContainer = document.createElement("div");
                $(base.presentationContainer).attr('id', '-BookKit-Presentation');
                $(base.presentationContainer).appendTo(
                    base.options.presentationElement);

                // CSS adjustments that are relevent to pagination
                $(document).ready(setColumnSizes);
            }.bind(base));

            $(window).resize(setColumnSizes);

        };

        // Run initializer
        base.init();
    };

    return function(options) {
        return new Presentation(options);
    };
})();


