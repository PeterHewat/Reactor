import type { TranslationDictionary } from "@repo/utils";

/**
 * French translations.
 */
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
    toggle: "Changer de thème",
  },
  language: {
    select: "Sélectionner la langue",
    current: "Langue actuelle : {{language}}",
  },
  home: {
    title: "Reactor",
    subtitle: "React 19 + Convex + Clerk + Tailwind CSS",
    viewOnGitHub: "Voir sur GitHub",
    features: {
      title: "Fonctionnalités",
      react: "React 19 avec les dernières fonctionnalités",
      convex: "Convex pour le backend en temps réel",
      clerk: "Clerk pour l'authentification",
      tailwind: "Tailwind CSS pour le style",
      i18n: "Support de l'internationalisation",
      themes: "Thèmes clair et sombre",
    },
  },
  errors: {
    notFound: "Page non trouvée",
    unauthorized: "Vous n'êtes pas autorisé à voir cette page",
    serverError: "Erreur du serveur. Veuillez réessayer plus tard.",
    networkError: "Erreur réseau. Veuillez vérifier votre connexion.",
  },
};

export default fr;
