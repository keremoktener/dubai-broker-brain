import { useState, useEffect } from 'react';
import { api } from '../api/auth.ts';
import {
  Box, Typography, Paper, Grid, Avatar, Chip, Button,
  TextField, Select, MenuItem, FormControl, InputLabel,
  CircularProgress, Divider, Dialog, DialogContent, DialogTitle,
  IconButton, ToggleButton, ToggleButtonGroup, LinearProgress,
} from '@mui/material';
import {
  PersonAdd, AutoAwesome, Close, ContentCopy, CheckCircle,
} from '@mui/icons-material';

interface Client {
  id: number;
  name: string;
  phone: string | null;
  persona_type: string;
  max_budget: number;
  preferred_areas: string[];
  property_type: string;
  urgency_level: string;
  created_at: string;
}

interface MatchProperty {
  id: string;
  name: string;
  developer: string;
  area: string;
  type: string;
  price: number;
  bedrooms: number;
  sizeSqft: number;
  completionYear: number;
  highlights: string[];
  roiEstimate: number;
}

interface MatchResult {
  bestMatch: string;
  propertyId: string;
  matchScore: number;
  reasoning: string;
  whatsappPitch: string;
  property: MatchProperty | null;
}

const PERSONA_COLORS: Record<string, string> = {
  investor: '#C9A84C',
  'end-user': '#10B981',
  developer: '#3B82F6',
};

const URGENCY_COLORS: Record<string, string> = {
  low: '#7B8FA1',
  medium: '#F59E0B',
  high: '#FF4C4C',
  urgent: '#FF0044',
};

function fmtBudget(n: number) {
  return 'AED ' + n.toLocaleString('en-US');
}

