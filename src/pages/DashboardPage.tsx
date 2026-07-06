import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Package, Users, ShoppingCart, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import { getDashboardStats, getDailySalesChart } from '@/api/dashboard.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { getErrorMessage } from '@/lib/axios';

const statCards: {
  key: 'totalProducts' | 'totalCustomers' | 'totalSales' | 'totalRevenue';
  label: string;
  icon: typeof Package;
  isCurrency?: boolean;
}[] = [
    { key: 'totalProducts', label: 'Total Products', icon: Package },
    { key: 'totalCustomers', label: 'Total Customers', icon: Users },
    { key: 'totalSales', label: 'Total Sales', icon: ShoppingCart },
    { key: 'totalRevenue', label: 'Total Revenue', icon: DollarSign, isCurrency: true },
  ];

// Formats "2026-07-07" -> "Jul 7" for compact X-axis labels
const formatDateLabel = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

function DailySalesChart() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard-sales-chart', 30],
    queryFn: () => getDailySalesChart(30),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-primary" />
          Products Sold — Last 30 Days
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <Spinner />}
        {isError && <Alert variant="destructive">{getErrorMessage(error)}</Alert>}
        {data && (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateLabel}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  interval={window.innerWidth < 640 ? 6 : 2}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  labelFormatter={(label) => formatDateLabel(String(label))}
                  formatter={(value) => [`${value} units`, 'Sold']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="quantitySold" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  if (isLoading) return <Spinner />;

  if (isError || !data) {
    return <Alert variant="destructive">{getErrorMessage(error)}</Alert>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your inventory & sales</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ key, label, icon: Icon, isCurrency }) => (
          <Card key={key}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isCurrency ? `$${data[key].toFixed(2)}` : data[key]}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DailySalesChart />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Low Stock Products (below {data.lowStockThreshold})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.lowStockProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">All products are well stocked. 🎉</p>
          ) : (
            <div className="divide-y divide-border">
              {data.lowStockProducts.map((product) => (
                <div
                  key={product._id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      SKU: {product.sku} · {product.category}
                    </p>
                  </div>
                  <Badge variant={product.stockQuantity === 0 ? 'destructive' : 'warning'}>
                    {product.stockQuantity} left
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}