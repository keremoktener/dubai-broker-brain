import { Box, Typography, Grid, Paper, Chip, Divider, Avatar } from '@mui/material';
import { TrendingUp, TrendingDown, AttachMoney, Home, BarChart as BarChartIcon, ShowChart } from '@mui/icons-material';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar,
} from 'recharts';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const dailyTransactions = [
  { date: 'Mar 1', transactions: 142, volume: 680 },
  { date: 'Mar 4', transactions: 165, volume: 812 },
  { date: 'Mar 7', transactions: 128, volume: 595 },
  { date: 'Mar 10', transactions: 198, volume: 980 },
  { date: 'Mar 13', transactions: 176, volume: 845 },
  { date: 'Mar 16', transactions: 211, volume: 1050 },
  { date: 'Mar 19', transactions: 189, volume: 910 },
  { date: 'Mar 22', transactions: 234, volume: 1180 },
  { date: 'Mar 25', transactions: 220, volume: 1080 },
  { date: 'Mar 26', transactions: 248, volume: 1240 },
];

const pricePerSqftData = [
  { area: 'Palm JBR', price: 4500, change: 18.2 },
  { area: 'Downtown', price: 2800, change: 12.4 },
  { area: 'Marina', price: 2200, change: 9.8 },
  { area: 'DIFC', price: 3200, change: 15.1 },
  { area: 'Biz Bay', price: 1900, change: 7.3 },
  { area: 'D. Hills', price: 1600, change: 11.2 },
  { area: 'JBR', price: 2600, change: 8.9 },
];

const areaBreakdown = [
  { name: 'Palm Jumeirah', value: 28, fill: '#C9A84C' },
  { name: 'Downtown', value: 22, fill: '#3B82F6' },
  { name: 'Dubai Marina', value: 19, fill: '#10B981' },
  { name: 'Business Bay', value: 16, fill: '#F59E0B' },
  { name: 'Others', value: 15, fill: '#7B8FA1' },
];

const kpiCards = [
  { label: 'Avg Price/SqFt', value: 'AED 2,640', change: '+14.2%', positive: true, icon: <AttachMoney />, color: '#C9A84C', sub: 'All Districts' },
  { label: 'Daily Transactions', value: '248', change: '+12.8%', positive: true, icon: <BarChartIcon />, color: '#10B981', sub: "Today vs. Yesterday" },
  { label: 'Avg Sale Price', value: 'AED 3.8M', change: '+18.4%', positive: true, icon: <Home />, color: '#3B82F6', sub: 'Residential Units' },
  { label: 'Transaction Volume', value: 'AED 1.24B', change: '-3.1%', positive: false, icon: <ShowChart />, color: '#FF4C4C', sub: 'Total Daily Value' },
];

// ─── Custom Tooltips ──────────────────────────────────────────────────────────

function AreaTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: 'rgba(14,20,32,0.98)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 2, p: 1.5, minWidth: 160 }}>
      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>{label}</Typography>
      {payload.map(p => (
        <Box key={p.name} display="flex" justifyContent="space-between" gap={2}>
          <Typography variant="caption" sx={{ color: p.color }}>{p.name}</Typography>
          <Typography variant="caption" fontWeight={600}>{p.name === 'volume' ? `AED ${p.value}M` : p.value}</Typography>
        </Box>
      ))}
    </Box>
  );
}

function BarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: 'rgba(14,20,32,0.98)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 2, p: 1.5 }}>
      <Typography variant="caption" color="primary.main" fontWeight={600} display="block" mb={0.5}>{label}</Typography>
      <Box display="flex" justifyContent="space-between" gap={2}>
        <Typography variant="caption" color="text.secondary">Price/SqFt</Typography>
        <Typography variant="caption" fontWeight={700}>AED {payload[0]?.value?.toLocaleString()}</Typography>
      </Box>
    </Box>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
  color: string;
  sub: string;
}

