const dbService = require('../services/db.service');

const getAllPacientes = async (req, res) => {
  try {
    const { search } = req.query;
    const pacientes = await dbService.getPacientes(search);

    return res.status(200).json({
      success: true,
      count: pacientes.length,
      data: pacientes
    });
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de pacientes.',
      error: error.message
    });
  }
};

const getPacienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const paciente = await dbService.getPacienteById(id);

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: `No se encontró paciente con el ID: ${id}`
      });
    }

    return res.status(200).json({
      success: true,
      data: paciente
    });
  } catch (error) {
    console.error('Error al obtener paciente:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar el paciente.',
      error: error.message
    });
  }
};

const createPaciente = async (req, res) => {
  try {
    const { nombre, documento, tipoDoc, fechaNacimiento, telefono, eps, regimen, triage, estado, diagnostico } = req.body;

    if (!nombre || !documento) {
      return res.status(400).json({
        success: false,
        message: 'El nombre y el número de documento son obligatorios.'
      });
    }

    const nuevoPaciente = await dbService.createPaciente({
      nombre,
      documento,
      tipoDoc,
      fechaNacimiento,
      telefono,
      eps,
      regimen,
      triage,
      estado,
      diagnostico
    });

    return res.status(201).json({
      success: true,
      message: 'Paciente registrado con éxito.',
      data: nuevoPaciente
    });
  } catch (error) {
    console.error('Error al crear paciente:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar el paciente.',
      error: error.message
    });
  }
};

const updatePaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizados = req.body;

    const pacienteActualizado = await dbService.updatePaciente(id, datosActualizados);

    if (!pacienteActualizado) {
      return res.status(404).json({
        success: false,
        message: `No se encontró paciente con ID ${id} para actualizar.`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Paciente actualizado con éxito.',
      data: pacienteActualizado
    });
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar paciente.',
      error: error.message
    });
  }
};

const deletePaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await dbService.deletePaciente(id);

    if (!eliminado) {
      return res.status(404).json({
        success: false,
        message: `No se encontró paciente con ID ${id} para eliminar.`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Paciente eliminado correctamente del sistema.'
    });
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar paciente.',
      error: error.message
    });
  }
};

const addEvolucion = async (req, res) => {
  try {
    const { id } = req.params;
    const { especialidad, profesional, pa, fc, temp, spO2, nota, fechaHora } = req.body;

    if (!nota || !nota.trim()) {
      return res.status(400).json({
        success: false,
        message: 'La nota de evolución es obligatoria.'
      });
    }

    const resultado = await dbService.addEvolucion(id, {
      especialidad,
      profesional,
      pa,
      fc,
      temp,
      spO2,
      nota,
      fechaHora
    });

    if (!resultado) {
      return res.status(404).json({
        success: false,
        message: `No se encontró el paciente con ID ${id} para agregarle la evolución.`
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Evolución médica registrada correctamente.',
      data: resultado.evolucion,
      paciente: resultado.paciente
    });
  } catch (error) {
    console.error('Error al agregar evolución:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar la evolución médica.',
      error: error.message
    });
  }
};

const deleteEvolucion = async (req, res) => {
  try {
    const { id, evoId } = req.params;
    const paciente = await dbService.deleteEvolucion(id, evoId);

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró la evolución o el paciente especificado.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Evolución médica eliminada.',
      paciente
    });
  } catch (error) {
    console.error('Error al eliminar evolución:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar evolución.',
      error: error.message
    });
  }
};

module.exports = {
  getAllPacientes,
  getPacienteById,
  createPaciente,
  updatePaciente,
  deletePaciente,
  addEvolucion,
  deleteEvolucion
};
