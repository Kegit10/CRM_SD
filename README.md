# SIGLO DATA CRM - Customer Relationship Management

Un sistema completo de gestión de relaciones con clientes desarrollado con React y PostgreSQL, diseñado para empresas que necesitan gestionar contactos, oportunidades de negocio, actividades y generar reportes detallados.

## 🚀 Características Principales

### 👥 Gestión de Roles
- **Administrador del CRM**: Control total del sistema, gestión de usuarios, configuración y logs
- **Gerente de Ventas**: Supervisión del equipo, acceso a reportes y análisis avanzados
- **Comerciales**: Gestión de contactos, negocios y actividades asignadas

### 🔐 Autenticación y Seguridad
- Autenticación JWT con tokens seguros
- Contraseñas cifradas con bcryptjs
- Control de acceso basado en roles
- Middleware de seguridad con Helmet
- Rate limiting para prevenir ataques

### 📋 Gestión de Contactos
- Registro completo de clientes y prospectos
- Información de empresas y contactos individuales
- Historial de interacciones
- Transferencia de contactos entre comerciales
- Búsqueda y filtrado avanzado

### 💼 Seguimiento de Ventas
- Gestión completa del pipeline de ventas
- Fases personalizables (Prospecto, Propuesta, Negociación, etc.)
- Seguimiento de valores y fechas estimadas
- Análisis de conversión y rendimiento
- Reportes de ventas detallados

### 📅 Registro de Actividades
- **Creación rápida**: Formulario integrado en calendario
- **Tipos de actividad**: Reuniones, llamadas, seguimientos, etc.
- **Asignación**: Vinculación con usuarios, contactos y negocios
- **Estados**: Planeada, completada, cancelada
- **Recordatorios**: Gestión de fechas y duraciones
- **Vista de calendario**: Visualización mensual, semanal y diaria

### 🎯 Atención al Cliente
- Historial completo de interacciones
- Seguimiento de casos y consultas
- Integración con actividades y negocios
- Comunicación centralizada

### 📊 Análisis y Reportes

#### Indicadores Gerenciales
- **Distribución de Negocios**:
  - Sin Actividades: 77.1%
  - Actividades Atrasadas: 12%
  - Actividades de Hoy: 0%
  - Actividades Futuras: 10.9%

#### Métricas por Módulo
- Comparación de rendimiento por comercial
- Métricas de actividades, citas y negocios
- Análisis de conversión y efectividad
- Reportes exportables

### 🔄 Transferencia de Clientes
- Transferencia completa de contactos entre comerciales
- Migración de negocios asociados
- Transferencia de actividades futuras
- Registro de auditoría completo

### 📝 Sistema de Logs
- Registro detallado de todas las acciones
- Auditoría de cambios y accesos
- Exportación de logs para análisis
- Dashboard de actividad del sistema

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18**: Framework principal
- **Material-UI (MUI)**: Componentes de interfaz
- **React Router**: Navegación
- **Axios**: Cliente HTTP
- **Recharts**: Gráficos y visualizaciones
- **Date-fns**: Manejo de fechas

### Backend
- **Node.js**: Runtime de JavaScript
- **Express.js**: Framework web
- **PostgreSQL**: Base de datos
- **JWT**: Autenticación
- **bcryptjs**: Cifrado de contraseñas
- **Helmet**: Seguridad HTTP
- **CORS**: Control de acceso

## 📦 Instalación

