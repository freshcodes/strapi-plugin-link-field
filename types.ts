import { type UID } from '@strapi/strapi'

export type LinkFieldValue = {
  openInNewTab?: boolean | null
  linkType?: 'url' | 'file' | UID.ContentType | null
  relatedData?: LinkFieldRelatedData | null
  text?: string | null
  url?: string | null
}

export type LinkFieldRelatedData = {
  id?: number | null
  url?: string | null
  title?: string | null
  name?: string | null
  slug?: string | null
  [key: string]: unknown
}
