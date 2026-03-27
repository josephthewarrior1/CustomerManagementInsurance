import { Icon } from '@iconify/react';
import {
    Box, Container, Typography, Button, Grid, Paper, Tabs, Tab,
    Stack, TextField, InputAdornment,
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
        '& fieldset': { borderColor: '#E4E6EA' },
        '&:hover fieldset': { borderColor: '#B0B5BC' },
        '&.Mui-focused fieldset': { borderColor: '#1971C2', borderWidth: '1.5px' },
    },
};

function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index}>
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

function FieldLabel({ label, required }) {
    return (
        <Box display="flex" alignItems="baseline" gap={0.4} mb={0.75}>
            <Typography fontSize={13} fontWeight={600} sx={{ color: '#1C1E21' }}>{label}</Typography>
            {required && <Typography fontSize={13} sx={{ color: '#D92B2B' }}>*</Typography>}
        </Box>
    );
}

/* ─── Image Upload Card ─── */
function ImageCard({ label, existingUrl, newFile, newPreview, onSelect, onClear }) {
    const ref = useRef();
    const displayUrl = newPreview || existingUrl;

    return (
        <Box>
            <Typography fontSize={12} fontWeight={700} sx={{ color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.75 }}>
                {label}
            </Typography>
            {displayUrl ? (
                <Box sx={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: `2px solid ${newPreview ? '#1971C2' : '#E2E8F0'}`, aspectRatio: '4/3' }}>
                    <img src={displayUrl} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 0.75, display: 'flex', gap: 0.5, justifyContent: 'flex-end', bgcolor: 'rgba(0,0,0,0.35)' }}>
                        <IconButton size="small" onClick={() => ref.current?.click()}
                            sx={{ bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: '#fff' } }}>
                            <Icon icon="mdi:pencil" width={14} />
                        </IconButton>
                        {newFile && (
                            <IconButton size="small" onClick={onClear}
                                sx={{ bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: '#fff' } }}>
                                <Icon icon="mdi:close" width={14} />
                            </IconButton>
                        )}
                    </Box>
                </Box>
            ) : (
                <Box
                    onClick={() => ref.current?.click()}
                    sx={{
                        border: '2px dashed #E4E6EA', borderRadius: '10px', aspectRatio: '4/3',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', bgcolor: '#FAFBFC',
                        '&:hover': { borderColor: '#1971C2', bgcolor: '#EBF4FF' },
                        transition: 'all 0.15s',
                    }}
                >
                    <Icon icon="mdi:camera-plus" width={28} color="#94A3B8" />
                    <Typography fontSize={11} sx={{ color: '#94A3B8', mt: 0.75 }}>Unggah foto</Typography>
                </Box>
            )}
            <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => { if (e.target.files[0]) onSelect(e.target.files[0]); }} />
        </Box>
    );
}

/* ─── Document Upload Card ─── */
function DocCard({ label, existingUrl, newFile, newPreview, onSelect, onClear }) {
    const ref = useRef();
    const displayUrl = newPreview || existingUrl;

    return (
        <Box mb={2.5}>
            <Typography fontSize={13} fontWeight={600} sx={{ color: '#1C1E21', mb: 0.75 }}>{label}</Typography>
            {displayUrl ? (
                <Box sx={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: `2px solid ${newPreview ? '#1971C2' : '#E2E8F0'}`, height: 140 }}>
                    <img src={displayUrl} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 0.75, display: 'flex', gap: 0.5, justifyContent: 'flex-end', bgcolor: 'rgba(0,0,0,0.35)' }}>
                        <IconButton size="small" onClick={() => ref.current?.click()}
                            sx={{ bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: '#fff' } }}>
                            <Icon icon="mdi:pencil" width={14} />
                        </IconButton>
                        {newFile && (
                            <IconButton size="small" onClick={onClear}
                                sx={{ bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: '#fff' } }}>
                                <Icon icon="mdi:close" width={14} />
                            </IconButton>
                        )}
                    </Box>
                </Box>
            ) : (
                <Box
                    onClick={() => ref.current?.click()}
                    sx={{
                        border: '2px dashed #E4E6EA', borderRadius: '10px', height: 90,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5,
                        cursor: 'pointer', bgcolor: '#FAFBFC',
                        '&:hover': { borderColor: '#1971C2', bgcolor: '#EBF4FF' },
                        transition: 'all 0.15s',
                    }}
                >
                    <Icon icon="mdi:file-image-outline" width={24} color="#94A3B8" />
                    <Typography fontSize={12} sx={{ color: '#94A3B8' }}>Unggah {label}</Typography>
                </Box>
            )}
            <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => { if (e.target.files[0]) onSelect(e.target.files[0]); }} />
        </Box>
    );
}

