from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    categorie_libelle = serializers.CharField(source="get_categorie_display", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id", "categorie", "categorie_libelle", "message",
            "reference_objet_id", "lue", "date_envoi",
        ]
        read_only_fields = ["categorie", "message", "reference_objet_id", "date_envoi"]
