const dashboardService = require('../services/dashboardService');

// GET /api/dashboard
async function obter(req, res, next) {
  try {
    const dados = await dashboardService.buscarDashboard();
    return res.status(200).json(dados);
  } catch (err) {
    return next(err);
  }
}

module.exports = { obter };
