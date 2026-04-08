const attendanceService = require('../services/attendanceService');

const clockIn = async (req, res, next) => {
  try {
    const record = await attendanceService.clockIn(
      req.user.id, req.user.business_id, req.body.shiftId
    );
    res.status(201).json({ message: 'Clocked in', attendance: record });
  } catch (err) { next(err); }
};

const clockOut = async (req, res, next) => {
  try {
    const record = await attendanceService.clockOut(req.user.id);
    res.json({ message: 'Clocked out', attendance: record });
  } catch (err) { next(err); }
};

const getReport = async (req, res, next) => {
  try {
    const data = await attendanceService.getReport(req.user.business_id, req.query);
    res.json({ attendance: data });
  } catch (err) { next(err); }
};

const exportCSV = async (req, res, next) => {
  try {
    const data = await attendanceService.getReport(req.user.business_id, req.query);
    const csv = attendanceService.generateCSV(data);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.csv');
    res.send(csv);
  } catch (err) { next(err); }
};

const getStatus = async (req, res, next) => {
  try {
    const status = await attendanceService.getStatus(req.user.id);
    res.json({ clockedIn: !!status, attendance: status });
  } catch (err) { next(err); }
};

module.exports = { clockIn, clockOut, getReport, exportCSV, getStatus };
