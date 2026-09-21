const CHECKOUT_UNAVAILABLE_MESSAGE = "Paiement indisponible";

export function checkoutUnavailableMessage(): string {
  return CHECKOUT_UNAVAILABLE_MESSAGE;
}

export function checkoutErrorResponse(
  error: unknown,
  logPrefix: string,
): { body: { error: string }; status: number } {
  const message = error instanceof Error ? error.message : "Checkout creation failed";
  console.error(`[${logPrefix}]`, message);

  const clientMessage =
    process.env.NODE_ENV === "production" ? CHECKOUT_UNAVAILABLE_MESSAGE : message;

  return {
    body: { error: clientMessage },
    status: 500,
  };
}
