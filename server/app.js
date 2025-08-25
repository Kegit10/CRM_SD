const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

// Importar rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const contactRoutes = require('./routes/contacts');
const dealRoutes = require('./routes/deals');
const activityRoutes = require('./routes/activities');
const logRoutes = require('./routes/logs');
const reportRoutes = require('./routes/reports');
const companiesRoutes = require('./routes/companies');

// Importar utilidades
const { logActivity } = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Configuración de CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Si no hay origen (ej. peticiones desde Postman o CURL)
    if (!origin) return callback(null, true);

    // Permitir localhost y cualquier IP privada (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
    // Esto es un ejemplo, podrías necesitar una lógica más robusta para IPs privadas
    if (origin.startsWith('http://localhost') ||
        origin.startsWith('http://192.168.0.212:3000') ||
        origin.startsWith('http://10.') ||
        origin.startsWith('http://172.31.')) {
      return callback(null, true);
    } else {
      // Bloquear cualquier otro origen no deseado
      const msg = 'La política CORS de este sitio no permite el acceso desde el origen especificado.';
      return callback(new Error(msg), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // límite de 100 requests por ventana
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Rate limiting más estricto para autenticación
//CAMBIAR EL MAXIMO DE INTENTOS DE 500 A 5 Y EL WONDOSMS DE 1 A 1000
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // límite de 5 intentos de login por IP
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesión, intenta de nuevo más tarde.'
  },
  skipSuccessfulRequests: true,
});

app.use('/api/auth/login', authLimiter);
// Servir archivos estáticos del frontend (React build)
app.use(express.static(path.join(__dirname, '../build')));

// Para rutas que no son API, devolver index.html
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

// Middleware de compresión
app.use(compression());

// Middleware de logging
app.use(morgan('combined'));

// Middleware para parsear JSON
app.use(express.json({ 
  limit: process.env.JSON_LIMIT || '10mb'
}));

// Middleware para parsear URL encoded
app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.URL_ENCODED_LIMIT || '10mb'
}));

// Middleware para servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware para capturar IP real
app.use((req, res, next) => {
  req.ip = req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           req.ip;
  next();
});

// Middleware de logging de requests
app.use(async (req, res, next) => {
  // Solo loggear requests a la API
  if (req.path.startsWith('/api/')) {
    const startTime = Date.now();
    
    // Capturar la respuesta original
    const originalSend = res.send;
    res.send = function(data) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Log de la request (solo para requests autenticados)
      if (req.user && req.method !== 'GET') {
        logActivity(
          req.user.id,
          'API_REQUEST',
          null,
          null,
          {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration: duration
          },
          null,
          req.ip,
          req.get('User-Agent')
        ).catch(err => console.error('Error logging API request:', err));
      }
      
      return originalSend.call(this, data);
    };
  }
  
  next();
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/companies', companiesRoutes);


// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CRM API está funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Ruta para obtener información del sistema
app.get('/api/system/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'CRM System API',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

// Middleware para manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  
  // Log del error si hay usuario autenticado
  if (req.user) {
    logActivity(
      req.user.id,
      'ERROR',
      null,
      null,
      {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
      },
      null,
      req.ip,
      req.get('User-Agent')
    ).catch(logErr => console.error('Error logging error:', logErr));
  }
  
  // No exponer detalles del error en producción
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(isDevelopment && { 
      stack: err.stack,
      details: err 
    })
  });
});

module.exports = app;
