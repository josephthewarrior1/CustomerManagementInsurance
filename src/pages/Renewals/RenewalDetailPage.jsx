import { Icon } from '@iconify/react';
import {
    Alert, Box, Button, Chip, CircularProgress, Container, Dialog,
    Divider, FormControl, InputLabel, MenuItem, Paper, Select,
    Stack, TextField, Tooltip, Typography, useMediaQuery, useTheme
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useLoading } from '../../hooks/LoadingProvider';
import RenewalDAO from '../../daos/RenewalDao';
import PaymentDAO from '../../daos/PaymentDao';

/* ── helpers ─────────────────────────────────────────────────────────── */
const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
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
    Approved:  { bg: '#DBEAFE', color: '#1E40AF', icon: 'mdi:check-circle-outline' },
    Paid:      { bg: '#D1FAE5', color: '#065F46', icon: 'mdi:cash-check' },
    Completed: { bg: '#EDE9FE', color: '#5B21B6', icon: 'mdi:flag-checkered' },
    Cancelled: { bg: '#F1F5F9', color: '#475569', icon: 'mdi:close-circle-outline' },
};
const PAYMENT_STATUS_CONFIG = {
    Paid:      { bg: '#D1FAE5', color: '#065F46' },
    Pending:   { bg: '#FEF3C7', color: '#92400E' },
    Overdue:   { bg: '#FEE2E2', color: '#991B1B' },
    Cancelled: { bg: '#F1F5F9', color: '#475569' },
};
const ALLOWED_STATUSES = ['Pending', 'Approved', 'Paid', 'Cancelled'];

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

