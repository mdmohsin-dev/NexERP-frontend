import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, PackageX } from 'lucide-react';
import type { Product } from '@/types';
import { getProducts, deleteProduct } from '@/api/product.api';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ProductForm } from '@/components/ProductForm';

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace(
  '/api/v1',
  ''
);

export function ProductsPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['products', { search, page }],
    queryFn: () => getProducts({ search, page, limit: 10 }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Product deleted successfully');
    },
    onError: (err) => {
      const message = getErrorMessage(err);
      setDeleteError(message);
      toast.error(message);
    },
  });

  const openAddDialog = () => {
    setEditingProduct(undefined);
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    setDeleteError(null);
    if (confirm(`Delete "${product.name}"?`)) {
      deleteMutation.mutate(product._id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your inventory</p>
        </div>

        {canManage && (
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) setEditingProduct(undefined);
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <ProductForm product={editingProduct} onSuccess={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, SKU or category..."
          className="pl-9"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {deleteError && <Alert variant="destructive">{deleteError}</Alert>}

      {isLoading && <Spinner />}
      {isError && <Alert variant="destructive">{getErrorMessage(error)}</Alert>}

      {data && data.data.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
          <PackageX className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">No products found</p>
          <p className="text-xs text-muted-foreground">Try adjusting your search or add a new product.</p>
        </div>
      )}

      {data && data.data.length > 0 && (
        <>
          {/* Mobile: card list (below sm breakpoint) */}
          <div className="space-y-3 sm:hidden">
            {data.data.map((product) => (
              <Card key={product._id} className="p-3">
                <div className="flex items-start gap-3">
                  <img
                    src={`${API_ORIGIN}${product.image}`}
                    alt={product.name}
                    className="h-14 w-14 shrink-0 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-medium">{product.name}</p>
                      <Badge variant={product.stockQuantity < 5 ? 'warning' : 'secondary'}>
                        {product.stockQuantity} in stock
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      SKU: {product.sku} · {product.category}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Buy </span>${product.purchasePrice.toFixed(2)}
                        <span className="mx-1.5 text-muted-foreground">·</span>
                        <span className="text-muted-foreground">Sell </span>${product.sellingPrice.toFixed(2)}
                      </p>
                      {canManage && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(product)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Tablet & up: table with horizontal scroll safety net */}
          <div className="hidden overflow-x-auto rounded-lg border border-border bg-card sm:block">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-border bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Category</th>
                  <th className="hidden px-4 py-3 md:table-cell">Purchase</th>
                  <th className="px-4 py-3">Selling</th>
                  <th className="px-4 py-3">Stock</th>
                  {canManage && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.data.map((product) => (
                  <tr key={product._id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={`${API_ORIGIN}${product.image}`}
                          alt={product.name}
                          className="h-10 w-10 shrink-0 rounded-md object-cover"
                        />
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{product.sku}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                      {product.category}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">${product.purchasePrice.toFixed(2)}</td>
                    <td className="px-4 py-3">${product.sellingPrice.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={product.stockQuantity < 5 ? 'warning' : 'secondary'}>
                        {product.stockQuantity}
                      </Badge>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(product)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {data && data.meta.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} products)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}