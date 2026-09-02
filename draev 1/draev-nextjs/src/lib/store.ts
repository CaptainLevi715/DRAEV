import { randomBytes } from "crypto";
import { getStore } from "@netlify/blobs";
import { INITIAL_PRODUCTS } from "./data";
import type { Order, Product } from "./types";

// All persistent data (products, orders, uploaded images) lives in Netlify
// Blobs — a simple key/value store that comes free with Netlify hosting.
// No extra account, no API key: Netlify injects the credentials this needs
// automatically at deploy time. Locally, it only works when run via
// `netlify dev` (not plain `next dev`) — see README.

function productsStore() {
  return getStore({ name: "draev-products", consistency: "strong" });
}

function ordersStore() {
  return getStore({ name: "draev-orders", consistency: "strong" });
}

function imagesStore() {
  return getStore({ name: "draev-images", consistency: "strong" });
}

const SEEDED_KEY = "__seeded__";

// The very first time the store is touched in a fresh deploy, it's empty.
// Seed it once from the original hardcoded product list so the storefront
// isn't blank on first launch. Uses `onlyIfNew` so two concurrent cold
// starts racing to seed at once can't double-seed or clobber each other.
async function ensureSeeded() {
  const store = productsStore();
  const alreadySeeded = await store.get(SEEDED_KEY);
  if (alreadySeeded) return;

  const claimed = await store.set(SEEDED_KEY, "1", { onlyIfNew: true });
  if (!claimed.modified) return; // another instance is seeding (or just did)

  for (const product of INITIAL_PRODUCTS) {
    await store.setJSON(product.id, product, { onlyIfNew: true });
  }
}

export async function listProducts(): Promise<Product[]> {
  await ensureSeeded();
  const store = productsStore();
  const { blobs } = await store.list();
  const products: Product[] = [];
  for (const { key } of blobs) {
    if (key === SEEDED_KEY) continue;
    const p = await store.get(key, { type: "json" });
    if (p) products.push(p as Product);
  }
  // Newest-added first isn't tracked separately; keep stable id order.
  return products.sort((a, b) => a.id.localeCompare(b.id));
}

export async function getProduct(id: string): Promise<Product | null> {
  const store = productsStore();
  const p = await store.get(id, { type: "json" });
  return (p as Product) ?? null;
}

export async function saveProduct(product: Product): Promise<void> {
  await productsStore().setJSON(product.id, product);
}

export async function deleteProduct(id: string): Promise<void> {
  await productsStore().delete(id);
}

// ---------------------------------------------------------------------------
// Atomic inventory reservation
// ---------------------------------------------------------------------------
// Every product is a hand-painted 1-of-1 piece: once `sold` is true, that
// exact item can never be sold again. Two customers can submit an order for
// the same product within milliseconds of each other, so "read sold, then
// later write sold" (the previous implementation) is a real race — both
// requests can pass the read check before either has written. This uses the
// blob store's compare-and-swap primitive (`onlyIfMatch` against the
// current ETag) so the write to flip `sold` only succeeds for whichever
// request gets there first; the loser sees `modified: false` and is told
// the item is no longer available instead of silently overselling it.
export type ReserveResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "already_sold" };

export async function reserveProductForOrder(productId: string): Promise<ReserveResult> {
  const store = productsStore();

  // A handful of retries covers the case where a *different* concurrent
  // write (e.g. an admin edit) changed the ETag between our read and our
  // write, without the product actually being sold — in that case we just
  // need to re-read the current state and try again.
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await store.getWithMetadata(productId, { type: "json" });
    if (!current) return { ok: false, reason: "not_found" };

    const product = current.data as Product;
    if (product.sold) return { ok: false, reason: "already_sold" };

    const result = await store.setJSON(
      productId,
      { ...product, sold: true },
      { onlyIfMatch: current.etag }
    );
    if (result.modified) return { ok: true };
    // Someone else wrote to this key between our read and our write —
    // loop and re-check whether *they* sold it or just touched it.
  }

  return { ok: false, reason: "already_sold" };
}

// Used when an order that held a reservation fails to save, or when an
// admin/customer cancels an order — gives the 1-of-1 piece back to the
// public catalog. Best-effort: if the product was deleted in the meantime
// there's nothing to release.
export async function releaseProductReservation(productId: string): Promise<void> {
  const store = productsStore();
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await store.getWithMetadata(productId, { type: "json" });
    if (!current) return;
    const product = current.data as Product;
    if (!product.sold) return;
    const result = await store.setJSON(
      productId,
      { ...product, sold: false },
      { onlyIfMatch: current.etag }
    );
    if (result.modified) return;
  }
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function listOrders(): Promise<Order[]> {
  const store = ordersStore();
  const { blobs } = await store.list();
  const orders: Order[] = [];
  for (const { key } of blobs) {
    const o = await store.get(key, { type: "json" });
    if (o) orders.push(o as Order);
  }
  // Newest first.
  return orders.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const store = ordersStore();
  const o = await store.get(orderId, { type: "json" });
  return (o as Order) ?? null;
}

// `onlyIfNew` means a generated id that happens to collide with an existing
// order (astronomically unlikely with generateOrderId's randomness, but
// free to guard against) fails loudly instead of silently overwriting a
// real customer's order.
export async function createOrder(order: Order): Promise<boolean> {
  const result = await ordersStore().setJSON(order.orderId, order, { onlyIfNew: true });
  return result.modified;
}

export async function saveOrder(order: Order): Promise<void> {
  await ordersStore().setJSON(order.orderId, order);
}

// A short, still-effectively-unique, human-typeable order number — much
// stronger than the previous 4-digit random suffix (only 9,000 possible
// values, so collisions and guessability were both real problems for
// something used as a lookup/reference key).
export function generateOrderId(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(4).toString("hex").toUpperCase();
  return `DRAEV-${stamp}-${random}`;
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

export async function saveImage(
  id: string,
  data: ArrayBuffer,
  contentType: string
): Promise<void> {
  await imagesStore().set(id, data, { metadata: { contentType } });
}

export async function getImage(
  id: string
): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const store = imagesStore();
  const result = await store.getWithMetadata(id, { type: "arrayBuffer" });
  if (!result) return null;
  const contentType =
    (result.metadata?.contentType as string) || "application/octet-stream";
  return { data: result.data, contentType };
}
