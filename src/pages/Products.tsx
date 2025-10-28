import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, AlertCircle, Package } from "lucide-react";

export default function Products() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    cost_price: "",
    selling_price: "",
    quantity: "",
    description: "",
  });
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("products").insert([{
        ...formData,
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        quantity: parseInt(formData.quantity),
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product added successfully!");
      setOpen(false);
      setFormData({
        name: "",
        category_id: "",
        cost_price: "",
        selling_price: "",
        quantity: "",
        description: "",
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to add product: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category_id || !formData.cost_price || !formData.selling_price || !formData.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate();
  };

  const profitMargin = (product: any) => {
    const profit = Number(product.selling_price) - Number(product.cost_price);
    const margin = (profit / Number(product.selling_price)) * 100;
    return margin.toFixed(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your inventory</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground font-serif">Add New Product</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Add a new product to your inventory
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name" className="text-foreground">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Midnight Rose Perfume"
                    className="bg-background border-input text-foreground"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="category" className="text-foreground">Category *</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger className="bg-background border-input text-foreground">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {categories?.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id} className="text-foreground">
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cost_price" className="text-foreground">Cost Price (₦) *</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    placeholder="5000"
                    className="bg-background border-input text-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="selling_price" className="text-foreground">Selling Price (₦) *</Label>
                  <Input
                    id="selling_price"
                    type="number"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    placeholder="8000"
                    className="bg-background border-input text-foreground"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="quantity" className="text-foreground">Initial Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="50"
                    className="bg-background border-input text-foreground"
                  />
                </div>
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                {createMutation.isPending ? "Adding..." : "Add Product"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading products...</div>
      ) : products && products.length > 0 ? (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Product</TableHead>
                <TableHead className="text-muted-foreground">Category</TableHead>
                <TableHead className="text-muted-foreground text-right">Cost</TableHead>
                <TableHead className="text-muted-foreground text-right">Price</TableHead>
                <TableHead className="text-muted-foreground text-right">Margin</TableHead>
                <TableHead className="text-muted-foreground text-right">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product: any) => (
                <TableRow key={product.id} className="border-border hover:bg-muted/50">
                  <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                  <TableCell className="text-foreground">{product.categories?.name}</TableCell>
                  <TableCell className="text-right text-foreground">₦{Number(product.cost_price).toLocaleString()}</TableCell>
                  <TableCell className="text-right text-primary">₦{Number(product.selling_price).toLocaleString()}</TableCell>
                  <TableCell className="text-right text-foreground">{profitMargin(product)}%</TableCell>
                  <TableCell className="text-right">
                    {product.quantity < 10 ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {product.quantity}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {product.quantity}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No products yet. Add your first product!</p>
        </div>
      )}
    </div>
  );
}
