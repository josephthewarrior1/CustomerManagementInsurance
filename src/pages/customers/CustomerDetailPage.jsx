import { Icon } from '@iconify/react';
import {
    Box,
    Container,
    Typography,
    Button,
    Grid,
    Chip,
    Avatar,
    IconButton,
    Paper,
    Tab,
    Tabs,
    Stack,
    Dialog,
    Fade,
    CircularProgress
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CustomerDAO from '../../daos/CustomerDao';
import CreateCarDialog from '../Cars/CreateCarDialog';
// import CreatePropertyDialog from '../Property/CreatePropertyDialog';

/* ---------------- TAB PANEL ---------------- */
function TabPanel({ children, value, index }) {
    return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

/* ---------------- IMAGE PREVIEW DIALOG ---------------- */
function ImagePreviewDialog({ open, images, currentIndex, onIndexChange, onClose }) {
    if (!images || images.length === 0) return null;

    const currentImage = images[currentIndex];

    const handlePrevious = (e) => {
        e.stopPropagation();
        onIndexChange((currentIndex - 1 + images.length) % images.length);
    };

    const handleNext = (e) => {
        e.stopPropagation();
        onIndexChange((currentIndex + 1) % images.length);
    };

    const handleDownload = async (e) => {
        e.stopPropagation();
        try {
            const response = await fetch(currentImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Try to extract filename or use a default
            const filename = currentImage.split('/').pop().split('?')[0] || 'download.jpg';
            link.setAttribute('download', filename);

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback: open in new tab if blob download fails (CORS)
            window.open(currentImage, '_blank');
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen
            TransitionComponent={Fade}
            PaperProps={{
                sx: { bgcolor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)' }
            }}
        >
            {/* Header Controls */}
            <Box sx={{
                position: 'fixed', top: 0, left: 0, right: 0,
                p: 2, display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', zIndex: 10,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)'
            }}>
                <Typography sx={{ color: '#fff', fontWeight: 600, ml: 2 }}>
                    {currentIndex + 1} / {images.length}
                </Typography>

                <Stack direction="row" spacing={1.5}>
                    <IconButton
                        onClick={handleDownload}
                        sx={{
                            color: '#fff', bgcolor: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                        }}
                        title="Download"
                    >
                        <Icon icon="mdi:download" width={24} />
                    </IconButton>
                    <IconButton
                        onClick={onClose}
                        sx={{
                            color: '#fff', bgcolor: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                        }}
                    >
                        <Icon icon="mdi:close" width={24} />
                    </IconButton>
                </Stack>
            </Box>

            {/* Navigation Buttons */}
            {images.length > 1 && (
                <>
                    <IconButton
                        onClick={handlePrevious}
                        sx={{
                            position: 'absolute', left: 24, top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#fff', bgcolor: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)', zIndex: 10,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                            display: { xs: 'none', md: 'flex' }
                        }}
                    >
                        <Icon icon="mdi:chevron-left" width={40} />
                    </IconButton>
                    <IconButton
                        onClick={handleNext}
                        sx={{
                            position: 'absolute', right: 24, top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#fff', bgcolor: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)', zIndex: 10,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                            display: { xs: 'none', md: 'flex' }
                        }}
                    >
                        <Icon icon="mdi:chevron-right" width={40} />
                    </IconButton>
                </>
            )}

            {/* Image Container */}
            <Box
                onClick={onClose}
                sx={{
                    height: '100vh', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', position: 'relative', p: { xs: 2, md: 8 }
                }}
            >
                <Box
                    component="img"
                    src={currentImage}
                    alt="Preview"
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                        maxWidth: '100%', maxHeight: '100%', borderRadius: 2,
                        objectFit: 'contain', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        transition: 'transform 0.3s ease-out'
                    }}
                />

                {/* Mobile Navigation Area (Tap left/right) */}
                <Box sx={{
                    position: 'absolute', top: 0, left: 0, bottom: 0, width: '30%',
                    zIndex: 5, cursor: 'pointer', display: { xs: 'block', md: 'none' }
                }} onClick={handlePrevious} />
                <Box sx={{
                    position: 'absolute', top: 0, right: 0, bottom: 0, width: '30%',
                    zIndex: 5, cursor: 'pointer', display: { xs: 'block', md: 'none' }
                }} onClick={handleNext} />
            </Box>
        </Dialog>
    );
}

/* ---------------- INFO CARD ---------------- */
function InfoCard({ title, children }) {
    return (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 2.5, fontSize: '1rem' }}>
                {title}
            </Typography>
            <Stack spacing={2.5}>{children}</Stack>
        </Paper>
    );
}

