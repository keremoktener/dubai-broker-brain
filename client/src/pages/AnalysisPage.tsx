import { useState } from 'react';
import { api } from '../api/auth.ts';
import {
  Box, Typography, Paper, Grid, TextField, Button,
  CircularProgress, ToggleButtonGroup, ToggleButton,
  Divider, Chip, Alert,
} from '@mui/material';
import { PictureAsPdf, AutoAwesome, Calculate, AutoFixHigh } from '@mui/icons-material';

interface FormState {
  propertyName: string;
  purchasePrice: string;
  propertySizeSqft: string;
  expectedAnnualRent: string;
  estimatedServiceChargePerSqft: string;
}

interface RoiPreview {
  dldFee: number;
  trusteeRegistrationFee: number;
  totalAcquisitionCost: number;
  annualServiceCharge: number;
  netAnnualIncome: number;
  grossYield: number;
  netYield: number;
  breakevenYears: number;
}

function fmtAed(n: number) {
  return 'AED ' + Math.round(n).toLocaleString('en-US');
}

const EMPTY: FormState = {
  propertyName: '',
  purchasePrice: '',
  propertySizeSqft: '',
  expectedAnnualRent: '',
  estimatedServiceChargePerSqft: '',
};

// Client-side ROI preview (mirrors server logic)
function calcPreview(f: FormState): RoiPreview | null {
  const price = parseFloat(f.purchasePrice);
  const sqft = parseFloat(f.propertySizeSqft);
  const rent = parseFloat(f.expectedAnnualRent);
  const sc = parseFloat(f.estimatedServiceChargePerSqft);
  if (!price || !sqft || !rent || isNaN(sc)) return null;

  const dldFee = Math.round(price * 0.04 + 580);
  const trusteeRegistrationFee = 4200;
  const totalAcquisitionCost = Math.round(price + dldFee + trusteeRegistrationFee);
  const annualServiceCharge = Math.round(sqft * sc);
  const netAnnualIncome = Math.round(rent - annualServiceCharge);
  const grossYield = Math.round((rent / price) * 10000) / 100;
  const netYield = Math.round((netAnnualIncome / totalAcquisitionCost) * 10000) / 100;
  const breakevenYears = netAnnualIncome > 0
    ? Math.round((totalAcquisitionCost / netAnnualIncome) * 10) / 10
    : 0;

  return { dldFee, trusteeRegistrationFee, totalAcquisitionCost, annualServiceCharge, netAnnualIncome, grossYield, netYield, breakevenYears };
}

