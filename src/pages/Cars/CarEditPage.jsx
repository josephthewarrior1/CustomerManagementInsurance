import { Icon } from '@iconify/react';
import {
    Box, Container, Typography, Button, Grid, Paper, Tabs, Tab,
    Stack, Avatar, Chip, TextField, InputAdornment,
    IconButton, CircularProgress, useTheme, useMediaQuery, Autocomplete,
} from '@mui/material';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CarDAO from '../../daos/CarDao';

/* ─── Styling ─── */
const inputStyle = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '8px',
        fontSize: 14,
        bgcolor: '#FFFFFF',
        '& fieldset': { borderColor: '#E2E8F0' },
        '&:hover fieldset': { borderColor: '#B0B5BC' },
        '&.Mui-focused fieldset': { borderColor: '#1E40AF', borderWidth: '1.5px' },
    },
};

/* ─── TAB PANEL ─── */
function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index}>
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

/* ─── FIELD LABEL ─── */
function FieldLabel({ label, required }) {
    return (
        <Box display="flex" alignItems="baseline" gap={0.4} mb={0.75}>
            <Typography fontSize={13} fontWeight={600} sx={{ color: '#1C1E21' }}>{label}</Typography>
            {required && <Typography fontSize={13} sx={{ color: '#D92B2B' }}>*</Typography>}
        </Box>
    );
}

/* ─── SECTION CARD (matches DetailPage Paper style) ─── */
function SectionCard({ icon, title, children, sx = {} }) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid #E2E8F0',
                bgcolor: '#fff',
                ...sx,
            }}
        >
            <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, color: '#1E293B', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
            >
                <Icon icon={icon} width={20} color="#1E40AF" />
                {title}
            </Typography>
            {children}
        </Paper>
    );
}

/* ─── toDateInputValue ─── */
function toDateInputValue(value) {
    if (!value || value === '-') return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
}

/* ─── IMAGE UPLOAD CARD ─── */
function ImageCard({ label, existingUrl, newFile, newPreview, onSelect, onClear }) {
    const ref = useRef(null);
    const displayUrl = newPreview || existingUrl;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 1, display: 'block' }}>
                {label}
            </Typography>
            <Box
                sx={{
                    position: 'relative', width: '100%', paddingTop: '75%', borderRadius: 3, overflow: 'hidden',
                    border: displayUrl ? `2px solid ${newPreview ? '#1E40AF' : '#E2E8F0'}` : '2px dashed #CBD5E1',
                    bgcolor: '#F8FAFC', transition: 'all 0.2s',
                    '&:hover': { borderColor: '#1E40AF', bgcolor: displayUrl ? '#F8FAFC' : '#EFF6FF' }
                }}
            >
                {displayUrl ? (
                    <>
                        <img src={displayUrl} alt={label} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.4)', opacity: 0, transition: 'opacity 0.2s', '&:hover': { opacity: 1 }, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <IconButton onClick={(e) => { e.stopPropagation(); ref.current?.click(); }} sx={{ bgcolor: 'rgba(255,255,255,0.95)', '&:hover': { bgcolor: '#fff', transform: 'scale(1.05)' }, transition: 'transform 0.2s' }}>
                                <Icon icon="mdi:pencil" width={22} color="#1E293B" />
                            </IconButton>
                            {newFile && (
                                <IconButton onClick={(e) => { e.stopPropagation(); onClear(); }} sx={{ bgcolor: 'rgba(255,255,255,0.95)', '&:hover': { bgcolor: '#fff', transform: 'scale(1.05)' }, transition: 'transform 0.2s' }}>
                                    <Icon icon="mdi:close" width={22} color="#DC2626" />
                                </IconButton>
                            )}
                        </Box>
                    </>
                ) : (
                    <Box onClick={() => ref.current?.click()} sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Avatar sx={{ width: 48, height: 48, bgcolor: '#EFF6FF', color: '#1E40AF', mb: 1.5 }}>
                            <Icon icon="mdi:camera-plus" width={24} />
                        </Avatar>
                        <Typography fontSize={13} fontWeight={600} sx={{ color: '#64748B' }}>Unggah Foto</Typography>
                    </Box>
                )}
            </Box>
            <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) onSelect(e.target.files[0]); }} />
        </Box>
    );
}

