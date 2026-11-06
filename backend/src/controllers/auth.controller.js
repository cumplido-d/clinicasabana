const jwt = require('jsonwebtoken');
const dbService = require('../services/db.service');

const JWT_SECRET = process.env.JWT_SECRET || 'clinica_sabana_secret_key_2026_super_segura';

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Debe ingresar el usuario y la contraseña.'
      });
    }

    const user = await dbService.findUserByUsername(username);

    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos.'
      });
    }

    // Generar Token JWT con vigencia de 7 días
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al procesar el inicio de sesión.',
      error: error.message
    });
  }
};

const me = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener datos del usuario.',
      error: error.message
    });
  }
};

module.exports = {
  login,
  me
};
