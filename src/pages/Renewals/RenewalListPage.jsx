import { Icon } from '@iconify/react';
import {
    Box, Button, Card, CardContent, Chip, CircularProgress,
    Dialog, Drawer, IconButton, InputAdornment,
    List, ListItemButton, ListItemIcon, ListItemText,
    Stack, TextField, Typography, useMediaQuery, useTheme
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
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const STATUS_CONFIG = {
    Pending:   { bg: '#FEF3C7', color: '#92400E' },
    Approved:  { bg: '#DBEAFE', color: '#1E40AF' },
    Completed: { bg: '#EDE9FE', color: '#5B21B6' },
    Cancelled: { bg: '#F1F5F9', color: '#475569' },
};
const ALL_STATUSES = ['ALL', 'Pending', 'Approved', 'Completed', 'Cancelled'];

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

    useEffect(() => {
        let filtered = [...allRenewals];
        if (selectedStatus !== 'ALL') filtered = filtered.filter(r => r.status === selectedStatus);
        if (keyword) {
            const kw = keyword.toLowerCase();
            filtered = filtered.filter(r =>
                (r.customerName || '').toLowerCase().includes(kw) ||
                (r.carSummary || r.policySummary || '').toLowerCase().includes(kw) ||
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
                    <Typography variant="caption" color="textSecondary">{row.carSummary || row.policySummary || '-'}</Typography>
                </Box>
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
            title: 'Status', dataIndex: 'status', key: 'status', sortable: true,
            render: (v) => {
                const cfg = STATUS_CONFIG[v] || STATUS_CONFIG.Pending;
                return <Box sx={{ bgcolor: cfg.bg, color: cfg.color, px: 1, py: 0.3, borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-block' }}>{v}</Box>;
            }
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
                (r.carSummary || r.policySummary || '').toLowerCase().includes(kw)
            );
        }
        const paginated = filtered.slice(0, mobileVisibleCount);
        const hasMore = mobileVisibleCount < filtered.length;

        return (
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', minHeight: '100%' }}>
                {/* Search + Add */}
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                    <TextField
                        fullWidth placeholder="Cari renewal..."
                        size="small"
                        value={mobileKeyword}
                        onChange={e => setMobileKeyword(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" color="#94A3B8" width={18} /></InputAdornment>,
                            sx: { borderRadius: '10px', bgcolor: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' } }
                        }}
                    />
                    <IconButton onClick={() => setIsCreateOpen(true)}
                        sx={{ bgcolor: '#1E3A8A', color: '#fff', borderRadius: '12px', width: 42, height: 42, flexShrink: 0, '&:hover': { bgcolor: '#1e40af' } }}>
                        <Icon icon="mdi:plus" width={22} />
                    </IconButton>
                </Stack>

                {/* Status filter chips */}
                <Box sx={{ display: 'flex', gap: 0.8, overflowX: 'auto', pb: 1.5, mb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
                    {summaries.map(s => (
                        <Chip key={s.status}
                            label={`${s.status === 'ALL' ? 'Semua' : s.status} (${s.total})`}
                            onClick={() => setSelectedStatus(s.status)}
                            sx={{
                                bgcolor: selectedStatus === s.status ? '#1E3A8A' : '#fff',
                                color: selectedStatus === s.status ? '#fff' : '#64748B',
                                border: '1px solid', borderColor: selectedStatus === s.status ? '#1E3A8A' : '#E2E8F0',
                                fontWeight: 600, fontSize: '0.72rem', height: 32, borderRadius: '20px', flexShrink: 0
                            }} />
                    ))}
                </Box>

                {/* Cards */}
                {paginated.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Icon icon="mdi:arrow-u-right-top" width={56} color="#CBD5E1" />
                        <Typography variant="body2" sx={{ mt: 2, color: '#94A3B8', fontWeight: 500 }}>Tidak ada renewal ditemukan</Typography>
                    </Box>
                ) : (
                    <Stack spacing={1}>
                        {paginated.map(r => {
                            const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.Pending;
                            return (
                                <Card key={r.id} onClick={() => navigate(`/renewals/${r.id}`)}
                                    sx={{ borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9', cursor: 'pointer' }}>
                                    <CardContent sx={{ p: '12px 14px !important' }}>
                                        {/* Row 1: icon + name + status + dots */}
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Box sx={{
                                                width: 34, height: 34, borderRadius: '9px', flexShrink: 0,
                                                bgcolor: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Icon icon="mdi:arrow-u-right-top" width={17} color={cfg.color} />
                                            </Box>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E293B', lineHeight: 1.2 }} noWrap>
                                                    {r.customerName || '-'}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.71rem', color: '#94A3B8' }} noWrap>
                                                    {r.carSummary || r.policySummary || '-'}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ bgcolor: cfg.bg, color: cfg.color, px: 0.8, py: 0.2, borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                {r.status}
                                            </Box>
                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDrawerRenewal(r); setActionDrawerOpen(true); }}
                                                sx={{ p: 0.2, flexShrink: 0 }}>
                                                <Icon icon="mdi:dots-vertical" width={16} color="#CBD5E1" />
                                            </IconButton>
                                        </Stack>

                                        {/* Row 2: date + premium + payment dot */}
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.9, pt: 0.9, borderTop: '1px dashed #F1F5F9' }}>
                                            <Stack direction="row" alignItems="center" spacing={0.4} sx={{ flex: 1, minWidth: 0 }}>
                                                <Icon icon="mdi:calendar-arrow-right" width={13} color="#94A3B8" style={{ flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: '0.71rem', color: '#1E40AF', fontWeight: 600 }} noWrap>
                                                    {formatDate(r.newStartDate)} – {formatDate(r.newEndDate)}
                                                </Typography>
                                            </Stack>
                                            <Box sx={{
                                                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                                                bgcolor: r.paymentId ? '#10B981' : '#F59E0B'
                                            }} />
                                        </Stack>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Stack>
                )}
                {mobileLoadingMore && <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress size={22} sx={{ color: '#1E3A8A' }} /></Box>}
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
                            <Typography variant="body2" color="text.secondary">{drawerRenewal.carSummary || drawerRenewal.policySummary}</Typography>
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
