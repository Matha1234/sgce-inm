from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F
from django.utils import timezone


class OrganismeClient(models.Model):
    """Organisme a l'origine d'une commande (RG1, RG2)."""

    class TypeOrganisme(models.TextChoices):
        MINISTERE = "MINISTERE", "Ministère"
        COLLECTIVITE = "COLLECTIVITE", "Collectivité territoriale"
        ETABLISSEMENT_PUBLIC = "ETABLISSEMENT_PUBLIC", "Établissement public"
        PARTICULIER = "PARTICULIER", "Particulier"

    nom = models.CharField(max_length=100)
    type = models.CharField(max_length=30, choices=TypeOrganisme.choices)
    adresse = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "organismes_clients"
        verbose_name = "Organisme client"
        verbose_name_plural = "Organismes clients"

    def __str__(self):
        return f"{self.nom} ({self.get_type_display()})"


class Commande(models.Model):
    """
    Commande passee par un organisme (RG1). Le delai contractuel est
    obligatoire pour une commande etatique soumise a marche public (RG19).
    """

    class Statut(models.TextChoices):
        EN_ATTENTE = "EN_ATTENTE", "En attente"
        DEVIS = "DEVIS", "Devis en cours"
        VALIDEE = "VALIDEE", "Validée"
        EN_PRODUCTION = "EN_PRODUCTION", "En production"
        LIVREE = "LIVREE", "Livrée"
        ANNULEE = "ANNULEE", "Annulée"

    class TypeDocument(models.TextChoices):
        JOURNAL_OFFICIEL = "JOURNAL_OFFICIEL", "Journal officiel"
        BULLETIN_ANNONCES = "BULLETIN_ANNONCES", "Bulletin d'annonces légales"
        FORMULAIRE_ADMINISTRATIF = "FORMULAIRE_ADMINISTRATIF", "Formulaire administratif"
        CACHET_ADMINISTRATIF = "CACHET_ADMINISTRATIF", "Cachet administratif"
        DOCUMENT_FIDUCIAIRE = "DOCUMENT_FIDUCIAIRE", "Document fiduciaire"
        AUTRE = "AUTRE", "Autre"

    class Atelier(models.TextChoices):
        SPA = "SPA", "Service de Production A"
        SPB = "SPB", "Service de Production B"

    numero = models.CharField(max_length=15, unique=True, blank=True)
    date_commande = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.EN_ATTENTE)
    delai_contractuel = models.DateField(
        null=True, blank=True,
        help_text="Obligatoire pour les commandes étatiques soumises à marché public (RG19).",
    )

    type_document = models.CharField(
        max_length=30, choices=TypeDocument.choices, default=TypeDocument.AUTRE
    )
    quantite = models.PositiveIntegerField(default=1)
    atelier = models.CharField(max_length=5, choices=Atelier.choices, default=Atelier.SPA)

    est_fictif = models.BooleanField(
        default=False,
        help_text="Commande generee artificiellement pour entrainer le modele IA en l'absence d'historique reel.",
    )

    organisme = models.ForeignKey(
        OrganismeClient, on_delete=models.PROTECT, related_name="commandes"
    )
    cree_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name="commandes_creees",
    )

    class Meta:
        db_table = "commandes"
        ordering = ["-date_commande"]

    def __str__(self):
        return f"Commande {self.numero} ({self.get_statut_display()})"

    def clean(self):
        if (
            self.organisme_id
            and self.organisme.type != OrganismeClient.TypeOrganisme.PARTICULIER
            and not self.delai_contractuel
        ):
            raise ValidationError(
                "Le délai contractuel est obligatoire pour une commande étatique (RG19)."
            )

    def save(self, *args, **kwargs):
        if not self.numero:
            annee = timezone.now().year
            compteur = Commande.objects.filter(date_commande__year=annee).count() + 1
            self.numero = f"CMD-{annee}-{compteur:04d}"
        super().save(*args, **kwargs)


class Devis(models.Model):
    """
    Devis associe a une commande (RG3). Seul un Agent SDO peut le valider
    (RG16) - controle applique au niveau des vues/permissions.
    """

    commande = models.OneToOneField(Commande, on_delete=models.CASCADE, related_name="devis")
    prix_revient = models.DecimalField(max_digits=12, decimal_places=2)
    prix_vente = models.DecimalField(max_digits=12, decimal_places=2)
    duree_production = models.PositiveIntegerField(
        default=1, help_text="Durée réelle ou estimée de production, en jours."
    )
    date_devis = models.DateTimeField(auto_now_add=True)
    valide = models.BooleanField(default=False)
    valide_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="devis_valides",
    )

    class Meta:
        db_table = "devis"

    def __str__(self):
        return f"Devis de {self.commande.numero}"


class Atelier(models.Model):
    """Atelier de production (RG6). Reference fixe : SPA et SPB."""

    class Nom(models.TextChoices):
        SPA = "SPA", "Service de Production A"
        SPB = "SPB", "Service de Production B"

    nom = models.CharField(max_length=5, choices=Nom.choices, unique=True)
    chef_atelier = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="ateliers_diriges",
    )

    class Meta:
        db_table = "ateliers"
        verbose_name = "Atelier"
        verbose_name_plural = "Ateliers"

    def __str__(self):
        return self.get_nom_display()


