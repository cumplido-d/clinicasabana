require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const dbService = require('./src/services/db.service');
const authRoutes = require('./src/routes/auth.routes');
const pacienteRoutes = require('./src/routes/paciente.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS para permitir conexiones desde cualquier origen (Web, Cordova, localhost, Railway)
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Middlewares para procesar JSON y peticiones URL encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logger HTTP en consola
app.use(morgan('dev'));

// Configuración de Documentación Swagger OpenAPI 3.0
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'API Clínica de la Sabana',
    version: '1.0.0',
    description: 'Documentación técnica interactiva para la gestión de Historias Clínicas, Triage y Evoluciones Médicas de Urgencias.'
  },
  servers: [
    { url: `http://localhost:${PORT}`, description: 'Servidor Local de Desarrollo' },
    { url: 'https://clinicasabana-production.up.railway.app', description: 'Servidor Cloud en Railway' }
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Salud del Sistema'],
        summary: 'Verificar estado del servicio y base de datos',
        responses: {
          '200': { description: 'Servidor en línea y operativo' }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Inicio de sesión de usuarios (Admin / Consulta)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string', example: 'admin' },
                  password: { type: 'string', example: '1234' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Autenticación satisfactoria' },
          '401': { description: 'Credenciales inválidas' }
        }
      }
    },
    '/api/auth/me': {
      get: {
        tags: ['Autenticación'],
        summary: 'Obtener datos del usuario autenticado actual',
        responses: {
          '200': { description: 'Perfil obtenido exitosamente' }
        }
      }
    },
    '/api/pacientes': {
      get: {
        tags: ['Pacientes (CRUD)'],
        summary: 'Listar todos los pacientes o filtrar por búsqueda',
        parameters: [
          {
            name: 'search',
            in: 'query',
            description: 'Término de búsqueda (nombre o documento)',
            required: false,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': { description: 'Listado de pacientes obtenido exitosamente' }
        }
      },
      post: {
        tags: ['Pacientes (CRUD)'],
        summary: 'Registrar nuevo paciente en Triage con signos vitales',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  documento: { type: 'string', example: '1005123456' },
                  tipoDoc: { type: 'string', example: 'CC' },
                  nombre: { type: 'string', example: 'Carlos Mendoza' },
                  fechaNacimiento: { type: 'string', example: '1990-04-15' },
                  eps: { type: 'string', example: 'Sanitas' },
                  triage: { type: 'string', example: 'Triage II (Naranja)' },
                  motivoConsulta: { type: 'string', example: 'Dolor torácico opresivo' },
                  taIngreso: { type: 'string', example: '130/85' },
                  fcIngreso: { type: 'string', example: '88 bpm' },
                  tempIngreso: { type: 'string', example: '37.1 °C' },
                  spo2Ingreso: { type: 'string', example: '98%' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Paciente registrado exitosamente' }
        }
      }
    },
    '/api/pacientes/{id}': {
      get: {
        tags: ['Pacientes (CRUD)'],
        summary: 'Consultar información detallada de un paciente por ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Detalle del paciente encontrado' },
          '404': { description: 'Paciente no encontrado' }
        }
      },
      put: {
        tags: ['Pacientes (CRUD)'],
        summary: 'Actualizar datos clínicos o administrativos del paciente',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object' }
            }
          }
        },
        responses: {
          '200': { description: 'Paciente actualizado correctamente' }
        }
      },
      delete: {
        tags: ['Pacientes (CRUD)'],
        summary: 'Eliminar paciente del registro asistencial',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Paciente eliminado exitosamente' }
        }
      }
    },
    '/api/pacientes/{id}/evoluciones': {
      post: {
        tags: ['Evoluciones Médicas'],
        summary: 'Registrar nueva evolución médica y constantes vitales',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  profesional: { type: 'string', example: 'Dr. Mario Ramírez' },
                  especialidad: { type: 'string', example: 'Medicina General' },
                  nota: { type: 'string', example: 'Paciente tolera tratamiento analgésico.' },
                  pa: { type: 'string', example: '120/80' },
                  fc: { type: 'string', example: '76 bpm' },
                  temp: { type: 'string', example: '36.8 °C' },
                  spO2: { type: 'string', example: '99%' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Evolución médica registrada exitosamente' }
        }
      }
    },
    '/api/pacientes/{id}/evoluciones/{evoId}': {
      delete: {
        tags: ['Evoluciones Médicas'],
        summary: 'Eliminar una evolución específica de un paciente',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'evoId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Evolución eliminada' }
        }
      }
    }
  }
};

// Interfaz gráfica Swagger UI en la ruta /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Ruta de comprobación de salud (Health Check para Railway)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'API Clínica de la Sabana',
    version: '1.0.0',
    uptime: `${Math.floor(process.uptime())} segundos`,
    timestamp: new Date().toISOString()
  });
});

// Ruta raíz con información descriptiva de la API
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'API REST - Clínica de la Sabana',
    version: '1.0.0',
    status: 'En línea',
    documentation: {
      swaggerUi: 'GET /api-docs',
      health: 'GET /api/health',
      auth: {
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me'
      },
      pacientes: {
        list: 'GET /api/pacientes',
        search: 'GET /api/pacientes?search={termino}',
        getById: 'GET /api/pacientes/:id',
        create: 'POST /api/pacientes',
        update: 'PUT /api/pacientes/:id',
        delete: 'DELETE /api/pacientes/:id',
        addEvolucion: 'POST /api/pacientes/:id/evoluciones',
        deleteEvolucion: 'DELETE /api/pacientes/:id/evoluciones/:evoId'
      }
    }
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacienteRoutes);

// Manejador para rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('Error no controlado en la aplicación:', err);
  res.status(500).json({
    success: false,
    message: 'Ocurrió un error inesperado en el servidor.',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// Inicializar base de datos y arrancar el servidor
const startServer = async () => {
  try {
    await dbService.init();
    console.log('✅ Base de datos inicializada correctamente.');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor ejecutándose en http://0.0.0.0:${PORT}`);
      console.log(`📚 Documentación Swagger UI en http://localhost:${PORT}/api-docs`);
      console.log(`📡 Endpoints disponibles en http://localhost:${PORT}/api/pacientes`);
      console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();