from rest_framework import serializers

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


class OrganismeClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganismeClient
        fields = ["id", "nom", "type", "adresse"]


class EstimationIAResumeSerializer(serializers.Serializer):
    """Resume en lecture seule de l'estimation IA liee a un devis."""

    prix_predit = serializers.DecimalField(max_digits=12, decimal_places=2)
    duree_predite = serializers.IntegerField()
    version_modele = serializers.CharField()


class DevisSerializer(serializers.ModelSerializer):
    estimation_ia = serializers.SerializerMethodField()

    class Meta:
        model = Devis
        fields = [
            "id", "commande", "prix_revient", "prix_vente", "duree_production",
            "date_devis", "valide", "valide_par", "estimation_ia",
        ]
        read_only_fields = ["date_devis", "valide_par", "estimation_ia"]

    def get_estimation_ia(self, obj):
        estimation = getattr(obj, "estimation_ia", None)
        if estimation is None:
            return None
        return EstimationIAResumeSerializer(estimation).data


class CommandeSerializer(serializers.ModelSerializer):
    organisme_nom = serializers.CharField(source="organisme.nom", read_only=True)
    devis = DevisSerializer(read_only=True)
    a_un_dossier = serializers.SerializerMethodField()

    class Meta:
        model = Commande
        fields = [
            "id", "numero", "date_commande", "statut", "delai_contractuel",
            "type_document", "quantite", "atelier", "est_fictif",
            "organisme", "organisme_nom", "cree_par", "devis", "a_un_dossier",
        ]
        read_only_fields = ["numero", "date_commande", "cree_par", "est_fictif"]

    def get_a_un_dossier(self, obj):
        return hasattr(obj, "dossier_fabrication")

    def validate(self, attrs):
        """RG19 : delai contractuel obligatoire si l'organisme n'est pas un particulier."""
        organisme = attrs.get("organisme") or getattr(self.instance, "organisme", None)
        delai = attrs.get(
            "delai_contractuel",
            getattr(self.instance, "delai_contractuel", None),
        )
        if (
            organisme
            and organisme.type != OrganismeClient.TypeOrganisme.PARTICULIER
            and not delai
        ):
            raise serializers.ValidationError(
                {
                    "delai_contractuel": (
                        "Le délai contractuel est obligatoire pour une "
                        "commande étatique (RG19)."
                    )
                }
            )
        return attrs


class AtelierSerializer(serializers.ModelSerializer):
    chef_atelier_nom = serializers.CharField(
        source="chef_atelier.get_full_name", read_only=True, default=None
    )

    class Meta:
        model = Atelier
        fields = ["id", "nom", "chef_atelier", "chef_atelier_nom"]


class EtapeProductionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EtapeProduction
        fields = ["id", "dossier", "libelle", "statut", "date_debut", "date_fin"]


class DossierFabricationSerializer(serializers.ModelSerializer):
    atelier_nom = serializers.CharField(source="atelier.get_nom_display", read_only=True)
    commande_numero = serializers.CharField(source="commande.numero", read_only=True)
    etapes = EtapeProductionSerializer(many=True, read_only=True)

    class Meta:
        model = DossierFabrication
        fields = [
            "id", "commande", "commande_numero", "numero_dossier",
            "atelier", "atelier_nom", "statut_production", "date_creation", "etapes",
        ]
        read_only_fields = ["numero_dossier", "date_creation"]

    def validate(self, attrs):
        """RG5 : dossier cree uniquement pour une commande validee, une seule fois."""
        commande = attrs.get("commande") or getattr(self.instance, "commande", None)
        if commande and self.instance is None:
            if commande.statut != Commande.Statut.VALIDEE:
                raise serializers.ValidationError(
                    {"commande": "Un dossier de fabrication ne peut être créé que pour une commande validée (RG5)."}
                )
            if hasattr(commande, "dossier_fabrication"):
                raise serializers.ValidationError(
                    {"commande": "Cette commande dispose déjà d'un dossier de fabrication (RG5)."}
                )
        return attrs


class ArticleSerializer(serializers.ModelSerializer):
    est_en_alerte = serializers.BooleanField(read_only=True)

    class Meta:
        model = Article
        fields = [
            "id", "designation", "classe_comptable", "type_papier", "type_encre",
            "type_film", "unite", "quantite_stock", "seuil_securite", "est_en_alerte",
        ]
        # La quantite en stock ne doit jamais etre modifiee directement :
        # elle n'evolue que via la creation de MouvementStock, pour garder
        # une tracabilite complete (RG8, RG9, RG10).
        read_only_fields = ["quantite_stock"]


class MouvementStockSerializer(serializers.ModelSerializer):
    article_designation = serializers.CharField(source="article.designation", read_only=True)
    dossier_numero = serializers.CharField(source="dossier.numero_dossier", read_only=True, default=None)

    class Meta:
        model = MouvementStock
        fields = [
            "id", "article", "article_designation", "dossier", "dossier_numero",
            "type_mouvement", "quantite", "date_mouvement", "valide_par",
        ]
        read_only_fields = ["date_mouvement", "valide_par"]

    def validate(self, attrs):
        """
        RG11 : le magasin ne peut valider une sortie que si la quantite en
        stock est suffisante. Verification immediate ici pour un retour 400
        propre ; une seconde verification atomique existe aussi au niveau
        du modele (protection contre les acces concurrents).
        """
        if self.instance is not None:
            raise serializers.ValidationError(
                "Un mouvement de stock ne peut pas être modifié après sa création."
            )

        article = attrs.get("article")
        type_mouvement = attrs.get("type_mouvement")
        quantite = attrs.get("quantite")

        if type_mouvement == MouvementStock.TypeMouvement.SORTIE and article and quantite:
            if article.quantite_stock < quantite:
                raise serializers.ValidationError(
                    {
                        "quantite": (
                            f"Quantité en stock insuffisante pour « {article.designation} » "
                            f"(disponible : {article.quantite_stock} {article.unite}) - RG11."
                        )
                    }
                )
        return attrs