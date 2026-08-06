import { useEffect, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider,
  List, ListItem, ListItemText, MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import {
  creerEtape, modifierDossier, modifierEtape, recupererDossier,
} from "../api/commandesApi";
import { LIBELLES_STATUT_ETAPE, LIBELLES_STATUT_PRODUCTION } from "../constants/roles";

const COULEURS_STATUT = {
  CREE: "default", A_FAIRE: "default",
  EN_COURS: "warning",
  TERMINE: "success", TERMINEE: "success",
};

export default function DossierDetailPage() {
  const { id } = useParams();
  const { utilisateur } = useSelector((state) => state.auth);
  const peutGererProduction = utilisateur?.role === "ADMIN" || utilisateur?.role === "CHEF_ATELIER";

  const [dossier, setDossier] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [nouvelleEtape, setNouvelleEtape] = useState("");

  const charger = () => {
    setChargement(true);
    recupererDossier(id)
      .then(setDossier)
      .catch(() => setErreur("Impossible de charger ce dossier."))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const gererChangementStatutDossier = async (nouveauStatut) => {
    setEnCours(true);
    setErreur("");
    try {
      await modifierDossier(dossier.id, { statut_production: nouveauStatut });
      charger();
    } catch {
      setErreur("Impossible de mettre à jour le statut du dossier.");
    } finally {
      setEnCours(false);
    }
  };

  const gererAjoutEtape = async (evenement) => {
    evenement.preventDefault();
    if (!nouvelleEtape.trim()) return;
    setEnCours(true);
    setErreur("");
    try {
      await creerEtape({ dossier: dossier.id, libelle: nouvelleEtape });
      setNouvelleEtape("");
      charger();
    } catch {
      setErreur("Impossible d'ajouter cette étape.");
    } finally {
      setEnCours(false);
    }
  };

  const gererChangementStatutEtape = async (etapeId, nouveauStatut) => {
    setEnCours(true);
    setErreur("");
    try {
      await modifierEtape(etapeId, { statut: nouveauStatut });
      charger();
    } catch {
      setErreur("Impossible de mettre à jour le statut de cette étape.");
    } finally {
      setEnCours(false);
    }
  };

  if (chargement) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!dossier) {
    return <Alert severity="error">{erreur || "Dossier introuvable."}</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Dossier {dossier.numero_dossier}
        </Typography>
        <Chip
          label={LIBELLES_STATUT_PRODUCTION[dossier.statut_production] || dossier.statut_production}
          color={COULEURS_STATUT[dossier.statut_production] || "default"}
        />
      </Box>

      {erreur && <Alert severity="error" sx={{ mb: 2 }}>{erreur}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Commande liée
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {dossier.commande_numero}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Atelier
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {dossier.atelier_nom}
          </Typography>

          {peutGererProduction && (
            <Stack direction="row" spacing={1}>
              {["CREE", "EN_COURS", "TERMINE"].map((statut) => (
                <Button
                  key={statut}
                  size="small"
                  variant={dossier.statut_production === statut ? "contained" : "outlined"}
                  disabled={enCours}
                  onClick={() => gererChangementStatutDossier(statut)}
                >
                  {LIBELLES_STATUT_PRODUCTION[statut]}
                </Button>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Étapes de production
          </Typography>

          <List>
            {(dossier.etapes || []).map((etape) => (
              <ListItem
                key={etape.id}
                secondaryAction={
                  peutGererProduction && (
                    <TextField
                      select
                      size="small"
                      value={etape.statut}
                      onChange={(e) => gererChangementStatutEtape(etape.id, e.target.value)}
                      sx={{ minWidth: 140 }}
                    >
                      {Object.entries(LIBELLES_STATUT_ETAPE).map(([code, libelle]) => (
                        <MenuItem key={code} value={code}>
                          {libelle}
                        </MenuItem>
                      ))}
                    </TextField>
                  )
                }
              >
                <ListItemText
                  primary={etape.libelle}
                  secondary={
                    !peutGererProduction ? LIBELLES_STATUT_ETAPE[etape.statut] || etape.statut : null
                  }
                />
              </ListItem>
            ))}
            {(!dossier.etapes || dossier.etapes.length === 0) && (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                Aucune étape enregistrée pour ce dossier.
              </Typography>
            )}
          </List>

          {peutGererProduction && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box component="form" onSubmit={gererAjoutEtape} sx={{ display: "flex", gap: 1 }}>
                <TextField
                  label="Nouvelle étape (ex : impression, numérotation...)"
                  size="small"
                  fullWidth
                  value={nouvelleEtape}
                  onChange={(e) => setNouvelleEtape(e.target.value)}
                />
                <Button type="submit" variant="contained" disabled={enCours}>
                  Ajouter
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
