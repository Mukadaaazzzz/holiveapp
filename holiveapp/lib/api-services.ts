// lib/api-services.ts
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
import * as SecureStore from 'expo-secure-store';

interface ServiceResponse {
  data?: any;
  error?: string;
  status?: string;
  message?: string;
  token?: string;
  Customer_Name?: string;
  Customer_Address?: string;
  Current_Bouquet?: string;
  [key: string]: any;
}

// Helper function to get userId from stored data
const getUserId = async (): Promise<string | null> => {
  try {
    const userId = await SecureStore.getItemAsync('userId');
    return userId;
  } catch (error) {
    console.error('Error getting userId:', error);
    return null;
  }
};

export const serviceRequest = async (
  service: string,
  payload: any
): Promise<ServiceResponse> => {
  try {
    const accessToken = await SecureStore.getItemAsync('access_token');
    if (!accessToken) {
      return { error: 'Not authenticated' };
    }

    // Get userId from secure store
    const userId = await getUserId();
    if (!userId) {
      return { error: 'User ID not found' };
    }

    const response = await fetch(`${API_BASE}/api/services-gateway`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        service,
        userId, // Add userId here
        ...payload
      })
    });

    const data = await response.json();
    return response.ok ? data : { error: data.error || 'Request failed' };
  } catch (error) {
    return { error: 'Network error' };
  }
};

// Service-specific functions
export const purchaseAirtime = (data: {
  network: string;
  mobile_number: string;
  amount: number;
}) => serviceRequest('airtime', data);

export const purchaseData = (data: {
  network: string;
  mobile_number: string;
  plan: string;
  amount: number;
}) => serviceRequest('data', data);

export const verifyElectricity = (data: {
  disco_name: string;
  meter_number: string;
}) => serviceRequest('electricity', { action: 'verify', ...data });

export const payElectricity = (data: {
  disco_name: string;
  meter_number: string;
  MeterType: string;
  amount: number;
}) => serviceRequest('electricity', data);

export const verifyCable = (data: {
  cablename: string;
  smart_card_number: string;
}) => serviceRequest('tv', { action: 'verify', ...data });

export const purchaseCable = (data: {
  cablename: string;
  smart_card_number: string;
  cableplan: string;
  amount: number;
}) => serviceRequest('tv', data);

// Network options
export const NETWORK_OPTIONS = [
  { id: "1", name: "MTN" },
  { id: "2", name: "GLO" },
  { id: "3", name: "9MOBILE" },
  { id: "4", name: "AIRTEL" },
];

// Electricity providers
export const ELECTRICITY_PROVIDERS = [
  { id: "1", name: "Ikeja Electricity" },
  { id: "2", name: "Eko Electricity" },
  { id: "3", name: "Kano Electricity (KEDCO)" },
  { id: "4", name: "Port Harcourt Electricity (PHED)" },
  { id: "5", name: "Jos Electricity" },
  { id: "6", name: "Ibadan Electricity (IBEDC)" },
  { id: "7", name: "Kaduna Electricity (KEDCO)" },
  { id: "8", name: "Abuja Electricity (AEDC)" },
  { id: "9", name: "Enugu Electricity (EEDC)" },
  { id: "10", name: "Benin Electricity (BEDC)" },
  { id: "11", name: "Yola Electricity" },
  { id: "12", name: "Aba Electricity" },
];

// Cable providers
export const CABLE_PROVIDERS = [
  { id: "1", name: "GOTV" },
  { id: "2", name: "DSTV" },
  { id: "3", name: "STARTIMES" },
  { id: "4", name: "SHOWMAX" },
];

