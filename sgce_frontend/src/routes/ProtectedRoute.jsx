import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

/**
 * Protege une route : redirige vers /login si non authentifie.
 * Si `rolesAutorises` est fourni, redirige vers /acces-refuse si le role
 * de l'utilisateur connecte n'y figure pas (l'Administrateur passe
 * toujours, quelle que soit la liste).
 */
export default function ProtectedRoute({ rolesAutorises }) {
  const { estAuthentifie, utilisateur } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!estAuthentifie) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (rolesAutorises && utilisateur && utilisateur.role !== "ADMIN") {
    if (!rolesAutorises.includes(utilisateur.role)) {
      return <Navigate to="/acces-refuse" replace />;
    }
  }

  return <Outlet />;
}
