import type { LinkFieldValue, LinkFieldRelatedData } from '../../../types'
import type { Core } from '@strapi/strapi'
import type { UID } from '@strapi/strapi'

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  getPluginConfig() {
    try {
      const config = strapi.config.get('plugin.link-field', { relations: {} })
      return config
    } catch (error) {
      console.error('Service: error getting plugin config:', error)
      return { relations: {} }
    }
  },

  async getRelationOptions(relationKey: string, search?: string) {
    try {
      if (!relationKey || !relationKey.startsWith('api::')) {
        console.error('Service: invalid relation key format:', relationKey)
        return []
      }

      const query: Parameters<typeof strapi.entityService.findMany>[1] = {}

      if (search) {
        query.filters = {
          $or: [
            { title: { $containsi: search } },
            { name: { $containsi: search } },
            { slug: { $containsi: search } },
          ],
        }
      }

      const contentType = strapi.contentTypes[relationKey]
      if (!contentType) {
        console.error('Service: content type not found:', relationKey)
        return []
      }

      const entities = await strapi.entityService.findMany(relationKey as UID.CollectionType, query)

      return entities || []
    } catch (error) {
      console.error('Service: error fetching relation options:', error)
      return []
    }
  },

  generateUrl(fieldData: LinkFieldValue) {
    try {
      if (!fieldData?.linkType || !fieldData?.relatedData) {
        return ''
      }

      const { linkType, relatedData } = fieldData

      if (relatedData && linkType.startsWith('api::')) {
        const config = this.getPluginConfig()
        const relationConfig = config.relations[linkType]

        if (relationConfig?.urlTemplate) {
          const processedUrl = this.processUrlTemplate(relationConfig.urlTemplate, relatedData)
          return processedUrl
        }
      }

      return ''
    } catch (error) {
      console.error('Service: error generating URL:', error)
      return ''
    }
  },

  processUrlTemplate(template: string, data: LinkFieldRelatedData) {
    try {
      const result = template.replace(/\{(\w+)\}/g, (match, key) => {
        const value = data[key]
        return value != null ? String(value) : match
      })
      return result
    } catch (error) {
      console.error('Service: error processing URL template:', error)
      return template
    }
  },

  getConfiguredRelations() {
    try {
      const config = this.getPluginConfig()
      return Object.keys(config.relations || {})
    } catch (error) {
      console.error('Service: error getting configured relations:', error)
      return []
    }
  },
})

export default service
