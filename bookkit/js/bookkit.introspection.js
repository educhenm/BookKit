/*
 * BookKit JavaScript ePub3 Reader Utilities
 *
 * Copyright 2012-2014 Will Barton.
 * All rights reserved. See LICENSE for full license details.
 */ 

BookKit.Introspection = {}

// Introspection
// =============
// Introspection is intended to give ereaders easy access to information
// that BookKit has about the XHTML document — how many pages is it with
// the current display settings, etc.
//
// Many of these are available with relative ease (like number of page,
// which just calls a Utils.totalColumns), but this gives us an exposed
// API.

// Number of Pages
// ---------------
// Returns the number of pages in this XHTML document (likely a
// chapter). BookKit can't know anything about the total number of pages
// in a particular eBook.
BookKit.Introspection.numberOfPages = function() {
    return BookKit.Presentation.totalColumns();
}

// Current Page
// ------------
// Returns the current page number.
BookKit.Introspection.currentPage = function() {
    return BookKit.Presentation.currentColumnNumber();
}


