"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatRs } from "@/lib/format";
import { CloseIcon } from "@/components/icons";
import type { Order, OrderStatus, Product } from "@/lib/types";

const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null); // null = checking
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((d) => setLoggedIn(!!d.loggedIn))
      .catch(() => setLoggedIn(false))
      .finally(() => setCheckingSession(false));
  }, []);

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-bgDeep text-cream flex items-center justify-center">
        <p className="text-cream/60 text-sm">Loading…</p>
      </div>
    );
  }

  if (!loggedIn) {
    return <LoginScreen onLoggedIn={() => setLoggedIn(true)} />;
  }

  return <Dashboard onLoggedOut={() => setLoggedIn(false)} />;
}

function LoginScreen({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Wrong password");
        return;
      }
      onLoggedIn();
    } catch {
      setError("Couldn't reach the server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bgDeep text-cream flex items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm border border-line bg-panel p-8"
      >
        <p className="text-xs uppercase tracking-widest text-cream/60 mb-1">
          Draev
        </p>
        <h1 className="font-display text-2xl uppercase mb-6">Admin Login</h1>
        <input
          type="password"
          required
          autoFocus
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-panel2 border border-line px-3 py-2.5 text-sm focus:outline-none focus:border-cream text-cream placeholder:text-cream/50 mb-4"
        />
        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn-solid w-full transition-colors disabled:opacity-60"
        >
          {loading ? "Checking…" : "Log in"}
        </button>
        <Link
          href="/"
          className="block text-center text-xs text-cream/50 mt-5 hover:text-cream"
        >
          ← Back to storefront
        </Link>
      </form>
    </div>
  );
}

