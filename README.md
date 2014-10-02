BookKit
=======

An experiment with the hope of creating a JavaScript ePub3 rendering engine.

BookKit is not intended to be a stand-along ebook reader, but rather
the rendering engine within the web view of an ebook reader. One could
create an entirely browser-based reader around it, but that is not the
primary goal. BookKit provides hooks to interact with reader
applications.

BookKit is not fully-functional and is not recommended for use.

BookKit is BSD licensed. The third-party libraries and fonts included have their own licenses you should be mindful of.

Using
-----

BookKit is not meant to be used at the moment. But if you want to,
here's basically how you would go about it:

Once an ePub file is decompressed and one of its HTML files opened, the
following needs to be injected into the header (paths should be adjusted
as necessary):

    <script type="text/javascript" src="../../bower_components/jquery/dist/jquery.min.js"></script>
    <script type="text/javascript" src="../../bower_components/underscore/underscore.js"></script>
    <script type="text/javascript" src="../../bower_components/fontloader/fontloader.js"></script>
    <script type="text/javascript" src="../../bower_components/Tocca.js/Tocca.min.js"></script>
    <script type="text/javascript" src="../../bower_components/html2canvas/build/html2canvas.min.js"></script>
    <link rel="stylesheet" href="../../bower_components/font-awesome/css/font-awesome.min.css"/>
    <script type="text/javascript" src="../../bookkit/js/jquery.measure.js"></script>
    <script type="text/javascript" src="../../bookkit/js/bookkit.base.js"></script>
    <script type="text/javascript" src="../../bookkit/js/bookkit.utils.js"></script>
    <script type="text/javascript" src="../../bookkit/js/bookkit.events.js"></script>
    <script type="text/javascript" src="../../bookkit/js/bookkit.cfi.js"></script>
    <script type="text/javascript" src="../../bookkit/js/bookkit.annotation.js"></script>
    <script type="text/javascript" src="../../bookkit/js/bookkit.behavior.js"></script>
    <script type="text/javascript" src="../../bookkit/js/bookkit.presentation.js"></script>
    <link rel="stylesheet" href="../../bookkit/css/bookkit.presentation.css"/>

These will be simplified at a later date.

At the end of the document, the BookKit presentation layer just needs to
be initialized, and the CFI prefix of the document itself within the
ePub file  needs to be set:

    <script type="text/javascript">
        // Set up the document portion of CFIs for this file
        BookKit.Config.Document.cfi = "/6/12!";
        var presentation = new BookKit.Presentation();
    </script>

From there BookKit's functions can be called. For example, to add an
annotation programmatically (to restore previous annotations, for
example), one would use the following JavaScript injected into the
document:

    // Add annotations
    $(document).on('ready', function() {
        // Stately 
        BookKit.Annotation.addAnnotation(
            "epubcfi(/6/12!/4/2/2,/1:0,/1:28)",
            {
                highlight: true,
                highlightStyle: BookKit.Constants.BKAnnotationStyleHighlight,
                highlightColor: BookKit.Constants.BKAnnotationColorRed,

                note: true,
                noteStyle: BookKit.Constants.BKAnnotationStyleIcon,
                noteColor: BookKit.Constants.BKAnnotationColorRed,
                noteText: "This is a test note about some very important something or other with some additional text because you know whatever."
            });
    });

At the moment BookKit's AnnotationCanvas presentation layer is
WebKit-only.

    
