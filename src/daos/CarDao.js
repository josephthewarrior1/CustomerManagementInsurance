import ApiRequest from '../utils/ApiRequest';

export default class CarDAO {
    // Get car references (brands & models)
    static getCarReferences = async () => {
        return await ApiRequest.set(
            `/api/cars/references`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // Get all cars (admin or user specific based on backend logic)
    static getAllCars = async () => {
        return await ApiRequest.set(
            `/api/cars`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // Get cars by customer ID
    static getCarsByCustomer = async (customerId) => {
        return await ApiRequest.set(
            `/api/cars/customer/${customerId}`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // Get car by ID
    static getCarById = async (carId) => {
        return await ApiRequest.set(
            `/api/cars/${carId}`,
            ApiRequest.HTTP_METHOD.GET,
        );
    };

    // Create new car
    static createCar = async (carData) => {
        return await ApiRequest.set(
            `/api/cars`,
            ApiRequest.HTTP_METHOD.POST,
            carData,
        );
    };

    // Update car
    static updateCar = async (carId, carData) => {
        return await ApiRequest.set(
            `/api/cars/${carId}`,
            ApiRequest.HTTP_METHOD.PUT,
            carData,
        );
    };

    // Delete car
    static deleteCar = async (carId) => {
        return await ApiRequest.set(
            `/api/cars/${carId}`,
            ApiRequest.HTTP_METHOD.DELETE,
        );
    };

    // Upload car photos (leftSide, rightSide, front, back, dashboard)
    static uploadCarPhotos = async (carId, formData) => {
        console.log('📸 CarDAO: Uploading photos for car:', carId);
        return await ApiRequest.setMultipart(
            `/api/cars/${carId}/upload-photos`,
            ApiRequest.HTTP_METHOD.POST,
            formData
        );
    };

    // Upload documents (stnk, sim, ktp)
    static uploadDocuments = async (carId, formData) => {
        console.log('📄 CarDAO: Uploading documents for car:', carId);
        return await ApiRequest.setMultipart(
            `/api/cars/${carId}/upload-documents`,
            ApiRequest.HTTP_METHOD.POST,
            formData
        );
    };
}
