"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  INITIAL_PRODUCTS,
  SHOP_EMAIL,
  WHATSAPP_NUMBER,
} from "@/lib/data";
import type { CartItem, Order, Product } from "@/lib/types";

interface CheckoutDetails {
  name: string;
  phone: string;
  address: string;
  email?: string;
}

interface StoreContextValue {
  // Product / inventory
  products: Product[];

  // Cart
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  addToCart: (id: string, size: string, qty?: number) => void;
  removeFromCart: (index: number) => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;

  // Wishlist
  wishlist: Set<string>;
  toggleWishlist: (id: string) => void;

  // Quick view
  quickViewProduct: Product | null;
  quickViewSize: string | null;
  quickViewQty: number;
  openQuickView: (id: string) => void;
  closeQuickView: () => void;
  selectQuickViewSize: (size: string) => void;
  incrementQuickViewQty: () => void;
  decrementQuickViewQty: () => void;
  confirmAddFromQuickView: () => void;

  // Checkout
  isCheckoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
  submitCheckout: (details: CheckoutDetails) => Promise<boolean>;
  isSubmittingOrder: boolean;

  // Order confirmation
  lastOrder: Order | null;
  isConfirmOpen: boolean;
  closeConfirm: () => void;
  buildOrderMessage: (order: Order) => string;
  sendChannels: { whatsapp: boolean; email: boolean; instagram: boolean };
  setSendChannels: React.Dispatch<
    React.SetStateAction<{ whatsapp: boolean; email: boolean; instagram: boolean }>
  >;

  // Info modal (size guide / shipping)
  infoModalKey: "sizeGuide" | "shipping" | null;
  openInfoModal: (key: "sizeGuide" | "shipping") => void;
  closeInfoModal: () => void;

  // Custom order channel modal
  isCustomModalOpen: boolean;
  openCustomModal: () => void;
  closeCustomModal: () => void;

  // Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Seeded with the original list so the page isn't blank while the real
  // data loads, then immediately replaced with what's actually in the
  // database (Netlify Blobs) via /api/products.
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.products)) setProducts(data.products);
      })
      .catch(() => {
        // Keep the seeded fallback list if the API call fails for any
        // reason (e.g. running `next dev` instead of `netlify dev`).
      });
  }, []);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [isCartOpen, setCartOpen] = useState(false);

  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const [quickViewSize, setQuickViewSize] = useState<string | null>(null);
  const [quickViewQty, setQuickViewQty] = useState<number>(1);

  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [sendChannels, setSendChannels] = useState({
    whatsapp: true,
    email: true,
    instagram: true,
  });

  const [infoModalKey, setInfoModalKey] = useState<"sizeGuide" | "shipping" | null>(
    null
  );
  const [isCustomModalOpen, setCustomModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lock background scroll while any overlay is open. Without this, touch
  // scrolling on Android drags the page behind a modal/drawer along with
  // it, which feels broken — the overlay looks open but the page under it
  // is still scrolling.
  const isAnyOverlayOpen =
    isCartOpen ||
    !!quickViewId ||
    isCheckoutOpen ||
    isConfirmOpen ||
    !!infoModalKey ||
    isCustomModalOpen;

  useEffect(() => {
    if (!isAnyOverlayOpen) return;
    const { overflow, touchAction } = document.body.style;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.touchAction = touchAction;
    };
  }, [isAnyOverlayOpen]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 1800);
  }, []);

  const quickViewProduct = useMemo(
    () => products.find((p) => p.id === quickViewId) ?? null,
    [products, quickViewId]
  );

  const openQuickView = useCallback((id: string) => {
    setQuickViewId(id);
    setQuickViewSize(null);
    setQuickViewQty(1);
  }, []);
  const closeQuickView = useCallback(() => {
    setQuickViewId(null);
    setQuickViewSize(null);
    setQuickViewQty(1);
  }, []);
  const selectQuickViewSize = useCallback((size: string) => {
    setQuickViewSize(size);
  }, []);
  const incrementQuickViewQty = useCallback(() => {
    setQuickViewQty((q) => Math.min(q + 1, 10));
  }, []);
  const decrementQuickViewQty = useCallback(() => {
    setQuickViewQty((q) => Math.max(q - 1, 1));
  }, []);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const addToCart = useCallback(
    (id: string, size: string, qty: number = 1) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.id === id && i.size === size);
        if (existing) {
          return prev.map((i) =>
            i.id === id && i.size === size ? { ...i, qty: i.qty + qty } : i
          );
        }
        return [...prev, { id, size, qty }];
      });
      showToast(qty > 1 ? `Added ${qty} to cart` : "Added to cart");
    },
    [showToast]
  );

  const removeFromCart = useCallback((index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const confirmAddFromQuickView = useCallback(() => {
    if (!quickViewProduct) return;
    if (!quickViewSize) {
      showToast("Pick a size first");
      return;
    }
    addToCart(quickViewProduct.id, quickViewSize, quickViewQty);
    closeQuickView();
    openCart();
  }, [
    quickViewProduct,
    quickViewSize,
    quickViewQty,
    addToCart,
    closeQuickView,
    openCart,
    showToast,
  ]);

  const toggleWishlist = useCallback(
    (id: string) => {
      setWishlist((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
          showToast("Removed from wishlist");
        } else {
          next.add(id);
          showToast("Added to wishlist");
        }
        return next;
      });
    },
    [showToast]
  );

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);
  const cartSubtotal = useMemo(
    () =>
      cart.reduce((s, item) => {
        const p = products.find((pp) => pp.id === item.id);
        return s + (p ? p.price * item.qty : 0);
      }, 0),
    [cart, products]
  );

  const openCheckout = useCallback(() => {
    if (cart.length === 0) {
      showToast("Your cart is empty");
      return;
    }
    closeCart();
    setCheckoutOpen(true);
  }, [cart, closeCart, showToast]);
  const closeCheckout = useCallback(() => setCheckoutOpen(false), []);

  const buildOrderMessage = useCallback((order: Order) => {
    const lines = [
      `New Draev order ${order.orderId}`,
      `Name: ${order.name}`,
      `Phone: ${order.phone}`,
      `Address: ${order.address}`,
      `Payment: Cash on Delivery`,
      "",
    ];
    order.items.forEach((i) =>
      lines.push(
        `- ${i.name} (${i.colorway}) - Size ${i.size} x${i.qty} - Rs ${i.lineTotal.toLocaleString()}`
      )
    );
    lines.push(`Total: Rs ${order.subtotal.toLocaleString()}`);
    return lines.join("\n");
  }, []);

  // The order is now created for real on the server: it's written to the
  // database and it shows up in /admin. This can fail (network, server
  // down), so it's async and reports success/failure instead of always
  // returning true.
  const submitCheckout = useCallback(
    async (details: CheckoutDetails) => {
      setIsSubmittingOrder(true);
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: details.name,
            phone: details.phone,
            address: details.address,
            email: details.email,
            cart,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error || "Couldn't place order — try again");
          return false;
        }

        setLastOrder(data.order);
        setCart([]);
        setCheckoutOpen(false);
        setConfirmOpen(true);
        // Refresh products in case anything changed (e.g. an admin
        // marked something sold out) while this visitor was checking out.
        fetch("/api/products")
          .then((r) => r.json())
          .then((d) => {
            if (Array.isArray(d.products)) setProducts(d.products);
          })
          .catch(() => {});
        return true;
      } catch {
        showToast("Couldn't reach the server — check your connection");
        return false;
      } finally {
        setIsSubmittingOrder(false);
      }
    },
    [cart, showToast]
  );

  const closeConfirm = useCallback(() => setConfirmOpen(false), []);

  const openInfoModal = useCallback((key: "sizeGuide" | "shipping") => {
    setInfoModalKey(key);
  }, []);
  const closeInfoModal = useCallback(() => setInfoModalKey(null), []);

  const openCustomModal = useCallback(() => setCustomModalOpen(true), []);
  const closeCustomModal = useCallback(() => setCustomModalOpen(false), []);

  const value: StoreContextValue = {
    products,
    cart,
    cartCount,
    cartSubtotal,
    addToCart,
    removeFromCart,
    isCartOpen,
    openCart,
    closeCart,
    wishlist,
    toggleWishlist,
    quickViewProduct,
    quickViewSize,
    quickViewQty,
    openQuickView,
    closeQuickView,
    selectQuickViewSize,
    incrementQuickViewQty,
    decrementQuickViewQty,
    confirmAddFromQuickView,
    isCheckoutOpen,
    openCheckout,
    closeCheckout,
    submitCheckout,
    isSubmittingOrder,
    lastOrder,
    isConfirmOpen,
    closeConfirm,
    buildOrderMessage,
    sendChannels,
    setSendChannels,
    infoModalKey,
    openInfoModal,
    closeInfoModal,
    isCustomModalOpen,
    openCustomModal,
    closeCustomModal,
    toastMessage,
    showToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}

export { WHATSAPP_NUMBER, SHOP_EMAIL };
