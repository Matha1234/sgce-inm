from django.db.models import Q
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Message
from .serializers import MessageSerializer


class MessageInboxView(generics.ListAPIView):
    """GET /api/messages/recus/ - boîte de réception de l'utilisateur connecté."""

    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(destinataire=self.request.user).select_related(
            "expediteur", "destinataire"
        )


class MessageSentView(generics.ListAPIView):
    """GET /api/messages/envoyes/ - messages envoyés par l'utilisateur connecté."""

    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(expediteur=self.request.user).select_related(
            "expediteur", "destinataire"
        )


class MessageCreateView(generics.CreateAPIView):
    """POST /api/messages/ - envoi d'un nouveau message à un autre utilisateur."""

    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save(expediteur=self.request.user)


class MessageMarkReadView(APIView):
    """PATCH /api/messages/<id>/lu/ - marque un message reçu comme lu."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            message = Message.objects.get(pk=pk, destinataire=request.user)
        except Message.DoesNotExist:
            return Response({"detail": "Message introuvable."}, status=status.HTTP_404_NOT_FOUND)
        message.lu = True
        message.save(update_fields=["lu"])
        return Response(MessageSerializer(message).data)


class MessageDeleteView(generics.DestroyAPIView):
    """DELETE /api/messages/<id>/ - suppression, réservée à l'expéditeur ou au destinataire."""

    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        utilisateur = self.request.user
        return Message.objects.filter(Q(expediteur=utilisateur) | Q(destinataire=utilisateur))
