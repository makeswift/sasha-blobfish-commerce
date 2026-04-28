import { GraphQLClient } from 'graphql-request'

const accountUuid = process.env.BC_ACCOUNT_UUID
const apiToken = process.env.BC_ACCOUNT_API_TOKEN

export const accountClient = new GraphQLClient(
  `https://api.bigcommerce.com/accounts/${accountUuid}/graphql`,
  {
    headers: {
      'X-Auth-Token': apiToken ?? '',
    },
  }
)
