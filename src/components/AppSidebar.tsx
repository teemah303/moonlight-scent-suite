import { Home, Package, ShoppingCart, Users, TrendingUp, FolderOpen, Database } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import logo from "@/assets/moonlight_logo.jpg";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Categories", url: "/categories", icon: FolderOpen },
  { title: "Products", url: "/products", icon: Package },
  { title: "Sales", url: "/sales", icon: ShoppingCart },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Analytics", url: "/analytics", icon: TrendingUp },
  { title: "Backup", url: "/backup", icon: Database },
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-sidebar">
        <div className="p-4 border-b border-sidebar-border">
          {open ? (
            <div className="flex flex-col items-center gap-2">
              <img src={logo} alt="Moonlight Scent" className="w-20 h-20 rounded-full object-cover" />
              <h1 className="text-xl font-serif font-bold text-primary">Moonlight Scent</h1>
              <p className="text-xs text-muted-foreground">Timeless Scents</p>
            </div>
          ) : (
            <img src={logo} alt="Moonlight Scent" className="w-8 h-8 rounded-full object-cover mx-auto" />
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {open && (
          <div className="mt-auto p-4 border-t border-sidebar-border text-xs text-muted-foreground">
            <p>Near Badr Mosque, Abuja</p>
            <p>+234 9069040537</p>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
