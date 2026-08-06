from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.notifications'

    def ready(self):
        # Enregistre les signaux qui creent automatiquement une
        # notification a chaque changement de statut (RG18).
        from . import signals  # noqa: F401
