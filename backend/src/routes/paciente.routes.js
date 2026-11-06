const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/paciente.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

// Aplicar middleware para registrar usuario si viene token
router.use(optionalAuth);

// Listar todos los pacientes (soporta ?search=...)
router.get('/', pacienteController.getAllPacientes);

// Obtener un paciente específico por ID
router.get('/:id', pacienteController.getPacienteById);

// Crear un nuevo paciente
router.post('/', pacienteController.createPaciente);

// Actualizar un paciente por ID
router.put('/:id', pacienteController.updatePaciente);

// Eliminar un paciente por ID
router.delete('/:id', pacienteController.deletePaciente);

// Agregar una evolución médica con signos vitales
router.post('/:id/evoluciones', pacienteController.addEvolucion);

// Eliminar una evolución médica
router.delete('/:id/evoluciones/:evoId', pacienteController.deleteEvolucion);

module.exports = router;
