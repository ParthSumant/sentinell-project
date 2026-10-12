
export const buildings = [
  "Administration",
  "Maa Saraswati Block",
  "EEE Block",
  "Architecture Block",
  "Library",
];

export const resourceTotals = [
  {
    name: "Electricity",
    value: "2,480",
    unit: "kWh",
    change: "Demo indicator",
    icon: "Zap",
  },
  {
    name: "Water",
    value: "18.2",
    unit: "kL",
    change: "Demo indicator",
    icon: "Droplets",
  },
  {
    name: "Waste",
    value: "326",
    unit: "kg",
    change: "Demo indicator",
    icon: "Recycle",
  },
  {
    name: "Carbon emissions",
    value: "1,245",
    unit: "kg CO₂",
    change: "Demo estimate",
    icon: "Leaf",
  },
];

export const consumptionData = [
  { day: "Mon", electricity: 380, water: 210, waste: 32 },
  { day: "Tue", electricity: 420, water: 245, waste: 36 },
  { day: "Wed", electricity: 350, water: 190, waste: 29 },
  { day: "Thu", electricity: 465, water: 260, waste: 41 },
  { day: "Fri", electricity: 400, water: 225, waste: 34 },
  { day: "Sat", electricity: 270, water: 155, waste: 24 },
  { day: "Sun", electricity: 210, water: 120, waste: 18 },
];

export const alerts = [
  {
    id: 1,
    title: "Unusual electricity usage",
    building: "EEE Block",
    severity: "High",
    resource: "Electricity",
    time: "Demo alert",
  },
  {
    id: 2,
    title: "Water usage above baseline",
    building: "Library",
    severity: "Medium",
    resource: "Water",
    time: "Demo alert",
  },
  {
    id: 3,
    title: "Review waste collection",
    building: "Architecture Block",
    severity: "Low",
    resource: "Waste",
    time: "Demo alert",
  },
];
