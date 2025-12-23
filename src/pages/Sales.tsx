import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, ShoppingCart, Trash2, FileText, Download } from "lucide-react";

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

  const generateInvoiceHTML = (sale: any, saleItems: CartItem[], customer: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${sale.id.slice(0, 8).toUpperCase()}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px; 
            background: white;
            color: #000;
            line-height: 1.6;
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #FFD700; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
          }
          .header h1 { 
            color: #1a1a1a; 
            margin: 0; 
            font-size: 32px;
            font-weight: bold;
          }
          .header p { 
            color: #666; 
            margin: 5px 0; 
            font-size: 14px;
          }
          .info-section { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 30px; 
          }
          .info-box { 
            width: 48%; 
          }
          .info-box h3 { 
            color: #1a1a1a; 
            margin-bottom: 10px; 
            font-size: 16px;
            font-weight: bold;
          }
          .info-box p { 
            margin: 5px 0; 
            color: #666; 
            font-size: 14px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 30px; 
          }
          th { 
            background-color: #1a1a1a; 
            color: #FFD700; 
            padding: 12px; 
            text-align: left; 
            font-weight: bold;
            font-size: 14px;
          }
          td { 
            padding: 10px; 
            border-bottom: 1px solid #ddd; 
            font-size: 14px;
          }
          .total-row { 
            font-weight: bold; 
            font-size: 1.2em; 
            background-color: #f5f5f5; 
          }
          .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 2px solid #ddd; 
            color: #666; 
            font-size: 13px;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MOONLIGHT SCENT</h1>
          <p>Timeless Scents, Infinite Elegance</p>
          <p>Near Badr Mosque, Abuja | +234 9069040537</p>
        </div>
        
        <div class="info-section">
          <div class="info-box">
            <h3>Invoice Details</h3>
            <p><strong>Invoice #:</strong> ${sale.id.slice(0, 8).toUpperCase()}</p>
            <p><strong>Date:</strong> ${new Date(sale.sale_date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p><strong>Time:</strong> ${new Date(sale.sale_date).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</p>
            <p><strong>Payment Method:</strong> ${sale.payment_method}</p>
          </div>
          <div class="info-box">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${customer ? customer.name : 'Walk-in Customer'}</p>
            ${customer ? `<p><strong>Phone:</strong> ${customer.phone}</p>` : ''}
            ${customer?.email ? `<p><strong>Email:</strong> ${customer.email}</p>` : ''}
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Quantity</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${saleItems.map(item => `
              <tr>
                <td>${item.name}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">₦${item.unit_price.toLocaleString()}</td>
                <td style="text-align: right;">₦${item.subtotal.toLocaleString()}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="3" style="text-align: right; padding: 15px;">TOTAL AMOUNT</td>
              <td style="text-align: right; padding: 15px;">₦${sale.total_amount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <p><strong>Thank you for your business!</strong></p>
          <p>For inquiries, please contact us at the details above.</p>
          <p style="margin-top: 20px; font-size: 12px;">This is a computer-generated invoice.</p>
        </div>
      </body>
      </html>
    `;
  };

  const downloadInvoiceAsPDF = async (sale: any, saleItems: CartItem[], customer: any) => {
    const invoiceHTML = generateInvoiceHTML(sale, saleItems, customer);
    
    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      
      // Wait for content to load, then trigger print dialog
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    }
    
    // Also download as HTML file
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Moonlight-Invoice-${sale.id.slice(0, 8)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
      const newQty = existing.quantity + qty;
      if (newQty > product.quantity) {
        toast.error("Insufficient stock!");
        return;
      }
      setCart(cart.map(item =>
        item.product_id === selectedProduct
          ? { ...item, quantity: newQty, subtotal: newQty * item.unit_price }
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
    toast.success("Item removed from cart");
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

      return sale;
    },
    onSuccess: async (sale) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      
      const customer = customers?.find(c => c.id === customerId);
      
      // Generate and download invoice
      await downloadInvoiceAsPDF(sale, cart, customer);
      
      toast.success("Sale completed! Invoice generated. Use Print dialog to save as PDF.");
      
      // Reset form
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
              Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Your cart is empty</p>
                <p className="text-sm text-muted-foreground mt-1">Add products to begin</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {cart.map((item) => (
                    <div key={item.product_id} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} × ₦{item.unit_price.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-semibold text-primary">
                          ₦{item.subtotal.toLocaleString()}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.product_id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xl font-bold border-t border-border pt-4">
                    <span className="text-foreground">Total:</span>
                    <span className="text-primary">₦{totalAmount.toLocaleString()}</span>
                  </div>

                  <Button
                    onClick={() => completeSale.mutate()}
                    disabled={completeSale.isPending || cart.length === 0}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold"
                  >
                    {completeSale.isPending ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <FileText className="mr-2 h-5 w-5" />
                        Complete Sale & Generate Invoice
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Invoice will open in new window. Use Print → Save as PDF to download.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
