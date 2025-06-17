import type { UID } from '@strapi/types'

export interface PluginConfig {
  relations: Record<UID.ContentType, { urlTemplate: string }>
}

export default {
  default: {
    relations: {},
  } as PluginConfig,
  validator(config: PluginConfig) {
    if (config.relations && typeof config.relations !== 'object') {
      throw new Error('Relations config must be an object')
    }

    for (const [contentType, relationConfig] of Object.entries(config.relations || {})) {
      if (!relationConfig.urlTemplate || typeof relationConfig.urlTemplate !== 'string') {
        throw new Error(
          `urlTemplate is required and must be a string for content type: ${contentType}`,
        )
      }

      // Validate that urlTemplate contains at least one placeholder
      if (!relationConfig.urlTemplate.includes('{') || !relationConfig.urlTemplate.includes('}')) {
        throw new Error(
          `urlTemplate must contain at least one placeholder (e.g., {slug}, {id}) for content type: ${contentType}`,
        )
      }
    }
  },
}
