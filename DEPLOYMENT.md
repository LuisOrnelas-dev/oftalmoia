# 🚀 Guía de Despliegue - OftalmoIA

## Requisitos previos
- Cuenta en [Railway](https://railway.app)
- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [Supabase](https://supabase.com) o PostgreSQL en la nube
- API Key de OpenAI

## 📋 Pasos de despliegue:

### 1. 🗄️ Base de datos (Supabase)

1. Ve a [Supabase](https://supabase.com) y crea un nuevo proyecto
2. En el SQL Editor, ejecuta el contenido de `backend/config/database.sql`
3. Guarda la URL de conexión y contraseña

### 2. 🔧 Backend (Railway)

1. Ve a [Railway](https://railway.app)
2. Conecta tu repositorio GitHub
3. Selecciona la carpeta `backend`
4. Configura las variables de entorno:
   ```
   PORT=5000
   NODE_ENV=production
   DB_HOST=tu_supabase_host
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=tu_supabase_password
   JWT_SECRET=tu_jwt_secret_muy_seguro
   OPENAI_API_KEY=tu_openai_api_key
   CORS_ORIGIN=https://tu-dominio-vercel.vercel.app
   ```
5. Despliega y copia la URL del backend

### 3. 🌐 Frontend (Vercel)

1. Ve a [Vercel](https://vercel.com)
2. Conecta tu repositorio GitHub
3. Selecciona la carpeta raíz del proyecto
4. Configura la variable de entorno:
   ```
   REACT_APP_API_URL=https://tu-backend-railway.up.railway.app/api
   ```
5. Despliega

### 4. ✅ Verificación

1. Visita tu sitio en Vercel
2. Prueba el registro de usuarios
3. Prueba el análisis de síntomas
4. Verifica que el chatbot funcione

## 🔐 Variables de entorno necesarias:

### Backend (.env):
```env
PORT=5000
NODE_ENV=production
DB_HOST=tu_host_postgresql
DB_PORT=5432
DB_NAME=tu_base_datos
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
JWT_SECRET=clave_jwt_super_secreta_minimo_32_caracteres
OPENAI_API_KEY=sk-tu_openai_api_key
CORS_ORIGIN=https://tu-dominio.vercel.app
```

### Frontend (.env):
```env
REACT_APP_API_URL=https://tu-backend.up.railway.app/api
REACT_APP_NAME=OftalmoIA
REACT_APP_VERSION=1.0.0
```

## 🎯 URLs importantes:
- **Frontend**: https://tu-proyecto.vercel.app
- **Backend**: https://tu-backend.up.railway.app
- **API Health**: https://tu-backend.up.railway.app/api/health

## ⚠️ Notas importantes:
- Asegúrate de que CORS_ORIGIN coincida exactamente con tu dominio de Vercel
- El JWT_SECRET debe ser una cadena aleatoria de al menos 32 caracteres
- Mantén seguras tus API keys y credenciales de base de datos 