import { useEffect, useState } from "react";
import {
  Alert, Box, Chip, CircularProgress, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography, Button,
} from "@mui/material";
import { Link } from "react-router-dom";

import { listerDossiers } from "../api/commandesApi";
import { LIBELLES_STATUT_PRODUCTION } from "../constants/roles";

const COULEURS_STATUT_PRODUCTION = {
  CREE: "default",
  EN_COURS: "warning",
  TERMINE: "success",
};

export default function DossiersListPage() {
  const [dossiers, setDossiers] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    listerDossiers()
      .then((d) => setDossiers(Array.isArray(d) ? d : d.results || []))
      .catch(() => setErreur("Impossible de charger les dossiers de fabrication."))
      .finally(() => setChargement(false));
  }, []);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Production
      </Typography>

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
                <TableCell>N° Dossier</TableCell>
                <TableCell>Commande</TableCell>
                <TableCell>Atelier</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Créé le</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dossiers.map((dossier) => (
                <TableRow key={dossier.id} hover>
                  <TableCell>{dossier.numero_dossier}</TableCell>
                  <TableCell>{dossier.commande_numero}</TableCell>
                  <TableCell>{dossier.atelier_nom}</TableCell>
                  <TableCell>
                    <Chip
                      label={LIBELLES_STATUT_PRODUCTION[dossier.statut_production] || dossier.statut_production}
                      color={COULEURS_STATUT_PRODUCTION[dossier.statut_production] || "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(dossier.date_creation).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell align="right">
                    <Button component={Link} to={`/dossiers/${dossier.id}`} size="small">
                      Voir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {dossiers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    Aucun dossier de fabrication pour le moment.
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
