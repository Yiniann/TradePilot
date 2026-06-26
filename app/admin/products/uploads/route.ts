import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canManageProducts } from "@/lib/permissions";
import { saveProductImage } from "@/lib/product-images";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || !canManageProducts(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
  }

  const url = await saveProductImage(image);

  if (!url) {
    return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  }

  return NextResponse.json({ url });
}
