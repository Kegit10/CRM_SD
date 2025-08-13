import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Business as BusinessIcon,
  Email as EmailIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const Login = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showNotification } = useNotification();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El formato del email no es válido';
    }
    
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        showNotification('Inicio de sesión exitoso', 'success');
        // Redirect to dashboard after successful login
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
      showNotification('Error al iniciar sesión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const demoCredentials = [
    { role: 'Administrador del CRM', email: 'admin@crm.com', password: '123admin' },
    { role: 'Gerente de Ventas', email: 'manager@crm.com', password: 'manager123' },
    { role: 'Representante de Ventas', email: 'sales@crm.com', password: 'sales123' },
    { role: 'Soporte al Cliente', email: 'support@crm.com', password: 'support123' },
  ];

  const fillDemoCredentials = (email, password) => {
    setFormData({ email, password });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.secondary.main}20 100%)`,
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            p: 0,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
              p: 4,
              textAlign: 'center',
            }}
          >
            <BusinessIcon sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
              SIGLO CRM
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Gestión de Relaciones con Clientes
            </Typography>
          </Box>

          {/* Login Form */}
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" component="h2" sx={{ mb: 3, textAlign: 'center', fontWeight: 500 }}>
              Iniciar Sesión
            </Typography>

            {/* Global Error */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                name="email"
                label="Correo Electrónico"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                name="password"
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Demo Credentials */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', color: 'text.secondary' }}>
                Credenciales de Demostración
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {demoCredentials.map((cred, index) => (
                  <Button
                    key={index}
                    variant="outlined"
                    size="small"
                    onClick={() => fillDemoCredentials(cred.email, cred.password)}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      p: 1,
                    }}
                  >
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {cred.role}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {cred.email}
                      </Typography>
                    </Box>
                  </Button>
                ))}
              </Box>
            </Box>
          </CardContent>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;