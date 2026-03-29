import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
  Box, Typography, Paper, Chip, Grid,
  CircularProgress, Divider, Button,
  TextField, IconButton, ToggleButton, ToggleButtonGroup,
  Collapse,
} from '@mui/material';
import {
  Psychology, School, Send, RestartAlt, SaveAlt,
  ExpandMore, ExpandLess, EmojiEvents, Bolt, Shield,
  Groups, Handshake, TipsAndUpdates, AutoAwesome,
  Analytics, FlashOn, RecordVoiceOver, Forum,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { newsApi } from '../api/auth';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type ChatMessage = { role: 'user' | 'assistant'; content: string; coachTip?: string };

type SavedSession = {
  id: number;
  title: string;
  target_persona: string;
  message_count: number;
  closing_score: number | null;
  created_at: string;
};

type SessionAnalysis = {
  closingScore: number | null;
  missedSignals: string[];
  veteranRewrite: string | null;
};

type Icebreakers = { direct: string; directTr: string; consultative: string; consultativeTr: string; urgency: string; urgencyTr: string } | null;

const PERSONAS = [
  { id: 'daily-news', labelTr: 'Günün Haberi Potansiyeli', labelEn: 'Daily News Lead', color: '#3B82F6' },
  { id: 'russian-crypto-whale', labelTr: 'Rus Kripto Balinası', labelEn: 'Russian Crypto Whale', color: '#EF4444' },
  { id: 'cautious-european-pensioner', labelTr: 'Temkinli Avrupalı Emekli', labelEn: 'Cautious European Pensioner', color: '#10B981' },
  { id: 'gulf-family-office', labelTr: 'Körfez Aile Ofisi', labelEn: 'Gulf Family Office', color: '#C9A84C' },
  { id: 'aggressive-chinese-developer', labelTr: 'Agresif Çinli Geliştirici', labelEn: 'Aggressive Chinese Developer', color: '#F59E0B' },
];

const PLAYBOOK_CARDS = [
  {
    icon: 'Handshake',
    color: '#C9A84C',
    titleTr: 'Kabul Et & Pivot',
    titleEn: 'Agree & Pivot',
    descTr: 'İtirazı reddetme — önce kabul et, sonra yeniden çerçevele.',
    descEn: "Don't reject the objection — acknowledge it first, then reframe.",
    exampleTr: '"Haklısın, piyasa hızlı hareket ediyor. Tam da bu yüzden akıllı para şimdi konumlanıyor..."',
    exampleEn: '"You\'re right, the market is moving fast. That\'s exactly why smart money is positioning now..."',
  },
  {
    icon: 'Groups',
    color: '#3B82F6',
    titleTr: 'Sosyal Kanıt Kapanışı',
    titleEn: 'Social Proof Close',
    descTr: 'Benzer profildeki alıcıların kararlarını paylaş. İnsanlar sürüye uyar.',
    descEn: 'Share decisions from similar buyers. People follow the herd.',
    exampleTr: '"Geçen hafta Londra\'dan aynı çekincesi olan bir müşterim vardı — bugün imzaladı."',
    exampleEn: '"I had a client from London last week with the same hesitation — they signed today."',
  },
  {
    icon: 'Bolt',
    color: '#F59E0B',
    titleTr: 'Kıtlık Çerçevesi',
    titleEn: 'Scarcity Frame',
    descTr: 'Bu fırsatın neden benzersiz ve geçici olduğunu somut rakamlarla göster.',
    descEn: 'Show concretely why this opportunity is unique and temporary.',
    exampleTr: '"Bu katta sadece 2 ünite kaldı — geçen ay bu fiyat yoktu."',
    exampleEn: '"Only 2 units left on this floor — this price didn\'t exist last month."',
  },
  {
    icon: 'Shield',
    color: '#EF4444',
    titleTr: 'Kayıp Korkusu',
    titleEn: 'Fear of Loss',
    descTr: 'Bekleyenlerin kaybını göster. Kazancı değil, kaçırılanı vurgula.',
    descEn: "Show the cost of waiting. Emphasize what's missed, not what's gained.",
    exampleTr: '"2020\'de bekleyenler hâlâ bekliyor — ve o fiyatlar artık yok."',
    exampleEn: '"People who waited in 2020 are still waiting — and those prices are gone."',
  },
  {
    icon: 'EmojiEvents',
    color: '#10B981',
    titleTr: 'Varsayımlı Kapanış',
    titleEn: 'Assumptive Close',
    descTr: 'Kararı geç — lojistiğe geç. Sanki anlaştınız gibi konuş.',
    descEn: "Skip the decision — move to logistics. Talk as if it's done.",
    exampleTr: '"Pazartesi mi, Salı mı daha uygun gezin için?"',
    exampleEn: '"Is Monday or Tuesday better for the viewing?"',
  },
  {
    icon: 'TipsAndUpdates',
    color: '#8B5CF6',
    titleTr: 'İtiraz = İlgi',
    titleEn: 'Objection = Interest',
    descTr: 'İtiraz eden bir yatırımcı ilgileniyor demektir. Susmak gerçek reddir.',
    descEn: 'An investor who objects is engaged. Silence is the real rejection.',
    exampleTr: '"Bu soruyu sormak, düşündüğünüzü gösteriyor — hadi rakamlara bakalım."',
    exampleEn: '"Asking this question shows you\'re thinking — let\'s look at the numbers."',
  },
];

const ICON_MAP = { Handshake, Groups, Bolt, Shield, EmojiEvents, TipsAndUpdates };

function scoreColor(score: number) {
  if (score >= 70) return '#10B981';
  if (score >= 50) return '#F59E0B';
  return '#EF4444';
}

function scoreBg(score: number) {
  if (score >= 70) return 'rgba(16,185,129,0.15)';
  if (score >= 50) return 'rgba(245,158,11,0.15)';
  return 'rgba(239,68,68,0.15)';
}

function scoreBorder(score: number) {
  if (score >= 70) return 'rgba(16,185,129,0.3)';
  if (score >= 50) return 'rgba(245,158,11,0.3)';
  return 'rgba(239,68,68,0.3)';
}

export default function SparringPage() {
  const [lang, setLang] = useState<'tr' | 'en'>('tr');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [targetPersona, setTargetPersona] = useState('');
  const [newsSummary, setNewsSummary] = useState<string[]>([]);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState('daily-news');
  const [icebreakers, setIcebreakers] = useState<Icebreakers>(null);
  const [loadingIcebreakers, setLoadingIcebreakers] = useState(true);
  const [lastAnalysis, setLastAnalysis] = useState<SessionAnalysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    newsApi.getSummary().then((data: any) => {
      if (data?.payload?.targetPersonaEn) setTargetPersona(data.payload.targetPersonaEn);
      if (data?.payload?.summaryEn) setNewsSummary(data.payload.summaryEn);
    }).catch((err: unknown) => console.error('[SparringPage] summary load failed', err));

    api.get('/sparring/sessions').then((res) => setSavedSessions(res.data))
      .catch((err: unknown) => console.error('[SparringPage] sessions load failed', err))
      .finally(() => setLoadingSessions(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!targetPersona) {
      setLoadingIcebreakers(true);
      return;
    }
    setLoadingIcebreakers(true);
    api.post('/sparring/icebreakers', { personaId: selectedPersonaId, targetPersona, newsSummary })
      .then((res) => setIcebreakers(res.data))
      .catch(() => setIcebreakers(null))
      .finally(() => setLoadingIcebreakers(false));
  }, [selectedPersonaId, targetPersona]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/sparring', {
        messages: newMessages.map(({ role, content }) => ({ role, content })),
        targetPersona, newsSummary, personaId: selectedPersonaId, lang,
      });
      setMessages([...newMessages, { role: 'assistant', content: res.data.reply, coachTip: res.data.coachTip }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: lang === 'tr' ? 'Hata oluştu, tekrar dene.' : 'Error occurred, please retry.' }]);
    } finally { setLoading(false); }
  }

  function handleStartOver() {
    setMessages([]);
    setInput('');
    setLastAnalysis(null);
    setShowAnalysis(false);
  }

  async function handleSave() {
    if (messages.length < 2 || saving) return;
    setSaving(true);
    const firstUserMsg = messages.find((m) => m.role === 'user')?.content ?? 'Seans';
    const title = firstUserMsg.slice(0, 60) + (firstUserMsg.length > 60 ? '...' : '');
    try {
      const res = await api.post('/sparring/sessions', { title, targetPersona, newsSummary, messages, personaId: selectedPersonaId });
      setLastAnalysis({ closingScore: res.data.closingScore, missedSignals: res.data.missedSignals ?? [], veteranRewrite: res.data.veteranRewrite });
      setShowAnalysis(true);
      const sessRes = await api.get('/sparring/sessions');
      setSavedSessions(sessRes.data);
      setMessages([]);
      setInput('');
    } catch { console.error('[SparringPage] save failed'); }
    finally { setSaving(false); }
  }

  // Analytics computed values
  const scoredSessions = savedSessions.filter(s => s.closing_score !== null);
  const avgScore = scoredSessions.length > 0
    ? Math.round(scoredSessions.reduce((sum, s) => sum + (s.closing_score ?? 0), 0) / scoredSessions.length)
    : null;
  const winRate = scoredSessions.length > 0
    ? Math.round((scoredSessions.filter(s => (s.closing_score ?? 0) >= 70).length / scoredSessions.length) * 100)
    : null;
  const chartData = scoredSessions.slice(-10).reverse().map((s, i) => ({ name: i + 1, score: s.closing_score ?? 0 })).reverse();

  const selectedPersona = PERSONAS.find(p => p.id === selectedPersonaId);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* PAGE HEADER */}
      <Box mb={3} display="flex" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Box>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, background: 'linear-gradient(135deg, #C9A84C 0%, #9A7A2E 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(201,168,76,0.3)' }}>
              <Psychology sx={{ color: '#0A0A0F', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800}>
                {lang === 'tr' ? 'Satış Dojo' : 'Sales Dojo'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {lang === 'tr' ? 'AI destekli yatırımcı sparring · Her konuşma seni daha iyi yapar' : 'AI-powered investor sparring · Every session makes you better'}
              </Typography>
            </Box>
          </Box>
        </Box>
        <ToggleButtonGroup
          value={lang}
          exclusive
          onChange={(_e, val) => { if (val) setLang(val as 'tr' | 'en'); }}
          size="small"
          sx={{ '& .MuiToggleButton-root': { px: 1.5, py: 0.5, fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', borderColor: 'rgba(201,168,76,0.3)', '&.Mui-selected': { bgcolor: 'rgba(201,168,76,0.15)', color: '#C9A84C', borderColor: 'rgba(201,168,76,0.5)' } } }}
        >
          <ToggleButton value="tr">TR</ToggleButton>
          <ToggleButton value="en">EN</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* ANALYTICS DASHBOARD */}
      <Paper sx={{ mb: 3, border: '1px solid rgba(201,168,76,0.2)', background: 'rgba(12,18,34,0.7)', overflow: 'hidden' }}>
        <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid rgba(201,168,76,0.12)', display: 'flex', alignItems: 'center', gap: 1, background: 'rgba(201,168,76,0.05)' }}>
          <Analytics sx={{ color: '#C9A84C', fontSize: 18 }} />
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#C9A84C' }}>
            {lang === 'tr' ? 'Performans Özeti' : 'Performance Summary'}
          </Typography>
        </Box>
        <Box sx={{ p: 2 }}>
          {/* Stat boxes */}
          <Box display="flex" gap={2} flexWrap="wrap" mb={scoredSessions.length >= 2 ? 2 : 0}>
            {/* Avg Score */}
            <Box sx={{ flex: '1 1 120px', p: 1.5, borderRadius: 2, border: '1px solid rgba(201,168,76,0.3)', bgcolor: 'rgba(201,168,76,0.05)', textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} sx={{ color: avgScore !== null ? scoreColor(avgScore) : 'text.disabled', lineHeight: 1 }}>
                {avgScore !== null ? avgScore : '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block', mt: 0.5 }}>
                {lang === 'tr' ? 'Ort. Kapanış Skoru' : 'Avg. Closing Score'}
              </Typography>
            </Box>
            {/* Win Rate */}
            <Box sx={{ flex: '1 1 120px', p: 1.5, borderRadius: 2, border: '1px solid rgba(16,185,129,0.3)', bgcolor: 'rgba(16,185,129,0.05)', textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#10B981', lineHeight: 1 }}>
                {winRate !== null ? `${winRate}%` : '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block', mt: 0.5 }}>
                {lang === 'tr' ? 'Kazanma Oranı' : 'Win Rate'}
              </Typography>
            </Box>
            {/* Total Sessions */}
            <Box sx={{ flex: '1 1 120px', p: 1.5, borderRadius: 2, border: '1px solid rgba(59,130,246,0.3)', bgcolor: 'rgba(59,130,246,0.05)', textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#3B82F6', lineHeight: 1 }}>
                {savedSessions.length}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block', mt: 0.5 }}>
                {lang === 'tr' ? 'Toplam Seans' : 'Total Sessions'}
              </Typography>
            </Box>
          </Box>

          {/* Score trend chart */}
          {scoredSessions.length >= 2 && (
            <Box mb={2}>
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={chartData}>
                  <XAxis dataKey="name" hide axisLine={false} tick={false} />
                  <YAxis hide axisLine={false} tick={false} />
                  <RechartsTooltip
                    contentStyle={{ background: '#0C1222', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 6, fontSize: '0.7rem' }}
                    formatter={(value: number) => [value, lang === 'tr' ? 'Skor' : 'Score']}
                  />
                  <Line type="monotone" dataKey="score" stroke="#C9A84C" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', display: 'block', textAlign: 'center', mt: 0.5 }}>
                {lang === 'tr' ? 'Son seansların kapanış skoru trendi' : 'Closing score trend across recent sessions'}
              </Typography>
            </Box>
          )}

          {/* Recent sessions compact list */}
          {savedSessions.length > 0 && (
            <Box>
              {savedSessions.slice(0, 5).map((s) => (
                <Box
                  key={s.id}
                  onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, px: 1, borderRadius: 1, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' }, borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                    {s.title.slice(0, 40)}{s.title.length > 40 ? '...' : ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', flexShrink: 0 }}>
                    {new Date(s.created_at).toLocaleDateString('tr-TR')}
                  </Typography>
                  {s.closing_score !== null && (
                    <Chip
                      label={s.closing_score}
                      size="small"
                      sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, flexShrink: 0,
                        bgcolor: scoreBg(s.closing_score), color: scoreColor(s.closing_score),
                        border: `1px solid ${scoreBorder(s.closing_score)}`,
                      }}
                    />
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', flexShrink: 0 }}>
                    {s.message_count} {lang === 'tr' ? 'msg' : 'msg'}
                  </Typography>
                  <Collapse in={expandedSession === s.id} sx={{ display: expandedSession === s.id ? 'block' : 'none' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.62rem', fontStyle: 'italic', mt: 0.25 }}>
                      {s.target_persona}
                    </Typography>
                  </Collapse>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* LEFT: Sparring Arena */}
        <Grid item xs={12} md={7}>
          {/* Persona Selector */}
          <Paper sx={{ mb: 2, p: 1.5, border: '1px solid rgba(201,168,76,0.2)', bgcolor: 'rgba(201,168,76,0.04)' }}>
            <Typography variant="caption" fontWeight={700} sx={{ color: '#C9A84C', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.6rem', display: 'block', mb: 1 }}>
              {lang === 'tr' ? 'Yatırımcı Profili Seç' : 'Select Investor Persona'}
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.75}>
              {PERSONAS.map((p) => (
                <Chip
                  key={p.id}
                  label={lang === 'tr' ? p.labelTr : p.labelEn}
                  onClick={() => setSelectedPersonaId(p.id)}
                  size="small"
                  sx={{
                    cursor: 'pointer',
                    height: 24, fontSize: '0.7rem', fontWeight: selectedPersonaId === p.id ? 700 : 400,
                    bgcolor: selectedPersonaId === p.id ? `${p.color}20` : 'rgba(255,255,255,0.04)',
                    color: selectedPersonaId === p.id ? p.color : 'text.secondary',
                    border: `1px solid ${selectedPersonaId === p.id ? p.color + '60' : 'rgba(255,255,255,0.1)'}`,
                    '&:hover': { bgcolor: `${p.color}15` },
                  }}
                />
              ))}
            </Box>
          </Paper>

          {/* Context banner */}
          {targetPersona && (
            <Paper sx={{ mb: 2, p: 1.5, border: '1px solid rgba(59,130,246,0.3)', bgcolor: 'rgba(59,130,246,0.06)', display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <AutoAwesome sx={{ color: '#3B82F6', fontSize: 16, mt: 0.2, flexShrink: 0 }} />
              <Box>
                <Typography variant="caption" fontWeight={700} sx={{ color: '#3B82F6', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.6rem', display: 'block' }}>
                  {lang === 'tr' ? 'Bugünün Hedef Yatırımcısı' : "Today's Target Investor"}
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.5 }}>{targetPersona}</Typography>
              </Box>
            </Paper>
          )}

          {/* Chat area */}
          <Paper sx={{ border: '1px solid rgba(201,168,76,0.2)', background: 'linear-gradient(180deg, rgba(12,18,34,0.9) 0%, rgba(8,11,20,0.95) 100%)', overflow: 'hidden' }}>
            {/* Chat header */}
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(201,168,76,0.15)', display: 'flex', alignItems: 'center', gap: 1.5, background: 'rgba(201,168,76,0.06)' }}>
              <Psychology sx={{ color: '#C9A84C', fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#C9A84C', flex: 1 }}>
                {lang === 'tr' ? 'Yatırımcı Sparring' : 'Investor Sparring'}
              </Typography>
              <Chip
                label={`${messages.filter(m => m.role === 'user').length} ${lang === 'tr' ? 'tur' : 'rounds'}`}
                size="small"
                sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}
              />
              {selectedPersona && (
                <Chip
                  label={lang === 'tr' ? selectedPersona.labelTr : selectedPersona.labelEn}
                  size="small"
                  sx={{ height: 18, fontSize: '0.58rem', fontWeight: 700,
                    bgcolor: `${selectedPersona.color}18`, color: selectedPersona.color,
                    border: `1px solid ${selectedPersona.color}40`,
                  }}
                />
              )}
            </Box>

            {/* Messages */}
            <Box sx={{ height: 400, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {messages.length === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2, opacity: 0.6 }}>
                  <Psychology sx={{ fontSize: 48, color: '#C9A84C', opacity: 0.4 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center' }}>
                    {lang === 'tr' ? 'Pitchini gir — yatırımcı bekliyor...' : 'Enter your pitch — the investor is waiting...'}
                  </Typography>
                </Box>
              )}
              {messages.map((msg, i) => (
                <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 0.75 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ px: 0.5, fontSize: '0.6rem' }}>
                    {msg.role === 'user' ? (lang === 'tr' ? 'Sen' : 'You') : (lang === 'tr' ? 'Yatırımcı' : 'Investor')}
                  </Typography>
                  <Box sx={{ borderRadius: 2, p: 1.5, maxWidth: '85%', bgcolor: msg.role === 'user' ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${msg.role === 'user' ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
                    <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{msg.content}</Typography>
                  </Box>
                  {msg.role === 'assistant' && msg.coachTip && (
                    <Box sx={{ maxWidth: '92%', borderRadius: 1.5, px: 1.5, py: 1, bgcolor: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <School sx={{ color: '#10B981', fontSize: 13, mt: 0.25, flexShrink: 0 }} />
                      <Typography variant="caption" sx={{ color: 'rgba(16,185,129,0.85)', lineHeight: 1.6 }}>
                        <Box component="span" fontWeight={700} sx={{ display: 'block', mb: 0.2, textTransform: 'uppercase', letterSpacing: 0.7, fontSize: '0.57rem' }}>
                          {lang === 'tr' ? 'Koç İpucu' : 'Coach Tip'}
                        </Box>
                        {msg.coachTip}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
              {loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 0.5 }}>
                  <CircularProgress size={16} sx={{ color: '#C9A84C' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.65rem' }}>
                    {lang === 'tr' ? 'Yatırımcı düşünüyor...' : 'Investor thinking...'}
                  </Typography>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Input area */}
            <Box sx={{ px: 2, pb: 2, pt: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Box display="flex" gap={1} mb={1.5}>
                <TextField
                  fullWidth multiline maxRows={3} size="small"
                  placeholder={lang === 'tr' ? 'Pitchini yaz...' : 'Write your pitch...'}
                  value={input}
                  disabled={loading}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                />
                <IconButton
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  sx={{ color: '#C9A84C', bgcolor: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(201,168,76,0.18)' }, '&:disabled': { opacity: 0.3 } }}
                >
                  <Send fontSize="small" />
                </IconButton>
              </Box>
              <Box display="flex" gap={1}>
                <Button
                  size="small" variant="outlined"
                  startIcon={<RestartAlt sx={{ fontSize: '0.85rem !important' }} />}
                  onClick={handleStartOver}
                  disabled={messages.length === 0}
                  sx={{ fontSize: '0.7rem', fontWeight: 700, borderColor: 'rgba(255,255,255,0.15)', color: 'text.secondary', '&:hover': { borderColor: 'rgba(255,255,255,0.3)', bgcolor: 'rgba(255,255,255,0.04)' } }}
                >
                  {lang === 'tr' ? 'Baştan Başla' : 'Start Over'}
                </Button>
                <Button
                  size="small" variant="outlined"
                  startIcon={<SaveAlt sx={{ fontSize: '0.85rem !important' }} />}
                  onClick={handleSave}
                  disabled={messages.length < 2 || saving}
                  sx={{ fontSize: '0.7rem', fontWeight: 700, borderColor: 'rgba(201,168,76,0.4)', color: '#C9A84C', '&:hover': { borderColor: '#C9A84C', bgcolor: 'rgba(201,168,76,0.08)' }, '&:disabled': { opacity: 0.4 } }}
                >
                  {saving ? (lang === 'tr' ? 'Kaydediliyor...' : 'Saving...') : (lang === 'tr' ? 'Bitir & Kaydet' : 'Finish & Save')}
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Analysis Results */}
          {showAnalysis && lastAnalysis && (
            <Paper sx={{ mt: 2, border: '1px solid rgba(201,168,76,0.35)', background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.03) 100%)', overflow: 'hidden' }}>
              <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid rgba(201,168,76,0.15)', display: 'flex', alignItems: 'center', gap: 1, background: 'rgba(201,168,76,0.08)' }}>
                <Analytics sx={{ color: '#C9A84C', fontSize: 18 }} />
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#C9A84C', flex: 1 }}>
                  {lang === 'tr' ? 'Seans Analizi' : 'Session Analysis'}
                </Typography>
                {lastAnalysis.closingScore !== null && (
                  <Chip
                    label={`${lastAnalysis.closingScore}/100`}
                    size="small"
                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 800,
                      bgcolor: scoreBg(lastAnalysis.closingScore),
                      color: scoreColor(lastAnalysis.closingScore),
                      border: `1px solid ${scoreBorder(lastAnalysis.closingScore)}`,
                    }}
                  />
                )}
              </Box>
              <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {lastAnalysis.missedSignals.length > 0 && (
                  <Box>
                    <Typography variant="caption" fontWeight={700} sx={{ color: '#EF4444', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.6rem', display: 'block', mb: 0.75 }}>
                      {lang === 'tr' ? '⚠ Kaçırılan Fırsatlar' : '⚠ Missed Opportunities'}
                    </Typography>
                    {lastAnalysis.missedSignals.map((signal, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 0.5 }}>
                        <Box sx={{ mt: 0.4, width: 5, height: 5, borderRadius: '50%', bgcolor: '#EF4444', flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem', lineHeight: 1.55 }}>{signal}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}
                {lastAnalysis.veteranRewrite && (
                  <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: '#10B981', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.6rem', display: 'block', mb: 0.75 }}>
                      {lang === 'tr' ? '🎯 Usta Kapanış Yeniden Yazımı' : '🎯 Veteran Close Rewrite'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, whiteSpace: 'pre-line', fontSize: '0.8rem' }}>
                      {lastAnalysis.veteranRewrite}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          )}
        </Grid>

        {/* RIGHT COLUMN */}
        <Grid item xs={12} md={5}>
          {/* Icebreakers Panel */}
          <Paper sx={{ mb: 2, border: '1px solid rgba(201,168,76,0.2)', overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid rgba(201,168,76,0.12)', display: 'flex', alignItems: 'center', gap: 1, background: 'rgba(201,168,76,0.05)' }}>
              <FlashOn sx={{ color: '#C9A84C', fontSize: 16 }} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
                {lang === 'tr' ? 'Öneri Açılışlar' : 'Suggested Icebreakers'}
              </Typography>
              <Chip
                label={selectedPersona?.[lang === 'tr' ? 'labelTr' : 'labelEn'] ?? ''}
                size="small"
                sx={{ height: 18, fontSize: '0.58rem', fontWeight: 700,
                  bgcolor: `${selectedPersona?.color ?? '#C9A84C'}18`,
                  color: selectedPersona?.color ?? '#C9A84C',
                  border: `1px solid ${selectedPersona?.color ?? '#C9A84C'}40`,
                }}
              />
            </Box>
            <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {loadingIcebreakers && <Box display="flex" justifyContent="center" py={2}><CircularProgress size={18} sx={{ color: '#C9A84C' }} /></Box>}
              {!loadingIcebreakers && !icebreakers && (
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', py: 1, fontStyle: 'italic' }}>
                  {lang === 'tr' ? 'Açılış önerileri yüklenemedi.' : 'Could not load icebreakers.'}
                </Typography>
              )}
              {!loadingIcebreakers && icebreakers && (
                <>
                  {[
                    { key: 'direct', labelTr: 'Direkt', labelEn: 'Direct', color: '#EF4444', icon: RecordVoiceOver },
                    { key: 'consultative', labelTr: 'Danışmanlık', labelEn: 'Consultative', color: '#3B82F6', icon: Forum },
                    { key: 'urgency', labelTr: 'Aciliyet', labelEn: 'Urgency', color: '#F59E0B', icon: FlashOn },
                  ].map(({ key, labelTr, labelEn, color, icon: Icon }) => (
                    <Box key={key} sx={{ p: 1.25, borderRadius: 1.5, bgcolor: `${color}08`, border: `1px solid ${color}22` }}>
                      <Box display="flex" gap={0.75} alignItems="center" mb={0.5}>
                        <Icon sx={{ fontSize: 13, color }} />
                        <Typography variant="caption" fontWeight={700} sx={{ color, textTransform: 'uppercase', letterSpacing: 0.7, fontSize: '0.58rem' }}>
                          {lang === 'tr' ? labelTr : labelEn}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, fontSize: '0.78rem' }}>
                        "{lang === 'tr' ? icebreakers[`${key}Tr` as keyof NonNullable<typeof icebreakers>] || icebreakers[key as keyof NonNullable<typeof icebreakers>] : icebreakers[key as keyof NonNullable<typeof icebreakers>]}"
                      </Typography>
                    </Box>
                  ))}
                </>
              )}
            </Box>
          </Paper>

          {/* Previous Sessions */}
          <Paper sx={{ mb: 3, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmojiEvents sx={{ color: '#C9A84C', fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight={700}>
                {lang === 'tr' ? 'Geçmiş Seanslar' : 'Previous Sessions'}
              </Typography>
              <Chip
                label={savedSessions.length}
                size="small"
                sx={{ ml: 'auto', height: 18, fontSize: '0.6rem', bgcolor: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}
              />
            </Box>
            <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
              {loadingSessions && (
                <Box display="flex" justifyContent="center" py={3}><CircularProgress size={20} /></Box>
              )}
              {!loadingSessions && savedSessions.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, fontStyle: 'italic', textAlign: 'center' }}>
                  {lang === 'tr' ? 'Henüz kaydedilmiş seans yok.' : 'No saved sessions yet.'}
                </Typography>
              )}
              {savedSessions.map((s) => (
                <Box
                  key={s.id}
                  sx={{ px: 2, py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}
                  onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" flex={1} overflow="hidden">
                      <Typography variant="body2" fontWeight={500} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pr: 0.5 }}>
                        {s.title}
                      </Typography>
                      {s.closing_score !== null && (
                        <Chip label={`${s.closing_score}`} size="small" sx={{ height: 16, fontSize: '0.58rem', fontWeight: 700, ml: 0.5, flexShrink: 0,
                          bgcolor: scoreBg(s.closing_score), color: scoreColor(s.closing_score),
                        }} />
                      )}
                    </Box>
                    {expandedSession === s.id
                      ? <ExpandLess sx={{ fontSize: 16, color: 'text.secondary' }} />
                      : <ExpandMore sx={{ fontSize: 16, color: 'text.secondary' }} />}
                  </Box>
                  <Box display="flex" gap={1} mt={0.4}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                      {new Date(s.created_at).toLocaleDateString('tr-TR')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>·</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                      {s.message_count} {lang === 'tr' ? 'mesaj' : 'messages'}
                    </Typography>
                  </Box>
                  <Collapse in={expandedSession === s.id}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75, fontSize: '0.65rem', lineHeight: 1.5, fontStyle: 'italic' }}>
                      {s.target_persona}
                    </Typography>
                  </Collapse>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Coach's Playbook */}
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5 }}>
                {lang === 'tr' ? "Koç'un Oyun Kitabı" : "Coach's Playbook"}
              </Typography>
              <Divider sx={{ flex: 1 }} />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {PLAYBOOK_CARDS.map((card) => {
                const IconComp = ICON_MAP[card.icon as keyof typeof ICON_MAP] ?? TipsAndUpdates;
                return (
                  <Paper key={card.titleEn} sx={{ p: 1.75, border: `1px solid ${card.color}22`, bgcolor: `${card.color}08`, overflow: 'hidden' }}>
                    <Box display="flex" gap={1.25} alignItems="flex-start">
                      <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: `${card.color}18`, border: `1px solid ${card.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <IconComp sx={{ fontSize: 16, color: card.color }} />
                      </Box>
                      <Box flex={1}>
                        <Typography variant="caption" fontWeight={800} sx={{ color: card.color, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.62rem' }}>
                          {lang === 'tr' ? card.titleTr : card.titleEn}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, mt: 0.3, fontSize: '0.75rem' }}>
                          {lang === 'tr' ? card.descTr : card.descEn}
                        </Typography>
                        <Box sx={{ mt: 0.75, pl: 1, borderLeft: `2px solid ${card.color}40` }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', lineHeight: 1.5, fontSize: '0.68rem' }}>
                            {lang === 'tr' ? card.exampleTr : card.exampleEn}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
