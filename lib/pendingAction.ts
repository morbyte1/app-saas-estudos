export function createPendingAction() {
  let pending = false
  return async (action: () => Promise<unknown> | unknown) => {
    if (pending) return false
    pending = true
    try {
      await action()
      return true
    } finally {
      pending = false
    }
  }
}
