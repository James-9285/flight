/*************************************************
 * services/travelportService.js
 *************************************************/
const uAPI = require('../utils');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// نستورد عميل Redis الذي فعلناه في redisClient.js
const { client } = require('./redisClient');

// إعدادات uapi-json
const settings = {
  auth: {
    username: '',
    password: '',
    targetBranch: '',
    region: 'apac',
    provider: '1G',
  },
  debug: 2,
  production: false,
  options: {
    logFunction: (...args) => {
      logger.info('[uapi-json LOG]: ' + args.join(' '));
    },
  },
};

const AirService = uAPI.createAirService(settings);

/**
 * مثال لدوال parsePriceString + parseIsoDurationToMinutes
 */
function parsePriceString(str) {
  if (!str) return { currency: '', amount: 0 };
  const currency = str.slice(0, 3);
  const amountStr = str.slice(3);
  const amount = parseFloat(amountStr) || 0;
  return { currency, amount };
}

function parseIsoDurationToMinutes(isoDuration) {
  if (!isoDuration) return 0;
  const hoursMatch = isoDuration.match(/(\d+)H/);
  const minsMatch = isoDuration.match(/(\d+)M/);
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const mins  = minsMatch ? parseInt(minsMatch[1]) : 0;
  return (hours * 60) + mins;
}

/**
 * بناء بارامترات البحث
 */
function buildSearchParams(searchData) {
  const legs = (searchData.legs || []).map(leg => ({
    from: leg.from,
    to: leg.to,
    departureDate: leg.date
  }));

  const passengers = {
    ADT: searchData.adt || 1,
    CHD: searchData.chd || 0,
    INF: searchData.inf || 0
  };

  const cabins = [];
  if (searchData.cabin) {
    cabins.push(searchData.cabin);
  }

  return {
    legs,
    passengers,
    cabins,
    solutionResult: true,
    pricing: { currency: 'USD', eTicketability: true },
    maxSolutions: 20
  };
}

/**
 * تحويل Segment
 */
function transformSegment(segment, idx) {
  const departureTimestamp = new Date(segment.departure).getTime() / 1000;
  const arrivalTimestamp   = new Date(segment.arrival).getTime()   / 1000;
  
  // flightTime
  let flightTime = 0;
  if (segment.duration && segment.duration.length > 0) {
    flightTime = parseInt(segment.duration[0], 10);
  }

  // baggage
  let baggageObj = null;
  if (segment.baggage && segment.baggage.length > 0) {
    const b = segment.baggage[0];
    baggageObj = { units: b.units, amount: b.amount };
  }

  return {
    from: {
      code: segment.from, 
      name: "",
      is_main: false,
      city_code: "",
      city_name: "",
      country_name: "",
      longitude: "",
      latitude: "",
      utc: "",
      timezone: "",
      type: "airport"
    },
    to: {
      code: segment.to,
      name: "",
      is_main: false,
      city_code: "",
      city_name: "",
      country_name: "",
      longitude: "",
      latitude: "",
      utc: "",
      timezone: "",
      type: "airport"
    },
    group: segment.group || idx,
    connection: 0,
    departure: {
      formated_time: segment.departure.replace('T',' ').slice(0,16),
      timestamp: departureTimestamp,
      original: segment.departure
    },
    arrival: {
      formated_time: segment.arrival.replace('T',' ').slice(0,16),
      timestamp: arrivalTimestamp,
      original: segment.arrival
    },
    flight_time: String(flightTime),
    flight_number: segment.flightNumber,
    distance: "",
    eTicketability: "Yes",
    equipment: (segment.plane && segment.plane[0]) || "",
    change_of_plane: false,
    participant_level: "",
    link_availability: "",
    polled_availability_option: "",
    optional_services_indicator: "",
    availability_source: "",
    availability_display_type: "",
    terminal: "",
    provider_code: segment.airline || "",
    uapi_segment_ref: segment.uapi_segment_ref || "",
    plane: (segment.plane && segment.plane[0]) || "",
    duration: flightTime,
    airline: {
      code: segment.airline || "",
      name: "",
      logo: ""
    },
    code_share: null,
    class: {
      service: segment.serviceClass || "Economy",
      booking: segment.bookingClass || "Y",
      seats_available: segment.seatsAvailable || 9,
      fare_basis: segment.fareBasisCode || ""
    },
    fare_info: null,
    baggage: baggageObj ? baggageObj : { units: "", amount: 0 }
  };
}

/**
 * تحويل Direction
 */
function transformDirection(directionItem) {
  const totalMinutes = parseIsoDurationToMinutes(directionItem.duration);

  return {
    from: {
      code: directionItem.from,
      name: "", 
      is_main: false,
      city_code: "",
      city_name: "",
      country_name: "",
      longitude: "",
      latitude: "",
      utc: "",
      timezone: "",
      type: "airport"
    },
    to: {
      code: directionItem.to,
      name: "", 
      is_main: false,
      city_code: "",
      city_name: "",
      country_name: "",
      longitude: "",
      latitude: "",
      utc: "",
      timezone: "",
      type: "airport"
    },
    plating_carrier: {
      code: directionItem.platingCarrier || "",
      name: "",
      logo: ""
    },
    departure: {
      formated_time: "",
      timestamp: 0,
      original: ""
    },
    arrival: {
      formated_time: "",
      timestamp: 0,
      original: ""
    },
    duration: totalMinutes,
    stops: 0,
    flying_time: { amount: totalMinutes, type: "m" },
    transiting_time: [{ amount: 0, type: "m" }],
    distance: { amount: 0, type: "km" },
    price_key: "",
    has_baggage: true,
    connections: null,
    commission_key: "",
    commission_value_key: -1,
    segments_keys: [],
    private_fare: false,
    segments: (directionItem.segments || []).map((seg, idx) => transformSegment(seg, idx))
  };
}

