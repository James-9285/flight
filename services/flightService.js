/*************************************************
 * services/flightService.js
 *************************************************/

 
// هذا مجرد مثال مبسط (Mock) يشرح أين تضع منطقك
module.exports = {
  lowFareSearch,
  getFareRule,
  getBrandFares,
  getSeatMap,
  getMealMap,
  getBaggageMap,
  getPrice,
  bookFlight,
  ticketFlight,
  cancelFlight,
  voidFlight,
  getBookData
};

const aggregatorService = require('./aggregatorService');

/**
 * دالة رئيسية يتصل بها الكنترولر
 * تستقبل بيانات البحث (searchData) ثم تنادي aggregatorService
 */
async function lowFareSearch(searchData) {
  // استدعاء الدالة الموحّدة
  const response = await aggregatorService.aggregateLowFareSearch(searchData);
  return response; // يعيد الكائن النهائي مع "total" و "data.search_flight" والفلتر... إلخ
}

/**
 * دالة لجلب الـFareRule أو التفاصيل
 */
async function getFareRule(traceId, resultId) {
  // في هذه الحالة قد تحتاج البحث عن النتيجة المخزّنة في كاش أو DB
  // أو تستدعي aggregatorService.getFareRule()
  // أو travelportService.getFareRule()
  // إلخ...
  // لإعطاء مثال عملي سريع: سنكتب دالة بسيطة وهمية تعيد Response معين
  // التعديل متروك لك حسب حاجة مشروعك

  const mockResponse = {
    message: 'Fare Rule details fetched successfully',
    trace_id: traceId,
    result_id: resultId,
    // ممكن أن تضيف أي معلومات:
    fare_rule: {
      cancellation: 'Allowed with penalty before departure',
      changes: 'Changes permitted with fees',
      no_show: 'Not permitted',
    },
  };

  return mockResponse;
}

 
   
  
  async function getBrandFares(trace_id, result_id) {
    // جلب Branded Fares
    return {
      trace_id: trace_id,
      result_id: result_id,
      brandOptions: [
        { brandId: 'B1', description: 'Brand 1 with more baggage' },
        { brandId: 'B2', description: 'Brand 2 with flexible change' }
      ]
    };
  }
  
  async function getSeatMap(trace_id, result_id, brands_id) {
    // جلب خريطة المقاعد
    return {
      trace_id,
      result_id,
      brands_id,
      seats: [
        { seatNumber: 'A1', available: true },
        { seatNumber: 'A2', available: false }
      ]
    };
  }
  
  async function getMealMap(trace_id, result_id) {
    // جلب تفاصيل الوجبات
    return {
      trace_id,
      result_id,
      meals: [
        { mealId: 'M1', type: 'Veg', price: 10 },
        { mealId: 'M2', type: 'Non-Veg', price: 15 }
      ]
    };
  }
  
  async function getBaggageMap(trace_id, result_id) {
    // جلب تفاصيل الأمتعة
    return {
      trace_id,
      result_id,
      baggage: [
        { baggageId: 'BAG1', weight: '15kg' },
        { baggageId: 'BAG2', weight: '20kg' }
      ]
    };
  }
  
  async function getPrice(requestData) {
    // حساب السعر بناءً على المقاعد/الأمتعة/الوجبات المختارة
    return {
      trace_id: requestData.trace_id,
      result_id: requestData.result_id,
      totalPrice: 1500, // مجرد مثال
      currency: 'USD',
      breakdown: {
        baseFare: 1200,
        taxes: 200,
        fees: 100
      }
    };
  }
  
  async function bookFlight(bookingData) {
    // إجراء عملية الحجز
    return {
      pnr: 'PNR12345',
      status: 'Booked',
      bookingData
    };
  }
  
  async function ticketFlight(ticketData) {
    // إصدار التذاكر بناءً على PNR
    return {
      pnr: ticketData.pnr,
      status: 'Ticketed',
      ticketNumbers: ['TICK123', 'TICK124']
    };
  }
  
  async function cancelFlight(cancelData) {
    // إلغاء الحجز
    return {
      pnr: cancelData.pnr,
      status: 'Cancelled'
    };
  }
  
  async function voidFlight(voidData) {
    // عمل Void للحجز
    return {
      pnr: voidData.pnr,
      status: 'Voided'
    };
  }
  
  async function getBookData(pnr, lastName) {
    // استرجاع بيانات الحجز
    return {
      pnr,
      lastName,
      bookingInfo: {
        flights: [
          { from: 'BAH', to: 'SHJ', date: '2024-12-01' },
          { from: 'SHJ', to: 'BAH', date: '2024-12-04' }
        ],
        passengers: [
          { name: 'Takleef', type: 'ADT' }
        ],
        status: 'Booked'
      }
    };
  }
  