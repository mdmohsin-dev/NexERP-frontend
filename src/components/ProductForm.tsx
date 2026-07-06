import { useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagePlus } from 'lucide-react';
import type { Product } from '@/types';
import { createProduct, updateProduct } from '@/api/product.api';
import { getErrorMessage } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().min(1, 'Category is required'),
  purchasePrice: z.coerce.number().min(0, 'Must be 0 or more'),
  sellingPrice: z.coerce.number().min(0, 'Must be 0 or more'),
  stockQuantity: z.coerce.number().int().min(0, 'Must be 0 or more'),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  onSuccess: () => void;
}

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace(
  '/api/v1',
  ''
);

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const isEdit = !!product;
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(
    product ? `${API_ORIGIN}${product.image}` : null
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          sku: product.sku,
          category: product.category,
          purchasePrice: product.purchasePrice,
          sellingPrice: product.sellingPrice,
          stockQuantity: product.stockQuantity,
        }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => formData.append(key, String(value)));
      if (imageFile) formData.append('image', imageFile);

      if (isEdit) {
        return updateProduct(product!._id, formData);
      }
      return createProduct(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      onSuccess();
    },
    onError: (error) => setServerError(getErrorMessage(error)),
  });

  const onSubmit = (values: ProductFormValues) => {
    setImageError(null);
    if (!isEdit && !imageFile) {
      setImageError('Product image is required');
      return;
    }
    setServerError(null);
    mutation.mutate(values);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
      setImageError(null);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Update product details below.' : 'Fill in the details to add a new product.'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && <Alert variant="destructive">{serverError}</Alert>}

        <div>
          <Label>Product Image {!isEdit && <span className="text-destructive">*</span>}</Label>
          <label
            htmlFor="image"
            className="flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-input bg-background hover:bg-accent"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
            )}
          </label>
          <input id="image" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          {imageError && <p className="mt-1 text-xs text-destructive">{imageError}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" {...register('sku')} />
            {errors.sku && <p className="mt-1 text-xs text-destructive">{errors.sku.message}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Input id="category" {...register('category')} />
          {errors.category && <p className="mt-1 text-xs text-destructive">{errors.category.message}</p>}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="purchasePrice">Purchase Price</Label>
            <Input id="purchasePrice" type="number" step="0.01" {...register('purchasePrice')} />
            {errors.purchasePrice && (
              <p className="mt-1 text-xs text-destructive">{errors.purchasePrice.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="sellingPrice">Selling Price</Label>
            <Input id="sellingPrice" type="number" step="0.01" {...register('sellingPrice')} />
            {errors.sellingPrice && (
              <p className="mt-1 text-xs text-destructive">{errors.sellingPrice.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="stockQuantity">Stock Qty</Label>
            <Input id="stockQuantity" type="number" {...register('stockQuantity')} />
            {errors.stockQuantity && (
              <p className="mt-1 text-xs text-destructive">{errors.stockQuantity.message}</p>
            )}
          </div>
        </div>

        <Button type="submit" className="w-full" isLoading={isSubmitting || mutation.isPending}>
          {isEdit ? 'Save Changes' : 'Add Product'}
        </Button>
      </form>
    </>
  );
}
