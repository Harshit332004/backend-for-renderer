import axios from 'axios';

const API_URL = 'http://localhost:5001/api/inventory';

export const getInventory = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const addProduct = async (productData) => {
    const response = await axios.post(API_URL, productData);
    return response.data;
};

export const updateProduct = async (id, updateData) => {
    const response = await axios.put(`${API_URL}/${id}`, updateData);
    return response.data;
};

export const deleteProduct = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};