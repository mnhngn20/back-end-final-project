import Stripe from "stripe";

export class StripeService {
  readonly stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2022-08-01",
      typescript: true,
    });
  }

  async authorizeCode(code: string) {
    const response = await this.stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });

    return response.stripe_user_id;
  }
}
