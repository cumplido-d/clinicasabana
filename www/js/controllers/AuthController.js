class AuthController {
    constructor(pacienteController) {
        this.pacienteController = pacienteController;
        this.rolUsuario = '';
        this.initEvents();
        this.verificarSesionExistente();
    }

    initEvents() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
        }
    }

    verificarSesionExistente() {
        const token = sessionStorage.getItem('token');
        const userJson = sessionStorage.getItem('user');
        if (token && userJson) {
            try {
                const user = JSON.parse(userJson);
                this.rolUsuario = user.role || 'consulta';
                const tituloRol = this.rolUsuario === 'admin'
                    ? 'Administrador (Acceso Total)'
                    : 'Solo Consulta (Lectura e Impresión)';
                this.iniciarSesionUI(tituloRol);
            } catch (e) {
                this.cerrarSesion();
            }
        }
    }

    async login() {
        const user = document.getElementById('userInput').value.trim().toLowerCase();
        const pass = document.getElementById('passInput').value;
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');

        if (!user || !pass) {
            if (typeof window.mostrarAlerta === 'function') {
                window.mostrarAlerta('Por favor ingrese usuario y contraseña.', 'Acceso Requerido');
            } else {
                alert('Por favor ingrese usuario y contraseña.');
            }
            return;
        }

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = 'Autenticando...';
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: user,
                    password: pass
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('user', JSON.stringify(data.user));
                this.rolUsuario = data.user.role;

                const tituloRol = this.rolUsuario === 'admin' 
                    ? 'Administrador (Acceso Total)' 
                    : 'Solo Consulta (Lectura e Impresión)';

                this.iniciarSesionUI(tituloRol);
            } else {
                const msg = data.message || 'Usuario o contraseña incorrectos';
                if (typeof window.mostrarAlerta === 'function') {
                    window.mostrarAlerta(msg, 'Error de Autenticación');
                } else {
                    alert(msg);
                }
            }
        } catch (error) {
            console.error('Error al conectar con el backend:', error);
            const msg = `⚠️ No se pudo conectar con el servidor backend:\n${API_CONFIG.BASE_URL}\n\nAsegúrate de que el backend esté encendido (ejecutando "npm start" localmente o activo en Railway).\n\nPuedes cambiar la URL del backend con el botón "Configurar Backend" en la pantalla de inicio.`;
            if (typeof window.mostrarAlerta === 'function') {
                window.mostrarAlerta(msg, 'Error de Conexión');
            } else {
                alert(msg);
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Iniciar Sesión';
            }
        }
    }

    iniciarSesionUI(nombreRol) {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('mainSection').style.display = 'block';
        document.getElementById('userBadge').innerText = nombreRol;

        this.pacienteController.setRolUsuario(this.rolUsuario);

        if (this.rolUsuario === 'consulta') {
            document.getElementById('formSection').style.display = 'none';
            document.getElementById('formEvolucionContainer').style.display = 'none';
        } else {
            document.getElementById('formSection').style.display = 'block';
            document.getElementById('formEvolucionContainer').style.display = 'block';
        }

        this.pacienteController.mostrarPacientes();
    }

    cerrarSesion() {
        this.rolUsuario = '';
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        document.getElementById('loginForm').reset();
        document.getElementById('mainSection').style.display = 'none';
        const reporteContainer = document.getElementById('reporteContainer');
        if (reporteContainer) {
            reporteContainer.style.display = 'none';
        }
        document.getElementById('loginSection').style.display = 'block';
    }
}