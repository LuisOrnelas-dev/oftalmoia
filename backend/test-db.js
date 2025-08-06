const { Pool } = require('pg');
require('dotenv').config();

async function testDatabaseConnection() {
  // Configuración usando las variables de entorno del backend
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('🔍 Probando conexión a la base de datos...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Port: ${process.env.DB_PORT}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`User: ${process.env.DB_USER}`);
    console.log(`Password: ${process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-3) : 'NO CONFIGURADA'}`);
    
    // Intentar conectar
    const client = await pool.connect();
    console.log('✅ ¡Conexión exitosa!');
    
    // Probar una consulta simple
    const result = await client.query('SELECT NOW() as current_time');
    console.log('⏰ Tiempo actual del servidor:', result.rows[0].current_time);
    
    // Verificar que existan las tablas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tablas encontradas:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('🔍 Código de error:', error.code);
    
    if (error.code === 'ENOTFOUND') {
      console.error('💡 El host no se puede resolver. Verifica DB_HOST.');
    } else if (error.code === '28P01') {
      console.error('💡 Contraseña incorrecta. Verifica DB_PASSWORD.');
    } else if (error.code === '3D000') {
      console.error('💡 Base de datos no existe. Verifica DB_NAME.');
    }
    
    await pool.end();
  }
}

testDatabaseConnection(); 