from django.urls import path

from .views import UtilisateurDetailView, UtilisateurListCreateView

urlpatterns = [
    path("utilisateurs/", UtilisateurListCreateView.as_view(), name="utilisateurs-list"),
    path("utilisateurs/<int:pk>/", UtilisateurDetailView.as_view(), name="utilisateurs-detail"),
]
