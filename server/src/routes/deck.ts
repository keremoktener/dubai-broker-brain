import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { calculateRoi } from '../services/roiCalculator.js';
import { generateInvestmentDeckPdf } from '../services/pdfGenerator.js';

const router = Router();

// POST /api/generate-deck — generates and streams a PDF investment deck
router.post('/generate-deck', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    propertyName,
    purchasePrice,
    propertySizeSqft,
    expectedAnnualRent,
    estimatedServiceChargePerSqft,
    language,
  } = req.body as {
    propertyName?: string;
    purchasePrice?: number;
    propertySizeSqft?: number;
    expectedAnnualRent?: number;
    estimatedServiceChargePerSqft?: number;
    language?: string;
  };

  if (!propertyName || typeof purchasePrice !== 'number' || typeof propertySizeSqft !== 'number' ||
      typeof expectedAnnualRent !== 'number' || typeof estimatedServiceChargePerSqft !== 'number') {
    res.status(400).json({ error: 'propertyName, purchasePrice, propertySizeSqft, expectedAnnualRent, and estimatedServiceChargePerSqft are all required' });
    return;
  }

  const lang: 'EN' | 'TR' = language === 'TR' ? 'TR' : 'EN';

  try {
    const breakdown = calculateRoi({ purchasePrice, propertySizeSqft, expectedAnnualRent, estimatedServiceChargePerSqft });

    const pdfBuffer = await generateInvestmentDeckPdf({
      propertyName,
      purchasePrice,
      propertySizeSqft,
      expectedAnnualRent,
      estimatedServiceChargePerSqft,
      breakdown,
      language: lang,
    });

    const filename = `investment-deck-${propertyName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${lang.toLowerCase()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('[deck] PDF generation error (full):', err);
    res.status(500).json({
      error: 'PDF generation failed',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
