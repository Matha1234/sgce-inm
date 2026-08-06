import { createSlice } from "@reduxjs/toolkit";

const accessInitial = localStorage.getItem("sgce_access") || null;
const refreshInitial = localStorage.getItem("sgce_refresh") || null;
let utilisateurInitial = null;
try {
  utilisateurInitial = JSON.parse(localStorage.getItem("sgce_utilisateur") || "null");
} catch {
  utilisateurInitial = null;
}

const authSlice = createSlice({
  name: "auth",
  initialState: {
    access: accessInitial,
    refresh: refreshInitial,
    utilisateur: utilisateurInitial,
    estAuthentifie: Boolean(accessInitial),
  },
  reducers: {
    setTokens: (state, action) => {
      state.access = action.payload.access;
      if (action.payload.refresh) {
        state.refresh = action.payload.refresh;
        localStorage.setItem("sgce_refresh", action.payload.refresh);
      }
      state.estAuthentifie = true;
      localStorage.setItem("sgce_access", state.access);
    },
    setUtilisateur: (state, action) => {
      state.utilisateur = action.payload;
      localStorage.setItem("sgce_utilisateur", JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.access = null;
      state.refresh = null;
      state.utilisateur = null;
      state.estAuthentifie = false;
      localStorage.removeItem("sgce_access");
      localStorage.removeItem("sgce_refresh");
      localStorage.removeItem("sgce_utilisateur");
    },
  },
});

export const { setTokens, setUtilisateur, logout } = authSlice.actions;
export default authSlice.reducer;
