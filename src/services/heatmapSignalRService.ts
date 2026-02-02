/**
 * Heatmap SignalR Service
 * Real-time SignalR connection service for heatmap updates
 */

import * as signalR from '@microsoft/signalr';
import { HeatmapData, HeatmapFilters } from '@/types/heatmap';

type HeatmapUpdateCallback = (data: HeatmapData) => void;

class HeatmapSignalRService {
  private connection: signalR.HubConnection | null = null;
  private callbacks: Map<string, HeatmapUpdateCallback> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private currentFilters: HeatmapFilters | null = null;
  private isInitialized = false;

  constructor() {
    // Don't initialize in constructor - let it be lazy initialized on first use
    // This prevents SSR issues with SignalR
  }

  /**
   * Initialize SignalR connection (lazy initialization)
   */
  private initialize(): void {
    // Skip if already initialized or if running on server
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    this.isInitialized = true;
    
    const hubUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7148'}/hubs/marketdata`;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return null;
          }
          // Exponential backoff: 2s, 4s, 8s, 16s, 32s
          return Math.min(2000 * Math.pow(2, retryContext.previousRetryCount), 32000);
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.setupEventHandlers();
  }

  /**
   * Setup SignalR event handlers
   */
  private setupEventHandlers(): void {
    if (!this.connection) return;

    this.connection.onclose((error) => {
      console.error('SignalR connection closed:', error);
      this.reconnectAttempts++;
    });

    this.connection.onreconnecting((error) => {
      console.warn('SignalR reconnecting:', error);
    });

    this.connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected:', connectionId);
      this.reconnectAttempts = 0;
      
      // Re-subscribe after reconnection
      if (this.currentFilters) {
        this.subscribeToHeatmap(this.currentFilters, Array.from(this.callbacks.values())[0]);
      }
    });

    // Listen for heatmap data updates
    this.connection.on('ReceiveHeatmapData', (data: HeatmapData) => {
      console.log('[HeatmapSignalR] 🔥 Received heatmap update:', {
        itemCount: data.items?.length || 0,
        totalCount: data.totalCount,
        timestamp: new Date().toISOString()
      });
      this.callbacks.forEach((callback) => callback(data));
    });
  }

  /**
   * Start SignalR connection
   */
  async start(): Promise<void> {
    if (!this.connection) {
      this.initialize();
    }

    // Don't start if already connected or connecting
    const currentState = this.connection!.state;
    if (currentState === signalR.HubConnectionState.Connected || 
        currentState === signalR.HubConnectionState.Connecting) {
      console.log('[HeatmapSignalR] Already connected or connecting, state:', currentState);
      return;
    }

    try {
      console.log('[HeatmapSignalR] Starting connection...');
      await this.connection!.start();
      console.log('[HeatmapSignalR] ✅ Connected successfully');
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('[HeatmapSignalR] ❌ Error starting connection:', error);
      throw error;
    }
  }

  /**
   * Stop SignalR connection
   */
  async stop(): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.stop();
        console.log('SignalR disconnected');
      } catch (error) {
        console.error('Error stopping SignalR connection:', error);
      }
    }
  }

  /**
   * Subscribe to heatmap updates
   * @param filters - Heatmap filters (exchange, sector)
   * @param callback - Callback function for updates
   * @returns Subscription ID for unsubscribe
   */
  async subscribeToHeatmap(
    filters: HeatmapFilters | null,
    callback: HeatmapUpdateCallback
  ): Promise<string> {
    if (!this.connection) {
      throw new Error('SignalR connection not initialized');
    }

    // Ensure connection is started and connected
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      await this.start();
    }

    // Double-check connection state after start
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Failed to establish SignalR connection');
    }

    // Generate subscription ID
    const subscriptionId = `heatmap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store callback
    this.callbacks.set(subscriptionId, callback);
    this.currentFilters = filters;

    try {
      // Call server method to subscribe
      await this.connection.invoke(
        'SubscribeToHeatmap',
        filters?.exchange || null,
        filters?.sector || null
      );

      console.log('[HeatmapSignalR] ✅ Subscribed to heatmap:', {
        subscriptionId,
        exchange: filters?.exchange || 'ALL',
        sector: filters?.sector || 'ALL'
      });
      return subscriptionId;
    } catch (error) {
      console.error('Error subscribing to heatmap:', error);
      this.callbacks.delete(subscriptionId);
      throw error;
    }
  }

  /**
   * Unsubscribe from heatmap updates
   * @param subscriptionId - Subscription ID from subscribe
   * @param filters - Heatmap filters used in subscription
   */
  async unsubscribeFromHeatmap(
    subscriptionId: string,
    filters: HeatmapFilters | null
  ): Promise<void> {
    if (!this.connection) return;

    try {
      // Remove callback
      this.callbacks.delete(subscriptionId);

      // If no more callbacks, unsubscribe from server
      if (this.callbacks.size === 0) {
        await this.connection.invoke(
          'UnsubscribeFromHeatmap',
          filters?.exchange || null,
          filters?.sector || null
        );
        this.currentFilters = null;
        console.log('Unsubscribed from heatmap:', filters);
      }
    } catch (error) {
      console.error('Error unsubscribing from heatmap:', error);
    }
  }

  /**
   * Get current heatmap snapshot from server
   * @param filters - Heatmap filters (exchange, sector)
   * @returns Current heatmap data
   */
  async getCurrentHeatmap(filters: HeatmapFilters | null): Promise<HeatmapData> {
    if (!this.connection) {
      throw new Error('SignalR connection not initialized');
    }

    // Ensure connection is started
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      await this.start();
    }

    if (!this.connection) {
      throw new Error('Failed to establish connection');
    }

    try {
      const data = await this.connection.invoke<HeatmapData>(
        'GetCurrentHeatmap',
        filters?.exchange || null,
        filters?.sector || null
      );

      console.log('Received current heatmap:', data.items.length, 'items');
      return data;
    } catch (error) {
      console.error('Error getting current heatmap:', error);
      throw error;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  /**
   * Get connection state
   */
  getConnectionState(): signalR.HubConnectionState | null {
    return this.connection?.state || null;
  }
}

// Lazy singleton instance - only created when first accessed (client-side only)
let instance: HeatmapSignalRService | null = null;

export const getHeatmapSignalRService = (): HeatmapSignalRService => {
  if (typeof window === 'undefined') {
    // Return a dummy instance for SSR that does nothing
    return {
      start: async () => {},
      stop: async () => {},
      subscribe: () => {},
      unsubscribe: () => {},
      updateFilters: () => {},
      isConnected: () => false,
      getConnectionState: () => null,
    } as any;
  }

  if (!instance) {
    instance = new HeatmapSignalRService();
  }
  return instance;
};

// For backward compatibility
export const heatmapSignalRService = typeof window !== 'undefined' 
  ? getHeatmapSignalRService() 
  : null as any;
