'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container, Button } from '@royal-spirits/ui';
import { api } from '../../../lib/api';
import { useCart } from '../../../lib/cart';
import type { Product } from '@royal-spirits/shared';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const add = useCart((s) => s.add);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<Product>(`/products/${id}`)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Container className="py-10">
        <p className="text-rs-on-surface-variant">Loading...</p>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-10">
        <h1 className="font-display text-2xl font-bold text-rs-on-surface">Product not found</h1>
        <Link href="/products" className="mt-4 inline-block text-rs-secondary hover:underline">
          Back to products
        </Link>
      </Container>
    );
  }

  const inStock = product.stockQty > 0;

  function handleAdd() {
    if (!product) return;
    add(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <Container className="py-10">
      <Link href="/products" className="text-sm text-rs-on-surface-variant hover:text-rs-on-surface">
        ← Back to products
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-rs-lg border border-rs-outline-variant bg-rs-surface-container">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-rs-outline">
              No image
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wide text-rs-secondary">
            {product.brand}
          </span>
          <h1 className="mt-1 font-display text-3xl font-bold text-rs-on-surface">
            {product.name}
          </h1>
          <p className="mt-2 text-rs-on-surface-variant">{product.volumeMl}ml</p>
          <p className="mt-4 text-3xl font-semibold text-rs-on-surface">
            ₹{product.price.toFixed(0)}
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span
              className={
                inStock
                  ? 'h-2 w-2 rounded-rs-full bg-rs-status-delivered'
                  : 'h-2 w-2 rounded-rs-full bg-rs-danger'
              }
            />
            <span className={inStock ? 'text-rs-status-delivered' : 'text-rs-danger'}>
              {inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
          {product.description && (
            <p className="mt-6 text-rs-on-surface-variant">{product.description}</p>
          )}
          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-rs border border-rs-outline-variant">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="h-11 w-11 text-rs-on-surface hover:bg-rs-surface-container"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-10 text-center text-rs-on-surface">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="h-11 w-11 text-rs-on-surface hover:bg-rs-surface-container"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <Button
              variant="primary"
              disabled={!inStock}
              onClick={handleAdd}
            >
              {added ? 'Added!' : 'Add to Cart'}
            </Button>
          </div>
          {added && (
            <button
              onClick={() => router.push('/cart')}
              className="mt-4 text-sm text-rs-secondary hover:underline"
            >
              View cart →
            </button>
          )}
        </div>
      </div>
    </Container>
  );
}
