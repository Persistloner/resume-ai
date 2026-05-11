/**
 * PDF Export Utility
 *
 * Uses html2pdf.js (html2canvas + jsPDF) to capture
 * the A4 resume preview element and export as PDF.
 *
 * Key design decisions:
 *  - scale: 2 for sharp text (balanced against file size)
 *  - A4 format matches the preview dimensions (210mm × 297mm)
 *  - html2canvas renders DOM as-is → Chinese fonts work if displayed in browser
 *  - Temp clone approach: clone the element, hide interactive bits, capture, remove
 */

interface ExportPDFOptions {
  /** DOM element to capture */
  element: HTMLElement
  /** Output filename (without .pdf extension) */
  filename?: string
  /** Called when export starts */
  onStart?: () => void
  /** Called on success */
  onSuccess?: () => void
  /** Called on failure */
  onError?: (error: Error) => void
}

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297

export async function exportResumeToPDF({
  element,
  filename = "resume",
  onStart,
  onSuccess,
  onError,
}: ExportPDFOptions): Promise<void> {
  onStart?.()

  // Dynamic import — html2pdf.js references browser globals (self)
  // and cannot be statically imported during SSR/prerendering.
  const html2pdf = (await import("html2pdf.js")).default

  try {
    // 1. Clone the element so we can clean it without affecting the UI
    const clone = element.cloneNode(true) as HTMLElement

    // 2. Strip interactive elements from clone (buttons, inputs, etc.)
    const interactiveSelectors = [
      "button",
      "input",
      "textarea",
      "select",
      "[role='button']",
    ]
    for (const sel of interactiveSelectors) {
      clone.querySelectorAll(sel).forEach((el) => el.remove())
    }

    // 3. Ensure clone has a solid white background for PDF rendering
    clone.style.backgroundColor = "#ffffff"
    clone.style.position = "fixed"
    clone.style.left = "-9999px"
    clone.style.top = "0"
    clone.style.zIndex = "-1"

    // 4. Append clone off-screen, capture it, then remove
    document.body.appendChild(clone)

    const opt = {
      margin: 0,
      filename: `${filename}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: {
        scale: 2, // Retina-quality output
        useCORS: true,
        backgroundColor: "#ffffff",
        // Ensure the exact A4 dimensions are captured
        width: clone.offsetWidth,
        height: clone.offsetHeight,
      },
      jsPDF: {
        unit: "mm" as const,
        format: [A4_WIDTH_MM, A4_HEIGHT_MM] as [number, number],
        orientation: "portrait" as const,
      },
      // Page break support for multi-page
      pagebreak: { mode: ["avoid-all", "css", "legacy"] as const },
    }

    await html2pdf().set(opt).from(clone).save()

    // 5. Cleanup
    document.body.removeChild(clone)

    onSuccess?.()
  } catch (error) {
    const err = error instanceof Error ? error : new Error("PDF 导出失败")
    onError?.(err)
  }
}
