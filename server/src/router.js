import express from 'express';

import fetchRouter from './routes/fetch';
import helloRouter from './routes/hello';

const router = new express.Router();

router.use(fetchRouter);
router.use(helloRouter);

export default router;
