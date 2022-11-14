export interface CreateCheckoutSessionInput {
  successUrl: string;
  cancelUrl: string;
  title: string;
  description: string;
  image?: string;
  price?: number;
  paymentId: number;
}

// args
export { CreateStripeCheckoutInput } from "./args/CreateStripeCheckoutInput";

// responses
export { StripeResponse } from "./responses/StripeResponse";
