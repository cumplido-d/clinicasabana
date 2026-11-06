let isInitialized = false;
window.isAppOffline = false;

document.addEventListener('deviceready', onDeviceReady, false);
document.addEventListener('DOMContentLoaded', onDeviceReady, false);

function onDeviceReady() {
    if (isInitialized) return;
    isInitialized = true;

    console.log('📱 Inicializando Clínica de la Sabana App...');

    const pacienteRepo = new PacienteRepository();
    const pacienteController = new PacienteController(pacienteRepo);
    const authController = new AuthController(pacienteController);

    window.appController = pacienteController;
    window.pacienteController = pacienteController;
    window.authController = authController;
    window.pacienteRepo = pacienteRepo;

    // Configurar manejadores de ciclo de vida móvil y red
    configurarBotonAtras();
    configurarEventosRed();

    // Helper global para cambiar la URL del Backend (Railway / Localhost)
    window.configurarBackendUrl = function () {
        const actual = API_CONFIG.BASE_URL;
        const nueva = prompt(
            'Ingrese la URL base del Backend en Railway o Localhost:\n(Ej: https://web-production-64ac2.up.railway.app/api)',
            actual
        );

        if (nueva && nueva.trim() !== '' && nueva.trim() !== actual) {
            API_CONFIG.setBaseUrl(nueva.trim());
            window.mostrarAlerta(`URL de Backend actualizada a:\n${API_CONFIG.BASE_URL}\n\nLa aplicación se recargará ahora.`, 'Configuración Guardada');
            location.reload();
        }
    };

    // Actualizar visualizador de URL de Backend en la pantalla de Login y Health Check
    actualizarIndicadorBackend();
}

// ==========================================
// HELPERS NATIVOS DE DIÁLOGOS (CORDOVA DIALOGS)
// ==========================================

window.mostrarAlerta = function (mensaje, titulo = 'Clínica de la Sabana') {
    if (navigator.notification && navigator.notification.alert) {
        navigator.notification.alert(mensaje, null, titulo, 'Aceptar');
    } else {
        alert(`${titulo}:\n${mensaje}`);
    }
};

window.mostrarConfirmacion = function (mensaje, callback, titulo = 'Confirmación', botones = ['Salir', 'Cancelar']) {
    if (navigator.notification && navigator.notification.confirm) {
        navigator.notification.confirm(
            mensaje,
            function (buttonIndex) {
                // En cordova-plugin-dialogs, el primer botón tiene índice 1
                callback(buttonIndex === 1);
            },
            titulo,
            botones
        );
    } else {
        const resultado = confirm(`${titulo}\n\n${mensaje}`);
        callback(resultado);
    }
};

// ==========================================
// MANEJADOR DEL EVENTO BACKBUTTON (CICLO DE VIDA)
// ==========================================

function configurarBotonAtras() {
    document.addEventListener('backbutton', onBackButton, false);

    // Delegación global para cualquier botón "✖ Volver a la App"
    document.addEventListener('click', function (e) {
        const target = e.target;
        if (target && (target.id === 'btnVolverApp' || (target.classList && target.classList.contains('btn-close') && target.innerText && target.innerText.includes('Volver a la App')))) {
            e.preventDefault();
            if (window.appController && typeof window.appController.cerrarReporte === 'function') {
                window.appController.cerrarReporte();
            }
        }
    }, false);

    // Compatibilidad para selector document.getElementById('appContainer') referenciando el panel principal
    if (!document.getElementById('appContainer')) {
        const origGetElementById = document.getElementById.bind(document);
        document.getElementById = function (id) {
            if (id === 'appContainer') {
                return origGetElementById('appContainer') || origGetElementById('mainSection');
            }
            return origGetElementById(id);
        };
    }

    // Helper global de cierre
    window.cerrarReporte = function () {
        if (window.appController && typeof window.appController.cerrarReporte === 'function') {
            window.appController.cerrarReporte();
        }
    };
}

function onBackButton(e) {
    if (e) {
        e.preventDefault();
    }

    // 0. Si la vista de Ficha/Reporte está visible, cerrarla y regresar al dashboard principal sin salir de la app
    const reporteContainer = document.getElementById('reporteContainer');
    if (reporteContainer && (reporteContainer.style.display === 'block' || (window.getComputedStyle(reporteContainer).display !== 'none' && reporteContainer.style.display !== 'none'))) {
        if (window.appController && typeof window.appController.cerrarReporte === 'function') {
            window.appController.cerrarReporte();
        } else {
            reporteContainer.style.display = 'none';
            const dashboard = document.getElementById('appContainer') || document.getElementById('mainSection');
            if (dashboard) dashboard.style.display = 'block';
        }
        return;
    }

    // 1. Si el modal de evoluciones (#modalEvoluciones) está abierto, cerrarlo
    const modalEvoluciones = document.getElementById('modalEvoluciones');
    if (modalEvoluciones && (modalEvoluciones.style.display === 'block' || window.getComputedStyle(modalEvoluciones).display === 'block')) {
        if (window.appController && typeof window.appController.cerrarModalEvoluciones === 'function') {
            window.appController.cerrarModalEvoluciones();
        } else {
            modalEvoluciones.style.display = 'none';
        }
        return;
    }

    // 2. Si el formulario de triage está abierto en edición o sección secundaria visible, volver al listado
    const pacienteIndex = document.getElementById('pacienteIndex');
    const btnCancelar = document.getElementById('btnCancelar');
    const estaEditando = (pacienteIndex && pacienteIndex.value.trim() !== '') || (btnCancelar && btnCancelar.style.display !== 'none');
    if (estaEditando) {
        if (window.appController && typeof window.appController.limpiarFormulario === 'function') {
            window.appController.limpiarFormulario();
        }
        const listaCard = document.querySelector('.table-responsive');
        if (listaCard) {
            listaCard.scrollIntoView({ behavior: 'smooth' });
        }
        return;
    }

    // 3. Si el usuario se encuentra en el listado principal o en el login, solicitar confirmación antes de salir
    const mainSection = document.getElementById('mainSection');
    const loginSection = document.getElementById('loginSection');
    const enLogin = loginSection && (loginSection.style.display !== 'none');
    const enPrincipal = mainSection && (mainSection.style.display !== 'none');

    if (enPrincipal || enLogin) {
        const mensaje = enLogin
            ? '¿Desea salir de la aplicación Clínica de la Sabana?'
            : '¿Desea salir del Sistema Médico Clínica de la Sabana?';

        window.mostrarConfirmacion(
            mensaje,
            function (deseaSalir) {
                if (deseaSalir) {
                    if (navigator.app && navigator.app.exitApp) {
                        navigator.app.exitApp();
                    } else if (navigator.device && navigator.device.exitApp) {
                        navigator.device.exitApp();
                    } else {
                        window.close();
                    }
                }
            },
            'Confirmar Salida',
            ['Salir', 'Cancelar']
        );
    }
}

