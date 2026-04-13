import { Icon } from '@iconify/react';
import {
    Box, Typography, Button, Dialog, CircularProgress, Stack, Avatar, Chip, IconButton, Menu, MenuItem
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CarDAO from '../../daos/CarDao';
import RenewalDAO from '../../daos/RenewalDao';
import QuotationDAO from '../../daos/QuotationDao';
import CreateRenewalDialog from '../Renewals/CreateRenewalDialog';

/* ─── READ ONLY IMAGE CARD ─── */
function DetailImageCard({ label, url, onPreview }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', mb: 1, display: 'block', letterSpacing: 0.5 }}>{label}</Typography>
            <Box onClick={() => url && onPreview(url)} sx={{ position: 'relative', width: '100%', paddingTop: '75%', borderRadius: 3, overflow: 'hidden', border: url ? '1px solid #E2E8F0' : '2px dashed #CBD5E1', bgcolor: '#F8FAFC', cursor: url ? 'pointer' : 'default', transition: 'all 0.2s', '&:hover': url ? { borderColor: '#1E40AF' } : {} }}>
                {url ? <img src={url} alt={label} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><Icon icon="mdi:camera-off" width={32} color="#CBD5E1" /><Typography fontSize={13} fontWeight={600} sx={{ color: '#94A3B8', mt: 1 }}>Tidak Ada Foto</Typography></Box>}
            </Box>
        </Box>
    );
}

/* ─── READ ONLY DOC CARD ─── */
function DetailDocCard({ label, url, onPreview }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', mb: 1, display: 'block', letterSpacing: 0.5 }}>{label}</Typography>
            <Box onClick={() => url && onPreview(url)} sx={{ position: 'relative', width: '100%', height: 180, borderRadius: 3, overflow: 'hidden', border: url ? '1px solid #E2E8F0' : '2px dashed #CBD5E1', bgcolor: '#F8FAFC', cursor: url ? 'pointer' : 'default', transition: 'all 0.2s', '&:hover': url ? { borderColor: '#1E40AF' } : {} }}>
                {url ? <img src={url} alt={label} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', bgcolor: '#fff' }} /> : <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><Icon icon="mdi:file-hidden" width={32} color="#CBD5E1" /><Typography fontSize={13} fontWeight={600} sx={{ color: '#94A3B8', mt: 1 }}>Tidak Ada Dokumen</Typography></Box>}
            </Box>
        </Box>
    );
}

