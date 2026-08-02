import random
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.commandes.models import Commande, Devis, OrganismeClient

PRIX_BASE = {
    Commande.TypeDocument.JOURNAL_OFFICIEL: 500,
    Commande.TypeDocument.BULLETIN_ANNONCES: 300,
    Commande.TypeDocument.FORMULAIRE_ADMINISTRATIF: 150,
    Commande.TypeDocument.CACHET_ADMINISTRATIF: 2000,
    Commande.TypeDocument.DOCUMENT_FIDUCIAIRE: 1200,
    Commande.TypeDocument.AUTRE: 400,
}

MULTIPLICATEUR_ATELIER = {
    Commande.Atelier.SPA: 1.0,
    Commande.Atelier.SPB: 1.4,
}


class Command(BaseCommand):
    help = (
        "Genere un historique fictif de commandes/devis (marque est_fictif=True) "
        "pour amorcer le modele d'estimation IA en l'absence de donnees reelles suffisantes."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--nombre", type=int, default=60,
            help="Nombre de commandes fictives a generer (defaut : 60).",
        )

    def handle(self, *args, **options):
        random.seed(42)  # reproductibilite
        nombre = options["nombre"]

        organisme, _ = OrganismeClient.objects.get_or_create(
            nom="Organisme fictif (test IA)",
            defaults={
                "type": OrganismeClient.TypeOrganisme.ETABLISSEMENT_PUBLIC,
                "adresse": "Donnée générée automatiquement - à ignorer en production",
            },
        )

        types_documents = [c[0] for c in Commande.TypeDocument.choices]
        ateliers = [c[0] for c in Commande.Atelier.choices]

        crees = 0
        for i in range(nombre):
            type_doc = random.choice(types_documents)
            atelier = random.choice(ateliers)
            quantite = random.randint(50, 5000)

            prix_base = PRIX_BASE[type_doc]
            multiplicateur = MULTIPLICATEUR_ATELIER[atelier]
            bruit = random.uniform(0.85, 1.15)
            prix_revient = Decimal(str(round(prix_base * multiplicateur * (quantite / 100) * bruit, 2)))

            duree_base = 2 + (quantite / 800)
            duree_production = max(1, int(round(duree_base * multiplicateur * random.uniform(0.9, 1.1))))

            date_commande_fictive = timezone.now() - timedelta(days=random.randint(10, 720))

            # Numero explicite et unique (13 caracteres, respecte la limite de 15),
            # independant du compteur automatique du modele (qui ne doit servir
            # que pour les vraies commandes creees via l'API).
            numero_fictif = f"FIC-{i + 1:04d}-{random.randint(1000, 9999)}"

            commande = Commande(
                numero=numero_fictif,
                statut=Commande.Statut.LIVREE,
                delai_contractuel=(date_commande_fictive + timedelta(days=duree_production + 5)).date(),
                type_document=type_doc,
                quantite=quantite,
                atelier=atelier,
                est_fictif=True,
                organisme=organisme,
            )
            commande.save()
            # Reajuste la date de commande a une valeur passee (auto_now_add l'ecrase a la creation)
            Commande.objects.filter(pk=commande.pk).update(date_commande=date_commande_fictive)

            Devis.objects.create(
                commande=commande,
                prix_revient=prix_revient,
                prix_vente=round(prix_revient * Decimal("1.35"), 2),
                duree_production=duree_production,
                valide=True,
            )
            crees += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"{crees} commandes fictives générées (est_fictif=True) "
                f"pour l'organisme « {organisme.nom} »."
            )
        )