from rest_framework.permissions import BasePermission


class IsRole(BasePermission):
    """
    Permission de base : autorise uniquement les utilisateurs authentifies
    dont le role figure dans allowed_roles.
    Ne pas utiliser directement : utiliser une des sous-classes ci-dessous,
    ou generer une permission a la volee avec IsRole.for_roles(...).
    """

    allowed_roles = []

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in self.allowed_roles
        )

    @classmethod
    def for_roles(cls, *roles):
        return type("IsRoleDynamic", (cls,), {"allowed_roles": list(roles)})


class IsAdmin(IsRole):
    """Reserve exclusivement a l'Administrateur."""
    allowed_roles = ["ADMIN"]


class IsAgentSDO(IsRole):
    """Agent SDO (l'Administrateur y a egalement acces)."""
    allowed_roles = ["ADMIN", "AGENT_SDO"]


class IsChefAtelier(IsRole):
    """Chef d'atelier SPA/SPB (l'Administrateur y a egalement acces)."""
    allowed_roles = ["ADMIN", "CHEF_ATELIER"]


class IsMagasinier(IsRole):
    """Magasinier (l'Administrateur y a egalement acces)."""
    allowed_roles = ["ADMIN", "MAGASINIER"]