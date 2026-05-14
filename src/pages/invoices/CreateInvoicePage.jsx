import { Icon } from '@iconify/react';
import {
    Box, Button, Typography, TextField, Grid, Paper, Divider,
    Container, IconButton, Dialog, useMediaQuery, useTheme,
    Stack, InputAdornment, Avatar, Fade, Chip,
    DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CompanyDAO from '../../daos/CompanyDao';
import CarDAO from '../../daos/CarDao';
// import PropertyDAO from '../../daos/propertyDao';
import CustomerDAO from '../../daos/CustomerDao';
import InvoiceDAO from '../../daos/InvoiceDao';
import QuotationDAO from '../../daos/QuotationDao';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

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

    // Quotation
    const [acceptedQuotation, setAcceptedQuotation] = useState(null);
    const coverageLabels = useMemo(() => ({
        comprehensive: 'Comprehensive',
        flood: 'Banjir',
        earthquake: 'Gempa Bumi',
        typhoonAndStorm: 'Angin Topan / Badai / Hujan Es',
        landslide: 'Tanah Longsor',
        waterHammer: 'Water Hammer',
        thirdPartyLiability: 'Tanggung Jawab Hukum Pihak III',
        authorizedWorkshop: 'Authorized Workshop',
    }), []);

    // Invoice
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [insuranceName, setInsuranceName] = useState('');
    const [policyNumber, setPolicyNumber] = useState('');
    const [ownerAddress, setOwnerAddress] = useState('');
    const [items, setItems] = useState([{ description: '', quantity: 1, price: '' }]);
    const [discount, setDiscount] = useState('');
    const [adminFee, setAdminFee] = useState('');
    const [stampDuty, setStampDuty] = useState('');
    const [invoicePreviewUrl, setInvoicePreviewUrl] = useState('');
    const [invoicePreviewPages, setInvoicePreviewPages] = useState(0);
    const [invoicePreviewWidth, setInvoicePreviewWidth] = useState(794);

    const parseNumber = (val) => {
        const numStr = String(val).replace(/\D/g, '');
        return numStr === '' ? '' : numStr;
    };
    const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
    const invoicePreviewRef = useRef(null);

    // Dates for Invoice Form
    const [invoiceStartDate, setInvoiceStartDate] = useState('');
    const [invoiceEndDate, setInvoiceEndDate] = useState('');
    const [invoiceDueDate, setInvoiceDueDate] = useState('');

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

            // PREFILL DATES
            let sd = ''; let ed = '';
            if (invoiceType === 'car') {
                sd = selectedItem?.carData?.startDate;
                ed = selectedItem?.carData?.dueDate;
            } else {
                sd = selectedItem?.insuranceData?.startDate;
                ed = selectedItem?.insuranceData?.endDate;
            }
            if (sd) setInvoiceStartDate(new Date(sd).toISOString().split('T')[0]);
            if (ed) setInvoiceEndDate(new Date(ed).toISOString().split('T')[0]);

            // Set invoiceDueDate to 14 days from now as default
            const dt = new Date();
            dt.setDate(dt.getDate() + 14);
            setInvoiceDueDate(dt.toISOString().split('T')[0]);

            // Fetch accepted quotation for this car/policy
            if (invoiceType === 'car' && selectedItem?.id) {
                fetchAcceptedQuotation(selectedItem.id);
            }
        }
    }, [selectedItem, customers, invoiceType]); // eslint-disable-line

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
    const calculateTotal = () => calculateSubtotal() - Number(discount) + Number(adminFee) + Number(stampDuty);

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

    // Fetch accepted quotation for a car/policy
    const fetchAcceptedQuotation = async (policyId) => {
        try {
            const res = await QuotationDAO.getQuotationsByPolicy(policyId);
            if (res.success && res.quotations) {
                const accepted = res.quotations.find(q => q.status === 'Accepted');
                if (accepted) {
                    setAcceptedQuotation(accepted);
                    const premiumAmount = Number(accepted.totalPremium) || 0;
                    const quotationItems = [
                        { description: 'Premi', quantity: 1, price: premiumAmount },
                    ];
                    setItems([...quotationItems]);
                    setDiscount('');
                    setAdminFee('');
                    setStampDuty('');
                    if (accepted.insuranceProvider) setInsuranceName(accepted.insuranceProvider);
                } else {
                    setAcceptedQuotation(null);
                }
            }
        } catch (e) {
            console.error('Failed to fetch quotations:', e);
            setAcceptedQuotation(null);
        }
    };

    const generateInvoiceNumber = () => {
        const d = new Date();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        const romanMonth = romanMonths[d.getMonth()];
        setInvoiceNumber(`${random}/MV/JAS/TAP/${romanMonth}/${d.getFullYear()}`);
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
    // ── Item handlers ──
    const handleAddItem = () => setItems([...items, { description: '', quantity: 1, price: '' }]);
    const handleRemoveItem = (i) => {
        if (items[i]?.fromQuotation) return;
        const n = [...items]; n.splice(i, 1); setItems(n);
    };
    const handleItemChange = (i, field, value) => {
        if (items[i]?.fromQuotation) return;
        const n = [...items]; n[i][field] = value; setItems(n);
    };

    // â”€â”€ Navigation â”€â”€
    const handleNext = () => {
        if (activeStep === 0 && !selectedItem) { message(`Please select a ${invoiceType === 'car' ? 'car' : 'property'}`, 'error'); return; }
        if (activeStep === 1 && !items.some(it => it.description?.trim())) { message('Please add at least one item', 'error'); return; }
        setActiveStep(s => s + 1);
    };
    const handleBack = () => setActiveStep(s => s - 1);

    const handleReset = () => {
        setSelectedItem(null);
        setAcceptedQuotation(null);
        setInsuranceName('');
        setPolicyNumber('');
        setOwnerAddress('');
        setItems([{ description: '', quantity: 1, price: '' }]);
        setDiscount(''); setAdminFee(''); setStampDuty('');
        setInvoiceStartDate(''); setInvoiceEndDate(''); setInvoiceDueDate('');
        setActiveStep(0);
        generateInvoiceNumber();
    };

    const handleSubmit = () => {
        if (!selectedItem) { message('Please select an item', 'error'); return; }
        setOpenPreviewDialog(true);
    };

    const handleGenerate = async (shouldSave) => {
        try {
            loading.start();
            if (shouldSave) {
                // 1. Prepare data for backend
                let custId = invoiceType === 'car' ? selectedItem?.carData?.customerId : selectedItem?.propertyData?.customerId;
                if (!custId) custId = selectedItem?.customerId || selectedItem?.id;

                let dueDateVal = invoiceDueDate ? new Date(invoiceDueDate).getTime() : Date.now();

                const invoicePayload = {
                    invoiceNumber,
                    customerId: custId,
                    customerName: getOwnerName(),
                    carId: invoiceType === 'car' ? selectedItem?.id : null,
                    plateNumber: invoiceType === 'car' ? selectedItem?.carData?.plateNumber : '',
                    quotationId: acceptedQuotation?.id || '',
                    items: items.filter(it => it.description?.trim()).map(it => ({
                        description: it.description,
                        quantity: it.quantity,
                        price: it.price,
                        fromQuotation: it.fromQuotation || false,
                    })),
                    subTotal: calculateSubtotal(),
                    discount: Number(discount),
                    grandTotal: calculateTotal(),
                    issueDate: Date.now(),
                    dueDate: dueDateVal,
                    status: 'Unpaid',
                    notes: acceptedQuotation ? `Dari Penawaran ${acceptedQuotation.quotationNumber}` : 'Generated from Invoice form'
                };

                // 2. Save to database
                const r = await InvoiceDAO.createInvoice(invoicePayload);
                if (!r.success) throw new Error(r.error || 'Failed to save invoice to server');
            }

            // 3. Generate PDF
            generatePDF();
            message(shouldSave ? 'Invoice saved & PDF downloaded!' : 'Draft PDF downloaded (Not Saved)!', 'success');
            setOpenPreviewDialog(false);
        }
        catch (e) {
            console.error(e);
            message(e.error || e.message || 'Failed to generate invoice', 'error');
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
    const generatePDF = ({ save = true } = {}) => {
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
        doc.setTextColor(0, 0, 0);

        const dateStr = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());

        const drawRowTop = (y, label, val) => {
            doc.text(label, marginX, y);
            doc.text(':', marginX + 43, y);

            const splitVal = doc.splitTextToSize(String(val || '-'), 110);
            doc.text(splitVal, marginX + 46, y);
            return splitVal.length * 5;
        };

        // Block 1
        drawRowTop(currentY, 'No Invoice', invoiceNumber); currentY += 6;
        drawRowTop(currentY, 'Tgl', dateStr); currentY += 6;
        drawRowTop(currentY, 'Nama Asuransi', insuranceName); currentY += 10;

        // Block 2
        drawRowTop(currentY, 'No Polis', policyNumber); currentY += 6;
        drawRowTop(currentY, 'Nama Tertanggung', getOwnerName()); currentY += 6;
        let addrH = drawRowTop(currentY, 'Alamat Tertanggung', ownerAddress); currentY += Math.max(6, addrH + 1);
        currentY += 4;

        // Block 3 & 4
        let startDateStr = invoiceStartDate ? new Date(invoiceStartDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';
        let endDateStr = invoiceEndDate ? new Date(invoiceEndDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';

        drawRowTop(currentY, 'Jangka Waktu', `${startDateStr} - ${endDateStr}`); currentY += 10;
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
                doc.text(item.description, rightColStart + 3, rightY);
                doc.text(': IDR', rightColStart + 28, rightY);
                doc.text(new Intl.NumberFormat('id-ID').format(Math.abs(item.price * item.quantity)), pageWidth - marginX - 3, rightY, { align: 'right' });
                rightY += 6;
            }
        });

        if (Number(discount) > 0) {
            doc.text('Disc', rightColStart + 3, rightY);
            doc.text(': IDR', rightColStart + 28, rightY);
            doc.text(new Intl.NumberFormat('id-ID').format(discount), pageWidth - marginX - 3, rightY, { align: 'right' });
            rightY += 6;

            doc.line(rightColStart, rightY - 2, pageWidth - marginX, rightY - 2);
            doc.text('Premi nett', rightColStart + 3, rightY + 3);
            doc.text(': IDR', rightColStart + 28, rightY + 3);
            doc.text(new Intl.NumberFormat('id-ID').format(calculateSubtotal() - Number(discount)), pageWidth - marginX - 3, rightY + 3, { align: 'right' });
            rightY += 9;
        }

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
        const tableContentEndY = Math.max(finalLeftY, finalRightY);

        // Jumlah row sits INSIDE the rect
        const jumlahBottomY = tableContentEndY + 10;

        // Main rect — extends to include the Jumlah row
        doc.rect(marginX, tableStartY + 6, pageWidth - 2 * marginX, jumlahBottomY - (tableStartY + 6));
        // Vertical divider — spans full height including Jumlah row
        doc.line(rightColStart, tableStartY + 6, rightColStart, jumlahBottomY);

        // Separator line above Jumlah (right column only)
        doc.line(rightColStart, tableContentEndY, pageWidth - marginX, tableContentEndY);

        // Jumlah text
        doc.text('Jumlah', rightColStart + 3, tableContentEndY + 6);
        doc.text(': IDR', rightColStart + 28, tableContentEndY + 6);
        doc.text(new Intl.NumberFormat('id-ID').format(calculateTotal()), pageWidth - marginX - 3, tableContentEndY + 6, { align: 'right' });

        // Signature
        let signY = jumlahBottomY + 24;
        doc.text('(Finance Department)', rightColStart + 30, signY, { align: 'center' });

        if (save) {
            doc.save(`Invoice_${invoiceNumber}.pdf`);
        }

        return doc;
    };

    const InvoicePreviewContent = () => (
        <Box
            ref={invoicePreviewRef}
            sx={{
                width: '100%',
                minHeight: isMobile ? 'calc(100vh - 172px)' : '70vh',
                display: 'flex',
                justifyContent: 'center',
                bgcolor: '#E5E7EB',
                py: isMobile ? 1 : 2,
            }}
        >
            {invoicePreviewUrl ? (
                <Document
                    file={invoicePreviewUrl}
                    onLoadSuccess={({ numPages }) => setInvoicePreviewPages(numPages)}
                    loading={<Typography sx={{ p: 3, color: C.textSub }}>Loading preview...</Typography>}
                    error={<Typography sx={{ p: 3, color: C.error }}>Preview PDF gagal dimuat.</Typography>}
                >
                    {Array.from(new Array(invoicePreviewPages), (_, index) => (
                        <Box key={`invoice-page-${index + 1}`} sx={{ mb: index + 1 === invoicePreviewPages ? 0 : 2 }}>
                            <Page
                                pageNumber={index + 1}
                                width={invoicePreviewWidth}
                                renderAnnotationLayer={false}
                                renderTextLayer={false}
                            />
                        </Box>
                    ))}
                </Document>
            ) : (
                <Typography sx={{ p: 3, color: C.textSub }}>Menyiapkan preview...</Typography>
            )}
        </Box>
    );
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    useEffect(() => {
        if (!openPreviewDialog) {
            setInvoicePreviewUrl('');
            setInvoicePreviewPages(0);
            return undefined;
        }

        const doc = generatePDF({ save: false });
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        setInvoicePreviewUrl(url);

        return () => {
            if (typeof url === 'string') URL.revokeObjectURL(url);
        };
    }, [openPreviewDialog]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!openPreviewDialog) return undefined;

        const updatePreviewWidth = () => {
            const containerWidth = invoicePreviewRef.current?.clientWidth || (isMobile ? window.innerWidth - 24 : 794);
            setInvoicePreviewWidth(Math.max(260, Math.min(containerWidth - (isMobile ? 16 : 32), 794)));
        };

        updatePreviewWidth();

        if (typeof ResizeObserver !== 'undefined' && invoicePreviewRef.current) {
            const observer = new ResizeObserver(updatePreviewWidth);
            observer.observe(invoicePreviewRef.current);
            return () => observer.disconnect();
        }

        window.addEventListener('resize', updatePreviewWidth);
        return () => window.removeEventListener('resize', updatePreviewWidth);
    }, [openPreviewDialog, isMobile]);

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

                            {/* Selection */}
                            <Paper elevation={0} sx={{ borderRadius: '12px', border: `1px solid ${C.border}`, bgcolor: C.white, p: 3, mb: 2 }}>
                                <Section title="Pilih Kendaraan">
                                    <Box
                                        onClick={() => setOpenSelectDialog(true)}
                                        sx={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            px: 1.5, py: '9px', mb: 1.5,
                                            border: `1px solid ${selectedItem ? accentColor : C.border}`,
                                            borderRadius: '8px',
                                            bgcolor: selectedItem ? accentLight : C.white,
                                            cursor: 'pointer', transition: 'all 0.15s',
                                            '&:hover': { borderColor: selectedItem ? accentColor : '#B0B5BC' },
                                        }}
                                    >
                                        <Box display="flex" alignItems="center" gap={1.25}>
                                            <Icon icon="mdi:car-search" width={18} color={selectedItem ? accentColor : C.textMuted} />
                                            <Typography fontSize={14} sx={{ color: selectedItem ? C.text : C.textMuted }}>
                                                {selectedItem ? getSelectedLabel() : `Cari dan pilih kendaraan...`}
                                            </Typography>
                                        </Box>
                                        {selectedItem
                                            ? <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSelectedItem(null); }} sx={{ p: 0.25 }}>
                                                <Icon icon="mdi:close" width={15} color={C.textSub} />
                                            </IconButton>
                                            : <Icon icon="mdi:chevron-down" width={18} color={C.textMuted} />
                                        }
                                    </Box>

                                    {/* Selected item detail card */}
                                    {selectedItem && (
                                        <Box sx={{ mt: -0.5, mb: 0.5, p: 1.5, borderRadius: '8px', bgcolor: '#F8F9FA', border: `1px solid ${C.border}` }}>
                                            <Typography fontSize={13} sx={{ color: C.textSub }}>
                                                Pemilik:{' '}
                                                <strong style={{ color: C.text, fontWeight: 700 }}>
                                                    {getOwnerName() || '-'}
                                                </strong>
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Additional Manual Inputs for PDF */}
                                    {selectedItem && (
                                        <Box mt={3}>
                                            <Typography fontSize={13} fontWeight={700} mb={1.5} color={C.text}>Informasi Tambahan (Khusus PDF)</Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}>
                                                    <Field label="Nama Asuransi" required={false}>
                                                        <TextField fullWidth size="small" value={insuranceName} onChange={(e) => setInsuranceName(e.target.value)}
                                                            placeholder="cth. Asuransi TAP" sx={inputStyle} />
                                                    </Field>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Field label="No Polis" required={false}>
                                                        <TextField fullWidth size="small" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)}
                                                            placeholder="cth. 1100201..." sx={inputStyle} />
                                                    </Field>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Field label="Alamat Tertanggung" required={false}>
                                                        <TextField fullWidth size="small" value={ownerAddress} onChange={(e) => setOwnerAddress(e.target.value)}
                                                            placeholder="Alamat klien..." sx={inputStyle} />
                                                    </Field>
                                                </Grid>
                                            </Grid>

                                            {/* Date fields */}
                                            <Divider sx={{ my: 2 }} />
                                            <Typography fontSize={13} fontWeight={700} mb={1.5} color={C.text}>Jangka Waktu Asuransi</Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={4}>
                                                    <Field label="Mulai" required={true}>
                                                        <TextField fullWidth size="small" type="date" value={invoiceStartDate} onChange={(e) => setInvoiceStartDate(e.target.value)} sx={inputStyle} />
                                                    </Field>
                                                </Grid>
                                                <Grid item xs={12} sm={4}>
                                                    <Field label="Selesai" required={true}>
                                                        <TextField fullWidth size="small" type="date" value={invoiceEndDate} onChange={(e) => setInvoiceEndDate(e.target.value)} sx={inputStyle} />
                                                    </Field>
                                                </Grid>
                                                <Grid item xs={12} sm={4}>
                                                    <Field label="Jatuh Tempo Pembayaran" required={true}>
                                                        <TextField fullWidth size="small" type="date" value={invoiceDueDate} onChange={(e) => setInvoiceDueDate(e.target.value)} sx={inputStyle} />
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
                                    {/* Quotation info banner */}
                                    {acceptedQuotation && (
                                        <Box sx={{ mb: 2, p: 1.5, borderRadius: '8px', bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Icon icon="mdi:file-document-check" width={18} color="#2563EB" />
                                            <Typography fontSize={12} sx={{ color: '#1E40AF' }}>
                                                Items di-generate dari Penawaran <strong>{acceptedQuotation.quotationNumber}</strong>
                                            </Typography>
                                        </Box>
                                    )}
                                    <Stack spacing={2}>
                                        {items.map((item, index) => {
                                            const isLocked = !!item.fromQuotation;
                                            return (
                                            <Box key={index} sx={{
                                                p: 2, borderRadius: '8px',
                                                border: `1px solid ${isLocked ? '#BFDBFE' : C.border}`,
                                                bgcolor: isLocked ? '#EFF6FF' : '#FAFBFC',
                                            }}>
                                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                                                    <Box display="flex" alignItems="center" gap={0.75}>
                                                        {isLocked && <Icon icon="mdi:lock" width={14} color="#2563EB" />}
                                                        <Typography fontSize={12} fontWeight={600} sx={{ color: isLocked ? '#2563EB' : C.textSub, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                                                            {isLocked ? `Dari Penawaran` : `Item ${index + 1}`}
                                                        </Typography>
                                                    </Box>
                                                    {!isLocked && items.length > 1 && (
                                                        <IconButton size="small" onClick={() => handleRemoveItem(index)} sx={{ color: C.error, p: 0.25 }}>
                                                            <Icon icon="mdi:trash-can-outline" width={16} />
                                                        </IconButton>
                                                    )}
                                                </Box>
                                                <Stack spacing={1.5}>
                                                    <Box>
                                                        <Typography fontSize={12} fontWeight={600} sx={{ color: C.text, mb: 0.75 }}>
                                                            Description {!isLocked && <span style={{ color: C.error }}>*</span>}
                                                        </Typography>
                                                        <TextField fullWidth size="small" multiline maxRows={2}
                                                            placeholder="e.g., Premi Asuransi Kendaraan"
                                                            value={item.description}
                                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                            disabled={isLocked}
                                                            sx={inputStyle} />
                                                    </Box>
                                                    <Box display="flex" gap={1.5}>
                                                        <Box flex={1}>
                                                            <Typography fontSize={12} fontWeight={600} sx={{ color: C.text, mb: 0.75 }}>Harga (Rp)</Typography>
                                                            <TextField fullWidth size="small" type="text"
                                                                value={item.price ? new Intl.NumberFormat('id-ID').format(item.price) : ''}
                                                                onChange={(e) => handleItemChange(index, 'price', parseNumber(e.target.value))}
                                                                disabled={isLocked}
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
                                            );
                                        })}
                                    </Stack>
                                </Section>

                                <Divider sx={{ borderColor: C.border, my: 2.5 }} />

                                <Section title="Additional Fees">
                                    <Box display="flex" gap={1.5}>
                                        <Box flex={1}>
                                            <Typography fontSize={12} fontWeight={600} sx={{ color: C.text, mb: 0.75 }}>Discount</Typography>
                                            <TextField fullWidth size="small" type="text" value={discount ? new Intl.NumberFormat('id-ID').format(discount) : ''}
                                                onChange={(e) => setDiscount(parseNumber(e.target.value))}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><Typography fontSize={13} fontWeight={700} sx={{ color: C.textSub }}>Rp</Typography></InputAdornment> }}
                                                sx={inputStyle} />
                                        </Box>
                                        <Box flex={1}>
                                            <Typography fontSize={12} fontWeight={600} sx={{ color: C.text, mb: 0.75 }}>Admin Fee</Typography>
                                            <TextField fullWidth size="small" type="text" value={adminFee ? new Intl.NumberFormat('id-ID').format(adminFee) : ''}
                                                onChange={(e) => setAdminFee(parseNumber(e.target.value))}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><Typography fontSize={13} fontWeight={700} sx={{ color: C.textSub }}>Rp</Typography></InputAdornment> }}
                                                sx={inputStyle} />
                                        </Box>
                                        <Box flex={1}>
                                            <Typography fontSize={12} fontWeight={600} sx={{ color: C.text, mb: 0.75 }}>Stamp Duty</Typography>
                                            <TextField fullWidth size="small" type="text" value={stampDuty ? new Intl.NumberFormat('id-ID').format(stampDuty) : ''}
                                                onChange={(e) => setStampDuty(parseNumber(e.target.value))}
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
                                        {Number(discount) > 0 && (
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography fontSize={13} sx={{ color: C.textSub }}>Discount</Typography>
                                                <Typography fontSize={13} sx={{ color: C.error }}>-{formatCurrency(discount)}</Typography>
                                            </Box>
                                        )}
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
                                    <Grid container spacing={1.5}>
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
                                            <Grid item xs={12} sm={6} key={label}>
                                                <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#F8F9FA', border: `1px solid ${C.border}`, minHeight: 68 }}>
                                                    <Typography fontSize={11} sx={{ color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, mb: 0.6 }}>{label}</Typography>
                                                    <Typography fontSize={13.5} fontWeight={600} sx={{ color: C.text, lineHeight: 1.35, overflowWrap: 'anywhere' }}>{value || '-'}</Typography>
                                                </Box>
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
                                            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography fontSize={13} sx={{ color: C.text }}>{item.description}</Typography>
                                                    <Typography fontSize={12} sx={{ color: C.textSub }}>{formatCurrency(item.price)}</Typography>
                                                </Box>
                                                <Typography fontSize={13} fontWeight={600} sx={{ color: C.text, textAlign: 'right', maxWidth: '50%', overflowWrap: 'anywhere' }}>
                                                    {formatCurrency(Number(item.quantity) * Number(item.price))}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>

                                    <Divider sx={{ borderColor: C.border, my: 2 }} />

                                    <Stack spacing={0.75} mb={2}>
                                        <Box display="flex" justifyContent="space-between" gap={2}>
                                            <Typography fontSize={13} sx={{ color: C.textSub }}>Subtotal</Typography>
                                            <Typography fontSize={13} fontWeight={600} sx={{ color: C.text, textAlign: 'right', overflowWrap: 'anywhere' }}>{formatCurrency(calculateSubtotal())}</Typography>
                                        </Box>
                                        {Number(adminFee) > 0 && <Box display="flex" justifyContent="space-between" gap={2}><Typography fontSize={13} sx={{ color: C.textSub }}>Admin Fee</Typography><Typography fontSize={13} sx={{ color: C.text, textAlign: 'right', overflowWrap: 'anywhere' }}>{formatCurrency(adminFee)}</Typography></Box>}
                                        {Number(stampDuty) > 0 && <Box display="flex" justifyContent="space-between" gap={2}><Typography fontSize={13} sx={{ color: C.textSub }}>Stamp Duty</Typography><Typography fontSize={13} sx={{ color: C.text, textAlign: 'right', overflowWrap: 'anywhere' }}>{formatCurrency(stampDuty)}</Typography></Box>}
                                    </Stack>

                                    <Box sx={{ p: 2.5, borderRadius: '8px', bgcolor: accentLight, border: `1px solid ${accentColor}30`, mb: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
                                            <Typography fontSize={14} fontWeight={700} sx={{ color: accentColor }}>TOTAL</Typography>
                                            <Typography fontSize={22} fontWeight={800} sx={{ color: accentColor, textAlign: 'right', overflowWrap: 'anywhere' }}>{formatCurrency(calculateTotal())}</Typography>
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
                maxWidth="lg" fullWidth fullScreen={isMobile} PaperProps={{ sx: { borderRadius: isMobile ? 0 : '12px' } }}>
                <DialogTitle sx={{ p: 2.5, borderBottom: `1px solid ${C.border}` }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Icon icon="mdi:file-pdf-box" width={22} color="#D32F2F" />
                        <Typography fontSize={16} fontWeight={700} sx={{ color: C.text }}>Preview Invoice</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: isMobile ? 1.5 : 3, bgcolor: '#F4F5F7' }}>
                    <Box sx={{ overflow: 'auto', maxHeight: isMobile ? 'calc(100vh - 172px)' : '70vh', display: 'flex', justifyContent: 'center', bgcolor: C.white, borderRadius: isMobile ? 0 : '8px' }}>
                        <InvoicePreviewContent />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: isMobile ? 1.5 : 2.5, borderTop: `1px solid ${C.border}`, gap: 1, flexDirection: isMobile ? 'column-reverse' : 'row', alignItems: isMobile ? 'stretch' : 'center' }}>
                    <Button onClick={() => setOpenPreviewDialog(false)} variant="outlined"
                        sx={{ borderRadius: '8px', textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: C.border, color: C.textSub, px: 3, m: 0 }}>
                        Cancel
                    </Button>
                    <Button variant="outlined" onClick={() => handleGenerate(false)}
                        startIcon={<Icon icon="mdi:download" width={15} />}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontSize: 13, fontWeight: 600, color: C.primary, borderColor: C.primary, px: 3, m: 0 }}>
                        Hanya Download
                    </Button>
                    <Button variant="contained" onClick={() => handleGenerate(true)}
                        startIcon={<Icon icon="mdi:content-save" width={15} />}
                        sx={{ bgcolor: '#D32F2F', borderRadius: '8px', textTransform: 'none', fontSize: 13, fontWeight: 600, px: 3, m: 0, boxShadow: 'none', '&:hover': { bgcolor: '#B71C1C' } }}>
                        Save & PDF
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

