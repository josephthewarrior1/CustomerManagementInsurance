import ApiRequest from '../utils/ApiRequest';

export default class QuotationDAO {
    static createQuotation = async (data) => {
        return await ApiRequest.set(
            `/api/quotations`,
            ApiRequest.HTTP_METHOD.POST,
            data
        );
    };

    static getQuotationsByCarId = async (carId) => {
        return await ApiRequest.set(
            `/api/quotations/car/${carId}`,
            ApiRequest.HTTP_METHOD.GET
        );
    };

    static getQuotationById = async (id) => {
        return await ApiRequest.set(
            `/api/quotations/${id}`,
            ApiRequest.HTTP_METHOD.GET
        );
    };

    static acceptQuotation = async (id) => {
        return await ApiRequest.set(
            `/api/quotations/${id}/accept`,
            ApiRequest.HTTP_METHOD.POST
        );
    };

    static deleteQuotation = async (id) => {
        return await ApiRequest.set(
            `/api/quotations/${id}`,
            ApiRequest.HTTP_METHOD.DELETE
        );
    };
}
