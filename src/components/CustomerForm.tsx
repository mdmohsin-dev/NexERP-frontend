import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Customer } from '@/types';
import { createCustomer } from '@/api/customer.api';
import { getErrorMessage } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const customerSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  phone: z.string().min(6, 'Valid phone number is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  onSuccess: (customer: Customer) => void;
}

export function CustomerForm({ onSuccess }: CustomerFormProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
  });

  const mutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onSuccess(customer);
    },
    onError: (error) => setServerError(getErrorMessage(error)),
  });

  const onSubmit = (values: CustomerFormValues) => {
    setServerError(null);
    mutation.mutate(values);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogDescription>
          Customer not in the list? Add them here — they'll be selected automatically.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && <Alert variant="destructive">{serverError}</Alert>}

        <div>
          <Label htmlFor="name">Customer Name</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register('phone')} />
          {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
        </div>

        <div>
          <Label htmlFor="email">Email (optional)</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div>
          <Label htmlFor="address">Address (optional)</Label>
          <Input id="address" {...register('address')} />
        </div>

        <Button type="submit" className="w-full" isLoading={isSubmitting || mutation.isPending}>
          Add Customer
        </Button>
      </form>
    </>
  );
}