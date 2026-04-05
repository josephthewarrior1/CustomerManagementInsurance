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
