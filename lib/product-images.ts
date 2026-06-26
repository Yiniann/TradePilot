import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const uploadDir = join(process.cwd(), "public", "uploads", "products");

export async function saveProductImage(file: File) {
  if (!file || file.size === 0) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    return null;
  }

  await mkdir(uploadDir, { recursive: true });

  const extension = extname(file.name).toLowerCase() || ".jpg";
  const filename = `${Date.now()}-${crypto.randomUUID()}${extension}`;
  const filePath = join(uploadDir, filename);
  const bytes = await file.arrayBuffer();

  await writeFile(filePath, Buffer.from(bytes));

  return `/uploads/products/${filename}`;
}