// Data plans - copied from your Next.js code
export const DATA_PLANS = {
  "1": [ // MTN
    { id: "1", name: "500 MB", type: "SME2", validity: "1 Day", price: "₦390.00" },
    { id: "2", name: "1GB", type: "SME", validity: "7 Days", price: "₦800.00" },
    { id: "3", name: "1.5GB", type: "SME", validity: "7 Days", price: "₦1000.00" },
    { id: "4", name: "2.7GB", type: "SME", validity: "30 Days", price: "₦2000.00" },
    { id: "5", name: "6GB", type: "SME", validity: "7 Days", price: "₦2500.00" },
    { id: "6", name: "10GB", type: "SME", validity: "30 Days", price: "₦4500.50" },

  ],
  "2": [ // GLO
    { id: "20", name: "750 MB", type: "Corporate", validity: "1 Day", price: "₦195.00" },
    { id: "21", name: "1 GB", type: "Corporate", validity: "3 Days", price: "₦285.00" },
    { id: "50", name: "200 MB", type: "Corporate", validity: "14 Days", price: "₦93.00" },
    { id: "22", name: "500 MB", type: "Corporate", validity: "30 Days", price: "₦215.00" },
    { id: "23", name: "1 GB", type: "Corporate", validity: "30 Days", price: "₦430.00" },
    { id: "24", name: "2 GB", type: "Corporate", validity: "30 Days", price: "₦860.00" },
    { id: "25", name: "3 GB", type: "Corporate", validity: "30 Days", price: "₦1290.00" },
    { id: "26", name: "5 GB", type: "Corporate", validity: "30 Days", price: "₦2150.00" },
    { id: "27", name: "10 GB", type: "Corporate", validity: "30 Days", price: "₦4300.00" },
    
  ],
  "3": [ // 9MOBILE
    { id: "34", name: "500 MB", type: "Corporate", validity: "30 Days", price: "₦71.00" },
    { id: "35", name: "1 GB", type: "Corporate", validity: "30 Days", price: "₦130.00" },
    { id: "36", name: "2 GB", type: "Corporate", validity: "30 Days", price: "₦260.00" },
    { id: "37", name: "3 GB", type: "Corporate", validity: "30 Days", price: "₦390.00" },
    { id: "39", name: "10GB", type: "Corporate", validity: "30 Days", price: "₦1300.00" },
    { id: "68", name: "4GB", type: "Corporate", validity: "30 Days", price: "₦520.00" },
    { id: "69", name: "20GB", type: "Corporate", validity: "30 Days", price: "₦2600.00" },
    { id: "80", name: "1.5GB", type: "Corporate", validity: "30 Days", price: "₦197.00" },

  ],
  "4": [ // AIRTEL
    { id: "28", name: "500 MB", type: "Corporate", validity: "7 Days", price: "₦495.00" },
    { id: "29", name: "1 GB", type: "Corporate", validity: "7 Days", price: "₦792.00" },
    { id: "30", name: "2 GB", type: "Corporate", validity: "30 Days", price: "₦1485.00" },
    { id: "31", name: "100MB", type: "Corporate", validity: "1 Day", price: "₦99.00" },
    { id: "32", name: "6 GB", type: "Corporate", validity: "30 Days", price: "₦2970.00" },
    { id: "33", name: "10 GB", type: "Corporate", validity: "30 Days", price: "₦3960.00" },
    { id: "38", name: "200MB", type: "Corporate", validity: "2 Days", price: "₦198.00" },
    { id: "82", name: "18GB", type: "Corporate", validity: "30 Days", price: "₦5940.00" },
  ],
};

// Cable plans
export const CABLE_PLANS = {
  "1": [ // GOTV
    { id: "1", name: "Smallie", price: "₦1900.00" },
    { id: "2", name: "Jinja", price: "₦3900.00" },
    { id: "3", name: "Jolli", price: "₦5800.00" },
    { id: "4", name: "Max", price: "₦8150.00" },
    { id: "5", name: "Supa", price: "₦11400.00" },
    
  ],
  "2": [ // DSTV
    { id: "6", name: "Padi", price: "₦44000.00" },
    { id: "7", name: "Yanga", price: "₦6000.00" },
    { id: "8", name: "Confam", price: "₦11000.00" },
    { id: "9", name: "Compact", price: "₦19000.00" },
    { id: "10", name: "Compact Plus", price: "₦30000.00" },
    { id: "11", name: "Premium", price: "₦44500.00" },
  ],
  "3": [ // STARTIMES
    { id: "13", name: "Nova (Dish)", price: "₦2100.00" },
    { id: "14", name: "Basic (Antenna)", price: "₦4000.00" },
    { id: "15", name: "Basic (Dish)", price: "₦5100.00" },
    { id: "16", name: "Classic (Antenna)", price: "₦6000.00" },
    { id: "17", name: "Super (Dish)", price: "₦9800.00" },
  ],
  "4": [ // SHOWMAX
    { id: "115", name: "Full Subscription", price: "₦3500.00" },
    { id: "116", name: "Mobile Only", price: "₦1600.00" },
    { id: "117", name: "Full Sports Mobile", price: "₦5400.00" },
  ],
};