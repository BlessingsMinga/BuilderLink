export type PaymentProvider = 'paychangu' | 'airtel_money' | 'tnm_mpamba' | 'bank_transfer' | 'stripe';
export type PaymentRequest = { bookingId: string; amountMwk: number; provider: PaymentProvider; customerEmail: string };
export type PaymentResult = { reference: string; status: 'pending' | 'paid' | 'failed'; checkoutUrl?: string };
export interface PaymentGateway { createPayment(request: PaymentRequest): Promise<PaymentResult>; verifyPayment(reference: string): Promise<PaymentResult>; }
// The server-side PayChangu adapter will call the gateway using a secret key; client code never handles it.
export const paymentService: PaymentGateway = { async createPayment(request) { return { reference: `BL-${request.bookingId}-${Date.now()}`, status: 'pending' }; }, async verifyPayment(reference) { return { reference, status: 'pending' }; } };
