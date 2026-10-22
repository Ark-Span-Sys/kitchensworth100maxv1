"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { ShoppingCart, X } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { formatNgn } from "@/lib/pricing";

/**
 * Floating Cart Badge — appears when user adds items to cart.
 * Draggable, with close button. Position persists in localStorage.
 * Sits above the floating dock at bottom-32.
 */
export function FloatingCartBadge() {
  const { count, subtotal, openCart } = useCart();
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 16, y: 16 }); // default right-4 bottom-32 (16px from right, 128px from bottom)
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  // Load saved position on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kw_cart_badge_position");
      if (saved) {
        try {
          const pos = JSON.parse(saved);
          setPosition({ x: pos.x, y: pos.y });
        } catch {
          // ignore corrupted data
        }
      }
    }
  }, []);

  // Save position to localStorage
  const savePosition = useCallback((x: number, y: number) => {
    localStorage.setItem("kw_cart_badge_position", JSON.stringify({ x, y }));
  }, []);

  // Show/hide based on cart count
  useEffect(() => {
    if (count > 0) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [count]);

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!elementRef.current) return;
    const rect = elementRef.current.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: rect.left,
      startTop: rect.top,
    };
    setIsDragging(true);
    e.preventDefault();
  }, []);

  // Handle drag move
  useEffect(() => {
    if (!isDragging || !dragRef.current) return;

    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - dragRef.current!.startX;
      const dy = e.clientY - dragRef.current!.startY;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const el = elementRef.current;
      if (!el) return;
      const elRect = el.getBoundingClientRect();
      const elWidth = elRect.width;
      const elHeight = elRect.height;

      // Calculate new position (from right/bottom)
      const newX = Math.max(16, Math.min(viewportWidth - elWidth - 16, viewportWidth - dragRef.current!.startLeft - dx - elWidth));
      const newY = Math.max(16, Math.min(viewportHeight - elHeight - 32, viewportHeight - dragRef.current!.startTop - dy - elHeight));

      setPosition({ x: Math.round(newX), y: Math.round(newY) });
    };

    const handleUp = () => {
      if (dragRef.current) {
        savePosition(position.x, position.y);
        dragRef.current = null;
      }
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging, position, savePosition]);

  // Touch support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!elementRef.current) return;
    const rect = elementRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startLeft: rect.left,
      startTop: rect.top,
    };
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging || !dragRef.current) return;

    const handleMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const dx = touch.clientX - dragRef.current!.startX;
      const dy = touch.clientY - dragRef.current!.startY;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const el = elementRef.current;
      if (!el) return;
      const elRect = el.getBoundingClientRect();
      const elWidth = elRect.width;
      const elHeight = elRect.height;

      const newX = Math.max(16, Math.min(viewportWidth - elWidth - 16, viewportWidth - dragRef.current!.startLeft - dx - elWidth));
      const newY = Math.max(16, Math.min(viewportHeight - elHeight - 32, viewportHeight - dragRef.current!.startTop - dy - elHeight));

      setPosition({ x: Math.round(newX), y: Math.round(newY) });
    };

    const handleUp = () => {
      if (dragRef.current) {
        savePosition(position.x, position.y);
        dragRef.current = null;
      }
      setIsDragging(false);
    };

    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isDragging, position, savePosition]);

  if (!visible) return null;

  return (
    <div
      ref={elementRef}
      className="fixed z-[60] transition-opacity duration-200"
      style={{
        right: position.x,
        bottom: position.y,
        left: "auto",
        top: "auto",
      }}
    >
      <Link
        href="#"
        onClick={(e) => {
          e.preventDefault();
          openCart();
        }}
        className="flex items-center gap-3 rounded-full bg-brand-black px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur transition hover:bg-brand-green-dark group"
        aria-label={`View cart with ${count} items totaling ${formatNgn(subtotal)}`}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setVisible(false);
          }}
          className="flex-shrink-0 ml-2 p-1 text-white/70 hover:text-white transition"
          aria-label="Close cart badge"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Shopping bag icon */}
        <div className="grid h-8 w-8 place-items-center rounded-full bg-white/10 transition group-hover:bg-white/20">
          <ShoppingCart className="h-4 w-4 text-white" />
        </div>

        {/* Text + price */}
        <span className="text-white group-hover:text-white/90">
          View cart · {formatNgn(subtotal)}
        </span>

        {/* Item count badge */}
        <span className="inline-flex h-5 min-w-5 place-items-center justify-center rounded-full bg-brand-yellow px-1 text-[10px] font-black text-brand-black shadow">
          {count}
        </span>
      </Link>

      {/* Drag handle indicator */}
      {isDragging && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs text-white/60 whitespace-nowrap">
          Drag to move
        </div>
      )}
    </div>
  );
}
