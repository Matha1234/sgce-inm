from django.contrib import admin

from .models import (
    Article,
    Atelier,
    Commande,
    Devis,
    DossierFabrication,
    EtapeProduction,
    MouvementStock,
    OrganismeClient,
)

admin.site.register(OrganismeClient)
admin.site.register(Commande)
admin.site.register(Devis)
admin.site.register(Atelier)
admin.site.register(DossierFabrication)
admin.site.register(EtapeProduction)
admin.site.register(Article)
admin.site.register(MouvementStock)