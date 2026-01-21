import type { TranslationDictionary } from "@repo/utils";

/**
 * German translations.
 */
const de: TranslationDictionary = {
  common: {
    welcome: "Willkommen",
    loading: "Laden...",
    error: "Ein Fehler ist aufgetreten",
    retry: "Erneut versuchen",
    save: "Speichern",
    cancel: "Abbrechen",
    delete: "Löschen",
    edit: "Bearbeiten",
    create: "Erstellen",
    search: "Suchen",
    noResults: "Keine Ergebnisse gefunden",
  },
  theme: {
    light: "Hell",
    dark: "Dunkel",
    system: "System",
    toggle: "Thema wechseln",
  },
  language: {
    select: "Sprache auswählen",
    current: "Aktuelle Sprache: {{language}}",
  },
  home: {
    title: "Reactor",
    subtitle: "React 19 + Convex + Clerk + Tailwind CSS",
    viewOnGitHub: "Auf GitHub ansehen",
    features: {
      title: "Funktionen",
      react: "React 19 mit den neuesten Funktionen",
      convex: "Convex für Echtzeit-Backend",
      clerk: "Clerk für Authentifizierung",
      tailwind: "Tailwind CSS für Styling",
      i18n: "Internationalisierungsunterstützung",
      themes: "Helle und dunkle Themen",
    },
  },
  errors: {
    notFound: "Seite nicht gefunden",
    unauthorized: "Sie sind nicht berechtigt, diese Seite anzuzeigen",
    serverError: "Serverfehler. Bitte versuchen Sie es später erneut.",
    networkError: "Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.",
  },
};

export default de;
