from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Utilisateur
from .permissions import IsAdmin
from .serializers import UtilisateurAdminSerializer, UtilisateurAnnuaireSerializer, UtilisateurSerializer


class MeView(RetrieveUpdateAPIView):
    """
    GET   /api/auth/me/ - informations de l'utilisateur connecte (a partir du
          token JWT envoye dans l'en-tete Authorization).
    PATCH /api/auth/me/ - mise a jour de son propre profil : prenom, nom,
          email et photo uniquement (le role et le statut actif restent
          reserves a l'Administrateur, cf. UtilisateurSerializer).
    """

    serializer_class = UtilisateurSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user


class AnnuaireView(generics.ListAPIView):
    """
    GET /api/utilisateurs/annuaire/
    Annuaire interne minimal (id, nom complet, rôle), accessible à tout
    utilisateur connecté afin de choisir un destinataire pour un message.
    """

    queryset = Utilisateur.objects.filter(is_active=True).order_by("first_name", "last_name")
    serializer_class = UtilisateurAnnuaireSerializer
    permission_classes = [IsAuthenticated]


class ChangerMotDePasseView(APIView):
    """
    POST /api/auth/changer-mot-de-passe/
    Corps attendu : { "ancien_mot_de_passe": "...", "nouveau_mot_de_passe": "..." }
    Permet à l'utilisateur connecté de changer lui-même son mot de passe.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        ancien = request.data.get("ancien_mot_de_passe", "")
        nouveau = request.data.get("nouveau_mot_de_passe", "")
        utilisateur = request.user

        if not utilisateur.check_password(ancien):
            return Response(
                {"ancien_mot_de_passe": "Le mot de passe actuel est incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            validate_password(nouveau, user=utilisateur)
        except DjangoValidationError as erreur:
            return Response({"nouveau_mot_de_passe": erreur.messages}, status=status.HTTP_400_BAD_REQUEST)

        utilisateur.set_password(nouveau)
        utilisateur.save(update_fields=["password"])
        return Response({"detail": "Mot de passe modifié avec succès."}, status=status.HTTP_200_OK)


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