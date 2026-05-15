import { ImageResponse } from 'next/og'

type Size = { width: number; height: number }

const sizes: Size[] = [
  { width: 32, height: 32 },
  { width: 192, height: 192 },
  { width: 512, height: 512 },
]

export function generateImageMetadata() {
  return sizes.map((size, id) => ({
    id: String(id),
    size,
    contentType: 'image/png' as const,
  }))
}

function IconContent({ size }: { size: Size }) {
  const fontSize = Math.round(size.width * 0.5)

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
        borderRadius: size.width * 0.2,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize,
        fontWeight: 800,
        color: 'white',
        letterSpacing: '-0.02em',
      }}
    >
      N
    </div>
  )
}

export default function Icon({ id }: { id: string }) {
  const size = sizes[Number(id)] ?? sizes[0]

  return new ImageResponse(<IconContent size={size} />, { ...size })
}
