import { Icon } from '@iconify/react';
import {
    Alert, Avatar, Box, Button, Chip, CircularProgress, Dialog,
    FormControl, IconButton, InputLabel, Menu, MenuItem, Paper, Select,
    Stack, TextField, Typography
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
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};
const formatCurrency = (v) => {
    if (!v && v !== 0) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);
};

const formatThousand = (val) => {
    if (!val) return '';
    const clean = val.toString().replace(/\D/g, '');
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};
const toInputDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 10);
};

const STATUS_CONFIG = {
    Pending:   { bg: '#FEF3C7', color: '#92400E', icon: 'mdi:clock-outline',         label: 'MENUNGGU' },
    Paid:      { bg: '#D1FAE5', color: '#065F46', icon: 'mdi:check-circle-outline',  label: 'LUNAS' },
    Overdue:   { bg: '#FEE2E2', color: '#991B1B', icon: 'mdi:alert-circle-outline',  label: 'TERLAMBAT' },
    Cancelled: { bg: '#F1F5F9', color: '#475569', icon: 'mdi:close-circle-outline',  label: 'DIBATALKAN' },
};
const ALLOWED_STATUSES = ['Pending', 'Paid', 'Overdue', 'Cancelled'];

export default function PaymentDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const loadingProvider = useLoading();
    const message = useAlert();

    const [payment, setPayment]       = useState(null);
    const [loading, setLoading]       = useState(true);
    const [customerName, setCustomerName] = useState('');
    const [carLabel, setCarLabel]     = useState('');

    const [tabValue, setTabValue] = useState(0);

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

    // Top right menu
    const [anchorEl, setAnchorEl] = useState(null);
    const isMenuOpen = Boolean(anchorEl);

    const fetchPayment = async () => {
        try {
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
            setLoading(false);
        }
    };

    useEffect(() => { fetchPayment(); }, [id]); // eslint-disable-line

    const startEdit = () => {
        setEditData({
            invoiceNumber: payment.invoiceNumber || '',
            amount: formatThousand(payment.amount) || '',
            dueDate: toInputDate(payment.dueDate),
            paidDate: toInputDate(payment.paidDate),
            paymentMethod: payment.paymentMethod || '',
            status: payment.status || 'Pending',
            notes: payment.notes || '',
        });
        setEditing(true);
        setTabValue(0);
        setAnchorEl(null);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const rawAmount = editData.amount ? editData.amount.toString().replace(/\D/g, '') : '0';
            const payload = { ...editData, amount: Number(rawAmount) };
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
            formData.append('proof', file);
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

    const handleDownloadProof = async () => {
        if (!payment.proofUrl) return;
        try {
            message('Mengunduh bukti pembayaran...', 'info');
            const res = await fetch(payment.proofUrl);
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const ext = payment.proofUrl.split('.').pop().split('?')[0] || 'png';
            a.download = `bukti-pembayaran-${id}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            message('Bukti pembayaran berhasil diunduh', 'success');
        } catch (err) {
            console.error(err);
            window.open(payment.proofUrl, '_blank');
            message('Gagal mengunduh langsung, bukti pembayaran dibuka di tab baru', 'warning');
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#fff' }}>
            <CircularProgress />
        </Box>
    );
    if (!payment) return null;

    const statusCfg  = STATUS_CONFIG[payment.status] || STATUS_CONFIG.Pending;
    const isPaid      = payment.status === 'Paid';
    const isCancelled = payment.status === 'Cancelled';
    const isTerminal  = isPaid || isCancelled;

    const tabs = [
        { label: 'Info' },
        { label: 'Bukti' },
    ];

    return (
        <Box sx={{ bgcolor: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header / App Bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
                <IconButton onClick={() => navigate('/payments')} sx={{ color: '#2563EB', pl: 1 }}>
                    <Icon icon="mdi:arrow-left" width={24} />
                </IconButton>
                <Typography sx={{ fontWeight: 600, fontSize: '1.05rem', color: '#1E293B' }}>
                    Payment Detail
                </Typography>
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ color: '#94A3B8', pr: 1 }}>
                    <Icon icon="mdi:dots-vertical" width={24} />
                </IconButton>
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={isMenuOpen}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{ '& .MuiPaper-root': { borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' } }}
            >
                <MenuItem onClick={startEdit} sx={{ fontSize: '0.9rem', color: '#1E293B' }}>
                    <Icon icon="mdi:pencil" width={20} style={{ marginRight: 8, color: '#64748B' }} />
                    Edit Payment
                </MenuItem>
                {payment.proofUrl && (
                    <MenuItem onClick={() => { setAnchorEl(null); handleDownloadProof(); }} sx={{ fontSize: '0.9rem', color: '#1E293B' }}>
                        <Icon icon="mdi:download" width={20} style={{ marginRight: 8, color: '#64748B' }} />
                        Unduh Bukti Bayar
                    </MenuItem>
                )}
                {!isTerminal && (
                    <MenuItem onClick={() => { setAnchorEl(null); setCompleteDialog(true); }} sx={{ fontSize: '0.9rem', color: '#059669' }}>
                        <Icon icon="mdi:check-circle" width={20} style={{ marginRight: 8 }} />
                        Tandai Lunas
                    </MenuItem>
                )}
                <MenuItem onClick={() => { setAnchorEl(null); setDeleteDialog(true); }} sx={{ fontSize: '0.9rem', color: '#DC2626' }}>
                    <Icon icon="mdi:trash-can" width={20} style={{ marginRight: 8 }} />
                    Hapus Payment
                </MenuItem>
            </Menu>

            <Box sx={{ p: 3, pt: 1, flex: 1, maxWidth: '600px', mx: 'auto', width: '100%' }}>
                {/* Profile Card */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3.5 }}>
                    <Box sx={{ position: 'relative' }}>
                        <Avatar sx={{ width: 90, height: 90, bgcolor: '#E0F2FE', color: '#1E3A8A', fontSize: '2.5rem' }}>
                            <Icon icon="mdi:cash-multiple" />
                        </Avatar>
                        <Box sx={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, bgcolor: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon icon={isPaid ? "mdi:check-decagram" : "mdi:clock"} color={isPaid ? "#059669" : "#D97706"} width={22} />
                        </Box>
                    </Box>
                    <Typography sx={{ mt: 2.5, fontSize: '1.45rem', fontWeight: 800, color: '#1E293B' }}>
                        {formatCurrency(payment.amount)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748B', mt: 0.25 }}>
                        {customerName || payment.customerId || '-'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Chip
                            label={statusCfg.label}
                            size="small"
                            sx={{
                                bgcolor: statusCfg.bg,
                                color: statusCfg.color,
                                fontWeight: 800, fontSize: '0.65rem', height: 20, px: 0.5
                            }}
                        />
                        {carLabel && (
                            <Typography sx={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Icon icon="mdi:car" width={16} />
                                {carLabel}
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* Paid Alert */}
                {isPaid && (
                    <Box sx={{ mb: 3, p: 2, bgcolor: '#F0FDF4', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Icon icon="mdi:check-circle" width={24} color="#059669" />
                        <Box>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#065F46' }}>
                                Pembayaran Lunas
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#059669' }}>
                                {formatDate(payment.paidDate)}
                            </Typography>
                        </Box>
                    </Box>
                )}

                {/* Segmented Tabs */}
                <Box sx={{ bgcolor: '#F8FAFC', borderRadius: '12px', p: 0.5, display: 'flex', gap: 0.5, mb: 4, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
                    {tabs.map((tab, idx) => (
                        <Box
                            key={idx}
                            onClick={() => setTabValue(idx)}
                            sx={{
                                flex: 1, textAlign: 'center',
                                px: 2, py: 1.25, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                                bgcolor: tabValue === idx ? '#ffffff' : 'transparent',
                                color: tabValue === idx ? '#2563EB' : '#64748B',
                                fontWeight: tabValue === idx ? 700 : 600,
                                boxShadow: tabValue === idx ? '0 1px 4px rgba(0,0,0,0.05)' : 'none',
                                fontSize: '0.85rem', whiteSpace: 'nowrap'
                            }}
                        >
                            {tab.label}
                        </Box>
                    ))}
                </Box>

                {/* Tab 0: Info */}
                {tabValue === 0 && (
                    <Box>
                        {editing ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Icon icon="mdi:pencil" width={18} color="#2563EB" />
                                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#2563EB' }}>Edit Payment</Typography>
                                </Box>
                                <TextField size="small" label="Nomor Invoice" value={editData.invoiceNumber || ''}
                                    onChange={e => setEditData(p => ({ ...p, invoiceNumber: e.target.value }))}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                                <TextField size="small" label="Total Tagihan (Rp)" value={editData.amount || ''}
                                    onChange={e => setEditData(p => ({ ...p, amount: formatThousand(e.target.value) }))}
                                    helperText={editData.amount ? formatCurrency(Number(editData.amount.toString().replace(/\D/g, ''))) : ''}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                                <TextField size="small" type="date" label="Jatuh Tempo" InputLabelProps={{ shrink: true }}
                                    value={editData.dueDate || ''} onChange={e => setEditData(p => ({ ...p, dueDate: e.target.value }))}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                                <TextField size="small" type="date" label="Tanggal Bayar" InputLabelProps={{ shrink: true }}
                                    value={editData.paidDate || ''} onChange={e => setEditData(p => ({ ...p, paidDate: e.target.value }))}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                                <FormControl size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}>
                                    <InputLabel>Status</InputLabel>
                                    <Select value={editData.status || ''} label="Status" onChange={e => setEditData(p => ({ ...p, status: e.target.value }))}>
                                        {ALLOWED_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <TextField size="small" label="Metode Pembayaran" value={editData.paymentMethod || ''}
                                    onChange={e => setEditData(p => ({ ...p, paymentMethod: e.target.value }))}
                                    placeholder="Bank Transfer, Cash..."
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                                <TextField size="small" label="Catatan" multiline rows={3} value={editData.notes || ''}
                                    onChange={e => setEditData(p => ({ ...p, notes: e.target.value }))}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                                <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                                    <Button fullWidth variant="outlined" onClick={() => setEditing(false)} disabled={saving}
                                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3, borderColor: '#E2E8F0', color: '#475569', py: 1.5 }}>
                                        Batal
                                    </Button>
                                    <Button fullWidth variant="contained" onClick={handleSave} disabled={saving}
                                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3, bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' }, py: 1.5, boxShadow: 'none' }}>
                                        {saving ? <CircularProgress size={20} color="inherit" /> : 'Simpan'}
                                    </Button>
                                </Stack>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3 }}>
                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', mb: 0.5, letterSpacing: 0.5 }}>NOMOR INVOICE</Typography>
                                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>{payment.invoiceNumber || '-'}</Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3 }}>
                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', mb: 0.5, letterSpacing: 0.5 }}>TOTAL TAGIHAN</Typography>
                                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>{formatCurrency(payment.amount)}</Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3 }}>
                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', mb: 0.5, letterSpacing: 0.5 }}>JATUH TEMPO</Typography>
                                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>{formatDate(payment.dueDate)}</Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3 }}>
                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', mb: 0.5, letterSpacing: 0.5 }}>METODE PEMBAYARAN</Typography>
                                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>{payment.paymentMethod || '-'}</Typography>
                                </Box>
                                {isPaid && (
                                    <Box sx={{ bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3 }}>
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', mb: 0.5, letterSpacing: 0.5 }}>TANGGAL DIBAYAR</Typography>
                                        <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>{formatDate(payment.paidDate)}</Typography>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                )}

                {/* Tab 1: Bukti Pembayaran */}
                {tabValue === 1 && (
                    <Box>
                        {payment.proofUrl ? (
                            <Box>
                                <Box
                                    onClick={() => setPreviewOpen(true)}
                                    sx={{
                                        width: '100%', height: 260,
                                        borderRadius: 3, overflow: 'hidden',
                                        border: '1px solid #E2E8F0', bgcolor: '#F8FAFC',
                                        cursor: 'pointer', transition: 'all 0.2s',
                                        '&:hover': { borderColor: '#2563EB' }
                                    }}>
                                    <img src={payment.proofUrl} alt="Bukti Pembayaran" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </Box>
                                <Typography sx={{ color: '#94A3B8', fontSize: '0.8rem', mt: 1.5, textAlign: 'center' }}>
                                    Klik gambar untuk memperbesar
                                </Typography>
                                <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                                    <Button variant="contained" onClick={handleDownloadProof} fullWidth
                                        startIcon={<Icon icon="mdi:download" />}
                                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3, bgcolor: '#1E40AF', '&:hover': { bgcolor: '#1E3A8A' }, py: 1.5, boxShadow: 'none' }}>
                                        Unduh Bukti
                                    </Button>
                                    {!isPaid && (
                                        <Button variant="outlined" component="label" fullWidth disabled={isUploading}
                                            startIcon={isUploading ? <CircularProgress size={14} /> : <Icon icon="mdi:upload" />}
                                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3, borderColor: '#E2E8F0', color: '#475569', py: 1.5 }}>
                                            Unggah Ulang
                                            <input type="file" hidden accept="image/*" onChange={handleUploadProof} ref={fileInputRef} />
                                        </Button>
                                    )}
                                </Stack>
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 6, border: '2px dashed #E2E8F0', borderRadius: 3, bgcolor: '#F8FAFC' }}>
                                <Icon icon="mdi:cloud-upload-outline" width={48} color="#CBD5E1" />
                                <Typography sx={{ fontWeight: 700, color: '#64748B', mt: 2, mb: 0.5, fontSize: '0.95rem' }}>
                                    Belum ada bukti pembayaran
                                </Typography>
                                <Typography sx={{ color: '#94A3B8', fontSize: '0.8rem', mb: 2 }}>
                                    Unggah foto bukti transfer atau kwitansi
                                </Typography>
                                {!isPaid && (
                                    <Button variant="contained" component="label" disabled={isUploading}
                                        startIcon={isUploading ? <CircularProgress size={14} color="inherit" /> : <Icon icon="mdi:upload" />}
                                        sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' }, borderRadius: 3, px: 4 }}>
                                        Unggah Bukti
                                        <input type="file" hidden accept="image/*" onChange={handleUploadProof} ref={fileInputRef} />
                                    </Button>
                                )}
                            </Box>
                        )}
                    </Box>
                )}
            </Box>

            {/* Bottom Action */}
            {!isTerminal && (
                <Box sx={{ p: 3, maxWidth: '600px', mx: 'auto', width: '100%', mt: 'auto' }}>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={() => setCompleteDialog(true)}
                        startIcon={<Icon icon="mdi:check-circle" width={20} />}
                        sx={{
                            bgcolor: '#059669', color: '#ffffff', borderRadius: 3, py: 1.8,
                            fontWeight: 700, textTransform: 'none', fontSize: '0.95rem',
                            boxShadow: 'none',
                            '&:hover': { bgcolor: '#047857', boxShadow: 'none' }
                        }}
                    >
                        Tandai Sebagai Lunas
                    </Button>
                </Box>
            )}

            {/* ── Tandai Lunas Dialog ── */}
            <Dialog open={completeDialog} onClose={() => setCompleteDialog(false)} maxWidth="xs" fullWidth PaperProps={{ style: { borderRadius: '16px' } }}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Tandai Sebagai Lunas</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>
                        Status akan diubah menjadi <b>Paid</b> dan waktu pembayaran dicatat saat ini.
                    </Typography>
                    {!payment.proofUrl && (
                        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                            Belum ada bukti bayar yang diunggah.
                        </Alert>
                    )}
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button onClick={() => setCompleteDialog(false)} disabled={completing}
                            sx={{ textTransform: 'none', fontWeight: 700, color: '#475569' }}>Batal</Button>
                        <Button variant="contained" onClick={handleMarkAsPaid} disabled={completing}
                            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, borderRadius: 2, boxShadow: 'none' }}>
                            {completing ? <CircularProgress size={20} color="inherit" /> : 'Ya, Lunas'}
                        </Button>
                    </Stack>
                </Box>
            </Dialog>

            {/* ── Hapus Dialog ── */}
            <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth PaperProps={{ style: { borderRadius: '16px' } }}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Hapus Payment?</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>
                        Data yang sudah dihapus tidak dapat dikembalikan.
                    </Typography>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button onClick={() => setDeleteDialog(false)} disabled={deleting}
                            sx={{ textTransform: 'none', fontWeight: 700, color: '#475569' }}>Batal</Button>
                        <Button variant="contained" onClick={handleDelete} disabled={deleting}
                            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, borderRadius: 2, boxShadow: 'none' }}>
                            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Hapus'}
                        </Button>
                    </Stack>
                </Box>
            </Dialog>

            {/* ── Preview ── */}
            <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullScreen PaperProps={{ style: { background: 'rgba(0,0,0,0.95)' } }}>
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 2 }}>
                    <IconButton onClick={() => setPreviewOpen(false)} sx={{ position: 'absolute', top: 16, right: 16, color: '#fff', zIndex: 10 }}>
                        <Icon icon="mdi:close" width={28} />
                    </IconButton>
                    {payment.proofUrl && <img src={payment.proofUrl} alt="Bukti" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />}
                </Box>
            </Dialog>
        </Box>
    );
}
