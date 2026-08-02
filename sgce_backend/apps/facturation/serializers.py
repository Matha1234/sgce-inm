from rest_framework import serializers

from apps.commandes.models import DossierFabrication

from .models import Facture


class FactureSerializer(serializers.ModelSerializer):
    dossier_numero = serializers.CharField(source="dossier.numero_dossier", read_only=True)
    commande_numero = serializers.CharField(source="dossier.commande.numero", read_only=True)

    class Meta:
        model = Facture
        fields = [
            "id", "dossier", "dossier_numero", "commande_numero",
            "numero_facture", "type_facture", "montant", "date_facture", "emise_par",
        ]
        read_only_fields = ["numero_facture", "date_facture", "emise_par"]

    def validate(self, attrs):
        """RG13 : la facture definitive ne peut etre emise qu'apres la fin de la production."""
        dossier = attrs.get("dossier") or getattr(self.instance, "dossier", None)
        type_facture = attrs.get("type_facture", getattr(self.instance, "type_facture", None))

        if (
            dossier
            and type_facture == Facture.TypeFacture.DEFINITIVE
            and dossier.statut_production != DossierFabrication.Statut.TERMINE
        ):
            raise serializers.ValidationError(
                {
                    "type_facture": (
                        "Une facture définitive ne peut être émise qu'après "
                        "validation complète de la production (RG13)."
                    )
                }
            )
        return attrs