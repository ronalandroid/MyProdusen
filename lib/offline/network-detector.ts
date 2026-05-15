type NetworkStatusListener = (isOnline: boolean) => void;

export class NetworkDetector {
  private listeners: Set<NetworkStatusListener> = new Set();
  private _isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private checkInterval?: NodeJS.Timeout;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      
      // Periodic connectivity check (every 30 seconds)
      this.checkInterval = setInterval(() => {
        this.checkConnectivity();
      }, 30000);
    }
  }

  private handleOnline = () => {
    if (!this._isOnline) {
      this._isOnline = true;
      this.notifyListeners(true);
    }
  };

  private handleOffline = () => {
    if (this._isOnline) {
      this._isOnline = false;
      this.notifyListeners(false);
    }
  };

  private async checkConnectivity(): Promise<void> {
    try {
      // Try to fetch a small resource from the server
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const wasOnline = this._isOnline;
      this._isOnline = response.ok;
      
      if (wasOnline !== this._isOnline) {
        this.notifyListeners(this._isOnline);
      }
    } catch (error) {
      const wasOnline = this._isOnline;
      this._isOnline = false;
      
      if (wasOnline !== this._isOnline) {
        this.notifyListeners(this._isOnline);
      }
    }
  }

  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach(listener => {
      try {
        listener(isOnline);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  public get isOnline(): boolean {
    return this._isOnline;
  }

  public subscribe(listener: NetworkStatusListener): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    this.listeners.clear();
  }
}

// Singleton instance
export const networkDetector = new NetworkDetector();
