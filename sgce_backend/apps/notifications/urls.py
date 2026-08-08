from django.urls import path

from .views import (
    NotificationDeleteView,
    NotificationListView,
    NotificationMarquerLueView,
    NotificationMarquerToutesLuesView,
    NotificationSupprimerToutesView,
)

urlpatterns = [
    path("notifications/", NotificationListView.as_view(), name="notifications-list"),
    path("notifications/<int:pk>/lue/", NotificationMarquerLueView.as_view(), name="notifications-marquer-lue"),
    path("notifications/tout-marquer-lu/", NotificationMarquerToutesLuesView.as_view(), name="notifications-tout-marquer-lu"),
    path("notifications/<int:pk>/", NotificationDeleteView.as_view(), name="notifications-supprimer"),
    path("notifications/tout-supprimer/", NotificationSupprimerToutesView.as_view(), name="notifications-tout-supprimer"),
]
