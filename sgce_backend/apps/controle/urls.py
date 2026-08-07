from django.urls import path

from .views import (
    ControlePrixRevientDetailView,
    ControlePrixRevientListCreateView,
    TableauBordRentabiliteView,
)

urlpatterns = [
    path("controles/", ControlePrixRevientListCreateView.as_view(), name="controles-list"),
    path("controles/tableau-bord/", TableauBordRentabiliteView.as_view(), name="controles-tableau-bord"),
    path("controles/<int:pk>/", ControlePrixRevientDetailView.as_view(), name="controles-detail"),
]
