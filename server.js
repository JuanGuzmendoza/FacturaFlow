const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración del motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares para procesar datos de formularios y JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Carpeta de archivos estáticos (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, 'public')));

// Importar las rutas
const inicioRoutes = require('./routes/inicioRoutes');
const facturasRoutes = require('./routes/facturasRoutes');
const empresasRoutes = require('./routes/empresasRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
// Registrar las rutas en la aplicación
app.use('/', inicioRoutes);
app.use('/facturas', facturasRoutes);
app.use('/empresas', empresasRoutes);
app.use('/chatbot', chatbotRoutes);

// Servidor escuchando en el puerto configurado
app.listen(PORT, () => {
    console.log(`Servidor iniciado y ejecutándose localmente en: http://localhost:${PORT}`);
});
