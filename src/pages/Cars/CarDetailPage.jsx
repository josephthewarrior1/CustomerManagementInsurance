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
                    {value || <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>Tidak tersedia</span>}
                </Typography>
            </Box>
        </Stack>
    );
}

/* ─── READ ONLY IMAGE CARD ─── */
function DetailImageCard({ label, url, onPreview }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 1, display: 'block' }}>
                {label}
            </Typography>
            <Box
                onClick={() => url && onPreview(url)}
                sx={{
                    position: 'relative', width: '100%', paddingTop: '75%', borderRadius: 3, overflow: 'hidden',
                    border: url ? '1px solid #E2E8F0' : '2px dashed #CBD5E1',
                    bgcolor: '#F8FAFC', cursor: url ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    '&:hover': url ? { borderColor: '#1E40AF', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } : {}
                }}
            >
                {url ? (
                    <img src={url} alt={label} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon icon="mdi:camera-off" width={32} color="#CBD5E1" />
                        <Typography fontSize={13} fontWeight={600} sx={{ color: '#94A3B8', mt: 1 }}>Tidak Ada Foto</Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}

/* ─── READ ONLY DOC CARD ─── */
function DetailDocCard({ label, url, onPreview }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 1, display: 'block' }}>
                {label}
            </Typography>
            <Box
                onClick={() => url && onPreview(url)}
                sx={{
                    position: 'relative', width: '100%', height: 180, borderRadius: 3, overflow: 'hidden',
                    border: url ? '1px solid #E2E8F0' : '2px dashed #CBD5E1',
                    bgcolor: '#F8FAFC', cursor: url ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    '&:hover': url ? { borderColor: '#1E40AF', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } : {}
                }}
            >
                {url ? (
                    <img src={url} alt={label} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', bgcolor: '#fff' }} />
                ) : (
                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon icon="mdi:file-hidden" width={32} color="#CBD5E1" />
                        <Typography fontSize={13} fontWeight={600} sx={{ color: '#94A3B8', mt: 1 }}>Tidak Ada Dokumen</Typography>
                    </Box>
                )}
            </Box>
        </Box>
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
    if (!value) return 'Tidak tersedia';
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
                message(response.error || 'Kendaraan tidak ditemukan', 'error');
                navigate('/cars');
            }
        } catch (err) {
            console.error(err);
            message('Gagal memuat data kendaraan', 'error');
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
                message('Kendaraan berhasil dihapus', 'success');
                navigate('/cars');
            } else {
                message(response.error || 'Gagal menghapus kendaraan', 'error');
            }
        } catch (err) {
            message('Gagal menghapus kendaraan', 'error');
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
        { label: 'Depan', url: car.carPhotos?.front },
        { label: 'Belakang', url: car.carPhotos?.back },
        { label: 'Kiri', url: car.carPhotos?.leftSide },
        { label: 'Kanan', url: car.carPhotos?.rightSide },
    ];

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 8 }}>
            <Container maxWidth="lg" sx={{ pt: 4 }}>
                <Box sx={{ mb: 2 }}>
                    <Button onClick={() => navigate('/cars')} startIcon={<Icon icon="mdi:arrow-left" />} sx={{ color: '#475569', fontWeight: 600, textTransform: 'none', '&:hover': { bgcolor: 'transparent', color: '#1E293B' } }}>
                        Kembali ke Kendaraan
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
                        <Tab label="Info Kendaraan" icon={<Icon icon="mdi:car-info" width={20} />} iconPosition="start" />
                        <Tab label="Dokumen" icon={<Icon icon="mdi:file-document" width={20} />} iconPosition="start" />
                        <Tab label="Foto" icon={<Icon icon="mdi:camera" width={20} />} iconPosition="start" />
                    </Tabs>
                </Paper>

                {/* ── Tab 1: Car Info ── */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Icon icon="mdi:car-info" width={22} color="#1E40AF" /> Identitas Kendaraan
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 3 }}>
                                <Box sx={{ gridColumn: { md: 'span 4' } }}><InfoRow label="Merek Mobil" value={carBrand} icon="mdi:car" fullWidth /></Box>
                                <Box sx={{ gridColumn: { md: 'span 4' } }}><InfoRow label="Model Mobil" value={carModel} icon="mdi:car-side" fullWidth /></Box>
                                <Box sx={{ gridColumn: { md: 'span 4' } }}><InfoRow label="Nomor Polisi" value={plateNumber} icon="mdi:numeric" fullWidth /></Box>
                                
                                <Box sx={{ gridColumn: { md: 'span 4' } }}><InfoRow label="Tahun" value={car.carData?.year || '-'} icon="mdi:calendar" fullWidth /></Box>
                                <Box sx={{ gridColumn: { md: 'span 4' } }}><InfoRow label="Warna" value={car.carData?.color || '-'} icon="mdi:palette" fullWidth /></Box>
                                <Box sx={{ gridColumn: { md: 'span 4' } }}><InfoRow label="Nama Pemilik" value={car.carData?.ownerName} icon="mdi:account" fullWidth /></Box>
                                
                                <Box sx={{ gridColumn: { md: 'span 12' }, borderBottom: '1px dashed #E2E8F0', my: 1 }} />
                                
                                <Box sx={{ gridColumn: { md: 'span 6' } }}><InfoRow label="Nomor Rangka" value={car.carData?.chassisNumber} icon="mdi:barcode" fullWidth /></Box>
                                <Box sx={{ gridColumn: { md: 'span 6' } }}><InfoRow label="Nomor Mesin" value={car.carData?.engineNumber} icon="mdi:engine" fullWidth /></Box>
                            </Box>
                        </Paper>

                        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Icon icon="mdi:cash" width={22} color="#1E40AF" /> Finansial & Asuransi
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                                <Box sx={{ gridColumn: { md: 'span 1' } }}><InfoRow label="Harga Kendaraan" value={formatCurrency(car.carData?.carPrice)} icon="mdi:cash-multiple" fullWidth /></Box>
                                <Box sx={{ gridColumn: { md: 'span 1' } }}><InfoRow label="Tanggal Mulai" value={car.carData?.startDate || '-'} icon="mdi:calendar-arrow-right" fullWidth /></Box>
                                <Box sx={{ gridColumn: { md: 'span 1' } }}><InfoRow label="Jatuh Tempo Asuransi" value={car.carData?.dueDate || '-'} icon="mdi:calendar-clock" fullWidth /></Box>
                                <Box sx={{ gridColumn: { md: 'span 3' } }}><InfoRow label="Catatan Tambahan" value={car.notes || '-'} icon="mdi:note-text" fullWidth /></Box>
                            </Box>
                        </Paper>
                    </Box>
                </TabPanel>

                {/* ── Tab 2: Documents ── */}
                <TabPanel value={tabValue} index={1}>
                    <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icon icon="mdi:folder-account-outline" width={22} color="#1E40AF" /> Kelengkapan Dokumen
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748B', mb: 4 }}>
                            Klik pada dokumen untuk membesarkan atau mengunduh.
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4 }}>
                            {docPhotos.map(doc => (
                                <DetailDocCard key={doc.key} label={doc.label} url={doc.url} onPreview={(u) => openPhotoPreview([u])} />
                            ))}
                        </Box>
                    </Paper>
                </TabPanel>

                {/* ── Tab 3: Car Photos ── */}
                <TabPanel value={tabValue} index={2}>
                    <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icon icon="mdi:camera-burst" width={22} color="#1E40AF" /> Galeri Foto Kendaraan
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748B', mb: 4 }}>
                            Klik pada foto untuk mengunduh atau melihat ukuran penuh.
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
                            {carPhotos.map(photo => (
                                <DetailImageCard key={photo.label} label={`Sisi ${photo.label}`} url={photo.url} onPreview={(url) => {
                                    const allValidPhotos = carPhotos.filter(p => p.url).map(p => p.url);
                                    openPhotoPreview(allValidPhotos);
                                }} />
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
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Hapus Kendaraan</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Yakin ingin menghapus <b>{carBrand} {carModel}</b> ({plateNumber})? Tindakan ini tidak dapat dibatalkan.
                    </Typography>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button variant="outlined" onClick={() => setIsDeleteDialogOpen(false)}
                            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#E2E8F0', color: '#475569' }}>Batal</Button>
                        <Button variant="contained" onClick={handleDelete} disabled={deleting}
                            sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}>
                            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Hapus'}
                        </Button>
                    </Stack>
                </Box>
            </Dialog>
        </Box>
    );
}