function ScoreArc({ score }: { score: number }) {
  const color = score >= 85 ? '#10B981' : score >= 70 ? '#F59E0B' : '#C9A84C';
  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
      <Box sx={{ position: 'relative', width: 80, height: 80 }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="40" cy="40" r="32"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 32}`}
            strokeDashoffset={`${2 * Math.PI * 32 * (1 - score / 100)}`}
            transform="rotate(-90 40 40)"
            style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
          />
        </svg>
        <Box
          sx={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Typography variant="h6" fontWeight={800} sx={{ color, lineHeight: 1 }}>{score}%</Typography>
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary">Match Score</Typography>
    </Box>
  );
}

export default function CRMPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [personaType, setPersonaType] = useState('investor');
  const [maxBudget, setMaxBudget] = useState('');
  const [areaInput, setAreaInput] = useState('');
  const [preferredAreas, setPreferredAreas] = useState<string[]>([]);
  const [propertyType, setPropertyType] = useState('apartment');
  const [urgencyLevel, setUrgencyLevel] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  // Matchmaker state
  const [langMap, setLangMap] = useState<Record<number, 'EN' | 'TR'>>({});
  const [matchLoading, setMatchLoading] = useState<Record<number, boolean>>({});
  const [matchResults, setMatchResults] = useState<Record<number, MatchResult>>({});
  const [modalClient, setModalClient] = useState<Client | null>(null);
  const [copied, setCopied] = useState(false);

  const loadClients = async () => {
    try {
      setLoading(true);
      const res = await api.get<Client[]>('/crm/clients');
      setClients(res.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClients(); }, []);

  const handleAreaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && areaInput.trim()) {
      e.preventDefault();
      if (!preferredAreas.includes(areaInput.trim())) {
        setPreferredAreas(prev => [...prev, areaInput.trim()]);
      }
      setAreaInput('');
    }
  };

  const removeArea = (area: string) => {
    setPreferredAreas(prev => prev.filter(a => a !== area));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !maxBudget) return;
    setSubmitting(true);
    try {
      await api.post('/crm/clients', {
        name,
        phone: phone || undefined,
        persona_type: personaType,
        max_budget: parseFloat(maxBudget),
        preferred_areas: preferredAreas,
        property_type: propertyType,
        urgency_level: urgencyLevel,
      });
      {
        setName(''); setPhone(''); setMaxBudget('');
        setPreferredAreas([]); setAreaInput('');
        setPersonaType('investor'); setPropertyType('apartment'); setUrgencyLevel('medium');
        await loadClients();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getLang = (clientId: number): 'EN' | 'TR' => langMap[clientId] ?? 'EN';

  const handleRunMatch = async (client: Client) => {
    const lang = getLang(client.id);
    setMatchLoading(prev => ({ ...prev, [client.id]: true }));
    try {
      const res = await api.post<MatchResult>(`/crm/match/${client.id}`, { targetLanguage: lang });
      setMatchResults(prev => ({ ...prev, [client.id]: res.data }));
      setModalClient(client);
      setCopied(false);
    } catch {
      // handle error silently
    } finally {
      setMatchLoading(prev => ({ ...prev, [client.id]: false }));
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const activeResult = modalClient ? matchResults[modalClient.id] : null;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h5" fontWeight={700} color="primary.light">
          Investor Matchmaker CRM
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Register investor buy-boxes and run AI-powered property matching
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Add Investor Form */}
        <Grid item xs={12} md={4}>
          <Paper
            component="form"
            onSubmit={handleSubmit}
            sx={{
              p: 3,
              border: '1px solid rgba(201,168,76,0.15)',
              background: 'linear-gradient(135deg, rgba(201,168,76,0.04) 0%, rgba(8,11,20,0) 100%)',
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5} mb={3}>
              <Avatar sx={{ bgcolor: 'rgba(201,168,76,0.15)', color: 'primary.main', width: 36, height: 36 }}>
                <PersonAdd fontSize="small" />
              </Avatar>
              <Typography variant="subtitle1" fontWeight={700}>Add New Investor</Typography>
            </Box>

            <Box display="flex" flexDirection="column" gap={2}>
              <TextField label="Full Name" value={name} onChange={e => setName(e.target.value)} required size="small" fullWidth />
              <TextField label="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} size="small" fullWidth />
              <FormControl size="small" fullWidth>
                <InputLabel>Persona Type</InputLabel>
                <Select value={personaType} label="Persona Type" onChange={e => setPersonaType(e.target.value)}>
                  <MenuItem value="investor">Investor</MenuItem>
                  <MenuItem value="end-user">End User</MenuItem>
                  <MenuItem value="developer">Developer</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Max Budget (AED)" value={maxBudget} onChange={e => setMaxBudget(e.target.value)}
                required size="small" fullWidth type="number" inputProps={{ min: 0 }}
              />
              <Box>
                <TextField
                  label="Preferred Areas (press Enter)"
                  value={areaInput} onChange={e => setAreaInput(e.target.value)}
                  onKeyDown={handleAreaKeyDown} size="small" fullWidth
                />
                {preferredAreas.length > 0 && (
                  <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                    {preferredAreas.map(area => (
                      <Chip
                        key={area} label={area} size="small" onDelete={() => removeArea(area)}
                        sx={{ fontSize: '0.7rem', bgcolor: 'rgba(201,168,76,0.1)', color: 'primary.main', border: '1px solid rgba(201,168,76,0.3)' }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
              <FormControl size="small" fullWidth>
                <InputLabel>Property Type</InputLabel>
                <Select value={propertyType} label="Property Type" onChange={e => setPropertyType(e.target.value)}>
                  <MenuItem value="apartment">Apartment</MenuItem>
                  <MenuItem value="villa">Villa</MenuItem>
                  <MenuItem value="penthouse">Penthouse</MenuItem>
                  <MenuItem value="townhouse">Townhouse</MenuItem>
                  <MenuItem value="commercial">Commercial</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Urgency Level</InputLabel>
                <Select value={urgencyLevel} label="Urgency Level" onChange={e => setUrgencyLevel(e.target.value)}>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
              <Button
                type="submit" variant="contained" fullWidth disabled={submitting || !name || !maxBudget}
                sx={{
                  mt: 1,
                  background: 'linear-gradient(135deg, #C9A84C 0%, #9A7A2E 100%)',
                  color: '#0A0A0F', fontWeight: 700,
                  '&:hover': { background: 'linear-gradient(135deg, #D4B45C 0%, #A88538 100%)' },
                }}
              >
                {submitting ? <CircularProgress size={20} color="inherit" /> : 'Add Investor'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Investor Roster */}
        <Grid item xs={12} md={8}>
          <Box mb={2} display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle1" fontWeight={700}>
              Investor Roster
              <Typography component="span" variant="caption" color="text.secondary" ml={1.5}>
                {clients.length} registered
              </Typography>
            </Typography>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress sx={{ color: 'primary.main' }} />
            </Box>
          ) : clients.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', border: '1px dashed rgba(201,168,76,0.2)' }}>
              <Typography color="text.secondary" variant="body2">
                No investors registered yet. Add your first investor using the form.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {clients.map(client => {
                const isLoading = matchLoading[client.id] ?? false;
                const hasResult = !!matchResults[client.id];
                const lang = getLang(client.id);

                return (
                  <Grid item xs={12} sm={6} lg={4} key={client.id}>
                    <Paper
                      sx={{
                        p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5,
                        border: '1px solid rgba(201,168,76,0.1)',
                        transition: 'border-color 0.2s',
                        '&:hover': { borderColor: 'rgba(201,168,76,0.3)' },
                      }}
                    >
                      {/* Card Header */}
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar
                          sx={{
                            bgcolor: 'rgba(201,168,76,0.15)', color: 'primary.main',
                            width: 44, height: 44, fontWeight: 700, fontSize: '1.1rem',
                            border: '1px solid rgba(201,168,76,0.2)',
                          }}
                        >
                          {client.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box flex={1} minWidth={0}>
                          <Typography variant="body2" fontWeight={700} noWrap>{client.name}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {client.phone ?? 'No phone'}
                          </Typography>
                        </Box>
                        <Chip
                          label={client.persona_type} size="small"
                          sx={{
                            height: 20, fontSize: '0.65rem', fontWeight: 600, flexShrink: 0,
                            bgcolor: `${PERSONA_COLORS[client.persona_type] ?? '#7B8FA1'}22`,
                            color: PERSONA_COLORS[client.persona_type] ?? '#7B8FA1',
                            border: `1px solid ${PERSONA_COLORS[client.persona_type] ?? '#7B8FA1'}44`,
                          }}
                        />
                      </Box>

                      <Divider sx={{ borderColor: 'rgba(201,168,76,0.08)' }} />

                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">Max Budget</Typography>
                        <Typography variant="subtitle2" fontWeight={700} color="primary.light">
                          {fmtBudget(client.max_budget)}
                        </Typography>
                      </Box>

                      {client.preferred_areas.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Preferred Areas</Typography>
                          <Box display="flex" flexWrap="wrap" gap={0.5}>
                            {client.preferred_areas.map(area => (
                              <Chip
                                key={area} label={area} size="small"
                                sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(201,168,76,0.08)', color: 'primary.light', border: '1px solid rgba(201,168,76,0.25)' }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}

                      <Box display="flex" gap={2}>
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary" display="block">Property</Typography>
                          <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'capitalize' }}>{client.property_type}</Typography>
                        </Box>
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary" display="block">Urgency</Typography>
                          <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'capitalize', color: URGENCY_COLORS[client.urgency_level] ?? 'text.primary' }}>
                            {client.urgency_level}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Language Toggle + Matchmaker Button */}
                      <Box mt="auto" display="flex" flexDirection="column" gap={1}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">Pitch Language</Typography>
                          <ToggleButtonGroup
                            value={lang}
                            exclusive
                            size="small"
                            onChange={(_, v) => { if (v) setLangMap(prev => ({ ...prev, [client.id]: v as 'EN' | 'TR' })); }}
                            sx={{
                              '& .MuiToggleButton-root': {
                                py: 0.3, px: 1.2, fontSize: '0.65rem', fontWeight: 700,
                                color: 'text.secondary',
                                border: '1px solid rgba(201,168,76,0.2)',
                                '&.Mui-selected': {
                                  bgcolor: 'rgba(201,168,76,0.15)',
                                  color: 'primary.main',
                                  borderColor: 'rgba(201,168,76,0.4)',
                                },
                              },
                            }}
                          >
                            <ToggleButton value="EN">EN</ToggleButton>
                            <ToggleButton value="TR">TR</ToggleButton>
                          </ToggleButtonGroup>
                        </Box>

                        <Button
                          variant="outlined"
                          fullWidth
                          disabled={isLoading}
                          onClick={() => handleRunMatch(client)}
                          startIcon={isLoading ? <CircularProgress size={14} color="inherit" /> : <AutoAwesome fontSize="small" />}
                          sx={{
                            borderColor: 'rgba(201,168,76,0.45)',
                            color: 'rgba(201,168,76,0.85)',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            boxShadow: '0 0 14px rgba(201,168,76,0.15)',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: '#C9A84C',
                              color: '#C9A84C',
                              boxShadow: '0 0 20px rgba(201,168,76,0.3)',
                              bgcolor: 'rgba(201,168,76,0.06)',
                            },
                            '&.Mui-disabled': {
                              borderColor: 'rgba(201,168,76,0.2)',
                              color: 'rgba(201,168,76,0.3)',
                            },
                          }}
                        >
                          {isLoading ? 'Matching...' : hasResult ? '✦ Re-run Matchmaker' : '✦ Run AI Matchmaker'}
                        </Button>

                        {hasResult && (
                          <Button
                            variant="text" size="small" fullWidth
                            onClick={() => { setModalClient(client); setCopied(false); }}
                            sx={{ fontSize: '0.7rem', color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                          >
                            View Last Result →
                          </Button>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Grid>
      </Grid>

      {/* Match Result Modal */}
      <Dialog
        open={!!modalClient && !!activeResult}
        onClose={() => setModalClient(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #0F1729 0%, #080B14 100%)',
            border: '1px solid rgba(201,168,76,0.25)',
            boxShadow: '0 0 60px rgba(201,168,76,0.1)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color="primary.light">AI Match Result</Typography>
            {modalClient && (
              <Typography variant="caption" color="text.secondary">
                {modalClient.name} · {getLang(modalClient.id)} pitch
              </Typography>
            )}
          </Box>
          <IconButton size="small" onClick={() => setModalClient(null)} sx={{ color: 'text.secondary' }}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 0 }}>
          {activeResult && (
            <Box display="flex" flexDirection="column" gap={2.5}>
              {/* Score + Property Name */}
              <Box display="flex" alignItems="center" gap={3} p={2} sx={{ bgcolor: 'rgba(201,168,76,0.04)', borderRadius: 2, border: '1px solid rgba(201,168,76,0.1)' }}>
                <ScoreArc score={activeResult.matchScore} />
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary" display="block">Best Match</Typography>
                  <Typography variant="subtitle2" fontWeight={700} color="primary.light" sx={{ lineHeight: 1.3 }}>
                    {activeResult.bestMatch}
                  </Typography>
                  {activeResult.property && (
                    <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                      {activeResult.property.developer} · {activeResult.property.area} · AED {activeResult.property.price.toLocaleString()}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Property Highlights */}
              {activeResult.property && (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
                    PROPERTY HIGHLIGHTS
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    {activeResult.property.highlights.map((h, i) => (
                      <Box key={i} display="flex" alignItems="flex-start" gap={1}>
                        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.8, flexShrink: 0 }} />
                        <Typography variant="caption" color="text.secondary">{h}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Box display="flex" gap={2} mt={1.5}>
                    <Chip label={`${activeResult.property.bedrooms}BR`} size="small" sx={{ fontSize: '0.7rem', bgcolor: 'rgba(201,168,76,0.08)', color: 'primary.light', border: '1px solid rgba(201,168,76,0.2)' }} />
                    <Chip label={`${activeResult.property.sizeSqft.toLocaleString()} sqft`} size="small" sx={{ fontSize: '0.7rem', bgcolor: 'rgba(16,185,129,0.08)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }} />
                    <Chip label={`${activeResult.property.roiEstimate}% ROI`} size="small" sx={{ fontSize: '0.7rem', bgcolor: 'rgba(59,130,246,0.08)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }} />
                  </Box>
                </Box>
              )}

              <Divider sx={{ borderColor: 'rgba(201,168,76,0.08)' }} />

              {/* Reasoning */}
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                  MATCH REASONING
                </Typography>
                <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.6 }}>
                  {activeResult.reasoning}
                </Typography>
              </Box>

              {/* WhatsApp Pitch */}
              <Box
                sx={{
                  p: 2, borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(37,211,102,0.06) 0%, rgba(8,11,20,0) 100%)',
                  border: '1px solid rgba(37,211,102,0.15)',
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: '#25D366' }}>
                    WHATSAPP PITCH
                  </Typography>
                  <Button
                    size="small"
                    startIcon={copied ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
                    onClick={() => handleCopy(activeResult.whatsappPitch)}
                    sx={{
                      fontSize: '0.65rem', color: copied ? '#25D366' : 'text.secondary',
                      '&:hover': { color: '#25D366' },
                    }}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </Box>
                <Typography variant="body2" sx={{ lineHeight: 1.7, fontStyle: 'italic', color: 'text.primary' }}>
                  "{activeResult.whatsappPitch}"
                </Typography>
              </Box>

              {/* Match score bar */}
              <Box>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" color="text.secondary">Overall Compatibility</Typography>
                  <Typography variant="caption" fontWeight={700} color="primary.main">{activeResult.matchScore}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={activeResult.matchScore}
                  sx={{
                    height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)',
                    '& .MuiLinearProgress-bar': {
                      background: activeResult.matchScore >= 85
                        ? 'linear-gradient(90deg, #10B981, #34D399)'
                        : 'linear-gradient(90deg, #C9A84C, #F0C060)',
                      borderRadius: 3,
                    },
                  }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
