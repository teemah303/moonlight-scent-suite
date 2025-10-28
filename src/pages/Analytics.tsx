import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, DollarSign, Users, ShoppingBag } from "lucide-react";

export default function Analytics() {
  const { data: analytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const [salesData, productsData, customersData] = await Promise.all([
        supabase.from("sales").select("*, sale_items(*, products(*))"),
        supabase.from("products").select("*, categories(name)"),
        supabase.from("customers").select("*, sales(total_amount)"),
      ]);

      const totalRevenue = salesData.data?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
      const totalCost = productsData.data?.reduce((sum, p) => sum + (p.quantity * Number(p.cost_price)), 0) || 0;
      const grossProfit = totalRevenue - totalCost;

      // Calculate top customers
      const customersWithTotal = customersData.data?.map(customer => ({
        ...customer,
        totalSpent: customer.sales?.reduce((sum: number, sale: any) => sum + Number(sale.total_amount), 0) || 0,
      })).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5) || [];

      // Calculate top products
      const productSales = new Map();
      salesData.data?.forEach(sale => {
        sale.sale_items?.forEach((item: any) => {
          const current = productSales.get(item.product_id) || { ...item.products, totalQty: 0, totalRevenue: 0 };
          current.totalQty += item.quantity;
          current.totalRevenue += Number(item.subtotal);
          productSales.set(item.product_id, current);
        });
      });

      const topProducts = Array.from(productSales.values())
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5);

      return {
        totalRevenue,
        totalCost,
        grossProfit,
        inventoryValue: totalCost,
        topCustomers: customersWithTotal,
        topProducts,
      };
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-serif font-bold text-foreground">Business Analytics</h1>
        <p className="text-muted-foreground mt-1">Insights and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₦{analytics?.totalRevenue.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gross Profit</CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₦{analytics?.grossProfit.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Value</CardTitle>
            <ShoppingBag className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₦{analytics?.inventoryValue.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Customers</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{analytics?.topCustomers.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground font-serif">Top 5 Customers</CardTitle>
            <CardDescription className="text-muted-foreground">By total spending</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Customer</TableHead>
                  <TableHead className="text-muted-foreground text-right">Total Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics?.topCustomers.map((customer: any) => (
                  <TableRow key={customer.id} className="border-border">
                    <TableCell className="text-foreground">{customer.name}</TableCell>
                    <TableCell className="text-right text-primary">₦{customer.totalSpent.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground font-serif">Top 5 Products</CardTitle>
            <CardDescription className="text-muted-foreground">By revenue generated</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Product</TableHead>
                  <TableHead className="text-muted-foreground text-right">Sold</TableHead>
                  <TableHead className="text-muted-foreground text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics?.topProducts.map((product: any) => (
                  <TableRow key={product.id} className="border-border">
                    <TableCell className="text-foreground">{product.name}</TableCell>
                    <TableCell className="text-right text-foreground">{product.totalQty}</TableCell>
                    <TableCell className="text-right text-primary">₦{product.totalRevenue.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
