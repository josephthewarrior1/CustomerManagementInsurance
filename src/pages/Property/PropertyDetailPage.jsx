import { Icon } from '@iconify/react';
import {
    Box, Container, Typography, Button, Grid, Paper, Tabs, Tab,
    Stack, Avatar, Chip, Dialog, useTheme, useMediaQuery, CircularProgress, IconButton
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import PropertyDAO from '../../daos/propertyDao';

function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index}>
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

function InfoRow({ label, value, icon }) {
    return (
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 1, borderBottom: '1px solid #F1F5F9' }}>
            <Box sx={{ mt: 0.3, color: '#94A3B8', flexShrink: 0 }}>
                <Icon icon={icon || 'mdi:information'} width={18} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
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

function ImagePreviewDialog({ open, images, currentIndex, onClose, onIndexChange }) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ style: { background: '#000', borderRadius: 0 } }}>
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, p: 2 }}>
                <Button onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', minWidth: 0, zIndex: 10 }}>
                    <Icon icon="mdi:close" width={28} />
                </Button>
                {images.length > 0 && (
                    <img src={images[currentIndex]} alt="preview" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
                )}
                {images.length > 1 && (
                    <>
                        <Button onClick={() => onIndexChange((currentIndex - 1 + images.length) % images.length)} sx={{ position: 'absolute', left: 8, color: '#fff', minWidth: 0, zIndex: 10 }}>
                            <Icon icon="mdi:chevron-left" width={32} />
                        </Button>
                        <Button onClick={() => onIndexChange((currentIndex + 1) % images.length)} sx={{ position: 'absolute', right: 8, color: '#fff', minWidth: 0, zIndex: 10 }}>
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

const formatDate = (value) => {
    if (!value) return 'Tidak tersedia';
    return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const getStatusColor = (status) => {
    switch (status) {
        case 'Active': return { bg: '#D1FAE5', color: '#065F46', label: 'Aktif' };
        case 'Expired': return { bg: '#FEE2E2', color: '#991B1B', label: 'Kedaluwarsa' };
        case 'Cancelled': return { bg: '#F1F5F9', color: '#475569', label: 'Dibatalkan' };
        default: return { bg: '#F1F5F9', color: '#475569', label: status || 'Tidak diketahui' };
    }
};

const PROPERTY_TYPE_LABELS = {
    House: 'Rumah',
    Apartment: 'Apartemen',
    Office: 'Kantor',
    Warehouse: 'Gudang',
    Shop: 'Ruko',
    Land: 'Tanah',
};

export default function PropertyDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const loadingProvider = useLoading();
    const message = useAlert();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [previewState, setPreviewState] = useState({ open: false, images: [], index: 0 });

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const response = await PropertyDAO.getPropertyById(id);
                const data = response.property || response.data || response;
                if (response.success || data?.id) {
                    setProperty(data);
                } else {
                    message(response.error || 'Properti tidak ditemukan', 'error');
                    navigate('/properties');
                }
            } catch (error) {
                console.error(error);
                message('Gagal memuat detail properti', 'error');
                navigate('/properties');
            } finally {
                setLoading(false);
            }
        };

        fetchProperty();
        // Disamakan dengan pola detail mobil supaya fetch hanya jalan saat id berubah.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!property) return null;

    const ownerName = property.ownerName || property.customerName || 'Pemilik Properti';
    const propertyType = PROPERTY_TYPE_LABELS[property.propertyData?.propertyType] || property.propertyData?.propertyType || 'Properti';
    const statusColors = getStatusColor(property.status);
    const documentItems = [
        { label: 'Sertifikat', url: property.documents?.certificate },
        { label: 'IMB', url: property.documents?.imb },
        { label: 'PBB', url: property.documents?.pbb },
        { label: 'Lainnya', url: property.documents?.other },
    ];
    const photoItems = [
        { label: 'Depan', url: property.propertyPhotos?.front },
        { label: 'Belakang', url: property.propertyPhotos?.back },
        { label: 'Kiri', url: property.propertyPhotos?.left },
        { label: 'Kanan', url: property.propertyPhotos?.right },
        { label: 'Interior 1', url: property.propertyPhotos?.interior1 },
        { label: 'Interior 2', url: property.propertyPhotos?.interior2 },
        { label: 'Interior 3', url: property.propertyPhotos?.interior3 },
        { label: 'Interior 4', url: property.propertyPhotos?.interior4 },
    ];

    const openPreview = (items, currentUrl) => {
        const images = items.map((item) => item.url).filter(Boolean);
        const index = Math.max(images.indexOf(currentUrl), 0);
        if (images.length) {
            setPreviewState({ open: true, images, index });
        }
    };

    const renderMediaCard = (items, emptyLabel) => (
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
            {items.map((item) => (
                <Box key={item.label} sx={{ flexShrink: 0, width: 100 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                        {item.label}
                    </Typography>
                    {item.url ? (
                        <Box
                            component="img"
                            src={item.url}
                            alt={item.label}
                            onClick={() => openPreview(items, item.url)}
                            sx={{ display: 'block', width: 100, height: 100, objectFit: 'cover', borderRadius: 2, cursor: 'pointer', border: '1px solid #E2E8F0', '&:hover': { opacity: 0.85 } }}
                        />
                    ) : (
                        <Box sx={{ width: 100, height: 100, borderRadius: 2, border: '1px dashed #CBD5E1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#F8FAFC', opacity: 0.7 }}>
                            <Icon icon="mdi:file-image-off-outline" width={20} color="#94A3B8" />
                            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '10px', mt: 0.5 }}>{emptyLabel}</Typography>
                        </Box>
                    )}
                </Box>
            ))}
        </Box>
    );

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 8 }}>
            <Container maxWidth="lg" sx={{ pt: 4 }}>
                <Box sx={{ mb: 2 }}>
                    <Button onClick={() => navigate('/properties')} startIcon={<Icon icon="mdi:arrow-left" />} sx={{ color: '#475569', fontWeight: 600, textTransform: 'none', '&:hover': { bgcolor: 'transparent', color: '#1E293B' } }}>
                        Kembali ke Properti
                    </Button>
                </Box>

                <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff', position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                        <IconButton onClick={() => navigate('/properties')} sx={{ color: '#1E40AF', bgcolor: '#EFF6FF', borderRadius: 2 }}>
                            <Icon icon="mdi:format-list-bulleted" width={22} />
                        </IconButton>
                    </Box>
                    <Stack direction="row" spacing={3} alignItems="center">
                        <Avatar sx={{ width: 72, height: 72, bgcolor: '#EFF6FF', color: '#1E40AF', fontSize: '2rem' }}>
                            <Icon icon="mdi:home-city-outline" width={40} />
                        </Avatar>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B', mb: 0.5 }}>
                                {propertyType}
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#64748B', fontWeight: 500, mb: 1 }}>
                                {ownerName}
                            </Typography>
                            <Chip
                                label={statusColors.label}
                                size="small"
                                sx={{ bgcolor: statusColors.bg, color: statusColors.color, fontWeight: 700, fontSize: '0.75rem', borderRadius: '8px' }}
                            />
                        </Box>
                    </Stack>
                </Paper>

                <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#fff', overflow: 'hidden' }}>
                    <Tabs
                        value={tabValue}
                        onChange={(_, v) => setTabValue(v)}
                        variant={isMobile ? 'scrollable' : 'fullWidth'}
                        scrollButtons="auto"
                        sx={{ borderBottom: '1px solid #E2E8F0', '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 56 }, '& .Mui-selected': { color: '#1E40AF' }, '& .MuiTabs-indicator': { bgcolor: '#1E40AF', height: 3 } }}
                    >
                        <Tab label="Informasi Properti" icon={<Icon icon="mdi:home-analytics" width={20} />} iconPosition="start" />
                        <Tab label="Dokumen" icon={<Icon icon="mdi:file-document-outline" width={20} />} iconPosition="start" />
                        <Tab label="Foto" icon={<Icon icon="mdi:camera-outline" width={20} />} iconPosition="start" />
                    </Tabs>
                </Paper>

                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Icon icon="mdi:account-outline" width={20} color="#1E40AF" /> Pemilik & Lokasi
                                </Typography>
                                <InfoRow label="Nama Pemilik" value={ownerName} icon="mdi:account" />
                                <InfoRow label="Alamat" value={property.propertyData?.address} icon="mdi:map-marker" />
                                <InfoRow label="Kota" value={property.propertyData?.city} icon="mdi:city" />
                                <InfoRow label="Provinsi" value={property.propertyData?.province} icon="mdi:map" />
                                <InfoRow label="Kode Pos" value={property.propertyData?.postalCode} icon="mdi:mail" />
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Icon icon="mdi:shield-home-outline" width={20} color="#1E40AF" /> Properti & Asuransi
                                </Typography>
                                <InfoRow label="Tipe Properti" value={propertyType} icon="mdi:home-city" />
                                <InfoRow label="Luas Bangunan" value={property.propertyData?.buildingArea ? `${property.propertyData.buildingArea} m²` : ''} icon="mdi:ruler-square" />
                                <InfoRow label="Luas Tanah" value={property.propertyData?.landArea ? `${property.propertyData.landArea} m²` : ''} icon="mdi:ruler" />
                                <InfoRow label="Jumlah Lantai" value={property.propertyData?.numberOfFloors} icon="mdi:stairs" />
                                <InfoRow label="Tahun Dibangun" value={property.propertyData?.yearBuilt} icon="mdi:calendar" />
                                <InfoRow label="Struktur Bangunan" value={property.propertyData?.buildingStructure} icon="mdi:hammer-wrench" />
                                <InfoRow label="Nilai Properti" value={formatCurrency(property.propertyData?.propertyValue)} icon="mdi:cash" />
                                <InfoRow label="Perusahaan Asuransi" value={property.insuranceData?.insuranceCompany} icon="mdi:office-building" />
                                <InfoRow label="Nomor Polis" value={property.insuranceData?.policyNumber} icon="mdi:file-document" />
                                <InfoRow label="Jenis Pertanggungan" value={property.insuranceData?.coverageType} icon="mdi:shield-check" />
                                <InfoRow label="Nilai Asuransi" value={formatCurrency(property.insuranceData?.insuranceValue)} icon="mdi:cash-multiple" />
                                <InfoRow label="Premi" value={formatCurrency(property.insuranceData?.premium)} icon="mdi:currency-usd" />
                                <InfoRow label="Risiko Sendiri" value={formatCurrency(property.insuranceData?.deductible)} icon="mdi:alert-circle-outline" />
                                <InfoRow label="Tanggal Mulai" value={formatDate(property.insuranceData?.startDate)} icon="mdi:calendar-start" />
                                <InfoRow label="Tanggal Berakhir" value={formatDate(property.insuranceData?.endDate)} icon="mdi:calendar-end" />
                                <InfoRow label="Catatan" value={property.notes} icon="mdi:note-text-outline" />
                            </Paper>
                        </Grid>
                    </Grid>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icon icon="mdi:file-document-outline" width={20} color="#1E40AF" /> Dokumen Properti
                        </Typography>
                        {renderMediaCard(documentItems, 'Kosong')}
                    </Paper>
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icon icon="mdi:camera-outline" width={20} color="#1E40AF" /> Foto Properti
                        </Typography>
                        {renderMediaCard(photoItems, 'Kosong')}
                    </Paper>
                </TabPanel>
            </Container>

            <ImagePreviewDialog
                open={previewState.open}
                images={previewState.images}
                currentIndex={previewState.index}
                onIndexChange={(index) => setPreviewState((prev) => ({ ...prev, index }))}
                onClose={() => setPreviewState({ open: false, images: [], index: 0 })}
            />
        </Box>
    );
}
