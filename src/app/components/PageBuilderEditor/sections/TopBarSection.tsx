import React from 'react';
import { PageSection } from '@/app/hooks/usePageBuilder';
import { MapPin, Phone, Facebook, Instagram, Youtube, Twitter, Linkedin } from 'lucide-react';

const socialIcons: Record<string, React.ReactNode> = {
  facebook: <Facebook className="w-3.5 h-3.5" />,
  instagram: <Instagram className="w-3.5 h-3.5" />,
  youtube: <Youtube className="w-3.5 h-3.5" />,
  twitter: <Twitter className="w-3.5 h-3.5" />,
  linkedin: <Linkedin className="w-3.5 h-3.5" />,
};

export const TopBarSectionPreview: React.FC<{ section: PageSection }> = ({ section }) => {
  const bgColor = section.content?.backgroundColor || '#00acc1';
  const textColor = section.content?.textColor || '#ffffff';
  const address = section.content?.address || '';
  const phone = section.content?.phone || '';
  const socialLinks: { platform: string; url: string }[] = section.content?.socialLinks || [];

  return (
    <div style={{ backgroundColor: bgColor, color: textColor }} className="py-2 px-4 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        {/* Left: address + phone */}
        <div className="flex items-center gap-4 flex-wrap">
          {address && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{address}</span>
            </span>
          )}
          {phone && (
            <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:opacity-80" style={{ color: textColor }}>
              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{phone}</span>
            </a>
          )}
        </div>
        {/* Right: social icons */}
        {socialLinks.length > 0 && (
          <div className="flex items-center gap-3">
            {socialLinks.map((link, i) => (
              <a
                key={i}
                href={link.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
                style={{ color: textColor }}
              >
                {socialIcons[link.platform] || <span className="text-xs">{link.platform}</span>}
              </a>
            ))}
          </div>
        )}
      </div>
      {/* Empty state for editor */}
      {!address && !phone && socialLinks.length === 0 && (
        <div className="text-center opacity-60">Add address, phone, or social links</div>
      )}
    </div>
  );
};

export default TopBarSectionPreview;
