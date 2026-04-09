import { Icon } from '@iconify/react';
import {
    Alert, Avatar, Box, Button, Chip, CircularProgress, Container, Dialog,
    FormControl, IconButton, InputLabel, MenuItem, Paper, Select,
    Stack, TextField, Typography, useMediaQuery, useTheme
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useLoading } from '../../hooks/LoadingProvider';
import PaymentDAO from '../../daos/PaymentDao';
import CustomerDAO from '../../daos/CustomerDao';
import CarDAO from '../../daos/CarDao';

/* ─── helpers ─── */
const formatDate = (d) => {
    if (!d) return 'Tidak tersedia';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};
const formatCurrency = (v) => {
    if (!v && v !== 0) return 'Tidak tersedia';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);
};
const toInputDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 10);
};

const STATUS_CONFIG = {
    Pending:   { bg: '#FEF3C7', color: '#92400E', icon: 'mdi:clock-outline',         label: 'Menunggu' },
    Paid:      { bg: '#D1FAE5', color: '#065F46', icon: 'mdi:check-circle-outline',  label: 'Lunas' },
    Overdue:   { bg: '#FEE2E2', color: '#991B1B', icon: 'mdi:alert-circle-outline',  label: 'Terlambat' },
    Cancelled: { bg: '#F1F5F9', color: '#475569', icon: 'mdi:close-circle-outline',  label: 'Dibatalkan' },
};
const ALLOWED_STATUSES = ['Pending', 'Paid', 'Overdue', 'Cancelled'];

/* ─── InfoCard ─── */
function InfoCard({ title, children }) {
    return (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 2.5, fontSize: '1rem' }}>
                {title}
            </Typography>
            <Stack spacing={2.5}>{children}</Stack>
        </Paper>
    );
}

/* ─── InfoRow ─── */
function InfoRow({ label, value, icon, fullWidth }) {
    return (
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Box sx={{ mt: 0.5, width: 36, height: 36, borderRadius: 2, bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon icon={icon} width={18} color="#1E40AF" />
            </Box>
            <Box flex={1}>
                <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 0.5 }}>
                    {label}
                </Typography>
                <Typography variant="body1" sx={{ color: '#1E293B', fontSize: '0.9375rem', fontWeight: 500, lineHeight: 1.6, wordBreak: fullWidth ? 'break-word' : 'normal' }}>
                    {value || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Tidak tersedia</span>}
                </Typography>
            </Box>
        </Stack>
    );
}

