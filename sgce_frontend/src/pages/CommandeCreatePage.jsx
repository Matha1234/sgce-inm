import { useEffect, useState } from "react";
import {
  Alert, Box, Button, MenuItem, Paper, TextField, Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import { creerCommande, creerOrganisme, listerOrganismes } from "../api/commandesApi";
import { LIBELLES_NATURE_COMMANDE } from "../constants/roles";

const TYPES_DOCUMENT = [
  { value: "JOURNAL_OFFICIEL", label: "Journal officiel" },
  { value: "BULLETIN_ANNONCES", label: "Bulletin d'annonces légales" },
  { value: "FORMULAIRE_ADMINISTRATIF", label: "Formulaire administratif" },
  { value: "CACHET_ADMINISTRATIF", label: "Cachet administratif" },
  { value: "DOCUMENT_FIDUCIAIRE", label: "Document fiduciaire" },
  { value: "AUTRE", label: "Autre" },
];

const TYPES_ORGANISME = [
  { value: "MINISTERE", label: "Ministère" },
  { value: "COLLECTIVITE", label: "Collectivité territoriale" },
  { value: "ETABLISSEMENT_PUBLIC", label: "Établissement public" },
  { value: "PARTICULIER", label: "Particulier" },
];

export default function CommandeCreatePage() {
  const navigate = useNavigate();

  const [organismes, setOrganismes] = useState([]);
  const [organismeId, setOrganismeId] = useState("");
  const [nouvelOrganisme, setNouvelOrganisme] = useState({ nom: "", type: "MINISTERE" });
  const [afficherNouvelOrganisme, setAfficherNouvelOrganisme] = useState(false);

  const [nature, setNature] = useState("STANDARDISEE");
  const [typeDocument, setTypeDocument] = useState("AUTRE");
  const [quantite, setQuantite] = useState(1);
  const [atelier, setAtelier] = useState("SPA");
  const [delaiContractuel, setDelaiContractuel] = useState("");

  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    listerOrganismes()
      .then((d) => setOrganismes(Array.isArray(d) ? d : d.results || []))
      .catch(() => setErreur("Impossible de charger la liste des organismes."));
  }, []);

  const gererCreationOrganisme = async () => {
    if (!nouvelOrganisme.nom.trim()) return;
    try {
      const organisme = await creerOrganisme(nouvelOrganisme);
      setOrganismes((liste) => [...liste, organisme]);
      setOrganismeId(organisme.id);
      setAfficherNouvelOrganisme(false);
      setNouvelOrganisme({ nom: "", type: "MINISTERE" });
    } catch {
      setErreur("Impossible de créer cet organisme.");
    }
  };

  const gererSoumission = async (evenement) => {
    evenement.preventDefault();
    setErreur("");

    if (!organismeId) {
      setErreur("Veuillez sélectionner un organisme client.");
      return;
    }

    setEnCours(true);
    try {
      const commande = await creerCommande({
        organisme: organismeId,
        nature,
        type_document: typeDocument,
        quantite: Number(quantite),
        atelier,
        delai_contractuel: delaiContractuel || null,
      });
      navigate(`/commandes/${commande.id}`);
    } catch (err) {
      const donnees = err.response?.data;
      if (donnees) {
        const premierMessage = Object.values(donnees)[0];
        setErreur(Array.isArray(premierMessage) ? premierMessage[0] : String(premierMessage));
      } else {
        setErreur("Impossible de créer la commande.");
      }
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Nouvelle commande
      </Typography>

      {erreur && <Alert severity="error" sx={{ mb: 2 }}>{erreur}</Alert>}

      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={gererSoumission} noValidate>
          <TextField
            select
            label="Organisme client"
            fullWidth
            margin="normal"
            value={organismeId}
            onChange={(e) => setOrganismeId(e.target.value)}
            required
          >
            {organismes.map((org) => (
              <MenuItem key={org.id} value={org.id}>
                {org.nom}
              </MenuItem>
            ))}
          </TextField>

          <Button size="small" onClick={() => setAfficherNouvelOrganisme((v) => !v)} sx={{ mb: 1 }}>
            {afficherNouvelOrganisme ? "Annuler" : "+ Créer un nouvel organisme"}
          </Button>

          {afficherNouvelOrganisme && (
            <Box sx={{ display: "flex", gap: 1, mb: 2, alignItems: "flex-start" }}>
              <TextField
                label="Nom de l'organisme"
                size="small"
                value={nouvelOrganisme.nom}
                onChange={(e) => setNouvelOrganisme((v) => ({ ...v, nom: e.target.value }))}
              />
              <TextField
                select
                label="Type"
                size="small"
                value={nouvelOrganisme.type}
                onChange={(e) => setNouvelOrganisme((v) => ({ ...v, type: e.target.value }))}
                sx={{ minWidth: 180 }}
              >
                {TYPES_ORGANISME.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </TextField>
              <Button variant="outlined" onClick={gererCreationOrganisme}>
                Ajouter
              </Button>
            </Box>
          )}

          <TextField
            select
            label="Nature de la commande"
            fullWidth
            margin="normal"
            value={nature}
            onChange={(e) => setNature(e.target.value)}
            helperText="Détermine le circuit de devis appliqué (RG21) — non modifiable après validation du devis."
          >
            {Object.entries(LIBELLES_NATURE_COMMANDE).map(([code, libelle]) => (
              <MenuItem key={code} value={code}>
                {libelle}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Type de document"
            fullWidth
            margin="normal"
            value={typeDocument}
            onChange={(e) => setTypeDocument(e.target.value)}
          >
            {TYPES_DOCUMENT.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Quantité"
            type="number"
            fullWidth
            margin="normal"
            value={quantite}
            onChange={(e) => setQuantite(e.target.value)}
            slotProps={{ htmlInput: { min: 1 } }}
          />

          <TextField
            select
            label="Atelier prévisionnel"
            fullWidth
            margin="normal"
            value={atelier}
            onChange={(e) => setAtelier(e.target.value)}
            helperText="Sera confirmé/ajusté lors de la création du dossier de fabrication."
          >
            <MenuItem value="SPA">SPA — Service de Production A</MenuItem>
            <MenuItem value="SPB">SPB — Service de Production B</MenuItem>
          </TextField>

          <TextField
            label="Délai contractuel"
            type="date"
            fullWidth
            margin="normal"
            value={delaiContractuel}
            onChange={(e) => setDelaiContractuel(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            helperText="Obligatoire sauf pour un particulier (RG19)."
          />

          <Button type="submit" variant="contained" size="large" sx={{ mt: 3 }} disabled={enCours}>
            {enCours ? "Création..." : "Créer la commande"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
