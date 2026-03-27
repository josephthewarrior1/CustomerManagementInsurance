import { Icon } from '@iconify/react';
import {
    Box,
    Dialog,
    IconButton,
    Typography,
    Button,
    Chip,
    Avatar,
    TextField,
    InputAdornment,
    Card,
    CardContent,
    useMediaQuery,
    useTheme,
    MenuItem,
    Stack,
    Menu,
    ListItemIcon,
    ListItemText,
    Drawer,
    List,
    ListItemButton
} from '@mui/material';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useUser } from '../../hooks/UserProvider';
import CustomerDAO from '../../daos/CustomerDao';
import CreateCustomerDialog from './CreateCustomerDialog';
import ViewCustomerDialog from './ViewCustomerDialog';
import {
    CustomButton,
    CustomDashboardStatsCard,
    CustomDatatable,
    CustomIcon,
    CustomRow,
    CustomTextInput,
} from '../../reusables';
import CustomColumn from '../../reusables/layouts/CustomColumn';

export default function CustomerListPage() {
    const { user } = useUser();
    const [allCustomers, setAllCustomers] = useState([]);
    const [dataSource, setDataSource] = useState([]);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [dataSourceOptions, setDataSourceOptions] = useState({
        keyword: '',
        page: 0,
        limit: 10,
        total: 0,
        sortColumn: '',
        sortDirection: 'asc',
    });
    const [summaries, setSummaries] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState("ALL");

    // Status Menu State
    const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
    const [statusCustomer, setStatusCustomer] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Mobile search input state
    const [mobileSearchInput, setMobileSearchInput] = useState('');

    const [actionDrawerOpen, setActionDrawerOpen] = useState(false);
    const [drawerCustomer, setDrawerCustomer] = useState(null);
    const [mobileVisibleCount, setMobileVisibleCount] = useState(10);
    const mobileFilteredCountRef = useRef(0);
    const sentinelRef = useRef(null);

    const message = useAlert();
    const loading = useLoading();
    const navigate = useNavigate();

    const handleOpenDrawer = (e, customer) => {
        e.stopPropagation();
        setDrawerCustomer(customer);
        setActionDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setActionDrawerOpen(false);
        setDrawerCustomer(null);
    };

    // Sync mobile search input if keyword changes externally
    useEffect(() => {
        setMobileSearchInput(dataSourceOptions.keyword);
    }, [dataSourceOptions.keyword]);

    // Reset visible count when filter/search changes
    useEffect(() => {
        setMobileVisibleCount(10);
    }, [dataSourceOptions.keyword, selectedStatus]);

    // Infinite scroll: listen on nearest scrollable parent (mobile only)
    useEffect(() => {
        if (!isMobile) return;

        // Find the nearest scrollable ancestor of the sentinel
        const getScrollParent = (node) => {
            if (!node || node === document.body) return window;
            const { overflow, overflowY } = window.getComputedStyle(node);
            if (/(auto|scroll)/.test(overflow + overflowY)) return node;
            return getScrollParent(node.parentElement);
        };

        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const scrollParent = getScrollParent(sentinel.parentElement);

        const handleScroll = () => {
            if (mobileVisibleCount >= mobileFilteredCountRef.current) return;

            const sentinelRect = sentinel.getBoundingClientRect();
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

            if (sentinelRect.top <= viewportHeight + 100) {
                setMobileVisibleCount(prev => prev + 10);
            }
        };

        const target = scrollParent === window ? window : scrollParent;
        target.addEventListener('scroll', handleScroll, { passive: true });
        // Also check immediately in case content is short
        handleScroll();

        return () => target.removeEventListener('scroll', handleScroll);
    }, [isMobile, mobileVisibleCount]);

    // Fetch customers data + stats
    const fetchCustomers = async () => {
        try {
            loading.start();

            const response = await CustomerDAO.getAllCustomers();

            if (response.success) {
                const customers = response.customers.map(customer => ({
                    id: customer.id,
                    name: customer.name || 'Tanpa Nama',
                    phone: customer.phone || 'Tanpa Nomor',
                    address: customer.address || 'Tanpa Alamat',
                    createdAt: customer.createdAt,
                    updatedAt: customer.updatedAt,
                    carBrand: '-',
                    plateNumber: '-',
                    dueDate: null,
                    status: customer.status === 'Cancelled' ? 'Cancelled' : 'Active',
                }));

                // Compute stats
                const activeCount = customers.filter(c => c.status === 'Active').length;
                const cancelledCount = customers.filter(c => c.status === 'Cancelled').length;
                setSummaries([
                    { status: "ALL", total: customers.length },
                    { status: "Active", total: activeCount },
                    { status: "Cancelled", total: cancelledCount },
                ]);

                setAllCustomers(customers);

                // Filter by status
                let filteredData = [...customers];
                if (selectedStatus !== "ALL") {
                    filteredData = filteredData.filter(customer => customer.status === selectedStatus);
                }

                // Filter by keyword
                if (dataSourceOptions.keyword) {
                    const keyword = dataSourceOptions.keyword.toLowerCase();
                    filteredData = filteredData.filter(customer =>
                        customer.name.toLowerCase().includes(keyword) ||
                        customer.phone.toLowerCase().includes(keyword)
                    );
                }

                // Sorting
                if (dataSourceOptions.sortColumn) {
                    filteredData.sort((a, b) => {
                        let aVal = a[dataSourceOptions.sortColumn] || '';
                        let bVal = b[dataSourceOptions.sortColumn] || '';
                        if (dataSourceOptions.sortDirection === 'asc') {
                            return aVal > bVal ? 1 : -1;
                        } else {
                            return aVal < bVal ? 1 : -1;
                        }
                    });
                }

                // Pagination
                const startIndex = dataSourceOptions.page * dataSourceOptions.limit;
                const endIndex = startIndex + dataSourceOptions.limit;
                const paginatedData = filteredData.slice(startIndex, endIndex);

                setDataSource(paginatedData);
                setDataSourceOptions((prevOptions) => ({
                    ...prevOptions,
                    total: filteredData.length,
                }));
            } else {
                message(response.error || 'Gagal mengambil data pelanggan', 'error');
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
            message('Gagal mengambil data pelanggan', 'error');
        } finally {
            loading.stop();
        }
    };

    const statusOrder = {
        "ALL": 0,
        "Active": 1,
        "Expired": 2,
        "Cancelled": 3
    };

    const statusLabels = {
        "ALL": "Semua",
        "Active": "Aktif",
        "Expired": "Kedaluwarsa",
        "Cancelled": "Dibatalkan"
    };

    const sortedSummaries = [...summaries].sort((a, b) => {
        return statusOrder[a.status] - statusOrder[b.status];
    });

    const handleStatusChange = (status) => {
        setSelectedStatus(status);
        setDataSourceOptions((prevOptions) => ({
            ...prevOptions,
            page: 0,
        }));
    };

    // Open delete confirmation dialog
    const openDeleteDialog = (customer) => {
        setSelectedCustomer(customer);
        setIsDeleteDialogOpen(true);
    };

    // Open view customer dialog
    const openViewDialog = (customer) => {
        setSelectedCustomer(customer);
        setIsViewDialogOpen(true);
    };

    // Close dialogs
    const closeDeleteDialog = () => {
        setIsDeleteDialogOpen(false);
        setSelectedCustomer(null);
    };

    const closeViewDialog = () => {
        setIsViewDialogOpen(false);
        setSelectedCustomer(null);
    };

    // Handle delete customer
    const handleDeleteCustomer = async () => {
        try {
            loading.start();
            const response = await CustomerDAO.deleteCustomer(selectedCustomer.id);

            if (response.success) {
                message('Pelanggan berhasil dihapus', 'success');
                fetchCustomers();
            } else {
                message(response.error || 'Gagal menghapus pelanggan', 'error');
            }
        } catch (error) {
            console.error('Error deleting customer:', error);
            message('Gagal menghapus pelanggan', 'error');
        } finally {
            loading.stop();
            closeDeleteDialog();
        }
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        setDataSourceOptions({ ...dataSourceOptions, page: newPage });
    };

    const handleLimitChange = (newLimit) => {
        setDataSourceOptions({ ...dataSourceOptions, limit: newLimit, page: 0 });
    };

    const handleFilterChange = (field, value) => {
        setDataSourceOptions((prevOptions) => ({
            ...prevOptions,
            [field]: value,
            page: 0,
        }));
    };

    const handleSort = (columnKey) => {
        setDataSourceOptions({
            ...dataSourceOptions,
            sortColumn: columnKey,
            sortDirection:
                dataSourceOptions.sortColumn === columnKey
                    ? dataSourceOptions.sortDirection === 'asc'
                        ? 'desc'
                        : 'asc'
                    : 'asc',
        });
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Status Menu Handlers
    const handleStatusClick = (event, customer) => {
        event.stopPropagation();
        setStatusMenuAnchor(event.currentTarget);
        setStatusCustomer(customer);
    };

    const handleStatusClose = () => {
        setStatusMenuAnchor(null);
        setStatusCustomer(null);
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!statusCustomer) return;
        try {
            setUpdatingStatus(true);
            loading.start();

            const response = await CustomerDAO.updateCustomer(statusCustomer.id, {
                status: newStatus === 'Reset' ? null : newStatus
            });

            if (response.success) {
                message('Status berhasil diperbarui', 'success');
                fetchCustomers();
            } else {
                throw new Error(response.error || 'Gagal memperbarui status');
            }
        } catch (error) {
            message(error.message || 'Gagal memperbarui status', 'error');
        } finally {
            loading.stop();
            setUpdatingStatus(false);
            handleStatusClose();
        }
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return '#2E7D32';
            case 'Expired': return '#D32F2F';
            case 'Cancelled': return '#616161';
            default: return '#9E9E9E';
        }
    };

    // Initial data fetch
    useEffect(() => {
        fetchCustomers();
    }, [
        dataSourceOptions.page,
        dataSourceOptions.limit,
        dataSourceOptions.sortColumn,
        dataSourceOptions.sortDirection,
        dataSourceOptions.keyword,
        selectedStatus,
    ]);

    // Desktop Table Columns
    const columns = [
        {
            title: 'Nama Pelanggan',
            dataIndex: 'name',
            key: 'name',
            sortable: true,
            render: (value, row) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
                        {value?.charAt(0)?.toUpperCase() || 'C'}
                    </Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight="medium">
                            {value || 'Tanpa Nama'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            {row.phone || 'Tanpa Nomor'}
                        </Typography>
                    </Box>
                </Box>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            sortable: true,
            render: (value, row) => (
                <Chip
                    label={statusLabels[value] || value || '-'}
                    size="small"
                    onClick={(e) => handleStatusClick(e, row)}
                    sx={{
                        fontWeight: 'bold',
                        fontSize: '12px',
                        backgroundColor: getStatusColor(value),
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        '&:hover': {
                            opacity: 0.9,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }
                    }}
                />
            )
        },
        {
            title: 'Aksi',
            dataIndex: 'actions',
            key: 'actions',
            sortable: false,
            render: (_, row) => (
                <Stack direction={'row'} spacing={1}>
                    <IconButton
                        size={'small'}
                        onClick={() => navigate(`/customers/${row.id}`)}
                        sx={{ borderRadius: 0.8 }}
                    >
                        <Icon icon={'mdi:eye-outline'} />
                    </IconButton>
                    <IconButton
                        size={'small'}
                        onClick={() => navigate(`/customers/edit/${row.id}`)}
                        sx={{ borderRadius: 0.8 }}
                    >
                        <Icon icon={'mdi:pencil-outline'} />
                    </IconButton>
                    <IconButton
                        size={'small'}
                        onClick={() => openDeleteDialog(row)}
                        sx={{ borderRadius: 0.8 }}
                    >
                        <Icon icon={'mdi:trash-can-outline'} />
                    </IconButton>
                </Stack>
            )
        }
    ];

    // Mobile View
    const renderMobileView = () => {
        let filteredData = [...allCustomers];
        if (selectedStatus !== "ALL") {
            filteredData = filteredData.filter(customer => customer.status === selectedStatus);
        }
        if (dataSourceOptions.keyword) {
            const keyword = dataSourceOptions.keyword.toLowerCase();
            filteredData = filteredData.filter(customer =>
                customer.name.toLowerCase().includes(keyword) ||
                customer.phone.toLowerCase().includes(keyword)
            );
        }


        mobileFilteredCountRef.current = filteredData.length;

        const paginatedData = filteredData.slice(0, mobileVisibleCount);
        const totalRecords = filteredData.length;
        const hasMore = mobileVisibleCount < totalRecords;

        return (
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', minHeight: '100%' }}>
                {/* Search Bar + Add Button inline */}
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        placeholder="Cari pelanggan..."
                        value={mobileSearchInput}
                        onChange={(e) => setMobileSearchInput(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleFilterChange('keyword', mobileSearchInput);
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Icon icon="mdi:magnify" color="#94A3B8" />
                                </InputAdornment>
                            ),
                            sx: {
                                borderRadius: '12px',
                                bgcolor: '#fff',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' }
                            }
                        }}
                    />
                    <IconButton
                        onClick={() => { setIsCreateDialogOpen(true); setSelectedCustomer(null); }}
                        sx={{
                            bgcolor: '#1E3A8A', color: '#fff', borderRadius: '12px',
                            width: 48, height: 48, flexShrink: 0,
                            '&:hover': { bgcolor: '#1e40af' },
                            boxShadow: '0 4px 12px rgba(30,58,138,0.3)'
                        }}
                    >
                        <Icon icon="mdi:plus" width={24} />
                    </IconButton>
                </Stack>

                {/* Status Filters */}
                <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 2, mb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
                    {sortedSummaries.map((summary) => (
                        <Chip
                            key={summary.status}
                            label={`${statusLabels[summary.status]} (${summary.total})`}
                            onClick={() => handleStatusChange(summary.status)}
                            sx={{
                                border: '1px solid',
                                borderColor: selectedStatus === summary.status ? '#1E3A8A' : '#E2E8F0',
                                backgroundColor: selectedStatus === summary.status ? '#1E3A8A' : '#fff',
                                color: selectedStatus === summary.status ? '#fff' : '#64748B',
                                fontWeight: 600,
                                px: 1,
                                height: 38,
                                borderRadius: '20px',
                                '&:active': { transform: 'scale(0.95)' }
                            }}
                        />
                    ))}
                </Box>

                {/* List Content */}
                {paginatedData.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Icon icon="mdi:account-off-outline" width={64} color="#CBD5E1" />
                        <Typography variant="body1" sx={{ mt: 2, color: '#94A3B8', fontWeight: 500 }}>Tidak ada pelanggan ditemukan</Typography>
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {paginatedData.map((customer) => (
                            <Card key={customer.id}
                                onClick={() => navigate(`/customers/${customer.id}`)}
                                sx={{ borderRadius: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9', cursor: 'pointer' }}>
                                <CardContent sx={{ p: '20px !important' }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar sx={{ width: 48, height: 48, bgcolor: '#EFF6FF', color: '#1E40AF', fontWeight: 700 }}>
                                            {customer.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 0.25 }}>
                                                {customer.name}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Icon icon="mdi:phone" width={14} /> {customer.phone}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={(statusLabels[customer.status] || customer.status || '-').toUpperCase()}
                                            size="small"
                                            sx={{
                                                bgcolor: customer.status === 'Active' ? '#D1FAE5' : customer.status === 'Expired' ? '#FEE2E2' : '#F1F5F9',
                                                color: customer.status === 'Active' ? '#065F46' : customer.status === 'Expired' ? '#991B1B' : '#475569',
                                                fontWeight: 800, fontSize: '0.65rem', borderRadius: '8px'
                                            }}
                                        />
                                        <IconButton size="small" onClick={(e) => handleOpenDrawer(e, customer)}>
                                            <Icon icon="mdi:dots-vertical" width={24} color="#64748B" />
                                        </IconButton>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}

                {/* Sentinel for infinite scroll */}
                {hasMore && (
                    <Box ref={sentinelRef} sx={{ height: 40, width: '100%' }} />
                )}

                {!hasMore && totalRecords > 10 && (
                    <Box sx={{ py: 3, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500 }}>
                            Semua {totalRecords} pelanggan sudah dimuat
                        </Typography>
                    </Box>
                )}
            </Box>
        );
    };

    // Desktop View
    const renderDesktopView = () => {
        return (
            <CustomColumn className={'gap-y-8 max-h-full'}>
                <CustomRow className={'gap-x-4'}>
                    <CustomTextInput
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleFilterChange('keyword', e.target.value);
                            }
                        }}
                        placeholder={'Cari pelanggan...'}
                        searchIcon={true}
                    />
                    <CustomRow className={'justify-center gap-x-4'}>
                        <CustomButton
                            startIcon={
                                <CustomIcon
                                    icon={'heroicons:plus'}
                                    sx={{ py: 6 }}
                                />
                            }
                            onClick={() => {
                                setIsCreateDialogOpen(true);
                                setSelectedCustomer(null);
                            }}
                            color="secondary"
                        >
                            Tambah Pelanggan
                        </CustomButton>
                    </CustomRow>
                </CustomRow>

                <CustomRow className={'lg:gap-x-6 md:gap-x-2 sm:gap-x-0 items-start'}>
                    {sortedSummaries.map((summary) => (
                        <div
                            key={summary.status}
                            onClick={() => handleStatusChange(summary.status)}
                            className={`cursor-pointer rounded-lg transition-all duration-200 ${selectedStatus === summary.status
                                ? "border-2 border-blue-500"
                                : "border border-transparent"
                                }`}
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                            }}
                        >
                            <CustomDashboardStatsCard
                                value={summary?.total}
                                label={statusLabels[summary.status] || summary.status}
                                className="w-full h-full"
                            />
                        </div>
                    ))}
                </CustomRow>

                <CustomDatatable
                    dataSource={dataSource}
                    columns={columns}
                    page={dataSourceOptions.page}
                    limit={dataSourceOptions.limit}
                    totalRecords={dataSourceOptions.total}
                    handlePageChange={handlePageChange}
                    handleLimitChange={handleLimitChange}
                    handleSort={handleSort}
                    sortColumn={dataSourceOptions.sortColumn}
                    sortDirection={dataSourceOptions.sortDirection}
                />
            </CustomColumn>
        );
    };

    return (
        <>
            {isMobile ? renderMobileView() : renderDesktopView()}

            {/* Create Customer Dialog */}
            <CreateCustomerDialog
                open={isCreateDialogOpen}
                onClose={(refresh) => {
                    setIsCreateDialogOpen(false);
                    if (refresh) fetchCustomers();
                }}
            />

            {/* View Customer Dialog */}
            <ViewCustomerDialog
                open={isViewDialogOpen}
                customer={selectedCustomer}
                onClose={closeViewDialog}
                onEdit={() => {
                    closeViewDialog();
                    navigate(`/customers/edit/${selectedCustomer.id}`);
                }}
                onDelete={() => {
                    closeViewDialog();
                    openDeleteDialog(selectedCustomer);
                }}
            />

            {/* Status Change Menu */}
            <Menu
                anchorEl={statusMenuAnchor}
                open={Boolean(statusMenuAnchor)}
                onClose={handleStatusClose}
                PaperProps={{
                    sx: {
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        minWidth: 150
                    }
                }}
            >
                <MenuItem
                    onClick={() => handleStatusUpdate('Reset')}
                    disabled={updatingStatus}
                >
                    <ListItemIcon>
                        <Icon icon="mdi:check-circle" color="#2E7D32" width={20} />
                    </ListItemIcon>
                    <ListItemText primary="Set Aktif / Reset" secondary="Mengikuti jatuh tempo" secondaryTypographyProps={{ fontSize: 10 }} />
                </MenuItem>
                <MenuItem
                    onClick={() => handleStatusUpdate('Cancelled')}
                    disabled={updatingStatus}
                >
                    <ListItemIcon>
                        <Icon icon="mdi:cancel" color="#616161" width={20} />
                    </ListItemIcon>
                    <ListItemText primary="Set Dibatalkan" />
                </MenuItem>
            </Menu>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={isDeleteDialogOpen}
                onClose={closeDeleteDialog}
                maxWidth="xs"
                fullWidth
                fullScreen={isMobile}
            >
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
                            Konfirmasi Hapus
                        </Typography>
                        <IconButton onClick={closeDeleteDialog} size="small">
                            <Icon icon="mdi:close" />
                        </IconButton>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Yakin ingin menghapus pelanggan <b>{selectedCustomer?.name}</b>?
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                            Tindakan ini tidak dapat dibatalkan. Semua data pelanggan termasuk foto kendaraan akan dihapus permanen.
                        </Typography>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 1,
                            flexDirection: { xs: 'column', sm: 'row' }
                        }}>
                            <Button
                                variant="outlined"
                                onClick={closeDeleteDialog}
                                fullWidth={isMobile}
                            >
                                Batal
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={handleDeleteCustomer}
                                startIcon={<Icon icon="mdi:delete" />}
                                fullWidth={isMobile}
                            >
                                Hapus Pelanggan
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Dialog>

            {/* Mobile Actions Drawer */}
            <Drawer
                anchor="bottom"
                open={actionDrawerOpen}
                onClose={handleCloseDrawer}
                PaperProps={{
                    sx: { borderTopLeftRadius: '24px', borderTopRightRadius: '24px', p: 2 }
                }}
            >
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{ width: 40, height: 4, bgcolor: '#E2E8F0', borderRadius: 2 }} />
                </Box>
                {drawerCustomer && (
                    <>
                        <Box sx={{ mb: 2, px: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>{drawerCustomer.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                <Icon icon="mdi:phone" width={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                {drawerCustomer.phone}
                            </Typography>
                        </Box>
                        <List sx={{ pb: 3 }}>
                            <ListItemButton
                                onClick={() => { handleCloseDrawer(); navigate(`/customers/edit/${drawerCustomer.id}`); }}
                                sx={{ borderRadius: '12px', mb: 1 }}
                            >
                                <ListItemIcon><Icon icon="mdi:pencil-outline" width={24} color="#1E40AF" /></ListItemIcon>
                                <ListItemText primary="Edit Pelanggan" primaryTypographyProps={{ fontWeight: 600, color: '#1E40AF' }} />
                            </ListItemButton>
                            <ListItemButton
                                onClick={() => { handleCloseDrawer(); openDeleteDialog(drawerCustomer); }}
                                sx={{ borderRadius: '12px' }}
                            >
                                <ListItemIcon><Icon icon="mdi:trash-can-outline" width={24} color="#DC2626" /></ListItemIcon>
                                <ListItemText primary="Hapus Pelanggan" primaryTypographyProps={{ fontWeight: 600, color: '#DC2626' }} />
                            </ListItemButton>
                        </List>
                    </>
                )}
            </Drawer>
        </>
    );
}
