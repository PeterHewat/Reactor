import type { TranslationDictionary } from "@repo/utils";

/**
 * Spanish translations.
 */
const es: TranslationDictionary = {
  common: {
    welcome: "Bienvenido",
    loading: "Cargando...",
    error: "Ocurrió un error",
    retry: "Reintentar",
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    create: "Crear",
    search: "Buscar",
    noResults: "No se encontraron resultados",
  },
  theme: {
    light: "Claro",
    dark: "Oscuro",
    system: "Sistema",
    toggle: "Cambiar tema",
  },
  language: {
    select: "Seleccionar idioma",
    current: "Idioma actual: {{language}}",
  },
  home: {
    title: "Reactor",
    subtitle: "React 19 + Convex + Clerk + Tailwind CSS",
    viewOnGitHub: "Ver en GitHub",
    features: {
      title: "Características",
      react: "React 19 con las últimas funciones",
      convex: "Convex para backend en tiempo real",
      clerk: "Clerk para autenticación",
      tailwind: "Tailwind CSS para estilos",
      i18n: "Soporte de internacionalización",
      themes: "Temas claro y oscuro",
    },
  },
  errors: {
    notFound: "Página no encontrada",
    unauthorized: "No tienes autorización para ver esta página",
    serverError: "Error del servidor. Por favor, inténtalo más tarde.",
    networkError: "Error de red. Por favor, verifica tu conexión.",
  },
};

export default es;
