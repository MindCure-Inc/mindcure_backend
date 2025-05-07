import { z } from 'zod';

export enum ScenarioStates {
    START = 'START',
    CONTINUE = 'CONTINUE'
}

export const AppointmentSchema = z.object({
    userId: z.string(),
    therapistId: z.string(),
    appointmentDate: z.string().transform((date) => new Date(date)),
    status: z.enum(['pending', 'confirmed', 'canceled', "completed"]).default('pending')
});

export const AvailabilitySchema = z.object({
    therapistId: z.string(),
    availability: z.array(z.object({
        dayOfWeek: z.string(),
        startTime: z.string(),
        endTime: z.string()
    }))
});

export interface User {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
}

export interface Appointment {
    id: number;
    userId: string;
    therapistId: string;
    appointmentDate: Date;
    status: 'pending' | 'confirmed' | 'canceled';
    createdAt: Date;
}

export interface TherapistAvailability {
    id: number;
    therapistId: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
}

export interface EmailConfig {
    to: string;
    appointmentDate: Date;
    userName?: string;
    time?: string;
    location?: string;
}

export interface ChatMessage {
    role: 'user' | 'system' | 'assistant';
    content: string;
}

export interface SystemPrompt {
    role: 'system';
    parts: { text: string }[];
}

export interface GeminiResponse {
    candidates?: {
        content?: {
            parts?: { text?: string }[];
        };
    }[];
}