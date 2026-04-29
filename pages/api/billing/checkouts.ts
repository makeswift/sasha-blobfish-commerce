import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from '../../../lib/auth'
import db from '../../../lib/db'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET')
    return res.status(405).json({ message: 'Method not allowed' })

  try {
    const { storeHash } = await getSession(req)
    const checkouts = await db.getCheckoutsByStore(storeHash)

    return res.status(200).json({ checkouts })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
