import axiosClient from "./axiosClient";

// --- Contrôle du prix de revient ---
export const listerControles = () => axiosClient.get("/controles/").then((r) => r.data);

export const recupererControleParDossier = (dossierId) =>
  axiosClient
    .get("/controles/", { params: { dossier: dossierId } })
    .then((r) => {
      const data = Array.isArray(r.data) ? r.data : r.data.results || [];
      return data[0] || null;
    });

export const creerControle = (donnees) =>
  axiosClient.post("/controles/", donnees).then((r) => r.data);

export const recupererTableauBordRentabilite = () =>
  axiosClient.get("/controles/tableau-bord/").then((r) => r.data);
