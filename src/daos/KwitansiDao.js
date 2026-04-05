import ApiRequest from '../utils/ApiRequest';

export default class KwitansiDAO {
    // Generate or get kwitansi
    static generateKwitansi = async (paymentId) => {
        return await ApiRequest.set(
            `/api/kwitansi/generate`,
            ApiRequest.HTTP_METHOD.POST,
            { paymentId }
        );
    };

    // Get all kwitansi
    static getAllKwitansi = async () => {
        return await ApiRequest.set(
            `/api/kwitansi`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // Get kwitansi by ID
    static getKwitansiById = async (kwitansiId) => {
        return await ApiRequest.set(
            `/api/kwitansi/${kwitansiId}`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };
}
