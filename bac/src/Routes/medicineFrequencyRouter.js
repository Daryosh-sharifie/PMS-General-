const express = require('express');
const createLookupController = require('../Controllers/createLookupController');
const authController = require('../Controllers/authController');

const controller = createLookupController({
  modelKey: 'medicineFrequency',
  label: 'Frequency',
  entity: 'MedicineFrequency',
  defaults: [
    '1x1',
    '1x2',
    '1x3',
    '1x4',
    '2x1',
    '2x2',
    '2x3',
    '3x1',
    '3x2',
    '3x3',
    'SOS',
    'PRN',
    'Q4H',
    'Q6H',
    'Q8H',
    'Q12H',
    'Q16H',
    'Q24H',
  ],
});

const router = express.Router();

router.use(authController.softAuth);

router.route('/').get(controller.getAll).post(controller.create);
router.route('/:id').put(controller.update).delete(controller.remove);

module.exports = router;
