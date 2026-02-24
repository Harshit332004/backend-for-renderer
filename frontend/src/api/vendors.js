import axios from 'axios';

const API_URL = 'http://localhost:5001/api/vendors';

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