from django.urls import path

from .views import AnnuaireView, UtilisateurDetailView, UtilisateurListCreateView

urlpatterns = [
    path("utilisateurs/", UtilisateurListCreateView.as_view(), name="utilisateurs-list"),
    path("utilisateurs/annuaire/", AnnuaireView.as_view(), name="utilisateurs-annuaire"),
    path("utilisateurs/<int:pk>/", UtilisateurDetailView.as_view(), name="utilisateurs-detail"),
]
