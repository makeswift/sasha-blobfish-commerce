export type SubscriptionStatus = 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'

export interface Subscription {
  id: string
  status: SubscriptionStatus
  product: {
    id: string
    type: string
    productLevel: string
  }
  pricePerInterval: {
    value: string
    currencyCode: string
  }
  billingInterval: string
  currentPeriodEnd: string
  activationDate: string
}
