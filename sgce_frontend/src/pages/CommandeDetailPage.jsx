import { useEffect, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Chip, CircularProgress,
  Divider, FormControlLabel, MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

import {
  creerDevis, creerDossier, modifierDevis, recupererCommande,
} from "../api/commandesApi";
import {
  COULEURS_STATUT_COMMANDE, LIBELLES_NATURE_COMMANDE, LIBELLES_STATUT_COMMANDE,
} from "../constants/roles";

function LigneInfo({ libelle, valeur }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">
        {libelle}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {valeur ?? "—"}
      </Typography>
    </Box>
  );
}

export default function CommandeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { utilisateur } = useSelector((state) => state.auth);
  const peutGererDevis = utilisateur?.role === "ADMIN" || utilisateur?.role === "AGENT_SDO";

  const [commande, setCommande] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  // Formulaire de creation de devis
  const [prixRevient, setPrixRevient] = useState("");
  const [prixVente, setPrixVente] = useState("");
  const [dureeProduction, setDureeProduction] = useState(1);
  const [pluriannuel, setPluriannuel] = useState(false);
  const [dureeContratAnnees, setDureeContratAnnees] = useState(5);

  const charger = () => {
    setChargement(true);
    recupererCommande(id)
      .then(setCommande)
      .catch(() => setErreur("Impossible de charger cette commande."))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const gererCreationDevis = async (evenement) => {
    evenement.preventDefault();
    setErreur("");
    setEnCours(true);
    try {
      await creerDevis({
        commande: commande.id,
        prix_revient: prixRevient,
        prix_vente: prixVente,
        duree_production: dureeProduction,
        pluriannuel,
        duree_contrat_annees: pluriannuel ? dureeContratAnnees : null,
      });
      charger();
    } catch (err) {
      const donnees = err.response?.data;
      setErreur(donnees ? JSON.stringify(donnees) : "Impossible de créer le devis.");
    } finally {
      setEnCours(false);
    }
  };

  const gererValidationDevis = async () => {
    setErreur("");
    setEnCours(true);
    try {
      await modifierDevis(commande.devis.id, { valide: true });
      charger();
    } catch (err) {
      const donnees = err.response?.data;
      setErreur(donnees ? JSON.stringify(donnees) : "Impossible de valider le devis.");
    } finally {
      setEnCours(false);
    }
  };

  const gererCreationDossier = async () => {
    setErreur("");
    setEnCours(true);
    try {
      const dossier = await creerDossier({ commande: commande.id });
      navigate(`/dossiers/${dossier.id}`);
    } catch (err) {
      const donnees = err.response?.data;
      setErreur(donnees ? JSON.stringify(donnees) : "Impossible de créer le dossier de fabrication.");
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

  if (!commande) {
    return <Alert severity="error">{erreur || "Commande introuvable."}</Alert>;
  }

  const devis = commande.devis;
  const estimation = devis?.estimation_ia;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Commande {commande.numero}
        </Typography>
        <Chip
          label={LIBELLES_STATUT_COMMANDE[commande.statut] || commande.statut}
          color={COULEURS_STATUT_COMMANDE[commande.statut] || "default"}
        />
      </Box>

      {erreur && <Alert severity="error" sx={{ mb: 2, wordBreak: "break-word" }}>{erreur}</Alert>}

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        <Box sx={{ flex: "1 1 380px", minWidth: 320 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations générales
              </Typography>
              <LigneInfo libelle="Organisme" valeur={commande.organisme_nom} />
              <LigneInfo
                libelle="Nature"
                valeur={LIBELLES_NATURE_COMMANDE[commande.nature] || commande.nature}
              />
              <LigneInfo libelle="Type de document" valeur={commande.type_document} />
              <LigneInfo libelle="Quantité" valeur={commande.quantite} />
              <LigneInfo libelle="Atelier prévisionnel" valeur={commande.atelier} />
              <LigneInfo libelle="Délai contractuel" valeur={commande.delai_contractuel} />
              <LigneInfo
                libelle="Date de commande"
                valeur={new Date(commande.date_commande).toLocaleDateString("fr-FR")}
              />
            </CardContent>
          </Card>

          {devis?.valide && (
            <Box sx={{ mt: 2 }}>
              {!commande.a_un_dossier ? (
                <Button variant="contained" fullWidth onClick={gererCreationDossier} disabled={enCours}>
                  Créer le dossier de fabrication
                </Button>
              ) : (
                <Button variant="outlined" fullWidth onClick={() => navigate(`/dossiers`)}>
                  Voir le dossier de fabrication
                </Button>
              )}
            </Box>
          )}
        </Box>

        <Box sx={{ flex: "2 1 480px", minWidth: 340 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Devis
              </Typography>

              {!devis && !peutGererDevis && (
                <Typography color="text.secondary">Aucun devis n'a encore été établi.</Typography>
              )}

              {!devis && peutGererDevis && (
                <Box component="form" onSubmit={gererCreationDevis}>
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label="Prix de revient (Ar)"
                      type="number"
                      value={prixRevient}
                      onChange={(e) => setPrixRevient(e.target.value)}
                      required
                      fullWidth
                    />
                    <TextField
                      label="Prix de vente (Ar)"
                      type="number"
                      value={prixVente}
                      onChange={(e) => setPrixVente(e.target.value)}
                      required
                      fullWidth
                    />
                  </Stack>
                  <TextField
                    label="Durée de production estimée (jours)"
                    type="number"
                    value={dureeProduction}
                    onChange={(e) => setDureeProduction(e.target.value)}
                    fullWidth
                    margin="normal"
                    slotProps={{ htmlInput: { min: 1 } }}
                  />

                  <FormControlLabel
                    sx={{ mt: 1 }}
                    control={
                      <Checkbox
                        checked={pluriannuel}
                        onChange={(e) => setPluriannuel(e.target.checked)}
                      />
                    }
                    label="Marché public à prix fixe pluriannuel"
                  />

                  {pluriannuel && (
                    <>
                      <TextField
                        select
                        label="Durée du contrat (années)"
                        value={dureeContratAnnees}
                        onChange={(e) => setDureeContratAnnees(Number(e.target.value))}
                        fullWidth
                        margin="normal"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <MenuItem key={n} value={n}>
                            {n} an{n > 1 ? "s" : ""}
                          </MenuItem>
                        ))}
                      </TextField>
                      <Alert severity="info" sx={{ mt: 1 }}>
                        Le taux d'inflation projeté et le prix de vente équilibré seront
                        calculés automatiquement à partir de l'historique de l'INM (RG22).
                      </Alert>
                    </>
                  )}

                  <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={enCours}>
                    {enCours ? "Création..." : "Créer le devis"}
                  </Button>
                </Box>
              )}

              {devis && (
                <>
                  <LigneInfo libelle="Prix de revient" valeur={`${devis.prix_revient} Ar`} />
                  <LigneInfo libelle="Prix de vente" valeur={`${devis.prix_vente} Ar`} />
                  <LigneInfo libelle="Durée de production" valeur={`${devis.duree_production} j`} />
                  <LigneInfo
                    libelle="Statut"
                    valeur={devis.valide ? "Validé" : "En attente de validation"}
                  />

                  {devis.pluriannuel && (
                    <>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Marché pluriannuel
                      </Typography>
                      <LigneInfo libelle="Durée du contrat" valeur={`${devis.duree_contrat_annees} ans`} />
                      <LigneInfo
                        libelle="Taux d'inflation projeté"
                        valeur={devis.taux_inflation_projete ? `${devis.taux_inflation_projete} %` : "—"}
                      />
                    </>
                  )}

                  {estimation && (
                    <>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Estimation intelligente des coûts (IA)
                      </Typography>
                      <LigneInfo libelle="Prix prédit" valeur={`${estimation.prix_predit} Ar`} />
                      <LigneInfo libelle="Durée prédite" valeur={`${estimation.duree_predite} j`} />
                      <LigneInfo libelle="Version du modèle" valeur={estimation.version_modele} />
                    </>
                  )}

                  {!devis.valide && peutGererDevis && (
                    <Button
                      variant="contained"
                      color="success"
                      sx={{ mt: 2 }}
                      onClick={gererValidationDevis}
                      disabled={enCours}
                    >
                      Valider le devis
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
