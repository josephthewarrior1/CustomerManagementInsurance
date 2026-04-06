import { Icon } from '@iconify/react';
import {
    Box, Button, Typography, TextField, Grid, Paper, Divider,
    Container, IconButton, Dialog, useMediaQuery, useTheme,
    Stack, InputAdornment, Avatar, Fade, Chip,
} from '@mui/material';
import { useState, useEffect, useMemo } from 'react';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CompanyDAO from '../../daos/CompanyDao';
import CarDAO from '../../daos/CarDao';
// import PropertyDAO from '../../daos/propertyDao';
import CustomerDAO from '../../daos/CustomerDao';
import InvoiceDAO from '../../daos/InvoiceDao';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// â”€â”€â”€ Design Tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const C = {
    bg: '#F4F5F7',
    white: '#FFFFFF',
    border: '#E4E6EA',
    primary: '#1971C2',
    primaryLight: '#EBF4FF',
    text: '#1C1E21',
    textSub: '#606770',
    textMuted: '#9EA8B3',
    error: '#D92B2B',
    car: '#1971C2',
    carLight: '#EBF4FF',
    property: '#0369A1',
    propertyLight: '#E0F2FE',
};

const inputStyle = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '8px', fontSize: 14, bgcolor: '#FFFFFF',
        '& fieldset': { borderColor: '#E4E6EA' },
        '&:hover fieldset': { borderColor: '#B0B5BC' },
        '&.Mui-focused fieldset': { borderColor: '#1971C2', borderWidth: '1.5px' },
    },
};

