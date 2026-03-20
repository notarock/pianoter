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

export const theme = createTheme({
  primaryColor: 'terracotta',
  primaryShade: 8,

  colors: {
    terracotta,
  },

  fontFamily: 'Inter, sans-serif',
  headings: {
    fontFamily: 'Playfair Display, serif',
    fontWeight: '700',
  },

  defaultRadius: 'md',
  fontSmoothing: true,

  components: {
    // Give Paper a warm background by default
    Paper: {
      defaultProps: {
        bg: 'var(--app-bg-surface)',
      },
    },
  },
})
