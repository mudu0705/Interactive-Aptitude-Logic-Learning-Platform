import { Router } from 'express';
import {
  adminGetUsers,
  adminCreateQuestion,
  adminGenerateAIQuestion,
  adminUpdateUserRole,
  adminCreateWeeklyExam,
  adminImportQuestions,
  adminGetStudentAnalytics,
  adminSendNotification,
  adminExportResults,
  adminGetAuditLogs,
  claimCertificate,
  verifyCertificate,
} from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Student Admin management routes
router.get('/admin/users', authenticate, requireRole('ADMIN'), adminGetUsers);
router.put('/admin/users/role', authenticate, requireRole('ADMIN'), adminUpdateUserRole);

// Question Management routes
router.post('/admin/questions', authenticate, requireRole('ADMIN'), adminCreateQuestion);
router.post('/admin/questions/generate-ai', authenticate, requireRole('ADMIN'), adminGenerateAIQuestion);
router.post('/admin/questions/import', authenticate, requireRole('ADMIN'), adminImportQuestions);

// Weekly Exam routes
router.post('/admin/exams', authenticate, requireRole('ADMIN'), adminCreateWeeklyExam);
router.get('/admin/results/export', authenticate, requireRole('ADMIN'), adminExportResults);

// Analytics & Audit logs routes
router.get('/admin/analytics', authenticate, requireRole('ADMIN'), adminGetStudentAnalytics);
router.get('/admin/logs/audit', authenticate, requireRole('ADMIN'), adminGetAuditLogs);
router.post('/admin/notifications', authenticate, requireRole('ADMIN'), adminSendNotification);

// Certificate routes (public verification, authenticated claim)
router.post('/certificates/claim', authenticate, claimCertificate);
router.get('/certificates/verify/:id', verifyCertificate);

export default router;
