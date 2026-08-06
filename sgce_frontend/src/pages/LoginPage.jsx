import { useState } from "react";
import {
  Alert, Box, Button, Divider, IconButton, InputAdornment, Paper,
  TextField, Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { seConnecter, recupererProfil } from "../api/authApi";
import { setTokens, setUtilisateur } from "../store/authSlice";
import logoInm from "../assets/logo-inm.png";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { estAuthentifie } = useSelector((state) => state.auth);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  if (estAuthentifie) {
    const destination = location.state?.from?.pathname || "/";
    return <Navigate to={destination} replace />;
  }

  const gererSoumission = async (evenement) => {
    evenement.preventDefault();
    setErreur("");
    setEnCours(true);
    try {
      const { access, refresh } = await seConnecter(username, password);
      dispatch(setTokens({ access, refresh }));
      const profil = await recupererProfil();
      dispatch(setUtilisateur(profil));
      navigate("/", { replace: true });
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setErreur("Identifiant ou mot de passe incorrect.");
      } else {
        setErreur("Impossible de contacter le serveur. Vérifiez que le backend est démarré.");
      }
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        bgcolor: "#eef1f6",
      }}
    >
      <Box
        sx={{
          display: "flex",
          width: "100%",
          maxWidth: 980,
          my: { xs: 0, md: 6 },
          borderRadius: { xs: 0, md: 3 },
          overflow: "hidden",
          boxShadow: { xs: "none", md: "0 20px 60px rgba(15, 40, 80, 0.18)" },
        }}
      >
        {/* Panneau de marque, masqué sur petit ecran */}
        <Box
          sx={{
            flex: "1 1 45%",
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            justifyContent: "space-between",
            p: 5,
            background:
              "linear-gradient(160deg, #0d3c73 0%, #123a63 45%, #7a1f2b 130%)",
            color: "#fff",
          }}
        >
          <Box>
            <Box
              sx={{
                bgcolor: "rgba(255,255,255,0.95)",
                display: "inline-block",
                borderRadius: 2,
                px: 2,
                py: 1.5,
                mb: 5,
              }}
            >
              <Box component="img" src={logoInm} alt="Imprimerie Nationale de Madagascar" sx={{ height: 48 }} />
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.25, mb: 2 }}>
              Système de Gestion des
              <br />
              Commandes Étatiques
            </Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.85)" }}>
              Estimation intelligente des coûts, suivi de production en temps réel
              et traçabilité complète des commandes de l'État — Imprimerie
              Nationale de Madagascar.
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
            © {new Date().getFullYear()} Imprimerie Nationale de Madagascar — Tous droits réservés.
          </Typography>
        </Box>

        {/* Panneau du formulaire */}
        <Paper
          elevation={0}
          square
          sx={{
            flex: "1 1 55%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            px: { xs: 3, sm: 6, md: 7 },
            py: { xs: 5, md: 0 },
            bgcolor: "#fff",
          }}
        >
          <Box sx={{ display: { xs: "flex", md: "none" }, justifyContent: "center", mb: 4 }}>
            <Box component="img" src={logoInm} alt="Imprimerie Nationale de Madagascar" sx={{ height: 44 }} />
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Connexion
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Accédez à votre espace SGCE INM avec vos identifiants professionnels.
          </Typography>

          {erreur && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {erreur}
            </Alert>
          )}

          <Box component="form" onSubmit={gererSoumission} noValidate>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
              Identifiant
            </Typography>
            <TextField
              placeholder="Votre nom d'utilisateur"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Typography variant="body2" sx={{ mt: 2.5, mb: 0.5, fontWeight: 500 }}>
              Mot de passe
            </Typography>
            <TextField
              placeholder="Votre mot de passe"
              type={motDePasseVisible ? "text" : "password"}
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={motDePasseVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                        onClick={() => setMotDePasseVisible((v) => !v)}
                        edge="end"
                        tabIndex={-1}
                      >
                        {motDePasseVisible ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{
                mt: 4,
                py: 1.3,
                fontWeight: 600,
                textTransform: "none",
                fontSize: "1rem",
                boxShadow: "none",
              }}
              disabled={enCours}
            >
              {enCours ? "Connexion en cours..." : "Se connecter"}
            </Button>
          </Box>

          <Divider sx={{ my: 4 }} />
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
            Accès réservé au personnel autorisé de l'Imprimerie Nationale de Madagascar.
            <br />
            En cas de difficulté de connexion, contactez l'Administrateur du système.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
