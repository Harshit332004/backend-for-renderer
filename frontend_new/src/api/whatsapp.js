import axios from 'axios';

const API_URL = (import.meta.env.VITE_NODEJS_URL || 'http://localhost:5001') + '/api/whatsapp';

export const contactSupplier = async ({ supplierName, supplierPhone, productName, currentStock, message }) => {
    const response = await axios.post(`${API_URL}/contact-supplier`, {
        supplierName,
        supplierPhone,
        productName,
        currentStock,
        message
    });
    return response.data;
};

export const sendMessage = async ({ supplierPhone, supplierName, message }) => {
    const response = await axios.post(`${API_URL}/send-message`, {
        supplierPhone,
        supplierName,
        message
    });
    return response.data;
};

export const getConversations = async () => {
    const response = await axios.get(`${API_URL}/conversations`);
    return response.data;
};

export const getMessages = async (phone) => {
    const response = await axios.get(`${API_URL}/messages/${encodeURIComponent(phone)}`);
    return response.data;
};
