import { createSlice } from "@reduxjs/toolkit";

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    liste: [],
    nonLues: 0,
  },
  reducers: {
    setNotifications: (state, action) => {
      state.liste = action.payload;
      state.nonLues = action.payload.filter((n) => !n.lue).length;
    },
    marquerLue: (state, action) => {
      const notif = state.liste.find((n) => n.id === action.payload);
      if (notif && !notif.lue) {
        notif.lue = true;
        state.nonLues = Math.max(0, state.nonLues - 1);
      }
    },
    marquerToutesLues: (state) => {
      state.liste.forEach((n) => {
        n.lue = true;
      });
      state.nonLues = 0;
    },
    supprimerNotification: (state, action) => {
      const notif = state.liste.find((n) => n.id === action.payload);
      if (notif && !notif.lue) {
        state.nonLues = Math.max(0, state.nonLues - 1);
      }
      state.liste = state.liste.filter((n) => n.id !== action.payload);
    },
    viderNotifications: (state) => {
      state.liste = [];
      state.nonLues = 0;
    },
  },
});

export const {
  setNotifications, marquerLue, marquerToutesLues, supprimerNotification, viderNotifications,
} = notificationsSlice.actions;
export default notificationsSlice.reducer;
