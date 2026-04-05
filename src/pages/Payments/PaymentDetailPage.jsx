import { Icon } from '@iconify/react';
import {
    Alert, Box, Button, Chip, CircularProgress, Container, Dialog,
    Divider, FormControl, InputLabel, MenuItem, Paper, Select,
    Stack, TextField, Typography, useMediaQuery, useTheme
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useLoading } from '../../hooks/LoadingProvider';
import PaymentDAO from '../../daos/PaymentDao';

const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const formatCurrency = (v) => {
    if (!v && v !== 0) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);
};
const toInputDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '';
    return dt.toISOString().slice(0, 10);
};

const STATUS_CONFIG = {
    Pending:   { bg: '#FEF3C7', color: '#92400E', icon: 'mdi:clock-outline' },
    Paid:      { bg: '#D1FAE5', color: '#065F46', icon: 'mdi:check-circle-outline' },
    Overdue:   { bg: '#FEE2E2', color: '#991B1B', icon: 'mdi:alert-circle-outline' },
    Cancelled: { bg: '#F1F5F9', color: '#475569', icon: 'mdi:close-circle-outline' },
};
const ALLOWED_STATUSES = ['Pending', 'Paid', 'Overdue', 'Cancelled'];

function InfoRow({ label, value, icon }) {
    return (
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 1, borderBottom: '1px solid #F1F5F9' }}>
            <Box sx={{ mt: 0.3, color: '#94A3B8', flexShrink: 0 }}>
                <Icon icon={icon || 'mdi:information'} width={18} />
            </Box>
            <Box>
                <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>
                    {label}
                </Typography>
                <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 500 }}>
                    {value || <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>Tidak tersedia</span>}
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

    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);

    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [saving, setSaving] = useState(false);

    // upload
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    // complete/pay dialog
    const [completeDialog, setCompleteDialog] = useState(false);
    const [completing, setCompleting] = useState(false);
    
    // delete dialog
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // image preview
    const [previewOpen, setPreviewOpen] = useState(false);

    const fetchPayment = async () => {
        try {
            loadingProvider.start();
            const res = await PaymentDAO.getPaymentById(id);
            if (res.success || res.payment) {
                setPayment(res.payment || res);
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
        } catch (err) {
            message('Error mengurutkan bukti bayar', 'error');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleMarkAsPaid = async () => {
        setCompleting(true);
        try {
            const payload = {
                status: 'Paid',
                paidDate: new Date().toISOString()
            };
            const res = await PaymentDAO.updatePayment(id, payload);
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
        } catch (err) {
            message('Gagal menghapus payment', 'error');
        } finally {
            setDeleting(false);
            setDeleteDialog(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }
    if (!payment) return null;

    const statusCfg = STATUS_CONFIG[payment.status] || STATUS_CONFIG.Pending;
    const isPaid = payment.status === 'Paid';
    const isCancelled = payment.status === 'Cancelled';
    const isTerminal = isPaid || isCancelled;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 8 }}>
            <Container maxWidth="lg" sx={{ pt: 4 }}>
                <Box sx={{ mb: 2 }}>
                    <Button onClick={() => navigate('/payments')} startIcon={<Icon icon="mdi:arrow-left" />}
                        sx={{ color: '#475569', fontWeight: 600, textTransform: 'none', '&:hover': { bgcolor: 'transparent', color: '#1E293B' } }}>
                        Kembali ke Daftar Payment
                    </Button>
                </Box>

                <Paper elevation={0} sx={{ p: 4, mb: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff', position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                        <Stack direction="row" spacing={1}>
                            <Button variant="outlined" size="small"
                                onClick={() => setDeleteDialog(true)}
                                sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#FCCCA7', color: '#B45309', minWidth: 0, px: 2, '&:hover': { bgcolor: '#FFFBEB', borderColor: '#F59E0B' } }}>
                                <Icon icon="mdi:delete-outline" width={16} />
                            </Button>
                            {!editing && (
                                <Button variant="outlined" size="small" startIcon={<Icon icon="mdi:pencil" width={16} />}
                                    onClick={startEdit}
                                    sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#E2E8F0', color: '#DC2626' }}>
                                    Edit
                                </Button>
                            )}
                            {!isTerminal && (
                                <Button variant="contained" size="small"
                                    startIcon={<Icon icon="mdi:check-circle" width={16} />}
                                    onClick={() => setCompleteDialog(true)}
                                    sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, '&.Mui-disabled': { bgcolor: '#E2E8F0', color: '#94A3B8' } }}>
                                    Tandai Lunas (Paid)
                                </Button>
                            )}
                        </Stack>
                    </Box>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ bgcolor: '#FEF2F2', borderRadius: 2, p: 1.5, display: 'flex' }}>
                            <Icon icon="mdi:receipt-text" width={36} color="#DC2626" />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B', mb: 0.5 }}>
                                {payment.invoiceNumber || payment.id}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748B', mb: 1 }}>
                                {payment.customerId} {payment.policyId ? `· Polis: ${payment.policyId}` : ''}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                <Chip label={payment.status} size="small"
                                    icon={<Icon icon={statusCfg.icon} width={14} style={{ color: statusCfg.color }} />}
                                    sx={{ bgcolor: statusCfg.bg, color: statusCfg.color, fontWeight: 700, fontSize: '0.75rem', borderRadius: '8px' }} />
                            </Stack>
                        </Box>
                    </Stack>
                    
                    {isPaid && (
                        <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }} icon={<Icon icon="mdi:check-circle" />}>
                            Pembayaran telah lunas pada {formatDate(payment.paidDate)}.
                        </Alert>
                    )}
                </Paper>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                    {/* Ringkasan Tagihan */}
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icon icon="mdi:cash-multiple" width={20} color="#DC2626" /> Ringkasan Tagihan
                        </Typography>
                        <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 2, mb: 2, border: '1px solid #E2E8F0', textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Total Tagihan</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E293B', mt: 0.5 }}>
                                {formatCurrency(payment.amount)}
                            </Typography>
                        </Box>
                        <InfoRow label="Jatuh Tempo" value={new Date(payment.dueDate).toLocaleDateString('id-ID')} icon="mdi:calendar-alert" />
                        <InfoRow label="Metode Pembayaran" value={payment.paymentMethod || '-'} icon="mdi:credit-card" />
                        {payment.paidDate && <InfoRow label="Tanggal Bayar" value={formatDate(payment.paidDate)} icon="mdi:calendar-check" />}
                    </Paper>

                    {/* Bukti Pembayaran */}
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icon icon="mdi:image-outline" width={20} color="#DC2626" /> Bukti Pembayaran
                        </Typography>
                        
                        {payment.proofUrl ? (
                            <Box>
                                <Typography variant="caption" sx={{ color: '#64748B', mb: 1, display: 'block' }}>Klik pada gambar untuk memperbesar</Typography>
                                <Box 
                                    onClick={() => setPreviewOpen(true)}
                                    sx={{ 
                                        width: '100%', height: 200, borderRadius: 2, overflow: 'hidden', border: '1px solid #E2E8F0', 
                                        cursor: 'pointer', position: 'relative', bgcolor: '#F8FAFC',
                                        '&:hover::after': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.1)' }
                                    }}>
                                    <img src={payment.proofUrl} alt="Bukti Pembayaran" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </Box>
                                {!isPaid && (
                                    <Button variant="outlined" component="label" disabled={isUploading} size="small"
                                        startIcon={isUploading ? <CircularProgress size={16} /> : <Icon icon="mdi:upload" />}
                                        sx={{ mt: 2, textTransform: 'none', fontWeight: 600 }}>
                                        Unggah Ulang Bukti
                                        <input type="file" hidden accept="image/*" onChange={handleUploadProof} ref={fileInputRef} />
                                    </Button>
                                )}
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4, px: 2, border: '2px dashed #E2E8F0', borderRadius: 2, bgcolor: '#F8FAFC' }}>
                                <Icon icon="mdi:cloud-upload-outline" width={48} color="#CBD5E1" />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#64748B', mt: 2 }}>Belum ada bukti pembayaran</Typography>
                                {!isPaid && (
                                    <Button variant="contained" component="label" disabled={isUploading} size="small"
                                        startIcon={isUploading ? <CircularProgress size={16} /> : <Icon icon="mdi:upload" />}
                                        sx={{ mt: 2, textTransform: 'none', fontWeight: 600, bgcolor: '#1E293B', '&:hover': { bgcolor: '#0F172A' } }}>
                                        Unggah Bukti Sekarang
                                        <input type="file" hidden accept="image/*" onChange={handleUploadProof} ref={fileInputRef} />
                                    </Button>
                                )}
                            </Box>
                        )}
                    </Paper>
                </Box>

                {/* Edit Form */}
                {editing && (
                    <Paper elevation={0} sx={{ p: 3, mt: 3, borderRadius: 3, border: '2px solid #DC2626', bgcolor: '#FEF2F2' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#DC2626', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icon icon="mdi:pencil" width={20} /> Edit Payment Record
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <TextField size="small" label="Nomor Invoice" value={editData.invoiceNumber}
                                onChange={e => setEditData(p => ({ ...p, invoiceNumber: e.target.value }))} />
                            <TextField size="small" label="Total Tagihan (Rp)" value={editData.amount}
                                onChange={e => setEditData(p => ({ ...p, amount: e.target.value }))}
                                helperText={editData.amount ? formatCurrency(Number(editData.amount)) : ''} />
                            <TextField size="small" type="date" label="Batas Waktu" InputLabelProps={{ shrink: true }}
                                value={editData.dueDate} onChange={e => setEditData(p => ({ ...p, dueDate: e.target.value }))} />
                            <TextField size="small" type="date" label="Tanggal Bayar" InputLabelProps={{ shrink: true }}
                                value={editData.paidDate} onChange={e => setEditData(p => ({ ...p, paidDate: e.target.value }))} />
                            <FormControl size="small">
                                <InputLabel>Status</InputLabel>
                                <Select value={editData.status} label="Status" onChange={e => setEditData(p => ({ ...p, status: e.target.value }))}>
                                    {ALLOWED_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField size="small" label="Metode Pembayaran" value={editData.paymentMethod}
                                onChange={e => setEditData(p => ({ ...p, paymentMethod: e.target.value }))}
                                placeholder="e.g. Bank Transfer, Cash" />
                            <TextField size="small" label="Catatan" multiline rows={2} value={editData.notes}
                                onChange={e => setEditData(p => ({ ...p, notes: e.target.value }))}
                                sx={{ gridColumn: { sm: 'span 2' } }} />
                        </Box>
                        <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 2 }}>
                            <Button variant="outlined" onClick={() => setEditing(false)} disabled={saving}
                                sx={{ textTransform: 'none', borderColor: '#E2E8F0', color: '#475569' }}>Batal</Button>
                            <Button variant="contained" onClick={handleSave} disabled={saving}
                                sx={{ textTransform: 'none', bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}>
                                {saving ? <CircularProgress size={18} color="inherit" /> : 'Simpan Perubahan'}
                            </Button>
                        </Stack>
                    </Paper>
                )}
            </Container>

            {/* Complete dialog */}
            <Dialog open={completeDialog} onClose={() => setCompleteDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <Box sx={{ p: 3 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                        <Box sx={{ bgcolor: '#D1FAE5', borderRadius: 2, p: 1, display: 'flex' }}>
                            <Icon icon="mdi:check-circle" width={24} color="#059669" />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Tandai Sebagai Lunas</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Status pembayaran ini akan diubah menjadi <b>Paid</b>. Waktu pembayaran akan dicatat saat ini.
                    </Typography>
                    {!payment.proofUrl && (
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            Peringatan: Belum ada bukti bayar yang diunggah. Anda tetap bisa melanjutkannya.
                        </Alert>
                    )}
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button variant="outlined" onClick={() => setCompleteDialog(false)} disabled={completing}
                            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#E2E8F0', color: '#475569' }}>Batal</Button>
                        <Button variant="contained" onClick={handleMarkAsPaid} disabled={completing}
                            sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}>
                            {completing ? <CircularProgress size={20} color="inherit" /> : 'Ya, Lunas'}
                        </Button>
                    </Stack>
                </Box>
            </Dialog>

            {/* Delete dialog */}
            <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <Box sx={{ p: 3 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                        <Box sx={{ bgcolor: '#FEF2F2', borderRadius: 2, p: 1, display: 'flex' }}>
                            <Icon icon="mdi:alert" width={24} color="#DC2626" />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Hapus Payment?</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Apakah Anda yakin ingin menghapus Payment Record ini? Data yang sudah dihapus tidak dapat dikembalikan.
                    </Typography>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button variant="outlined" onClick={() => setDeleteDialog(false)} disabled={deleting}
                            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#E2E8F0', color: '#475569' }}>Batal</Button>
                        <Button variant="contained" onClick={handleDelete} disabled={deleting}
                            sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}>
                            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Hapus Payment'}
                        </Button>
                    </Stack>
                </Box>
            </Dialog>

            {/* Preview Proof Dialog */}
            <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth PaperProps={{ style: { background: '#000', borderRadius: 0 } }}>
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, p: 2 }}>
                    <Button onClick={() => setPreviewOpen(false)} sx={{ position: 'absolute', top: 8, right: 8, color: '#fff' }}>
                        <Icon icon="mdi:close" width={28} />
                    </Button>
                    <img src={payment.proofUrl} alt="Bukti" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
                </Box>
            </Dialog>

        </Box>
    );
}
