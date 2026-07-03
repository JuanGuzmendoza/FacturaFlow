const express = require('express');
const router = express.Router();
const inicioController = require('../controllers/inicioController');

// Definir la ruta principal
router.get('/', inicioController.mostrarInicio);
router.get('/prueba', inicioController.mostrarPrueba);
module.exports = router;
