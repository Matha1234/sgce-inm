from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """
    Liste des notifications du seul utilisateur connecte (jamais celles
    d'un autre utilisateur), avec filtre optionnel ?lue=false pour
    n'afficher que les notifications non lues.
    """

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Notification.objects.filter(destinataire=self.request.user)
        lue = self.request.query_params.get("lue")
        if lue is not None:
            qs = qs.filter(lue=(lue.lower() == "true"))
        return qs


class NotificationMarquerLueView(generics.UpdateAPIView):
    """Marque une notification (appartenant a l'utilisateur connecte) comme lue."""

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(destinataire=self.request.user)

    def patch(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.lue = True
        notification.save(update_fields=["lue"])
        return Response(NotificationSerializer(notification).data)


class NotificationMarquerToutesLuesView(APIView):
    """Marque toutes les notifications de l'utilisateur connecte comme lues."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        nb_maj = Notification.objects.filter(destinataire=request.user, lue=False).update(lue=True)
        return Response({"notifications_marquees_lues": nb_maj}, status=status.HTTP_200_OK)


class NotificationDeleteView(generics.DestroyAPIView):
    """Supprime une notification appartenant a l'utilisateur connecte."""

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(destinataire=self.request.user)


class NotificationSupprimerToutesView(APIView):
    """Supprime toutes les notifications de l'utilisateur connecte (boîte de notification)."""

    permission_classes = [IsAuthenticated]

    def delete(self, request):
        nb_suppr, _ = Notification.objects.filter(destinataire=request.user).delete()
        return Response({"notifications_supprimees": nb_suppr}, status=status.HTTP_200_OK)
