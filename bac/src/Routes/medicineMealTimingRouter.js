const express = require('express');
const createLookupController = require('../Controllers/createLookupController');
const authController = require('../Controllers/authController');

const controller = createLookupController({
  modelKey: 'medicineMealTiming',
  label: 'Meal timing',
  entity: 'MedicineMealTiming',
  defaults: ['Before Food', 'After Food', 'With Food', 'Anytime'],
});

const router = express.Router();

router.use(authController.softAuth);

router.route('/').get(controller.getAll).post(controller.create);
router.route('/:id').put(controller.update).delete(controller.remove);

module.exports = router;
