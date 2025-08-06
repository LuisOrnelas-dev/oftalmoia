# OftalmoIA - Directorio de Oftalmólogos con IA

Plataforma completa para conectar pacientes con oftalmólogos especializados, con análisis de síntomas mediante inteligencia artificial.

## 🚀 Características del MVP

### Frontend (React)
- **Interfaz moderna** con Tailwind CSS
- **Sistema de autenticación** completo
- **Búsqueda avanzada** de doctores con filtros
- **Análisis de síntomas** con IA integrada
- **Sistema de citas** funcional
- **Chat bot** asistente virtual
- **Diseño responsive** para todos los dispositivos

### Backend (Node.js + Express)
- **API REST** completa y documentada
- **Autenticación JWT** segura
- **Base de datos PostgreSQL** optimizada
- **Integración con OpenAI** para análisis médico
- **Validación robusta** de datos
- **Seguridad implementada** (Helmet, Rate Limiting, CORS)

## 📋 Requisitos Previos

- **Node.js 18+**
- **PostgreSQL 12+**
- **OpenAI API Key** (para análisis de síntomas)

## 🛠️ Instalación Rápida

### Opción 1: Script Automático (Recomendado)

```bash
# Ejecutar script de configuración
./start-dev.sh
```

### Opción 2: Instalación Manual

1. **Clonar el repositorio:**
```bash
git clone <tu-repositorio>
cd doctor-directory
```

2. **Configurar base de datos PostgreSQL:**
```bash
# Crear base de datos
createdb oftalmoia_db

# Ejecutar script SQL
psql -d oftalmoia_db -f backend/config/database.sql
```

3. **Configurar variables de entorno:**

**Backend (.env):**
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=oftalmoia_db
DB_USER=postgres
DB_PASSWORD=tu_password
JWT_SECRET=tu_jwt_secret_super_seguro_aqui
OPENAI_API_KEY=tu_openai_api_key_aqui
CORS_ORIGIN=http://localhost:3000
```

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=OftalmoIA
REACT_APP_VERSION=1.0.0
```

4. **Instalar dependencias:**
```bash
# Frontend
npm install

# Backend
cd backend && npm install && cd ..
```

5. **Iniciar servidores:**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
npm start
```

## 🌐 URLs de Acceso

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/api/health

## 📚 Documentación de la API

### Endpoints Principales

#### Autenticación
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/profile` - Perfil del usuario

#### Doctores
- `GET /api/doctors` - Listar doctores con filtros
- `GET /api/doctors/:id` - Obtener doctor específico
- `GET /api/doctors/specialties/list` - Especialidades disponibles

#### Citas
- `POST /api/appointments` - Crear cita
- `GET /api/appointments/my-appointments` - Mis citas
- `PUT /api/appointments/:id/status` - Actualizar estado

#### Análisis de Síntomas
- `POST /api/symptoms/analyze` - Analizar síntomas con IA
- `GET /api/symptoms/history` - Historial de análisis

## 🗄️ Estructura de la Base de Datos

### Tablas Principales
- **users** - Usuarios (pacientes y doctores)
- **doctors** - Perfiles médicos
- **appointments** - Citas médicas
- **reviews** - Reseñas de pacientes
- **symptom_analyses** - Análisis de síntomas

## 🔒 Seguridad

- **JWT Tokens** para autenticación
- **bcrypt** para encriptación de contraseñas
- **Helmet** para headers de seguridad
- **Rate Limiting** para prevenir spam
- **CORS** configurado
- **Validación** de datos con express-validator

## 🧪 Testing

```bash
# Backend
cd backend && npm test

# Frontend
npm test
```

## 📦 Scripts Disponibles

### Frontend
- `npm start` - Iniciar servidor de desarrollo
- `npm build` - Construir para producción
- `npm test` - Ejecutar tests

### Backend
- `npm run dev` - Iniciar con nodemon
- `npm start` - Iniciar en producción
- `npm test` - Ejecutar tests

## 🚀 Despliegue

### Heroku
1. Crear app en Heroku
2. Configurar PostgreSQL addon
3. Configurar variables de entorno
4. Deploy con Git

### Docker
```dockerfile
# Dockerfile para el backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔄 Próximas Mejoras

- [ ] Sistema de notificaciones por email
- [ ] Pagos en línea con Stripe
- [ ] Chat en tiempo real
- [ ] Dashboard de analytics
- [ ] Sistema de reseñas completo
- [ ] API de terceros (laboratorios, farmacias)
- [ ] Aplicación móvil

## 🐛 Solución de Problemas

### Error de conexión a PostgreSQL
```bash
# Verificar que PostgreSQL esté corriendo
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux
```

### Error de CORS
Verificar que `CORS_ORIGIN` en el backend coincida con la URL del frontend.

### Error de OpenAI
Verificar que `OPENAI_API_KEY` esté configurado correctamente.

## 📞 Soporte

Para soporte técnico o preguntas sobre la implementación, contacta al equipo de desarrollo.

---

**OftalmoIA** - Conectando pacientes con los mejores oftalmólogos de México 🇲🇽

*Desarrollado con ❤️ para mejorar el acceso a la salud visual*
