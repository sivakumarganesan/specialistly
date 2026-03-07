import { API_BASE_URL } from './apiClient';

export interface CreateWebsiteRequest {
  displayName: string;
  description?: string;
  theme?: {
    id: string;
    name: string;
    version: string;
  };
}

export interface UpdateWebsiteRequest {
  displayName?: string;
  description?: string;
  customDomain?: string;
  navigation?: Array<{
    label: string;
    slug: string;
    order: number;
  }>;
}

export interface UpdateBrandingRequest {
  logo?: string;
  favicon?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  typography?: {
    fontFamily?: string;
    fontSize?: string;
  };
  buttonStyles?: Record<string, any>;
  header?: {
    layout?: string;
    logoPosition?: string;
    cta?: string;
  };
  footer?: {
    socialLinks?: string[];
    contact?: string;
    copyright?: string;
  };
}

export interface CreatePageRequest {
  title: string;
  slug: string;
  description?: string;
  isHomePage?: boolean;
}

export interface UpdatePageRequest {
  title?: string;
  slug?: string;
  description?: string;
  order?: number;
}

export interface CreateSectionRequest {
  type: string;
  title?: string;
  description?: string;
  content: Record<string, any>;
  styling?: Record<string, any>;
  visibility?: Record<string, any>;
}

export interface UpdateSectionRequest {
  type?: string;
  title?: string;
  description?: string;
  content?: Record<string, any>;
  styling?: Record<string, any>;
  visibility?: Record<string, any>;
}

class PageBuilderAPI {
  private baseURL = `${API_BASE_URL}/page-builder`;

  // ============ Website Operations ============

  async createWebsite(data: CreateWebsiteRequest) {
    try {
      const response = await fetch(`${this.baseURL}/websites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create website');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating website:', error);
      throw error;
    }
  }

  async getWebsites() {
    try {
      const response = await fetch(`${this.baseURL}/websites`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch websites');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching websites:', error);
      throw error;
    }
  }

  async getWebsite(websiteId: string) {
    try {
      const response = await fetch(`${this.baseURL}/websites/${websiteId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch website');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching website:', error);
      throw error;
    }
  }

  async updateWebsite(websiteId: string, data: UpdateWebsiteRequest) {
    try {
      const response = await fetch(`${this.baseURL}/websites/${websiteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update website');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating website:', error);
      throw error;
    }
  }

  async updateBranding(websiteId: string, data: UpdateBrandingRequest) {
    try {
      const response = await fetch(`${this.baseURL}/websites/${websiteId}/branding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update branding');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating branding:', error);
      throw error;
    }
  }

  async publishWebsite(websiteId: string) {
    try {
      const response = await fetch(`${this.baseURL}/websites/${websiteId}/publish`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to publish website');
      }

      return await response.json();
    } catch (error) {
      console.error('Error publishing website:', error);
      throw error;
    }
  }

  async deleteWebsite(websiteId: string) {
    try {
      const response = await fetch(`${this.baseURL}/websites/${websiteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete website');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting website:', error);
      throw error;
    }
  }

  async getPublicWebsite(domain: string) {
    try {
      const response = await fetch(`${this.baseURL}/public/websites/${domain}`);

      if (!response.ok) {
        throw new Error('Failed to fetch public website');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching public website:', error);
      throw error;
    }
  }

  // ============ Page Operations ============

  async createPage(websiteId: string, data: CreatePageRequest) {
    try {
      const response = await fetch(
        `${this.baseURL}/websites/${websiteId}/pages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create page');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating page:', error);
      throw error;
    }
  }

  async getPages(websiteId: string) {
    try {
      const response = await fetch(
        `${this.baseURL}/websites/${websiteId}/pages`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch pages');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching pages:', error);
      throw error;
    }
  }

  async updatePage(websiteId: string, pageId: string, data: UpdatePageRequest) {
    try {
      const response = await fetch(
        `${this.baseURL}/websites/${websiteId}/pages/${pageId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update page');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating page:', error);
      throw error;
    }
  }

  async publishPage(websiteId: string, pageId: string) {
    try {
      const response = await fetch(
        `${this.baseURL}/websites/${websiteId}/pages/${pageId}/publish`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to publish page');
      }

      return await response.json();
    } catch (error) {
      console.error('Error publishing page:', error);
      throw error;
    }
  }

  async deletePage(websiteId: string, pageId: string) {
    try {
      const response = await fetch(
        `${this.baseURL}/websites/${websiteId}/pages/${pageId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete page');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting page:', error);
      throw error;
    }
  }

  // ============ Section Operations ============

  async createSection(
    websiteId: string,
    pageId: string,
    data: CreateSectionRequest
  ) {
    try {
      const response = await fetch(
        `${this.baseURL}/websites/${websiteId}/pages/${pageId}/sections`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create section');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating section:', error);
      throw error;
    }
  }

  async updateSection(
    websiteId: string,
    pageId: string,
    sectionId: string,
    data: UpdateSectionRequest
  ) {
    try {
      const response = await fetch(
        `${this.baseURL}/websites/${websiteId}/pages/${pageId}/sections/${sectionId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update section');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating section:', error);
      throw error;
    }
  }

  async deleteSection(
    websiteId: string,
    pageId: string,
    sectionId: string
  ) {
    try {
      const response = await fetch(
        `${this.baseURL}/websites/${websiteId}/pages/${pageId}/sections/${sectionId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete section');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting section:', error);
      throw error;
    }
  }

  // ============ Media Operations ============

  async uploadMedia(websiteId: string, file: File, tags: string[] = []) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tags', JSON.stringify(tags));

      const response = await fetch(
        `${this.baseURL}/websites/${websiteId}/media/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload media');
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  }

  async getMediaLibrary(websiteId: string) {
    try {
      const response = await fetch(
        `${this.baseURL}/websites/${websiteId}/media`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch media library');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching media library:', error);
      throw error;
    }
  }

  async deleteMedia(websiteId: string, mediaId: string) {
    try {
      const response = await fetch(
        `${this.baseURL}/websites/${websiteId}/media/${mediaId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete media');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting media:', error);
      throw error;
    }
  }
}

export const pageBuilderAPI = new PageBuilderAPI();
export default pageBuilderAPI;
