import { Router } from 'express';
import { OrderController } from './order.controller.js';
import { authenticate, requirePermission } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.js';
import { createOrderSchema } from './order.schema.js';

const router = Router();


router.use(authenticate);

// Create Order 
router.post('/', 
  requirePermission('order.create'), 
  validate(createOrderSchema), 
  OrderController.createOrder
);


router.get('/', 
  // requirePermission('order.view'), 
  OrderController.getOrders
);

export default router;