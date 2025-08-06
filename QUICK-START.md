# ⚡ QUICK START - OftalmoIA

## 🚀 Para desarrollo local:

### 1. Clonar y configurar:
```bash
git clone tu-repositorio
cd sight_tech_directory/doctor-directory
```

### 2. Backend:
```bash
cd backend
npm install
cp .env.example .env
# Edita .env con tus credenciales
npm run dev
```

### 3. Frontend:
```bash
cd .. # volver a doctor-directory
npm install
cp .env.example .env
# Edita .env con la URL del backend
npm start
```

### 4. Base de datos:
```bash
# Ejecutar en PostgreSQL:
psql -U tu_usuario -d tu_base_datos -f backend/config/database.sql
```

---

## 🌐 Para producción:

### Sigue el archivo `DEPLOY-STEPS.md` paso a paso.

**URLs importantes:**
- **Supabase**: https://supabase.com (Base de datos)
- **Railway**: https://railway.app (Backend)
- **Vercel**: https://vercel.com (Frontend)

---

## 🔧 Variables de entorno requeridas:

### Backend (.env):
```env
PORT=5001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=oftalmoia_db
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
JWT_SECRET=QjZd1MERxpyfX9bA+CeiUTQNq7WcC+jIV9kQa/zEFs8=
OPENAI_API_KEY=sk-tu_openai_key
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env):
```env
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_NAME=OftalmoIA
REACT_APP_VERSION=1.0.0
```

---

## ✅ Checklist de funcionalidades:

- [x] 🔐 Registro y login de usuarios
- [x] 👨‍⚕️ Registro de médicos con especialidades
- [x] 📸 Subida de fotos de perfil
- [x] 🤖 Chatbot con OpenAI
- [x] 🔍 Análisis de síntomas con IA
- [x] 📋 Directorio de doctores (sin precios)
- [x] 📅 Sistema de citas
- [x] 🎯 Filtrado inteligente por diagnóstico
- [x] 📱 Responsive design
- [x] 🌐 SEO optimizado
- [x] 🎨 Favicon y branding profesional

---

## 🆘 Problemas comunes:

### Puerto ocupado:
```bash
# Cambiar puerto en backend/.env
PORT=5002
```

### Error de CORS:
```bash
# Verificar CORS_ORIGIN en backend/.env
CORS_ORIGIN=http://localhost:3000
```

### Base de datos no conecta:
```bash
# Verificar credenciales en backend/.env
# Asegurar que PostgreSQL esté corriendo
```

---

## 📚 Estructura del proyecto:

```
doctor-directory/
├── src/                 # Frontend React
├── backend/            # API Node.js
│   ├── routes/         # Endpoints
│   ├── config/         # Base de datos
│   ├── middleware/     # Validaciones
│   └── uploads/        # Imágenes de perfil
├── public/             # Assets estáticos
└── build/              # Build de producción
```

¡Listo para desarrollar! 🎉 