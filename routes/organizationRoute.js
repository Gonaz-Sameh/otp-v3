const express = require('express');
const {
  getOrganizations,
  createOrganization,getOrganization,organizationWhatsappAuth,organizationEmailAuth
} = require('../services/organizationService');

const router = express.Router();

router
  .route('/')
  .get(getOrganizations)
  .post(createOrganization);
  router
  .route('/:id')
  .get(getOrganization);
  router
  .route('/:organizationId/whatsappAuth')
  .post(organizationWhatsappAuth);
  router
  .route('/:organizationId/emailAuth')
  .post(organizationEmailAuth);

module.exports = router;
