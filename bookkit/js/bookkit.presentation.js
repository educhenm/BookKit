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
// Presentation is the basis for the BookKit UI. It is a modular
// approach that seperates the UI into three logical component types:
//
//  * Presentation: Handles the content layout.
//  * Layers: Handles any UI components that are added to the page (that
//    are not part of the content).
//  * Behaviors: Handles event listeners that modify the presentation in
//    some way.
//
// There would usually only ever be one presentation object created for
// one XHTML document. That presentation object would include multiple
// layers and behaviors. 
//
// For example: the default BookKit presentation creates CSS3 columns. A
// default layer creates a canvas on which annotations are drawn.
// Default behaviors include navigation (scrolling left and right to
// previous and next columns) and highlighting (creating a new
// annotation for a selection).



// ## Presentation
//
// The base presentation. Other presentations can inherit from this
// presentaiton with:
//
//    base.__proto__ = BookKit.Presentation()
//    
// This is a continuous vertical presentation that does not divide the
// content into columns.
BookKit.Presentation = (function () {
    var Presentation = function(options) {
        var base = this;

        var defaults = {
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
                highlights: new BookKit.Behavior.HighlightImmediately(),
            },
            // Presentation Layers
            layers: {
                annotation: new BookKit.Layer.AnnotationCanvass(),
            },
        };

        base.options = $.extend(true, {}, defaults, options);
        
        base.presentationContainer = undefined;

        // ## Dimensions

        // The height of the viewport.
        base.viewportHeight = function() {
            return $(base.options.viewportElement).height();
        };

        // The absolute height of the presentation element.
        base.height = function() {
            return $(base.options.presentationElement)[0].scrollHeight;
        };

        // The height of the reader itself, within the viewport (accounts
        // for padding).
        base.innerHeight = function() {
            return parseInt(base.height() - (base.options.verticalPadding * 2));
        };

        // The width of the viewport.
        base.viewportWidth = function() {
            return base.options.viewportElement.innerWidth;
        };

        // The absolute width of the presentation element;
        base.width = function() {
            return $(base.options.presentationElement)[0].scrollWidth;
        };
          
        // The inner width of the presentation element (excluding
        // padding);
        base.innerWidth = function() {
            return base.width() - (base.options.horizontalPadding * 2);
        };

        // The width of the content, including padding. 
        base.contentHeight = function() {
            return base.height();
        },

        // The width of the content without padding. See above.
        base.innerContentHeight = function () {
            return base.innerHeight();
        };
        
        // The width of the content, including padding. 
        base.contentWidth = function() {
            return base.width();
        },

        // The width of the content without padding. See above.
        base.innerContentWidth = function () {
            return base.innerWidth();
        };
        
        // `contentWidth()` returns the suggested content width based on
        // configuration. `actualContentWidth()` returns the content
        // width after presentation. This is to get around a quirk with
        // CSS3 columns: `column-width` is merely a "hint". 
        base.actualContentWidth = function() {
            return base.width();
        };

        // A number of times the content has been divided, such as when
        // using CSS3 columns. 
        base.contentDivisions = function() {
            return 1;
        };

        // Column number for a given left offset
        base.contentPositionForOffset = function(offset) {
            return 0;
        };

        // Return the current content position based on scroll offset.
        base.currentContentPosition = function() {
            return 0;
        },

        // Returns a Javascript range for the top of the current content
        // position.
        base.rangeForCurrentContentPosition = function() {
            var columnNumber = base.currentColumnNumber();
            var range = document.caretRangeFromPoint(columnNumber, 0);
            return range;
        };

        // ## Initialization

        // Set `presentation` on each layer to this object.
        base.configureLayers = function() {
            $.each(base.options.layers, function(index, layer) {
                layer.presentation = base;
            });
        };

        // Set `presentation` on each behavior to this object.
        base.configureBehaviors = function() {
            $.each(base.options.behaviors, function(index, behavior) {
                behavior.presentation = base;
            });
        };

        // Initialization
        base.init = function() {
            base.configureLayers(base);
            base.configureBehaviors(base);

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

                var $el = $(base.options.presentationElement);
                $el.css('margin', 0);
                $el.css('padding-top', base.options.verticalPadding);
                $el.css('padding-bottom', base.options.verticalPadding);
                $el.css('padding-left', base.options.horizontalPadding);
                $el.css('padding-right', base.options.horizontalPadding);
                $el.css('height', base.innerHeight());
                $el.css('width', base.innerWidth());

                $(document).trigger('presented');
            }.bind(base));

            $(window).resize();
        };

        // Run initializer
        base.init();
    };

    return function(options) {
        return new Presentation(options);
    };
})();

