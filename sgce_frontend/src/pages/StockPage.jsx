import { useEffect, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
  Typography,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useSelector } from "react-redux";

import { creerMouvement, listerArticles } from "../api/commandesApi";

export default function StockPage() {
  const { utilisateur } = useSelector((state) => state.auth);
  const peutGererStock = utilisateur?.role === "ADMIN" || utilisateur?.role === "MAGASINIER";

  const [articles, setArticles] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [dialogueOuvert, setDialogueOuvert] = useState(false);
  const [articleSelectionne, setArticleSelectionne] = useState(null);
  const [typeMouvement, setTypeMouvement] = useState("ENTREE");
  const [quantiteMouvement, setQuantiteMouvement] = useState("");
  const [enCours, setEnCours] = useState(false);

  const charger = () => {
    setChargement(true);
    listerArticles()
      .then((d) => setArticles(Array.isArray(d) ? d : d.results || []))
      .catch(() => setErreur("Impossible de charger le stock."))
      .finally(() => setChargement(false));
  };

  useEffect(charger, []);

  const ouvrirDialogue = (article) => {
    setArticleSelectionne(article);
    setTypeMouvement("ENTREE");
    setQuantiteMouvement("");
    setDialogueOuvert(true);
  };

  const gererMouvement = async () => {
    if (!quantiteMouvement || Number(quantiteMouvement) <= 0) return;
    setEnCours(true);
    setErreur("");
    try {
      await creerMouvement({
        article: articleSelectionne.id,
        type_mouvement: typeMouvement,
        quantite: Number(quantiteMouvement),
      });
      setDialogueOuvert(false);
      charger();
    } catch (err) {
      const donnees = err.response?.data;
      setErreur(donnees ? JSON.stringify(donnees) : "Impossible d'enregistrer ce mouvement.");
    } finally {
      setEnCours(false);
    }
  };

  const articlesEnAlerte = articles.filter(
    (a) => Number(a.quantite_stock) <= Number(a.seuil_securite)
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Stock
      </Typography>

      {erreur && <Alert severity="error" sx={{ mb: 2 }}>{erreur}</Alert>}

      {articlesEnAlerte.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: "error.lighter", borderLeft: 4, borderColor: "error.main" }}>
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <WarningAmberIcon color="error" />
            <Typography color="error.dark">
              {articlesEnAlerte.length} article(s) sous le seuil de stock de sécurité :{" "}
              {articlesEnAlerte.map((a) => a.designation_generique).join(", ")}
            </Typography>
          </CardContent>
        </Card>
      )}

      {chargement ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Désignation générique</TableCell>
                <TableCell>Classe comptable</TableCell>
                <TableCell align="right">Stock actuel</TableCell>
                <TableCell align="right">Seuil de sécurité</TableCell>
                <TableCell>État</TableCell>
                {peutGererStock && <TableCell align="right">Action</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {articles.map((article) => {
                const enAlerte = Number(article.quantite_stock) <= Number(article.seuil_securite);
                return (
                  <TableRow key={article.id} hover>
                    <TableCell>{article.designation_generique}</TableCell>
                    <TableCell>{article.classe_comptable}</TableCell>
                    <TableCell align="right">{article.quantite_stock}</TableCell>
                    <TableCell align="right">{article.seuil_securite}</TableCell>
                    <TableCell>
                      <Chip
                        label={enAlerte ? "Stock bas" : "Normal"}
                        color={enAlerte ? "error" : "success"}
                        size="small"
                      />
                    </TableCell>
                    {peutGererStock && (
                      <TableCell align="right">
                        <Button size="small" onClick={() => ouvrirDialogue(article)}>
                          Mouvement
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {articles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={peutGererStock ? 6 : 5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    Aucun article enregistré.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogueOuvert} onClose={() => setDialogueOuvert(false)} fullWidth maxWidth="xs">
        <DialogTitle>Mouvement de stock — {articleSelectionne?.designation_generique}</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Type de mouvement"
            fullWidth
            margin="normal"
            value={typeMouvement}
            onChange={(e) => setTypeMouvement(e.target.value)}
          >
            <MenuItem value="ENTREE">Entrée (approvisionnement)</MenuItem>
            <MenuItem value="SORTIE">Sortie (consommation production)</MenuItem>
          </TextField>
          <TextField
            label="Quantité"
            type="number"
            fullWidth
            margin="normal"
            value={quantiteMouvement}
            onChange={(e) => setQuantiteMouvement(e.target.value)}
            slotProps={{ htmlInput: { min: 1 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogueOuvert(false)}>Annuler</Button>
          <Button variant="contained" onClick={gererMouvement} disabled={enCours}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
