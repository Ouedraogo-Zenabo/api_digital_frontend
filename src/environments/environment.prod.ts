export const environment = {
  production: true,
  // URLs de l'API backend - en production, servies via le reverse proxy Nginx.
  // Les chemins relatifs doivent correspondre aux endpoints réels du backend :
  //   - API métier : /api/v1/...
  //   - Authentification : /api/auth/...
  apiUrl: '/api/v1',
  authUrl: '/api/auth',
  // Base utilisée pour les fichiers/uploads (même domaine que le front via Nginx)
  FileUrl: '',
  // Domaine public du site (URLs canoniques, Open Graph, sitemap)
  siteUrl: 'http://site-test.tic.gov.bf',
  // Intervalle de rafraîchissement des actualités (en millisecondes)
  refreshInterval: 30000,
  // Nom de l'application
  appName: "MTDPCE - Ministère de la Transition Digitale, des Postes et des Communications Électroniques",
  // Version de l'application
  version: '1.0.0'
};