// ==========================================
// MANEJO DE RED Y ESTADO OFFLINE / ONLINE
// ==========================================

function configurarEventosRed() {
    document.addEventListener('offline', onNetworkOffline, false);
    window.addEventListener('offline', onNetworkOffline, false);

    document.addEventListener('online', onNetworkOnline, false);
    window.addEventListener('online', onNetworkOnline, false);

    // Verificación inicial si ya no hay red
    if (navigator.connection && typeof Connection !== 'undefined' && navigator.connection.type === Connection.NONE) {
        onNetworkOffline();
    }
}

function onNetworkOffline() {
    window.isAppOffline = true;
    console.warn('⚠️ Se ha perdido la conexión a internet. Activando modo local.');

    // Banner flotante visible
    const banner = document.getElementById('offlineBanner');
    if (banner) {
        banner.className = 'banner-offline';
        banner.innerHTML = '⚠️ Sin conexión a internet - Operando en modo local';
        banner.style.display = 'block';
    }

    // Badge en cabecera
    const badge = document.getElementById('backendBadge');
    if (badge) {
        badge.innerText = '🔴 Modo Local (Offline)';
        badge.style.background = '#fee2e2';
        badge.style.color = '#b91c1c';
    }

    // Deshabilitar envíos remotos para proteger la integridad
    const btnGuardar = document.getElementById('btnGuardar');
    if (btnGuardar) {
        btnGuardar.disabled = true;
        btnGuardar.title = 'Deshabilitado: sin conexión al servidor Railway';
    }

    const evoSubmit = document.querySelector('#evoForm button[type="submit"]');
    if (evoSubmit) {
        evoSubmit.disabled = true;
        evoSubmit.title = 'Deshabilitado: sin conexión al servidor Railway';
    }

    window.mostrarAlerta(
        'Sin conexión a internet - Operando en modo local.\n\nLos registros en caché permanecen disponibles para consulta. Las funciones de guardado remoto se han pausado temporalmente para proteger la integridad de los datos.',
        'Estado de Conexión'
    );
}

function onNetworkOnline() {
    window.isAppOffline = false;
    console.log('🟢 Conexión restablecida con el servidor.');

    // Banner flotante visible de restablecimiento
    const banner = document.getElementById('offlineBanner');
    if (banner) {
        banner.className = 'banner-online';
        banner.innerHTML = '🟢 Conexión restablecida - Sincronizando datos con Railway...';
        banner.style.display = 'block';
        setTimeout(() => {
            if (!window.isAppOffline) {
                banner.style.display = 'none';
                banner.className = '';
            }
        }, 3500);
    }

    // Habilitar envíos remotos
    const btnGuardar = document.getElementById('btnGuardar');
    if (btnGuardar) {
        btnGuardar.disabled = false;
        btnGuardar.title = '';
    }

    const evoSubmit = document.querySelector('#evoForm button[type="submit"]');
    if (evoSubmit) {
        evoSubmit.disabled = false;
        evoSubmit.title = '';
    }

    // Actualizar estado del backend y resincronizar datos
    actualizarIndicadorBackend();
    if (window.appController && typeof window.appController.mostrarPacientes === 'function') {
        window.appController.mostrarPacientes();
    }
}

// ==========================================
// MONITOR DE ESTADO DE RAILWAY
// ==========================================

async function actualizarIndicadorBackend() {
    const urlDisplay = document.getElementById('backendUrlDisplay');
    const badge = document.getElementById('backendBadge');

    if (urlDisplay) {
        urlDisplay.innerText = API_CONFIG.BASE_URL;
    }

    if (window.isAppOffline) {
        if (badge) {
            badge.innerText = '🔴 Modo Local (Offline)';
            badge.style.background = '#fee2e2';
            badge.style.color = '#b91c1c';
        }
        return;
    }

    try {
        const resp = await fetch(`${API_CONFIG.BASE_URL.replace(/\/$/, '')}/health`, {
            method: 'GET'
        });
        if (resp.ok) {
            if (badge) {
                badge.innerText = '🟢 Backend Conectado';
                badge.style.background = '#dcfce7';
                badge.style.color = '#15803d';
            }
        } else {
            throw new Error(`HTTP ${resp.status}`);
        }
    } catch (e) {
        if (badge) {
            badge.innerText = '🔴 Backend Offline';
            badge.style.background = '#fee2e2';
            badge.style.color = '#b91c1c';
        }
    }
}
