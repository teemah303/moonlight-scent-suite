import { useQuery } from "@tanstack/react-query";
import { DollarSign, Package, TrendingUp, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [salesResult, productsResult, categoriesResult] = await Promise.all([
        supabase.from("sales").select("total_amount"),
        supabase.from("products").select("id, quantity, selling_price, cost_price"),
        supabase.from("categories").select("id, name"),
      ]);

      const totalRevenue = salesResult.data?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
      const lowStockProducts = productsResult.data?.filter(p => p.quantity < 10).length || 0;
      const totalProducts = productsResult.data?.length || 0;
      const inventoryValue = productsResult.data?.reduce((sum, p) => sum + (p.quantity * Number(p.cost_price)), 0) || 0;

      return {
        totalRevenue,
        lowStockProducts,
        totalProducts,
        inventoryValue,
        totalCategories: categoriesResult.data?.length || 0,
      };
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome to Moonlight Scent</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/sales")} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            New Sale
          </Button>
          <Button onClick={() => navigate("/products")} variant="outline" className="border-primary text-primary hover:bg-primary/10">
            Add Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`₦${stats?.totalRevenue.toLocaleString() || 0}`}
          icon={DollarSign}
          trend="↗️ All time"
        />
        <StatCard
          title="Low Stock Alert"
          value={stats?.lowStockProducts || 0}
          icon={AlertTriangle}
          onClick={() => navigate("/products")}
        />
        <StatCard
          title="Total Products"
          value={stats?.totalProducts || 0}
          icon={Package}
        />
        <StatCard
          title="Inventory Value"
          value={`₦${stats?.inventoryValue.toLocaleString() || 0}`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-serif font-semibold mb-4 text-foreground">Quick Actions</h2>
          <div className="space-y-2">
            <Button onClick={() => navigate("/sales")} className="w-full justify-start bg-secondary hover:bg-secondary/80 text-secondary-foreground">
              <DollarSign className="mr-2 h-4 w-4" />
              Record New Sale
            </Button>
            <Button onClick={() => navigate("/products")} className="w-full justify-start bg-secondary hover:bg-secondary/80 text-secondary-foreground">
              <Package className="mr-2 h-4 w-4" />
              Add Product
            </Button>
            <Button onClick={() => navigate("/customers")} className="w-full justify-start bg-secondary hover:bg-secondary/80 text-secondary-foreground">
              <TrendingUp className="mr-2 h-4 w-4" />
              Manage Customers
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-serif font-semibold mb-4 text-foreground">Business Overview</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Categories</span>
              <span className="font-semibold text-foreground">{stats?.totalCategories || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Products in Stock</span>
              <span className="font-semibold text-foreground">{stats?.totalProducts || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Inventory Value</span>
              <span className="font-semibold text-primary">₦{stats?.inventoryValue.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
