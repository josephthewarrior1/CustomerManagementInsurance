import { Icon } from '@iconify/react';
import {
    Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle,
    Divider, FormControl, FormHelperText, InputLabel, MenuItem,
    Select, Stack, TextField, Typography, Alert, IconButton
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useAlert } from '../../hooks/SnackbarProvider';
import CarDAO from '../../daos/CarDao';
import CustomerDAO from '../../daos/CustomerDao';
import RenewalDAO from '../../daos/RenewalDao';
import QuotationDAO from '../../daos/QuotationDao';

const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatCurrency = (v) => {
    if (!v && v !== 0) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);
};

/**
 * CreateRenewalDialog
 *
 * Creates a renewal. Backend will auto-create a linked Pending Payment.
 * When that Payment is marked Paid, the Renewal auto-completes and the Car's
 * dueDate + status are updated automatically.
 */
export default function CreateRenewalDialog({ open, onClose, onCreated, prefillCar = null, prefillCustomerId = null }) {
    const message = useAlert();

    const [customers, setCustomers] = useState([]);
    const [cars, setCars] = useState([]);
    const [customerId, setCustomerId] = useState('');
    const [selectedCar, setSelectedCar] = useState(null);
    const [newStartDate, setNewStartDate] = useState('');
    const [newEndDate, setNewEndDate] = useState('');
    const [premium, setPremium] = useState('');
    const [notes, setNotes] = useState('');

    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [loadingCars, setLoadingCars] = useState(false);
    const [loadingQuotation, setLoadingQuotation] = useState(false);
    const [acceptedQuotation, setAcceptedQuotation] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const isCarPrefilled = Boolean(prefillCar);

    useEffect(() => {
        if (!open) return;
        setErrors({});
        setNotes('');
        setPremium('');

        if (prefillCar) {
            setCustomerId(prefillCar.customerId || prefillCustomerId || '');
            setSelectedCar(prefillCar);
            const base = prefillCar.carData?.dueDate ? new Date(prefillCar.carData.dueDate) : new Date();
            const end = new Date(base);
            end.setFullYear(end.getFullYear() + 1);
            setNewStartDate(base.toISOString().slice(0, 10));
            setNewEndDate(end.toISOString().slice(0, 10));
            // Auto-fetch accepted quotation for this car
            fetchAcceptedQuotation(prefillCar.id);
        } else {
            setCustomerId(prefillCustomerId || '');
            setSelectedCar(null);
            setNewStartDate('');
            setNewEndDate('');
            setAcceptedQuotation(null);
            setPremium('');
        }
    }, [open, prefillCar, prefillCustomerId]);

    useEffect(() => {
        if (!open || isCarPrefilled) return;
        const load = async () => {
            setLoadingCustomers(true);
            try {
                const res = await CustomerDAO.getAllCustomers();
                const list = res?.customers || res?.data || (Array.isArray(res) ? res : []);
                setCustomers(list);
            } catch {
                message('Gagal memuat daftar customer', 'error');
            } finally {
                setLoadingCustomers(false);
            }
        };
        load();
    }, [open, isCarPrefilled]);

    useEffect(() => {
        if (!customerId || isCarPrefilled) return;
        const load = async () => {
            setLoadingCars(true);
            setSelectedCar(null);
            try {
                const res = await CarDAO.getCarsByCustomer(customerId);
                const list = res?.cars || res?.data || (Array.isArray(res) ? res : []);
                setCars(list);
            } catch {
                message('Gagal memuat kendaraan', 'error');
            } finally {
                setLoadingCars(false);
            }
        };
        load();
    }, [customerId, isCarPrefilled]);

    // Auto-fetch accepted quotation for a given car and pre-fill premium
    const fetchAcceptedQuotation = async (carId) => {
        if (!carId) return;
        setLoadingQuotation(true);
        try {
            const res = await QuotationDAO.getQuotationsByPolicy(carId);
            const list = res?.quotations || res?.data || (Array.isArray(res) ? res : []);
            const accepted = list.find(q => q.status === 'Accepted');
            setAcceptedQuotation(accepted || null);
            if (accepted?.totalPremium) {
                setPremium(String(accepted.totalPremium));
            }
        } catch {
            // silently skip
        } finally {
            setLoadingQuotation(false);
        }
    };

    const validate = () => {
        const e = {};
        if (!customerId) e.customerId = 'Customer wajib dipilih';
        if (!selectedCar) e.carId = 'Kendaraan wajib dipilih';
        if (!newStartDate) e.newStartDate = 'Tanggal mulai baru wajib diisi';
        if (!newEndDate) e.newEndDate = 'Tanggal berakhir baru wajib diisi';
        if (newStartDate && newEndDate && new Date(newEndDate) <= new Date(newStartDate)) {
            e.newEndDate = 'Tanggal berakhir harus setelah tanggal mulai';
        }
        if (!premium || isNaN(Number(premium)) || Number(premium) <= 0) {
            e.premium = 'Premi wajib diisi dan harus lebih dari 0';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            const payload = {
                customerId: prefillCar?.customerId || customerId,
                policyType: 'car',
                policyId: selectedCar.id,
                newStartDate,
                newEndDate,
                premium: premium ? Number(premium) : 0,
                notes: notes || undefined,
            };
            const res = await RenewalDAO.createRenewal(payload);
            if (res.success) {
                message('Renewal berhasil dibuat! Payment Pending otomatis dibuat 🎉', 'success');
                onCreated?.(res.renewal);
                onClose();
            } else {
                message(res.error || 'Gagal membuat renewal', 'error');
            }
        } catch (err) {
            message(err?.error || 'Gagal membuat renewal', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ pb: 0 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ bgcolor: '#EFF6FF', borderRadius: 2, p: 0.8, display: 'flex' }}>
                            <Icon icon="mdi:arrow-u-right-top" width={22} color="#1E40AF" />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', lineHeight: 1 }}>
                                Buat Renewal Polis
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                                Perpanjang periode polis kendaraan
                            </Typography>
                        </Box>
                    </Stack>
                    <IconButton onClick={onClose} size="small"><Icon icon="mdi:close" width={20} color="#64748B" /></IconButton>
                </Stack>
            </DialogTitle>

            <Divider sx={{ mt: 2 }} />

            <DialogContent sx={{ pt: 2 }}>
                <Stack spacing={2.5}>
                    {/* Active Policy Warning */}
                    {(() => {
                        const car = prefillCar || selectedCar;
                        const dueDate = car?.carData?.dueDate;
                        if (!dueDate) return null;
                        const msLeft = new Date(dueDate).getTime() - Date.now();
                        const daysLeft = Math.round(msLeft / (1000 * 60 * 60 * 24));
                        if (daysLeft <= 30) return null; // near expiry = normal to renew
                        return (
                            <Alert severity="warning" icon={<Icon icon="mdi:shield-alert" />} sx={{ borderRadius: 2 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                                    ⚠️ Polis masih aktif — jatuh tempo {daysLeft} hari lagi
                                </Typography>
                                <Typography variant="caption">
                                    Pastikan ini memang renewal yang disengaja, bukan input duplikat. Sistem akan menolak jika sudah ada renewal aktif untuk kendaraan ini.
                                </Typography>
                            </Alert>
                        );
                    })()}

                    <Alert severity="info" icon={<Icon icon="mdi:lightning-bolt" />} sx={{ borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>Setelah Renewal dibuat:</Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                            • Payment Pending otomatis dibuat & terhubung ke kendaraan<br />
                            • Tandai Lunas di Payment → polis otomatis aktif & dueDate diperbarui ✅
                        </Typography>
                    </Alert>

                    {/* Customer */}
                    {isCarPrefilled ? (
                        <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 2, border: '1px solid #E2E8F0' }}>
                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Customer</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B', mt: 0.3 }}>
                                {prefillCar?.carData?.ownerName || prefillCar?.customerName || '-'}
                            </Typography>
                        </Box>
                    ) : (
                        <FormControl fullWidth size="small" error={!!errors.customerId}>
                            <InputLabel>Customer *</InputLabel>
                            <Select
                                value={customerId}
                                label="Customer *"
                                onChange={e => { setCustomerId(e.target.value); setSelectedCar(null); }}
                                disabled={loadingCustomers}
                            >
                                {customers.map(c => (
                                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                ))}
                            </Select>
                            {errors.customerId && <FormHelperText>{errors.customerId}</FormHelperText>}
                        </FormControl>
                    )}

                    {/* Kendaraan */}
                    {isCarPrefilled ? (
                        <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 2, border: '1px solid #E2E8F0' }}>
                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Kendaraan</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B', mt: 0.3 }}>
                                {prefillCar?.carData?.carBrand} {prefillCar?.carData?.carModel} · {prefillCar?.carData?.plateNumber || '-'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                                Periode lama: {formatDate(prefillCar?.carData?.startDate)} → {formatDate(prefillCar?.carData?.dueDate)}
                            </Typography>
                        </Box>
                    ) : (
                        <FormControl fullWidth size="small" error={!!errors.carId} disabled={!customerId || loadingCars}>
                            <InputLabel>Kendaraan *</InputLabel>
                            <Select
                                value={selectedCar?.id || ''}
                                label="Kendaraan *"
                                onChange={e => {
                                    const car = cars.find(c => c.id === e.target.value);
                                    setSelectedCar(car || null);
                                    setAcceptedQuotation(null);
                                    setPremium('');
                                    if (car?.carData?.dueDate) {
                                        const base = new Date(car.carData.dueDate);
                                        const end = new Date(base);
                                        end.setFullYear(end.getFullYear() + 1);
                                        setNewStartDate(base.toISOString().slice(0, 10));
                                        setNewEndDate(end.toISOString().slice(0, 10));
                                    }
                                    if (car?.id) fetchAcceptedQuotation(car.id);
                                }}
                            >
                                {cars.map(c => (
                                    <MenuItem key={c.id} value={c.id}>
                                        {c.carData?.carBrand} {c.carData?.carModel} · {c.carData?.plateNumber || '-'}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.carId && <FormHelperText>{errors.carId}</FormHelperText>}
                            {selectedCar && (
                                <Typography variant="caption" sx={{ color: '#64748B', mt: 0.5, ml: 0.5 }}>
                                    Periode lama: {formatDate(selectedCar.carData?.startDate)} → {formatDate(selectedCar.carData?.dueDate)}
                                </Typography>
                            )}
                        </FormControl>
                    )}

                    <Divider textAlign="left">
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Periode Baru</Typography>
                    </Divider>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            fullWidth size="small" type="date" label="Tanggal Mulai Baru *"
                            InputLabelProps={{ shrink: true }}
                            value={newStartDate}
                            onChange={e => setNewStartDate(e.target.value)}
                            error={!!errors.newStartDate}
                            helperText={errors.newStartDate}
                        />
                        <TextField
                            fullWidth size="small" type="date" label="Tanggal Berakhir Baru *"
                            InputLabelProps={{ shrink: true }}
                            value={newEndDate}
                            onChange={e => setNewEndDate(e.target.value)}
                            error={!!errors.newEndDate}
                            helperText={errors.newEndDate}
                        />
                    </Stack>

                    {/* Premium */}
                    {loadingQuotation ? (
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
                            <CircularProgress size={16} />
                            <Typography variant="caption" color="text.secondary">Memuat premi dari penawaran...</Typography>
                        </Stack>
                    ) : (
                        <Box>
                            {acceptedQuotation && (
                                <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ bgcolor: '#D1FAE5', color: '#065F46', px: 1, py: 0.3, borderRadius: 1, fontSize: 11, fontWeight: 700 }}>
                                        AUTO dari Penawaran
                                    </Box>
                                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                                        {acceptedQuotation.insuranceProvider} · {acceptedQuotation.insuranceType}
                                    </Typography>
                                </Box>
                            )}
                            <TextField
                                fullWidth size="small" label="Premi (Rp) *"
                                value={premium}
                                onChange={e => { setPremium(e.target.value); }}
                                placeholder="cth: 2500000"
                                error={!!errors.premium}
                                helperText={errors.premium || (premium && Number(premium) > 0 ? `= ${formatCurrency(Number(premium))}` : 'Premi wajib diisi — akan jadi nominal Payment otomatis')}
                                InputProps={{ startAdornment: <Typography variant="body2" sx={{ color: '#94A3B8', mr: 1 }}>Rp</Typography> }}
                            />
                        </Box>
                    )}

                    <TextField
                        fullWidth size="small" label="Catatan" multiline rows={2}
                        value={notes} onChange={e => setNotes(e.target.value)}
                        placeholder="Catatan tambahan untuk renewal ini (opsional)"
                    />
                </Stack>
            </DialogContent>

            <Divider />
            <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                <Button variant="outlined" onClick={onClose} disabled={submitting}
                    sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#E2E8F0', color: '#475569' }}>
                    Batal
                </Button>
                <Button variant="contained" onClick={handleSubmit} disabled={submitting}
                    sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#1E40AF', '&:hover': { bgcolor: '#1E3A8A' }, px: 3 }}
                    startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:arrow-u-right-top" width={18} />}>
                    {submitting ? 'Menyimpan...' : 'Buat Renewal'}
                </Button>
            </Box>
        </Dialog>
    );
}