class DossierFabrication(models.Model):
    """Dossier de fabrication (RG5, RG6, RG7)."""

    class Statut(models.TextChoices):
        CREE = "CREE", "Créé"
        EN_COURS = "EN_COURS", "En cours"
        TERMINE = "TERMINE", "Terminé"

    commande = models.OneToOneField(
        Commande, on_delete=models.CASCADE, related_name="dossier_fabrication"
    )
    numero_dossier = models.CharField(max_length=20, unique=True, blank=True)
    atelier = models.ForeignKey(Atelier, on_delete=models.PROTECT, related_name="dossiers")
    statut_production = models.CharField(
        max_length=20, choices=Statut.choices, default=Statut.CREE
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "dossiers_fabrication"
        ordering = ["-date_creation"]

    def __str__(self):
        return f"Dossier {self.numero_dossier} ({self.get_statut_production_display()})"

    def save(self, *args, **kwargs):
        if not self.numero_dossier:
            annee = timezone.now().year
            compteur = DossierFabrication.objects.filter(date_creation__year=annee).count() + 1
            self.numero_dossier = f"DOS-{annee}-{compteur:04d}"
        super().save(*args, **kwargs)


class EtapeProduction(models.Model):
    """Etape de production au sein d'un dossier de fabrication (RG7)."""

    class Statut(models.TextChoices):
        A_FAIRE = "A_FAIRE", "À faire"
        EN_COURS = "EN_COURS", "En cours"
        TERMINEE = "TERMINEE", "Terminée"

    dossier = models.ForeignKey(
        DossierFabrication, on_delete=models.CASCADE, related_name="etapes"
    )
    libelle = models.CharField(max_length=100)
    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.A_FAIRE)
    date_debut = models.DateTimeField(null=True, blank=True)
    date_fin = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "etapes_production"
        ordering = ["id"]

    def __str__(self):
        return f"{self.libelle} - {self.dossier.numero_dossier}"


class Article(models.Model):
    """
    Article de stock (matiere premiere ou fourniture). Conformement aux
    remarques du STI : la designation reste generique et unique au niveau
    de la base (ex. "papier offset"), quelles que soient les declinaisons
    commerciales existantes. Les criteres type_papier/type_encre/type_film
    servent au calcul coherent des couts.
    """

    class ClasseComptable(models.TextChoices):
        CLASSE_2 = "CLASSE_2", "Classe 2 - Immobilisation"
        CLASSE_6 = "CLASSE_6", "Classe 6 - Charge / matière première"

    class TypePapier(models.TextChoices):
        OFFSET = "OFFSET", "Offset"
        DOSSIER = "DOSSIER", "Dossier"
        AUTOCOPIANT = "AUTOCOPIANT", "Autocopiant"
        NON_APPLICABLE = "NON_APPLICABLE", "Non applicable"

    designation = models.CharField(
        max_length=100, unique=True,
        help_text="Désignation générique unique (ex. « papier offset », « encre noire »).",
    )
    classe_comptable = models.CharField(
        max_length=10, choices=ClasseComptable.choices, default=ClasseComptable.CLASSE_6
    )
    type_papier = models.CharField(
        max_length=20, choices=TypePapier.choices, default=TypePapier.NON_APPLICABLE, blank=True
    )
    type_encre = models.CharField(max_length=50, blank=True)
    type_film = models.CharField(max_length=50, blank=True)
    unite = models.CharField(max_length=20, default="unité")

    quantite_stock = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    seuil_securite = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Stock de sécurité : seuil en-dessous duquel une alerte est déclenchée.",
    )

    class Meta:
        db_table = "articles"
        ordering = ["designation"]

    def __str__(self):
        return self.designation

    @property
    def est_en_alerte(self):
        return self.quantite_stock <= self.seuil_securite


class MouvementStock(models.Model):
    """
    Mouvement de stock (entree ou sortie), relie a un dossier de fabrication
    lorsque la sortie est destinee a la production (RG8, RG9, RG10).
    La quantite en stock de l'article est mise a jour de facon atomique a
    la creation du mouvement, avec verification de disponibilite pour une
    sortie (RG11).
    """

    class TypeMouvement(models.TextChoices):
        ENTREE = "ENTREE", "Entrée"
        SORTIE = "SORTIE", "Sortie"

    article = models.ForeignKey(Article, on_delete=models.PROTECT, related_name="mouvements")
    dossier = models.ForeignKey(
        DossierFabrication, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="mouvements_stock",
    )
    type_mouvement = models.CharField(max_length=10, choices=TypeMouvement.choices)
    quantite = models.DecimalField(max_digits=12, decimal_places=2)
    date_mouvement = models.DateTimeField(auto_now_add=True)
    valide_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="mouvements_valides",
    )

    class Meta:
        db_table = "mouvements_stock"
        ordering = ["-date_mouvement"]

    def __str__(self):
        return f"{self.get_type_mouvement_display()} {self.quantite} {self.article.unite} - {self.article.designation}"

    def save(self, *args, **kwargs):
        est_nouveau = self._state.adding
        super().save(*args, **kwargs)

        if not est_nouveau:
            return

        if self.type_mouvement == self.TypeMouvement.SORTIE:
            # Mise a jour atomique et verification de disponibilite (RG11) :
            # ne decremente que si le stock est encore suffisant au moment
            # de l'ecriture, protegeant contre les acces concurrents.
            nb_lignes_maj = Article.objects.filter(
                pk=self.article_id, quantite_stock__gte=self.quantite
            ).update(quantite_stock=F("quantite_stock") - self.quantite)

            if not nb_lignes_maj:
                # Annule le mouvement qui vient d'etre enregistre : le stock
                # etait finalement insuffisant (cas rare de concurrence, la
                # validation normale se fait en amont dans le serializer).
                MouvementStock.objects.filter(pk=self.pk).delete()
                raise ValidationError(
                    "Quantité en stock insuffisante pour cette sortie (RG11)."
                )
        else:
            Article.objects.filter(pk=self.article_id).update(
                quantite_stock=F("quantite_stock") + self.quantite
            )