from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated

from .serializers import UtilisateurSerializer


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