import { Icon } from '@iconify/react';
import {
    Box,
    Typography,
    Button,
    Avatar,
    IconButton,
    CircularProgress,
    Chip,
    InputBase
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CustomerDAO from '../../daos/CustomerDao';

function StyledInput({ label, value, onChange, name, placeholder, icon, multiline = false, rows = 1 }) {
    return (
        <Box sx={{ mb: 3 }}>
            <Typography sx={{ 
                fontSize: '0.65rem', 
                fontWeight: 800, 
                color: '#94A3B8', 
                mb: 1, 
                letterSpacing: 0.5,
                textTransform: 'uppercase' 
            }}>
                {label}
            </Typography>
            <Box sx={{ 
                display: 'flex', 
                alignItems: multiline ? 'flex-start' : 'center', 
                bgcolor: '#F8FAFC', 
                borderRadius: 3, 
                p: 2,
                border: '1px solid transparent',
                transition: 'all 0.2s',
                '&:focus-within': {
                    borderColor: '#E2E8F0',
                    bgcolor: '#ffffff',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                }
            }}>
                <InputBase 
                    fullWidth 
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    multiline={multiline}
                    rows={rows}
                    sx={{ 
                        fontSize: '0.95rem', 
                        fontWeight: 600, 
                        color: '#1E293B',
                        '&::placeholder': { color: '#94A3B8', opacity: 1 }
                    }}
                />
                {icon && (
                    <Box sx={{ ml: 1, color: '#94A3B8', display: 'flex', mt: multiline ? 0.3 : 0 }}>
                        <Icon icon={icon} width={20} />
                    </Box>
                )}
            </Box>
        </Box>
    );
}

export default function CustomerEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const message = useAlert();
    const loadingProvider = useLoading();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [customer, setCustomer] = useState(null);

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
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            message('Nama lengap wajib diisi', 'error');
            return;
        }

        try {
            setSaving(true);
            loadingProvider.start();

            const response = await CustomerDAO.updateCustomer(id, {
                ...formData,
            });

            if (!response.success) {
                throw new Error(response.error || 'Gagal memperbarui pelanggan');
            }

            message('Pelanggan berhasil diperbarui!', 'success');
            navigate(`/customers/${id}`);

        } catch (error) {
            console.error('Error updating customer:', error);
            message(error.error || 'Gagal memperbarui pelanggan', 'error');
        } finally {
            loadingProvider.stop();
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#ffffff' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header / App Bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
                <IconButton onClick={() => navigate(`/customers/${id}`)} sx={{ color: '#2563EB', pl: 1 }}>
                    <Icon icon="mdi:arrow-left" width={24} />
                </IconButton>
                <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#1E293B', ml: -2 }}>
                    Edit Pelanggan
                </Typography>
                <Box sx={{ pr: 1, width: 24 }} /> {/* Balancer */}
            </Box>

            <Box sx={{ p: 3, pt: 1, flex: 1, maxWidth: '600px', mx: 'auto', width: '100%' }}>
                {/* Profile Section */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                    <Box sx={{ position: 'relative' }}>
                        <Avatar sx={{ width: 84, height: 84, bgcolor: '#1E293B', color: '#ffffff', fontSize: '2.5rem', fontWeight: 800 }}>
                            {formData.name?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box sx={{ 
                            position: 'absolute', bottom: -2, right: -2, 
                            width: 26, height: 26, bgcolor: '#ffffff', borderRadius: '50%', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                        }}>
                            <Icon icon="mdi:check-circle" color="#475569" width={22} />
                        </Box>
                    </Box>
                    
                    <Chip 
                        label={customer?.status === 'Active' ? 'PREMIUM CLIENT' : 'REGULAR CLIENT'} 
                        size="small" 
                        sx={{ 
                            mt: 2, 
                            bgcolor: '#E0F2FE', 
                            color: '#1E40AF', 
                            fontWeight: 800, 
                            fontSize: '0.65rem', 
                            height: 22, 
                            px: 1,
                            letterSpacing: 0.5
                        }} 
                    />
                </Box>

                {/* Form Fields */}
                <Box sx={{ mb: 4 }}>
                    <StyledInput
                        label="NAMA LENGKAP"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Michael Santoso"
                        icon="mdi:account"
                    />
                    <StyledInput
                        label="NOMOR TELEPON"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="082198765432"
                        icon="mdi:phone"
                    />
                    <StyledInput
                        label="ALAMAT"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Jl. Gatot Subroto No. 45, Bandung"
                        icon="mdi:map-marker"
                    />
                    <StyledInput
                        label="CATATAN TAMBAHAN"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Perpanjangan asuransi mobil tahunan"
                        icon="mdi:file-document-outline"
                        multiline
                        rows={3}
                    />
                </Box>

                {/* Submit Action */}
                <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={handleSave}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Icon icon="mdi:content-save" />}
                    sx={{ 
                        bgcolor: '#475569', color: '#ffffff', borderRadius: 3, py: 1.8, mb: 3,
                        fontWeight: 700, textTransform: 'none', fontSize: '0.95rem',
                        boxShadow: 'none',
                        '&:hover': { bgcolor: '#334155', boxShadow: 'none' }
                    }}
                >
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>

                {/* Info Box */}
                <Box sx={{ 
                    bgcolor: '#E2E8F0', 
                    borderRadius: 3, 
                    p: 2.5, 
                    display: 'flex', 
                    gap: 2,
                    alignItems: 'flex-start'
                }}>
                    <Box sx={{ 
                        bgcolor: '#ffffff', 
                        width: 32, 
                        height: 32, 
                        borderRadius: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Icon icon="mdi:information-variant" color="#475569" width={20} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', mb: 0.5 }}>
                            Perubahan Data
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B', lineHeight: 1.5 }}>
                            Pastikan seluruh informasi yang Anda ubah sudah sesuai dengan dokumen resmi pelanggan. Riwayat perubahan akan dicatat dalam sistem audit.
                        </Typography>
                    </Box>
                </Box>
                
                {/* Bottom Padding */}
                <Box sx={{ pb: 4 }} />
            </Box>
        </Box>
    );
}
