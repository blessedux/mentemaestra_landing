import {defineField, defineType} from 'sanity'

export const authorType = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'name'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      type: 'image',
    }),
    defineField({
      name: 'bio',
      type: 'array',
      of: [
        {
          type: 'block',
        },
      ],
    }),
    defineField({
      name: 'email',
      type: 'string',
    }),
    defineField({
      name: 'website',
      type: 'url',
    }),
    defineField({
      name: 'socialLinks',
      type: 'object',
      fields: [
        {
          name: 'twitter',
          type: 'url',
        },
        {
          name: 'github',
          type: 'url',
        },
        {
          name: 'linkedin',
          type: 'url',
        },
      ],
    }),
  ],
})
