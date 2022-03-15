var express = require('express');
var router = express.Router();

// Play route
router.get('/play', function (req, res) {
  res.sendFile("game.html", { root: "./public" });
})

module.exports = router;
