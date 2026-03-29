import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Chip, Grid, Avatar,
  CircularProgress, Skeleton, Divider,
  ToggleButton, ToggleButtonGroup,
  Button, Tooltip,
} from '@mui/material';
import {
  Article as ArticleIcon,
  AutoAwesome,
  TipsAndUpdates,
  LocationOn,
  PersonSearch,
  Shield,
  ManageSearch,
  Mic,
  LocalFireDepartment,
  ContentCopy,
  CheckCircle,
  OpenInNew,
  Share,
  Psychology,
} from '@mui/icons-material';
import { newsApi } from '../api/auth';

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type Article = Awaited<ReturnType<typeof newsApi.getArticles>>[number];
type AiSummary = NonNullable<Awaited<ReturnType<typeof newsApi.getSummary>>>;

const SENTIMENT_CONFIG = {
  HOT: { bgcolor: '#EF444422', color: '#EF4444', label: '🔥 HOT Market' },
  NEUTRAL: { bgcolor: '#F59E0B22', color: '#F59E0B', label: '〰 Neutral' },
  CAUTIOUS: { bgcolor: '#3B82F622', color: '#3B82F6', label: '⚠ Cautious' },
} as const;


function AiInsightsCard({
  summary,
  loading,
  lang,
}: {
  summary: AiSummary | null;
  loading: boolean;
  lang: 'en' | 'tr';
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCopy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  }, []);

  const sentimentConfig = summary?.payload?.sentiment
    ? SENTIMENT_CONFIG[summary.payload.sentiment]
    : null;

  const bullets = summary?.payload
    ? lang === 'en'
      ? summary.payload.summaryEn
      : summary.payload.summaryTr
    : [];

  const pitch = summary?.payload
    ? lang === 'en'
      ? summary.payload.pitchEn
      : summary.payload.pitchTr
    : null;

  const targetPersona = summary?.payload
    ? lang === 'en'
      ? (summary.payload as any).targetPersonaEn
      : (summary.payload as any).targetPersonaTr
    : null;

  const objectionKiller = summary?.payload
    ? lang === 'en'
      ? (summary.payload as any).objectionKillerEn
      : (summary.payload as any).objectionKillerTr
    : null;

  const leadGenQuery = (summary?.payload as any)?.leadGenQuery ?? null;
  const voiceNoteScript = (summary?.payload as any)?.voiceNoteScript ?? null;
  const fomoTrigger = (summary?.payload as any)?.fomoTrigger ?? null;

  return (
    <Paper
      sx={{
        mb: 3,
        overflow: 'hidden',
        border: '1px solid rgba(201,168,76,0.35)',
        background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.03) 100%)',
      }}
    >
      {/* Header bar */}
      <Box
        sx={{
          px: 2.5, py: 1.5,
          background: 'linear-gradient(90deg, rgba(201,168,76,0.22) 0%, rgba(201,168,76,0.08) 100%)',
          borderBottom: '1px solid rgba(201,168,76,0.2)',
          display: 'flex', alignItems: 'center', gap: 1.5,
        }}
      >
        <AutoAwesome sx={{ color: '#C9A84C', fontSize: 20 }} />
        <Box flex={1}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#C9A84C', letterSpacing: 0.5 }}>
            AI Market Intelligence
          </Typography>
          {summary && !loading && (
            <Typography variant="caption" color="text.secondary">
              Based on {summary.article_count} articles · Updated {timeAgo(summary.generated_at)}
            </Typography>
          )}
        </Box>
        {sentimentConfig && !loading && (
          <Chip
            label={sentimentConfig.label}
            size="small"
            sx={{
              height: 22, fontSize: '0.65rem', fontWeight: 700,
              bgcolor: sentimentConfig.bgcolor, color: sentimentConfig.color,
              border: `1px solid ${sentimentConfig.color}44`,
            }}
          />
        )}
        <Chip
          label="Powered by Claude"
          size="small"
          sx={{
            height: 18, fontSize: '0.6rem', fontWeight: 700,
            bgcolor: 'rgba(201,168,76,0.15)', color: '#C9A84C',
            border: '1px solid rgba(201,168,76,0.3)',
          }}
        />
        <Button
          size="small"
          variant="outlined"
          startIcon={<Psychology sx={{ fontSize: '0.8rem !important' }} />}
          onClick={() => navigate('/sparring')}
          sx={{
            py: 0.25, px: 1, fontSize: '0.6rem', fontWeight: 700,
            borderColor: 'rgba(201,168,76,0.5)', color: '#C9A84C',
            '&:hover': { borderColor: '#C9A84C', bgcolor: 'rgba(201,168,76,0.08)' },
          }}
        >
          Satış Dojo
        </Button>
      </Box>

      {/* Body */}
      <Box sx={{ px: 2.5, py: 2 }}>
        {loading && (
          <>
            <Skeleton variant="text" width="90%" sx={{ mb: 1 }} />
            <Skeleton variant="text" width="80%" sx={{ mb: 1 }} />
            <Skeleton variant="text" width="85%" />
          </>
        )}

        {!loading && !summary && (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            AI summary will appear here after the first news fetch. Set <code>ANTHROPIC_API_KEY</code> in your server environment to enable this feature.
          </Typography>
        )}

        {!loading && summary && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Market Signal Bullets */}
            {bullets.map((bullet, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <Box
                  sx={{
                    mt: 0.35, flexShrink: 0,
                    width: 20, height: 20, borderRadius: '50%',
                    bgcolor: 'rgba(201,168,76,0.18)',
                    border: '1px solid rgba(201,168,76,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: '#C9A84C' }}>
                    {i + 1}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ lineHeight: 1.65, color: 'text.primary' }}>
                  {bullet}
                </Typography>
              </Box>
            ))}

            {/* Broker Pitch */}
            {pitch && (
              <>
                <Divider sx={{ my: 0.5, borderColor: 'rgba(201,168,76,0.15)' }} />
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <TipsAndUpdates sx={{ color: '#C9A84C', fontSize: 18, mt: 0.2, flexShrink: 0 }} />
                  <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', lineHeight: 1.6 }}>
                    {pitch}
                  </Typography>
                </Box>
              </>
            )}

            {/* Target Persona */}
            {targetPersona && (
              <>
                <Divider sx={{ my: 0.5, borderColor: 'rgba(201,168,76,0.15)' }} />
                <Box
                  sx={{
                    p: 1.5, borderRadius: 1.5,
                    bgcolor: 'rgba(59,130,246,0.08)',
                    border: '1px solid rgba(59,130,246,0.25)',
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.75 }}>
                    <PersonSearch sx={{ color: '#3B82F6', fontSize: 16 }} />
                    <Typography variant="caption" fontWeight={700} sx={{ color: '#3B82F6', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      {lang === 'en' ? 'Target Client Today' : 'Bugünün Hedef Müşterisi'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6, fontWeight: 500 }}>
                    {targetPersona}
                  </Typography>
                </Box>
              </>
            )}

            {/* Objection Killer */}
            {objectionKiller && (
              <Box
                sx={{
                  p: 1.5, borderRadius: 1.5,
                  bgcolor: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.75 }}>
                  <Shield sx={{ color: '#EF4444', fontSize: 16 }} />
                  <Typography variant="caption" fontWeight={700} sx={{ color: '#EF4444', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    {lang === 'en' ? 'Objection Killer' : 'İtiraz Kırıcı'}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{objectionKiller}"
                </Typography>
              </Box>
            )}

            {/* Closer's Blueprint */}
            {(leadGenQuery || voiceNoteScript || fomoTrigger) && (
              <>
                <Divider sx={{ my: 0.5, borderColor: 'rgba(201,168,76,0.15)' }} />
                <Box
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid rgba(201,168,76,0.45)',
                    background: 'linear-gradient(135deg, rgba(15,12,5,0.95) 0%, rgba(30,24,8,0.9) 100%)',
                  }}
                >
                  {/* Blueprint Header */}
                  <Box
                    sx={{
                      px: 2, py: 1.25,
                      background: 'linear-gradient(90deg, rgba(201,168,76,0.3) 0%, rgba(201,168,76,0.08) 100%)',
                      borderBottom: '1px solid rgba(201,168,76,0.25)',
                      display: 'flex', alignItems: 'center', gap: 1,
                    }}
                  >
                    <LocalFireDepartment sx={{ color: '#C9A84C', fontSize: 16 }} />
                    <Typography variant="caption" fontWeight={800} sx={{ color: '#C9A84C', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                      Closer's Blueprint
                    </Typography>
                    <Chip
                      label="TR"
                      size="small"
                      sx={{
                        ml: 'auto', height: 16, fontSize: '0.55rem', fontWeight: 800,
                        bgcolor: 'rgba(201,168,76,0.2)', color: '#C9A84C',
                        border: '1px solid rgba(201,168,76,0.4)',
                      }}
                    />
                  </Box>

                  <Box sx={{ p: 1.75, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {/* Lead Gen Query */}
                    {leadGenQuery && (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.6 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <ManageSearch sx={{ color: '#C9A84C', fontSize: 15 }} />
                            <Typography variant="caption" fontWeight={700} sx={{ color: '#C9A84C', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.6rem' }}>
                              Lead Arama Sorgusu
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title={copiedKey === 'lead' ? 'Kopyalandı!' : 'Kopyala'}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleCopy(leadGenQuery, 'lead')}
                                startIcon={copiedKey === 'lead' ? <CheckCircle sx={{ fontSize: '0.7rem !important' }} /> : <ContentCopy sx={{ fontSize: '0.7rem !important' }} />}
                                sx={{
                                  py: 0.15, px: 0.75, minWidth: 'auto',
                                  fontSize: '0.6rem', fontWeight: 700,
                                  borderColor: copiedKey === 'lead' ? 'rgba(201,168,76,0.7)' : 'rgba(201,168,76,0.3)',
                                  color: copiedKey === 'lead' ? '#C9A84C' : 'rgba(201,168,76,0.6)',
                                  '&:hover': { borderColor: '#C9A84C', bgcolor: 'rgba(201,168,76,0.08)' },
                                }}
                              >
                                {copiedKey === 'lead' ? 'Kopyalandı!' : 'Kopyala'}
                              </Button>
                            </Tooltip>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<OpenInNew sx={{ fontSize: '0.7rem !important' }} />}
                              onClick={() => window.open(`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(leadGenQuery)}`, '_blank', 'noopener,noreferrer')}
                              sx={{
                                py: 0.15, px: 0.75, minWidth: 'auto',
                                fontSize: '0.6rem', fontWeight: 700,
                                borderColor: 'rgba(10,102,194,0.4)', color: 'rgba(10,102,194,0.8)',
                                '&:hover': { borderColor: 'rgba(10,102,194,0.8)', bgcolor: 'rgba(10,102,194,0.06)' },
                              }}
                            >
                              LinkedIn'de Ara
                            </Button>
                          </Box>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, fontFamily: 'monospace', fontSize: '0.78rem', bgcolor: 'rgba(201,168,76,0.06)', p: 1, borderRadius: 1, border: '1px solid rgba(201,168,76,0.12)' }}>
                          {leadGenQuery}
                        </Typography>
                      </Box>
                    )}

                    {/* Voice Note Script */}
                    {voiceNoteScript && (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.6 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Mic sx={{ color: '#C9A84C', fontSize: 15 }} />
                            <Typography variant="caption" fontWeight={700} sx={{ color: '#C9A84C', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.6rem' }}>
                              20 Saniyelik Sesli Mesaj Metni
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title={copiedKey === 'voice' ? 'Kopyalandı!' : 'Kopyala'}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleCopy(voiceNoteScript, 'voice')}
                                startIcon={copiedKey === 'voice' ? <CheckCircle sx={{ fontSize: '0.7rem !important' }} /> : <ContentCopy sx={{ fontSize: '0.7rem !important' }} />}
                                sx={{
                                  py: 0.15, px: 0.75, minWidth: 'auto',
                                  fontSize: '0.6rem', fontWeight: 700,
                                  borderColor: copiedKey === 'voice' ? 'rgba(201,168,76,0.7)' : 'rgba(201,168,76,0.3)',
                                  color: copiedKey === 'voice' ? '#C9A84C' : 'rgba(201,168,76,0.6)',
                                  '&:hover': { borderColor: '#C9A84C', bgcolor: 'rgba(201,168,76,0.08)' },
                                }}
                              >
                                {copiedKey === 'voice' ? 'Kopyalandı!' : 'Kopyala'}
                              </Button>
                            </Tooltip>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Share sx={{ fontSize: '0.7rem !important' }} />}
                              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(voiceNoteScript)}`, '_blank', 'noopener,noreferrer')}
                              sx={{
                                py: 0.15, px: 0.75, minWidth: 'auto',
                                fontSize: '0.6rem', fontWeight: 700,
                                borderColor: 'rgba(37,211,102,0.4)', color: 'rgba(37,211,102,0.8)',
                                '&:hover': { borderColor: 'rgba(37,211,102,0.8)', bgcolor: 'rgba(37,211,102,0.06)' },
                              }}
                            >
                              WhatsApp'ta Paylaş
                            </Button>
                          </Box>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgba(255,255,255,0.9)',
                            lineHeight: 1.8,
                            '& .tone': { color: '#C9A84C', fontWeight: 700, fontStyle: 'italic' },
                          }}
                          dangerouslySetInnerHTML={{
                            __html: voiceNoteScript.replace(/\[([^\]]+)\]/g, '<span class="tone">[$1]</span>'),
                          }}
                        />
                      </Box>
                    )}

                    {/* FOMO Trigger */}
                    {fomoTrigger && (
                      <Box
                        sx={{
                          p: 1.25, borderRadius: 1,
                          bgcolor: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.25)',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.6 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <LocalFireDepartment sx={{ color: '#EF4444', fontSize: 15 }} />
                            <Typography variant="caption" fontWeight={700} sx={{ color: '#EF4444', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.6rem' }}>
                              FOMO Tetikleyici
                            </Typography>
                          </Box>
                          <Tooltip title={copiedKey === 'fomo' ? 'Kopyalandı!' : 'Kopyala'}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleCopy(fomoTrigger, 'fomo')}
                              startIcon={copiedKey === 'fomo' ? <CheckCircle sx={{ fontSize: '0.7rem !important' }} /> : <ContentCopy sx={{ fontSize: '0.7rem !important' }} />}
                              sx={{
                                py: 0.15, px: 0.75, minWidth: 'auto',
                                fontSize: '0.6rem', fontWeight: 700,
                                borderColor: copiedKey === 'fomo' ? 'rgba(239,68,68,0.7)' : 'rgba(239,68,68,0.3)',
                                color: copiedKey === 'fomo' ? '#EF4444' : 'rgba(239,68,68,0.7)',
                                '&:hover': { borderColor: '#EF4444', bgcolor: 'rgba(239,68,68,0.08)' },
                              }}
                            >
                              {copiedKey === 'fomo' ? 'Kopyalandı!' : 'Kopyala'}
                            </Button>
                          </Tooltip>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, fontWeight: 600 }}>
                          "{fomoTrigger}"
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </>
            )}

            {/* Trending Areas */}
            {summary.payload.trendingAreas && summary.payload.trendingAreas.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
                {summary.payload.trendingAreas.map((area) => (
                  <Chip
                    key={area}
                    icon={<LocationOn sx={{ fontSize: '0.75rem !important', color: '#C9A84C !important' }} />}
                    label={area}
                    size="small"
                    sx={{
                      height: 22, fontSize: '0.65rem', fontWeight: 600,
                      bgcolor: 'rgba(201,168,76,0.1)', color: '#C9A84C',
                      border: '1px solid rgba(201,168,76,0.25)',
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
}

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [summary, setSummary] = useState<AiSummary | null>(null);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [articlesError, setArticlesError] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'tr'>('en');

  useEffect(() => {
    newsApi.getSummary()
      .then(setSummary)
      .catch((err) => console.error('[NewsPage] summary error', err?.response?.status, err?.message))
      .finally(() => setLoadingSummary(false));

    newsApi.getArticles()
      .then(setArticles)
      .catch((err) => {
        const status = err?.response?.status;
        console.error('[NewsPage] articles error', { status, data: err?.response?.data, message: err?.message });
        setArticlesError(`Failed to load news (${status ?? err?.message ?? 'network error'}). The feed refreshes every 4 hours.`);
      })
      .finally(() => setLoadingArticles(false));
  }, []);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: 'auto' }}>
      <Box mb={3} display="flex" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Market Intelligence Feed</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Live Dubai &amp; UAE real estate news — filtered and summarized by AI
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={lang}
          exclusive
          onChange={(_e, val) => { if (val) setLang(val as 'en' | 'tr'); }}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              px: 1.5, py: 0.5,
              fontSize: '0.75rem', fontWeight: 700,
              color: 'text.secondary',
              borderColor: 'rgba(201,168,76,0.3)',
              '&.Mui-selected': {
                bgcolor: 'rgba(201,168,76,0.15)',
                color: '#C9A84C',
                borderColor: 'rgba(201,168,76,0.5)',
              },
            },
          }}
        >
          <ToggleButton value="en">EN</ToggleButton>
          <ToggleButton value="tr">TR</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <AiInsightsCard summary={summary} loading={loadingSummary} lang={lang} />

      <Box display="flex" alignItems="center" gap={1.5} mb={2}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5 }}>
          Latest Articles
        </Typography>
        <Divider sx={{ flex: 1 }} />
        {!loadingArticles && (
          <Typography variant="caption" color="text.secondary">
            {articles.length} articles
          </Typography>
        )}
      </Box>

      {loadingArticles && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress size={28} />
        </Box>
      )}

      {articlesError && (
        <Typography color="text.secondary" variant="body2">{articlesError}</Typography>
      )}

      {!loadingArticles && !articlesError && articles.length === 0 && (
        <Typography color="text.secondary" variant="body2">
          No articles yet — restart the server to trigger the first fetch.
        </Typography>
      )}

      <Grid container spacing={2}>
        {articles.map((item) => (
          <Grid item xs={12} key={item.id}>
            <Paper
              component={item.link ? 'a' : 'div'}
              href={item.link ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                p: 2.5, cursor: item.link ? 'pointer' : 'default',
                textDecoration: 'none', display: 'block',
                transition: 'all 0.2s',
                '&:hover': item.link
                  ? { borderColor: 'rgba(201,168,76,0.3)', transform: 'translateY(-1px)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }
                  : {},
              }}
            >
              <Box display="flex" gap={2} alignItems="flex-start">
                <Avatar sx={{ bgcolor: 'rgba(201,168,76,0.15)', color: '#C9A84C', width: 40, height: 40 }}>
                  <ArticleIcon fontSize="small" />
                </Avatar>
                <Box flex={1} minWidth={0}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
                    <Chip
                      label={item.source}
                      size="small"
                      sx={{
                        height: 20, fontSize: '0.65rem', fontWeight: 600,
                        bgcolor: 'rgba(201,168,76,0.12)', color: '#C9A84C',
                        border: '1px solid rgba(201,168,76,0.25)',
                      }}
                    />
                    {item.published_at && (
                      <Typography variant="caption" color="text.secondary">
                        · {timeAgo(item.published_at)}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="subtitle2" fontWeight={600} mb={item.summary ? 0.5 : 0}>
                    {item.title}
                  </Typography>
                  {item.summary && (
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {item.summary}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
