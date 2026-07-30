/** Minimal toast stand-in (apps can wrap UI with their own notifications). */
export const toast = {
  error: (message: string) => {
    console.error(message)
  },
  success: (message: string) => {
    console.info(message)
  },
}
