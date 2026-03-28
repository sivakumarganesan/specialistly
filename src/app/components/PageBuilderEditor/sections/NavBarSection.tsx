import React, { useState } from 'react';
import { PageSection } from '@/app/hooks/usePageBuilder';
import { Menu, X } from 'lucide-react';

export const NavBarSectionPreview: React.FC<{ section: PageSection }> = ({ section }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const brandName = section.content?.brandName || 'Brand';
  const brandColor = section.content?.brandColor || '#00acc1';
  const bgColor = section.content?.backgroundColor || '#ffffff';
  const textColor = section.content?.textColor || '#333333';
  const linkColor = section.content?.linkColor || textColor;
  const logoUrl = section.content?.logoUrl || '';
  const logoDisplayMode = section.content?.logoDisplayMode || 'auto';
  const menuItems: { label: string; url: string }[] = section.content?.menuItems || [];

  const showLogo = logoUrl && (logoDisplayMode === 'both' || logoDisplayMode === 'logo' || (logoDisplayMode === 'auto' && logoUrl));
  const showText = logoDisplayMode === 'both' || logoDisplayMode === 'text' || (logoDisplayMode === 'auto' && !logoUrl);

  return (
    <nav style={{ backgroundColor: bgColor }} className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          {showLogo && (
            <img src={logoUrl} alt={brandName} className="h-12 w-auto object-contain" />
          )}
          {showText && (
            <span className="text-lg sm:text-xl font-bold tracking-tight" style={{ color: brandColor }}>
              {brandName}
            </span>
          )}
        </div>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-6">
          {menuItems.map((item, i) => (
            <a
              key={i}
              href={item.url || '#'}
              className="text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ color: linkColor }}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Mobile hamburger */}
        {menuItems.length > 0 && (
          <button
            className="md:hidden p-1"
            style={{ color: textColor }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && menuItems.length > 0 && (
        <div className="md:hidden border-t border-gray-200 px-4 py-3 space-y-2" style={{ backgroundColor: bgColor }}>
          {menuItems.map((item, i) => (
            <a
              key={i}
              href={item.url || '#'}
              className="block text-sm font-medium py-1.5 hover:opacity-80 transition-opacity"
              style={{ color: linkColor }}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}

      {/* Empty state for editor */}
      {menuItems.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-2">
          <span className="text-xs text-gray-400">Add menu items in the editor panel →</span>
        </div>
      )}
    </nav>
  );
};

export default NavBarSectionPreview;
