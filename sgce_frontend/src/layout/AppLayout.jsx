import { useEffect, useMemo, useState } from "react";
import {
  AppBar, Avatar, Badge, Box, Chip, Divider, Drawer, IconButton, List,
  ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Toolbar,
  Tooltip, Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PeopleIcon from "@mui/icons-material/People";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import CloseIcon from "@mui/icons-material/Close";
import LogoutIcon from "@mui/icons-material/Logout";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import BadgeIcon from "@mui/icons-material/Badge";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { logout } from "../store/authSlice";
import {
  marquerLue, marquerToutesLues, setNotifications, supprimerNotification, viderNotifications,
} from "../store/notificationsSlice";
import {
  listerNotifications, marquerNotificationLue, marquerToutesNotificationsLues,
  supprimerNotification as apiSupprimerNotification,
  supprimerToutesNotifications as apiSupprimerToutesNotifications,
} from "../api/utilisateursApi";
import { COULEURS_ROLES, LIBELLES_ROLES } from "../constants/roles";
import logoInm from "../assets/logo-inm.png";

const LARGEUR_SIDEBAR_OUVERTE = 260;
const LARGEUR_SIDEBAR_REDUITE = 76;
const CLE_SIDEBAR = "sgce_sidebar_ouverte";

const ELEMENTS_MENU = [
  { label: "Tableau de bord", to: "/", icon: <DashboardIcon />, roles: null },
  { label: "Commandes", to: "/commandes", icon: <AssignmentIcon />, roles: ["ADMIN", "AGENT_SDO"] },
  { label: "Production", to: "/dossiers", icon: <PrecisionManufacturingIcon />, roles: ["ADMIN", "CHEF_ATELIER", "AGENT_SDO"] },
  { label: "Stock", to: "/stock", icon: <Inventory2Icon />, roles: ["ADMIN", "MAGASINIER"] },
  { label: "Facturation", to: "/factures", icon: <ReceiptLongIcon />, roles: ["ADMIN", "AGENT_SDO"] },
  { label: "Rentabilité", to: "/rentabilite", icon: <AssessmentIcon />, roles: ["ADMIN"] },
  { label: "Utilisateurs", to: "/utilisateurs", icon: <PeopleIcon />, roles: ["ADMIN"] },
];

const ICONES_CATEGORIE_NOTIF = {
  COMMANDE: <AssignmentIcon fontSize="small" />,
  DOSSIER: <PrecisionManufacturingIcon fontSize="small" />,
  ETAPE: <PlaylistAddCheckIcon fontSize="small" />,
  STOCK: <Inventory2Icon fontSize="small" />,
  CONTROLE: <AssessmentIcon fontSize="small" />,
};

function initialesUtilisateur(utilisateur) {
  if (!utilisateur) return "?";
  const prenom = utilisateur.first_name || "";
  const nom = utilisateur.last_name || "";
  if (prenom || nom) {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase() || "?";
  }
  return (utilisateur.username || "?").charAt(0).toUpperCase();
}

function nomComplet(utilisateur) {
  if (!utilisateur) return "";
  const prenom = utilisateur.first_name || "";
  const nom = utilisateur.last_name || "";
  const complet = `${prenom} ${nom}`.trim();
  return complet || utilisateur.username;
}

function formaterDate(valeur) {
  if (!valeur) return "—";
  return new Date(valeur).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function AppLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { utilisateur } = useSelector((state) => state.auth);
  const { liste: notifications, nonLues } = useSelector((state) => state.notifications);

  const [sidebarOuverte, setSidebarOuverte] = useState(() => {
    const enregistre = localStorage.getItem(CLE_SIDEBAR);
    return enregistre === null ? true : enregistre === "true";
  });
  const [ancrageNotifs, setAncrageNotifs] = useState(null);
  const [ancrageProfil, setAncrageProfil] = useState(null);

  const largeurSidebar = sidebarOuverte ? LARGEUR_SIDEBAR_OUVERTE : LARGEUR_SIDEBAR_REDUITE;

  const basculerSidebar = () => {
    setSidebarOuverte((valeur) => {
      localStorage.setItem(CLE_SIDEBAR, String(!valeur));
      return !valeur;
    });
  };

  const chargerNotifications = async () => {
    try {
      const data = await listerNotifications();
      dispatch(setNotifications(Array.isArray(data) ? data : data.results || []));
    } catch {
      // silencieux : l'absence de notifications ne doit pas bloquer l'UI
    }
  };

  useEffect(() => {
    chargerNotifications();
    const intervalle = setInterval(chargerNotifications, 30000);
    return () => clearInterval(intervalle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gererClicNotification = async (notification) => {
    if (!notification.lue) {
      dispatch(marquerLue(notification.id));
      try {
        await marquerNotificationLue(notification.id);
      } catch {
        // pas bloquant
      }
    }
  };

  const gererToutMarquerLu = async () => {
    dispatch(marquerToutesLues());
    try {
      await marquerToutesNotificationsLues();
    } catch {
      // pas bloquant
    }
  };

  const gererSupprimerNotification = async (evenement, id) => {
    evenement.stopPropagation();
    dispatch(supprimerNotification(id));
    try {
      await apiSupprimerNotification(id);
    } catch {
      // pas bloquant : la notification reste supprimée côté interface
    }
  };

  const gererViderNotifications = async () => {
    dispatch(viderNotifications());
    setAncrageNotifs(null);
    try {
      await apiSupprimerToutesNotifications();
    } catch {
      // pas bloquant
    }
  };

  const gererDeconnexion = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const menuVisible = useMemo(
    () =>
      ELEMENTS_MENU.filter(
        (item) => !item.roles || utilisateur?.role === "ADMIN" || item.roles.includes(utilisateur?.role)
      ),
    [utilisateur?.role]
  );

  const couleurAvatar = COULEURS_ROLES[utilisateur?.role] || "#455A64";

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "grey.50" }}>
      <AppBar
        position="fixed"
        elevation={2}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: "primary.dark",
          transition: (theme) =>
            theme.transitions.create(["width", "margin"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
        }}
      >
        <Toolbar variant="dense" sx={{ display: "flex", justifyContent: "space-between", gap: 2, position: "relative", minHeight: 48 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              component="img"
              src={logoInm}
              alt="Logo Imprimerie Nationale de Madagascar"
              sx={{ height: 28, borderRadius: 1, bgcolor: "#fff", p: 0.3 }}
            />
            <Tooltip title={sidebarOuverte ? "Réduire le menu" : "Ouvrir le menu"}>
              <IconButton color="inherit" size="small" onClick={basculerSidebar} edge="start">
                {sidebarOuverte ? <ChevronLeftIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Stack>

          <Tooltip title="Système de Gestion des Coûts et de l'Exécution des commandes">
            <Chip
              label="SGCE"
              size="small"
              sx={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                bgcolor: "rgba(255,255,255,0.14)",
                color: "#fff",
                fontWeight: 700,
                letterSpacing: 1.5,
                borderRadius: 1,
                border: "1px solid rgba(255,255,255,0.3)",
                cursor: "default",
              }}
            />
          </Tooltip>

          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Tooltip title="Notifications">
              <IconButton color="inherit" size="small" onClick={(e) => setAncrageNotifs(e.currentTarget)}>
                <Badge badgeContent={nonLues} color="error">
                  {nonLues > 0 ? <NotificationsIcon fontSize="small" /> : <NotificationsNoneIcon fontSize="small" />}
                </Badge>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={ancrageNotifs}
              open={Boolean(ancrageNotifs)}
              onClose={() => setAncrageNotifs(null)}
              PaperProps={{ sx: { width: 340, maxHeight: 400, borderRadius: 2, overflow: "hidden" } }}
            >
              <Box
                sx={{
                  px: 1.5, py: 1, display: "flex", justifyContent: "space-between", alignItems: "center",
                  bgcolor: "grey.100",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <NotificationsIcon fontSize="small" color="action" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Notifications
                  </Typography>
                  {nonLues > 0 && (
                    <Chip label={`${nonLues} non lue${nonLues > 1 ? "s" : ""}`} size="small" color="error" />
                  )}
                </Stack>
                <Stack direction="row" spacing={0.5}>
                  {nonLues > 0 && (
                    <Tooltip title="Tout marquer comme lu">
                      <IconButton size="small" onClick={gererToutMarquerLu}>
                        <DoneAllIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {notifications.length > 0 && (
                    <Tooltip title="Supprimer toutes les notifications">
                      <IconButton size="small" color="error" onClick={gererViderNotifications}>
                        <DeleteSweepIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Box>
              <Divider />
              {notifications.length === 0 && (
                <Box sx={{ px: 2, py: 3, textAlign: "center" }}>
                  <NotificationsNoneIcon sx={{ fontSize: 36, color: "text.disabled", mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Aucune notification
                  </Typography>
                </Box>
              )}
              <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
                {notifications.slice(0, 15).map((notification, index) => (
                  <Box key={notification.id}>
                    <MenuItem
                      onClick={() => gererClicNotification(notification)}
                      sx={{
                        whiteSpace: "normal",
                        alignItems: "flex-start",
                        gap: 1,
                        py: 0.9,
                        px: 1.5,
                        borderLeft: "3px solid",
                        borderLeftColor: notification.lue ? "transparent" : "primary.main",
                        bgcolor: notification.lue ? "transparent" : "primary.50",
                        "&:hover .bouton-supprimer-notif": { opacity: 1 },
                      }}
                    >
                      <Box
                        sx={{
                          mt: 0.4,
                          color: notification.lue ? "text.disabled" : "primary.main",
                          display: "flex",
                        }}
                      >
                        {ICONES_CATEGORIE_NOTIF[notification.categorie] || <NotificationsNoneIcon fontSize="small" />}
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          {!notification.lue && (
                            <FiberManualRecordIcon sx={{ fontSize: 8, color: "primary.main" }} />
                          )}
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: notification.lue ? 400 : 600,
                              color: notification.lue ? "text.secondary" : "text.primary",
                              fontSize: 13,
                            }}
                          >
                            {notification.message}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.4 }}>
                          <Chip
                            label={notification.categorie_libelle}
                            size="small"
                            variant="outlined"
                            sx={{ height: 18, fontSize: 10 }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5 }}>
                            {new Date(notification.date_envoi).toLocaleString("fr-FR")}
                          </Typography>
                        </Stack>
                      </Box>
                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          className="bouton-supprimer-notif"
                          onClick={(e) => gererSupprimerNotification(e, notification.id)}
                          sx={{ opacity: { xs: 1, sm: 0 }, transition: "opacity 0.15s" }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </MenuItem>
                    {index < notifications.slice(0, 15).length - 1 && <Divider component="li" />}
                  </Box>
                ))}
              </Box>
            </Menu>

            <Tooltip title="Mon profil">
              <IconButton size="small" onClick={(e) => setAncrageProfil(e.currentTarget)} sx={{ ml: 0.5 }}>
                <Avatar sx={{ width: 30, height: 30, bgcolor: couleurAvatar, fontSize: 13 }}>
                  {initialesUtilisateur(utilisateur)}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={ancrageProfil}
              open={Boolean(ancrageProfil)}
              onClose={() => setAncrageProfil(null)}
              PaperProps={{ sx: { width: 300, borderRadius: 2, overflow: "hidden" } }}
            >
              <Box
                sx={{
                  px: 2.5, py: 2.5, display: "flex", flexDirection: "column", alignItems: "center",
                  textAlign: "center", bgcolor: "grey.100",
                }}
              >
                <Avatar sx={{ width: 60, height: 60, bgcolor: couleurAvatar, fontSize: 22, mb: 1 }}>
                  {initialesUtilisateur(utilisateur)}
                </Avatar>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                  {nomComplet(utilisateur)}
                </Typography>
                <Chip
                  label={LIBELLES_ROLES[utilisateur?.role] || utilisateur?.role}
                  size="small"
                  sx={{ bgcolor: couleurAvatar, color: "#fff", fontWeight: 500, mt: 0.75 }}
                />
              </Box>
              <Divider />
              <Box sx={{ px: 2.5, py: 1.5 }}>
                <Stack spacing={1.1}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <AccountCircleIcon fontSize="small" color="action" />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
                        Identifiant
                      </Typography>
                      <Typography variant="body2" noWrap>{utilisateur?.username || "—"}</Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <AlternateEmailIcon fontSize="small" color="action" />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
                        Email
                      </Typography>
                      <Typography variant="body2" noWrap>{utilisateur?.email || "—"}</Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <BadgeIcon fontSize="small" color="action" />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
                        Rôle
                      </Typography>
                      <Typography variant="body2" noWrap>
                        {LIBELLES_ROLES[utilisateur?.role] || utilisateur?.role || "—"}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <EventAvailableIcon fontSize="small" color="action" />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
                        Membre depuis
                      </Typography>
                      <Typography variant="body2" noWrap>{formaterDate(utilisateur?.date_joined)}</Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Box>
              <Divider />
              <MenuItem onClick={gererDeconnexion} sx={{ py: 1.25, color: "error.main" }}>
                <ListItemIcon sx={{ color: "error.main" }}>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Déconnexion
              </MenuItem>
            </Menu>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: largeurSidebar,
          flexShrink: 0,
          whiteSpace: "nowrap",
          [`& .MuiDrawer-paper`]: {
            width: largeurSidebar,
            boxSizing: "border-box",
            overflowX: "hidden",
            transition: (theme) =>
              theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          },
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 48 }} />
        <List sx={{ mt: 1 }}>
          {menuVisible.map((item) => {
            const bouton = (
              <ListItemButton
                key={item.to}
                component={NavLink}
                to={item.to}
                end={item.to === "/"}
                sx={{
                  minHeight: 46,
                  mx: 1,
                  mb: 0.5,
                  borderRadius: 1.5,
                  justifyContent: sidebarOuverte ? "flex-start" : "center",
                  px: sidebarOuverte ? 2 : 1.5,
                  "&.active": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    "& .MuiListItemIcon-root": { color: "primary.contrastText" },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: sidebarOuverte ? 36 : "auto", justifyContent: "center" }}>
                  {item.icon}
                </ListItemIcon>
                {sidebarOuverte && <ListItemText primary={item.label} />}
              </ListItemButton>
            );
            return sidebarOuverte ? (
              bouton
            ) : (
              <Tooltip key={item.to} title={item.label} placement="right">
                {bouton}
              </Tooltip>
            );
          })}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, minWidth: 0 }}>
        <Toolbar variant="dense" sx={{ minHeight: 48 }} />
        <Outlet />
      </Box>
    </Box>
  );
}
