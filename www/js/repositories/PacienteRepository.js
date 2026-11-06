class PacienteRepository {
    constructor() {
        this.cacheKey = 'pacientes_cache';
        this.cachedPacientes = [];
    }

    async obtenerTodos(busqueda = '') {
        try {
            const url = busqueda 
                ? `${API_CONFIG.BASE_URL}/pacientes?search=${encodeURIComponent(busqueda)}`
                : `${API_CONFIG.BASE_URL}/pacientes`;

            const response = await fetch(url, {
                method: 'GET',
                headers: API_CONFIG.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const rawList = Array.isArray(result.data) ? result.data : [];

            this.cachedPacientes = rawList.map(pData => new Paciente(pData));
            
            // Guardar en caché local para soporte offline
            try {
                localStorage.setItem(this.cacheKey, JSON.stringify(this.cachedPacientes));
            } catch (e) {
                console.warn('No se pudo guardar la caché local:', e);
            }

            return this.cachedPacientes;
        } catch (error) {
            console.error('Error al obtener pacientes del backend, cargando caché local:', error);
            const offlineData = localStorage.getItem(this.cacheKey);
            if (offlineData) {
                try {
                    const parsed = JSON.parse(offlineData);
                    this.cachedPacientes = parsed.map(pData => new Paciente(pData));
                    return this.cachedPacientes;
                } catch (e) {
                    console.error('Error al procesar caché:', e);
                }
            }
            return [];
        }
    }

    async obtenerPorId(id) {
        if (!id) return null;

        // Primero verificar si está en la memoria caché
        let encontrado = this.cachedPacientes.find(p => String(p.id) === String(id));
        if (encontrado) return encontrado;

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/pacientes/${id}`, {
                method: 'GET',
                headers: API_CONFIG.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }

            const result = await response.json();
            if (result.success && result.data) {
                return new Paciente(result.data);
            }
        } catch (error) {
            console.warn(`No se pudo consultar paciente ${id} en backend:`, error);
        }

        return null;
    }

    // Compatibilidad por si se pasa índice numérico
    obtenerPorIndex(index) {
        return this.cachedPacientes[index] || null;
    }

    async guardar(pacienteData, id = null) {
        const esEdicion = id !== null && id !== undefined && id !== '';
        const url = esEdicion 
            ? `${API_CONFIG.BASE_URL}/pacientes/${id}`
            : `${API_CONFIG.BASE_URL}/pacientes`;
        
        const method = esEdicion ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: API_CONFIG.getHeaders(),
            body: JSON.stringify(pacienteData)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Error al ${esEdicion ? 'actualizar' : 'crear'} paciente`);
        }

        const result = await response.json();
        return result.data;
    }

    async eliminar(id) {
        if (!id) return false;

        const response = await fetch(`${API_CONFIG.BASE_URL}/pacientes/${id}`, {
            method: 'DELETE',
            headers: API_CONFIG.getHeaders()
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || 'Error al eliminar el paciente en el backend');
        }

        return true;
    }

    async agregarEvolucion(pacienteId, evolucionData) {
        if (!pacienteId) throw new Error('ID de paciente no válido');

        const response = await fetch(`${API_CONFIG.BASE_URL}/pacientes/${pacienteId}/evoluciones`, {
            method: 'POST',
            headers: API_CONFIG.getHeaders(),
            body: JSON.stringify(evolucionData)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || 'Error al agregar la evolución en el backend');
        }

        const result = await response.json();
        return result.data;
    }
}