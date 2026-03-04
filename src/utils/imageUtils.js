export function sanitizeUri(uri) {
  if (!uri) return null
  let u = String(uri)
  // remove template markers like ${process.env.PUBLIC_URL}
  u = u.replace(/\$\{process\.env\.PUBLIC_URL\}/g, '')
  u = u.replace(/^undefined/, '')
  u = u.trim()
  if (!u) return null
  // If relative path starting with /images, leave it — DateIdeaBox will handle remote fallback
  return u
}

export default { sanitizeUri }
