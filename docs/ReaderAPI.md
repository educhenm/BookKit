API Concerns from Reader Application (WebView)

- Annotations
  - Get pixel rect(s) corrosponding to the annotation
  - Bookmarks:
    - Bookmark Current Page (get top-of-page CFI)
    - Is current page bookmarked? (is there a bookmark CFI that
      matches the page?)
  - Highlights:
    - Create a highlight for a given selection range
    - Add a highlight for a given CFI
    - Remove a highlight for a given CFI
    - Extend a highlight for a given CFI
    - Configure a highlight for a given CFI
  - Notes:
    - Add a note marker for a given CFI (or highlight)
    - Remove a note marker for a given CFI (or highlight)
    - Display note inline immediately after a given CFI
    - Configure note color (marker and inline) for a given CFI

- Search Terms
  - Highlight search terms
