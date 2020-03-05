const { ApolloServer } = require('apollo-server')
const { makeExecutableSchema } = require('graphql-tools')
const { createComplexityLimitRule } = require('graphql-validation-complexity')

const context = require('./src/context')
const logUsage = () => {}
const maxComplexity = 10

const validationRules = [
  createComplexityLimitRule(
    maxComplexity,
    {
      formatErrorMessage: cost => `query with cost ${cost} exceeds complexity limit`,
      introspectionListFactor: 0,
      onCost: (cost) => console.log('query cost:', cost)
    }
  )
]

const items = [
  { id: 1, name: 'Apple', plu: '#1', vendorId: 1 },
  { id: 2, name: 'Banana', plu: '#2', vendorId: 1 },
  { id: 3, name: 'Carrot', plu: '#3', vendorId: 2 },
  { id: 4, name: 'Dates', plu: '#4', vendorId: 2 },
  { id: 5, name: 'Eggs', plu: '#5', vendorId: 3 },
  { id: 6, name: 'Fanta', plu: '#6', vendorId: 4 }
]

const vendors = [
  { id: 1, name: 'Mars' },
  { id: 2, name: 'Nestle' },
  { id: 3, name: 'Dole' },
  { id: 4, name: 'Hershey' }
]

const typeDefs = `
  directive @cost(value: Int) on FIELD_DEFINITION | OBJECT | FIELD
  directive @costFactor(value: Int) on FIELD_DEFINITION
  type Query {
    item(id: Int): Item
    items: [Item] @costFactor(value: 5)
  }

  type Item @cost(value: 1) {
    id: Int
    name: String
    plu: String
    vendor: Vendor
  }

  type Vendor @cost(value: 1) {
    id: Int
    name: String
  }
`

const resolvers = {
  Item: {
    vendor: item => vendors.find(vendor => vendor.id === item.vendorId)
  },
  Query: {
    item: (_obj, { id }) => items.find(item => item.id === id),
    items: () => items
  }
}

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  schemaDirectives
})

const plugins = [{
  requestDidStart: () => ({
    willSendResponse: ({ context, document, response }) => {
      logUsage({ context, document, response, schema })
    }
  })
}]

const server = new ApolloServer({
  context, schema, plugins, validationRules,
  tracing: true
})

server.listen(4001)
  .then(() => console.log('Server Running on port 4001'))
  .catch(err => console.error(err))