import ApiRequest from '../utils/ApiRequest';

export default class PaymentDAO {
    // Get all payments
    static getAllPayments = async () => {
        return await ApiRequest.set(
            `/api/payments`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // Get payment by ID
    static getPaymentById = async (paymentId) => {
        return await ApiRequest.set(
            `/api/payments/${paymentId}`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // Get payments by customer ID
    static getPaymentsByCustomer = async (customerId) => {
        return await ApiRequest.set(
            `/api/payments/customer/${customerId}`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // Get payments by status
    static getPaymentsByStatus = async (status) => {
        return await ApiRequest.set(
            `/api/payments/status/${status}`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // Create payment record
    static createPayment = async (data) => {
        return await ApiRequest.set(
            `/api/payments`,
            ApiRequest.HTTP_METHOD.POST,
            data,
        );
    };

    // Update payment record
    static updatePayment = async (paymentId, data) => {
        return await ApiRequest.set(
            `/api/payments/${paymentId}`,
            ApiRequest.HTTP_METHOD.PUT,
            data,
        );
    };

    // Upload payment proof
    static uploadProof = async (paymentId, formData) => {
        return await ApiRequest.setMultipart(
            `/api/payments/${paymentId}/upload-proof`,
            ApiRequest.HTTP_METHOD.POST,
            formData,
        );
    };

    // Delete payment
    static deletePayment = async (paymentId) => {
        return await ApiRequest.set(
            `/api/payments/${paymentId}`,
            ApiRequest.HTTP_METHOD.DELETE
        );
    };
}
