/**
 * PDF Export — popup window + window.print()
 *
 * Opens a clean popup window containing only the resume preview,
 * auto-triggers window.print(), and closes the popup after.
 *
 * On Chrome/Edge the print dialog flow is:
 *   1. Print dialog opens
 *   2. User selects "Save as PDF" destination
 *   3. User clicks Save → native OS Save As dialog appears
 *   4. User chooses filename, path, clicks Save
 *
 * The document.title is set dynamically so the browser suggests
 * the correct filename in the Save As dialog.
 */

import type { Resume } from "./types"

export interface ExportPDFInput {
  resume: Resume
  onStart?: () => void
  onSuccess?: () => void
  onError?: (error: Error) => void
}

function buildFilename(resume: Resume): string {
  const name = resume.personalInfo.fullName?.trim() || "未命名"
  const title = resume.personalInfo.title?.trim() || "简历"
  const clean = (s: string) => s.replace(/[/\\:*?"<>|]/g, "_")
  return `${clean(name)}_${clean(title)}_简历`
}

async function printViaPopup(filename: string): Promise<void> {
  const previewEl = document.getElementById("resume-preview")
  if (!previewEl) {
    throw new Error("未找到简历预览区域，请刷新页面后重试")
  }

  return new Promise((resolve, reject) => {
    // Clone stylesheets so the popup renders identically.
    // Convert relative URLs to absolute — the popup's base URL is about:blank.
    const styles = Array.from(
      document.querySelectorAll("style, link[rel=stylesheet]")
    )
      .map((el) => {
        const clone = el.cloneNode(true) as HTMLElement
        if (
          clone instanceof HTMLLinkElement &&
          clone.getAttribute("href")
        ) {
          const href = clone.getAttribute("href")!
          clone.setAttribute(
            "href",
            new URL(href, window.location.href).href
          )
        }
        return clone.outerHTML
      })
      .join("\n")

    // Clone the preview and reset any on-screen zoom so the PDF
    // renders at native 100% scale instead of appearing shrunk.
    const clonedPreview = previewEl.cloneNode(true) as HTMLElement
    clonedPreview.style.zoom = "1"
    clonedPreview.style.transform = "none"

    const printWindow = window.open("", "_blank", "width=900,height=700")
    if (!printWindow) {
      reject(new Error("浏览器阻止了弹窗，请允许本站弹窗后重试"))
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${filename}</title>
        ${styles}
        <style>
          html, body {
            margin: 0;
            padding: 0;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @media print {
            @page { size: A4; margin: 10mm; }
            html, body { margin: 0; padding: 0; background: white; }
            /* Hide everything outside the preview */
            body > :not(#resume-preview-wrapper) { display: none !important; }
            #resume-preview-wrapper {
              display: block !important;
              position: static !important;
              width: 100% !important;
            }
            #resume-preview {
              zoom: 1 !important;
              transform: none !important;
              margin: 0 !important;
              box-shadow: none !important;
              width: 190mm !important;
              max-width: 190mm !important;
              min-width: 0 !important;
              box-sizing: border-box !important;
              background: white !important;
              overflow: hidden !important;
              word-break: normal;
              overflow-wrap: break-word;
              line-break: auto;
              padding: 0 !important;
            }

            /* ── Containment: all children stay inside ──────── */
            #resume-preview * {
              max-width: 100% !important;
              box-sizing: border-box !important;
            }

            /* Left by default, justify where specified */
            #resume-preview {
              text-align: left;
            }
            #resume-preview .text-justify,
            #resume-preview .text-justify * {
              text-align: justify;
            }
            #resume-preview .overflow-wrap-anywhere,
            #resume-preview [class*="overflow-wrap-anywhere"] {
              overflow-wrap: break-word !important;
            }

            /* ── Semantic segment print styles ──────────── */
            /* Flex bullet row: fixed bullet (12px) + flex-1 content */
            #resume-preview .sembullet-row {
              display: flex !important;
              flex-direction: row !important;
              align-items: baseline !important;
              max-width: 100% !important;
              margin-bottom: 1px;
            }
            #resume-preview .sembullet-row > span:first-child {
              width: 12px !important;
              min-width: 12px !important;
              flex-shrink: 0 !important;
              text-align: left !important;
            }
            #resume-preview .sembullet-row > span:last-child {
              flex: 1 !important;
              min-width: 0 !important;
              word-break: normal !important;
              overflow-wrap: break-word !important;
            }
            #resume-preview .sembullet-block {
              display: block;
              margin-bottom: 3px;
              max-width: 100%;
            }
            #resume-preview .semsection {
              display: block;
              margin-top: 8px;
              margin-bottom: 3px;
              orphans: 2;
              widows: 2;
              word-break: normal;
            }
            #resume-preview .semsection-label {
              font-weight: 700;
              color: var(--resume-heading-color, #111827);
              display: inline;
            }
            #resume-preview .semcat-header {
              display: block;
              margin-top: 8px;
              margin-bottom: 2px;
              font-weight: 700;
              color: var(--resume-heading-color, #1f2937);
              orphans: 2;
              widows: 2;
              word-break: normal;
            }
            #resume-preview .semgap {
              display: block;
              height: 9px;
            }
            #resume-preview .semantic-paragraph {
              display: block;
              max-width: 100%;
              word-break: normal;
              overflow-wrap: break-word;
            }

            /* Flex & fixed-width elements */
            #resume-preview .flex-1 {
              min-width: 0 !important;
              flex-basis: 0% !important;
            }
            #resume-preview .shrink-0 {
              flex-shrink: 1 !important;
              min-width: 0 !important;
            }
            #resume-preview img,
            #resume-preview svg,
            #resume-preview canvas {
              max-width: 100% !important;
              height: auto !important;
            }
            #resume-preview * {
              -webkit-backdrop-filter: none !important;
              backdrop-filter: none !important;
              box-shadow: none !important;
              text-shadow: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div id="resume-preview-wrapper">
          ${clonedPreview.outerHTML}
        </div>
        <script>
          // ── Sentence-boundary break hints ────────────────────
          // Insert ZWS only after sentence/clause-ending marks.
          // NOT after commas (，、) or bullets (·) —
          // those should not trigger line breaks.
          (function insertBreakHints(root) {
            var ZWS = '​';

            var walker = document.createTreeWalker(
              root, NodeFilter.SHOW_TEXT, null
            );
            var textNodes = [];
            while (walker.nextNode()) textNodes.push(walker.currentNode);

            textNodes.forEach(function(node) {
              var text = node.textContent;
              if (!text || text.length < 2) return;

              // Only after sentence/clause-ending marks (NOT commas or bullets)
              text = text.replace(/([。；！？》)】])/g, '$1' + ZWS);

              node.textContent = text;
            });
          })(document.getElementById('resume-preview-wrapper'));

          // ── Overflow guard: ensure no element exceeds preview width ─
          (function enforceMaxWidth(root) {
            var all = root.querySelectorAll('*');
            for (var i = 0; i < all.length; i++) {
              var el = all[i];
              var style = window.getComputedStyle(el);
              // Force max-width on any element wider than its parent
              if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
                el.style.maxWidth = '100%';
                el.style.overflowWrap = 'break-word';
                el.style.wordBreak = 'normal';
              }
            }
          })(document.getElementById('resume-preview-wrapper'));

          // Ensure images are loaded before printing
          var images = document.querySelectorAll('img');
          var loaded = 0;
          var total = images.length;

          function tryPrint() {
            if (loaded >= total) {
              window.print();
              return;
            }
            setTimeout(function() { window.print(); }, 2000);
          }

          if (total === 0) {
            window.print();
          } else {
            images.forEach(function(img) {
              if (img.complete) {
                loaded++;
              } else {
                img.addEventListener('load', function() { loaded++; tryPrint(); });
                img.addEventListener('error', function() { loaded++; tryPrint(); });
              }
            });
            tryPrint();
          }
        <\/script>
      </body>
      </html>
    `)

    printWindow.document.close()

    // The afterprint event fires when the print dialog closes
    // (whether user saved/printed or cancelled — best available signal)
    printWindow.addEventListener("afterprint", () => {
      printWindow.close()
      resolve()
    })

    // Fallback: if afterprint never fires (some browsers),
    // resolve after a generous timeout
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.close()
      }
      resolve()
    }, 120_000)
  })
}

export async function exportResumeToPDF({
  resume,
  onStart,
  onSuccess,
  onError,
}: ExportPDFInput): Promise<void> {
  onStart?.()

  try {
    const filename = buildFilename(resume)
    await printViaPopup(filename)
    onSuccess?.()
  } catch (error) {
    const err = error instanceof Error ? error : new Error("导出失败")
    onError?.(err)
  }
}
