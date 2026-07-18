import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Button, Input } from '@royal-spirits/ui';
import { api, uploadImage } from '../lib/api';
import type { Product, Category } from '@royal-spirits/shared';
import { CATEGORIES } from '@royal-spirits/shared';

export function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [brand, setBrand] = useState('');
  const [volumeMl, setVolumeMl] = useState('');
  const [price, setPrice] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit || !id) return;
    api.get<Product>(`/products/${id}`).then((p) => {
      setName(p.name);
      setCategory(p.category);
      setBrand(p.brand);
      setVolumeMl(String(p.volumeMl));
      setPrice(String(p.price));
      setStockQty(String(p.stockQty));
      setDescription(p.description ?? '');
      setImageUrl(p.imageUrl ?? null);
    });
  }, [id, isEdit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        name,
        category,
        brand,
        volumeMl: Number(volumeMl),
        price: Number(price),
        stockQty: Number(stockQty),
        description: description || null,
      };
      let productId = id;
      if (isEdit && productId) {
        await api.put(`/admin/products/${productId}`, payload);
      } else {
        const created = await api.post<Product>('/admin/products', payload);
        productId = created.id;
      }
      if (imageFile && productId) {
        await uploadImage(`/admin/products/${productId}/image`, imageFile);
      }
      navigate('/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container className="py-8">
      <h1 className="font-display text-2xl font-bold text-rs-on-surface">
        {isEdit ? 'Edit Product' : 'Add Product'}
      </h1>
      <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-rs-on-surface-variant">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="h-11 rounded-rs border border-rs-outline-variant bg-rs-surface-lowest px-3 text-base focus:border-rs-secondary focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Brand"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          required
        />
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Volume (ml)"
            type="number"
            value={volumeMl}
            onChange={(e) => setVolumeMl(e.target.value)}
            required
          />
          <Input
            label="Price (₹)"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <Input
            label="Stock qty"
            type="number"
            value={stockQty}
            onChange={(e) => setStockQty(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-rs-on-surface-variant">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="rounded-rs border border-rs-outline-variant bg-rs-surface-lowest px-3 py-2 text-base focus:border-rs-secondary focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-rs-on-surface-variant">
            Image
          </label>
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Product preview"
              className="mb-2 h-24 w-24 rounded-rs object-cover"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="text-sm text-rs-on-surface-variant"
          />
        </div>
        {error && <p className="text-sm text-rs-error">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Product'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/products')}>
            Cancel
          </Button>
        </div>
      </form>
    </Container>
  );
}