function KpiCard({ label, value, change, positive, icon, color, sub }: KpiCardProps) {
  return (
    <Paper
      sx={{
        p: 2.5,
        position: 'relative', overflow: 'hidden',
        '&::after': {
          content: '""', position: 'absolute', top: 0, right: 0,
          width: 80, height: 80, borderRadius: '50%',
          background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
          transform: 'translate(20px, -20px)',
        },
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>{label}</Typography>
          <Typography variant="h5" fontWeight={700} mt={0.5} mb={0.25}>{value}</Typography>
          <Box display="flex" alignItems="center" gap={0.5}>
            {positive
              ? <TrendingUp sx={{ fontSize: 14, color: '#10B981' }} />
              : <TrendingDown sx={{ fontSize: 14, color: '#FF4C4C' }} />
            }
            <Typography variant="caption" sx={{ color: positive ? '#10B981' : '#FF4C4C', fontWeight: 600 }}>
              {change}
            </Typography>
            <Typography variant="caption" color="text.secondary">YoY</Typography>
          </Box>
        </Box>
        <Avatar sx={{ bgcolor: `${color}18`, color, width: 48, height: 48, border: `1px solid ${color}33` }}>
          {icon}
        </Avatar>
      </Box>
      <Typography variant="caption" color="text.secondary" mt={1.5} display="block">{sub}</Typography>
    </Paper>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketPulsePage() {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1600, mx: 'auto' }}>
      {/* Header */}
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Market Pulse</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Dubai real estate intelligence — Live feed via Dubai Land Department
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box sx={{
            width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981',
            animation: 'blink 2s infinite',
            '@keyframes blink': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
          }} />
          <Typography variant="caption" color="success.main" fontWeight={600}>Live · Updated 2 min ago</Typography>
        </Box>
      </Box>

      {/* KPIs */}
      <Grid container spacing={2} mb={3}>
        {kpiCards.map(card => (
          <Grid item xs={12} sm={6} lg={3} key={card.label}>
            <KpiCard {...card} />
          </Grid>
        ))}
      </Grid>

      {/* Row 1: Area Chart + Radial */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 2.5, height: 340 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>Daily Transaction Volume</Typography>
                <Typography variant="caption" color="text.secondary">Transactions & AED Volume (M)</Typography>
              </Box>
              <Chip label="Last 30 Days" size="small" sx={{ bgcolor: 'rgba(201,168,76,0.1)', color: 'primary.main', border: '1px solid rgba(201,168,76,0.2)' }} />
            </Box>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={dailyTransactions} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gTrans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<AreaTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="transactions" stroke="#C9A84C" strokeWidth={2} fill="url(#gTrans)" dot={false} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="volume" stroke="#3B82F6" strokeWidth={2} fill="url(#gVol)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={5}>
          <Paper sx={{ p: 2.5, height: 340 }}>
            <Box mb={1}>
              <Typography variant="subtitle1" fontWeight={600}>Transaction Share by Area</Typography>
              <Typography variant="caption" color="text.secondary">% of total weekly transactions</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <ResponsiveContainer width="55%" height={240}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="25%" outerRadius="90%" data={areaBreakdown} startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" cornerRadius={4} />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <Box sx={{ bgcolor: 'rgba(14,20,32,0.98)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 1.5, p: 1.2 }}>
                          <Typography variant="caption" fontWeight={600}>{(payload[0].payload as { name: string; value: number }).name}: {(payload[0].payload as { value: number }).value}%</Typography>
                        </Box>
                      ) : null
                    }
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <Box flex={1}>
                {areaBreakdown.map(item => (
                  <Box key={item.name} display="flex" alignItems="center" gap={1} mb={1}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.fill, flexShrink: 0 }} />
                    <Typography variant="caption" flex={1}>{item.name}</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{item.value}%</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Row 2: Bar Chart + YoY */}
      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2.5, height: 340 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>Price per SqFt by District</Typography>
                <Typography variant="caption" color="text.secondary">AED — Q1 2024 average</Typography>
              </Box>
              <Chip label="Q1 2024" size="small" sx={{ bgcolor: 'rgba(201,168,76,0.1)', color: 'primary.main', border: '1px solid rgba(201,168,76,0.2)' }} />
            </Box>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={pricePerSqftData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9A84C" />
                    <stop offset="100%" stopColor="#9A7A2E" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="area" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="price" fill="url(#gBar)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Paper sx={{ p: 2.5, height: 340, display: 'flex', flexDirection: 'column' }}>
            <Box mb={2}>
              <Typography variant="subtitle1" fontWeight={600}>YoY Price Change</Typography>
              <Typography variant="caption" color="text.secondary">By district — Q1 2024 vs Q1 2023</Typography>
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              {pricePerSqftData.map((item, idx) => (
                <Box key={item.area}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" py={1}>
                    <Box flex={1} mr={2}>
                      <Typography variant="body2" fontWeight={500} mb={0.5}>{item.area}</Typography>
                      <Box sx={{ height: 4, bgcolor: 'rgba(201,168,76,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                        <Box
                          sx={{
                            height: '100%',
                            width: `${Math.min((item.change / 25) * 100, 100)}%`,
                            background: item.change > 15 ? 'linear-gradient(90deg,#C9A84C,#E4C87A)' : item.change > 10 ? 'linear-gradient(90deg,#3B82F6,#60A5FA)' : 'linear-gradient(90deg,#10B981,#34D399)',
                            borderRadius: 2,
                          }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="body2" fontWeight={700} color={item.change > 15 ? 'primary.main' : item.change > 10 ? 'info.main' : 'success.main'}>
                      +{item.change}%
                    </Typography>
                  </Box>
                  {idx < pricePerSqftData.length - 1 && <Divider sx={{ borderColor: 'rgba(201,168,76,0.06)' }} />}
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
