from django.urls import path

from .views import FactureDetailView, FactureListCreateView

urlpatterns = [
    path("factures/", FactureListCreateView.as_view(), name="factures-list"),
    path("factures/<int:pk>/", FactureDetailView.as_view(), name="factures-detail"),
]