import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_fallback';

export const initializePayment = async (email: string, amount: number, reference: string, callbackUrl: string) => {
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, amount, reference, callback_url: callbackUrl })
  });

  return response.json();
};

export const verifyPaystackSignature = (signature: string | null, payload: string) => {
  if (!signature) return false;
  
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(payload)
    .digest('hex');
    
  return hash === signature;
};
