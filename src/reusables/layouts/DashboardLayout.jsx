import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Popover from '@mui/material/Popover';
import Badge from '@mui/material/Badge';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { useEffect, useState, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import Constants from '../../utils/Constants';
import CustomIcon from '../CustomIcon';
import { useUser } from '../../hooks/UserProvider';
import CustomerDAO from '../../daos/CustomerDao';
import CarDAO from '../../daos/CarDao';
// import PropertyDAO from '../../daos/propertyDao';

const todayMidnight = new Date();
todayMidnight.setHours(0, 0, 0, 0);
const getDiffDays = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - todayMidnight) / (1000 * 60 * 60 * 24));
};

function useNotifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [carRes] = await Promise.allSettled([CarDAO.getAllCars()]);
      const result = [];
      
      if (carRes.status === 'fulfilled') {
        const cars = carRes.value?.cars || carRes.value?.data || (Array.isArray(carRes.value) ? carRes.value : []);
        cars.forEach((car) => {
          if (car.status === 'Cancelled') return;
          const diff = getDiffDays(car.dueDate || car.carData?.dueDate);
          if (diff === null) return;
          
          const carBrand = car.carBrand || car.carData?.carBrand || '';
          const carModel = car.carModel || car.carData?.carModel || '';
          const plateNumber = car.plateNumber || car.carData?.plateNumber || '';
          const ownerName = car.ownerName || car.carData?.ownerName || car.customerName || 'Unknown';

          if (diff < 0) {
              result.push({ id: `c-exp-${car.id}`, type: 'expired', category: 'Kendaraan', name: ownerName, detail: `${carBrand} ${carModel} · ${plateNumber}`.trim(), diff });
          } else if (diff <= 30) {
              result.push({ id: `c-soon-${car.id}`, type: 'soon', category: 'Kendaraan', name: ownerName, detail: `${carBrand} ${carModel} · ${plateNumber}`.trim(), diff });
          }
        });
      }

      result.sort((a, b) => { if (a.type !== b.type) return a.type === 'expired' ? -1 : 1; return a.diff - b.diff; });
      setNotifs(result);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return { notifs, loading, reload: load };
}

