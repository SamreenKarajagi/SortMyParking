// Seed data for Pune. Locations are real places; capacities and rates are indicative
// demo values to be replaced by partner feeds (PMC, malls, hosts) in production.
//
// profile drives the occupancy model in lib/predict.js:
// office | retail | market | nightlife | transit | air | college | hospital | residential

export const SPOTS = [
  // Malls
  { id: 'phoenix', name: 'Phoenix Marketcity basement', area: 'Viman Nagar', lat: 18.5622, lng: 73.917, type: 'mall', profile: 'retail', cap: { car: 1500, bike: 800 }, rate: { car: 60, bike: 20 }, hours: '9 am to 12 am', feats: ['covered', 'cctv', 'ev'], rating: 4.2 },
  { id: 'pavilion', name: 'The Pavilion', area: 'SB Road', lat: 18.5335, lng: 73.8297, type: 'mall', profile: 'retail', cap: { car: 400, bike: 300 }, rate: { car: 50, bike: 20 }, hours: '10 am to 11 pm', feats: ['covered', 'cctv'], rating: 4.3 },
  { id: 'westend', name: 'Westend Mall', area: 'Aundh', lat: 18.5612, lng: 73.8075, type: 'mall', profile: 'retail', cap: { car: 600, bike: 400 }, rate: { car: 40, bike: 20 }, hours: '10 am to 11 pm', feats: ['covered', 'cctv', 'ev'], rating: 4.1 },
  { id: 'amanora', name: 'Amanora Mall', area: 'Hadapsar', lat: 18.5187, lng: 73.9346, type: 'mall', profile: 'retail', cap: { car: 1200, bike: 700 }, rate: { car: 50, bike: 20 }, hours: '10 am to 11 pm', feats: ['covered', 'cctv', 'ev'], rating: 4.0 },
  { id: 'seasons', name: 'Seasons Mall', area: 'Magarpatta', lat: 18.5196, lng: 73.9302, type: 'mall', profile: 'retail', cap: { car: 800, bike: 500 }, rate: { car: 40, bike: 15 }, hours: '10 am to 11 pm', feats: ['covered', 'cctv'], rating: 3.9 },

  // Civic pay and park (PMC / PCMC)
  { id: 'fc-goodluck', name: 'FC Road pay and park', area: 'Deccan', lat: 18.5178, lng: 73.8411, type: 'civic', profile: 'college', cap: { car: 40, bike: 160 }, rate: { car: 30, bike: 10 }, hours: '8 am to 11 pm', feats: ['attendant'], rating: 3.6 },
  { id: 'jm-sambhaji', name: 'JM Road pay and park', area: 'Shivajinagar', lat: 18.5205, lng: 73.8468, type: 'civic', profile: 'college', cap: { car: 50, bike: 180 }, rate: { car: 30, bike: 10 }, hours: '8 am to 11 pm', feats: ['attendant'], rating: 3.5 },
  { id: 'hamalwada', name: 'Hamal Wada multilevel', area: 'Narayan Peth', lat: 18.5172, lng: 73.852, type: 'civic', profile: 'market', cap: { car: 120, bike: 600 }, rate: { car: 20, bike: 5 }, hours: '7 am to 11 pm', feats: ['covered', 'attendant'], rating: 3.8 },
  { id: 'mandai', name: 'Mandai parking', area: 'Shukrawar Peth', lat: 18.5118, lng: 73.8558, type: 'civic', profile: 'market', cap: { car: 60, bike: 400 }, rate: { car: 20, bike: 5 }, hours: '7 am to 10 pm', feats: ['attendant'], rating: 3.3 },
  { id: 'shaniwarwada', name: 'Shaniwar Wada visitor parking', area: 'Kasba Peth', lat: 18.5197, lng: 73.8547, type: 'civic', profile: 'market', cap: { car: 80, bike: 200 }, rate: { car: 30, bike: 10 }, hours: '8 am to 9 pm', feats: ['attendant'], rating: 3.7 },
  { id: 'kp-north', name: 'North Main Road pay and park', area: 'Koregaon Park', lat: 18.54, lng: 73.888, type: 'civic', profile: 'nightlife', cap: { car: 60, bike: 100 }, rate: { car: 30, bike: 10 }, hours: '10 am to 1 am', feats: ['attendant'], rating: 3.6 },
  { id: 'baner-road', name: 'Baner Road pay and park', area: 'Baner', lat: 18.5598, lng: 73.7882, type: 'civic', profile: 'retail', cap: { car: 60, bike: 200 }, rate: { car: 30, bike: 10 }, hours: '8 am to 11 pm', feats: ['attendant'], rating: 3.5 },
  { id: 'camp-mg', name: 'MG Road pay and park', area: 'Camp', lat: 18.5148, lng: 73.8783, type: 'civic', profile: 'market', cap: { car: 60, bike: 300 }, rate: { car: 30, bike: 10 }, hours: '9 am to 11 pm', feats: ['attendant'], rating: 3.4 },
  { id: 'kothrud-karve', name: 'Karve Road pay and park', area: 'Kothrud', lat: 18.5058, lng: 73.8185, type: 'civic', profile: 'retail', cap: { car: 50, bike: 250 }, rate: { car: 20, bike: 5 }, hours: '8 am to 11 pm', feats: ['attendant'], rating: 3.6 },
  { id: 'wakad-dange', name: 'Dange Chowk pay and park', area: 'Wakad', lat: 18.6037, lng: 73.77, type: 'civic', profile: 'retail', cap: { car: 70, bike: 260 }, rate: { car: 20, bike: 5 }, hours: '8 am to 11 pm', feats: ['attendant'], rating: 3.4 },

  // Private lots
  { id: 'kp-lane7', name: 'Lane 7 private lot', area: 'Koregaon Park', lat: 18.5375, lng: 73.8935, type: 'private', profile: 'nightlife', cap: { car: 80, bike: 120 }, rate: { car: 40, bike: 15 }, hours: '11 am to 2 am', feats: ['valet', 'cctv'], rating: 4.0 },
  { id: 'bhs', name: 'Balewadi High Street lot', area: 'Balewadi', lat: 18.5703, lng: 73.7745, type: 'private', profile: 'nightlife', cap: { car: 150, bike: 200 }, rate: { car: 50, bike: 20 }, hours: '11 am to 2 am', feats: ['valet', 'cctv'], rating: 3.8 },
  { id: 'hinj-ph1', name: 'Shivaji Chowk lot, Phase 1', area: 'Hinjewadi', lat: 18.5917, lng: 73.7386, type: 'private', profile: 'office', cap: { car: 300, bike: 900 }, rate: { car: 20, bike: 10 }, hours: '24 hours', feats: ['cctv', 'attendant'], rating: 3.7 },
  { id: 'hinj-ph2', name: 'Phase 2 circle lot', area: 'Hinjewadi', lat: 18.5869, lng: 73.7055, type: 'private', profile: 'office', cap: { car: 200, bike: 700 }, rate: { car: 20, bike: 10 }, hours: '24 hours', feats: ['cctv'], rating: 3.6 },
  { id: 'eon', name: 'EON IT Park visitor parking', area: 'Kharadi', lat: 18.5523, lng: 73.9497, type: 'private', profile: 'office', cap: { car: 400, bike: 800 }, rate: { car: 30, bike: 10 }, hours: '24 hours', feats: ['covered', 'cctv', 'ev'], rating: 4.1 },
  { id: 'magarpatta', name: 'Magarpatta visitor parking', area: 'Magarpatta', lat: 18.5158, lng: 73.9255, type: 'private', profile: 'office', cap: { car: 300, bike: 600 }, rate: { car: 20, bike: 10 }, hours: '24 hours', feats: ['cctv'], rating: 4.0 },
  { id: 'ruby', name: 'Ruby Hall Clinic parking', area: 'Sassoon Road', lat: 18.532, lng: 73.8775, type: 'private', profile: 'hospital', cap: { car: 150, bike: 300 }, rate: { car: 30, bike: 10 }, hours: '24 hours', feats: ['cctv', 'attendant'], rating: 3.7 },

  // Transit
  { id: 'station', name: 'Pune Station paid parking', area: 'Station Road', lat: 18.5289, lng: 73.874, type: 'transit', profile: 'transit', cap: { car: 300, bike: 900 }, rate: { car: 30, bike: 10 }, hours: '24 hours', feats: ['cctv', 'attendant'], rating: 3.4 },
  { id: 'airport', name: 'Airport multilevel car park', area: 'Lohegaon', lat: 18.581, lng: 73.9195, type: 'transit', profile: 'air', cap: { car: 1000, bike: 300 }, rate: { car: 70, bike: 30 }, hours: '24 hours', feats: ['covered', 'cctv', 'ev'], rating: 4.0 },
  { id: 'vanaz', name: 'Vanaz Metro park and ride', area: 'Kothrud', lat: 18.5076, lng: 73.8046, type: 'metro', profile: 'transit', cap: { car: 60, bike: 300 }, rate: { car: 15, bike: 5 }, hours: '6 am to 11 pm', feats: ['cctv', 'metro'], rating: 4.2 },
  { id: 'ramwadi', name: 'Ramwadi Metro park and ride', area: 'Nagar Road', lat: 18.5555, lng: 73.9111, type: 'metro', profile: 'transit', cap: { car: 50, bike: 250 }, rate: { car: 15, bike: 5 }, hours: '6 am to 11 pm', feats: ['cctv', 'metro'], rating: 4.1 },
  { id: 'shivajinagar-metro', name: 'Shivajinagar Metro park and ride', area: 'Shivajinagar', lat: 18.531, lng: 73.849, type: 'metro', profile: 'transit', cap: { car: 40, bike: 300 }, rate: { car: 15, bike: 5 }, hours: '6 am to 11 pm', feats: ['cctv', 'metro'], rating: 4.0 },
  { id: 'swargate', name: 'Swargate Metro hub parking', area: 'Swargate', lat: 18.501, lng: 73.8637, type: 'metro', profile: 'transit', cap: { car: 100, bike: 500 }, rate: { car: 15, bike: 5 }, hours: '6 am to 11 pm', feats: ['covered', 'cctv', 'metro'], rating: 3.9 },

  // Host spots: residents renting idle society parking (supply-side bet)
  { id: 'host-aundh', name: 'Society spot near Parihar Chowk', area: 'Aundh', lat: 18.559, lng: 73.806, type: 'host', profile: 'residential', cap: { car: 2, bike: 2 }, rate: { car: 25, bike: 10 }, hours: '9 am to 7 pm', feats: ['covered', 'gated'], rating: 4.8 },
  { id: 'host-viman', name: 'Society spot behind Phoenix', area: 'Viman Nagar', lat: 18.5645, lng: 73.914, type: 'host', profile: 'residential', cap: { car: 1, bike: 3 }, rate: { car: 35, bike: 10 }, hours: '10 am to 11 pm', feats: ['gated', 'cctv'], rating: 4.7 },
  { id: 'host-model', name: 'Bungalow driveway, Model Colony', area: 'Model Colony', lat: 18.526, lng: 73.837, type: 'host', profile: 'residential', cap: { car: 1, bike: 2 }, rate: { car: 30, bike: 10 }, hours: '9 am to 9 pm', feats: ['gated'], rating: 4.9 },
  { id: 'host-kalyani', name: 'Society spot, Kalyani Nagar', area: 'Kalyani Nagar', lat: 18.547, lng: 73.903, type: 'host', profile: 'residential', cap: { car: 2, bike: 0 }, rate: { car: 30, bike: 0 }, hours: '9 am to 8 pm', feats: ['covered', 'gated'], rating: 4.6 },
];

