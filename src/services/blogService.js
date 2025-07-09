import axios from 'axios';

export const blogService = {
  async getAllPosts() {
    try {
      const response = await axios.get('https://rss-link.com/feed/zKZ8Zy6VvGR1m7lNfRkY?blogId=EeuF91p1BQgGYNd7t7Jf&limit=30&loadContent=true');
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response.data, 'text/xml');
      const items = xmlDoc.getElementsByTagName('item');
      
      return Array.from(items).map(item => {
        const content = item.getElementsByTagName('content:encoded')[0]?.textContent || '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const firstImage = tempDiv.querySelector('img')?.src || '';
        
        return {
          id: item.getElementsByTagName('guid')[0]?.textContent || '',
          title: item.getElementsByTagName('title')[0]?.textContent || '',
          slug: item.getElementsByTagName('link')[0]?.textContent?.split('/').pop() || '',
          excerpt: item.getElementsByTagName('description')[0]?.textContent || '',
          content: content,
          date: item.getElementsByTagName('pubDate')[0]?.textContent || '',
          image: firstImage,
          category: 'Blog',
          readTime: '5 min read',
          author: {
            name: 'AI Deck Tutor',
            avatar: null
          },
          tags: ['MTG', 'Commander']
        };
      });
    } catch (error) {
      console.error('Error fetching RSS feed:', error);
      throw error;
    }
  },

  async getPostsByCategory(category) {
    const posts = await this.getAllPosts();
    return posts.filter(post => post.category === category);
  }
}; 