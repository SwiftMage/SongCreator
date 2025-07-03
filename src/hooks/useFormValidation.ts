import { useState, useCallback } from 'react'

interface ValidationRule<T = any> {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: T) => string | null
  message?: string
}

interface ValidationConfig {
  [key: string]: ValidationRule
}

interface ValidationErrors {
  [key: string]: string | null
}

interface FormState {
  [key: string]: any
}

export function useFormValidation<T extends FormState>(
  initialState: T,
  validationConfig: ValidationConfig
) {
  const [values, setValues] = useState<T>(initialState)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({})

  const validateField = useCallback((name: string, value: any): string | null => {
    const rules = validationConfig[name]
    if (!rules) return null

    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return rules.message || `${name} is required`
    }

    // Skip other validations if value is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null
    }

    // String-specific validations
    if (typeof value === 'string') {
      // Min length validation
      if (rules.minLength && value.length < rules.minLength) {
        return rules.message || `${name} must be at least ${rules.minLength} characters`
      }

      // Max length validation
      if (rules.maxLength && value.length > rules.maxLength) {
        return rules.message || `${name} must be no more than ${rules.maxLength} characters`
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        return rules.message || `${name} format is invalid`
      }
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value)
    }

    return null
  }, [validationConfig])

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {}
    let isValid = true

    Object.keys(validationConfig).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName])
      newErrors[fieldName] = error
      if (error) isValid = false
    })

    setErrors(newErrors)
    return isValid
  }, [values, validationConfig, validateField])

  const handleChange = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))

    // Real-time validation for touched fields
    if (touched[name]) {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }, [touched, validateField])

  const handleBlur = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    
    // Validate on blur
    const error = validateField(name, values[name])
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [values, validateField])

  const reset = useCallback(() => {
    setValues(initialState)
    setErrors({})
    setTouched({})
  }, [initialState])

  const getFieldProps = useCallback((name: string) => ({
    value: values[name] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
      handleChange(name, e.target.value),
    onBlur: () => handleBlur(name),
    error: touched[name] ? errors[name] : null,
    isValid: touched[name] && !errors[name],
    'aria-invalid': touched[name] && !!errors[name],
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  }), [values, errors, touched, handleChange, handleBlur])

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    reset,
    getFieldProps,
    isValid: Object.values(errors).every(error => !error),
    hasErrors: Object.values(errors).some(error => !!error),
  }
}

// Common validation rules
export const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  password: {
    required: true,
    minLength: 8,
    message: 'Password must be at least 8 characters long'
  },
  songTitle: {
    required: true,
    minLength: 3,
    maxLength: 100,
    message: 'Song title must be between 3 and 100 characters'
  },
  lyrics: {
    maxLength: 2000,
    message: 'Lyrics must be no more than 2000 characters'
  },
  required: (fieldName: string) => ({
    required: true,
    message: `${fieldName} is required`
  })
}