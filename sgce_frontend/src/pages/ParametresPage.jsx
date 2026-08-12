import { useMemo, useState } from "react";
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress, Divider,
  Grid, IconButton, InputAdornment, Stack, TextField, Tooltip, Typography,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import SaveIcon from "@mui/icons-material/Save";
import LockResetIcon from "@mui/icons-material/LockReset";
import BadgeIcon from "@mui/icons-material/Badge";
import SecurityIcon from "@mui/icons-material/Security";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useDispatch, useSelector } from "react-redux";

import { changerMotDePasse, mettreAJourPhotoProfil, mettreAJourProfil } from "../api/utilisateursApi";
import { setUtilisateur } from "../store/authSlice";
import { COULEURS_ROLES, LIBELLES_ROLES } from "../constants/roles";

function formaterDate(valeur) {
  if (!valeur) return "—";
  return new Date(valeur).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

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
  const [voirAncien, setVoirAncien] = useState(false);
  const [voirNouveau, setVoirNouveau] = useState(false);
  const [voirConfirmation, setVoirConfirmation] = useState(false);
  const [enregistrementMdp, setEnregistrementMdp] = useState(false);
  const [messageMdp, setMessageMdp] = useState(null);

  const couleurAvatar = COULEURS_ROLES[utilisateur?.role] || "#455A64";

  const profilModifie =
    prenom !== (utilisateur?.first_name || "") ||
    nom !== (utilisateur?.last_name || "") ||
    email !== (utilisateur?.email || "");

  const forceMotDePasse = useMemo(() => {
    if (!nouveauMotDePasse) return null;
    let score = 0;
    if (nouveauMotDePasse.length >= 8) score += 1;
    if (/[A-Z]/.test(nouveauMotDePasse)) score += 1;
    if (/[0-9]/.test(nouveauMotDePasse)) score += 1;
    if (/[^A-Za-z0-9]/.test(nouveauMotDePasse)) score += 1;
    const paliers = [
      { seuil: 1, libelle: "Faible", couleur: "error" },
      { seuil: 2, libelle: "Moyen", couleur: "warning" },
      { seuil: 3, libelle: "Bon", couleur: "info" },
      { seuil: 4, libelle: "Excellent", couleur: "success" },
    ];
    return paliers.find((p) => p.seuil === Math.max(score, 1));
  }, [nouveauMotDePasse]);

  const gererEnregistrementProfil = async (evenement) => {
    evenement.preventDefault();
    setEnregistrementProfil(true);
    setMessageProfil(null);
    try {
      const donnees = await mettreAJourProfil({ first_name: prenom, last_name: nom, email });
      dispatch(setUtilisateur(donnees));
      setMessageProfil({ type: "success", texte: "Profil mis à jour avec succès." });
    } catch {
      setMessageProfil({ type: "error", texte: "Impossible de mettre à jour le profil. Réessayez." });
    } finally {
      setEnregistrementProfil(false);
    }
  };

  const gererChangementPhoto = async (evenement) => {
    const fichier = evenement.target.files?.[0];
    evenement.target.value = "";
    if (!fichier) return;
    setTeleversementPhoto(true);
    setMessageProfil(null);
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
      <Typography variant="h4" sx={{ fontWeight: 600 }}>
        Paramètres du compte
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Gérez vos informations personnelles, votre photo et la sécurité de votre compte.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ position: "sticky", top: 16 }}>
            <CardContent sx={{ textAlign: "center" }}>
              <Box sx={{ position: "relative", display: "inline-block", mb: 1.5 }}>
                <Avatar
                  src={utilisateur?.photo || undefined}
                  sx={{
                    width: 100, height: 100, bgcolor: couleurAvatar, fontSize: 34, mx: "auto",
                    boxShadow: "0 0 0 4px rgba(0,0,0,0.04)",
                  }}
                >
                  {(utilisateur?.first_name?.[0] || utilisateur?.username?.[0] || "?").toUpperCase()}
                </Avatar>
                <Tooltip title="Changer la photo de profil">
                  <IconButton
                    component="label"
                    disabled={televersementPhoto}
                    sx={{
                      position: "absolute", bottom: 2, right: 2, bgcolor: "primary.main", color: "#fff",
                      width: 34, height: 34, boxShadow: 2, "&:hover": { bgcolor: "primary.dark" },
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
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                {utilisateur?.first_name || utilisateur?.last_name
                  ? `${utilisateur?.first_name || ""} ${utilisateur?.last_name || ""}`.trim()
                  : utilisateur?.username}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                @{utilisateur?.username}
              </Typography>
              <Chip
                label={LIBELLES_ROLES[utilisateur?.role] || utilisateur?.role}
                size="small"
                sx={{ bgcolor: couleurAvatar, color: "#fff", fontWeight: 500, mt: 1.25 }}
              />

              <Divider sx={{ my: 2 }} />

              <Stack spacing={1.25} sx={{ textAlign: "left" }}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <PersonOutlineIcon fontSize="small" color="action" />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
                      Email
                    </Typography>
                    <Typography variant="body2" noWrap>{utilisateur?.email || "—"}</Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <EventAvailableIcon fontSize="small" color="action" />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
                      Membre depuis
                    </Typography>
                    <Typography variant="body2" noWrap>{formaterDate(utilisateur?.date_joined)}</Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <BadgeIcon color="action" fontSize="small" />
                <Typography variant="h6">Informations personnelles</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Ces informations sont visibles par les autres utilisateurs du SGCE-INM (annuaire, messagerie).
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
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={enregistrementProfil ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                      disabled={enregistrementProfil || !profilModifie}
                    >
                      {enregistrementProfil ? "Enregistrement…" : "Enregistrer"}
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <SecurityIcon color="action" fontSize="small" />
                <Typography variant="h6">Sécurité</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choisissez un mot de passe d'au moins 8 caractères, combinant majuscules, chiffres et symboles.
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
                    type={voirAncien ? "text" : "password"}
                    value={ancienMotDePasse}
                    onChange={(e) => setAncienMotDePasse(e.target.value)}
                    fullWidth
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setVoirAncien((v) => !v)} edge="end">
                            {voirAncien ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="Nouveau mot de passe"
                    type={voirNouveau ? "text" : "password"}
                    value={nouveauMotDePasse}
                    onChange={(e) => setNouveauMotDePasse(e.target.value)}
                    fullWidth
                    required
                    helperText={
                      forceMotDePasse ? (
                        <Box component="span" sx={{ color: `${forceMotDePasse.couleur}.main`, fontWeight: 600 }}>
                          Robustesse : {forceMotDePasse.libelle}
                        </Box>
                      ) : (
                        " "
                      )
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setVoirNouveau((v) => !v)} edge="end">
                            {voirNouveau ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="Confirmer le nouveau mot de passe"
                    type={voirConfirmation ? "text" : "password"}
                    value={confirmationMotDePasse}
                    onChange={(e) => setConfirmationMotDePasse(e.target.value)}
                    fullWidth
                    required
                    error={Boolean(confirmationMotDePasse) && confirmationMotDePasse !== nouveauMotDePasse}
                    helperText={
                      Boolean(confirmationMotDePasse) && confirmationMotDePasse !== nouveauMotDePasse
                        ? "Ne correspond pas au nouveau mot de passe."
                        : " "
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setVoirConfirmation((v) => !v)} edge="end">
                            {voirConfirmation ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Box>
                    <Button
                      type="submit"
                      variant="outlined"
                      startIcon={enregistrementMdp ? <CircularProgress size={16} /> : <LockResetIcon />}
                      disabled={
                        enregistrementMdp ||
                        !ancienMotDePasse ||
                        !nouveauMotDePasse ||
                        !confirmationMotDePasse
                      }
                    >
                      {enregistrementMdp ? "Modification…" : "Changer le mot de passe"}
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