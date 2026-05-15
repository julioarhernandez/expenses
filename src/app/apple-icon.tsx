import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  const fontSize = Math.round(size.width * 0.5)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize,
          fontWeight: 800,
          color: 'white',
          letterSpacing: '-0.02em',
        }}
      >
        N
      </div>
    ),
    { ...size }
  )
}
