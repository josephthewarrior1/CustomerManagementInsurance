import { Icon } from '@iconify/react';
import {
    Box,
    Typography,
    Button,
    Chip,
    Avatar,
    IconButton,
    Dialog,
    Fade,
    CircularProgress,
    Menu,
    MenuItem,
    Stack
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CustomerDAO from '../../daos/CustomerDao';
import CreateCarDialog from '../Cars/CreateCarDialog';
import QuotationDAO from '../../daos/QuotationDao';
import InvoiceDAO from '../../daos/InvoiceDao';
import KwitansiDAO from '../../daos/KwitansiDao';
import PaymentDAO from '../../daos/PaymentDao';

const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatCurrency = (value) => {
    if (!value && value !== 0) return 'Tidak tersedia';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

/* ---------------- IMAGE PREVIEW DIALOG ---------------- */
function ImagePreviewDialog({ open, images, currentIndex, onIndexChange, onClose }) {
    if (!images || images.length === 0) return null;

    const currentImage = images[currentIndex];

    const handlePrevious = (e) => {
        e.stopPropagation();
        onIndexChange((currentIndex - 1 + images.length) % images.length);
    };

    const handleNext = (e) => {
        e.stopPropagation();
        onIndexChange((currentIndex + 1) % images.length);
    };

    const handleDownload = async (e) => {
        e.stopPropagation();
        try {
            const response = await fetch(currentImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const filename = currentImage.split('/').pop().split('?')[0] || 'download.jpg';
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            window.open(currentImage, '_blank');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullScreen TransitionComponent={Fade} PaperProps={{ sx: { bgcolor: 'rgba(0,0,0,0.9)' } }}>
            <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <Typography sx={{ color: '#fff', fontWeight: 600, ml: 2 }}>{currentIndex + 1} / {images.length}</Typography>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <IconButton onClick={handleDownload} sx={{ color: '#fff' }}><Icon icon="mdi:download" /></IconButton>
                    <IconButton onClick={onClose} sx={{ color: '#fff' }}><Icon icon="mdi:close" /></IconButton>
                </Box>
            </Box>
            {images.length > 1 && (
                <>
                    <IconButton onClick={handlePrevious} sx={{ position: 'absolute', left: 24, top: '50%', color: '#fff', zIndex: 10, display: { xs: 'none', md: 'flex' } }}><Icon icon="mdi:chevron-left" width={40} /></IconButton>
                    <IconButton onClick={handleNext} sx={{ position: 'absolute', right: 24, top: '50%', color: '#fff', zIndex: 10, display: { xs: 'none', md: 'flex' } }}><Icon icon="mdi:chevron-right" width={40} /></IconButton>
                </>
            )}
            <Box onClick={onClose} sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', p: { xs: 2, md: 8 } }}>
                <Box component="img" src={currentImage} alt="Preview" onClick={e => e.stopPropagation()} sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '30%', zIndex: 5, display: { xs: 'block', md: 'none' } }} onClick={handlePrevious} />
                <Box sx={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '30%', zIndex: 5, display: { xs: 'block', md: 'none' } }} onClick={handleNext} />
            </Box>
        </Dialog>
    );
}

export default function CustomerDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const message = useAlert();
    const loadingProvider = useLoading();

    const [customer, setCustomer] = useState(null);
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0); // 0 = Info Pribadi, 1 = Kendaraan, 2 = Dokumen
    const [previewState, setPreviewState] = useState({ open: false, images: [], index: 0 });
    const [isCarDialogOpen, setIsCarDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [quotations, setQuotations] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [kwitansis, setKwitansis] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    
    // Top right menu
    const [anchorEl, setAnchorEl] = useState(null);
    const isMenuOpen = Boolean(anchorEl);

    useEffect(() => {
        fetchCustomer();
    }, [id]);

    const fetchDocuments = async (customerCars) => {
        try {
            setLoadingDocs(true);
            const [invoicesRes, kwitansisRes, paymentsRes] = await Promise.all([
                InvoiceDAO.getAllInvoices(),
                KwitansiDAO.getAllKwitansi(),
                PaymentDAO.getPaymentsByCustomer(id)
            ]);

            // Filter Invoices
            const rawInvoices = invoicesRes?.data || invoicesRes?.invoices || (Array.isArray(invoicesRes) ? invoicesRes : []);
            const customerInvoices = rawInvoices.filter(inv => inv.customerId === id);
            setInvoices(customerInvoices);

            // Filter Kwitansis
            const rawKwitansis = kwitansisRes?.data || kwitansisRes?.kwitansis || (Array.isArray(kwitansisRes) ? kwitansisRes : []);
            const paymentList = paymentsRes?.payments || paymentsRes?.data || (Array.isArray(paymentsRes) ? paymentsRes : []);
            const paymentIds = new Set(paymentList.map(p => p.id));
            const customerKwitansis = rawKwitansis.filter(k => paymentIds.has(k.paymentId));
            setKwitansis(customerKwitansis);

            // Fetch Quotations by car policies
            const accumulatedQuotes = [];
            if (customerCars && customerCars.length > 0) {
                const quotePromises = customerCars.map(car => QuotationDAO.getQuotationsByPolicy(car.id));
                const quoteResponses = await Promise.all(quotePromises);
                quoteResponses.forEach(res => {
                    const list = res?.quotations || res?.data || (Array.isArray(res) ? res : []);
                    accumulatedQuotes.push(...list);
                });
            }
            setQuotations(accumulatedQuotes);
        } catch (error) {
            console.error('Error fetching customer documents:', error);
            message('Gagal memuat dokumen riwayat customer', 'error');
        } finally {
            setLoadingDocs(false);
        }
    };

    const fetchCustomer = async () => {
        try {
            loadingProvider.start();
            const response = await CustomerDAO.getCustomerById(id);
            if (response.success) {
                setCustomer(response.customer);
                const carList = response.cars || [];
                setCars(carList);
                await fetchDocuments(carList);
            } else {
                message(response.error || 'Pelanggan tidak ditemukan', 'error');
                navigate('/customers');
            }
        } catch (error) {
            console.error('Error fetching customer:', error);
            message('Gagal mengambil data pelanggan', 'error');
            navigate('/customers');
        } finally {
            loadingProvider.stop();
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            loadingProvider.start();
            const response = await CustomerDAO.deleteCustomer(id);
            if (response.success) {
                message('Pelanggan berhasil dihapus', 'success');
                navigate('/customers');
            } else {
                message(response.error || 'Gagal menghapus pelanggan', 'error');
            }
        } catch (err) {
            message('Gagal menghapus pelanggan', 'error');
        } finally {
            loadingProvider.stop();
            setDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    const handleCarCreated = (newCar) => {
        setCars(prev => [...prev, newCar]);
    };

    if (loading || !customer) {
        return null;
    }

    return (
        <Box sx={{ bgcolor: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header / App Bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
                <IconButton onClick={() => navigate('/customers')} sx={{ color: '#2563EB', pl: 1 }}>
                    <Icon icon="mdi:arrow-left" width={24} />
                </IconButton>
                <Typography sx={{ fontWeight: 600, fontSize: '1.05rem', color: '#1E293B' }}>
                    Customer Profile
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
                <MenuItem onClick={() => { setAnchorEl(null); navigate(`/customers/edit/${id}`); }} sx={{ fontSize: '0.9rem', color: '#1E293B' }}>
                    <Icon icon="mdi:pencil" width={20} style={{ marginRight: 8, color: '#64748B' }} />
                    Edit Profile
                </MenuItem>
                <MenuItem onClick={() => { setAnchorEl(null); setIsDeleteDialogOpen(true); }} sx={{ fontSize: '0.9rem', color: '#DC2626' }}>
                    <Icon icon="mdi:trash-can" width={20} style={{ marginRight: 8 }} />
                    Hapus Profile
                </MenuItem>
            </Menu>

            <Box sx={{ p: 3, pt: 1, flex: 1, maxWidth: '600px', mx: 'auto', width: '100%' }}>
                {/* Profile Card */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3.5 }}>
                    <Box sx={{ position: 'relative' }}>
                        <Avatar sx={{ width: 90, height: 90, bgcolor: '#E0F2FE', color: '#1E3A8A', fontSize: '2.5rem', fontWeight: 800 }}>
                            {customer.name?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box sx={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, bgcolor: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon icon="mdi:check-decagram" color="#2563EB" width={22} />
                        </Box>
                    </Box>
                    <Typography sx={{ mt: 2.5, fontSize: '1.45rem', fontWeight: 800, color: '#1E293B' }}>
                        {customer.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>

                        <Typography sx={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 500 }}>
                            {customer.id}
                        </Typography>
                    </Box>
                </Box>

                {/* Segmented Tabs */}
                <Box sx={{ bgcolor: '#F8FAFC', borderRadius: '12px', p: 0.5, display: 'flex', mb: 4 }}>
                    <Box
                        onClick={() => setTabValue(0)}
                        sx={{
                            flex: 1, textAlign: 'center', py: 1.25, borderRadius: '8px',
                            cursor: 'pointer', transition: 'all 0.2s',
                            bgcolor: tabValue === 0 ? '#ffffff' : 'transparent',
                            color: tabValue === 0 ? '#1E293B' : '#64748B',
                            fontWeight: tabValue === 0 ? 700 : 600,
                            boxShadow: tabValue === 0 ? '0 1px 4px rgba(0,0,0,0.05)' : 'none',
                            fontSize: '0.85rem'
                        }}
                    >
                        Info Pribadi
                    </Box>
                    <Box
                        onClick={() => setTabValue(1)}
                        sx={{
                            flex: 1, textAlign: 'center', py: 1.25, borderRadius: '8px',
                            cursor: 'pointer', transition: 'all 0.2s',
                            bgcolor: tabValue === 1 ? '#ffffff' : 'transparent',
                            color: tabValue === 1 ? '#2563EB' : '#64748B',
                            fontWeight: tabValue === 1 ? 700 : 600,
                            boxShadow: tabValue === 1 ? '0 1px 4px rgba(0,0,0,0.05)' : 'none',
                            fontSize: '0.85rem'
                        }}
                    >
                        Kendaraan ({cars.length})
                    </Box>
                    <Box
                        onClick={() => setTabValue(2)}
                        sx={{
                            flex: 1, textAlign: 'center', py: 1.25, borderRadius: '8px',
                            cursor: 'pointer', transition: 'all 0.2s',
                            bgcolor: tabValue === 2 ? '#ffffff' : 'transparent',
                            color: tabValue === 2 ? '#2563EB' : '#64748B',
                            fontWeight: tabValue === 2 ? 700 : 600,
                            boxShadow: tabValue === 2 ? '0 1px 4px rgba(0,0,0,0.05)' : 'none',
                            fontSize: '0.85rem'
                        }}
                    >
                        Dokumen ({quotations.length + invoices.length + kwitansis.length})
                    </Box>
                </Box>

                {/* Tab Content */}
                {tabValue === 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3 }}>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', mb: 0.5, letterSpacing: 0.5 }}>NOMOR TELEPON</Typography>
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>{customer.phone || '-'}</Typography>
                        </Box>
                        <Box sx={{ bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3 }}>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', mb: 0.5, letterSpacing: 0.5 }}>ALAMAT</Typography>
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>{customer.address || '-'}</Typography>
                        </Box>
                        <Box sx={{ bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3 }}>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', mb: 0.5, letterSpacing: 0.5 }}>CATATAN</Typography>
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>{customer.notes || '-'}</Typography>
                        </Box>
                    </Box>
                )}

                {tabValue === 1 && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                            <Typography sx={{ fontWeight: 700, color: '#1E293B', fontSize: '1rem' }}>
                                Kendaraan Terkait
                            </Typography>
                            <Button
                                startIcon={<Icon icon="mdi:plus-circle" width={18} />}
                                onClick={() => setIsCarDialogOpen(true)}
                                sx={{ color: '#2563EB', fontWeight: 700, textTransform: 'none', px: 1, minWidth: 0, fontSize: '0.85rem' }}
                            >
                                Tambah Kendaraan
                            </Button>
                        </Box>

                        {cars.length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {cars.map((car) => (
                                    <Box
                                        key={car.id}
                                        onClick={() => navigate(`/cars/${car.id}`)}
                                        sx={{
                                            bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            transition: 'all 0.2s', '&:hover': { bgcolor: '#F1F5F9' }
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                                            <Box sx={{ width: 44, height: 44, borderRadius: 3, bgcolor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Icon icon="mdi:car" color="#64748B" width={22} />
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>
                                                    {car.carData?.carBrand}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#1E293B', mt: 0.2, lineHeight: 1.2 }}>
                                                    {car.carData?.carModel}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B', mt: 0.4 }}>
                                                    {car.carData?.plateNumber}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Icon icon="mdi:chevron-right" color="#64748B" width={24} />
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            <Box sx={{ py: 4, textAlign: 'center' }}>
                                <Typography sx={{ color: '#94A3B8', fontSize: '0.9rem', fontWeight: 500 }}>Belum ada kendaraan</Typography>
                            </Box>
                        )}
                    </Box>
                )}

                {tabValue === 2 && (
                    <Box>
                        {loadingDocs ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                <CircularProgress size={32} />
                            </Box>
                        ) : (
                            <Stack spacing={4}>
                                {/* SECTION 1: PENAWARAN (QUOTATIONS) */}
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography sx={{ fontWeight: 700, color: '#1E293B', fontSize: '1rem' }}>
                                            Penawaran (Quotation)
                                        </Typography>
                                        <Button
                                            startIcon={<Icon icon="mdi:plus-circle" width={18} />}
                                            onClick={() => navigate(`/quotations/create?customerId=${id}`)}
                                            sx={{ color: '#2563EB', fontWeight: 700, textTransform: 'none', px: 1, minWidth: 0, fontSize: '0.85rem' }}
                                        >
                                            Buat Penawaran
                                        </Button>
                                    </Box>
                                    {quotations.length > 0 ? (
                                        <Stack spacing={1.5}>
                                            {quotations.map(q => (
                                                <Box
                                                    key={q.id}
                                                    sx={{
                                                        bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        border: '1px solid #F1F5F9'
                                                    }}
                                                >
                                                    <Box>
                                                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E293B' }}>
                                                            {q.quotationNumber}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.75rem', color: '#64748B', mt: 0.5 }}>
                                                            {q.insuranceProvider || 'Asuransi'} · {q.insuranceType || 'Tipe'}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.75rem', color: '#64748B', mt: 0.2 }}>
                                                            TSI: {formatCurrency(q.sumInsured || q.tsi)} · Premi: {formatCurrency(q.totalPremium || q.premium)}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.5 }}>
                                                            Dibuat: {formatDate(q.createdAt)}
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label={q.status || 'Draft'}
                                                        size="small"
                                                        color={q.status === 'Accepted' ? 'success' : q.status === 'Draft' ? 'default' : 'warning'}
                                                        sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                                                    />
                                                </Box>
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Box sx={{ py: 3, textAlign: 'center', bgcolor: '#F8FAFC', borderRadius: 3 }}>
                                            <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 500 }}>Belum ada penawaran</Typography>
                                        </Box>
                                    )}
                                </Box>

                                {/* SECTION 2: INVOICES */}
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography sx={{ fontWeight: 700, color: '#1E293B', fontSize: '1rem' }}>
                                            Invoice (Tagihan)
                                        </Typography>
                                        <Button
                                            startIcon={<Icon icon="mdi:plus-circle" width={18} />}
                                            onClick={() => navigate(`/invoices/create?customerId=${id}`)}
                                            sx={{ color: '#2563EB', fontWeight: 700, textTransform: 'none', px: 1, minWidth: 0, fontSize: '0.85rem' }}
                                        >
                                            Buat Invoice
                                        </Button>
                                    </Box>
                                    {invoices.length > 0 ? (
                                        <Stack spacing={1.5}>
                                            {invoices.map(inv => (
                                                <Box
                                                    key={inv.id}
                                                    sx={{
                                                        bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        border: '1px solid #F1F5F9'
                                                    }}
                                                >
                                                    <Box>
                                                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E293B' }}>
                                                            {inv.invoiceNumber}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.75rem', color: '#64748B', mt: 0.5 }}>
                                                            Total: {formatCurrency(inv.grandTotal)}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.5 }}>
                                                            Jatuh Tempo: {formatDate(inv.dueDate)}
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label={inv.status}
                                                        size="small"
                                                        color={inv.status === 'Paid' ? 'success' : inv.status === 'Unpaid' ? 'error' : 'warning'}
                                                        sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                                                    />
                                                </Box>
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Box sx={{ py: 3, textAlign: 'center', bgcolor: '#F8FAFC', borderRadius: 3 }}>
                                            <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 500 }}>Belum ada invoice</Typography>
                                        </Box>
                                    )}
                                </Box>

                                {/* SECTION 3: KWITANSI (RECEIPTS) */}
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography sx={{ fontWeight: 700, color: '#1E293B', fontSize: '1rem' }}>
                                            Kwitansi (Kuitansi)
                                        </Typography>
                                        <Button
                                            startIcon={<Icon icon="mdi:plus-circle" width={18} />}
                                            onClick={() => navigate(`/kwitansi`)}
                                            sx={{ color: '#2563EB', fontWeight: 700, textTransform: 'none', px: 1, minWidth: 0, fontSize: '0.85rem' }}
                                        >
                                            Buat Kwitansi
                                        </Button>
                                    </Box>
                                    {kwitansis.length > 0 ? (
                                        <Stack spacing={1.5}>
                                            {kwitansis.map(kw => (
                                                <Box
                                                    key={kw.id}
                                                    sx={{
                                                        bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        border: '1px solid #F1F5F9'
                                                    }}
                                                >
                                                    <Box>
                                                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E293B' }}>
                                                            {kw.kwitansiNumber || kw.id}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.75rem', color: '#64748B', mt: 0.5 }}>
                                                            Nominal: {formatCurrency(kw.invoiceData?.grandTotal)}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.5 }}>
                                                            Dibuat: {formatDate(kw.createdAt)}
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label={`Print: ${kw.printCount || 1}x`}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                                                    />
                                                </Box>
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Box sx={{ py: 3, textAlign: 'center', bgcolor: '#F8FAFC', borderRadius: 3 }}>
                                            <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 500 }}>Belum ada kwitansi</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Stack>
                        )}
                    </Box>
                )}
            </Box>

            {/* Bottom Button Action */}
            <Box sx={{ pb: 4 }} /> {/* Add some spacing below instead of button */}

            <ImagePreviewDialog
                open={previewState.open}
                images={previewState.images}
                currentIndex={previewState.index}
                onIndexChange={(newIndex) => setPreviewState(prev => ({ ...prev, index: newIndex }))}
                onClose={() => setPreviewState({ open: false, images: [], index: 0 })}
            />
            <CreateCarDialog
                open={isCarDialogOpen}
                onClose={() => setIsCarDialogOpen(false)}
                customerId={id}
                onCarCreated={handleCarCreated}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ style: { borderRadius: '16px' } }}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Hapus Pelanggan</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>
                        Yakin ingin menghapus <b>{customer.name}</b>? Tindakan ini tidak dapat dibatalkan.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button onClick={() => setIsDeleteDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 700, color: '#475569' }}>Batal</Button>
                        <Button variant="contained" onClick={handleDelete} disabled={deleting} sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, borderRadius: 2, boxShadow: 'none' }}>
                            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Hapus'}
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </Box>
    );
}
