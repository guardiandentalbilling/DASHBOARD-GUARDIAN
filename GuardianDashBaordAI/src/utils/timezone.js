const { DateTime } = require('luxon');
const config = require('../config/env');

function todayRange(){
  const now = DateTime.now().setZone(config.timezone);
  const start = now.startOf('day').toUTC();
  const end = now.endOf('day').toUTC();
  return { start: start.toJSDate(), end: end.toJSDate(), dateLabel: now.toFormat('yyyy-LL-dd') };
}

module.exports = { todayRange };