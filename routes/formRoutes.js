import express from 'express';
import { submitForm } from '../controllers/formController.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post('/', upload.single('logo'), submitForm);

export default router;
