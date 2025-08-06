# 🚀 PASOS ESPECÍFICOS PARA DESPLEGAR OFTALMOIA

## ⚡ RESUMEN RÁPIDO:
1. **Base de datos**: Supabase (gratis)
2. **Backend**: Railway (gratis)  
3. **Frontend**: Vercel (gratis)

---

## 📋 PASO 1: BASE DE DATOS (Supabase)

### 1.1 Crear cuenta y proyecto
1. Ve a https://supabase.com
2. Crea cuenta con GitHub
3. Clic en "New project"
4. Nombre: `oftalmoia-db`
5. Contraseña: **GUARDA ESTA CONTRASEÑA** 🔐

### 1.2 Configurar base de datos
1. Ve a "SQL Editor" en el sidebar
2. Clic en "New query"
3. Copia y pega TODO el contenido del archivo `backend/config/database.sql`
4. Clic en "Run" ▶️
5. Ve a "Settings" > "Database" 
6. Copia la "Connection string" (URI)

**✅ GUARDA ESTOS DATOS:**
```
DB_HOST: (desde la URI)
DB_PASSWORD: (la contraseña que pusiste)
DB_NAME: postgres
DB_USER: postgres
```

---

## 📋 PASO 2: BACKEND (Railway)

### 2.1 Preparar Railway
1. Ve a https://railway.app
2. Crea cuenta con GitHub
3. Clic en "New Project"
4. Selecciona "Deploy from GitHub repo"
5. Busca tu repositorio `sight_tech_directory`
6. Selecciona la carpeta `doctor-directory/backend`

### 2.2 Configurar variables de entorno
En Railway, ve a "Variables" y agrega:

```env
PORT=5000
NODE_ENV=production
DB_HOST=tu_host_de_supabase
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=tu_password_de_supabase
JWT_SECRET=QjZd1MERxpyfX9bA+CeiUTQNq7WcC+jIV9kQa/zEFs8=
OPENAI_API_KEY=tu_openai_api_key
CORS_ORIGIN=https://oftalmoia.vercel.app
```

### 2.3 Desplegar
1. Clic en "Deploy"
2. Espera que termine ⏳
3. Ve a "Settings" > "Networking" 
4. **COPIA LA URL** (algo como: `https://tu-proyecto.up.railway.app`)

**✅ GUARDA LA URL DEL BACKEND**

---

## 📋 PASO 3: FRONTEND (Vercel)

### 3.1 Preparar Vercel
1. Ve a https://vercel.com
2. Crea cuenta con GitHub
3. Clic en "New Project"
4. Busca tu repositorio `sight_tech_directory`
5. Selecciona la carpeta `doctor-directory` (la raíz del frontend)

### 3.2 Configurar antes de desplegar
En "Configure Project":
1. **Project Name**: `oftalmoia`
2. **Framework Preset**: Create React App
3. **Root Directory**: `./doctor-directory`

### 3.3 Variables de entorno
En "Environment Variables" agrega:
```
REACT_APP_API_URL = https://tu-backend-railway.up.railway.app/api
```
(Usa la URL que copiaste de Railway + `/api`)

### 3.4 Desplegar
1. Clic en "Deploy" 
2. Espera que termine ⏳
3. **COPIA LA URL DE VERCEL** (algo como: `https://oftalmoia.vercel.app`)

---

## 📋 PASO 4: ACTUALIZAR CORS

### 4.1 Actualizar Railway
1. Ve de vuelta a Railway
2. En "Variables", actualiza `CORS_ORIGIN` con tu URL de Vercel:
```
CORS_ORIGIN=https://oftalmoia.vercel.app
```
3. Guarda y redespliega

---

## 🧪 PASO 5: PROBAR TODO

### Visita tu sitio en Vercel y prueba:
1. ✅ La página carga
2. ✅ Registro de usuario funciona
3. ✅ Login funciona
4. ✅ Análisis de síntomas funciona
5. ✅ Chatbot responde
6. ✅ Directorio de doctores se ve

---

## 🔐 DATOS QUE NECESITAS TENER LISTOS:

- [ ] **OpenAI API Key**: `sk-...`
- [ ] **Supabase Password**: La que creaste
- [ ] **Supabase Host**: De la connection string
- [ ] **GitHub**: Repositorio subido

---

## 🆘 SI ALGO FALLA:

### Backend no funciona:
1. Ve a Railway > "Deployments" > "View Logs"
2. Busca errores en rojo
3. Verifica que todas las variables estén bien

### Frontend no conecta:
1. Ve a Vercel > "Functions" > "View Function Logs"  
2. Abre DevTools (F12) en tu sitio
3. Ve a "Console" y busca errores

### Base de datos no conecta:
1. Ve a Supabase > "Settings" > "Database"
2. Verifica que la IP esté permitida (debería ser automático)
3. Prueba la connection string

---

## 🎉 ¡LISTO!

Tu sitio estará en: **https://oftalmoia.vercel.app**

**¿Necesitas ayuda?** Comparte los logs de error y te ayudo a solucionarlo. 