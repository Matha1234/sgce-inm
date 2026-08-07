import { useEffect, useState } from "react";
import {
  Alert, Box, Card, CardContent, Chip, CircularProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography,
} from "@mui/material";

import { listerControles, recupererTableauBordRentabilite } from "../api/controleApi";
import { COULEURS_RESULTAT_CONTROLE, LIBELLES_RESULTAT_CONTROLE } from "../constants/roles";

function CarteChiffre({ titre, valeur, couleur = "primary.main" }) {
  return (
    <Card sx={{ minWidth: 200, flex: "1 1 200px" }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {titre}
        </Typography>
        <Typography variant="h3" sx={{ color: couleur, fontWeight: 700 }}>
          {valeur}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function ControlesListPage() {
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [controles, setControles] = useState([]);
  const [indicateurs, setIndicateurs] = useState(null);

  useEffect(() => {
    async function charger() {
      setChargement(true);
      setErreur("");
      try {
        const [listeControles, tableauBord] = await Promise.all([
          listerControles(),
          recupererTableauBordRentabilite(),
        ]);
        setControles(Array.isArray(listeControles) ? listeControles : listeControles.results || []);
        setIndicateurs(tableauBord);
      } catch {
        setErreur("Impossible de charger les données de rentabilité.");
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, []);

  if (chargement) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Contrôle du prix de revient et rentabilité
      </Typography>

      {erreur && <Alert severity="warning" sx={{ mb: 2 }}>{erreur}</Alert>}

      {indicateurs && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 4 }}>
          <CarteChiffre titre="Dossiers contrôlés" valeur={indicateurs.nombre_controles} />
          <CarteChiffre
            titre="Bénéficiaires"
            valeur={indicateurs.nombre_beneficiaires}
            couleur="success.main"
          />
          <CarteChiffre
            titre="Déficitaires"
            valeur={indicateurs.nombre_deficitaires}
            couleur="error.main"
          />
          <CarteChiffre
            titre="Écarts significatifs"
            valeur={indicateurs.nombre_ecarts_significatifs}
            couleur="warning.main"
          />
          <CarteChiffre
            titre="Marge moyenne"
            valeur={`${indicateurs.marge_moyenne_pourcentage}%`}
          />
        </Box>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Fiches de contrôle
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Dossier</TableCell>
                  <TableCell>Atelier</TableCell>
                  <TableCell align="right">Coût réel</TableCell>
                  <TableCell align="right">Marge réelle</TableCell>
                  <TableCell>Résultat</TableCell>
                  <TableCell>Écart</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {controles.map((controle) => (
                  <TableRow key={controle.id}>
                    <TableCell>{controle.dossier_numero}</TableCell>
                    <TableCell>{controle.atelier_nom}</TableCell>
                    <TableCell align="right">{controle.cout_reel_total} Ar</TableCell>
                    <TableCell align="right">{controle.marge_reelle_pourcentage}%</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={LIBELLES_RESULTAT_CONTROLE[controle.resultat] || controle.resultat}
                        color={COULEURS_RESULTAT_CONTROLE[controle.resultat] || "default"}
                      />
                    </TableCell>
                    <TableCell>
                      {controle.ecart_significatif && (
                        <Chip size="small" label="Significatif" color="warning" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>{new Date(controle.date_controle).toLocaleDateString("fr-FR")}</TableCell>
                  </TableRow>
                ))}
                {controles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography color="text.secondary" sx={{ py: 2 }}>
                        Aucun contrôle de prix de revient enregistré pour le moment.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
