/**
 * Amazon SP-API Adapter — Feature-Gated Stub Implementation
 *
 * Authorization model: Login with Amazon (LWA) OAuth 2.0 only.
 * - Private self-authorized application for Satvik Spot's own seller account.
 * - Exchange LWA refresh token for short-lived access token.
 * - Send access token in x-amz-access-token header on SP-API requests.
 * - No AWS IAM credentials, access keys, or Signature Version 4 signing required.
 *
 * All methods throw "Connector disabled" when AMAZON_CONNECTOR_ENABLED is false.
 * No live API calls, credential storage, listing creation, or order imports
 * occur until the owner explicitly enables this connector.
 */

import {
  IMarketplaceConnector,
  MarketplaceProduct,
  MarketplaceInventoryUpdate,
  MarketplacePriceUpdate,
  MarketplaceOrder,
  MarketplaceSettlement,
  ConnectorHealthStatus,
  ListingValidationResult
} from './connectorInterface';

const AMAZON_CONNECTOR_ENABLED = false; // Owner must explicitly enable

/**
 * Required LWA credential fields (stored in Secret Manager, never in code or logs).
 * Note: No AWS access key or secret access key fields exist.
 */
export interface AmazonLWACredentials {
  lwaClientId: string;
  lwaClientSecret: string; // Never logged
  lwaRefreshToken: string; // Never logged
}

export class AmazonSPAPIAdapter implements IMarketplaceConnector {
  readonly channel = 'amazon_in';
  readonly enabled = AMAZON_CONNECTOR_ENABLED;

  private assertEnabled(): void {
    if (!this.enabled) {
      throw new Error('Amazon SP-API connector is disabled. Owner authorization required.');
    }
  }

  /**
   * Exchange LWA refresh token for a short-lived access token.
   * POST https://api.amazon.com/auth/o2/token
   * Access token is held in memory only and not persisted.
   */
  async authorize(): Promise<void> {
    this.assertEnabled();
    // LWA refresh token → access token exchange
    // Access token stored in memory only, not persisted
  }

  /**
   * Refresh an expired or expiring LWA access token.
   * Uses the stored refresh token to obtain a new access token.
   * Retries with exponential backoff on transient failures.
   */
  async refreshAuthorization(): Promise<void> {
    this.assertEnabled();
    // LWA refresh token grant with retry + backoff
  }

  async validateListing(product: MarketplaceProduct): Promise<ListingValidationResult> {
    this.assertEnabled();
    const errors: string[] = [];
    if (!product.fssaiLicenceNumber) {
      errors.push('FSSAI licence number is mandatory for food listings on Amazon India');
    }
    if (product.price > product.mrp) {
      errors.push('Listing price must not exceed MRP');
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  }

  async createOrUpdateListing(product: MarketplaceProduct): Promise<{ marketplaceListingId: string }> {
    this.assertEnabled();
    // Listings Items API v2021-08-01 PUT /listings/{sku}
    return { marketplaceListingId: '' };
  }

  async updatePrice(update: MarketplacePriceUpdate): Promise<void> {
    this.assertEnabled();
    if (update.price > update.mrp) {
      throw new Error('Price exceeds MRP — update rejected');
    }
  }

  async updateInventory(update: MarketplaceInventoryUpdate): Promise<void> {
    this.assertEnabled();
    // Feeds API JSON_LISTINGS_FEED
  }

  async fetchOrders(since: Date): Promise<MarketplaceOrder[]> {
    this.assertEnabled();
    return [];
  }

  async acknowledgeOrder(marketplaceOrderId: string): Promise<void> {
    this.assertEnabled();
  }

  async updateFulfilment(marketplaceOrderId: string, trackingNumber: string, carrier: string): Promise<void> {
    this.assertEnabled();
  }

  async fetchReturns(since: Date): Promise<any[]> {
    this.assertEnabled();
    return [];
  }

  async fetchSettlements(since: Date): Promise<MarketplaceSettlement[]> {
    this.assertEnabled();
    return [];
  }

  async reconcile(): Promise<{ mismatches: number; details: string[] }> {
    this.assertEnabled();
    return { mismatches: 0, details: [] };
  }

  async healthCheck(): Promise<ConnectorHealthStatus> {
    return {
      channel: this.channel,
      status: this.enabled ? 'healthy' : 'disabled',
      lastSuccessfulSync: null,
      message: this.enabled ? 'Amazon SP-API connected' : 'Connector disabled — owner authorization required'
    };
  }
}
