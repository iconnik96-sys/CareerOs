/**
 * PDF Export Utility for CareerOS Overleaf LaTeX Resumes
 * Generates and automatically downloads a pixel-perfect, publication-grade PDF file
 * directly to the user's Downloads directory without viewport clipping or offsets.
 */

export const loadHtml2Pdf = () => {
    return new Promise((resolve, reject) => {
        if (typeof window !== 'undefined' && window.html2pdf) {
            return resolve(window.html2pdf);
        }

        const existingScript = document.getElementById('html2pdf-script');
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(window.html2pdf));
            existingScript.addEventListener('error', (err) => reject(err));
            return;
        }

        const script = document.createElement('script');
        script.id = 'html2pdf-script';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.async = true;
        script.onload = () => {
            if (window.html2pdf) {
                resolve(window.html2pdf);
            } else {
                reject(new Error('html2pdf failed to initialize'));
            }
        };
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
    });
};

export const downloadResumePdf = async (resumeData = {}, elementId = 'careeros-resume-preview') => {
    const candidateName = (resumeData?.personal?.fullName || 'Candidate')
        .trim()
        .replace(/[^a-zA-Z0-9_\-\s]/g, '')
        .replace(/\s+/g, '_');
    const filename = `${candidateName || 'Candidate'}_Resume.pdf`;

    const targetElement = document.getElementById(elementId);
    if (!targetElement) {
        throw new Error(`Resume preview element #${elementId} not found`);
    }

    // 1. Create a clean isolated clone of the resume element
    // This eliminates any parent layout offsets (sidebar, grid columns, overflow containers)
    const clone = targetElement.cloneNode(true);
    clone.id = 'careeros-resume-pdf-clone';

    // Standard A4 width: 210mm ~ 794px at 96 DPI
    clone.style.width = '794px';
    clone.style.minWidth = '794px';
    clone.style.maxWidth = '794px';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.borderRadius = '0';
    clone.style.margin = '0';
    clone.style.padding = '24px 32px'; // Generous 32px left/right internal paper margin
    clone.style.boxSizing = 'border-box';
    clone.style.backgroundColor = '#ffffff';

    // Isolated render container positioned at (0, 0) behind app layer
    const mountContainer = document.createElement('div');
    mountContainer.style.position = 'fixed';
    mountContainer.style.top = '0';
    mountContainer.style.left = '0';
    mountContainer.style.width = '794px';
    mountContainer.style.zIndex = '-99999';
    mountContainer.style.pointerEvents = 'none';
    mountContainer.style.backgroundColor = '#ffffff';
    mountContainer.appendChild(clone);
    document.body.appendChild(mountContainer);

    try {
        const html2pdf = await loadHtml2Pdf();

        const opt = {
            margin: 0, // Paper already has internal 32px padding, 0 margin prevents right-edge cutoff
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2, // 2x DPI for crystal clear text
                useCORS: true,
                letterRendering: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: 794
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait'
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        // Render from the isolated clean clone
        await html2pdf().set(opt).from(clone).save();
        return { success: true, filename };
    } catch (err) {
        console.warn('html2pdf download encountered an issue, falling back to isolated print view:', err);
        printIsolatedElement(targetElement, filename);
        return { success: true, fallback: true };
    } finally {
        // Always clean up the temporary mount container
        if (mountContainer && mountContainer.parentNode) {
            mountContainer.parentNode.removeChild(mountContainer);
        }
    }
};

/**
 * Fallback: isolated print without any website chrome/sidebar
 */
const printIsolatedElement = (element, title) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>${title}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 10mm;
                    }
                    * {
                        box-sizing: border-box;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        background: #ffffff;
                    }
                    .resume-preview-sheet {
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                        max-width: 100% !important;
                        width: 100% !important;
                    }
                </style>
            </head>
            <body>
                ${element.outerHTML}
            </body>
        </html>
    `);
    doc.close();

    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 2000);
    }, 500);
};
