import { z } from 'zod';

export const eventFormSchema = z
  .object({
    eventName: z.string().trim().min(1, 'Event name is required.'),
    startDate: z.string().min(1, 'Start date is required.'),
    endDate: z.string().min(1, 'End date is required.'),
    venueId: z.string().min(1, 'Please select a venue.'),
    budget: z
      .string()
      .min(1, 'Budget is required.')
      .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0, {
        message: 'Budget must be zero or greater.',
      }),
    eventType: z.string().refine((value) => ['0', '1', '2', '3', '4', '5'].includes(value), {
      message: 'Please select an event type.',
    }),
    orgId: z.string(),
  })
  .refine((values) => new Date(values.endDate) > new Date(values.startDate), {
    path: ['endDate'],
    message: 'End date must be after the start date.',
  });

export type EventFormData = z.infer<typeof eventFormSchema>;
