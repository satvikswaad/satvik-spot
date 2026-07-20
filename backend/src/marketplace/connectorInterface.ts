/**
 * Marketplace Connector Interface — Channel-Neutral Abstraction
 *
 * All marketplace business logic calls these methods.
 * Each channel adapter (Amazon, Flipkart, future) implements this interface,
 * translating between internal normalized models and marketplace-specific payloads.
 *
 * FEATURE GATE: All adapters default to disabled. No live API calls occur
 * until the owner explicitly enables a connector.
 */

export interface MarketplaceProduct {
  internalProductId: string;
  internalVariantId: string;
  internalSKU: string;
  name: string;
  description: string;
  ingredients: string;
  allergens: string;
  weight: string;
  price: number;
  mrp: number;
  stock: number;
  category: string;
  fssaiLicenceNumber: string | null;
  countryOfOrigin: string;
  isVegetarian: boolean;
  imageUrl: string | null;
}

export interface MarketplaceInventoryUpdate {
  internalSKU: string;
  sellerSKU: string;
  availableQuantity: number;
  safetyBuffer: number;
}

export interface MarketplacePriceUpdate {
  internalSKU: string;
  sellerSKU: string;
  price: number;
  mrp: number;
}

export interface MarketplaceOrderItem {
  marketplaceOrderItemId: string;
  sellerSKU: string;
  internalSKU: string;
  quantity: number;
  unitPrice: number;
}

export interface MarketplaceOrder {
  marketplaceOrderId: string;
  channel: string;
  channelStatus: string;
  normalizedStatus: string;
  items: MarketplaceOrderItem[];
  buyerName?: string; // Redacted in logs
  shippingAddress?: string; // Redacted in logs
  importedAt: Date;
}

export interface MarketplaceSettlement {
  settlementRef: string;
  orderRefs: string[];
  grossAmount: number;
  marketplaceFees: number;
  taxes: number;
  refunds: number;
  netAmount: number;
}

export interface ConnectorHealthStatus {
  channel: string;
  status: 'healthy' | 'degraded' | 'error' | 'disabled';
  lastSuccessfulSync: Date | null;
  message: string;
}

export interface ListingValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Marketplace Connector Interface
 * Each channel adapter implements all methods below.
 */
export interface IMarketplaceConnector {
  readonly channel: string;
  readonly enabled: boolean;

  authorize(): Promise<void>;
  refreshAuthorization(): Promise<void>;
  validateListing(product: MarketplaceProduct): Promise<ListingValidationResult>;
  createOrUpdateListing(product: MarketplaceProduct): Promise<{ marketplaceListingId: string }>;
  updatePrice(update: MarketplacePriceUpdate): Promise<void>;
  updateInventory(update: MarketplaceInventoryUpdate): Promise<void>;
  fetchOrders(since: Date): Promise<MarketplaceOrder[]>;
  acknowledgeOrder(marketplaceOrderId: string): Promise<void>;
  updateFulfilment(marketplaceOrderId: string, trackingNumber: string, carrier: string): Promise<void>;
  fetchReturns(since: Date): Promise<any[]>;
  fetchSettlements(since: Date): Promise<MarketplaceSettlement[]>;
  reconcile(): Promise<{ mismatches: number; details: string[] }>;
  healthCheck(): Promise<ConnectorHealthStatus>;
}
