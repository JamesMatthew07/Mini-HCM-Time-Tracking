/**
 * Validation Utility Functions
 */

import type { FormErrors } from '../types';

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Returns true if password is at least 6 characters
 */
export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Validate name (at least 2 characters)
 */
export function validateName(name: string): boolean {
  return Boolean(name && name.trim().length >= 2);
}

/**
 * Validate sign-up form
 */
export function validateSignUpForm(
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
  position: string
): FormErrors {
  const errors: FormErrors = {};

  if (!validateName(name)) {
    errors.name = 'Name must be at least 2 characters long';
  }

  if (!email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (!validatePassword(password)) {
    errors.password = 'Password must be at least 6 characters long';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (!position) {
    errors.position = 'Please select your position';
  }

  return errors;
}

/**
 * Validate sign-in form
 */
export function validateSignInForm(email: string, password: string): FormErrors {
  const errors: FormErrors = {};

  if (!email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (!validatePassword(password)) {
    errors.password = 'Password must be at least 6 characters long';
  }

  return errors;
}

/**
 * Check if form has any errors
 */
export function hasFormErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}