export default function PaymentDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const loadingProvider = useLoading();
    const message = useAlert();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [payment, setPayment]       = useState(null);
    const [loading, setLoading]       = useState(true);
    const [customerName, setCustomerName] = useState('');
    const [carLabel, setCarLabel]     = useState('');

    const [editing, setEditing]       = useState(false);
    const [editData, setEditData]     = useState({});
    const [saving, setSaving]         = useState(false);

    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const [completeDialog, setCompleteDialog] = useState(false);
    const [completing, setCompleting]         = useState(false);

    const [deleteDialog, setDeleteDialog] = useState(false);
    const [deleting, setDeleting]         = useState(false);

    const [previewOpen, setPreviewOpen] = useState(false);

    const fetchPayment = async () => {
        try {
            loadingProvider.start();
            const res = await PaymentDAO.getPaymentById(id);
            if (res.success || res.payment) {
                const p = res.payment || res;
                setPayment(p);
                const [custRes, carRes] = await Promise.allSettled([
                    p.customerId ? CustomerDAO.getCustomerById(p.customerId) : Promise.resolve(null),
                    p.policyId   ? CarDAO.getCarById(p.policyId)             : Promise.resolve(null),
                ]);
                if (custRes.status === 'fulfilled' && custRes.value) {
                    const c = custRes.value.customer || custRes.value;
                    setCustomerName(c?.name || c?.customerName || '');
                }
                if (carRes.status === 'fulfilled' && carRes.value) {
                    const car = carRes.value.car || carRes.value;
                    const parts = [car?.carData?.carBrand, car?.carData?.carModel, car?.carData?.plateNumber].filter(Boolean);
                    setCarLabel(parts.join(' '));
                }
            } else {
                message(res.error || 'Payment tidak ditemukan', 'error');
                navigate('/payments');
            }
        } catch {
            message('Gagal memuat detail payment', 'error');
            navigate('/payments');
        } finally {
            loadingProvider.stop();
            setLoading(false);
        }
    };

    useEffect(() => { fetchPayment(); }, [id]);

    const startEdit = () => {
        setEditData({
            invoiceNumber: payment.invoiceNumber || '',
            amount: payment.amount || '',
            dueDate: toInputDate(payment.dueDate),
            paidDate: toInputDate(payment.paidDate),
            paymentMethod: payment.paymentMethod || '',
            status: payment.status || 'Pending',
            notes: payment.notes || '',
        });
        setEditing(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { ...editData, amount: editData.amount ? Number(editData.amount) : 0 };
            const res = await PaymentDAO.updatePayment(id, payload);
            if (res.success || res.id) {
                message('Payment berhasil diperbarui', 'success');
                setEditing(false);
                fetchPayment();
            } else {
                message(res.error || 'Gagal memperbarui payment', 'error');
            }
        } catch (err) {
            message(err?.error || 'Gagal memperbarui payment', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUploadProof = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await PaymentDAO.uploadProof(id, formData);
            if (res.success) {
                message('Bukti bayar berhasil diunggah', 'success');
                fetchPayment();
            } else {
                message(res.error || 'Gagal mengunggah bukti bayar', 'error');
            }
        } catch {
            message('Error mengunggah bukti bayar', 'error');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleMarkAsPaid = async () => {
        setCompleting(true);
        try {
            const res = await PaymentDAO.updatePayment(id, { status: 'Paid', paidDate: new Date().toISOString() });
            if (res.success || res.id) {
                message('Payment berhasil ditandai sebagai Lunas', 'success');
                setCompleteDialog(false);
                fetchPayment();
            } else {
                message(res.error || 'Gagal mengubah status', 'error');
            }
        } catch (err) {
            message(err?.error || 'Gagal mengubah status', 'error');
        } finally {
            setCompleting(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await PaymentDAO.deletePayment(id);
            if (res.success) {
                message('Payment berhasil dihapus', 'success');
                navigate('/payments');
            } else {
                message(res.error || 'Gagal menghapus payment', 'error');
            }
        } catch {
            message('Gagal menghapus payment', 'error');
        } finally {
            setDeleting(false);
            setDeleteDialog(false);
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress />
        </Box>
    );
    if (!payment) return null;

    const statusCfg  = STATUS_CONFIG[payment.status] || STATUS_CONFIG.Pending;
    const isPaid      = payment.status === 'Paid';
    const isCancelled = payment.status === 'Cancelled';
    const isTerminal  = isPaid || isCancelled;

    const initials = customerName ? customerName[0].toUpperCase() : '?';

    return (
        <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', pb: 8 }}>
            <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5 }, px: { xs: 1.5, sm: 2 } }}>

                {/* Back */}
                <Box sx={{ mb: 3 }}>
                    <Button onClick={() => navigate('/payments')} startIcon={<Icon icon="mdi:arrow-left" />}
                        sx={{ color: '#64748B', fontWeight: 600, textTransform: 'none', fontSize: '0.9375rem', px: 1, '&:hover': { bgcolor: 'transparent', color: '#1E40AF' } }}>
                        Kembali ke Payment
                    </Button>
                </Box>

                {/* ── Profile card ── */}
                <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 4 }, mb: 4, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff', position: 'relative' }}>
                    {/* action icon buttons */}
                    <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                        <Stack direction="row" spacing={1}>
                            <IconButton onClick={startEdit} sx={{ color: '#1E40AF', bgcolor: '#EFF6FF', borderRadius: 2 }}>
                                <Icon icon="mdi:pencil" width={22} />
                            </IconButton>
                            {!isTerminal && (
                                <IconButton onClick={() => setCompleteDialog(true)} sx={{ color: '#059669', bgcolor: '#D1FAE5', borderRadius: 2 }}>
                                    <Icon icon="mdi:check-circle-outline" width={22} />
                                </IconButton>
                            )}
                            <IconButton onClick={() => setDeleteDialog(true)} sx={{ color: '#DC2626', bgcolor: '#FEF2F2', borderRadius: 2 }}>
                                <Icon icon="mdi:trash-can" width={22} />
                            </IconButton>
                        </Stack>
                    </Box>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center" sx={{ pr: { xs: 0, sm: 14 } }}>
                        <Avatar sx={{ width: 72, height: 72, bgcolor: '#1E40AF', fontSize: '2rem', fontWeight: 700, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', flexShrink: 0 }}>
                            {initials}
                        </Avatar>
                        <Box flex={1} sx={{ textAlign: { xs: 'center', sm: 'left' }, minWidth: 0 }}>
                            <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 800, color: '#1E293B', mb: 0.5 }}>
                                {customerName || payment.customerId}
                            </Typography>
                            {carLabel && (
                                <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                                    <Icon icon="mdi:car" width={16} />
                                    {carLabel}
                                </Typography>
                            )}
                            <Chip
                                label={statusCfg.label}
                                size="small"
                                icon={<Icon icon={statusCfg.icon} width={14} style={{ color: statusCfg.color }} />}
                                sx={{ bgcolor: statusCfg.bg, color: statusCfg.color, fontWeight: 700, fontSize: '0.75rem', borderRadius: '8px' }}
                            />
                        </Box>
                    </Stack>

                    {isPaid && (
                        <Alert severity="success" sx={{ mt: 3, borderRadius: 2 }} icon={<Icon icon="mdi:check-circle" />}>
                            Pembayaran telah lunas pada {formatDate(payment.paidDate)}.
                        </Alert>
                    )}
                </Paper>

                {/* ── Info cards ── */}
                <Stack spacing={3}>

                    {/* Tagihan */}
                    <InfoCard title="Informasi Tagihan">
                        <InfoRow label="Total Tagihan" value={formatCurrency(payment.amount)} icon="mdi:cash-multiple" />
                        <InfoRow label="Jatuh Tempo" value={formatDate(payment.dueDate)} icon="mdi:calendar-alert" />
                        <InfoRow label="Metode Pembayaran" value={payment.paymentMethod} icon="mdi:credit-card" />
                        {isPaid && <InfoRow label="Tanggal Dibayar" value={formatDate(payment.paidDate)} icon="mdi:calendar-check" />}
                    </InfoCard>

                    {/* Bukti pembayaran */}
                    <InfoCard title="Bukti Pembayaran">
                        {payment.proofUrl ? (
                            <Box>
                                <Box
                                    onClick={() => setPreviewOpen(true)}
                                    sx={{
                                        width: '100%', height: { xs: 200, sm: 260 },
                                        borderRadius: 2, overflow: 'hidden',
                                        border: '1px solid #E2E8F0', bgcolor: '#F8FAFC',
                                        cursor: 'pointer', transition: 'all 0.2s',
                                        '&:hover': { borderColor: '#1E40AF', boxShadow: '0 4px 12px rgba(30,64,175,0.1)' }
                                    }}>
                                    <img src={payment.proofUrl} alt="Bukti Pembayaran" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </Box>
                                <Typography variant="caption" sx={{ color: '#94A3B8', mt: 1, display: 'block' }}>
                                    Klik gambar untuk memperbesar
                                </Typography>
                                {!isPaid && (
                                    <Button variant="outlined" component="label" disabled={isUploading} size="small"
                                        startIcon={isUploading ? <CircularProgress size={14} /> : <Icon icon="mdi:upload" />}
                                        sx={{ mt: 1.5, textTransform: 'none', fontWeight: 600, borderRadius: 2, borderColor: '#E2E8F0', color: '#475569' }}>
                                        Unggah Ulang
                                        <input type="file" hidden accept="image/*" onChange={handleUploadProof} ref={fileInputRef} />
                                    </Button>
                                )}
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 6, border: '2px dashed #E2E8F0', borderRadius: 2, bgcolor: '#F8FAFC' }}>
                                <Icon icon="mdi:cloud-upload-outline" width={48} color="#CBD5E1" />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#64748B', mt: 2, mb: 0.5 }}>
                                    Belum ada bukti pembayaran
                                </Typography>
                                {!isPaid && (
                                    <Button variant="contained" component="label" disabled={isUploading} size="small"
                                        startIcon={isUploading ? <CircularProgress size={14} color="inherit" /> : <Icon icon="mdi:upload" />}
                                        sx={{ mt: 1.5, textTransform: 'none', fontWeight: 600, bgcolor: '#1E40AF', '&:hover': { bgcolor: '#1E3A8A' }, borderRadius: 2 }}>
                                        Unggah Bukti Sekarang
                                        <input type="file" hidden accept="image/*" onChange={handleUploadProof} ref={fileInputRef} />
                                    </Button>
                                )}
                            </Box>
                        )}
                    </InfoCard>

                    {/* Edit form */}
                    {editing && (
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '2px solid #1E40AF', bgcolor: '#EFF6FF' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E40AF', mb: 2.5, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <Icon icon="mdi:pencil" width={20} /> Edit Payment
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                <TextField size="small" label="Nomor Invoice" value={editData.invoiceNumber || ''}
                                    onChange={e => setEditData(p => ({ ...p, invoiceNumber: e.target.value }))} />
                                <TextField size="small" label="Total Tagihan (Rp)" value={editData.amount || ''}
                                    onChange={e => setEditData(p => ({ ...p, amount: e.target.value }))}
                                    helperText={editData.amount ? formatCurrency(Number(editData.amount)) : ''} />
                                <TextField size="small" type="date" label="Jatuh Tempo" InputLabelProps={{ shrink: true }}
                                    value={editData.dueDate || ''} onChange={e => setEditData(p => ({ ...p, dueDate: e.target.value }))} />
                                <TextField size="small" type="date" label="Tanggal Bayar" InputLabelProps={{ shrink: true }}
                                    value={editData.paidDate || ''} onChange={e => setEditData(p => ({ ...p, paidDate: e.target.value }))} />
                                <FormControl size="small">
                                    <InputLabel>Status</InputLabel>
                                    <Select value={editData.status || ''} label="Status" onChange={e => setEditData(p => ({ ...p, status: e.target.value }))}>
                                        {ALLOWED_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <TextField size="small" label="Metode Pembayaran" value={editData.paymentMethod || ''}
                                    onChange={e => setEditData(p => ({ ...p, paymentMethod: e.target.value }))}
                                    placeholder="Bank Transfer, Cash..." />
                                <TextField size="small" label="Catatan" multiline rows={2} value={editData.notes || ''}
                                    onChange={e => setEditData(p => ({ ...p, notes: e.target.value }))}
                                    sx={{ gridColumn: { sm: 'span 2' } }} />
                            </Box>
                            <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 2.5 }}>
                                <Button variant="outlined" onClick={() => setEditing(false)} disabled={saving}
                                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, borderColor: '#BFDBFE', color: '#1E40AF' }}>Batal</Button>
                                <Button variant="contained" onClick={handleSave} disabled={saving}
                                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#1E40AF', '&:hover': { bgcolor: '#1E3A8A' } }}>
                                    {saving ? <CircularProgress size={18} color="inherit" /> : 'Simpan Perubahan'}
                                </Button>
                            </Stack>
                        </Paper>
                    )}
                </Stack>
            </Container>

            {/* ── Tandai Lunas ── */}
            <Dialog open={completeDialog} onClose={() => setCompleteDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, m: 2 } }}>
                <Box sx={{ p: 3 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                        <Box sx={{ bgcolor: '#D1FAE5', borderRadius: 2, p: 1, display: 'flex' }}>
                            <Icon icon="mdi:check-circle" width={24} color="#059669" />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Tandai Sebagai Lunas</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Status akan diubah menjadi <b>Paid</b> dan waktu pembayaran dicatat saat ini.
                    </Typography>
                    {!payment.proofUrl && (
                        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                            Belum ada bukti bayar yang diunggah.
                        </Alert>
                    )}
                    <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                        <Button variant="outlined" onClick={() => setCompleteDialog(false)} disabled={completing}
                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, borderColor: '#E2E8F0', color: '#475569' }}>Batal</Button>
                        <Button variant="contained" onClick={handleMarkAsPaid} disabled={completing}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}>
                            {completing ? <CircularProgress size={20} color="inherit" /> : 'Ya, Lunas'}
                        </Button>
                    </Stack>
                </Box>
            </Dialog>

            {/* ── Hapus ── */}
            <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth PaperProps={{ style: { borderRadius: '16px', margin: '16px' } }}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Hapus Payment?</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Data yang sudah dihapus tidak dapat dikembalikan.
                    </Typography>
                    <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                        <Button variant="outlined" onClick={() => setDeleteDialog(false)} disabled={deleting}
                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, borderColor: '#E2E8F0', color: '#475569' }}>Batal</Button>
                        <Button variant="contained" onClick={handleDelete} disabled={deleting}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}>
                            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Hapus'}
                        </Button>
                    </Stack>
                </Box>
            </Dialog>

            {/* ── Preview ── */}
            <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth PaperProps={{ style: { background: '#000', borderRadius: 0 } }}>
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, p: 2 }}>
                    <Button onClick={() => setPreviewOpen(false)} sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', minWidth: 0 }}>
                        <Icon icon="mdi:close" width={28} />
                    </Button>
                    {payment.proofUrl && <img src={payment.proofUrl} alt="Bukti" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />}
                </Box>
            </Dialog>
        </Box>
    );
}
