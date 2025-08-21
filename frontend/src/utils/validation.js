export const validationRules = {
  email: {
    required: 'Email is required',
    pattern: {
      value: /^\S+@\S+$/i,
      message: 'Please enter a valid email address'
    }
  },
  password: {
    required: 'Password is required',
    minLength: {
      value: 8,
      message: 'Password must be at least 8 characters long'
    },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }
  },
  name: {
    required: 'Name is required',
    minLength: {
      value: 2,
      message: 'Name must be at least 2 characters long'
    },
    pattern: {
      value: /^[a-zA-Z\s]+$/,
      message: 'Name can only contain letters and spaces'
    }
  },
  confirmPassword: (password) => ({
    required: 'Please confirm your password',
    validate: value => value === password || 'Passwords do not match'
  })
}

export const validateForm = (data, rules) => {
  const errors = {}
  
  Object.keys(rules).forEach(field => {
    const value = data[field]
    const fieldRules = rules[field]
    
    // Required validation
    if (fieldRules.required && (!value || value.trim() === '')) {
      errors[field] = fieldRules.required
      return
    }
    
    // Skip other validations if field is empty and not required
    if (!value) return
    
    // Min length validation
    if (fieldRules.minLength && value.length < fieldRules.minLength.value) {
      errors[field] = fieldRules.minLength.message
      return
    }
    
    // Max length validation
    if (fieldRules.maxLength && value.length > fieldRules.maxLength.value) {
      errors[field] = fieldRules.maxLength.message
      return
    }
    
    // Pattern validation
    if (fieldRules.pattern && !fieldRules.pattern.value.test(value)) {
      errors[field] = fieldRules.pattern.message
      return
    }
    
    // Custom validation
    if (fieldRules.validate) {
      const result = fieldRules.validate(value)
      if (result !== true) {
        errors[field] = result
      }
    }
  })
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
