import ApiRequest from '../utils/ApiRequest';

export default class RenewalDAO {
    // Get all renewals
    static getAllRenewals = async () => {
        return await ApiRequest.set(
            `/api/renewals`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // Get renewal by ID
    static getRenewalById = async (renewalId) => {
        return await ApiRequest.set(
            `/api/renewals/${renewalId}`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // Get renewals by customer ID
    static getRenewalsByCustomer = async (customerId) => {
        return await ApiRequest.set(
            `/api/renewals/customer/${customerId}`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // Get renewals by status
    static getRenewalsByStatus = async (status) => {
        return await ApiRequest.set(
            `/api/renewals/status/${status}`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // Create renewal
    // data: { customerId, policyType, policyId, paymentId?, newStartDate, newEndDate, premium, status?, notes? }
    static createRenewal = async (data) => {
        return await ApiRequest.set(
            `/api/renewals`,
            ApiRequest.HTTP_METHOD.POST,
            data,
        );
    };

    // Update renewal (partial: paymentId, newStartDate, newEndDate, premium, status, notes)
    static updateRenewal = async (renewalId, data) => {
        return await ApiRequest.set(
            `/api/renewals/${renewalId}`,
            ApiRequest.HTTP_METHOD.PUT,
            data,
        );
    };

    // Complete renewal — backend updates policy dates and sets polis status Active
    static completeRenewal = async (renewalId) => {
        return await ApiRequest.set(
            `/api/renewals/${renewalId}/complete`,
            ApiRequest.HTTP_METHOD.POST,
        );
    };
}
