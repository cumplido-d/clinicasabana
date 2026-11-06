# Backend - Clínica de la Sabana API REST

Servicio Backend construido con **Node.js** y **Express** para el Sistema de Gestión de Historias Clínicas y Pacientes de la Clínica de la Sabana. Diseñado para desplegarse fácilmente en **Railway** y conectarse con aplicaciones web y móviles (Cordova).

---

## 🚀 Características

- **Autenticación con JWT**: Roles diferenciados para `admin` y `consulta`.
- **Gestión Integral de Pacientes**: CRUD completo de pacientes (Crear, Leer, Actualizar, Eliminar).
- **Historial de Evoluciones Médicas**: Registro de notas clínicas con monitoreo de signos vitales (PA, FC, Temp, SpO2).
- **CORS Habilitado**: Conexión lista para Apache Cordova, navegadores web y entornos móviles.
- **Health Check Integrado**: Endpoint `/api/health` para monitoreo continuo en Railway.
- **Persistencia Ligera y Confiable**: Base de datos JSON automática sin dependencias pesadas de bases de datos externas obligatorias.

---

## 📦 Instalación y Uso Local

1. Entra en esta carpeta:
   ```bash
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```
   O en producción:
   ```bash
   npm start
   ```
4. El servidor se ejecutará en: `http://localhost:3000`

---

## 🔑 Credenciales Demo

| Usuario | Contraseña | Rol | Permisos |
| :--- | :--- | :--- | :--- |
| `admin` | `1234` | Administrador | Crear, editar, eliminar pacientes y registrar evoluciones |
| `consulta` | `1234` | Consulta | Solo lectura, consulta e impresión de fichas |

---

## 🌐 Endpoints de la API

### Autenticación
- `POST /api/auth/login` - Iniciar sesión (retorna token JWT y rol)
  - Body: `{ "username": "admin", "password": "1234" }`
- `GET /api/auth/me` - Perfil del usuario autenticado (requiere cabecera `Authorization: Bearer <token>`)

### Pacientes
- `GET /api/pacientes` - Obtener lista de pacientes
  - Parámetro de búsqueda: `GET /api/pacientes?search=Ana`
- `GET /api/pacientes/:id` - Obtener detalle de un paciente específico
- `POST /api/pacientes` - Registrar nuevo paciente
- `PUT /api/pacientes/:id` - Actualizar información del paciente
- `DELETE /api/pacientes/:id` - Eliminar paciente

### Evoluciones Médicas
- `POST /api/pacientes/:id/evoluciones` - Agregar evolución con signos vitales
  - Body:
    ```json
    {
      "especialidad": "Medicina General",
      "profesional": "Dr. Carlos Pérez",
      "pa": "120/80",
      "fc": "78 bpm",
      "temp": "36.5 °C",
      "spO2": "98%",
      "nota": "Paciente refiere mejoría clínica."
    }
    ```
- `DELETE /api/pacientes/:id/evoluciones/:evoId` - Eliminar una evolución médica

### Salud y Estado
- `GET /api/health` - Comprobar que el servicio está activo (ideal para Railway Healthchecks).

---

## 🚢 Cómo Subir a GitHub y Desplegar en Railway

### Paso 1: Inicializar repositorio Git en la carpeta backend
Abre tu terminal en la carpeta `backend` y ejecuta:
```bash
git init
git add .
git commit -m "Initial commit - Backend Clinica de la Sabana"
git branch -M main
```

### Paso 2: Conectar con tu repositorio en GitHub
1. Crea un nuevo repositorio en [GitHub](https://github.com/new) llamado por ejemplo `clinica-sabana-backend`.
2. Conecta y sube el código:
```bash
git remote add origin https://github.com/TU_USUARIO/clinica-sabana-backend.git
git push -u origin main
```

### Paso 3: Desplegar en Railway
1. Ve a [Railway.app](https://railway.app/) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"New Project"** -> **"Deploy from GitHub repo"**.
3. Selecciona tu repositorio `clinica-sabana-backend`.
4. Railway detectará automáticamente el archivo `package.json` y ejecutará `npm start`.
5. En la configuración de tu servicio en Railway, ve a **Settings** -> **Networking** y haz clic en **"Generate Domain"**.
6. Copia tu URL pública generada (por ejemplo: `https://clinica-sabana-backend-production.up.railway.app`).

### Paso 4: Conectar con el Frontend
Abre el archivo `www/js/config.js` en el frontend y coloca tu URL pública de Railway:
```javascript
const API_CONFIG = {
  BASE_URL: 'https://clinica-sabana-backend-production.up.railway.app/api'
};
```
¡Y listo! Tu frontend ahora consumirá todo desde tu backend en la nube.
