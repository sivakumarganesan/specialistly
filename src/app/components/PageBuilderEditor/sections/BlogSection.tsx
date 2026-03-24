import React, { useState } from 'react';
import { PageSection } from '@/app/hooks/usePageBuilder';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  date: string;
  category: string;
}

export const BlogSectionPreview: React.FC<{ section: PageSection }> = ({ section }) => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const posts = (section.content?.posts || []) as BlogPost[];
  const layout = section.content?.layout || 'grid';

  if (posts.length === 0) {
    return (
      <div className="py-16 px-4" style={{ backgroundColor: section.content?.backgroundColor || '#f9fafb' }}>
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: section.content?.titleColor || undefined }}>{section.title || 'Blog'}</h2>
          {section.description && (
            <p className="text-lg mb-8" style={{ color: section.content?.descriptionColor || '#4b5563' }}>{section.description}</p>
          )}
          <div className="bg-white rounded-lg shadow-sm border border-dashed border-gray-300 p-12">
            <p className="text-gray-400 text-lg">📝 No blog posts yet</p>
            <p className="text-gray-400 text-sm mt-2">Add blog posts from the properties panel</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 px-4" style={{ backgroundColor: section.content?.backgroundColor || '#f9fafb' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: section.content?.titleColor || undefined }}>{section.title || 'Blog'}</h2>
          {section.description && (
            <p className="text-lg" style={{ color: section.content?.descriptionColor || '#4b5563' }}>{section.description}</p>
          )}
        </div>

        <div className={
          layout === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-6 max-w-3xl mx-auto'
        }>
          {posts.map((post) => (
            <article
              key={post.id}
              className={`bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all cursor-pointer hover:-translate-y-0.5 ${
                layout === 'list' ? 'flex flex-col sm:flex-row gap-0 sm:gap-6' : ''
              }`}
              onClick={() => setSelectedPost(post)}
            >
              {post.image && (
                <div className={layout === 'list' ? 'w-full sm:w-48 md:w-64 flex-shrink-0' : ''}>
                  <img
                    src={post.image}
                    alt={post.title}
                    className={`w-full object-cover ${layout === 'list' ? 'h-48 sm:h-full' : 'h-48 sm:h-52'}`}
                  />
                </div>
              )}
              <div className="p-6">
                {post.category && (
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {post.category}
                  </span>
                )}
                <h3 className="text-xl font-bold mt-2 mb-2 text-gray-900">{post.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  {post.author && <span>By {post.author}</span>}
                  {post.date && <span>{post.date}</span>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Blog post detail modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-white max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              ✕
            </button>

            {/* Header image */}
            {selectedPost.image && (
              <img
                src={selectedPost.image}
                alt={selectedPost.title}
                className="w-full h-64 object-cover flex-shrink-0"
              />
            )}

            {/* Content */}
            <div className="p-8 overflow-y-auto">
              <div className="flex items-center gap-3 mb-4">
                {selectedPost.category && (
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {selectedPost.category}
                  </span>
                )}
                {selectedPost.date && (
                  <span className="text-xs text-gray-500">{selectedPost.date}</span>
                )}
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedPost.title}
              </h2>

              {selectedPost.author && (
                <p className="text-sm text-gray-500 mb-6">By {selectedPost.author}</p>
              )}

              <div className="prose prose-gray max-w-none">
                {(selectedPost.content || selectedPost.excerpt).split('\n').map((paragraph, idx) => (
                  paragraph.trim() ? (
                    <p key={idx} className="text-gray-700 leading-relaxed mb-4">{paragraph}</p>
                  ) : null
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogSectionPreview;
