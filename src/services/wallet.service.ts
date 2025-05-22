import { api } from "./axios/instance";


export const walletService = {
    fetchTransactions: async (userId: string) => {
        try {
            const response = await api.get("/api/wallet/transactions/" + userId);
            return response.data;
        } catch (error) {
            console.error("Error fetching transactions:", error);
            throw error;
        }
    },

    createPaymentIntent: async (amount: number) => {
        try {
            const response = await api.post("/api/wallet/stripe/create-payment-intent", {
                amount,
                currency: "inr",
            });
            return response.data;
        } catch (error) {
            console.error("Error creating payment intent:", error);
            throw error;
        }
    },

    addMoney: async (amount: number, paymentIntentId: string,userId: string,token: string) => {
        console.log('tocken===>',token);
        
        try {
            const response = await api.post("/api/wallet/add-money/" + userId, {
                amount,
                paymentIntentId,
                token
            });
            return response.data;
        } catch (error) {
            console.error("Error adding money:", error);
            throw error;
        }
    },

    
};