const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function updatePasswords() {
  try {
    console.log('Actualizando contraseñas de usuarios de ejemplo...');
    
    // Generar hash para la contraseña "password123"
    const password = 'password123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('Hash generado para "password123":', hashedPassword);
    
    // Actualizar todas las contraseñas de los doctores
    const updateQuery = `
      UPDATE users 
      SET password_hash = $1 
      WHERE user_type = 'doctor' AND password_hash = '$2b$10$example_hash'
    `;
    
    const result = await pool.query(updateQuery, [hashedPassword]);
    
    console.log(`✅ Contraseñas actualizadas para ${result.rowCount} usuarios.`);
    
    // Mostrar usuarios disponibles
    const usersQuery = 'SELECT name, email, user_type FROM users WHERE user_type = \'doctor\'';
    const users = await pool.query(usersQuery);
    
    console.log('\n📋 Usuarios médicos disponibles:');
    users.rows.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Contraseña: password123`);
    });
    
  } catch (error) {
    console.error('Error actualizando contraseñas:', error);
  } finally {
    await pool.end();
  }
}

updatePasswords(); 