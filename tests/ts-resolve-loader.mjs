// Node strips TypeScript types but needs help resolving extensionless local imports.
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !/\.[a-z0-9]+$/i.test(specifier)) {
    try { return await nextResolve(`${specifier}.ts`, context) } catch { /* Try the original specifier. */ }
  }
  return nextResolve(specifier, context)
}
