import axios from "axios";

import { API_BASE_URL } from "./axiosClient";
import axiosClient from "./axiosClient";

// Le login n'utilise pas axiosClient (pas encore de token a injecter),
// mais une instance axios brute pointant sur la meme base.
export const seConnecter = (username, password) =>
  axios.post(`${API_BASE_URL}/auth/login/`, { username, password }).then((r) => r.data);

export const recupererProfil = () => axiosClient.get("/auth/me/").then((r) => r.data);
