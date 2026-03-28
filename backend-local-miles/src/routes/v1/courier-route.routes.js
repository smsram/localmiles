const express = require('express');
const router = express.Router();
const courierRouteController = require('../../controllers/courier-route.controller');
const { protect } = require('../../middlewares/auth.middleware');

// All courier route management requires being logged in
router.use(protect);

router.post('/', courierRouteController.createRoute);
router.get('/', courierRouteController.getRoutes);
router.put('/:id/toggle', courierRouteController.toggleRoute);
router.delete('/:id', courierRouteController.deleteRoute);
router.put('/:id', courierRouteController.updateRoute);

module.exports = router;