import { Box, Button, Typography } from "@mui/material";
import { Link } from "react-router-dom";

export default function AccesRefusePage() {
  return (
    <Box sx={{ textAlign: "center", mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        Accès refusé
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Votre rôle ne vous permet pas d'accéder à cette page.
      </Typography>
      <Button component={Link} to="/" variant="contained">
        Retour au tableau de bord
      </Button>
    </Box>
  );
}