// ## ColumnedPresentation
//
// A presentation that divides the content into CSS3 columns.
// ## ColumnedPresentation
//
// A presentation that divides the content into CSS3 columns.
BookKit.ColumnedPresentation = (function () {
    var ColumnedPresentation = function(options) {
        // basic presentation inheritance
        var base = this;
        var _super = BookKit.Presentation(options);
        base = $.extend(true, _super, base);

        var defaults = {
            // Number of columns in the viewport
            columns: 2,

            // Number of columns to scroll when moving to next "page"
            columnsToScroll: 2,

            // Column to start at
            columnToStart: 5,

            // Behaviors
            behaviors: {
                navigation: new BookKit.Behavior.Navigate(),
            },
        };

        base.options = $.extend(true, _super.options, defaults, options);

        // ## Dimensions

        // The absolute height of the presentation element.
        base.height = function() {
            return base.viewportHeight();
        };

        // The height of the reader itself, within the viewport (accounts
        // for padding).
        base.innerHeight = function() {
            return parseInt(base.height() - (base.options.verticalPadding * 2));
        };
        
        // The width of the viewport containing the content.
        base.viewportWidth = function() {
            var width = base.options.viewportElement.innerWidth;
            return width;
        };

        // The absolute width of the presentation element;
        base.width = function() {
            return $(base.options.presentationElement)[0].scrollWidth;
        };
          
        // The inner width of the presentation element (excluding
        // padding);
        base.innerWidth = function() {
            return base.width() - (base.options.horizontalPadding * 2);
        };
          
        // The width of the content, including padding. 
        base.contentHeight = function() {
            return base.height();
        },

        // The width of the content without padding. See above.
        base.innerContentHeight = function () {
            return base.innerHeight();
        };
        
        // The width of the content, including padding. This is not the
        // same as `width()`, as the content is paginated with CSS3
        // columns.
        base.contentWidth = function() {
            return parseInt(base.viewportWidth()/base.options.columns);
        },

        // The width of the content without padding. See above.
        base.innerContentWidth = function () {
            return parseInt(base.contentWidth() - base.options.horizontalPadding * 2);
        };

        // `contentWidth()` returns the suggested content width based on
        // configuration. `actualContentWidth()` returns the content
        // width after presentation. This is to get around a quirk with
        // CSS3 columns: `column-width` is merely a "hint". 
        base.actualContentWidth = function() {
            // An approximate column number for our actual width calculation
            var columnsNumber = Math.floor(
                (base.width() - base.options.horizontalPadding)/
                (base.contentWidth())
            );
            if (isNaN(columnsNumber) || columnsNumber < 1) 
                columnsNumber = 1;

            var actualWidth = $(base.options.presentationElement)[0].scrollWidth / columnsNumber;
            return Math.ceil(actualWidth);
        };

        // A number of times the content has been divided, such as when
        // using CSS3 columns. 
        base.contentDivisions = function() {
            var columnsNumber = Math.floor(
                (base.width() - base.options.horizontalPadding)/
                (base.actualContentWidth())
            );
            if (isNaN(columnsNumber) || columnsNumber < 1) 
                columnsNumber = 1;
            return columnsNumber;
        };

        // Column number for a given left offset
        base.contentPositionForOffset = function(offset) {
            var columnWidth = base.contentWidth();
            var columnNumber = parseInt(offset / columnWidth);
            return columnNumber;
        };

        // Return the current content position based on scroll offset.
        base.currentContentPosition = function() {
            var leftPosition = $(base.options.presentationElement).scrollLeft();
            var columnNumber = base.contentPositionForOffset(leftPosition);
            return Math.ceil(columnNumber);
        },

        // ## Columns
        setColumnSizes = function() {
            var $el = $(base.options.presentationElement);
            var height = base.innerHeight();
            var column_gap = base.options.horizontalPadding * 2;
            var column_width = base.innerContentWidth();

            $el.css('overflow', 'hidden');
            $el.css('margin', 0);
            $el.css('padding-top', base.options.verticalPadding);
            $el.css('padding-bottom', base.options.verticalPadding);
            $el.css('padding-left', base.options.horizontalPadding);
            $el.css('padding-right', base.options.horizontalPadding);
            $el.css('height', height + 'px');
            $el.css('-webkit-column-width', column_width + 'px');
            $el.css('-webkit-column-gap', column_gap + 'px');
            $el.css('-webkit-column-rule',  '1px outset #eeeeee');
            $el.css('width', base.innerWidth());

            $(document).trigger('presented');
        };

        // ## Initialization

        // Initialization
        base.init = function() {
            base.configureLayers();
            base.configureBehaviors();

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
        return new ColumnedPresentation(options);
    };
})();



