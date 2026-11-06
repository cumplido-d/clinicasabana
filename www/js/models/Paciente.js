class Paciente {
    constructor(data = {}) {
        this.id = data.id || data._id || null;
        this.nombre = data.nombre || '';
        this.tipoDoc = data.tipoDoc || 'CC';
        this.documento = data.documento || '';
        this.fechaNacimiento = data.fechaNacimiento || '';
        this.telefono = data.telefono || '';
        this.eps = data.eps || '';
        this.regimen = data.regimen || 'Contributivo';
        this.triage = data.triage || 'Triage III (Amarillo)';
        this.estado = data.estado || 'Activo';
        this.diagnostico = data.diagnostico || '';
        this.evoluciones = Array.isArray(data.evoluciones) ? data.evoluciones : [];
        this.createdAt = data.createdAt || null;
        this.updatedAt = data.updatedAt || null;
    }

    calcularEdad() {
        if (!this.fechaNacimiento) return 'N/A';
        const hoy = new Date();
        const nacimiento = new Date(this.fechaNacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();
        
        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }
        return isNaN(edad) ? 'N/A' : `${edad} años`;
    }
}