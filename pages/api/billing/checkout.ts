import { NextApiRequest, NextApiResponse } from 'next'
import { accountClient } from '../../../lib/account-client'
import { getSession } from '../../../lib/auth'
import { graphql } from '../../../lib/graphql'
import { PLANS } from '../../../lib/plans'

const { APP_URL, BC_APP_PRODUCT_ID } = process.env

const CreateCheckoutMutation = graphql(`
  mutation CreateCheckout($checkout: CreateCheckoutInput!) {
    checkout {
      createCheckout(input: $checkout) {
        checkout {
          id
          status
          checkoutUrl
        }
      }
    }
  }
`)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST')
    return res.status(405).json({ message: 'Method not allowed' })

  try {
    const { accountUuid, storeHash } = await getSession(req)
    const { planId, subscriptionId } = req.body

    if (!accountUuid)
      return res.status(400).json({
        message: 'Merchant account UUID not found. Please reinstall the app.',
      })

    const plan = PLANS.find((p) => p.id === planId)
    if (!plan)
      return res.status(400).json({ message: `Unknown plan: ${planId}` })

    const item: Record<string, unknown> = {
      product: {
        id: BC_APP_PRODUCT_ID,
        type: 'APPLICATION',
        productLevel: plan.productLevel,
      },
      scope: { id: `bc/account/scope/${storeHash}`, type: 'STORE' },
      pricingPlan: {
        interval: plan.interval,
        price: { value: plan.price, currencyCode: 'USD' },
      },
      description: `Blobfish Commerce ${plan.name} Plan`,
      redirectUrl: `${APP_URL}/plans`,
    }

    if (subscriptionId) item.subscriptionId = subscriptionId

    const data = await accountClient.request(CreateCheckoutMutation, {
      checkout: {
        accountId: `bc/account/account/${accountUuid}`,
        items: [item],
      },
    })

    const checkout = data?.checkout?.createCheckout?.checkout

    return res.status(200).json({
      checkoutId: checkout?.id,
      checkoutUrl: checkout?.checkoutUrl,
    })
  } catch (error) {
    const gqlErrors = error?.response?.errors
    if (gqlErrors?.length) {
      return res.status(400).json({ errors: gqlErrors })
    }

    return res.status(500).json({ message: error.message })
  }
}