export const TYPE_LABEL = {
  mall: 'Mall',
  civic: 'Civic pay and park',
  private: 'Private lot',
  transit: 'Transit',
  metro: 'Metro park and ride',
  host: 'Host spot',
};

// Places people say when they ask where to park. Aliases include Hinglish/Marathi spellings.
export const LANDMARKS = [
  { id: 'fc-road', name: 'FC Road', lat: 18.5236, lng: 73.841, aliases: ['fc road', 'fergusson', 'fc rd', 'goodluck', 'vaishali'] },
  { id: 'jm-road', name: 'JM Road', lat: 18.5196, lng: 73.8466, aliases: ['jm road', 'jangli maharaj', 'balgandharva', 'jm rd'] },
  { id: 'deccan', name: 'Deccan Gymkhana', lat: 18.5167, lng: 73.8414, aliases: ['deccan'] },
  { id: 'dagdusheth', name: 'Dagdusheth Ganpati', lat: 18.5164, lng: 73.8561, aliases: ['dagdusheth', 'dagdu sheth', 'ganpati mandir', 'ganpati temple'] },
  { id: 'shaniwar', name: 'Shaniwar Wada', lat: 18.5195, lng: 73.8553, aliases: ['shaniwar wada', 'shaniwarwada'] },
  { id: 'laxmi-road', name: 'Laxmi Road', lat: 18.515, lng: 73.854, aliases: ['laxmi road', 'lakshmi road', 'tulsi baug', 'tulshibaug'] },
  { id: 'phoenix', name: 'Phoenix Marketcity', lat: 18.5622, lng: 73.917, aliases: ['phoenix', 'marketcity', 'market city', 'pmc mall'] },
  { id: 'viman', name: 'Viman Nagar', lat: 18.5679, lng: 73.9143, aliases: ['viman nagar', 'vimannagar', 'symbiosis viman'] },
  { id: 'kalyani', name: 'Kalyani Nagar', lat: 18.5482, lng: 73.9026, aliases: ['kalyani nagar', 'kalyaninagar'] },
  { id: 'kp', name: 'Koregaon Park', lat: 18.5362, lng: 73.894, aliases: ['koregaon park', ' kp ', 'kp lane', 'north main road', 'osho'] },
  { id: 'airport', name: 'Pune Airport', lat: 18.5821, lng: 73.9197, aliases: ['airport', 'lohegaon', 'flight'] },
  { id: 'station', name: 'Pune Station', lat: 18.5286, lng: 73.8743, aliases: ['station', 'railway', 'pune junction', 'train'] },
  { id: 'camp', name: 'Camp (MG Road)', lat: 18.515, lng: 73.878, aliases: ['camp', 'mg road', 'east street', 'fashion street'] },
  { id: 'ruby', name: 'Ruby Hall Clinic', lat: 18.5308, lng: 73.877, aliases: ['ruby hall', 'ruby', 'hospital'] },
  { id: 'swargate', name: 'Swargate', lat: 18.5018, lng: 73.8636, aliases: ['swargate'] },
  { id: 'shivajinagar', name: 'Shivajinagar', lat: 18.5308, lng: 73.8475, aliases: ['shivajinagar', 'shivaji nagar', 'civil court', 'coep'] },
  { id: 'sb-road', name: 'SB Road', lat: 18.5332, lng: 73.8297, aliases: ['sb road', 'senapati bapat', 'pavilion'] },
  { id: 'aundh', name: 'Aundh', lat: 18.558, lng: 73.8075, aliases: ['aundh', 'westend', 'parihar chowk', 'its high street'] },
  { id: 'baner', name: 'Baner', lat: 18.559, lng: 73.7868, aliases: ['baner'] },
  { id: 'bhs', name: 'Balewadi High Street', lat: 18.57, lng: 73.774, aliases: ['balewadi', 'high street', 'bhs'] },
  { id: 'hinjewadi', name: 'Hinjewadi Phase 1', lat: 18.5913, lng: 73.7389, aliases: ['hinjewadi', 'hinjawadi', 'phase 1', 'infotech park', 'rajiv gandhi infotech'] },
  { id: 'hinjewadi2', name: 'Hinjewadi Phase 2', lat: 18.5869, lng: 73.7055, aliases: ['phase 2', 'phase ii', 'infosys hinjewadi'] },
  { id: 'wakad', name: 'Wakad', lat: 18.5989, lng: 73.7653, aliases: ['wakad', 'dange chowk'] },
  { id: 'kharadi', name: 'Kharadi (EON)', lat: 18.5515, lng: 73.947, aliases: ['kharadi', 'eon', 'world trade center', 'wtc'] },
  { id: 'magarpatta', name: 'Magarpatta', lat: 18.5155, lng: 73.9272, aliases: ['magarpatta', 'seasons mall', 'cybercity'] },
  { id: 'hadapsar', name: 'Hadapsar (Amanora)', lat: 18.5187, lng: 73.9346, aliases: ['hadapsar', 'amanora'] },
  { id: 'kothrud', name: 'Kothrud', lat: 18.5074, lng: 73.8077, aliases: ['kothrud', 'karve road', 'karishma', 'vanaz'] },
  { id: 'university', name: 'Pune University', lat: 18.5523, lng: 73.825, aliases: ['university', 'sppu', 'ganeshkhind'] },
];

