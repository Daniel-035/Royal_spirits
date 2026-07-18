import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Button } from '@royal-spirits/ui';
import { api } from '../lib/api';
import type { Product, Paginated, Category } from '@royal-spirits/shared';
import { CATEGORIES } from '@royal-spirits/shared';

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    params.set('pageSize', '100');
    api
      .get<Paginated<Product>>(`/admin/products?${params.toString()}`)
      .then((res) => setProducts(res.data))
      .finally(() => setLoading(false));
  }, [category, search]);

  async function handleToggleActive(product: Product) {
    await api.put(`/admin/products/${product.id}`, { isActive: !product.isActive });
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, isActive: !p.isActive } : p)),
    );
  }

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-rs-on-surface">Products</h1>
        <Link to="/products/new">
          <Button variant="primary">Add Product</Button>
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
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
      </div>

      <div className="mt-4 overflow-x-auto rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-rs-outline-variant bg-rs-surface-container text-xs uppercase tracking-wide text-rs-on-surface-variant">
            <tr>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Volume</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-rs-on-surface-variant">
                  Loading...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-rs-on-surface-variant">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-rs-outline-variant last:border-0">
                  <td className="px-4 py-3">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="h-10 w-10 rounded-rs object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-rs bg-rs-surface-container" />
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-rs-on-surface">{p.name}</td>
                  <td className="px-4 py-3 text-rs-on-surface-variant">{p.brand}</td>
                  <td className="px-4 py-3 text-rs-on-surface-variant">{p.category}</td>
                  <td className="px-4 py-3 text-rs-on-surface-variant">{p.volumeMl}ml</td>
                  <td className="px-4 py-3 text-rs-on-surface">₹{p.price.toFixed(0)}</td>
                  <td className="px-4 py-3 text-rs-on-surface-variant">{p.stockQty}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link to={`/products/${p.id}`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(p)}
                      >
                        {p.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
