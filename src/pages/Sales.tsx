import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, ShoppingCart, Trash2 } from "lucide-react";

interface CartItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export default function Sales() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const queryClient = useQueryClient();

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").gt("quantity", 0);
      if (error) throw error;
      return data;
    },
  });

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const addToCart = () => {
    if (!selectedProduct || !quantity) {
      toast.error("Please select a product and quantity");
      return;
    }

    const product = products?.find(p => p.id === selectedProduct);
    if (!product) return;

    const qty = parseInt(quantity);
    if (qty > product.quantity) {
      toast.error("Insufficient stock!");
      return;
    }

    const existing = cart.find(item => item.product_id === selectedProduct);
    if (existing) {
      setCart(cart.map(item =>
        item.product_id === selectedProduct
          ? { ...item, quantity: item.quantity + qty, subtotal: (item.quantity + qty) * item.unit_price }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        quantity: qty,
        unit_price: Number(product.selling_price),
        subtotal: qty * Number(product.selling_price),
      }]);
    }

    setSelectedProduct("");
    setQuantity("1");
    toast.success("Added to cart!");
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const completeSale = useMutation({
    mutationFn: async () => {
      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          customer_id: customerId || null,
          total_amount: totalAmount,
          payment_method: paymentMethod,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(cart.map(item => ({
          sale_id: sale.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        })));

      if (itemsError) throw itemsError;

      // Update product quantities
      for (const item of cart) {
        const product = products?.find(p => p.id === item.product_id);
        if (product) {
          const { error } = await supabase
            .from("products")
            .update({ quantity: product.quantity - item.quantity })
            .eq("id", item.product_id);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Sale completed successfully!");
      setCart([]);
      setCustomerId("");
      setPaymentMethod("Cash");
    },
    onError: (error: Error) => {
      toast.error(`Failed to complete sale: ${error.message}`);
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-serif font-bold text-foreground">Record Sale</h1>
        <p className="text-muted-foreground mt-1">Create a new sales transaction</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground font-serif">Add Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-foreground">Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="bg-background border-input text-foreground">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {products?.map((product: any) => (
                    <SelectItem key={product.id} value={product.id} className="text-foreground">
                      {product.name} (₦{Number(product.selling_price).toLocaleString()}) - Stock: {product.quantity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-foreground">Quantity</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-background border-input text-foreground"
              />
            </div>

            <Button onClick={addToCart} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>

            <div className="pt-4 border-t border-border space-y-3">
              <div>
                <Label className="text-foreground">Customer (Optional)</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger className="bg-background border-input text-foreground">
                    <SelectValue placeholder="Walk-in customer" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {customers?.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id} className="text-foreground">
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-foreground">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="bg-background border-input text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Cash" className="text-foreground">Cash</SelectItem>
                    <SelectItem value="Transfer" className="text-foreground">Transfer</SelectItem>
                    <SelectItem value="Card" className="text-foreground">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground font-serif flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Cart
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Cart is empty</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Product</TableHead>
                      <TableHead className="text-muted-foreground text-right">Qty</TableHead>
                      <TableHead className="text-muted-foreground text-right">Price</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.product_id} className="border-border">
                        <TableCell className="text-foreground">{item.name}</TableCell>
                        <TableCell className="text-right text-foreground">{item.quantity}</TableCell>
                        <TableCell className="text-right text-primary">₦{item.subtotal.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.product_id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-6 space-y-4">
                  <div className="flex justify-between items-center text-lg font-semibold border-t border-border pt-4">
                    <span className="text-foreground">Total:</span>
                    <span className="text-primary">₦{totalAmount.toLocaleString()}</span>
                  </div>

                  <Button
                    onClick={() => completeSale.mutate()}
                    disabled={completeSale.isPending || cart.length === 0}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {completeSale.isPending ? "Processing..." : "Complete Sale"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
