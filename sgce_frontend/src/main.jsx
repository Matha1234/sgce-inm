import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

import store from "./store/store";
import App from "./App.jsx";
import "./index.css";

const theme = createTheme({
  palette: {
    primary: { main: "#1565c0", dark: "#0d3c73", light: "#5e92f3" },
    secondary: { main: "#f9a825" },
    background: { default: "#f5f7fa" },
  },
  shape: { borderRadius: 8 },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  </StrictMode>
);
