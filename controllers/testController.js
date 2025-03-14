/***************************************
 * File: controllers/testController.js
 ***************************************/

const uAPI = require('./../utils');
const logger = require('./../utils/logger');
const fs = require('fs');

// 1) إعدادات uapi-json (عدّلها بمعلومات حسابك الفعلية)
const settings = {
  auth: {
    username: '',
    password: '',
    targetBranch: '',
    region: 'apac', // أو emea/amer... إلخ حسب منطقة حسابك
    provider: '1G', // إذا كنت على نظام Galileo فابقها كما هي
  },
  debug: 2,
  production: false, // إن كان حسابك على البيئة الفعلية اجعلها true
  options: {
    // تحكم في طريقة طباعة الـLogs
    logFunction: (...args) => {
      logger.info('[uapi-json LOG]: ' + args.join(' '));
    },
  },
};

const AirService = uAPI.createAirService(settings);


async function searchFlights({ from, to, departureDate, returnDate }) {
  const searchParams = {
    legs: [
      {
        from: from || 'SIN',
        to: to || 'BKK',
        departureDate: departureDate || '2025-03-20',
      },
      {
        from: to || 'BKK',
        to: from || 'SIN',
        departureDate: returnDate || '2025-03-30',
      },
    ],
    passengers: { ADT: 1, CNN: 1, INF: 1 },
    cabins: ['Economy'],
    solutionResult: true,
    pricing: { currency: 'USD', eTicketability: true },
    maxSolutions: 10,
    requestId: '4e2fd1f8-2221-4b6c-bb6e-cf05c367cf60',
  };

  return await AirService.shop(searchParams);
}

function transformSegments(forwardSegments, backSegments) {
  const forward = forwardSegments.map((seg, idx) => ({
    uapi_segment_ref: seg.uapi_segment_ref,
    from: seg.from,
    to: seg.to,
    departure: seg.departure,
    arrival: seg.arrival,
    airline: seg.airline,
    flightNumber: seg.flightNumber,
    plane: seg.equipment || '32B',
    serviceClass: seg.serviceClass || 'Economy',
    bookingClass: 'V', // يظهر في ClassOfService + BookingCode
    group: idx,        // لتعبئة Group="{{group}}"
    transfer: false,   // مثال فقط
  }));

  const back = backSegments.map((seg, idx) => ({
    uapi_segment_ref: seg.uapi_segment_ref,
    from: seg.from,
    to: seg.to,
    departure: seg.departure,
    arrival: seg.arrival,
    airline: seg.airline,
    flightNumber: seg.flightNumber,
    plane: seg.equipment || '32B',
    serviceClass: seg.serviceClass || 'Economy',
    bookingClass: 'V',
    group: forwardSegments.length + idx, // يتابع العد من المقاطع الأمامية
    transfer: false,
  }));

  return [...forward, ...back];
}


async function requestFareRules(combinedSegments, requestId) {
  const fareRulesParams = {
    TargetBranch: 'P7229921',            // إلزامي للقالب
    provider: '1G',                      // كي يملأ ProviderCode
    requestId: requestId,                // لتعقب TraceId
    fetchFareRules: true,                // للحصول على FareRuleType="long"
    long: true,
    segments: combinedSegments,          // المقاطع المطلوبة
    passengers: { ADT: 1, CNN: 1, INF: 1 }, // بيانات الركاب
  };

  return await AirService.fareRules(fareRulesParams);
}

