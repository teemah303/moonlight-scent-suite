import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Users, MessageCircle } from "lucide-react";

export default function Customers() {
  const [open, setOpen] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("Please fill in required fields");
      return;
    }
    createMutation.mutate();
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

      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading customers...</div>
      ) : customers && customers.length > 0 ? (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Phone</TableHead>
                <TableHead className="text-muted-foreground text-right">Total Sales</TableHead>
                <TableHead className="text-muted-foreground text-right">Outstanding</TableHead>
                <TableHead className="text-muted-foreground text-right">Credit Limit</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer: any) => {
                const balance = calculateBalance(customer);
                const totalSales = customer.sales?.reduce((sum: number, sale: any) => sum + Number(sale.total_amount), 0) || 0;
                
                return (
                  <TableRow key={customer.id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-medium text-foreground">{customer.name}</TableCell>
                    <TableCell className="text-foreground">{customer.phone}</TableCell>
                    <TableCell className="text-right text-foreground">₦{totalSales.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {balance > 0 ? (
                        <Badge variant="destructive">₦{balance.toLocaleString()}</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">Paid</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      ₦{Number(customer.credit_limit).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {balance > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openWhatsApp(customer.phone, balance)}
                          className="border-primary text-primary hover:bg-primary/10"
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Remind
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
