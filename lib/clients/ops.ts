export const HERCULE_OPS_EMAIL =
  process.env.HERCULE_OPS_EMAIL?.trim() || "contact@hercule.dev";

export function isCheckoutPlaceholderEmail(email: string): boolean {
  return email.includes("@checkout.hercule.dev");
}
