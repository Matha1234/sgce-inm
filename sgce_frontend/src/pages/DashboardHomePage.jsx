import { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, CircularProgress, Alert } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useSelector } from "react-redux";

import { listerCommandes, listerDossiers, listerArticles } from "../api/commandesApi";
import { LIBELLES_STATUT_COMMANDE } from "../constants/roles";

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

export default function DashboardHomePage() {
  const { utilisateur } = useSelector((state) => state.auth);
  const role = utilisateur?.role;

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [commandes, setCommandes] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    async function charger() {
      setChargement(true);
      setErreur("");
      try {
        const taches = [];
        if (role === "ADMIN" || role === "AGENT_SDO") {
          taches.push(listerCommandes().then((d) => setCommandes(normaliser(d))));
        }
        if (role === "ADMIN" || role === "CHEF_ATELIER") {
          taches.push(listerDossiers().then((d) => setDossiers(normaliser(d))));
        }
        if (role === "ADMIN" || role === "MAGASINIER") {
          taches.push(listerArticles().then((d) => setArticles(normaliser(d))));
        }
        await Promise.all(taches);
      } catch {
        setErreur("Impossible de charger les données du tableau de bord.");
      } finally {
        setChargement(false);
      }
    }
    if (role) charger();
  }, [role]);

  const normaliser = (d) => (Array.isArray(d) ? d : d.results || []);

  if (chargement) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const donneesGraphique = Object.entries(LIBELLES_STATUT_COMMANDE).map(([code, libelle]) => ({
    statut: libelle,
    nombre: commandes.filter((c) => c.statut === code).length,
  }));

  const articlesEnAlerte = articles.filter(
    (a) => Number(a.quantite_stock) <= Number(a.seuil_securite)
  );

  const dossiersEnCours = dossiers.filter((d) => d.statut_production === "EN_COURS");

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Tableau de bord
      </Typography>

      {erreur && <Alert severity="warning" sx={{ mb: 2 }}>{erreur}</Alert>}

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 4 }}>
        {(role === "ADMIN" || role === "AGENT_SDO") && (
          <>
            <CarteChiffre titre="Commandes au total" valeur={commandes.length} />
            <CarteChiffre
              titre="En attente de devis"
              valeur={commandes.filter((c) => c.statut === "EN_ATTENTE" || c.statut === "DEVIS").length}
              couleur="warning.main"
            />
            <CarteChiffre
              titre="Validées"
              valeur={commandes.filter((c) => c.statut === "VALIDEE").length}
              couleur="success.main"
            />
          </>
        )}
        {(role === "ADMIN" || role === "CHEF_ATELIER") && (
          <>
            <CarteChiffre titre="Dossiers de fabrication" valeur={dossiers.length} />
            <CarteChiffre titre="En cours de production" valeur={dossiersEnCours.length} couleur="warning.main" />
          </>
        )}
        {(role === "ADMIN" || role === "MAGASINIER") && (
          <CarteChiffre
            titre="Articles en alerte de stock"
            valeur={articlesEnAlerte.length}
            couleur={articlesEnAlerte.length > 0 ? "error.main" : "success.main"}
          />
        )}
      </Box>

      {(role === "ADMIN" || role === "AGENT_SDO") && commandes.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Répartition des commandes par statut
            </Typography>
            <Box sx={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={donneesGraphique}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="statut" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="nombre" fill="#1565c0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
