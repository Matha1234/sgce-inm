from rest_framework import serializers

from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    expediteur_nom = serializers.SerializerMethodField()
    destinataire_nom = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id", "expediteur", "expediteur_nom", "destinataire", "destinataire_nom",
            "objet", "contenu", "date_envoi", "lu",
        ]
        read_only_fields = ["id", "expediteur", "date_envoi", "lu"]

    def get_expediteur_nom(self, obj):
        return self._nom_complet(obj.expediteur)

    def get_destinataire_nom(self, obj):
        return self._nom_complet(obj.destinataire)

    @staticmethod
    def _nom_complet(utilisateur):
        complet = f"{utilisateur.first_name} {utilisateur.last_name}".strip()
        return complet or utilisateur.username

    def validate_destinataire(self, destinataire):
        request = self.context.get("request")
        if request and request.user.is_authenticated and destinataire.pk == request.user.pk:
            raise serializers.ValidationError("Vous ne pouvez pas vous envoyer un message à vous-même.")
        return destinataire
