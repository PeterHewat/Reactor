import { PRODUCT_NAME } from "@repo/config/product";
import type { TranslationDictionary } from "@repo/utils";

const fr: TranslationDictionary = {
  common: {
    welcome: "Bienvenue",
    loading: "Chargement...",
    error: "Une erreur s'est produite",
    retry: "Réessayer",
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    edit: "Modifier",
    create: "Créer",
    search: "Rechercher",
    noResults: "Aucun résultat trouvé",
  },
  theme: {
    light: "Clair",
    dark: "Sombre",
    system: "Système",
    toggle: "Changer le thème",
  },
  language: {
    select: "Choisir la langue",
    current: "Langue actuelle : {{language}}",
  },
  nav: {
    main: "Navigation principale",
    tasks: "Tâches",
  },
  auth: {
    login: "Se connecter",
    logout: "Se déconnecter",
  },
  home: {
    title: PRODUCT_NAME,
    subtitle: "React 19 + Convex + Clerk + Tailwind CSS",
    viewRepository: "Voir le dépôt sur GitHub",
    features: {
      title: "Fonctionnalités",
      react: "React 19 avec routes fichier TanStack Router",
      convex: "API tâches exemple Convex (activer via env)",
      clerk: "Authentification Clerk si configurée",
      tailwind: "Tailwind CSS v4 avec jetons partagés",
      i18n: "Internationalisation (en, es, fr, de)",
      themes: "Thèmes clair et sombre",
    },
  },
  backend: {
    setupTitle: "Terminer la configuration cloud",
    setupBody:
      "Configurez Convex et Clerk pour la démo tâches. Suivez les étapes puis bun run dev:full.",
    stepConvex:
      "Convex : CLERK_JWT_ISSUER_DOMAIN (Issuer du modèle JWT Convex), puis bun run dev:convex et VITE_CONVEX_URL",
    stepClerk:
      "Clerk : modèles JWT → preset Convex (copier Issuer) ; Clés API → React → VITE_CLERK_PUBLISHABLE_KEY",
    stepEnv: "Voir docs/getting-started.md §2–3 sur GitHub",
    setupGuide: "Ouvrir le guide de configuration sur GitHub (README)",
    setupGuideLocal: "Voir le README de votre dépôt pour la configuration cloud",
    backHome: "Retour à l'accueil",
  },
  tasks: {
    title: "Tâches",
    subtitle: "Exemple vertical : mutations Convex et auth Clerk",
    newPlaceholder: "Que faut-il faire ?",
    add: "Ajouter une tâche",
    empty: "Pas encore de tâches. Ajoutez-en une ci-dessus.",
    listLabel: "Vos tâches",
    toggleComplete: "Marquer « {{title}} » comme terminée",
    delete: "Supprimer « {{title}} »",
  },
  errors: {
    notFound: "Page introuvable",
    notFoundHint: "La page demandée n'existe pas.",
    unauthorized: "Vous n'êtes pas autorisé à voir cette page",
    serverError: "Erreur serveur. Veuillez réessayer plus tard.",
    networkError: "Erreur réseau. Vérifiez votre connexion.",
  },
};

export default fr;
