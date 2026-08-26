/*
 * ==========================================================
 * PERMISOS DEL PANEL DE ADMINISTRACIÓN
 * ==========================================================
 *
 * Para cambiar los permisos en el futuro, modifica solamente
 * este archivo.
 *
 * Los prefijos se comparan con el comienzo del email.
 */


// ----------------------------------------------------------
// 1. PREFIJOS DE LAS CUENTAS
// ----------------------------------------------------------

const ADMIN_PREFIXES = [
  "admin@",
  "admin-",
  "pepe"
];

const PREFERRED_PREFIXES = [
  "parroco@",
  "parroco-"
];

const GROUP_PREFIXES = [
  "grupo-",
  "blog@"
];


// ----------------------------------------------------------
// 2. CATEGORÍAS
// ----------------------------------------------------------

const ALL_CATEGORIES = [
  "Parroquia",
  "Peregrinaciones",
  "Testimonios",
  "Espiritualidad",
  "Formación",
  "Exterior",
  "Santoral",
  "Tiempo Litúrgico"
];


// Categorías permitidas para colaboradores de grupos.

const GROUP_CATEGORIES = [
  "Parroquia",
  "Peregrinaciones",
  "Testimonios",
  "Formación"
];


// ----------------------------------------------------------
// 3. EXPLICACIÓN DE LAS CATEGORÍAS
// ----------------------------------------------------------

const CATEGORY_DESCRIPTIONS = {

  "Parroquia":
    "Noticias, actividades y acontecimientos propios de nuestra parroquia.",

  "Peregrinaciones":
    "Peregrinaciones, excursiones y viajes organizados por la parroquia.",

  "Testimonios":
    "Experiencias personales de fe, conversión y vida cristiana.",

  "Espiritualidad":
    "Oraciones, reflexiones y contenidos relacionados con la vida espiritual y el crecimiento en la fe.",

  "Formación":
    "Contenidos formativos procedentes de los grupos, cursos y actividades de formación de la parroquia.",

  "Exterior":
    "Noticias y contenidos relacionados con otras parroquias, diócesis, el Vaticano y la Iglesia en general.",

  "Santoral":
    "Noticias y contenidos relacionados con santos, beatos y celebraciones del santoral.",

  "Tiempo Litúrgico":
    "Contenidos relacionados con Adviento, Navidad, Cuaresma, Semana Santa, Pascua y otros tiempos litúrgicos."
};


// ----------------------------------------------------------
// 4. PERMISOS DE CADA NIVEL
// ----------------------------------------------------------

const PERMISSIONS = {

  admin: {

    categories: ALL_CATEGORIES,

    canHighlight: true,

    canRecurring: true

  },


  preferred: {

    categories: ALL_CATEGORIES,

    canHighlight: true,

    canRecurring: true

  },


  group: {

    categories: GROUP_CATEGORIES,

    canHighlight: false,

    canRecurring: false

  }

};


// ----------------------------------------------------------
// 5. DETERMINAR EL NIVEL DEL USUARIO
// ----------------------------------------------------------

function getUserRole(email) {

  const normalizedEmail = email.toLowerCase().trim();


  // Administrador

  if (
    ADMIN_PREFIXES.some(prefix =>
      normalizedEmail.startsWith(prefix)
    )
  ) {
    return "admin";
  }


  // Colaborador preferente

  if (
    PREFERRED_PREFIXES.some(prefix =>
      normalizedEmail.startsWith(prefix)
    )
  ) {
    return "preferred";
  }


  // Colaborador de grupo

  if (
    GROUP_PREFIXES.some(prefix =>
      normalizedEmail.startsWith(prefix)
    )
  ) {
    return "group";
  }


  // Si no coincide con ningún prefijo

  return "group";
}


// ----------------------------------------------------------
// 6. FUNCIONES AUXILIARES
// ----------------------------------------------------------

function getPermissionsForRole(role) {

  return PERMISSIONS[role] || PERMISSIONS.group;

}


function getRoleName(role) {

  const names = {

    admin: "Administrador",

    preferred: "Colaborador preferente",

    group: "Colaborador"

  };

  return names[role] || "Colaborador";

}


// ----------------------------------------------------------
// 7. EXPORTAR
// ----------------------------------------------------------

export {
  getUserRole,
  getPermissionsForRole,
  getRoleName,
  CATEGORY_DESCRIPTIONS
};