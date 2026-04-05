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
import PaymentDAO from '../../daos/PaymentDao';
import RenewalDAO from '../../daos/RenewalDao';

const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatCurrency = (v) => {
    if (!v && v !== 0) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);
};

const PAYMENT_STATUS_COLOR = {
    Paid: { bg: '#D1FAE5', color: '#065F46' },
    Pending: { bg: '#FEF3C7', color: '#92400E' },
    Overdue: { bg: '#FEE2E2', color: '#991B1B' },
    Cancelled: { bg: '#F1F5F9', color: '#475569' },
};

/**
 * CreateRenewalDialog
 *
 * Props:
 *   open           — boolean
 *   onClose        — fn()
 *   onCreated      — fn(renewal) — called after successful create
 *   prefillCar     — optional car object { id, carData: { ownerName, carBrand, carModel, startDate, dueDate }, customerId }
 *   prefillCustomerId — optional string
 */
export default function CreateRenewalDialog({ open, onClose, onCreated, prefillCar = null, prefillCustomerId = null }) {
    const message = useAlert();

    // ── state ───────────────────────────────────────────────────────────────
    const [customers, setCustomers] = useState([]);
    const [cars, setCars] = useState([]);       // cars for selected customer
    const [payments, setPayments] = useState([]); // payments for selected customer

    const [customerId, setCustomerId] = useState('');
    const [selectedCar, setSelectedCar] = useState(null);
    const [paymentId, setPaymentId] = useState('');
    const [newStartDate, setNewStartDate] = useState('');
    const [newEndDate, setNewEndDate] = useState('');
    const [premium, setPremium] = useState('');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState('Pending');

    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [loadingCars, setLoadingCars] = useState(false);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const isCarPrefilled = Boolean(prefillCar);

    // ── reset on open ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!open) return;
        setErrors({});
        setPaymentId('');
        setNotes('');
        setPremium('');
        setStatus('Pending');

        if (prefillCar) {
            setCustomerId(prefillCar.customerId || prefillCustomerId || '');
            setSelectedCar(prefillCar);
            // Default new dates: suggest 1 year from current dueDate or today
            const base = prefillCar.carData?.dueDate ? new Date(prefillCar.carData.dueDate) : new Date();
            const start = new Date(base);
            const end = new Date(base);
            end.setFullYear(end.getFullYear() + 1);
            setNewStartDate(start.toISOString().slice(0, 10));
            setNewEndDate(end.toISOString().slice(0, 10));
        } else {
            setCustomerId(prefillCustomerId || '');
            setSelectedCar(null);
            setNewStartDate('');
            setNewEndDate('');
        }
    }, [open, prefillCar, prefillCustomerId]);

    // ── load customers (only when NOT prefilled) ─────────────────────────────
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

    // ── load cars when customerId changes (not prefilled) ────────────────────
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

    // ── load payments when customerId changes ────────────────────────────────
    useEffect(() => {
        if (!customerId) { setPayments([]); return; }
        const targetId = prefillCar?.customerId || customerId;
        const load = async () => {
            setLoadingPayments(true);
            try {
                const res = await PaymentDAO.getPaymentsByCustomer(targetId);
                const list = res?.payments || res?.data || (Array.isArray(res) ? res : []);
                setPayments(list);
            } catch {
                // silently skip
            } finally {
                setLoadingPayments(false);
            }
        };
        load();
    }, [customerId, prefillCar]);

    // ── validation ───────────────────────────────────────────────────────────
    const validate = () => {
        const e = {};
        if (!customerId) e.customerId = 'Customer wajib dipilih';
        if (!selectedCar) e.carId = 'Kendaraan wajib dipilih';
        if (!newStartDate) e.newStartDate = 'Tanggal mulai baru wajib diisi';
        if (!newEndDate) e.newEndDate = 'Tanggal berakhir baru wajib diisi';
        if (newStartDate && newEndDate && new Date(newEndDate) <= new Date(newStartDate)) {
            e.newEndDate = 'Tanggal berakhir harus setelah tanggal mulai';
        }
        if (premium && isNaN(Number(premium))) e.premium = 'Premi harus berupa angka';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            const payload = {
                customerId: prefillCar?.customerId || customerId,
                policyType: 'car',
                policyId: selectedCar.id,
                paymentId: paymentId || undefined,
                newStartDate,
                newEndDate,
                premium: premium ? Number(premium) : 0,
                status,
                notes: notes || undefined,
            };
            const res = await RenewalDAO.createRenewal(payload);
            if (res.success) {
                message('Renewal berhasil dibuat', 'success');
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

    // ── selected payment info ─────────────────────────────────────────────────
    const selectedPayment = payments.find(p => p.id === paymentId) || null;

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
                    {/* Customer */}
                    {isCarPrefilled ? (
                        <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 2, border: '1px solid #E2E8F0' }}>
                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Customer</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B', mt: 0.3 }}>
                                {prefillCar?.customerName || '-'}
                            </Typography>
                        </Box>
                    ) : (
                        <FormControl fullWidth size="small" error={!!errors.customerId}>
                            <InputLabel>Customer *</InputLabel>
                            <Select
                                value={customerId}
                                label="Customer *"
                                onChange={e => { setCustomerId(e.target.value); setSelectedCar(null); setPaymentId(''); }}
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
                                    if (car?.carData?.dueDate) {
                                        const base = new Date(car.carData.dueDate);
                                        const end = new Date(base);
                                        end.setFullYear(end.getFullYear() + 1);
                                        setNewStartDate(base.toISOString().slice(0, 10));
                                        setNewEndDate(end.toISOString().slice(0, 10));
                                    }
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

                    {/* Tanggal */}
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
                    <TextField
                        fullWidth size="small" label="Premi (Rp)"
                        value={premium}
                        onChange={e => setPremium(e.target.value)}
                        placeholder="cth: 2500000"
                        error={!!errors.premium}
                        helperText={errors.premium || (premium ? `= ${formatCurrency(Number(premium))}` : '')}
                        InputProps={{ startAdornment: <Typography variant="body2" sx={{ color: '#94A3B8', mr: 1 }}>Rp</Typography> }}
                    />

                    <Divider textAlign="left">
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Opsional</Typography>
                    </Divider>

                    {/* Payment link */}
                    <FormControl fullWidth size="small" disabled={loadingPayments || !customerId}>
                        <InputLabel>Hubungkan ke Payment Record (opsional)</InputLabel>
                        <Select
                            value={paymentId}
                            label="Hubungkan ke Payment Record (opsional)"
                            onChange={e => setPaymentId(e.target.value)}
                        >
                            <MenuItem value=""><em>Tidak ada</em></MenuItem>
                            {payments.map(p => {
                                const sc = PAYMENT_STATUS_COLOR[p.status] || PAYMENT_STATUS_COLOR.Pending;
                                return (
                                    <MenuItem key={p.id} value={p.id}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Box sx={{ bgcolor: sc.bg, color: sc.color, px: 0.8, py: 0.2, borderRadius: 1, fontSize: 11, fontWeight: 700 }}>{p.status}</Box>
                                            <span>{p.id} · {formatCurrency(p.amount)}</span>
                                        </Stack>
                                    </MenuItem>
                                );
                            })}
                        </Select>
                        <FormHelperText>Jika dipilih, renewal hanya bisa diselesaikan setelah payment berstatus Paid</FormHelperText>
                    </FormControl>

                    {selectedPayment && selectedPayment.status !== 'Paid' && (
                        <Alert severity="warning" sx={{ borderRadius: 2 }}>
                            Payment yang dipilih masih berstatus <b>{selectedPayment.status}</b>. Renewal belum bisa diselesaikan sampai payment lunas.
                        </Alert>
                    )}

                    {/* Status */}
                    <FormControl fullWidth size="small">
                        <InputLabel>Status Awal</InputLabel>
                        <Select value={status} label="Status Awal" onChange={e => setStatus(e.target.value)}>
                            {['Pending', 'Approved', 'Paid', 'Cancelled'].map(s => (
                                <MenuItem key={s} value={s}>{s}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Notes */}
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
