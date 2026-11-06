const seedUsers = [
  {
    id: "usr_admin_01",
    username: "admin",
    // 1234 hasheado con bcryptjs ($2a$10$w85V/nvdRjYJgOln/67n4u2GgCj30u9wL3wU/0c79y6YJv1zT40vW) o validación en login
    password: "1234",
    name: "Administrador Médico",
    role: "admin"
  },
  {
    id: "usr_consulta_02",
    username: "consulta",
    password: "1234",
    name: "Usuario Consulta / Enfermería",
    role: "consulta"
  }
];

const seedPacientes = [
  {
    id: "pac_001",
    nombre: "Ana Restrepo Gómez",
    tipoDoc: "CC",
    documento: "1020304050",
    fechaNacimiento: "1990-05-14",
    telefono: "3001234567",
    eps: "Sura",
    regimen: "Contributivo",
    triage: "Triage II (Naranja)",
    estado: "En tratamiento",
    diagnostico: "Paciente femenina de 34 años con dolor abdominal agudo en fosa ilíaca derecha de 8 horas de evolución, asociado a náuseas y febrícula (37.8°C). Signo de Blumberg positivo. Se sospecha apendicitis aguda. Se ordena ecografía abdominal y hemograma completo.",
    evoluciones: [
      {
        id: "evo_001_1",
        fechaHora: "25/9/2026, 8:15:00 a. m.",
        especialidad: "Medicina General",
        profesional: "Dr. Carlos Pérez",
        pa: "120/80",
        fc: "88 bpm",
        temp: "37.8 °C",
        spO2: "98%",
        nota: "Ingreso a urgencias. Se canaliza vía venosa periférica con Hartman a 80 cc/hora. Se administra analgesia y se deja en nada vía oral a la espera de resultados de laboratorio e imágenes."
      },
      {
        id: "evo_001_2",
        fechaHora: "25/9/2026, 11:30:00 a. m.",
        especialidad: "Especialista / Internista",
        profesional: "Dra. Sofía Mendoza",
        pa: "115/75",
        fc: "82 bpm",
        temp: "37.2 °C",
        spO2: "99%",
        nota: "Reporte de laboratorio evidencia leucocitosis (14.500) con neutrofilia. Ecografía confirma engrosamiento de pared apendicular. Se programa para valoración por cirugía general."
      }
    ],
    createdAt: "2026-09-25T08:00:00.000Z",
    updatedAt: "2026-09-25T11:30:00.000Z"
  },
  {
    id: "pac_002",
    nombre: "Carlos Eduardo Gómez Lozano",
    tipoDoc: "CC",
    documento: "79845123",
    fechaNacimiento: "1978-11-20",
    telefono: "3109876543",
    eps: "Sanitas",
    regimen: "Contributivo",
    triage: "Triage III (Amarillo)",
    estado: "Activo",
    diagnostico: "Paciente masculino de 47 años con cuadro de tos persistente de 2 semanas de evolución con expectoración mucopurulenta y disnea leve a moderada tras esfuerzo físico.",
    evoluciones: [
      {
        id: "evo_002_1",
        fechaHora: "25/9/2026, 9:45:00 a. m.",
        especialidad: "Medicina General",
        profesional: "Dr. Mario Ramírez",
        pa: "130/85",
        fc: "76 bpm",
        temp: "36.8 °C",
        spO2: "96%",
        nota: "Se auscultan estertores en base pulmonar derecha. Se solicita radiografía de tórax PA y lateral. Se inicia tratamiento con broncodilatador y amoxicilina/clavulanato."
      }
    ],
    createdAt: "2026-09-25T09:30:00.000Z",
    updatedAt: "2026-09-25T09:45:00.000Z"
  }
];

module.exports = {
  seedUsers,
  seedPacientes
};
