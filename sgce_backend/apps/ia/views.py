from rest_framework.response import Response
from rest_framework.views import APIView

from apps.utilisateurs.permissions import IsAdmin, IsAgentSDO

from .ml.estimation_service import entrainer_modele, predire_cout
from .serializers import EstimationInputSerializer


class EstimerCoutView(APIView):
    """
    POST /api/ia/estimer/
    Retourne une estimation du prix de revient et de la duree de production
    pour un type de document, une quantite et un atelier donnes.
    Reserve a l'Agent SDO (et l'Administrateur).
    """

    permission_classes = [IsAgentSDO]

    def post(self, request):
        serializer = EstimationInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resultat = predire_cout(**serializer.validated_data)
        return Response(resultat)


class EntrainerModeleView(APIView):
    """
    POST /api/ia/entrainer/
    Relance l'entrainement du modele XGBoost sur l'historique disponible.
    Reserve a l'Administrateur (operation ponctuelle, pas destinee a un usage frequent).
    """

    permission_classes = [IsAdmin]

    def post(self, request):
        resultat = entrainer_modele()
        return Response(resultat)