/**
 * useAuthForm Hook
 * Custom hook for authentication form logic
 */

import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { FirebaseService } from '../services/firebase.service';
import type { FormData, FormErrors, User } from '../types';
import {
  validateSignUpForm,
  validateSignInForm,
  hasFormErrors
} from '../utils/validation.utils';
import { ADMIN_CREDENTIALS, DEFAULT_SCHEDULE, DEFAULT_TIMEZONE } from '../config/constants';

export function useAuthForm(onAuthSuccess: (user: User) => void) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    position: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    let newErrors: FormErrors;

    if (isSignUp) {
      newErrors = validateSignUpForm(
        formData.name || '',
        formData.email,
        formData.password,
        formData.confirmPassword || '',
        formData.position || ''
      );
    } else {
      newErrors = validateSignInForm(formData.email, formData.password);
    }

    setErrors(newErrors);
    return !hasFormErrors(newErrors);
  };

  const handleSignUp = async () => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      formData.email,
      formData.password
    );
    const firebaseUser = userCredential.user;

    // Save user data to Firestore
    await FirebaseService.saveUser(firebaseUser.uid, {
      name: formData.name || 'User',
      email: formData.email,
      role: 'employee',
      position: formData.position,
      timezone: DEFAULT_TIMEZONE,
      schedule: DEFAULT_SCHEDULE
    });

    alert('Account Creation Successful!');

    onAuthSuccess({
      name: formData.name || 'User',
      email: formData.email,
      role: 'user',
      position: formData.position,
      userId: firebaseUser.uid
    });
  };

  const handleSignIn = async () => {
    // Check for admin credentials first
    if (
      formData.email === ADMIN_CREDENTIALS.email &&
      formData.password === ADMIN_CREDENTIALS.password
    ) {
      alert('Admin Login Successful!');
      onAuthSuccess({
        name: 'Administrator',
        email: formData.email,
        role: 'admin'
      });
      return;
    }

    // Regular user login
    const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
    const firebaseUser = userCredential.user;

    // Fetch user data from Firestore
    const userData = await FirebaseService.getUser(firebaseUser.uid);

    alert('Logged In Successful!');

    onAuthSuccess({
      name: userData?.name || formData.email.split('@')[0],
      email: formData.email,
      role: 'user',
      position: userData?.position,
      userId: firebaseUser.uid
    });
  };

  const handleFirebaseError = (error: any): string => {
    if (!error.code) {
      return `Authentication failed: ${error.message}`;
    }

    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please sign in instead or use a different email.';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please sign up first.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      default:
        return `Authentication failed: ${error.message}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      if (isSignUp) {
        await handleSignUp();
      } else {
        await handleSignIn();
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      const errorMessage = handleFirebaseError(error);
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      position: ''
    });
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return {
    isSignUp,
    showPassword,
    showConfirmPassword,
    formData,
    errors,
    isLoading,
    handleInputChange,
    handleSubmit,
    toggleMode,
    setShowPassword,
    setShowConfirmPassword
  };
}
