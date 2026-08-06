import { useEffect, useState } from "react";
import {
  AppBar, Avatar, Badge, Box, Divider, Drawer, IconButton, List,
  ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Toolbar,
  Tooltip, Typography,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PeopleIcon from "@mui/icons-material/People";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { logout } from "../store/authSlice";
import { marquerLue, marquerToutesLues, setNotifications } from "../store/notificationsSlice";
import { listerNotifications, marquerNotificationLue, marquerToutesNotificationsLues } from "../api/utilisateursApi";
import { LIBELLES_ROLES } from "../constants/roles";

const LARGEUR_SIDEBAR = 250;

const ELEMENTS_MENU = [
  { label: "Tableau de bord", to: "/", icon: <DashboardIcon />, roles: null },
  { label: "Commandes", to: "/commandes", icon: <AssignmentIcon />, roles: ["ADMIN", "AGENT_SDO"] },
  { label: "Production", to: "/dossiers", icon: <PrecisionManufacturingIcon />, roles: ["ADMIN", "CHEF_ATELIER"] },
  { label: "Stock", to: "/stock", icon: <Inventory2Icon />, roles: ["ADMIN", "MAGASINIER"] },
  { label: "Facturation", to: "/factures", icon: <ReceiptLongIcon />, roles: ["ADMIN", "AGENT_SDO"] },
  { label: "Utilisateurs", to: "/utilisateurs", icon: <PeopleIcon />, roles: ["ADMIN"] },
];

export default function AppLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { utilisateur } = useSelector((state) => state.auth);
  const { liste: notifications, nonLues } = useSelector((state) => state.notifications);

  const [ancrageNotifs, setAncrageNotifs] = useState(null);
  const [ancrageProfil, setAncrageProfil] = useState(null);

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

  const gererDeconnexion = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const menuVisible = ELEMENTS_MENU.filter(
    (item) => !item.roles || utilisateur?.role === "ADMIN" || item.roles.includes(utilisateur?.role)
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "grey.50" }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: "primary.dark" }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6" noWrap>
            SGCE — Imprimerie Nationale de Madagascar
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title="Notifications">
              <IconButton color="inherit" onClick={(e) => setAncrageNotifs(e.currentTarget)}>
                <Badge badgeContent={nonLues} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={ancrageNotifs}
              open={Boolean(ancrageNotifs)}
              onClose={() => setAncrageNotifs(null)}
              PaperProps={{ sx: { width: 380, maxHeight: 480 } }}
            >
              <Box sx={{ px: 2, py: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle1">Notifications</Typography>
                {nonLues > 0 && (
                  <Typography
                    variant="caption"
                    sx={{ cursor: "pointer", color: "primary.main" }}
                    onClick={gererToutMarquerLu}
                  >
                    Tout marquer comme lu
                  </Typography>
                )}
              </Box>
              <Divider />
              {notifications.length === 0 && (
                <MenuItem disabled>Aucune notification</MenuItem>
              )}
              {notifications.slice(0, 15).map((notification) => (
                <MenuItem
                  key={notification.id}
                  onClick={() => gererClicNotification(notification)}
                  sx={{
                    whiteSpace: "normal",
                    bgcolor: notification.lue ? "transparent" : "action.hover",
                  }}
                >
                  <Box>
                    <Typography variant="body2">{notification.message}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {notification.categorie_libelle} ·{" "}
                      {new Date(notification.date_envoi).toLocaleString("fr-FR")}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Menu>

            <Tooltip title="Mon profil">
              <IconButton onClick={(e) => setAncrageProfil(e.currentTarget)}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>
                  {(utilisateur?.username || "?").charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={ancrageProfil}
              open={Boolean(ancrageProfil)}
              onClose={() => setAncrageProfil(null)}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2">{utilisateur?.username}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {LIBELLES_ROLES[utilisateur?.role] || utilisateur?.role}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={gererDeconnexion}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Déconnexion
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: LARGEUR_SIDEBAR,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: LARGEUR_SIDEBAR, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <List sx={{ mt: 1 }}>
          {menuVisible.map((item) => (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              end={item.to === "/"}
              sx={{
                "&.active": {
                  bgcolor: "primary.light",
                  color: "primary.contrastText",
                  "& .MuiListItemIcon-root": { color: "primary.contrastText" },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
