import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Paper, TextField, Button, Typography, Alert,
  InputAdornment, IconButton, CircularProgress,
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext.tsx';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@dubaibrokerbrain.com');
  const [password, setPassword] = useState('dubai2024!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/market-pulse';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top left, rgba(201,168,76,0.12) 0%, #080B14 50%, rgba(59,130,246,0.05) 100%)',
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 5 },
          width: '100%',
          maxWidth: 440,
          background: 'rgba(14,20,32,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(201,168,76,0.2)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
        }}
      >
        {/* Brand */}
        <Box textAlign="center" mb={4}>
          <Box
            sx={{
              width: 64, height: 64, mx: 'auto', mb: 2, borderRadius: '50%',
              background: 'linear-gradient(135deg, #C9A84C 0%, #9A7A2E 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(201,168,76,0.3)',
            }}
          >
            <Typography sx={{ color: '#0A0A0F', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-1px' }}>
              DB
            </Typography>
          </Box>
          <Typography variant="h5" fontWeight={700}>Dubai Broker Brain</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Intelligent Real Estate Intelligence Platform
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth label="Email Address" type="email"
            value={email} onChange={e => setEmail(e.target.value)}
            margin="normal" required autoComplete="email"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: 'primary.main', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password} onChange={e => setPassword(e.target.value)}
            margin="normal" required autoComplete="current-password"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: 'primary.main', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(v => !v)} edge="end" size="small">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit" fullWidth variant="contained" size="large"
            disabled={loading} sx={{ mt: 3, py: 1.5, fontSize: '1rem' }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#0A0A0F' }} /> : 'Sign In'}
          </Button>
        </Box>

        <Box mt={3} p={2} sx={{ background: 'rgba(201,168,76,0.06)', borderRadius: 2, border: '1px solid rgba(201,168,76,0.15)' }}>
          <Typography variant="caption" color="text.secondary" display="block" mb={0.5} fontWeight={600}>
            Demo Credentials
          </Typography>
          <Typography variant="caption" color="primary.light" display="block">
            admin@dubaibrokerbrain.com / dubai2024!
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
