import { createTheme } from '@mui/material/styles';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#C9A84C',
      light: '#E4C87A',
      dark: '#9A7A2E',
      contrastText: '#0A0A0F',
    },
    secondary: {
      main: '#7B8FA1',
      light: '#A8BAC9',
      dark: '#556070',
    },
    background: {
      default: '#080B14',
      paper: '#0E1420',
    },
    error: { main: '#FF4C4C' },
    warning: { main: '#F59E0B' },
    success: { main: '#10B981' },
    info: { main: '#3B82F6' },
    text: {
      primary: '#F1F5F9',
      secondary: '#94A3B8',
    },
    divider: 'rgba(201,168,76,0.12)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
          border: '1px solid rgba(201,168,76,0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
        containedPrimary: {
          background: 'linear-gradient(135deg, #C9A84C 0%, #9A7A2E 100%)',
          '&:hover': { background: 'linear-gradient(135deg, #E4C87A 0%, #C9A84C 100%)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: 'rgba(201,168,76,0.2)' },
            '&:hover fieldset': { borderColor: 'rgba(201,168,76,0.5)' },
            '&.Mui-focused fieldset': { borderColor: '#C9A84C' },
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          width: 'calc(100% - 16px)',
          '&.Mui-selected': {
            backgroundColor: 'rgba(201,168,76,0.15)',
            '&:hover': { backgroundColor: 'rgba(201,168,76,0.2)' },
          },
          '&:hover': { backgroundColor: 'rgba(201,168,76,0.08)' },
        },
      },
    },
  },
});