/* ─── DOCUMENT UPLOAD CARD ─── */
function DocCard({ label, existingUrl, newFile, newPreview, onSelect, onClear }) {
    const ref = useRef(null);
    const displayUrl = newPreview || existingUrl;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 1, display: 'block' }}>
                {label}
            </Typography>
            <Box
                sx={{
                    position: 'relative', width: '100%', height: 180, borderRadius: 3, overflow: 'hidden',
                    border: displayUrl ? `2px solid ${newPreview ? '#1E40AF' : '#E2E8F0'}` : '2px dashed #CBD5E1',
                    bgcolor: '#F8FAFC', transition: 'all 0.2s',
                    '&:hover': { borderColor: '#1E40AF', bgcolor: displayUrl ? '#F8FAFC' : '#EFF6FF' }
                }}
            >
                {displayUrl ? (
                    <>
                        <img src={displayUrl} alt={label} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', bgcolor: '#fff' }} />
                        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.4)', opacity: 0, transition: 'opacity 0.2s', '&:hover': { opacity: 1 }, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <IconButton onClick={(e) => { e.stopPropagation(); ref.current?.click(); }} sx={{ bgcolor: 'rgba(255,255,255,0.95)', '&:hover': { bgcolor: '#fff', transform: 'scale(1.05)' }, transition: 'transform 0.2s' }}>
                                <Icon icon="mdi:file-replace-outline" width={22} color="#1E293B" />
                            </IconButton>
                            {newFile && (
                                <IconButton onClick={(e) => { e.stopPropagation(); onClear(); }} sx={{ bgcolor: 'rgba(255,255,255,0.95)', '&:hover': { bgcolor: '#fff', transform: 'scale(1.05)' }, transition: 'transform 0.2s' }}>
                                    <Icon icon="mdi:close" width={22} color="#DC2626" />
                                </IconButton>
                            )}
                        </Box>
                    </>
                ) : (
                    <Box onClick={() => ref.current?.click()} sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Avatar sx={{ width: 48, height: 48, bgcolor: '#EFF6FF', color: '#1E40AF', mb: 1.5 }}>
                            <Icon icon="mdi:cloud-upload-outline" width={24} />
                        </Avatar>
                        <Typography fontSize={13} fontWeight={600} sx={{ color: '#64748B' }}>Pilih Dokumen</Typography>
                        <Typography fontSize={11} sx={{ mt: 0.5, color: '#94A3B8' }}>Tap untuk mengunggah</Typography>
                    </Box>
                )}
            </Box>
            <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) onSelect(e.target.files[0]); }} />
        </Box>
    );
}

const getStatusColor = (status) => {
    switch (status) {
        case 'Active': return { bg: '#D1FAE5', color: '#065F46' };
        case 'Expired': return { bg: '#FEE2E2', color: '#991B1B' };
        case 'Cancelled': return { bg: '#F1F5F9', color: '#475569' };
        default: return { bg: '#F1F5F9', color: '#475569' };
    }
};

