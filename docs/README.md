BookKit
===========

BookKit is a JavaScript library for reading EPUB files. In particularly, it is a well-documented, modular, flexible library from which a competent EPUB reader can be built.

BookKit is particularly concerned with annotations. This is one area where ebook readers should excel: a physical book's marginalia is limited to a single copy, but ebook annotations have the potential to be so much more. BookKit's intent is to focus on annotations, making CFIs a bit simpler to handle within the browser (or web view) and hopefully make the overall portability of annotations a bit easier.

BookKit is ©2012-2014 Will Barton, licensed under a BSD-style license.

# Using

BookKit should be injected into an EPUB XHTML file within a web browser or web view within an application. 

# Architecture

BookKit is divided logically into five components:

### CFI

EPUB CFIs are Content Fragment Identifiers. They reference a particular location within an ePub file (a container which includes many XHTML files ordered by a content manifest). The can span XHTML elements, XHTML files, partial elements, etc.

Beyond simply locating a particular location or fragment in an EPUB file, CFIs, once resolved, can be used to locate that content both in the DOM and on the screen.

### Annotation

Annotations are built on CFIs and add the context in which a CFI may have been created by a user. In practice they can be bookmarks (CFIs without any range), highlights (CFIs that contain a range, with additional properties such as the style/color of the highlight), or notes (CFIs either with or without range, with or without highlighting, that have some additional user-specified text associated).

### Presentation

The way the user interface is presented to the user; how annotations appear, how pages appear. Presentations associate a particular EPUB file's content with a set of UI layers and a set of UI behaviors.

### Layers

Layers are seperate UI components that are added to the page that are not part of the content.

### Behaviors

Behaviors handle events that modify the presentation in some way.

# API

## BookKit.CFI

`BookKit.CFI` represents EPUB CFI objects by parsing EPUB CFI strings into `steps` and resolving those steps in the current document. CFIs can be initialized with pre-parsed and pre-resolved steps and ranges, and can be initialized and then parsed and resolved later.

### CFI Creation

#### `BookKit.CFI.documentStep`

This *must be set* for CFIs that are generated to be valid. It's the string that corropsonds to the document step of the CFI, i.e. `/6/12!` in `epubcfi(/6/12!/4/2/4/2,/1:0,/1:22)`. It should be set before any CFIs are created.

#### `BookKit.CFI.selectionCFI()`

Returns a new BookKit.CFI object for the current window's selection. 

#### `BookKit.CFI.cfiForRange(range)`

Returns a new BookKit.CFI object for the given range.

#### `new BookKit.CFI(cfistring, steps, range, ranges)`

Return a new CFI object for the given `cfistring`. `cfistring` is required. The `cfistring` is not automatically parsed and resolved; `parseAndResolve()` must be called to do that.
 
If `steps` is given as a list of parsed CFI steps, it is assumed to be valid for the `cfistring`, and the `cfistring` will not be parsed.

If `range` and `ranges` are given, they are assumed to be valid for the `cfistring`, and the CFI steps will not be resolved.

### CFI Objects

CFI objects have the following properties:

#### Properties 

* `cfistring`: The CFI string, i.e. `epubcfi(/6/12!/4/2,/6/1:8,/8/1:9)`
* `steps`: The parsed CFI 'steps', node indexes, and any associated ranges, etc.
* `range`: The UNSAFE complete range of the CFI.
* `ranges`: The ranges referred to by a ranged CFI. Array to hold the multiple elements, element fragments selected, safe for operating across elements.

#### `parseAndResolve()`

Parse the `cfistring` and resolve it for the current XHTML document. 

If `steps` is not null, parsing will be skipped.

If `range` and `ranges` are not null, resolving will be skipped.

#### `intersects(anotherCfi)`

Does the CFI object intersect with another CFI? Returns `true` or `false`.

#### `rects()`

Get rects for the CFI's ranges. Note: this may be subject to change if the content layout changes.

#### `containsPoint(x, y)`

Does this CFI's rects contain the given `x`, `y` coordinates? Returns `true` or `false`. This function should be useful for testing whether a particular CFI has been interacted with.

#### `select()`

Make this CFI the active window selection.

        
## BookKit.Annotation

`BookKit.Annotation` represents CFIs created by users to annotate an EPUB with bookmarks, highlights/underlines, or text notes. They are the marginalia of digital reading. 


### Annotation Creation

