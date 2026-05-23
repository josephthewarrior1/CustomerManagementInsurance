import { Icon } from '@iconify/react';
import {
    Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle,
    Divider, FormControl, FormHelperText, InputLabel, MenuItem,
    Select, Stack, TextField, Typography, IconButton, Alert
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useAlert } from '../../hooks/SnackbarProvider';
import CustomerDAO from '../../daos/CustomerDao';
import CarDAO from '../../daos/CarDao';
import PaymentDAO from '../../daos/PaymentDao';

const formatCurrency = (v) => {
    if (!v && v !== 0) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);
};

const formatThousand = (val) => {
    if (!val) return '';
    const clean = val.toString().replace(/\D/g, '');
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export default function CreatePaymentDialog({ open, onClose, onCreated, prefillCustomerId = null }) {
    const message = useAlert();

    const [customers, setCustomers] = useState([]);
    const [cars, setCars] = useState([]); // cars for selected customer (optional policyId)
    const [customerPayments, setCustomerPayments] = useState([]);

    const [customerId, setCustomerId] = useState('');
    const [policyId, setPolicyId] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState('Pending');
    const [proofFile, setProofFile] = useState(null);

    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [loadingCars, setLoadingCars] = useState(false);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Reset on open
    useEffect(() => {
        if (!open) return;
        setErrors({});
        setCustomerId(prefillCustomerId || '');
        setPolicyId('');
        setInvoiceNumber('');
        setAmount('');
        setNotes('');
        setStatus('Pending');
        setCustomerPayments([]);
        setProofFile(null);
        
        // default due date: today
        const today = new Date();
        setDueDate(today.toISOString().slice(0, 10));
    }, [open, prefillCustomerId]);

    // Load customers
    useEffect(() => {
        if (!open) return;
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
    }, [open]);

    // Load cars and payments when customer changes
    useEffect(() => {
        if (!customerId) {
            setCars([]);
            setCustomerPayments([]);
            return;
        }
        const load = async () => {
            setLoadingCars(true);
            setLoadingPayments(true);
            setPolicyId('');
            try {
                const [carsRes, paymentsRes] = await Promise.all([
                    CarDAO.getCarsByCustomer(customerId),
                    PaymentDAO.getPaymentsByCustomer(customerId)
                ]);
                const carList = carsRes?.cars || carsRes?.data || (Array.isArray(carsRes) ? carsRes : []);
                setCars(carList);
                const paymentList = paymentsRes?.payments || paymentsRes?.data || (Array.isArray(paymentsRes) ? paymentsRes : []);
                setCustomerPayments(paymentList);
            } catch (err) {
                console.error(err);
                message('Gagal memuat data kendaraan atau pembayaran', 'error');
            } finally {
                setLoadingCars(false);
                setLoadingPayments(false);
            }
        };
        load();
    }, [customerId]);

    const activePayment = customerPayments.find(p => p.policyId === policyId && !['Paid', 'Cancelled'].includes(p.status));
    const selectedCarObj = cars.find(c => c.id === policyId);
    const activeCarName = selectedCarObj ? `${selectedCarObj.carData?.carBrand || ''} ${selectedCarObj.carData?.carModel || ''}`.trim() : 'kendaraan';
    const activePaymentAmount = activePayment ? formatCurrency(activePayment.amount) : '';

    const validate = () => {
        const e = {};
        const rawAmount = amount ? amount.toString().replace(/\D/g, '') : '';
        if (!customerId) e.customerId = 'Customer wajib dipilih';
        if (!policyId) e.policyId = 'Kendaraan/Polis wajib dipilih';
        if (policyId && activePayment) e.policyId = `Kendaraan ${activeCarName} masih memiliki pembayaran aktif sebesar ${activePaymentAmount}`;
        if (!rawAmount || isNaN(Number(rawAmount))) e.amount = 'Nominal harus berupa angka yang valid';
        if (!dueDate) e.dueDate = 'Tanggal jatuh tempo wajib diisi';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            const rawAmount = amount ? amount.toString().replace(/\D/g, '') : '0';
            const payload = {
                customerId,
                policyType: policyId ? 'car' : '',
                policyId: policyId || undefined,
                invoiceNumber: invoiceNumber || undefined,
                amount: Number(rawAmount),
                dueDate,
                status,
                notes: notes || undefined,
                paidDate: status === 'Paid' ? new Date().toISOString() : undefined
            };
            const res = await PaymentDAO.createPayment(payload);
            if (res.success || res.id) {
                const createdId = res.id || res.payment?.id;
                
                // Upload proof if selected
                if (status === 'Paid' && proofFile && createdId) {
                    const formData = new FormData();
                    formData.append('proof', proofFile);
                    const uploadRes = await PaymentDAO.uploadProof(createdId, formData);
                    if (!uploadRes.success) {
                        message('Payment berhasil dibuat, tetapi gagal mengunggah bukti bayar', 'warning');
                    }
                }

                message('Payment Record berhasil dibuat', 'success');
                onCreated?.(res.payment || res);
                onClose();
            } else {
                message(res.error || 'Gagal membuat payment record', 'error');
            }
        } catch (err) {
            message(err?.error || 'Gagal membuat payment record', 'error');
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
                            <Icon icon="mdi:receipt-text-plus" width={22} color="#1E40AF" />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', lineHeight: 1 }}>
                                Buat Payment Record
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                                Catat tagihan pembayaran baru
                            </Typography>
                        </Box>
                    </Stack>
                    <IconButton onClick={onClose} size="small"><Icon icon="mdi:close" width={20} color="#64748B" /></IconButton>
                </Stack>
            </DialogTitle>
 
            <Divider sx={{ mt: 2 }} />
 
            <DialogContent sx={{ pt: 2 }}>
                <Stack spacing={2.5}>
                    {policyId && activePayment && (
                        <Alert severity="error" sx={{ borderRadius: 2 }}>
                            Pembayaran gagal dibuat. Mobil/polis <b>{activeCarName}</b> sudah memiliki pembayaran aktif sebesar <b>{activePaymentAmount}</b> dengan status <b>{activePayment.status}</b>. Harap selesaikan atau batalkan pembayaran tersebut terlebih dahulu.
                        </Alert>
                    )}
 
                    {/* Customer */}
                    <FormControl fullWidth size="small" error={!!errors.customerId}>
                        <InputLabel>Customer *</InputLabel>
                        <Select
                            value={customerId}
                            label="Customer *"
                            onChange={e => setCustomerId(e.target.value)}
                            disabled={loadingCustomers || !!prefillCustomerId}
                        >
                            {customers.map(c => (
                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                            ))}
                        </Select>
                        {errors.customerId && <FormHelperText>{errors.customerId}</FormHelperText>}
                    </FormControl>
 
                    {/* Policy / Kendaraan */}
                    <FormControl fullWidth size="small" disabled={!customerId || loadingCars} error={!!errors.policyId}>
                        <InputLabel>Hubungkan ke Kendaraan/Polis *</InputLabel>
                        <Select
                            value={policyId}
                            label="Hubungkan ke Kendaraan/Polis *"
                            onChange={e => setPolicyId(e.target.value)}
                        >
                            {cars.map(c => (
                                <MenuItem key={c.id} value={c.id}>
                                    {c.carData?.carBrand} {c.carData?.carModel} · {c.carData?.plateNumber || '-'}
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.policyId && <FormHelperText>{errors.policyId}</FormHelperText>}
                    </FormControl>
 
                    <Divider textAlign="left">
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Detail Tagihan</Typography>
                    </Divider>
 
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        {/* Amount */}
                        <TextField
                            fullWidth size="small" label="Total Tagihan (Rp) *"
                            value={amount}
                            onChange={e => setAmount(formatThousand(e.target.value))}
                            error={!!errors.amount}
                            helperText={errors.amount || (amount ? `= ${formatCurrency(Number(amount.toString().replace(/\D/g, '')))}` : '')}
                            InputProps={{ startAdornment: <Typography variant="body2" sx={{ color: '#94A3B8', mr: 1 }}>Rp</Typography> }}
                        />
                        {/* Due Date */}
                        <TextField
                            fullWidth size="small" type="date" label="Jatuh Tempo *"
                            InputLabelProps={{ shrink: true }}
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                            error={!!errors.dueDate}
                            helperText={errors.dueDate}
                        />
                    </Stack>
 
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        {/* Invoice Number */}
                        <TextField
                            fullWidth size="small" label="Nomor Invoice (opsional)"
                            value={invoiceNumber}
                            onChange={e => setInvoiceNumber(e.target.value)}
                            placeholder="cth: INV-2023-001"
                        />
                        {/* Status */}
                        <FormControl fullWidth size="small">
                            <InputLabel>Status Awal</InputLabel>
                            <Select value={status} label="Status Awal" onChange={e => setStatus(e.target.value)}>
                                {['Pending', 'Paid', 'Overdue', 'Cancelled'].map(s => (
                                    <MenuItem key={s} value={s}>{s}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
 
                    {status === 'Paid' && (
                        <Box sx={{ 
                            border: '1px dashed #1E40AF', 
                            borderRadius: '12px', 
                            p: 2.5, 
                            bgcolor: '#EFF6FF', 
                            textAlign: 'center',
                            transition: 'all 0.2s',
                            '&:hover': { bgcolor: '#DBEAFE' }
                        }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E40AF', mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                <Icon icon="mdi:cloud-upload-outline" width={18} />
                                Bukti Pembayaran (opsional)
                            </Typography>
                            {proofFile ? (
                                <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#1E293B', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                                        {proofFile.name}
                                    </Typography>
                                    <Button size="small" variant="text" color="error" onClick={() => setProofFile(null)} sx={{ textTransform: 'none', fontWeight: 700, p: 0, minWidth: 'auto' }}>
                                        Hapus
                                    </Button>
                                </Stack>
                            ) : (
                                <>
                                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                                        Format gambar (JPG, PNG). Maks. 5MB.
                                    </Typography>
                                    <Button variant="contained" component="label" size="small" startIcon={<Icon icon="mdi:upload" />} sx={{ textTransform: 'none', bgcolor: '#1E40AF', '&:hover': { bgcolor: '#1E3A8A' }, fontWeight: 600, borderRadius: 2, px: 2 }}>
                                        Unggah Berkas
                                        <input type="file" hidden accept="image/*" onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) setProofFile(file);
                                        }} />
                                    </Button>
                                </>
                            )}
                            {errors.proofFile && (
                                <Typography variant="caption" color="error" display="block" sx={{ mt: 1.5, fontWeight: 600 }}>
                                    {errors.proofFile}
                                </Typography>
                            )}
                        </Box>
                    )}
 
                    {/* Notes */}
                    <TextField
                        fullWidth size="small" label="Catatan Tambahan (opsional)" multiline rows={2}
                        value={notes} onChange={e => setNotes(e.target.value)}
                        placeholder="Misal: Tagihan perpanjangan polis mobil Alphard"
                    />
                </Stack>
            </DialogContent>
 
            <Divider />
            <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                <Button variant="outlined" onClick={onClose} disabled={submitting}
                    sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#E2E8F0', color: '#475569' }}>
                    Batal
                </Button>
                <Button variant="contained" onClick={handleSubmit} disabled={submitting || (policyId && !!activePayment)}
                    sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#1E40AF', '&:hover': { bgcolor: '#1E3A8A' }, px: 3 }}
                    startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:content-save" width={18} />}>
                    {submitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
                </Button>
            </Box>
        </Dialog>
    );
}
