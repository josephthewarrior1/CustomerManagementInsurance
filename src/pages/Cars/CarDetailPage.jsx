import { Icon } from '@iconify/react';
import {
    Box, Typography, Button, Dialog, CircularProgress, Stack, Avatar, Chip, IconButton, Menu, MenuItem, Divider
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLoading } from '../../hooks/LoadingProvider';
import { useAlert } from '../../hooks/SnackbarProvider';
import CarDAO from '../../daos/CarDao';
import RenewalDAO from '../../daos/RenewalDao';
import QuotationDAO from '../../daos/QuotationDao';
import InvoiceDAO from '../../daos/InvoiceDao';
import PaymentDAO from '../../daos/PaymentDao';
import KwitansiDAO from '../../daos/KwitansiDao';
import CompanyDAO from '../../daos/CompanyDao';
import CustomerDAO from '../../daos/CustomerDao';
import CreateRenewalDialog from '../Renewals/CreateRenewalDialog';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

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

function generateQuotationPDF(q, car, company, customer) {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 18;
    const rightX = pageWidth - marginX;
    let y = 20;

    const cName = company?.companyName || 'PT. JAYAINDO ARTHA SUKSES';
    const cSub  = company?.companySubtitle || 'INSURANCE AGENCY';
    const cCity = company?.companyCity || 'Jakarta';

    doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(30, 30, 30);
    doc.text(cName.toUpperCase(), pageWidth / 2, y, { align: 'center' }); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(cSub.toUpperCase(), pageWidth / 2, y, { align: 'center' }); y += 10;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text('Quotation', pageWidth / 2, y, { align: 'center' }); y += 15;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
    const dateStr = new Date(q.createdAt || Date.now()).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(`No. ${q.quotationNumber || '-'}`, marginX, y);
    doc.text(`${cCity}, ${dateStr}`, rightX, y, { align: 'right' }); y += 13;

    const lX = marginX, cX = marginX + 42, vX = marginX + 46;
    const row = (ly, label, value) => {
        doc.setFont('helvetica', 'bold'); doc.text(label, lX, ly);
        doc.setFont('helvetica', 'normal'); doc.text(':', cX, ly); doc.text(String(value ?? '-'), vX, ly);
    };

    row(y, 'Nama', car?.carData?.ownerName || customer?.name || '-'); y += 7;
    row(y, 'Alamat', customer?.address || car?.customerAddress || '-'); y += 7;
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
            didParseCell: function (data) {
                if (data.section === 'head') {
                    if (data.column.index === 0) {
                        data.cell.styles.halign = 'left';
                    }
                    if (data.column.index === 1) {
                        data.cell.styles.halign = 'right';
                        data.cell.styles.cellPadding = { top: 1.6, right: 5, bottom: 1.6, left: 2 };
                    }
                }
            },
            margin: { left: marginX, right: marginX }
        });
        y = (doc.lastAutoTable?.finalY ?? y) + 10;
    }

    const tsiValue = Number(q.sumInsured || q.tsi) || 0;
    const calcBody = [];
    Object.keys(coverages).forEach(k => {
        const c = coverages[k];
        if (!c?.enabled) return;
        if (c.freeInclude) {
            calcBody.push([coverageLabels[k] || k, '-', '-', 'FREE INCLUDE']);
            return;
        }
        if (c.isFixedAmount) {
            const amt = Number(c.percentage) || 0;
            calcBody.push([coverageLabels[k] || k, '-', '-', fmt(amt)]);
        } else {
            const pct = Number(c.percentage) || 0;
            const amount = roundIDR((tsiValue * pct) / 100);
            calcBody.push([coverageLabels[k] || k, `Rp ${fmtNum(tsiValue)}`, `${pct} %`, fmt(amount)]);
        }
    });
    const totalPremium = Number(q.totalPremium || q.premium) || 0;
    calcBody.push([{ content: 'Total Premi', styles: { fontStyle: 'bold' } }, { content: '', styles: { fontStyle: 'bold' } }, { content: '', styles: { fontStyle: 'bold' } }, { content: fmt(totalPremium), styles: { fontStyle: 'bold' } }]);

    autoTable(doc, {
        startY: y, head: [['Item', 'Base', 'Rate', 'Amount']], body: calcBody, theme: 'striped',
        styles: { fontSize: 9, cellPadding: 2.6, overflow: 'linebreak' },
        headStyles: { fillColor: [235, 235, 235], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 60, halign: 'left' }, 1: { cellWidth: 45, halign: 'right' }, 2: { cellWidth: 25, halign: 'right' }, 3: { cellWidth: 'auto', halign: 'right' } },
        didParseCell: function (data) {
            if (data.section === 'head') {
                if (data.column.index === 0) {
                    data.cell.styles.halign = 'left';
                }
                if (data.column.index === 1) {
                    data.cell.styles.halign = 'right';
                    data.cell.styles.cellPadding = { top: 2.6, right: 20, bottom: 2.6, left: 2 };
                }
                if (data.column.index === 2) {
                    data.cell.styles.halign = 'right';
                    data.cell.styles.cellPadding = { top: 2.6, right: 10, bottom: 2.6, left: 2 };
                }
                if (data.column.index === 3) {
                    data.cell.styles.halign = 'right';
                    data.cell.styles.cellPadding = { top: 2.6, right: 5, bottom: 2.6, left: 2 };
                }
            }

            if (data.section === 'body') {
                if (data.column.index === 0) {
                    data.cell.styles.halign = 'left';
                }
                if (data.column.index === 1) {
                    data.cell.styles.halign = 'right';
                    data.cell.styles.cellPadding = { top: 2.6, right: 12, bottom: 2.6, left: 2 };
                }
                if (data.column.index === 2) {
                    data.cell.styles.halign = 'right';
                    data.cell.styles.cellPadding = { top: 2.6, right: 5, bottom: 2.6, left: 2 };
                }
                if (data.column.index === 3) {
                    data.cell.styles.halign = 'right';
                    data.cell.styles.cellPadding = { top: 2.6, right: 3, bottom: 2.6, left: 2 };
                }
            }
        },
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

    doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(30, 30, 30);
    doc.text(cName.toUpperCase(), pageWidth / 2, y, { align: 'center' }); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(cSub.toUpperCase(), pageWidth / 2, y, { align: 'center' }); y += 10;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
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

    const [invoices, setInvoices] = useState([]);
    const [loadingInvoices, setLoadingInvoices] = useState(true);

    const [kwitansis, setKwitansis] = useState([]);
    const [loadingKwitansis, setLoadingKwitansis] = useState(true);

    const [companyProfile, setCompanyProfile] = useState(null);
    const [customer, setCustomer] = useState(null);
    // PDF Preview dialog
    const [docPreview, setDocPreview] = useState({ open: false, pdfUrl: '', title: '', filename: '' });

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
        const doc = generateQuotationPDF(q, car, companyProfile, customer);
        openDocPreview(doc.output('datauristring'), `Quotation – ${q.quotationNumber}`, `Quotation_${q.quotationNumber}.pdf`);
    };
    const handleViewInvoice = (inv) => {
        const doc = generateInvoicePDF(inv, car, companyProfile);
        openDocPreview(doc.output('datauristring'), `Invoice – ${inv.invoiceNumber}`, `Invoice_${inv.invoiceNumber}.pdf`);
    };
    const handleViewKwitansi = (kw) => {
        const doc = generateKwitansiPDF(kw, companyProfile);
        const kwNum = (kw.kwitansiNumber || kw.id || 'KW').replace(/\//g, '_');
        openDocPreview(doc.output('datauristring'), `Kwitansi – ${kw.kwitansiNumber || kw.id}`, `Kwitansi_${kwNum}.pdf`);
    };

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

    // Top right menu
    const [anchorEl, setAnchorEl] = useState(null);
    const isMenuOpen = Boolean(anchorEl);

    useEffect(() => {
        fetchCar();
        fetchCompanyProfile();
    }, [id]);

    useEffect(() => {
        if (car) {
            fetchRenewals();
            fetchQuotations();
            fetchInvoices();
            fetchKwitansis();
        }
    }, [car]);

    const fetchCar = async () => {
        try {
            const response = await CarDAO.getCarById(id);
            if (response.success || response.car) {
                const fetchedCar = response.car || response;
                setCar(fetchedCar);
                if (fetchedCar.customerId) {
                    try {
                        const custRes = await CustomerDAO.getCustomerById(fetchedCar.customerId);
                        if (custRes.success) {
                            setCustomer(custRes.customer);
                        }
                    } catch (e) {
                        console.error('Failed to fetch customer for car:', e);
                    }
                }
            } else {
                message(response.error || 'Kendaraan tidak ditemukan', 'error');
                navigate('/cars');
            }
        } catch (err) {
            console.error(err);
            message('Gagal memuat data kendaraan', 'error');
            navigate('/cars');
        } finally {
            setLoading(false);
        }
    };

    const fetchRenewals = async () => {
        try {
            setLoadingRenewals(true);
            const res = await RenewalDAO.getRenewalsByCustomer(car.customerId);
            if (res.success) {
                const carRenewals = (res.renewals || []).filter(r => r.carId === id);
                setRenewals(carRenewals);
            }
        } catch { } 
        finally { setLoadingRenewals(false); }
    };

    const fetchQuotations = async () => {
        try {
            setLoadingQuotations(true);
            const res = await QuotationDAO.getQuotationsByCarId(id);
            if (res.success) {
                setQuotations(res.quotations || []);
            }
        } catch { } 
        finally { setLoadingQuotations(false); }
    };

    const fetchInvoices = async () => {
        try {
            setLoadingInvoices(true);
            const res = await InvoiceDAO.getInvoicesByCarId(id);
            if (res.success) {
                setInvoices(res.invoices || []);
            }
        } catch { }
        finally { setLoadingInvoices(false); }
    };

    const fetchKwitansis = async () => {
        try {
            setLoadingKwitansis(true);
            // Payment has direct carId field → much simpler join
            const [payRes, kwRes] = await Promise.allSettled([
                PaymentDAO.getAllPayments(),
                KwitansiDAO.getAllKwitansi(),
            ]);
            const allPayments = (payRes.status === 'fulfilled')
                ? (payRes.value?.payments || payRes.value?.data || []) : [];
            // Payments for this specific car
            const carPaymentIds = new Set(
                (Array.isArray(allPayments) ? allPayments : [])
                    .filter(p => p.carId === id)
                    .map(p => p.id)
            );
            const allKwitansi = (kwRes.status === 'fulfilled')
                ? (kwRes.value?.data || kwRes.value?.kwitansis || []) : [];
            const carKwitansis = (Array.isArray(allKwitansi) ? allKwitansi : [])
                .filter(k => carPaymentIds.has(k.paymentId));
            setKwitansis(carKwitansis);
        } catch { }
        finally { setLoadingKwitansis(false); }
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
        { label: 'Polis Terkait', key: 'polis', url: car.documentPhotos?.polis },
    ];

    const carPhotos = [
        { label: 'Depan', url: car.carPhotos?.front },
        { label: 'Belakang', url: car.carPhotos?.back },
        { label: 'Kiri', url: car.carPhotos?.leftSide },
        { label: 'Kanan', url: car.carPhotos?.rightSide },
        { label: 'Dashboard', url: car.carPhotos?.dashboard },
    ];

    const dueDate = new Date(car.carData?.dueDate);
    const isExpired = car.status === 'Expired';
    const msInDay = 24 * 60 * 60 * 1000;
    const isNearExpire = dueDate && !isNaN(dueDate.getTime()) && (dueDate.getTime() - Date.now() <= 30 * msInDay);
    const needsRenewal = isExpired || isNearExpire;
    const hasOngoingRenewal = renewals.some(r => ['Pending', 'Approved'].includes(r.status));

    const tabs = [
        { label: 'Info' },
        { label: 'Dokumen' },
        { label: 'Foto' },
        { label: 'Renewals' },
        { label: 'Penawaran' },
        { label: 'Invoice' },
        { label: 'Kwitansi' },
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
                            <Button
                                startIcon={<Icon icon="mdi:plus-circle" width={18}/>}
                                onClick={() => navigate(`/quotations/create?carId=${encodeURIComponent(id)}`)}
                                sx={{fontWeight: 700, textTransform: 'none', px: 1, color: '#2563EB', fontSize: '0.85rem'}}
                            >
                                Buat Penawaran
                            </Button>
                        </Box>
                        {loadingQuotations ? (
                            <Box textAlign="center" py={4}><CircularProgress size={24} /></Box>
                        ) : quotations.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}><Typography sx={{ color: '#94A3B8', fontSize: '0.9rem', fontWeight: 500 }}>Belum ada penawaran tersedia</Typography></Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {quotations.map(q => (
                                    <Box 
                                        key={q.id} 
                                        onClick={() => handleViewQuotation(q)}
                                        sx={{ 
                                            bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3,
                                            border: '1px solid #F1F5F9',
                                            cursor: 'pointer', transition: 'all 0.15s',
                                            '&:hover': { bgcolor: '#EEF4FF', borderColor: '#BFDBFE' }
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>{q.quotationNumber}</Typography>
                                            <Chip label={q.status} size="small" sx={{ bgcolor: q.status === 'Accepted' ? '#D1FAE5' : '#FEF3C7', color: q.status === 'Accepted' ? '#065F46' : '#92400E', fontWeight: 800, fontSize: '0.65rem', height: 20 }} />
                                        </Box>
                                        <Typography sx={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500, mb: 1 }}>
                                            {q.insuranceProvider || 'Asuransi'} · {q.insuranceType || 'Tipe'} <br/>
                                            TSI: {formatCurrency(q.sumInsured || q.tsi)}
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#1E293B' }}>
                                                {formatCurrency(q.totalPremium)}
                                            </Typography>
                                            
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                {q.status === 'Pending' && (
                                                    <Button 
                                                        size="small" 
                                                        disabled={acceptingQuote} 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAcceptQuotation(q.id);
                                                        }} 
                                                        sx={{ bgcolor: '#059669', color: '#fff', '&:hover':{bgcolor:'#047857'}, textTransform:'none', fontWeight: 700, borderRadius: 2 }}
                                                    >
                                                        {acceptingQuote ? <CircularProgress size={16} /> : 'Setujui'}
                                                    </Button>
                                                )}
                                                <Icon icon="mdi:file-pdf-box" color="#DC2626" width={22} />
                                            </Stack>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                )}

                {/* Tab 5: Invoice */}
                {tabValue === 5 && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>Daftar Invoice</Typography>
                            <Button
                                startIcon={<Icon icon="mdi:plus-circle" width={18}/>}
                                onClick={() => navigate(`/invoices/create`)}
                                sx={{ fontWeight: 700, textTransform: 'none', px: 1, color: '#2563EB', fontSize: '0.85rem' }}
                            >
                                Buat Invoice
                            </Button>
                        </Box>
                        {loadingInvoices ? (
                            <Box textAlign="center" py={4}><CircularProgress size={24} /></Box>
                        ) : invoices.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 5 }}>
                                <Icon icon="mdi:file-document-outline" width={44} color="#CBD5E1" />
                                <Typography sx={{ color: '#94A3B8', fontSize: '0.9rem', fontWeight: 500, mt: 1.5 }}>Belum ada invoice</Typography>
                                <Button
                                    onClick={() => navigate(`/invoices/create`)}
                                    sx={{ mt: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.85rem', color: '#2563EB' }}
                                    startIcon={<Icon icon="mdi:plus" width={16} />}
                                >
                                    Buat Invoice Pertama
                                </Button>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {invoices.map(inv => {
                                    const statusColor = {
                                        Paid:    { bg: '#D1FAE5', text: '#065F46' },
                                        Unpaid:  { bg: '#FEF3C7', text: '#92400E' },
                                        Overdue: { bg: '#FEE2E2', text: '#991B1B' },
                                    }[inv.status] || { bg: '#F1F5F9', text: '#475569' };
                                    return (
                                        <Box 
                                            key={inv.id} 
                                            onClick={() => handleViewInvoice(inv)}
                                            sx={{ 
                                                bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3, 
                                                border: '1px solid #E2E8F0',
                                                cursor: 'pointer', transition: 'all 0.15s',
                                                '&:hover': { bgcolor: '#EEF4FF', borderColor: '#BFDBFE' }
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                <Box>
                                                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>
                                                        {inv.invoiceNumber || inv.id}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.78rem', color: '#64748B', mt: 0.25 }}>
                                                        {inv.customerName || '-'}
                                                    </Typography>
                                                </Box>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Chip
                                                        label={inv.status || 'Draft'}
                                                        size="small"
                                                        sx={{ bgcolor: statusColor.bg, color: statusColor.text, fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                                                    />
                                                    <Icon icon="mdi:file-pdf-box" color="#DC2626" width={20} />
                                                </Stack>
                                            </Box>
                                            <Divider sx={{ my: 1.25, borderColor: '#E2E8F0' }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', mb: 0.25 }}>TOTAL</Typography>
                                                    <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B' }}>
                                                        {formatCurrency(inv.grandTotal || inv.subTotal || 0)}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'right' }}>
                                                    <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', mb: 0.25 }}>JATUH TEMPO</Typography>
                                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
                                                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}
                    </Box>
                )}

                {/* Tab 6: Kwitansi */}
                {tabValue === 6 && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>Daftar Kwitansi</Typography>
                            <Button
                                startIcon={<Icon icon="mdi:plus-circle" width={18}/>}
                                onClick={() => navigate(`/kwitansi/create`)}
                                sx={{ fontWeight: 700, textTransform: 'none', px: 1, color: '#2563EB', fontSize: '0.85rem' }}
                            >
                                Buat Kwitansi
                            </Button>
                        </Box>
                        {loadingKwitansis ? (
                            <Box textAlign="center" py={4}><CircularProgress size={24} /></Box>
                        ) : kwitansis.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 5 }}>
                                <Icon icon="mdi:receipt-text-outline" width={44} color="#CBD5E1" />
                                <Typography sx={{ color: '#94A3B8', fontSize: '0.9rem', fontWeight: 500, mt: 1.5 }}>Belum ada kwitansi</Typography>
                                <Typography sx={{ color: '#CBD5E1', fontSize: '0.8rem', mt: 0.5 }}>
                                    Kwitansi dibuat dari Payment yang sudah lunas
                                </Typography>
                                <Button
                                    onClick={() => navigate(`/kwitansi/create`)}
                                    sx={{ mt: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.85rem', color: '#2563EB' }}
                                    startIcon={<Icon icon="mdi:plus" width={16} />}
                                >
                                    Buat Kwitansi
                                </Button>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {kwitansis.map(kw => (
                                    <Box 
                                        key={kw.id} 
                                        onClick={() => handleViewKwitansi(kw)}
                                        sx={{ 
                                            bgcolor: '#F8FAFC', p: 2.5, borderRadius: 3, 
                                            border: '1px solid #E2E8F0',
                                            cursor: 'pointer', transition: 'all 0.15s',
                                            '&:hover': { bgcolor: '#EEF4FF', borderColor: '#BFDBFE' }
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Box>
                                                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>
                                                    {kw.kwitansiNumber || kw.id}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.78rem', color: '#64748B', mt: 0.25 }}>
                                                    Invoice: {kw.invoiceData?.invoiceNumber || '-'}
                                                </Typography>
                                            </Box>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Chip
                                                    label="Lunas"
                                                    size="small"
                                                    sx={{ bgcolor: '#D1FAE5', color: '#065F46', fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                                                />
                                                <Icon icon="mdi:file-pdf-box" color="#DC2626" width={20} />
                                            </Stack>
                                        </Box>
                                        <Divider sx={{ my: 1.25, borderColor: '#E2E8F0' }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', mb: 0.25 }}>JUMLAH</Typography>
                                                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#059669' }}>
                                                    {kw.amount ? formatCurrency(kw.amount) : '-'}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', mb: 0.25 }}>TANGGAL</Typography>
                                                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
                                                    {kw.createdAt ? new Date(kw.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                                </Typography>
                                            </Box>
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
        </Box>
    );
}
