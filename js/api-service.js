/**
 * API Service Module
 * Handles all communication with the backend
 */

const API_BASE_URL = '/api';

class APIService {
  // Store JWT token in localStorage
  static setToken(token) {
    localStorage.setItem('authToken', token);
  }

  static getToken() {
    return localStorage.getItem('authToken');
  }

  static clearToken() {
    localStorage.removeItem('authToken');
  }

  // Helper method to make requests with auth header
  static async request(endpoint, method = 'GET', body = null) {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `API Error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================

  /**
   * Register a new user
   * @param {Object} userData - { firstName, lastName, phone, email, location, crop, farmSize, password }
   */
  static async register(userData) {
    const response = await this.request('/auth/register', 'POST', userData);
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  /**
   * Login user
   * @param {Object} credentials - { phone, password }
   */
  static async login(credentials) {
    const response = await this.request('/auth/login', 'POST', credentials);
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  /**
   * Get current logged-in user data
   */
  static async getCurrentUser() {
    return this.request('/user/me', 'GET');
  }

  /**
   * Get profile summary for the logged-in user
   */
  static async getProfileSummary() {
    return this.request('/profile/summary', 'GET');
  }

  /**
   * Logout user
   */
  static logout() {
    this.clearToken();
    localStorage.removeItem('user');
    localStorage.removeItem('registrationMode');
  }

  // ==========================================
  // CROP & INVENTORY ENDPOINTS
  // ==========================================

  /**
   * Add a new crop to inventory
   * @param {Object} cropData - { cropName, quantity, price, grade }
   */
  static async addCrop(cropData) {
    return this.request('/crops', 'POST', cropData);
  }

  /**
   * Get user's crop inventory
   */
  static async getMyInventory() {
    return this.request('/crops/my-inventory', 'GET');
  }

  /**
   * Get all crops in marketplace
   */
  static async getMarketplace() {
    return this.request('/crops/marketplace', 'GET');
  }

  /**
   * Get live market prices
   */
  static async getMarketPrices() {
    return this.request('/market-prices', 'GET');
  }

  /**
   * Get live weather for a location
   * @param {String} location
   */
  static async getWeather(location) {
    return this.request(`/weather?location=${encodeURIComponent(location)}`, 'GET');
  }

  /**
   * Get notifications for the current user
   */
  static async getNotifications() {
    return this.request('/notifications', 'GET');
  }

  /**
   * Mark a notification as read
   */
  static async markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, 'POST');
  }

  /**
   * Mark all notifications as read
   */
  static async markAllNotificationsRead() {
    return this.request('/notifications/read-all', 'POST');
  }

  /**
   * Delete a single notification
   */
  static async deleteNotification(id) {
    return this.request(`/notifications/${id}`, 'DELETE');
  }

  /**
   * Clear all notifications
   */
  static async clearNotifications() {
    return this.request('/notifications', 'DELETE');
  }

  /**
   * Ask the chatbot a farming question
   * @param {String} message
   */
  static async askChatbot(message) {
    return this.request('/chatbot', 'POST', { message });
  }

  /**
   * Get single crop details
   * @param {String} cropId
   */
  static async getCropDetails(cropId) {
    return this.request(`/crops/${cropId}`, 'GET');
  }

  /**
   * Update crop (change quantity, mark as sold, etc.)
   * @param {String} cropId
   * @param {Object} updateData - { status, quantity }
   */
  static async updateCrop(cropId, updateData) {
    return this.request(`/crops/${cropId}`, 'PUT', updateData);
  }

  /**
   * Delete a crop from inventory
   * @param {String} cropId
   */
  static async deleteCrop(cropId) {
    return this.request(`/crops/${cropId}`, 'DELETE');
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Check if user is authenticated
   */
  static isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Get stored user data from localStorage
   */
  static getUserData() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Store user data in localStorage
   */
  static storeUserData(userData) {
    localStorage.setItem('user', JSON.stringify(userData));
  }

  /**
   * Check server health
   */
  static async checkHealth() {
    return this.request('/health', 'GET');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIService;
}
