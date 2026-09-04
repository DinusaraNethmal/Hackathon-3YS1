const express = require('express');
const { getAdminStatistics } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/statistics', getAdminStatistics);

module.exports = router;

