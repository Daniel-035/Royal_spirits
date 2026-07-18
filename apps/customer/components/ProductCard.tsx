import Link from 'next/link';
import type { Product } from '@royal-spirits/shared';

export function ProductCard({ product }: { product: Product }) {
  const inStock = product.stockQty > 0;
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-4 transition-colors hover:border-rs-secondary"
    >
      <div className="mb-3 aspect-square w-full overflow-hidden rounded-rs bg-rs-surface-container">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-rs-outline">
            <span className="text-xs">No image</span>
          </div>
        )}
      </div>
      <span className="text-xs font-semibold uppercase tracking-wide text-rs-secondary">
        {product.brand}
      </span>
      <h3 className="mt-1 text-base font-semibold text-rs-on-surface">{product.name}</h3>
      <p className="mt-1 text-sm text-rs-on-surface-variant">{product.volumeMl}ml</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-base font-medium text-rs-on-surface">
          ₹{product.price.toFixed(0)}
        </span>
        <span className="flex items-center gap-1 text-xs">
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
        </span>
      </div>
    </Link>
  );
}
