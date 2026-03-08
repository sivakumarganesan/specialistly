import { useState, useEffect, useRef } from "react";
import { Bell, ChevronDown, Search, Menu, GraduationCap, Briefcase, Home } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { useAuth } from "@/app/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

interface SearchableItem {
  id: string;
  title: string;
  type: "course" | "offering";
}

interface HeaderProps {
  onMenuClick?: () => void;
  onNavigateToSettings?: (tab?: string) => void;
  searchableItems: SearchableItem[];
  onSearchItemClick: (type: "course" | "offering") => void;
}

export function Header({ onMenuClick, onNavigateToSettings, searchableItems, onSearchItemClick }: HeaderProps) {
  const { user, logout, setCurrentPage } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredResults = searchableItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showResults = isSearchFocused && searchQuery.trim() !== "";

  const handleLogout = () => {
    logout();
    setCurrentPage('dashboard');
  };

  const userInitials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U';

  const handleResultClick = (item: SearchableItem) => {
    onSearchItemClick(item.type);
    setSearchQuery("");
    setIsSearchFocused(false);
    
    // Navigate to the appropriate page based on item type
    if (item.type === 'offering') {
      setCurrentPage('services');
    } else if (item.type === 'course') {
      setCurrentPage('courses');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden mr-2"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <div 
          className="flex items-center gap-2 mr-6 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setCurrentPage('dashboard')}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">S</span>
          </div>
          <span className="font-bold text-xl hidden sm:inline">Specialistly</span>
        </div>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search Offerings, Courses.."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
            />
            {showResults && (
              <div className="absolute left-0 top-full w-full bg-white border rounded-b-lg shadow-lg z-10">
                {filteredResults.length > 0 ? (
                  filteredResults.map(item => (
                    <div
                      key={item.id}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleResultClick(item)}
                    >
                      <div className="flex items-center">
                        {item.type === "course" ? (
                          <GraduationCap className="h-4 w-4 mr-2 text-gray-500" />
                        ) : (
                          <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                        )}
                        <span className="text-sm">{item.title}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="ml-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <span className="hidden md:inline">{user?.name}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCurrentPage('homepage')} className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Home
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigateToSettings?.("profile")}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigateToSettings?.("subscriptions")}>
                Subscriptions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigateToSettings?.()}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
