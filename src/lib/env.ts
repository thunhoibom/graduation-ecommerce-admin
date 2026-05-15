const nextAuthUrl = process.env.NEXTAUTH_URL?.trim()

if (!nextAuthUrl) {
  process.env.NEXTAUTH_URL = 'http://localhost:3001'
}
