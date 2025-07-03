import React from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  error?: string | null
  isValid?: boolean
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onChange?: (value: string) => void
  showValidationIcon?: boolean
}

export function FormInput({
  label,
  error,
  isValid,
  hint,
  leftIcon,
  rightIcon,
  onChange,
  showValidationIcon = true,
  className = '',
  ...props
}: FormInputProps) {
  const hasError = !!error
  const showSuccess = isValid && !hasError && showValidationIcon

  const inputClasses = `
    w-full px-4 py-3 rounded-lg border transition-all duration-200
    ${leftIcon ? 'pl-12' : ''}
    ${rightIcon || showValidationIcon ? 'pr-12' : ''}
    ${hasError 
      ? 'border-red-500 bg-red-50 dark:bg-red-950/20 focus:border-red-500 focus:ring-red-500/20' 
      : showSuccess 
        ? 'border-green-500 bg-green-50 dark:bg-green-950/20 focus:border-green-500 focus:ring-green-500/20'
        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-purple-500 focus:ring-purple-500/20'
    }
    text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
    focus:outline-none focus:ring-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${className}
  `.trim()

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
            {leftIcon}
          </div>
        )}
        
        <input
          {...props}
          onChange={onChange ? (e) => onChange(e.target.value) : props.onChange}
          className={inputClasses}
        />
        
        {(rightIcon || showValidationIcon) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {rightIcon || (showValidationIcon && (
              <>
                {hasError && <AlertCircle className="h-5 w-5 text-red-500" />}
                {showSuccess && <CheckCircle className="h-5 w-5 text-green-500" />}
              </>
            ))}
          </div>
        )}
      </div>
      
      {(error || hint) && (
        <div className="text-sm">
          {error ? (
            <p className="text-red-600 dark:text-red-400 flex items-start gap-1">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {error}
            </p>
          ) : hint ? (
            <p className="text-gray-500 dark:text-gray-400">{hint}</p>
          ) : null}
        </div>
      )}
    </div>
  )
}

interface FormTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: string
  error?: string | null
  isValid?: boolean
  hint?: string
  onChange?: (value: string) => void
  showValidationIcon?: boolean
  showCharCount?: boolean
  maxLength?: number
}

export function FormTextarea({
  label,
  error,
  isValid,
  hint,
  onChange,
  showValidationIcon = true,
  showCharCount = false,
  maxLength,
  className = '',
  ...props
}: FormTextareaProps) {
  const hasError = !!error
  const showSuccess = isValid && !hasError && showValidationIcon
  const charCount = (props.value as string)?.length || 0

  const textareaClasses = `
    w-full px-4 py-3 rounded-lg border transition-all duration-200 resize-none
    ${hasError 
      ? 'border-red-500 bg-red-50 dark:bg-red-950/20 focus:border-red-500 focus:ring-red-500/20' 
      : showSuccess 
        ? 'border-green-500 bg-green-50 dark:bg-green-950/20 focus:border-green-500 focus:ring-green-500/20'
        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-purple-500 focus:ring-purple-500/20'
    }
    text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
    focus:outline-none focus:ring-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${className}
  `.trim()

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {showCharCount && maxLength && (
            <span className={`text-xs ${
              charCount > maxLength ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      )}
      
      <div className="relative">
        <textarea
          {...props}
          onChange={onChange ? (e) => onChange(e.target.value) : props.onChange}
          className={textareaClasses}
        />
        
        {showValidationIcon && (
          <div className="absolute right-3 top-3">
            {hasError && <AlertCircle className="h-5 w-5 text-red-500" />}
            {showSuccess && <CheckCircle className="h-5 w-5 text-green-500" />}
          </div>
        )}
      </div>
      
      {(error || hint) && (
        <div className="text-sm">
          {error ? (
            <p className="text-red-600 dark:text-red-400 flex items-start gap-1">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {error}
            </p>
          ) : hint ? (
            <p className="text-gray-500 dark:text-gray-400">{hint}</p>
          ) : null}
        </div>
      )}
    </div>
  )
}