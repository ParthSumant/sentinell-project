
export const resourceDetails = {
  Electricity: {
    unit: "kWh",
    total: 2480,
    description: "Illustrative electricity consumption",
    breakdown: [
      { name: "Administration", value: 420 },
      { name: "Maa Saraswati Block", value: 680 },
      { name: "EEE Block", value: 590 },
      { name: "Architecture Block", value: 460 },
      { name: "Library", value: 330 },
    ],
  },

  Water: {
    unit: "kL",
    total: 18.2,
    description: "Illustrative water consumption",
    breakdown: [
      { name: "Administration", value: 3.1 },
      { name: "Maa Saraswati Block", value: 4.8 },
      { name: "EEE Block", value: 3.2 },
      { name: "Architecture Block", value: 3.4 },
      { name: "Library", value: 3.7 },
    ],
  },

  Waste: {
    unit: "kg",
    total: 326,
    description: "Illustrative waste collection",
    breakdown: [
      { name: "Administration", value: 48 },
      { name: "Maa Saraswati Block", value: 86 },
      { name: "EEE Block", value: 64 },
      { name: "Architecture Block", value: 72 },
      { name: "Library", value: 56 },
    ],
  },

  "Carbon emissions": {
    unit: "kg CO₂",
    total: 1245,
    description: "Illustrative estimated emissions",
    breakdown: [
      { name: "Administration", value: 210 },
      { name: "Maa Saraswati Block", value: 330 },
      { name: "EEE Block", value: 295 },
      { name: "Architecture Block", value: 240 },
      { name: "Library", value: 170 },
    ],
  },
};
