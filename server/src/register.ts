import type { Core } from '@strapi/strapi'

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  strapi.customFields.register({
    name: 'link-field',
    plugin: 'link-field',
    type: 'json',
  })
}

export default register
