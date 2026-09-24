import {
  ComptableDeliveryVerticalReservationPage,
  generateVerticalReservationMetadata,
} from "@/app/reservation/_lib/comptable-delivery-vertical-page"

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(props: PageProps) {
  return generateVerticalReservationMetadata("restaurant", props.params)
}

export default function RestaurantReservationPage(props: PageProps) {
  return (
    <ComptableDeliveryVerticalReservationPage
      params={props.params}
      routeSegment="restaurant"
    />
  )
}