/* ─── MAIN PAGE ─── */
export default function CarEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const loadingProvider = useLoading();
    const message = useAlert();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const [uploadingDocs, setUploadingDocs] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [carReferences, setCarReferences] = useState([]);

    const [formData, setFormData] = useState({
        carBrand: '', carModel: '', plateNumber: '', ownerName: '',
        chassisNumber: '', engineNumber: '', carPrice: '',
        startDate: '', dueDate: '', notes: '', status: 'Active',
        year: '', color: '',
    });

    const [carPhotos, setCarPhotos] = useState({ front: null, back: null, leftSide: null, rightSide: null });
    const [carPhotoPreviews, setCarPhotoPreviews] = useState({ front: null, back: null, leftSide: null, rightSide: null });
    const [docPhotos, setDocPhotos] = useState({ stnk: null, sim: null, ktp: null });
    const [docPhotoPreviews, setDocPhotoPreviews] = useState({ stnk: null, sim: null, ktp: null });

    useEffect(() => {
        fetchCar();
        fetchCarReferences();
    }, [id]);

    const fetchCarReferences = async () => {
        try {
            const res = await CarDAO.getCarReferences();
            if (res && res.references) setCarReferences(res.references);
            else if (Array.isArray(res)) setCarReferences(res);
        } catch (error) {
            console.error('Failed to fetch car references:', error);
        }
    };

    const fetchCar = async () => {
        try {
            loadingProvider.start();
            const response = await CarDAO.getCarById(id);
            if (response.success || response.car) {
                const c = response.car || response;
                setCar(c);
                setFormData({
                    carBrand: c.carData?.carBrand || c.carBrand || '',
                    carModel: c.carData?.carModel || c.carModel || '',
                    plateNumber: c.carData?.plateNumber || c.plateNumber || '',
                    ownerName: c.carData?.ownerName || c.ownerName || c.carOwnerName || '',
                    chassisNumber: c.carData?.chassisNumber || c.chassisNumber || '',
                    engineNumber: c.carData?.engineNumber || c.engineNumber || '',
                    carPrice: c.carData?.carPrice || c.carPrice || '',
                    startDate: toDateInputValue(c.carData?.startDate || c.startDate || c.insuranceData?.startDate),
                    dueDate: toDateInputValue(c.carData?.dueDate || c.dueDate || c.insuranceData?.dueDate),
                    notes: c.notes || '',
                    status: c.status || 'Active',
                    year: c.carData?.year || c.year || '',
                    color: c.carData?.color || c.color || '',
                });
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

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSaveInfo = async () => {
        if (!formData.carBrand.trim()) { message('Merek mobil wajib diisi', 'error'); return; }
        if (!formData.carModel.trim()) { message('Model mobil wajib diisi', 'error'); return; }
        if (!formData.plateNumber.trim()) { message('Nomor polisi wajib diisi', 'error'); return; }
        try {
            setSaving(true);
            loadingProvider.start();
            const payload = {
                customerId: car?.customerId,
                ownerName: formData.ownerName,
                carOwnerName: formData.ownerName,
                carBrand: formData.carBrand,
                carModel: formData.carModel,
                plateNumber: formData.plateNumber,
                chassisNumber: formData.chassisNumber,
                engineNumber: formData.engineNumber,
                carPrice: formData.carPrice ? Number(formData.carPrice) : 0,
                startDate: formData.startDate || null,
                dueDate: formData.dueDate || null,
                notes: formData.notes,
                status: formData.status,
                year: formData.year,
                color: formData.color,
            };
            const res = await CarDAO.updateCar(id, payload);
            if (!res.success) throw new Error(res.error || 'Gagal memperbarui kendaraan');
            message('Info kendaraan berhasil diperbarui!', 'success');
            await fetchCar();
        } catch (err) {
            console.error(err);
            message(err.message || 'Gagal memperbarui kendaraan', 'error');
        } finally {
            loadingProvider.stop();
            setSaving(false);
        }
    };

    const handleUploadCarPhotos = async () => {
        if (!Object.values(carPhotos).some(Boolean)) { message('Belum ada foto baru yang dipilih', 'warning'); return; }
        try {
            setUploadingPhotos(true);
            const fd = new FormData();
            if (carPhotos.front) fd.append('front', carPhotos.front);
            if (carPhotos.back) fd.append('back', carPhotos.back);
            if (carPhotos.leftSide) fd.append('leftSide', carPhotos.leftSide);
            if (carPhotos.rightSide) fd.append('rightSide', carPhotos.rightSide);
            const res = await CarDAO.uploadCarPhotos(id, fd);
            if (!res.success) throw new Error(res.error || 'Gagal mengunggah foto');
            message('Foto kendaraan berhasil diunggah!', 'success');
            const refreshed = await CarDAO.getCarById(id);
            if (refreshed.success || refreshed.car) setCar(refreshed.car || refreshed);
            setCarPhotos({ front: null, back: null, leftSide: null, rightSide: null });
            setCarPhotoPreviews({ front: null, back: null, leftSide: null, rightSide: null });
        } catch (err) {
            console.error(err);
            message(err.message || 'Gagal mengunggah foto kendaraan', 'error');
        } finally {
            setUploadingPhotos(false);
        }
    };

    const handleUploadDocPhotos = async () => {
        if (!Object.values(docPhotos).some(Boolean)) { message('Belum ada dokumen baru yang dipilih', 'warning'); return; }
        try {
            setUploadingDocs(true);
            const fd = new FormData();
            if (docPhotos.stnk) fd.append('stnk', docPhotos.stnk);
            if (docPhotos.sim) fd.append('sim', docPhotos.sim);
            if (docPhotos.ktp) fd.append('ktp', docPhotos.ktp);
            const res = await CarDAO.uploadDocuments(id, fd);
            if (!res.success) throw new Error(res.error || 'Gagal mengunggah dokumen');
            message('Dokumen berhasil diunggah!', 'success');
            const refreshed = await CarDAO.getCarById(id);
            if (refreshed.success || refreshed.car) setCar(refreshed.car || refreshed);
            setDocPhotos({ stnk: null, sim: null, ktp: null });
            setDocPhotoPreviews({ stnk: null, sim: null, ktp: null });
        } catch (err) {
            console.error(err);
            message(err.message || 'Gagal mengunggah dokumen', 'error');
        } finally {
            setUploadingDocs(false);
        }
    };

    const selectCarPhoto = (field, file) => {
        setCarPhotos(p => ({ ...p, [field]: file }));
        setCarPhotoPreviews(p => ({ ...p, [field]: URL.createObjectURL(file) }));
    };
    const clearCarPhoto = (field) => {
        setCarPhotos(p => ({ ...p, [field]: null }));
        setCarPhotoPreviews(p => ({ ...p, [field]: null }));
    };
    const selectDocPhoto = (field, file) => {
        setDocPhotos(p => ({ ...p, [field]: file }));
        setDocPhotoPreviews(p => ({ ...p, [field]: URL.createObjectURL(file) }));
    };
    const clearDocPhoto = (field) => {
        setDocPhotos(p => ({ ...p, [field]: null }));
        setDocPhotoPreviews(p => ({ ...p, [field]: null }));
    };

    const brandOptions = useMemo(() => {
        if (!Array.isArray(carReferences)) return [];
        return carReferences.map(item => item.brand).filter(Boolean);
    }, [carReferences]);

    const modelOptions = useMemo(() => {
        if (!Array.isArray(carReferences) || !formData.carBrand) return [];
        const foundBrand = carReferences.find(item => item.brand === formData.carBrand);
        return foundBrand?.models || [];
    }, [carReferences, formData.carBrand]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const hasNewCarPhotos = Object.values(carPhotos).some(Boolean);
    const hasNewDocPhotos = Object.values(docPhotos).some(Boolean);
    const statusColors = getStatusColor(formData.status);
    const statusLabel = formData.status === 'Active' ? 'Aktif' : formData.status === 'Expired' ? 'Kedaluwarsa' : 'Dibatalkan';

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 8 }}>
            <Container maxWidth="lg" sx={{ pt: 4 }}>

                {/* ── Back Button ── */}
                <Box sx={{ mb: 2 }}>
                    <Button
                        onClick={() => navigate(`/cars/${id}`)}
                        startIcon={<Icon icon="mdi:arrow-left" />}
                        sx={{ color: '#475569', fontWeight: 600, textTransform: 'none', '&:hover': { bgcolor: 'transparent', color: '#1E293B' } }}
                    >
                        Kembali ke Detail
                    </Button>
                </Box>

                {/* ── Header Card ── */}
                <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff', position: 'relative' }}>
                    <Stack direction="row" spacing={3} alignItems="center">
                        <Avatar sx={{ width: 72, height: 72, bgcolor: '#EFF6FF', color: '#1E40AF', fontSize: '2rem' }}>
                            <Icon icon="mdi:car" width={40} />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B', mb: 0.5 }}>
                                Edit Kendaraan
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#64748B', fontWeight: 500, mb: 1 }}>
                                {formData.carBrand || '-'} {formData.carModel || ''} · {formData.plateNumber || 'Tanpa plat'}
                            </Typography>
                            <Chip
                                label={statusLabel}
                                size="small"
                                sx={{ bgcolor: statusColors.bg, color: statusColors.color, fontWeight: 700, fontSize: '0.75rem', borderRadius: '8px' }}
                            />
                        </Box>
                    </Stack>
                </Paper>

                {/* ── Tabs ── */}
                <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#fff', overflow: 'hidden' }}>
                    <Tabs
                        value={tabValue}
                        onChange={(_, v) => setTabValue(v)}
                        variant={isMobile ? 'scrollable' : 'fullWidth'}
                        scrollButtons="auto"
                        sx={{
                            borderBottom: '1px solid #E2E8F0',
                            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 56 },
                            '& .Mui-selected': { color: '#1E40AF' },
                            '& .MuiTabs-indicator': { bgcolor: '#1E40AF', height: 3 },
                        }}
                    >
                        <Tab label="Informasi Mobil" icon={<Icon icon="mdi:car-info" width={20} />} iconPosition="start" />
                        <Tab label="Foto Kendaraan" icon={<Icon icon="mdi:camera" width={20} />} iconPosition="start" />
                        <Tab label="Dokumen" icon={<Icon icon="mdi:file-document" width={20} />} iconPosition="start" />
                    </Tabs>
                </Paper>

                {/* ── Tab 1: Info Mobil ── */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        
                        {/* 1. Identitas Kendaraan */}
                        <SectionCard icon="mdi:car" title="Identitas Kendaraan">
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 2.5 }}>
                                
                                {/* Baris 1: Merek, Model, Nopol */}
                                <Box sx={{ gridColumn: { md: 'span 4' } }}>
                                    <FieldLabel label="Merek Mobil" required />
                                    <Autocomplete
                                        fullWidth freeSolo
                                        options={brandOptions}
                                        value={formData.carBrand}
                                        onInputChange={(e, newInputValue) => setFormData(prev => ({ ...prev, carBrand: newInputValue || '', carModel: '' }))}
                                        renderInput={(params) => <TextField {...params} fullWidth size="small" placeholder="cth. Toyota" sx={inputStyle} />}
                                    />
                                </Box>
                                <Box sx={{ gridColumn: { md: 'span 4' } }}>
                                    <FieldLabel label="Model Mobil" required />
                                    <Autocomplete
                                        fullWidth freeSolo
                                        options={modelOptions}
                                        value={formData.carModel}
                                        onInputChange={(e, newInputValue) => setFormData(prev => ({ ...prev, carModel: newInputValue || '' }))}
                                        renderInput={(params) => <TextField {...params} fullWidth size="small" placeholder="cth. Avanza" sx={inputStyle} />}
                                    />
                                </Box>
                                <Box sx={{ gridColumn: { md: 'span 4' } }}>
                                    <FieldLabel label="Nomor Polisi" required />
                                    <TextField fullWidth size="small" name="plateNumber" value={formData.plateNumber} onChange={handleChange} placeholder="cth. B 1234 ABC" sx={inputStyle} />
                                </Box>

                                {/* Baris 2: Tahun, Warna, Pemilik */}
                                <Box sx={{ gridColumn: { md: 'span 3' } }}>
                                    <FieldLabel label="Tahun" />
                                    <TextField fullWidth size="small" name="year" value={formData.year} onChange={handleChange} placeholder="cth. 2022" sx={inputStyle} />
                                </Box>
                                <Box sx={{ gridColumn: { md: 'span 3' } }}>
                                    <FieldLabel label="Warna" />
                                    <TextField fullWidth size="small" name="color" value={formData.color} onChange={handleChange} placeholder="cth. Putih Metalik" sx={inputStyle} />
                                </Box>
                                <Box sx={{ gridColumn: { md: 'span 6' } }}>
                                    <FieldLabel label="Nama Pemilik (di STNK)" />
                                    <TextField fullWidth size="small" name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="cth. Budi Santoso" sx={inputStyle} />
                                </Box>

                                {/* Garis Pemisah Visual */}
                                <Box sx={{ gridColumn: { md: 'span 12' }, borderBottom: '1px dashed #E2E8F0', my: 0.5 }} />

                                {/* Baris 3: Rangka, Mesin */}
                                <Box sx={{ gridColumn: { md: 'span 6' } }}>
                                    <FieldLabel label="No. Rangka" />
                                    <TextField fullWidth size="small" name="chassisNumber" value={formData.chassisNumber} onChange={handleChange} placeholder="cth. MHF..." sx={inputStyle} />
                                </Box>
                                <Box sx={{ gridColumn: { md: 'span 6' } }}>
                                    <FieldLabel label="No. Mesin" />
                                    <TextField fullWidth size="small" name="engineNumber" value={formData.engineNumber} onChange={handleChange} placeholder="cth. 1TR..." sx={inputStyle} />
                                </Box>
                            </Box>
                        </SectionCard>

                        {/* 2. Finansial & Status */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 3, alignItems: 'stretch' }}>
                            <SectionCard icon="mdi:cash" title="Finansial & Polis" sx={{ height: '100%' }}>
                                <FieldLabel label="Harga Pasar Kendaraan (IDR)" />
                                <TextField
                                    fullWidth size="small" name="carPrice" type="number"
                                    value={formData.carPrice} onChange={handleChange}
                                    placeholder="cth. 200000000"
                                    InputProps={{ startAdornment: <InputAdornment position="start">Rp</InputAdornment> }}
                                    sx={{ ...inputStyle, mb: 2.5 }}
                                />
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2.5 }}>
                                    <Box>
                                        <FieldLabel label="Tanggal Mulai Asuransi" />
                                        <TextField fullWidth size="small" name="startDate" type="date" value={formData.startDate} onChange={handleChange} sx={inputStyle} />
                                    </Box>
                                    <Box>
                                        <FieldLabel label="Tanggal Jatuh Tempo" />
                                        <TextField fullWidth size="small" name="dueDate" type="date" value={formData.dueDate} onChange={handleChange} sx={inputStyle} />
                                    </Box>
                                </Box>
                                <FieldLabel label="Catatan Tambahan" />
                                <TextField
                                    fullWidth size="small" name="notes"
                                    value={formData.notes} onChange={handleChange}
                                    placeholder="Ketikan catatan di sini..." multiline rows={3} sx={inputStyle}
                                />
                            </SectionCard>

                            <SectionCard icon="mdi:tag-outline" title="Status Kendaraan" sx={{ height: '100%' }}>
                                <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
                                    Tentukan status operasional asuransi untuk kendaraan ini.
                                </Typography>
                                <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ mb: 3 }}>
                                    {['Active', 'Expired', 'Cancelled'].map(s => {
                                        const lbl = s === 'Active' ? 'Aktif' : s === 'Expired' ? 'Kedaluwarsa' : 'Dibatalkan';
                                        const isSelected = formData.status === s;
                                        return (
                                            <Button
                                                key={s}
                                                variant={isSelected ? 'contained' : 'outlined'}
                                                onClick={() => setFormData(p => ({ ...p, status: s }))}
                                                size="medium"
                                                sx={{
                                                    textTransform: 'none', fontWeight: 700, borderRadius: '8px', fontSize: 13, px: 2,
                                                    ...(isSelected
                                                        ? { bgcolor: s === 'Active' ? '#065F46' : s === 'Expired' ? '#991B1B' : '#475569', color: '#fff', borderColor: 'transparent', '&:hover': { bgcolor: s === 'Active' ? '#054035' : s === 'Expired' ? '#7f1d1d' : '#334155' } }
                                                        : { borderColor: '#E2E8F0', color: '#64748B', bgcolor: '#fff' }
                                                    ),
                                                }}
                                            >
                                                {lbl}
                                            </Button>
                                        );
                                    })}
                                </Stack>

                                <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: statusColors.bg, display: 'flex', flexDirection: 'column', gap: 0.5, border: `1px solid ${statusColors.color}30` }}>
                                    <Typography variant="caption" sx={{ color: statusColors.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Status Saat Ini
                                    </Typography>
                                    <Typography variant="h6" sx={{ color: statusColors.color, fontWeight: 800 }}>
                                        {statusLabel}
                                    </Typography>
                                </Box>
                            </SectionCard>
                        </Box>

                        {/* 3. Global Action Button */}
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>Simpan Perubahan</Typography>
                                <Typography variant="caption" sx={{ color: '#64748B' }}>Pastikan semua data identitas dan finansial telah sesuai.</Typography>
                            </Box>
                            <Button
                                variant="contained"
                                onClick={handleSaveInfo}
                                disabled={saving}
                                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:content-save-check" width={20} />}
                                sx={{ borderRadius: '8px', px: 4, py: 1.2, textTransform: 'none', fontSize: 14, fontWeight: 700, bgcolor: '#1E40AF', boxShadow: 'none', '&:hover': { bgcolor: '#1E3A8A' } }}
                            >
                                {saving ? 'Menyimpan...' : 'Simpan Sekarang'}
                            </Button>
                        </Paper>
                        
                    </Box>
                </TabPanel>

                {/* ── Tab 2: Foto Kendaraan ── */}
                <TabPanel value={tabValue} index={1}>
                    <SectionCard icon="mdi:camera-burst" title="Galeri Foto Kendaraan" sx={{ mb: 0 }}>
                        <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
                            Unggah foto kendaraan dari 4 sisi yang berbeda agar informasi terlihat jelas dan sesuai prosedur.
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
                            <ImageCard label="Sisi Depan"
                                existingUrl={car?.carPhotos?.front}
                                newFile={carPhotos.front} newPreview={carPhotoPreviews.front}
                                onSelect={(f) => selectCarPhoto('front', f)}
                                onClear={() => clearCarPhoto('front')} />
                            <ImageCard label="Sisi Belakang"
                                existingUrl={car?.carPhotos?.back}
                                newFile={carPhotos.back} newPreview={carPhotoPreviews.back}
                                onSelect={(f) => selectCarPhoto('back', f)}
                                onClear={() => clearCarPhoto('back')} />
                            <ImageCard label="Sisi Kanan"
                                existingUrl={car?.carPhotos?.rightSide}
                                newFile={carPhotos.rightSide} newPreview={carPhotoPreviews.rightSide}
                                onSelect={(f) => selectCarPhoto('rightSide', f)}
                                onClear={() => clearCarPhoto('rightSide')} />
                            <ImageCard label="Sisi Kiri"
                                existingUrl={car?.carPhotos?.leftSide}
                                newFile={carPhotos.leftSide} newPreview={carPhotoPreviews.leftSide}
                                onSelect={(f) => selectCarPhoto('leftSide', f)}
                                onClear={() => clearCarPhoto('leftSide')} />
                        </Box>

                        <Box sx={{ mt: 5, pt: 3, borderTop: '1px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
                                {hasNewCarPhotos ? `${Object.values(carPhotos).filter(Boolean).length} foto baru siap diunggah` : 'Pilih foto-foto baru jika ingin memperbarui galeri'}
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={handleUploadCarPhotos}
                                disabled={uploadingPhotos || !hasNewCarPhotos}
                                startIcon={uploadingPhotos ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:cloud-upload" width={18} />}
                                sx={{ borderRadius: '8px', px: 3, py: 1.2, textTransform: 'none', fontSize: 13, fontWeight: 700, bgcolor: '#1E40AF', boxShadow: 'none', '&:hover': { bgcolor: '#1E3A8A' }, '&:disabled': { bgcolor: '#CBD5E1', color: '#fff' } }}
                            >
                                {uploadingPhotos ? 'Mengunggah...' : 'Unggah Foto Sekarang'}
                            </Button>
                        </Box>
                    </SectionCard>
                </TabPanel>

                {/* ── Tab 3: Dokumen ── */}
                <TabPanel value={tabValue} index={2}>
                    <SectionCard icon="mdi:folder-account-outline" title="Kelengkapan Dokumen" sx={{ mb: 0 }}>
                        <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
                            Pastikan Anda mengunggah pindaian atau foto dokumen yang tajam, bisa dibaca, dan tidak terpotong (STNK, SIM, KTP).
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4 }}>
                            <DocCard label="STNK"
                                existingUrl={car?.documentPhotos?.stnk}
                                newFile={docPhotos.stnk} newPreview={docPhotoPreviews.stnk}
                                onSelect={(f) => selectDocPhoto('stnk', f)}
                                onClear={() => clearDocPhoto('stnk')} />
                            <DocCard label="SIM Pemilik"
                                existingUrl={car?.documentPhotos?.sim}
                                newFile={docPhotos.sim} newPreview={docPhotoPreviews.sim}
                                onSelect={(f) => selectDocPhoto('sim', f)}
                                onClear={() => clearDocPhoto('sim')} />
                            <DocCard label="KTP Pemilik"
                                existingUrl={car?.documentPhotos?.ktp}
                                newFile={docPhotos.ktp} newPreview={docPhotoPreviews.ktp}
                                onSelect={(f) => selectDocPhoto('ktp', f)}
                                onClear={() => clearDocPhoto('ktp')} />
                        </Box>

                        <Box sx={{ mt: 5, pt: 3, borderTop: '1px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
                                {hasNewDocPhotos ? `${Object.values(docPhotos).filter(Boolean).length} dokumen baru siap diunggah` : 'Pilih dokumen baru jika ada pembaruan data'}
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={handleUploadDocPhotos}
                                disabled={uploadingDocs || !hasNewDocPhotos}
                                startIcon={uploadingDocs ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:cloud-upload" width={18} />}
                                sx={{ borderRadius: '8px', px: 3, py: 1.2, textTransform: 'none', fontSize: 13, fontWeight: 700, bgcolor: '#1E40AF', boxShadow: 'none', '&:hover': { bgcolor: '#1E3A8A' }, '&:disabled': { bgcolor: '#CBD5E1', color: '#fff' } }}
                            >
                                {uploadingDocs ? 'Mengunggah...' : 'Unggah Dokumen Sekarang'}
                            </Button>
                        </Box>
                    </SectionCard>
                </TabPanel>

            </Container>
        </Box>
    );
}