import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, LogOut, Boxes, Menu, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { confirmAction } from '@/lib/confirm';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/sales/new', label: 'Create Sale', icon: ShoppingCart },
];

// Keep these two in sync with the Tailwind classes below (h-16 = 4rem, w-64 = 16rem)
const NAVBAR_HEIGHT = 'h-16';
const SIDEBAR_WIDTH = 'w-64';

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close the mobile drawer automatically whenever the route changes
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    const confirmed = await confirmAction({
      title: 'Log out?',
      text: 'Are you sure you want to log out of Mini ERP?',
      confirmText: 'Yes, log out',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    logout();
    toast.success('Logged out successfully');
  };

  const sidebarContent = (
    <>
      <div className={cn('flex items-center justify-between gap-2 border-b border-border px-6', NAVBAR_HEIGHT)}>
        <Link to="/dashboard" className="flex items-center gap-2">
          <Boxes className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">NexERP</span>
        </Link>
        <button
          onClick={() => setMobileNavOpen(false)}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <button
          onClick={handleLogout}
          className="flex text-red-500 w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen overflow-hidden bg-secondary">
      {/* Desktop sidebar - fixed, always visible on md+, own height/scroll independent of content */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-card md:flex',
          SIDEBAR_WIDTH
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden',
          mobileNavOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer - slides in over content, closed by default */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-transform duration-200 md:hidden',
          SIDEBAR_WIDTH,
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Top navbar - fixed across full width on mobile, offset past the sidebar on md+ */}
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-card px-4 md:left-64 md:px-8',
          NAVBAR_HEIGHT
        )}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2 md:hidden">
            <Boxes className="h-5 w-5 text-primary" />
            <span className="font-bold">NexERP</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="truncate text-sm font-medium leading-tight">{user?.name}</p>
            <p className="truncate text-xs capitalize leading-tight text-muted-foreground">
              {user?.role}
            </p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Scrollable content area - offset below the fixed navbar and right of the fixed sidebar */}
      <main className="h-screen overflow-y-auto overflow-x-hidden pt-16 md:pl-64">
        <div className="mx-auto max-w-6xl p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}