# DocuCraft Performance Optimization Roadmap

After analyzing the codebase across the shared application shell and representative tool pages, several clear patterns of performance bottlenecks emerge. Because DocuCraft is a purely client-side application, memory management, main-thread blocking, and network overhead are the primary constraints. 

Below is a prioritized roadmap of practical optimizations, ordered by expected impact versus implementation effort.

## High Impact, Low Effort (Quick Wins)

### 1. Remove Custom Scroll-Jacking Site-Wide
The custom JavaScript scroll-handling loop (found at the bottom of `index.html` and every tool page) intercepts the native `wheel` event and forces `requestAnimationFrame` interpolation. This causes significant scroll jacking, overrides OS-level scroll preferences, and wastes main-thread CPU cycles. 
* **Action:** Delete the `<script>` block containing the `wheel` event listener from all HTML files.
* **Replacement:** Rely on native scrolling, or apply `html { scroll-behavior: smooth; }` in `app.css` if smooth anchor navigation is required. *(Note: This was already applied to `index.html` in the previous PR, but needs to be rolled out to all tool pages).*

### 2. Centralize Duplicated JavaScript Logic
Every tool page currently duplicates the exact same JavaScript for the theme toggle, logo hover animation, action counter, and smooth scrolling. This inflates the HTML payload size and forces the browser to parse the same logic repeatedly on every navigation.
* **Action:** Move the `themeToggle`, `resetLogoLetters`, `initializeLogoHoverEngine`, and `incrementActionStats` functions into the shared `app.js` file.
* **Benefit:** Reduces page weight, ensures consistent behavior, and allows the browser to cache the logic once.

## High Impact, Medium Effort (Architecture Shifts)

### 3. Implement Lazy Loading for Heavy Dependencies
Tool pages like `image-to-pdf.html` and `pdf-converter.html` load massive third-party libraries (`pdf.js`, `pdf-lib`, `jszip`) synchronously in the `<head>` using blocking `<script defer>` tags. In `pdf-converter.html`, both `pdf.js` and `pdf-lib` are loaded even though a user will only use one engine per session.
* **Action:** Remove these heavy scripts from the `<head>`. Instead, dynamically inject the `<script>` tags (or use dynamic `import()`) only when the user actually drops a file or clicks a specific conversion button.
* **Benefit:** Dramatically improves initial page load time and Time to Interactive (TTI), saving bandwidth for users on mobile connections.

### 4. Optimize Memory Usage in Image Processing
In tools like `image-to-pdf.html`, uploaded images are read entirely into memory as base64 `data:` URLs using `FileReader.readAsDataURL()`. For large batches of high-resolution photos, this will rapidly crash mobile browsers due to memory exhaustion. Furthermore, the tool re-encodes images through a `<canvas>` and then again into `jsPDF`.
* **Action:** Replace `FileReader.readAsDataURL()` with `URL.createObjectURL(file)`. Object URLs are merely pointers to the file on disk and consume almost zero memory. 
* **Action:** Ensure `URL.revokeObjectURL()` is called when images are removed from the grid or when the page unloads.

## Medium Impact, High Effort (Advanced Enhancements)

### 5. Move PDF and AI Processing to Web Workers
Currently, heavy tasks like rendering PDF pages to canvases (`pdf-to-images.html`), compressing PDFs, or running the background removal AI model happen directly on the main thread. This freezes the UI, making the browser appear unresponsive and preventing the progress bar from updating smoothly.
* **Action:** Offload `pdf.js` rendering loops and AI model execution (in `background-remover.html`) to Web Workers. 
* **Benefit:** Keeps the UI thread completely free, allowing CSS animations, progress bars, and hover states to remain perfectly smooth even during intensive document processing.

### 6. Self-Host External Assets and Models
The application relies heavily on CDNs (like `cdnjs.cloudflare.com`) for critical libraries and AI models. While CDNs are fast, they introduce DNS lookup overhead, potential privacy leakage (as external servers see the requests), and break the "mostly offline" capability mentioned in the FAQ.
* **Action:** Download the minified versions of `pdf.js`, `pdf-lib`, `jszip`, and the background removal AI models, and serve them locally from a `/vendor` or `/assets` directory.
* **Benefit:** Guarantees 100% offline functionality, improves privacy (no external pings), and leverages Service Worker caching more effectively.