/* ─── IMAGE PREVIEW DIALOG ─── */
function ImagePreviewDialog({ open, images, currentIndex, onClose, onIndexChange }) {
    const handleDownload = async () => {
        try {
            const url = images[currentIndex];
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `photo_${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            const link = document.createElement('a');
            link.href = images[currentIndex];
            link.download = `photo_${Date.now()}.jpg`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullScreen PaperProps={{ style: { background: 'rgba(0,0,0,0.95)' } }}>
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 2 }}>
                <IconButton onClick={onClose} sx={{ position: 'absolute', top: 16, right: 16, color: '#fff', zIndex: 10 }}>
                    <Icon icon="mdi:close" width={28} />
                </IconButton>
                <IconButton onClick={handleDownload} sx={{ position: 'absolute', top: 16, right: 64, color: '#fff', zIndex: 10 }}>
                    <Icon icon="mdi:download" width={28} />
                </IconButton>
                {images.length > 0 && (
                    <img src={images[currentIndex]} alt="preview" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
                )}
                {images.length > 1 && (
                    <>
                        <IconButton onClick={() => onIndexChange((currentIndex - 1 + images.length) % images.length)}
                            sx={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#fff', zIndex: 10 }}>
                            <Icon icon="mdi:chevron-left" width={32} />
                        </IconButton>
                        <IconButton onClick={() => onIndexChange((currentIndex + 1) % images.length)}
                            sx={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#fff', zIndex: 10 }}>
                            <Icon icon="mdi:chevron-right" width={32} />
                        </IconButton>
                    </>
                )}
            </Box>
        </Dialog>
    );
}

const formatCurrency = (value) => {
    if (!value) return 'Tidak tersedia';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

export default function CarDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const loadingProvider = useLoading();
    const message = useAlert();

    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [previewState, setPreviewState] = useState({ open: false, images: [], index: 0 });

    const [renewals, setRenewals] = useState([]);
    const [loadingRenewals, setLoadingRenewals] = useState(true);
    const [createRenewalOpen, setCreateRenewalOpen] = useState(false);

    const [quotations, setQuotations] = useState([]);
    const [loadingQuotations, setLoadingQuotations] = useState(true);
    const [acceptingQuote, setAcceptingQuote] = useState(false);

    // Top right menu
    const [anchorEl, setAnchorEl] = useState(null);
    const isMenuOpen = Boolean(anchorEl);

    useEffect(() => {
        fetchCar();
    }, [id]);

    useEffect(() => {
        if (car) {
            fetchRenewals();
            fetchQuotations();
        }
    }, [car]);

    const fetchCar = async () => {
        try {
            loadingProvider.start();
            const response = await CarDAO.getCarById(id);
            if (response.success || response.car) {
                setCar(response.car || response);
            } else {
                message(response.error || 'Kendaraan tidak ditemukan', 'error');
                navigate('/cars');
            }
        } catch (err) {
            console.error(err);
            message('Gagal memuat data kendaraan', 'error');
            navigate('/cars');
        } finally {
            loadingProvider.stop();
            setLoading(false);
        }
    };

    const fetchRenewals = async () => {
        try {
            setLoadingRenewals(true);
            const res = await RenewalDAO.getRenewalsByCustomer(car.customerId);
            if (res.success) {
                const carRenewals = (res.renewals || []).filter(r => r.policyId === id);
                setRenewals(carRenewals);
            }
        } catch { } 
        finally { setLoadingRenewals(false); }
    };

    const fetchQuotations = async () => {
        try {
            setLoadingQuotations(true);
            const res = await QuotationDAO.getQuotationsByPolicy(id);
            if (res.success) {
                setQuotations(res.quotations || []);
            }
        } catch { } 
        finally { setLoadingQuotations(false); }
    };

    const handleAcceptQuotation = async (quoId) => {
        try {
            setAcceptingQuote(true);
            const res = await QuotationDAO.acceptQuotation(quoId);
            if (res.success) {
                message('Penawaran berhasil disetujui', 'success');
                fetchQuotations();
                fetchCar();
            } else {
                message(res.error || 'Gagal menyetujui penawaran', 'error');
            }
        } catch {
            message('Gagal menyetujui penawaran', 'error');
        } finally {
            setAcceptingQuote(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            const response = await CarDAO.deleteCar(id);
            if (response.success) {
                message('Kendaraan berhasil dihapus', 'success');
                navigate('/cars');
            } else {
                message(response.error || 'Gagal menghapus kendaraan', 'error');
            }
        } catch (err) {
            message('Gagal menghapus kendaraan', 'error');
        } finally {
            setDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    const openPhotoPreview = (photoUrls) => {
        const validPhotos = photoUrls.filter(p => p && p.trim() !== '');
        if (validPhotos.length > 0) {
            setPreviewState({ open: true, images: validPhotos, index: 0 });
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#fff' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!car) return null;

    const carBrand = car.carData?.carBrand || '-';
    const carModel = car.carData?.carModel || '-';
    const plateNumber = car.carData?.plateNumber || '-';

    const docPhotos = [
        { label: 'STNK', key: 'stnk', url: car.documentPhotos?.stnk },
        { label: 'SIM', key: 'sim', url: car.documentPhotos?.sim },
        { label: 'KTP', key: 'ktp', url: car.documentPhotos?.ktp },
    ];

    const carPhotos = [
        { label: 'Depan', url: car.carPhotos?.front },
        { label: 'Belakang', url: car.carPhotos?.back },
        { label: 'Kiri', url: car.carPhotos?.leftSide },
        { label: 'Kanan', url: car.carPhotos?.rightSide },
    ];

    const dueDate = new Date(car.carData?.dueDate);
    const isExpired = car.status === 'Expired';
    const msInDay = 24 * 60 * 60 * 1000;
    const isNearExpire = dueDate && !isNaN(dueDate.getTime()) && (dueDate.getTime() - Date.now() <= 30 * msInDay);
    const needsRenewal = isExpired || isNearExpire;
    const hasOngoingRenewal = renewals.some(r => ['Pending', 'Approved', 'Paid'].includes(r.status));

    const tabs = [
        { label: 'Info' },
        { label: 'Dokumen' },
        { label: 'Foto' },
        { label: 'Renewals' },
        { label: 'Penawaran' }
    ];

    return (
        <Box sx={{ bgcolor: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header / App Bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
                <IconButton onClick={() => navigate('/cars')} sx={{ color: '#2563EB', pl: 1 }}>
                    <Icon icon="mdi:arrow-left" width={24} />
                </IconButton>
                <Typography sx={{ fontWeight: 600, fontSize: '1.05rem', color: '#1E293B' }}>
                    Vehicle Profile
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
                <MenuItem onClick={() => { setAnchorEl(null); navigate(`/cars/edit/${id}`); }} sx={{ fontSize: '0.9rem', color: '#1E293B' }}>
                    <Icon icon="mdi:pencil" width={20} style={{ marginRight: 8, color: '#64748B' }} />
                    Edit Vehicle
                </MenuItem>
                <MenuItem onClick={() => { setAnchorEl(null); setIsDeleteDialogOpen(true); }} sx={{ fontSize: '0.9rem', color: '#DC2626' }}>
                    <Icon icon="mdi:trash-can" width={20} style={{ marginRight: 8 }} />
                    Delete Vehicle
                </MenuItem>
            </Menu>

            <Box sx={{ p: 3, pt: 1, flex: 1, maxWidth: '600px', mx: 'auto', width: '100%' }}>
                {/* Profile Card */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3.5 }}>
                    <Box sx={{ position: 'relative' }}>
                        <Avatar sx={{ width: 90, height: 90, bgcolor: '#E0F2FE', color: '#1E3A8A', fontSize: '2.5rem' }}>
                            <Icon icon="mdi:car" />
                        </Avatar>
                        <Box sx={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, bgcolor: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon icon={isExpired ? "mdi:alert-decagram" : "mdi:check-decagram"} color={isExpired ? "#DC2626" : "#2563EB"} width={22} />
                        </Box>
                    </Box>
                    <Typography sx={{ mt: 2.5, fontSize: '1.45rem', fontWeight: 800, color: '#1E293B' }}>
                        {carBrand} {carModel}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Chip
                            label={car.status === 'Active' ? 'AKTIF' : car.status.toUpperCase()}
                            size="small"
                            sx={{
                                bgcolor: car.status === 'Active' ? '#E0F2FE' : '#FEE2E2',
                                color: car.status === 'Active' ? '#1D4ED8' : '#991B1B',
                                fontWeight: 800, fontSize: '0.65rem', height: 20, px: 0.5
                            }}
                        />
                        <Typography sx={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 500 }}>
                            {plateNumber}
                        </Typography>
                    </Box>
                </Box>

                {needsRenewal && !hasOngoingRenewal && (
                    <Box sx={{ mb: 4, p: 2, bgcolor: isExpired ? '#FEF2F2' : '#FFFBEB', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Icon icon="mdi:alert-circle" width={24} color={isExpired ? '#DC2626' : '#D97706'} />
                            <Box>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: isExpired ? '#991B1B' : '#92400E' }}>
                                    {isExpired ? 'Polis Habis' : 'Jatuh Tempo'}
                                </Typography>
                            </Box>
                        </Box>
                        <Button 
                            onClick={() => setCreateRenewalOpen(true)}
                            sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', color: isExpired ? '#DC2626' : '#D97706', p: 0, minWidth: 0 }}
                        >
                            Perpanjang
                        </Button>
                    </Box>
                )}

                {/* Segmented Tabs (Scrollable) */}
                <Box sx={{ bgcolor: '#F8FAFC', borderRadius: '12px', p: 0.5, display: 'flex', gap: 0.5, mb: 4, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
                    {tabs.map((tab, idx) => (
                        <Box
                            key={idx}
                            onClick={() => setTabValue(idx)}
                            sx={{
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

                {/* Tab 0: Info Kendaraan */}
                {tabValue === 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3 }}>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', mb: 0.5, letterSpacing: 0.5 }}>TAHUN / WARNA</Typography>
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>{car.carData?.year || '-'} / {car.carData?.color || '-'}</Typography>
                        </Box>
                        <Box sx={{ bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3 }}>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', mb: 0.5, letterSpacing: 0.5 }}>PEMILIK</Typography>
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>{car.carData?.ownerName || '-'}</Typography>
                        </Box>
                        <Box sx={{ bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3 }}>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', mb: 0.5, letterSpacing: 0.5 }}>HARGA / PERTANGGUNGAN</Typography>
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>{formatCurrency(car.carData?.carPrice)}</Typography>
                        </Box>
                        <Box sx={{ bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3 }}>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', mb: 0.5, letterSpacing: 0.5 }}>ASURANSI / PERLUASAN</Typography>
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>
                                {car.carData?.insuranceProvider || '-'} ({car.carData?.insuranceType || '-'})<br/>
                                <Typography component="span" sx={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>
                                    {car.carData?.coverageExtensions?.length > 0 ? car.carData.coverageExtensions.join(', ') : '-'}
                                </Typography>
                            </Typography>
                        </Box>
                        <Box sx={{ bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3 }}>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', mb: 0.5, letterSpacing: 0.5 }}>JATUH TEMPO ASURANSI</Typography>
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>{car.carData?.dueDate || '-'}</Typography>
                        </Box>
                        <Box sx={{ bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3 }}>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', mb: 0.5, letterSpacing: 0.5 }}>NO. RANGKA / MESIN</Typography>
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>
                                {car.carData?.chassisNumber || '-'} <br/> {car.carData?.engineNumber || '-'}
                            </Typography>
                        </Box>
                    </Box>
                )}

                {/* Tab 1: Dokumen */}
                {tabValue === 1 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {docPhotos.map(doc => (
                            <DetailDocCard key={doc.key} label={doc.label} url={doc.url} onPreview={(u) => openPhotoPreview([u])} />
                        ))}
                    </Box>
                )}

                {/* Tab 2: Foto */}
                {tabValue === 2 && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                        {carPhotos.map(photo => (
                            <DetailImageCard key={photo.label} label={photo.label} url={photo.url} onPreview={(url) => {
                                const allValid = carPhotos.filter(p => p.url).map(p => p.url);
                                openPhotoPreview(allValid);
                            }} />
                        ))}
                    </Box>
                )}

                {/* Tab 3: Renewals */}
                {tabValue === 3 && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>History Rekam Jejak</Typography>
                            <Button startIcon={<Icon icon="mdi:plus-circle" width={18}/>} onClick={() => setCreateRenewalOpen(true)} sx={{fontWeight: 700, textTransform: 'none', px: 1, color: '#2563EB', fontSize: '0.85rem'}}>Buat Renewal</Button>
                        </Box>
                        {loadingRenewals ? (
                            <Box textAlign="center" py={4}><CircularProgress size={24} /></Box>
                        ) : renewals.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}><Typography sx={{ color: '#94A3B8', fontSize: '0.9rem', fontWeight: 500 }}>Belum ada data renewal</Typography></Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {renewals.map(r => (
                                    <Box key={r.id} onClick={() => navigate(`/renewals/${r.id}`)} sx={{ bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3, cursor: 'pointer' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>{r.id}</Typography>
                                            <Chip label={r.status} size="small" sx={{ bgcolor: '#E0F2FE', color: '#1D4ED8', fontWeight: 800, fontSize: '0.65rem', height: 20 }} />
                                        </Box>
                                        <Typography sx={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500, mb: 1 }}>
                                            {new Date(r.newStartDate).toLocaleDateString('id-ID')} → {new Date(r.newEndDate).toLocaleDateString('id-ID')}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#059669' }}>
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(r.premium)}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                )}

                {/* Tab 4: Permintaan Quotations */}
                {tabValue === 4 && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>Daftar Penawaran</Typography>
                            <Button startIcon={<Icon icon="mdi:plus-circle" width={18}/>} onClick={() => navigate('/quotations/create')} sx={{fontWeight: 700, textTransform: 'none', px: 1, color: '#2563EB', fontSize: '0.85rem'}}>Buat Penawaran</Button>
                        </Box>
                        {loadingQuotations ? (
                            <Box textAlign="center" py={4}><CircularProgress size={24} /></Box>
                        ) : quotations.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}><Typography sx={{ color: '#94A3B8', fontSize: '0.9rem', fontWeight: 500 }}>Belum ada penawaran tersedia</Typography></Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {quotations.map(q => (
                                    <Box key={q.id} sx={{ bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>{q.quotationNumber}</Typography>
                                            <Chip label={q.status} size="small" sx={{ bgcolor: q.status === 'Accepted' ? '#D1FAE5' : '#FEF3C7', color: q.status === 'Accepted' ? '#065F46' : '#92400E', fontWeight: 800, fontSize: '0.65rem', height: 20 }} />
                                        </Box>
                                        <Typography sx={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500, mb: 1 }}>
                                            {q.insuranceProvider || 'Asuransi'} · {q.insuranceType || 'Tipe'} <br/>
                                            TSI: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(q.tsi)}
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#1E293B' }}>
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(q.totalPremium)}
                                            </Typography>
                                            
                                            {q.status === 'Pending' && (
                                                <Button size="small" disabled={acceptingQuote} onClick={() => handleAcceptQuotation(q.id)} sx={{ bgcolor: '#059669', color: '#fff', '&:hover':{bgcolor:'#047857'}, textTransform:'none', fontWeight: 700, borderRadius: 2 }}>
                                                    {acceptingQuote ? <CircularProgress size={16} /> : 'Setujui'}
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                )}
            </Box>

            {/* Bottom Edit Action */}
            <Box sx={{ p: 3, maxWidth: '600px', mx: 'auto', width: '100%', mt: 'auto' }}>
                <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={() => navigate(`/cars/edit/${id}`)}
                    sx={{ 
                        bgcolor: '#475569', color: '#ffffff', borderRadius: 3, py: 1.8, 
                        fontWeight: 700, textTransform: 'none', fontSize: '0.95rem',
                        boxShadow: 'none',
                        '&:hover': { bgcolor: '#334155', boxShadow: 'none' }
                    }}
                >
                    Edit Vehicle Detail
                </Button>
            </Box>

            <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ style: { borderRadius: '16px' } }}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Hapus Kendaraan</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>
                        Yakin ingin menghapus <b>{carBrand} {carModel}</b> ({plateNumber})? Tindakan ini tidak dapat dibatalkan.
                    </Typography>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button onClick={() => setIsDeleteDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 700, color: '#475569' }}>Batal</Button>
                        <Button variant="contained" onClick={handleDelete} disabled={deleting} sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, borderRadius: 2, boxShadow: 'none' }}>
                            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Hapus'}
                        </Button>
                    </Stack>
                </Box>
            </Dialog>

            <CreateRenewalDialog 
                open={createRenewalOpen} 
                onClose={() => setCreateRenewalOpen(false)} 
                onCreated={() => { setCreateRenewalOpen(false); fetchRenewals(); }}
                prefillCar={car}
            />
        </Box>
    );
}
