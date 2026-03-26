import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { SignJWT, importPKCS8 } from 'jose'

const MAPKIT_CONFIG_PATH = resolve(process.cwd(), 'src/config/mapkit.json')

const requiredEnv = ['APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_PRIVATE_KEY_PATH']

const missing = requiredEnv.filter((key) => !process.env[key]?.trim())
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`)
  console.error('Example: APPLE_TEAM_ID=XXXX APPLE_KEY_ID=YYYY APPLE_PRIVATE_KEY_PATH=./AuthKey_YYYY.p8 npm run mapkit:token')
  process.exit(1)
}

const teamId = process.env.APPLE_TEAM_ID.trim()
const keyId = process.env.APPLE_KEY_ID.trim()
const privateKeyPath = resolve(process.cwd(), process.env.APPLE_PRIVATE_KEY_PATH.trim())
const ttlSeconds = Number(process.env.MAPKIT_TOKEN_TTL_SECONDS || 3600)

if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
  console.error('MAPKIT_TOKEN_TTL_SECONDS must be a positive number.')
  process.exit(1)
}

if (ttlSeconds > 60 * 60 * 24 * 180) {
  console.error('MAPKIT_TOKEN_TTL_SECONDS is too high. Keep it under 180 days.')
  process.exit(1)
}

const privateKeyPem = await readFile(privateKeyPath, 'utf8')
const privateKey = await importPKCS8(privateKeyPem, 'ES256')

const now = Math.floor(Date.now() / 1000)
const exp = now + Math.floor(ttlSeconds)

const token = await new SignJWT({})
  .setProtectedHeader({ alg: 'ES256', kid: keyId, typ: 'JWT' })
  .setIssuer(teamId)
  .setIssuedAt(now)
  .setExpirationTime(exp)
  .sign(privateKey)

const configRaw = await readFile(MAPKIT_CONFIG_PATH, 'utf8')
const config = JSON.parse(configRaw)
config.jwtToken = token

await writeFile(MAPKIT_CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, 'utf8')

console.log('MapKit token generated and saved to src/config/mapkit.json')
console.log(`Expires at (unix): ${exp}`)
