"""
Signaux generant automatiquement une notification (RG18) a chaque
changement de statut d'une Commande, d'un DossierFabrication ou d'une
EtapeProduction, sans intervention manuelle des vues.

Approche : un signal pre_save memorise le statut avant ecriture sur
l'instance (attribut prive `_statut_avant`), et le signal post_save
compare avec le nouveau statut pour decider s'il faut notifier.
"""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from apps.commandes.models import Commande, DossierFabrication, EtapeProduction
from apps.controle.models import ControlePrixRevient
from apps.utilisateurs.models import Utilisateur

from .models import Notification


def _admins():
    return Utilisateur.objects.filter(role="ADMIN")


def _notifier(destinataires, categorie, message, reference_objet_id=None):
    """Cree une notification pour chaque destinataire distinct (ignore les None)."""
    utilisateurs = {u for u in destinataires if u is not None}
    Notification.objects.bulk_create(
        [
            Notification(
                destinataire=u,
                categorie=categorie,
                message=message,
                reference_objet_id=reference_objet_id,
            )
            for u in utilisateurs
        ]
    )


# ---------------------------------------------------------------------
# Commande
# ---------------------------------------------------------------------
@receiver(pre_save, sender=Commande)
def _memoriser_statut_commande(sender, instance, **kwargs):
    instance._statut_avant = None
    if instance.pk:
        instance._statut_avant = (
            Commande.objects.filter(pk=instance.pk).values_list("statut", flat=True).first()
        )


@receiver(post_save, sender=Commande)
def _notifier_changement_statut_commande(sender, instance, created, **kwargs):
    if created or getattr(instance, "_statut_avant", None) == instance.statut:
        return

    message = f"Commande {instance.numero} : statut passé à « {instance.get_statut_display()} »."
    destinataires = list(_admins())
    if instance.cree_par_id:
        destinataires.append(instance.cree_par)
    _notifier(destinataires, Notification.Categorie.COMMANDE, message, instance.pk)


# ---------------------------------------------------------------------
# DossierFabrication
# ---------------------------------------------------------------------
@receiver(pre_save, sender=DossierFabrication)
def _memoriser_statut_dossier(sender, instance, **kwargs):
    instance._statut_avant = None
    if instance.pk:
        instance._statut_avant = (
            DossierFabrication.objects.filter(pk=instance.pk)
            .values_list("statut_production", flat=True)
            .first()
        )


@receiver(post_save, sender=DossierFabrication)
def _notifier_changement_statut_dossier(sender, instance, created, **kwargs):
    destinataires = list(_admins())
    if instance.commande.cree_par_id:
        destinataires.append(instance.commande.cree_par)
    if instance.atelier.chef_atelier_id:
        destinataires.append(instance.atelier.chef_atelier)

    if created:
        message = f"Nouveau dossier {instance.numero_dossier} affecté à {instance.atelier}."
        _notifier(destinataires, Notification.Categorie.DOSSIER, message, instance.pk)
        return

    if getattr(instance, "_statut_avant", None) != instance.statut_production:
        message = (
            f"Dossier {instance.numero_dossier} : statut passé à "
            f"« {instance.get_statut_production_display()} »."
        )
        _notifier(destinataires, Notification.Categorie.DOSSIER, message, instance.pk)


# ---------------------------------------------------------------------
# EtapeProduction
# ---------------------------------------------------------------------
@receiver(pre_save, sender=EtapeProduction)
def _memoriser_statut_etape(sender, instance, **kwargs):
    instance._statut_avant = None
    if instance.pk:
        instance._statut_avant = (
            EtapeProduction.objects.filter(pk=instance.pk).values_list("statut", flat=True).first()
        )


@receiver(post_save, sender=EtapeProduction)
def _notifier_changement_statut_etape(sender, instance, created, **kwargs):
    if created or getattr(instance, "_statut_avant", None) == instance.statut:
        return

    dossier = instance.dossier
    destinataires = list(_admins())
    if dossier.commande.cree_par_id:
        destinataires.append(dossier.commande.cree_par)
    if dossier.atelier.chef_atelier_id:
        destinataires.append(dossier.atelier.chef_atelier)

    message = (
        f"Étape « {instance.libelle} » du dossier {dossier.numero_dossier} : "
        f"statut passé à « {instance.get_statut_display()} »."
    )
    _notifier(destinataires, Notification.Categorie.ETAPE, message, instance.pk)


# ---------------------------------------------------------------------
# ControlePrixRevient
# ---------------------------------------------------------------------
@receiver(post_save, sender=ControlePrixRevient)
def _notifier_controle_prix_revient(sender, instance, created, **kwargs):
    """
    RG18 étendu au contrôle du prix de revient : notifie l'Administrateur
    et l'Agent SDO à l'origine de la commande dès qu'une fiche de contrôle
    est établie, avec un message renforcé en cas d'écart significatif
    (theme de stage, module "Contrôle du prix de revient et analyse de
    rentabilité").
    """
    if not created:
        return

    dossier = instance.dossier
    destinataires = list(_admins())
    if dossier.commande.cree_par_id:
        destinataires.append(dossier.commande.cree_par)

    if instance.ecart_significatif:
        message = (
            f"Écart significatif détecté sur le dossier {dossier.numero_dossier} : "
            f"résultat {instance.get_resultat_display().lower()} "
            f"(marge réelle {instance.marge_reelle_pourcentage}% vs cible "
            f"{instance.marge_cible_pourcentage}%)."
        )
    else:
        message = (
            f"Contrôle du prix de revient établi pour le dossier "
            f"{dossier.numero_dossier} : {instance.get_resultat_display().lower()} "
            f"(marge réelle {instance.marge_reelle_pourcentage}%)."
        )
    _notifier(destinataires, Notification.Categorie.CONTROLE, message, instance.pk)

