import { z } from 'zod';
import { CONSENT_STATUSES, DELIVERY_CONTEXTS } from './enums';

/** Validation schemas for user-submitted forms. Keep messages plain-language. */

export const registrationSchema = z.object({
  firstName: z.string().trim().min(1, 'Please enter your first name.').max(100),
  lastName: z.string().trim().min(1, 'Please enter your last name.').max(100),
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(10, 'Please use at least 10 characters for your password.'),
});
export type RegistrationInput = z.infer<typeof registrationSchema>;

export const signInSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Please enter your password.'),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const checkInSchema = z.object({
  moodRating: z.number().int().min(1).max(5).nullable(),
  cravingRating: z.number().int().min(1).max(5).nullable(),
  note: z.string().trim().max(2000).optional(),
  deliveryContext: z.enum(DELIVERY_CONTEXTS).default('vrcc'),
});
export type CheckInInput = z.infer<typeof checkInSchema>;

export const consentDecisionSchema = z.object({
  consentTypeId: z.number().int().positive(),
  status: z.enum(CONSENT_STATUSES),
  documentVersion: z.string().max(50).nullable().optional(),
});
export type ConsentDecisionInput = z.infer<typeof consentDecisionSchema>;

export const goalSchema = z.object({
  title: z.string().trim().min(1, 'Please give your goal a name.').max(200),
  detail: z.string().trim().max(4000).optional(),
  targetDate: z.string().date().nullable().optional(),
});
export type GoalInput = z.infer<typeof goalSchema>;
