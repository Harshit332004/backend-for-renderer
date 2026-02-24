import axios from 'axios';

const API_URL = 'http://localhost:5001/api/pricing';

export const getPricing = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const addPricing = async (pricingData) => {
    const response = await axios.post(API_URL, pricingData);
    return response.data;
};

export const updatePricing = async (id, updateData) => {
    const response = await axios.put(`${API_URL}/${id}`, updateData);
    return response.data;
};

export const deletePricing = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};