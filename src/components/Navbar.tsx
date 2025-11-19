
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStock } from '@/contexts/StockContext';
import { Sun, Moon, Search, Menu, X, ChevronDown } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { searchStocks } = useStock();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length >= 2) {
      const results = searchStocks(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };
  
  const handleSearchItemClick = (ticker: string) => {
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/analysis?symbol=${ticker}`);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const renderAuthButtons = () => {
    if (isAuthenticated) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <span className="hidden sm:inline">{user?.name}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/dashboard')}>
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/portfolio')}>
              Portfolio
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              logout();
              navigate('/');
            }}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    } else {
      return (
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link to="/signup">
            <Button>Sign up</Button>
          </Link>
        </div>
      );
    }
  };

  return (
    <nav className="sticky top-0 z-30 w-full glass-card backdrop-blur-lg border-b shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                StockVISION
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-1">
              <Link to="/dashboard">
                <Button variant={isActive('/dashboard') ? 'default' : 'ghost'} size="sm">
                  Dashboard
                </Button>
              </Link>
              <Link to="/market">
                <Button variant={isActive('/market') ? 'default' : 'ghost'} size="sm">
                  Market
                </Button>
              </Link>
              <Link to="/trends">
                <Button variant={isActive('/trends') ? 'default' : 'ghost'} size="sm">
                  Trends
                </Button>
              </Link>
              <Link to="/analysis">
                <Button variant={isActive('/analysis') ? 'default' : 'ghost'} size="sm">
                  Analysis
                </Button>
              </Link>
              <Link to="/portfolio">
                <Button variant={isActive('/portfolio') ? 'default' : 'ghost'} size="sm">
                  Portfolio
                </Button>
              </Link>
              <Link to="/visions">
                <Button variant={isActive('/visions') ? 'default' : 'ghost'} size="sm">
                  Visions
                </Button>
              </Link>
            </div>
          )}

          {/* Right side - Search, Theme, Auth */}
          <div className="flex items-center gap-2 md:gap-4">
            {isAuthenticated && (
              <div className="relative hidden md:block">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search stocks..."
                    className="w-[200px] pl-9 rounded-full bg-background/50"
                    value={searchQuery}
                    onChange={handleSearch}
                    onFocus={() => setShowSearch(true)}
                    onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                  />
                </div>
                {showSearch && searchResults.length > 0 && (
                  <div className="absolute top-full mt-2 w-[250px] rounded-md border bg-popover p-2 shadow-md">
                    {searchResults.map((stock) => (
                      <div
                        key={stock.ticker}
                        className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer"
                        onClick={() => handleSearchItemClick(stock.ticker)}
                      >
                        <div>
                          <div className="font-medium">{stock.ticker}</div>
                          <div className="text-sm text-muted-foreground">{stock.name}</div>
                        </div>
                        <div className={stock.change >= 0 ? "text-green-500" : "text-red-500"}>
                          ${stock.price.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Theme toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Auth buttons or user dropdown */}
            <div className="hidden md:block">
              {renderAuthButtons()}
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-3 space-y-3 animate-fade-in">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={isActive('/dashboard') ? 'default' : 'ghost'}
                    className="w-full justify-start"
                  >
                    Dashboard
                  </Button>
                </Link>
                <Link to="/market" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={isActive('/market') ? 'default' : 'ghost'}
                    className="w-full justify-start"
                  >
                    Market
                  </Button>
                </Link>
                <Link to="/trends" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={isActive('/trends') ? 'default' : 'ghost'}
                    className="w-full justify-start"
                  >
                    Trends
                  </Button>
                </Link>
                <Link to="/analysis" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={isActive('/analysis') ? 'default' : 'ghost'}
                    className="w-full justify-start"
                  >
                    Analysis
                  </Button>
                </Link>
                <Link to="/portfolio" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={isActive('/portfolio') ? 'default' : 'ghost'}
                    className="w-full justify-start"
                  >
                    Portfolio
                  </Button>
                </Link>
                <div className="pt-2">
                  <Input
                    type="search"
                    placeholder="Search stocks..."
                    className="w-full"
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Sign up</Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
