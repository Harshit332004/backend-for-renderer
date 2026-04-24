import axios from 'axios';
import { inventoryApi } from './inventory';

// ---------------------------------------------------------
// MEHUL'S CODE: Node.js/Express Backend (Port 5001)
// Required for the new Pricing.jsx management page
// ---------------------------------------------------------
const API_URL = (import.meta.env.VITE_NODEJS_URL || 'http://localhost:5001') + '/api/pricing';

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

// ---------------------------------------------------------
// MAIN'S CODE (Harshit): FastAPI Backend Compatibility
// Kept to ensure AI pricing recommendations from inventory don't break
// ---------------------------------------------------------
export const getPricingRecommendation = (productId, storeId = 'store001') =>
    inventoryApi.getPricing(productId, storeId);