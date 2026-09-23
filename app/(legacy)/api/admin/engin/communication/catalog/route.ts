import { NextResponse } from "next/server";

import { loadCommunicationCatalog } from "@/lib/engin/communication/load-catalog";

export async function GET() {
  return NextResponse.json(loadCommunicationCatalog());
}
