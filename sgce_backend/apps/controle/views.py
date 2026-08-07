from django.db.models import Avg
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.utilisateurs.permissions import IsAdmin, IsChefAtelier

from .models import ControlePrixRevient
from .serializers import ControlePrixRevientSerializer, TableauBordRentabiliteSerializer


class ControlePrixRevientListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/controles/            -> liste des fiches de contrôle
    GET  /api/controles/?dossier=ID -> fiche(s) d'un dossier donné (0 ou 1)
    POST /api/controles/            -> création, réservée au Chef d'atelier (et à l'Admin) (PR-08)
    """

    serializer_class = ControlePrixRevientSerializer

    def get_queryset(self):
        queryset = ControlePrixRevient.objects.select_related(
            "dossier", "dossier__atelier", "dossier__commande", "dossier__commande__devis"
        ).all()
        dossier_id = self.request.query_params.get("dossier")
        if dossier_id:
            queryset = queryset.filter(dossier_id=dossier_id)
        return queryset

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsChefAtelier()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(controle_par=self.request.user)


class ControlePrixRevientDetailView(generics.RetrieveAPIView):
    """Consultation d'une fiche de contrôle du prix de revient. Non modifiable après création."""

    queryset = ControlePrixRevient.objects.select_related(
        "dossier", "dossier__atelier", "dossier__commande", "dossier__commande__devis"
    ).all()
    serializer_class = ControlePrixRevientSerializer
    permission_classes = [IsAuthenticated]


class TableauBordRentabiliteView(APIView):
    """
    GET /api/controles/tableau-bord/
    Indicateurs synthétiques de rentabilité pour la Direction (EF-7.1, PR-10).
    Réservé à l'Administrateur.
    """

    permission_classes = [IsAdmin]

    def get(self, request):
        queryset = ControlePrixRevient.objects.all()
        agregats = queryset.aggregate(marge_moyenne=Avg("marge_reelle_pourcentage"))

        donnees = {
            "nombre_controles": queryset.count(),
            "nombre_beneficiaires": queryset.filter(
                resultat=ControlePrixRevient.Resultat.BENEFICIAIRE
            ).count(),
            "nombre_deficitaires": queryset.filter(
                resultat=ControlePrixRevient.Resultat.DEFICITAIRE
            ).count(),
            "nombre_a_l_equilibre": queryset.filter(
                resultat=ControlePrixRevient.Resultat.EQUILIBRE
            ).count(),
            "nombre_ecarts_significatifs": queryset.filter(ecart_significatif=True).count(),
            "marge_moyenne_pourcentage": agregats["marge_moyenne"] or 0,
        }
        serializer = TableauBordRentabiliteSerializer(donnees)
        return Response(serializer.data)
