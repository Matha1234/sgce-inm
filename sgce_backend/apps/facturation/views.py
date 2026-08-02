from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from apps.commandes.models import Commande
from apps.utilisateurs.permissions import IsAgentSDO

from .models import Facture
from .serializers import FactureSerializer


class FactureListCreateView(generics.ListCreateAPIView):
    """
    Liste et creation des factures - reservees a l'Agent SDO (et l'Admin),
    en l'absence pour l'instant d'un role dedie Comptable/Financier.
    A la creation d'une facture definitive, la commande associee passe
    automatiquement au statut LIVREE.
    """

    queryset = Facture.objects.select_related("dossier", "dossier__commande").all()
    serializer_class = FactureSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAgentSDO()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        facture = serializer.save(emise_par=self.request.user)
        if facture.type_facture == Facture.TypeFacture.DEFINITIVE:
            Commande.objects.filter(pk=facture.dossier.commande_id).update(
                statut=Commande.Statut.LIVREE
            )


class FactureDetailView(generics.RetrieveAPIView):
    """Consultation d'une facture. Les factures ne sont pas modifiables une fois emises."""

    queryset = Facture.objects.select_related("dossier", "dossier__commande").all()
    serializer_class = FactureSerializer
    permission_classes = [IsAuthenticated]