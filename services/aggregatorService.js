/*************************************************
 * services/aggregatorService.js
 *************************************************/
const travelportService = require('./travelportService');
const iraqiService = require('./iraqiService');
const arabiaService = require('./arabiaService');

async function aggregateLowFareSearch(searchData) {
  // استدعاء الخدمات المختلفة لجلب بيانات الرحلات
  // إذا كان أحدها لا تحتاجه، علّق سطره
  const travelportResult = await travelportService.lowFareSearch(searchData);
  const iraqiResult = await iraqiService.lowFareSearch(searchData);
  const arabiaResult = await arabiaService.lowFareSearch(searchData);

  // نفترض أن كل خدمة تعيد { flights: [...] } داخليًا
  // إذا كانت باسم آخر عدِّل accordingly
  const allFlights = [
    ...(travelportResult.flights || []),
    ...(iraqiResult.flights || []),
    ...(arabiaResult.flights || []),
  ];

  const totalFlights = allFlights.length; // إجمالي عدد النتائج

  // هنا ممكن تنفذ عمليات حسابية لحساب الـmin/ max للسعر، إلخ
  // أو تحدد فلاتر أخرى
  // سنبقي الموضوع ثابتًا أوتوماتيكيًا أو نضع أرقام تمثيلية

  // نعطي مثال: استخراج أقل وأعلى سعر:
  let minPrice = null;
  let maxPrice = null;
  let currency = 'USD';

  if (allFlights.length > 0) {
    minPrice = allFlights[0].price.total;
    maxPrice = allFlights[0].price.total;
    currency = allFlights[0].price.currency || 'USD';

    for (const f of allFlights) {
      if (f.price.total < minPrice) minPrice = f.price.total;
      if (f.price.total > maxPrice) maxPrice = f.price.total;
    }
  }

  // هنا يمكننا بناء الرد النهائي بالضبط كما في سؤالك
  const finalResponse = {
    "total": totalFlights,
    "message": "Success",
    "description": "Success",
    "data": {
      "status": "completed",
      "progress": 100,
      "filters": {
        "price_range": {
          "title": "Price Range",
          "min": minPrice || 0,
          "max": maxPrice || 0,
          "currency": currency,
          "type": "range"
        },
        "commission_range": {
          "title": "Commission Range",
          "max": 85.02,
          "currency": "USD",
          "type": "range"
        },
        "stops": {
          "title": "Stops",
          "value": [
            { "name": "Direct", "value": 0 },
            { "name": "1 Stop", "value": 1 },
            { "name": "2 Stops", "value": 2 }
          ],
          "type": "checkbox"
        },
        "baggage": {
          "title": "Baggage",
          "value": [
            { "name": "1 PC", "value": 1 },
            { "name": "2 PC", "value": 2 },
            { "name": "25 KG", "value": 25 },
            { "name": "30 KG", "value": 30 },
            { "name": "40 KG", "value": 40 }
          ],
          "type": "checkbox"
        },
        "airlines": {
          "title": "Airlines",
          "value": [
            {
              "code": "QR",
              "name": "Qatar Airways",
              "logo": "https://www.gstatic.com/flights/airline_logos/70px/QR.png",
              "number": 40
            },
            {
              "code": "RJ",
              "name": "Royal Jordanian",
              "logo": "https://www.gstatic.com/flights/airline_logos/70px/RJ.png",
              "number": 32
            },
            {
              "code": "MS",
              "name": "Egyptair",
              "logo": "https://www.gstatic.com/flights/airline_logos/70px/MS.png",
              "number": 16
            },
            {
              "code": "EK",
              "name": "Emirates",
              "logo": "https://www.gstatic.com/flights/airline_logos/70px/EK.png",
              "number": 5
            },
            {
              "code": "GF",
              "name": "Gulf Air Bahrain",
              "logo": "https://www.gstatic.com/flights/airline_logos/70px/GF.png",
              "number": 4
            },
            {
              "code": "IA",
              "name": "Iraqi Airways",
              "logo": "https://mateen-core-prod.nbg1.your-objectstorage.com/airlines/uQjqrCW312rxp1kIQfwlSF0m9DvsrAjrOQMAoUHw.png",
              "number": 2
            },
            {
              "code": "TK",
              "name": "Turkish Airlines",
              "logo": "https://www.gstatic.com/flights/airline_logos/70px/TK.png",
              "number": 1
            }
          ],
          "type": "checkbox"
        },
        "departure_time": {
          "title": "Departure Time",
          "value": [
            { "name": "Morning",   "from": "00:00", "to": "06:00", "value": "morning" },
            { "name": "Afternoon", "from": "06:00", "to": "12:00", "value": "afternoon" },
            { "name": "Evening",   "from": "12:00", "to": "18:00", "value": "evening" },
            { "name": "Night",     "from": "18:00", "to": "00:00", "value": "night" }
          ],
          "type": "checkbox"
        },
        "arrival_time": {
          "title": "Arrival Time",
          "value": [
            { "name": "Morning",   "from": "00:00", "to": "06:00", "value": "morning" },
            { "name": "Afternoon", "from": "06:00", "to": "12:00", "value": "afternoon" },
            { "name": "Evening",   "from": "12:00", "to": "18:00", "value": "evening" },
            { "name": "Night",     "from": "18:00", "to": "00:00", "value": "night" }
          ],
          "type": "checkbox"
        },
        "flight_duration": {
          "title": "Flight Duration",
          "min": 75,
          "max": 605,
          "type": "checkbox"
        },
        "transiting_time": {
          "title": "Transiting Time",
          "min": 85,
          "max": 1435,
          "type": "checkbox"
        },
        "outbound_airports": {
          "title": "Outbound Airports",
          "out_departure_airport": {
            "title": "Departure Airport",
            "value": [
              {
                "name": "Baghdad International Airport",
                "code": "BGW",
                "number": 295
              }
            ],
            "type": "checkbox"
          },
          "out_arrival_airport": {
            "title": "Arrival Airport",
            "value": [
              {
                "name": "Dubai International Airport",
                "code": "DXB",
                "number": 295
              }
            ],
            "type": "checkbox"
          }
        },
        "inbound_airports": {
          "title": "Inbound Airports",
          "in_departure_airport": {
            "title": "Departure Airport",
            "value": [
              {
                "name": "Dubai International Airport",
                "code": "DXB",
                "number": 295
              }
            ],
            "type": "checkbox"
          },
          "in_arrival_airport": {
            "title": "Arrival Airport",
            "value": [
              {
                "name": "Baghdad International Airport",
                "code": "BGW",
                "number": 295
              }
            ],
            "type": "checkbox"
          }
        }
      },
      "sorts": {
        "price": {
          "title": "Price",
          "Value": [
            { "name": "Total Lowest to Highest", "value": "t_asc" },
            { "name": "Total Highest to Lowest", "value": "t_desc" },
            { "name": "Base Lowest to Highest",  "value": "b_asc" },
            { "name": "Base Highest to Lowest",  "value": "b_desc" },
            { "name": "Tax Lowest to Highest",   "value": "x_asc" },
            { "name": "Tax Highest to Lowest",   "value": "x_desc" }
          ]
        },
        "commission": {
          "title": "Commission",
          "Value": [
            { "name": "Lowest to Highest", "value": "asc" },
            { "name": "Highest to Lowest", "value": "desc" }
          ]
        },
        "departure_time": {
          "title": "Departure Time",
          "Value": [
            { "name": "Earliest to Latest", "value": "asc" },
            { "name": "Latest to Earliest", "value": "desc" }
          ]
        },
        "arrival_time": {
          "title": "Arrival Time",
          "Value": [
            { "name": "Earliest to Latest", "value": "asc" },
            { "name": "Latest to Earliest", "value": "desc" }
          ]
        },
        "flight_duration": {
          "title": "Flight Duration",
          "Value": [
            { "name": "Shortest to Longest", "value": "asc" },
            { "name": "Longest to Shortest", "value": "desc" }
          ]
        },
        "transiting_time": {
          "title": "Transiting Time",
          "Value": [
            { "name": "Shortest to Longest", "value": "asc" },
            { "name": "Longest to Shortest", "value": "desc" }
          ]
        }
      },
      "search_flight": allFlights
    }
  };

  return finalResponse;
}

module.exports = {
  aggregateLowFareSearch
};
