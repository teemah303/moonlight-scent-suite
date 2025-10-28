import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Download, Database, Loader2 } from "lucide-react";

export default function Backup() {
  const [loading, setLoading] = useState(false);

  const exportData = async () => {
    setLoading(true);
    try {
      const [categories, products, customers, sales, saleItems, payments] = await Promise.all([
        supabase.from("categories").select("*"),
        supabase.from("products").select("*"),
        supabase.from("customers").select("*"),
        supabase.from("sales").select("*"),
        supabase.from("sale_items").select("*"),
        supabase.from("payments").select("*"),
      ]);

      const backup = {
        timestamp: new Date().toISOString(),
        data: {
          categories: categories.data,
          products: products.data,
          customers: customers.data,
          sales: sales.data,
          sale_items: saleItems.data,
          payments: payments.data,
        },
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `moonlight-scent-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Backup created successfully!");
    } catch (error: any) {
      toast.error(`Backup failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-serif font-bold text-foreground">Backup & Export</h1>
        <p className="text-muted-foreground mt-1">Protect your business data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <Card className="bg-card border-border hover:border-primary transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-foreground font-serif">Export All Data</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Download complete database backup
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={exportData}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Backup
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground font-serif">Backup Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Format:</span>
              <span className="text-foreground font-medium">JSON</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Includes:</span>
              <span className="text-foreground font-medium">All tables</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">File naming:</span>
              <span className="text-foreground font-medium text-xs">moonlight-scent-backup-YYYY-MM-DD.json</span>
            </div>
            <p className="text-muted-foreground text-xs pt-2 border-t border-border">
              Backup files contain all your categories, products, customers, sales, and payment data. Store them securely.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
