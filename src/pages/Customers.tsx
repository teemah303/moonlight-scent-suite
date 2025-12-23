import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Users, MessageCircle, DollarSign, CreditCard } from "lucide-react";

export default function Customers() {
  const [open, setOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    credit_limit: "",
  });
  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*, sales(total_amount), payments(amount)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("customers").insert([{
        ...formData,
        credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : 0,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer added successfully!");
      setOpen(false);
      setFormData({ name: "", phone: "", email: "", credit_limit: "" });
    },
    onError: (error: Error) => {
      toast.error(`Failed to add customer: ${error.message}`);
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      const balance = calculateBalance(selectedCustomer);
      if (amount > balance) {
        throw new Error("Payment amount cannot exceed outstanding balance");
      }

      const { error } = await supabase.from("payments").insert([{
        customer_id: selectedCustomer.id,
        amount: amount,
        notes: paymentNotes || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Payment recorded successfully!");
      setPaymentOpen(false);
      setSelectedCustomer(null);
      setPaymentAmount("");
      setPaymentNotes("");
    },
    onError: (error: Error) => {
      toast.error(`Failed to record payment: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("Please fill in required fields");
      return;
    }
    createMutation.mutate();
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    paymentMutation.mutate();
  };

  const calculateBalance = (customer: any) => {
    const totalSales = customer.sales?.reduce((sum: number, sale: any) => sum + Number(sale.total_amount), 0) || 0;
    const totalPayments = customer.payments?.reduce((sum: number, payment: any) => sum + Number(payment.amount), 0) || 0;
    return totalSales - totalPayments;
  };

  const openWhatsApp = (phone: string, balance: number) => {
    const message = `Hello! This is a friendly reminder from Moonlight Scent. You have an outstanding balance of ₦${balance.toLocaleString()}. We'd appreciate your payment at your earliest convenience. Thank you!`;
    const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const openPaymentDialog = (customer: any) => {
    setSelectedCustomer(customer);
    setPaymentOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage customer relationships</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground font-serif">Add New Customer</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Create a customer profile for tracking sales and credit
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-foreground">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Customer name"
                  className="bg-background border-input text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-foreground">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+234 XXX XXX XXXX"
                  className="bg-background border-input text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="customer@email.com"
                  className="bg-background border-input text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="credit_limit" className="text-foreground">Credit Limit (₦)</Label>
                <Input
                  id="credit_limit"
                  type="number"
                  step="0.01"
                  value={formData.credit_limit}
                  onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                  placeholder="50000"
                  className="bg-background border-input text-foreground"
                />
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                {createMutation.isPending ? "Adding..." : "Add Customer"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground font-serif">Record Payment</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Record a payment from {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Outstanding Balance:</span>
                  <span className="text-2xl font-bold text-destructive">
                    ₦{calculateBalance(selectedCustomer).toLocaleString()}
                  </span>
                </div>
              </div>
              <div>
                <Label htmlFor="payment_amount" className="text-foreground">Payment Amount (₦) *</Label>
                <Input
                  id="payment_amount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="bg-background border-input text-foreground"
                  required
                />
              </div>
              <div>
                <Label htmlFor="payment_notes" className="text-foreground">Notes (Optional)</Label>
                <Input
                  id="payment_notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Payment reference or notes"
                  className="bg-background border-input text-foreground"
                />
              </div>
              <Button type="submit" disabled={paymentMutation.isPending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <CreditCard className="mr-2 h-4 w-4" />
                {paymentMutation.isPending ? "Recording..." : "Record Payment"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading customers...</div>
      ) : customers && customers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer: any) => {
            const balance = calculateBalance(customer);
            const totalSales = customer.sales?.reduce((sum: number, sale: any) => sum + Number(sale.total_amount), 0) || 0;
            
            return (
              <Card key={customer.id} className="bg-card border-border hover:border-primary transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-foreground font-serif">{customer.name}</CardTitle>
                      <CardDescription className="text-muted-foreground">{customer.phone}</CardDescription>
                    </div>
                    {balance > 0 && (
                      <Badge variant="destructive">Debt</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Sales:</span>
                    <span className="text-foreground font-medium">₦{totalSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Outstanding:</span>
                    <span className={balance > 0 ? "text-destructive font-bold" : "text-primary font-medium"}>
                      ₦{balance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Credit Limit:</span>
                    <span className="text-foreground font-medium">₦{Number(customer.credit_limit).toLocaleString()}</span>
                  </div>
                  
                  {balance > 0 && (
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openWhatsApp(customer.phone, balance)}
                        className="flex-1 border-primary text-primary hover:bg-primary/10"
                      >
                        <MessageCircle className="mr-1 h-4 w-4" />
                        Remind
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openPaymentDialog(customer)}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <DollarSign className="mr-1 h-4 w-4" />
                        Pay
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No customers yet. Add your first customer!</p>
        </div>
      )}
    </div>
  );
}
