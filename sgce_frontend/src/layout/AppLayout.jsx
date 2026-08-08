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
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import CloseIcon from "@mui/icons-material/Close";
import LogoutIcon from "@mui/icons-material/Logout";
import PrintIcon from "@mui/icons-material/Print";
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
        <Toolbar sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Tooltip title={sidebarOuverte ? "Réduire le menu" : "Ouvrir le menu"}>
              <IconButton color="inherit" onClick={basculerSidebar} edge="start">
                {sidebarOuverte ? <ChevronLeftIcon /> : <MenuIcon />}
              </IconButton>
            </Tooltip>
            <PrintIcon />
            <Typography variant="h6" noWrap sx={{ display: { xs: "none", sm: "block" } }}>
              SGCE — Imprimerie Nationale de Madagascar
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip title="Notifications">
              <IconButton color="inherit" onClick={(e) => setAncrageNotifs(e.currentTarget)}>
                <Badge badgeContent={nonLues} color="error">
                  {nonLues > 0 ? <NotificationsIcon /> : <NotificationsNoneIcon />}
                </Badge>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={ancrageNotifs}
              open={Boolean(ancrageNotifs)}
              onClose={() => setAncrageNotifs(null)}
              PaperProps={{ sx: { width: 400, maxHeight: 500 } }}
            >
              <Box sx={{ px: 2, py: 1.25, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Notifications {nonLues > 0 && `(${nonLues})`}
                </Typography>
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
                      <IconButton size="small" onClick={gererViderNotifications}>
                        <DeleteSweepIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Box>
              <Divider />
              {notifications.length === 0 && (
                <Box sx={{ px: 2, py: 4, textAlign: "center" }}>
                  <NotificationsNoneIcon sx={{ fontSize: 32, color: "text.disabled", mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Aucune notification
                  </Typography>
                </Box>
              )}
              {notifications.slice(0, 15).map((notification) => (
                <MenuItem
                  key={notification.id}
                  onClick={() => gererClicNotification(notification)}
                  sx={{
                    whiteSpace: "normal",
                    alignItems: "flex-start",
                    bgcolor: notification.lue ? "transparent" : "action.hover",
                    "&:hover .bouton-supprimer-notif": { opacity: 1 },
                  }}
                >
                  <Box sx={{ flexGrow: 1, pr: 1 }}>
                    <Typography variant="body2">{notification.message}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {notification.categorie_libelle} ·{" "}
                      {new Date(notification.date_envoi).toLocaleString("fr-FR")}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    className="bouton-supprimer-notif"
                    onClick={(e) => gererSupprimerNotification(e, notification.id)}
                    sx={{ opacity: { xs: 1, sm: 0 }, transition: "opacity 0.15s", ml: 1 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </MenuItem>
              ))}
            </Menu>

            <Tooltip title="Mon profil">
              <IconButton onClick={(e) => setAncrageProfil(e.currentTarget)} sx={{ ml: 0.5 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: couleurAvatar, fontSize: 15 }}>
                  {initialesUtilisateur(utilisateur)}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={ancrageProfil}
              open={Boolean(ancrageProfil)}
              onClose={() => setAncrageProfil(null)}
              PaperProps={{ sx: { width: 280 } }}
            >
              <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: couleurAvatar, fontSize: 18 }}>
                  {initialesUtilisateur(utilisateur)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap>
                    {nomComplet(utilisateur)}
                  </Typography>
                  {utilisateur?.email && (
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                      {utilisateur.email}
                    </Typography>
                  )}
                </Box>
              </Box>
              <Box sx={{ px: 2.5, pb: 1.5 }}>
                <Chip
                  label={LIBELLES_ROLES[utilisateur?.role] || utilisateur?.role}
                  size="small"
                  sx={{ bgcolor: couleurAvatar, color: "#fff", fontWeight: 500 }}
                />
              </Box>
              <Divider />
              <MenuItem onClick={gererDeconnexion} sx={{ py: 1.25 }}>
                <ListItemIcon>
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
        <Toolbar />
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
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
