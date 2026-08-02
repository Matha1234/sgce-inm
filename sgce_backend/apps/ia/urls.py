from django.urls import path

from .views import EntrainerModeleView, EstimerCoutView

urlpatterns = [
    path("ia/estimer/", EstimerCoutView.as_view(), name="ia-estimer"),
    path("ia/entrainer/", EntrainerModeleView.as_view(), name="ia-entrainer"),
]