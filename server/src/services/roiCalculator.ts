export interface RoiInput {
  purchasePrice: number;          // AED
  propertySizeSqft: number;       // sq ft
  expectedAnnualRent: number;     // AED per year
  estimatedServiceChargePerSqft: number; // AED per sqft per year
}

export interface RoiBreakdown {
  // Acquisition costs
  dldFee: number;               // 4% of purchasePrice + 580 admin
  trusteeRegistrationFee: number; // 4000 + 5% VAT = 4200
  totalAcquisitionCost: number;  // purchasePrice + dldFee + trusteeRegistrationFee

  // Annual costs
  annualServiceCharge: number;   // propertySizeSqft * estimatedServiceChargePerSqft
  netAnnualIncome: number;       // expectedAnnualRent - annualServiceCharge

  // Yields
  grossYield: number;            // (expectedAnnualRent / purchasePrice) * 100
  netYield: number;              // (netAnnualIncome / totalAcquisitionCost) * 100

  // Breakeven
  breakevenYears: number;        // totalAcquisitionCost / netAnnualIncome (0 if income <= 0)
}

export function calculateRoi(input: RoiInput): RoiBreakdown {
  const { purchasePrice, propertySizeSqft, expectedAnnualRent, estimatedServiceChargePerSqft } = input;

  // Dubai Land Department fee: 4% of purchase price + AED 580 admin fee
  const dldFee = purchasePrice * 0.04 + 580;

  // Trustee Registration Fee: AED 4,000 + 5% VAT
  const trusteeRegistrationFee = 4000 * 1.05; // = 4200

  // Total all-in acquisition cost
  const totalAcquisitionCost = purchasePrice + dldFee + trusteeRegistrationFee;

  // Annual service charge
  const annualServiceCharge = propertySizeSqft * estimatedServiceChargePerSqft;

  // Net annual income after service charges
  const netAnnualIncome = expectedAnnualRent - annualServiceCharge;

  // Gross yield: simple rent / price
  const grossYield = (expectedAnnualRent / purchasePrice) * 100;

  // Net yield: true yield on total acquisition cost
  const netYield = (netAnnualIncome / totalAcquisitionCost) * 100;

  // Breakeven in years
  const breakevenYears = netAnnualIncome > 0
    ? totalAcquisitionCost / netAnnualIncome
    : 0;

  return {
    dldFee: Math.round(dldFee),
    trusteeRegistrationFee: Math.round(trusteeRegistrationFee),
    totalAcquisitionCost: Math.round(totalAcquisitionCost),
    annualServiceCharge: Math.round(annualServiceCharge),
    netAnnualIncome: Math.round(netAnnualIncome),
    grossYield: Math.round(grossYield * 100) / 100,
    netYield: Math.round(netYield * 100) / 100,
    breakevenYears: Math.round(breakevenYears * 10) / 10,
  };
}
