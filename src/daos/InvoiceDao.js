import ApiRequest from '../utils/ApiRequest';

export default class InvoiceDAO {
    // Get all invoices
    static getAllInvoices = async () => {
        return await ApiRequest.set(
            `/api/invoices`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // Get invoice by ID
    static getInvoiceById = async (invoiceId) => {
        return await ApiRequest.set(
            `/api/invoices/${invoiceId}`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // Get invoices by car ID (filter client-side from all invoices)
    static getInvoicesByCarId = async (carId) => {
        const res = await ApiRequest.set(
            `/api/invoices`,
            ApiRequest.HTTP_METHOD.GET,
        );
        const rawInvoices = res.data || res.invoices || (Array.isArray(res) ? res : []);
        if (res.success || Array.isArray(rawInvoices)) {
            return { success: true, invoices: rawInvoices.filter(inv => inv.carId === carId) };
        }
        // Fallback: return as-is and let the caller handle it
        return res;
    };

    // Create new invoice
    static createInvoice = async (data) => {
        return await ApiRequest.set(
            `/api/invoices`,
            ApiRequest.HTTP_METHOD.POST,
            data,
        );
    };

    // Update invoice
    static updateInvoice = async (invoiceId, data) => {
        return await ApiRequest.set(
            `/api/invoices/${invoiceId}`,
            ApiRequest.HTTP_METHOD.PUT,
            data,
        );
    };
}
