import { Icon } from '@iconify/react';
import {
    Avatar, Box, Button, Card, CardContent, Chip, CircularProgress,
    Dialog, Divider, Drawer, Grid, IconButton, InputAdornment,
    List, ListItemButton, ListItemIcon, ListItemText,
    Stack, TextField, Typography, useMediaQuery, useTheme
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useLoading } from '../../hooks/LoadingProvider';
import PaymentDAO from '../../daos/PaymentDao';
import CreatePaymentDialog from './CreatePaymentDialog';
import {
    CustomButton, CustomDashboardStatsCard, CustomDatatable,
    CustomIcon, CustomRow, CustomTextInput,
} from '../../reusables';
import CustomColumn from '../../reusables/layouts/CustomColumn';

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
    Paid:      { bg: '#D1FAE5', color: '#065F46' },
    Overdue:   { bg: '#FEE2E2', color: '#991B1B' },
    Cancelled: { bg: '#F1F5F9', color: '#475569' },
};
const ALL_STATUSES = ['ALL', 'Pending', 'Paid', 'Overdue', 'Cancelled'];

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
    return <Chip label={status || '-'} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: '0.7rem', borderRadius: '8px' }} />;
}

export default function PaymentListPage() {
    const navigate = useNavigate();
    const loading = useLoading();
    const message = useAlert();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [allPayments, setAllPayments] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [keyword, setKeyword] = useState('');
    const [mobileKeyword, setMobileKeyword] = useState('');
    const [dataSource, setDataSource] = useState([]);
    const [tableOpts, setTableOpts] = useState({ page: 0, limit: 10, total: 0, sortColumn: '', sortDirection: 'asc' });
    const [summaries, setSummaries] = useState([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [actionDrawerOpen, setActionDrawerOpen] = useState(false);
    const [drawerPayment, setDrawerPayment] = useState(null);
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

    const fetchPayments = async () => {
        try {
            loading.start();
            const res = await PaymentDAO.getAllPayments();
            const list = res?.payments || res?.data || (Array.isArray(res) ? res : []);
            setAllPayments(list);
            
            // Stats
            const counts = {};
            ALL_STATUSES.forEach(s => counts[s] = s === 'ALL' ? list.length : 0);
            list.forEach(p => { if (counts[p.status] !== undefined) counts[p.status]++; });
            setSummaries(ALL_STATUSES.map(s => ({ status: s, total: counts[s] })));
        } catch (err) {
            console.error(err);
            message('Gagal memuat daftar payment', 'error');
        } finally {
            loading.stop();
        }
    };

    useEffect(() => { fetchPayments(); }, []);

    // Desktop Filtering
    useEffect(() => {
        let filtered = [...allPayments];
        if (selectedStatus !== 'ALL') filtered = filtered.filter(p => p.status === selectedStatus);
        if (keyword) {
            const kw = keyword.toLowerCase();
            filtered = filtered.filter(p =>
                (p.invoiceNumber || '').toLowerCase().includes(kw) ||
                (p.id || '').toLowerCase().includes(kw) ||
                (p.customerId || '').toLowerCase().includes(kw)
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
        setTableOpts(prev => ({ ...prev, total: filtered.length }));
    }, [allPayments, selectedStatus, keyword, tableOpts.page, tableOpts.limit, tableOpts.sortColumn, tableOpts.sortDirection]);

    useEffect(() => { setMobileVisibleCount(10); }, [selectedStatus, mobileKeyword]);

    const columns = [
        {
            title: 'Payment ID', dataIndex: 'id', key: 'id', sortable: false,
            render: (v) => <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748B' }}>{v}</Typography>
        },
        {
            title: 'Invoice / Policy', dataIndex: 'invoiceNumber', key: 'invoiceNumber', sortable: true,
            render: (_, row) => (
                <Box>
                    <Typography variant="body2" fontWeight={600}>{row.invoiceNumber || 'No Invoice'}</Typography>
                    <Typography variant="caption" color="textSecondary">{row.policyId || 'Tidak tertaut polis'}</Typography>
                </Box>
            )
        },
        {
            title: 'Jatuh Tempo', dataIndex: 'dueDate', key: 'dueDate', sortable: true,
            render: (v) => <Typography variant="body2">{formatDate(v)}</Typography>
        },
        {
            title: 'Dibayar Pada', dataIndex: 'paidDate', key: 'paidDate', sortable: true,
            render: (v, row) => <Typography variant="body2" sx={{ color: row.status === 'Paid' ? '#059669' : '#64748B' }}>{formatDate(v)}</Typography>
        },
        {
            title: 'Jumlah', dataIndex: 'amount', key: 'amount', sortable: true,
            render: (v) => <Typography variant="body2" fontWeight={600}>{formatCurrency(v)}</Typography>
        },
        {
            title: 'Status', dataIndex: 'status', key: 'status', sortable: true,
            render: (v) => <StatusBadge status={v} />
        },
        {
            title: 'Aksi', dataIndex: 'actions', key: 'actions', sortable: false,
            render: (_, row) => (
                <IconButton size="small" onClick={() => navigate(`/payments/${row.id}`)} sx={{ borderRadius: 0.8, color: '#475569' }}>
                    <Icon icon="mdi:eye-outline" />
                </IconButton>
            )
        },
    ];

    const renderMobile = () => {
        let filtered = [...allPayments];
        if (selectedStatus !== 'ALL') filtered = filtered.filter(p => p.status === selectedStatus);
        if (mobileKeyword) {
            const kw = mobileKeyword.toLowerCase();
            filtered = filtered.filter(p =>
                (p.invoiceNumber || '').toLowerCase().includes(kw) ||
                (p.id || '').toLowerCase().includes(kw)
            );
        }
        const paginated = filtered.slice(0, mobileVisibleCount);
        const hasMore = mobileVisibleCount < filtered.length;

        return (
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', minHeight: '100%' }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <TextField
                        fullWidth placeholder="Cari payment..." value={mobileKeyword} onChange={e => setMobileKeyword(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" color="#94A3B8" /></InputAdornment>,
                            sx: { borderRadius: '12px', bgcolor: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' } }
                        }}
                    />
                    <IconButton onClick={() => setIsCreateOpen(true)}
                        sx={{ bgcolor: '#DC2626', color: '#fff', borderRadius: '12px', width: 48, height: 48, flexShrink: 0, '&:hover': { bgcolor: '#B91C1C' }, boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}>
                        <Icon icon="mdi:plus" width={24} />
                    </IconButton>
                </Stack>

                <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 2, mb: 1 }}>
                    {summaries.map(s => (
                        <Chip key={s.status} label={`${s.status} (${s.total})`} onClick={() => setSelectedStatus(s.status)}
                            sx={{ border: '1px solid', borderColor: selectedStatus === s.status ? '#DC2626' : '#E2E8F0', bgcolor: selectedStatus === s.status ? '#DC2626' : '#fff', color: selectedStatus === s.status ? '#fff' : '#64748B', fontWeight: 600, height: 38, borderRadius: '20px', flexShrink: 0 }} />
                    ))}
                </Box>

                {paginated.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Icon icon="mdi:receipt-text" width={64} color="#CBD5E1" />
                        <Typography variant="body1" sx={{ mt: 2, color: '#94A3B8', fontWeight: 500 }}>Tidak ada payment ditemukan</Typography>
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {paginated.map(p => (
                            <Card key={p.id} onClick={() => navigate(`/payments/${p.id}`)}
                                sx={{ borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9', cursor: 'pointer' }}>
                                <CardContent sx={{ p: '16px !important' }}>
                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                                        <Avatar sx={{ width: 44, height: 44, bgcolor: '#FEF2F2', color: '#DC2626' }}>
                                            <Icon icon="mdi:receipt-text-outline" width={22} />
                                        </Avatar>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }} noWrap>{p.invoiceNumber || p.id}</Typography>
                                            <Typography variant="caption" sx={{ color: '#64748B' }} noWrap>{p.policyId || 'Tidak ada polis'}</Typography>
                                        </Box>
                                        <StatusBadge status={p.status} />
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDrawerPayment(p); setActionDrawerOpen(true); }}>
                                            <Icon icon="mdi:dots-vertical" width={20} color="#64748B" />
                                        </IconButton>
                                    </Stack>
                                    <Divider sx={{ mb: 1.5, borderStyle: 'dashed' }} />
                                    <Grid container spacing={1.5}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.6rem' }}>Total</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.78rem' }}>{formatCurrency(p.amount)}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.6rem' }}>Batas Waktu</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#991B1B', fontSize: '0.78rem' }}>{formatDate(p.dueDate)}</Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}
                {mobileLoadingMore && <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} sx={{ color: '#DC2626' }} /></Box>}
                {hasMore && !mobileLoadingMore && <Box ref={sentinelRef} sx={{ height: 1, width: '100%' }} />}
            </Box>
        );
    };

    const renderDesktop = () => (
        <CustomColumn className="gap-y-8 max-h-full">
            <CustomRow className="gap-x-4">
                <CustomTextInput
                    placeholder="Cari payment..."
                    searchIcon
                    onKeyPress={e => { if (e.key === 'Enter') setKeyword(e.target.value); }}
                />
                <CustomRow className="justify-center gap-x-4">
                    <CustomButton startIcon={<CustomIcon icon="heroicons:plus" />} onClick={() => setIsCreateOpen(true)}
                        style={{ backgroundColor: '#DC2626' }}>
                        Buat Payment
                    </CustomButton>
                </CustomRow>
            </CustomRow>

            <CustomRow className="lg:gap-x-6 md:gap-x-2 sm:gap-x-0 items-start" style={{ flexWrap: 'wrap', gap: 8 }}>
                {summaries.map(s => (
                    <div key={s.status}
                        onClick={() => setSelectedStatus(s.status)}
                        className={`cursor-pointer rounded-lg transition-all duration-200 ${selectedStatus === s.status ? 'border-2 border-red-500' : 'border border-transparent'}`}
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

            <CreatePaymentDialog
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onCreated={() => { setIsCreateOpen(false); fetchPayments(); }}
            />

            <Drawer anchor="bottom" open={actionDrawerOpen} onClose={() => setActionDrawerOpen(false)}
                PaperProps={{ sx: { borderTopLeftRadius: '24px', borderTopRightRadius: '24px', p: 2 } }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{ width: 40, height: 4, bgcolor: '#E2E8F0', borderRadius: 2 }} />
                </Box>
                {drawerPayment && (
                    <>
                        <Box sx={{ mb: 2, px: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{drawerPayment.invoiceNumber || drawerPayment.id}</Typography>
                            <Typography variant="body2" color="text.secondary">{formatCurrency(drawerPayment.amount)}</Typography>
                        </Box>
                        <List sx={{ pb: 3 }}>
                            <ListItemButton onClick={() => { setActionDrawerOpen(false); navigate(`/payments/${drawerPayment.id}`); }} sx={{ borderRadius: '12px' }}>
                                <ListItemIcon><Icon icon="mdi:eye-outline" width={22} color="#1E40AF" /></ListItemIcon>
                                <ListItemText primary="Lihat Detail" primaryTypographyProps={{ fontWeight: 600, color: '#1E40AF' }} />
                            </ListItemButton>
                        </List>
                    </>
                )}
            </Drawer>
        </>
    );
}
