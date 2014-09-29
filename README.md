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
    <script type="text/javascript" src="../../bookkit/js/bookkit.presentation.js"></script>
    <link rel="stylesheet" href="../../bookkit/css/bookkit.presentation.css"/>

These will be simplified at a later date.

At the end of the document, the BookKit presentation layer just needs to
be initialized, and the CFI prefix of the document itself within the
ePub file  needs to be set:

    <script type="text/javascript">
        BookKit.Config.Document.cfi = "/6/12!";
        var presentation = new BookKit.Presentation(document);
    </script>

From there BookKit's functions can be called. For example, to highlight
text upon selection (iBooks style), one would use the following
JavaScript:


      // test add selection
      $('body').mouseup( function() {
          var cfi = BookKit.CFI.selectionCFI();
          presentation.annotationCanvas.addAnnotation(cfi, 
              {
                  highlight: cfi,
                  highlightStyle: BookKit.Constants.BKAnnotationStyleHighlight,
                  highlightColor: BookKit.Constants.BKAnnotationColorBlue
              });
      });



    
