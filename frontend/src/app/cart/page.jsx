"use client";

import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Trash2, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { apiHelpers } from "@/lib/api";
import { useAuth } from "../context/AuthContext";

const formatCurrency = (value) => {
  if (typeof value !== "number") return "₹0";
  return value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  });
};

const getItemId = (item) => {
  if (!item) return null;
  const course = item.course;
  const product = item.product;
  if (course && typeof course === "object") {
    return course._id || course.id || course.courseId || null;
  }
  if (product && typeof product === "object") {
    return product._id || product.id || product.productId || null;
  }
  return item.courseId || item.productId || product || course || item._id || item.id || null;
};

const getItemType = (item) => {
  if (!item) return "course";
  if (item.product || item.productId) return "product";
  return "course";
};

const calculateTotal = (items) =>
  items.reduce((sum, item) => {
    const price =
      typeof item.price === "number"
        ? item.price
        : typeof item.course?.price === "number"
        ? item.course.price
        : 0;
    const quantity = item.quantity || 1;
    return sum + price * quantity;
  }, 0);

const CartItem = ({ item, onQuantityChange, onRemove }) => {
  const { course, product } = item;
  const itemType = getItemType(item);
  const quantity = item.quantity || 1;
  const itemId = getItemId(item);

  const title = product?.title || course?.title || item.title || "Untitled Item";
  const description =
    product?.description || course?.description || "Explore this curated learning resource.";
  const price =
    typeof item.price === "number"
      ? item.price
      : typeof product?.price === "number"
      ? product.price
      : typeof course?.price === "number"
      ? course.price
      : 0;

  const productImage = Array.isArray(product?.images) && product.images.length ? product.images[0] : null;
  const courseImage = course?.image || course?.imageUrl;
  const imageUrl =
    productImage ||
    (typeof product?.image === "string" ? product.image : null) ||
    courseImage ||
    item.image ||
    "/images/course-placeholder.jpg";

  const instructor = course?.instructor?.name || course?.instructor || "Expert Instructor";
  const brand = product?.brand || item.brand || "Premium Partner";

  const metaBadge =
    itemType === "course"
      ? { icon: ShieldCheck, text: "Lifetime access guaranteed" }
      : { icon: ShoppingCart, text: "Instant digital download" };

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="w-full sm:w-40 h-40 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white line-clamp-2">{title}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {itemType === "course" ? `By ${instructor}` : `Brand: ${brand}`}
            </p>
          </div>
          <div className="text-lg font-semibold text-orange-500">
            {formatCurrency(price)}
          </div>
        </div>

        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
          {description}
        </p>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-full text-sm">
            <metaBadge.icon className="w-4 h-4 text-green-500" />
            {metaBadge.text}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => onQuantityChange(itemId, itemType, Math.max(quantity - 1, 0))}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Decrease quantity"
              >
                −
              </button>
              <span className="px-4 py-1 text-gray-800 dark:text-gray-100 font-semibold">
                {quantity}
              </span>
              <button
                onClick={() => onQuantityChange(itemId, itemType, quantity + 1)}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Increase quantity"
              >
                +
              </button>
            </div>
            <button
              onClick={() => onRemove(itemId, itemType)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CartPage() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [cartLoading, setCartLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [clearing, setClearing] = useState(false);
  const hasRestoredRef = useRef(false);

  const fetchCart = useCallback(async () => {
    setCartLoading(true);
    setError("");

    let items = [];
    let total = 0;
    let apiError = "";

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("cartItems");
        const parsed = stored ? JSON.parse(stored) : [];
        if (Array.isArray(parsed) && parsed.length) {
          items = parsed;
          total = calculateTotal(parsed);
        }
      } catch (error) {
        console.error("Failed to parse local cart", error);
      }
    }

    try {
      const response = await apiHelpers.cart.get();
      const cart = response?.data?.cart || response?.data || {};
      const apiItems = Array.isArray(cart.items) ? cart.items : [];
      if (apiItems.length) {
        items = apiItems;
        total = typeof cart.totalAmount === "number" ? cart.totalAmount : calculateTotal(apiItems);
      }
    } catch (err) {
      if (!items.length) {
        apiError = err?.response?.data?.message || err?.message || "Failed to load cart";
      }
    }

    setCartItems(items);
    setTotalAmount(total);
    setError(items.length ? "" : apiError);
    setCartLoading(false);
    hasRestoredRef.current = true;
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    fetchCart();
  }, [authLoading, isLoggedIn, fetchCart, router]);

  const handleQuantityChange = useCallback(async (itemId, itemType, nextQuantity) => {
    if (!itemId) return;
    setUpdatingItemId(itemId);

    try {
      setCartItems((prevItems) => {
        const updated = prevItems.reduce((acc, item) => {
          const id = getItemId(item);
          if (id !== itemId) {
            acc.push(item);
            return acc;
          }

          if (nextQuantity > 0) {
            acc.push({ ...item, quantity: nextQuantity });
          }
          return acc;
        }, []);
        return updated;
      });

      if (nextQuantity <= 0) {
        await apiHelpers.cart.removeItem(itemId);
      } else {
        await apiHelpers.cart.updateItem(itemId, { quantity: nextQuantity, itemType });
      }
    } catch (err) {
      console.warn("Cart update sync failed", err?.message || err);
    } finally {
      setUpdatingItemId(null);
    }
  }, []);

  const handleRemoveItem = useCallback(async (itemId, itemType) => {
    if (!itemId) return;
    setUpdatingItemId(itemId);

    try {
      setCartItems((prevItems) => prevItems.filter((item) => getItemId(item) !== itemId));
      await apiHelpers.cart.removeItem(itemId, { data: { itemType } });
    } catch (err) {
      console.warn("Cart removal sync failed", err?.message || err);
    } finally {
      setUpdatingItemId(null);
    }
  }, []);

  const handleClearCart = useCallback(async () => {
    if (!cartItems.length) return;
    setClearing(true);

    try {
      setCartItems([]);
      await apiHelpers.cart.clear();
    } catch (err) {
      console.warn("Cart clear sync failed", err?.message || err);
    } finally {
      setClearing(false);
    }
  }, [cartItems.length]);

  const isProcessing = useMemo(() => updatingItemId !== null || clearing, [updatingItemId, clearing]);
  const hasItems = cartItems.length > 0;

  useEffect(() => {
    if (!hasRestoredRef.current) return;
    if (typeof window === "undefined") return;
    try {
      if (cartItems.length) {
        localStorage.setItem("cartItems", JSON.stringify(cartItems));
      } else {
        localStorage.removeItem("cartItems");
      }
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error("Failed to persist cart", error);
    }
  }, [cartItems]);

  useEffect(() => {
    setTotalAmount(calculateTotal(cartItems));
  }, [cartItems]);

  if (authLoading || cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3 text-gray-600 dark:text-gray-300">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="text-lg font-medium">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-600">
              <ShoppingCart className="w-4 h-4" />
              My Cart
            </div>
            <h1 className="mt-4 text-4xl font-bold text-gray-900 dark:text-white">
              Review Your Selected Courses
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Complete your purchase to unlock lifetime access and personalized learning paths.
            </p>
          </div>
          <Link
            href="/"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-indigo-100 bg-white px-5 py-2 text-sm font-semibold text-indigo-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-200"
          >
            <span className="pointer-events-none absolute inset-0 translate-y-[110%] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80 transition-transform duration-500 ease-out group-hover:translate-y-0" />
            <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition-colors duration-300 group-hover:bg-white group-hover:text-indigo-500 dark:bg-indigo-900 dark:text-indigo-200">
              <ArrowLeft className="h-4 w-4" />
            </span>
            <span className="relative text-indigo-600 transition-colors duration-300 group-hover:text-white dark:text-indigo-200">
              Continue Shopping
            </span>
          </Link>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {!hasItems ? (
          <div className="rounded-3xl bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center shadow-sm">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
            <h2 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">Your cart is empty</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Browse our catalog and add courses that inspire you.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-white font-semibold hover:from-orange-600 hover:to-pink-600"
            >
              Explore Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_minmax(280px,1fr)] gap-8">
            <div className="space-y-5">
              {cartItems.map((item) => (
                <CartItem
                  key={item._id || item.course?._id || item.courseId}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveItem}
                />
              ))}
            </div>

            <aside className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 h-fit sticky top-24">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span className="text-green-600">- {formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (included)</span>
                  <span>{formatCurrency(Math.round(totalAmount * 0.18))}</span>
                </div>
              </div>

              <div className="mt-5 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between text-lg font-semibold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <button
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold py-3 shadow-md hover:shadow-lg transition"
                disabled={isProcessing}
              >
                Proceed to Checkout
              </button>

              <button
                onClick={handleClearCart}
                className="mt-3 w-full rounded-xl border border-red-200 text-red-600 py-3 font-semibold hover:bg-red-50 transition"
                disabled={isProcessing}
              >
                {clearing ? "Clearing..." : "Clear Cart"}
              </button>

              {isProcessing && (
                <p className="mt-2 text-xs text-gray-500 text-center">
                  Updating your cart...
                </p>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
