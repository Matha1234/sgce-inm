import axiosClient from "./axiosClient";

export const listerMessagesRecus = () => axiosClient.get("/messages/recus/").then((r) => r.data);
export const listerMessagesEnvoyes = () => axiosClient.get("/messages/envoyes/").then((r) => r.data);
export const envoyerMessage = (donnees) => axiosClient.post("/messages/", donnees).then((r) => r.data);
export const marquerMessageLu = (id) => axiosClient.patch(`/messages/${id}/lu/`, {}).then((r) => r.data);
export const supprimerMessage = (id) => axiosClient.delete(`/messages/${id}/`).then((r) => r.data);
