from django.conf import settings
from django.db import models


class Notification(models.Model):
    """
    Notification envoyee a un utilisateur (RG18 : une notification est
    envoyee a chaque changement de statut d'un dossier - etendu ici aux
    commandes et etapes de production pour couvrir tout le cycle de vie).
    """

    class Categorie(models.TextChoices):
        COMMANDE = "COMMANDE", "Commande"
        DOSSIER = "DOSSIER", "Dossier de fabrication"
        ETAPE = "ETAPE", "Étape de production"
        STOCK = "STOCK", "Stock"

    destinataire = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    categorie = models.CharField(max_length=20, choices=Categorie.choices)
    message = models.CharField(max_length=255)
    reference_objet_id = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Identifiant de l'objet concerné (commande, dossier, étape…), pour lien direct côté frontend.",
    )
    lue = models.BooleanField(default=False)
    date_envoi = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-date_envoi"]

    def __str__(self):
        return f"[{self.get_categorie_display()}] {self.message} → {self.destinataire}"
