const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

// Pool de conexiones a Railway
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'shinkansen.proxy.rlwy.net',
  port: Number(process.env.DB_PORT) || 21985,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'clinica_sabana',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

class DatabaseService {
  async init() {
    try {
      const connection = await pool.getConnection();
      console.log('✅ Conexión exitosa a MySQL en Railway');
      connection.release();
    } catch (error) {
      console.error('❌ Error conectando a Railway MySQL:', error.message);
    }
  }

  // --- MÉTODOS DE USUARIOS ---
  async findUserByUsername(username) {
    const cleanUsername = String(username).trim().toLowerCase();
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE LOWER(username) = ? LIMIT 1',
      [cleanUsername]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // --- MÉTODOS DE PACIENTES ---
  async getPacientes(filtro = '') {
    let sql = 'SELECT * FROM pacientes ORDER BY id DESC';
    let params = [];

    if (filtro && filtro.trim() !== '') {
      const q = `%${filtro.trim()}%`;
      sql = `SELECT * FROM pacientes 
             WHERE nombre LIKE ? OR documento LIKE ? OR eps LIKE ? OR diagnostico LIKE ? 
             ORDER BY id DESC`;
      params = [q, q, q, q];
    }

    const [pacientes] = await pool.query(sql, params);

    // Traer evoluciones de cada paciente
    for (const pac of pacientes) {
      try {
        const [evoluciones] = await pool.query(
          'SELECT * FROM evoluciones WHERE paciente_id = ? ORDER BY id DESC',
          [pac.id]
        );
        pac.evoluciones = evoluciones;
      } catch (e) {
        pac.evoluciones = [];
      }
    }

    return pacientes;
  }

  async getPacienteById(id) {
    const [rows] = await pool.query('SELECT * FROM pacientes WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) return null;

    const paciente = rows[0];
    try {
      const [evoluciones] = await pool.query(
        'SELECT * FROM evoluciones WHERE paciente_id = ? ORDER BY id DESC',
        [id]
      );
      paciente.evoluciones = evoluciones;
    } catch (e) {
      paciente.evoluciones = [];
    }
    return paciente;
  }

  async createPaciente(data) {
    const id = data.id || `pac_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date();

    await pool.query(
      `INSERT INTO pacientes (id, nombre, tipoDoc, documento, fechaNacimiento, telefono, eps, regimen, triage, estado, diagnostico, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.nombre || '',
        data.tipoDoc || 'CC',
        data.documento || '',
        data.fechaNacimiento || null,
        data.telefono || '',
        data.eps || '',
        data.regimen || 'Contributivo',
        data.triage || 'Triage III (Amarillo)',
        data.estado || 'Activo',
        data.diagnostico || '',
        now,
        now
      ]
    );

    return this.getPacienteById(id);
  }

  async updatePaciente(id, datosActualizados) {
    const now = new Date();
    const campos = [];
    const valores = [];

    for (const [key, value] of Object.entries(datosActualizados)) {
      if (key !== 'id' && key !== 'evoluciones' && key !== 'createdAt' && key !== 'updatedAt') {
        campos.push(`${key} = ?`);
        valores.push(value);
      }
    }

    if (campos.length > 0) {
      campos.push('updated_at = ?');
      valores.push(now);
      valores.push(id);

      await pool.query(`UPDATE pacientes SET ${campos.join(', ')} WHERE id = ?`, valores);
    }

    return this.getPacienteById(id);
  }

  async deletePaciente(id) {
    // Al borrar paciente, eliminamos primero sus evoluciones
    await pool.query('DELETE FROM evoluciones WHERE paciente_id = ?', [id]);
    const [result] = await pool.query('DELETE FROM pacientes WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // --- MÉTODOS DE EVOLUCIONES ---
  async addEvolucion(pacienteId, data) {
    const id = data.id || `evo_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;
    const now = new Date();

    const [res] = await pool.query(
      `INSERT INTO evoluciones (id, paciente_id, fechaHora, especialidad, profesional, pa, fc, temp, spO2, nota, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        pacienteId,
        data.fechaHora || new Date().toLocaleString('es-CO'),
        data.especialidad || 'Medicina General',
        data.profesional || '',
        data.pa || 'N/R',
        data.fc || 'N/R',
        data.temp || 'N/R',
        data.spO2 || 'N/R',
        data.nota || '',
        now
      ]
    );

    const nuevaEvolucion = {
      id,
      pacienteId,
      ...data,
      createdAt: now
    };

    const paciente = await this.getPacienteById(pacienteId);
    return { paciente, evolucion: nuevaEvolucion };
  }

  async deleteEvolucion(pacienteId, evolucionId) {
    await pool.query('DELETE FROM evoluciones WHERE id = ? AND paciente_id = ?', [evolucionId, pacienteId]);
    return this.getPacienteById(pacienteId);
  }
}

const dbService = new DatabaseService();
dbService.init();

module.exports = dbService;