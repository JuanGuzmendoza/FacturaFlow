const mysql = require('mysql2');
require('dotenv').config();

// Crear un grupo de conexiones (pool) para mayor eficiencia
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS ,
    database: process.env.DB_NAME ,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Verificar la conexión inicial de prueba
pool.getConnection((err, conexion) => {
    if (err) {
        console.error('¡Error! No se pudo conectar a la base de datos MySQL.');
        console.error('Detalles del error:', err.message);
        console.error('Asegúrate de que tu servidor MySQL (XAMPP, Laragon, etc.) esté encendido y que exista la base de datos.');
    } else {
        console.log('Conexión establecida con éxito con la base de datos MySQL.');
        conexion.release(); // Liberar la conexión de vuelta al pool
    }
});

module.exports = pool;