/* ---------------- INFO ROW ---------------- */
function InfoRow({ label, value, icon, fullWidth }) {
    return (
        <Box>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box sx={{
                    mt: 0.5, width: 36, height: 36, borderRadius: 2,
                    bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0
                }}>
                    <Icon icon={icon} width={18} color="#1E40AF" />
                </Box>
                <Box flex={1}>
                    <Typography variant="caption" sx={{
                        color: '#64748B', fontSize: '0.8125rem', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 0.5
                    }}>
                        {label}
                    </Typography>
                    <Typography variant="body1" sx={{
                        color: '#1E293B', fontSize: '0.9375rem', fontWeight: 500,
                        lineHeight: 1.6, wordBreak: fullWidth ? 'break-word' : 'normal'
                    }}>
                        {value || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Tidak tersedia</span>}
                    </Typography>
                </Box>
            </Stack>
        </Box>
    );
}

/* ---------------- MAIN COMPONENT ---------------- */
export default function CustomerDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const message = useAlert();
    const loadingProvider = useLoading();

    const [customer, setCustomer] = useState(null);
    const [cars, setCars] = useState([]);
    // const [properties, setProperties] = useState([]);

    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [previewState, setPreviewState] = useState({ open: false, images: [], index: 0 });
    const [isCarDialogOpen, setIsCarDialogOpen] = useState(false);
    // const [isPropertyDialogOpen, setIsPropertyDialogOpen] = useState(false);

    useEffect(() => {
        fetchCustomer();
    }, [id]);

    const fetchCustomer = async () => {
        try {
            loadingProvider.start();
            const response = await CustomerDAO.getCustomerById(id);
            if (response.success) {
                setCustomer(response.customer);
                setCars(response.cars || []);
                // setProperties(response.properties || []);
            } else {
                message(response.error || 'Pelanggan tidak ditemukan', 'error');
                navigate('/customers');
            }
        } catch (error) {
            console.error('Error fetching customer:', error);
            message('Gagal mengambil data pelanggan', 'error');
            navigate('/customers');
        } finally {
            loadingProvider.stop();
            setLoading(false);
        }
    };

    const handleCarCreated = (newCar) => {
        setCars(prev => [...prev, newCar]);
    };

    // const handlePropertyCreated = (newProperty) => {
    //     setProperties(prev => [...prev, newProperty]);
    // };

    const formatDate = (ts) =>
        ts
            ? new Date(ts).toLocaleString('id-ID', {
                day: '2-digit', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            })
            : 'Tidak tersedia';

    const formatCurrency = (value) => {
        if (!value) return 'Tidak tersedia';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        }).format(value);
    };

    const statusColor = (s) => {
        switch (s) {
            case 'Active': return '#10B981';
            case 'Expired': return '#DC2626';
            default: return '#64748B';
        }
    };

    const statusBgColor = (s) => {
        switch (s) {
            case 'Active': return '#D1FAE5';
            case 'Expired': return '#FEE2E2';
            default: return '#F1F5F9';
        }
    };

    const statusLabel = (s) => {
        switch (s) {
            case 'Active': return 'Aktif';
            case 'Expired': return 'Kedaluwarsa';
            case 'Cancelled': return 'Dibatalkan';
            default: return s || '-';
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!customer) return null;

    const hasPhotos = customer.carPhotos &&
        Object.values(customer.carPhotos).some(url => url && url.trim() !== '');

    const hasDocuments = customer.documentPhotos &&
        Object.values(customer.documentPhotos).some(url => url && url.trim() !== '');

    return (
        <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', pb: 6 }}>
            <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5 } }}>

                {/* ── HEADER ── */}
                <Box sx={{ mb: 3 }}>
                    <Button
                        onClick={() => navigate('/customers')}
                        startIcon={<Icon icon="mdi:arrow-left" />}
                        sx={{
                            color: '#64748B', fontWeight: 600, textTransform: 'none',
                            fontSize: '0.9375rem', px: 1,
                            '&:hover': { bgcolor: 'transparent', color: '#1E40AF' }
                        }}
                    >
                        Kembali ke Pelanggan
                    </Button>
                </Box>

                {/* ── PROFILE CARD ── */}
                <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff', position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                        <IconButton onClick={() => navigate(`/customers/edit/${id}`)} sx={{ color: '#1E40AF', bgcolor: '#EFF6FF', borderRadius: 2 }}>
                            <Icon icon="mdi:pencil" width={22} />
                        </IconButton>
                    </Box>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                        <Avatar sx={{
                            width: 80, height: 80, bgcolor: '#1E40AF',
                            fontSize: '2rem', fontWeight: 700,
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                        }}>
                            {customer.name?.[0]?.toUpperCase()}
                        </Avatar>

                        <Box flex={1} sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E293B', mb: 0.5, fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                                {customer.name}
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center" justifyContent={{ xs: 'center', sm: 'flex-start' }} sx={{ mt: 1 }}>
                                <Chip
                                    label={statusLabel(customer.status || 'Active')}
                                    size="small"
                                    sx={{
                                        bgcolor: statusBgColor(customer.status || 'Active'),
                                        color: statusColor(customer.status || 'Active'),
                                        fontWeight: 700, fontSize: '0.75rem', borderRadius: '8px'
                                    }}
                                />
                                <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Icon icon="mdi:identifier" width={16} />
                                    {customer.id}
                                </Typography>
                            </Stack>
                        </Box>
                    </Stack>
                </Paper>

                {/* ── TABS ── */}
                <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden', mb: 4 }}>
                    <Tabs
                        value={tabValue}
                        onChange={(_, v) => setTabValue(v)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            bgcolor: '#fff',
                            '& .MuiTab-root': {
                                textTransform: 'none', fontWeight: 600, fontSize: '0.9375rem',
                                color: '#64748B', py: 2, minHeight: 56,
                                '&.Mui-selected': { color: '#1E40AF' }
                            },
                            '& .MuiTabs-indicator': { height: 3, bgcolor: '#1E40AF', borderRadius: '3px 3px 0 0' }
                        }}
                    >
                        <Tab label="Info Pribadi" icon={<Icon icon="mdi:account" width={20} />} iconPosition="start" />
                        <Tab label={`Kendaraan (${cars.length})`} icon={<Icon icon="mdi:car" width={20} />} iconPosition="start" />
                        {/* <Tab label={`Properti (${properties.length})`} icon={<Icon icon="mdi:home" width={20} />} iconPosition="start" /> */}
                    </Tabs>
                </Paper>

                {/* ── TAB: PERSONAL INFO ── */}
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <InfoCard title="Informasi Kontak">
                                <InfoRow label="Nomor Telepon" value={customer.phone} icon="mdi:phone" />
                                <InfoRow label="Alamat" value={customer.address} icon="mdi:map-marker" />
                            </InfoCard>
                        </Grid>
                        <Grid item xs={12}>
                            <InfoCard title="Informasi Tambahan">
                                <InfoRow label="Catatan" value={customer.notes} icon="mdi:note-text" fullWidth />
                                <InfoRow label="Tanggal Pendaftaran" value={formatDate(customer.createdAt)} icon="mdi:calendar-plus" />
                                <InfoRow label="Terakhir Diperbarui" value={formatDate(customer.updatedAt)} icon="mdi:calendar-edit" />
                            </InfoCard>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* ── TAB: CARS ── */}
                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>
                            Kendaraan Terkait
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Icon icon="mdi:plus" />}
                            onClick={() => setIsCarDialogOpen(true)}
                            sx={{
                                bgcolor: '#1E40AF', color: '#fff', fontWeight: 600, textTransform: 'none',
                                borderRadius: 2, '&:hover': { bgcolor: '#1E3A8A' }
                            }}
                        >
                            Tambah Kendaraan
                        </Button>
                    </Box>

                    {cars.length > 0 ? (
                        <Grid container spacing={3}>
                            {cars.map((car) => (
                                <Grid item xs={12} md={6} key={car.id}>
                                    <Paper 
                                        elevation={0} 
                                        onClick={() => navigate(`/cars/${car.id}`)}
                                        sx={{ 
                                            p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', 
                                            bgcolor: '#fff', cursor: 'pointer', transition: 'all 0.2s',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            '&:hover': { borderColor: '#CBD5E1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } 
                                        }}
                                    >
                                        <Stack direction="row" spacing={2} alignItems="center" sx={{ overflow: 'hidden' }}>
                                            <Avatar sx={{ bgcolor: '#EFF6FF', color: '#1E40AF', width: 44, height: 44, flexShrink: 0 }}>
                                                <Icon icon="mdi:car" width={22} />
                                            </Avatar>
                                            <Box sx={{ overflow: 'hidden' }}>
                                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '1.05rem' }} noWrap>
                                                    {car.carData?.carBrand} {car.carData?.carModel}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }} noWrap>
                                                    {car.carData?.plateNumber}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <Icon icon="mdi:chevron-right" width={24} color="#CBD5E1" style={{ flexShrink: 0 }} />
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: 3, border: '2px dashed #E2E8F0', bgcolor: '#F8FAFC' }}>
                            <Icon icon="mdi:car-off" width={64} color="#CBD5E1" />
                            <Typography variant="h6" sx={{ mt: 2, color: '#64748B', fontWeight: 600 }}>Belum ada kendaraan</Typography>
                            <Typography variant="body2" sx={{ mt: 1, color: '#94A3B8' }}>Pelanggan ini belum memiliki kendaraan terdaftar.</Typography>
                        </Paper>
                    )}
                </TabPanel>

                {/* ── TAB: PROPERTIES ── */}
                {/* <TabPanel value={tabValue} index={2}>
                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>
                            Properti Terkait
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Icon icon="mdi:plus" />}
                            onClick={() => setIsPropertyDialogOpen(true)}
                            sx={{
                                bgcolor: '#1E40AF', color: '#fff', fontWeight: 600, textTransform: 'none',
                                borderRadius: 2, '&:hover': { bgcolor: '#1E3A8A' }
                            }}
                        >
                            Tambah Properti
                        </Button>
                    </Box>

                    {properties.length > 0 ? (
                        <Grid container spacing={3}>
                            {properties.map((property) => (
                                <Grid item xs={12} md={6} key={property.id}>
                                    <Paper 
                                        elevation={0} 
                                        onClick={() => navigate(`/properties/${property.id}`)}
                                        sx={{ 
                                            p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', 
                                            bgcolor: '#fff', cursor: 'pointer', transition: 'all 0.2s',
                                            '&:hover': { borderColor: '#CBD5E1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } 
                                        }}
                                    >
                                        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                            <Stack direction="row" spacing={2} alignItems="center" sx={{ overflow: 'hidden' }}>
                                                <Avatar sx={{ bgcolor: '#EFF6FF', color: '#1E40AF', width: 44, height: 44, flexShrink: 0 }}>
                                                    <Icon icon="mdi:home" width={22} />
                                                </Avatar>
                                                <Box sx={{ overflow: 'hidden' }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '1.05rem' }} noWrap>
                                                        {property.propertyData?.propertyType || 'Properti'}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }} noWrap>
                                                        {property.propertyData?.address}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                            <Icon icon="mdi:chevron-right" width={24} color="#CBD5E1" style={{ flexShrink: 0 }} />
                                        </Stack>
                                        <Divider sx={{ my: 1.5, borderColor: '#F1F5F9' }} />
                                        <Stack spacing={1}>
                                            <InfoRow label="Nilai Properti" value={formatCurrency(property.propertyData?.propertyValue)} icon="mdi:cash" />
                                            <InfoRow label="Asuransi Berakhir" value={property.insuranceData?.endDate ? new Date(property.insuranceData.endDate).toLocaleDateString('id-ID') : 'Belum diatur'} icon="mdi:calendar" />
                                        </Stack>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: 3, border: '2px dashed #E2E8F0', bgcolor: '#F8FAFC' }}>
                            <Icon icon="mdi:home-off" width={64} color="#CBD5E1" />
                            <Typography variant="h6" sx={{ mt: 2, color: '#64748B', fontWeight: 600 }}>Belum ada properti</Typography>
                            <Typography variant="body2" sx={{ mt: 1, color: '#94A3B8' }}>Pelanggan ini belum memiliki properti terdaftar.</Typography>
                        </Paper>
                    )}
                </TabPanel> */}

            </Container>

            {/* Image fullscreen preview */}
            <ImagePreviewDialog
                open={previewState.open}
                images={previewState.images}
                currentIndex={previewState.index}
                onIndexChange={(newIndex) => setPreviewState(prev => ({ ...prev, index: newIndex }))}
                onClose={() => setPreviewState({ open: false, images: [], index: 0 })}
            />

            {/* Create Asset Dialogs */}
            <CreateCarDialog
                open={isCarDialogOpen}
                onClose={() => setIsCarDialogOpen(false)}
                customerId={id}
                onCarCreated={handleCarCreated}
            />
            {/* <CreatePropertyDialog
                open={isPropertyDialogOpen}
                onClose={() => setIsPropertyDialogOpen(false)}
                customerId={id}
                onPropertyCreated={handlePropertyCreated}
            /> */}
        </Box>
    );
}
