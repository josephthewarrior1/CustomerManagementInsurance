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
    Grid,
    useMediaQuery,
    useTheme,
    Stack,
    Divider,
    MenuItem,
    Menu,
    ListItemIcon,
    ListItemText,
    CircularProgress
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import { useUser } from '../../hooks/UserProvider';
import CarDAO from '../../daos/CarDao';
import CreateCarDialog from './CreateCarDialog';
import {
    CustomButton,
    CustomDashboardStatsCard,
    CustomDatatable,
    CustomIcon,
    CustomRow,
    CustomTextInput,
} from '../../reusables';
import CustomColumn from '../../reusables/layouts/CustomColumn';

export default function CarListPage() {
    const { user } = useUser();
    const [allCars, setAllCars] = useState([]);
    const [dataSource, setDataSource] = useState([]);
    const [summaries, setSummaries] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCar, setSelectedCar] = useState(null);
    const [deletingCar, setDeletingCar] = useState(false);
    const [mobileSearchInput, setMobileSearchInput] = useState('');
    const [dataSourceOptions, setDataSourceOptions] = useState({
        keyword: '', page: 0, limit: 10, total: 0, sortColumn: '', sortDirection: 'asc',
    });

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const message = useAlert();
    const loading = useLoading();
    const navigate = useNavigate();

    useEffect(() => {
        setMobileSearchInput(dataSourceOptions.keyword);
    }, [dataSourceOptions.keyword]);

    const fetchCars = async () => {
        try {
            loading.start();
            const response = await CarDAO.getAllCars();
            if (response.success) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const cars = response.cars.map(car => ({
                    id: car.id,
                    customerId: car.customerId,
                    ownerName: car.carData?.ownerName || '-',
                    carBrand: car.carData?.carBrand || '-',
                    carModel: car.carData?.carModel || '-',
                    plateNumber: car.carData?.plateNumber || '-',
                    dueDate: car.carData?.dueDate || null,
                    carPrice: car.carData?.carPrice || 0,
                    hasSTNK: car.documentStatus?.hasSTNK || false,
                    hasSIM: car.documentStatus?.hasSIM || false,
                    hasKTP: car.documentStatus?.hasKTP || false,
                    carPhotos: car.carPhotos || {},
                    status: car.status || 'Active',
                    notes: car.notes || '',
                    createdAt: car.createdAt,
                }));

                // Compute status for display
                const enriched = cars.map(car => {
                    let displayStatus = car.status;
                    if (car.status !== 'Cancelled' && car.dueDate && new Date(car.dueDate) < today) {
                        displayStatus = 'Expired';
                    }
                    return { ...car, displayStatus };
                });

                // Stats
                const activeCount = enriched.filter(c => c.displayStatus === 'Active').length;
                const expiredCount = enriched.filter(c => c.displayStatus === 'Expired').length;
                const cancelledCount = enriched.filter(c => c.displayStatus === 'Cancelled').length;
                setSummaries([
                    { status: 'ALL', total: enriched.length },
                    { status: 'Active', total: activeCount },
                    { status: 'Expired', total: expiredCount },
                    { status: 'Cancelled', total: cancelledCount },
                ]);

                setAllCars(enriched);

                // Filter
                let filtered = [...enriched];
                if (selectedStatus !== 'ALL') {
                    filtered = filtered.filter(c => c.displayStatus === selectedStatus);
                }
                if (dataSourceOptions.keyword) {
                    const kw = dataSourceOptions.keyword.toLowerCase();
                    filtered = filtered.filter(c =>
                        c.ownerName.toLowerCase().includes(kw) ||
                        c.carBrand.toLowerCase().includes(kw) ||
                        c.carModel.toLowerCase().includes(kw) ||
                        c.plateNumber.toLowerCase().includes(kw)
                    );
                }
                if (dataSourceOptions.sortColumn) {
                    filtered.sort((a, b) => {
                        const aV = a[dataSourceOptions.sortColumn] || '';
                        const bV = b[dataSourceOptions.sortColumn] || '';
                        return dataSourceOptions.sortDirection === 'asc' ? (aV > bV ? 1 : -1) : (aV < bV ? 1 : -1);
                    });
                }
                const start = dataSourceOptions.page * dataSourceOptions.limit;
                setDataSource(filtered.slice(start, start + dataSourceOptions.limit));
                setDataSourceOptions(prev => ({ ...prev, total: filtered.length }));
            } else {
                message(response.error || 'Failed to fetch cars', 'error');
            }
        } catch (err) {
            console.error(err);
            message('Failed to fetch cars', 'error');
        } finally {
            loading.stop();
        }
    };

    useEffect(() => {
        fetchCars();
    }, [dataSourceOptions.page, dataSourceOptions.limit, dataSourceOptions.sortColumn, dataSourceOptions.sortDirection, dataSourceOptions.keyword, selectedStatus]);

    const handleDeleteCar = async () => {
        if (!selectedCar) return;
        try {
            setDeletingCar(true);
            loading.start();
            const response = await CarDAO.deleteCar(selectedCar.id);
            if (response.success) {
                message('Car deleted successfully', 'success');
                fetchCars();
            } else {
                message(response.error || 'Failed to delete car', 'error');
            }
        } catch (err) {
            message('Failed to delete car', 'error');
        } finally {
            loading.stop();
            setDeletingCar(false);
            setIsDeleteDialogOpen(false);
            setSelectedCar(null);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return { bg: '#D1FAE5', color: '#065F46' };
            case 'Expired': return { bg: '#FEE2E2', color: '#991B1B' };
            case 'Cancelled': return { bg: '#F1F5F9', color: '#475569' };
            default: return { bg: '#F1F5F9', color: '#475569' };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const statusOrder = { 'ALL': 0, 'Active': 1, 'Expired': 2, 'Cancelled': 3 };
    const sortedSummaries = [...summaries].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    const columns = [
        {
            title: 'Owner Name',
            dataIndex: 'ownerName',
            key: 'ownerName',
            sortable: true,
            render: (value, row) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#EFF6FF', color: '#1E40AF' }}>
                        <Icon icon="mdi:car" width={18} />
                    </Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight="medium">{value}</Typography>
                        <Typography variant="caption" color="textSecondary">{row.customerId}</Typography>
                    </Box>
                </Box>
            )
        },
        {
            title: 'Car',
            dataIndex: 'carBrand',
            key: 'carBrand',
            sortable: true,
            render: (_, row) => (
                <Typography variant="body2">{row.carBrand} {row.carModel}</Typography>
            )
        },
        {
            title: 'Plate Number',
            dataIndex: 'plateNumber',
            key: 'plateNumber',
            sortable: false,
            render: (value) => (
                <Chip label={value} size="small" color="primary" variant="outlined" />
            )
        },
        {
            title: 'Insurance Due',
            dataIndex: 'dueDate',
            key: 'dueDate',
            sortable: false,
            render: (value) => formatDate(value)
        },
        {
            title: 'Status',
            dataIndex: 'displayStatus',
            key: 'displayStatus',
            sortable: true,
            render: (value) => {
                const colors = getStatusColor(value);
                return (
                    <Chip label={value || '-'} size="small" sx={{ bgcolor: colors.bg, color: colors.color, fontWeight: 700, fontSize: '12px' }} />
                );
            }
        },
        {
            title: 'Actions',
            dataIndex: 'actions',
            key: 'actions',
            sortable: false,
            render: (_, row) => (
                <Stack direction="row" spacing={1}>
                    <IconButton size="small" onClick={() => navigate(`/cars/${row.id}`)} sx={{ borderRadius: 0.8, color: '#475569' }}>
                        <Icon icon="mdi:eye-outline" />
                    </IconButton>
                    <IconButton size="small" onClick={() => navigate(`/cars/edit/${row.id}`)} sx={{ borderRadius: 0.8, color: '#1E40AF' }}>
                        <Icon icon="mdi:pencil-outline" />
                    </IconButton>
                    <IconButton size="small" onClick={() => { setSelectedCar(row); setIsDeleteDialogOpen(true); }} sx={{ borderRadius: 0.8, color: '#DC2626' }}>
                        <Icon icon="mdi:trash-can-outline" />
                    </IconButton>
                </Stack>
            )
        }
    ];

    const renderMobileView = () => {
        const mobileLimit = 5;
        let filtered = [...allCars];
        if (selectedStatus !== 'ALL') filtered = filtered.filter(c => c.displayStatus === selectedStatus);
        if (dataSourceOptions.keyword) {
            const kw = dataSourceOptions.keyword.toLowerCase();
            filtered = filtered.filter(c =>
                c.ownerName.toLowerCase().includes(kw) ||
                c.carBrand.toLowerCase().includes(kw) ||
                c.plateNumber.toLowerCase().includes(kw)
            );
        }
        const start = dataSourceOptions.page * mobileLimit;
        const paginated = filtered.slice(start, start + mobileLimit);

        return (
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', minHeight: '100%' }}>
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth placeholder="Search cars..."
                        value={mobileSearchInput}
                        onChange={(e) => setMobileSearchInput(e.target.value)}
                        onKeyPress={(e) => { if (e.key === 'Enter') setDataSourceOptions(p => ({ ...p, keyword: mobileSearchInput, page: 0 })); }}
                        InputProps={{
                            startAdornment: (<InputAdornment position="start"><Icon icon="mdi:magnify" color="#94A3B8" /></InputAdornment>),
                            sx: { borderRadius: '12px', bgcolor: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' } }
                        }}
                    />
                </Box>
                <Button fullWidth variant="contained" onClick={() => setIsCreateDialogOpen(true)} startIcon={<Icon icon="heroicons:plus" />}
                    sx={{ bgcolor: '#1E3A8A', color: '#fff', textTransform: 'none', fontWeight: 700, py: 1.5, borderRadius: '16px', mb: 3, '&:hover': { bgcolor: '#1e40af' } }}>
                    Add Car
                </Button>
                <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 2, mb: 1 }}>
                    {sortedSummaries.map(s => (
                        <Chip key={s.status} label={`${s.status} (${s.total})`} onClick={() => setSelectedStatus(s.status)}
                            sx={{ border: '1px solid', borderColor: selectedStatus === s.status ? '#1E3A8A' : '#E2E8F0', backgroundColor: selectedStatus === s.status ? '#1E3A8A' : '#fff', color: selectedStatus === s.status ? '#fff' : '#64748B', fontWeight: 600, height: 38, borderRadius: '20px' }} />
                    ))}
                </Box>
                {paginated.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Icon icon="mdi:car-off" width={64} color="#CBD5E1" />
                        <Typography variant="body1" sx={{ mt: 2, color: '#94A3B8', fontWeight: 500 }}>No cars found</Typography>
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {paginated.map(car => {
                            const colors = getStatusColor(car.displayStatus);
                            return (
                                <Card key={car.id} sx={{ borderRadius: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9' }}>
                                    <CardContent sx={{ p: '20px !important' }}>
                                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                            <Avatar sx={{ width: 48, height: 48, bgcolor: '#EFF6FF', color: '#1E40AF' }}>
                                                <Icon icon="mdi:car" width={24} />
                                            </Avatar>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>{car.carBrand} {car.carModel}</Typography>
                                                <Typography variant="body2" sx={{ color: '#64748B' }}>{car.ownerName}</Typography>
                                            </Box>
                                            <Chip label={car.displayStatus} size="small" sx={{ bgcolor: colors.bg, color: colors.color, fontWeight: 700, fontSize: '0.65rem' }} />
                                        </Stack>
                                        <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />
                                        <Grid container spacing={2} sx={{ mb: 2 }}>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>PLATE</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>{car.plateNumber}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>DUE DATE</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>{formatDate(car.dueDate)}</Typography>
                                            </Grid>
                                        </Grid>
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <IconButton size="small" onClick={() => navigate(`/cars/${car.id}`)} sx={{ color: '#64748B' }}><Icon icon="mdi:eye-outline" width={22} /></IconButton>
                                            <IconButton size="small" onClick={() => navigate(`/cars/edit/${car.id}`)} sx={{ color: '#1E40AF' }}><Icon icon="mdi:pencil-outline" width={22} /></IconButton>
                                            <IconButton size="small" onClick={() => { setSelectedCar(car); setIsDeleteDialogOpen(true); }} sx={{ color: '#DC2626' }}><Icon icon="mdi:trash-can-outline" width={22} /></IconButton>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Stack>
                )}
                {filtered.length > 0 && (
                    <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #E2E8F0', pb: 4 }}>
                        <Stack direction="row" spacing={2}>
                            <Button fullWidth variant="outlined" disabled={dataSourceOptions.page === 0}
                                onClick={() => setDataSourceOptions(p => ({ ...p, page: p.page - 1 }))}
                                sx={{ borderRadius: '12px', py: 1.25, fontWeight: 700, textTransform: 'uppercase', borderColor: '#E2E8F0', color: '#64748B' }}>Prev</Button>
                            <Button fullWidth variant="outlined" disabled={start + mobileLimit >= filtered.length}
                                onClick={() => setDataSourceOptions(p => ({ ...p, page: p.page + 1 }))}
                                sx={{ borderRadius: '12px', py: 1.25, fontWeight: 700, textTransform: 'uppercase', borderColor: '#1E3A8A', color: '#1E3A8A' }}>Next</Button>
                        </Stack>
                    </Box>
                )}
            </Box>
        );
    };

    const renderDesktopView = () => (
        <CustomColumn className="gap-y-8 max-h-full">
            <CustomRow className="gap-x-4">
                <CustomTextInput
                    onKeyPress={(e) => { if (e.key === 'Enter') setDataSourceOptions(p => ({ ...p, keyword: e.target.value, page: 0 })); }}
                    placeholder="Search cars..."
                    searchIcon={true}
                />
                <CustomRow className="justify-center gap-x-4">
                    <CustomButton startIcon={<CustomIcon icon="heroicons:plus" />} onClick={() => setIsCreateDialogOpen(true)} color="secondary">
                        Add Car
                    </CustomButton>
                </CustomRow>
            </CustomRow>

            <CustomRow className="lg:gap-x-6 md:gap-x-2 sm:gap-x-0 items-start">
                {sortedSummaries.map(s => (
                    <div key={s.status} onClick={() => setSelectedStatus(s.status)}
                        className={`cursor-pointer rounded-lg transition-all duration-200 ${selectedStatus === s.status ? 'border-2 border-blue-500' : 'border border-transparent'}`}
                        style={{ width: '100%', height: '100%', display: 'flex' }}>
                        <CustomDashboardStatsCard value={s.total} label={s.status} className="w-full h-full" />
                    </div>
                ))}
            </CustomRow>

            <CustomDatatable
                dataSource={dataSource}
                columns={columns}
                page={dataSourceOptions.page}
                limit={dataSourceOptions.limit}
                totalRecords={dataSourceOptions.total}
                handlePageChange={(p) => setDataSourceOptions(prev => ({ ...prev, page: p }))}
                handleLimitChange={(l) => setDataSourceOptions(prev => ({ ...prev, limit: l, page: 0 }))}
                handleSort={(col) => setDataSourceOptions(prev => ({
                    ...prev, sortColumn: col,
                    sortDirection: prev.sortColumn === col ? (prev.sortDirection === 'asc' ? 'desc' : 'asc') : 'asc'
                }))}
                sortColumn={dataSourceOptions.sortColumn}
                sortDirection={dataSourceOptions.sortDirection}
            />
        </CustomColumn>
    );

    return (
        <>
            {isMobile ? renderMobileView() : renderDesktopView()}

            {/* Create Car Dialog */}
            <CreateCarDialog
                open={isCreateDialogOpen}
                onClose={() => { setIsCreateDialogOpen(false); fetchCars(); }}
                customerId={null}
                onCarCreated={() => { setIsCreateDialogOpen(false); fetchCars(); }}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} maxWidth="xs" fullWidth
                PaperProps={{ style: { borderRadius: '16px' } }}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Delete Car</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Are you sure you want to delete <b>{selectedCar?.carBrand} {selectedCar?.carModel}</b> ({selectedCar?.plateNumber})? This action cannot be undone.
                    </Typography>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button variant="outlined" onClick={() => setIsDeleteDialogOpen(false)}
                            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#E2E8F0', color: '#475569' }}>Cancel</Button>
                        <Button variant="contained" onClick={handleDeleteCar} disabled={deletingCar}
                            sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}>
                            {deletingCar ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
                        </Button>
                    </Stack>
                </Box>
            </Dialog>
        </>
    );
}
