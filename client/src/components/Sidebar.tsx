import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Chip,
} from '@mui/material';
import { TrendingUp, Article, People, Hub, Psychology, PictureAsPdf } from '@mui/icons-material';

interface SidebarProps {
  drawerWidth: number;
  mobileOpen: boolean;
  onDrawerClose: () => void;
}

const navItems = [
  { label: 'Market Pulse', path: '/market-pulse', icon: <TrendingUp />, badge: 'Live', badgeColor: '#10B981' },
  { label: 'News', path: '/news', icon: <Article />, badge: '12', badgeColor: '#3B82F6' },
  { label: 'CRM', path: '/crm', icon: <People />, badge: '5', badgeColor: '#F59E0B' },
  { label: 'Analysis', path: '/analysis', icon: <PictureAsPdf />, badge: 'PDF', badgeColor: '#10B981' },
  { label: 'Content Hub', path: '/content-hub', icon: <Hub />, badge: null, badgeColor: null },
  { label: 'Sales Dojo', path: '/sparring', icon: <Psychology />, badge: 'AI', badgeColor: '#C9A84C' },
] as const;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #0C1222 0%, #080B14 100%)',
        borderRight: '1px solid rgba(201,168,76,0.1)',
      }}
    >
      {/* Brand */}
      <Box
        sx={{
          px: 3, py: 2.5,
          display: 'flex', alignItems: 'center', gap: 1.5,
          borderBottom: '1px solid rgba(201,168,76,0.1)',
          minHeight: { xs: 56, sm: 64 },
        }}
      >
        <Box
          sx={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'linear-gradient(135deg, #C9A84C 0%, #9A7A2E 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(201,168,76,0.3)', flexShrink: 0,
          }}
        >
          <Typography sx={{ color: '#0A0A0F', fontWeight: 800, fontSize: '0.7rem' }}>DB</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" fontWeight={700} color="primary.main" lineHeight={1.2}>
            Broker Brain
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            Dubai Real Estate
          </Typography>
        </Box>
      </Box>

      {/* Nav */}
      <Box sx={{ flexGrow: 1, py: 2 }}>
        <Typography
          variant="overline"
          sx={{ px: 2.5, mb: 1, display: 'block', color: 'text.secondary', fontSize: '0.65rem', letterSpacing: '0.12em' }}
        >
          Intelligence Suite
        </Typography>
        <List disablePadding>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={isActive}
                  onClick={() => { navigate(item.path); onNavigate?.(); }}
                  sx={{
                    py: 1.2, px: 2.5,
                    position: 'relative',
                    '&.Mui-selected::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0, top: '20%', bottom: '20%',
                      width: 3, borderRadius: '0 4px 4px 0',
                      background: 'linear-gradient(180deg, #C9A84C, #9A7A2E)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: isActive ? 'primary.main' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'primary.light' : 'text.primary',
                    }}
                  />
                  {item.badge && item.badgeColor && (
                    <Chip
                      label={item.badge}
                      size="small"
                      sx={{
                        height: 18, fontSize: '0.65rem', fontWeight: 600,
                        bgcolor: `${item.badgeColor}22`, color: item.badgeColor,
                        border: `1px solid ${item.badgeColor}44`,
                        '& .MuiChip-label': { px: 0.75 },
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Footer status */}
      <Box sx={{ px: 2, py: 2, borderTop: '1px solid rgba(201,168,76,0.08)' }}>
        <Box sx={{ p: 1.5, borderRadius: 2, background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.1)' }}>
          <Typography variant="caption" color="primary.main" fontWeight={600} display="block">
            Live Market Data
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            Dubai Land Department feed
          </Typography>
          <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
            <Box
              sx={{
                width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981',
                animation: 'blink 2s infinite',
                '@keyframes blink': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
              }}
            />
            <Typography variant="caption" color="success.main" sx={{ fontSize: '0.65rem' }}>Connected</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function Sidebar({ drawerWidth, mobileOpen, onDrawerClose }: SidebarProps) {
  const sharedStyles = {
    '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' as const, border: 'none' },
  };

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      <Drawer
        variant="temporary" open={mobileOpen} onClose={onDrawerClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, ...sharedStyles }}
      >
        <SidebarContent onNavigate={onDrawerClose} />
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{ display: { xs: 'none', md: 'block' }, ...sharedStyles }}
        open
      >
        <SidebarContent />
      </Drawer>
    </Box>
  );
}
