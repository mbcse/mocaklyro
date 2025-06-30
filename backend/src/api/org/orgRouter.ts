import { Router } from 'express';
import { OrgController } from './orgController.js';
import { PartnerController } from './partnerController.js';
import { authenticatePartner } from './authMiddleware.js';

const router = Router();
const orgController = new OrgController();
const partnerController = new PartnerController();

// Partner authentication routes (public)
router.post('/partner/signup', partnerController.signup.bind(partnerController));
router.post('/partner/login', partnerController.login.bind(partnerController));

// Protected partner routes
router.get('/partner/profile', authenticatePartner, partnerController.getProfile.bind(partnerController));

// KlyroGate management routes (protected)
router.post('/klyrogates', authenticatePartner, orgController.createKlyroGate.bind(orgController));
router.get('/klyrogates', authenticatePartner, orgController.getKlyroGates.bind(orgController));
router.put('/klyrogates/:id', authenticatePartner, orgController.updateKlyroGate.bind(orgController));
router.delete('/klyrogates/:id', authenticatePartner, orgController.deleteKlyroGate.bind(orgController));

// KlyroGate public routes (no auth needed)
router.get('/klyrogates/:slug', orgController.getKlyroGateBySlug.bind(orgController));

// KlyroGate verification routes (mixed auth)
router.post('/klyrogates/:slug/verify', orgController.verifyUserForGate.bind(orgController));
router.get('/klyrogates/:slug/verifications', authenticatePartner, orgController.getGateVerifications.bind(orgController));
router.get('/gates/:id/verifications', authenticatePartner, orgController.getGateVerificationsById.bind(orgController));
router.put('/verifications/:id/status', authenticatePartner, orgController.updateVerificationStatus.bind(orgController));

// Organization routes (protected)
router.get('/organizations/:id/gates', authenticatePartner, orgController.getOrganizationGates.bind(orgController));

// Credential Requirements route
router.get('/credential-requirements', orgController.getCredentialRequirements.bind(orgController));

export default router; 