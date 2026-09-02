import { z } from "zod";
import { SIZES } from "./data";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

// Product ids are generated server-side as `draev-<base36 timestamp>` (see
// products/route.ts) or come from the original seed list (`draev-white-001`
// etc) — always lowercase alphanumeric plus hyphens.
const productIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9-]+$/, "Invalid product id");

const orderIdSchema = z.string().trim().min(1).max(60);

// Generous but bounded — long enough for real names/addresses, short enough
// that nobody can stuff megabytes of text into a single order field.
const nameSchema = z
  .string()
  .trim()
  .max(100, "Name is too long");

// No format checks — any string is accepted (still bounded in length to
// keep the field sane in the admin panel and database).
const phoneSchema = z
  .string()
  .trim()
  .max(20, "Phone number is too long");

const addressSchema = z
  .string()
  .trim()
  .max(500, "Address is too long");

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address")
  .max(254)
  .optional()
  .or(z.literal("").transform(() => undefined));

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

const cartLineSchema = z.object({
  id: productIdSchema,
  // The storefront only ever offers these four sizes (see lib/data.ts) even
  // though two are currently marked unavailable for stock reasons — that's
  // a merchandising choice, not a separate schema, so it isn't enforced
  // here. What *is* enforced is that this can't be arbitrary attacker text.
  size: z.enum(SIZES, { errorMap: () => ({ message: "Invalid size" }) }),
  // Every product is a hand-painted 1-of-1 piece — there is physically only
  // ever one unit of it. The quantity field only exists because the
  // storefront's quick-view lets someone click a stepper up to 10; the
  // order route normalizes this back down to 1 per line rather than
  // rejecting the order outright (see orders/route.ts).
  qty: z.number().int().min(1).max(10),
});

export const orderSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  address: addressSchema,
  email: emailSchema,
  cart: z
    .array(cartLineSchema)
    .min(1, "Your cart is empty")
    .max(20, "Too many items in one order"),
});

export const orderStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]),
});

// ---------------------------------------------------------------------------
// Products (admin)
// ---------------------------------------------------------------------------

// Uploaded images are always served from this API, and any product image
// referenced in the storefront should be one of those — never an arbitrary
// external URL (which next/image would refuse to render anyway without an
// explicit remotePatterns allow-list, and which could otherwise be used to
// point the storefront at attacker-controlled content).
const imagePathSchema = z
  .string()
  .trim()
  .min(1)
  .max(300)
  .regex(
    /^\/(images|api\/images)\/[A-Za-z0-9._\-/]+$/,
    "Image must be an uploaded file or a path under /images"
  );

const priceSchema = z
  .number()
  .finite()
  .positive("Price must be greater than 0")
  .max(10_000_000, "Price is unrealistically high");

export const productCreateSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(120),
  colorway: z.string().trim().min(1, "Colorway is required").max(60),
  img: imagePathSchema,
  imgBack: imagePathSchema.optional().or(z.literal("").transform(() => undefined)),
  price: priceSchema,
  oldPrice: priceSchema.optional(),
  badge: z.string().trim().max(40).optional().or(z.literal("").transform(() => undefined)),
  desc: z.string().trim().max(2000).optional().or(z.literal("").transform(() => undefined)),
});

// Admins can update any subset of these fields (the product-card "mark
// sold" toggle only ever sends `{ sold }`, the edit form could send more) —
// every field is optional, but whatever is present must be well-formed.
// `.strict()` rejects unknown keys outright instead of silently merging
// them into the stored product, which is what let arbitrary extra fields
// slip through before.
export const productUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    colorway: z.string().trim().min(1).max(60).optional(),
    img: imagePathSchema.optional(),
    imgBack: imagePathSchema.optional().or(z.literal("").transform(() => undefined)),
    price: priceSchema.optional(),
    oldPrice: priceSchema.optional(),
    badge: z.string().trim().max(40).optional(),
    desc: z.string().trim().max(2000).optional(),
    sold: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields to update",
  });

// ---------------------------------------------------------------------------
// Admin auth
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  password: z.string().min(1, "Password is required").max(200),
});

export { productIdSchema, orderIdSchema };
