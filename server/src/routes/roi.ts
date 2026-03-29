import { Router } from 'express';
import type { Request, Response } from 'express';
import { calculateRoi } from '../services/roiCalculator.js';
import type { RoiInput } from '../services/roiCalculator.js';

const router = Router();

// POST /api/roi-test — public endpoint, no auth required
// Accepts: { purchasePrice, propertySizeSqft, expectedAnnualRent, estimatedServiceChargePerSqft }
// Returns: full RoiBreakdown JSON
router.post('/roi-test', (req: Request, res: Response): void => {
  const {
    purchasePrice,
    propertySizeSqft,
    expectedAnnualRent,
    estimatedServiceChargePerSqft,
  } = req.body as Partial<RoiInput>;

  if (
    typeof purchasePrice !== 'number' ||
    typeof propertySizeSqft !== 'number' ||
    typeof expectedAnnualRent !== 'number' ||
    typeof estimatedServiceChargePerSqft !== 'number'
  ) {
    res.status(400).json({
      error: 'All four fields are required and must be numbers: purchasePrice, propertySizeSqft, expectedAnnualRent, estimatedServiceChargePerSqft',
    });
    return;
  }

  if (purchasePrice <= 0 || propertySizeSqft <= 0 || expectedAnnualRent <= 0 || estimatedServiceChargePerSqft < 0) {
    res.status(400).json({ error: 'All numeric inputs must be positive (estimatedServiceChargePerSqft may be 0)' });
    return;
  }

  const breakdown = calculateRoi({ purchasePrice, propertySizeSqft, expectedAnnualRent, estimatedServiceChargePerSqft });

  res.json({
    input: { purchasePrice, propertySizeSqft, expectedAnnualRent, estimatedServiceChargePerSqft },
    breakdown,
  });
});

export default router;
