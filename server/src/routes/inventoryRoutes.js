const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
    getLocations, createLocation, updateLocation, deleteLocation,
    getStock, transferStock, adjustStock, clearAllStock,
    addSubLocation, deleteSubLocation, updateSubLocation, getTransferLogs,
    clearTransferHistory, deleteTransferLog
} = require('../controllers/inventoryController');

const router = express.Router();

router.use(authenticate);

// Locations
router.get('/locations', getLocations);
router.post('/locations', requireAdmin, createLocation);
router.put('/locations/:id', requireAdmin, updateLocation);
router.delete('/locations/:id', requireAdmin, deleteLocation);
router.post('/locations/:locationId/sublocations', requireAdmin, addSubLocation);
router.put('/sublocations/:id', requireAdmin, updateSubLocation);
router.delete('/sublocations/:id', requireAdmin, deleteSubLocation);

// Stock
router.get('/stock', getStock);
router.get('/stock/transfers', requireAdmin, getTransferLogs);
router.delete('/stock/transfers/clear', requireAdmin, clearTransferHistory);
router.delete('/stock/transfers/:id', requireAdmin, deleteTransferLog);
router.post('/stock/transfer', requireAdmin, transferStock);
router.post('/stock/adjust', requireAdmin, adjustStock);
router.delete('/stock/clear', requireAdmin, clearAllStock);

module.exports = router;
