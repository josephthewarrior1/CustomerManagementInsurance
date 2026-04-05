import { Icon } from '@iconify/react';
import {
    Avatar, Box, Button, Card, CardContent, Chip, CircularProgress,
    Container, Dialog, Divider, Drawer, Grid, IconButton, InputAdornment,
    List, ListItemButton, ListItemIcon, ListItemText,
    Menu, MenuItem, Stack, TextField, Typography, useMediaQuery, useTheme
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useLoading } from '../../hooks/LoadingProvider';
import RenewalDAO from '../../daos/RenewalDao';
import CreateRenewalDialog from './CreateRenewalDialog';
import {
    CustomButton, CustomDashboardStatsCard, CustomDatatable,
    CustomIcon, CustomRow, CustomTextInput,
} from '../../reusables';
import CustomColumn from '../../reusables/layouts/CustomColumn';

/* ── helpers ─────────────────────────────────────────────────────────── */
const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};
const formatCurrency = (v) => {
    if (!v && v !== 0) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);
};

const STATUS_CONFIG = {
    Pending:   { bg: '#FEF3C7', color: '#92400E' },
    Approved:  { bg: '#DBEAFE', color: '#1E40AF' },
    Paid:      { bg: '#D1FAE5', color: '#065F46' },
    Completed: { bg: '#EDE9FE', color: '#5B21B6' },
    Cancelled: { bg: '#F1F5F9', color: '#475569' },
};
const ALL_STATUSES = ['ALL', 'Pending', 'Approved', 'Paid', 'Completed', 'Cancelled'];

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
    return <Chip label={status || '-'} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: '0.7rem', borderRadius: '8px' }} />;
}

