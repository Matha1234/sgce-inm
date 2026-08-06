from django.contrib.auth.password_validation import validate_password
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


class UtilisateurAdminSerializer(serializers.ModelSerializer):
    """
    Serializer de gestion des comptes utilisateurs, reserve a
    l'Administrateur (creer, modifier, desactiver un compte - besoin
    utilisateur "Gérer les comptes et les rôles des utilisateurs").

    Le mot de passe est en ecriture seule : obligatoire a la creation,
    optionnel a la mise a jour (laisse le mot de passe inchange si non
    fourni, plutot que d'exiger sa ressaisie a chaque modification).
    """

    password = serializers.CharField(
        write_only=True, required=False, style={"input_type": "password"}
    )
    role_display = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = Utilisateur
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "role", "role_display", "is_active", "date_joined", "password",
        ]
        read_only_fields = ["id", "date_joined", "role_display"]

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError(
                {"password": "Le mot de passe est obligatoire à la création d'un compte."}
            )
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        utilisateur = Utilisateur(**validated_data)
        utilisateur.set_password(password)
        utilisateur.save()
        return utilisateur

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for champ, valeur in validated_data.items():
            setattr(instance, champ, valeur)
        if password:
            instance.set_password(password)
        instance.save()
        return instance