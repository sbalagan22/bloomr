import { NextResponse } from "next/server";
import { checkSeedLimit } from "@/lib/plan";

export async function GET() {
  const result = await checkSeedLimit();
  return NextResponse.json(result);
}
