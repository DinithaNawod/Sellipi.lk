# Reference UI implementation

The supplied screenshots are the visual reference for the frontend. The subsequent role-based dashboard and academic-note moderation request also adds backend authorization, account fields, and a MongoDB Note model. Environment credentials are unchanged.

## Pages

- `/`: home, heritage introduction, archive links, map link, and institutional links.
- `/introduction`: introduction, history, Brahmi evolution, and the supplied alphabet chart.
- `/inscriptions`: advanced search, archive rows, and pagination using live API results.
- `/inscription/:id`: details, transcription, translation, read-aloud, print/save as PDF, browser bookmarks, and approved public academic notes.
- `/translate`: upload, selected-image preview, processing, image comparison, detected text, and translation results.
- `/about`, `/services`, `/contact`: the reference informational pages.
- `/admin/login`, `/admin/register`: photograph-backed authentication screens using the existing API.
- `/account`: the reference account sidebar, device-local display-name settings, and My Notes for academics.
- `/admin`: administrator-only statistics, user management, note reviews, and inscription management. See README.md for first-admin setup.
- `/map`: the existing interactive map.

## Existing backend boundaries

- Publication and language are absent from the existing inscription schema. Their filter controls are disabled, and the detail screen displays “Not recorded”. Inscription numbers are extracted from titles when explicitly present. The number/keyword field uses the existing text search.
- Bookmarks and display-name preferences stay in this browser. Academic notes are now stored on the server, attributed to their author, and require admin approval before publication. Previous browser-local notes are not imported or published.
- Contact submission opens an email draft in the visitor's email application. The visitor must send the email there; the website does not claim successful delivery.
- Language labels and unavailable media-center items are presentational. No interface translation or events/video service has been added.
- The public archive displays actual API data, not the repeated sample records or sample counts shown in the mockup.

## Artwork

Existing illustrations are reused. Additional photographic assets and the alphabet chart were cropped from the supplied references. Banner crops exclude the screenshot's embedded headline so headings remain real, selectable HTML text; their photographic framing consequently differs from the full source mockups. Full original photographs would allow closer framing.

`scripts/extract-design-assets.ps1` records screenshot crop provenance. `scripts/prepare-frontend-images.cjs` optimizes existing artwork into separate files without altering the originals. Generated assets are committed as frontend assets; the scripts are not needed to run the site.

## Verification

- Production build: `npm run build`.
- Desktop inspection at 1440 × 900 and mobile inspection at 390 × 844.
- Public routes and registration checked for horizontal overflow.
- Temporary local API fixtures used to check archive pagination, detail rendering, translation result rendering, and login/account navigation. The real API was unavailable during this review. Fixture data was not written to MongoDB and the fixture server was stopped afterward.
- Browser bookmarks and note creation/removal exercised with disposable test content.

Start the existing API and frontend as documented in README.md to verify real MongoDB, OCR, and Gemini behavior.
