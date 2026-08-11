import { useState } from "react";
import {
  Alert, Avatar, Box, Button, Card, CardContent, CircularProgress, Divider,
  Grid, IconButton, Stack, TextField, Tooltip, Typography,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import SaveIcon from "@mui/icons-material/Save";
import LockResetIcon from "@mui/icons-material/LockReset";
import { useDispatch, useSelector } from "react-redux";

import { changerMotDePasse, mettreAJourPhotoProfil, mettreAJourProfil } from "../api/utilisateursApi";
import { setUtilisateur } from "../store/authSlice";
import { COULEURS_ROLES, LIBELLES_ROLES } from "../constants/roles";

export default function ParametresPage() {
  const dispatch = useDispatch();
  const { utilisateur } = useSelector((state) => state.auth);

  const [prenom, setPrenom] = useState(utilisateur?.first_name || "");
  const [nom, setNom] = useState(utilisateur?.last_name || "");
  const [email, setEmail] = useState(utilisateur?.email || "");
  const [enregistrementProfil, setEnregistrementProfil] = useState(false);
  const [messageProfil, setMessageProfil] = useState(null);

  const [televersementPhoto, setTeleversementPhoto] = useState(false);

  const [ancienMotDePasse, setAncienMotDePasse] = useState("");
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState("");
  const [enregistrementMdp, setEnregistrementMdp] = useState(false);
  const [messageMdp, setMessageMdp] = useState(null);

  const couleurAvatar = COULEURS_ROLES[utilisateur?.role] || "#455A64";

  const gererEnregistrementProfil = async (evenement) => {
    evenement.preventDefault();
    setEnregistrementProfil(true);
    setMessageProfil(null);
    try {
      const donnees = await mettreAJourProfil({ first_name: prenom, last_name: nom, email });
      dispatch(setUtilisateur(donnees));
      setMessageProfil({ type: "success", texte: "Profil mis à jour avec succès." });
    } catch {
      setMessageProfil({ type: "error", texte: "Impossible de mettre à jour le profil." });
    } finally {
      setEnregistrementProfil(false);
    }
  };

  const gererChangementPhoto = async (evenement) => {
    const fichier = evenement.target.files?.[0];
    evenement.target.value = "";
    if (!fichier) return;
    setTeleversementPhoto(true);
    try {
      const donnees = await mettreAJourPhotoProfil(fichier);
      dispatch(setUtilisateur(donnees));
    } catch {
      setMessageProfil({ type: "error", texte: "Impossible de mettre à jour la photo." });
    } finally {
      setTeleversementPhoto(false);
    }
  };

  const gererChangementMotDePasse = async (evenement) => {
    evenement.preventDefault();
    setMessageMdp(null);
    if (nouveauMotDePasse !== confirmationMotDePasse) {
      setMessageMdp({ type: "error", texte: "La confirmation ne correspond pas au nouveau mot de passe." });
      return;
    }
    setEnregistrementMdp(true);
    try {
      await changerMotDePasse({
        ancien_mot_de_passe: ancienMotDePasse,
        nouveau_mot_de_passe: nouveauMotDePasse,
      });
      setAncienMotDePasse("");
      setNouveauMotDePasse("");
      setConfirmationMotDePasse("");
      setMessageMdp({ type: "success", texte: "Mot de passe modifié avec succès." });
    } catch (error) {
      const detail =
        error?.response?.data?.ancien_mot_de_passe ||
        error?.response?.data?.nouveau_mot_de_passe?.[0] ||
        "Impossible de modifier le mot de passe.";
      setMessageMdp({ type: "error", texte: detail });
    } finally {
      setEnregistrementMdp(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Paramètres du compte
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Box sx={{ position: "relative", display: "inline-block", mb: 1.5 }}>
                <Avatar
                  src={utilisateur?.photo || undefined}
                  sx={{ width: 96, height: 96, bgcolor: couleurAvatar, fontSize: 32, mx: "auto" }}
                >
                  {(utilisateur?.first_name?.[0] || utilisateur?.username?.[0] || "?").toUpperCase()}
                </Avatar>
                <Tooltip title="Changer la photo de profil">
                  <IconButton
                    component="label"
                    disabled={televersementPhoto}
                    sx={{
                      position: "absolute", bottom: 0, right: 0, bgcolor: "primary.main", color: "#fff",
                      width: 32, height: 32, "&:hover": { bgcolor: "primary.dark" },
                    }}
                  >
                    {televersementPhoto ? (
                      <CircularProgress size={16} sx={{ color: "#fff" }} />
                    ) : (
                      <PhotoCameraIcon sx={{ fontSize: 17 }} />
                    )}
                    <input type="file" accept="image/*" hidden onChange={gererChangementPhoto} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {utilisateur?.username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {LIBELLES_ROLES[utilisateur?.role] || utilisateur?.role}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations personnelles
              </Typography>
              {messageProfil && (
                <Alert severity={messageProfil.type} sx={{ mb: 2 }}>
                  {messageProfil.texte}
                </Alert>
              )}
              <Box component="form" onSubmit={gererEnregistrementProfil}>
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField label="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} fullWidth />
                    <TextField label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} fullWidth />
                  </Stack>
                  <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
                  <Box>
                    <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={enregistrementProfil}>
                      Enregistrer
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sécurité
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {messageMdp && (
                <Alert severity={messageMdp.type} sx={{ mb: 2 }}>
                  {messageMdp.texte}
                </Alert>
              )}
              <Box component="form" onSubmit={gererChangementMotDePasse}>
                <Stack spacing={2} sx={{ maxWidth: 420 }}>
                  <TextField
                    label="Mot de passe actuel"
                    type="password"
                    value={ancienMotDePasse}
                    onChange={(e) => setAncienMotDePasse(e.target.value)}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Nouveau mot de passe"
                    type="password"
                    value={nouveauMotDePasse}
                    onChange={(e) => setNouveauMotDePasse(e.target.value)}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Confirmer le nouveau mot de passe"
                    type="password"
                    value={confirmationMotDePasse}
                    onChange={(e) => setConfirmationMotDePasse(e.target.value)}
                    fullWidth
                    required
                  />
                  <Box>
                    <Button type="submit" variant="outlined" startIcon={<LockResetIcon />} disabled={enregistrementMdp}>
                      Changer le mot de passe
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
