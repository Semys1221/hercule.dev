import { NextResponse } from "next/server";

const DEPRECATED_MESSAGE =
  "Cette API publique est dépréciée. La qualification pipeline se fait via la session commerciale Hercule.";

export async function GET() {
  return NextResponse.json({ error: DEPRECATED_MESSAGE }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: DEPRECATED_MESSAGE }, { status: 410 });
}