// Towing hotspots. Seeded from public reporting of frequent towing drives;
// in production this layer is refreshed from user reports ("I just got towed here").
export const TOW_ZONES = [
  { id: 'tz-fc', name: 'FC Road', lat: 18.5225, lng: 73.8412, r: 450 },
  { id: 'tz-jm', name: 'JM Road', lat: 18.52, lng: 73.847, r: 400 },
  { id: 'tz-laxmi', name: 'Laxmi Road', lat: 18.5148, lng: 73.854, r: 420 },
  { id: 'tz-bhs', name: 'Balewadi High Street', lat: 18.5703, lng: 73.7752, r: 350 },
  { id: 'tz-camp', name: 'MG Road, Camp', lat: 18.5155, lng: 73.879, r: 350 },
  { id: 'tz-station', name: 'Station Road', lat: 18.529, lng: 73.8755, r: 300 },
  { id: 'tz-viman', name: 'Viman Nagar main road', lat: 18.5635, lng: 73.9155, r: 380 },
  { id: 'tz-marketyard', name: 'Market Yard', lat: 18.4875, lng: 73.866, r: 400 },
];

// Fines a driver avoids by not getting towed. Ranges from public reporting, see docs/PRODUCT.md.
export const TOW_COST = { bike: 736, car: 1071 };

// Citywide demand events. Dates are approximate and should be confirmed each year.
export const EVENTS = [
  { name: 'Ganeshotsav', from: '2026-09-14', to: '2026-09-25', profiles: ['market', 'college'], boost: 0.22 },
  { name: 'Diwali shopping', from: '2026-10-30', to: '2026-11-11', profiles: ['market', 'retail'], boost: 0.15 },
  { name: 'Christmas and New Year', from: '2026-12-20', to: '2027-01-01', profiles: ['nightlife', 'retail'], boost: 0.15 },
];

export const PUNE_CENTER = { lat: 18.5308, lng: 73.8475 };
