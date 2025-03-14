/*************************************************
 * services/iraqiService.js
 *************************************************/

// مثال وهمي لاستخدام API ما، أو ملفات JSON جاهزة
async function lowFareSearch(searchData) {
  // يمكن وضع أكواد فعلية تستدعي API عراقي
  // أو مجرّد كود وهمي:
  const flights = [];

  // مثلاً لو أردت إضافة رحلة صورية:
  flights.push({
    trace_id: searchData.trace_id || 'IraqiTraceXYZ',
    search_id: 'some-iraqi-search-id',
    result_id: 'iraqi-mock-1',
    universal_key: [],
    direct_issue: true,
    is_fast: false,
    is_best: false,
    has_baggage: true,
    supply_provider: 'IA',
    group_id_key: '00000000-0000-0000-0000-000000000000',
    result_type: 0,
    search_type: searchData.search_type || '1',
    keys: [],
    price: {
      total: 400.00,
      base: 300.00,
      taxes: 100.00,
      currency: 'USD'
    },
    commission: {
      type: "Excluded",
      amount: 20,
      currency: "USD",
      ref: 9,
      ref_value: ""
    },
    service_charge: [0],
    plating_carrier: {
      code: "IA",
      name: "Iraqi Airways",
      logo: "https://mateen-core-prod.nbg1.your-objectstorage.com/airlines/uQjqrCW312rxp1kIQfwlSF0m9DvsrAjrOQMAoUHw.png"
    },
    class: {
      service: "Economy",
      booking: "Y",
      seats_available: 5,
      fare_basis: "YRT"
    },
    price_solution_key: "some-iraqi-solution-key",
    directions: [],
    passengerFares: {
      ADT: {
        total: 400,
        base: 300,
        taxes: 100,
        currency: 'USD'
      }
    },
    passengerCounts: {
      ADT: searchData.adt || 1,
      CHD: 0,
      INF: 0
    },
    unique_key: "",
    group: 0,
    brand_fares: [],
    brands_id: null,
    baggage_allowance: [],
    private_fare: false,
    ref_key_id: "some-iraqi-ref"
  });

  // return { flights };
  return { flights: [] }; // لا تعيد أي رحلة

}

module.exports = {
  lowFareSearch
};
