import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, IconButton,
  Avatar, Menu, MenuItem, Divider, Tooltip, Badge,
  useMediaQuery, useTheme,
} from '@mui/material';
import { Menu as MenuIcon, Notifications, Logout, Settings } from '@mui/icons-material';
import Sidebar from './Sidebar.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';

const DRAWER_WIDTH = 260;

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          background: 'rgba(8,11,20,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(201,168,76,0.1)',
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen(v => !v)} sx={{ mr: 2, color: 'primary.main' }}>
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Notifications">
            <IconButton sx={{ mr: 1, color: 'text.secondary' }}>
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="Account">
            <IconButton onClick={e => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
              <Avatar
                sx={{
                  width: 36, height: 36,
                  background: 'linear-gradient(135deg, #C9A84C 0%, #9A7A2E 100%)',
                  fontSize: '0.875rem', fontWeight: 700, color: '#0A0A0F',
                }}
              >
                {user?.name?.charAt(0) ?? 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: { mt: 1, minWidth: 200, background: 'rgba(14,20,32,0.98)', border: '1px solid rgba(201,168,76,0.15)' },
        }}
      >
        <Box px={2} py={1.5}>
          <Typography variant="subtitle2" fontWeight={600}>{user?.name}</Typography>
          <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
        </Box>
        <Divider sx={{ borderColor: 'rgba(201,168,76,0.1)' }} />
        <MenuItem onClick={() => setAnchorEl(null)} sx={{ gap: 1.5, py: 1.2 }}>
          <Settings fontSize="small" sx={{ color: 'text.secondary' }} /> Settings
        </MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); logout(); }} sx={{ gap: 1.5, py: 1.2, color: 'error.main' }}>
          <Logout fontSize="small" /> Sign Out
        </MenuItem>
      </Menu>

      <Sidebar
        drawerWidth={DRAWER_WIDTH}
        mobileOpen={mobileOpen}
        onDrawerClose={() => setMobileOpen(false)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: { xs: '56px', sm: '64px' },
          minHeight: 'calc(100vh - 64px)',
          bgcolor: 'background.default',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
