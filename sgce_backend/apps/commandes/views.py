from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from apps.utilisateurs.permissions import IsAgentSDO, IsChefAtelier, IsMagasinier

from .models import (
    Article,
    Atelier,
    Commande,
    Devis,
    DossierFabrication,
    EtapeProduction,
    MouvementStock,
    OrganismeClient,
)
from .serializers import (
    ArticleSerializer,
    AtelierSerializer,
    CommandeSerializer,
    DevisSerializer,
    DossierFabricationSerializer,
    EtapeProductionSerializer,
    MouvementStockSerializer,
    OrganismeClientSerializer,
)


# ------------------------------------------------------------------
# Organismes / Commandes / Devis
# ------------------------------------------------------------------

class OrganismeClientListCreateView(generics.ListCreateAPIView):
    """Liste et creation des organismes clients - reserve a l'Agent SDO / Admin."""

    queryset = OrganismeClient.objects.all().order_by("nom")
    serializer_class = OrganismeClientSerializer
    permission_classes = [IsAgentSDO]


class CommandeListCreateView(generics.ListCreateAPIView):
    """
    Liste des commandes : accessible a tout utilisateur authentifie.
    Creation : reservee a l'Agent SDO (et l'Administrateur).
    """

    queryset = Commande.objects.select_related("organisme", "devis").all()
    serializer_class = CommandeSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAgentSDO()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(cree_par=self.request.user)


class CommandeDetailView(generics.RetrieveUpdateAPIView):
    """Consultation et mise a jour d'une commande donnee."""

    queryset = Commande.objects.select_related("organisme", "devis").all()
    serializer_class = CommandeSerializer
    permission_classes = [IsAuthenticated]


class DevisCreateView(generics.CreateAPIView):
    """
    Creation du devis d'une commande - reservee a l'Agent SDO (RG16).
    Calcule automatiquement une estimation intelligente des couts (RG4).
    """

    queryset = Devis.objects.all()
    serializer_class = DevisSerializer
    permission_classes = [IsAgentSDO]

    def perform_create(self, serializer):
        devis = serializer.save()

        from apps.ia.ml.estimation_service import predire_cout
        from apps.ia.models import EstimationIA

        resultat = predire_cout(
            type_document=devis.commande.type_document,
            quantite=devis.commande.quantite,
            atelier=devis.commande.atelier,
        )
        EstimationIA.objects.update_or_create(
            devis=devis,
            defaults={
                "prix_predit": resultat["prix_predit"],
                "duree_predite": resultat["duree_predite"],
                "version_modele": resultat["version_modele"],
            },
        )


class DevisDetailView(generics.RetrieveUpdateAPIView):
    """
    Consultation et validation d'un devis - reservee a l'Agent SDO (RG16).
    La validation fait passer la commande associee au statut VALIDEE (RG5).
    """

    queryset = Devis.objects.select_related("commande").all()
    serializer_class = DevisSerializer
    permission_classes = [IsAgentSDO]

    def perform_update(self, serializer):
        devis = serializer.save()
        if devis.valide:
            if not devis.valide_par:
                devis.valide_par = self.request.user
                devis.save(update_fields=["valide_par"])
            Commande.objects.filter(pk=devis.commande_id).update(statut=Commande.Statut.VALIDEE)


# ------------------------------------------------------------------
# Ateliers / Dossiers de fabrication / Etapes de production
# ------------------------------------------------------------------

class AtelierListView(generics.ListAPIView):
    """Liste des ateliers de reference (SPA, SPB)."""

    queryset = Atelier.objects.all()
    serializer_class = AtelierSerializer
    permission_classes = [IsAuthenticated]


class DossierFabricationListCreateView(generics.ListCreateAPIView):
    """
    Liste des dossiers de fabrication. Un Chef d'atelier ne voit que les
    dossiers de l'atelier qu'il dirige. Creation reservee a l'Agent SDO.
    """

    queryset = DossierFabrication.objects.select_related("commande", "atelier").prefetch_related("etapes")
    serializer_class = DossierFabricationSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAgentSDO()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if getattr(user, "role", None) == "CHEF_ATELIER":
            qs = qs.filter(atelier__chef_atelier=user)
        return qs


class DossierFabricationDetailView(generics.RetrieveUpdateAPIView):
    """Seul le Chef d'atelier de l'atelier concerne (ou l'Admin) peut modifier le statut (RG17)."""

    queryset = DossierFabrication.objects.select_related("commande", "atelier").prefetch_related("etapes")
    serializer_class = DossierFabricationSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        dossier = self.get_object()
        user = self.request.user
        est_admin = getattr(user, "role", None) == "ADMIN"
        est_chef_du_bon_atelier = dossier.atelier.chef_atelier_id == user.id

        if not (est_admin or est_chef_du_bon_atelier):
            raise PermissionDenied(
                "Seul le chef de cet atelier (ou l'Administrateur) peut modifier ce dossier (RG17)."
            )
        serializer.save()


class EtapeProductionListCreateView(generics.ListCreateAPIView):
    queryset = EtapeProduction.objects.select_related("dossier").all()
    serializer_class = EtapeProductionSerializer
    permission_classes = [IsChefAtelier]


class EtapeProductionDetailView(generics.RetrieveUpdateAPIView):
    queryset = EtapeProduction.objects.select_related("dossier").all()
    serializer_class = EtapeProductionSerializer
    permission_classes = [IsChefAtelier]


# ------------------------------------------------------------------
# Stock : Articles et mouvements
# ------------------------------------------------------------------

class ArticleListCreateView(generics.ListCreateAPIView):
    """Liste et creation des articles de stock - reservees au Magasinier (et Admin)."""

    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [IsMagasinier]


class ArticleDetailView(generics.RetrieveUpdateAPIView):
    """
    Consultation et mise a jour d'un article. La quantite en stock reste
    en lecture seule ici (cf. ArticleSerializer) : elle ne change que via
    la creation d'un MouvementStock, pour garantir la tracabilite.
    """

    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [IsMagasinier]


class MouvementStockListCreateView(generics.ListCreateAPIView):
    """
    Liste et creation des mouvements de stock - reservees au Magasinier
    (et Admin). La verification de disponibilite (RG11) est faite dans le
    serializer, avec une seconde protection atomique au niveau du modele.
    """

    queryset = MouvementStock.objects.select_related("article", "dossier").all()
    serializer_class = MouvementStockSerializer
    permission_classes = [IsMagasinier]

    def perform_create(self, serializer):
        serializer.save(valide_par=self.request.user)