/* ── main ────────────────────────────────────────────────────────────── */
export default function RenewalDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const loadingProvider = useLoading();
    const message = useAlert();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [renewal, setRenewal] = useState(null);
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);

    // edit state
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [saving, setSaving] = useState(false);

    // complete
    const [completeDialog, setCompleteDialog] = useState(false);
    const [completing, setCompleting] = useState(false);

    // payments dropdown (for linking)
    const [allPayments, setAllPayments] = useState([]);
    const [loadingPayments, setLoadingPayments] = useState(false);

    /* ── fetch ─────────────────────────────────────────────────────────── */
    const fetchRenewal = async () => {
        try {
            loadingProvider.start();
            const res = await RenewalDAO.getRenewalById(id);
            if (res.success) {
                setRenewal(res.renewal);
                // Fetch linked payment if any
                if (res.renewal.paymentId) {
                    try {
                        const pr = await PaymentDAO.getPaymentById(res.renewal.paymentId);
                        if (pr.success) setPayment(pr.payment);
                    } catch { /* optional */ }
                }
            } else {
                message(res.error || 'Renewal tidak ditemukan', 'error');
                navigate('/renewals');
            }
        } catch {
            message('Gagal memuat detail renewal', 'error');
            navigate('/renewals');
        } finally {
            loadingProvider.stop();
            setLoading(false);
        }
    };

    useEffect(() => { fetchRenewal(); }, [id]);

    // Load all payments (for payment dropdown in edit mode)
    const loadPayments = async () => {
        if (!renewal?.customerId) return;
        setLoadingPayments(true);
        try {
            const res = await PaymentDAO.getPaymentsByCustomer(renewal.customerId);
            setAllPayments(res?.payments || res?.data || (Array.isArray(res) ? res : []));
        } catch { /* ignore */ } finally {
            setLoadingPayments(false);
        }
    };

    // Start edit
    const startEdit = () => {
        setEditData({
            paymentId: renewal.paymentId || '',
            newStartDate: toInputDate(renewal.newStartDate),
            newEndDate: toInputDate(renewal.newEndDate),
            premium: renewal.premium || '',
            status: renewal.status || 'Pending',
            notes: renewal.notes || '',
        });
        loadPayments();
        setEditing(true);
    };

    /* ── save edit ─────────────────────────────────────────────────────── */
    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { ...editData, premium: editData.premium ? Number(editData.premium) : 0 };
            const res = await RenewalDAO.updateRenewal(id, payload);
            if (res.success) {
                message('Renewal berhasil diperbarui', 'success');
                setEditing(false);
                fetchRenewal();
            } else {
                message(res.error || 'Gagal memperbarui renewal', 'error');
            }
        } catch (err) {
            message(err?.error || 'Gagal memperbarui renewal', 'error');
        } finally {
            setSaving(false);
        }
    };

    /* ── complete ──────────────────────────────────────────────────────── */
    const handleComplete = async () => {
        setCompleting(true);
        try {
            const res = await RenewalDAO.completeRenewal(id);
            if (res.success) {
                message('Polis berhasil diperpanjang! Renewal telah selesai.', 'success');
                setCompleteDialog(false);
                fetchRenewal();
            } else {
                message(res.error || 'Gagal menyelesaikan renewal', 'error');
            }
        } catch (err) {
            message(err?.error || 'Gagal menyelesaikan renewal', 'error');
        } finally {
            setCompleting(false);
        }
    };

    /* ── loading / empty ───────────────────────────────────────────────── */
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }
    if (!renewal) return null;

    /* ── derived ────────────────────────────────────────────────────────── */
    const statusCfg = STATUS_CONFIG[renewal.status] || STATUS_CONFIG.Pending;
    const isCompleted = renewal.status === 'Completed';
    const isCancelled = renewal.status === 'Cancelled';
    const isTerminal = isCompleted || isCancelled;

    // Can complete?
    const paymentBlocking = renewal.paymentId && payment && payment.status !== 'Paid';
    const noPaymentDataYet = !renewal.paymentId || (renewal.paymentId && !payment);
    const canComplete = !isTerminal && !paymentBlocking && !noPaymentDataYet;
    const completeBlockReason = isCompleted
        ? 'Renewal sudah selesai'
        : isCancelled
            ? 'Renewal sudah dibatalkan'
            : !renewal.paymentId 
                ? 'Payment wajib ditautkan sebelum menyelesaikan.'
                : paymentBlocking
                    ? `Payment terkait masih berstatus "${payment?.status}". Harus Paid dulu.`
                    : noPaymentDataYet
                        ? 'Memverifikasi status payment...'
                        : null;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 8 }}>
            <Container maxWidth="lg" sx={{ pt: 4 }}>
                {/* Back */}
                <Box sx={{ mb: 2 }}>
                    <Button onClick={() => navigate('/renewals')} startIcon={<Icon icon="mdi:arrow-left" />}
                        sx={{ color: '#475569', fontWeight: 600, textTransform: 'none', '&:hover': { bgcolor: 'transparent', color: '#1E293B' } }}>
                        Kembali ke Daftar Renewal
                    </Button>
                </Box>

                {/* Header */}
                <Paper elevation={0} sx={{ p: 4, mb: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff', position: 'relative' }}>
                    {!isTerminal && (
                        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                            <Stack direction="row" spacing={1}>
                                {!editing && (
                                    <Button variant="outlined" size="small" startIcon={<Icon icon="mdi:pencil" width={16} />}
                                        onClick={startEdit}
                                        sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#E2E8F0', color: '#1E40AF' }}>
                                        Edit
                                    </Button>
                                )}
                                <Tooltip title={completeBlockReason || ''} arrow disableHoverListener={canComplete}>
                                    <span>
                                        <Button variant="contained" size="small"
                                            startIcon={<Icon icon="mdi:flag-checkered" width={16} />}
                                            onClick={() => setCompleteDialog(true)}
                                            disabled={!canComplete}
                                            sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, '&.Mui-disabled': { bgcolor: '#E2E8F0', color: '#94A3B8' } }}>
                                            Selesaikan Renewal
                                        </Button>
                                    </span>
                                </Tooltip>
                            </Stack>
                        </Box>
                    )}
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ bgcolor: '#EFF6FF', borderRadius: 2, p: 1.5, display: 'flex' }}>
                            <Icon icon="mdi:arrow-u-right-top" width={36} color="#1E40AF" />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B', mb: 0.5 }}>
                                {renewal.customerName || '-'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748B', mb: 1 }}>
                                {renewal.policySummary || '-'}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                <Chip label={renewal.status} size="small"
                                    icon={<Icon icon={statusCfg.icon} width={14} style={{ color: statusCfg.color }} />}
                                    sx={{ bgcolor: statusCfg.bg, color: statusCfg.color, fontWeight: 700, fontSize: '0.75rem', borderRadius: '8px' }} />
                                <Typography variant="caption" sx={{ color: '#94A3B8' }}>#{renewal.id}</Typography>
                            </Stack>
                        </Box>
                    </Stack>

                    {/* Payment blocking banner */}
                    {paymentBlocking && (
                        <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }} icon={<Icon icon="mdi:alert-circle-outline" />}>
                            <strong>Renewal belum bisa diselesaikan.</strong> Payment terkait (<code>{renewal.paymentId}</code>) masih berstatus <strong>{payment?.status}</strong>. Update payment ke <strong>Paid</strong> terlebih dahulu.
                        </Alert>
                    )}
                    {isCompleted && (
                        <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }} icon={<Icon icon="mdi:flag-checkered" />}>
                            Renewal selesai. Polis telah diperpanjang pada {formatDate(renewal.completedAt)}.
                        </Alert>
                    )}
                    {isCancelled && (
                        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                            Renewal ini sudah dibatalkan.
                        </Alert>
                    )}
                </Paper>

                {/* Content grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                    {/* Periode Polis */}
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icon icon="mdi:calendar-sync" width={20} color="#1E40AF" /> Periode Polis
                        </Typography>
                        <Box sx={{ bgcolor: '#FEF3C7', borderRadius: 2, p: 2, mb: 2 }}>
                            <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.62rem' }}>Periode Lama</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#78350F', mt: 0.3 }}>
                                {formatDate(renewal.oldStartDate)} → {formatDate(renewal.oldEndDate)}
                            </Typography>
                        </Box>
                        <Box sx={{ bgcolor: '#D1FAE5', borderRadius: 2, p: 2 }}>
                            <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.62rem' }}>Periode Baru</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#064E3B', mt: 0.3 }}>
                                {formatDate(renewal.newStartDate)} → {formatDate(renewal.newEndDate)}
                            </Typography>
                        </Box>
                    </Paper>

                    {/* Info Finansial */}
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icon icon="mdi:cash" width={20} color="#1E40AF" /> Finansial
                        </Typography>
                        <InfoRow label="Premi" value={formatCurrency(renewal.premium)} icon="mdi:cash-multiple" />
                        <InfoRow label="Tipe Polis" value={renewal.policyType === 'car' ? 'Kendaraan' : 'Properti'} icon="mdi:file-document-outline" />
                        <InfoRow label="ID Renewal" value={renewal.id} icon="mdi:identifier" />
                        {renewal.completedAt && <InfoRow label="Selesai Pada" value={formatDate(renewal.completedAt)} icon="mdi:calendar-check" />}
                    </Paper>

                    {/* Payment info */}
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icon icon="mdi:receipt-text" width={20} color="#1E40AF" /> Payment Record
                        </Typography>
                        {renewal.paymentId ? (
                            payment ? (
                                <Box>
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                        <Chip label={payment.status} size="small"
                                            sx={{ bgcolor: PAYMENT_STATUS_CONFIG[payment.status]?.bg || '#F1F5F9', color: PAYMENT_STATUS_CONFIG[payment.status]?.color || '#475569', fontWeight: 700, fontSize: '0.72rem' }} />
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748B' }}>{payment.id}</Typography>
                                    </Stack>
                                    <InfoRow label="Jumlah" value={formatCurrency(payment.amount)} icon="mdi:cash" />
                                    <InfoRow label="Metode" value={payment.paymentMethod || '-'} icon="mdi:credit-card-outline" />
                                    <InfoRow label="Tanggal Bayar" value={formatDate(payment.paidDate)} icon="mdi:calendar-check" />
                                </Box>
                            ) : (
                                <Typography variant="body2" sx={{ color: '#94A3B8' }}>Memuat data payment...</Typography>
                            )
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 3 }}>
                                <Icon icon="mdi:receipt-text-remove" width={40} color="#CBD5E1" />
                                <Typography variant="body2" sx={{ color: '#94A3B8', mt: 1 }}>Tidak ada payment yang dihubungkan</Typography>
                                <Typography variant="caption" sx={{ color: '#CBD5E1' }}>Renewal bisa diselesaikan tanpa payment</Typography>
                            </Box>
                        )}
                    </Paper>

                    {/* Notes */}
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#fff' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icon icon="mdi:note-text-outline" width={20} color="#1E40AF" /> Catatan
                        </Typography>
                        <Typography variant="body2" sx={{ color: renewal.notes ? '#1E293B' : '#94A3B8', fontStyle: renewal.notes ? 'normal' : 'italic' }}>
                            {renewal.notes || 'Tidak ada catatan'}
                        </Typography>
                    </Paper>
                </Box>

                {/* Edit Form */}
                {editing && (
                    <Paper elevation={0} sx={{ p: 3, mt: 3, borderRadius: 3, border: '2px solid #1E40AF', bgcolor: '#F0F9FF' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E40AF', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icon icon="mdi:pencil" width={20} /> Edit Renewal
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <TextField size="small" type="date" label="Tanggal Mulai Baru" InputLabelProps={{ shrink: true }}
                                value={editData.newStartDate} onChange={e => setEditData(p => ({ ...p, newStartDate: e.target.value }))} />
                            <TextField size="small" type="date" label="Tanggal Berakhir Baru" InputLabelProps={{ shrink: true }}
                                value={editData.newEndDate} onChange={e => setEditData(p => ({ ...p, newEndDate: e.target.value }))} />
                            <TextField size="small" label="Premi (Rp)" value={editData.premium}
                                onChange={e => setEditData(p => ({ ...p, premium: e.target.value }))}
                                helperText={editData.premium ? formatCurrency(Number(editData.premium)) : ''} />
                            <FormControl size="small">
                                <InputLabel>Status</InputLabel>
                                <Select value={editData.status} label="Status" onChange={e => setEditData(p => ({ ...p, status: e.target.value }))}>
                                    {ALLOWED_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl size="small" disabled={loadingPayments} sx={{ gridColumn: { sm: 'span 2' } }}>
                                <InputLabel>Payment Record *</InputLabel>
                                <Select value={editData.paymentId} label="Payment Record *" onChange={e => setEditData(p => ({ ...p, paymentId: e.target.value }))}>
                                    {allPayments.map(p => (
                                        <MenuItem key={p.id} value={p.id}>{p.id} · {p.status} · {formatCurrency(p.amount)}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField size="small" label="Catatan" multiline rows={2} value={editData.notes}
                                onChange={e => setEditData(p => ({ ...p, notes: e.target.value }))}
                                sx={{ gridColumn: { sm: 'span 2' } }} />
                        </Box>
                        <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 2 }}>
                            <Button variant="outlined" onClick={() => setEditing(false)} disabled={saving}
                                sx={{ textTransform: 'none', borderColor: '#E2E8F0', color: '#475569' }}>Batal</Button>
                            <Button variant="contained" onClick={handleSave} disabled={saving}
                                sx={{ textTransform: 'none', bgcolor: '#1E40AF', '&:hover': { bgcolor: '#1E3A8A' } }}>
                                {saving ? <CircularProgress size={18} color="inherit" /> : 'Simpan Perubahan'}
                            </Button>
                        </Stack>
                    </Paper>
                )}
            </Container>

            {/* Complete confirmation dialog */}
            <Dialog open={completeDialog} onClose={() => setCompleteDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <Box sx={{ p: 3 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                        <Box sx={{ bgcolor: '#D1FAE5', borderRadius: 2, p: 1, display: 'flex' }}>
                            <Icon icon="mdi:flag-checkered" width={24} color="#059669" />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Selesaikan Renewal</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Konfirmasi untuk menyelesaikan renewal ini:
                    </Typography>
                    <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 2, mb: 3, border: '1px solid #E2E8F0' }}>
                        <Typography variant="body2" sx={{ color: '#64748B', mb: 0.5 }}>Periode polis akan diperbarui menjadi:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669' }}>
                            {formatDate(renewal.newStartDate)} → {formatDate(renewal.newEndDate)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>Status polis akan kembali ke Active</Typography>
                    </Box>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button variant="outlined" onClick={() => setCompleteDialog(false)} disabled={completing}
                            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#E2E8F0', color: '#475569' }}>Batal</Button>
                        <Button variant="contained" onClick={handleComplete} disabled={completing}
                            sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}>
                            {completing ? <CircularProgress size={20} color="inherit" /> : 'Ya, Selesaikan'}
                        </Button>
                    </Stack>
                </Box>
            </Dialog>
        </Box>
    );
}
