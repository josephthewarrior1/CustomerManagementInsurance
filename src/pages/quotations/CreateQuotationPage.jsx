import { Icon } from '@iconify/react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Paper,
  Divider,
  Chip,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Container,
  IconButton,
  Dialog,
  Avatar,
  useMediaQuery,
  useTheme,
  Stack,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  Collapse,
  Fade,
} from '@mui/material';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CompanyDAO from '../../daos/CompanyDao';
import CarDAO from '../../daos/CarDao';
import QuotationDAO from '../../daos/QuotationDao';
import { useLocation } from 'react-router';
// import PropertyDAO from '../../daos/propertyDao';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const C = {
  bg: '#F4F5F7',
  white: '#FFFFFF',
  border: '#E4E6EA',
  borderFocus: '#1971C2',
  primary: '#1971C2',
  primaryLight: '#EBF4FF',
  text: '#1C1E21',
  textSub: '#606770',
  textMuted: '#9EA8B3',
  error: '#D92B2B',
  success: '#1E8840',
  successLight: '#EBF8EF',
  stepIdle: '#C8CDD4',
  car: '#1971C2',
  carLight: '#EBF4FF',
  property: '#0369A1',
  propertyLight: '#E0F2FE',
};

const inputStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    fontSize: 14,
    bgcolor: '#FFFFFF',
    '& fieldset': { borderColor: '#E4E6EA' },
    '&:hover fieldset': { borderColor: '#B0B5BC' },
    '&.Mui-focused fieldset': { borderColor: '#1971C2', borderWidth: '1.5px' },
  },
};

