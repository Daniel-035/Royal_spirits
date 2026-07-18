import Link from 'next/link';
import { Container } from '@royal-spirits/ui';
import { ProductCard } from '../components/ProductCard';
import { api } from '../lib/api';
import type { Product, Paginated, Category } from '@royal-spirits/shared';
import { CATEGORIES } from '@royal-spirits/shared';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let featured: Product[] = [];
  try {
    const res = await api.get<Paginated<Product>>('/products?pageSize=8');
    featured = res.data;
  } catch {
    featured = [];
  }

  return (
    <Container className="py-10">
      <section className="rounded-rs-lg bg-rs-surface-container p-8 lg:p-12">
        <h1 className="font-display text-4xl font-bold text-rs-on-surface">
          Premium Spirits, Delivered
        </h1>
        <p className="mt-3 max-w-xl text-lg text-rs-on-surface-variant">
          Curated whiskey, wine, beer, vodka, and rum — licensed delivery to your
          door. 21+ only.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex h-11 items-center rounded-rs bg-rs-primary px-6 text-base font-medium text-rs-on-primary hover:opacity-90"
        >
          Browse Products
        </Link>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-rs-on-surface">
          Shop by Category
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map((c: Category) => (
            <Link
              key={c}
              href={`/products?category=${c}`}
              className="rounded-rs-full border border-rs-outline-variant bg-rs-surface-lowest px-4 py-2 text-sm font-medium text-rs-on-surface-variant transition-colors hover:border-rs-secondary hover:text-rs-on-surface"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-rs-on-surface">Featured</h2>
          <Link href="/products" className="text-sm text-rs-secondary hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </Container>
  );
}
