class PacienteController {
    constructor(repository) {
        this.repository = repository;
        this.rolUsuario = '';
        this.initEvents();
    }

    setRolUsuario(rol) {
        this.rolUsuario = rol;
    }

    initEvents() {
        const pacienteForm = document.getElementById('pacienteForm');
        if (pacienteForm) {
            pacienteForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarPaciente();
            });
        }

        const evoForm = document.getElementById('evoForm');
        if (evoForm) {
            evoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarEvolucion();
            });
        }

        const buscarInput = document.getElementById('buscarInput');
        if (buscarInput) {
            buscarInput.addEventListener('keyup', () => {
                this.filtrarPacientes();
            });
        }

        // Limpieza automática de errores al escribir
        const camposMonitoreados = [
            ['fechaNacimiento', 'fechaNacimientoError'],
            ['regPA', 'regPAError'],
            ['regFC', 'regFCError'],
            ['regTemp', 'regTempError'],
            ['regSpO2', 'regSpO2Error'],
            ['evoPA', 'evoPAError'],
            ['evoFC', 'evoFCError'],
            ['evoTemp', 'evoTempError'],
            ['evoSpO2', 'evoSpO2Error']
        ];
        camposMonitoreados.forEach(([inpId, errId]) => {
            const el = document.getElementById(inpId);
            if (el) {
                el.addEventListener('input', () => this.limpiarErrorCampo(inpId, errId));
            }
        });
    }

    // ==========================================
    // VALIDACIONES CLÍNICAS Y FORMATOS
    // ==========================================

    mostrarErrorCampo(inputId, errorId, mensaje) {
        const input = document.getElementById(inputId);
        const errorEl = document.getElementById(errorId);
        if (input) {
            input.classList.add('input-error');
            input.focus();
        }
        if (errorEl) {
            errorEl.innerText = `⚠️ ${mensaje}`;
            errorEl.style.display = 'block';
        }
    }

    limpiarErrorCampo(inputId, errorId) {
        const input = document.getElementById(inputId);
        const errorEl = document.getElementById(errorId);
        if (input) {
            input.classList.remove('input-error');
        }
        if (errorEl) {
            errorEl.innerText = '';
            errorEl.style.display = 'none';
        }
    }

    validarFechaNacimiento(fechaStr) {
        if (!fechaStr || fechaStr.trim() === '') {
            return { valido: false, mensaje: 'La fecha de nacimiento es obligatoria.' };
        }

        const clean = fechaStr.trim();
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(clean)) {
            return { valido: false, mensaje: 'Formato de fecha inválido. Debe ser AAAA-MM-DD (ej: 1986-05-14).' };
        }

        const partes = clean.split('-').map(Number);
        const anio = partes[0];
        const mes = partes[1];
        const dia = partes[2];

        if (anio < 1900) {
            return { valido: false, mensaje: 'El año de nacimiento debe ser mayor a 1900.' };
        }
        if (mes < 1 || mes > 12) {
            return { valido: false, mensaje: 'El mes debe estar entre 01 y 12.' };
        }

        const dateObj = new Date(anio, mes - 1, dia);
        if (
            dateObj.getFullYear() !== anio ||
            dateObj.getMonth() !== (mes - 1) ||
            dateObj.getDate() !== dia
        ) {
            return { valido: false, mensaje: 'La fecha no corresponde a un día válido en el calendario (revise días del mes o año bisiesto).' };
        }

        const hoy = new Date();
        hoy.setHours(23, 59, 59, 999);
        if (dateObj > hoy) {
            return { valido: false, mensaje: 'La fecha de nacimiento no puede ser una fecha futura.' };
        }

        return { valido: true, valor: clean };
    }

    validarPresionArterial(paStr) {
        if (!paStr || paStr.trim() === '' || paStr.trim().toUpperCase() === 'N/R') {
            return { valido: true, valor: 'N/R' };
        }

        const clean = paStr.trim();
        const match = clean.match(/^\s*(\d{2,3})\s*\/\s*(\d{2,3})\s*$/);
        if (!match) {
            return { valido: false, mensaje: 'Presión Arterial (PA) inválida. Use formato Sistólica/Diastólica (ej: 120/80).' };
        }

        const sis = parseInt(match[1], 10);
        const dia = parseInt(match[2], 10);

        if (sis < 50 || sis > 260) {
            return { valido: false, mensaje: `Presión Sistólica (${sis} mmHg) fuera de rango fisiológico (50 a 260 mmHg).` };
        }
        if (dia < 30 || dia > 160) {
            return { valido: false, mensaje: `Presión Diastólica (${dia} mmHg) fuera de rango fisiológico (30 a 160 mmHg).` };
        }
        if (sis <= dia) {
            return { valido: false, mensaje: 'La presión sistólica debe ser numéricamente mayor a la diastólica.' };
        }

        return { valido: true, valor: `${sis}/${dia}` };
    }

    validarFrecuenciaCardiaca(fcStr) {
        if (!fcStr || fcStr.trim() === '' || fcStr.trim().toUpperCase() === 'N/R') {
            return { valido: true, valor: 'N/R' };
        }

        const clean = fcStr.trim();
        const match = clean.match(/^\s*(\d{1,3})\s*(?:lpm|bpm)?\s*$/i);
        if (!match) {
            return { valido: false, mensaje: 'Frecuencia Cardíaca (FC) inválida. Ingrese un valor numérico en lpm (ej: 80).' };
        }

        const num = parseInt(match[1], 10);
        if (num < 30 || num > 220) {
            return { valido: false, mensaje: `Frecuencia Cardíaca (${num} lpm) fuera de rango fisiológico real (30 a 220 lpm).` };
        }

        return { valido: true, valor: `${num} lpm` };
    }

    validarTemperatura(tempStr) {
        if (!tempStr || tempStr.trim() === '' || tempStr.trim().toUpperCase() === 'N/R') {
            return { valido: true, valor: 'N/R' };
        }

        const clean = tempStr.trim().replace(',', '.');
        const match = clean.match(/^\s*(\d{2}(?:\.\d{1,2})?)\s*(?:°\s*C|C)?\s*$/i);
        if (!match) {
            return { valido: false, mensaje: 'Temperatura inválida. Ingrese un valor numérico decimal (ej: 36.5).' };
        }

        const num = parseFloat(match[1]);
        if (num < 34.0 || num > 43.0) {
            return { valido: false, mensaje: `Temperatura (${num.toFixed(1)} °C) fuera de rango fisiológico real (34.0 °C a 43.0 °C).` };
        }

        return { valido: true, valor: `${num.toFixed(1)} °C` };
    }

    validarSaturacionOxigeno(spO2Str) {
        if (!spO2Str || spO2Str.trim() === '' || spO2Str.trim().toUpperCase() === 'N/R') {
            return { valido: true, valor: 'N/R' };
        }

        const clean = spO2Str.trim();
        const match = clean.match(/^\s*(\d{1,3}(?:\.\d{1,2})?)\s*%?\s*$/);
        if (!match) {
            return { valido: false, mensaje: 'Saturación de Oxígeno (SpO2) inválida. Ingrese un porcentaje (ej: 98%).' };
        }

        const num = parseFloat(match[1]);
        if (num < 50 || num > 100) {
            return { valido: false, mensaje: `Saturación de Oxígeno (${num}%) fuera de rango fisiológico real (50% a 100%).` };
        }

        return { valido: true, valor: `${Math.round(num)}%` };
    }

    // ==========================================
    // OPERACIONES DE PACIENTES
    // ==========================================

    async guardarPaciente() {
        if (window.isAppOffline) {
            const aviso = 'La aplicación está operando en modo local (sin conexión a internet). Los envíos remotos están deshabilitados para proteger la integridad.';
            if (typeof window.mostrarAlerta === 'function') {
                window.mostrarAlerta(aviso, 'Modo Local');
            } else {
                alert(aviso);
            }
            return;
        }

        const idInput = document.getElementById('pacienteIndex').value;
        const id = (idInput && idInput.trim() !== '') ? idInput.trim() : null;

        // 1. Validación estricta de fecha de nacimiento
        const inputFecha = document.getElementById('fechaNacimiento');
        const resFecha = this.validarFechaNacimiento(inputFecha ? inputFecha.value : '');
        if (!resFecha.valido) {
            this.mostrarErrorCampo('fechaNacimiento', 'fechaNacimientoError', resFecha.mensaje);
            if (typeof window.mostrarAlerta === 'function') {
                window.mostrarAlerta(resFecha.mensaje, 'Validación Clínica');
            } else {
                alert(resFecha.mensaje);
            }
            return;
        }
        this.limpiarErrorCampo('fechaNacimiento', 'fechaNacimientoError');

        // 2. Validación de signos vitales de ingreso si fueron diligenciados
        let signosIngreso = [];
        const regPA = document.getElementById('regPA');
        if (regPA && regPA.value.trim() !== '') {
            const v = this.validarPresionArterial(regPA.value);
            if (!v.valido) {
                this.mostrarErrorCampo('regPA', 'regPAError', v.mensaje);
                if (typeof window.mostrarAlerta === 'function') window.mostrarAlerta(v.mensaje, 'Signo Vital Fuera de Rango');
                return;
            }
            this.limpiarErrorCampo('regPA', 'regPAError');
            signosIngreso.push(`PA: ${v.valor}`);
        }

        const regFC = document.getElementById('regFC');
        if (regFC && regFC.value.trim() !== '') {
            const v = this.validarFrecuenciaCardiaca(regFC.value);
            if (!v.valido) {
                this.mostrarErrorCampo('regFC', 'regFCError', v.mensaje);
                if (typeof window.mostrarAlerta === 'function') window.mostrarAlerta(v.mensaje, 'Signo Vital Fuera de Rango');
                return;
            }
            this.limpiarErrorCampo('regFC', 'regFCError');
            signosIngreso.push(`FC: ${v.valor}`);
        }

        const regTemp = document.getElementById('regTemp');
        if (regTemp && regTemp.value.trim() !== '') {
            const v = this.validarTemperatura(regTemp.value);
            if (!v.valido) {
                this.mostrarErrorCampo('regTemp', 'regTempError', v.mensaje);
                if (typeof window.mostrarAlerta === 'function') window.mostrarAlerta(v.mensaje, 'Signo Vital Fuera de Rango');
                return;
            }
            this.limpiarErrorCampo('regTemp', 'regTempError');
            signosIngreso.push(`T°: ${v.valor}`);
        }

        const regSpO2 = document.getElementById('regSpO2');
        if (regSpO2 && regSpO2.value.trim() !== '') {
            const v = this.validarSaturacionOxigeno(regSpO2.value);
            if (!v.valido) {
                this.mostrarErrorCampo('regSpO2', 'regSpO2Error', v.mensaje);
                if (typeof window.mostrarAlerta === 'function') window.mostrarAlerta(v.mensaje, 'Signo Vital Fuera de Rango');
                return;
            }
            this.limpiarErrorCampo('regSpO2', 'regSpO2Error');
            signosIngreso.push(`SpO2: ${v.valor}`);
        }

        let diagnosticoTexto = document.getElementById('diagnostico').value.trim();
        if (signosIngreso.length > 0 && !diagnosticoTexto.includes('[Signos Vitales de Ingreso:')) {
            diagnosticoTexto += `\n[Signos Vitales de Ingreso: ${signosIngreso.join(' | ')}]`;
        }

        const btnGuardar = document.getElementById('btnGuardar');
        const textoOriginal = btnGuardar ? btnGuardar.innerText : 'Guardar';

        const pacienteData = {
            nombre: document.getElementById('nombre').value.trim(),
            tipoDoc: document.getElementById('tipoDoc').value,
            documento: document.getElementById('documento').value.trim(),
            fechaNacimiento: resFecha.valor,
            telefono: document.getElementById('telefono').value.trim(),
            eps: document.getElementById('eps').value,
            regimen: document.getElementById('regimen').value,
            triage: document.getElementById('triage').value,
            estado: document.getElementById('estado').value,
            diagnostico: diagnosticoTexto
        };

        try {
            if (btnGuardar) {
                btnGuardar.disabled = true;
                btnGuardar.innerText = 'Guardando en Backend...';
            }

            await this.repository.guardar(pacienteData, id);
            this.limpiarFormulario();
            await this.mostrarPacientes();
        } catch (error) {
            console.error('Error al guardar paciente:', error);
            if (typeof window.mostrarAlerta === 'function') {
                window.mostrarAlerta(`Error al guardar en el servidor: ${error.message}`, 'Error de Comunicación');
            } else {
                alert(`Error al guardar en el servidor: ${error.message}`);
            }
        } finally {
            if (btnGuardar) {
                btnGuardar.disabled = false;
                btnGuardar.innerText = textoOriginal;
            }
        }
    }

    async mostrarPacientes() {
        const tbody = document.getElementById('listaPacientes');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 20px; color: #64748b;">⏳ Cargando pacientes desde el backend...</td></tr>`;

        try {
            const pacientes = await this.repository.obtenerTodos();
            tbody.innerHTML = '';

            const pacientesValidos = pacientes.filter(p => (p.nombre && p.nombre.trim() !== '') || (p.documento && p.documento.trim() !== ''));

            if (pacientesValidos.length === 0) {
                tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 20px; color: #94a3b8;">No hay registros cargados en el sistema</td></tr>`;
                return;
            }

            pacientesValidos.forEach((p) => {
                let badgeClass = 'badge-activo';
                if (p.estado === 'En tratamiento') badgeClass = 'badge-tratamiento';
                if (p.estado === 'Dado de alta') badgeClass = 'badge-alta';

                let triageColor = '#eab308';
                if (p.triage && p.triage.includes('Rojo')) triageColor = '#ef4444';
                if (p.triage && p.triage.includes('Naranja')) triageColor = '#f97316';
                if (p.triage && p.triage.includes('Verde')) triageColor = '#22c55e';

                let botonesAccion = '';
                if (this.rolUsuario === 'admin') {
                    botonesAccion = `
                        <button class="btn-edit" onclick="window.appController.cargarParaEditar('${p.id}')">Editar</button>
                        <button class="btn-delete" onclick="window.appController.eliminarPaciente('${p.id}')">Eliminar</button>
                    `;
                }

                const numEvoluciones = p.evoluciones ? p.evoluciones.length : 0;
                botonesAccion += `
                    <button class="btn-evo" onclick="window.appController.abrirModalEvoluciones('${p.id}')">📝 Evoluciones (${numEvoluciones})</button>
                    <button class="btn-view-print" onclick="window.appController.imprimirFicha('${p.id}')">📄 Ficha</button>
                `;

                tbody.innerHTML += `
                    <tr data-id="${p.id}">
                        <td><strong>${p.tipoDoc}:</strong> ${p.documento}</td>
                        <td>${p.nombre}</td>
                        <td>${p.calcularEdad()}</td>
                        <td>${p.telefono}</td>
                        <td>${p.eps}<br><small style="color:#64748b;">${p.regimen}</small></td>
                        <td><span style="background-color: ${triageColor}; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">${p.triage || 'Triage III (Amarillo)'}</span></td>
                        <td><span class="badge ${badgeClass}">${p.estado}</span></td>
                        <td>${p.diagnostico}</td>
                        <td class="no-print" style="white-space:nowrap;">${botonesAccion}</td>
                    </tr>
                `;
            });
        } catch (error) {
            console.error('Error al mostrar pacientes:', error);
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 20px; color: #ef4444;">❌ Error al conectar con el backend (${API_CONFIG.BASE_URL})</td></tr>`;
        }
    }

    async cargarParaEditar(id) {
        try {
            const p = await this.repository.obtenerPorId(id);
            if (!p) {
                if (typeof window.mostrarAlerta === 'function') {
                    window.mostrarAlerta('No se encontró el paciente en el sistema.', 'Aviso');
                } else {
                    alert('No se encontró el paciente en el sistema.');
                }
                return;
            }

            document.getElementById('pacienteIndex').value = p.id;
            document.getElementById('nombre').value = p.nombre;
            document.getElementById('tipoDoc').value = p.tipoDoc;
            document.getElementById('documento').value = p.documento;
            document.getElementById('fechaNacimiento').value = p.fechaNacimiento;
            document.getElementById('telefono').value = p.telefono;
            document.getElementById('eps').value = p.eps;
            document.getElementById('regimen').value = p.regimen;
            document.getElementById('triage').value = p.triage || 'Triage III (Amarillo)';
            document.getElementById('estado').value = p.estado;
            document.getElementById('diagnostico').value = p.diagnostico;

            this.limpiarErrorCampo('fechaNacimiento', 'fechaNacimientoError');

            document.getElementById('formTitulo').innerText = 'Editar Registro del Paciente';
            document.getElementById('btnGuardar').innerText = 'Actualizar Registro';
            document.getElementById('btnCancelar').style.display = 'block';

            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Error al cargar paciente para edición:', error);
            if (typeof window.mostrarAlerta === 'function') {
                window.mostrarAlerta('No se pudo cargar la información del paciente.', 'Error');
            } else {
                alert('No se pudo cargar la información del paciente.');
            }
        }
    }

    async eliminarPaciente(id) {
        const confirmarEliminacion = async () => {
            try {
                await this.repository.eliminar(id);
                await this.mostrarPacientes();
            } catch (error) {
                console.error('Error al eliminar paciente:', error);
                if (typeof window.mostrarAlerta === 'function') {
                    window.mostrarAlerta(`Error al eliminar: ${error.message}`, 'Error');
                } else {
                    alert(`Error al eliminar: ${error.message}`);
                }
            }
        };

        if (typeof window.mostrarConfirmacion === 'function') {
            window.mostrarConfirmacion(
                '¿Desea eliminar permanentemente este paciente del backend?',
                (confirmado) => {
                    if (confirmado) confirmarEliminacion();
                },
                'Confirmar Eliminación',
                ['Eliminar', 'Cancelar']
            );
        } else {
            if (confirm('¿Desea eliminar permanentemente este paciente del backend?')) {
                confirmarEliminacion();
            }
        }
    }

    filtrarPacientes() {
        const busqueda = document.getElementById('buscarInput').value.toLowerCase();
        const filas = document.querySelectorAll('#listaPacientes tr');

        filas.forEach(fila => {
            const texto = fila.innerText.toLowerCase();
            fila.style.display = texto.includes(busqueda) ? '' : 'none';
        });
    }

    // ==========================================
    // OPERACIONES DE EVOLUCIONES
    // ==========================================

    async abrirModalEvoluciones(id) {
        try {
            const p = await this.repository.obtenerPorId(id);
            if (!p) {
                if (typeof window.mostrarAlerta === 'function') {
                    window.mostrarAlerta('No se encontró el paciente para cargar evoluciones.', 'Aviso');
                } else {
                    alert('No se encontró el paciente para cargar evoluciones.');
                }
                return;
            }

            document.getElementById('evoPacienteIndex').value = p.id;
            document.getElementById('modalPacienteNombre').innerText = `Evoluciones Médicas: ${p.nombre} (${p.tipoDoc} ${p.documento})`;
            document.getElementById('txtDiagIngreso').innerText = p.diagnostico;

            this.limpiarErrorCampo('evoPA', 'evoPAError');
            this.limpiarErrorCampo('evoFC', 'evoFCError');
            this.limpiarErrorCampo('evoTemp', 'evoTempError');
            this.limpiarErrorCampo('evoSpO2', 'evoSpO2Error');

            this.renderizarListaEvoluciones(p.evoluciones || []);
            document.getElementById('modalEvoluciones').style.display = 'block';
        } catch (error) {
            console.error('Error al abrir modal de evoluciones:', error);
            if (typeof window.mostrarAlerta === 'function') {
                window.mostrarAlerta('Error al obtener datos del paciente.', 'Error');
            } else {
                alert('Error al obtener datos del paciente.');
            }
        }
    }

    cerrarModalEvoluciones() {
        document.getElementById('modalEvoluciones').style.display = 'none';
        document.getElementById('evoForm').reset();
        this.limpiarErrorCampo('evoPA', 'evoPAError');
        this.limpiarErrorCampo('evoFC', 'evoFCError');
        this.limpiarErrorCampo('evoTemp', 'evoTempError');
        this.limpiarErrorCampo('evoSpO2', 'evoSpO2Error');
    }

    async guardarEvolucion() {
        if (window.isAppOffline) {
            const aviso = 'La aplicación está operando en modo local (sin conexión a internet). No es posible enviar nuevas evoluciones al servidor en este momento.';
            if (typeof window.mostrarAlerta === 'function') {
                window.mostrarAlerta(aviso, 'Modo Local');
            } else {
                alert(aviso);
            }
            return;
        }

        const id = document.getElementById('evoPacienteIndex').value;
        const notaTexto = document.getElementById('evoNota').value.trim();

        if (!notaTexto) {
            if (typeof window.mostrarAlerta === 'function') {
                window.mostrarAlerta('Por favor ingrese el texto de la evolución médica.', 'Campo Requerido');
            } else {
                alert('Por favor ingrese el texto de la evolución médica.');
            }
            return;
        }

        // 1. Validar Presión Arterial (PA)
        const paInput = document.getElementById('evoPA');
        const paVal = this.validarPresionArterial(paInput ? paInput.value : '');
        if (!paVal.valido) {
            this.mostrarErrorCampo('evoPA', 'evoPAError', paVal.mensaje);
            if (typeof window.mostrarAlerta === 'function') window.mostrarAlerta(paVal.mensaje, 'Signo Vital Fuera de Rango');
            return;
        }
        this.limpiarErrorCampo('evoPA', 'evoPAError');

        // 2. Validar Frecuencia Cardíaca (FC)
        const fcInput = document.getElementById('evoFC');
        const fcVal = this.validarFrecuenciaCardiaca(fcInput ? fcInput.value : '');
        if (!fcVal.valido) {
            this.mostrarErrorCampo('evoFC', 'evoFCError', fcVal.mensaje);
            if (typeof window.mostrarAlerta === 'function') window.mostrarAlerta(fcVal.mensaje, 'Signo Vital Fuera de Rango');
            return;
        }
        this.limpiarErrorCampo('evoFC', 'evoFCError');

        // 3. Validar Temperatura (T°)
        const tempInput = document.getElementById('evoTemp');
        const tempVal = this.validarTemperatura(tempInput ? tempInput.value : '');
        if (!tempVal.valido) {
            this.mostrarErrorCampo('evoTemp', 'evoTempError', tempVal.mensaje);
            if (typeof window.mostrarAlerta === 'function') window.mostrarAlerta(tempVal.mensaje, 'Signo Vital Fuera de Rango');
            return;
        }
        this.limpiarErrorCampo('evoTemp', 'evoTempError');

        // 4. Validar Saturación de Oxígeno (SpO2)
        const spO2Input = document.getElementById('evoSpO2');
        const spO2Val = this.validarSaturacionOxigeno(spO2Input ? spO2Input.value : '');
        if (!spO2Val.valido) {
            this.mostrarErrorCampo('evoSpO2', 'evoSpO2Error', spO2Val.mensaje);
            if (typeof window.mostrarAlerta === 'function') window.mostrarAlerta(spO2Val.mensaje, 'Signo Vital Fuera de Rango');
            return;
        }
        this.limpiarErrorCampo('evoSpO2', 'evoSpO2Error');

        const nuevaEvo = {
            fechaHora: new Date().toLocaleString('es-CO'),
            especialidad: document.getElementById('evoEspecialidad').value,
            profesional: document.getElementById('evoProfesional').value.trim(),
            pa: paVal.valor,
            fc: fcVal.valor,
            temp: tempVal.valor,
            spO2: spO2Val.valor,
            nota: notaTexto
        };

        const submitBtn = document.querySelector('#evoForm button[type="submit"]');

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = 'Guardando en Backend...';
            }

            await this.repository.agregarEvolucion(id, nuevaEvo);
            
            document.getElementById('evoPA').value = '';
            document.getElementById('evoFC').value = '';
            document.getElementById('evoTemp').value = '';
            document.getElementById('evoSpO2').value = '';
            document.getElementById('evoNota').value = '';
            document.getElementById('evoForm').reset();

            const pActualizado = await this.repository.obtenerPorId(id);
            if (pActualizado) {
                this.renderizarListaEvoluciones(pActualizado.evoluciones || []);
            }
            await this.mostrarPacientes();
        } catch (error) {
            console.error('Error al guardar evolución:', error);
            if (typeof window.mostrarAlerta === 'function') {
                window.mostrarAlerta(`Error al registrar evolución: ${error.message}`, 'Error');
            } else {
                alert(`Error al registrar evolución: ${error.message}`);
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Guardar Evolución';
            }
        }
    }

    renderizarListaEvoluciones(evoluciones) {
        const container = document.getElementById('historialEvoluciones');
        container.innerHTML = '';

        if (!evoluciones || evoluciones.length === 0) {
            container.innerHTML = '<p style="color: #94a3b8; text-align: center;">No hay evoluciones registradas para este paciente.</p>';
            return;
        }

        evoluciones.forEach(evo => {
            const signos = (evo.pa && evo.pa !== 'N/R') || (evo.fc && evo.fc !== 'N/R') || (evo.temp && evo.temp !== 'N/R') || (evo.spO2 && evo.spO2 !== 'N/R')
                ? `<div style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-size: 11px; margin: 5px 0; color: #334155;">
                    <strong>Signos Vitales:</strong> PA: ${evo.pa || 'N/R'} | FC: ${evo.fc || 'N/R'} | T°: ${evo.temp || 'N/R'} | SpO2: ${evo.spO2 || 'N/R'}
                   </div>`
                : '';

            container.innerHTML += `
                <div class="evo-item">
                    <div class="evo-header">
                        📅 ${evo.fechaHora} | 🩺 <strong>${evo.especialidad}</strong> - ${evo.profesional}
                    </div>
                    ${signos}
                    <div style="font-size: 13px; color: #1e293b; white-space: pre-line;">${evo.nota}</div>
                </div>
            `;
        });
    }

    mostrarVistaReporte(html) {
        // 1. Cerrar el modal de evoluciones si estuviera abierto
        const modalEvoluciones = document.getElementById('modalEvoluciones');
        if (modalEvoluciones) {
            modalEvoluciones.style.display = 'none';
        }

        // 2. Ocultar el contenedor principal del dashboard (#appContainer o #mainSection)
        const appContainer = document.getElementById('appContainer') || document.getElementById('mainSection');
        if (appContainer) {
            appContainer.style.display = 'none';
        }

        // 3. Inyectar contenido y mostrar de inmediato el contenedor de ficha/reporte
        const reporteContainer = document.getElementById('reporteContainer');
        const reporteContenido = document.getElementById('reporteContenido');
        if (reporteContainer && reporteContenido) {
            reporteContenido.innerHTML = html;
            reporteContainer.style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    cerrarReporte() {
        // 1. Ocultar de inmediato el contenedor del reporte/ficha y limpiar contenido
        const reporteContainer = document.getElementById('reporteContainer');
        if (reporteContainer) {
            reporteContainer.style.display = 'none';
        }

        const reporteContenido = document.getElementById('reporteContenido');
        if (reporteContenido) {
            reporteContenido.innerHTML = '';
        }

        // 2. Volver a mostrar el contenedor principal del dashboard de forma limpia sin recargar
        const appContainer = document.getElementById('appContainer') || document.getElementById('mainSection');
        if (appContainer) {
            appContainer.style.display = 'block';
        }

        // 3. Garantizar que el modal de evoluciones permanezca cerrado
        const modalEvoluciones = document.getElementById('modalEvoluciones');
        if (modalEvoluciones) {
            modalEvoluciones.style.display = 'none';
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    ejecutarImpresion() {
        try {
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.printer) {
                // Extrae el contenido de #reporteContenido
                const contenido = document.getElementById('reporteContenido') 
                    ? document.getElementById('reporteContenido').innerHTML 
                    : document.body.innerHTML;
                const plantillaEstilos = `
       <style>
         @page { size: letter; margin: 15mm; }
         body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a202c; font-size: 13px; line-height: 1.5; margin: 0; padding: 10px; }
         .no-print-bar { display: none !important; }
         h2 { color: #1e3a8a; font-size: 20px; border-bottom: 2px solid #1e3a8a; padding-bottom: 6px; margin-bottom: 12px; }
         h3 { color: #1e40af; font-size: 15px; margin-top: 14px; margin-bottom: 6px; }
         table { width: 100%; border-collapse: collapse; margin-top: 10px; }
         th { background-color: #1e3a8a; color: white; padding: 8px; text-align: left; font-size: 12px; }
         td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; }
         .reporte-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-top: 10px; }
       </style>
     `;
                const htmlCompleto = `<!DOCTYPE html><html><head><meta charset="utf-8">${plantillaEstilos}</head><body>${contenido}</body></html>`;
                cordova.plugins.printer.print(htmlCompleto, { name: 'Clinica_de_la_Sabana_Doc' });
            } else if (typeof window.print === 'function') {
                // Ejecución asíncrona segura para no bloquear el hilo de eventos de WebView en Android
                setTimeout(() => {
                    try {
                        window.print();
                    } catch (errPrint) {
                        console.warn('Fallo al invocar window.print():', errPrint);
                        this.notificarFalloImpresion(errPrint);
                    }
                }, 50);
            } else {
                this.notificarFalloImpresion(new Error('window.print no disponible en este dispositivo'));
            }
        } catch (e) {
            console.error('Error al capturar impresión:', e);
            this.notificarFalloImpresion(e);
        }
    }

    imprimirListaGeneral() {
        try {
            // Extraer directamente la tabla de pacientes con sus encabezados y filas actuales
            const tableElem = document.querySelector('.table-responsive table');
            let tablaHtml = '';
            if (tableElem) {
                const clone = tableElem.cloneNode(true);
                // Remover columnas y botones de acción no imprimibles
                clone.querySelectorAll('.no-print').forEach(el => el.remove());
                tablaHtml = clone.outerHTML;
            } else {
                const tbody = document.getElementById('listaPacientes');
                tablaHtml = `<table><thead><tr><th>Documento</th><th>Nombre</th><th>Edad</th><th>Contacto</th><th>EPS / Régimen</th><th>Triage</th><th>Estado</th><th>Diagnóstico Inicial</th></tr></thead><tbody>${tbody ? tbody.innerHTML : ''}</tbody></table>`;
            }

            const contenido = `
                <h2>CLÍNICA DE LA SABANA</h2>
                <p style="color: #64748b; font-size: 13px; margin-top: -6px; margin-bottom: 14px;">Listado General de Pacientes Registrados</p>
                ${tablaHtml}
            `;

            const plantillaEstilos = `
       <style>
         @page { size: letter; margin: 15mm; }
         body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a202c; font-size: 13px; line-height: 1.5; margin: 0; padding: 10px; }
         .no-print-bar { display: none !important; }
         .no-print { display: none !important; }
         h2 { color: #1e3a8a; font-size: 20px; border-bottom: 2px solid #1e3a8a; padding-bottom: 6px; margin-bottom: 12px; }
         h3 { color: #1e40af; font-size: 15px; margin-top: 14px; margin-bottom: 6px; }
         table { width: 100%; border-collapse: collapse; margin-top: 10px; }
         th { background-color: #1e3a8a; color: white; padding: 8px; text-align: left; font-size: 12px; }
         td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; }
         .reporte-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-top: 10px; }
         .btn-edit, .btn-delete, .btn-view-print, .btn-evo { display: none !important; }
       </style>
     `;
            const htmlCompleto = `<!DOCTYPE html><html><head><meta charset="utf-8">${plantillaEstilos}</head><body>${contenido}</body></html>`;

            if (window.cordova && window.cordova.plugins && window.cordova.plugins.printer) {
                cordova.plugins.printer.print(htmlCompleto, { name: 'Clinica_de_la_Sabana_Doc' });
            } else if (typeof window.print === 'function') {
                setTimeout(() => {
                    try {
                        window.print();
                    } catch (errPrint) {
                        console.warn('Fallo al invocar window.print() en Lista General:', errPrint);
                        this.notificarFalloImpresion(errPrint);
                    }
                }, 50);
            } else {
                this.notificarFalloImpresion(new Error('window.print no disponible en este dispositivo'));
            }
        } catch (e) {
            console.error('Error al capturar impresión de lista general:', e);
            this.notificarFalloImpresion(e);
        }
    }

    notificarFalloImpresion(err) {
        const mensaje = 'La función de impresión o exportación a PDF directo no está soportada en el visor web de este dispositivo móvil.\n\nPuede consultar la información en pantalla o retornar con el botón "✖ Volver a la App".';
        if (typeof window.mostrarAlerta === 'function') {
            window.mostrarAlerta(mensaje, 'Impresión Móvil');
        } else {
            alert(mensaje);
        }
    }

    async imprimirHistorialEvoluciones() {
        try {
            const modalNombre = document.getElementById('modalPacienteNombre') 
                ? document.getElementById('modalPacienteNombre').innerText.replace('Evoluciones Médicas:', '').trim() 
                : 'Paciente';
            const diagIngreso = document.getElementById('txtDiagIngreso') 
                ? document.getElementById('txtDiagIngreso').innerText.trim()
                : 'Sin registro';

            const id = document.getElementById('evoPacienteIndex') ? document.getElementById('evoPacienteIndex').value : null;
            let evoluciones = [];
            if (id) {
                const p = await this.repository.obtenerPorId(id);
                if (p && Array.isArray(p.evoluciones)) {
                    evoluciones = p.evoluciones;
                }
            }

            let evolucionesCards = '';
            if (!evoluciones || evoluciones.length === 0) {
                evolucionesCards = '<p style="color: #64748b; text-align: center; padding: 15px;">No hay evoluciones registradas para este paciente.</p>';
            } else {
                evoluciones.forEach((evo, index) => {
                    const pa = evo.pa || evo.presion || 'N/R';
                    const fc = evo.fc || evo.pulso || 'N/R';
                    const temp = evo.temp || evo.temperatura || 'N/R';
                    const spO2 = evo.spO2 || evo.spo2 || 'N/R';
                    const fecha = evo.fechaHora || evo.fecha || 'Sin fecha';
                    const profesional = evo.profesional || 'Personal Médico';
                    const especialidad = evo.especialidad || 'General';
                    const nota = evo.nota || evo.notaClinica || evo.descripcion || 'Sin nota registrada';

                    evolucionesCards += `
                        <div style="border: 1px solid #1e3a8a; border-radius: 6px; margin-bottom: 15px; background: #ffffff; page-break-inside: avoid; overflow: hidden;">
                            <div style="background-color: #1e3a8a; color: #ffffff !important; padding: 8px 12px; font-weight: bold; font-size: 13px;">
                                Evolución #${index + 1} — ${fecha} | ${especialidad} (${profesional})
                            </div>
                            <div style="padding: 10px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #000000 !important;">
                                <strong>Signos Vitales:</strong> PA: ${pa} | FC: ${fc} lpm | T°: ${temp} °C | SpO2: ${spO2}%
                            </div>
                            <div style="padding: 12px; font-size: 13px; color: #000000 !important; line-height: 1.5; white-space: pre-line;">
                                <strong>Nota Clínica:</strong><br>
                                ${nota}
                            </div>
                        </div>
                    `;
                });
            }

            const contenidoHTML = `
                <div class="no-print-bar" style="margin-bottom: 15px; padding: 10px; background: #e2e8f0; border-radius: 6px; display: flex; gap: 10px;">
                    <button type="button" style="background: #64748b; color: white; border: none; padding: 8px 14px; border-radius: 4px; font-weight: bold; cursor: pointer;" onclick="window.appController.cerrarReporte()">✖ Volver a la App</button>
                    <button type="button" style="background: #0284c7; color: white; border: none; padding: 8px 14px; border-radius: 4px; font-weight: bold; cursor: pointer;" onclick="window.appController.ejecutarImpresion()">🖨️ Imprimir / Guardar PDF</button>
                </div>
                <div style="font-family: Arial, sans-serif; color: #000000; padding: 5px;">
                    <div style="border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; margin-bottom: 12px;">
                        <h2 style="color: #1e3a8a; margin: 0 0 4px 0; font-size: 20px;">CLÍNICA DE LA SABANA</h2>
                        <h4 style="color: #475569; margin: 0; font-size: 14px; text-transform: uppercase;">Historial Completo de Evoluciones Médicas</h4>
                    </div>
                    <div style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 12px; color: #000000;">
                        <strong>Paciente:</strong> ${modalNombre} &nbsp;|&nbsp; <strong>Diagnóstico / Ingreso:</strong> ${diagIngreso}
                    </div>
                    <div style="width: 100%;">
                        ${evolucionesCards}
                    </div>
                </div>
            `;

            const modal = document.getElementById('modalEvoluciones');
            if (modal) modal.style.display = 'none';
            this.mostrarVistaReporte(contenidoHTML);
            
            setTimeout(() => {
                this.ejecutarImpresion();
            }, 300);

        } catch (error) {
            console.error('Error al imprimir evoluciones:', error);
            if (typeof window.mostrarAlerta === 'function') {
                window.mostrarAlerta('Error al preparar impresión: ' + error.message, 'Error');
            }
        }
    }

        async imprimirFicha(id) {
        const p = await this.repository.obtenerPorId(id);
        if (!p) {
            if (typeof window.mostrarAlerta === 'function') {
                window.mostrarAlerta('No se pudo encontrar el paciente seleccionado.', 'Aviso');
            } else {
                alert('No se pudo encontrar el paciente seleccionado.');
            }
            return;
        }

        const contenidoHTML = `
            <div class="no-print-bar">
                <button id="btnVolverApp" type="button" class="btn-action btn-close" onclick="window.appController.cerrarReporte()">✖ Volver a la App</button>
                <button id="btnImprimirReporte" type="button" class="btn-action btn-print" onclick="window.appController.ejecutarImpresion()">🖨️ Imprimir / Guardar PDF</button>
            </div>

            <div class="reporte-header">
                <h2>CLÍNICA DE LA SABANA</h2>
                <p>Ficha Individual del Paciente</p>
            </div>
            <div class="reporte-campo"><span class="reporte-label">Nombre del Paciente:</span> ${p.nombre || 'N/A'}</div>
            <div class="reporte-campo"><span class="reporte-label">Identificación:</span> ${p.tipoDoc || ''} - ${p.documento || ''}</div>
            <div class="reporte-campo"><span class="reporte-label">Edad:</span> ${p.calcularEdad ? p.calcularEdad() : ''} (Nacido el: ${p.fechaNacimiento || 'N/A'})</div>
            <div class="reporte-campo"><span class="reporte-label">Teléfono:</span> ${p.telefono || 'N/A'}</div>
            <div class="reporte-campo"><span class="reporte-label">EPS / Régimen:</span> ${p.eps || 'N/A'} (${p.regimen || 'N/A'})</div>
            <div class="reporte-campo"><span class="reporte-label">Nivel de Triage:</span> ${p.triage || 'N/A'}</div>
            <div class="reporte-campo"><span class="reporte-label">Estado Actual:</span> ${p.estado || 'N/A'}</div>
            <div class="reporte-box">
                <span class="reporte-label">Diagnóstico Inicial / Valoración de Urgencias:</span><br><br>
                ${p.diagnostico || 'Sin registro'}
            </div>
        `;

        this.mostrarVistaReporte(contenidoHTML);
    }

    async copiarAlPortapapeles(texto) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(texto);
                return true;
            } catch (clipErr) {
                console.warn('navigator.clipboard.writeText falló, usando textarea:', clipErr);
            }
        }

        try {
            const textarea = document.createElement('textarea');
            textarea.value = texto;
            textarea.style.position = 'fixed';
            textarea.style.top = '0';
            textarea.style.left = '0';
            textarea.style.width = '2em';
            textarea.style.height = '2em';
            textarea.style.padding = '0';
            textarea.style.border = 'none';
            textarea.style.outline = 'none';
            textarea.style.boxShadow = 'none';
            textarea.style.background = 'transparent';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            const copiado = document.execCommand('copy');
            document.body.removeChild(textarea);
            return copiado;
        } catch (err) {
            console.warn('Error en fallback de portapapeles:', err);
            return false;
        }
    }

    async exportarAExcel() {
        try {
            const pacientes = await this.repository.obtenerTodos();
            
            const pacientesValidos = pacientes.filter(p => (p.nombre && p.nombre.trim() !== '') || (p.documento && p.documento.trim() !== ''));

            if (pacientesValidos.length === 0) {
                const mensaje = 'No hay pacientes registrados para exportar.';
                if (typeof window.mostrarAlerta === 'function') {
                    window.mostrarAlerta(mensaje, 'Aviso');
                } else {
                    alert(mensaje);
                }
                return;
            }

            // 1. Genera la cadena de texto con el formato CSV estándar
            let csvContent = "Documento;Nombre;Edad;Contacto;EPS;Triage;Diagnóstico\r\n";

            pacientesValidos.forEach(p => {
                const doc = p.tipoDoc ? `${p.tipoDoc} ${p.documento}` : (p.documento || '');
                const edad = p.calcularEdad ? p.calcularEdad() : (p.edad || '');
                const contacto = p.telefono || '';
                const eps = p.regimen ? `${p.eps || ''} (${p.regimen})` : (p.eps || '');
                const triage = p.triage || 'N/A';
                const diagLimpio = p.diagnostico ? p.diagnostico.replace(/;/g, ",").replace(/[\r\n]+/g, " ") : "";
                const fila = `"${doc}";"${p.nombre || ''}";"${edad}";"${contacto}";"${eps}";"${triage}";"${diagLimpio}"`;
                csvContent += fila + "\r\n";
            });

            const fileName = `Pacientes_Clinica_Sabana_${new Date().toISOString().slice(0, 10)}.csv`;

            // 2. Para compatibilidad total en el WebView de Android y navegadores:
            if (window.cordova) {
                // Copia el contenido CSV al portapapeles y muestra alerta visual
                await this.copiarAlPortapapeles(csvContent);

                const mensajeAlerta = 'Reporte CSV copiado al portapapeles con éxito. Puede pegarlo directamente en hojas de cálculo o compartirlo.';
                if (typeof window.mostrarAlerta === 'function') {
                    window.mostrarAlerta(mensajeAlerta, 'Exportación CSV');
                } else {
                    alert(mensajeAlerta);
                }

                // Adicionalmente, intenta disparar la descarga mediante enlace Blob con atributo download
                try {
                    const blobGenerado = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
                    if (typeof URL !== 'undefined' && URL.createObjectURL) {
                        const blobUrl = URL.createObjectURL(blobGenerado);
                        const link = document.createElement("a");
                        link.setAttribute("href", blobUrl);
                        link.setAttribute("download", fileName);
                        link.style.display = "none";
                        document.body.appendChild(link);
                        link.click();
                        setTimeout(() => {
                            document.body.removeChild(link);
                            URL.revokeObjectURL(blobUrl);
                        }, 1500);
                    }
                } catch (eBlob) {
                    console.warn('Descarga directa de Blob no disponible en WebView:', eBlob);
                }
            } else {
                // Si corre en navegador web de escritorio estándar: descarga directa con BOM UTF-8
                const blobGenerado = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
                if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                    window.navigator.msSaveOrOpenBlob(blobGenerado, fileName);
                } else if (typeof URL !== 'undefined' && URL.createObjectURL) {
                    const blobUrl = URL.createObjectURL(blobGenerado);
                    const link = document.createElement("a");
                    link.setAttribute("href", blobUrl);
                    link.setAttribute("download", fileName);
                    link.style.display = "none";
                    document.body.appendChild(link);
                    link.click();
                    setTimeout(() => {
                        document.body.removeChild(link);
                        URL.revokeObjectURL(blobUrl);
                    }, 1000);
                } else {
                    const encodedUri = encodeURI("data:text/csv;charset=utf-8,\uFEFF" + csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", fileName);
                    link.style.display = "none";
                    document.body.appendChild(link);
                    link.click();
                    setTimeout(() => {
                        document.body.removeChild(link);
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('Error al exportar a Excel / CSV:', error);
            const msgError = 'Ocurrió un error al procesar el reporte de pacientes. Por favor intente nuevamente.';
            if (typeof window.mostrarAlerta === 'function') {
                window.mostrarAlerta(msgError, 'Error de Exportación');
            } else {
                alert(msgError);
            }
        }
    }

    limpiarFormulario() {
        document.getElementById('pacienteForm').reset();
        document.getElementById('pacienteIndex').value = '';
        document.getElementById('formTitulo').innerText = 'Registrar Nuevo Paciente';
        document.getElementById('btnGuardar').innerText = 'Guardar Paciente';
        document.getElementById('btnCancelar').style.display = 'none';

        this.limpiarErrorCampo('fechaNacimiento', 'fechaNacimientoError');
        this.limpiarErrorCampo('regPA', 'regPAError');
        this.limpiarErrorCampo('regFC', 'regFCError');
        this.limpiarErrorCampo('regTemp', 'regTempError');
        this.limpiarErrorCampo('regSpO2', 'regSpO2Error');
    }
}
