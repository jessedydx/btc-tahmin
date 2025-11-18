/** @jsxImportSource frog/jsx */

import { Button, Frog } from 'frog'
import { handle } from 'frog/vercel'
import { Redis } from '@upstash/redis'

// Eğer api klasöründeysen basePath: '/api' olmalı
export const app = new Frog({
  basePath: '/api',
  title: 'Bitcoin Tahmin',
})

app.frame('/', async (c) => {
  const { buttonValue, status } = c

  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    })

    if (status === 'response' && buttonValue) {
      await redis.incr(buttonValue)
    }

    const [rise, fall, stable] = await Promise.all([
      redis.get<number>('rise') || 0,
      redis.get<number>('fall') || 0,
      redis.get<number>('stable') || 0,
    ])

    const total = (Number(rise) + Number(fall) + Number(stable)) || 1

    return c.res({
      image: (
        <div
          style={{
            alignItems: 'center',
            background: 'linear-gradient(to bottom right, #1a1a2e, #16213e)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'center',
            width: '100%',
            color: 'white',
            fontFamily: 'sans-serif',
          }}
        >
          {status === 'initial' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 60, fontWeight: 900, marginBottom: 20 }}>BITCOIN YÖNÜ?</div>
              <div style={{ fontSize: 30, color: '#a29bfe' }}>Topluluk ne düşünüyor?</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', width: '80%' }}>
              <div style={{ fontSize: 40, marginBottom: 30, textAlign: 'center' }}>GÜNCEL SONUÇLAR</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 30 }}>
                <span>🚀 Yükselir:</span>
                <span>{rise} Oy (%{Math.round((Number(rise) / total) * 100)})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 30, marginTop: 20 }}>
                <span>📉 Düşer:</span>
                <span>{fall} Oy (%{Math.round((Number(fall) / total) * 100)})</span>
              </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 30, marginTop: 20 }}>
                <span>🦀 Sabit:</span>
                <span>{stable} Oy (%{Math.round((Number(stable) / total) * 100)})</span>
              </div>
            </div>
          )}
        </div>
      ),
      intents: [
        <Button value="rise">🚀 Yükselir</Button>,
        <Button value="fall">📉 Düşer</Button>,
        <Button value="stable">🦀 Sabit</Button>,
        status === 'response' && <Button.Reset>Yenile</Button.Reset>,
      ],
    })

  } catch (e) {
    return c.res({
      image: (
        <div style={{ color: 'white', backgroundColor: 'red', fontSize: 40, padding: 50 }}>
          HATA: .env Ayarları Eksik!
        </div>
      ),
      intents: [<Button.Reset>Tekrar Dene</Button.Reset>]
    })
  }
})

export const GET = handle(app)
export const POST = handle(app)