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
    Stack,
    Skeleton
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
import CompanyDAO from '../../daos/CompanyDao';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

/* ───────────── PDF Helpers ───────────── */
const numberToWords = (num) => {
    if (!num) return 'Nol Rupiah';
    const angka = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    const parse = (n) => {
        if (n < 12) return angka[n];
        if (n < 20) return parse(n - 10) + ' Belas';
        if (n < 100) return parse(Math.floor(n / 10)) + ' Puluh ' + parse(n % 10);
        if (n < 200) return 'Seratus ' + parse(n - 100);
        if (n < 1000) return parse(Math.floor(n / 100)) + ' Ratus ' + parse(n % 100);
        if (n < 1000000) return parse(Math.floor(n / 1000)) + ' Ribu ' + parse(n % 1000);
        if (n < 1000000000) return parse(Math.floor(n / 1000000)) + ' Juta ' + parse(n % 1000000);
        return 'Angka terlalu besar';
    };
    const r = parse(Number(num));
    return r.charAt(0).toUpperCase() + r.slice(1).trim() + ' Rupiah';
};

const fmtNum = (v) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(Number(v) || 0);
const fmt = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(v) || 0);
const roundIDR = (n) => Math.round(Number(n) || 0);

const coverageLabels = {
    comprehensive: 'Comprehensive',
    flood: 'Banjir',
    earthquake: 'Gempa Bumi',
    typhoonAndStorm: 'Angin Topan, Badai, Taifun, Hujan Es',
    landslide: 'Tanah Longsor',
    waterHammer: 'Water Hammer',
    thirdPartyLiability: 'Tanggung Jawab Hukum Pihak III',
    authorizedWorkshop: 'Authorized Workshop',
};

function generateQuotationPDF(q, car, company) {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 18;
    const rightX = pageWidth - marginX;
    let y = 20;

    const cName = company?.companyName || 'PT. JAYAINDO ARTHA SUKSES';
    const cSub  = company?.companySubtitle || 'INSURANCE AGENCY';
    const cCity = company?.companyCity || 'Jakarta';

    doc.setFont('times', 'bold'); doc.setFontSize(22); doc.setTextColor(30, 30, 30);
    doc.text(cName.toUpperCase(), pageWidth / 2, y, { align: 'center' }); y += 6;
    doc.setFont('times', 'normal'); doc.setFontSize(10);
    doc.text(cSub.toUpperCase(), pageWidth / 2, y, { align: 'center' }); y += 10;
    doc.setFont('times', 'normal'); doc.setFontSize(16);
    doc.text('Quotation', pageWidth / 2, y, { align: 'center' }); y += 15;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
    const dateStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(`No. ${q.quotationNumber || '-'}`, marginX, y);
    doc.text(`${cCity}, ${dateStr}`, rightX, y, { align: 'right' }); y += 13;

    const lX = marginX, cX = marginX + 42, vX = marginX + 46;
    const row = (ly, label, value) => {
        doc.setFont('helvetica', 'bold'); doc.text(label, lX, ly);
        doc.setFont('helvetica', 'normal'); doc.text(':', cX, ly); doc.text(String(value ?? '-'), vX, ly);
    };

    row(y, 'Nama', car?.carData?.ownerName || '-'); y += 7;
    row(y, 'Perhitungan Premi', `${car?.carData?.carBrand || ''} ${car?.carData?.carModel || ''}`.trim() || '-'); y += 7;
    row(y, 'No Polisi', car?.carData?.plateNumber || '-'); y += 7;
    row(y, 'Harga TSI', `${fmtNum(Number(q.sumInsured || q.tsi))} (IDR)`); y += 12;

    const coverages = q.coverages || {};
    const coverageBody = Object.keys(coverages)
        .filter(k => coverages[k]?.enabled)
        .map(k => {
            const c = coverages[k];
            let rate = c.freeInclude ? 'FREE INCLUDE' : c.isFixedAmount ? fmt(Number(c.percentage) || 0) : `${c.percentage} %`;
            return [coverageLabels[k] || k, rate];
        });

    if (coverageBody.length > 0) {
        autoTable(doc, {
            startY: y, head: [['Coverage', 'Rate']], body: coverageBody, theme: 'plain',
            styles: { fontSize: 9.5, cellPadding: { top: 1.6, right: 2, bottom: 1.6, left: 2 }, overflow: 'linebreak' },
            headStyles: { fontStyle: 'bold', textColor: [0, 0, 0] },
            columnStyles: { 0: { cellWidth: 120, halign: 'left' }, 1: { cellWidth: 35, halign: 'right' } },
            margin: { left: marginX, right: marginX }
        });
        y = (doc.lastAutoTable?.finalY ?? y) + 10;
    }

    const tsiValue = Number(q.sumInsured || q.tsi) || 0;
    const calcBody = [];
    Object.keys(coverages).forEach(k => {
        const c = coverages[k];
        if (!c?.enabled || c.freeInclude) return;
        if (c.isFixedAmount) {
            const amt = Number(c.percentage) || 0;
            calcBody.push([coverageLabels[k] || k, '-', '-', fmt(amt)]);
        } else {
            const pct = Number(c.percentage) || 0;
            const amount = roundIDR((tsiValue * pct) / 100);
            calcBody.push([coverageLabels[k] || k, `Rp ${fmtNum(tsiValue)}`, `${pct} %`, fmt(amount)]);
        }
    });
    const adminFee = 50000, stampDuty = 10000;
    calcBody.push(['Admin Fee', 'Rp 50.000', '', fmt(adminFee)]);
    calcBody.push(['Stamp Duty', 'Rp 10.000', '', fmt(stampDuty)]);
    const totalPremium = Number(q.totalPremium || q.premium) || 0;
    calcBody.push([{ content: 'Total Premi', styles: { fontStyle: 'bold' } }, { content: '', styles: { fontStyle: 'bold' } }, { content: '', styles: { fontStyle: 'bold' } }, { content: fmt(totalPremium), styles: { fontStyle: 'bold' } }]);

    autoTable(doc, {
        startY: y, head: [['Item', 'Base', 'Rate', 'Amount']], body: calcBody, theme: 'striped',
        styles: { fontSize: 9, cellPadding: 2.6, overflow: 'linebreak' },
        headStyles: { fillColor: [235, 235, 235], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 60, halign: 'left' }, 1: { cellWidth: 45, halign: 'right' }, 2: { cellWidth: 25, halign: 'right' }, 3: { cellWidth: 'auto', halign: 'right' } },
        margin: { left: marginX, right: marginX }
    });

    return doc;
}

