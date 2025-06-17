import type { Core } from '@strapi/strapi'

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  index(ctx) {
    ctx.body = strapi.plugin('link-field').service('service').getWelcomeMessage()
  },

  async getRelations(ctx) {
    try {
      const relations = strapi.plugin('link-field').service('service').getConfiguredRelations()

      ctx.body = { relations }
    } catch (error) {
      console.error('Controller: getRelations error:', error)
      ctx.throw(500, `Failed to get relations: ${error.message}`)
    }
  },

  async getRelationOptions(ctx) {
    try {
      const { relationKey } = ctx.params
      const { search } = ctx.query

      if (!relationKey) {
        ctx.throw(400, 'Relation key is required')
      }

      const options = await strapi
        .plugin('link-field') // Changed from 'strapi-plugin-link-field'
        .service('service')
        .getRelationOptions(relationKey, search)

      ctx.body = { options }
    } catch (error) {
      console.error('Controller: getRelationOptions error:', error)
      ctx.throw(500, `Failed to get relation options: ${error.message}`)
    }
  },

  async generateUrl(ctx) {
    try {
      const { fieldData } = ctx.request.body

      if (!fieldData) {
        ctx.throw(400, 'Field data is required')
      }

      const generatedUrl = strapi
        .plugin('link-field') // Changed from 'strapi-plugin-link-field'
        .service('service')
        .generateUrl(fieldData)

      ctx.body = { generatedUrl }
    } catch (error) {
      console.error('Controller: generateUrl error:', error)
      ctx.throw(500, `Failed to generate URL: ${error.message}`)
    }
  },
})

export default controller
