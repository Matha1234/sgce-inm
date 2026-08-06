import axios from "axios";

import store from "../store/store";
import { logout, setTokens } from "../store/authSlice";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
});

axiosClient.interceptors.request.use((config) => {
  const { access } = store.getState().auth;
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// Mutualise les rafraichissements de token concurrents : si plusieurs
// requetes echouent en 401 en meme temps, une seule vraie requete de
// refresh part vers le serveur, les autres attendent son resultat.
let refreshEnCours = null;

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requeteOriginale = error.config;
    const estErreur401 = error.response && error.response.status === 401;
    const estRequeteRefresh = requeteOriginale?.url?.includes("/auth/refresh/");

    if (estErreur401 && !requeteOriginale._retry && !estRequeteRefresh) {
      requeteOriginale._retry = true;
      const { refresh } = store.getState().auth;

      if (!refresh) {
        store.dispatch(logout());
        return Promise.reject(error);
      }

      try {
        if (!refreshEnCours) {
          refreshEnCours = axios
            .post(`${API_BASE_URL}/auth/refresh/`, { refresh })
            .then((res) => {
              store.dispatch(setTokens({ access: res.data.access }));
              return res.data.access;
            })
            .finally(() => {
              refreshEnCours = null;
            });
        }
        const nouveauAccess = await refreshEnCours;
        requeteOriginale.headers.Authorization = `Bearer ${nouveauAccess}`;
        return axiosClient(requeteOriginale);
      } catch (erreurRefresh) {
        store.dispatch(logout());
        return Promise.reject(erreurRefresh);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