function Dashboard({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [tab, setTab] = useState<"orders" | "products">("orders");

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    onLoggedOut();
  }

  return (
    <div className="min-h-screen bg-bgDeep text-cream font-body">
      <header className="border-b border-line px-6 py-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-cream/60">Draev</p>
          <h1 className="font-display text-2xl uppercase leading-tight">
            Admin Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="btn-outline text-sm px-4 py-2 transition-colors">
            ← Storefront
          </Link>
          <button
            onClick={handleLogout}
            className="btn-outline text-sm px-4 py-2 transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="border-b border-line px-6 flex gap-6">
        <button
          onClick={() => setTab("orders")}
          className={`py-3 text-sm font-bold uppercase border-b-2 transition-colors ${
            tab === "orders" ? "border-cream text-cream" : "border-transparent text-cream/50"
          }`}
        >
          Orders
        </button>
        <button
          onClick={() => setTab("products")}
          className={`py-3 text-sm font-bold uppercase border-b-2 transition-colors ${
            tab === "products" ? "border-cream text-cream" : "border-transparent text-cream/50"
          }`}
        >
          Products
        </button>
      </div>

      <main className="px-6 py-8 max-w-6xl mx-auto">
        {tab === "orders" ? <OrdersTab /> : <ProductsTab />}
      </main>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't load orders");
        return;
      }
      setOrders(data.orders);
    } catch {
      setError("Couldn't reach the server");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(orderId: string, status: OrderStatus) {
    const previousStatus = orders?.find((o) => o.orderId === orderId)?.status;
    setOrders((prev) =>
      prev ? prev.map((o) => (o.orderId === orderId ? { ...o, status } : o)) : prev
    );
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        // The server refused the change (e.g. re-reserving a cancelled
        // order's items failed because one sold in the meantime) — don't
        // leave the dropdown showing a status that was never actually
        // saved.
        setOrders((prev) =>
          prev
            ? prev.map((o) =>
                o.orderId === orderId ? { ...o, status: previousStatus ?? o.status } : o
              )
            : prev
        );
        alert(data.error || "Couldn't update order status");
        return;
      }
      setOrders((prev) =>
        prev ? prev.map((o) => (o.orderId === orderId ? data.order : o)) : prev
      );
    } catch {
      setOrders((prev) =>
        prev
          ? prev.map((o) =>
              o.orderId === orderId ? { ...o, status: previousStatus ?? o.status } : o
            )
          : prev
      );
      alert("Couldn't reach the server — status not updated");
    }
  }

  if (error) return <p className="text-red-400 text-sm">{error}</p>;
  if (!orders) return <p className="text-cream/60 text-sm">Loading orders…</p>;
  if (orders.length === 0)
    return <p className="text-cream/60 text-sm">No orders yet.</p>;

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.orderId} className="border border-line bg-panel p-5">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
            <div>
              <p className="font-bold">{order.orderId}</p>
              <p className="text-cream/60 text-xs">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <select
              value={order.status}
              onChange={(e) => updateStatus(order.orderId, e.target.value as OrderStatus)}
              className="bg-panel2 border border-line px-3 py-1.5 text-sm text-cream"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-cream/80 mb-3">
            <p>
              <span className="text-cream/50">Name:</span> {order.name}
            </p>
            <p>
              <span className="text-cream/50">Phone:</span> {order.phone}
            </p>
            <p className="sm:col-span-2">
              <span className="text-cream/50">Address:</span> {order.address}
            </p>
            {order.email && (
              <p className="sm:col-span-2">
                <span className="text-cream/50">Email:</span> {order.email}
              </p>
            )}
          </div>

          <div className="border-t border-line pt-3 space-y-1">
            {order.items.map((item, i) => (
              <p key={i} className="text-sm text-cream/80">
                {item.name} ({item.colorway}) — Size {item.size} x{item.qty} —{" "}
                {formatRs(item.lineTotal)}
              </p>
            ))}
          </div>
          <p className="text-right font-bold mt-2">
            Total (COD): {formatRs(order.subtotal)}
          </p>
        </div>
      ))}
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.products);
    } catch {
      setError("Couldn't reach the server");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleSold(product: Product) {
    setProducts((prev) =>
      prev
        ? prev.map((p) => (p.id === product.id ? { ...p, sold: !p.sold } : p))
        : prev
    );
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sold: !product.sold }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Revert — the toggle shown in the grid should never claim a
        // sold/available state the server didn't actually save.
        setProducts((prev) =>
          prev ? prev.map((p) => (p.id === product.id ? product : p)) : prev
        );
        alert(data.error || "Couldn't update product");
        return;
      }
      setProducts((prev) =>
        prev ? prev.map((p) => (p.id === product.id ? data.product : p)) : prev
      );
    } catch {
      setProducts((prev) =>
        prev ? prev.map((p) => (p.id === product.id ? product : p)) : prev
      );
      alert("Couldn't reach the server — product not updated");
    }
  }

  async function removeProduct(product: Product) {
    if (!confirm(`Delete "${product.name}"? This can't be undone.`)) return;
    setProducts((prev) => (prev ? prev.filter((p) => p.id !== product.id) : prev));
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      if (!res.ok) {
        // Deletion failed server-side — put it back rather than leaving
        // the admin believing a product is gone when it still exists.
        setProducts((prev) => (prev ? [...prev, product] : [product]));
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Couldn't delete product");
      }
    } catch {
      setProducts((prev) => (prev ? [...prev, product] : [product]));
      alert("Couldn't reach the server — product not deleted");
    }
  }

  if (error) return <p className="text-red-400 text-sm">{error}</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-cream/70 text-sm">
          Click a product to preview it, mark it sold out, or delete it.
        </p>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-solid text-sm px-4 py-2 transition-colors"
        >
          + Add product
        </button>
      </div>

      {!products ? (
        <p className="text-cream/60 text-sm">Loading products…</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((product) => (
            <div key={product.id} className="paper-card text-left group">
              <button
                onClick={() => setPreviewProduct(product)}
                className="zoom-wrap relative w-full cursor-pointer"
              >
                <span className="absolute top-3 left-3 z-10 bg-cream text-bg text-xs font-bold px-2.5 py-1 uppercase">
                  {product.sold ? "Sold Out" : product.badge}
                </span>
                <Image
                  src={product.img}
                  alt={product.name}
                  width={600}
                  height={420}
                  className="w-full h-[280px] object-cover"
                />
              </button>
              <div className="p-4">
                <p className="font-bold text-base">{product.name}</p>
                <p className="text-cream/70 text-sm mt-0.5">{product.colorway}</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="font-extrabold">{formatRs(product.price)}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="btn-outline text-xs px-3 py-1.5 flex-1 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleSold(product)}
                    className="btn-outline text-xs px-3 py-1.5 flex-1 transition-colors"
                  >
                    {product.sold ? "Mark available" : "Mark sold out"}
                  </button>
                  <button
                    onClick={() => removeProduct(product)}
                    className="btn-outline text-xs px-3 py-1.5 transition-colors border-red-400/40 text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewProduct && (
        <ProductPreview
          product={previewProduct}
          onClose={() => setPreviewProduct(null)}
        />
      )}

      {showAddForm && (
        <AddProductForm
          onClose={() => setShowAddForm(false)}
          onAdded={(p) => {
            setProducts((prev) => (prev ? [...prev, p] : [p]));
            setShowAddForm(false);
          }}
        />
      )}

      {editingProduct && (
        <EditProductForm
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={(p) => {
            setProducts((prev) =>
              prev ? prev.map((item) => (item.id === p.id ? p : item)) : prev
            );
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

function ProductPreview({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative max-w-3xl mx-auto mt-10 md:mt-16 mb-10 bg-panel border border-line grid md:grid-cols-2 max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center bg-black/50 hover:bg-black/70 transition-colors"
        >
          <CloseIcon />
        </button>
        <div className="zoom-wrap bg-black/20">
          <Image
            src={product.img}
            alt={product.name}
            width={700}
            height={700}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6 md:p-8">
          <span className="inline-block bg-cream text-bg text-xs font-bold px-2.5 py-1 uppercase mb-3">
            {product.sold ? "Sold Out" : product.badge}
          </span>
          <h3 className="font-display text-3xl uppercase leading-tight">
            {product.name}
          </h3>
          <p className="text-cream/70 text-sm mt-1">{product.colorway}</p>
          <div className="flex items-baseline gap-3 mt-3">
            <span className="text-2xl font-extrabold">{formatRs(product.price)}</span>
          </div>
          <p className="text-cream/80 text-sm mt-4 leading-relaxed">{product.desc}</p>
        </div>
      </div>
    </div>
  );
}

function AddProductForm({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (p: Product) => void;
}) {
  const [name, setName] = useState("");
  const [colorway, setColorway] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [badge, setBadge] = useState("Hand-Painted");
  const [desc, setDesc] = useState("");
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      setImgUrl(data.url);
    } catch {
      setError("Upload failed — check your connection");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imgUrl) {
      setError("Add a photo first");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          colorway,
          img: imgUrl,
          price: Number(price),
          oldPrice: Number(oldPrice) || Number(price),
          badge,
          desc,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't add product");
        return;
      }
      onAdded(data.product);
    } catch {
      setError("Couldn't reach the server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative max-w-lg mx-auto mt-10 mb-10 bg-panel border border-line max-h-[88vh] overflow-y-auto p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-2xl uppercase">Add Product</h3>
          <button type="button" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-cream/60 mb-1">Photo</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {uploading && <p className="text-xs text-cream/60 mt-1">Uploading…</p>}
            {imgUrl && (
              <Image
                src={imgUrl}
                alt="Preview"
                width={200}
                height={200}
                className="mt-2 w-32 h-32 object-cover border border-line"
              />
            )}
          </div>

          <input
            required
            placeholder="Product name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-panel2 border border-line px-3 py-2.5 text-sm text-cream placeholder:text-cream/50"
          />
          <input
            required
            placeholder="Colorway (e.g. Off-White)"
            value={colorway}
            onChange={(e) => setColorway(e.target.value)}
            className="w-full bg-panel2 border border-line px-3 py-2.5 text-sm text-cream placeholder:text-cream/50"
          />
          <div className="flex gap-3">
            <input
              required
              type="number"
              placeholder="Price (Rs)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-1/2 bg-panel2 border border-line px-3 py-2.5 text-sm text-cream placeholder:text-cream/50"
            />
            <input
              type="number"
              placeholder="Old price (optional)"
              value={oldPrice}
              onChange={(e) => setOldPrice(e.target.value)}
              className="w-1/2 bg-panel2 border border-line px-3 py-2.5 text-sm text-cream placeholder:text-cream/50"
            />
          </div>
          <input
            placeholder="Badge (e.g. 1 of 1, Hand-Painted)"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            className="w-full bg-panel2 border border-line px-3 py-2.5 text-sm text-cream placeholder:text-cream/50"
          />
          <textarea
            placeholder="Description"
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full bg-panel2 border border-line px-3 py-2.5 text-sm text-cream placeholder:text-cream/50"
          />
        </div>

        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

        <button
          type="submit"
          disabled={saving || uploading}
          className="btn-solid w-full mt-5 transition-colors disabled:opacity-60"
        >
          {saving ? "Adding…" : "Add product"}
        </button>
      </form>
    </div>
  );
}

function EditProductForm({
  product,
  onClose,
  onSaved,
}: {
  product: Product;
  onClose: () => void;
  onSaved: (p: Product) => void;
}) {
  const [name, setName] = useState(product.name);
  const [colorway, setColorway] = useState(product.colorway);
  const [price, setPrice] = useState(String(product.price));
  const [badge, setBadge] = useState(product.badge);
  const [desc, setDesc] = useState(product.desc);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          colorway,
          price: Number(price),
          oldPrice: Number(price),
          badge,
          desc,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't save changes");
        return;
      }
      onSaved(data.product);
    } catch {
      setError("Couldn't reach the server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative max-w-lg mx-auto mt-10 mb-10 bg-panel border border-line max-h-[88vh] overflow-y-auto p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-2xl uppercase">Edit Product</h3>
          <button type="button" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            required
            placeholder="Product name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-panel2 border border-line px-3 py-2.5 text-sm text-cream placeholder:text-cream/50"
          />
          <input
            required
            placeholder="Colorway (e.g. Off-White)"
            value={colorway}
            onChange={(e) => setColorway(e.target.value)}
            className="w-full bg-panel2 border border-line px-3 py-2.5 text-sm text-cream placeholder:text-cream/50"
          />
          <input
            required
            type="number"
            placeholder="Price (Rs)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full bg-panel2 border border-line px-3 py-2.5 text-sm text-cream placeholder:text-cream/50"
          />
          <input
            placeholder="Badge (e.g. 1 of 1, Hand-Painted)"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            className="w-full bg-panel2 border border-line px-3 py-2.5 text-sm text-cream placeholder:text-cream/50"
          />
          <textarea
            placeholder="Description"
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full bg-panel2 border border-line px-3 py-2.5 text-sm text-cream placeholder:text-cream/50"
          />
        </div>

        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="btn-solid w-full mt-5 transition-colors disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
