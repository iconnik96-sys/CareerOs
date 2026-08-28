/**
 * CareerOS Client-Side Native PDF Generator
 * Generates standard, valid PDF 1.4 documents formatted with typography,
 * page headers, candidate metadata, and multi-page pagination.
 * Zero external dependencies.
 */

export function createCoverLetterPdfBlob({
    candidateName = 'Applicant',
    targetRole = 'Software Engineer',
    targetCompany = '',
    recipient = 'Hiring Manager',
    subject = '',
    content = '',
    date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}) {
    // Sanitize text for standard Type 1 Helvetica font (ASCII + basic symbols)
    const sanitize = (str) => {
        if (!str) return '';
        return str
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '--')
            .replace(/[\u2022\u2023]/g, '-')
            .replace(/[\u2026]/g, '...')
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
            .replace(/\t/g, '    ');
    };

    const cleanCandidate = sanitize(candidateName) || 'Applicant';
    const cleanRole = sanitize(targetRole) || 'Software Engineer';
    const cleanCompany = sanitize(targetCompany);
    const cleanRecipient = sanitize(recipient);
    const cleanSubject = sanitize(subject);
    const cleanBody = sanitize(content) || '';

    // Word wrap function for ~80 characters (approx 485pt at 10.5pt Helvetica)
    const wrapText = (text, maxChars = 80) => {
        const lines = [];
        const paragraphs = text.split(/\r?\n/);
        for (const para of paragraphs) {
            if (!para.trim()) {
                lines.push('');
                continue;
            }
            const words = para.split(/\s+/);
            let currentLine = '';
            for (const word of words) {
                if (!currentLine) {
                    currentLine = word;
                } else if ((currentLine + ' ' + word).length <= maxChars) {
                    currentLine += ' ' + word;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
            if (currentLine) {
                lines.push(currentLine);
            }
        }
        return lines;
    };

    const escapePdf = (str) => {
        return str
            .replace(/\\/g, '\\\\')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)');
    };

    // Dimensions in Points (A4: 595.28 x 841.89)
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const marginX = 54;
    const marginTop = 50;
    const marginBottom = 50;

    const wrappedBodyLines = wrapText(cleanBody, 80);

    // Calculate line capacities
    // Header on first page takes ~120-140 points
    const p1Capacity = Math.max(15, Math.floor((pageHeight - marginTop - 130 - (cleanSubject ? 24 : 0) - marginBottom) / 15));
    const subseqCapacity = Math.max(25, Math.floor((pageHeight - marginTop - 45 - marginBottom) / 15));

    let lineIndex = 0;
    const pageLinesArray = [];

    // Page 1
    const p1Lines = [];
    while (lineIndex < wrappedBodyLines.length && p1Lines.length < p1Capacity) {
        p1Lines.push(wrappedBodyLines[lineIndex++]);
    }
    pageLinesArray.push(p1Lines);

    // Subsequent pages if any
    while (lineIndex < wrappedBodyLines.length) {
        const pLines = [];
        while (lineIndex < wrappedBodyLines.length && pLines.length < subseqCapacity) {
            pLines.push(wrappedBodyLines[lineIndex++]);
        }
        pageLinesArray.push(pLines);
    }

    const totalPages = pageLinesArray.length;

    // Generate page content streams
    const pageStreams = pageLinesArray.map((lines, pageIdx) => {
        const isFirst = pageIdx === 0;
        let stream = '';

        // Top accent bar (CareerOS Purple Gradient top bar)
        stream += `q 0.58 0.35 0.95 rg 0 ${pageHeight - 6} ${pageWidth} 6 re f Q\n`;

        let currentY = pageHeight - marginTop;

        if (isFirst) {
            // Candidate Name (Bold 18pt)
            stream += `BT /F2 18 Tf 0.08 0.10 0.15 rg ${marginX} ${currentY} Td (${escapePdf(cleanCandidate)}) Tj ET\n`;
            currentY -= 18;

            // Target Role & Company
            const roleLine = cleanCompany ? `${cleanRole} | Application to ${cleanCompany}` : cleanRole;
            stream += `BT /F1 9.5 Tf 0.40 0.44 0.52 rg ${marginX} ${currentY} Td (${escapePdf(roleLine)}) Tj ET\n`;

            // Date aligned to right side
            const dateStr = date || new Date().toLocaleDateString();
            const dateOffset = Math.max(380, pageWidth - marginX - (dateStr.length * 6));
            stream += `BT /F1 9.5 Tf 0.40 0.44 0.52 rg ${dateOffset} ${currentY} Td (${escapePdf(dateStr)}) Tj ET\n`;
            currentY -= 12;

            // Clean Divider Rule
            stream += `q 0.85 0.87 0.92 RG 1 w ${marginX} ${currentY} m ${pageWidth - marginX} ${currentY} l S Q\n`;
            currentY -= 18;

            // Recipient info
            if (cleanRecipient || cleanCompany) {
                stream += `BT /F2 9.5 Tf 0.18 0.20 0.28 rg ${marginX} ${currentY} Td (To: ${escapePdf(cleanRecipient || 'Hiring Manager')}${cleanCompany ? ' - ' + escapePdf(cleanCompany) : ''}) Tj ET\n`;
                currentY -= 16;
            }

            // Subject Line
            if (cleanSubject) {
                stream += `BT /F2 10.5 Tf 0.10 0.12 0.20 rg ${marginX} ${currentY} Td (Subject: ${escapePdf(cleanSubject)}) Tj ET\n`;
                currentY -= 18;
            }
        } else {
            // Continuation header
            stream += `BT /F1 8.5 Tf 0.45 0.48 0.56 rg ${marginX} ${currentY} Td (${escapePdf(cleanCandidate)} - Application Package - Page ${pageIdx + 1}) Tj ET\n`;
            currentY -= 8;
            stream += `q 0.88 0.90 0.94 RG 0.5 w ${marginX} ${currentY} m ${pageWidth - marginX} ${currentY} l S Q\n`;
            currentY -= 18;
        }

        // Body Text
        for (const line of lines) {
            if (!line.trim()) {
                currentY -= 7; // Paragraph space
            } else {
                stream += `BT /F1 10 Tf 0.15 0.18 0.22 rg ${marginX} ${currentY} Td (${escapePdf(line)}) Tj ET\n`;
                currentY -= 14;
            }
        }

        // Footer
        const footerY = marginBottom - 18;
        stream += `q 0.88 0.90 0.94 RG 0.5 w ${marginX} ${footerY + 12} m ${pageWidth - marginX} ${footerY + 12} l S Q\n`;
        stream += `BT /F1 8 Tf 0.50 0.53 0.60 rg ${marginX} ${footerY} Td (Generated via CareerOS AI Studio - Grounded Career Applications) Tj ET\n`;
        const pageNumberStr = `Page ${pageIdx + 1} of ${totalPages}`;
        stream += `BT /F1 8 Tf 0.50 0.53 0.60 rg ${pageWidth - marginX - (pageNumberStr.length * 5)} ${footerY} Td (${escapePdf(pageNumberStr)}) Tj ET\n`;

        return stream;
    });

    // Construct the complete PDF document structure
    // Object numbering:
    // 1: Catalog
    // 2: Pages
    // 3: Font Helvetica (F1)
    // 4: Font Helvetica-Bold (F2)
    // For each page i (0 to totalPages-1):
    //   Page Object: 5 + (i * 2)
    //   Stream Object: 5 + (i * 2) + 1

    const fontF1ObjNum = 3;
    const fontF2ObjNum = 4;
    const pageObjStart = 5;

    const pageObjNums = [];
    const streamObjNums = [];
    for (let i = 0; i < totalPages; i++) {
        pageObjNums.push(pageObjStart + (i * 2));
        streamObjNums.push(pageObjStart + (i * 2) + 1);
    }

    const totalObjects = 4 + (totalPages * 2);

    // Build PDF content
    let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const offsets = {};

    const appendObj = (num, contentStr) => {
        offsets[num] = pdf.length;
        pdf += `${num} 0 obj\n${contentStr}\nendobj\n`;
    };

    // 1: Catalog
    appendObj(1, '<< /Type /Catalog /Pages 2 0 R >>');

    // 2: Pages
    const kidsStr = pageObjNums.map(n => `${n} 0 R`).join(' ');
    appendObj(2, `<< /Type /Pages /Kids [${kidsStr}] /Count ${totalPages} >>`);

    // 3: Font F1 (Helvetica)
    appendObj(fontF1ObjNum, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');

    // 4: Font F2 (Helvetica-Bold)
    appendObj(fontF2ObjNum, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

    // Pages and Streams
    for (let i = 0; i < totalPages; i++) {
        const pageNum = pageObjNums[i];
        const streamNum = streamObjNums[i];
        const streamData = pageStreams[i];

        // Page Object
        appendObj(pageNum, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${streamNum} 0 R /Resources << /Font << /F1 ${fontF1ObjNum} 0 R /F2 ${fontF2ObjNum} 0 R >> >> >>`);

        // Stream Object
        const streamHeader = `<< /Length ${streamData.length} >>\nstream\n${streamData}\nendstream`;
        appendObj(streamNum, streamHeader);
    }

    // XRef Table
    const startXref = pdf.length;
    pdf += `xref\n0 ${totalObjects + 1}\n`;
    pdf += '0000000000 65535 f \r\n';
    for (let i = 1; i <= totalObjects; i++) {
        const offset = offsets[i] || 0;
        const paddedOffset = String(offset).padStart(10, '0');
        pdf += `${paddedOffset} 00000 n \r\n`;
    }

    // Trailer
    pdf += `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

    return new Blob([pdf], { type: 'application/pdf' });
}

/**
 * Helper function to trigger immediate download of PDF file
 */
export function downloadCoverLetterPdf(filename, options) {
    const blob = createCoverLetterPdfBlob(options);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
