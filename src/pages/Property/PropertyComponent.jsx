import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import {
    Dialog,
    useMediaQuery,
    useTheme,
    Box,
    Typography,
    Stack,
    Divider,
    Button,
    TextField,
    Paper,
    alpha,
    Fade,
    InputAdornment,
    IconButton,
    Grid,
    MenuItem
} from '@mui/material';
import dayjs from 'dayjs';
import PropertyDAO from '../../daos/propertyDao';
import CustomerDAO from '../../daos/CustomerDao';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';

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

const PROPERTY_TYPES = [
    { value: 'House', label: 'Rumah' },
    { value: 'Apartment', label: 'Apartemen' },
    { value: 'Office', label: 'Kantor' },
    { value: 'Warehouse', label: 'Gudang' },
    { value: 'Shop', label: 'Ruko' },
    { value: 'Land', label: 'Tanah' },
];

const COVERAGE_TYPES = [
    { value: 'Fire', label: 'Kebakaran' },
    { value: 'Earthquake', label: 'Gempa Bumi' },
    { value: 'Flood', label: 'Banjir' },
    { value: 'All Risk', label: 'Semua Risiko (All Risk)' },
    { value: 'Basic', label: 'Dasar' },
];

const formatNumberInput = (value) => {
    if (!value) return '';
    return value.toString().replace(/[^0-9.]/g, '');
};

const STEPS = [
    { label: 'Detail', icon: '1' },
    { label: 'Spesifikasi', icon: '2' },
    { label: 'Asuransi', icon: '3' },
    { label: 'Unggahan', icon: '4' }
];

