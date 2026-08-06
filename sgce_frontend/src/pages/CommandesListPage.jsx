import { useEffect, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Link } from "react-router-dom";

import { listerCommandes } from "../api/commandesApi";
import {
  COULEURS_STATUT_COMMANDE, LIBELLES_NATURE_COMMANDE, LIBELLES_STATUT_COMMANDE,
} from "../constants/roles";

export default function CommandesListPage() {
  const [commandes, setCommandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    listerCommandes()
      .then((d) => setCommandes(Array.isArray(d) ? d : d.results || []))
      .catch(() => setErreur("Impossible de charger les commandes."))
      .finally(() => setChargement(false));
  }, []);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Commandes
        </Typography>
        <Button component={Link} to="/commandes/nouvelle" variant="contained" startIcon={<AddIcon />}>
          Nouvelle commande
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
                <TableCell>Numéro</TableCell>
                <TableCell>Organisme</TableCell>
                <TableCell>Nature</TableCell>
                <TableCell>Atelier</TableCell>
                <TableCell>Délai contractuel</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {commandes.map((commande) => (
                <TableRow key={commande.id} hover>
                  <TableCell>{commande.numero}</TableCell>
                  <TableCell>{commande.organisme_nom}</TableCell>
                  <TableCell>{LIBELLES_NATURE_COMMANDE[commande.nature] || commande.nature}</TableCell>
                  <TableCell>{commande.atelier}</TableCell>
                  <TableCell>{commande.delai_contractuel || "—"}</TableCell>
                  <TableCell>
                    <Chip
                      label={LIBELLES_STATUT_COMMANDE[commande.statut] || commande.statut}
                      color={COULEURS_STATUT_COMMANDE[commande.statut] || "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button component={Link} to={`/commandes/${commande.id}`} size="small">
                      Voir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {commandes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    Aucune commande enregistrée pour le moment.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
