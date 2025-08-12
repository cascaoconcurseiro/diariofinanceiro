import { Router } from 'express';
import { authRoutes } from './auth';
import { userRoutes } from './userRoutes';
import { transactionRoutes } from './transactionRoutes';
import { recurringTransactionRoutes } from './recurringTransactionRoutes';
import syncRoutes from './syncRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/transactions', transactionRoutes);
router.use('/recurring-transactions', recurringTransactionRoutes);
router.use('/', syncRoutes);

export { router as apiRoutes };