function WizardStepper({ active }) {
    return (
        <Box display="flex" alignItems="flex-start" justifyContent="center" mb={4} flexWrap="wrap" gap={{ xs: 1, sm: 0 }}>
            {STEPS.map((step, i) => {
                const done = i < active;
                const current = i === active;
                return (
                    <Box key={i} display="flex" alignItems="flex-start">
                        <Box display="flex" flexDirection="column" alignItems="center" sx={{ minWidth: { xs: 56, sm: 72 } }}>
                            <Box
                                sx={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    bgcolor: done || current ? '#1971C2' : '#FFFFFF',
                                    border: `2px solid ${done || current ? '#1971C2' : '#C8CDD4'}`,
                                    boxShadow: current ? `0 0 0 4px ${alpha('#1971C2', 0.15)}` : 'none',
                                    transition: 'all 0.25s',
                                }}
                            >
                                {done
                                    ? <Icon icon="mdi:check" width={16} color="#fff" />
                                    : <Typography fontSize={13} fontWeight={700} sx={{ color: current ? '#fff' : '#C8CDD4' }}>{step.icon}</Typography>
                                }
                            </Box>
                            <Typography fontSize={12} fontWeight={current ? 700 : 500} mt={0.75}
                                sx={{ color: current ? '#1971C2' : done ? '#606770' : '#C8CDD4', textAlign: 'center' }}>
                                {step.label}
                            </Typography>
                        </Box>
                        {i < STEPS.length - 1 && (
                            <Box sx={{ width: { xs: 32, sm: 64 }, height: 2, bgcolor: i < active ? '#1971C2' : '#C8CDD4', mt: '17px', transition: 'background-color 0.3s', flexShrink: 0 }} />
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}

function Section({ title, action, children }) {
    return (
        <Box mb={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography fontSize={15} fontWeight={700} sx={{ color: '#1C1E21' }}>{title}</Typography>
                {action}
            </Box>
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

function FileUploadBox({ label, file, onClick, onRemove }) {
    return (
        <Box
            onClick={!file ? onClick : undefined}
            sx={{
                border: '1px dashed #C8CDD4', borderRadius: '8px', p: 2,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                bgcolor: file ? '#F8F9FA' : '#FFFFFF',
                cursor: !file ? 'pointer' : 'default',
                transition: 'all 0.2s',
                '&:hover': !file ? { borderColor: '#1971C2', bgcolor: '#F8F9FA' } : {},
                minHeight: 100
            }}
        >
            {file ? (
                <Box display="flex" flexDirection="column" alignItems="center" width="100%">
                    <Icon icon="mdi:check-circle" color="#1E8840" width={24} />
                    <Typography fontSize={12} fontWeight={600} mt={1} noWrap sx={{ maxWidth: '100%' }}>{file.name}</Typography>
                    <Button size="small" variant="text" color="error" onClick={(e) => { e.stopPropagation(); onRemove(); }} sx={{ mt: 1, textTransform: 'none', fontSize: 12 }}>Remove</Button>
                </Box>
            ) : (
                <>
                    <Icon icon="mdi:cloud-upload" color="#606770" width={24} />
                    <Typography fontSize={12} color="#606770" mt={1} textAlign="center">{label}</Typography>
                </>
            )}
        </Box>
    );
}

export default function PropertyComponent({ open, onClose, selectedDetail, isNewRecord = false, onPropertySuccess }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const message = useAlert();
    const loadingProvider = useLoading();

    const [activeStep, setActiveStep] = useState(0);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');

    const [propertyPhotos, setPropertyPhotos] = useState({
        front: null, back: null, left: null, right: null,
        interior1: null, interior2: null, interior3: null, interior4: null
    });

    const [propertyDocuments, setPropertyDocuments] = useState({
        certificate: null, imb: null, pbb: null, other: null
    });

    const emptyForm = {
        propertyType: 'House', address: '', city: '', province: '', postalCode: '',
        buildingArea: '', landArea: '', numberOfFloors: '', yearBuilt: '', buildingStructure: '', propertyValue: '',
        policyNumber: '', insuranceCompany: '', coverageType: 'All Risk', insuranceValue: '', premium: '', startDate: '', endDate: '', deductible: '', notes: ''
    };

    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => {
        if (open) {
            setActiveStep(0);
            fetchCustomers();
            if (selectedDetail && !isNewRecord) {
                const formatDate = (dateValue) => {
                    if (!dateValue) return '';
                    try { return dayjs(dateValue).format('YYYY-MM-DD'); } catch (error) { return ''; }
                };
                setFormData({
                    propertyType: selectedDetail.propertyData?.propertyType || 'House',
                    address: selectedDetail.propertyData?.address || '',
                    city: selectedDetail.propertyData?.city || '',
                    province: selectedDetail.propertyData?.province || '',
                    postalCode: selectedDetail.propertyData?.postalCode || '',
                    buildingArea: selectedDetail.propertyData?.buildingArea || '',
                    landArea: selectedDetail.propertyData?.landArea || '',
                    numberOfFloors: selectedDetail.propertyData?.numberOfFloors || '',
                    yearBuilt: selectedDetail.propertyData?.yearBuilt || '',
                    propertyValue: selectedDetail.propertyData?.propertyValue || '',
                    buildingStructure: selectedDetail.propertyData?.buildingStructure || '',
                    policyNumber: selectedDetail.insuranceData?.policyNumber || '',
                    insuranceCompany: selectedDetail.insuranceData?.insuranceCompany || '',
                    coverageType: selectedDetail.insuranceData?.coverageType || 'All Risk',
                    insuranceValue: selectedDetail.insuranceData?.insuranceValue || '',
                    premium: selectedDetail.insuranceData?.premium || '',
                    startDate: formatDate(selectedDetail.insuranceData?.startDate),
                    endDate: formatDate(selectedDetail.insuranceData?.endDate),
                    deductible: selectedDetail.insuranceData?.deductible || '',
                    notes: selectedDetail.notes || '',
                });

                if (selectedDetail.customerId) {
                    // Temporarily set a mock customer name using the ID if real data hasn't loaded yet
                    setSelectedCustomer({ id: selectedDetail.customerId, name: `ID Pelanggan: ${selectedDetail.customerId}` });
                }
            } else {
                setFormData(emptyForm);
                setSelectedCustomer(null);
                setPropertyPhotos({ front: null, back: null, left: null, right: null, interior1: null, interior2: null, interior3: null, interior4: null });
                setPropertyDocuments({ certificate: null, imb: null, pbb: null, other: null });
            }
        }
    }, [open, selectedDetail, isNewRecord]);

    // Update selected customer with real data once customers are loaded
    useEffect(() => {
        if (customers.length > 0 && selectedDetail?.customerId && !isNewRecord) {
            const match = customers.find(c => c.id === selectedDetail.customerId);
            if (match) setSelectedCustomer(match);
        }
    }, [customers, selectedDetail, isNewRecord]);

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
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNumberChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: formatNumberInput(value) }));
    };

    const handlePhotoUpload = (key, file) => {
        if (!file) { setPropertyPhotos(prev => ({ ...prev, [key]: null })); return; }
        if (file.size > 5 * 1024 * 1024) { message('Ukuran file terlalu besar. Maksimal 5MB', 'error'); return; }
        setPropertyPhotos(prev => ({ ...prev, [key]: file }));
    };

    const handleDocUpload = (key, file) => {
        if (!file) { setPropertyDocuments(prev => ({ ...prev, [key]: null })); return; }
        if (file.size > 10 * 1024 * 1024) { message('Ukuran file terlalu besar. Maksimal 10MB', 'error'); return; }
        setPropertyDocuments(prev => ({ ...prev, [key]: file }));
    };

    const validateStep = () => {
        if (activeStep === 0 && isNewRecord && !selectedCustomer) {
            message('Silakan pilih pelanggan terlebih dahulu.', 'error');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (!validateStep()) return;
        if (activeStep === STEPS.length - 1) {
            handleSubmit();
            return;
        }
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => setActiveStep((prev) => prev - 1);

    const handleClose = () => {
        setFormData(emptyForm); setSelectedCustomer(null); setActiveStep(0); setCustomerSearch('');
        onClose();
    };

    const handleSubmit = async () => {
        try {
            loadingProvider.start();

            const ownerName = selectedCustomer?.name || selectedCustomer?.username || '';
            const ownerPhone = selectedCustomer?.phone || selectedCustomer?.phoneNumber || '';
            const ownerEmail = selectedCustomer?.email || '';

            const submitData = {
                customerId: selectedCustomer?.id,
                ownerName,
                ownerPhone,
                ownerEmail,
                propertyData: {
                    propertyType: formData.propertyType, address: formData.address, city: formData.city, province: formData.province,
                    postalCode: formData.postalCode, buildingArea: formData.buildingArea, landArea: formData.landArea,
                    numberOfFloors: formData.numberOfFloors, yearBuilt: formData.yearBuilt, propertyValue: formData.propertyValue,
                    buildingStructure: formData.buildingStructure
                },
                insuranceData: {
                    policyNumber: formData.policyNumber, insuranceCompany: formData.insuranceCompany, coverageType: formData.coverageType,
                    insuranceValue: formData.insuranceValue, premium: formData.premium,
                    startDate: formData.startDate ? new Date(formData.startDate).getTime() : null,
                    endDate: formData.endDate ? new Date(formData.endDate).getTime() : null,
                    deductible: formData.deductible
                },
                notes: formData.notes
            };

            let propertyId;
            if (isNewRecord) {
                const result = await PropertyDAO.createProperty(submitData);
                propertyId = result.property?.id || result.id;
                message('Properti berhasil ditambahkan', 'success');
            } else {
                await PropertyDAO.updateProperty(selectedDetail.id, submitData);
                propertyId = selectedDetail.id;
                message('Properti berhasil diperbarui', 'success');
            }

            // Upload photos if any newly selected
            const hasPhotos = Object.values(propertyPhotos).some(photo => photo !== null);
            if (hasPhotos && propertyId) {
                try {
                    const photoFormData = new FormData();
                    Object.entries(propertyPhotos).forEach(([key, file]) => { if (file) photoFormData.append(key, file); });
                    await PropertyDAO.uploadPropertyPhotos(propertyId, photoFormData);
                } catch (photoError) { console.error('Photo error:', photoError); message('Properti tersimpan, tetapi unggah foto gagal', 'warning'); }
            }

            // Upload docs if any newly selected
            const hasDocs = Object.values(propertyDocuments).some(doc => doc !== null);
            if (hasDocs && propertyId) {
                try {
                    const docFormData = new FormData();
                    Object.entries(propertyDocuments).forEach(([key, file]) => { if (file) docFormData.append(key, file); });
                    await PropertyDAO.uploadPropertyDocuments(propertyId, docFormData);
                } catch (docError) { console.error('Doc error:', docError); message('Properti tersimpan, tetapi unggah dokumen gagal', 'warning'); }
            }

            if (onPropertySuccess) onPropertySuccess();
            handleClose();
        } catch (err) {
            console.error('Error saving property:', err);
            message(err.error || 'Gagal menyimpan properti', 'error');
        } finally {
            loadingProvider.stop();
        }
    };

    const filteredCustomers = useMemo(() => {
        if (!customerSearch) return customers;
        const lower = customerSearch.toLowerCase();
        return customers.filter(c => c.name?.toLowerCase().includes(lower) || c.phone?.toLowerCase().includes(lower));
    }, [customers, customerSearch]);

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth fullScreen={isMobile} PaperProps={{ style: { borderRadius: isMobile ? '0px' : '16px', bgcolor: '#F8F9FA' } }}>
            {/* Header */}
            <Box px={3} py={2} display="flex" justifyContent="space-between" alignItems="center" borderBottom="1px solid #E4E6EA" bgcolor="#FFFFFF">
                <Typography variant="h6" fontWeight={700} color="#1C1E21">
                    {isNewRecord ? 'Tambah Properti Baru' : 'Edit Properti'}
                </Typography>
                <IconButton onClick={handleClose} size="small"><Icon icon="mdi:close" /></IconButton>
            </Box>

            <Box p={{ xs: 2, sm: 4 }} flex={1} overflow="auto">
                <WizardStepper active={activeStep} />

                {/* ── STEP 1: Details ── */}
                {activeStep === 0 && (
                    <Fade in key="s1">
                        <Box>
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                                <Section title="Penugasan Pelanggan">
                                    {isNewRecord ? (
                                        <Field label="Pilih Pelanggan" required hint="Pilih pemilik properti">
                                            <Box
                                                onClick={() => setOpenCustomerDialog(true)}
                                                sx={{
                                                    ...inputStyle['& .MuiOutlinedInput-root'], p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    cursor: 'pointer', border: '1px solid #E4E6EA', minHeight: 48,
                                                    '&:hover': { borderColor: '#B0B5BC' }
                                                }}
                                            >
                                                {selectedCustomer ? (
                                                    <Box display="flex" alignItems="center">
                                                        <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#EBF4FF', color: '#1971C2', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5, fontWeight: 700, fontSize: 11 }}>
                                                            {selectedCustomer.name?.substring(0, 2).toUpperCase()}
                                                        </Box>
                                                        <Typography fontSize={14} fontWeight={500} color="#1C1E21">{selectedCustomer.name}</Typography>
                                                    </Box>
                                                ) : (
                                                    <Box display="flex" alignItems="center" color="#9EA8B3">
                                                        <Icon icon="mdi:account-search" width={20} style={{ marginRight: 8 }} />
                                                        <Typography fontSize={14}>Click to select customer...</Typography>
                                                    </Box>
                                                )}
                                                <Icon icon="mdi:chevron-down" width={20} color="#9EA8B3" />
                                            </Box>
                                        </Field>
                                    ) : (
                                        <Field label="Selected Customer">
                                            <Box
                                                sx={{
                                                    p: 2, display: 'flex', alignItems: 'center',
                                                    border: '1px solid #E4E6EA', borderRadius: '8px', bgcolor: '#F8F9FA'
                                                }}
                                            >
                                                <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#EBF4FF', color: '#1971C2', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2, fontWeight: 700, fontSize: 14 }}>
                                                    {selectedCustomer?.name?.substring(0, 2).toUpperCase() || '?'}
                                                </Box>
                                                <Box>
                                                    <Typography fontSize={14} fontWeight={600} color="#1C1E21">{selectedCustomer?.name}</Typography>
                                                    {selectedCustomer?.phone && <Typography fontSize={12} color="#606770">{selectedCustomer.phone}</Typography>}
                                                </Box>
                                            </Box>
                                        </Field>
                                    )}
                                </Section>
                            </Paper>

                            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                                <Section title="Detail Properti">
                                    <Field label="Tipe Properti" required>
                                        <TextField select fullWidth size="small" name="propertyType" value={formData.propertyType} onChange={handleChange} sx={inputStyle} SelectProps={{ IconComponent: () => <Icon icon="mdi:chevron-down" width={20} color="#9EA8B3" style={{ marginRight: 12, pointerEvents: 'none' }} /> }}>
                                            {PROPERTY_TYPES.map((pt) => <MenuItem key={pt.value} value={pt.value}>{pt.label}</MenuItem>)}
                                        </TextField>
                                    </Field>
                                    <Field label="Alamat" required>
                                        <TextField fullWidth multiline rows={2} size="small" name="address" value={formData.address} onChange={handleChange} placeholder="Alamat lengkap properti" sx={inputStyle} />
                                    </Field>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={4}>
                                            <Field label="Kota"><TextField fullWidth size="small" name="city" value={formData.city} onChange={handleChange} sx={inputStyle} /></Field>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Field label="Provinsi"><TextField fullWidth size="small" name="province" value={formData.province} onChange={handleChange} sx={inputStyle} /></Field>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Field label="Kode Pos"><TextField fullWidth size="small" name="postalCode" value={formData.postalCode} onChange={handleChange} sx={inputStyle} /></Field>
                                        </Grid>
                                    </Grid>
                                </Section>
                            </Paper>

                            <Button fullWidth variant="contained" onClick={handleNext} endIcon={<Icon icon="mdi:arrow-right" width={16} />}
                                sx={{ borderRadius: '8px', py: 1.4, textTransform: 'none', fontSize: 14, fontWeight: 600, bgcolor: C.primary, boxShadow: 'none', '&:hover': { bgcolor: '#145EA8' } }}>
                                Lanjut ke Spesifikasi
                            </Button>
                        </Box>
                    </Fade>
                )}

                {/* ── STEP 2: Specifications ── */}
                {activeStep === 1 && (
                    <Fade in key="s2">
                        <Box>
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                                <Section title="Spesifikasi Fisik">
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Field label="Luas Bangunan (m²)">
                                                <TextField fullWidth size="small" name="buildingArea" value={formData.buildingArea} onChange={handleNumberChange} sx={inputStyle} />
                                            </Field>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Field label="Luas Tanah (m²)">
                                                <TextField fullWidth size="small" name="landArea" value={formData.landArea} onChange={handleNumberChange} sx={inputStyle} />
                                            </Field>
                                        </Grid>
                                    </Grid>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Field label="Jumlah Lantai">
                                                <TextField fullWidth size="small" name="numberOfFloors" value={formData.numberOfFloors} onChange={handleNumberChange} sx={inputStyle} />
                                            </Field>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Field label="Tahun Dibangun">
                                                <TextField fullWidth size="small" name="yearBuilt" value={formData.yearBuilt} onChange={handleNumberChange} sx={inputStyle} />
                                            </Field>
                                        </Grid>
                                    </Grid>
                                    <Field label="Struktur Bangunan" hint="contoh: Beton, Kayu, Baja">
                                        <TextField fullWidth size="small" name="buildingStructure" value={formData.buildingStructure} onChange={handleChange} sx={inputStyle} />
                                    </Field>
                                </Section>
                            </Paper>

                            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                                <Section title="Penilaian">
                                    <Field label="Nilai Pasar Properti (IDR)">
                                        <TextField fullWidth size="small" name="propertyValue" type="number" value={formData.propertyValue} onChange={handleNumberChange} sx={inputStyle}
                                            InputProps={{ startAdornment: <InputAdornment position="start">Rp</InputAdornment> }} />
                                    </Field>
                                </Section>
                            </Paper>

                            <Box display="flex" gap={1.5}>
                                <Button fullWidth variant="outlined" onClick={handleBack} startIcon={<Icon icon="mdi:arrow-left" width={16} />} sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: C.border, color: C.textSub }}>Kembali</Button>
                                <Button fullWidth variant="contained" onClick={handleNext} endIcon={<Icon icon="mdi:arrow-right" width={16} />} sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, bgcolor: C.primary, boxShadow: 'none' }}>Lanjut ke Asuransi</Button>
                            </Box>
                        </Box>
                    </Fade>
                )}

                {/* ── STEP 3: Insurance ── */}
                {activeStep === 2 && (
                    <Fade in key="s3">
                        <Box>
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                                <Section title="Detail Asuransi">
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Field label="Nomor Polis">
                                                <TextField fullWidth size="small" name="policyNumber" value={formData.policyNumber} onChange={handleChange} sx={inputStyle} />
                                            </Field>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Field label="Perusahaan Asuransi">
                                                <TextField fullWidth size="small" name="insuranceCompany" value={formData.insuranceCompany} onChange={handleChange} sx={inputStyle} />
                                            </Field>
                                        </Grid>
                                    </Grid>
                                    <Field label="Jenis Pertanggungan">
                                        <TextField select fullWidth size="small" name="coverageType" value={formData.coverageType} onChange={handleChange} sx={inputStyle} SelectProps={{ IconComponent: () => <Icon icon="mdi:chevron-down" width={20} color="#9EA8B3" style={{ marginRight: 12, pointerEvents: 'none' }} /> }}>
                                            {COVERAGE_TYPES.map((ct) => <MenuItem key={ct.value} value={ct.value}>{ct.label}</MenuItem>)}
                                        </TextField>
                                    </Field>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Field label="Nilai Asuransi (IDR)">
                                                <TextField fullWidth size="small" name="insuranceValue" value={formData.insuranceValue} onChange={handleNumberChange} sx={inputStyle} InputProps={{ startAdornment: <InputAdornment position="start">Rp</InputAdornment> }} />
                                            </Field>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Field label="Premi (IDR)">
                                                <TextField fullWidth size="small" name="premium" value={formData.premium} onChange={handleNumberChange} sx={inputStyle} InputProps={{ startAdornment: <InputAdornment position="start">Rp</InputAdornment> }} />
                                            </Field>
                                        </Grid>
                                    </Grid>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Field label="Tanggal Mulai">
                                                <TextField fullWidth size="small" type="date" name="startDate" value={formData.startDate} onChange={handleChange} sx={inputStyle} />
                                            </Field>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Field label="Tanggal Berakhir">
                                                <TextField fullWidth size="small" type="date" name="endDate" value={formData.endDate} onChange={handleChange} sx={inputStyle} />
                                            </Field>
                                        </Grid>
                                    </Grid>
                                    <Field label="Risiko Sendiri">
                                        <TextField fullWidth size="small" name="deductible" value={formData.deductible} onChange={handleNumberChange} sx={inputStyle} InputProps={{ startAdornment: <InputAdornment position="start">Rp</InputAdornment> }} />
                                    </Field>
                                </Section>
                            </Paper>

                            <Box display="flex" gap={1.5}>
                                <Button fullWidth variant="outlined" onClick={handleBack} startIcon={<Icon icon="mdi:arrow-left" width={16} />} sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: C.border, color: C.textSub }}>Kembali</Button>
                                <Button fullWidth variant="contained" onClick={handleNext} endIcon={<Icon icon="mdi:arrow-right" width={16} />} sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, bgcolor: C.primary, boxShadow: 'none' }}>Lanjut ke Unggahan</Button>
                            </Box>
                        </Box>
                    </Fade>
                )}

                {/* ── STEP 4: Uploads ── */}
                {activeStep === 3 && (
                    <Fade in key="s4">
                        <Box>
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                                <Section title="Dokumen">
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}><FileUploadBox label="Sertifikat (SHM/HGB)" file={propertyDocuments.certificate} onClick={() => document.getElementById('doc-certificate').click()} onRemove={() => handleDocUpload('certificate', null)} /></Grid>
                                        <Grid item xs={12} sm={6}><FileUploadBox label="Izin Mendirikan Bangunan (IMB)" file={propertyDocuments.imb} onClick={() => document.getElementById('doc-imb').click()} onRemove={() => handleDocUpload('imb', null)} /></Grid>
                                        <Grid item xs={12} sm={6}><FileUploadBox label="Pajak Bumi dan Bangunan (PBB)" file={propertyDocuments.pbb} onClick={() => document.getElementById('doc-pbb').click()} onRemove={() => handleDocUpload('pbb', null)} /></Grid>
                                        <Grid item xs={12} sm={6}><FileUploadBox label="Dokumen Lainnya" file={propertyDocuments.other} onClick={() => document.getElementById('doc-other').click()} onRemove={() => handleDocUpload('other', null)} /></Grid>
                                    </Grid>
                                </Section>
                            </Paper>

                            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                                <Section title="Foto Eksterior">
                                    <Grid container spacing={2}>
                                        {['front', 'back', 'left', 'right'].map(pos => (
                                            <Grid item xs={12} sm={3} key={pos}>
                                                <FileUploadBox label={`Tampak ${pos === 'front' ? 'Depan' : pos === 'back' ? 'Belakang' : pos === 'left' ? 'Kiri' : 'Kanan'}`} file={propertyPhotos[pos]} onClick={() => document.getElementById(`photo-${pos}`).click()} onRemove={() => handlePhotoUpload(pos, null)} />
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Section>
                                <Section title="Foto Interior">
                                    <Grid container spacing={2}>
                                        {[1, 2, 3, 4].map(num => (
                                            <Grid item xs={12} sm={3} key={`int${num}`}>
                                                <FileUploadBox label={`Interior ${num}`} file={propertyPhotos[`interior${num}`]} onClick={() => document.getElementById(`photo-interior${num}`).click()} onRemove={() => handlePhotoUpload(`interior${num}`, null)} />
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Section>
                                <Field label="Catatan" hint="Keterangan tambahan mengenai properti ini">
                                    <TextField fullWidth multiline rows={2} size="small" name="notes" value={formData.notes} onChange={handleChange} sx={inputStyle} />
                                </Field>
                            </Paper>

                            {/* Hidden File Inputs */}
                            <input id="doc-certificate" type="file" className="hidden" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleDocUpload('certificate', e.target.files[0])} />
                            <input id="doc-imb" type="file" className="hidden" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleDocUpload('imb', e.target.files[0])} />
                            <input id="doc-pbb" type="file" className="hidden" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleDocUpload('pbb', e.target.files[0])} />
                            <input id="doc-other" type="file" className="hidden" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleDocUpload('other', e.target.files[0])} />

                            {['front', 'back', 'left', 'right'].map(pos => (
                                <input key={pos} id={`photo-${pos}`} type="file" className="hidden" style={{ display: 'none' }} accept="image/*" onChange={(e) => handlePhotoUpload(pos, e.target.files[0])} />
                            ))}
                            {[1, 2, 3, 4].map(num => (
                                <input key={`int${num}`} id={`photo-interior${num}`} type="file" className="hidden" style={{ display: 'none' }} accept="image/*" onChange={(e) => handlePhotoUpload(`interior${num}`, e.target.files[0])} />
                            ))}

                            <Box display="flex" gap={1.5}>
                                <Button fullWidth variant="outlined" onClick={handleBack} startIcon={<Icon icon="mdi:arrow-left" width={16} />} sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: C.border, color: C.textSub }}>Kembali</Button>
                                <Button fullWidth variant="contained" onClick={handleSubmit} startIcon={<Icon icon="mdi:check" width={16} />} sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, bgcolor: C.success, boxShadow: 'none', '&:hover': { bgcolor: '#166E32' } }}>
                                    {isNewRecord ? 'Simpan' : 'Simpan Perubahan'}
                                </Button>
                            </Box>
                        </Box>
                    </Fade>
                )}
            </Box>

            {/* Custom Customer Selection Search Dialog Box */}
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
                        fullWidth size="small" autoFocus placeholder="Cari nama atau nomor telepon..."
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
                                onClick={() => { setSelectedCustomer(c); setOpenCustomerDialog(false); }}
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
