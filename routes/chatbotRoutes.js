const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// Ruta para cargar la vista del chat
router.get('/', chatbotController.mostrarChat);

// Ruta AJAX para procesar la pregunta del usuario
router.post('/pregunta', chatbotController.procesarPregunta);

module.exports = router;
