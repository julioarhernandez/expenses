import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nova Expenses',
    short_name: 'Nova',
    description: 'Personal business expense tracker',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#09090b',
    theme_color: '#09090b',
    categories: ['finance', 'productivity', 'business'],
    icons: [
      {
        src: '/icon/0',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/icon/1',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon/2',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon/2',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Add Expense',
        short_name: 'Add',
        description: 'Quickly add a new expense',
        url: '/expenses?new=true',
        icons: [{ src: '/icon/1', sizes: '192x192' }],
      },
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'View spending overview',
        url: '/dashboard',
        icons: [{ src: '/icon/1', sizes: '192x192' }],
      },
    ],
  }
}
