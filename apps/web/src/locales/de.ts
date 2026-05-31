import type { TranslationDictionary } from "@repo/utils";

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
  nav: {
    main: "Hauptnavigation",
    tasks: "Aufgaben",
  },
  auth: {
    login: "Anmelden",
    logout: "Abmelden",
  },
  home: {
    title: "Reactor",
    subtitle: "React 19 + Convex + Clerk + Tailwind CSS",
    viewRepository: "Repository auf GitHub ansehen",
    features: {
      title: "Funktionen",
      react: "React 19 mit TanStack Router Dateirouten",
      convex: "Convex Beispiel-Aufgaben-API (per Env aktivieren)",
      clerk: "Clerk-Authentifizierung wenn konfiguriert",
      tailwind: "Tailwind CSS v4 mit gemeinsamen Tokens",
      i18n: "Internationalisierung (en, es, fr, de)",
      themes: "Helle und dunkle Themen",
    },
  },
  backend: {
    setupTitle: "Cloud-Setup abschließen",
    setupBody:
      "Convex und Clerk einrichten für die Aufgaben-Demo. Schritte unten, dann bun run dev:full.",
    stepConvex: "bun run dev:convex ausführen und VITE_CONVEX_URL in apps/web/.env.local setzen",
    stepClerk: "Clerk-App anlegen und VITE_CLERK_PUBLISHABLE_KEY setzen",
    stepEnv:
      "convex/auth.config.ts.example nach auth.config.ts kopieren und CLERK_JWT_ISSUER_DOMAIN in Convex setzen",
    setupGuide: "Einrichtungsanleitung auf GitHub öffnen (README)",
    setupGuideLocal: "Siehe README im Repository für die Cloud-Einrichtung",
    backHome: "Zur Startseite",
  },
  tasks: {
    title: "Aufgaben",
    subtitle: "Vertikaler Schnitt: Convex-Mutationen und Clerk-Auth",
    newPlaceholder: "Was ist zu erledigen?",
    add: "Aufgabe hinzufügen",
    empty: "Noch keine Aufgaben. Oben eine hinzufügen.",
    listLabel: "Ihre Aufgaben",
    toggleComplete: "„{{title}}“ als erledigt markieren",
    delete: "„{{title}}“ löschen",
  },
  errors: {
    notFound: "Seite nicht gefunden",
    notFoundHint: "Die angeforderte Seite existiert nicht.",
    unauthorized: "Sie sind nicht berechtigt, diese Seite anzuzeigen",
    serverError: "Serverfehler. Bitte versuchen Sie es später erneut.",
    networkError: "Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.",
  },
};

export default de;
