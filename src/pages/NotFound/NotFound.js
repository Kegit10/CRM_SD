import React from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Grid,
} from '@mui/material';
import {
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          }}
        >
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12}>
              {/* 404 SVG Illustration */}
              <Box sx={{ mb: 4 }}>
                <svg
                  width="300"
                  height="200"
                  viewBox="0 0 300 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ maxWidth: '100%', height: 'auto' }}
                >
                  {/* Background */}
                  <rect width="300" height="200" fill="#f8f9fa" rx="10" />
                  
                  {/* 404 Text */}
                  <text
                    x="150"
                    y="80"
                    textAnchor="middle"
                    fontSize="48"
                    fontWeight="bold"
                    fill="#1976d2"
                    fontFamily="Arial, sans-serif"
                  >
                    404
                  </text>
                  
                  {/* Magnifying Glass */}
                  <circle
                    cx="120"
                    cy="130"
                    r="20"
                    fill="none"
                    stroke="#666"
                    strokeWidth="3"
                  />
                  <line
                    x1="135"
                    y1="145"
                    x2="150"
                    y2="160"
                    stroke="#666"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  
                  {/* Question Mark */}
                  <text
                    x="120"
                    y="138"
                    textAnchor="middle"
                    fontSize="16"
                    fontWeight="bold"
                    fill="#666"
                    fontFamily="Arial, sans-serif"
                  >
                    ?
                  </text>
                  
                  {/* Decorative Elements */}
                  <circle cx="50" cy="50" r="3" fill="#1976d2" opacity="0.3" />
                  <circle cx="250" cy="60" r="4" fill="#1976d2" opacity="0.3" />
                  <circle cx="70" cy="170" r="2" fill="#1976d2" opacity="0.3" />
                  <circle cx="230" cy="150" r="3" fill="#1976d2" opacity="0.3" />
                  
                  {/* Document Icon */}
                  <rect x="180" y="120" width="30" height="40" fill="#e3f2fd" stroke="#1976d2" strokeWidth="2" rx="2" />
                  <line x1="185" y1="130" x2="205" y2="130" stroke="#1976d2" strokeWidth="1" />
                  <line x1="185" y1="140" x2="205" y2="140" stroke="#1976d2" strokeWidth="1" />
                  <line x1="185" y1="150" x2="200" y2="150" stroke="#1976d2" strokeWidth="1" />
                </svg>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  color: 'primary.main',
                  mb: 2,
                }}
              >
                ¡Oops! Página no encontrada
              </Typography>
              
              <Typography
                variant="h6"
                color="text.secondary"
                gutterBottom
                sx={{ mb: 3 }}
              >
                La página que estás buscando no existe o ha sido movida.
              </Typography>
              
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}
              >
                No te preocupes, esto sucede a veces. Puedes regresar a la página anterior 
                o ir al inicio para continuar navegando en nuestro CRM.
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<HomeIcon />}
                  onClick={handleGoHome}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                  }}
                >
                  Ir al Inicio
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<ArrowBackIcon />}
                  onClick={handleGoBack}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                  }}
                >
                  Regresar
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box
                sx={{
                  mt: 4,
                  p: 3,
                  backgroundColor: 'rgba(25, 118, 210, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(25, 118, 210, 0.1)',
                }}
              >
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{ fontWeight: 'medium', color: 'primary.main' }}
                >
                  ¿Necesitas ayuda?
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Si crees que esto es un error o necesitas acceder a una página específica, 
                  puedes intentar:
                </Typography>
                
                <Box component="ul" sx={{ textAlign: 'left', maxWidth: 400, mx: 'auto', pl: 2 }}>
                  <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Verificar la URL en la barra de direcciones
                  </Typography>
                  <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Usar el menú de navegación principal
                  </Typography>
                  <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Contactar al administrador del sistema
                  </Typography>
                  <Typography component="li" variant="body2" color="text.secondary">
                    Buscar en el dashboard principal
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFound;