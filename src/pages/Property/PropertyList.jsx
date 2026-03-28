// PropertyList.jsx
import { Icon } from '@iconify/react';
import {
    Stack,
    Box,
    Typography,
    Chip,
    Card,
    CardContent,
    Button,
    TextField,
    InputAdornment,
    Avatar,
    Divider,
    Grid,
    CircularProgress,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import dayjs from 'dayjs';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import PropertyDAO from '../../daos/propertyDao';
import { useLoading } from '../../hooks/LoadingProvider.jsx';
import { useAlert } from '../../hooks/SnackbarProvider.jsx';
import { useUser } from '../../hooks/UserProvider';
import {
    CustomButton,
    CustomDashboardStatsCard,
    CustomDatatable,
    CustomIcon,
    CustomRow,
    CustomSelect,
    CustomTextInput,
} from '../../reusables';
import CustomColumn from '../../reusables/layouts/CustomColumn';
import PropertyComponent from './PropertyComponent';

const PROPERTY_TYPES = {
    HOUSE: 'House',
    APARTMENT: 'Apartment',
    OFFICE: 'Office',
    WAREHOUSE: 'Warehouse',
    SHOP: 'Shop',
    LAND: 'Land'
};

const PROPERTY_TYPE_LABELS = {
    House: 'Rumah',
    Apartment: 'Apartemen',
    Office: 'Kantor',
    Warehouse: 'Gudang',
    Shop: 'Ruko',
    Land: 'Tanah',
};

const STATUS_LABELS = {
    ALL: 'Semua',
    Active: 'Aktif',
    Expired: 'Kedaluwarsa',
    Cancelled: 'Dibatalkan',
};

const getPropertyOwnerName = (property) => property?.ownerName || property?.customerName || '-';

export default function PropertyListPage() {
    const navigate = useNavigate();
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [dataSource, setDataSource] = useState([]);
    const [allData, setAllData] = useState([]);
    const [dataSourceOptions, setDataSourceOptions] = useState({
        keyword: '',
        page: 0,
        limit: 10,
        total: 0,
        sortColumn: '',
        sortDirection: 'asc',
        propertyType: null,
    });

    const [summaries, setSummaries] = useState([]);
    const loading = useLoading();
    const user = useUser();
    const message = useAlert();

    const [mobileSearchInput, setMobileSearchInput] = useState('');
    const [mobileVisibleCount, setMobileVisibleCount] = useState(5);
    const [mobileLoadingMore, setMobileLoadingMore] = useState(false);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const sentinelRef = useCallback((node) => {
        if (!node) return;
        const timer = setTimeout(() => {
            const observer = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting) {
                        setMobileLoadingMore(true);
                        setTimeout(() => {
                            setMobileVisibleCount(prev => prev + 5);
                            setMobileLoadingMore(false);
                        }, 300);
                    }
                },
                { threshold: 1.0, rootMargin: '0px 0px 0px 0px' }
            );
            observer.observe(node);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        setMobileSearchInput(dataSourceOptions.keyword);
    }, [dataSourceOptions.keyword]);

    const [selectedStatus, setSelectedStatus] = useState("ALL");

    const handleStatusChange = (status) => {
        setSelectedStatus(status);
        setDataSourceOptions((prevOptions) => ({
            ...prevOptions,
            page: 0,
        }));
    };

    useEffect(() => {
        setMobileVisibleCount(5);
        setMobileLoadingMore(false);
    }, [dataSourceOptions.keyword, dataSourceOptions.propertyType, selectedStatus]);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const [actionDrawerOpen, setActionDrawerOpen] = useState(false);
    const [drawerProperty, setDrawerProperty] = useState(null);

    const handleOpenDrawer = (e, property) => {
        e.stopPropagation();
        setDrawerProperty(property);
        setActionDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setActionDrawerOpen(false);
        setDrawerProperty(null);
    };

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchProperties = async () => {
        try {
            loading.start();

            console.log('🔍 Fetching properties with status:', selectedStatus);

            let result;
            if (selectedStatus === "ALL") {
                result = await PropertyDAO.getAllProperties();
                console.log('📦 ALL Properties Result:', result);
            } else {
                result = await PropertyDAO.getPropertiesByStatus(selectedStatus);
                console.log('📦 Filtered Properties Result:', result);
            }

            const properties = result?.properties || result?.data || [];
            console.log('📊 Properties array:', properties);
            console.log('📊 Properties count:', properties.length);

            setAllData(properties);

            let filteredData = [...properties];

            if (dataSourceOptions.keyword) {
                const keyword = dataSourceOptions.keyword.toLowerCase();
                console.log('🔎 Filtering with keyword:', keyword);

                filteredData = filteredData.filter(property => {
                    const matchOwnerName = getPropertyOwnerName(property)?.toLowerCase().includes(keyword);
                    const matchOwnerPhone = property.ownerPhone?.includes(keyword);
                    const matchOwnerEmail = property.ownerEmail?.toLowerCase().includes(keyword);
                    const matchAddress = property.propertyData?.address?.toLowerCase().includes(keyword);
                    const matchCity = property.propertyData?.city?.toLowerCase().includes(keyword);
                    const matchPolicyNumber = property.insuranceData?.policyNumber?.toLowerCase().includes(keyword);

                    return matchOwnerName || matchOwnerPhone || matchOwnerEmail ||
                        matchAddress || matchCity || matchPolicyNumber;
                });
            }

            if (dataSourceOptions.propertyType) {
                console.log('🏠 Filtering by property type:', dataSourceOptions.propertyType);
                filteredData = filteredData.filter(property =>
                    property.propertyData?.propertyType === dataSourceOptions.propertyType
                );
            }

            console.log('✅ Filtered data count:', filteredData.length);

            if (dataSourceOptions.sortColumn) {
                console.log('🔄 Sorting by:', dataSourceOptions.sortColumn, dataSourceOptions.sortDirection);
                filteredData.sort((a, b) => {
                    let aVal = a[dataSourceOptions.sortColumn] || '';
                    let bVal = b[dataSourceOptions.sortColumn] || '';

                    if (dataSourceOptions.sortColumn === 'ownerName') {
                        aVal = getPropertyOwnerName(a);
                        bVal = getPropertyOwnerName(b);
                    }

                    if (dataSourceOptions.sortDirection === 'asc') {
                        return aVal > bVal ? 1 : -1;
                    } else {
                        return aVal < bVal ? 1 : -1;
                    }
                });
            }

            const startIndex = dataSourceOptions.page * dataSourceOptions.limit;
            const endIndex = startIndex + dataSourceOptions.limit;
            const paginatedData = filteredData.slice(startIndex, endIndex);

            console.log('📄 Paginated data:', paginatedData);
            console.log('📄 Showing:', startIndex, 'to', endIndex);

            setDataSource(paginatedData);
            setDataSourceOptions((prevOptions) => ({
                ...prevOptions,
                total: filteredData.length,
            }));

            console.log('✅ Data source updated with', paginatedData.length, 'items');
        } catch (err) {
            console.error('❌ Error fetching properties:', err);
            message('Gagal memuat data properti', 'error');
        } finally {
            loading.stop();
        }
    };

    const getPropertiesSummary = async () => {
        try {
            console.log('📊 Fetching property stats...');
            const result = await PropertyDAO.getPropertyStats();
            console.log('📊 Stats Response:', result);

            const summaryData = [
                {
                    status: "ALL",
                    total: result.stats?.totalProperties || 0,
                },
                {
                    status: "Active",
                    total: result.stats?.activeProperties || 0,
                },
                {
                    status: "Expired",
                    total: result.stats?.expiredProperties || 0,
                },
                {
                    status: "Cancelled",
                    total: 0,
                },
            ];

            console.log('📊 Summary Data:', summaryData);
            setSummaries(summaryData);
        } catch (error) {
            console.error('❌ Error fetching properties summary:', error);
        }
    };

    const statusOrder = {
        "ALL": 0,
        "Active": 1,
        "Expired": 2,
        "Cancelled": 3
    };

    const statusLabels = STATUS_LABELS;

    const sortedSummaries = [...summaries].sort((a, b) => {
        return statusOrder[a.status] - statusOrder[b.status];
    });

    const handleDelete = async (propertyId) => {
        try {
            loading.start();
            await PropertyDAO.deleteProperty(propertyId);
            message('Properti berhasil dihapus', 'success');
            fetchProperties();
            getPropertiesSummary();
        } catch (err) {
            console.error('Error deleting property:', err);
            message('Gagal menghapus properti', 'error');
        } finally {
            loading.stop();
        }
    };

    const columns = [
        {
            title: 'Pemilik',
            key: 'ownerName',
            sortable: true,
            render: (value, object) => {
                const ownerEmail = object?.ownerEmail;
                const ownerPhone = object?.ownerPhone;
                return (
                    <>
                        <div className="typography-4">
                            {getPropertyOwnerName(object)}
                        </div>
                        {ownerEmail ? (
                            <div className="typography-6 text-gray-500">
                                {ownerEmail}
                            </div>
                        ) : null}
                        {ownerPhone ? (
                            <div className="typography-6 text-gray-500">
                                {ownerPhone}
                            </div>
                        ) : null}
                    </>
                );
            },
        },
        {
            title: 'Tipe Properti',
            key: 'propertyType',
            sortable: true,
            render: (value, object) => {
                return PROPERTY_TYPE_LABELS[object?.propertyData?.propertyType] || object?.propertyData?.propertyType || '-';
            },
        },
        {
            title: 'Alamat',
            key: 'address',
            sortable: false,
            render: (value, object) => {
                return (
                    <>
                        <div className="typography-4">
                            {object?.propertyData?.address || '-'}
                        </div>
                        <div className="typography-6 text-gray-500">
                            {object?.propertyData?.city || '-'}
                            {object?.propertyData?.province ? `, ${object.propertyData.province}` : ''}
                        </div>
                    </>
                );
            },
        },
        {
            title: 'Perusahaan Asuransi',
            key: 'insuranceCompany',
            sortable: false,
            render: (value, object) => {
                return object?.insuranceData?.insuranceCompany || '-';
            },
        },
        {
            title: 'Nomor Polis',
            key: 'policyNumber',
            sortable: false,
            render: (value, object) => {
                return object?.insuranceData?.policyNumber || '-';
            },
        },
        {
            title: 'Tanggal Berakhir',
            key: 'endDate',
            sortable: false,
            render: (value, object) => {
                return object?.insuranceData?.endDate
                    ? dayjs(object.insuranceData.endDate).format('DD MMM YYYY')
                    : '-';
            },
        },
        {
            title: (
                <Box sx={{ textAlign: 'left', paddingLeft: '20px', display: 'block' }}>
                    Status
                </Box>
            ),
            dataIndex: 'status',
            key: 'status',
            sortable: true,
            render: (status) => {
                const statusStyles = {
                    Active: { bg: '#2E7D32', text: '#FFFFFF' },
                    Expired: { bg: '#D32F2F', text: '#FFFFFF' },
                    Cancelled: { bg: '#9E9E9E', text: '#FFFFFF' },
                    DEFAULT: { bg: '#9E9E9E', text: '#FFFFFF' },
                };

                const style = statusStyles[status] || statusStyles.DEFAULT;

                return (
                    <Chip
                        label={STATUS_LABELS[status] || status || '-'}
                        sx={{
                            fontWeight: 'bold',
                            fontSize: '12px',
                            height: '24px',
                            padding: '0 8px',
                            textAlign: 'center',
                            backgroundColor: style.bg,
                            color: style.text,
                            borderRadius: '15px',
                        }}
                    />
                );
            },
        },
        {
            title: '',
            key: 'action',
            sortable: false,
            render: (value, object) => {
                return (
                    <Stack direction={'row'} spacing={2}>
                        <IconButton
                            size={'small'}
                            sx={{ borderRadius: 0.8 }}
                            onClick={() => navigate(`/properties/${object.id}`)}
                        >
                            <Icon icon={'mdi:eye-outline'} />
                        </IconButton>
                        <IconButton
                            size={'small'}
                            sx={{ borderRadius: 0.8 }}
                            onClick={() => {
                                setSelectedDetail(object);
                                setOpenCreateDialog(true);
                            }}
                        >
                            <Icon icon={'mdi:pencil-outline'} />
                        </IconButton>
                        <IconButton
                            size={'small'}
                            onClick={() => {
                                if (window.confirm('Yakin ingin menghapus properti ini?')) {
                                    handleDelete(object.id);
                                }
                            }}
                            sx={{ borderRadius: 0.8 }}
                        >
                            <Icon icon={'mdi:trash-can-outline'} />
                        </IconButton>
                    </Stack>
                );
            },
        },
    ];

    const handlePageChange = (newPage) => {
        console.log('📄 Page changed to:', newPage);
        setDataSourceOptions({ ...dataSourceOptions, page: newPage });
    };

    const handleLimitChange = (newLimit) => {
        console.log('📄 Limit changed to:', newLimit);
        setDataSourceOptions({ ...dataSourceOptions, limit: newLimit, page: 0 });
    };

    const handleFilterChange = (field, value) => {
        console.log('🔍 Filter changed:', field, '=', value);
        setDataSourceOptions((prevOptions) => ({
            ...prevOptions,
            [field]: value,
            page: 0,
        }));
    };

    const handleSort = (columnKey) => {
        console.log('🔄 Sort clicked:', columnKey);
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

    useEffect(() => {
        console.log('🔄 Refetching due to dependency change');
        console.log('👤 User data:', user?.data);
        console.log('📊 Selected status:', selectedStatus);
        console.log('📄 Page options:', dataSourceOptions);

        fetchProperties();
    }, [
        dataSourceOptions.page,
        dataSourceOptions.limit,
        dataSourceOptions.sortColumn,
        dataSourceOptions.sortDirection,
        dataSourceOptions.keyword,
        dataSourceOptions.propertyType,
        selectedStatus,
    ]);

    useEffect(() => {
        console.log('🚀 Initial load - fetching summary');
        getPropertiesSummary();
    }, []);

    useEffect(() => {
        const checkExpired = async () => {
            try {
                console.log('⏰ Checking expired policies...');
                await PropertyDAO.checkExpiredPolicies();
            } catch (err) {
                console.error('❌ Error checking expired policies:', err);
            }
        };
        checkExpired();
    }, []);

    const renderMobileView = () => {
        const BATCH = 5;
        let filtered = [...allData];
        if (selectedStatus !== 'ALL') {
            filtered = filtered.filter(c => c.status === selectedStatus || (c.status === undefined && selectedStatus === 'Active'));
        }
        if (dataSourceOptions.propertyType) {
            filtered = filtered.filter(c => c.propertyData?.propertyType === dataSourceOptions.propertyType);
        }
        if (dataSourceOptions.keyword) {
            const keyword = dataSourceOptions.keyword.toLowerCase();
            filtered = filtered.filter(property => {
                const matchOwnerName = getPropertyOwnerName(property)?.toLowerCase().includes(keyword);
                const matchOwnerPhone = property.ownerPhone?.includes(keyword);
                const matchOwnerEmail = property.ownerEmail?.toLowerCase().includes(keyword);
                const matchAddress = property.propertyData?.address?.toLowerCase().includes(keyword);
                const matchCity = property.propertyData?.city?.toLowerCase().includes(keyword);
                const matchPolicyNumber = property.insuranceData?.policyNumber?.toLowerCase().includes(keyword);
                return matchOwnerName || matchOwnerPhone || matchOwnerEmail || matchAddress || matchCity || matchPolicyNumber;
            });
        }
        
        const paginated = filtered.slice(0, mobileVisibleCount);
        const hasMore = mobileVisibleCount < filtered.length;

        return (
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', minHeight: '100%' }}>
                {/* Search & Add Inline */}
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <TextField
                        fullWidth placeholder="Cari properti..."
                        value={mobileSearchInput}
                        onChange={(e) => setMobileSearchInput(e.target.value)}
                        onKeyPress={(e) => { if (e.key === 'Enter') setDataSourceOptions(p => ({ ...p, keyword: mobileSearchInput, page: 0 })); }}
                        InputProps={{
                            startAdornment: (<InputAdornment position="start"><Icon icon="mdi:magnify" color="#94A3B8" /></InputAdornment>),
                            sx: { borderRadius: '12px', bgcolor: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' } }
                        }}
                    />
                    <IconButton
                        onClick={() => { setOpenCreateDialog(true); setSelectedDetail(null); }}
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
                                fontWeight: 600, px: 1, height: 38, borderRadius: '20px',
                                '&:active': { transform: 'scale(0.95)' }
                            }}
                        />
                    ))}
                </Box>

                {/* List Content */}
                {paginated.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Icon icon="mdi:home-off-outline" width={64} color="#CBD5E1" />
                        <Typography variant="body1" sx={{ mt: 2, color: '#94A3B8', fontWeight: 500 }}>Tidak ada properti ditemukan</Typography>
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {paginated.map((property) => (
                            <Card key={property.id} 
                                  onClick={() => navigate(`/properties/${property.id}`)}
                                  sx={{ borderRadius: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9', cursor: 'pointer' }}>
                                <CardContent sx={{ p: '20px !important' }}>
                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2.5 }}>
                                        <Avatar sx={{ width: 48, height: 48, bgcolor: '#EFF6FF', color: '#1E40AF', fontWeight: 700 }}>
                                            {getPropertyOwnerName(property)?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'P'}
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 0.25 }}>
                                                {getPropertyOwnerName(property)}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Icon icon="mdi:phone" width={14} /> {property.ownerPhone}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={(STATUS_LABELS[property.status || 'Active'] || property.status || 'Aktif').toUpperCase()}
                                            size="small"
                                            sx={{
                                                bgcolor: property.status === 'Active' ? '#D1FAE5' : property.status === 'Expired' ? '#FEE2E2' : '#F1F5F9',
                                                color: property.status === 'Active' ? '#065F46' : property.status === 'Expired' ? '#991B1B' : '#475569',
                                                fontWeight: 800, fontSize: '0.65rem', borderRadius: '8px'
                                            }}
                                        />
                                        <IconButton size="small" onClick={(e) => handleOpenDrawer(e, property)}>
                                            <Icon icon="mdi:dots-vertical" width={24} color="#64748B" />
                                        </IconButton>
                                    </Stack>

                                    <Divider sx={{ mb: 2.5, borderStyle: 'dashed' }} />

                                    <Grid container spacing={2} sx={{ mb: 2.5 }}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>PROPERTI</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mt: 0.5 }}>{PROPERTY_TYPE_LABELS[property.propertyData?.propertyType] || property.propertyData?.propertyType || '-'}</Typography>
                                            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>{property.propertyData?.address?.substring(0, 20)}...</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>JATUH TEMPO</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mt: 0.5 }}>
                                                {property.insuranceData?.endDate ? dayjs(property.insuranceData.endDate).format('DD MMM YYYY') : '-'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: property.status === 'Active' ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                                                {property.status === 'Active' ? 'Polis Aktif' : property.status === 'Expired' ? 'Kedaluwarsa' : 'Menunggu Status'}
                                            </Typography>
                                        </Grid>
                                    </Grid>

                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}

                {/* Infinite Scroll Loaders */}
                {mobileLoadingMore && (
                    <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress size={24} sx={{ color: '#1E3A8A' }} />
                    </Box>
                )}
                {hasMore && !mobileLoadingMore && (
                    <Box ref={sentinelRef} sx={{ height: 1, width: '100%' }} />
                )}
                {!hasMore && filtered.length > BATCH && (
                    <Box sx={{ py: 3, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500 }}>Semua {filtered.length} properti sudah dimuat</Typography>
                    </Box>
                )}
            </Box>
        );
    };

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
                        placeholder={'Cari properti'}
                        searchIcon={true}
                    />
                    <CustomRow className={'justify-center gap-x-4'}>
                        <CustomButton
                            startIcon={
                                <CustomIcon
                                    icon={'heroicons:plus'}
                                    sx={{ py: 0 }}
                                />
                            }
                            onClick={() => {
                                setOpenCreateDialog(true);
                                setSelectedDetail(null);
                            }}
                            color="secondary"
                            sx={{
                                height: 50,
                                minWidth: 160,
                                whiteSpace: 'nowrap',
                                px: 3,
                                borderRadius: 1.5,
                                fontSize: '0.9375rem',
                                fontWeight: 600
                            }}
                        >
                            Tambah Properti
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
                {drawerProperty && (
                    <>
                        <Box sx={{ mb: 2, px: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>{getPropertyOwnerName(drawerProperty)}</Typography>
                            <Typography variant="body2" color="text.secondary">{drawerProperty.ownerPhone || '-'}</Typography>
                        </Box>
                        <List sx={{ pb: 3 }}>
                            <ListItemButton onClick={() => { handleCloseDrawer(); setSelectedDetail(drawerProperty); setOpenCreateDialog(true); }} sx={{ borderRadius: '12px', mb: 1 }}>
                                <ListItemIcon><Icon icon="mdi:pencil-outline" width={24} color="#1E40AF" /></ListItemIcon>
                                <ListItemText primary="Edit Properti" primaryTypographyProps={{ fontWeight: 600, color: '#1E40AF' }} />
                            </ListItemButton>
                            <ListItemButton onClick={() => { handleCloseDrawer(); if (window.confirm('Yakin ingin menghapus properti ini?')) handleDelete(drawerProperty.id); }} sx={{ borderRadius: '12px' }}>
                                <ListItemIcon><Icon icon="mdi:trash-can-outline" width={24} color="#DC2626" /></ListItemIcon>
                                <ListItemText primary="Hapus Properti" primaryTypographyProps={{ fontWeight: 600, color: '#DC2626' }} />
                            </ListItemButton>
                        </List>
                    </>
                )}
            </Drawer>

            <PropertyComponent
                isNewRecord={selectedDetail === null}
                selectedDetail={selectedDetail}
                open={openCreateDialog}
                onClose={() => {
                    setOpenCreateDialog(false);
                    setSelectedDetail(null);
                }}
                onPropertySuccess={() => {
                    fetchProperties();
                    getPropertiesSummary();
                }}
                isMobile={isMobile}
            />
        </>
    );
}
