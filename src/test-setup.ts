/**
 * Setup global des tests unitaires (Vitest + jsdom).
 * jsdom n'implémente pas certaines API navigateur utilisées par l'app :
 * on les neutralise ici pour garder la sortie des tests propre.
 */
if (typeof window !== 'undefined') {
  window.scrollTo = () => {};
}
