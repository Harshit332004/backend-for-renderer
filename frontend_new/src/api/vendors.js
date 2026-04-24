import axios from 'axios';

// ---------------------------------------------------------
// MEHUL'S CODE: Node.js/Firebase Express Backend (Port 5001)
// Required for WhatsApp AI Agent and Firebase vendors collection
// ---------------------------------------------------------
const API_URL = (import.meta.env.VITE_NODEJS_URL || 'http://localhost:5001') + '/api/vendors';

export const getVendors = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const addVendor = async (vendorData) => {
    const response = await axios.post(API_URL, vendorData);
    return response.data;
};

export const updateVendor = async (id, updateData) => {
    const response = await axios.put(`${API_URL}/${id}`, updateData);
    return response.data;
};

export const deleteVendor = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};

// ---------------------------------------------------------
// MAIN'S CODE: FastAPI Backend Compatibility
// Kept to ensure older components using vendorsApi don't break
// ---------------------------------------------------------
export { supplierApi as vendorsApi } from './supplier';