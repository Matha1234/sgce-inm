import { useEffect, useState } from "react";
import {
  Alert, Autocomplete, Avatar, Box, Button, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Divider, IconButton, List,
  ListItemButton, ListItemText, Stack, Tab, Tabs, TextField, Tooltip, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import InboxIcon from "@mui/icons-material/Inbox";
import SendIcon from "@mui/icons-material/Send";
import { useSelector } from "react-redux";

import {
  envoyerMessage, listerMessagesEnvoyes, listerMessagesRecus, marquerMessageLu, supprimerMessage,
} from "../api/messagerieApi";
import { listerAnnuaire } from "../api/utilisateursApi";
import { LIBELLES_ROLES } from "../constants/roles";

function normaliser(donnees) {
  return Array.isArray(donnees) ? donnees : donnees.results || [];
}

export default function MessageriePage() {
  const { utilisateur } = useSelector((state) => state.auth);

  const [onglet, setOnglet] = useState(0);
  const [recus, setRecus] = useState([]);
  const [envoyes, setEnvoyes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [messageOuvert, setMessageOuvert] = useState(null);
  const [dialogueOuvert, setDialogueOuvert] = useState(false);
  const [annuaire, setAnnuaire] = useState([]);
  const [destinataire, setDestinataire] = useState(null);
  const [objet, setObjet] = useState("");
  const [contenu, setContenu] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreurEnvoi, setErreurEnvoi] = useState("");

  const charger = async () => {
    setChargement(true);
    setErreur("");
    try {
      const [r, e] = await Promise.all([listerMessagesRecus(), listerMessagesEnvoyes()]);
      setRecus(normaliser(r));
      setEnvoyes(normaliser(e));
    } catch {
      setErreur("Impossible de charger la messagerie.");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const ouvrirDialogueNouveauMessage = async () => {
    setDialogueOuvert(true);
    setErreurEnvoi("");
    if (annuaire.length === 0) {
      try {
        const donnees = await listerAnnuaire();
        setAnnuaire(normaliser(donnees).filter((u) => u.id !== utilisateur?.id));
      } catch {
        setErreurEnvoi("Impossible de charger l'annuaire des utilisateurs.");
      }
    }
  };

  const gererEnvoi = async () => {
    if (!destinataire || !contenu.trim()) {
      setErreurEnvoi("Choisissez un destinataire et saisissez un message.");
      return;
    }
    setEnvoiEnCours(true);
    setErreurEnvoi("");
    try {
      await envoyerMessage({ destinataire: destinataire.id, objet, contenu });
      setDialogueOuvert(false);
      setDestinataire(null);
      setObjet("");
      setContenu("");
      charger();
      setOnglet(1);
    } catch {
      setErreurEnvoi("Impossible d'envoyer ce message.");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const gererOuvrirMessage = async (message, estRecu) => {
    setMessageOuvert(message);
    if (estRecu && !message.lu) {
      try {
        await marquerMessageLu(message.id);
        setRecus((liste) => liste.map((m) => (m.id === message.id ? { ...m, lu: true } : m)));
      } catch {
        // pas bloquant
      }
    }
  };

  const gererSuppression = async (evenement, id) => {
    evenement.stopPropagation();
    try {
      await supprimerMessage(id);
      setRecus((liste) => liste.filter((m) => m.id !== id));
      setEnvoyes((liste) => liste.filter((m) => m.id !== id));
      if (messageOuvert?.id === id) setMessageOuvert(null);
    } catch {
      setErreur("Impossible de supprimer ce message.");
    }
  };

  const nombreNonLus = recus.filter((m) => !m.lu).length;
  const listeAffichee = onglet === 0 ? recus : envoyes;

  if (chargement) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Messagerie
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={ouvrirDialogueNouveauMessage}>
          Nouveau message
        </Button>
      </Stack>

      {erreur && <Alert severity="warning" sx={{ mb: 2 }}>{erreur}</Alert>}

      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
        <Box sx={{ width: 380, bgcolor: "background.paper", borderRadius: 2, boxShadow: 1, overflow: "hidden" }}>
          <Tabs value={onglet} onChange={(e, v) => setOnglet(v)} variant="fullWidth">
            <Tab icon={<InboxIcon fontSize="small" />} iconPosition="start" label={`Reçus${nombreNonLus > 0 ? ` (${nombreNonLus})` : ""}`} />
            <Tab icon={<SendIcon fontSize="small" />} iconPosition="start" label="Envoyés" />
          </Tabs>
          <Divider />
          <List sx={{ maxHeight: 560, overflowY: "auto", p: 0 }}>
            {listeAffichee.length === 0 && (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Aucun message {onglet === 0 ? "reçu" : "envoyé"}.
                </Typography>
              </Box>
            )}
            {listeAffichee.map((message) => (
              <ListItemButton
                key={message.id}
                selected={messageOuvert?.id === message.id}
                onClick={() => gererOuvrirMessage(message, onglet === 0)}
                sx={{
                  alignItems: "flex-start",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  bgcolor: onglet === 0 && !message.lu ? "primary.50" : "transparent",
                }}
              >
                <Avatar sx={{ width: 34, height: 34, mr: 1.5, mt: 0.25, fontSize: 13 }}>
                  {(onglet === 0 ? message.expediteur_nom : message.destinataire_nom || "?").charAt(0)}
                </Avatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: onglet === 0 && !message.lu ? 700 : 500 }}
                      noWrap
                    >
                      {onglet === 0 ? message.expediteur_nom : message.destinataire_nom}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {message.objet || message.contenu}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {new Date(message.date_envoi).toLocaleString("fr-FR")}
                      </Typography>
                    </>
                  }
                />
                <Tooltip title="Supprimer">
                  <IconButton size="small" onClick={(e) => gererSuppression(e, message.id)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </ListItemButton>
            ))}
          </List>
        </Box>

        <Box sx={{ flexGrow: 1, bgcolor: "background.paper", borderRadius: 2, boxShadow: 1, p: 3, minHeight: 300 }}>
          {!messageOuvert && (
            <Stack alignItems="center" justifyContent="center" sx={{ height: 260 }} spacing={1}>
              <InboxIcon sx={{ fontSize: 40, color: "text.disabled" }} />
              <Typography color="text.secondary">Sélectionnez un message pour l'afficher</Typography>
            </Stack>
          )}
          {messageOuvert && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="h6">{messageOuvert.objet || "(Sans objet)"}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      De <strong>{messageOuvert.expediteur_nom}</strong> à{" "}
                      <strong>{messageOuvert.destinataire_nom}</strong>
                    </Typography>
                    {messageOuvert.lu && (
                      <Chip icon={<MarkEmailReadIcon />} label="Lu" size="small" variant="outlined" />
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.disabled">
                    {new Date(messageOuvert.date_envoi).toLocaleString("fr-FR")}
                  </Typography>
                </Box>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {messageOuvert.contenu}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Dialog open={dialogueOuvert} onClose={() => setDialogueOuvert(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouveau message</DialogTitle>
        <DialogContent>
          {erreurEnvoi && <Alert severity="error" sx={{ mb: 2 }}>{erreurEnvoi}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete
              options={annuaire}
              value={destinataire}
              onChange={(e, valeur) => setDestinataire(valeur)}
              getOptionLabel={(option) => `${option.nom_complet} — ${LIBELLES_ROLES[option.role] || option.role}`}
              isOptionEqualToValue={(option, valeur) => option.id === valeur.id}
              renderInput={(params) => <TextField {...params} label="Destinataire" placeholder="Rechercher un utilisateur" />}
            />
            <TextField
              label="Objet (optionnel)"
              value={objet}
              onChange={(e) => setObjet(e.target.value)}
              fullWidth
            />
            <TextField
              label="Message"
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              multiline
              minRows={4}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogueOuvert(false)}>Annuler</Button>
          <Button variant="contained" onClick={gererEnvoi} disabled={envoiEnCours} startIcon={<SendIcon />}>
            Envoyer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