const STEPS = [
  { label: 'Details', icon: '1' },
  { label: 'Coverage', icon: '2' },
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
              <Box
                sx={{
                  width: 36, height: 36, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: done || current ? '#1971C2' : '#FFFFFF',
                  border: `2px solid ${done || current ? '#1971C2' : '#C8CDD4'}`,
                  boxShadow: current ? `0 0 0 4px ${alpha('#1971C2', 0.15)}` : 'none',
                  transition: 'all 0.25s',
                }}
              >
                {done
                  ? <Icon icon="mdi:check" width={16} color="#fff" />
                  : <Typography fontSize={13} fontWeight={700} sx={{ color: current ? '#fff' : '#C8CDD4' }}>{step.icon}</Typography>
                }
              </Box>
              <Typography fontSize={12} fontWeight={current ? 700 : 500} mt={0.75}
                sx={{ color: current ? '#1971C2' : done ? '#606770' : '#C8CDD4' }}>
                {step.label}
              </Typography>
            </Box>
            {i < STEPS.length - 1 && (
              <Box sx={{ width: 64, height: 2, bgcolor: i < active ? '#1971C2' : '#C8CDD4', mt: '17px', transition: 'background-color 0.3s', flexShrink: 0 }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

function Section({ title, action, children }) {
  return (
    <Box mb={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography fontSize={15} fontWeight={700} sx={{ color: '#1C1E21' }}>{title}</Typography>
        {action}
      </Box>
      {children}
    </Box>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <Box mb={2.5}>
      <Box display="flex" alignItems="baseline" gap={0.4} mb={0.75}>
        <Typography fontSize={13} fontWeight={600} sx={{ color: '#1C1E21' }}>{label}</Typography>
        {required && <Typography fontSize={13} sx={{ color: '#D92B2B' }}>*</Typography>}
      </Box>
      {hint && <Typography fontSize={12} sx={{ color: '#606770', mb: 0.75 }}>{hint}</Typography>}
      {children}
    </Box>
  );
}

function QuotationTypeTab({ value, onChange }) {
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

export default function CreateQuotationPage() {
  const loading = useLoading();
  const message = useAlert();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const prefillPolicyId = searchParams.get('policyId') || '';
  const renewalId = (searchParams.get('renewalId') || '').trim();

  const [activeStep, setActiveStep] = useState(0);
  const [quotationType, setQuotationType] = useState('car');
  const [companyProfile, setCompanyProfile] = useState(null);
  const [companyName, setCompanyName] = useState('PT. JAYAINDO ARTHA SUKSES');
  const [companySubtitle, setCompanySubtitle] = useState('INSURANCE AGENCY');
  const [companyCity, setCompanyCity] = useState('Jakarta');
  const [cars, setCars] = useState([]);
  const [properties, setProperties] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openSelectDialog, setOpenSelectDialog] = useState(false);
  const [selectSearch, setSelectSearch] = useState('');
  const [quotationNumber, setQuotationNumber] = useState('');
  const [tsi, setTsi] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insuranceType, setInsuranceType] = useState('All Risk');
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [quotationPreviewUrl, setQuotationPreviewUrl] = useState('');
  const pageTopRef = useRef(null);

  const [coverages, setCoverages] = useState({
    comprehensive: { enabled: true, percentage: 1.32, freeInclude: false },
    flood: { enabled: false, percentage: 0.1, freeInclude: false },
    earthquake: { enabled: false, percentage: 0.12, freeInclude: false },
    typhoonAndStorm: { enabled: false, percentage: 0.05, freeInclude: false },
    landslide: { enabled: false, percentage: 0.05, freeInclude: false },
    waterHammer: { enabled: false, percentage: 0.05, freeInclude: true },
    thirdPartyLiability: { enabled: false, percentage: '', isFixedAmount: true, freeInclude: false },
    authorizedWorkshop: { enabled: false, percentage: 0.05, freeInclude: true },
  });

  const coverageLabels = useMemo(() => ({
    comprehensive: 'Comprehensive',
    flood: 'Banjir',
    earthquake: 'Gempa Bumi',
    typhoonAndStorm: 'Angin Topan, Badai, Taifun, Hujan Es, Tornado',
    landslide: 'Tanah Longsor',
    waterHammer: 'Water Hammer',
    thirdPartyLiability: 'Tanggung Jawab Hukum Pihak III',
    authorizedWorkshop: 'Authorized Workshop',
  }), []);

  const [calculations, setCalculations] = useState({
    itemAmounts: {}, subtotal: 0, adminFee: 50000, stampDuty: 10000, totalPremium: 0,
  });

  useEffect(() => { fetchCompanyProfile(); fetchData(); generateQuotationNumber(); }, []); // eslint-disable-line
  useEffect(() => { calculateTotals(); }, [tsi, coverages]); // eslint-disable-line
  useEffect(() => {
    requestAnimationFrame(() => {
      pageTopRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
  }, [activeStep]);

  const roundIDR = (n) => Math.round(Number(n) || 0);
  const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(v) || 0);
  const fmtNum = (v) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(Number(v) || 0);
  const fmtShort = (v) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(v) || 0);
  const formatTsiInput = (v) => {
    const digits = String(v || '').replace(/\D/g, '');
    return digits ? fmtShort(digits) : '';
  };

  const handleTsiChange = (e) => {
    setTsi(e.target.value.replace(/\D/g, ''));
  };

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
      const [carRes, propRes] = await Promise.allSettled([
        CarDAO.getAllCars(),
        Promise.resolve({ properties: [] }),
      ]);
      if (carRes.status === 'fulfilled' && carRes.value?.cars) setCars(carRes.value.cars);
    } catch (e) { console.error(e); message('Failed to load data', 'error'); }
    finally { loading.stop(); }
  };

  // Auto-select car when policyId is passed (e.g. from Renewal flow)
  useEffect(() => {
    if (!prefillPolicyId || !cars?.length) return;
    if (quotationType !== 'car') setQuotationType('car');
    const found = cars.find(c => c.id === prefillPolicyId);
    if (found) setSelectedItem(found);
  }, [prefillPolicyId, cars, quotationType]);

  const handleTypeChange = (type) => {
    setQuotationType(type);
    setSelectedItem(null);
  };

  const generateQuotationNumber = () => {
    const d = new Date();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setQuotationNumber(`QUO-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${random}`);
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

  const toggleCoverage = (key) => setCoverages(p => ({ ...p, [key]: { ...p[key], enabled: !p[key].enabled } }));
  const toggleFree = (key) => setCoverages(p => ({ ...p, [key]: { ...p[key], freeInclude: !p[key].freeInclude } }));

  const setPct = (key, val) => {
    const c = coverages[key];
    let n = val;

    if (c.isFixedAmount) {
      // Untuk fixed amount (seperti thirdPartyLiability), biarkan string kosong atau konversi ke number
      if (val === '' || val === null || val === undefined) {
        n = '';
      } else {
        const num = Number(val);
        n = isNaN(num) ? '' : num;
      }
    } else {
      // Untuk percentage
      const num = parseFloat(val);
      n = isNaN(num) ? 0 : num;
    }

    setCoverages(p => ({ ...p, [key]: { ...p[key], percentage: n } }));
  };

  const calculateTotals = () => {
    const tv = Number(tsi) || 0;
    const itemAmounts = {};
    let subtotal = 0;
    Object.keys(coverages).forEach((k) => {
      const c = coverages[k];
      if (!c.enabled || c.freeInclude) { itemAmounts[k] = 0; return; }

      let amt = 0;
      if (c.isFixedAmount) {
        const fixedVal = Number(c.percentage);
        amt = isNaN(fixedVal) ? 0 : fixedVal;
      } else {
        amt = roundIDR((tv * (Number(c.percentage) || 0)) / 100);
      }
      itemAmounts[k] = amt;
      subtotal += amt;
    });
    const adminFee = 50000, stampDuty = 10000;
    setCalculations(p => ({ ...p, itemAmounts, subtotal, totalPremium: subtotal + adminFee + stampDuty }));
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!selectedItem) { message(`Please select a ${quotationType === 'car' ? 'car' : 'property'}`, 'error'); return; }
      if (!tsi || Number(tsi) <= 0) { message('Please enter a valid TSI amount', 'error'); return; }
    }
    setActiveStep(s => s + 1);
  };
  const handleBack = () => setActiveStep(s => s - 1);

  const handleReset = () => {
    setSelectedItem(null); setTsi(''); setActiveStep(0);
    setInsuranceProvider(''); setInsuranceType('All Risk');
    setCoverages({
      comprehensive: { enabled: true, percentage: 1.32, freeInclude: false },
      flood: { enabled: false, percentage: 0.1, freeInclude: false },
      earthquake: { enabled: false, percentage: 0.12, freeInclude: false },
      typhoonAndStorm: { enabled: false, percentage: 0.05, freeInclude: false },
      landslide: { enabled: false, percentage: 0.05, freeInclude: false },
      waterHammer: { enabled: false, percentage: 0.05, freeInclude: true },
      thirdPartyLiability: { enabled: false, percentage: '', isFixedAmount: true, freeInclude: false },
      authorizedWorkshop: { enabled: false, percentage: 0.05, freeInclude: true },
    });
    generateQuotationNumber();
  };

  const handleDownload = () => {
    if (!selectedItem || !tsi || Number(tsi) <= 0) { message('Please complete the form first', 'error'); return; }
    if (quotationType === 'car' && !insuranceProvider.trim()) { message('Provider Asuransi wajib diisi', 'error'); return; }
    setOpenPreviewDialog(true);
  };

  const handleConfirmDownload = async () => {
    try {
      loading.start();

      const payload = {
        customerId: selectedItem?.customerId || selectedItem?.id,
        policyType: quotationType,
        policyId: selectedItem?.id,
        renewalId: renewalId || undefined,
        quotationNumber,
        tsi: Number(tsi),
        insuranceProvider: quotationType === 'car' ? insuranceProvider.trim() : undefined,
        insuranceType: quotationType === 'car' ? insuranceType : undefined,
        coverages,
        totalPremium: calculations.totalPremium
      };

      const res = await QuotationDAO.createQuotation(payload);
      if (!res.success) {
        message(res.error || 'Failed to save quotation to database', 'error');
        return;
      }

      generatePDF();
      message('Quotation saved successfully & PDF generated!', 'success');
      setOpenPreviewDialog(false);
    }
    catch (e) { console.error(e); message('Failed to process Quotation', 'error'); }
    finally { loading.stop(); }
  };

  const generatePDF = ({ save = true } = {}) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    const marginX = 18;
    const rightX = pageWidth - marginX;

    let currentY = 20;

    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(30, 30, 30);
    doc.text((companyName || '').toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;

    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text((companySubtitle || '').toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    doc.setFont('times', 'normal');
    doc.setFontSize(16);
    doc.text('Quotation', pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    doc.text(`No. ${quotationNumber}`, marginX, currentY);

    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    doc.text(`${companyCity || 'Jakarta'}, ${dateStr}`, rightX, currentY, { align: 'right' });
    currentY += 13;

    const labelX = marginX;
    const colonX = marginX + 42;
    const valueX = marginX + 46;

    const row = (y, label, value) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, labelX, y);
      doc.setFont('helvetica', 'normal');
      doc.text(':', colonX, y);
      doc.text(String(value ?? ''), valueX, y);
    };

    row(currentY, 'Nama', quotationType === 'car' ? (selectedItem?.carData?.ownerName || 'TBA') : (selectedItem?.ownerName || selectedItem?.customerName || 'TBA'));
    currentY += 7;
    row(currentY, 'Alamat', quotationType === 'car' ? (selectedItem?.customerData?.address || selectedItem?.carData?.address || '-') : (selectedItem?.propertyData?.address || selectedItem?.customerData?.address || '-'));
    currentY += 7;
    row(currentY, 'Perhitungan Premi', quotationType === 'car' ? `${selectedItem?.carData?.carBrand || ''} ${selectedItem?.carData?.carModel || ''}`.trim() : `${selectedItem?.propertyData?.propertyType || ''}`.trim());
    currentY += 7;
    row(currentY, quotationType === 'car' ? 'No Polisi' : 'Kota', quotationType === 'car' ? (selectedItem?.carData?.plateNumber || 'TBA') : (selectedItem?.propertyData?.city || 'TBA'));
    currentY += 7;
    row(currentY, 'Harga TSI', `${fmtNum(Number(tsi) || 0)} (IDR)`);
    currentY += 12;

    const coverageBody = Object.keys(coverages)
      .filter((key) => coverages[key].enabled)
      .map((key) => {
        const c = coverages[key];
        let rateText = '';
        if (c.freeInclude) {
          rateText = 'FREE INCLUDE';
        } else if (c.isFixedAmount) {
          const fixedVal = Number(c.percentage);
          rateText = isNaN(fixedVal) ? 'Rp 0' : fmt(fixedVal);
        } else {
          rateText = `${c.percentage} %`;
        }
        return [coverageLabels[key], rateText];
      });

    autoTable(doc, {
      startY: currentY,
      head: [['Coverage', 'Rate']],
      body: coverageBody,
      theme: 'plain',
      styles: {
        fontSize: 9.5,
        cellPadding: { top: 1.6, right: 2, bottom: 1.6, left: 2 },
        overflow: 'linebreak'
      },
      headStyles: {
        fontStyle: 'bold',
        textColor: [0, 0, 0]
      },
      columnStyles: {
        0: { cellWidth: 120, halign: 'left' },
        1: { cellWidth: 35, halign: 'right' }
      },
      didParseCell: function (data) {
        if (data.section === 'head') {
          if (data.column.index === 0) {
            data.cell.styles.halign = 'left';
          }
          if (data.column.index === 1) {
            data.cell.styles.halign = 'right';
            data.cell.styles.cellPadding = {
              top: 1.6,
              right: 5,
              bottom: 1.6,
              left: 2
            };
          }
        }
      },
      margin: { left: marginX, right: marginX }
    });

    const afterCoverageY = (doc.lastAutoTable?.finalY ?? currentY) + 10;

    const tsiValue = Number(tsi) || 0;

    const calcBody = [];
    Object.keys(coverages).forEach((key) => {
      const c = coverages[key];
      if (!c.enabled) return;
      if (c.freeInclude) return;

      if (c.isFixedAmount) {
        const fixedVal = Number(c.percentage);
        const amt = isNaN(fixedVal) ? 0 : fixedVal;
        calcBody.push([
          coverageLabels[key],
          '-',
          '-',
          fmt(amt)
        ]);
      } else {
        const pct = Number(c.percentage) || 0;
        const amount = roundIDR((tsiValue * pct) / 100);
        const formattedBase = `Rp ${fmtShort(tsiValue)}`;
        calcBody.push([
          coverageLabels[key],
          formattedBase,
          `${pct} %`,
          fmt(amount)
        ]);
      }
    });

    if ((calculations.adminFee ?? 0) > 0) {
      calcBody.push([
        'Admin Fee',
        'Rp 50.000',
        '',
        fmt(calculations.adminFee)
      ]);
    }
    if ((calculations.stampDuty ?? 0) > 0) {
      calcBody.push([
        'Stamp Duty',
        'Rp 10.000',
        '',
        fmt(calculations.stampDuty)
      ]);
    }

    calcBody.push([
      { content: 'Total Premi', styles: { fontStyle: 'bold' } },
      { content: '', styles: { fontStyle: 'bold' } },
      { content: '', styles: { fontStyle: 'bold' } },
      { content: fmt(calculations.totalPremium), styles: { fontStyle: 'bold' } }
    ]);

    autoTable(doc, {
      startY: afterCoverageY,
      head: [['Item', 'Base', 'Rate', 'Amount']],
      body: calcBody,
      theme: 'striped',
      styles: {
        fontSize: 9,
        cellPadding: 2.6,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [235, 235, 235],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 60, halign: 'left' },
        1: { cellWidth: 45, halign: 'right' },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 'auto', halign: 'right' }
      },
      didParseCell: function (data) {
        if (data.section === 'head') {
          if (data.column.index === 0) {
            data.cell.styles.halign = 'left';
          }
          if (data.column.index === 1) {
            data.cell.styles.halign = 'right';
            data.cell.styles.cellPadding = {
              top: 2.6,
              right: 20,
              bottom: 2.6,
              left: 2
            };
          }
          if (data.column.index === 2) {
            data.cell.styles.halign = 'right';
            data.cell.styles.cellPadding = {
              top: 2.6,
              right: 10,
              bottom: 2.6,
              left: 2
            };
          }
          if (data.column.index === 3) {
            data.cell.styles.halign = 'right';
            data.cell.styles.cellPadding = {
              top: 2.6,
              right: 5,
              bottom: 2.6,
              left: 2
            };
          }
        }

        if (data.section === 'body') {
          if (data.column.index === 0) {
            data.cell.styles.halign = 'left';
          }
          if (data.column.index === 1) {
            data.cell.styles.halign = 'right';
            data.cell.styles.cellPadding = {
              top: 2.6,
              right: 12,
              bottom: 2.6,
              left: 2
            };
          }
          if (data.column.index === 2) {
            data.cell.styles.halign = 'right';
            data.cell.styles.cellPadding = {
              top: 2.6,
              right: 5,
              bottom: 2.6,
              left: 2
            };
          }
          if (data.column.index === 3) {
            data.cell.styles.halign = 'right';
            data.cell.styles.cellPadding = {
              top: 2.6,
              right: 3,
              bottom: 2.6,
              left: 2
            };
          }
        }
      },
      margin: { left: marginX, right: marginX }
    });

    if (save) {
      doc.save(`Quotation_${quotationNumber}.pdf`);
    }

    return doc;
  };

  useEffect(() => {
    if (!openPreviewDialog) {
      setQuotationPreviewUrl('');
      return undefined;
    }

    const doc = generatePDF({ save: false });
    setQuotationPreviewUrl(doc.output('datauristring'));

    return undefined;
  }, [openPreviewDialog]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredList = useMemo(() => {
    const s = selectSearch.toLowerCase();
    if (quotationType === 'car') {
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
  }, [quotationType, cars, properties, selectSearch]);

  const enabledKeys = Object.keys(coverages).filter(k => coverages[k].enabled);
  const accentColor = quotationType === 'car' ? C.car : C.property;
  const accentLight = quotationType === 'car' ? C.carLight : C.propertyLight;

  const getSelectedLabel = () => {
    if (!selectedItem) return '';
    if (quotationType === 'car') {
      return `${selectedItem.carData?.carBrand || ''} ${selectedItem.carData?.carModel || ''} - ${selectedItem.carData?.plateNumber || 'No Plate'}`;
    }
    return `${selectedItem.propertyData?.propertyType || 'Property'} - ${selectedItem.propertyData?.city || ''}`;
  };

  const getOwnerName = () => {
    if (!selectedItem) return '';
    if (quotationType === 'car') return selectedItem.carData?.ownerName || '';
    return selectedItem.ownerName || selectedItem.customerName || '';
  };

  const QuotationPreviewContent = () => {
    if (quotationPreviewUrl) {
      return (
        <Box
          component="iframe"
          title="Quotation PDF Preview"
          src={quotationPreviewUrl}
          sx={{ width: '100%', height: isMobile ? 'calc(100vh - 160px)' : '70vh', border: 0, display: 'block', bgcolor: '#fff' }}
        />
      );
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: isMobile ? 'calc(100vh - 160px)' : '70vh', bgcolor: '#E5E7EB' }}>
        <Typography sx={{ p: 3, color: C.textSub }}>Menyiapkan preview...</Typography>
      </Box>
    );
  };

  return (
    <Box ref={pageTopRef} sx={{ bgcolor: '#F4F5F7', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="sm">

        {/* Title */}
        <Box mb={3}>
          <Typography variant="h5" fontWeight={700} align="center" sx={{ color: '#1C1E21' }}>
            New Quotation
          </Typography>
          <Typography fontSize={13} align="center" sx={{ color: '#606770', mt: 0.5 }}>
            Generate an insurance quotation PDF for your customer
          </Typography>
          {renewalId && (
            <Box sx={{ mt: 1.5, textAlign: 'center' }}>
              <Chip
                icon={<Icon icon="mdi:arrow-u-right-top" width={16} />}
                label={`Quotation untuk Renewal: ${renewalId}`}
                sx={{ bgcolor: '#EBF4FF', color: '#1971C2', fontWeight: 700 }}
              />
            </Box>
          )}
        </Box>

        <WizardStepper active={activeStep} />

        {/* STEP 1 */}
        {activeStep === 0 && (
          <Fade in key="s1">
            <Box>
              <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                <Section
                  title="Company Header"
                  action={
                    <Button size="small" onClick={handleSaveCompanyProfile}
                      sx={{ textTransform: 'none', fontSize: 12, fontWeight: 600, color: '#1971C2', minWidth: 0 }}>
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

              <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                <Section title="Pilih Kendaraan">
                  <Field label="Kendaraan" required>
                    <Box
                      onClick={() => setOpenSelectDialog(true)}
                      sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        px: 1.5, py: '9px',
                        border: `1px solid ${selectedItem ? accentColor : '#E4E6EA'}`,
                        borderRadius: '8px',
                        bgcolor: selectedItem ? accentLight : '#FFFFFF',
                        cursor: 'pointer', transition: 'all 0.15s',
                        '&:hover': { borderColor: selectedItem ? accentColor : '#B0B5BC' },
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1.25}>
                        <Icon icon="mdi:car-search" width={18} color={selectedItem ? accentColor : '#9EA8B3'} />
                        <Typography fontSize={14} sx={{ color: selectedItem ? '#1C1E21' : '#9EA8B3' }}>
                          {selectedItem ? getSelectedLabel() : 'Cari dan pilih kendaraan...'}
                        </Typography>
                      </Box>
                      {selectedItem
                        ? <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSelectedItem(null); }} sx={{ p: 0.25 }}><Icon icon="mdi:close" width={15} color="#606770" /></IconButton>
                        : <Icon icon="mdi:chevron-down" width={18} color="#9EA8B3" />
                      }
                    </Box>
                  </Field>

                  {selectedItem && (
                    <Box sx={{ mt: -1.5, mb: 0.5, px: 2, py: 1.5, borderRadius: '8px', bgcolor: '#F8F9FA', border: '1px solid #E4E6EA', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Icon icon="mdi:account" width={15} color="#9EA8B3" />
                      <Typography fontSize={13} sx={{ color: '#606770' }}>Pemilik:</Typography>
                      <Typography fontSize={13} fontWeight={600} sx={{ color: '#1C1E21' }}>{selectedItem.carData?.ownerName || '-'}</Typography>
                    </Box>
                  )}
                </Section>

                <Divider sx={{ borderColor: '#E4E6EA', my: 2.5 }} />

                <Section title="Total Sum Insured (TSI)">
                  <Field label="Amount (IDR)" required hint="Nilai pertanggungan kendaraan">
                    <TextField fullWidth size="small" placeholder="e.g., 400.000.000"
                      value={formatTsiInput(tsi)} onChange={handleTsiChange}
                      inputProps={{ inputMode: 'numeric' }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Typography fontSize={13} fontWeight={700} sx={{ color: '#606770' }}>Rp</Typography></InputAdornment>,
                      }}
                      sx={inputStyle}
                    />
                  </Field>
                </Section>
              </Paper>

              <Button fullWidth variant="contained" onClick={handleNext}
                endIcon={<Icon icon="mdi:arrow-right" width={16} />}
                sx={{ borderRadius: '8px', py: 1.4, textTransform: 'none', fontSize: 14, fontWeight: 600, bgcolor: '#1971C2', boxShadow: 'none', '&:hover': { bgcolor: '#145EA8' } }}>
                Continue to Coverage
              </Button>
            </Box>
          </Fade>
        )}

        {/* STEP 2 */}
        {activeStep === 1 && (
          <Fade in key="s2">
            <Box>
              {quotationType === 'car' && (
                <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                  <Section title="Informasi Asuransi Utama">
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <Box flex={1}>
                        <Field label="Provider Asuransi" required hint="Contoh: Sinar Mas, ACA">
                          <TextField fullWidth size="small" placeholder="Ketik nama asuransi..." value={insuranceProvider} onChange={(e) => setInsuranceProvider(e.target.value)} sx={inputStyle} />
                        </Field>
                      </Box>
                      <Box flex={1}>
                        <Field label="Jenis Asuransi" required hint="Pilih tipe perlindungan">
                          <TextField select fullWidth size="small" value={insuranceType} onChange={e => setInsuranceType(e.target.value)} sx={inputStyle} SelectProps={{ native: true }}>
                            <option value="All Risk">All Risk (Comprehensive)</option>
                            <option value="TLO">Total Loss Only (TLO)</option>
                          </TextField>
                        </Field>
                      </Box>
                    </Stack>
                  </Section>
                </Paper>
              )}

              <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                <Section title="Coverage Options">
                  <Stack spacing={1.25}>
                    {Object.keys(coverages).map((key) => {
                      const c = coverages[key];
                      return (
                        <Box key={key} sx={{
                          borderRadius: '8px',
                          border: `1px solid ${c.enabled ? '#1971C2' : '#E4E6EA'}`,
                          bgcolor: c.enabled ? '#EBF4FF' : '#FAFBFC',
                          overflow: 'hidden', transition: 'all 0.15s',
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.25, cursor: 'pointer' }}
                            onClick={() => toggleCoverage(key)}>
                            <Box display="flex" alignItems="center" gap={1.25}>
                              <Box sx={{
                                width: 18, height: 18, borderRadius: '4px',
                                border: `2px solid ${c.enabled ? '#1971C2' : '#C8CDD4'}`,
                                bgcolor: c.enabled ? '#1971C2' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s',
                              }}>
                                {c.enabled && <Icon icon="mdi:check" width={12} color="#fff" />}
                              </Box>
                              <Typography fontSize={13.5} fontWeight={c.enabled ? 600 : 400} sx={{ color: c.enabled ? '#1C1E21' : '#606770' }}>
                                {coverageLabels[key]}
                              </Typography>
                            </Box>
                            {c.enabled && (
                              <Chip
                                label={c.freeInclude ? 'FREE' : fmt(calculations.itemAmounts?.[key] ?? 0)}
                                size="small"
                                sx={{
                                  height: 22, fontSize: 11, fontWeight: 700, ml: 1.5,
                                  bgcolor: c.freeInclude ? '#EBF8EF' : alpha('#1971C2', 0.12),
                                  color: c.freeInclude ? '#1E8840' : '#1971C2',
                                }}
                              />
                            )}
                          </Box>
                          <Collapse in={c.enabled}>
                            <Divider sx={{ borderColor: alpha('#1971C2', 0.15) }} />
                            <Box sx={{ px: 2, py: 1.5, bgcolor: alpha('#1971C2', 0.025) }}>
                              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} alignItems={{ sm: 'center' }}>
                                <FormControlLabel
                                  control={<Checkbox checked={c.freeInclude} onChange={() => toggleFree(key)} size="small" sx={{ p: 0.5, '&.Mui-checked': { color: '#1E8840' } }} />}
                                  label={<Typography fontSize={12} fontWeight={600} sx={{ color: '#1E8840' }}>FREE INCLUDE</Typography>}
                                  sx={{ m: 0 }}
                                />
                                <Box display="flex" alignItems="center" gap={1}>
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={c.percentage === '' ? '' : c.percentage}
                                    disabled={c.freeInclude}
                                    onChange={(e) => setPct(key, e.target.value)}
                                    placeholder={c.isFixedAmount ? "Masukkan nominal" : "0"}
                                    inputProps={c.isFixedAmount ? { min: 0, step: 1000 } : { step: 0.01, min: 0, max: 100 }}
                                    InputProps={{
                                      endAdornment: !c.isFixedAmount && <InputAdornment position="end"><Typography fontSize={12} sx={{ color: '#606770' }}>%</Typography></InputAdornment>,
                                      startAdornment: c.isFixedAmount && <InputAdornment position="start"><Typography fontSize={12} sx={{ color: '#606770' }}>Rp</Typography></InputAdornment>
                                    }}
                                    sx={{ width: c.isFixedAmount ? 180 : 100, '& .MuiOutlinedInput-root': { borderRadius: '6px', fontSize: 13, bgcolor: c.freeInclude ? '#F0F0F0' : '#FFFFFF', '& fieldset': { borderColor: '#E4E6EA' }, '&.Mui-focused fieldset': { borderColor: '#1971C2' } } }}
                                  />
                                  <Typography fontSize={12} sx={{ color: '#606770' }}>{c.isFixedAmount ? '' : 'dari TSI'}</Typography>
                                </Box>
                              </Stack>
                            </Box>
                          </Collapse>
                        </Box>
                      );
                    })}
                  </Stack>
                </Section>
              </Paper>

              {/* Premium Summary */}
              <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                <Section title="Premium Summary">
                  {enabledKeys.length === 0 ? (
                    <Typography fontSize={13} sx={{ color: '#9EA8B3', textAlign: 'center', py: 2 }}>No coverage selected</Typography>
                  ) : (
                    <Stack spacing={0.9} mb={2}>
                      {enabledKeys.map(key => {
                        const c = coverages[key];
                        return (
                          <Box key={key} display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
                            <Typography fontSize={13} sx={{ color: '#606770', flex: 1 }}>{coverageLabels[key]}</Typography>
                            <Typography fontSize={13} fontWeight={600} sx={{ color: c.freeInclude ? '#1E8840' : '#1C1E21', whiteSpace: 'nowrap' }}>
                              {c.freeInclude ? 'FREE' : fmt(calculations.itemAmounts?.[key] ?? 0)}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                  <Divider sx={{ borderColor: '#E4E6EA', my: 1.5 }} />
                  <Stack spacing={0.75} mb={2}>
                    <Box display="flex" justifyContent="space-between"><Typography fontSize={13} sx={{ color: '#606770' }}>Subtotal</Typography><Typography fontSize={13} fontWeight={600} sx={{ color: '#1C1E21' }}>{fmt(calculations.subtotal)}</Typography></Box>
                    <Box display="flex" justifyContent="space-between"><Typography fontSize={13} sx={{ color: '#606770' }}>Admin Fee</Typography><Typography fontSize={13} sx={{ color: '#1C1E21' }}>{fmt(calculations.adminFee)}</Typography></Box>
                    <Box display="flex" justifyContent="space-between"><Typography fontSize={13} sx={{ color: '#606770' }}>Stamp Duty</Typography><Typography fontSize={13} sx={{ color: '#1C1E21' }}>{fmt(calculations.stampDuty)}</Typography></Box>
                  </Stack>
                  <Box sx={{ p: 2, borderRadius: '8px', bgcolor: '#EBF4FF', border: `1px solid ${alpha('#1971C2', 0.2)}` }}>
                    <Box display="flex" justifyContent="space-between" alignItems="baseline">
                      <Typography fontSize={13} fontWeight={700} sx={{ color: '#1971C2' }}>TOTAL PREMIUM</Typography>
                      <Typography fontSize={20} fontWeight={800} sx={{ color: '#1971C2' }}>{fmt(calculations.totalPremium)}</Typography>
                    </Box>
                  </Box>
                </Section>
              </Paper>

              <Box display="flex" gap={1.5}>
                <Button fullWidth variant="outlined" onClick={handleBack} startIcon={<Icon icon="mdi:arrow-left" width={16} />}
                  sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: '#E4E6EA', color: '#606770' }}>
                  Back
                </Button>
                <Button fullWidth variant="contained" onClick={handleNext} endIcon={<Icon icon="mdi:arrow-right" width={16} />}
                  sx={{ borderRadius: '8px', py: 1.3, textTransform: 'none', fontSize: 13, fontWeight: 600, bgcolor: '#1971C2', boxShadow: 'none' }}>
                  Review
                </Button>
              </Box>
            </Box>
          </Fade>
        )}

        {/* STEP 3 */}
        {activeStep === 2 && (
          <Fade in key="s3">
            <Box>
              {/* Company */}
              <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                <Section title="Company">
                  <Box sx={{ p: 2, borderRadius: '8px', bgcolor: '#F8F9FA', border: '1px solid #E4E6EA', textAlign: 'center' }}>
                    <Typography fontSize={15} fontWeight={700} sx={{ color: '#1C1E21' }}>{companyName?.toUpperCase()}</Typography>
                    <Typography fontSize={12} sx={{ color: '#606770', mt: 0.25 }}>{companySubtitle}</Typography>
                    <Typography fontSize={12} sx={{ color: '#9EA8B3' }}>{companyCity}</Typography>
                  </Box>
                </Section>
              </Paper>

              {/* Customer */}
              <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                <Section title={quotationType === 'car' ? "Kendaraan Detail" : "Properti Detail"}>
                  <Grid container spacing={2}>
                    {(quotationType === 'car' ? [
                      { label: 'Pemilik', value: selectedItem?.carData?.ownerName },
                      { label: 'No. Rangka', value: selectedItem?.carData?.chassisNumber },
                      { label: 'Plate', value: selectedItem?.carData?.plateNumber },
                      { label: 'Kendaraan', value: `${selectedItem?.carData?.carBrand || ''} ${selectedItem?.carData?.carModel || ''}`.trim() },
                      { label: 'TSI', value: fmt(Number(tsi)) },
                    ] : [
                      { label: 'Pemilik', value: selectedItem?.ownerName || selectedItem?.customerName },
                      { label: 'Tipe Properti', value: selectedItem?.propertyData?.propertyType },
                      { label: 'Kota', value: selectedItem?.propertyData?.city },
                      { label: 'Alamat', value: selectedItem?.propertyData?.address },
                      { label: 'TSI', value: fmt(Number(tsi)) },
                    ]).map(({ label, value }) => (
                      <Grid item xs={6} key={label}>
                        <Typography fontSize={11} sx={{ color: '#9EA8B3', textTransform: 'uppercase', letterSpacing: 0.4, mb: 0.3 }}>{label}</Typography>
                        <Typography fontSize={13.5} fontWeight={500} sx={{ color: '#1C1E21' }}>{value || '-'}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Section>
              </Paper>

              {/* Coverage + Premium */}
              <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E4E6EA', bgcolor: '#FFFFFF', p: 3, mb: 2 }}>
                <Section title="Coverage & Premium">
                  <Stack spacing={1} mb={2}>
                    {enabledKeys.map(key => {
                      const c = coverages[key];
                      return (
                        <Box key={key} display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Icon icon="mdi:check-circle-outline" width={15} color="#1971C2" />
                            <Typography fontSize={13} sx={{ color: '#606770' }}>{coverageLabels[key]}</Typography>
                          </Box>
                          <Chip label={c.freeInclude ? 'FREE' : (c.isFixedAmount ? (c.percentage === '' ? 'Rp 0' : fmt(Number(c.percentage))) : `${c.percentage}%`)} size="small"
                            sx={{ height: 20, fontSize: 11, fontWeight: 700, bgcolor: c.freeInclude ? '#EBF8EF' : '#EBF4FF', color: c.freeInclude ? '#1E8840' : '#1971C2' }} />
                        </Box>
                      );
                    })}
                  </Stack>
                  <Divider sx={{ borderColor: '#E4E6EA', my: 2 }} />
                  <Stack spacing={0.75} mb={2}>
                    {enabledKeys.filter(k => !coverages[k].freeInclude).map(key => (
                      <Box key={key} display="flex" justifyContent="space-between">
                        <Typography fontSize={13} sx={{ color: '#606770' }}>{coverageLabels[key]}</Typography>
                        <Typography fontSize={13} fontWeight={500} sx={{ color: '#1C1E21' }}>{fmt(calculations.itemAmounts?.[key] ?? 0)}</Typography>
                      </Box>
                    ))}
                    <Box display="flex" justifyContent="space-between"><Typography fontSize={13} sx={{ color: '#606770' }}>Admin Fee</Typography><Typography fontSize={13} sx={{ color: '#1C1E21' }}>{fmt(calculations.adminFee)}</Typography></Box>
                    <Box display="flex" justifyContent="space-between"><Typography fontSize={13} sx={{ color: '#606770' }}>Stamp Duty</Typography><Typography fontSize={13} sx={{ color: '#1C1E21' }}>{fmt(calculations.stampDuty)}</Typography></Box>
                  </Stack>
                  <Box sx={{ p: 2.5, borderRadius: '8px', bgcolor: '#EBF4FF', border: `1px solid ${alpha('#1971C2', 0.2)}`, mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="baseline">
                      <Typography fontSize={14} fontWeight={700} sx={{ color: '#1971C2' }}>TOTAL PREMIUM</Typography>
                      <Typography fontSize={22} fontWeight={800} sx={{ color: '#1971C2' }}>{fmt(calculations.totalPremium)}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ p: 1.75, borderRadius: '8px', bgcolor: '#F8F9FA', border: '1px solid #E4E6EA' }}>
                    <Typography fontSize={11} sx={{ color: '#9EA8B3', textTransform: 'uppercase', letterSpacing: 0.4 }}>Quotation No.</Typography>
                    <Typography fontSize={13} fontWeight={600} sx={{ color: '#1C1E21', fontFamily: 'monospace', mt: 0.25 }}>{quotationNumber}</Typography>
                  </Box>
                </Section>
              </Paper>

              <Button fullWidth variant="contained" onClick={handleDownload}
                startIcon={<Icon icon="mdi:file-pdf-box" width={18} />}
                sx={{ borderRadius: '8px', py: 1.5, textTransform: 'none', fontSize: 14, fontWeight: 600, bgcolor: '#D32F2F', boxShadow: 'none', mb: 1.5, '&:hover': { bgcolor: '#B71C1C', boxShadow: '0 4px 12px rgba(211,47,47,0.3)' } }}>
                Download PDF
              </Button>

              <Box display="flex" gap={1.5}>
                <Button fullWidth variant="outlined" onClick={handleBack} startIcon={<Icon icon="mdi:arrow-left" width={15} />}
                  sx={{ borderRadius: '8px', py: 1.25, textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: '#E4E6EA', color: '#606770' }}>
                  Edit Coverage
                </Button>
                <Button fullWidth variant="outlined" onClick={handleReset} startIcon={<Icon icon="mdi:refresh" width={15} />}
                  sx={{ borderRadius: '8px', py: 1.25, textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: '#E4E6EA', color: '#606770' }}>
                  Start Over
                </Button>
              </Box>
            </Box>
          </Fade>
        )}

      </Container>

      {/* Selection Dialog */}
      <Dialog open={openSelectDialog} onClose={() => { setOpenSelectDialog(false); setSelectSearch(''); }}
        maxWidth="xs" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : '12px', m: 2 } }}>
        <Box sx={{ p: 2.5 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <IconButton size="small" onClick={() => { setOpenSelectDialog(false); setSelectSearch(''); }} sx={{ mr: 1 }}>
              <Icon icon="mdi:arrow-left" width={20} color="#606770" />
            </IconButton>
            <Typography fontSize={16} fontWeight={700} sx={{ color: '#1C1E21' }}>Pilih {quotationType === 'car' ? 'Kendaraan' : 'Properti'}</Typography>
          </Box>
          <TextField fullWidth autoFocus size="small" placeholder={quotationType === 'car' ? 'Cari pemilik, merek, plat...' : 'Cari pemilik, tipe, kota...'}
            value={selectSearch} onChange={(e) => setSelectSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" width={18} color="#9EA8B3" /></InputAdornment> }}
            sx={{ mb: 2, ...inputStyle }} />
          <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
            {filteredList.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Icon icon={quotationType === 'car' ? "mdi:car-search" : "mdi:home-search"} width={44} color="#C8CDD4" />
                <Typography fontSize={14} sx={{ color: '#606770', mt: 1.5 }}>Tidak ada {quotationType === 'car' ? 'kendaraan' : 'properti'} ditemukan</Typography>
                {selectSearch && <Button onClick={() => setSelectSearch('')} sx={{ mt: 1, textTransform: 'none', fontSize: 12, color: '#1971C2' }}>Clear search</Button>}
              </Box>
            ) : (
              <Stack spacing={1}>
                {filteredList.map((item) => {
                  const sel = selectedItem?.id === item.id;
                  const title = quotationType === 'car'
                    ? `${item.carData?.carBrand || ''} ${item.carData?.carModel || ''}`.trim()
                    : item.propertyData?.propertyType || 'Property';
                  const sub1 = quotationType === 'car'
                    ? (item.carData?.ownerName || '-')
                    : (item.ownerName || item.customerName || '-');
                  const sub2 = quotationType === 'car'
                    ? (item.carData?.plateNumber || 'No plate')
                    : (item.propertyData?.city || '-');
                  return (
                    <Box key={item.id} onClick={() => { setSelectedItem(item); setOpenSelectDialog(false); setSelectSearch(''); }}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '8px', cursor: 'pointer',
                        border: `1px solid ${sel ? accentColor : '#E4E6EA'}`,
                        bgcolor: sel ? accentLight : '#FFFFFF', transition: 'all 0.15s',
                        '&:hover': { borderColor: accentColor, bgcolor: sel ? accentLight : '#FAFBFC' },
                      }}>
                      <Avatar sx={{ width: 38, height: 38, bgcolor: accentColor, fontSize: 15, fontWeight: 700 }}>
                        <Icon icon={quotationType === 'car' ? 'mdi:car' : 'mdi:home'} width={20} />
                      </Avatar>
                      <Box flex={1} minWidth={0}>
                        <Typography fontSize={13.5} fontWeight={600} sx={{ color: '#1C1E21' }}>{title}</Typography>
                        <Typography fontSize={12} sx={{ color: '#606770' }}>{sub1}</Typography>
                        <Typography fontSize={12} sx={{ color: '#9EA8B3' }}>{sub2}</Typography>
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

      {/* Preview Dialog */}
      <Dialog open={openPreviewDialog} onClose={() => setOpenPreviewDialog(false)}
        maxWidth="lg" fullWidth fullScreen={isMobile} PaperProps={{ sx: { borderRadius: isMobile ? 0 : '12px' } }}>
        <DialogTitle sx={{ p: 2.5, borderBottom: '1px solid #E4E6EA' }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Icon icon="mdi:file-pdf-box" width={22} color="#D32F2F" />
            <Typography fontSize={16} fontWeight={700} sx={{ color: '#1C1E21' }}>Preview Quotation</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: '#F4F5F7' }}>
          <Box sx={{ overflow: 'auto', maxHeight: '70vh', display: 'flex', justifyContent: 'center', bgcolor: '#fff', borderRadius: '8px' }}>
            <QuotationPreviewContent />
          </Box>
          <Box sx={{ display: 'none', p: 2.5, borderRadius: '8px', bgcolor: '#F8F9FA', border: '1px solid #E4E6EA' }}>
            <Box textAlign="center" mb={2}>
              <Typography fontSize={14} fontWeight={700} sx={{ color: '#1C1E21' }}>{companyName}</Typography>
              <Typography fontSize={12} sx={{ color: '#606770' }}>{companySubtitle} · {companyCity}</Typography>
            </Box>
            <Divider sx={{ borderColor: '#E4E6EA', my: 1.5 }} />
            <Stack spacing={0.75}>
              <Box display="flex" justifyContent="space-between"><Typography fontSize={13} sx={{ color: '#606770' }}>Pemilik</Typography><Typography fontSize={13} fontWeight={600} sx={{ color: '#1C1E21' }}>{getOwnerName() || '-'}</Typography></Box>
              <Box display="flex" justifyContent="space-between"><Typography fontSize={13} sx={{ color: '#606770' }}>{quotationType === 'car' ? 'Kendaraan' : 'Properti'}</Typography><Typography fontSize={13} sx={{ color: '#1C1E21' }}>{getSelectedLabel() || '-'}</Typography></Box>
              <Box display="flex" justifyContent="space-between"><Typography fontSize={13} sx={{ color: '#606770' }}>TSI</Typography><Typography fontSize={13} sx={{ color: '#1C1E21' }}>{fmt(Number(tsi))}</Typography></Box>
              <Divider sx={{ borderColor: '#E4E6EA', my: 0.5 }} />
              <Box display="flex" justifyContent="space-between"><Typography fontSize={13} fontWeight={600} sx={{ color: '#1C1E21' }}>Total Premium</Typography><Typography fontSize={15} fontWeight={700} sx={{ color: '#D32F2F' }}>{fmt(calculations.totalPremium)}</Typography></Box>
            </Stack>
          </Box>
          <Typography fontSize={12} sx={{ color: '#9EA8B3', mt: 2, display: 'none' }}>
            PDF will include full coverage breakdown and calculation.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid #E4E6EA', gap: 1 }}>
          <Button onClick={() => setOpenPreviewDialog(false)} variant="outlined"
            sx={{ borderRadius: '8px', textTransform: 'none', fontSize: 13, fontWeight: 600, borderColor: '#E4E6EA', color: '#606770', px: 3 }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDownload} variant="contained" startIcon={<Icon icon="mdi:download" width={15} />}
            sx={{ bgcolor: '#D32F2F', borderRadius: '8px', textTransform: 'none', fontSize: 13, fontWeight: 600, px: 3, boxShadow: 'none', '&:hover': { bgcolor: '#B71C1C' } }}>
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