function generateInvoicePDF(inv, car, company) {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 18;
    let y = 20;

    const cName = company?.companyName || 'PT. JAYAINDO ARTHA SUKSES';
    const cSub  = company?.companySubtitle || 'INSURANCE AGENCY';
    const cCity = company?.companyCity || 'Jakarta';

    doc.setFont('times', 'bold'); doc.setFontSize(22); doc.setTextColor(30, 30, 30);
    doc.text(cName.toUpperCase(), pageWidth / 2, y, { align: 'center' }); y += 6;
    doc.setFont('times', 'normal'); doc.setFontSize(10);
    doc.text(cSub.toUpperCase(), pageWidth / 2, y, { align: 'center' }); y += 10;
    doc.setFont('times', 'normal'); doc.setFontSize(16);
    doc.text('Invoice', pageWidth / 2, y, { align: 'center' }); y += 15;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
    const dateStr = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());

    const drawRow = (ly, label, val) => {
        doc.text(label, marginX, ly); doc.text(':', marginX + 43, ly);
        const splitVal = doc.splitTextToSize(String(val || '-'), 110);
        doc.text(splitVal, marginX + 46, ly);
        return splitVal.length * 5;
    };

    drawRow(y, 'No Invoice', inv.invoiceNumber || '-'); y += 6;
    drawRow(y, 'Tgl', dateStr); y += 6;
    drawRow(y, 'Nama Asuransi', inv.insuranceName || car?.carData?.insuranceProvider || '-'); y += 10;
    drawRow(y, 'No Polis', inv.policyNumber || inv.plateNumber || car?.carData?.plateNumber || '-'); y += 6;
    drawRow(y, 'Nama Tertanggung', inv.customerName || car?.carData?.ownerName || '-'); y += 6;
    y += 4;

    const startDateStr = inv.startDate ? new Date(inv.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) :
        car?.carData?.startDate ? new Date(car.carData.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';
    const endDateStr = inv.endDate ? new Date(inv.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) :
        car?.carData?.dueDate ? new Date(car.carData.dueDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';
    drawRow(y, 'Jangka Waktu', `${startDateStr} - ${endDateStr}`); y += 10;

    const tableStartY = y;
    doc.setDrawColor(0); doc.setLineWidth(0.3);
    doc.rect(marginX, tableStartY, pageWidth - 2 * marginX, 6);
    const rightColStart = pageWidth - marginX - 60;
    doc.line(rightColStart, tableStartY, rightColStart, tableStartY + 6);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text('Keterangan', marginX + ((rightColStart - marginX) / 2), tableStartY + 4, { align: 'center' });
    doc.text('Rincian Premi', rightColStart + 30, tableStartY + 4, { align: 'center' });

    let leftY = tableStartY + 12;
    doc.text('Pembayaran Premi Asuransi Dengan data-data sebagai berikut:', marginX + 3, leftY);
    leftY += 10;
    const drawCar = (label, value) => { doc.text(label, marginX + 3, leftY); doc.text(`: ${value || '-'}`, marginX + 25, leftY); leftY += 6; };
    drawCar('Merek', car?.carData?.carBrand); drawCar('Type', car?.carData?.carModel);
    drawCar('Tahun', car?.carData?.year); drawCar('Chassis', car?.carData?.chassisNumber);
    drawCar('No Polisi', car?.carData?.plateNumber);

    let rightY = tableStartY + 12;
    const invItems = inv.items || [];
    invItems.forEach(item => {
        if (item.description) {
            doc.text(item.description, rightColStart + 3, rightY);
            doc.text(': IDR', rightColStart + 28, rightY);
            doc.text(fmtNum(Math.abs((item.price || 0) * (item.quantity || 1))), pageWidth - marginX - 3, rightY, { align: 'right' });
            rightY += 6;
        }
    });
    if (!invItems.length) {
        const grandTotal = Number(inv.grandTotal) || 0;
        doc.text('Premi', rightColStart + 3, rightY); doc.text(': IDR', rightColStart + 28, rightY);
        doc.text(fmtNum(grandTotal), pageWidth - marginX - 3, rightY, { align: 'right' }); rightY += 6;
    }

    const tableContentEndY = Math.max(leftY + 10, rightY + 5);
    const jumlahBottomY = tableContentEndY + 10;
    doc.rect(marginX, tableStartY + 6, pageWidth - 2 * marginX, jumlahBottomY - (tableStartY + 6));
    doc.line(rightColStart, tableStartY + 6, rightColStart, jumlahBottomY);
    doc.line(rightColStart, tableContentEndY, pageWidth - marginX, tableContentEndY);
    doc.text('Jumlah', rightColStart + 3, tableContentEndY + 6);
    doc.text(': IDR', rightColStart + 28, tableContentEndY + 6);
    doc.text(fmtNum(Number(inv.grandTotal) || 0), pageWidth - marginX - 3, tableContentEndY + 6, { align: 'right' });
    let signY = jumlahBottomY + 24;
    doc.text('(Finance Department)', rightColStart + 30, signY, { align: 'center' });

    return doc;
}

function generateKwitansiPDF(kw, company) {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 20;
    let y = 25;

    const cName = company?.companyName || 'PT. JAYAINDO ARTHA SUKSES';
    const cSub  = company?.companySubtitle || 'INSURANCE AGENCY';
    const cCity = company?.companyCity || 'Jakarta';

    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(0, 0, 0);
    doc.text(cName.toUpperCase(), pageWidth / 2, y, { align: 'center' }); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(cSub.toUpperCase(), pageWidth / 2, y, { align: 'center' }); y += 20;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
    doc.text('KWITANSI', pageWidth / 2, y, { align: 'center' });
    doc.setLineWidth(0.5); doc.line(pageWidth / 2 - 22, y + 1.5, pageWidth / 2 + 22, y + 1.5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 100, 100);
    doc.text('RECEIPT', pageWidth / 2, y + 6, { align: 'center' }); y += 20;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
    const receiptNo = kw.kwitansiNumber || kw.id || '-';
    doc.text(`No : ${receiptNo}`, pageWidth - marginX, y, { align: 'right' }); y += 15;

    const lX = marginX, cX = marginX + 50, vX = marginX + 54;
    const invData = kw.invoiceData || {};
    const drawField = (ly, label, enLabel, value) => {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
        doc.text(label, lX, ly);
        doc.setLineWidth(0.3); doc.line(lX, ly + 2, lX + 46, ly + 2);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
        doc.text(enLabel, lX, ly + 6);
        doc.setTextColor(0, 0, 0); doc.setFontSize(11);
        doc.text(':', cX, ly); doc.text(String(value || ''), vX, ly);
        return ly + 15;
    };

    const custName = (invData.customerName || kw.customerName || '').toUpperCase();
    y = drawField(y, 'Terima dari', 'Received From', custName);
    const custAddr = (kw.customerAddress || invData.customerAddress || '').toUpperCase() || '-';
    y = drawField(y, 'Alamat', 'Address', custAddr);

    const amount = Number(invData.grandTotal || kw.amount) || 0;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(0, 0, 0);
    doc.text('Jumlah uang sebesar', lX, y);
    doc.setLineWidth(0.3); doc.line(lX, y + 2, lX + 46, y + 2);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    doc.text('The Sum of', lX, y + 6);
    doc.setTextColor(0, 0, 0); doc.setFontSize(11);
    doc.text(':', cX, y);
    doc.text(`IDR ${fmtNum(amount)},-`, vX, y);
    doc.setFontSize(9);
    doc.text(numberToWords(amount), vX, y + 5);
    y += 20;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('Untuk pembayaran', lX, y);
    doc.setLineWidth(0.3); doc.line(lX, y + 2, lX + 46, y + 2);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    doc.text('Being payment of', lX, y + 6);
    doc.setTextColor(0, 0, 0); doc.setFontSize(10);
    doc.text(':', cX, y);
    const pembayaran = (invData.notes || `PEMBAYARAN INVOICE ${invData.invoiceNumber || ''}`).toUpperCase();
    const pembayaranLines = doc.splitTextToSize(pembayaran, pageWidth - vX - marginX);
    doc.text(pembayaranLines, vX, y);
    y += 35;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    const createdDate = kw.createdAt ? new Date(kw.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(`${cCity}, ${createdDate}`, pageWidth - marginX, y, { align: 'right' });
    y += 30;
    doc.text('(Finance Department)', pageWidth - marginX, y, { align: 'right' });

    return doc;
}
/* ─────────────────────────────────────── */

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
    
    const [companyProfile, setCompanyProfile] = useState(null);
    // PDF Preview dialog
    const [docPreview, setDocPreview] = useState({ open: false, pdfUrl: '', title: '', filename: '' });
    
    // Top right menu
    const [anchorEl, setAnchorEl] = useState(null);
    const isMenuOpen = Boolean(anchorEl);

    const openDocPreview = (pdfUrl, title, filename) => {
        setDocPreview({ open: true, pdfUrl, title, filename });
    };
    const closeDocPreview = () => setDocPreview({ open: false, pdfUrl: '', title: '', filename: '' });

    const handleDownloadDocPreview = () => {
        if (!docPreview.pdfUrl) return;
        const link = document.createElement('a');
        link.href = docPreview.pdfUrl;
        link.download = docPreview.filename || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleViewQuotation = (q) => {
        const car = cars.find(c => c.id === q.policyId);
        const doc = generateQuotationPDF(q, car, companyProfile);
        openDocPreview(doc.output('datauristring'), `Quotation – ${q.quotationNumber}`, `Quotation_${q.quotationNumber}.pdf`);
    };
    const handleViewInvoice = (inv) => {
        const car = cars.find(c => c.id === inv.carId);
        const doc = generateInvoicePDF(inv, car, companyProfile);
        openDocPreview(doc.output('datauristring'), `Invoice – ${inv.invoiceNumber}`, `Invoice_${inv.invoiceNumber}.pdf`);
    };
    const handleViewKwitansi = (kw) => {
        const doc = generateKwitansiPDF(kw, companyProfile);
        const kwNum = (kw.kwitansiNumber || kw.id || 'KW').replace(/\//g, '_');
        openDocPreview(doc.output('datauristring'), `Kwitansi – ${kw.kwitansiNumber || kw.id}`, `Kwitansi_${kwNum}.pdf`);
    };

    useEffect(() => {
        fetchCustomer();
        fetchCompanyProfile();
    }, [id]);

    const fetchCompanyProfile = async () => {
        try {
            const r = await CompanyDAO.getCompanyProfile();
            if (r.success && r.profile) {
                setCompanyProfile(r.profile);
            }
        } catch (e) {
            console.error('Failed to fetch company profile:', e);
        }
    };

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
        return (
            <Box sx={{ bgcolor: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                {/* Header skeleton */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
                    <Skeleton variant="circular" width={36} height={36} />
                    <Skeleton variant="text" width={130} height={24} />
                    <Skeleton variant="circular" width={36} height={36} />
                </Box>

                <Box sx={{ p: 3, pt: 1, flex: 1, maxWidth: '600px', mx: 'auto', width: '100%' }}>
                    {/* Avatar skeleton */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3.5 }}>
                        <Skeleton variant="circular" width={90} height={90} />
                        <Skeleton variant="text" width={180} height={36} sx={{ mt: 2 }} />
                        <Skeleton variant="text" width={100} height={20} />
                    </Box>

                    {/* Tab skeleton */}
                    <Skeleton variant="rounded" width="100%" height={48} sx={{ borderRadius: '12px', mb: 4 }} />

                    {/* Info cards skeleton */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} variant="rounded" width="100%" height={72} sx={{ borderRadius: 3 }} />
                        ))}
                    </Box>
                </Box>
            </Box>
        );
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
                                                    onClick={() => handleViewQuotation(q)}
                                                    sx={{
                                                        bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        border: '1px solid #F1F5F9',
                                                        cursor: 'pointer', transition: 'all 0.15s',
                                                        '&:hover': { bgcolor: '#EEF4FF', borderColor: '#BFDBFE' }
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
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                                                        <Chip
                                                            label={q.status || 'Draft'}
                                                            size="small"
                                                            color={q.status === 'Accepted' ? 'success' : q.status === 'Draft' ? 'default' : 'warning'}
                                                            sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                                                        />
                                                        <Icon icon="mdi:file-pdf-box" color="#DC2626" width={20} />
                                                    </Box>
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
                                                    onClick={() => handleViewInvoice(inv)}
                                                    sx={{
                                                        bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        border: '1px solid #F1F5F9',
                                                        cursor: 'pointer', transition: 'all 0.15s',
                                                        '&:hover': { bgcolor: '#EEF4FF', borderColor: '#BFDBFE' }
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
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                                                        <Chip
                                                            label={inv.status}
                                                            size="small"
                                                            color={inv.status === 'Paid' ? 'success' : inv.status === 'Unpaid' ? 'error' : 'warning'}
                                                            sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                                                        />
                                                        <Icon icon="mdi:file-pdf-box" color="#DC2626" width={20} />
                                                    </Box>
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
                                                    onClick={() => handleViewKwitansi(kw)}
                                                    sx={{
                                                        bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        border: '1px solid #F1F5F9',
                                                        cursor: 'pointer', transition: 'all 0.15s',
                                                        '&:hover': { bgcolor: '#EEF4FF', borderColor: '#BFDBFE' }
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
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                                                        <Chip
                                                            label={`Print: ${kw.printCount || 1}x`}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                                                        />
                                                        <Icon icon="mdi:file-pdf-box" color="#DC2626" width={20} />
                                                    </Box>
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
            <Box sx={{ pb: 4 }} />

            <ImagePreviewDialog
                open={previewState.open}
                images={previewState.images}
                currentIndex={previewState.index}
                onIndexChange={(newIndex) => setPreviewState(prev => ({ ...prev, index: newIndex }))}
                onClose={() => setPreviewState({ open: false, images: [], index: 0 })}
            />

            {/* PDF Document Preview Dialog */}
            <Dialog
                open={docPreview.open}
                onClose={closeDocPreview}
                maxWidth="lg"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', m: 2 } }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.75, borderBottom: '1px solid #F1F5F9' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Icon icon="mdi:file-pdf-box" color="#DC2626" width={22} />
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#1E293B' }}>{docPreview.title}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton onClick={handleDownloadDocPreview} sx={{ color: '#2563EB' }} title="Download PDF">
                            <Icon icon="mdi:download" width={22} />
                        </IconButton>
                        <IconButton onClick={closeDocPreview} sx={{ color: '#94A3B8' }}>
                            <Icon icon="mdi:close" width={22} />
                        </IconButton>
                    </Box>
                </Box>
                <Box sx={{ height: '75vh', bgcolor: '#E5E7EB' }}>
                    {docPreview.pdfUrl && (
                        <Box
                            component="iframe"
                            title="PDF Preview"
                            src={docPreview.pdfUrl}
                            sx={{ width: '100%', height: '100%', border: 0, display: 'block' }}
                        />
                    )}
                </Box>
            </Dialog>
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
                        Yakin ingin menghapus <b>{customer.name}</b>? Tindakan ini tidak dapat dibatalkan. Menghapus pelanggan ini juga akan menghapus secara permanen semua data kendaraan, polis, penawaran (quotation), tagihan (invoice), kuitansi, dan pembayaran yang terkait.
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
