const { ApolloServer } = require('apollo-server')
const { makeExecutableSchema } = require('graphql-tools')
const { createComplexityLimitRule } = require('graphql-validation-complexity')


const Context = require('./src/context')
const CostCalculator = require('./src/calculator')

const ComplexityLimitRule = createComplexityLimitRule(
  10,
  {
    onCost: (cost) => {
      console.log('query cost:', cost);
    },
    introspectionListFactor: 0,
    formatErrorMessage: cost => (
      `query with cost ${cost} exceeds complexity limit`
    )
  }
)
const items = [
  { id: 1, name: 'Apple', plu: '#1' },
  { id: 2, name: 'Banana', plu: '#2' },
  { id: 3, name: 'Carrot', plu: '#3' },
  { id: 4, name: 'Dates', plu: '#4' },
  { id: 5, name: 'Eggs', plu: '#5' },
  { id: 6, name: 'Fanta', plu: '#6' }
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
  }
`

const resolvers = {
  Query: {
    item: (_obj, { id }) => items.find(item => item.id === id),
    items: () => items
  }
}

const schemaDirectives = {
  cost: CostCalculator
}

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  schemaDirectives
})

const server = new ApolloServer({
  context: Context,
  schema,
  validationRules: [ComplexityLimitRule]
})

server.listen(4001)
  .then(() => console.log('Server Running on port 4001'))
  .catch(err => console.error(err))