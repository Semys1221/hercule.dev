/**
 * @deprecated Import from `comptable-delivery-verticals` instead.
 */
export {
  DEC_OPS_NICHE_ALIAS,
  COMPTABLE_DELIVERY_VERTICALS as JUM_VERTICALS,
  type ComptableDeliveryVertical as JumVertical,
  type ComptableDeliveryVerticalKey as JumVerticalKey,
  type ComptableDeliverySegment as JumSegment,
  getComptableDeliveryVertical as getJumVertical,
  resolveComptableDeliveryVerticalByListId as resolveJumVerticalByListId,
  resolveComptableDeliveryVerticalByCampaignId as resolveJumVerticalByCampaignId,
  resolveComptableDeliveryVertical as resolveJumVertical,
  defaultComptableDeliveryVertical as defaultJumVertical,
  calendlyUrlForComptableDeliverySegment as calendlyUrlForJumSegment,
} from "./comptable-delivery-verticals";
