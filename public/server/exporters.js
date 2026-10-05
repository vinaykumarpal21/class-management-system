'use strict';
const fs = require('fs');
const path = require('path');

/**
 * A "dataset" is { title, subtitle?, columns: [{key,label,width,format?}], rows: [...] }.
 * Both exporters accept an array of datasets (one sheet / one section each).
 */

function cellValue(col, row) {
  const raw = row[col.key];
  if (raw === null || raw === undefined) return '';
  return col.format ? col.format(raw) : raw;
}

// ------------------------------------------------------------------ Excel

async function sendExcel(res, datasets, filename) {
  const ExcelJS = require('exceljs'); // required lazily so the rest of the API works even if it is missing
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sagar Classes';
  wb.created = new Date();

  const used = new Set();
  for (const ds of datasets) {
    let name = ds.title.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31);
    while (used.has(name.toLowerCase())) name = name.slice(0, 28) + '_2';
    used.add(name.toLowerCase());

    const ws = wb.addWorksheet(name);
    ws.columns = [{ header: '#', key: '_n', width: 6 }].concat(
      ds.columns.map((c) => ({ header: c.label, key: c.key, width: Math.max(c.width || 20, c.label.length + 4) }))
    );
    const head = ws.getRow(1);
    head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    head.alignment = { vertical: 'middle' };
    head.height = 22;
    head.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    });

    ds.rows.forEach((r, i) => {
      const obj = { _n: i + 1 };
      ds.columns.forEach((c) => { obj[c.key] = cellValue(c, r); });
      ws.addRow(obj);
    });
    ws.eachRow((row, n) => {
      if (n > 1) row.alignment = { vertical: 'top', wrapText: true };
    });
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ds.columns.length + 1 } };
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
}

// -------------------------------------------------------------------- PDF

// pdfkit's built-in Helvetica only covers Latin-1 / WinAnsi. Anything else (emoji, Devanagari ...)
// would print as garbage, so it is stripped unless a Unicode TTF is supplied via PDF_FONT_PATH.
function pdfSafe(v, unicodeFont) {
  const s = String(v ?? '').replace(/\s+/g, ' ').trim();
  if (unicodeFont) return s;
  return s.replace(/[^\x20-\x7E\u00A0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u20AC]/g, '').trim();
}

function sendPdf(res, datasets, filename, { logoPath, fontPath } = {}) {
  const PDFDocument = require('pdfkit');
  const useFont = fontPath && fs.existsSync(fontPath) ? fontPath : null;
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36, bufferPages: true, info: { Title: filename, Author: 'Sagar Classes' } });
  if (useFont) { doc.registerFont('Body', useFont); doc.registerFont('BodyBold', useFont); }
  const F = useFont ? 'Body' : 'Helvetica';
  const FB = useFont ? 'BodyBold' : 'Helvetica-Bold';

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
  doc.pipe(res);

  const M = 36;
  const hasLogo = logoPath && fs.existsSync(logoPath) && /\.(jpe?g|png)$/i.test(logoPath);
  const stamp = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  function pageHeader(ds, first) {
    let y = M;
    if (first) {
      if (hasLogo) { try { doc.image(logoPath, M, y, { fit: [34, 34] }); } catch (_) { /* ignore a bad logo */ } }
      doc.font(FB).fontSize(15).fillColor('#1e1b4b').text('SAGAR CLASSES', M + (hasLogo ? 44 : 0), y + 1, { lineBreak: false });
      doc.font(F).fontSize(9).fillColor('#64748b').text(`Generated ${stamp}`, M + (hasLogo ? 44 : 0), y + 20, { lineBreak: false });
      y += 46;
    }
    doc.font(FB).fontSize(12).fillColor('#111827').text(pdfSafe(ds.title, useFont) + (first ? '' : ' (continued)'), M, y, { lineBreak: false });
    y += 16;
    if (ds.subtitle && first) {
      doc.font(F).fontSize(9).fillColor('#475569').text(pdfSafe(ds.subtitle, useFont), M, y, { lineBreak: false });
      y += 14;
    }
    return y + 4;
  }

  datasets.forEach((ds, dsIndex) => {
    if (dsIndex > 0) doc.addPage();
    const usable = doc.page.width - M * 2;
    const cols = [{ key: '_n', label: '#', width: 5 }].concat(ds.columns);
    const totalW = cols.reduce((a, c) => a + (c.width || 20), 0);
    const widths = cols.map((c) => ((c.width || 20) / totalW) * usable);
    const pad = 5;
    const bottom = () => doc.page.height - M - 18;

    function drawHeaderRow(y) {
      doc.rect(M, y, usable, 20).fill('#4f46e5');
      doc.font(FB).fontSize(9).fillColor('#ffffff');
      let x = M;
      cols.forEach((c, i) => { doc.text(pdfSafe(c.label, useFont), x + pad, y + 6, { width: widths[i] - pad * 2, lineBreak: false, ellipsis: true }); x += widths[i]; });
      return y + 20;
    }

    let y = pageHeader(ds, true);
    y = drawHeaderRow(y);

    if (!ds.rows.length) {
      doc.font(F).fontSize(10).fillColor('#64748b').text('No records.', M + pad, y + 8, { lineBreak: false });
    }

    ds.rows.forEach((row, ri) => {
      const texts = cols.map((c) => (c.key === '_n' ? String(ri + 1) : pdfSafe(cellValue(c, row), useFont)));
      doc.font(F).fontSize(9);
      const heights = texts.map((t, i) => doc.heightOfString(t || ' ', { width: widths[i] - pad * 2 }));
      const rowH = Math.min(Math.max(...heights) + 10, 120);

      if (y + rowH > bottom()) {
        doc.addPage();
        y = pageHeader(ds, false);
        y = drawHeaderRow(y);
      }
      if (ri % 2 === 0) doc.rect(M, y, usable, rowH).fill('#f1f5f9');
      doc.font(F).fontSize(9).fillColor('#0f172a');
      let x = M;
      texts.forEach((t, i) => {
        doc.text(t, x + pad, y + 5, { width: widths[i] - pad * 2, height: rowH - 8, ellipsis: true });
        x += widths[i];
      });
      doc.moveTo(M, y + rowH).lineTo(M + usable, y + rowH).lineWidth(0.4).strokeColor('#e2e8f0').stroke();
      y += rowH;
    });

    doc.font(F).fontSize(9).fillColor('#475569')
      .text(`Total records: ${ds.rows.length}`, M, Math.min(y + 8, bottom() + 4), { lineBreak: false });
  });

  // footer with page numbers (needs bufferPages)
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const oldBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0; // otherwise writing near the bottom edge triggers an automatic new page
    doc.font(F).fontSize(8).fillColor('#94a3b8')
      .text(`Page ${i + 1} of ${range.count}`, M, doc.page.height - 26, { width: doc.page.width - M * 2, align: 'right', lineBreak: false });
    doc.page.margins.bottom = oldBottom;
  }
  doc.end();
}

module.exports = { sendExcel, sendPdf, pdfSafe };
