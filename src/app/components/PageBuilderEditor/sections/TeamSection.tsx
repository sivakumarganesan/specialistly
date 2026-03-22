import React, { useState } from 'react';
import { PageSection } from '@/app/hooks/usePageBuilder';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  twitter?: string;
}

// Preview Component
export const TeamSectionPreview: React.FC<{ section: PageSection }> = ({ section }) => {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const members = (section.content?.members || []) as TeamMember[];
  const layout = section.content?.layout || 'grid';
  const accentColor = section.content?.accentColor || '#3B82F6';
  const bgColor = section.styling?.backgroundColor || '#ffffff';

  const isDark = (() => {
    const c = bgColor.replace('#', '');
    if (c.length < 6) return false;
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;
    return 0.299 * r + 0.587 * g + 0.114 * b < 0.4;
  })();

  const titleColor = section.content?.titleColor || (isDark ? '#ffffff' : '#111827');
  const subtitleColor = section.content?.descriptionColor || (isDark ? 'rgba(255,255,255,0.7)' : '#6b7280');
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
  const cardTextColor = isDark ? '#ffffff' : '#111827';
  const cardDescColor = isDark ? 'rgba(255,255,255,0.7)' : '#4b5563';

  const MemberCard = ({ member }: { member: TeamMember }) => (
    <div
      className="group cursor-pointer rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        backgroundColor: cardBg,
        border: `1px solid ${cardBorder}`,
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
      }}
      onClick={() => setSelectedMember(member)}
    >
      {/* Photo area */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '1/1' }}>
        {member.image ? (
          <img
            src={member.image}
            alt={member.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}44)` }}
          >
            <span className="text-5xl font-bold" style={{ color: accentColor }}>
              {member.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
      </div>

      {/* Info area */}
      <div className="px-4 py-4 text-center">
        <h3 className="font-semibold text-lg" style={{ color: cardTextColor }}>
          {member.name}
        </h3>
        <p className="text-sm mt-1" style={{ color: accentColor }}>
          {member.role}
        </p>
        {/* Social icons */}
        {(member.linkedin || member.twitter || member.email) && (
          <div className="flex items-center justify-center gap-3 mt-3">
            {member.email && (
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                ✉
              </span>
            )}
            {member.linkedin && (
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                in
              </span>
            )}
            {member.twitter && (
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                𝕏
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="py-16 px-4" style={{ backgroundColor: bgColor }}>
      <div className="max-w-6xl mx-auto">
        {section.content?.title && (
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-center" style={{ color: titleColor }}>
            {section.content.title}
          </h2>
        )}
        {section.content?.description && (
          <p className="text-lg mb-12 text-center max-w-2xl mx-auto" style={{ color: subtitleColor }}>
            {section.content.description}
          </p>
        )}

        {members.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
              <span className="text-2xl" style={{ color: accentColor }}>👥</span>
            </div>
            <p style={{ color: subtitleColor }}>No team members added yet</p>
            <p className="text-sm mt-1" style={{ color: subtitleColor }}>Select this section and add members in the properties panel</p>
          </div>
        ) : layout === 'list' ? (
          <div className="space-y-5 max-w-3xl mx-auto">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex gap-5 items-center p-4 rounded-xl transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}
                onClick={() => setSelectedMember(member)}
              >
                <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
                  {member.image ? (
                    <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}44)` }}
                    >
                      <span className="text-2xl font-bold" style={{ color: accentColor }}>
                        {member.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg" style={{ color: cardTextColor }}>{member.name}</h3>
                  <p className="text-sm" style={{ color: accentColor }}>{member.role}</p>
                  {member.bio && (
                    <p className="text-sm mt-1 line-clamp-2" style={{ color: cardDescColor }}>{member.bio}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`grid gap-6 ${
            members.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' :
            members.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' :
            members.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
            'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {members.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>

      {/* Member detail modal */}
      {selectedMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMember(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              ✕
            </button>

            {/* Modal photo */}
            {selectedMember.image ? (
              <img
                src={selectedMember.image}
                alt={selectedMember.name}
                className="w-full h-72 object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-full h-48 flex items-center justify-center flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}66)` }}
              >
                <span className="text-7xl font-bold text-white">
                  {selectedMember.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}

            {/* Modal content */}
            <div className="p-8 overflow-y-auto">
              <h2 className="text-2xl font-bold" style={{ color: cardTextColor }}>
                {selectedMember.name}
              </h2>
              <p className="text-base font-medium mt-1" style={{ color: accentColor }}>
                {selectedMember.role}
              </p>
              {selectedMember.bio && (
                <p className="text-base leading-relaxed whitespace-pre-line mt-4" style={{ color: cardDescColor }}>
                  {selectedMember.bio}
                </p>
              )}

              {/* Contact info */}
              {(selectedMember.email || selectedMember.phone || selectedMember.linkedin || selectedMember.twitter) && (
                <div className="mt-6 pt-4 border-t" style={{ borderColor: cardBorder }}>
                  <div className="flex flex-wrap gap-3">
                    {selectedMember.email && (
                      <a
                        href={`mailto:${selectedMember.email}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors hover:opacity-80"
                        style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        ✉ {selectedMember.email}
                      </a>
                    )}
                    {selectedMember.phone && (
                      <a
                        href={`tel:${selectedMember.phone}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors hover:opacity-80"
                        style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        📞 {selectedMember.phone}
                      </a>
                    )}
                    {selectedMember.linkedin && (
                      <a
                        href={selectedMember.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors hover:opacity-80"
                        style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        in LinkedIn
                      </a>
                    )}
                    {selectedMember.twitter && (
                      <a
                        href={selectedMember.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors hover:opacity-80"
                        style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        𝕏 Twitter
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSectionPreview;