/* ── main component ─────────────────────────────────────────────────── */
export default function RenewalListPage() {
    const navigate = useNavigate();
    const loading = useLoading();
    const message = useAlert();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [allRenewals, setAllRenewals] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [keyword, setKeyword] = useState('');
    const [mobileKeyword, setMobileKeyword] = useState('');
    const [dataSource, setDataSource] = useState([]);
    const [tableOpts, setTableOpts] = useState({ page: 0, limit: 10, total: 0, sortColumn: '', sortDirection: 'asc' });
    const [summaries, setSummaries] = useState([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [actionDrawerOpen, setActionDrawerOpen] = useState(false);
    const [drawerRenewal, setDrawerRenewal] = useState(null);
    const [cancelDialog, setCancelDialog] = useState({ open: false, renewal: null });
    const [cancelling, setCancelling] = useState(false);
    const [mobileVisibleCount, setMobileVisibleCount] = useState(10);
    const [mobileLoadingMore, setMobileLoadingMore] = useState(false);

    const sentinelRef = useCallback((node) => {
        if (!node) return;
        const timer = setTimeout(() => {
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    setMobileLoadingMore(true);
                    setTimeout(() => { setMobileVisibleCount(p => p + 10); setMobileLoadingMore(false); }, 300);
                }
            }, { threshold: 1.0 });
            observer.observe(node);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const fetchRenewals = async () => {
        try {
            loading.start();
            const res = await RenewalDAO.getAllRenewals();
            if (res.success) {
                const list = res.renewals || [];
                setAllRenewals(list);
                // Stats
                const counts = {};
                ALL_STATUSES.forEach(s => counts[s] = s === 'ALL' ? list.length : 0);
                list.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
                setSummaries(ALL_STATUSES.map(s => ({ status: s, total: counts[s] })));
            } else {
                message(res.error || 'Gagal memuat daftar renewal', 'error');
            }
        } catch (err) {
            console.error(err);
            message('Gagal memuat daftar renewal', 'error');
        } finally {
            loading.stop();
        }
    };

    useEffect(() => { fetchRenewals(); }, []);

    // ── compute filtered/paginated data for desktop table ────────────────────
    useEffect(() => {
        let filtered = [...allRenewals];
        if (selectedStatus !== 'ALL') filtered = filtered.filter(r => r.status === selectedStatus);
        if (keyword) {
            const kw = keyword.toLowerCase();
            filtered = filtered.filter(r =>
                (r.customerName || '').toLowerCase().includes(kw) ||
                (r.policySummary || '').toLowerCase().includes(kw) ||
                (r.id || '').toLowerCase().includes(kw)
            );
        }
        if (tableOpts.sortColumn) {
            filtered.sort((a, b) => {
                const av = a[tableOpts.sortColumn] || '';
                const bv = b[tableOpts.sortColumn] || '';
                return tableOpts.sortDirection === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
            });
        }
        const start = tableOpts.page * tableOpts.limit;
        setDataSource(filtered.slice(start, start + tableOpts.limit));
        setTableOpts(p => ({ ...p, total: filtered.length }));
    }, [allRenewals, selectedStatus, keyword, tableOpts.page, tableOpts.limit, tableOpts.sortColumn, tableOpts.sortDirection]);

    useEffect(() => { setMobileVisibleCount(10); }, [selectedStatus, mobileKeyword]);

    // ── cancel renewal ────────────────────────────────────────────────────────
    const handleCancel = async () => {
        if (!cancelDialog.renewal) return;
        setCancelling(true);
        try {
            const res = await RenewalDAO.updateRenewal(cancelDialog.renewal.id, { status: 'Cancelled' });
            if (res.success) {
                message('Renewal dibatalkan', 'success');
                fetchRenewals();
            } else {
                message(res.error || 'Gagal membatalkan renewal', 'error');
            }
        } catch {
            message('Gagal membatalkan renewal', 'error');
        } finally {
            setCancelling(false);
            setCancelDialog({ open: false, renewal: null });
        }
    };

    // ── columns ───────────────────────────────────────────────────────────────
    const columns = [
        {
            title: 'ID', dataIndex: 'id', key: 'id', sortable: false,
            render: (v) => <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748B' }}>{v}</Typography>
        },
        {
            title: 'Customer / Kendaraan', dataIndex: 'customerName', key: 'customerName', sortable: true,
            render: (_, row) => (
                <Box>
                    <Typography variant="body2" fontWeight={600}>{row.customerName || '-'}</Typography>
                    <Typography variant="caption" color="textSecondary">{row.policySummary || '-'}</Typography>
                </Box>
            )
        },
        {
            title: 'Periode Lama', dataIndex: 'oldEndDate', key: 'oldEndDate', sortable: false,
            render: (_, row) => (
                <Typography variant="caption" sx={{ color: '#475569' }}>
                    {formatDate(row.oldStartDate)} → {formatDate(row.oldEndDate)}
                </Typography>
            )
        },
        {
            title: 'Periode Baru', dataIndex: 'newEndDate', key: 'newEndDate', sortable: false,
            render: (_, row) => (
                <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 600 }}>
                    {formatDate(row.newStartDate)} → {formatDate(row.newEndDate)}
                </Typography>
            )
        },
        {
            title: 'Premi', dataIndex: 'premium', key: 'premium', sortable: true,
            render: (v) => <Typography variant="body2" fontWeight={500}>{formatCurrency(v)}</Typography>
        },
        {
            title: 'Status', dataIndex: 'status', key: 'status', sortable: true,
            render: (v) => <StatusBadge status={v} />
        },
        {
            title: 'Aksi', dataIndex: 'actions', key: 'actions', sortable: false,
            render: (_, row) => (
                <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => navigate(`/renewals/${row.id}`)} sx={{ borderRadius: 0.8, color: '#475569' }}>
                        <Icon icon="mdi:eye-outline" />
                    </IconButton>
                    {row.status !== 'Completed' && row.status !== 'Cancelled' && (
                        <IconButton size="small" onClick={() => setCancelDialog({ open: true, renewal: row })} sx={{ borderRadius: 0.8, color: '#DC2626' }}>
                            <Icon icon="mdi:close-circle-outline" />
                        </IconButton>
                    )}
                </Stack>
            )
        },
    ];

    /* ── Mobile view ─────────────────────────────────────────────────────── */
    const renderMobile = () => {
        let filtered = [...allRenewals];
        if (selectedStatus !== 'ALL') filtered = filtered.filter(r => r.status === selectedStatus);
        if (mobileKeyword) {
            const kw = mobileKeyword.toLowerCase();
            filtered = filtered.filter(r =>
                (r.customerName || '').toLowerCase().includes(kw) ||
                (r.policySummary || '').toLowerCase().includes(kw)
            );
        }
        const paginated = filtered.slice(0, mobileVisibleCount);
        const hasMore = mobileVisibleCount < filtered.length;

        return (
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', minHeight: '100%' }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <TextField
                        fullWidth placeholder="Cari renewal..."
                        value={mobileKeyword}
                        onChange={e => setMobileKeyword(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" color="#94A3B8" /></InputAdornment>,
                            sx: { borderRadius: '12px', bgcolor: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' } }
                        }}
                    />
                    <IconButton onClick={() => setIsCreateOpen(true)}
                        sx={{ bgcolor: '#1E3A8A', color: '#fff', borderRadius: '12px', width: 48, height: 48, flexShrink: 0, '&:hover': { bgcolor: '#1e40af' }, boxShadow: '0 4px 12px rgba(30,58,138,0.3)' }}>
                        <Icon icon="mdi:plus" width={24} />
                    </IconButton>
                </Stack>

                {/* Status filter chips */}
                <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 2, mb: 1 }}>
                    {summaries.map(s => (
                        <Chip key={s.status} label={`${s.status} (${s.total})`} onClick={() => setSelectedStatus(s.status)}
                            sx={{ border: '1px solid', borderColor: selectedStatus === s.status ? '#1E3A8A' : '#E2E8F0', bgcolor: selectedStatus === s.status ? '#1E3A8A' : '#fff', color: selectedStatus === s.status ? '#fff' : '#64748B', fontWeight: 600, height: 38, borderRadius: '20px', flexShrink: 0 }} />
                    ))}
                </Box>

                {paginated.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Icon icon="mdi:arrow-u-right-top" width={64} color="#CBD5E1" />
                        <Typography variant="body1" sx={{ mt: 2, color: '#94A3B8', fontWeight: 500 }}>Tidak ada renewal ditemukan</Typography>
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {paginated.map(r => (
                            <Card key={r.id} onClick={() => navigate(`/renewals/${r.id}`)}
                                sx={{ borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9', cursor: 'pointer' }}>
                                <CardContent sx={{ p: '16px !important' }}>
                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                                        <Avatar sx={{ width: 44, height: 44, bgcolor: '#EFF6FF', color: '#1E40AF' }}>
                                            <Icon icon="mdi:arrow-u-right-top" width={22} />
                                        </Avatar>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }} noWrap>{r.customerName || '-'}</Typography>
                                            <Typography variant="caption" sx={{ color: '#64748B' }} noWrap>{r.policySummary || '-'}</Typography>
                                        </Box>
                                        <StatusBadge status={r.status} />
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDrawerRenewal(r); setActionDrawerOpen(true); }}>
                                            <Icon icon="mdi:dots-vertical" width={20} color="#64748B" />
                                        </IconButton>
                                    </Stack>
                                    <Divider sx={{ mb: 1.5, borderStyle: 'dashed' }} />
                                    <Grid container spacing={1.5}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.6rem' }}>Periode Lama</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569', fontSize: '0.78rem' }}>{formatDate(row => r.oldEndDate)}{formatDate(r.oldEndDate)}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.6rem' }}>Periode Baru</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E40AF', fontSize: '0.78rem' }}>{formatDate(r.newEndDate)}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.6rem' }}>Premi</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.78rem' }}>{formatCurrency(r.premium)}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.6rem' }}>Payment</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#64748B', fontSize: '0.78rem' }}>{r.paymentId ? r.paymentId : '-'}</Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}
                {mobileLoadingMore && <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} sx={{ color: '#1E3A8A' }} /></Box>}
                {hasMore && !mobileLoadingMore && <Box ref={sentinelRef} sx={{ height: 1, width: '100%' }} />}
            </Box>
        );
    };

    /* ── Desktop view ────────────────────────────────────────────────────── */
    const renderDesktop = () => (
        <CustomColumn className="gap-y-8 max-h-full">
            <CustomRow className="gap-x-4">
                <CustomTextInput
                    placeholder="Cari renewal..."
                    searchIcon
                    onKeyPress={e => { if (e.key === 'Enter') setKeyword(e.target.value); }}
                />
                <CustomRow className="justify-center gap-x-4">
                    <CustomButton startIcon={<CustomIcon icon="heroicons:plus" />} onClick={() => setIsCreateOpen(true)} color="secondary">
                        Buat Renewal
                    </CustomButton>
                </CustomRow>
            </CustomRow>

            {/* Stats */}
            <CustomRow className="lg:gap-x-6 md:gap-x-2 sm:gap-x-0 items-start" style={{ flexWrap: 'wrap', gap: 8 }}>
                {summaries.map(s => (
                    <div key={s.status}
                        onClick={() => setSelectedStatus(s.status)}
                        className={`cursor-pointer rounded-lg transition-all duration-200 ${selectedStatus === s.status ? 'border-2 border-blue-500' : 'border border-transparent'}`}
                        style={{ minWidth: 120, flex: 1 }}>
                        <CustomDashboardStatsCard value={s.total} label={s.status} className="w-full h-full" />
                    </div>
                ))}
            </CustomRow>

            <CustomDatatable
                dataSource={dataSource}
                columns={columns}
                page={tableOpts.page}
                limit={tableOpts.limit}
                totalRecords={tableOpts.total}
                handlePageChange={p => setTableOpts(prev => ({ ...prev, page: p }))}
                handleLimitChange={l => setTableOpts(prev => ({ ...prev, limit: l, page: 0 }))}
                handleSort={col => setTableOpts(prev => ({ ...prev, sortColumn: col, sortDirection: prev.sortColumn === col ? (prev.sortDirection === 'asc' ? 'desc' : 'asc') : 'asc' }))}
                sortColumn={tableOpts.sortColumn}
                sortDirection={tableOpts.sortDirection}
            />
        </CustomColumn>
    );

    return (
        <>
            {isMobile ? renderMobile() : renderDesktop()}

            {/* Create Dialog */}
            <CreateRenewalDialog
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onCreated={() => { setIsCreateOpen(false); fetchRenewals(); }}
            />

            {/* Cancel confirmation */}
            <Dialog open={cancelDialog.open} onClose={() => setCancelDialog({ open: false, renewal: null })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Batalkan Renewal</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Yakin ingin membatalkan renewal <b>{cancelDialog.renewal?.id}</b>? Status akan diubah ke <b>Cancelled</b>.
                    </Typography>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button variant="outlined" onClick={() => setCancelDialog({ open: false, renewal: null })} disabled={cancelling}
                            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#E2E8F0', color: '#475569' }}>Batal</Button>
                        <Button variant="contained" onClick={handleCancel} disabled={cancelling}
                            sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}>
                            {cancelling ? <CircularProgress size={20} color="inherit" /> : 'Ya, Batalkan'}
                        </Button>
                    </Stack>
                </Box>
            </Dialog>

            {/* Mobile action drawer */}
            <Drawer anchor="bottom" open={actionDrawerOpen} onClose={() => setActionDrawerOpen(false)}
                PaperProps={{ sx: { borderTopLeftRadius: '24px', borderTopRightRadius: '24px', p: 2 } }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{ width: 40, height: 4, bgcolor: '#E2E8F0', borderRadius: 2 }} />
                </Box>
                {drawerRenewal && (
                    <>
                        <Box sx={{ mb: 2, px: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{drawerRenewal.customerName}</Typography>
                            <Typography variant="body2" color="text.secondary">{drawerRenewal.policySummary}</Typography>
                        </Box>
                        <List sx={{ pb: 3 }}>
                            <ListItemButton onClick={() => { setActionDrawerOpen(false); navigate(`/renewals/${drawerRenewal.id}`); }} sx={{ borderRadius: '12px', mb: 1 }}>
                                <ListItemIcon><Icon icon="mdi:eye-outline" width={22} color="#1E40AF" /></ListItemIcon>
                                <ListItemText primary="Lihat Detail" primaryTypographyProps={{ fontWeight: 600, color: '#1E40AF' }} />
                            </ListItemButton>
                            {drawerRenewal.status !== 'Completed' && drawerRenewal.status !== 'Cancelled' && (
                                <ListItemButton onClick={() => { setActionDrawerOpen(false); setCancelDialog({ open: true, renewal: drawerRenewal }); }} sx={{ borderRadius: '12px' }}>
                                    <ListItemIcon><Icon icon="mdi:close-circle-outline" width={22} color="#DC2626" /></ListItemIcon>
                                    <ListItemText primary="Batalkan Renewal" primaryTypographyProps={{ fontWeight: 600, color: '#DC2626' }} />
                                </ListItemButton>
                            )}
                        </List>
                    </>
                )}
            </Drawer>
        </>
    );
}
