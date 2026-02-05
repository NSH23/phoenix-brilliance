import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, Bell, Search, Moon, Sun } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { ADMIN_MENU_ITEMS } from '@/lib/adminMenu';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Cmd+K / Ctrl+K to open search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <AdminSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />

      {/* Main Content */}
      <motion.div
        initial={false}
        animate={{ marginLeft: sidebarCollapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="min-h-screen"
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-lg border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 md:px-4 py-2 w-auto md:w-80 text-left hover:bg-muted/70 transition-colors min-w-[44px] md:min-w-0"
                >
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground text-sm hidden md:inline">Search...</span>
                  <kbd className="ml-auto pointer-events-none hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span>⌘</span>K
                  </kbd>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search pages..." />
                  <CommandList>
                    <CommandEmpty>No results.</CommandEmpty>
                    <CommandGroup heading="Admin">
                      {ADMIN_MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        return (
                          <CommandItem
                            key={item.href}
                            value={`${item.name} ${item.keywords ?? ''}`}
                            onSelect={() => {
                              navigate(item.href);
                              setSearchOpen(false);
                            }}
                            className="cursor-pointer"
                          >
                            <Icon className="mr-2 h-4 w-4" />
                            {item.name}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative rounded-xl">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-xl">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {/* Page Header */}
          <div className="mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-serif font-bold text-foreground"
            >
              {title}
            </motion.h1>
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-muted-foreground mt-1"
              >
                {subtitle}
              </motion.p>
            )}
          </div>

          {/* Page Body */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
