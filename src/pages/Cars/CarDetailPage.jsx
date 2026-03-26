import { Icon } from '@iconify/react';
import {
    Box, Container, Typography, Button, Grid, Paper, Tabs, Tab,
    Stack, Avatar, Chip, Dialog, useTheme, useMediaQuery, CircularProgress, Divider, IconButton
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CarDAO from '../../daos/CarDao';

/* ─── TAB PANEL ─── */
function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index}>
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

/* ─── INFO ROW ─── */
function InfoRow({ label, value, icon, fullWidth }) {
    return (
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 1, borderBottom: '1px solid #F1F5F9' }}>
            <Box sx={{ mt: 0.3, color: '#94A3B8', flexShrink: 0 }}>
                <Icon icon={icon || 'mdi:information'} width={18} />
            </Box>
            <Box sx={{ flex: fullWidth ? 1 : undefined, minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>
                    {label}
                </Typography>
                <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 500, wordBreak: 'break-word' }}>
                    {value || <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>Not available</span>}
                </Typography>
            </Box>
        </Stack>
    );
}

/* ─── IMAGE PREVIEW DIALOG ─── */
function ImagePreviewDialog({ open, images, currentIndex, onClose, onIndexChange }) {
    const handleDownload = async () => {
        try {
            const url = images[currentIndex];
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `photo_${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback for direct download if fetch fails (CORS)
            const link = document.createElement('a');
            link.href = images[currentIndex];
            link.download = `photo_${Date.now()}.jpg`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ style: { background: '#000', borderRadius: 0 } }}>
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, p: 2 }}>
                <Button onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', minWidth: 0, zIndex: 10 }}>
                    <Icon icon="mdi:close" width={28} />
                </Button>
                <Button onClick={handleDownload} sx={{ position: 'absolute', top: 8, right: 56, color: '#fff', minWidth: 0, zIndex: 10 }}>
                    <Icon icon="mdi:download" width={24} />
                </Button>
                {images.length > 0 && (
                    <img src={images[currentIndex]} alt="preview" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
                )}
                {images.length > 1 && (
                    <>
                        <Button onClick={() => onIndexChange((currentIndex - 1 + images.length) % images.length)}
                            sx={{ position: 'absolute', left: 8, color: '#fff', minWidth: 0, zIndex: 10 }}>
                            <Icon icon="mdi:chevron-left" width={32} />
                        </Button>
                        <Button onClick={() => onIndexChange((currentIndex + 1) % images.length)}
                            sx={{ position: 'absolute', right: 8, color: '#fff', minWidth: 0, zIndex: 10 }}>
                            <Icon icon="mdi:chevron-right" width={32} />
                        </Button>
                    </>
                )}
            </Box>
        </Dialog>
    );
}

const formatCurrency = (value) => {
    if (!value) return 'Not available';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const getStatusColor = (status) => {
    switch (status) {
        case 'Active': return { bg: '#D1FAE5', color: '#065F46' };
        case 'Expired': return { bg: '#FEE2E2', color: '#991B1B' };
        case 'Cancelled': return { bg: '#F1F5F9', color: '#475569' };
        default: return { bg: '#F1F5F9', color: '#475569' };
    }
};

export default function CarDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const loadingProvider = useLoading();
    const message = useAlert();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [previewState, setPreviewState] = useState({ open: false, images: [], index: 0 });

    useEffect(() => {
        fetchCar();
    }, [id]);

    const fetchCar = async () => {
        try {
            loadingProvider.start();
            const response = await CarDAO.getCarById(id);
            if (response.success || response.car) {
                setCar(response.car || response);
            } else {
                message(response.error || 'Car not found', 'error');
                navigate('/cars');
            }
        } catch (err) {
            console.error(err);
            message('Failed to fetch car data', 'error');
            navigate('/cars');
        } finally {
            loadingProvider.stop();
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            loadingProvider.start();
            const response = await CarDAO.deleteCar(id);
            if (response.success) {
                message('Car deleted successfully', 'success');
                navigate('/cars');
            } else {
                message(response.error || 'Failed to delete car', 'error');
            }
        } catch (err) {
            message('Failed to delete car', 'error');
        } finally {
            loadingProvider.stop();
            setDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    const openPhotoPreview = (photoUrls) => {
        const validPhotos = photoUrls.filter(p => p && p.trim() !== '');
        if (validPhotos.length > 0) {
            setPreviewState({ open: true, images: validPhotos, index: 0 });
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!car) return null;

    const carBrand = car.carData?.carBrand || '-';
    const carModel = car.carData?.carModel || '-';
    const plateNumber = car.carData?.plateNumber || '-';
    const statusColors = getStatusColor(car.status);

    const docPhotos = [
        { label: 'STNK', key: 'stnk', url: car.documentPhotos?.stnk },
        { label: 'SIM', key: 'sim', url: car.documentPhotos?.sim },
        { label: 'KTP', key: 'ktp', url: car.documentPhotos?.ktp },
    ];

    const carPhotos = [
        { label: 'Front', url: car.carPhotos?.front },
        { label: 'Back', url: car.carPhotos?.back },
        { label: 'Left', url: car.carPhotos?.leftSide },
        { label: 'Right', url: car.carPhotos?.rightSide },
    ];

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 8 }}>
            <Container maxWidth="lg" sx={{ pt: 4 }}>
                <Box sx={{ mb: 2 }}>
                    <Button onClick={() => navigate('/cars')} startIcon={<Icon icon="mdi:arrow-left" />} sx={{ color: '#475569', fontWeight: 600, textTransform: 'none', '&:hover': { bgcolor: 'transparent', color: '#1E293B' } }}>
                        Back to Cars
                    </Button>
                </Box>
                {/* ── Header Card ── */}
                <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff', position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                        <Stack direction="row" spacing={1}>
                            <IconButton onClick={() => navigate(`/cars/edit/${id}`)} sx={{ color: '#1E40AF', bgcolor: '#EFF6FF', borderRadius: 2 }}>
                                <Icon icon="mdi:pencil" width={22} />
                            </IconButton>
                            <IconButton onClick={() => setIsDeleteDialogOpen(true)} sx={{ color: '#DC2626', bgcolor: '#FEF2F2', borderRadius: 2 }}>
                                <Icon icon="mdi:trash-can" width={22} />
                            </IconButton>
                        </Stack>
                    </Box>
                    <Stack direction="row" spacing={3} alignItems="center">
                        <Avatar sx={{ width: 72, height: 72, bgcolor: '#EFF6FF', color: '#1E40AF', fontSize: '2rem' }}>
                            <Icon icon="mdi:car" width={40} />
                        </Avatar>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B', mb: 0.5 }}>
                                {carBrand} {carModel}
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#64748B', fontWeight: 500, mb: 1 }}>
                                {plateNumber}
                            </Typography>
                            <Chip label={car.status || 'Active'} size="small"
                                sx={{ bgcolor: statusColors.bg, color: statusColors.color, fontWeight: 700, fontSize: '0.75rem', borderRadius: '8px' }} />
                        </Box>
                    </Stack>
                </Paper>

                {/* ── Tabs ── */}
                <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#fff', overflow: 'hidden' }}>
                    <Tabs
                        value={tabValue} onChange={(_, v) => setTabValue(v)}
                        variant={isMobile ? 'scrollable' : 'fullWidth'}
                        scrollButtons="auto"
                        sx={{ borderBottom: '1px solid #E2E8F0', '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 56 }, '& .Mui-selected': { color: '#1E40AF' }, '& .MuiTabs-indicator': { bgcolor: '#1E40AF', height: 3 } }}
                    >
                        <Tab label="Car Info" icon={<Icon icon="mdi:car-info" width={20} />} iconPosition="start" />
                        <Tab label="Documents" icon={<Icon icon="mdi:file-document" width={20} />} iconPosition="start" />
                        <Tab label="Photos" icon={<Icon icon="mdi:camera" width={20} />} iconPosition="start" />
                    </Tabs>
                </Paper>

                {/* ── Tab 1: Car Info ── */}
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Icon icon="mdi:account" width={20} color="#1E40AF" /> Vehicle Information
                                </Typography>
                                <InfoRow label="Owner Name" value={car.carData?.ownerName} icon="mdi:account" />
                                <InfoRow label="Car Brand" value={car.carData?.carBrand} icon="mdi:car" />
                                <InfoRow label="Car Model" value={car.carData?.carModel} icon="mdi:car-info" />
                                <InfoRow label="Plate Number" value={car.carData?.plateNumber} icon="mdi:numeric" />
                                <InfoRow label="Chassis Number" value={car.carData?.chassisNumber} icon="mdi:barcode" />
                                <InfoRow label="Engine Number" value={car.carData?.engineNumber} icon="mdi:engine" />
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Icon icon="mdi:cash" width={20} color="#1E40AF" /> Financial & Insurance
                                </Typography>
                                <InfoRow label="Vehicle Price" value={formatCurrency(car.carData?.carPrice)} icon="mdi:cash" />
                                <InfoRow label="Insurance Due Date" value={car.carData?.dueDate} icon="mdi:calendar" />
                                <InfoRow label="Notes" value={car.notes} icon="mdi:note-text" fullWidth />
                            </Paper>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* ── Tab 2: Documents ── */}
                <TabPanel value={tabValue} index={1}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', mb: 2 }}>Document Photos</Typography>
                                <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
                                    {docPhotos.map(doc => (
                                        <Box key={doc.key} sx={{ flexShrink: 0, width: 90 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 0.5, display: 'block' }}>{doc.label}</Typography>
                                            {doc.url ? (
                                                <Box
                                                    component="img" src={doc.url} alt={doc.label}
                                                    onClick={() => openPhotoPreview([doc.url])}
                                                    sx={{ display: 'block', width: 90, height: 90, objectFit: 'cover', borderRadius: 2, cursor: 'pointer', border: '1px solid #E2E8F0', '&:hover': { opacity: 0.85 } }}
                                                />
                                            ) : (
                                                <Box sx={{ width: 90, height: 90, borderRadius: 2, border: '1px dashed #CBD5E1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#F8FAFC', opacity: 0.7 }}>
                                                    <Icon icon="mdi:camera-off" width={20} color="#94A3B8" />
                                                    <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '10px', mt: 0.5 }}>Empty</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* ── Tab 3: Car Photos ── */}
                <TabPanel value={tabValue} index={2}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icon icon="mdi:camera" width={20} color="#1E40AF" /> Car Photos
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
                            {carPhotos.map(photo => (
                                <Box key={photo.label} sx={{ flexShrink: 0, width: 90 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 0.5, display: 'block' }}>{photo.label}</Typography>
                                    {photo.url ? (
                                        <Box
                                            component="img" src={photo.url} alt={photo.label}
                                            onClick={() => openPhotoPreview(carPhotos.filter(p => p.url).map(p => p.url))}
                                            sx={{ display: 'block', width: 90, height: 90, objectFit: 'cover', borderRadius: 2, cursor: 'pointer', border: '1px solid #E2E8F0', '&:hover': { opacity: 0.85 } }}
                                        />
                                    ) : (
                                        <Box sx={{ width: 90, height: 90, borderRadius: 2, border: '1px dashed #CBD5E1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#F8FAFC', opacity: 0.7 }}>
                                            <Icon icon="mdi:camera-off" width={20} color="#94A3B8" />
                                            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '10px', mt: 0.5 }}>Empty</Typography>
                                        </Box>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </TabPanel>

            </Container>

            {/* Image Preview */}
            <ImagePreviewDialog
                open={previewState.open}
                images={previewState.images}
                currentIndex={previewState.index}
                onIndexChange={(i) => setPreviewState(p => ({ ...p, index: i }))}
                onClose={() => setPreviewState({ open: false, images: [], index: 0 })}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ style: { borderRadius: '16px' } }}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Delete Car</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Are you sure you want to delete <b>{carBrand} {carModel}</b> ({plateNumber})? This action cannot be undone.
                    </Typography>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button variant="outlined" onClick={() => setIsDeleteDialogOpen(false)}
                            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#E2E8F0', color: '#475569' }}>Cancel</Button>
                        <Button variant="contained" onClick={handleDelete} disabled={deleting}
                            sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}>
                            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
                        </Button>
                    </Stack>
                </Box>
            </Dialog>
        </Box>
    );
}
