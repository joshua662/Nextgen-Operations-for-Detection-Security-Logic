export const isRequired = (value: string): boolean => value.trim().length > 0

export const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

export const validateLoginForm = (username: string, password: string): Record<string, string[]> => {
  const errors: Record<string, string[]> = {}
  if (!isRequired(username)) errors.username = ['Username is required.']
  if (!isRequired(password)) errors.password = ['Password is required.']
  return errors
}
