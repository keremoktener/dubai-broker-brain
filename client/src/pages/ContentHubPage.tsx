import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { VideoLibrary, ContentCopy, ViewCarousel } from '@mui/icons-material';
import NewsGraphicCard from '../components/NewsGraphicCard';

type Format = 'instagram-carousel' | 'faceless-reel';

const CAROUSEL_CATEGORIES = [
  'Data Drop (Market Stats)',
  'Investor Trap (Mistakes)',
  'Area Arbitrage (Comparisons)',
  'Global Shift (Macro)',
] as const;

type CarouselCategory = typeof CAROUSEL_CATEGORIES[number];

function renderFacelessReel(
  content: Record<string, unknown>,
  handleCopy: (key: string, text: string) => void,
) {
  const viralHeadline = content.viralHeadline as string;
  const scenes = (content.scenes as { visualCue: string; textOverlay: string }[]) ?? [];

  const allOverlays = scenes.map((s) => s.textOverlay).join('\n');

  return (
    <>
      <Box mb={4} display="flex" justifyContent="center">
        <Box>
          <Typography variant="subtitle1" fontWeight={600} mb={2} textAlign="center" sx={{ color: '#EAB308' }}>
            Social Media Graphic
          </Typography>
          <NewsGraphicCard viralHeadline={viralHeadline} imageUrl={content.imageUrl as string | undefined} />
        </Box>
      </Box>

      <Typography variant="subtitle1" fontWeight={700} mb={2} sx={{ color: '#C9A84C' }}>
        B-Roll Blueprint
      </Typography>

      <Grid container spacing={2} mb={3}>
        {scenes.map((scene, i) => (
          <Grid item xs={12} sm={6} key={i}>
            <Paper
              sx={{
                p: 2.5,
                border: '1px solid rgba(255,76,76,0.25)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Chip
                  label={`Scene ${i + 1}`}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,76,76,0.15)', color: '#FF4C4C', fontWeight: 700 }}
                />
                <IconButton
                  size="small"
                  onClick={() => handleCopy(`scene-overlay-${i}`, scene.textOverlay)}
                  sx={{ color: 'text.secondary', '&:hover': { color: '#C9A84C' } }}
                  title="Copy text overlay"
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {scene.visualCue}
              </Typography>
              <Typography variant="subtitle1" fontWeight={700} color="white">
                {scene.textOverlay}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Button
        variant="outlined"
        startIcon={<ContentCopy />}
        onClick={() => handleCopy('all-overlays', allOverlays)}
        sx={{
          borderColor: 'rgba(201,168,76,0.4)',
          color: '#C9A84C',
          '&:hover': { borderColor: '#C9A84C', bgcolor: 'rgba(201,168,76,0.08)' },
        }}
      >
        Copy All Text Overlays
      </Button>
    </>
  );
}

function renderInstagramCarousel(
  content: Record<string, unknown>,
  handleCopy: (key: string, text: string) => void,
) {
  const viralHeadline = content.viralHeadline as string;
  const slides = (content.slides as { heading: string; bodyText: string }[]) ?? [];
  const allSlides = slides.map((s) => `${s.heading}\n\n${s.bodyText}`).join('\n\n---\n\n');

  return (
    <>
      {/* 5 individual graphic cards — horizontally scrollable row */}
      <Typography variant="subtitle1" fontWeight={700} mb={2} sx={{ color: '#EAB308' }}>
        Instagram Carousel Graphics
      </Typography>
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          overflowX: 'auto',
          pb: 2,
          mb: 4,
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-track': { bgcolor: 'rgba(255,255,255,0.05)' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(201,168,76,0.4)', borderRadius: 3 },
        }}
      >
        {/* Slide 1 — cover slide uses viralHeadline only */}
        <Box sx={{ flexShrink: 0, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>Cover</Typography>
          <NewsGraphicCard viralHeadline={viralHeadline} filename="db-carousel-cover.png" imageUrl={content.imageUrl as string | undefined} />
        </Box>
        {/* Slides 2-5 — heading + bodyText mode */}
        {slides.map((slide, i) => (
          <Box key={i} sx={{ flexShrink: 0, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>Slide {i + 1}</Typography>
            <NewsGraphicCard
              heading={slide.heading}
              bodyText={slide.bodyText}
              filename={`db-carousel-slide-${i + 1}.png`}
              imageUrl={content.imageUrl as string | undefined}
            />
          </Box>
        ))}
      </Box>

      {/* Text content cards below */}
      <Typography variant="subtitle1" fontWeight={700} mb={2} sx={{ color: '#C9A84C' }}>
        Slide Copy
      </Typography>
      <Box display="flex" flexDirection="column" gap={2} mb={3}>
        {slides.map((slide, i) => (
          <Paper
            key={i}
            sx={{ p: 2.5, border: '1px solid rgba(225,48,108,0.25)' }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Chip
                label={`Slide ${i + 1}`}
                size="small"
                sx={{ bgcolor: 'rgba(225,48,108,0.15)', color: '#E1306C', fontWeight: 700 }}
              />
              <IconButton
                size="small"
                onClick={() => handleCopy(`slide-${i}`, `${slide.heading}\n\n${slide.bodyText}`)}
                sx={{ color: 'text.secondary', '&:hover': { color: '#C9A84C' } }}
                title="Copy slide"
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            </Box>
            <Typography variant="h6" fontWeight={700} mb={1}>{slide.heading}</Typography>
            <Typography variant="body2" color="text.secondary">{slide.bodyText}</Typography>
          </Paper>
        ))}
      </Box>

      <Button
        variant="outlined"
        startIcon={<ContentCopy />}
        onClick={() => handleCopy('all-slides', allSlides)}
        sx={{
          borderColor: 'rgba(201,168,76,0.4)',
          color: '#C9A84C',
          '&:hover': { borderColor: '#C9A84C', bgcolor: 'rgba(201,168,76,0.08)' },
        }}
      >
        Copy All Slides
      </Button>
    </>
  );
}

interface HistoryRecord {
  id: number;
  platform: string;
  topic: string;
  category: string;
  created_at: string;
}

export default function ContentHubPage() {
  const [format, setFormat] = useState<Format>('instagram-carousel');
  const [category, setCategory] = useState<CarouselCategory>('Data Drop (Market Stats)');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/content-history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch {
      // silent fail
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => setCopiedKey(key));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setContent(null);
    try {
      const res = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: format, category: format === 'instagram-carousel' ? category : undefined }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Server error: ${res.status}`);
      }
      const data: Record<string, unknown> = await res.json();
      setContent(data);
      fetchHistory();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unexpected error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderOutput = () => {
    if (!content) return null;
    switch (format) {
      case 'faceless-reel': return renderFacelessReel(content, handleCopy);
      case 'instagram-carousel': return renderInstagramCarousel(content, handleCopy);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: 'auto' }}>
      <Box mb={4}>
        <Typography variant="h5" fontWeight={700}>
          AI Inbound Engine
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Generate content that attracts high-net-worth clients
        </Typography>
      </Box>

      {/* Format + Category selectors */}
      <Box display="flex" gap={2} mb={4} flexWrap="wrap" alignItems="flex-start">
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel sx={{ color: 'rgba(201,168,76,0.7)', '&.Mui-focused': { color: '#C9A84C' } }}>
            Format
          </InputLabel>
          <Select
            value={format}
            label="Format"
            onChange={(e) => { setFormat(e.target.value as Format); setContent(null); }}
            sx={{
              color: '#C9A84C',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(201,168,76,0.3)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(201,168,76,0.6)' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#C9A84C' },
              '& .MuiSvgIcon-root': { color: '#C9A84C' },
            }}
          >
            <MenuItem value="instagram-carousel">Instagram Carousel</MenuItem>
            <MenuItem value="faceless-reel">Faceless Reel</MenuItem>
          </Select>
        </FormControl>

        {format === 'instagram-carousel' && (
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <InputLabel sx={{ color: 'rgba(201,168,76,0.7)', '&.Mui-focused': { color: '#C9A84C' } }}>
              Category
            </InputLabel>
            <Select
              value={category}
              label="Category"
              onChange={(e) => { setCategory(e.target.value as CarouselCategory); setContent(null); }}
              sx={{
                color: '#C9A84C',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(201,168,76,0.3)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(201,168,76,0.6)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#C9A84C' },
                '& .MuiSvgIcon-root': { color: '#C9A84C' },
              }}
            >
              {CAROUSEL_CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      <Box mb={4} display="flex" alignItems="center" gap={2}>
        <Button
          variant="contained"
          disabled={loading}
          onClick={handleGenerate}
          sx={{
            bgcolor: '#C9A84C',
            color: '#000',
            fontWeight: 700,
            px: 4,
            py: 1.5,
            fontSize: '1rem',
            '&:hover': { bgcolor: '#b8963f' },
            '&.Mui-disabled': { bgcolor: 'rgba(201,168,76,0.3)', color: 'rgba(0,0,0,0.4)' },
          }}
        >
          Generate Autonomous Content
        </Button>
        {loading && <CircularProgress size={24} sx={{ color: '#C9A84C' }} />}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {content && content.topic && (
        <Box mb={3} display="flex" alignItems="center" gap={1.5}>
          <Chip
            label="Topic"
            size="small"
            sx={{ bgcolor: 'rgba(201,168,76,0.15)', color: '#C9A84C', fontWeight: 700 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {content.topic as string}
          </Typography>
        </Box>
      )}

      {renderOutput()}

      {/* Content Ledger */}
      <Box mt={6}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={700}>Content Ledger</Typography>
          <Button
            size="small"
            onClick={fetchHistory}
            disabled={historyLoading}
            sx={{ color: '#C9A84C', borderColor: 'rgba(201,168,76,0.4)', '&:hover': { borderColor: '#C9A84C' } }}
            variant="outlined"
          >
            {historyLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>
        {history.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No content generated yet.</Typography>
        ) : (
          <TableContainer component={Paper} sx={{ border: '1px solid rgba(201,168,76,0.15)' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { borderBottom: '1px solid rgba(201,168,76,0.2)', color: '#C9A84C', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.5px' } }}>
                  <TableCell>DATE</TableCell>
                  <TableCell>FORMAT</TableCell>
                  <TableCell>CATEGORY</TableCell>
                  <TableCell>TOPIC</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((row) => (
                  <TableRow key={row.id} sx={{ '&:hover': { bgcolor: 'rgba(201,168,76,0.04)' }, '& td': { borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem' } }}>
                    <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {new Date(row.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.platform === 'instagram-carousel' ? 'Carousel' : 'Reel'}
                        size="small"
                        sx={{
                          bgcolor: row.platform === 'instagram-carousel' ? 'rgba(225,48,108,0.15)' : 'rgba(255,76,76,0.15)',
                          color: row.platform === 'instagram-carousel' ? '#E1306C' : '#FF4C4C',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{row.category || '—'}</TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>{row.topic}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Snackbar
        open={copiedKey !== null}
        autoHideDuration={2000}
        onClose={() => setCopiedKey(null)}
        message="Copied!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
