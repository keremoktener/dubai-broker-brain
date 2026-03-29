import { useState } from 'react';
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
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Article, VideoLibrary, ContentCopy, ViewCarousel, Twitter } from '@mui/icons-material';
import NewsGraphicCard from '../components/NewsGraphicCard';

type Platform = 'faceless-reel' | 'instagram-carousel' | 'linkedin-post' | 'twitter-thread';

interface PlatformOption {
  value: Platform;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const PLATFORMS: PlatformOption[] = [
  { value: 'faceless-reel', label: 'Faceless Reel', icon: <VideoLibrary />, color: '#FF4C4C' },
  { value: 'instagram-carousel', label: 'Instagram Carousel', icon: <ViewCarousel />, color: '#E1306C' },
  { value: 'linkedin-post', label: 'LinkedIn Post', icon: <Article />, color: '#0A66C2' },
  { value: 'twitter-thread', label: 'Twitter Thread', icon: <Twitter />, color: '#1DA1F2' },
];

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

function renderLinkedInPost(
  content: Record<string, unknown>,
  handleCopy: (key: string, text: string) => void,
) {
  const viralHeadline = content.viralHeadline as string;
  const postBody = content.postBody as string;

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

      <Paper sx={{ p: 2.5, border: '1px solid rgba(10,102,194,0.25)' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Chip
            label="LinkedIn Post"
            size="small"
            sx={{ bgcolor: 'rgba(10,102,194,0.15)', color: '#0A66C2', fontWeight: 700 }}
          />
          <IconButton
            size="small"
            onClick={() => handleCopy('linkedin-post', postBody)}
            sx={{ color: 'text.secondary', '&:hover': { color: '#C9A84C' } }}
            title="Copy post"
          >
            <ContentCopy fontSize="small" />
          </IconButton>
        </Box>
        <Box
          sx={{
            overflow: 'auto',
            maxHeight: 400,
            bgcolor: 'rgba(255,255,255,0.03)',
            borderRadius: 1,
            p: 1.5,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}
          >
            {postBody}
          </Typography>
        </Box>
      </Paper>
    </>
  );
}

function renderTwitterThread(
  content: Record<string, unknown>,
  handleCopy: (key: string, text: string) => void,
) {
  const viralHeadline = content.viralHeadline as string;
  const tweets = (content.tweets as { text: string }[]) ?? [];

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
        Thread ({tweets.length} Tweets)
      </Typography>

      <Box display="flex" flexDirection="column" gap={2}>
        {tweets.map((tweet, i) => (
          <Paper
            key={i}
            sx={{ p: 2.5, border: '1px solid rgba(29,161,242,0.25)' }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Chip
                label={`${i + 1}`}
                size="small"
                sx={{ bgcolor: 'rgba(29,161,242,0.15)', color: '#1DA1F2', fontWeight: 700 }}
              />
              <IconButton
                size="small"
                onClick={() => handleCopy(`tweet-${i}`, tweet.text)}
                sx={{ color: 'text.secondary', '&:hover': { color: '#C9A84C' } }}
                title="Copy tweet"
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            </Box>
            <Typography variant="body1" mb={1}>
              {tweet.text}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {tweet.text.length} / 280
            </Typography>
          </Paper>
        ))}
      </Box>
    </>
  );
}

export default function ContentHubPage() {
  const [platform, setPlatform] = useState<Platform>('faceless-reel');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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
        body: JSON.stringify({ platform }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Server error: ${res.status}`);
      }
      const data: Record<string, unknown> = await res.json();
      setContent(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unexpected error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderOutput = () => {
    if (!content) return null;
    switch (platform) {
      case 'faceless-reel': return renderFacelessReel(content, handleCopy);
      case 'instagram-carousel': return renderInstagramCarousel(content, handleCopy);
      case 'linkedin-post': return renderLinkedInPost(content, handleCopy);
      case 'twitter-thread': return renderTwitterThread(content, handleCopy);
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

      <ToggleButtonGroup
        value={platform}
        exclusive
        onChange={(_e, val) => { if (val) { setPlatform(val); setContent(null); } }}
        sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}
      >
        {PLATFORMS.map((p) => (
          <ToggleButton
            key={p.value}
            value={p.value}
            sx={{
              border: '1px solid rgba(201,168,76,0.3) !important',
              borderRadius: '8px !important',
              px: 2,
              py: 1,
              gap: 1,
              color: platform === p.value ? '#C9A84C' : 'text.secondary',
              borderColor: platform === p.value ? '#C9A84C !important' : undefined,
              '&.Mui-selected': { bgcolor: 'rgba(201,168,76,0.08)', color: '#C9A84C' },
              '&.Mui-selected:hover': { bgcolor: 'rgba(201,168,76,0.12)' },
            }}
          >
            {p.icon}
            <Typography variant="body2" fontWeight={600}>{p.label}</Typography>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

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
