import type { LinkFieldValue, LinkFieldRelatedData } from '../../../types'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Field,
  Flex,
  SingleSelect,
  SingleSelectOption,
  TextInput,
  Typography,
  Box,
  Button,
} from '@strapi/design-system'
import { File } from '@strapi/icons'
import { useFetchClient, useStrapiApp } from '@strapi/strapi/admin'
import { Checkbox } from '@strapi/design-system'

interface LinkFieldProps {
  name: string
  value: LinkFieldValue
  hint?: string
  onChange: (name: string, value: LinkFieldValue) => void
  error?: string
  disabled?: boolean
  required?: boolean
}

const LinkField: React.FC<LinkFieldProps> = (props) => {
  const {
    name = '',
    hint = '',
    onChange = () => {},
    error,
    disabled = false,
    required = false,
  } = props

  const value =
    props.value ||
    ({
      openInNewTab: false,
      linkType: 'url',
      relatedData: null,
      text: '',
      url: '',
    } as LinkFieldValue)

  const { get, post } = useFetchClient()

  // State for resources
  const [relations, setRelations] = useState<string[]>([])
  const [relationOptions, setRelationOptions] = useState<LinkFieldRelatedData[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoadingRelations, setIsLoadingRelations] = useState(false)
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)

  // Refs for URL generation debouncing and loop prevention
  const isGeneratingUrlRef = useRef(false)
  const lastGeneratedValueRef = useRef<string>('')

  // Build link types including relations
  const linkTypes = [
    { value: 'url', label: 'URL' },
    { value: 'file', label: 'File' },
    ...relations.map((rel) => ({
      value: rel,
      label:
        rel
          .split('.')
          .pop()
          ?.replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase()) || rel,
    })),
  ]

  // Fetch available relations
  const fetchRelations = useCallback(async () => {
    if (isInitialized || isLoadingRelations) return

    setIsLoadingRelations(true)
    try {
      const { data } = await get('/link-field/relations')
      setRelations(data.relations || [])
      setIsInitialized(true)
    } catch (error) {
      console.error('Failed to fetch relations:', error)
      setRelations([])
      setIsInitialized(true)
    } finally {
      setIsLoadingRelations(false)
    }
  }, [get, isInitialized, isLoadingRelations])

  // Fetch relation options for a specific relation
  const fetchRelationOptions = useCallback(
    async (relationKey: string, search?: string) => {
      try {
        const params = search ? `?search=${encodeURIComponent(search)}` : ''
        const { data } = await get(`/link-field/relations/${relationKey}/options${params}`)
        setRelationOptions(data.options || [])
      } catch (error) {
        console.error('Failed to fetch relation options:', error)
        setRelationOptions([])
      }
    },
    [get],
  )

  // Generate URL for resources only
  const generateUrl = useCallback(async () => {
    if (!value.linkType || !value.relatedData?.id || isGeneratingUrlRef.current) {
      return
    }

    // Only generate URL for relation types (not url or file)
    if (value.linkType === 'url' || value.linkType === 'file') {
      return
    }

    // Create a hash of the current value to compare
    const currentValueHash = JSON.stringify({
      linkType: value.linkType,
      relatedDataId: value.relatedData?.id,
    })

    // Don't regenerate if the relevant data hasn't changed
    if (currentValueHash === lastGeneratedValueRef.current) {
      return
    }

    isGeneratingUrlRef.current = true
    lastGeneratedValueRef.current = currentValueHash

    try {
      const { data } = await post('/link-field/generate-url', {
        fieldData: value,
      })
      const newGeneratedUrl = data.generatedUrl || ''

      // Update the url field with the generated URL
      if (newGeneratedUrl !== value.url) {
        const updatedValue = { ...value, url: newGeneratedUrl }
        onChange(name, updatedValue)
      }
    } catch (error) {
      console.error('Failed to generate URL:', error)
      // Clear URL on error for resources
      if (value.url) {
        const updatedValue = { ...value, url: '' }
        onChange(name, updatedValue)
      }
    } finally {
      isGeneratingUrlRef.current = false
    }
  }, [value, post, name, onChange])

  // Initialize relations on mount
  useEffect(() => {
    fetchRelations()
  }, [fetchRelations])

  // Fetch relation options when linkType changes to a relation
  useEffect(() => {
    if (
      value.linkType &&
      value.linkType !== 'url' &&
      value.linkType !== 'file' &&
      relations.includes(value.linkType)
    ) {
      fetchRelationOptions(value.linkType)
    } else {
      setRelationOptions([])
    }
  }, [value.linkType, relations, fetchRelationOptions])

  // Handle URL generation and file URL setting
  useEffect(() => {
    if (!value.linkType) {
      return
    }

    // For file type, set URL directly from relatedData
    if (value.linkType === 'file' && value.relatedData?.url) {
      if (value.url !== value.relatedData.url) {
        const updatedValue = { ...value, url: value.relatedData.url }
        onChange(name, updatedValue)
      }
      return
    }

    // For relation types, generate URL via API
    if (value.linkType !== 'url' && value.linkType !== 'file' && value.relatedData?.id) {
      generateUrl()
      return
    }

    // Clear URL if no required data
    if (value.linkType === 'file' && !value.relatedData?.url && value.url) {
      const updatedValue = { ...value, url: '' }
      onChange(name, updatedValue)
    }
  }, [
    value.linkType,
    value.relatedData?.id,
    value.relatedData?.url,
    generateUrl,
    value.url,
    onChange,
    name,
  ])

  // Memoize the handleChange function
  const handleChange = useCallback(
    (field: string, fieldValue: unknown) => {
      const newValue = { ...value, [field]: fieldValue }

      // Clear related fields when link type changes
      if (field === 'linkType') {
        delete newValue.relatedData
        // Only clear URL if it's not a manual URL type
        if (value.linkType !== 'url') {
          delete newValue.url
        }
        lastGeneratedValueRef.current = ''
      }

      onChange(name, newValue)
    },
    [value, onChange, name],
  )

  const handleFileSelect = useCallback(
    (files: unknown[]) => {
      if (files.length > 0) {
        handleChange('relatedData', files[0])
      }
      setShowMediaLibrary(false)
    },
    [handleChange],
  )

  const openMediaLibrary = useCallback(() => {
    setShowMediaLibrary(true)
  }, [])

  const handleCheckboxChange = useCallback(
    (checked: boolean) => {
      const newValue = { ...value, openInNewTab: checked }
      onChange(name, newValue)
    },
    [value, onChange, name],
  )

  const renderConditionalField = () => {
    switch (value.linkType) {
      case 'url':
        return (
          <TextInput
            placeholder='e.g., /contact-us or https://example.com'
            value={value.url || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChange('url', e.target.value)
            }
            disabled={disabled}
          />
        )
      case 'file':
        return (
          <Flex direction='column' alignItems='stretch' gap={2}>
            <Button
              variant='secondary'
              startIcon={<File />}
              size='L'
              onClick={openMediaLibrary}
              disabled={disabled}
              style={{ justifyContent: 'flex-start' }}
            >
              {value.relatedData ? value.relatedData.name : 'Select File'}
            </Button>
          </Flex>
        )
      default:
        if (value.linkType && relations.includes(value.linkType)) {
          return (
            <SingleSelect
              placeholder='Select item'
              value={value.relatedData?.id?.toString() || ''}
              onChange={(selectedId: string) => {
                const selected = relationOptions.find((opt) => opt.id?.toString() === selectedId)
                handleChange('relatedData', selected)
              }}
              disabled={disabled}
              onInputChange={(search: string) => {
                fetchRelationOptions(value.linkType!, search)
              }}
            >
              {relationOptions.map((option) => (
                <SingleSelectOption key={option.id} value={option.id?.toString()}>
                  {option.title || option.name || option.slug || `Item ${option.id}`}
                </SingleSelectOption>
              ))}
            </SingleSelect>
          )
        }
        return <TextInput placeholder='Select a link type first' disabled={true} />
    }
  }

  // Get MediaLibraryDialog safely
  let MediaLibraryDialog: React.ComponentType<{
    allowedTypes: string[]
    onClose: () => void
    onSelectAssets: (assets: unknown[]) => void
  }> | null = null
  try {
    const components = useStrapiApp('MediaLibraryDialog', (state) => state.components)
    MediaLibraryDialog =
      (components['media-library'] as React.ComponentType<{
        allowedTypes: string[]
        onClose: () => void
        onSelectAssets: (assets: unknown[]) => void
      }>) || null
  } catch (error) {
    console.warn('MediaLibraryDialog not available:', error)
  }

  return (
    <Field.Root name={name} id={name} error={error} hint={hint} required={required}>
      <Flex direction='column' alignItems='stretch' gap={4}>
        <Box>
          <Field.Label>Link Text</Field.Label>
          <TextInput
            placeholder='Enter link text'
            value={value.text || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChange('text', e.target.value)
            }
            disabled={disabled}
          />
        </Box>

        <Box>
          <Field.Label>Link</Field.Label>
          <Flex gap={2} alignItems='start'>
            <Box style={{ minWidth: '120px', maxWidth: '150px' }}>
              <SingleSelect
                placeholder='Type'
                value={value.linkType || ''}
                onChange={(linkType: string) => handleChange('linkType', linkType)}
                disabled={disabled || isLoadingRelations}
              >
                {linkTypes.map((type) => (
                  <SingleSelectOption key={type.value} value={type.value}>
                    {type.label}
                  </SingleSelectOption>
                ))}
              </SingleSelect>
            </Box>
            <Box style={{ flex: 1 }}>{renderConditionalField()}</Box>
          </Flex>
        </Box>

        <Flex gap={2} justifyContent='space-between'>
          <Checkbox
            checked={Boolean(value.openInNewTab)}
            onCheckedChange={handleCheckboxChange}
            disabled={disabled}
          >
            Open in new tab
          </Checkbox>
          <Box>
            <Typography variant='pi' textColor='neutral600' fontWeight='bold'>
              {value.url}
            </Typography>
          </Box>
        </Flex>
      </Flex>

      {showMediaLibrary && MediaLibraryDialog && (
        <MediaLibraryDialog
          allowedTypes={['files', 'images', 'videos', 'audios']}
          onClose={() => setShowMediaLibrary(false)}
          onSelectAssets={handleFileSelect}
        />
      )}

      {error && <Field.Error />}
      {hint && <Field.Hint />}
    </Field.Root>
  )
}

export default LinkField
