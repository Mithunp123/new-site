exports.success = (res, data, message = 'Success', status = 200) =>
  res.status(status).json({ success: true, message, data });

exports.created = (res, data, message = 'Created') =>
  res.status(201).json({ success: true, message, data });

exports.error = (res, message = 'Error', status = 400) =>
  res.status(status).json({ success: false, message });
