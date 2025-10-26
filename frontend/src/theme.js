import { alpha, createTheme } from '@mui/material/styles'

const primaryMain = '#1d4ed8'
const secondaryMain = '#0ea5e9'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: primaryMain,
      light: '#60a5fa',
      dark: '#1e3a8a',
      contrastText: '#ffffff'
    },
    secondary: {
      main: secondaryMain,
      light: '#38bdf8',
      dark: '#0369a1',
      contrastText: '#ffffff'
    },
    background: {
      default: '#f4f6fb',
      paper: '#ffffff'
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b'
    },
    divider: alpha('#0f172a', 0.08)
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.04em' },
    h2: { fontWeight: 700, letterSpacing: '-0.04em' },
    h3: { fontWeight: 700, letterSpacing: '-0.03em' },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { fontWeight: 600, textTransform: 'none' }
  },
  shape: {
    borderRadius: 18
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(29,78,216,0.08), transparent 45%),
            radial-gradient(circle at 80% 0%, rgba(14,165,233,0.09), transparent 52%),
            linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)
          `,
          minHeight: '100vh'
        },
        a: {
          color: primaryMain
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow:
            '0 20px 65px rgba(15, 23, 42, 0.08), 0 6px 25px rgba(15, 23, 42, 0.06)'
        }
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          borderRadius: 999,
          padding: '10px 22px'
        },
        sizeLarge: {
          padding: '12px 28px'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow:
            '0 16px 45px rgba(15, 23, 42, 0.08), 0 4px 18px rgba(15, 23, 42, 0.05)'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none'
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          margin: '4px 12px',
          padding: '12px 16px',
          '&.Mui-selected': {
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0))',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)'
          },
          '&:hover': {
            backgroundColor: alpha(primaryMain, 0.08)
          }
        }
      }
    }
  }
})

export default theme
