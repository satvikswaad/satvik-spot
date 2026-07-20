/**
 * Flipkart Seller API Adapter — Feature-Gated Stub Implementation
 *
 * All methods throw "Connector disabled" when FLIPKART_CONNECTOR_ENABLED is false.
 * No live API calls occur until the owner explicitly enables this connector
 * with verified seller account authorization.
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

const FLIPKART_CONNECTOR_ENABLED = false; // Owner must explicitly enable

export class FlipkartAdapter implements IMarketplaceConnector {
  readonly channel = 'flipkart_in';
  readonly enabled = FLIPKART_CONNECTOR_ENABLED;

  private assertEnabled(): void {
    if (!this.enabled) {
      throw new Error('Flipkart Seller API connector is disabled. Owner authorization required.');
    }
  }

  async authorize(): Promise<void> {
    this.assertEnabled();
    // OAuth 2.0 Bearer Token exchange
  }

  async refreshAuthorization(): Promise<void> {
    this.assertEnabled();
  }

  async validateListing(product: MarketplaceProduct): Promise<ListingValidationResult> {
    this.assertEnabled();
    const errors: string[] = [];
    if (!product.fssaiLicenceNumber) {
      errors.push('FSSAI licence number is mandatory for food listings on Flipkart India');
    }
    if (product.price > product.mrp) {
      errors.push('Listing price must not exceed MRP');
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  }

  async createOrUpdateListing(product: MarketplaceProduct): Promise<{ marketplaceListingId: string }> {
    this.assertEnabled();
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
      message: this.enabled ? 'Flipkart Seller API connected' : 'Connector disabled — owner authorization required'
    };
  }
}
