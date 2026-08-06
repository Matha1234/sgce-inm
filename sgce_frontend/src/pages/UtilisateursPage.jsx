import { useEffect, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, MenuItem, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useSelector } from "react-redux";

import { creerUtilisateur, listerUtilisateurs, modifierUtilisateur } from "../api/utilisateursApi";
import { LIBELLES_ROLES } from "../constants/roles";

const ROLE_VIDE = { username: "", email: "", password: "", role: "AGENT_SDO" };

export default function UtilisateursPage() {
  const { utilisateur: utilisateurConnecte } = useSelector((state) => state.auth);

  const [utilisateurs, setUtilisateurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [dialogueOuvert, setDialogueOuvert] = useState(false);
  const [formulaire, setFormulaire] = useState(ROLE_VIDE);
  const [enCours, setEnCours] = useState(false);

  const charger = () => {
    setChargement(true);
    listerUtilisateurs()
      .then((d) => setUtilisateurs(Array.isArray(d) ? d : d.results || []))
      .catch(() => setErreur("Impossible de charger les comptes utilisateurs."))
      .finally(() => setChargement(false));
  };

  useEffect(charger, []);

  const gererCreation = async () => {
    setEnCours(true);
    setErreur("");
    try {
      await creerUtilisateur(formulaire);
      setDialogueOuvert(false);
      setFormulaire(ROLE_VIDE);
      charger();
    } catch (err) {
      const donnees = err.response?.data;
      const premierMessage = donnees ? Object.values(donnees)[0] : null;
      setErreur(
        Array.isArray(premierMessage) ? premierMessage[0] : premierMessage || "Impossible de créer ce compte."
      );
    } finally {
      setEnCours(false);
    }
  };

  const gererBasculeActivation = async (utilisateur) => {
    setErreur("");
    try {
      await modifierUtilisateur(utilisateur.id, { is_active: !utilisateur.is_active });
      charger();
    } catch (err) {
      const donnees = err.response?.data;
      setErreur(donnees?.detail || "Impossible de modifier ce compte.");
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Utilisateurs
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogueOuvert(true)}>
          Nouveau compte
        </Button>
      </Box>

      {erreur && <Alert severity="error" sx={{ mb: 2 }}>{erreur}</Alert>}

      {chargement ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Identifiant</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rôle</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {utilisateurs.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.email || "—"}</TableCell>
                  <TableCell>{LIBELLES_ROLES[u.role] || u.role}</TableCell>
                  <TableCell>
                    <Chip
                      label={u.is_active ? "Actif" : "Désactivé"}
                      color={u.is_active ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      color={u.is_active ? "error" : "success"}
                      disabled={u.id === utilisateurConnecte?.id}
                      onClick={() => gererBasculeActivation(u)}
                    >
                      {u.is_active ? "Désactiver" : "Réactiver"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogueOuvert} onClose={() => setDialogueOuvert(false)} fullWidth maxWidth="xs">
        <DialogTitle>Créer un compte utilisateur</DialogTitle>
        <DialogContent>
          <TextField
            label="Identifiant"
            fullWidth
            margin="normal"
            value={formulaire.username}
            onChange={(e) => setFormulaire((f) => ({ ...f, username: e.target.value }))}
          />
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={formulaire.email}
            onChange={(e) => setFormulaire((f) => ({ ...f, email: e.target.value }))}
          />
          <TextField
            label="Mot de passe"
            type="password"
            fullWidth
            margin="normal"
            value={formulaire.password}
            onChange={(e) => setFormulaire((f) => ({ ...f, password: e.target.value }))}
          />
          <TextField
            select
            label="Rôle"
            fullWidth
            margin="normal"
            value={formulaire.role}
            onChange={(e) => setFormulaire((f) => ({ ...f, role: e.target.value }))}
          >
            {Object.entries(LIBELLES_ROLES).map(([code, libelle]) => (
              <MenuItem key={code} value={code}>
                {libelle}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogueOuvert(false)}>Annuler</Button>
          <Button variant="contained" onClick={gererCreation} disabled={enCours}>
            Créer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
