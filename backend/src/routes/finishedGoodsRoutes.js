const express = require('express');
const router = express.Router();
const finishedGoodsController = require('../controllers/finishedGoodsController');

router.get('/', finishedGoodsController.getFinishedGoods);
router.post('/', finishedGoodsController.createFinishedGood);
router.put('/:id', finishedGoodsController.updateFinishedGood);
router.get('/options', finishedGoodsController.getComponentOptions);
router.delete('/:id', finishedGoodsController.deleteFinishedGood);

module.exports = router;
