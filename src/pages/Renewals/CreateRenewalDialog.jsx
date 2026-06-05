import { Icon } from '@iconify/react';
import {
    Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle,
    Divider, FormControl, FormHelperText, InputLabel, MenuItem,
    Select, Stack, TextField, Typography, Alert, IconButton
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useAlert } from '../../hooks/SnackbarProvider';
import CarDAO from '../../daos/CarDao';
import CustomerDAO from '../../daos/CustomerDao';
import RenewalDAO from '../../daos/RenewalDao';

const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

/**
 * CreateRenewalDialog
 *
 * Creates a renewal.
 * Flow:
 * 1) Create Renewal
 * 2) Create Quotation for this renewal (send `renewalId`)
 * 3) Accept Quotation → backend auto-creates Invoice + Payment
 * 4) Mark Payment as Paid → Renewal auto-completes & policy dates updated
 */
export default function CreateRenewalDialog({ open, onClose, onCreated, prefillCar = null, prefillCustomerId = null }) {
    const message = useAlert();

    const [customers, setCustomers] = useState([]);
    const [cars, setCars] = useState([]);
    const [customerId, setCustomerId] = useState('');
    const [selectedCar, setSelectedCar] = useState(null);
    const [newStartDate, setNewStartDate] = useState('');
    const [newEndDate, setNewEndDate] = useState('');
    const [notes, setNotes] = useState('');

    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [loadingCars, setLoadingCars] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const isCarPrefilled = Boolean(prefillCar);

    const car = prefillCar || selectedCar;
    const dueDate = car?.carData?.dueDate;
    const daysLeft = dueDate ? Math.round((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
    const isTooEarly = daysLeft !== null && daysLeft > 30;

    useEffect(() => {
        if (!open) return;
        setErrors({});
        setNotes('');

        if (prefillCar) {
            setCustomerId(prefillCar.customerId || prefillCustomerId || '');
            setSelectedCar(prefillCar);
            const base = prefillCar.carData?.dueDate ? new Date(prefillCar.carData.dueDate) : new Date();
            const end = new Date(base);
            end.setFullYear(end.getFullYear() + 1);
            setNewStartDate(base.toISOString().slice(0, 10));
            setNewEndDate(end.toISOString().slice(0, 10));
        } else {
            setCustomerId(prefillCustomerId || '');
            setSelectedCar(null);
            setNewStartDate('');
            setNewEndDate('');
        }
    }, [open, prefillCar, prefillCustomerId]);

    useEffect(() => {
        if (!open || isCarPrefilled) return;
        const load = async () => {
            setLoadingCustomers(true);
            try {
                const res = await CustomerDAO.getAllCustomers();
                const list = res?.customers || res?.data || (Array.isArray(res) ? res : []);
                setCustomers(list);
            } catch {
                message('Gagal memuat daftar customer', 'error');
            } finally {
                setLoadingCustomers(false);
            }
        };
        load();
    }, [open, isCarPrefilled]);

    useEffect(() => {
        if (!customerId || isCarPrefilled) return;
        const load = async () => {
            setLoadingCars(true);
            setSelectedCar(null);
            try {
                const res = await CarDAO.getCarsByCustomer(customerId);
                const list = res?.cars || res?.data || (Array.isArray(res) ? res : []);
                setCars(list);
            } catch {
                message('Gagal memuat kendaraan', 'error');
            } finally {
                setLoadingCars(false);
            }
        };
        load();
    }, [customerId, isCarPrefilled]);

    const validate = () => {
        const e = {};
        if (!customerId) e.customerId = 'Customer wajib dipilih';
        if (!selectedCar) e.carId = 'Kendaraan wajib dipilih';
        if (selectedCar && isTooEarly) {
            e.carId = `Tidak dapat membuat renewal. Sisa masa aktif polis kendaraan masih ${daysLeft} hari (> 30 hari).`;
        }
        if (!newStartDate) e.newStartDate = 'Tanggal mulai baru wajib diisi';
        if (!newEndDate) e.newEndDate = 'Tanggal berakhir baru wajib diisi';
        if (newStartDate && newEndDate && new Date(newEndDate) <= new Date(newStartDate)) {
            e.newEndDate = 'Tanggal berakhir harus setelah tanggal mulai';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            const payload = {
                customerId: prefillCar?.customerId || customerId,
                carId: selectedCar.id,
                newStartDate,
                newEndDate,
                notes: notes || undefined,
            };
            const res = await RenewalDAO.createRenewal(payload);
            if (res.success) {
                message('Renewal berhasil dibuat. Lanjutkan buat Quotation untuk renewal ini.', 'success');
                onCreated?.(res.renewal);
                onClose();
            } else {
                message(res.error || 'Gagal membuat renewal', 'error');
            }
        } catch (err) {
            message(err?.error || 'Gagal membuat renewal', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="sm" 
            fullWidth 
            PaperProps={{ 
                sx: { 
                    borderRadius: '24px',
                    boxShadow: '0 24px 48px rgba(0,0,0,0.1), 0 12px 24px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    background: '#ffffff'
                } 
            }}
            BackdropProps={{
                sx: {
                    backdropFilter: 'blur(6px)',
                    backgroundColor: 'rgba(15, 23, 42, 0.4)'
                }
            }}
        >
            <style>{`
                @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulseSoft { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
                .fade-in-stagger > * { animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                .fade-in-stagger > *:nth-of-type(1) { animation-delay: 0.05s; }
                .fade-in-stagger > *:nth-of-type(2) { animation-delay: 0.1s; }
                .fade-in-stagger > *:nth-of-type(3) { animation-delay: 0.15s; }
                .fade-in-stagger > *:nth-of-type(4) { animation-delay: 0.2s; }
                .fade-in-stagger > *:nth-of-type(5) { animation-delay: 0.25s; }
                
                .modern-input .MuiOutlinedInput-root {
                    border-radius: 12px;
                    background-color: #f8fafc;
                    transition: all 0.2s ease;
                }
                .modern-input .MuiOutlinedInput-root:hover {
                    background-color: #f1f5f9;
                }
                .modern-input .MuiOutlinedInput-root.Mui-focused {
                    background-color: #ffffff;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
                }
            `}</style>

            {/* HEADER */}
            <Box sx={{ 
                position: 'relative', 
                p: 3, 
                pb: 2, 
                background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
                borderBottom: '1px solid #f1f5f9'
            }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: '16px', 
                            background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            boxShadow: '0 8px 16px rgba(59, 130, 246, 0.25)',
                            color: '#ffffff'
                        }}>
                            <Icon icon="mdi:autorenew" width={24} />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>
                                Buat Renewal Polis
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                                Perpanjang masa aktif asuransi kendaraan
                            </Typography>
                        </Box>
                    </Stack>
                    <IconButton 
                        onClick={onClose} 
                        sx={{ 
                            bgcolor: '#f1f5f9', 
                            color: '#64748b', 
                            '&:hover': { bgcolor: '#e2e8f0', color: '#0f172a', transform: 'rotate(90deg)' },
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <Icon icon="mdi:close" width={20} />
                    </IconButton>
                </Stack>
            </Box>

            <DialogContent sx={{ p: 3, pt: 2, '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: '10px' } }}>
                <Stack spacing={3} className="fade-in-stagger">
                    
                    {/* ALERTS */}
                    {isTooEarly && (
                        <Box sx={{ 
                            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                            border: '1px solid #fca5a5',
                            borderRadius: '16px',
                            p: 2,
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.1, color: '#ef4444' }}>
                                <Icon icon="mdi:shield-alert" width={100} />
                            </Box>
                            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                <Box sx={{ mt: 0.3, color: '#ef4444', animation: 'pulseSoft 2s infinite', borderRadius: '50%' }}>
                                    <Icon icon="mdi:alert-circle" width={22} />
                                </Box>
                                <Box sx={{ position: 'relative', zIndex: 1 }}>
                                    <Typography sx={{ fontWeight: 800, color: '#991b1b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                                        Perpanjangan Dinonaktifkan (Sisa {daysLeft} Hari)
                                    </Typography>
                                    <Typography sx={{ fontSize: '13px', color: '#b91c1c', lineHeight: 1.5, fontWeight: 500 }}>
                                        Polis masih aktif lebih dari 30 hari. Perpanjangan baru dapat dibuat ketika masa aktif kurang dari atau sama dengan 30 hari.
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    )}

                    <Box sx={{ 
                        bgcolor: '#f0f9ff',
                        borderLeft: '4px solid #0ea5e9',
                        borderRadius: '0 12px 12px 0',
                        p: 2,
                        pr: 3
                    }}>
                        <Stack direction="row" spacing={1.5}>
                            <Icon icon="mdi:information" width={22} color="#0ea5e9" style={{ marginTop: 2 }} />
                            <Box>
                                <Typography sx={{ fontWeight: 700, color: '#0369a1', fontSize: '13px', mb: 0.5 }}>
                                    Alur Renewal:
                                </Typography>
                                <Typography sx={{ fontSize: '12.5px', color: '#075985', lineHeight: 1.6 }}>
                                    <b>1.</b> Buat Renewal → <b>2.</b> Buat & Setujui Quotation → <b>3.</b> Invoice & Tagihan otomatis terbentuk → <b>4.</b> Lunas = Polis Aktif.
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>

                    {/* CUSTOMER & VEHICLE CARDS */}
                    {isCarPrefilled ? (
                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr', 
                            gap: 2,
                            p: 2,
                            bgcolor: '#f8fafc',
                            borderRadius: '16px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <Box>
                                <Typography sx={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                                    Customer
                                </Typography>
                                <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                                    {prefillCar?.carData?.ownerName || prefillCar?.customerName || '-'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                                    Kendaraan
                                </Typography>
                                <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                                    {prefillCar?.carData?.carBrand} {prefillCar?.carData?.carModel}
                                </Typography>
                                <Typography sx={{ fontSize: '12px', color: '#64748b', mt: 0.2 }}>
                                    {prefillCar?.carData?.plateNumber || '-'}
                                </Typography>
                            </Box>
                            <Box sx={{ gridColumn: '1 / -1', pt: 1.5, mt: 0.5, borderTop: '1px dashed #cbd5e1' }}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Periode Lama</Typography>
                                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                                        {formatDate(prefillCar?.carData?.startDate)} <span style={{color:'#94a3b8', margin:'0 4px'}}>→</span> {formatDate(prefillCar?.carData?.dueDate)}
                                    </Typography>
                                </Stack>
                            </Box>
                        </Box>
                    ) : (
                        <Stack spacing={2.5}>
                            <FormControl fullWidth className="modern-input" error={!!errors.customerId}>
                                <InputLabel>Customer *</InputLabel>
                                <Select
                                    value={customerId}
                                    label="Customer *"
                                    onChange={e => { setCustomerId(e.target.value); setSelectedCar(null); }}
                                    disabled={loadingCustomers}
                                >
                                    {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                </Select>
                                {errors.customerId && <FormHelperText>{errors.customerId}</FormHelperText>}
                            </FormControl>

                            <FormControl fullWidth className="modern-input" error={!!errors.carId} disabled={!customerId || loadingCars}>
                                <InputLabel>Kendaraan *</InputLabel>
                                <Select
                                    value={selectedCar?.id || ''}
                                    label="Kendaraan *"
                                    onChange={e => {
                                        const car = cars.find(c => c.id === e.target.value);
                                        setSelectedCar(car || null);
                                        if (car?.carData?.dueDate) {
                                            const base = new Date(car.carData.dueDate);
                                            const end = new Date(base);
                                            end.setFullYear(end.getFullYear() + 1);
                                            setNewStartDate(base.toISOString().slice(0, 10));
                                            setNewEndDate(end.toISOString().slice(0, 10));
                                        }
                                    }}
                                >
                                    {cars.map(c => (
                                        <MenuItem key={c.id} value={c.id}>
                                            {c.carData?.carBrand} {c.carData?.carModel} • {c.carData?.plateNumber || '-'}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.carId && <FormHelperText>{errors.carId}</FormHelperText>}
                                {selectedCar && (
                                    <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Periode Lama</Typography>
                                        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                                            {formatDate(selectedCar.carData?.startDate)} <span style={{color:'#94a3b8', margin:'0 4px'}}>→</span> {formatDate(selectedCar.carData?.dueDate)}
                                        </Typography>
                                    </Box>
                                )}
                            </FormControl>
                        </Stack>
                    )}

                    {/* NEW PERIOD */}
                    <Box>
                        <Typography sx={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Icon icon="mdi:calendar-clock" width={14} /> Periode Pembaruan
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                className="modern-input"
                                fullWidth type="date" label="Tanggal Mulai Baru *"
                                InputLabelProps={{ shrink: true }}
                                value={newStartDate}
                                onChange={e => setNewStartDate(e.target.value)}
                                error={!!errors.newStartDate}
                                helperText={errors.newStartDate}
                            />
                            <TextField
                                className="modern-input"
                                fullWidth type="date" label="Tanggal Berakhir Baru *"
                                InputLabelProps={{ shrink: true }}
                                value={newEndDate}
                                onChange={e => setNewEndDate(e.target.value)}
                                error={!!errors.newEndDate}
                                helperText={errors.newEndDate}
                            />
                        </Stack>
                    </Box>

                    <TextField
                        className="modern-input"
                        fullWidth label="Catatan Tambahan" multiline rows={2}
                        value={notes} onChange={e => setNotes(e.target.value)}
                        placeholder="Misal: Perlu tambahan asuransi gempa bumi..."
                    />
                </Stack>
            </DialogContent>

            <Box sx={{ p: 3, pt: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                <Button 
                    onClick={onClose} 
                    disabled={submitting}
                    sx={{ 
                        textTransform: 'none', 
                        fontWeight: 700, 
                        color: '#64748b', 
                        px: 3, 
                        py: 1,
                        borderRadius: '10px',
                        '&:hover': { bgcolor: '#e2e8f0', color: '#0f172a' }
                    }}
                >
                    Batal
                </Button>
                <Button 
                    variant="contained" 
                    onClick={handleSubmit} 
                    disabled={submitting || isTooEarly}
                    sx={{ 
                        textTransform: 'none', 
                        fontWeight: 700, 
                        background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                        px: 3, 
                        py: 1,
                        borderRadius: '10px',
                        transition: 'all 0.2s ease',
                        '&:hover:not(:disabled)': { 
                            background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)',
                            boxShadow: '0 6px 16px rgba(37, 99, 235, 0.4)',
                            transform: 'translateY(-1px)'
                        },
                        '&:disabled': {
                            background: '#e2e8f0',
                            color: '#94a3b8'
                        }
                    }}
                    startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:arrow-right-circle" width={18} />}
                >
                    {submitting ? 'Memproses...' : 'Buat Renewal'}
                </Button>
            </Box>
        </Dialog>
    );
}