export default function AnalysisPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [lang, setLang] = useState<'EN' | 'TR'>('EN');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const preview = calcPreview(form);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleGenerate = async () => {
    if (!preview || !form.propertyName) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await api.post('/generate-deck', {
        propertyName: form.propertyName,
        purchasePrice: parseFloat(form.purchasePrice),
        propertySizeSqft: parseFloat(form.propertySizeSqft),
        expectedAnnualRent: parseFloat(form.expectedAnnualRent),
        estimatedServiceChargePerSqft: parseFloat(form.estimatedServiceChargePerSqft),
        language: lang,
      }, { responseType: 'blob' });

      // Trigger browser download
      const blob = new Blob([res.data as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `investment-deck-${form.propertyName.replace(/\s+/g, '-').toLowerCase()}-${lang.toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      let detail = 'PDF generation failed — check server is running and try again.';
      // When responseType: 'blob', axios wraps error responses as Blobs — read them as text
      if (
        err != null &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: unknown } }).response?.data instanceof Blob
      ) {
        try {
          const text = await ((err as { response: { data: Blob } }).response.data).text();
          const json = JSON.parse(text) as { error?: string; detail?: string };
          detail = json.detail ?? json.error ?? detail;
        } catch { /* keep default */ }
      }
      setError(detail);
    } finally {
      setGenerating(false);
    }
  };

  const handleImport = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError(null);
    try {
      const res = await api.post('/scrape-property', { url: importUrl.trim() });
      const d = res.data as {
        propertyName: string;
        purchasePrice: number;
        propertySizeSqft: number;
        expectedAnnualRent: number | null;
        estimatedServiceChargePerSqft: number | null;
      };
      setForm(prev => ({
        ...prev,
        propertyName: d.propertyName ?? prev.propertyName,
        purchasePrice: d.purchasePrice != null ? String(d.purchasePrice) : prev.purchasePrice,
        propertySizeSqft: d.propertySizeSqft != null ? String(d.propertySizeSqft) : prev.propertySizeSqft,
        expectedAnnualRent: d.expectedAnnualRent != null ? String(d.expectedAnnualRent) : prev.expectedAnnualRent,
        estimatedServiceChargePerSqft: d.estimatedServiceChargePerSqft != null ? String(d.estimatedServiceChargePerSqft) : prev.estimatedServiceChargePerSqft,
      }));
      setImportUrl('');
    } catch (err: unknown) {
      let detail = 'Import failed — check the URL and try again.';
      if (
        err != null && typeof err === 'object' && 'response' in err &&
        (err as { response?: { data?: unknown } }).response?.data != null
      ) {
        const data = (err as { response: { data: { detail?: string; error?: string } } }).response.data;
        detail = data.detail ?? data.error ?? detail;
      }
      setImportError(detail);
    } finally {
      setImporting(false);
    }
  };

  const PREVIEW_ROWS_EN = preview ? [
    { label: 'DLD Fee (4% + AED 580)', value: fmtAed(preview.dldFee), color: '#F59E0B' },
    { label: 'Trustee Fee (incl. VAT)', value: fmtAed(preview.trusteeRegistrationFee), color: '#F59E0B' },
    { label: 'Total Acquisition Cost', value: fmtAed(preview.totalAcquisitionCost), color: '#C9A84C', bold: true },
    { label: 'Annual Service Charge', value: fmtAed(preview.annualServiceCharge), color: '#94A3B8' },
    { label: 'Net Annual Income', value: fmtAed(preview.netAnnualIncome), color: '#10B981', bold: true },
    { label: 'Gross Yield', value: preview.grossYield + '%', color: '#3B82F6' },
    { label: 'Net Yield', value: preview.netYield + '%', color: '#10B981', bold: true },
    { label: 'Breakeven', value: preview.breakevenYears + ' years', color: '#C9A84C' },
  ] : [];

  const PREVIEW_ROWS_TR = preview ? [
    { label: 'Tapu Devir Harcı (%4 + 580 AED)', value: fmtAed(preview.dldFee), color: '#F59E0B' },
    { label: 'Yediemin Ücreti (KDV dahil)', value: fmtAed(preview.trusteeRegistrationFee), color: '#F59E0B' },
    { label: 'Toplam Edinim Maliyeti', value: fmtAed(preview.totalAcquisitionCost), color: '#C9A84C', bold: true },
    { label: 'Yıllık Aidat', value: fmtAed(preview.annualServiceCharge), color: '#94A3B8' },
    { label: 'Net Yıllık Gelir', value: fmtAed(preview.netAnnualIncome), color: '#10B981', bold: true },
    { label: 'Brüt Kira Getirisi', value: preview.grossYield + '%', color: '#3B82F6' },
    { label: 'Net Kira Getirisi', value: preview.netYield + '%', color: '#10B981', bold: true },
    { label: 'Amortisman Süresi', value: preview.breakevenYears + ' yıl', color: '#C9A84C' },
  ] : [];

  const previewRows = lang === 'TR' ? PREVIEW_ROWS_TR : PREVIEW_ROWS_EN;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
          <PictureAsPdf sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h5" fontWeight={700} color="primary.light">
            Investment Deck Generator
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Input any property's financials and generate a luxury-branded, bilingual PDF investment report — the "Whale Bait" deck.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Input Form */}
        <Grid item xs={12} md={5}>
          <Paper
            sx={{
              p: 3,
              border: '1px solid rgba(201,168,76,0.15)',
              background: 'linear-gradient(135deg, rgba(201,168,76,0.04) 0%, rgba(8,11,20,0) 100%)',
            }}
          >
            {/* Smart Import */}
            <Box
              sx={{
                p: 2, mb: 3, borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(8,11,20,0) 100%)',
                border: '1px solid rgba(59,130,246,0.2)',
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <AutoFixHigh sx={{ color: '#3B82F6', fontSize: 18 }} />
                <Typography variant="caption" fontWeight={700} sx={{ color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem' }}>
                  Smart Import
                </Typography>
              </Box>
              <Box display="flex" gap={1}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Paste a property listing URL…"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleImport(); }}
                  sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  disabled={importing || !importUrl.trim()}
                  onClick={handleImport}
                  startIcon={importing ? <CircularProgress size={14} color="inherit" /> : <AutoFixHigh />}
                  sx={{
                    whiteSpace: 'nowrap', minWidth: 100,
                    borderColor: 'rgba(59,130,246,0.4)',
                    color: '#3B82F6',
                    fontSize: '0.75rem', fontWeight: 700,
                    '&:hover': { borderColor: '#3B82F6', bgcolor: 'rgba(59,130,246,0.08)' },
                    '&.Mui-disabled': { borderColor: 'rgba(59,130,246,0.15)', color: 'rgba(59,130,246,0.35)' },
                  }}
                >
                  {importing ? 'Reading…' : 'Auto-Fill'}
                </Button>
              </Box>
              {importError && (
                <Alert severity="error" sx={{ mt: 1.5, fontSize: '0.75rem', py: 0.5 }}>{importError}</Alert>
              )}
            </Box>

            <Box display="flex" alignItems="center" gap={1.5} mb={3}>
              <Calculate sx={{ color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight={700}>Property Inputs</Typography>
            </Box>

            <Box display="flex" flexDirection="column" gap={2.5}>
              <TextField
                label="Property Name"
                value={form.propertyName}
                onChange={set('propertyName')}
                size="small" fullWidth required
                placeholder="e.g. Emaar Beachfront — Marina Vista 2BR"
              />
              <TextField
                label="Purchase Price (AED)"
                value={form.purchasePrice}
                onChange={set('purchasePrice')}
                size="small" fullWidth required type="number"
                inputProps={{ min: 0 }}
                placeholder="e.g. 3200000"
              />
              <TextField
                label="Property Size (sqft)"
                value={form.propertySizeSqft}
                onChange={set('propertySizeSqft')}
                size="small" fullWidth required type="number"
                inputProps={{ min: 0 }}
                placeholder="e.g. 1180"
              />
              <TextField
                label="Expected Annual Rent (AED)"
                value={form.expectedAnnualRent}
                onChange={set('expectedAnnualRent')}
                size="small" fullWidth required type="number"
                inputProps={{ min: 0 }}
                placeholder="e.g. 230400"
              />
              <TextField
                label="Service Charge per Sqft (AED/year)"
                value={form.estimatedServiceChargePerSqft}
                onChange={set('estimatedServiceChargePerSqft')}
                size="small" fullWidth required type="number"
                inputProps={{ min: 0, step: 0.5 }}
                placeholder="e.g. 18"
              />

              <Divider sx={{ borderColor: 'rgba(201,168,76,0.1)' }} />

              {/* Language Toggle */}
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                  Report Language
                </Typography>
                <ToggleButtonGroup
                  value={lang} exclusive
                  onChange={(_, v) => { if (v) setLang(v as 'EN' | 'TR'); }}
                  fullWidth size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      py: 0.8, fontWeight: 700, fontSize: '0.8rem',
                      color: 'text.secondary',
                      border: '1px solid rgba(201,168,76,0.2)',
                      '&.Mui-selected': {
                        bgcolor: 'rgba(201,168,76,0.15)',
                        color: 'primary.main',
                        borderColor: 'rgba(201,168,76,0.5)',
                      },
                    },
                  }}
                >
                  <ToggleButton value="EN">English</ToggleButton>
                  <ToggleButton value="TR">Turkce</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {error && <Alert severity="error" sx={{ fontSize: '0.8rem' }}>{error}</Alert>}

              <Button
                variant="contained"
                fullWidth
                disabled={generating || !preview || !form.propertyName}
                onClick={handleGenerate}
                startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdf />}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #C9A84C 0%, #9A7A2E 100%)',
                  color: '#0A0A0F',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  letterSpacing: '0.03em',
                  boxShadow: '0 4px 20px rgba(201,168,76,0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #D4B45C 0%, #A88538 100%)',
                    boxShadow: '0 6px 28px rgba(201,168,76,0.45)',
                  },
                  '&.Mui-disabled': {
                    background: 'rgba(201,168,76,0.15)',
                    color: 'rgba(201,168,76,0.4)',
                  },
                }}
              >
                {generating ? 'Generating...' : 'Generate Investment Deck'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Live Preview */}
        <Grid item xs={12} md={7}>
          <Paper
            sx={{
              p: 3, height: '100%',
              border: '1px solid rgba(201,168,76,0.1)',
              background: 'linear-gradient(135deg, rgba(8,11,20,0.8) 0%, rgba(12,18,34,0.6) 100%)',
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <AutoAwesome sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700}>Live ROI Preview</Typography>
              </Box>
              <Chip
                label={lang === 'TR' ? 'Turkce Rapor' : 'English Report'}
                size="small"
                sx={{
                  bgcolor: 'rgba(201,168,76,0.1)', color: 'primary.main',
                  border: '1px solid rgba(201,168,76,0.3)', fontSize: '0.7rem', fontWeight: 600,
                }}
              />
            </Box>

            {!preview ? (
              <Box
                display="flex" flexDirection="column" alignItems="center" justifyContent="center"
                py={6} sx={{ opacity: 0.4 }}
              >
                <PictureAsPdf sx={{ fontSize: 56, color: 'primary.main', mb: 1.5 }} />
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Fill in the property details to see a live calculation preview
                </Typography>
              </Box>
            ) : (
              <>
                {/* Property badge */}
                <Box
                  sx={{
                    p: 2, mb: 3, borderRadius: 2,
                    background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(8,11,20,0) 100%)',
                    border: '1px solid rgba(201,168,76,0.15)',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block">
                    {lang === 'TR' ? 'Mulk Adi' : 'Property'}
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={700} color="primary.light">
                    {form.propertyName || '—'}
                  </Typography>
                </Box>

                {/* Yield highlights */}
                <Grid container spacing={1.5} mb={3}>
                  {[
                    { label: lang === 'TR' ? 'Brut Getiri' : 'Gross Yield', value: preview.grossYield + '%', color: '#3B82F6' },
                    { label: lang === 'TR' ? 'Net Getiri' : 'Net Yield', value: preview.netYield + '%', color: '#10B981' },
                    { label: lang === 'TR' ? 'Amortisman' : 'Breakeven', value: preview.breakevenYears + (lang === 'TR' ? ' yil' : ' yrs'), color: '#C9A84C' },
                  ].map(item => (
                    <Grid item xs={4} key={item.label}>
                      <Box
                        sx={{
                          p: 1.5, borderRadius: 2, textAlign: 'center',
                          bgcolor: `${item.color}11`,
                          border: `1px solid ${item.color}33`,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" display="block">{item.label}</Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ color: item.color, lineHeight: 1.2 }}>
                          {item.value}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                <Divider sx={{ borderColor: 'rgba(201,168,76,0.08)', mb: 2 }} />

                {/* Detail rows */}
                <Box display="flex" flexDirection="column" gap={1}>
                  {previewRows.map(row => (
                    <Box key={row.label} display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">{row.label}</Typography>
                      <Typography
                        variant="caption"
                        fontWeight={row.bold ? 700 : 500}
                        sx={{ color: row.color }}
                      >
                        {row.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
