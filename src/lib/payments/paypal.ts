const paypalBaseUrl = process.env.PAYPAL_ENVIRONMENT === "production"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

function assertPayPalConfigured() {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal is not configured.");
  }
}

async function getAccessToken() {
  assertPayPalConfigured();
  const credentials = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const response = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) throw new Error("PayPal authentication failed.");
  const data = await response.json() as { access_token?: string };
  if (!data.access_token) throw new Error("PayPal did not return an access token.");
  return data.access_token;
}

export async function createPayPalOrder(amount: number, currency: string, returnUrl: string, cancelUrl: string) {
  const token = await getAccessToken();
  const response = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{ amount: { currency_code: currency, value: amount.toFixed(2) } }],
      application_context: { return_url: returnUrl, cancel_url: cancelUrl, user_action: "PAY_NOW" },
    }),
  });
  if (!response.ok) throw new Error("PayPal could not create the payment.");
  return response.json() as Promise<{ id: string; links?: { rel: string; href: string }[] }>;
}

export async function capturePayPalOrder(orderId: string) {
  const token = await getAccessToken();
  const response = await fetch(`${paypalBaseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error("PayPal could not verify the payment.");
  return response.json() as Promise<{ id: string; status: string; purchase_units?: { payments?: { captures?: { id: string; status: string }[] } }[] }>;
}