# CRM Backend API

Backend del SIGLO DATA CRM desarrollado con Node.js, Express y PostgreSQL.

## Características

- **Autenticación JWT** con roles y permisos
- **Base de datos PostgreSQL** con esquema completo
- **API RESTful** con validación de datos
- **Sistema de logs** completo
- **Reportes y análisis** avanzados
- **Seguridad** con helmet, rate limiting y CORS
- **Gestión de archivos** con multer
- **Documentación** de API

## Roles del Sistema

### Administrador del CRM
- Configuración completa del sistema
- Gestión de usuarios (crear, activar, desactivar)
- Acceso a todos los logs del sistema
- Exportación de datos
- Configuración de roles y permisos

### Gerente de Ventas
- Supervisión del equipo de ventas
- Acceso a reportes y análisis
- Gestión de clientes y oportunidades
- Transferencia de clientes entre comerciales
- Visualización de métricas del equipo

### Comercial
- Gestión de sus contactos asignados
- Creación y seguimiento de oportunidades
- Registro de actividades
- Acceso a su calendario personal
- Visualización de sus métricas

## Instalación

### Prerrequisitos

- Node.js 16+ 
- PostgreSQL 12+
- npm o yarn

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd CRM_V0/server
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar base de datos**
   
   Crear base de datos en PostgreSQL:
   ```sql
   CREATE DATABASE crm_database;
   CREATE USER crm_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE crm_database TO crm_user;
   ```

4. **Ejecutar esquema de base de datos**
   ```bash
   psql -U crm_user -d crm_database -f database/schema.sql
   ```

5. **Configurar variables de entorno**
   
   Copiar `.env.example` a `.env` y configurar:
   ```bash
   cp .env.example .env
   ```
   
   Editar `.env` con tus configuraciones:
   ```env
   # Base de datos
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=crm_database
   DB_USER=crm_user
   DB_PASSWORD=your_password
   
   # JWT
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=24h
   
   # Servidor
   PORT=5000
   NODE_ENV=development
   ```

6. **Iniciar servidor**
   ```bash
   # Desarrollo
   npm run dev
   
   # Producción
   npm start
   ```

## Scripts disponibles

```bash
# Iniciar en modo desarrollo (con nodemon)
npm run dev

# Iniciar en modo producción
npm start

# Ejecutar tests
npm test

# Linting
npm run lint

# Formatear código
npm run format
```

## Estructura del proyecto

```
server/
├── config/
│   └── database.js          # Configuración de PostgreSQL
├── database/
│   └── schema.sql           # Esquema de base de datos
├── middleware/
│   └── auth.js              # Middleware de autenticación
├── routes/
│   ├── auth.js              # Rutas de autenticación
│   ├── users.js             # Gestión de usuarios
│   ├── contacts.js          # Gestión de contactos
│   ├── deals.js             # Gestión de oportunidades
│   ├── activities.js        # Gestión de actividades
│   ├── logs.js              # Sistema de logs
│   └── reports.js           # Reportes y análisis
├── utils/
│   └── logger.js            # Utilidades de logging
├── uploads/                 # Archivos subidos
├── app.js                   # Aplicación principal
├── package.json
├── .env.example
└── README.md
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario (solo admin)
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/logout` - Cerrar sesión
- `PUT /api/auth/change-password` - Cambiar contraseña

### Usuarios
- `GET /api/users` - Listar usuarios
- `GET /api/users/:id` - Obtener usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Desactivar usuario
- `PUT /api/users/:id/reactivate` - Reactivar usuario

### Contactos
- `GET /api/contacts` - Listar contactos
- `GET /api/contacts/:id` - Obtener contacto
- `POST /api/contacts` - Crear contacto
- `PUT /api/contacts/:id` - Actualizar contacto
- `DELETE /api/contacts/:id` - Eliminar contacto
- `POST /api/contacts/:id/transfer` - Transferir contacto

### Oportunidades (Deals)
- `GET /api/deals` - Listar oportunidades
- `GET /api/deals/:id` - Obtener oportunidad
- `POST /api/deals` - Crear oportunidad
- `PUT /api/deals/:id` - Actualizar oportunidad
- `DELETE /api/deals/:id` - Eliminar oportunidad
- `GET /api/deals/stats` - Estadísticas de oportunidades

### Actividades
- `GET /api/activities` - Listar actividades
- `GET /api/activities/calendar` - Vista de calendario
- `GET /api/activities/:id` - Obtener actividad
- `POST /api/activities` - Crear actividad
- `PUT /api/activities/:id` - Actualizar actividad
- `DELETE /api/activities/:id` - Eliminar actividad

### Logs del Sistema
- `GET /api/logs` - Obtener logs (solo admin)
- `GET /api/logs/export` - Exportar logs a CSV
- `GET /api/logs/stats` - Estadísticas de actividad
- `DELETE /api/logs/cleanup` - Limpiar logs antiguos

### Reportes
- `GET /api/reports/sales-performance` - Rendimiento de ventas
- `GET /api/reports/pipeline-analysis` - Análisis del pipeline
- `GET /api/reports/activity-metrics` - Métricas de actividades
- `GET /api/reports/customer-analysis` - Análisis de clientes
- `GET /api/reports/dashboard-summary` - Resumen del dashboard

## Seguridad

### Autenticación
- JWT tokens con expiración configurable
- Contraseñas hasheadas con bcryptjs
- Rate limiting en endpoints sensibles
- Validación de entrada en todas las rutas

### Autorización
- Sistema de roles y permisos
- Middleware de verificación de ownership
- Restricciones por rol en endpoints

### Protección
- Helmet.js para headers de seguridad
- CORS configurado
- Validación de entrada con express-validator
- Sanitización de datos

## Logging

El sistema registra automáticamente:
- Inicios de sesión y cierres
- Creación, actualización y eliminación de registros
- Transferencias de clientes
- Errores del sistema
- Actividad de la API

## Variables de entorno

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_database
DB_USER=crm_user
DB_PASSWORD=your_password
DB_SSL=false

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# Servidor
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Archivos
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=CRM System <noreply@yourcompany.com>
```

## Desarrollo

### Estructura de respuestas

Todas las respuestas de la API siguen este formato:

```json
{
  "success": true|false,
  "message": "Mensaje descriptivo",
  "data": {
    // Datos de respuesta
  },
  "errors": [
    // Array de errores (solo en caso de error)
  ]
}
```

### Paginación

Los endpoints que retornan listas incluyen paginación:

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 50,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### Filtros

La mayoría de endpoints soportan filtros via query parameters:

```
GET /api/contacts?search=john&status=active&page=1&limit=10
```

## Deployment

### Producción

1. **Configurar variables de entorno de producción**
2. **Configurar base de datos PostgreSQL**
3. **Instalar dependencias de producción**
   ```bash
   npm ci --only=production
   ```
4. **Ejecutar migraciones**
5. **Iniciar con PM2 o similar**
   ```bash
   pm2 start app.js --name crm-api
   ```

### Docker

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT.