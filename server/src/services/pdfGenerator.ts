import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import type { RoiBreakdown } from './roiCalculator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Resolve font directory relative to this file's location.
// Works for both: tsx (src/services/) and compiled JS (dist/services/)
// Both go up 2 levels to reach server/ root, then into assets/fonts/
const FONTS_DIR = path.resolve(__dirname, '..', '..', 'assets', 'fonts');
const FONT_REGULAR = path.resolve(FONTS_DIR, 'Roboto-Regular.ttf');
const FONT_BOLD = path.resolve(FONTS_DIR, 'Roboto-Bold.ttf');

// Log resolved paths on startup for debugging
console.log('[pdfGenerator] Font paths:', { FONT_REGULAR, FONT_BOLD });

export interface DeckInput {
  propertyName: string;
  purchasePrice: number;
  propertySizeSqft: number;
  expectedAnnualRent: number;
  estimatedServiceChargePerSqft: number;
  breakdown: RoiBreakdown;
  language: 'EN' | 'TR';
}

// ── Colour palette ───────────────────────────────────────────────────────────
const PAGE_BG = '#FFFFFF';
const INK     = '#1E293B';
const MUTED   = '#64748B';
const RULE    = '#E2E8F0';
const GREEN   = '#059669';

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtAed(n: number): string {
  return 'AED\u00A0' + Math.round(n).toLocaleString('en-US');
}
function fmtPct(n: number): string {
  return n.toFixed(2) + '%';
}

// ── Label sets ───────────────────────────────────────────────────────────────
function labels(lang: 'EN' | 'TR') {
  if (lang === 'TR') {
    return {
      title: 'Yatırım Analiz Raporu',
      subtitle: 'Dubai Gayrimenkul Yatırım Özeti',
      preparedBy: 'Hazırlayan: Dubai Broker Brain',
      confidential: 'GİZLİ',
      docLabel: 'ÖZEL YATIRIM ANALİZİ',
      section1: '1.  YATIRIM ÖZETİ',
      propertyName: 'Mülk Adı',
      purchasePrice: 'Satın Alma Fiyatı',
      size: 'Büyüklük',
      annualRent: 'Yıllık Kira Geliri',
      section2: '2.  SATIN ALMA MALİYETİ DÖKÜMÜ',
      basePrice: 'Mülk Satın Alma Fiyatı',
      dld: 'Tapu Devir Harcı (DLD) — %4 + 580 AED',
      trustee: 'Tapu Ofisi İşlem Bedeli',
      totalCost: 'Toplam Edinim Maliyeti',
      section3: '3.  GELİR VE GETİRİ ANALİZİ',
      grossRent: 'Brüt Yıllık Kira',
      serviceCharge: 'Yıllık Aidat',
      netIncome: 'Net Yıllık Gelir',
      grossYield: 'BRÜT KİRA GETİRİSİ',
      netYield: 'NET KİRA GETİRİSİ',
      section4: '4.  AMORTİSMAN SÜRESİ',
      breakevenLabel: 'Amortisman Süresi',
      breakevenUnit: 'yıl',
      breakevenNote: 'Toplam edinim maliyetinin net yıllık gelire bölünmesiyle hesaplanmıştır.',
      footer: 'Bu rapor yalnızca bilgilendirme amaçlıdır. Kesin yatırım tavsiyesi değildir. Para birimi: AED (Birleşik Arap Emirlikleri Dirhemi).',
      currency: 'Para Birimi: AED — Dirhem',
    };
  }
  return {
    title: 'Investment Analysis Report',
    subtitle: 'Dubai Real Estate Investment Summary',
    preparedBy: 'Prepared by: Dubai Broker Brain',
    confidential: 'CONFIDENTIAL',
    docLabel: 'PRIVATE INVESTMENT ANALYSIS',
    section1: '1.  EXECUTIVE SUMMARY',
    propertyName: 'Property Name',
    purchasePrice: 'Purchase Price',
    size: 'Size',
    annualRent: 'Expected Annual Rent',
    section2: '2.  ACQUISITION COST BREAKDOWN',
    basePrice: 'Base Purchase Price',
    dld: 'Dubai Land Department Fee — 4% + AED 580',
    trustee: 'Trustee Registration Fee (incl. VAT)',
    totalCost: 'Total Acquisition Cost',
    section3: '3.  INCOME & YIELD ANALYSIS',
    grossRent: 'Gross Annual Rent',
    serviceCharge: 'Annual Service Charge',
    netIncome: 'Net Annual Income',
    grossYield: 'GROSS YIELD',
    netYield: 'NET YIELD',
    section4: '4.  INVESTMENT TIMELINE',
    breakevenLabel: 'Breakeven Period',
    breakevenUnit: 'years',
    breakevenNote: 'Calculated as total acquisition cost divided by net annual income.',
    footer: 'This report is for informational purposes only and does not constitute investment advice. All currency in AED (UAE Dirham).',
    currency: 'Currency: AED — UAE Dirham',
  };
}