/**
 * تنفيذ LowFareSearch مع التخزين المؤقت
 */
async function lowFareSearch(searchData) {
  try {
    const traceId = searchData.trace_id || 'DefaultTraceID';
    const redisKey = `search:${traceId}`;

    // 1) تحقق من الكاش:
    const cached = await client.get(redisKey); // client.get بالوعود
    if (cached) {
      logger.info(`Returning cached results for trace_id=${traceId}`);
      return JSON.parse(cached); // { flights: [...] }
    }

    // 2) لا يوجد في الكاش => نفذ البحث
    const params = buildSearchParams(searchData);
    const shopResults = await AirService.shop(params);

    // 3) حول shopResults إلى flights
    const flights = shopResults.map((item, index) => {
      // parse prices
      const { currency: totalCur, amount: totalAmt } = parsePriceString(item.totalPrice);
      const { amount: baseAmt } = parsePriceString(item.basePrice);
      const { amount: taxAmt }  = parsePriceString(item.taxes);

      // passengerFares
      let adtTotal = totalAmt, adtBase=baseAmt, adtTax=taxAmt;
      if (item.passengerFares && item.passengerFares.ADT) {
        const pf = item.passengerFares.ADT;
        const totP = parsePriceString(pf.totalPrice || "");
        const basP = parsePriceString(pf.basePrice  || "");
        const taxP = parsePriceString(pf.taxes      || "");
        adtTotal = totP.amount;
        adtBase  = basP.amount;
        adtTax   = taxP.amount;
      }

      // directions
      const finalDirections = [];
      (item.directions || []).forEach(subArr => {
        subArr.forEach(dirObj => {
          finalDirections.push(transformDirection(dirObj));
        });
      });

      // بناء كائن الرحلة النهائي
      return {
        trace_id: traceId,
        search_id: uuidv4(),
        result_id: uuidv4(),
        universal_key: [
          item.bookingComponents && item.bookingComponents[0]
            ? item.bookingComponents[0].uapi_fare_reference
            : "noFareRef",
          traceId
        ],
        direct_issue: true,
        is_fast: index === 0,
        is_best: index === 0,
        has_baggage: true,
        supply_provider: "7",
        group_id_key: "00000000-0000-0000-0000-000000000000",
        result_type: 0,
        search_type: searchData.search_type || "1",
        keys: [
          item.bookingComponents && item.bookingComponents[0]
            ? item.bookingComponents[0].uapi_fare_reference
            : "noKey"
        ],
        price: {
          total: totalAmt,
          base: baseAmt,
          taxes: taxAmt,
          currency: totalCur
        },
        commission: {
          type: "Excluded",
          amount: 17.8206,
          currency: "USD",
          ref: 9,
          ref_value: ""
        },
        service_charge: [0],
        plating_carrier: {
          code: item.platingCarrier || "",
          name: "",
          logo: ""
        },
        class: {
          service: "Economy",
          booking: "S",
          seats_available: 9,
          fare_basis: ""
        },
        price_solution_key: 
          item.bookingComponents && item.bookingComponents[0]
            ? item.bookingComponents[0].uapi_fare_reference
            : "noPriceKey",
        directions: finalDirections,
        passengerFares: {
          ADT: { total: adtTotal, base: adtBase, taxes: adtTax, currency: totalCur },
          CHD: { total: 0, base: 0, taxes: 0, currency: "USD" },
          INF: { total: 0, base: 0, taxes: 0, currency: "USD" }
        },
        passengerCounts: {
          ADT: (item.passengerCounts && item.passengerCounts.ADT) 
            ? item.passengerCounts.ADT 
            : 1,
          CHD: 0,
          INF: 0
        },
        unique_key: "",
        group: 0,
        brand_fares: [],
        brands_id: null,
        baggage_allowance: [],
        private_fare: false,
        ref_key_id: uuidv4()
      };
    });

    const flightsData = { flights };

    // 4) التخزين في Redis لمدة 30 دقيقة
    await client.set(redisKey, JSON.stringify(flightsData), {
      EX: 1800
    });

    return flightsData;
  } catch (err) {
    console.error('Error in travelportService.lowFareSearch:', err);
    return { flights: [] };
  }
}

/**
 * getFareRule(traceId, resultId)
 * استرجاع نتائج من الكاش، واختيار الرحلة المناسبة
 */
async function getFareRule(traceId, resultId) {
  try {
    const redisKey = `search:${traceId}`;
    const cached = await client.get(redisKey);
    if (!cached) {
      return { error: 'No cached results found for this trace_id' };
    }

    const { flights } = JSON.parse(cached);
    if (!flights) {
      return { error: 'No flights array in the cache' };
    }

    const flightObj = flights.find(f => f.result_id === resultId);
    if (!flightObj) {
      return { error: 'No flight found with this result_id' };
    }

    // (اختياري) مثال على استدعاء fareRules من Travelport:
    // const fareRulesResult = await AirService.fareRules({
    //   provider: '1G',
    //   requestId: traceId,
    //   fetchFareRules: true,
    //   ...
    // });

    return {
      message: 'Fare Rule data',
      trace_id: traceId,
      result_id: resultId,
      // fareRulesResult,  // لو أتممت النداء أعلاه
      yourFlight: flightObj
    };
  } catch (err) {
    console.error('Error in getFareRule:', err);
    return { error: 'Failed to get fare rule' };
  }
}

module.exports = {
  lowFareSearch,
  getFareRule
};