exports.test = async (req, res) => {
  try {
    // 1) استقبال معطيات البحث من الريكويست
    const { from, to, departureDate, returnDate } = req.body;

    // 2) استدعاء وظيفة البحث عن الرحلات
    const shopResults = await searchFlights({ from, to, departureDate, returnDate });

    if (!shopResults.length) {
      return res.status(404).json({ error: 'No flights found!' });
    }

    // افترضنا أنك تختار أول نتيجة (ذهاب وإياب)
    const forwardSegments = shopResults[0].directions[0][0].segments;
    const backSegments = shopResults[0].directions[1][0].segments;

    // 3) تحويل مقاطع الرحلة إلى الشكل المطلوب
    const combinedSegments = transformSegments(forwardSegments, backSegments);

    // 4) استدعاء وظيفة fareRules مع تمرير البيانات المطلوبة من البحث
    const fareRulesResult = await requestFareRules(
      combinedSegments,
      '4e2fd1f8-2221-4b6c-bb6e-cf05c367cf60'
    );

    // 5) إعادة النتائج للمستخدم
    return res.json({
      shopResults,
      fareRulesResult,
    });
  } catch (error) {
    logger.error('An error occurred during test (Shop + FareRules):', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};



// 2) الدالة التي تحل المشكلة
// exports.test = async (req, res) => {
//   try {
//     logger.info('Starting fixPassengersHashIssue route...');

//     // (أ) تجهيز بيانات البحث
//     const { from, to, departureDate, returnDate } = req.body || {};
//     const searchParams = {
//       legs: [
//         {
//           from: from || 'BGW',
//           to: to || 'IST',
//           departureDate: departureDate || '2025-03-10',
//         },
//         {
//           from: to || 'IST',
//           to: from || 'BGW',
//           departureDate: returnDate || '2025-03-20',
//         },
//       ],
//       passengers: {
//         ADT: 1,
//         CNN: 1,
//         INF: 1,
//       },
//       cabins: ['Economy'],
//       solutionResult: true,
//       pricing: {
//         currency: 'USD',
//         eTicketability: true,
//       },
//       maxSolutions: 10,
//     };

//     logger.info('Search params:', searchParams);

//     // (ب) البحث عن الرحلات (shop)
//     logger.info('Calling AirService.shop()...');
//     const shopResults = await AirService.shop(searchParams);

//     res.status(200).json(shopResults);
//     return;

//     logger.info(`Shop results length: ${shopResults.length}`);
//     if (!shopResults.length) {
//       return res.status(404).json({ error: 'No flights found!' });
//     }

//     // (ج) اختيار أول نتيجة
//     const [firstSolution] = shopResults;
//     if (!firstSolution) {
//       return res.status(404).json({ error: 'No flights in shopResults!' });
//     }

//     // (د) طلب التسعير (price) للحصول على passengerHash
//     logger.info('Calling AirService.price()...');
//     const pricedSolution = await AirService.fareRules({
//       solution: firstSolution,
//       passengers: {
//         ADT: 1,
//         CNN: 1,
//         INF: 1,
//       },
//     });

//     // (هـ) طلب قواعد السعر (fareRules) على النتيجة المعرّفة من price()
//     logger.info('Calling AirService.f areRules()...');
//     const fareRulesResult = await AirService.fareRules({
//       solution: pricedSolution,
//       fetchFareRules: true,
//     });

//     // (و) إعادة الردّ
//     return res.json({
//       message: 'FareRules fetched successfully (no PassengersHashMissing error)!',
//       searchParams,
//       chosenShopSolution: firstSolution,
//       pricedSolution,
//       fareRules: fareRulesResult,
//     });
//   } catch (error) {
//     logger.error('Error in fixPassengersHashIssue:', error);
//     return res.status(500).json({ error: 'Internal Server Error', details: error.message });
//   }
// };



exports.price = async (req, res) => {
  try {
    // مثال: جلب قواعد السعر (Fare Rules)
    // يجب أن تمرر المقاطع والركاب (Book Passengers)
    // هنا مثال ثابت للاختبار
    const segments = [
      {
        "from": "BGW",
        "to": "AMM",
        "group": 0,
        "departure": "2025-03-10T06:55:00.000+03:00",
        "arrival": "2025-03-10T08:45:00.000+03:00",
        "airline": "RJ",
        "operatingAirline": null,
        "flightNumber": "811",
        "uapi_segment_ref": "G2oiNVUqWDKA4NejJAAAAA==",
        "uapiSegmentReference": "G2oiNVUqWDKA4NejJAAAAA==",
        "details": [
          {
            "origin": "BGW",
            "destination": "AMM",
            "departure": "2025-03-10T06:55:00.000+03:00",
            "flightTime": "110",
            "travelTime": "370",
            "equipment": "321"
          }
        ],
        "serviceClass": "Economy",
        "plane": [
          "321"
        ],
        "duration": [
          "110"
        ],
        "techStops": [],
        "bookingClass": "M",
        "baggage": [
          {
            "units": "piece",
            "amount": 1
          }
        ],
        "fareBasisCode": "MSXEQ",
        "seatsAvailable": 9
      },
      {
        "from": "AMM",
        "to": "IST",
        "group": 0,
        "departure": "2025-03-10T10:25:00.000+03:00",
        "arrival": "2025-03-10T13:05:00.000+03:00",
        "airline": "RJ",
        "operatingAirline": null,
        "flightNumber": "165",
        "uapi_segment_ref": "G2oiNVUqWDKA6NejJAAAAA==",
        "uapiSegmentReference": "G2oiNVUqWDKA6NejJAAAAA==",
        "details": [
          {
            "origin": "AMM",
            "destination": "IST",
            "departure": "2025-03-10T10:25:00.000+03:00",
            "flightTime": "160",
            "travelTime": "370",
            "equipment": "E95"
          }
        ],
        "serviceClass": "Economy",
        "plane": [
          "E95"
        ],
        "duration": [
          "160"
        ],
        "techStops": [],
        "bookingClass": "M",
        "baggage": [
          {
            "units": "piece",
            "amount": 1
          }
        ],
        "fareBasisCode": "MSXEQ",
        "seatsAvailable": 9
      },
      {
        "from": "IST",
        "to": "AMM",
        "group": 1,
        "departure": "2025-03-20T20:55:00.000+03:00",
        "arrival": "2025-03-20T23:20:00.000+03:00",
        "airline": "RJ",
        "operatingAirline": null,
        "flightNumber": "168",
        "uapi_segment_ref": "G2oiNVUqWDKA8NejJAAAAA==",
        "uapiSegmentReference": "G2oiNVUqWDKA8NejJAAAAA==",
        "details": [
        {
        "origin": "IST",
        "destination": "AMM",
        "departure": "2025-03-20T20:55:00.000+03:00",
        "flightTime": "145",
        "travelTime": "420",
        "equipment": "320"
        }
        ],
        "serviceClass": "Economy",
        "plane": [
        "320"
        ],
        "duration": [
        "145"
        ],
        "techStops": [],
        "bookingClass": "M",
        "baggage": [
        {
        "units": "piece",
        "amount": 1
        }
        ],
        "fareBasisCode": "MSXEQ",
        "seatsAvailable": 9
        },
        {
        "from": "AMM",
        "to": "BGW",
        "group": 1,
        "departure": "2025-03-21T02:20:00.000+03:00",
        "arrival": "2025-03-21T03:55:00.000+03:00",
        "airline": "RJ",
        "operatingAirline": null,
        "flightNumber": "810",
        "uapi_segment_ref": "G2oiNVUqWDKA+NejJAAAAA==",
        "uapiSegmentReference": "G2oiNVUqWDKA+NejJAAAAA==",
        "details": [
        {
        "origin": "AMM",
        "destination": "BGW",
        "departure": "2025-03-21T02:20:00.000+03:00",
        "flightTime": "95",
        "travelTime": "420",
        "equipment": "788"
        }
        ],
        "serviceClass": "Economy",
        "plane": [
        "788"
        ],
        "duration": [
        "95"
        ],
        "techStops": [],
        "bookingClass": "M",
        "baggage": [
        {
        "units": "piece",
        "amount": 1
        }
        ],
        "fareBasisCode": "MSXEQ",
        "seatsAvailable": 9
        }
      // ... أضف بقية المقاطع لو عندك
    ];

    const passengers = {
      ADT: 1,
    };

    const fareRulesResp = await AirService.fareRules({
      segments,
      passengers,
      long: true,
      requestId: 'asd-123-4D322-Awr32',
    });

    res.status(200).json(fareRulesResp);

  } catch (error) {
    console.error('Error in price controller:', error);
    res.status(500).json({ error: error.message });
  }
};
exports.aggregatorService = async (req, res) => {
  try {
    const rawData = fs.readFileSync("D:\\xampp81\\htdocs\\topline\\json\\response_orginal_final.json", "utf8");
    const originalData = JSON.parse(rawData);
    const responseData = fs.readFileSync("D:\\xampp81\\htdocs\\topline\\json\\response.json", "utf8");
    const respons = JSON.parse(responseData);
    res.send(respons);

  } catch (error) {
    console.error('Error in test controller:', error);
    return res.status(500).json({ error: error.message });
  }
};
