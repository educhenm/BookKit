BookKit Design
==============

BookKit is a JavaScript library for reading ePub files.

BookKit is designed to be modular, where each module builds upon others. This should allow someone to choose how much or how little of the task of e-reading they wish to perform in the browser in JavaScript. 

In particular, BookKit is concerned with a relatively neglected aspect of e-reading: annotations. This is one area where ebook readers should excel: a physical book's marginalia is limited to a single copy, but ebook annotations have the potential to be so much more. BookKit's intent is to focus on annotations, making CFIs a bit simpler to handle within the browser (webview) and hopefully make their portability a bit easier.

Layers
------


### Behavior

The way the user inface is interacted how; how annotations are manipulated, how pages are manipulated.

### Presentation

The way the user interface is presented to the user; how annotations appear, how pages appear.

### Annotation

Annotations are built on CFIs. In practice they can be bookmarks (CFIs without any range), highlights (CFIs that contain a range, with additional properties such as the style/color of the highlight), or notes (CFIs either with or without range, with or without highlighting, that have some additional user-specified text associated).

### CFI

ePub CFIs are Content Fragment Identifiers. They reference a particular location within an ePub file (a container which includes many XHTML files ordered by a content manifest). The can span XHTML elements, XHTML files, partial elements, etc.


