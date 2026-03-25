import React, { useState, useMemo, useRef } from 'react';
import { Icon } from '@iconify/react';
import {
    Dialog,
    useMediaQuery,
    useTheme,
    Box,
    Typography,
    Stack,
    Button,
    Checkbox,
    FormControlLabel,
    TextField,
    Paper,
    alpha,
    Fade,
    InputAdornment,
    IconButton,
    CircularProgress,
} from '@mui/material';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CarDAO from '../../daos/CarDao';
import CustomerDAO from '../../daos/CustomerDao';

// --- Styling Constants ---
const C = {
    bg: '#F4F5F7',
    white: '#FFFFFF',
    border: '#E4E6EA',
    borderFocus: '#1971C2',
    primary: '#1971C2',
    primaryLight: '#EBF4FF',
    text: '#1C1E21',
    textSub: '#606770',
    textMuted: '#9EA8B3',
    error: '#D92B2B',
    success: '#1E8840',
    successLight: '#EBF8EF',
    stepIdle: '#C8CDD4',
};

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

const STEPS = [
    { label: 'Detail', icon: '1' },
    { label: 'Teknis', icon: '2' },
    { label: 'Finansial', icon: '3' },
    { label: 'Foto Mobil', icon: '4' },
    { label: 'Dokumen', icon: '5' },
];

