import { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
  },
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function App() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirm, setRegisterConfirm] = useState('');

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setError('');
  };

  const showSuccess = (user, token) => {
    // Try to send message to Chrome extension
    const extensionId = import.meta.env.VITE_EXTENSION_ID;
    if (window.chrome && window.chrome.runtime && extensionId) {
      try {
        chrome.runtime.sendMessage(extensionId, {
          action: 'authSuccess',
          user: {
            id: user.id,
            email: user.email,
            isPremium: user.isPremium,
            token: token
          }
        }, (response) => {
          console.log('Message sent to extension:', response);
        });
      } catch (e) {
        console.log('Could not send message to extension:', e);
      }
    }

    setSuccess(true);

    // Close tab after 2 seconds
    setTimeout(() => {
      window.close();
    }, 2000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      showSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (registerPassword !== registerConfirm) {
      setError('Passwords do not match');
      return;
    }

    if (registerPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registerEmail, password: registerPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      showSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <Paper elevation={3} sx={{ p: 4, maxWidth: 400, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom color="success.main">
              ✓ Success!
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              You're signed in successfully.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              You can close this tab now.
            </Typography>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: 4,
        }}
      >
        <Container maxWidth="sm">
          <Paper elevation={3} sx={{ p: 6, borderRadius: 2 }}>
            {/* Logo */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                💰 PriceDrop
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Never miss a deal again
              </Typography>
            </Box>

            {/* Tabs */}
            <Tabs value={tab} onChange={handleTabChange} centered sx={{ mb: 3 }}>
              <Tab label="Sign In" />
              <Tab label="Sign Up" />
            </Tabs>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Login Form */}
            {tab === 0 && (
              <form onSubmit={handleLogin}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  sx={{ mb: 3 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                    },
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                </Button>
              </form>
            )}

            {/* Register Form */}
            {tab === 1 && (
              <form onSubmit={handleRegister}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  inputProps={{ minLength: 6 }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  value={registerConfirm}
                  onChange={(e) => setRegisterConfirm(e.target.value)}
                  required
                  inputProps={{ minLength: 6 }}
                  sx={{ mb: 3 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                    },
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                </Button>
              </form>
            )}

            {/* Info Card */}
            <Card sx={{ mt: 3, bgcolor: '#f8f9ff' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  <strong style={{ color: '#667eea' }}>Free Plan:</strong> Track up to 3 products
                  <br />
                  <strong style={{ color: '#667eea' }}>Pro Plan ($4.99/mo):</strong> Unlimited tracking + email alerts
                </Typography>
              </CardContent>
            </Card>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
