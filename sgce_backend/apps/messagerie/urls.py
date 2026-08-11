from django.urls import path

from .views import (
    MessageCreateView,
    MessageDeleteView,
    MessageInboxView,
    MessageMarkReadView,
    MessageSentView,
)

urlpatterns = [
    path("messages/", MessageCreateView.as_view(), name="messages-create"),
    path("messages/recus/", MessageInboxView.as_view(), name="messages-recus"),
    path("messages/envoyes/", MessageSentView.as_view(), name="messages-envoyes"),
    path("messages/<int:pk>/lu/", MessageMarkReadView.as_view(), name="messages-lu"),
    path("messages/<int:pk>/", MessageDeleteView.as_view(), name="messages-detail"),
]
