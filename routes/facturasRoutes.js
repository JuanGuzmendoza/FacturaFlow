const express = require('express');
const router = express.Router();
const facturasController = require('../controllers/facturasController');

// --- Rutas del CRUD de Facturas ---

// LEER (Mostrar tabla con listado de facturas)
router.get('/', facturasController.obtenerTodas);

// CREAR (Mostrar formulario de registro)
router.get('/nueva', facturasController.mostrarFormularioCrear);

// CREAR (Procesar inserción del formulario)
router.post('/nueva', facturasController.crearFactura);

// EDITAR (Mostrar formulario de edición con datos cargados)
router.get('/editar/:id', facturasController.mostrarFormularioEditar);

// EDITAR (Procesar actualización de datos)
router.post('/editar/:id', facturasController.actualizarFactura);

// ELIMINAR (Procesar eliminación)
router.post('/eliminar/:id', facturasController.eliminarFactura);

// IA (Procesar mejora de descripción)
router.post('/generar-descripcion', facturasController.generarDescripcionIA);

module.exports = router;
