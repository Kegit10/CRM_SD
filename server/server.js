require("dotenv").config();
const app = require('./app');
const PORT = process.env.PORT || 5000;
app.set('trust proxy', 1);
require('dotenv').config();
console.log('DEBUG: process.env.CORS_ORIGIN =', process.env.CORS_ORIGIN);


// Iniciar el servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor CRM ejecutándose en puerto ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API disponible en: http://localhost:${PORT}/api`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
});

// Manejo de señales para cierre graceful
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado.');
    process.exit(0);
  });
});

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
  console.error('Excepción no capturada:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada en:', promise, 'razón:', reason);
  process.exit(1);
});

module.exports = server;