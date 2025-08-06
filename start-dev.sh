#!/bin/bash

echo "🚀 Iniciando OftalmoIA en modo desarrollo..."

# Verificar si PostgreSQL está corriendo
echo "📊 Verificando PostgreSQL..."
if ! pg_isready -q; then
    echo "❌ PostgreSQL no está corriendo. Por favor inicia PostgreSQL primero."
    exit 1
fi

# Verificar si la base de datos existe
echo "🗄️ Verificando base de datos..."
if ! psql -lqt | cut -d \| -f 1 | grep -qw oftalmoia_db; then
    echo "📝 Creando base de datos oftalmoia_db..."
    createdb oftalmoia_db
fi

# Verificar si las tablas existen
echo "🔍 Verificando tablas..."
if ! psql -d oftalmoia_db -c "\dt" | grep -q "users"; then
    echo "📋 Ejecutando script de base de datos..."
    psql -d oftalmoia_db -f backend/config/database.sql
fi

# Instalar dependencias del backend si no están instaladas
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Instalando dependencias del backend..."
    cd backend && npm install && cd ..
fi

# Instalar dependencias del frontend si no están instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias del frontend..."
    npm install
fi

# Verificar archivo .env del backend
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Archivo .env del backend no encontrado."
    echo "📝 Copiando archivo de ejemplo..."
    cp backend/env.example backend/.env
    echo "🔧 Por favor edita backend/.env con tus credenciales antes de continuar."
    echo "   Especialmente:"
    echo "   - DB_PASSWORD"
    echo "   - JWT_SECRET"
    echo "   - OPENAI_API_KEY"
    exit 1
fi

# Verificar archivo .env del frontend
if [ ! -f ".env" ]; then
    echo "📝 Copiando archivo .env del frontend..."
    cp env.example .env
fi

echo "✅ Configuración completada!"
echo ""
echo "🎯 Para iniciar el desarrollo:"
echo "1. Terminal 1 (Backend): cd backend && npm run dev"
echo "2. Terminal 2 (Frontend): npm start"
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   API Health: http://localhost:5000/api/health"
echo ""
echo "📚 Documentación: backend/README.md" 