/* ─── Main Page ─── */
export default function CarEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const loadingProvider = useLoading();
    const message = useAlert();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const [uploadingDocs, setUploadingDocs] = useState(false);
    const [tabValue, setTabValue] = useState(0);

    const [carReferences, setCarReferences] = useState([]);

    const [formData, setFormData] = useState({
        carBrand: '',
        carModel: '',
        plateNumber: '',
        ownerName: '',
        chassisNumber: '',
        engineNumber: '',
        carPrice: '',
        dueDate: '',
        notes: '',
        status: 'Active',
    });

    // New car photo files
    const [carPhotos, setCarPhotos] = useState({ front: null, back: null, leftSide: null, rightSide: null });
    const [carPhotoPreviews, setCarPhotoPreviews] = useState({ front: null, back: null, leftSide: null, rightSide: null });

    // New document photo files
    const [docPhotos, setDocPhotos] = useState({ stnk: null, sim: null, ktp: null });
    const [docPhotoPreviews, setDocPhotoPreviews] = useState({ stnk: null, sim: null, ktp: null });

    useEffect(() => {
        fetchCar();
        fetchCarReferences();
    }, [id]);

    const fetchCarReferences = async () => {
        try {
            const res = await CarDAO.getCarReferences();
            if (res && res.references) {
                setCarReferences(res.references);
            } else if (Array.isArray(res)) {
                setCarReferences(res);
            }
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
                    ownerName: c.carData?.ownerName || c.carOwnerName || '',
                    chassisNumber: c.carData?.chassisNumber || c.chassisNumber || '',
                    engineNumber: c.carData?.engineNumber || c.engineNumber || '',
                    carPrice: c.carData?.carPrice || c.carPrice || '',
                    startDate: (c.carData?.startDate && c.carData.startDate !== '-' && new Date(c.carData.startDate).getTime() > 0) ? new Date(c.carData.startDate).toISOString().split('T')[0] :
                        (c.startDate && c.startDate !== '-' && new Date(c.startDate).getTime() > 0) ? new Date(c.startDate).toISOString().split('T')[0] : '',
                    dueDate: (c.carData?.dueDate && c.carData.dueDate !== '-' && new Date(c.carData.dueDate).getTime() > 0) ? new Date(c.carData.dueDate).toISOString().split('T')[0] :
                        (c.dueDate && c.dueDate !== '-' && new Date(c.dueDate).getTime() > 0) ? new Date(c.dueDate).toISOString().split('T')[0] : '',
                    notes: c.notes || '',
                    status: c.status || 'Active',
                    year: c.carData?.year || c.year || '', // Added year
                    color: c.carData?.color || c.color || '' // Added color
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

    // ── Save Info ──────────────────────────────────────────────────────────
    const handleSaveInfo = async () => {
        if (!formData.carBrand.trim()) { message('Merek mobil wajib diisi', 'error'); return; }
        if (!formData.carModel.trim()) { message('Model mobil wajib diisi', 'error'); return; }
        if (!formData.plateNumber.trim()) { message('Nomor polisi wajib diisi', 'error'); return; }

        try {
            setSaving(true);
            loadingProvider.start();
            const payload = {
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
                year: formData.year, // Added year
                color: formData.color // Added color
            };
            const res = await CarDAO.updateCar(id, payload);
            if (!res.success) throw new Error(res.error || 'Gagal memperbarui kendaraan');
            message('Info kendaraan berhasil diperbarui!', 'success');
            setCar(res.car || car);
        } catch (err) {
            console.error(err);
            message(err.message || 'Gagal memperbarui kendaraan', 'error');
        } finally {
            loadingProvider.stop();
            setSaving(false);
        }
    };

    // ── Upload Car Photos ──────────────────────────────────────────────────
    const handleUploadCarPhotos = async () => {
        const hasAny = Object.values(carPhotos).some(Boolean);
        if (!hasAny) { message('Belum ada foto baru yang dipilih', 'warning'); return; }
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
            // Refresh car data to show new URLs
            const refreshed = await CarDAO.getCarById(id);
            if (refreshed.success || refreshed.car) setCar(refreshed.car || refreshed);
            // Clear new files (now they're "existing")
            setCarPhotos({ front: null, back: null, leftSide: null, rightSide: null });
            setCarPhotoPreviews({ front: null, back: null, leftSide: null, rightSide: null });
        } catch (err) {
            console.error(err);
            message(err.message || 'Gagal mengunggah foto kendaraan', 'error');
        } finally {
            setUploadingPhotos(false);
        }
    };

    // ── Upload Document Photos ─────────────────────────────────────────────
    const handleUploadDocPhotos = async () => {
        const hasAny = Object.values(docPhotos).some(Boolean);
        if (!hasAny) { message('Belum ada dokumen baru yang dipilih', 'warning'); return; }
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

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const hasNewCarPhotos = Object.values(carPhotos).some(Boolean);
    const hasNewDocPhotos = Object.values(docPhotos).some(Boolean);

    const brandOptions = useMemo(() => {
        if (!Array.isArray(carReferences)) return [];
        return carReferences.map(item => item.brand).filter(Boolean);
    }, [carReferences]);

    const modelOptions = useMemo(() => {
        if (!Array.isArray(carReferences) || !formData.carBrand) return [];
        const foundBrand = carReferences.find(item => item.brand === formData.carBrand);
        return foundBrand?.models || [];
    }, [carReferences, formData.carBrand]);

    return (
        <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', pb: 8 }}>
            <Container maxWidth="lg" sx={{ pt: 4 }}>

                {/* ── Header ── */}
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B', mb: 0.5 }}>
                            Edit Mobil
                        </Typography>
                        <Typography fontSize={13} sx={{ color: '#64748B' }}>
                            {formData.carBrand} {formData.carModel} · {formData.plateNumber || 'Tanpa plat'}
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1.5}>
                        <Button variant="outlined" startIcon={<Icon icon="mdi:arrow-left" />}
                            onClick={() => navigate(`/cars/${id}`)}
                            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#E2E8F0', color: '#475569', borderRadius: '8px' }}>
                            Kembali
                        </Button>
                    </Stack>
                </Stack>

                {/* ── Tabs ── */}
                <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#fff', overflow: 'hidden' }}>
                    <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}
                        variant={isMobile ? 'scrollable' : 'fullWidth'} scrollButtons="auto"
                        sx={{ borderBottom: '1px solid #E2E8F0', '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 56 }, '& .Mui-selected': { color: '#1E40AF' }, '& .MuiTabs-indicator': { bgcolor: '#1E40AF', height: 3 } }}
                    >
                        <Tab label="Info Mobil" icon={<Icon icon="mdi:car-info" width={20} />} iconPosition="start" />
                        <Tab label="Foto Mobil" icon={<Icon icon="mdi:camera" width={20} />} iconPosition="start" />
                        <Tab label="Dokumen" icon={<Icon icon="mdi:file-document" width={20} />} iconPosition="start" />
                    </Tabs>
                </Paper>

                {/* ── Tab 1: Info Mobil ── */}
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={3}>

                        {/* Vehicle Details */}
                        <Grid item xs={12}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
                                <Typography fontWeight={700} fontSize={15} sx={{ color: '#1E293B', mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Icon icon="mdi:car" width={20} color="#1E40AF" /> Detail Kendaraan
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <FieldLabel label="Merek Mobil" required />
                                        <Autocomplete
                                            fullWidth
                                            freeSolo
                                            options={brandOptions}
                                            value={formData.carBrand}
                                            onInputChange={(e, newInputValue) => {
                                                setFormData(prev => ({ ...prev, carBrand: newInputValue || '', carModel: '' }));
                                            }}
                                            renderInput={(params) => (
                                                <TextField {...params} fullWidth size="small" name="carBrand" placeholder="cth. Toyota" sx={inputStyle} />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FieldLabel label="Model Mobil" required />
                                        <Autocomplete
                                            fullWidth
                                            freeSolo
                                            options={modelOptions}
                                            value={formData.carModel}
                                            onInputChange={(e, newInputValue) => {
                                                setFormData(prev => ({ ...prev, carModel: newInputValue || '' }));
                                            }}
                                            renderInput={(params) => (
                                                <TextField {...params} fullWidth size="small" name="carModel" placeholder="cth. Avanza" sx={inputStyle} />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FieldLabel label="Tahun" />
                                        <TextField fullWidth size="small" name="year" value={formData.year} onChange={handleChange} placeholder="cth. 2022" sx={inputStyle} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FieldLabel label="Warna" />
                                        <TextField fullWidth size="small" name="color" value={formData.color} onChange={handleChange} placeholder="cth. Putih Metalik" sx={inputStyle} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FieldLabel label="Nomor Polisi" required />
                                        <TextField fullWidth size="small" name="plateNumber" value={formData.plateNumber} onChange={handleChange} placeholder="cth. B 1234 ABC" sx={inputStyle} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FieldLabel label="Nama Pemilik (di STNK)" />
                                        <TextField fullWidth size="small" name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="cth. Budi Santoso" sx={inputStyle} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FieldLabel label="No. Rangka" />
                                        <TextField fullWidth size="small" name="chassisNumber" value={formData.chassisNumber} onChange={handleChange} placeholder="cth. MHF..." sx={inputStyle} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FieldLabel label="No. Mesin" />
                                        <TextField fullWidth size="small" name="engineNumber" value={formData.engineNumber} onChange={handleChange} placeholder="cth. 1TR..." sx={inputStyle} />
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>

                        {/* Financial */}
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff', height: '100%' }}>
                                <Typography fontWeight={700} fontSize={15} sx={{ color: '#1E293B', mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Icon icon="mdi:cash" width={20} color="#1E40AF" /> Finansial & Asuransi
                                </Typography>
                                <FieldLabel label="Harga Pasar Kendaraan (IDR)" />
                                <TextField fullWidth size="small" name="carPrice" type="number" value={formData.carPrice} onChange={handleChange}
                                    placeholder="cth. 200000000" sx={{ ...inputStyle, mb: 2 }}
                                    InputProps={{ startAdornment: <InputAdornment position="start">Rp</InputAdornment> }}
                                />
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid item xs={12} sm={6}>
                                        <FieldLabel label="Tanggal Mulai Asuransi" />
                                        <TextField fullWidth size="small" name="startDate" type="date" value={formData.startDate} onChange={handleChange} sx={inputStyle} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FieldLabel label="Tanggal Jatuh Tempo" />
                                        <TextField fullWidth size="small" name="dueDate" type="date" value={formData.dueDate} onChange={handleChange} sx={inputStyle} />
                                    </Grid>
                                </Grid>
                                <FieldLabel label="Catatan" />
                                <TextField fullWidth size="small" name="notes" value={formData.notes} onChange={handleChange}
                                    placeholder="Catatan tambahan..." multiline rows={2} sx={inputStyle} />
                            </Paper>
                        </Grid>

                        {/* Status */}
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff', height: '100%' }}>
                                <Typography fontWeight={700} fontSize={15} sx={{ color: '#1E293B', mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Icon icon="mdi:tag" width={20} color="#1E40AF" /> Status Kendaraan
                                </Typography>
                                <Typography fontWeight={600} fontSize={13} sx={{ color: '#64748B', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Pilih status kendaraan
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    {['Active', 'Expired', 'Cancelled'].map(s => (
                                        <Button key={s} variant={formData.status === s ? 'contained' : 'outlined'}
                                            onClick={() => setFormData(p => ({ ...p, status: s }))}
                                            size="small"
                                            sx={{
                                                textTransform: 'none', fontWeight: 600, borderRadius: '8px', fontSize: 13,
                                                ...(formData.status === s
                                                    ? { bgcolor: s === 'Active' ? '#1E8840' : s === 'Expired' ? '#DC2626' : '#64748B', '&:hover': { bgcolor: s === 'Active' ? '#166E32' : s === 'Expired' ? '#B91C1C' : '#475569' } }
                                                    : { borderColor: '#E4E6EA', color: '#64748B' }
                                                ),
                                            }}>
                                            {s === 'Active' ? 'Aktif' : s === 'Expired' ? 'Kedaluwarsa' : 'Dibatalkan'}
                                        </Button>
                                    ))}
                                </Stack>
                            </Paper>
                        </Grid>

                        {/* Save button */}
                        <Grid item xs={12}>
                            <Button fullWidth variant="contained" onClick={handleSaveInfo} disabled={saving}
                                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:content-save" width={18} />}
                                sx={{ borderRadius: '10px', py: 1.5, textTransform: 'none', fontSize: 15, fontWeight: 700, bgcolor: '#1E40AF', boxShadow: 'none', '&:hover': { bgcolor: '#1E3A8A' } }}>
                                {saving ? 'Menyimpan...' : 'Simpan Info Mobil'}
                            </Button>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* ── Tab 2: Foto Kendaraan ── */}
                <TabPanel value={tabValue} index={1}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff', mb: 3 }}>
                        <Typography fontWeight={700} fontSize={15} sx={{ color: '#1E293B', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icon icon="mdi:camera" width={20} color="#1E40AF" /> Foto Kendaraan
                        </Typography>
                        <Typography fontSize={12} sx={{ color: '#64748B', mb: 3 }}>
                            Unggah atau ganti foto kendaraan dari 4 sisi. Klik foto untuk mengganti.
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                            <ImageCard label="Depan"
                                existingUrl={car?.carPhotos?.front}
                                newFile={carPhotos.front}
                                newPreview={carPhotoPreviews.front}
                                onSelect={(f) => selectCarPhoto('front', f)}
                                onClear={() => clearCarPhoto('front')} />
                            <ImageCard label="Belakang"
                                existingUrl={car?.carPhotos?.back}
                                newFile={carPhotos.back}
                                newPreview={carPhotoPreviews.back}
                                onSelect={(f) => selectCarPhoto('back', f)}
                                onClear={() => clearCarPhoto('back')} />
                            <ImageCard label="Samping Kanan"
                                existingUrl={car?.carPhotos?.rightSide}
                                newFile={carPhotos.rightSide}
                                newPreview={carPhotoPreviews.rightSide}
                                onSelect={(f) => selectCarPhoto('rightSide', f)}
                                onClear={() => clearCarPhoto('rightSide')} />
                            <ImageCard label="Samping Kiri"
                                existingUrl={car?.carPhotos?.leftSide}
                                newFile={carPhotos.leftSide}
                                newPreview={carPhotoPreviews.leftSide}
                                onSelect={(f) => selectCarPhoto('leftSide', f)}
                                onClear={() => clearCarPhoto('leftSide')} />
                        </Box>
                    </Paper>

                    <Button fullWidth variant="contained" onClick={handleUploadCarPhotos}
                        disabled={uploadingPhotos || !hasNewCarPhotos}
                        startIcon={uploadingPhotos ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:cloud-upload" width={18} />}
                        sx={{ borderRadius: '10px', py: 1.5, textTransform: 'none', fontSize: 15, fontWeight: 700, bgcolor: '#1971C2', boxShadow: 'none', '&:hover': { bgcolor: '#145EA8' }, '&:disabled': { bgcolor: '#CBD5E1', color: '#fff' } }}>
                        {uploadingPhotos ? 'Mengunggah...' : hasNewCarPhotos ? `Unggah ${Object.values(carPhotos).filter(Boolean).length} Foto Baru` : 'Pilih foto untuk diunggah'}
                    </Button>
                </TabPanel>

                {/* ── Tab 3: Document Photos ── */}
                <TabPanel value={tabValue} index={2}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff', mb: 3 }}>
                        <Typography fontWeight={700} fontSize={15} sx={{ color: '#1E293B', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icon icon="mdi:file-document" width={20} color="#1E40AF" /> Foto Dokumen
                        </Typography>
                        <Typography fontSize={12} sx={{ color: '#64748B', mb: 3 }}>
                            Unggah atau ganti foto dokumen kendaraan.
                        </Typography>
                        <DocCard label="STNK"
                            existingUrl={car?.documentPhotos?.stnk}
                            newFile={docPhotos.stnk}
                            newPreview={docPhotoPreviews.stnk}
                            onSelect={(f) => selectDocPhoto('stnk', f)}
                            onClear={() => clearDocPhoto('stnk')} />
                        <DocCard label="SIM (Surat Izin Mengemudi)"
                            existingUrl={car?.documentPhotos?.sim}
                            newFile={docPhotos.sim}
                            newPreview={docPhotoPreviews.sim}
                            onSelect={(f) => selectDocPhoto('sim', f)}
                            onClear={() => clearDocPhoto('sim')} />
                        <DocCard label="KTP Pemilik"
                            existingUrl={car?.documentPhotos?.ktp}
                            newFile={docPhotos.ktp}
                            newPreview={docPhotoPreviews.ktp}
                            onSelect={(f) => selectDocPhoto('ktp', f)}
                            onClear={() => clearDocPhoto('ktp')} />
                    </Paper>

                    <Button fullWidth variant="contained" onClick={handleUploadDocPhotos}
                        disabled={uploadingDocs || !hasNewDocPhotos}
                        startIcon={uploadingDocs ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:cloud-upload" width={18} />}
                        sx={{ borderRadius: '10px', py: 1.5, textTransform: 'none', fontSize: 15, fontWeight: 700, bgcolor: '#1971C2', boxShadow: 'none', '&:hover': { bgcolor: '#145EA8' }, '&:disabled': { bgcolor: '#CBD5E1', color: '#fff' } }}>
                        {uploadingDocs ? 'Mengunggah...' : hasNewDocPhotos ? `Unggah ${Object.values(docPhotos).filter(Boolean).length} Dokumen Baru` : 'Pilih dokumen untuk diunggah'}
                    </Button>
                </TabPanel>

            </Container>
        </Box>
    );
}