// ── Main export ───────────────────────────────────────────────────────────────
export function generateInvestmentDeckPdf(input: DeckInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const L = labels(input.language);
    const { breakdown: b } = input;

    if (!existsSync(FONT_REGULAR) || !existsSync(FONT_BOLD)) {
      reject(new Error(`Font files not found.\n  Regular: ${FONT_REGULAR}\n  Bold: ${FONT_BOLD}\n  Run: curl to re-download fonts into server/assets/fonts/`));
      return;
    }

    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      bufferPages: true,
      info: {
        Title: L.title,
        Author: 'Dubai Broker Brain',
        Subject: input.propertyName,
      },
    });

    // Register TTF fonts
    try {
      doc.registerFont('Regular', FONT_REGULAR);
      doc.registerFont('Bold', FONT_BOLD);
    } catch (fontErr) {
      reject(new Error(`Failed to register fonts: ${fontErr instanceof Error ? fontErr.message : fontErr}`));
      return;
    }

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
    const PAGE_W   = 595;
    const PAGE_H   = 842;
    const MARGIN   = 48;
    const CONTENT_W = PAGE_W - MARGIN * 2;
    const ROW_H    = 26;

    // ── PAGE BACKGROUND ──────────────────────────────────────────────────────
    doc.rect(0, 0, PAGE_W, PAGE_H).fill(PAGE_BG);

    // ── HEADER ───────────────────────────────────────────────────────────────
    // Thin top rule
    doc.rect(MARGIN, 36, CONTENT_W, 1).fill(INK);

    // Document label
    doc.fontSize(7.5).fillColor(MUTED).font('Bold')
      .text(L.docLabel, MARGIN, 44, { width: CONTENT_W, lineBreak: false });

    // Pre-calculate property name height so header rule shifts down for long names
    doc.fontSize(22).font('Bold');
    const nameH = doc.heightOfString(input.propertyName, { width: CONTENT_W - 120 });
    const headerRuleY = Math.max(88, 56 + nameH + 10);

    // Property name (large) — left aligned, allow wrapping
    doc.fontSize(22).fillColor(INK).font('Bold')
      .text(input.propertyName, MARGIN, 56, { width: CONTENT_W - 120 });

    // Date — top-right, anchored at y=56 regardless of name height
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.fontSize(8).fillColor(MUTED).font('Regular')
      .text(dateStr, MARGIN, 56, { width: CONTENT_W, align: 'right', lineBreak: false });

    // Bottom header rule — dynamic position
    doc.rect(MARGIN, headerRuleY, CONTENT_W, 1).fill(RULE);

    let y = headerRuleY + 16;

    // ── Helper: section label ─────────────────────────────────────────────────
    function drawSectionLabel(text: string, yPos: number): number {
      const labelY = yPos + 10;
      doc.fontSize(7.5).fillColor(MUTED).font('Bold')
        .text(text.toUpperCase(), MARGIN, labelY, { width: CONTENT_W, lineBreak: false });
      return labelY + 6 + 8; // label height approx 10, then 6px gap, then 8 internal offset
    }

    // ── Helper: data row ──────────────────────────────────────────────────────
    function drawRow(
      label: string,
      value: string,
      yPos: number,
      opts: {
        labelColor?: string;
        valueColor?: string;
        valueFontSize?: number;
        labelBold?: boolean;
        wrapValue?: boolean;
      } = {},
    ): number {
      const labelColor = opts.labelColor ?? MUTED;
      const valueColor = opts.valueColor ?? INK;
      const valueFontSize = opts.valueFontSize ?? 9.5;
      const labelFont = opts.labelBold ? 'Bold' : 'Regular';

      if (opts.wrapValue) {
        // Multi-line value: spans full content width, left-aligned under a short label
        doc.fontSize(9.5).fillColor(labelColor).font(labelFont)
          .text(label, MARGIN, yPos + 7, { width: CONTENT_W * 0.35, lineBreak: false });
        doc.fontSize(valueFontSize).font('Bold');
        const valH = doc.heightOfString(value, { width: CONTENT_W * 0.6 });
        const rowH = Math.max(ROW_H, valH + 14);
        doc.fillColor(valueColor)
          .text(value, MARGIN + CONTENT_W * 0.4, yPos + 7, { width: CONTENT_W * 0.6, align: 'left' });
        doc.rect(MARGIN, yPos + rowH - 0.5, CONTENT_W, 0.5).fill(RULE);
        return yPos + rowH;
      }

      doc.fontSize(9.5).fillColor(labelColor).font(labelFont)
        .text(label, MARGIN, yPos + 7, { width: CONTENT_W * 0.6, lineBreak: false });

      doc.fontSize(valueFontSize).fillColor(valueColor).font('Bold')
        .text(value, MARGIN, yPos + 7, { width: CONTENT_W, align: 'right', lineBreak: false });

      // Bottom divider
      doc.rect(MARGIN, yPos + ROW_H - 0.5, CONTENT_W, 0.5).fill(RULE);

      return yPos + ROW_H;
    }

    // ── SECTION 1: EXECUTIVE SUMMARY ─────────────────────────────────────────
    y = drawSectionLabel(L.section1, y);
    y = drawRow(L.propertyName, input.propertyName, y, { wrapValue: true });
    y = drawRow(L.purchasePrice, fmtAed(input.purchasePrice), y);
    y = drawRow(L.size, `${input.propertySizeSqft.toLocaleString()} sqft`, y);
    y = drawRow(L.annualRent, fmtAed(input.expectedAnnualRent), y);
    y += 18;

    // ── SECTION 2: ACQUISITION COST BREAKDOWN ────────────────────────────────
    y = drawSectionLabel(L.section2, y);
    y = drawRow(L.basePrice, fmtAed(input.purchasePrice), y);
    y = drawRow(L.dld, fmtAed(b.dldFee), y);
    y = drawRow(L.trustee, fmtAed(b.trusteeRegistrationFee), y);
    y = drawRow(L.totalCost, fmtAed(b.totalAcquisitionCost), y, {
      labelColor: INK,
      valueColor: INK,
      valueFontSize: 11,
      labelBold: true,
    });
    y += 18;

    // ── SECTION 3: INCOME & YIELD ANALYSIS ───────────────────────────────────
    y = drawSectionLabel(L.section3, y);
    y = drawRow(L.grossRent, fmtAed(input.expectedAnnualRent), y);
    y = drawRow(L.serviceCharge, `- ${fmtAed(b.annualServiceCharge)}`, y);
    y = drawRow(L.netIncome, fmtAed(b.netAnnualIncome), y, {
      valueColor: GREEN,
    });
    y += 24;

    // ── YIELD METRICS BLOCK (three columns, no borders) ───────────────────────
    const colW = CONTENT_W / 3;

    // Column positions
    const col1X = MARGIN;
    const col2X = MARGIN + colW;
    const col3X = MARGIN + colW * 2;

    // Gross Yield — left
    doc.fontSize(7.5).fillColor(MUTED).font('Bold')
      .text(L.grossYield, col1X, y, { width: colW, align: 'left', lineBreak: false });
    doc.fontSize(32).fillColor(INK).font('Bold')
      .text(b.grossYield.toFixed(2) + '%', col1X, y + 14, { width: colW, align: 'left', lineBreak: false });

    // Net Yield — center
    doc.fontSize(7.5).fillColor(MUTED).font('Bold')
      .text(L.netYield, col2X, y, { width: colW, align: 'center', lineBreak: false });
    doc.fontSize(32).fillColor(GREEN).font('Bold')
      .text(b.netYield.toFixed(2) + '%', col2X, y + 14, { width: colW, align: 'center', lineBreak: false });

    // Breakeven — right
    doc.fontSize(7.5).fillColor(MUTED).font('Bold')
      .text(L.breakevenLabel.toUpperCase(), col3X, y, { width: colW, align: 'right', lineBreak: false });
    doc.fontSize(32).fillColor(INK).font('Bold')
      .text(b.breakevenYears + ' ' + L.breakevenUnit, col3X, y + 14, { width: colW, align: 'right', lineBreak: false });

    y += 64;

    // ── FOOTER ────────────────────────────────────────────────────────────────
    doc.rect(MARGIN, PAGE_H - 42, CONTENT_W, 1).fill(RULE);
    doc.fontSize(7).fillColor(MUTED).font('Regular')
      .text(L.footer, MARGIN, PAGE_H - 28, { width: CONTENT_W, align: 'center', lineBreak: false });

    doc.end();
    } catch (drawErr) {
      reject(new Error(`PDF drawing error: ${drawErr instanceof Error ? drawErr.message : drawErr}`));
    }
  });
}