BookKit keeps a global array of annotations that exist for the current XHTML document, `BookKit.Annotations`. When using the `addAnnotation()` and `removeAnnotation()` functions to create annotation objects the annotations are added to this array. In addition both functions also trigger events, `addedAnnotation` and `removedAnnotation` respectively.

#### `BookKit.Annotation.addAnnotation(cfiOrString, annotationProps)`

Returns a new `BookKit.Annotation` object for the given `BookKit.CFI` object or CFI string with the given properties (see below). 

This function also adds the annotation to the global `BookKit.Annotaitons` array and triggers the event `addedAnnotation`.

#### `new BookKit.Annotations(options)`

Return a new `BookKit.Annotation` object with the given properties (see below). Annotations created in this way do not get added to the global `BookKit.Annotations` array and the `addedAnnotation` event is not triggered.

### Annotation Removal

#### `BookKit.Annotation.removeAnnotation(annotationOrCFI)`

Removes the given `BookKit.Annotation` object or annotation associated with the given `BookKit.CFI` or CFI string from the global `BookKit.Annotations` array and triggres the global event `removedAnnotation`.


### Annotation Objects

#### Options 
 
* `cfi`: A `BookKit.CFI` object or a string EPUB CFI for this annotation.

Bookmark annotations — annotations that mark a location, and nothing else. They're composed from CFIs that have no range.

* `bookmark`: Boolean, is this annotation a bookmark?
* `bookmarkStyle`:
* `bookmarkColor`:

Highlight/underline annotations — annotations that mark a location and particular content at that location. They're composed from CFIs with a range.

* `highlight`: Boolean, is this annotation a highlight?
* `highlightStyle`:
* `highlightColor`: 

Note annotations — annotations that mark a location, with or without marking particular content at that location, and include some user-generated textual content. 

* `note`: Boolean, is this annotation a note?
* `noteStyle`: 
* `noteColor`: 
* `noteText`: 

#### Properties

* `cfi`: The `BookKit.CFI` object for this annotation. The `cfi` option can be either a string or an object. This property will always reliably hold the `BookKit.CFI` object.


## BookKit Presentation

Presentation is the basis for the BookKit UI. It is a modular approach that seperates the UI into three logical component types:

 * Presentation: Handles the content layout.
 * Layers: Handles any UI components that are added to the page (that are not part of the content).
 * Behaviors: Handles event listeners that modify the presentation in some way.

There would usually only ever be one presentation object created for one XHTML document. That presentation object would include multiple layers and behaviors. 

For example: the default BookKit presentation creates CSS3 columns. A default layer creates a canvas on which annotations are drawn. Default behaviors include navigation (scrolling left and right to previous and next columns) and highlighting (creating a new annotation for a selection).

### Presentation Objects

#### Options:

   * `viewportElement`: the viewport element (usually `window)
   * `presentationElement`: the element that will be presented
     (usually `body`).
   * `horizontalPadding`: horizontal padding within the viewport and between columns
   * `verticalPadding`: vertical padding within the viewport 
   * `animationDuration`: duration for all presentation animations
     (used by behaviors).
   * `behaviors`: object containing behavior instances (with unique names)
   * `layers`: object containing layer instances (with unique names)

Presentations also have functions that provide dimensional calculations for the content. These are intended to be used by both layers and behaviors to locate particular content ranges within the viewport (such as for highlighting or otherwise marking out an annotation).

#### `new BookKit.Presentation(options)`

#### `viewportHeight()`

The height of the viewport.

#### `height()`

The absolute bestheight of the presentation element.

#### `innerHeight()` 

The inner height of the presentation element (minus padding).

#### `viewportWidth()`

The width of the viewport containing the content.

#### `width()`

The absolute width of the presentation element.

#### `innerWidth()`

The inner width of the presentation element (minus padding);

#### `contentWidth()`

The width of the content, including padding. This is not the same as `width()`, as the content could be paginated with CSS3 columns.
   
#### `innerContentWidth()`

The width of the content without padding. See above.

#### `actualContentWidth()`

`contentWidth()` returns the suggested content width based on configuration. `actualContentWidth()` returns the content width after presentation. This is to get around a quirk with CSS3 columns: `column-width` is merely a "hint". 

#### `contentDivisions()`

A number of times the content has been divided, such as when using CSS3 columns. 

#### `contentPositionForOffset()`

Column number for a given left offset

#### `currentContentPosition()`

Return the current content position based on scroll offset.

#### `rangeForCurrentContentPosition()`
   
Returns a Javascript range for the top of the current content position.

#### `configureLayers()`

#### `configureBehaviors()`


## BookKit.Layer


## BookKit.Behavior

