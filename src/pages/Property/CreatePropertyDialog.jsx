import React, { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import {
    Dialog,
    useMediaQuery,
    useTheme,
    Box,
    Typography,
    Stack,
    Button,
    TextField,
    Paper,
    alpha,
    Fade,
    InputAdornment,
    IconButton,
} from '@mui/material';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import PropertyDAO from '../../daos/propertyDao';
import CustomerDAO from '../../daos/CustomerDao';
import FormSelect from '../../reusables/form/FormSelect';

// --- Styling Constants from Quotation Page ---
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
    { label: 'Spesifikasi', icon: '2' },
    { label: 'Asuransi', icon: '3' },
];

function WizardStepper({ active }) {
    return (
        <Box display="flex" alignItems="flex-start" justifyContent="center" mb={4}>
            {STEPS.map((step, i) => {
                const done = i < active;
                const current = i === active;
                return (
                    <Box key={i} display="flex" alignItems="flex-start">
                        <Box display="flex" flexDirection="column" alignItems="center" sx={{ minWidth: 72 }}>
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
                                sx={{ color: current ? '#1971C2' : done ? '#606770' : '#C8CDD4' }}>
                                {step.label}
                            </Typography>
                        </Box>
                        {i < STEPS.length - 1 && (
                            <Box sx={{ width: 64, height: 2, bgcolor: i < active ? '#1971C2' : '#C8CDD4', mt: '17px', transition: 'background-color 0.3s', flexShrink: 0 }} />
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

const propertyTypes = [
    { value: 'House', label: 'Rumah' },
    { value: 'Apartment', label: 'Apartemen' },
    { value: 'Office', label: 'Kantor' },
    { value: 'Warehouse', label: 'Gudang' },
    { value: 'Shop', label: 'Ruko' },
    { value: 'Land', label: 'Tanah' }
];

const coverageTypes = [
    { value: 'Fire', label: 'Kebakaran' },
    { value: 'Earthquake', label: 'Gempa Bumi' },
    { value: 'Flood', label: 'Banjir' },
    { value: 'All Risk', label: 'Semua Risiko (All Risk)' },
    { value: 'Basic', label: 'Dasar' }
];

export default function CreatePropertyDialog({ open, onClose, customerId, onPropertyCreated }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const message = useAlert();
    const loadingProvider = useLoading();

    const [activeStep, setActiveStep] = useState(0);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');

    const emptyForm = {
        // Step 1: Property Details
        propertyType: 'House',
        address: '',
        city: '',
        province: '',
        postalCode: '',
        // Step 2: Specs
        buildingArea: '',
        landArea: '',
        numberOfFloors: '',
        yearBuilt: '',
        buildingStructure: '',
        propertyValue: '',
        // Step 3: Insurance
        policyNumber: '',
        insuranceCompany: '',
        coverageType: 'All Risk',
        insuranceValue: '',
        premium: '',
        startDate: '',
        endDate: '',
        deductible: '',
        notes: '',
        status: 'Active'
    };

    const [formData, setFormData] = useState(emptyForm);

    React.useEffect(() => {
        if (open) {
            setActiveStep(0);
            if (!customerId) {
                fetchCustomers();
            } else {
                fetchSelectedCustomer(customerId);
            }
        }
    }, [open, customerId]);

    const fetchSelectedCustomer = async (id) => {
        try {
            const res = await CustomerDAO.getCustomerById(id);
            const customer = res?.customer || res?.data || res;
            if (customer?.id) {
                setSelectedCustomer(customer);
            }
        } catch (error) {
            console.error('Failed to fetch selected customer:', error);
        }
    };

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

    const handleNext = () => {
        if (activeStep === 0) {
            if (!customerId && !selectedCustomer) { message('Silakan pilih pelanggan', 'error'); return; }
        }

        if (activeStep === STEPS.length - 1) {
            handleSubmit();
            return;
        }

        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => setActiveStep((prev) => prev - 1);

    const handleClose = () => {
        setFormData(emptyForm);
        setSelectedCustomer(null);
        setActiveStep(0);
        setCustomerSearch('');
        onClose();
    };

    const handleSubmit = async () => {
        try {
            loadingProvider.start();

            const ownerName = selectedCustomer?.name || selectedCustomer?.username || '';
            const ownerPhone = selectedCustomer?.phone || selectedCustomer?.phoneNumber || '';
            const ownerEmail = selectedCustomer?.email || '';

            const submitData = {
                customerId: customerId || selectedCustomer?.id,
                ownerName,
                ownerPhone,
                ownerEmail,
                propertyData: {
                    propertyType: formData.propertyType,
                    address: formData.address,
                    city: formData.city,
                    province: formData.province,
                    postalCode: formData.postalCode,
                    buildingArea: formData.buildingArea,
                    landArea: formData.landArea,
                    numberOfFloors: formData.numberOfFloors,
                    yearBuilt: formData.yearBuilt,
                    propertyValue: formData.propertyValue,
                    buildingStructure: formData.buildingStructure
                },
                insuranceData: {
                    policyNumber: formData.policyNumber,
                    insuranceCompany: formData.insuranceCompany,
                    coverageType: formData.coverageType,
                    insuranceValue: formData.insuranceValue,
                    premium: formData.premium,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    deductible: formData.deductible
                },
                notes: formData.notes,
                status: formData.status
            };

            const response = await PropertyDAO.createProperty(submitData);
            if (!response.success) throw new Error(response.error || 'Gagal menyimpan properti');

            message('Properti berhasil ditambahkan!', 'success');
            onPropertyCreated(response.property);
            handleClose();
        } catch (error) {
            console.error(error);
            message(error.message || 'Gagal menyimpan properti', 'error');
        } finally {
            loadingProvider.stop();
        }
    };

    const filteredCustomers = useMemo(() => {
        const s = customerSearch.toLowerCase();
        return customers.filter(c =>
            c.name?.toLowerCase().includes(s) ||
            c.phone?.toLowerCase().includes(s)
        );
    }, [customers, customerSearch]);

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
                    <Typography variant="h6" sx={{ fontWeight: 700, color: C.text, fontSize: 18 }}>Tambah Properti Baru</Typography>
                    <Typography fontSize={13} sx={{ color: C.textSub, mt: 0.5 }}>Daftarkan aset properti baru</Typography>
                </Box>
                <IconButton onClick={handleClose} sx={{ color: C.textSub }}>
                    <Icon icon="mdi:close" width={24} />
                </IconButton>
            </Box>

            {/* Stepper Header*/}
            <Box sx={{ pt: 3, px: 3 }}>
                <WizardStepper active={activeStep} />
            </Box>

            {/* Body */}
            <Box sx={{ p: isMobile ? 2 : 3, overflowY: 'auto' }}>

                {/* ── STEP 1: Details ── */}
                {activeStep === 0 && (
                    <Fade in key="s0">
                        <Box>
                            {!customerId ? (
                                <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                                    <Section title="Pelanggan">
                                        <Field label="Pilih Pelanggan" required hint="Pilih pemilik properti">
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
                                                    ? <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSelectedCustomer(null); }} sx={{ p: 0.25 }}><Icon icon="mdi:close" width={15} color={C.textSub} /></IconButton>
                                                    : <Icon icon="mdi:chevron-down" width={18} color={C.textMuted} />
                                                }
                                            </Box>
                                        </Field>
                                    </Section>
                                </Paper>
                            ) : null}

                            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                                <Section title="Profil Lokasi">
                                    <Field label="Tipe Properti">
                                        <FormSelect
                                            name="propertyType"
                                            options={propertyTypes}
                                            value={formData.propertyType}
                                            onChange={handleChange}
                                        />
                                    </Field>
                                    <Field label="Alamat Lengkap">
                                        <TextField fullWidth size="small" name="address" value={formData.address} onChange={handleChange} placeholder="cth. Jl. Sudirman No 1" multiline rows={2} sx={inputStyle} />
                                    </Field>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                                        <Field label="Kota">
                                            <TextField fullWidth size="small" name="city" value={formData.city} onChange={handleChange} placeholder="cth. Jakarta" sx={inputStyle} />
                                        </Field>
                                        <Field label="Provinsi">
                                            <TextField fullWidth size="small" name="province" value={formData.province} onChange={handleChange} placeholder="cth. DKI Jakarta" sx={inputStyle} />
                                        </Field>
                                        <Field label="Kode Pos">
                                            <TextField fullWidth size="small" name="postalCode" value={formData.postalCode} onChange={handleChange} placeholder="cth. 10220" sx={inputStyle} />
                                        </Field>
                                    </Stack>
                                </Section>
                            </Paper>

                            <Box display="flex" gap={1.5}>
                                {customerId ? (
                                    <Button fullWidth variant="outlined" onClick={handleClose} sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: C.border, color: C.textSub }}>
                                        Batal
                                    </Button>
                                ) : null}
                                <Button fullWidth variant="contained" onClick={handleNext} endIcon={<Icon icon="mdi:arrow-right" width={16} />}
                                    sx={{ borderRadius: '8px', py: 1.4, textTransform: 'none', fontSize: 14, fontWeight: 600, bgcolor: C.primary, boxShadow: 'none', '&:hover': { bgcolor: '#145EA8' } }}>
                                    Lanjut ke Spesifikasi
                                </Button>
                            </Box>
                        </Box>
                    </Fade>
                )}

                {/* ── STEP 2: Specifications ── */}
                {activeStep === 1 && (
                    <Fade in key="s1">
                        <Box>
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                                <Section title="Dimensi & Nilai">
                                    <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                                        <Field label="Luas Bangunan (m²)">
                                            <TextField fullWidth size="small" name="buildingArea" type="number" value={formData.buildingArea} onChange={handleChange} placeholder="cth. 150" sx={inputStyle} />
                                        </Field>
                                        <Field label="Luas Tanah (m²)">
                                            <TextField fullWidth size="small" name="landArea" type="number" value={formData.landArea} onChange={handleChange} placeholder="cth. 200" sx={inputStyle} />
                                        </Field>
                                    </Stack>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                                        <Field label="Jumlah Lantai">
                                            <TextField fullWidth size="small" name="numberOfFloors" type="number" value={formData.numberOfFloors} onChange={handleChange} placeholder="cth. 2" sx={inputStyle} />
                                        </Field>
                                        <Field label="Tahun Dibangun">
                                            <TextField fullWidth size="small" name="yearBuilt" type="number" value={formData.yearBuilt} onChange={handleChange} placeholder="cth. 2010" sx={inputStyle} />
                                        </Field>
                                    </Stack>
                                    <Field label="Struktur Bangunan">
                                        <TextField fullWidth size="small" name="buildingStructure" value={formData.buildingStructure} onChange={handleChange} placeholder="cth. Beton" sx={inputStyle} />
                                    </Field>
                                    <Field label="Nilai Estimasi Properti (IDR)">
                                        <TextField fullWidth size="small" name="propertyValue" type="number" value={formData.propertyValue} onChange={handleChange} placeholder="cth. 2000000000" sx={inputStyle}
                                            InputProps={{ startAdornment: <InputAdornment position="start">Rp</InputAdornment> }}
                                        />
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
                                    Lanjut ke Asuransi
                                </Button>
                            </Box>
                        </Box>
                    </Fade>
                )}

                {/* ── STEP 3: Insurance & Additional ── */}
                {activeStep === 2 && (
                    <Fade in key="s2">
                        <Box>
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                                <Section title="Detail Polis">
                                    <Field label="Perusahaan Asuransi">
                                        <TextField fullWidth size="small" name="insuranceCompany" value={formData.insuranceCompany} onChange={handleChange} placeholder="cth. Asuransi ABC" sx={inputStyle} />
                                    </Field>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                                        <Field label="Nomor Polis">
                                            <TextField fullWidth size="small" name="policyNumber" value={formData.policyNumber} onChange={handleChange} placeholder="cth. POL-2024-001" sx={inputStyle} />
                                        </Field>
                                        <Field label="Tipe Pertanggungan">
                                            <FormSelect
                                                name="coverageType"
                                                options={coverageTypes}
                                                value={formData.coverageType}
                                                onChange={handleChange}
                                            />
                                        </Field>
                                    </Stack>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                                        <Field label="Nilai Asuransi (IDR)">
                                            <TextField fullWidth size="small" name="insuranceValue" type="number" value={formData.insuranceValue} onChange={handleChange} placeholder="cth. 2000000000" sx={inputStyle}
                                                InputProps={{ startAdornment: <InputAdornment position="start">Rp</InputAdornment> }}
                                            />
                                        </Field>
                                        <Field label="Premi (IDR)">
                                            <TextField fullWidth size="small" name="premium" type="number" value={formData.premium} onChange={handleChange} placeholder="cth. 5000000" sx={inputStyle}
                                                InputProps={{ startAdornment: <InputAdornment position="start">Rp</InputAdornment> }}
                                            />
                                        </Field>
                                    </Stack>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                                        <Field label="Tanggal Mulai">
                                            <TextField fullWidth size="small" name="startDate" type="date" value={formData.startDate} onChange={handleChange} sx={inputStyle} InputLabelProps={{ shrink: true }} />
                                        </Field>
                                        <Field label="Tanggal Berakhir">
                                            <TextField fullWidth size="small" name="endDate" type="date" value={formData.endDate} onChange={handleChange} sx={inputStyle} InputLabelProps={{ shrink: true }} />
                                        </Field>
                                    </Stack>
                                    <Field label="Risiko Sendiri">
                                        <TextField fullWidth size="small" name="deductible" type="number" value={formData.deductible} onChange={handleChange} placeholder="cth. 500000" sx={inputStyle} />
                                    </Field>
                                    <Field label="Catatan">
                                        <TextField fullWidth size="small" name="notes" value={formData.notes} onChange={handleChange} placeholder="cth. Rumah tinggal utama" multiline rows={2} sx={inputStyle} />
                                    </Field>
                                </Section>
                            </Paper>

                            <Box display="flex" gap={1.5}>
                                <Button fullWidth variant="outlined" onClick={handleBack} startIcon={<Icon icon="mdi:arrow-left" width={16} />}
                                    sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: C.border, color: C.textSub }}>
                                    Kembali
                                </Button>
                                <Button fullWidth variant="contained" onClick={handleSubmit} startIcon={<Icon icon="mdi:check" width={16} />}
                                    sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, bgcolor: C.success, boxShadow: 'none', '&:hover': { bgcolor: '#166E32' } }}>
                                    Simpan Properti
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