### Prerrequisitos
- Node.js (v16 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd CRM_V0
```

### 2. Configurar la Base de Datos

#### Crear la base de datos
```sql
CREATE DATABASE crm_system;
CREATE USER crm_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE crm_system TO crm_user;
```

#### Ejecutar el schema
```bash
psql -U crm_user -d crm_system -f server/database/schema.sql
```

### 3. Configurar el Backend

```bash
cd server
npm install
```

#### Configurar variables de entorno
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_system
DB_USER=crm_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development
```

#### Iniciar el servidor
```bash
npm start
```

### 4. Configurar el Frontend

```bash
cd ..
npm install
```

#### Configurar variables de entorno
```bash
cp .env.example .env
```

Editar `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

#### Iniciar la aplicación
```bash
npm start
```

## 🎮 Uso del Sistema

### Credenciales de Demostración

- **Administrador**: admin@crm.com / admin123
- **Gerente**: manager@crm.com / manager123
- **Comercial**: sales@crm.com / sales123

### Flujo de Trabajo Típico

1. **Login**: Acceder con credenciales según el rol
2. **Dashboard**: Visualizar resumen de actividades y métricas
3. **Contactos**: Registrar nuevos clientes y prospectos
4. **Negocios**: Crear oportunidades de venta
5. **Actividades**: Programar reuniones y seguimientos
6. **Calendario**: Visualizar agenda diaria/semanal
7. **Reportes**: Analizar rendimiento y métricas

## 📁 Estructura del Proyecto

```
CRM_V0/
├── public/                 # Archivos públicos
├── src/                    # Código fuente del frontend
│   ├── components/         # Componentes React
│   │   ├── auth/          # Componentes de autenticación
│   │   ├── dashboard/     # Dashboard principal
│   │   ├── layout/        # Componentes de layout
│   │   └── ...            # Otros módulos
│   ├── contexts/          # Contextos de React
│   ├── services/          # Servicios y API
│   ├── utils/             # Utilidades
│   └── App.js             # Componente principal
├── server/                # Código fuente del backend
│   ├── config/            # Configuraciones
│   ├── database/          # Schema y migraciones
│   ├── middleware/        # Middleware personalizado
│   ├── routes/            # Rutas de la API
│   ├── utils/             # Utilidades del servidor
│   └── app.js             # Aplicación Express
├── package.json           # Dependencias del frontend
└── README.md              # Este archivo
```

## 🔧 Scripts Disponibles

### Frontend
```bash
npm start          # Iniciar en modo desarrollo
npm run build      # Construir para producción
npm test           # Ejecutar tests
npm run eject      # Exponer configuración
```

### Backend
```bash
npm start          # Iniciar servidor
npm run dev        # Iniciar con nodemon
npm test           # Ejecutar tests
```

## 🌐 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `PUT /api/auth/change-password` - Cambiar contraseña

### Usuarios
- `GET /api/users` - Listar usuarios
- `GET /api/users/:id` - Obtener usuario
- `POST /api/users` - Crear usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

### Contactos
- `GET /api/contacts` - Listar contactos
- `GET /api/contacts/:id` - Obtener contacto
- `POST /api/contacts` - Crear contacto
- `PUT /api/contacts/:id` - Actualizar contacto
- `DELETE /api/contacts/:id` - Eliminar contacto
- `POST /api/contacts/:id/transfer` - Transferir contacto

### Negocios
- `GET /api/deals` - Listar negocios
- `GET /api/deals/:id` - Obtener negocio
- `POST /api/deals` - Crear negocio
- `PUT /api/deals/:id` - Actualizar negocio
- `DELETE /api/deals/:id` - Eliminar negocio
- `GET /api/deals/stats` - Estadísticas de negocios

### Actividades
- `GET /api/activities` - Listar actividades
- `GET /api/activities/calendar` - Vista de calendario
- `GET /api/activities/:id` - Obtener actividad
- `POST /api/activities` - Crear actividad
- `PUT /api/activities/:id` - Actualizar actividad
- `DELETE /api/activities/:id` - Eliminar actividad

### Reportes
- `GET /api/reports/sales-performance` - Rendimiento de ventas
- `GET /api/reports/pipeline-analysis` - Análisis de pipeline
- `GET /api/reports/activity-metrics` - Métricas de actividad
- `GET /api/reports/dashboard-summary` - Resumen del dashboard

### Logs
- `GET /api/logs` - Listar logs
- `GET /api/logs/export` - Exportar logs
- `GET /api/logs/stats` - Estadísticas de logs

## 🔒 Seguridad

### Medidas Implementadas
- Autenticación JWT con expiración
- Contraseñas hasheadas con bcryptjs
- Validación de entrada en todas las rutas
- Rate limiting para prevenir ataques
- Helmet para headers de seguridad
- CORS configurado apropiadamente
- Sanitización de datos

### Roles y Permisos
- Control de acceso granular por endpoint
- Middleware de autorización
- Validación de propiedad de recursos
- Logs de auditoría completos

## 📈 Monitoreo y Logs

### Sistema de Logging
- Registro de todas las acciones CRUD
- Logs de autenticación y autorización
- Tracking de cambios en datos críticos
- Exportación de logs para análisis
- Dashboard de actividad del sistema

### Métricas Disponibles
- Actividad por usuario
- Rendimiento de ventas
- Uso del sistema
- Errores y excepciones

## 🚀 Despliegue

### Producción

1. **Configurar variables de entorno de producción**
2. **Construir el frontend**:
   ```bash
   npm run build
   ```
3. **Configurar servidor web** (Nginx, Apache)
4. **Configurar base de datos de producción**
5. **Usar PM2 para el backend**:
   ```bash
   npm install -g pm2
   pm2 start server/app.js --name crm-api
   ```

### Docker (Opcional)

```dockerfile
# Dockerfile para el backend
FROM node:16-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

### Estándares de Código
- Usar ESLint y Prettier
- Seguir convenciones de nomenclatura
- Escribir tests para nuevas funcionalidades
- Documentar cambios importantes

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o consultas:
- Crear un issue en GitHub
- Contactar al equipo de desarrollo
- Revisar la documentación de la API

## 🔄 Changelog

### v1.0.0 (2024)
- Lanzamiento inicial
- Sistema completo de CRM
- Autenticación y autorización
- Gestión de contactos, negocios y actividades
- Sistema de reportes
- Dashboard interactivo
- Sistema de logs y auditoría

---

**Desarrollado con ❤️ para mejorar la gestión de relaciones con clientes**