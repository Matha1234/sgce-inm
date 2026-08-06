from django.urls import path

from .views import (
    NotificationListView,
    NotificationMarquerLueView,
    NotificationMarquerToutesLuesView,
)

urlpatterns = [
    path("notifications/", NotificationListView.as_view(), name="notifications-list"),
    path("notifications/<int:pk>/lue/", NotificationMarquerLueView.as_view(), name="notifications-marquer-lue"),
    path("notifications/tout-marquer-lu/", NotificationMarquerToutesLuesView.as_view(), name="notifications-tout-marquer-lu"),
]
