-- Migración: Agregar campo profile_image a tabla users
-- Ejecutar este script en PostgreSQL para agregar el campo de imagen de perfil

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image VARCHAR(500);

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position; 