function WizardStepper({ active }) {
    return (
        <Box display="flex" alignItems="flex-start" justifyContent="center" mb={4} sx={{ overflowX: 'auto', pb: 1 }}>
            {STEPS.map((step, i) => {
                const done = i < active;
                const current = i === active;
                return (
                    <Box key={i} display="flex" alignItems="flex-start">
                        <Box display="flex" flexDirection="column" alignItems="center" sx={{ minWidth: 60 }}>
                            <Box
                                sx={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    bgcolor: done || current ? '#1971C2' : '#FFFFFF',
                                    border: `2px solid ${done || current ? '#1971C2' : '#C8CDD4'}`,
                                    boxShadow: current ? `0 0 0 4px ${alpha('#1971C2', 0.15)}` : 'none',
                                    transition: 'all 0.25s',
                                    flexShrink: 0,
                                }}
                            >
                                {done
                                    ? <Icon icon="mdi:check" width={14} color="#fff" />
                                    : <Typography fontSize={12} fontWeight={700} sx={{ color: current ? '#fff' : '#C8CDD4' }}>{step.icon}</Typography>
                                }
                            </Box>
                            <Typography fontSize={11} fontWeight={current ? 700 : 500} mt={0.75} textAlign="center"
                                sx={{ color: current ? '#1971C2' : done ? '#606770' : '#C8CDD4' }}>
                                {step.label}
                            </Typography>
                        </Box>
                        {i < STEPS.length - 1 && (
                            <Box sx={{ width: 40, height: 2, bgcolor: i < active ? '#1971C2' : '#C8CDD4', mt: '15px', transition: 'background-color 0.3s', flexShrink: 0 }} />
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}

function Section({ title, children }) {
    return (
        <Box mb={3}>
            <Typography fontSize={15} fontWeight={700} sx={{ color: '#1C1E21', mb: 2 }}>{title}</Typography>
            {children}
        </Box>
    );
}

function Field({ label, required, hint, children }) {
    return (
        <Box mb={2.5}>
            <Box display="flex" alignItems="baseline" gap={0.4} mb={0.75}>
                <Typography fontSize={13} fontWeight={600} sx={{ color: '#1C1E21' }}>{label}</Typography>
                {required && <Typography fontSize={13} sx={{ color: '#D92B2B' }}>*</Typography>}
            </Box>
            {hint && <Typography fontSize={12} sx={{ color: '#606770', mb: 0.75 }}>{hint}</Typography>}
            {children}
        </Box>
    );
}

// ─── Image Upload Box ────────────────────────────────────────────────────────
function ImageUploadBox({ label, icon, fieldKey, file, preview, onSelect, onClear }) {
    const inputRef = useRef();
    return (
        <Box>
            <Typography fontSize={12} fontWeight={600} sx={{ color: C.text, mb: 0.75 }}>{label}</Typography>
            {preview ? (
                <Box sx={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: `2px solid ${C.primary}`, aspectRatio: '4/3', bgcolor: '#000' }}>
                    <img src={preview} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <IconButton
                        size="small"
                        onClick={onClear}
                        sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
                    >
                        <Icon icon="mdi:close" width={14} />
                    </IconButton>
                </Box>
            ) : (
                <Box
                    onClick={() => inputRef.current?.click()}
                    sx={{
                        border: `2px dashed ${C.border}`,
                        borderRadius: '10px',
                        aspectRatio: '4/3',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.15s',
                        bgcolor: '#FAFBFC',
                        '&:hover': { borderColor: C.primary, bgcolor: C.primaryLight },
                    }}
                >
                    <Icon icon={icon} width={28} color={C.textMuted} />
                    <Typography fontSize={11} sx={{ color: C.textMuted, mt: 0.75, textAlign: 'center' }}>Ketuk untuk unggah</Typography>
                </Box>
            )}
            <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => { if (e.target.files[0]) onSelect(e.target.files[0]); }} />
        </Box>
    );
}

// ─── Document Upload Box ─────────────────────────────────────────────────────
function DocUploadBox({ label, fieldKey, file, preview, onSelect, onClear }) {
    const inputRef = useRef();
    return (
        <Box mb={2}>
            <Typography fontSize={13} fontWeight={600} sx={{ color: C.text, mb: 0.75 }}>{label}</Typography>
            {preview ? (
                <Box sx={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: `2px solid ${C.primary}`, height: 120 }}>
                    <img src={preview} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <IconButton
                        size="small"
                        onClick={onClear}
                        sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
                    >
                        <Icon icon="mdi:close" width={14} />
                    </IconButton>
                </Box>
            ) : (
                <Box
                    onClick={() => inputRef.current?.click()}
                    sx={{
                        border: `2px dashed ${C.border}`,
                        borderRadius: '10px',
                        height: 90,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5,
                        cursor: 'pointer', transition: 'all 0.15s',
                        bgcolor: '#FAFBFC',
                        '&:hover': { borderColor: C.primary, bgcolor: C.primaryLight },
                    }}
                >
                    <Icon icon="mdi:file-image-outline" width={24} color={C.textMuted} />
                    <Typography fontSize={12} sx={{ color: C.textMuted }}>Unggah foto {label}</Typography>
                </Box>
            )}
            <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => { if (e.target.files[0]) onSelect(e.target.files[0]); }} />
        </Box>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CreateCarDialog({ open, onClose, customerId, onCarCreated }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const message = useAlert();
    const loadingProvider = useLoading();

    const [activeStep, setActiveStep] = useState(0);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const [createdCarId, setCreatedCarId] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        carBrand: '',
        carModel: '',
        plateNumber: '',
        ownerName: '',
        chassisNumber: '',
        engineNumber: '',
        carPrice: '',
        startDate: '',
        dueDate: '',
        year: '',
        color: '',
    });

    // Car photos state
    const [carPhotos, setCarPhotos] = useState({ front: null, back: null, leftSide: null, rightSide: null });
    const [carPhotoPreviews, setCarPhotoPreviews] = useState({ front: null, back: null, leftSide: null, rightSide: null });

    // Document photos state
    const [docPhotos, setDocPhotos] = useState({ stnk: null, sim: null, ktp: null });
    const [docPhotoPreviews, setDocPhotoPreviews] = useState({ stnk: null, sim: null, ktp: null });

    React.useEffect(() => {
        if (open && !customerId) {
            fetchCustomers();
            setActiveStep(0);
        }
    }, [open, customerId]);

    const fetchCustomers = async () => {
        try {
            const res = await CustomerDAO.getAllCustomers();
            if (res.success) {
                setCustomers(res.customers.filter(c => c.status !== 'Cancelled'));
            }
        } catch (error) {
            console.error('Failed to fetch customers:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSelectPhoto = (field, file) => {
        setCarPhotos(prev => ({ ...prev, [field]: file }));
        setCarPhotoPreviews(prev => ({ ...prev, [field]: URL.createObjectURL(file) }));
    };

    const handleClearPhoto = (field) => {
        setCarPhotos(prev => ({ ...prev, [field]: null }));
        setCarPhotoPreviews(prev => ({ ...prev, [field]: null }));
    };

    const handleSelectDoc = (field, file) => {
        setDocPhotos(prev => ({ ...prev, [field]: file }));
        setDocPhotoPreviews(prev => ({ ...prev, [field]: URL.createObjectURL(file) }));
    };

    const handleClearDoc = (field) => {
        setDocPhotos(prev => ({ ...prev, [field]: null }));
        setDocPhotoPreviews(prev => ({ ...prev, [field]: null }));
    };

    const handleNext = async () => {
        if (activeStep === 0) {
            if (!customerId && !selectedCustomer) { message('Please select a customer', 'error'); return; }
            if (!formData.carBrand.trim()) { message('Car brand is required', 'error'); return; }
            if (!formData.carModel.trim()) { message('Car model is required', 'error'); return; }
            if (!formData.plateNumber.trim()) { message('Plate number is required', 'error'); return; }
        }

        if (activeStep === 2) {
            // Submit car data first and get the car ID
            await handleSubmitCar();
            return;
        }

        if (activeStep === 3) {
            // Upload car photos
            await handleUploadCarPhotos();
            return;
        }

        if (activeStep === 4) {
            // Upload documents and finish
            await handleUploadDocuments();
            return;
        }

        setActiveStep(prev => prev + 1);
    };

    const handleBack = () => setActiveStep(prev => prev - 1);

    const handleClose = () => {
        setFormData({
            carBrand: '', carModel: '', plateNumber: '', ownerName: '',
            chassisNumber: '', engineNumber: '', carPrice: '', startDate: '', dueDate: '',
            year: '', color: ''
        });
        setSelectedCustomer(null);
        setActiveStep(0);
        setCustomerSearch('');
        setCreatedCarId(null);
        setCarPhotos({ front: null, back: null, leftSide: null, rightSide: null });
        setCarPhotoPreviews({ front: null, back: null, leftSide: null, rightSide: null });
        setDocPhotos({ stnk: null, sim: null, ktp: null });
        setDocPhotoPreviews({ stnk: null, sim: null, ktp: null });
        onClose();
    };

    // Step 3 → creates the car record and moves to step 4
    const handleSubmitCar = async () => {
        try {
            loadingProvider.start();
            const submitData = {
                customerId: customerId || selectedCustomer?.id,
                carOwnerName: formData.ownerName.trim() || selectedCustomer?.name || '',
                carBrand: formData.carBrand,
                carModel: formData.carModel,
                plateNumber: formData.plateNumber,
                chassisNumber: formData.chassisNumber,
                engineNumber: formData.engineNumber,
                startDate: formData.startDate || null,
                dueDate: formData.dueDate || null,
                carPrice: formData.carPrice ? Number(formData.carPrice) : 0,
                year: formData.year,
                color: formData.color,
            };
            const response = await CarDAO.createCar(submitData);
            if (!response.success) throw new Error(response.error || 'Failed to create car');
            setCreatedCarId(response.car.id);
            message('Car created! Now upload photos.', 'success');
            setActiveStep(3);
        } catch (error) {
            console.error(error);
            message(error.message || 'Failed to create car', 'error');
        } finally {
            loadingProvider.stop();
        }
    };

    // Step 4 → upload car photos
    const handleUploadCarPhotos = async () => {
        const hasAny = Object.values(carPhotos).some(Boolean);
        if (!hasAny) {
            // Skip, go to step 5
            setActiveStep(4);
            return;
        }
        try {
            setUploading(true);
            const fd = new FormData();
            if (carPhotos.front) fd.append('front', carPhotos.front);
            if (carPhotos.back) fd.append('back', carPhotos.back);
            if (carPhotos.leftSide) fd.append('leftSide', carPhotos.leftSide);
            if (carPhotos.rightSide) fd.append('rightSide', carPhotos.rightSide);
            const res = await CarDAO.uploadCarPhotos(createdCarId, fd);
            if (!res.success) throw new Error(res.error || 'Failed to upload photos');
            message('Car photos uploaded!', 'success');
            setActiveStep(4);
        } catch (error) {
            console.error(error);
            message(error.message || 'Failed to upload car photos', 'error');
        } finally {
            setUploading(false);
        }
    };

    // Step 5 → upload documents and finish
    const handleUploadDocuments = async () => {
        const hasAny = Object.values(docPhotos).some(Boolean);
        if (hasAny && createdCarId) {
            try {
                setUploading(true);
                const fd = new FormData();
                if (docPhotos.stnk) fd.append('stnk', docPhotos.stnk);
                if (docPhotos.sim) fd.append('sim', docPhotos.sim);
                if (docPhotos.ktp) fd.append('ktp', docPhotos.ktp);
                const res = await CarDAO.uploadDocuments(createdCarId, fd);
                if (!res.success) throw new Error(res.error || 'Failed to upload documents');
                message('Documents uploaded!', 'success');
                // Trigger parent refresh then get final car data
                if (res.car) onCarCreated(res.car);
            } catch (error) {
                console.error(error);
                message(error.message || 'Failed to upload documents', 'error');
            } finally {
                setUploading(false);
            }
        } else {
            // No docs but car was created — fetch latest and notify parent
            try {
                const latestRes = await CarDAO.getCarById(createdCarId);
                if (latestRes.success) onCarCreated(latestRes.car);
            } catch (_) { }
        }
        handleClose();
    };

    const filteredCustomers = useMemo(() => {
        const s = customerSearch.toLowerCase();
        return customers.filter(c =>
            c.name?.toLowerCase().includes(s) ||
            c.phone?.toLowerCase().includes(s)
        );
    }, [customers, customerSearch]);

    const isLastStep = activeStep === STEPS.length - 1;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{ style: { borderRadius: isMobile ? '0px' : '12px', overflow: 'hidden', backgroundColor: C.bg } }}
        >
            {/* Header */}
            <Box sx={{ p: isMobile ? 2 : 3, borderBottom: '1px solid #E4E6EA', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: C.white }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: C.text, fontSize: 18 }}>Tambah Mobil Baru</Typography>
                    <Typography fontSize={13} sx={{ color: C.textSub, mt: 0.5 }}>Daftarkan kendaraan baru ke sistem</Typography>
                </Box>
                <IconButton onClick={handleClose} sx={{ color: C.textSub }}>
                    <Icon icon="mdi:close" width={24} />
                </IconButton>
            </Box>

            {/* Stepper */}
            <Box sx={{ pt: 3, px: 2 }}>
                <WizardStepper active={activeStep} />
            </Box>

            {/* Body */}
            <Box sx={{ p: isMobile ? 2 : 3, overflowY: 'auto' }}>

                {/* ── STEP 1: Details ── */}
                {activeStep === 0 && (
                    <Fade in key="s1">
                        <Box>
                            {!customerId ? (
                                <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                                    <Section title="Pelanggan">
                                        <Field label="Pilih Pelanggan" required>
                                            <Box
                                                onClick={() => setOpenCustomerDialog(true)}
                                                sx={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    px: 1.5, py: '9px',
                                                    border: `1px solid ${selectedCustomer ? C.primary : C.border}`,
                                                    borderRadius: '8px',
                                                    bgcolor: selectedCustomer ? C.primaryLight : C.white,
                                                    cursor: 'pointer', transition: 'all 0.15s',
                                                    '&:hover': { borderColor: selectedCustomer ? C.primary : '#B0B5BC' },
                                                }}
                                            >
                                                <Box display="flex" alignItems="center" gap={1.25}>
                                                    <Icon icon="mdi:account-search" width={18} color={selectedCustomer ? C.primary : C.textMuted} />
                                                    <Typography fontSize={14} sx={{ color: selectedCustomer ? C.text : C.textMuted }}>
                                                        {selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.phone})` : 'Ketuk untuk pilih pelanggan...'}
                                                    </Typography>
                                                </Box>
                                                {selectedCustomer
                                                    ? <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSelectedCustomer(null); setFormData(p => ({ ...p, ownerName: '' })); }} sx={{ p: 0.25 }}><Icon icon="mdi:close" width={15} color={C.textSub} /></IconButton>
                                                    : <Icon icon="mdi:chevron-down" width={18} color={C.textMuted} />
                                                }
                                            </Box>
                                        </Field>
                                    </Section>
                                </Paper>
                            ) : null}

                            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                                <Section title="Detail Kendaraan">
                                    <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                                        <Field label="Merek Mobil" required>
                                            <TextField fullWidth size="small" name="carBrand" value={formData.carBrand} onChange={handleChange} placeholder="cth. Toyota" sx={inputStyle} />
                                        </Field>
                                        <Field label="Model Mobil" required>
                                            <TextField fullWidth size="small" name="carModel" value={formData.carModel} onChange={handleChange} placeholder="cth. Avanza" sx={inputStyle} />
                                        </Field>
                                    </Stack>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                                        <Field label="Tahun">
                                            <TextField fullWidth size="small" name="year" value={formData.year} onChange={handleChange} placeholder="cth. 2022" sx={inputStyle} />
                                        </Field>
                                        <Field label="Warna">
                                            <TextField fullWidth size="small" name="color" value={formData.color} onChange={handleChange} placeholder="cth. Putih Metalik" sx={inputStyle} />
                                        </Field>
                                    </Stack>
                                    <Field label="Nomor Polisi" required>
                                        <TextField fullWidth size="small" name="plateNumber" value={formData.plateNumber} onChange={handleChange} placeholder="cth. B 1234 ABC" sx={inputStyle} />
                                    </Field>
                                    <Field label="Nama Pemilik (di STNK)" hint="Tulis nama sesuai yang tertera di STNK jika berbeda">
                                        <TextField fullWidth size="small" name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="cth. Budi Santoso" sx={inputStyle} />
                                    </Field>
                                </Section>
                            </Paper>

                            <Button fullWidth variant="contained" onClick={handleNext} endIcon={<Icon icon="mdi:arrow-right" width={16} />}
                                sx={{ borderRadius: '8px', py: 1.4, textTransform: 'none', fontSize: 14, fontWeight: 600, bgcolor: C.primary, boxShadow: 'none', '&:hover': { bgcolor: '#145EA8' } }}>
                                Lanjut ke Teknis
                            </Button>
                        </Box>
                    </Fade>
                )}

                {/* ── STEP 2: Technical ── */}
                {activeStep === 1 && (
                    <Fade in key="s2">
                        <Box>
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                                <Section title="Identifikasi Teknis">
                                    <Field label="No. Rangka (Chassis Number)">
                                        <TextField fullWidth size="small" name="chassisNumber" value={formData.chassisNumber} onChange={handleChange} placeholder="cth. MHF..." sx={inputStyle} />
                                    </Field>
                                    <Field label="No. Mesin (Engine Number)">
                                        <TextField fullWidth size="small" name="engineNumber" value={formData.engineNumber} onChange={handleChange} placeholder="cth. 1TR..." sx={inputStyle} />
                                    </Field>
                                </Section>
                            </Paper>

                            <Box display="flex" gap={1.5}>
                                <Button fullWidth variant="outlined" onClick={handleBack} startIcon={<Icon icon="mdi:arrow-left" width={16} />}
                                    sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: C.border, color: C.textSub }}>
                                    Kembali
                                </Button>
                                <Button fullWidth variant="contained" onClick={handleNext} endIcon={<Icon icon="mdi:arrow-right" width={16} />}
                                    sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, bgcolor: C.primary, boxShadow: 'none' }}>
                                    Lanjut ke Finansial
                                </Button>
                            </Box>
                        </Box>
                    </Fade>
                )}

                {/* ── STEP 3: Financial ── */}
                {activeStep === 2 && (
                    <Fade in key="s3">
                        <Box>
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                                <Section title="Data Finansial & Asuransi">
                                    <Field label="Harga Pasar Kendaraan (IDR)">
                                        <TextField fullWidth size="small" name="carPrice" type="number" value={formData.carPrice} onChange={handleChange} placeholder="cth. 200000000" sx={inputStyle}
                                            InputProps={{ startAdornment: <InputAdornment position="start">Rp</InputAdornment> }}
                                        />
                                    </Field>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                                        <Field label="Tanggal Mulai Asuransi">
                                            <TextField fullWidth size="small" name="startDate" type="date" value={formData.startDate} onChange={handleChange} sx={inputStyle} />
                                        </Field>
                                        <Field label="Tanggal Jatuh Tempo">
                                            <TextField fullWidth size="small" name="dueDate" type="date" value={formData.dueDate} onChange={handleChange} sx={inputStyle} />
                                        </Field>
                                    </Stack>
                                </Section>
                            </Paper>

                            <Box display="flex" gap={1.5}>
                                <Button fullWidth variant="outlined" onClick={handleBack} startIcon={<Icon icon="mdi:arrow-left" width={16} />}
                                    sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: C.border, color: C.textSub }}>
                                    Kembali
                                </Button>
                                <Button fullWidth variant="contained" onClick={handleNext} endIcon={<Icon icon="mdi:arrow-right" width={16} />}
                                    sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, bgcolor: C.primary, boxShadow: 'none' }}>
                                    Simpan Kendaraan
                                </Button>
                            </Box>
                        </Box>
                    </Fade>
                )}

                {/* ── STEP 4: Car Photos ── */}
                {activeStep === 3 && (
                    <Fade in key="s4">
                        <Box>
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                                <Section title="Foto Kendaraan">
                                    <Typography fontSize={12} sx={{ color: C.textSub, mb: 2 }}>Unggah foto kendaraan dari 4 sisi. Semua bersifat opsional.</Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                        <ImageUploadBox
                                            label="Depan"
                                            icon="mdi:car-arrow-right"
                                            fieldKey="front"
                                            file={carPhotos.front}
                                            preview={carPhotoPreviews.front}
                                            onSelect={(f) => handleSelectPhoto('front', f)}
                                            onClear={() => handleClearPhoto('front')}
                                        />
                                        <ImageUploadBox
                                            label="Belakang"
                                            icon="mdi:car-arrow-left"
                                            fieldKey="back"
                                            file={carPhotos.back}
                                            preview={carPhotoPreviews.back}
                                            onSelect={(f) => handleSelectPhoto('back', f)}
                                            onClear={() => handleClearPhoto('back')}
                                        />
                                        <ImageUploadBox
                                            label="Samping Kanan"
                                            icon="mdi:car-side"
                                            fieldKey="rightSide"
                                            file={carPhotos.rightSide}
                                            preview={carPhotoPreviews.rightSide}
                                            onSelect={(f) => handleSelectPhoto('rightSide', f)}
                                            onClear={() => handleClearPhoto('rightSide')}
                                        />
                                        <ImageUploadBox
                                            label="Samping Kiri"
                                            icon="mdi:car-side"
                                            fieldKey="leftSide"
                                            file={carPhotos.leftSide}
                                            preview={carPhotoPreviews.leftSide}
                                            onSelect={(f) => handleSelectPhoto('leftSide', f)}
                                            onClear={() => handleClearPhoto('leftSide')}
                                        />
                                    </Box>
                                </Section>
                            </Paper>

                            <Box display="flex" gap={1.5}>
                                <Button fullWidth variant="outlined" onClick={() => setActiveStep(2)} startIcon={<Icon icon="mdi:arrow-left" width={16} />}
                                    disabled={uploading}
                                    sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: C.border, color: C.textSub }}>
                                    Kembali
                                </Button>
                                <Button fullWidth variant="contained" onClick={handleNext}
                                    disabled={uploading}
                                    endIcon={uploading ? <CircularProgress size={14} color="inherit" /> : <Icon icon="mdi:arrow-right" width={16} />}
                                    sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, bgcolor: C.primary, boxShadow: 'none' }}>
                                    {uploading ? 'Mengunggah...' : 'Lanjut ke Dokumen'}
                                </Button>
                            </Box>
                        </Box>
                    </Fade>
                )}

                {/* ── STEP 5: Document Photos ── */}
                {activeStep === 4 && (
                    <Fade in key="s5">
                        <Box>
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                                <Section title="Foto Dokumen">
                                    <Typography fontSize={12} sx={{ color: C.textSub, mb: 2 }}>Unggah foto dokumen terkait. Semua bersifat opsional.</Typography>
                                    <DocUploadBox
                                        label="STNK"
                                        fieldKey="stnk"
                                        file={docPhotos.stnk}
                                        preview={docPhotoPreviews.stnk}
                                        onSelect={(f) => handleSelectDoc('stnk', f)}
                                        onClear={() => handleClearDoc('stnk')}
                                    />
                                    <DocUploadBox
                                        label="SIM (Surat Izin Mengemudi)"
                                        fieldKey="sim"
                                        file={docPhotos.sim}
                                        preview={docPhotoPreviews.sim}
                                        onSelect={(f) => handleSelectDoc('sim', f)}
                                        onClear={() => handleClearDoc('sim')}
                                    />
                                    <DocUploadBox
                                        label="KTP Pemilik"
                                        fieldKey="ktp"
                                        file={docPhotos.ktp}
                                        preview={docPhotoPreviews.ktp}
                                        onSelect={(f) => handleSelectDoc('ktp', f)}
                                        onClear={() => handleClearDoc('ktp')}
                                    />
                                </Section>
                            </Paper>

                            <Box display="flex" gap={1.5}>
                                <Button fullWidth variant="outlined" onClick={() => setActiveStep(3)} startIcon={<Icon icon="mdi:arrow-left" width={16} />}
                                    disabled={uploading}
                                    sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: C.border, color: C.textSub }}>
                                    Kembali
                                </Button>
                                <Button fullWidth variant="contained" onClick={handleNext}
                                    disabled={uploading}
                                    startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : <Icon icon="mdi:check" width={16} />}
                                    sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, bgcolor: C.success, boxShadow: 'none', '&:hover': { bgcolor: '#166E32' } }}>
                                    {uploading ? 'Menyimpan...' : 'Selesai & Simpan'}
                                </Button>
                            </Box>
                        </Box>
                    </Fade>
                )}

            </Box>

            {/* Customer Selection Dialog */}
            <Dialog
                open={openCustomerDialog} onClose={() => setOpenCustomerDialog(false)}
                maxWidth="xs" fullWidth
                PaperProps={{ style: { borderRadius: '12px' } }}
            >
                <Box p={2} borderBottom="1px solid #E4E6EA" display="flex" justifyContent="space-between" alignItems="center">
                    <Typography fontWeight={700} fontSize={15}>Pilih Pelanggan</Typography>
                    <IconButton size="small" onClick={() => setOpenCustomerDialog(false)}><Icon icon="mdi:close" /></IconButton>
                </Box>
                <Box p={2} borderBottom="1px solid #E4E6EA">
                    <TextField
                        fullWidth size="small" autoFocus placeholder="Cari nama atau telepon..."
                        value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" width={18} /></InputAdornment>
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F4F5F7' } }}
                    />
                </Box>
                <Box p={0} sx={{ maxHeight: 300, overflowY: 'auto' }}>
                    {filteredCustomers.length === 0 ? (
                        <Typography p={3} textAlign="center" fontSize={13} color="#9EA8B3">Pelanggan tidak ditemukan</Typography>
                    ) : (
                        filteredCustomers.map(c => (
                            <Box
                                key={c.id}
                                onClick={() => {
                                    setSelectedCustomer(c);
                                    setOpenCustomerDialog(false);
                                    setFormData(p => ({ ...p, ownerName: c.name }));
                                }}
                                sx={{ p: 1.5, display: 'flex', alignItems: 'center', borderBottom: '1px solid #F4F5F7', cursor: 'pointer', '&:hover': { bgcolor: '#F8F9FA' } }}
                            >
                                <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#EBF4FF', color: '#1971C2', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5, fontWeight: 700, fontSize: 13 }}>
                                    {c.name?.substring(0, 2).toUpperCase()}
                                </Box>
                                <Box>
                                    <Typography fontSize={14} fontWeight={600} color="#1C1E21">{c.name}</Typography>
                                    <Typography fontSize={12} color="#606770">{c.phone}</Typography>
                                </Box>
                            </Box>
                        ))
                    )}
                </Box>
            </Dialog>

        </Dialog>
    );
}
