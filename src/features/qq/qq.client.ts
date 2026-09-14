import { API_BASE_URL } from "../../shared/config/api";
import type { QqProduct, QqProductStatus } from "./qq.types";

function buildUrl(path: string) {
  return `${API_BASE_URL}/api/v1${path}`;
}

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as Partial<T> & { message?: string | string[] };

  if (!response.ok) {
    const message = Array.isArray(data.message) ? data.message[0] : data.message;
    throw new Error(message || `HTTP ${response.status}`);
  }

  return data as T;
}

export async function listProducts(search?: string) {
  const query = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  const response = await fetch(buildUrl(`/qq/products${query}`));
  const data = await readJson<{ items: QqProduct[] }>(response);
  return data.items;
}

export async function createProduct(payload: {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  imageUrl?: string;
  category?: string;
  status?: QqProductStatus;
}) {
  const response = await fetch(buildUrl("/qq/products"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ item: QqProduct }>(response);
  return data.item;
}

export async function updateProduct(
  productId: number,
  payload: Partial<{
    name: string;
    description: string;
    price: number;
    currency: string;
    imageUrl: string;
    category: string;
    status: QqProductStatus;
  }>
) {
  const response = await fetch(buildUrl(`/qq/products/${productId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ item: QqProduct }>(response);
  return data.item;
}

export async function deleteProduct(productId: number) {
  const response = await fetch(buildUrl(`/qq/products/${productId}`), { method: "DELETE" });
  await readJson<{ ok: boolean }>(response);
}
