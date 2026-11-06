const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Iniciar sesión
router.post('/login', authController.login);

// Obtener información del usuario autenticado (requiere token)
router.get('/me', verifyToken, authController.me);

module.exports = router;
