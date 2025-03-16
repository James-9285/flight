/*************************************************
 * controllers/flightController.js
 *************************************************/
const flightService = require('../services/flightService');
const travelportService = require('../services/travelportService');

/**
 * يستقبل طلب البحث بنفس البنية JSON:
 * {
 *   "legs": [...],
 *   "search_type": "0" or "1" or "2",
 *   "allowed_airlines": "all",
 *   "disallowed_airlines": "none",
 *   "adt": 1,
 *   "chd": 0,
 *   "inf": 0,
 *   "class": "all",
 *   "cabin": "Economy",
 *   "trace_id": "Th39PaWZzdj",
 *   "mark_up": null
 * }
 */
exports.lowFareSearch = async (req, res) => {
  try {
    const searchData = req.body;
    console.log("request_data=>",searchData);

    // استدعاء الدالة من flightService
    const response = await flightService.lowFareSearch(searchData);

    // نعيد الردّ النهائي للمستخدم
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in lowFareSearch:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * يستقبل:
 * {
 *   "trace_id": "{{B2B_SEARCH_TRACE_ID}}",
 *   "result_id": "{{B2B_RESULT_ID}}"
 * }
 */
exports.getFareRule = async (req, res) => {
  try {
    const { trace_id, result_id } = req.body;
    const response = await travelportService.getFareRule(trace_id, result_id);
    return res.json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getBrandFares = async (req, res) => {
  try {
    const { trace_id, result_id } = req.body;
    const response = await flightService.getBrandFares(trace_id, result_id);
    res.status(200).json({
      message: 'Branded fares retrieved successfully',
      data: response
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.seatMap = async (req, res) => {
  try {
    const { trace_id, result_id, brands_id } = req.body;
    const response = await flightService.getSeatMap(trace_id, result_id, brands_id);

    res.status(200).json({
      message: 'Seat map data',
      data: response
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.mealMap = async (req, res) => {
  try {
    const { trace_id, result_id } = req.body;
    const response = await flightService.getMealMap(trace_id, result_id);

    res.status(200).json({
      message: 'Meal map data',
      data: response
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.baggageMap = async (req, res) => {
  try {
    const { trace_id, result_id } = req.body;
    const response = await flightService.getBaggageMap(trace_id, result_id);

    res.status(200).json({
      message: 'Baggage details',
      data: response
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPrice = async (req, res) => {
  try {
    const requestData = req.body; // trace_id, result_id, seat_map, baggages, meals...
    const response = await flightService.getPrice(requestData);

    res.status(200).json({
      message: 'Price retrieved successfully',
      data: response
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.bookFlight = async (req, res) => {
  try {
    const bookingData = req.body;
    const response = await flightService.bookFlight(bookingData);

    res.status(200).json({
      message: 'Flight booked successfully',
      data: response
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.ticketFlight = async (req, res) => {
  try {
    const ticketData = req.body; // pnr, last_name, ...
    const response = await flightService.ticketFlight(ticketData);

    res.status(200).json({
      message: 'Ticket process completed successfully',
      data: response
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancelFlight = async (req, res) => {
  try {
    const cancelData = req.body; // pnr, last_name, ...
    const response = await flightService.cancelFlight(cancelData);

    res.status(200).json({
      message: 'Flight cancelled successfully',
      data: response
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.voidFlight = async (req, res) => {
  try {
    const voidData = req.body; // pnr, last_name, ...
    const response = await flightService.voidFlight(voidData);

    res.status(200).json({
      message: 'Flight voided successfully',
      data: response
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBookData = async (req, res) => {
  try {
    const { pnr, last_name } = req.body;
    const response = await flightService.getBookData(pnr, last_name);

    res.status(200).json({
      message: 'Booking details retrieved successfully',
      data: response
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
