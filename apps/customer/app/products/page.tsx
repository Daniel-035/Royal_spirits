'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Container } from '@royal-spirits/ui';
import { ProductCard } from '../../components/ProductCard';
import { api } from '../../lib/api';
import type { Product, Paginated, Category } from '@royal-spirits/shared';
import { CATEGORIES } from '@royal-spirits/shared';

function ProductsContent() {
  const params = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get('search') ?? '');
  const [category, setCategory] = useState(params.get('category') ?? '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (category) q.set('category', category);
    if (search) q.set('search', search);
    if (minPrice) q.set('minPrice', minPrice);
    if (maxPrice) q.set('maxPrice', maxPrice);
    q.set('pageSize', '48');
    api
      .get<Paginated<Product>>(`/products?${q.toString()}`)
      .then((res) => setProducts(res.data))
      .finally(() => setLoading(false));
  }, [category, search, minPrice, maxPrice]);

  return (
    <Container className="py-8">
      <h1 className="font-display text-3xl font-bold text-rs-on-surface">Products</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-11 rounded-rs border border-rs-outline-variant bg-rs-surface-lowest px-3 text-sm focus:border-rs-secondary focus:outline-none"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c: Category) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or brand..."
          className="h-11 flex-1 rounded-rs border border-rs-outline-variant bg-rs-surface-lowest px-3 text-sm focus:border-rs-secondary focus:outline-none"
        />
        <input
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          placeholder="Min ₹"
          type="number"
          className="h-11 w-24 rounded-rs border border-rs-outline-variant bg-rs-surface-lowest px-3 text-sm focus:border-rs-secondary focus:outline-none"
        />
        <input
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="Max ₹"
          type="number"
          className="h-11 w-24 rounded-rs border border-rs-outline-variant bg-rs-surface-lowest px-3 text-sm focus:border-rs-secondary focus:outline-none"
        />
      </div>

      {loading ? (
        <p className="mt-10 text-center text-rs-on-surface-variant">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="mt-10 text-center text-rs-on-surface-variant">
          No products match your filters.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </Container>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<Container className="py-8"><p className="text-rs-on-surface-variant">Loading...</p></Container>}>
      <ProductsContent />
    </Suspense>
  );
}
