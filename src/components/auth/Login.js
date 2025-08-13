import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Container,
  Paper,
  useTheme,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const Login = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, clearError, user } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location]);

  // Clear error when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
    
    // Clear global error
    if (error) {
      clearError();
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El formato del email no es válido';
    }
    
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        showSuccess(`¡Bienvenido, ${result.user.first_name}!`);
        
        // Redirect to intended page or dashboard
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        showError(result.error || 'Error en el inicio de sesión');
      }
    } catch (error) {
      showError('Error inesperado durante el inicio de sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle password visibility toggle
  const handleTogglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

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
              SIGLO DATA CRM
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

            <Box component="form" onSubmit={handleSubmit} noValidate>
              {/* Email Field */}
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Correo Electrónico"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                error={!!formErrors.email}
                helperText={formErrors.email}
                margin="normal"
                autoComplete="email"
                autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color={formErrors.email ? 'error' : 'action'} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              {/* Password Field */}
              <TextField
                fullWidth
                id="password"
                name="password"
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                error={!!formErrors.password}
                helperText={formErrors.password}
                margin="normal"
                autoComplete="current-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color={formErrors.password ? 'error' : 'action'} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmitting || loading}
                sx={{
                  mt: 2,
                  mb: 2,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                {isSubmitting || loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </Box>

            {/* Demo Credentials */}
            <Box
              sx={{
                mt: 3,
                p: 2,
                backgroundColor: theme.palette.grey[50],
                borderRadius: 1,
                border: `1px solid ${theme.palette.grey[200]}`,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Credenciales de Demostración:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                <strong>Administrador:</strong> admin@crm.com / admin123
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                <strong>Gerente:</strong> manager@crm.com / manager123
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Comercial:</strong> sales@crm.com / sales123
              </Typography>
            </Box>
          </CardContent>
        </Paper>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            © 2024 SIGLO DATA CRM. Todos los derechos reservados.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;