from rest_framework import serializers

from .models import Utilisateur


class UtilisateurSerializer(serializers.ModelSerializer):
    """
    Serializer en lecture des informations d'un utilisateur.
    Utilise notamment par /api/auth/me/.
    Le mot de passe n'est volontairement jamais expose.
    """

    role_display = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = Utilisateur
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "role_display",
            "is_active",
            "date_joined",
        ]
        read_only_fields = ["id", "date_joined", "role_display"]