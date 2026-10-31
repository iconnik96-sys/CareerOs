import axios from 'axios';
import { supabase } from '../lib/supabase';

const FASTAPI_BASE_URL = (import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:8000').replace(/\/+$/, '');

const paymentClient = axios.create({
    baseURL: FASTAPI_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

paymentClient.interceptors.request.use(async (config) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            config.headers['Authorization'] = `Bearer ${session.access_token}`;
        }
    } catch (e) {
        // Continue if offline
    }
    return config;
});

export const paymentService = {
    async getPaymentConfig() {
        const res = await paymentClient.get('/api/payments/config');
        return res.data;
    },

    async createOrder(planId, billingCycle = 'monthly', idempotencyKey = null) {
        const res = await paymentClient.post('/api/payments/create-order', {
            plan_id: planId,
            billing_cycle: billingCycle,
            idempotency_key: idempotencyKey
        });
        return res.data;
    },

    async verifyPayment(orderId, paymentId, signature, internalPurchaseId = null) {
        const res = await paymentClient.post('/api/payments/verify-payment', {
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: signature,
            internal_purchase_id: internalPurchaseId
        });
        return res.data;
    },

    async getMySubscription() {
        const res = await paymentClient.get('/api/payments/my-subscription');
        return res.data;
    }
};