function Section({ title, action, children }) {
    return (
        <Box mb={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography fontSize={15} fontWeight={700} sx={{ color: C.text }}>{title}</Typography>
                {action}
            </Box>
            {children}
        </Box>
    );
}

function Field({ label, required, children }) {
    return (
        <Box mb={2.5}>
            <Box display="flex" alignItems="baseline" gap={0.4} mb={0.75}>
                <Typography fontSize={13} fontWeight={600} sx={{ color: C.text }}>{label}</Typography>
                {required && <Typography fontSize={13} sx={{ color: C.error }}>*</Typography>}
            </Box>
            {children}
        </Box>
    );
}

const STEPS = [
    { label: 'Details', icon: '1' },
    { label: 'Items', icon: '2' },
    { label: 'Review', icon: '3' },
];

function WizardStepper({ active }) {
    return (
        <Box display="flex" alignItems="flex-start" justifyContent="center" mb={4}>
            {STEPS.map((step, i) => {
                const done = i < active;
                const current = i === active;
                return (
                    <Box key={i} display="flex" alignItems="flex-start">
                        <Box display="flex" flexDirection="column" alignItems="center" sx={{ minWidth: 72 }}>
                            <Box sx={{
                                width: 36, height: 36, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: done || current ? C.primary : C.white,
                                border: `2px solid ${done || current ? C.primary : '#C8CDD4'}`,
                                boxShadow: current ? `0 0 0 4px rgba(25,113,194,0.15)` : 'none',
                                transition: 'all 0.25s',
                            }}>
                                {done
                                    ? <Icon icon="mdi:check" width={16} color="#fff" />
                                    : <Typography fontSize={13} fontWeight={700} sx={{ color: current ? '#fff' : '#C8CDD4' }}>{step.icon}</Typography>
                                }
                            </Box>
                            <Typography fontSize={12} fontWeight={current ? 700 : 500} mt={0.75}
                                sx={{ color: current ? C.primary : done ? C.textSub : '#C8CDD4' }}>
                                {step.label}
                            </Typography>
                        </Box>
                        {i < STEPS.length - 1 && (
                            <Box sx={{ width: 64, height: 2, bgcolor: i < active ? C.primary : '#C8CDD4', mt: '17px', transition: 'background-color 0.3s', flexShrink: 0 }} />
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}

// â”€â”€â”€ Invoice Type Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function InvoiceTypeTab({ value, onChange }) {
    return (
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            {[
                { key: 'car', label: 'Kendaraan', icon: 'mdi:car', color: C.car, light: C.carLight },
                // { key: 'property', label: 'Properti', icon: 'mdi:home', color: C.property, light: C.propertyLight },
            ].map(opt => (
                <Box key={opt.key} flex={1}
                    onClick={() => onChange(opt.key)}
                    sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                        p: 1.75, borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                        border: `2px solid ${value === opt.key ? opt.color : '#E4E6EA'}`,
                        bgcolor: value === opt.key ? opt.light : '#fff',
                        '&:hover': { borderColor: opt.color, bgcolor: opt.light },
                    }}>
                    <Icon icon={opt.icon} width={20} color={value === opt.key ? opt.color : C.textMuted} />
                    <Typography fontSize={14} fontWeight={700}
                        sx={{ color: value === opt.key ? opt.color : C.textSub }}>
                        {opt.label}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export default function CreateInvoicePage() {
    const loading = useLoading();
    const message = useAlert();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [activeStep, setActiveStep] = useState(0);
    const [invoiceType, setInvoiceType] = useState('car'); // 'car' | 'property'

    // Company
    const [companyProfile, setCompanyProfile] = useState(null);
    const [companyName, setCompanyName] = useState('PT. JAYAINDO ARTHA SUKSES');
    const [companySubtitle, setCompanySubtitle] = useState('INSURANCE AGENCY');
    const [companyCity, setCompanyCity] = useState('Jakarta');

    // Data lists
    const [cars, setCars] = useState([]);
    const [properties, setProperties] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null); // selected car or property
    const [openSelectDialog, setOpenSelectDialog] = useState(false);
    const [selectSearch, setSelectSearch] = useState('');

    // Invoice
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [insuranceName, setInsuranceName] = useState('');
    const [policyNumber, setPolicyNumber] = useState('');
    const [ownerAddress, setOwnerAddress] = useState('');
    const [items, setItems] = useState([{ description: '', quantity: 1, price: 0 }]);
    const [adminFee, setAdminFee] = useState(0);
    const [stampDuty, setStampDuty] = useState(0);
    const [openPreviewDialog, setOpenPreviewDialog] = useState(false);

    useEffect(() => {
        fetchCompanyProfile();
        fetchData();
        generateInvoiceNumber();
    }, []); // eslint-disable-line

    useEffect(() => {
        if (selectedItem) {
            let custId = null;
            if (invoiceType === 'car') {
                custId = selectedItem.customerId || selectedItem.carData?.customerId;
            } else {
                custId = selectedItem.customerId || selectedItem.propertyData?.customerId;
            }
            if (custId) {
                const cust = customers.find(c => c.id === custId);
                if (cust && cust.address) {
                    setOwnerAddress(cust.address);
                } else {
                    setOwnerAddress('');
                }
            } else {
                setOwnerAddress('');
            }
        }
    }, [selectedItem, customers, invoiceType]);

    // When invoice type changes, reset selected item
    const handleTypeChange = (type) => {
        setInvoiceType(type);
        setSelectedItem(null);
    };

    // â”€â”€ Helpers â”€â”€
    const formatCurrency = (value) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(value) || 0);

    const formatCurrencyPDF = (value) =>
        'Rp ' + new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(value) || 0);

    const calculateSubtotal = () => items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.price)), 0);
    const calculateTotal = () => calculateSubtotal() + Number(adminFee) + Number(stampDuty);

    // â”€â”€ Fetch â”€â”€
    const fetchCompanyProfile = async () => {
        try {
            const r = await CompanyDAO.getCompanyProfile();
            if (r.success && r.profile) {
                setCompanyProfile(r.profile);
                setCompanyName(r.profile.companyName || 'PT. JAYAINDO ARTHA SUKSES');
                setCompanySubtitle(r.profile.companySubtitle || 'INSURANCE AGENCY');
                setCompanyCity(r.profile.companyCity || 'Jakarta');
            }
        } catch (e) { console.error(e); }
    };

    const fetchData = async () => {
        try {
            loading.start();
            const [carRes, propRes, custRes] = await Promise.allSettled([
                CarDAO.getAllCars(),
                Promise.resolve({ properties: [] }), // PropertyDAO.getAllProperties(),
                CustomerDAO.getAllCustomers(),
            ]);
            if (carRes.status === 'fulfilled' && carRes.value?.cars) setCars(carRes.value.cars);
            // if (propRes.status === 'fulfilled' && propRes.value?.properties) setProperties(propRes.value.properties);
            if (custRes.status === 'fulfilled' && custRes.value?.customers) setCustomers(custRes.value.customers);
        } catch (e) { console.error(e); message('Failed to load data', 'error'); }
        finally { loading.stop(); }
    };

    const generateInvoiceNumber = () => {
        const d = new Date();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        setInvoiceNumber(`INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${random}`);
    };

    const handleSaveCompanyProfile = async () => {
        if (!companyName?.trim()) { message('Company name is required', 'error'); return; }
        try {
            loading.start();
            const data = { companyName: companyName.trim(), companySubtitle: companySubtitle?.trim() || '', companyCity: companyCity?.trim() || '' };
            const r = companyProfile?.createdAt ? await CompanyDAO.updateCompanyProfile(data) : await CompanyDAO.createCompanyProfile(data);
            if (!r.success) { message(r.error || 'Failed to save', 'error'); return; }
            message('Company profile saved!', 'success');
            await fetchCompanyProfile();
        } catch (e) { console.error(e); message('Failed to save', 'error'); }
        finally { loading.stop(); }
    };

    // â”€â”€ Item handlers â”€â”€
    const handleAddItem = () => setItems([...items, { description: '', quantity: 1, price: 0 }]);
    const handleRemoveItem = (i) => { const n = [...items]; n.splice(i, 1); setItems(n); };
    const handleItemChange = (i, field, value) => { const n = [...items]; n[i][field] = value; setItems(n); };

    // â”€â”€ Navigation â”€â”€
    const handleNext = () => {
        if (activeStep === 0 && !selectedItem) { message(`Please select a ${invoiceType === 'car' ? 'car' : 'property'}`, 'error'); return; }
        if (activeStep === 1 && !items.some(it => it.description?.trim())) { message('Please add at least one item', 'error'); return; }
        setActiveStep(s => s + 1);
    };
    const handleBack = () => setActiveStep(s => s - 1);

    const handleReset = () => {
        setSelectedItem(null);
        setInsuranceName('');
        setPolicyNumber('');
        setOwnerAddress('');
        setItems([{ description: '', quantity: 1, price: 0 }]);
        setAdminFee(0); setStampDuty(0);
        setActiveStep(0);
        generateInvoiceNumber();
    };

    const handleSubmit = () => {
        if (!selectedItem) { message('Please select an item', 'error'); return; }
        setOpenPreviewDialog(true);
    };

    const handleConfirmDownload = async () => {
        try { 
            loading.start(); 
            // 1. Prepare data for backend
            let custId = invoiceType === 'car' ? selectedItem?.carData?.customerId : selectedItem?.propertyData?.customerId;
            if (!custId) custId = selectedItem?.customerId || selectedItem?.id;

            let dueDateVal = Date.now();
            if (invoiceType === 'car' && selectedItem?.carData?.dueDate) {
                dueDateVal = new Date(selectedItem.carData.dueDate).getTime();
            } else if (invoiceType !== 'car' && selectedItem?.insuranceData?.endDate) {
                dueDateVal = new Date(selectedItem.insuranceData.endDate).getTime();
            }

            const invoicePayload = {
                invoiceNumber,
                customerId: custId,
                customerName: getOwnerName(),
                carId: invoiceType === 'car' ? selectedItem?.id : null,
                plateNumber: invoiceType === 'car' ? selectedItem?.carData?.plateNumber : '',
                items: items.filter(it => it.description?.trim()),
                subTotal: calculateSubtotal(),
                discount: 0,
                grandTotal: calculateTotal(),
                issueDate: Date.now(),
                dueDate: dueDateVal,
                status: 'Unpaid',
                notes: 'Generated from Invoice form'
            };

            // 2. Save to database
            const r = await InvoiceDAO.createInvoice(invoicePayload);
            if (!r.success) throw new Error(r.error || 'Failed to save invoice to server');

            // 3. Generate PDF
            generatePDF(); 
            message('Invoice created & PDF downloaded!', 'success'); 
            setOpenPreviewDialog(false); 
        }
        catch (e) { 
            console.error(e); 
            message(e.message || 'Failed to generate invoice', 'error'); 
        }
        finally { loading.stop(); }
    };

    // â”€â”€ Derived label helpers â”€â”€
    const getSelectedLabel = () => {
        if (!selectedItem) return '';
        if (invoiceType === 'car') {
            return `${selectedItem.carData?.carBrand || ''} ${selectedItem.carData?.carModel || ''} - ${selectedItem.carData?.plateNumber || 'No Plate'}`;
        }
        return `${selectedItem.propertyData?.propertyType || 'Property'} - ${selectedItem.propertyData?.city || ''}`;
    };

    const getOwnerName = () => {
        if (!selectedItem) return '';
        if (invoiceType === 'car') return selectedItem.carData?.ownerName || '';
        return selectedItem.ownerName || selectedItem.customerName || '';
    };

    // â”€â”€ PDF â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const generatePDF = () => {
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const marginX = 18;
        let currentY = 20;

        // Header
        doc.setFont('times', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(30, 30, 30);
        doc.text(companyName.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });

        currentY += 6;
        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.text(companySubtitle.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });

        currentY += 10;
        doc.setFont('times', 'normal');
        doc.setFontSize(16);
        doc.text('Invoice', pageWidth / 2, currentY, { align: 'center' });

        currentY += 15;

        // Info Section
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        const dateStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

        const drawRowTop = (y, label, val) => {
            doc.text(label, marginX, y);
            doc.text(':', marginX + 35, y);
            doc.text(String(val || '-'), marginX + 38, y);
        };

        drawRowTop(currentY, 'No Invoice', invoiceNumber); currentY += 6;
        drawRowTop(currentY, 'Tgl', dateStr); currentY += 6;
        drawRowTop(currentY, 'Nama Asuransi', insuranceName); currentY += 10;

        drawRowTop(currentY, 'No Polis', policyNumber); currentY += 6;
        drawRowTop(currentY, 'Nama Tertanggung', getOwnerName()); currentY += 6;
        drawRowTop(currentY, 'Alamat Tertanggung', ownerAddress); currentY += 10;

        let startDateStr = selectedItem?.carData?.startDate ? new Date(selectedItem.carData.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';
        let dueDateStr = selectedItem?.carData?.dueDate ? new Date(selectedItem.carData.dueDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';
        if (invoiceType !== 'car') {
            startDateStr = selectedItem?.insuranceData?.startDate ? new Date(selectedItem.insuranceData.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';
            dueDateStr = selectedItem?.insuranceData?.endDate ? new Date(selectedItem.insuranceData.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';
        }

        drawRowTop(currentY, 'Jangka Waktu', `${startDateStr} - ${dueDateStr}`); currentY += 10;
        drawRowTop(currentY, 'Jenis Asuransi', invoiceType === 'car' ? 'Kendaraan Bermotor' : 'Properti'); currentY += 10;

        // Table Header
        let tableStartY = currentY;
        doc.setDrawColor(0);
        doc.setLineWidth(0.3);
        doc.rect(marginX, tableStartY, pageWidth - 2 * marginX, 6);
        const rightColStart = pageWidth - marginX - 60;
        doc.line(rightColStart, tableStartY, rightColStart, tableStartY + 6);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('Keterangan', marginX + ((rightColStart - marginX) / 2), tableStartY + 4, { align: 'center' });
        doc.text('Rincian Premi', rightColStart + 30, tableStartY + 4, { align: 'center' });

        // Left Column Content
        let leftY = tableStartY + 12;
        doc.setFontSize(9);
        doc.text('Pembayaran Premi Asuransi Dengan data-data sebagai berikut:', marginX + 3, leftY);
        leftY += 10;

        const drawCarData = (label, value) => {
            doc.text(label, marginX + 3, leftY);
            doc.text(`: ${value || '-'}`, marginX + 25, leftY);
            leftY += 6;
        };

        if (invoiceType === 'car') {
            drawCarData('Merek', selectedItem?.carData?.carBrand);
            drawCarData('Type', selectedItem?.carData?.carModel);
            drawCarData('Tahun', selectedItem?.carData?.year);
            drawCarData('Chassis', selectedItem?.carData?.chassisNumber);
            drawCarData('Engine', selectedItem?.carData?.engineNumber);
            drawCarData('Warna', selectedItem?.carData?.color);
            drawCarData('No Polisi', selectedItem?.carData?.plateNumber);
        } else {
            drawCarData('Tipe Properti', selectedItem?.propertyData?.propertyType);
            drawCarData('Kota', selectedItem?.propertyData?.city);
            drawCarData('Alamat', selectedItem?.propertyData?.address);
            drawCarData('Struktur', selectedItem?.propertyData?.buildingStructure);
        }

        // Right Column Content
        let rightY = tableStartY + 12;
        items.forEach(item => {
            if (item.description) {
                const isNeg = Number(item.price) < 0 || Number(item.quantity) < 0;
                doc.text(item.description, rightColStart + 3, rightY);
                doc.text(': IDR', rightColStart + 28, rightY);
                doc.text(new Intl.NumberFormat('id-ID').format(Math.abs(item.price * item.quantity)), pageWidth - marginX - 3, rightY, { align: 'right' });
                if (isNeg) doc.text('-', rightColStart + 38, rightY); // simple minus sign identifier
                rightY += 6;
            }
        });

        if (Number(adminFee) > 0) {
            doc.text('Biaya Admin', rightColStart + 3, rightY);
            doc.text(': IDR', rightColStart + 28, rightY);
            doc.text(new Intl.NumberFormat('id-ID').format(adminFee), pageWidth - marginX - 3, rightY, { align: 'right' });
            rightY += 6;
        }
        if (Number(stampDuty) > 0) {
            doc.text('Biaya Materai', rightColStart + 3, rightY);
            doc.text(': IDR', rightColStart + 28, rightY);
            doc.text(new Intl.NumberFormat('id-ID').format(stampDuty), pageWidth - marginX - 3, rightY, { align: 'right' });
            rightY += 6;
        }

        // Draw dynamic table boundaries
        const finalLeftY = leftY + 10;
        const finalRightY = rightY + 5;
        const tableEndY = Math.max(finalLeftY, finalRightY);

        doc.rect(marginX, tableStartY + 6, pageWidth - 2 * marginX, tableEndY - (tableStartY + 6));
        doc.line(rightColStart, tableStartY + 6, rightColStart, tableEndY);

        // Jumlah row
        doc.line(rightColStart, finalRightY, pageWidth - marginX, finalRightY);
        doc.text('Jumlah', rightColStart + 3, finalRightY + 6);
        doc.text(': IDR', rightColStart + 28, finalRightY + 6);
        doc.text(new Intl.NumberFormat('id-ID').format(calculateTotal()), pageWidth - marginX - 3, finalRightY + 6, { align: 'right' });

        // Signature
        let signY = tableEndY + 30;
        doc.text('(Finance Department)', rightColStart + 30, signY, { align: 'center' });

        doc.save(`Invoice_${invoiceNumber}.pdf`);
    };
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // Filtered list for dialog
    const filteredList = useMemo(() => {
        const s = selectSearch.toLowerCase();
        if (invoiceType === 'car') {
            return cars.filter(c =>
                !s ||
                c.carData?.ownerName?.toLowerCase().includes(s) ||
                c.carData?.carBrand?.toLowerCase().includes(s) ||
                c.carData?.carModel?.toLowerCase().includes(s) ||
                c.carData?.plateNumber?.toLowerCase().includes(s)
            );
        } else {
            return properties.filter(p =>
                !s ||
                (p.ownerName || p.customerName || '').toLowerCase().includes(s) ||
                p.propertyData?.propertyType?.toLowerCase().includes(s) ||
                p.propertyData?.city?.toLowerCase().includes(s)
            );
        }
    }, [invoiceType, cars, properties, selectSearch]);

    const validItemCount = items.filter(it => it.description?.trim()).length;
    const accentColor = invoiceType === 'car' ? C.car : C.property;
    const accentLight = invoiceType === 'car' ? C.carLight : C.propertyLight;

    // â”€â”€â”€ RENDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    return (
        <Box sx={{ bgcolor: C.bg, minHeight: '100vh', py: 4 }}>
            <Container maxWidth="sm">

                {/* Title */}
                <Box mb={3}>
                    <Typography variant="h5" fontWeight={700} align="center" sx={{ color: C.text }}>
                        New Invoice
                    </Typography>
                    <Typography fontSize={13} align="center" sx={{ color: C.textSub, mt: 0.5 }}>
                        Generate an invoice PDF for car or property insurance
                    </Typography>
                </Box>

                <WizardStepper active={activeStep} />

                {/* â”€â”€ STEP 1: Details â”€â”€ */}
                {activeStep === 0 && (
                    <Fade in key="s1">
                        <Box>
                            {/* Company */}
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: `1px solid ${C.border}`, bgcolor: C.white, p: 3, mb: 2 }}>
                                <Section
                                    title="Company Header"
                                    action={
                                        <Button size="small" onClick={handleSaveCompanyProfile}
                                            sx={{ textTransform: 'none', fontSize: 12, fontWeight: 600, color: C.primary, minWidth: 0 }}>
                                            Save
                                        </Button>
                                    }
                                >
                                    <Field label="Company Name" required>
                                        <TextField fullWidth size="small" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                                            placeholder="e.g., PT. Maju Jaya Abadi" error={!companyName?.trim()} sx={inputStyle} />
                                    </Field>
                                    <Field label="Subtitle">
                                        <TextField fullWidth size="small" value={companySubtitle} onChange={(e) => setCompanySubtitle(e.target.value)}
                                            placeholder="e.g., INSURANCE AGENCY" sx={inputStyle} />
                                    </Field>
                                    <Field label="City">
                                        <TextField fullWidth size="small" value={companyCity} onChange={(e) => setCompanyCity(e.target.value)}
                                            placeholder="Jakarta" sx={inputStyle} />
                                    </Field>
                                </Section>
                            </Paper>

                            {/* Invoice Type + Selection */}
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: `1px solid ${C.border}`, bgcolor: C.white, p: 3, mb: 2 }}>
                                <Section title="Jenis Invoice">
                                    {/* Tab picker */}
                                    <InvoiceTypeTab value={invoiceType} onChange={handleTypeChange} />

                                    {/* Select car/property */}
                                    <Field label={invoiceType === 'car' ? 'Pilih Kendaraan' : 'Pilih Properti'} required>
                                        <Box
                                            onClick={() => setOpenSelectDialog(true)}
                                            sx={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                px: 1.5, py: '9px',
                                                border: `1px solid ${selectedItem ? accentColor : C.border}`,
                                                borderRadius: '8px',
                                                bgcolor: selectedItem ? accentLight : C.white,
                                                cursor: 'pointer', transition: 'all 0.15s',
                                                '&:hover': { borderColor: selectedItem ? accentColor : '#B0B5BC' },
                                            }}
                                        >
                                            <Box display="flex" alignItems="center" gap={1.25}>
                                                <Icon icon={invoiceType === 'car' ? 'mdi:car-search' : 'mdi:home-search'} width={18} color={selectedItem ? accentColor : C.textMuted} />
                                                <Typography fontSize={14} sx={{ color: selectedItem ? C.text : C.textMuted }}>
                                                    {selectedItem ? getSelectedLabel() : `Cari dan pilih ${invoiceType === 'car' ? 'kendaraan' : 'properti'}...`}
                                                </Typography>
                                            </Box>
                                            {selectedItem
                                                ? <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSelectedItem(null); }} sx={{ p: 0.25 }}>
                                                    <Icon icon="mdi:close" width={15} color={C.textSub} />
                                                </IconButton>
                                                : <Icon icon="mdi:chevron-down" width={18} color={C.textMuted} />
                                            }
                                        </Box>
                                    </Field>

                                    {/* Selected item detail card */}
                                    {selectedItem && (
                                        <Box sx={{ mt: -1.5, mb: 0.5, p: 2, borderRadius: '8px', bgcolor: '#F8F9FA', border: `1px solid ${C.border}` }}>
                                            {invoiceType === 'car' ? (
                                                <Grid container spacing={1.5}>
                                                    {[
                                                        { label: 'Pemilik', value: selectedItem.carData?.ownerName },
                                                        { label: 'Kendaraan', value: `${selectedItem.carData?.carBrand || ''} ${selectedItem.carData?.carModel || ''}`.trim() },
                                                        { label: 'No. Plat', value: selectedItem.carData?.plateNumber },
                                                        { label: 'No. Rangka', value: selectedItem.carData?.chassisNumber },
                                                        { label: 'Harga Mobil', value: selectedItem.carData?.carPrice ? `Rp ${Number(selectedItem.carData.carPrice).toLocaleString('id-ID')}` : '-' },
                                                        { label: 'Jatuh Tempo', value: selectedItem.carData?.dueDate ? new Date(selectedItem.carData.dueDate).toLocaleDateString('id-ID') : '-' },
                                                    ].map(({ label, value }) => (
                                                        <Grid item xs={6} key={label}>
                                                            <Typography fontSize={11} sx={{ color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, mb: 0.2 }}>{label}</Typography>
                                                            <Typography fontSize={13} fontWeight={500} sx={{ color: C.text }}>{value || '-'}</Typography>
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            ) : (
                                                <Grid container spacing={1.5}>
                                                    {[
                                                        { label: 'Pemilik', value: selectedItem.ownerName || selectedItem.customerName },
                                                        { label: 'Tipe', value: selectedItem.propertyData?.propertyType },
                                                        { label: 'Kota', value: selectedItem.propertyData?.city },
                                                        { label: 'Alamat', value: selectedItem.propertyData?.address },
                                                        { label: 'Nilai Properti', value: selectedItem.propertyData?.propertyValue ? `Rp ${Number(selectedItem.propertyData.propertyValue).toLocaleString('id-ID')}` : '-' },
                                                        { label: 'Jatuh Tempo', value: selectedItem.insuranceData?.endDate ? new Date(selectedItem.insuranceData.endDate).toLocaleDateString('id-ID') : '-' },
                                                    ].map(({ label, value }) => (
                                                        <Grid item xs={6} key={label}>
                                                            <Typography fontSize={11} sx={{ color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, mb: 0.2 }}>{label}</Typography>
                                                            <Typography fontSize={13} fontWeight={500} sx={{ color: C.text }}>{value || '-'}</Typography>
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            )}
                                        </Box>
                                    )}

                                    {/* Additional Manual Inputs for PDF */}
                                    {selectedItem && (
                                        <Box mt={3}>
                                            <Typography fontSize={13} fontWeight={700} mb={1.5} color={C.text}>Informasi Tambahan (Khusus PDF)</Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={4}>
                                                    <Field label="Nama Asuransi" required={false}>
                                                        <TextField fullWidth size="small" value={insuranceName} onChange={(e) => setInsuranceName(e.target.value)}
                                                            placeholder="cth. Asuransi TAP" sx={inputStyle} />
                                                    </Field>
                                                </Grid>
                                                <Grid item xs={12} sm={4}>
                                                    <Field label="No Polis" required={false}>
                                                        <TextField fullWidth size="small" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)}
                                                            placeholder="cth. 1100201..." sx={inputStyle} />
                                                    </Field>
                                                </Grid>
                                                <Grid item xs={12} sm={4}>
                                                    <Field label="Alamat Tertanggung" required={false}>
                                                        <TextField fullWidth size="small" value={ownerAddress} onChange={(e) => setOwnerAddress(e.target.value)}
                                                            placeholder="Alamat klien..." sx={inputStyle} />
                                                    </Field>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    )}
                                </Section>
                            </Paper>

                            <Button fullWidth variant="contained" onClick={handleNext}
                                endIcon={<Icon icon="mdi:arrow-right" width={16} />}
                                sx={{ borderRadius: '8px', py: 1.4, textTransform: 'none', fontSize: 14, fontWeight: 600, bgcolor: accentColor, boxShadow: 'none', '&:hover': { filter: 'brightness(0.9)' } }}>
                                Continue to Items
                            </Button>
                        </Box>
                    </Fade>
                )}

                {/* â”€â”€ STEP 2: Items â”€â”€ */}
                {activeStep === 1 && (
                    <Fade in key="s2">
                        <Box>
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: `1px solid ${C.border}`, bgcolor: C.white, p: 3, mb: 2 }}>
                                <Section
                                    title="Invoice Items"
                                    action={
                                        <Button size="small" onClick={handleAddItem}
                                            startIcon={<Icon icon="mdi:plus" width={16} />}
                                            sx={{ textTransform: 'none', fontSize: 12, fontWeight: 600, color: C.primary }}>
                                            Add Item
                                        </Button>
                                    }
                                >
                                    <Stack spacing={2}>
                                        {items.map((item, index) => (
                                            <Box key={index} sx={{ p: 2, borderRadius: '8px', border: `1px solid ${C.border}`, bgcolor: '#FAFBFC' }}>
                                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                                                    <Typography fontSize={12} fontWeight={600} sx={{ color: C.textSub, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                                                        Item {index + 1}
                                                    </Typography>
                                                    {items.length > 1 && (
                                                        <IconButton size="small" onClick={() => handleRemoveItem(index)} sx={{ color: C.error, p: 0.25 }}>
                                                            <Icon icon="mdi:trash-can-outline" width={16} />
                                                        </IconButton>
                                                    )}
                                                </Box>
                                                <Stack spacing={1.5}>
                                                    <Box>
                                                        <Typography fontSize={12} fontWeight={600} sx={{ color: C.text, mb: 0.75 }}>
                                                            Description <span style={{ color: C.error }}>*</span>
                                                        </Typography>
                                                        <TextField fullWidth size="small" multiline maxRows={2}
                                                            placeholder="e.g., Premi Asuransi Kendaraan"
                                                            value={item.description}
                                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                            sx={inputStyle} />
                                                    </Box>
                                                    <Box display="flex" gap={1.5}>
                                                        <Box flex={1}>
                                                            <Typography fontSize={12} fontWeight={600} sx={{ color: C.text, mb: 0.75 }}>Quantity</Typography>
                                                            <TextField fullWidth size="small" type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                                sx={inputStyle} />
                                                        </Box>
                                                        <Box flex={2}>
                                                            <Typography fontSize={12} fontWeight={600} sx={{ color: C.text, mb: 0.75 }}>Unit Price</Typography>
                                                            <TextField fullWidth size="small" type="number"
                                                                value={item.price}
                                                                onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                                                                InputProps={{ startAdornment: <InputAdornment position="start"><Typography fontSize={13} fontWeight={700} sx={{ color: C.textSub }}>Rp</Typography></InputAdornment> }}
                                                                sx={inputStyle} />
                                                        </Box>
                                                    </Box>
                                                    {item.description && Number(item.price) > 0 && (
                                                        <Box display="flex" justifyContent="flex-end">
                                                            <Typography fontSize={12} sx={{ color: C.textSub }}>
                                                                Subtotal: <strong style={{ color: C.text }}>{formatCurrency(Number(item.quantity) * Number(item.price))}</strong>
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Stack>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Section>

                                <Divider sx={{ borderColor: C.border, my: 2.5 }} />

                                <Section title="Additional Fees">
                                    <Box display="flex" gap={1.5}>
                                        <Box flex={1}>
                                            <Typography fontSize={12} fontWeight={600} sx={{ color: C.text, mb: 0.75 }}>Admin Fee</Typography>
                                            <TextField fullWidth size="small" type="number" value={adminFee}
                                                onChange={(e) => setAdminFee(e.target.value)}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><Typography fontSize={13} fontWeight={700} sx={{ color: C.textSub }}>Rp</Typography></InputAdornment> }}
                                                sx={inputStyle} />
                                        </Box>
                                        <Box flex={1}>
                                            <Typography fontSize={12} fontWeight={600} sx={{ color: C.text, mb: 0.75 }}>Stamp Duty</Typography>
                                            <TextField fullWidth size="small" type="number" value={stampDuty}
                                                onChange={(e) => setStampDuty(e.target.value)}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><Typography fontSize={13} fontWeight={700} sx={{ color: C.textSub }}>Rp</Typography></InputAdornment> }}
                                                sx={inputStyle} />
                                        </Box>
                                    </Box>
                                </Section>
                            </Paper>

                            {/* Live summary */}
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: `1px solid ${C.border}`, bgcolor: C.white, p: 3, mb: 2 }}>
                                <Section title="Summary">
                                    <Stack spacing={0.75} mb={2}>
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography fontSize={13} sx={{ color: C.textSub }}>Subtotal ({validItemCount} item{validItemCount !== 1 ? 's' : ''})</Typography>
                                            <Typography fontSize={13} fontWeight={600} sx={{ color: C.text }}>{formatCurrency(calculateSubtotal())}</Typography>
                                        </Box>
                                        {Number(adminFee) > 0 && (
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography fontSize={13} sx={{ color: C.textSub }}>Admin Fee</Typography>
                                                <Typography fontSize={13} sx={{ color: C.text }}>{formatCurrency(adminFee)}</Typography>
                                            </Box>
                                        )}
                                        {Number(stampDuty) > 0 && (
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography fontSize={13} sx={{ color: C.textSub }}>Stamp Duty</Typography>
                                                <Typography fontSize={13} sx={{ color: C.text }}>{formatCurrency(stampDuty)}</Typography>
                                            </Box>
                                        )}
                                    </Stack>
                                    <Box sx={{ p: 2, borderRadius: '8px', bgcolor: accentLight, border: `1px solid rgba(25,113,194,0.2)` }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="baseline">
                                            <Typography fontSize={13} fontWeight={700} sx={{ color: accentColor }}>TOTAL</Typography>
                                            <Typography fontSize={20} fontWeight={800} sx={{ color: accentColor }}>{formatCurrency(calculateTotal())}</Typography>
                                        </Box>
                                    </Box>
                                </Section>
                            </Paper>

                            <Box display="flex" gap={1.5}>
                                <Button fullWidth variant="outlined" onClick={handleBack}
                                    startIcon={<Icon icon="mdi:arrow-left" width={16} />}
                                    sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: C.border, color: C.textSub }}>
                                    Back
                                </Button>
                                <Button fullWidth variant="contained" onClick={handleNext}
                                    endIcon={<Icon icon="mdi:arrow-right" width={16} />}
                                    sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, bgcolor: accentColor, boxShadow: 'none' }}>
                                    Review
                                </Button>
                            </Box>
                        </Box>
                    </Fade>
                )}

                {/* â”€â”€ STEP 3: Review â”€â”€ */}
                {activeStep === 2 && (
                    <Fade in key="s3">
                        <Box>
                            {/* Type badge */}
                            <Box mb={2} display="flex" justifyContent="center">
                                <Chip
                                    icon={<Icon icon={invoiceType === 'car' ? 'mdi:car' : 'mdi:home'} width={15} />}
                                    label={`Invoice ${invoiceType === 'car' ? 'Kendaraan' : 'Properti'}`}
                                    sx={{ bgcolor: accentLight, color: accentColor, fontWeight: 700, fontSize: 13, border: `1px solid ${accentColor}40` }}
                                />
                            </Box>

                            {/* Company */}
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: `1px solid ${C.border}`, bgcolor: C.white, p: 3, mb: 2 }}>
                                <Section title="Company">
                                    <Box sx={{ p: 2, borderRadius: '8px', bgcolor: '#F8F9FA', border: `1px solid ${C.border}`, textAlign: 'center' }}>
                                        <Typography fontSize={15} fontWeight={700} sx={{ color: C.text }}>{companyName?.toUpperCase()}</Typography>
                                        <Typography fontSize={12} sx={{ color: C.textSub, mt: 0.25 }}>{companySubtitle}</Typography>
                                        <Typography fontSize={12} sx={{ color: C.textMuted }}>{companyCity}</Typography>
                                    </Box>
                                </Section>
                            </Paper>

                            {/* Bill To */}
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: `1px solid ${C.border}`, bgcolor: C.white, p: 3, mb: 2 }}>
                                <Section title="Bill To">
                                    <Grid container spacing={2}>
                                        {(invoiceType === 'car' ? [
                                            { label: 'Pemilik', value: selectedItem?.carData?.ownerName },
                                            { label: 'Kendaraan', value: `${selectedItem?.carData?.carBrand || ''} ${selectedItem?.carData?.carModel || ''}`.trim() },
                                            { label: 'No. Plat', value: selectedItem?.carData?.plateNumber },
                                            { label: 'No. Rangka', value: selectedItem?.carData?.chassisNumber },
                                            { label: 'No. Mesin', value: selectedItem?.carData?.engineNumber },
                                            { label: 'Harga Mobil', value: selectedItem?.carData?.carPrice ? `Rp ${Number(selectedItem.carData.carPrice).toLocaleString('id-ID')}` : '-' },
                                        ] : [
                                            { label: 'Pemilik', value: selectedItem?.ownerName || selectedItem?.customerName },
                                            { label: 'Tipe Properti', value: selectedItem?.propertyData?.propertyType },
                                            { label: 'Kota', value: selectedItem?.propertyData?.city },
                                            { label: 'Alamat', value: selectedItem?.propertyData?.address },
                                            { label: 'Nilai Properti', value: selectedItem?.propertyData?.propertyValue ? `Rp ${Number(selectedItem.propertyData.propertyValue).toLocaleString('id-ID')}` : '-' },
                                            { label: 'Jatuh Tempo', value: selectedItem?.insuranceData?.endDate ? new Date(selectedItem.insuranceData.endDate).toLocaleDateString('id-ID') : '-' },
                                        ]).map(({ label, value }) => (
                                            <Grid item xs={6} key={label}>
                                                <Typography fontSize={11} sx={{ color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, mb: 0.3 }}>{label}</Typography>
                                                <Typography fontSize={13.5} fontWeight={500} sx={{ color: C.text }}>{value || '-'}</Typography>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Section>
                            </Paper>

                            {/* Items + Total */}
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: `1px solid ${C.border}`, bgcolor: C.white, p: 3, mb: 2 }}>
                                <Section title="Items & Total">
                                    <Stack spacing={1} mb={2}>
                                        {items.filter(it => it.description?.trim()).map((item, i) => (
                                            <Box key={i} display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
                                                <Box flex={1}>
                                                    <Typography fontSize={13} sx={{ color: C.text }}>{item.description}</Typography>
                                                    <Typography fontSize={12} sx={{ color: C.textSub }}>{item.quantity} Ã— {formatCurrency(item.price)}</Typography>
                                                </Box>
                                                <Typography fontSize={13} fontWeight={600} sx={{ color: C.text, whiteSpace: 'nowrap' }}>
                                                    {formatCurrency(Number(item.quantity) * Number(item.price))}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>

                                    <Divider sx={{ borderColor: C.border, my: 2 }} />

                                    <Stack spacing={0.75} mb={2}>
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography fontSize={13} sx={{ color: C.textSub }}>Subtotal</Typography>
                                            <Typography fontSize={13} fontWeight={600} sx={{ color: C.text }}>{formatCurrency(calculateSubtotal())}</Typography>
                                        </Box>
                                        {Number(adminFee) > 0 && <Box display="flex" justifyContent="space-between"><Typography fontSize={13} sx={{ color: C.textSub }}>Admin Fee</Typography><Typography fontSize={13} sx={{ color: C.text }}>{formatCurrency(adminFee)}</Typography></Box>}
                                        {Number(stampDuty) > 0 && <Box display="flex" justifyContent="space-between"><Typography fontSize={13} sx={{ color: C.textSub }}>Stamp Duty</Typography><Typography fontSize={13} sx={{ color: C.text }}>{formatCurrency(stampDuty)}</Typography></Box>}
                                    </Stack>

                                    <Box sx={{ p: 2.5, borderRadius: '8px', bgcolor: accentLight, border: `1px solid ${accentColor}30`, mb: 2 }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="baseline">
                                            <Typography fontSize={14} fontWeight={700} sx={{ color: accentColor }}>TOTAL</Typography>
                                            <Typography fontSize={22} fontWeight={800} sx={{ color: accentColor }}>{formatCurrency(calculateTotal())}</Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ p: 1.75, borderRadius: '8px', bgcolor: '#F8F9FA', border: `1px solid ${C.border}` }}>
                                        <Typography fontSize={11} sx={{ color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Invoice No.</Typography>
                                        <Typography fontSize={13} fontWeight={600} sx={{ color: C.text, fontFamily: 'monospace', mt: 0.25 }}>{invoiceNumber}</Typography>
                                    </Box>
                                </Section>
                            </Paper>

                            <Button fullWidth variant="contained" onClick={handleSubmit}
                                startIcon={<Icon icon="mdi:file-pdf-box" width={18} />}
                                sx={{ borderRadius: '8px', py: 1.5, textTransform: 'none', fontSize: 14, fontWeight: 600, bgcolor: '#D32F2F', boxShadow: 'none', mb: 1.5, '&:hover': { bgcolor: '#B71C1C', boxShadow: '0 4px 12px rgba(211,47,47,0.3)' } }}>
                                Download PDF
                            </Button>

                            <Box display="flex" gap={1.5}>
                                <Button fullWidth variant="outlined" onClick={handleBack}
                                    startIcon={<Icon icon="mdi:arrow-left" width={15} />}
                                    sx={{ borderRadius: '8px', py: 1.25, textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: C.border, color: C.textSub }}>
                                    Edit Items
                                </Button>
                                <Button fullWidth variant="outlined" onClick={handleReset}
                                    startIcon={<Icon icon="mdi:refresh" width={15} />}
                                    sx={{ borderRadius: '8px', py: 1.25, textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: C.border, color: C.textSub }}>
                                    Start Over
                                </Button>
                            </Box>
                        </Box>
                    </Fade>
                )}

            </Container>

            {/* â”€â”€ Car / Property Select Dialog â”€â”€ */}
            <Dialog open={openSelectDialog} onClose={() => { setOpenSelectDialog(false); setSelectSearch(''); }}
                maxWidth="xs" fullWidth fullScreen={isMobile}
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : '12px', m: 2 } }}>
                <Box sx={{ p: 2.5 }}>
                    <Box display="flex" alignItems="center" mb={2}>
                        <IconButton size="small" onClick={() => { setOpenSelectDialog(false); setSelectSearch(''); }} sx={{ mr: 1 }}>
                            <Icon icon="mdi:arrow-left" width={20} color={C.textSub} />
                        </IconButton>
                        <Typography fontSize={16} fontWeight={700} sx={{ color: C.text }}>
                            Pilih {invoiceType === 'car' ? 'Kendaraan' : 'Properti'}
                        </Typography>
                    </Box>
                    <TextField fullWidth autoFocus size="small"
                        placeholder={invoiceType === 'car' ? 'Cari pemilik, merek, plat...' : 'Cari pemilik, tipe, kota...'}
                        value={selectSearch} onChange={(e) => setSelectSearch(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" width={18} color={C.textMuted} /></InputAdornment> }}
                        sx={{ mb: 2, ...inputStyle }} />
                    <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                        {filteredList.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 5 }}>
                                <Icon icon={invoiceType === 'car' ? 'mdi:car-search' : 'mdi:home-search'} width={44} color="#C8CDD4" />
                                <Typography fontSize={14} sx={{ color: C.textSub, mt: 1.5 }}>
                                    Tidak ada {invoiceType === 'car' ? 'kendaraan' : 'properti'} ditemukan
                                </Typography>
                                {selectSearch && <Button onClick={() => setSelectSearch('')} sx={{ mt: 1, textTransform: 'none', fontSize: 12, color: C.primary }}>Hapus pencarian</Button>}
                            </Box>
                        ) : (
                            <Stack spacing={1}>
                                {filteredList.map((item) => {
                                    const sel = selectedItem?.id === item.id;
                                    const title = invoiceType === 'car'
                                        ? `${item.carData?.carBrand || ''} ${item.carData?.carModel || ''}`.trim()
                                        : item.propertyData?.propertyType || 'Property';
                                    const sub1 = invoiceType === 'car'
                                        ? (item.carData?.ownerName || '-')
                                        : (item.ownerName || item.customerName || '-');
                                    const sub2 = invoiceType === 'car'
                                        ? (item.carData?.plateNumber || 'No plate')
                                        : (item.propertyData?.city || '-');
                                    return (
                                        <Box key={item.id}
                                            onClick={() => { setSelectedItem(item); setOpenSelectDialog(false); setSelectSearch(''); }}
                                            sx={{
                                                display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '8px', cursor: 'pointer',
                                                border: `1px solid ${sel ? accentColor : C.border}`,
                                                bgcolor: sel ? accentLight : C.white, transition: 'all 0.15s',
                                                '&:hover': { borderColor: accentColor, bgcolor: sel ? accentLight : '#FAFBFC' },
                                            }}>
                                            <Avatar sx={{ width: 38, height: 38, bgcolor: accentColor, fontSize: 15, fontWeight: 700 }}>
                                                <Icon icon={invoiceType === 'car' ? 'mdi:car' : 'mdi:home'} width={20} />
                                            </Avatar>
                                            <Box flex={1} minWidth={0}>
                                                <Typography fontSize={13.5} fontWeight={600} sx={{ color: C.text }}>{title}</Typography>
                                                <Typography fontSize={12} sx={{ color: C.textSub }}>{sub1}</Typography>
                                                <Typography fontSize={12} sx={{ color: C.textMuted }}>{sub2}</Typography>
                                            </Box>
                                            {sel && <Icon icon="mdi:check-circle" width={18} color={accentColor} />}
                                        </Box>
                                    );
                                })}
                            </Stack>
                        )}
                    </Box>
                </Box>
            </Dialog>

            {/* â”€â”€ Confirm Dialog â”€â”€ */}
            <Dialog open={openPreviewDialog} onClose={() => setOpenPreviewDialog(false)}
                maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '12px', m: 2 } }}>
                <Box sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Icon icon="mdi:file-pdf-box" width={22} color="#D32F2F" />
                        <Typography fontSize={16} fontWeight={700} sx={{ color: C.text }}>Confirm Invoice</Typography>
                    </Box>
                    <Box sx={{ p: 2.5, borderRadius: '8px', bgcolor: '#F8F9FA', border: `1px solid ${C.border}`, mb: 2.5 }}>
                        <Stack spacing={0.75}>
                            <Box display="flex" justifyContent="space-between">
                                <Typography fontSize={13} sx={{ color: C.textSub }}>Jenis</Typography>
                                <Typography fontSize={13} fontWeight={600} sx={{ color: accentColor }}>
                                    {invoiceType === 'car' ? 'Kendaraan' : 'Properti'}
                                </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                                <Typography fontSize={13} sx={{ color: C.textSub }}>Pemilik</Typography>
                                <Typography fontSize={13} fontWeight={600} sx={{ color: C.text }}>{getOwnerName() || '-'}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                                <Typography fontSize={13} sx={{ color: C.textSub }}>Items</Typography>
                                <Typography fontSize={13} sx={{ color: C.text }}>{validItemCount} item{validItemCount !== 1 ? 's' : ''}</Typography>
                            </Box>
                            <Divider sx={{ borderColor: C.border, my: 0.5 }} />
                            <Box display="flex" justifyContent="space-between">
                                <Typography fontSize={13} fontWeight={600} sx={{ color: C.text }}>Total</Typography>
                                <Typography fontSize={15} fontWeight={700} sx={{ color: '#D32F2F' }}>{formatCurrency(calculateTotal())}</Typography>
                            </Box>
                        </Stack>
                    </Box>
                    <Box display="flex" gap={1}>
                        <Button fullWidth variant="outlined" onClick={() => setOpenPreviewDialog(false)}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: C.border, color: C.textSub }}>
                            Cancel
                        </Button>
                        <Button fullWidth variant="contained" onClick={handleConfirmDownload}
                            startIcon={<Icon icon="mdi:content-save" width={15} />}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontSize: 13, fontWeight: 600, bgcolor: '#D32F2F', boxShadow: 'none', '&:hover': { bgcolor: '#B71C1C' } }}>
                            Save & Generate PDF
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </Box>
    );
}

