import { useEffect, useState } from "react";
import {
  Alert, Box, Chip, CircularProgress, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography,
} from "@mui/material";

import { listerFactures } from "../api/commandesApi";

const LIBELLES_TYPE = { PROFORMA: "Proforma", DEFINITIVE: "Définitive" };
const COULEURS_TYPE = { PROFORMA: "info", DEFINITIVE: "success" };

export default function FacturesListPage() {
  const [factures, setFactures] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    listerFactures()
      .then((d) => setFactures(Array.isArray(d) ? d : d.results || []))
      .catch(() => setErreur("Impossible de charger les factures."))
      .finally(() => setChargement(false));
  }, []);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Facturation
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
                <TableCell>N° Facture</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Montant</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {factures.map((facture) => (
                <TableRow key={facture.id} hover>
                  <TableCell>{facture.numero_facture}</TableCell>
                  <TableCell>
                    <Chip
                      label={LIBELLES_TYPE[facture.type_facture] || facture.type_facture}
                      color={COULEURS_TYPE[facture.type_facture] || "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">{facture.montant} Ar</TableCell>
                  <TableCell>{new Date(facture.date_facture).toLocaleDateString("fr-FR")}</TableCell>
                </TableRow>
              ))}
              {factures.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    Aucune facture émise pour le moment.
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
