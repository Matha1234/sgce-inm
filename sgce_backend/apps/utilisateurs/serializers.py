from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Utilisateur


class UtilisateurSerializer(serializers.ModelSerializer):
    """
    Serializer utilise par /api/auth/me/, en lecture (GET) et en mise a jour
    de son propre profil (PATCH : prenom, nom, email, photo uniquement).
    Le role, le statut actif et l'identifiant ne sont jamais modifiables par
    l'utilisateur lui-meme (RG14/RG20 : seul l'Administrateur gere les roles).
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
            "photo",
        ]
        read_only_fields = ["id", "username", "date_joined", "role_display", "role", "is_active"]


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
            "role", "role_display", "is_active", "date_joined", "password", "photo",
        ]
        read_only_fields = ["id", "date_joined", "role_display", "photo"]

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