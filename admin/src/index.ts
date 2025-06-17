import { getTranslation } from './utils/getTranslation'
import { PLUGIN_ID } from './pluginId'
import { Initializer } from './components/Initializer'
import { PluginIcon } from './components/PluginIcon'
import { StrapiApp } from '@strapi/strapi/admin'

export default {
  register(app: StrapiApp) {
    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    })

    app.customFields.register({
      name: 'link-field',
      pluginId: PLUGIN_ID,
      type: 'json',
      intlLabel: {
        id: `${PLUGIN_ID}.label`,
        defaultMessage: 'Link Field',
      },
      intlDescription: {
        id: `${PLUGIN_ID}.description`,
        defaultMessage: 'A flexible link field supporting URLs, files, and relations',
      },
      icon: PluginIcon,
      components: {
        // @ts-expect-error can't make it happy
        Input: async () => await import('./components/LinkField'),
      },
      options: {
        base: [],
        advanced: [
          {
            sectionTitle: {
              id: 'global.settings',
              defaultMessage: 'Settings',
            },
            items: [
              {
                name: 'required',
                type: 'checkbox',
                intlLabel: {
                  id: getTranslation('options.advanced.requiredField'),
                  defaultMessage: 'Required field',
                },
                description: {
                  id: getTranslation('options.advanced.requiredField.description'),
                  defaultMessage: "You won't be able to create an entry if this field is empty",
                },
              },
            ],
          },
        ],
      },
    })
  },

  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`)
          return { data, locale }
        } catch {
          return { data: {}, locale }
        }
      }),
    )
  },
}
