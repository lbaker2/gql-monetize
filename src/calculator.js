const { SchemaDirectiveVisitor } = require('apollo-server')
const {
  defaultFieldResolver,
  DirectiveLocation,
  GraphQLDirective,
  GraphQLInt
} = require('graphql')
const logCost = args => {
  console.log(
    'Log Cost',
    {
      client: args.context.client,
      objectType: args.objectType,
      field: args.field.name,
      cost: args.cost
    }
  )
}
class CostCalculator extends SchemaDirectiveVisitor {
  static getDirectiveDeclaration() {
    return new GraphQLDirective({
      name: 'cost',
      locations: [DirectiveLocation.OBJECT, DirectiveLocation.FIELD],
      args: {
        value: {
          type: GraphQLInt,
          defaultValue: 1
        }
      }
    })
  }

  visitObject(type) {
    this.ensureFieldsWrapped(type)
    type._cost = this.args.value
  }
  // Visitor methods for nested types like fields and arguments
  // also receive a details object that provides information about
  // the parent and grandparent types.
  visitFieldDefinition(field, details) {
    this.ensureFieldsWrapped(details.objectType)
    field._cost = this.args.value
  }

  ensureFieldsWrapped(objectType) {
    // Mark the GraphQLObjectType object to avoid re-wrapping:
    if (objectType._costFieldsWrapped) return
    objectType._costFieldsWrapped = true

    const fields = objectType.getFields()

    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName]
      const { resolve = defaultFieldResolver } = field
      field.resolve = async function(...args) {
        // Get the required Role from the field first, falling back
        // to the objectType if no Role is required by the field:
        const cost = field._cost || objectType._cost
        if (!cost) return resolve.apply(this, args)

        const context = args[2]
        logCost({ context, objectType, field, cost })
        return resolve.apply(this, args)
      }
    })
  }
}

module.exports = CostCalculator
