import axiosClient from "./axiosClient";

// --- Organismes clients ---
export const listerOrganismes = () => axiosClient.get("/organismes/").then((r) => r.data);
export const creerOrganisme = (donnees) => axiosClient.post("/organismes/", donnees).then((r) => r.data);

// --- Commandes ---
export const listerCommandes = () => axiosClient.get("/commandes/").then((r) => r.data);
export const recupererCommande = (id) => axiosClient.get(`/commandes/${id}/`).then((r) => r.data);
export const creerCommande = (donnees) => axiosClient.post("/commandes/", donnees).then((r) => r.data);
export const modifierCommande = (id, donnees) =>
  axiosClient.patch(`/commandes/${id}/`, donnees).then((r) => r.data);

// --- Devis ---
export const creerDevis = (donnees) => axiosClient.post("/devis/", donnees).then((r) => r.data);
export const recupererDevis = (id) => axiosClient.get(`/devis/${id}/`).then((r) => r.data);
export const modifierDevis = (id, donnees) => axiosClient.patch(`/devis/${id}/`, donnees).then((r) => r.data);

// --- Ateliers ---
export const listerAteliers = () => axiosClient.get("/ateliers/").then((r) => r.data);

// --- Dossiers de fabrication ---
export const listerDossiers = () => axiosClient.get("/dossiers/").then((r) => r.data);
export const recupererDossier = (id) => axiosClient.get(`/dossiers/${id}/`).then((r) => r.data);
export const creerDossier = (donnees) => axiosClient.post("/dossiers/", donnees).then((r) => r.data);
export const modifierDossier = (id, donnees) =>
  axiosClient.patch(`/dossiers/${id}/`, donnees).then((r) => r.data);

// --- Etapes de production ---
export const listerEtapes = () => axiosClient.get("/etapes/").then((r) => r.data);
export const creerEtape = (donnees) => axiosClient.post("/etapes/", donnees).then((r) => r.data);
export const modifierEtape = (id, donnees) => axiosClient.patch(`/etapes/${id}/`, donnees).then((r) => r.data);

// --- Stock ---
export const listerArticles = () => axiosClient.get("/articles/").then((r) => r.data);
export const recupererArticle = (id) => axiosClient.get(`/articles/${id}/`).then((r) => r.data);
export const creerArticle = (donnees) => axiosClient.post("/articles/", donnees).then((r) => r.data);
export const modifierArticle = (id, donnees) =>
  axiosClient.patch(`/articles/${id}/`, donnees).then((r) => r.data);

export const listerMouvements = () => axiosClient.get("/mouvements/").then((r) => r.data);
export const creerMouvement = (donnees) => axiosClient.post("/mouvements/", donnees).then((r) => r.data);

// --- Facturation ---
export const listerFactures = () => axiosClient.get("/factures/").then((r) => r.data);
export const creerFacture = (donnees) => axiosClient.post("/factures/", donnees).then((r) => r.data);
