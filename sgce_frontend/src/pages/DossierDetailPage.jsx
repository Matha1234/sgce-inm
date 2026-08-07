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
import { creerControle, recupererControleParDossier } from "../api/controleApi";
import {
  COULEURS_RESULTAT_CONTROLE, LIBELLES_RESULTAT_CONTROLE,
  LIBELLES_STATUT_ETAPE, LIBELLES_STATUT_PRODUCTION,
} from "../constants/roles";

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

  const [controle, setControle] = useState(null);
  const [chargementControle, setChargementControle] = useState(false);
  const [formulaireControle, setFormulaireControle] = useState({
    cout_matieres_reel: "", cout_temps_machine_reel: "", marge_cible_pourcentage: "20", commentaire: "",
  });
  const [erreurControle, setErreurControle] = useState("");

  const charger = () => {
    setChargement(true);
    recupererDossier(id)
      .then(setDossier)
      .catch(() => setErreur("Impossible de charger ce dossier."))
      .finally(() => setChargement(false));
  };

  const chargerControle = () => {
    setChargementControle(true);
    recupererControleParDossier(id)
      .then(setControle)
      .catch(() => setControle(null))
      .finally(() => setChargementControle(false));
  };

  useEffect(() => {
    charger();
    chargerControle();
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

  const gererSoumissionControle = async (evenement) => {
    evenement.preventDefault();
    setEnCours(true);
    setErreurControle("");
    try {
      const donnees = await creerControle({
        dossier: dossier.id,
        cout_matieres_reel: formulaireControle.cout_matieres_reel || 0,
        cout_temps_machine_reel: formulaireControle.cout_temps_machine_reel || 0,
        marge_cible_pourcentage: formulaireControle.marge_cible_pourcentage || 20,
        commentaire: formulaireControle.commentaire,
      });
      setControle(donnees);
    } catch (error) {
      const detail =
        error?.response?.data?.dossier?.[0] ||
        error?.response?.data?.non_field_errors?.[0] ||
        "Impossible d'enregistrer le contrôle du prix de revient.";
      setErreurControle(detail);
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

      {dossier.statut_production === "TERMINE" && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Contrôle du prix de revient
            </Typography>

            {chargementControle && <CircularProgress size={24} />}

            {!chargementControle && controle && (
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Chip
                    label={LIBELLES_RESULTAT_CONTROLE[controle.resultat] || controle.resultat}
                    color={COULEURS_RESULTAT_CONTROLE[controle.resultat] || "default"}
                  />
                  {controle.ecart_significatif && (
                    <Chip label="Écart significatif" color="warning" variant="outlined" />
                  )}
                </Stack>
                <Typography variant="body2" color="text.secondary">Prix de revient estimé au devis</Typography>
                <Typography sx={{ mb: 1 }}>{controle.prix_revient_estime} Ar</Typography>
                <Typography variant="body2" color="text.secondary">Coût réel constaté (matières + temps machine)</Typography>
                <Typography sx={{ mb: 1 }}>{controle.cout_reel_total} Ar</Typography>
                <Typography variant="body2" color="text.secondary">Marge réelle / Marge cible</Typography>
                <Typography sx={{ mb: 1 }}>
                  {controle.marge_reelle_pourcentage}% / {controle.marge_cible_pourcentage}%
                </Typography>
                {controle.commentaire && (
                  <>
                    <Typography variant="body2" color="text.secondary">Commentaire</Typography>
                    <Typography sx={{ mb: 1 }}>{controle.commentaire}</Typography>
                  </>
                )}
              </Box>
            )}

            {!chargementControle && !controle && !peutGererProduction && (
              <Typography color="text.secondary">
                Le contrôle du prix de revient n'a pas encore été établi pour ce dossier.
              </Typography>
            )}

            {!chargementControle && !controle && peutGererProduction && (
              <Box component="form" onSubmit={gererSoumissionControle}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Saisissez les consommations réelles constatées à la clôture afin de générer
                  automatiquement la fiche d'analyse de rentabilité (RG23, RG24).
                </Typography>
                {erreurControle && <Alert severity="error" sx={{ mb: 2 }}>{erreurControle}</Alert>}
                <Stack spacing={2} sx={{ maxWidth: 360 }}>
                  <TextField
                    label="Coût réel des matières (Ar)"
                    type="number"
                    size="small"
                    value={formulaireControle.cout_matieres_reel}
                    onChange={(e) =>
                      setFormulaireControle({ ...formulaireControle, cout_matieres_reel: e.target.value })
                    }
                  />
                  <TextField
                    label="Coût réel du temps machine (Ar)"
                    type="number"
                    size="small"
                    value={formulaireControle.cout_temps_machine_reel}
                    onChange={(e) =>
                      setFormulaireControle({ ...formulaireControle, cout_temps_machine_reel: e.target.value })
                    }
                  />
                  <TextField
                    label="Marge cible (%)"
                    type="number"
                    size="small"
                    value={formulaireControle.marge_cible_pourcentage}
                    onChange={(e) =>
                      setFormulaireControle({ ...formulaireControle, marge_cible_pourcentage: e.target.value })
                    }
                  />
                  <TextField
                    label="Commentaire (optionnel)"
                    size="small"
                    multiline
                    minRows={2}
                    value={formulaireControle.commentaire}
                    onChange={(e) =>
                      setFormulaireControle({ ...formulaireControle, commentaire: e.target.value })
                    }
                  />
                  <Button type="submit" variant="contained" disabled={enCours}>
                    Clôturer et calculer le prix de revient
                  </Button>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
