import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, CheckCircle2, UserPlus } from 'lucide-react';
import type { Customer } from '@/types';
import { getProducts } from '@/api/product.api';
import { getCustomers } from '@/api/customer.api';
import { createSale } from '@/api/sale.api';
import { getErrorMessage } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { CustomerForm } from '@/components/CustomerForm';

const saleSchema = z.object({
  customer: z.string().min(1, 'Please select a customer'),
  items: z
    .array(
      z.object({
        product: z.string().min(1, 'Select a product'),
        quantity: z.coerce.number().int().positive('Qty must be at least 1'),
      })
    )
    .min(1, 'Add at least one product'),
});

type SaleFormValues = z.infer<typeof saleSchema>;

export function CreateSalePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products', { forSale: true }],
    queryFn: () => getProducts({ limit: 100 }),
  });

  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers', { forSale: true }],
    queryFn: () => getCustomers({ limit: 100 }),
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: { customer: '', items: [{ product: '', quantity: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const mutation = useMutation({
    mutationFn: createSale,
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setSuccessMessage(`Sale created successfully. Grand total: $${sale.grandTotal.toFixed(2)}`);
      reset({ customer: '', items: [{ product: '', quantity: 1 }] });
      setTimeout(() => navigate('/dashboard'), 1800);
    },
    onError: (error) => setServerError(getErrorMessage(error)),
  });

  const onSubmit = (values: SaleFormValues) => {
    setServerError(null);
    setSuccessMessage(null);
    mutation.mutate(values);
  };

  // Called when a new customer is created from the inline dialog.
  // Selects the newly created customer in the form and closes the dialog.
  const handleCustomerCreated = (customer: Customer) => {
    setValue('customer', customer._id, { shouldValidate: true });
    setCustomerDialogOpen(false);
  };

  const watchedItems = watch('items');
  const products = productsData?.data || [];

  const grandTotal = watchedItems.reduce((sum, item) => {
    const product = products.find((p) => p._id === item.product);
    if (!product || !item.quantity) return sum;
    return sum + product.sellingPrice * Number(item.quantity);
  }, 0);

  if (loadingProducts || loadingCustomers) return <Spinner />;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Sale</h1>
        <p className="text-sm text-muted-foreground">Record a new sale and update stock automatically</p>
      </div>

      {serverError && <Alert variant="destructive">{serverError}</Alert>}
      {successMessage && (
        <Alert variant="success">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {successMessage}
          </div>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Customer</CardTitle>

            <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <UserPlus className="h-4 w-4" />
                  Add New Customer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <CustomerForm onSuccess={handleCustomerCreated} />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {customersData && customersData.data.length === 0 ? (
              <p className="mb-2 text-sm text-muted-foreground">
                No customers yet. Click "Add New Customer" above to create one.
              </p>
            ) : null}

            <Controller
              control={control}
              name="customer"
              render={({ field }) => (
                <Select {...field}>
                  <option value="">Select a customer</option>
                  {customersData?.data.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} — {customer.phone}
                    </option>
                  ))}
                </Select>
              )}
            />
            {errors.customer && (
              <p className="mt-1 text-xs text-destructive">{errors.customer.message}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Products</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ product: '', quantity: 1 })}
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => {
              const selectedProduct = products.find((p) => p._id === watchedItems[index]?.product);
              return (
                <div key={field.id} className="flex items-start gap-3 rounded-md border border-border p-3">
                  <div className="flex-1">
                    <Label>Product</Label>
                    <Controller
                      control={control}
                      name={`items.${index}.product`}
                      render={({ field: selectField }) => (
                        <Select {...selectField}>
                          <option value="">Select a product</option>
                          {products.map((product) => (
                            <option key={product._id} value={product._id} disabled={product.stockQuantity === 0}>
                              {product.name} ({product.stockQuantity} in stock) — $
                              {product.sellingPrice.toFixed(2)}
                            </option>
                          ))}
                        </Select>
                      )}
                    />
                    {errors.items?.[index]?.product && (
                      <p className="mt-1 text-xs text-destructive">
                        {errors.items[index]?.product?.message}
                      </p>
                    )}
                  </div>

                  <div className="w-24">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      max={selectedProduct?.stockQuantity}
                      {...register(`items.${index}.quantity`)}
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="mt-1 text-xs text-destructive">
                        {errors.items[index]?.quantity?.message}
                      </p>
                    )}
                  </div>

                  <div className="w-24 pt-6 text-right text-sm font-medium">
                    $
                    {selectedProduct
                      ? (selectedProduct.sellingPrice * (Number(watchedItems[index]?.quantity) || 0)).toFixed(2)
                      : '0.00'}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              );
            })}
            {errors.items && !Array.isArray(errors.items) && (
              <p className="text-xs text-destructive">{errors.items.message}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <span className="text-sm font-medium text-muted-foreground">Grand Total</span>
            <span className="text-2xl font-bold text-primary">${grandTotal.toFixed(2)}</span>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting || mutation.isPending}>
          Complete Sale
        </Button>
      </form>
    </div>
  );
}