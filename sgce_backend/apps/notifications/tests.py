from django.test import TestCase

from apps.commandes.models import (
    Article,
    Atelier,
    Commande,
    DossierFabrication,
    MouvementStock,
    OrganismeClient,
)
from apps.utilisateurs.models import Utilisateur

from .models import Notification


class MouvementStockNotificationTests(TestCase):
    """
    Couvre le signal `_notifier_mouvement_stock` (RG18 étendu au stock) :
    - une sortie rattachée à un dossier notifie le Chef d'atelier ;
    - le franchissement du seuil de sécurité notifie le Magasinier et
      l'Administrateur, une seule fois au moment de la transition.
    """

    def setUp(self):
        self.admin = Utilisateur.objects.create_user(
            username="admin1", password="x", role=Utilisateur.Role.ADMIN
        )
        self.magasinier = Utilisateur.objects.create_user(
            username="mag1", password="x", role=Utilisateur.Role.MAGASINIER
        )
        self.chef = Utilisateur.objects.create_user(
            username="chef1", password="x", role=Utilisateur.Role.CHEF_ATELIER
        )
        self.atelier = Atelier.objects.create(nom=Atelier.Nom.SPA, chef_atelier=self.chef)

        self.organisme = OrganismeClient.objects.create(
            nom="Ministère X", type=OrganismeClient.TypeOrganisme.MINISTERE
        )
        self.commande = Commande.objects.create(
            organisme=self.organisme,
            delai_contractuel="2026-12-31",
            atelier=Commande.Atelier.SPA,
        )
        self.dossier = DossierFabrication.objects.create(
            commande=self.commande, atelier=self.atelier
        )

        self.article = Article.objects.create(
            designation="Papier offset",
            quantite_stock=100,
            seuil_securite=20,
        )

    def test_sortie_rattachee_a_un_dossier_notifie_le_chef_atelier(self):
        with self.captureOnCommitCallbacks(execute=True):
            MouvementStock.objects.create(
                article=self.article,
                dossier=self.dossier,
                type_mouvement=MouvementStock.TypeMouvement.SORTIE,
                quantite=10,
            )

        notifs_chef = Notification.objects.filter(
            destinataire=self.chef, categorie=Notification.Categorie.STOCK
        )
        self.assertEqual(notifs_chef.count(), 1)
        self.assertIn(self.dossier.numero_dossier, notifs_chef.first().message)

    def test_franchissement_du_seuil_notifie_magasinier_et_admin(self):
        # Stock 100, seuil 20 : une sortie de 85 fait passer le stock à 15,
        # sous le seuil -> doit déclencher une notification d'alerte.
        with self.captureOnCommitCallbacks(execute=True):
            MouvementStock.objects.create(
                article=self.article,
                type_mouvement=MouvementStock.TypeMouvement.SORTIE,
                quantite=85,
            )

        self.article.refresh_from_db()
        self.assertTrue(self.article.est_en_alerte)

        for user in (self.magasinier, self.admin):
            notifs = Notification.objects.filter(
                destinataire=user, categorie=Notification.Categorie.STOCK
            )
            self.assertEqual(notifs.count(), 1)
            self.assertIn("seuil de sécurité", notifs.first().message)

    def test_pas_de_notification_repetee_si_deja_en_alerte(self):
        with self.captureOnCommitCallbacks(execute=True):
            MouvementStock.objects.create(
                article=self.article,
                type_mouvement=MouvementStock.TypeMouvement.SORTIE,
                quantite=85,
            )
        with self.captureOnCommitCallbacks(execute=True):
            MouvementStock.objects.create(
                article=self.article,
                type_mouvement=MouvementStock.TypeMouvement.SORTIE,
                quantite=5,
            )

        notifs = Notification.objects.filter(
            destinataire=self.magasinier, categorie=Notification.Categorie.STOCK
        )
        self.assertEqual(notifs.count(), 1)

    def test_entree_sans_alerte_ne_notifie_pas_le_magasinier(self):
        with self.captureOnCommitCallbacks(execute=True):
            MouvementStock.objects.create(
                article=self.article,
                type_mouvement=MouvementStock.TypeMouvement.ENTREE,
                quantite=50,
            )

        self.assertFalse(
            Notification.objects.filter(
                destinataire=self.magasinier, categorie=Notification.Categorie.STOCK
            ).exists()
        )