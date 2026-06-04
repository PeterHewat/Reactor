import { PRODUCT_NAME } from "@repo/config/product";
import type { TranslationDictionary } from "@repo/utils";

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
  nav: {
    main: "Navegación principal",
    tasks: "Tareas",
  },
  auth: {
    login: "Iniciar sesión",
    logout: "Cerrar sesión",
  },
  home: {
    title: PRODUCT_NAME,
    subtitle: "React 19 + Convex + Clerk + Tailwind CSS",
    features: {
      title: "Características",
      react: "React 19 con rutas de archivos TanStack Router",
      convex: "API de tareas de ejemplo con Convex (activar con env)",
      clerk: "Autenticación Clerk cuando está configurada",
      tailwind: "Tailwind CSS v4 con tokens compartidos",
      i18n: "Internacionalización (en, es, fr, de)",
      themes: "Temas claro y oscuro",
    },
  },
  backend: {
    setupTitle: "Completar configuración en la nube",
    setupBody:
      "Configura Convex y Clerk para la demo de tareas. Sigue los pasos y luego bun run dev:full.",
    stepConvex:
      "Convex: CLERK_JWT_ISSUER_DOMAIN (Issuer de la plantilla JWT Convex), luego bun run dev:convex y VITE_CONVEX_URL",
    stepClerk:
      "Clerk: plantillas JWT → preset Convex (copiar Issuer); API keys → React → VITE_CLERK_PUBLISHABLE_KEY",
    stepEnv: "Ver docs/getting-started.md §2–3 en este repositorio",
    setupGuide: "Guía completa: docs/getting-started.md en este repositorio",
    backHome: "Volver al inicio",
  },
  tasks: {
    title: "Tareas",
    subtitle: "Ejemplo vertical: mutaciones Convex y auth Clerk",
    newPlaceholder: "¿Qué hay que hacer?",
    add: "Añadir tarea",
    empty: "Aún no hay tareas. Añade una arriba.",
    listLabel: "Tus tareas",
    toggleComplete: "Marcar «{{title}}» como completada",
    delete: "Eliminar «{{title}}»",
  },
  errors: {
    notFound: "Página no encontrada",
    notFoundHint: "La página que solicitaste no existe.",
    unauthorized: "No tienes autorización para ver esta página",
    serverError: "Error del servidor. Por favor, inténtalo más tarde.",
    networkError: "Error de red. Por favor, verifica tu conexión.",
  },
};

export default es;
