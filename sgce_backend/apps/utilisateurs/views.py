from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated

from .models import Utilisateur
from .permissions import IsAdmin
from .serializers import UtilisateurAdminSerializer, UtilisateurSerializer


class MeView(RetrieveAPIView):
    """
    GET /api/auth/me/
    Retourne les informations de l'utilisateur actuellement connecte
    (a partir du token JWT envoye dans l'en-tete Authorization).
    """

    serializer_class = UtilisateurSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UtilisateurListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/utilisateurs/  - liste tous les comptes (Administrateur uniquement)
    POST /api/utilisateurs/  - cree un nouveau compte (Administrateur uniquement)
    """

    queryset = Utilisateur.objects.all().order_by("username")
    serializer_class = UtilisateurAdminSerializer
    permission_classes = [IsAdmin]


class UtilisateurDetailView(generics.RetrieveUpdateAPIView):
    """
    GET/PATCH/PUT /api/utilisateurs/<id>/ (Administrateur uniquement)

    La "suppression" d'un compte se fait par desactivation (is_active=False)
    plutot que par suppression definitive, afin de conserver l'historique
    des objets rattaches (commandes creees, devis valides, atelier dirige...).

    Garde-fou : un Administrateur ne peut pas desactiver son propre compte
    (evite de perdre accidentellement tout acces administrateur).
    """

    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurAdminSerializer
    permission_classes = [IsAdmin]

    def perform_update(self, serializer):
        instance = self.get_object()
        desactivation_de_soi = (
            instance.pk == self.request.user.pk
            and serializer.validated_data.get("is_active") is False
        )
        if desactivation_de_soi:
            raise PermissionDenied("Vous ne pouvez pas désactiver votre propre compte.")
        serializer.save()