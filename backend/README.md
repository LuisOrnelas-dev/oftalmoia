# OftalmoIA Backend API

Backend completo para la plataforma OftalmoIA - Directorio de Oftalmólogos con IA integrada.

## 🚀 Características del MVP

- **Autenticación JWT** completa
- **Base de datos PostgreSQL** con relaciones optimizadas
- **API REST** para todas las funcionalidades
- **Integración con OpenAI** para análisis de síntomas
- **Sistema de citas** completo
- **Validación de datos** robusta
- **Seguridad** implementada (Helmet, Rate Limiting, CORS)

## 📋 Requisitos Previos

- Node.js 18+ 
- PostgreSQL 12+
- OpenAI API Key

## 🛠️ Instalación

1. **Clonar y navegar al directorio backend:**
```bash
cd doctor-directory/backend
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
```bash
cp env.example .env
```

4. **Editar `.env` con tus credenciales:**
```env
PORT=5000
NODE_ENV=development

# Base de datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=oftalmoia_db
DB_USER=postgres
DB_PASSWORD=tu_password

# JWT Secret
JWT_SECRET=tu_jwt_secret_super_seguro_aqui

# OpenAI API
OPENAI_API_KEY=tu_openai_api_key_aqui

# Email (Gmail)
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password

# Configuración de CORS
CORS_ORIGIN=http://localhost:3000
```

5. **Crear base de datos PostgreSQL:**
```sql
CREATE DATABASE oftalmoia_db;
```

6. **Ejecutar script de base de datos:**
```bash
psql -d oftalmoia_db -f config/database.sql
```

7. **Iniciar servidor:**
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📚 Endpoints de la API

### 🔐 Autenticación

#### `POST /api/auth/register`
Registrar nuevo usuario
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "123456",
  "userType": "patient",
  "phone": "+52 55 1234 5678"
}
```

#### `POST /api/auth/login`
Iniciar sesión
```json
{
  "email": "juan@example.com",
  "password": "123456"
}
```

#### `GET /api/auth/profile`
Obtener perfil del usuario (requiere token)

#### `PUT /api/auth/change-password`
Cambiar contraseña (requiere token)

### 👨‍⚕️ Doctores

#### `GET /api/doctors`
Obtener todos los doctores con filtros
```
Query params:
- specialty: Especialidad
- location: Ubicación
- search: Búsqueda general
- minRating: Calificación mínima
- maxPrice: Precio máximo
- language: Idioma
```

#### `GET /api/doctors/:id`
Obtener doctor específico

#### `GET /api/doctors/specialties/list`
Obtener lista de especialidades

#### `GET /api/doctors/locations/list`
Obtener lista de ubicaciones

#### `POST /api/doctors`
Crear perfil de doctor (requiere autenticación)

#### `PUT /api/doctors/:id`
Actualizar perfil de doctor (requiere autenticación)

### 📅 Citas

#### `POST /api/appointments`
Crear nueva cita
```json
{
  "doctorId": 1,
  "appointmentDate": "2024-01-15",
  "appointmentTime": "10:00",
  "reason": "Dolor de cabeza con problemas de visión",
  "patientName": "María López",
  "patientPhone": "+52 55 9876 5432",
  "patientEmail": "maria@example.com"
}
```

#### `GET /api/appointments/my-appointments`
Obtener citas del usuario (requiere autenticación)

#### `GET /api/appointments/:id`
Obtener cita específica (requiere autenticación)

#### `PUT /api/appointments/:id/status`
Actualizar estado de cita (requiere autenticación)

#### `DELETE /api/appointments/:id`
Cancelar cita (requiere autenticación)

### 🤖 Análisis de Síntomas

#### `POST /api/symptoms/analyze`
Analizar síntomas con IA
```json
{
  "symptoms": "Tengo ojos rojos y dolor de cabeza desde hace 2 días"
}
```

#### `GET /api/symptoms/history`
Obtener historial de análisis (requiere autenticación)

#### `GET /api/symptoms/stats`
Obtener estadísticas de síntomas

#### `GET /api/symptoms/suggestions`
Obtener sugerencias de síntomas comunes

## 🗄️ Estructura de la Base de Datos

### Tablas Principales:

- **users**: Usuarios del sistema (pacientes y doctores)
- **doctors**: Perfiles médicos de los doctores
- **appointments**: Citas médicas
- **reviews**: Reseñas de pacientes
- **symptom_analyses**: Análisis de síntomas con IA

### Relaciones:
- `users` → `doctors` (1:1)
- `users` → `appointments` (1:N como paciente)
- `doctors` → `appointments` (1:N)
- `users` → `reviews` (1:N como paciente)
- `doctors` → `reviews` (1:N)
- `users` → `symptom_analyses` (1:N como paciente)

## 🔒 Seguridad

- **JWT Tokens** para autenticación
- **bcrypt** para encriptación de contraseñas
- **Helmet** para headers de seguridad
- **Rate Limiting** para prevenir spam
- **CORS** configurado
- **Validación** de datos con express-validator

## 🧪 Testing

```bash
npm test
```

## 📦 Scripts Disponibles

- `npm start`: Iniciar servidor en producción
- `npm run dev`: Iniciar servidor en desarrollo con nodemon
- `npm test`: Ejecutar tests

## 🔧 Configuración de Desarrollo

### Variables de Entorno de Desarrollo:
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=oftalmoia_db
DB_USER=postgres
DB_PASSWORD=tu_password
JWT_SECRET=dev_secret_key
OPENAI_API_KEY=tu_openai_key
CORS_ORIGIN=http://localhost:3000
```

## 🚀 Despliegue

### Heroku:
1. Crear app en Heroku
2. Configurar PostgreSQL addon
3. Configurar variables de entorno
4. Deploy con Git

### Docker:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📊 Monitoreo

- Health check: `GET /api/health`
- Logs estructurados
- Manejo de errores centralizado

## 🔄 Próximas Mejoras

- [ ] Sistema de notificaciones por email
- [ ] Pagos en línea con Stripe
- [ ] Chat en tiempo real
- [ ] Dashboard de analytics
- [ ] Sistema de reseñas completo
- [ ] API de terceros (laboratorios, farmacias)

## 📞 Soporte

Para soporte técnico o preguntas sobre la implementación, contacta al equipo de desarrollo.

---

**OftalmoIA Backend** - Conectando pacientes con los mejores oftalmólogos de México 🇲🇽 