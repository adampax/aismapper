var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  db.getStations(req, res);
});

module.exports = router;
