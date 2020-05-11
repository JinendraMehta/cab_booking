const {STATUS_CODES, STATUS_MESSAGES} = require('../utils/consts');

module.exports = (req, res) => {
  let {page = 1, limit = 10} = req.query;
  let fullUrlString = req.protocol + '://' + req.get('host') + req.originalUrl;
  let fullUrlObj = new URL(fullUrlString);
  let rawResults = req.rawResults;

  page = parseInt(page);
  limit = parseInt(limit);

  if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
    return res.status(STATUS_CODES.BAD_REQUEST).send(STATUS_MESSAGES.BAD_REQUEST);
  }

  fullUrlObj.searchParams.set('page', page);
  fullUrlObj.searchParams.set('limit', limit);

  let offset = (page - 1) * limit;

  let pagination = {};
  pagination.totalResults = rawResults.length;
  let results = rawResults.slice(offset, offset + limit);
  let last = Math.ceil(rawResults.length / limit) || 1;

  pagination.current = fullUrlObj.toString();
  fullUrlObj.searchParams.set('page', '1');
  pagination.first = fullUrlObj.toString();
  fullUrlObj.searchParams.set('page', last);
  pagination.last = fullUrlObj.toString();

  if (page !== 1) {
    fullUrlObj.searchParams.set('page', page - 1);
    pagination.previous = fullUrlObj.toString();
  }
  if (page < last) {
    fullUrlObj.searchParams.set('page', page + 1);
    pagination.next = fullUrlObj.toString();
  }

  res.send({pagination, data: results});
};
