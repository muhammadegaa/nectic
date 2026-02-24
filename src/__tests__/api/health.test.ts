import { describe, it, expect } from 'vitest'
import { GET } from '@/app/api/health/route'
import { NextRequest } from 'next/server'

describe('Health Check API', () => {
  it('should return 200 with health status', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('status')
    expect(['healthy', 'missing_config']).toContain(data.status)
  })
})


import { NextRequest } from 'next/server'

describe('Health Check API', () => {
  it('should return 200 with health status', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('status')
    expect(['healthy', 'missing_config']).toContain(data.status)
  })
})

