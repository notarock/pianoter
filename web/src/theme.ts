import { createTheme, type MantineColorsTuple } from '@mantine/core'

// Terracotta scale — built around #C2410C (burnt orange)
const terracotta: MantineColorsTuple = [
  '#fff1ec',
  '#ffe0d3',
  '#fbbfa6',
  '#f79b75',
  '#f47c4b',
  '#f26a30',
  '#f26021',
  '#d75017',
  '#C2410C', // [8] — primary shade
  '#9A3412', // [9] — hover / dark shade
]

// Warm gray — replaces Mantine's cool blue-tinted default gray
const warmGray: MantineColorsTuple = [
  '#f8f6f4',
  '#ede8e4',
  '#dcd5cf',
  '#c4bbb4',
  '#a89f98',
  '#8c837b',
  '#736b63',
  '#5a5249',
  '#423c35',
  '#2b2520',
]

export const theme = createTheme({
  primaryColor: 'terracotta',
  primaryShade: 8,

  colors: {
    terracotta,
    gray: warmGray,
  },

  fontFamily: 'Inter, sans-serif',
  headings: {
    fontFamily: 'Playfair Display, serif',
    fontWeight: '700',
  },

  defaultRadius: 'md',
  fontSmoothing: true,

  components: {
    Paper: {
      defaultProps: {
        bg: 'var(--app-bg-surface)',
      },
    },
  },
})
