import React from 'react';
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
  const posts = (section.content?.posts || []) as BlogPost[];
  const layout = section.content?.layout || 'grid';

  if (posts.length === 0) {
    return (
      <div className="py-16 px-4" style={{ backgroundColor: section.content?.backgroundColor || '#f9fafb' }}>
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">{section.title || 'Blog'}</h2>
          {section.description && (
            <p className="text-gray-600 mb-8">{section.description}</p>
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
          <h2 className="text-3xl font-bold mb-4">{section.title || 'Blog'}</h2>
          {section.description && (
            <p className="text-gray-600">{section.description}</p>
          )}
        </div>

        <div className={
          layout === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
            : 'space-y-8 max-w-3xl mx-auto'
        }>
          {posts.map((post) => (
            <article
              key={post.id}
              className={`bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow ${
                layout === 'list' ? 'flex gap-6' : ''
              }`}
            >
              {post.image && (
                <div className={layout === 'list' ? 'w-64 flex-shrink-0' : ''}>
                  <img
                    src={post.image}
                    alt={post.title}
                    className={`w-full object-cover ${layout === 'list' ? 'h-full' : 'h-48'}`}
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
    </div>
  );
};

export default BlogSectionPreview;
