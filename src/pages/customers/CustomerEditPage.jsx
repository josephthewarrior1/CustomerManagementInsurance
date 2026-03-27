import { Icon } from '@iconify/react';
import {
    Box,
    Container,
    Typography,
    Button,
    Grid,
    Paper,
    Alert,
    Tabs,
    Tab,
    Card,
    CardContent,
    CardMedia,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useMediaQuery,
    useTheme,
    Stack
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CustomerDAO from '../../daos/CustomerDao';
import FormInput from '../../reusables/form/FormInput';
import FormFileUpload from '../../reusables/form/FormFileUpload';

function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index}>
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

// Helper function untuk format currency
const formatCurrency = (value) => {
    if (!value) return '';
    const num = parseFloat(value);
    return isNaN(num) ? '' : num.toLocaleString('id-ID');
};

// Helper function untuk compress image
const compressImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });
                            console.log(`📸 Compressed ${file.name}: ${(file.size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB`);
                            resolve(compressedFile);
                        } else {
                            reject(new Error('Canvas to Blob conversion failed'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => reject(new Error('Image load error'));
        };
        reader.onerror = () => reject(new Error('FileReader error'));
    });
};

export default function CustomerEditPage() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [customer, setCustomer] = useState(null);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    const message = useAlert();
    const loadingProvider = useLoading();

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        notes: '',
    });

    useEffect(() => {
        fetchCustomer();
    }, [id]);

    const fetchCustomer = async () => {
        try {
            loadingProvider.start();
            const response = await CustomerDAO.getCustomerById(id);

            if (response.success) {
                setCustomer(response.customer);
                setFormData({
                    name: response.customer.name || '',
                    phone: response.customer.phone || '',
                    address: response.customer.address || '',
                    notes: response.customer.notes || '',
                });
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };



    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Nama wajib diisi';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        try {
            setSaving(true);
            loadingProvider.start();

            const updateData = {
                name: formData.name,
                phone: formData.phone,
                address: formData.address,
                notes: formData.notes,
            };

            console.log('📝 Updating customer with data:', updateData);

            const response = await CustomerDAO.updateCustomer(id, updateData);

            if (!response.success) {
                throw new Error(response.error || 'Gagal memperbarui pelanggan');
            }

            console.log('✅ Customer data updated successfully');



            message('Pelanggan berhasil diperbarui!', 'success');
            navigate(`/customers/${id}`);

        } catch (error) {
            console.error('❌ Error updating customer:', error);
            message(error.error || 'Gagal memperbarui pelanggan', 'error');
        } finally {
            loadingProvider.stop();
            setSaving(false);
        }
    };



    if (loading) {
        return (
            <Container sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">Memuat data pelanggan...</Typography>
            </Container>
        );
    }



    return (
        <Box sx={{
            bgcolor: '#F8FAFC',
            minHeight: '100vh',
            pb: 6
        }}>
            <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5 } }}>
                {/* Header Section - Improved spacing and hierarchy */}
                <Box sx={{ mb: 5 }}>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
                        spacing={3}
                        sx={{ mb: 4 }}
                    >
                        <Box>
                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 700,
                                    color: '#1E293B',
                                    mb: 1,
                                    fontSize: { xs: '1.75rem', sm: '2.125rem' }
                                }}
                            >
                                Edit Pelanggan
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: '#64748B',
                                    fontSize: '0.875rem',
                                    fontWeight: 500
                                }}
                            >
                                ID Pelanggan: <Box component="span" sx={{ color: '#475569' }}>{id}</Box>
                            </Typography>
                        </Box>

                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            sx={{ width: { xs: '100%', sm: 'auto' } }}
                        >
                            <Button
                                variant="outlined"
                                startIcon={<Icon icon="mdi:arrow-left" />}
                                onClick={() => navigate(`/customers/${id}`)}
                                sx={{
                                    borderColor: '#E2E8F0',
                                    color: '#475569',
                                    fontWeight: 600,
                                    px: 3,
                                    py: 1.25,
                                    textTransform: 'none',
                                    fontSize: '0.9375rem',
                                    borderRadius: 2,
                                    '&:hover': {
                                        borderColor: '#CBD5E1',
                                        bgcolor: '#F8FAFC'
                                    }
                                }}
                            >
                                Lihat Detail
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSave}
                                disabled={saving}
                                startIcon={<Icon icon="mdi:content-save" />}
                                sx={{
                                    bgcolor: '#1E40AF',
                                    color: '#fff',
                                    fontWeight: 600,
                                    px: 3,
                                    py: 1.25,
                                    textTransform: 'none',
                                    fontSize: '0.9375rem',
                                    borderRadius: 2,
                                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
                                    '&:hover': {
                                        bgcolor: '#1E3A8A',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)'
                                    },
                                    '&:disabled': {
                                        bgcolor: '#94A3B8',
                                        color: '#fff'
                                    }
                                }}
                            >
                                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </Button>
                        </Stack>
                    </Stack>


                </Box>



                {/* Main Content Paper - Enhanced design */}
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3, sm: 5 },
                        borderRadius: 3,
                        border: '1px solid #E2E8F0',
                        bgcolor: '#fff',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    <Grid container spacing={3}>
                        <Grid size={12}>
                            <FormInput
                                label="Nama Lengkap"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                error={errors.name}
                                required
                                icon="lucide:user"
                                placeholder="Michael Santoso"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormInput
                                label="Nomor Telepon"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                icon="lucide:phone"
                                placeholder="+62 812 3456 7890"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormInput
                                label="Alamat"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                icon="lucide:map-pin"
                                placeholder="Jl. Pademangan III Raya No. 14"
                            />
                        </Grid>
                        <Grid size={12}>
                            <FormInput
                                label="Catatan Tambahan"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                multiline
                                rows={4}
                                icon="lucide:file-text"
                                placeholder="Tambahkan keterangan tambahan..."
                            />
                        </Grid>
                    </Grid>
                </Paper>
            </Container>
        </Box>
    );
}
