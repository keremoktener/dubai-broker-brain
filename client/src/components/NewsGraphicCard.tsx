import { useRef } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Download } from '@mui/icons-material';

interface NewsGraphicCardProps {
  viralHeadline?: string;  // large centered headline mode
  heading?: string;        // carousel slide mode — heading at top
  bodyText?: string;       // carousel slide mode — body in center
  filename?: string;       // download filename, default 'db-market-intelligence.png'
  imageUrl?: string;       // optional Unsplash background image
}

export default function NewsGraphicCard({ viralHeadline, heading, bodyText, filename, imageUrl }: NewsGraphicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const isSlideMode = Boolean(bodyText);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(cardRef.current, {
      width: 1080,
      height: 1080,
      scale: 1,
      useCORS: true,
      backgroundColor: imageUrl ? undefined : '#111B27',
    });
    const link = document.createElement('a');
    link.download = filename ?? 'db-market-intelligence.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <Box textAlign="center">
      <Box sx={{ width: 360, height: 360, overflow: 'hidden', position: 'relative' }}>
        <Box
          ref={cardRef}
          sx={{
            width: 1080,
            height: 1080,
            transform: 'scale(0.333)',
            transformOrigin: 'top left',
            position: 'relative',
            bgcolor: '#111B27',
            ...(imageUrl
              ? {
                  backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.78)), url(${imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : {
                  backgroundImage: `
                    radial-gradient(ellipse at 50% 40%, rgba(36,58,82,0.9) 0%, rgba(26,37,53,0.6) 50%, transparent 100%),
                    repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(234,179,8,0.035) 79px, rgba(234,179,8,0.035) 80px),
                    repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(234,179,8,0.035) 79px, rgba(234,179,8,0.035) 80px)
                  `,
                }),
            p: '72px',
            boxSizing: 'border-box',
            borderTop: '5px solid #EAB308',
            borderBottom: '3px solid rgba(234,179,8,0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
          }}
        >
          {/* Header */}
          <Box>
            <Typography sx={{ color: '#EAB308', fontSize: 26, fontWeight: 800, letterSpacing: '7px', fontFamily: 'inherit' }}>
              DB | MARKET INTELLIGENCE
            </Typography>
            <Box sx={{ borderBottom: '1px solid rgba(234,179,8,0.35)', mt: '28px', mb: 0 }} />
          </Box>

          {/* Center section */}
          {isSlideMode ? (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '48px', px: '40px' }}>
              <Typography sx={{
                fontSize: 52,
                fontWeight: 800,
                color: '#EAB308',
                lineHeight: 1.2,
                textAlign: 'center',
                letterSpacing: '-0.5px',
                textTransform: 'uppercase',
                maxWidth: '85%',
                fontFamily: 'inherit',
              }}>
                {heading}
              </Typography>
              <Box sx={{ borderBottom: '1px solid rgba(234,179,8,0.2)', width: '40%' }} />
              <Typography sx={{
                fontSize: 38,
                fontWeight: 400,
                color: 'rgba(255,255,255,0.82)',
                lineHeight: 1.55,
                textAlign: 'center',
                maxWidth: '85%',
                fontFamily: 'inherit',
                letterSpacing: '0.2px',
              }}>
                {bodyText}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: '40px' }}>
              <Typography sx={{
                fontSize: 88,
                fontWeight: 900,
                color: '#FFFFFF',
                lineHeight: 1.2,
                textAlign: 'center',
                letterSpacing: '-1px',
                textTransform: 'uppercase',
                maxWidth: '85%',
                fontFamily: 'inherit',
              }}>
                {viralHeadline}
              </Typography>
            </Box>
          )}

          {/* Footer */}
          <Box>
            <Box sx={{ borderBottom: '1px solid rgba(234,179,8,0.35)', mb: '28px' }} />
            <Typography sx={{
              color: '#64748B',
              fontSize: 20,
              letterSpacing: '5px',
              textAlign: 'center',
              fontFamily: 'inherit',
              fontWeight: 500,
            }}>
              DUBAI · REAL ESTATE · INTELLIGENCE
            </Typography>
          </Box>
        </Box>
      </Box>

      <Button
        variant="outlined"
        startIcon={<Download />}
        onClick={handleDownload}
        sx={{
          mt: 2,
          borderColor: '#EAB308',
          color: '#EAB308',
          '&:hover': {
            borderColor: '#ca9f00',
            bgcolor: 'rgba(234,179,8,0.08)',
          },
        }}
      >
        Download as PNG
      </Button>
    </Box>
  );
}
