const express = require('express');
const router = express.Router();
const empresasController = require('../controllers/empresasController');



router.get('/', empresasController.obtenerTodas);

router.get('/nueva', empresasController.mostrarFormularioCrear);

router.post('/nueva', empresasController.crearEmpresa);


module.exports = router;