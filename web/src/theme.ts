import { createTheme, type MantineColorsTuple } from '@mantine/core'

// Warm gray — replaces Mantine's cool blue-tinted default gray
// Shade 9 (#2b2520) doubles as the primary "black" accent
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
  primaryColor: 'gray',
  primaryShade: 9,

  colors: {
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
