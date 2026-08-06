import axiosClient from "./axiosClient";

// --- Notifications ---
export const listerNotifications = (lueSeulement) => {
  const params = lueSeulement === undefined ? {} : { lue: lueSeulement };
  return axiosClient.get("/notifications/", { params }).then((r) => r.data);
};
export const marquerNotificationLue = (id) =>
  axiosClient.patch(`/notifications/${id}/lue/`, {}).then((r) => r.data);
export const marquerToutesNotificationsLues = () =>
  axiosClient.post("/notifications/tout-marquer-lu/").then((r) => r.data);

// --- Utilisateurs (Administrateur) ---
export const listerUtilisateurs = () => axiosClient.get("/utilisateurs/").then((r) => r.data);
export const creerUtilisateur = (donnees) => axiosClient.post("/utilisateurs/", donnees).then((r) => r.data);
export const modifierUtilisateur = (id, donnees) =>
  axiosClient.patch(`/utilisateurs/${id}/`, donnees).then((r) => r.data);
