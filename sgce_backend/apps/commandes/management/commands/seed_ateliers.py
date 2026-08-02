from django.core.management.base import BaseCommand

from apps.commandes.models import Atelier


class Command(BaseCommand):
    help = "Cree les deux ateliers de reference SPA et SPB s'ils n'existent pas encore."

    def handle(self, *args, **options):
        for nom, _label in Atelier.Nom.choices:
            atelier, cree = Atelier.objects.get_or_create(nom=nom)
            statut = "créé" if cree else "déjà existant"
            self.stdout.write(self.style.SUCCESS(f"Atelier {nom} : {statut}."))