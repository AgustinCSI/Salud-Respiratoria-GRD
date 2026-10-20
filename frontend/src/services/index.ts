import type { DashboardService } from '../types/dashboard.ts';
import { mockService } from './mockService.ts';

// Punto único de sustitución. Una implementación HTTP futura deberá satisfacer
// DashboardService y validar las respuestas antes de entregarlas a las pantallas.
export const dashboardService: DashboardService = mockService;
