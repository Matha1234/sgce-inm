from django.contrib import admin

from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("expediteur", "destinataire", "objet", "lu", "date_envoi")
    list_filter = ("lu",)
    search_fields = ("objet", "contenu", "expediteur__username", "destinataire__username")