function NotificationPopover({ anchorEl, open, onClose, notifs, loading }) {
  const soon = notifs.filter(n => n.type === 'soon');
  const expired = notifs.filter(n => n.type === 'expired');
  const NotifItem = ({ item }) => {
    const isExpired = item.type === 'expired';
    const label = isExpired ? 'Expired' : item.diff === 0 ? 'Hari ini' : `${item.diff}h lagi`;
    return (
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, px: 2, py: 1.5, borderRadius: '10px', mx: 1, mb: 0.5, bgcolor: isExpired ? '#fff5f5' : item.diff <= 7 ? '#fffbeb' : '#f0f9ff', border: `1px solid ${isExpired ? '#fecaca' : item.diff <= 7 ? '#fde68a' : '#bae6fd'}`, '&:hover': { bgcolor: isExpired ? '#fee2e2' : item.diff <= 7 ? '#fef3c7' : '#e0f2fe' } }}>
        <Box sx={{ width: 32, height: 32, borderRadius: '8px', flexShrink: 0, bgcolor: isExpired ? '#ef4444' : item.diff <= 7 ? '#f59e0b' : '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{item.name?.[0]?.toUpperCase() || '?'}</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontWeight: 600, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</Typography>
            <Chip label={label} size="small" sx={{ height: 19, fontSize: 10, fontWeight: 700, flexShrink: 0, bgcolor: isExpired ? '#ef4444' : item.diff <= 7 ? '#f59e0b' : '#2563eb', color: '#fff', '& .MuiChip-label': { px: 1 } }} />
          </Box>
          <Typography sx={{ fontSize: 11.5, color: '#64748b', mt: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.detail}</Typography>
          <Chip label={item.category} size="small" sx={{ mt: 0.5, height: 17, fontSize: 10, fontWeight: 600, bgcolor: item.category === 'Kendaraan' ? '#dbeafe' : '#e0f2fe', color: item.category === 'Kendaraan' ? '#1d4ed8' : '#0369a1', '& .MuiChip-label': { px: 1 } }} />
        </Box>
      </Box>
    );
  };
  return (
    <Popover anchorEl={anchorEl} open={open} onClose={onClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} slotProps={{ paper: { sx: { mt: 1, width: 360, maxHeight: 500, borderRadius: '14px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column' } } }}>
      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box><Typography sx={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Notifikasi</Typography><Typography sx={{ fontSize: 11.5, color: '#94a3b8', mt: 0.2 }}>Polis yang perlu perhatian</Typography></Box>
        {notifs.length > 0 && <Chip label={notifs.length} size="small" sx={{ bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 700, fontSize: 11 }} />}
      </Box>
      <Box sx={{ overflowY: 'auto', flex: 1, py: 1.5 }}>
        {loading
          ? <Box sx={{ px: 3, py: 4, textAlign: 'center' }}><Typography sx={{ fontSize: 13, color: '#94a3b8' }}>Memuat...</Typography></Box>
          : notifs.length === 0
            ? <Box sx={{ px: 3, py: 5, textAlign: 'center' }}><Box sx={{ fontSize: 30, mb: 1 }}>🎉</Box><Typography sx={{ fontWeight: 700, fontSize: 13, color: '#0f172a', mb: 0.5 }}>Semua polis aman!</Typography><Typography sx={{ fontSize: 11.5, color: '#94a3b8' }}>Tidak ada polis expired atau mendekati jatuh tempo</Typography></Box>
            : <>{expired.length > 0 && <><Box sx={{ px: 2.5, py: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#ef4444' }} /><Typography sx={{ fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Expired ({expired.length})</Typography></Box>{expired.map(n => <NotifItem key={n.id} item={n} />)}{soon.length > 0 && <Divider sx={{ my: 1, mx: 2, borderColor: '#f1f5f9' }} />}</>}{soon.length > 0 && <><Box sx={{ px: 2.5, py: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#f59e0b' }} /><Typography sx={{ fontSize: 10, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Jatuh Tempo ({soon.length})</Typography></Box>{soon.map(n => <NotifItem key={n.id} item={n} />)}</>}</>
        }
      </Box>
    </Popover>
  );
}

function BellButton({ notifs, loading, sx = {} }) {
  const [anchor, setAnchor] = useState(null);
  const unread = notifs.length;
  return (
    <>
      <IconButton onClick={e => setAnchor(e.currentTarget)} sx={{ bgcolor: 'transparent', border: '1px solid #e2e8f0', borderRadius: '9px', width: 38, height: 38, transition: 'all 0.15s', '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }, ...sx }}>
        <Badge badgeContent={unread} max={99} sx={{ '& .MuiBadge-badge': { bgcolor: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800, minWidth: 15, height: 15, padding: '0 3px', top: -1, right: -1 } }}>
          <CustomIcon icon={unread > 0 ? 'heroicons:bell-alert-solid' : 'heroicons:bell'} sx={{ fontSize: 18, color: unread > 0 ? '#2563eb' : '#64748b' }} />
        </Badge>
      </IconButton>
      <NotificationPopover anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} notifs={notifs} loading={loading} />
    </>
  );
}

export default function DashboardLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { user, logout, isLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { notifs, loading: notifLoading } = useNotifications();

  const isFullscreenMobileRoute = (() => {
    const p = location.pathname;
    return p.match(/^\/customers\/[^/]+$/) || 
           p.match(/^\/customers\/edit\/[^/]+$/) || 
           p.match(/^\/cars\/[^/]+$/) || 
           p.match(/^\/cars\/edit\/[^/]+$/) ||
           p.match(/^\/payments\/[^/]+$/);
  })();

  useEffect(() => { if (!user && !isLoading) navigate('/login', { replace: true }); }, [user, isLoading, navigate]);

  const sections = [
    { icon: 'heroicons:rectangle-group', label: 'Dashboard', url: '/dashboard', title: 'Dashboard' },
    { icon: 'heroicons:users', label: 'Customers', url: '/customers', title: 'Customer Management' },
    // { icon: 'heroicons:building-office-2', label: 'Properti', url: '/properties', title: 'Manajemen Properti' },
    { icon: 'heroicons:truck', label: 'Kendaraan', url: '/cars', title: 'Manajemen Kendaraan' },
    { icon: 'heroicons:banknotes', label: 'Payment', url: '/payments', title: 'Manajemen Pembayaran' },
    { icon: 'heroicons:arrow-path', label: 'Renewal', url: '/renewals', title: 'Manajemen Renewal' },
    { icon: 'heroicons:calendar', label: 'Quotation', url: '/quotations/create', title: 'Create Quotation' },
    { icon: 'heroicons:document-currency-dollar', label: 'Invoice', url: '/invoices/create', title: 'Create Invoice' },
    { icon: 'heroicons:shield-check', label: 'Admin Management', url: '/admin-management', title: 'Admin Management', adminOnly: true },
    { icon: 'heroicons:document-text', label: 'Kwitansi', url: '/kwitansi', title: 'Kwitansi' },
  ];

  useEffect(() => {
    const matched = sections.find(s => s.url === location.pathname);
    if (matched?.title) document.title = matched.title;
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="max-w-screen max-h-screen overflow-hidden h-full">
      <Box component="nav" sx={{ width: { sm: Constants.NAVIGATION_DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} ModalProps={{ keepMounted: true }} className="sm:hidden" sx={{ '& .MuiDrawer-paper': { boxSizing: 'border-box', width: Constants.NAVIGATION_DRAWER_WIDTH, border: 'none' } }}>
          <DrawerContent sections={sections} onClose={() => setIsDrawerOpen(false)} user={user} onLogout={handleLogout} />
        </Drawer>
        <Drawer variant="permanent" className="hidden sm:block" open sx={{ '& .MuiDrawer-paper': { boxSizing: 'border-box', width: Constants.NAVIGATION_DRAWER_WIDTH, border: 'none', borderRight: '1px solid #f1f5f9' } }}>
          <DrawerContent sections={sections} onClose={() => setIsDrawerOpen(false)} user={user} onLogout={handleLogout} />
        </Drawer>
      </Box>

      <div className="max-h-full w-full flex flex-col">
        {/* Mobile Toolbar */}
        <Box sx={{ display: { xs: isFullscreenMobileRoute ? 'none' : 'flex', sm: 'none' }, justifyContent: 'space-between', alignItems: 'center', px: 2, height: `${Constants.HEADER_MOBILE_HEIGHT}px`, bgcolor: '#fff', borderBottom: '1px solid #f1f5f9' }}>
          <IconButton onClick={() => setIsDrawerOpen(true)} sx={{ color: '#334155' }}><CustomIcon icon="heroicons:bars-3-solid" /></IconButton>
          <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>
            {(() => {
              const p = location.pathname;
              if (p.startsWith('/customers')) return 'Customers';
              if (p.startsWith('/properties')) return 'Properti';
              if (p.startsWith('/cars')) return 'Kendaraan';
              if (p.startsWith('/payments')) return 'Payment';
              if (p.startsWith('/renewals')) return 'Renewal';
              if (p.startsWith('/quotations')) return 'Quotation';
              if (p.startsWith('/invoices')) return 'Invoice';
              if (p.startsWith('/admin-management')) return 'Admin Management';
              if (p.startsWith('/kwitansi')) return 'Kwitansi';
              return sections.find(s => s.url === p)?.label || 'Dashboard';
            })()}
          </Typography>
          <BellButton notifs={notifs} loading={notifLoading} />
        </Box>

        {/* Desktop Toolbar */}
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'flex-end', alignItems: 'center', px: 4, width: { sm: `calc(100% - ${Constants.NAVIGATION_DRAWER_WIDTH}px)` }, ml: { sm: `${Constants.NAVIGATION_DRAWER_WIDTH}px` }, height: `${Constants.HEADER_DESKTOP_HEIGHT}px`, borderBottom: '1px solid #f1f5f9', bgcolor: '#fff' }}>
          <BellButton notifs={notifs} loading={notifLoading} />
        </Box>

        {/* Content */}
        <Box component="main" sx={{ px: { xs: 0, sm: 5 }, py: { xs: 0, sm: 4 }, width: { sm: `calc(100% - ${Constants.NAVIGATION_DRAWER_WIDTH}px)` }, marginLeft: { sm: `${Constants.NAVIGATION_DRAWER_WIDTH}px` }, maxHeight: { xs: isFullscreenMobileRoute ? '100vh' : `calc(100vh - ${Constants.HEADER_MOBILE_HEIGHT}px)`, sm: `calc(100vh - ${Constants.HEADER_DESKTOP_HEIGHT}px)` }, overflow: 'auto', bgcolor: '#f8fafc' }}>
          <div className="w-full"><Outlet /></div>
        </Box>


      </div>
    </div>
  );
}

// ─── DrawerContent ────────────────────────────────────────────────────────────
function DrawerContent({ sections, onClose, user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const filteredSections = sections.filter(s => !(s.adminOnly && user?.role !== 'superadmin'));
  const mainNav = filteredSections.filter(s => ['Dashboard', 'Customers', /* 'Properti', */ 'Kendaraan', 'Payment', 'Renewal'].includes(s.label));
  const docNav = filteredSections.filter(s => ['Quotation', 'Invoice', 'Kwitansi'].includes(s.label));
  const adminNav = filteredSections.filter(s => s.adminOnly);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>

      {/* Logo */}
      <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid #f1f5f9' }}>
      </div>

      {/* User */}
      <div style={{ padding: '12px 12px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12, flexShrink: 0 }}>
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username || 'Demo User'}</div>
            <div style={{ fontSize: 10.5, color: '#94a3b8', textTransform: 'capitalize' }}>{user?.role || 'user'}</div>
          </div>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px 0' }}>
        <NavGroup label="Main">
          {mainNav.map(s => <NavItem key={s.label} section={s} location={location} navigate={navigate} onClose={onClose} />)}
        </NavGroup>
        <NavGroup label="Dokumen">
          {docNav.map(s => <NavItem key={s.label} section={s} location={location} navigate={navigate} onClose={onClose} />)}
        </NavGroup>
        {adminNav.length > 0 && (
          <NavGroup label="Admin">
            {adminNav.map(s => <NavItem key={s.label} section={s} location={location} navigate={navigate} onClose={onClose} />)}
          </NavGroup>
        )}
      </div>

      {/* Logout */}
      <div style={{ padding: '8px 10px 20px' }}>
        <div style={{ height: 1, background: '#f1f5f9', marginBottom: 6 }} />
        <button
          onClick={onLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', transition: 'all 0.12s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
        >
          <CustomIcon icon="heroicons:arrow-left-end-on-rectangle" sx={{ fontSize: 16, color: 'inherit' }} />
          <span style={{ fontSize: 13, fontWeight: 400 }}>Logout</span>
        </button>
      </div>
    </div>
  );
}

function NavGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px', marginBottom: 3 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function NavItem({ section, location, navigate, onClose }) {
  const isActive = location.pathname === section.url || (section.url !== '/' && location.pathname.startsWith(section.url));
  return (
    <button
      onClick={() => { navigate(section.url); onClose(); }}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '8px 10px',
        marginBottom: 2,
        borderRadius: 8,
        border: 'none',
        background: isActive ? '#eff6ff' : 'transparent',
        cursor: 'pointer',
        transition: 'background 0.12s',
        textAlign: 'left',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8fafc'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
      <CustomIcon
        icon={section.icon}
        sx={{ fontSize: 16, color: isActive ? '#2563eb' : '#94a3b8', flexShrink: 0 }}
      />
      <span style={{ fontSize: 13.5, fontWeight: isActive ? 600 : 400, color: isActive ? '#1d4ed8' : '#64748b', flex: 1 }}>
        {section.label}
      </span>
      {isActive && (
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />
      )}
    </button>
  );
}
