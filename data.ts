
import { SORItem } from './types';

export const INITIAL_SOR_DATA: Omit<SORItem, 'id' | 'timestamp'>[] = [
  // Driveway Works
  { name: "Earthwork (soil)", unit: "m³", rate: 163.85, scopeOfWork: "Excavation in soil for driveway construction", source: "Driveway Works" },
  { name: "Filling excavated earth", unit: "m³", rate: 197.91, scopeOfWork: "Refilling and ramming of excavated earth in layers", source: "Driveway Works" },
  { name: "CC 1:4:8 (40 mm)", unit: "m³", rate: 5216.62, scopeOfWork: "Cement concrete 1:4:8 with 40mm graded stone aggregate", source: "Driveway Works" },
  { name: "Brick work CM 1:6", unit: "m³", rate: 5548.07, scopeOfWork: "Brick work with common burnt clay bricks in cement mortar 1:6", source: "Driveway Works" },
  { name: "Plaster 12 mm CM 1:4", unit: "m²", rate: 248.82, scopeOfWork: "12mm cement plaster of mix 1:4", source: "Driveway Works" },
  { name: "RCC 1:2:4", unit: "m³", rate: 6116.75, scopeOfWork: "Reinforced cement concrete 1:2:4 excluding steel", source: "Driveway Works" },
  { name: "WMM", unit: "m³", rate: 2379.99, scopeOfWork: "Wet Mix Macadam for road base", source: "Driveway Works" },
  { name: "M40 pavers 80 mm", unit: "m²", rate: 1009.18, scopeOfWork: "80mm thick M40 grade interlock pavers", source: "Driveway Works" },

  // Culvert & Approach
  { name: "CC 1:3:6", unit: "m³", rate: 5519.95, scopeOfWork: "Cement concrete 1:3:6 for culvert foundations", source: "Culvert & Approach" },
  { name: "RCC (Culvert)", unit: "m³", rate: 6954.39, scopeOfWork: "Reinforced cement concrete for culvert slabs/walls", source: "Culvert & Approach" },
  { name: "Suspended slab shuttering", unit: "m²", rate: 624.46, scopeOfWork: "Centering and shuttering for suspended slabs", source: "Culvert & Approach" },
  { name: "TMT steel Fe500D", unit: "kg", rate: 75.24, scopeOfWork: "Thermo-mechanically treated reinforcement bars", source: "Culvert & Approach" },
  { name: "Structural steel", unit: "kg", rate: 118.04, scopeOfWork: "Fabrication and hoisting of structural steel members", source: "Culvert & Approach" },
  { name: "GSB (CBR 30)", unit: "m³", rate: 2268.53, scopeOfWork: "Granular Sub-Base with CBR value 30", source: "Culvert & Approach" },

  // Canopy
  { name: "Profile roofing sheet", unit: "m²", rate: 953.93, scopeOfWork: "Pre-painted galvalume profile roofing sheets", source: "Canopy" },
  { name: "Ridge sheet", unit: "m", rate: 375.10, scopeOfWork: "Matching ridge pieces for canopy roofing", source: "Canopy" },
  { name: "Flashing sheet", unit: "m", rate: 332.12, scopeOfWork: "Side/End flashing for canopy waterproofing", source: "Canopy" },
  { name: "Structural steel (Canopy)", unit: "kg", rate: 91.68, scopeOfWork: "Heavy structural steel for canopy framing", source: "Canopy" },
  { name: "Metal false ceiling", unit: "m²", rate: 1352.12, scopeOfWork: "Aluminium/Steel linear false ceiling system", source: "Canopy" },
  { name: "RWP 110 mm", unit: "m", rate: 274.86, scopeOfWork: "110mm Rain Water Pipe for drainage", source: "Canopy" },
  { name: "RWP 160 mm", unit: "m", rate: 728.41, scopeOfWork: "160mm Heavy duty Rain Water Pipe", source: "Canopy" },
  { name: "Enamel paint", unit: "m²", rate: 159.62, scopeOfWork: "Two coats of synthetic enamel paint over primer", source: "Canopy" },
  { name: "Cu cable 3C×1.5", unit: "m", rate: 112.13, scopeOfWork: "3 Core 1.5 sqmm copper cable for canopy lighting", source: "Canopy" },
  { name: "Cu cable 3C×2.5", unit: "m", rate: 137.42, scopeOfWork: "3 Core 2.5 sqmm copper cable", source: "Canopy" },
  { name: "LED linear 80 W IP65", unit: "each", rate: 11006.90, scopeOfWork: "80W IP65 rated linear LED canopy light fixture", source: "Canopy" },
  { name: "GI flashing sheet 18G", unit: "m²", rate: 3456.85, scopeOfWork: "18 Gauge Galvanized Iron flashing", source: "Canopy" },
  { name: "Aluminium gutter", unit: "m", rate: 938.64, scopeOfWork: "Heavy duty aluminium gutter for canopy drainage", source: "Canopy" },

  // Hoarding Board
  { name: "Extra lift (Hoarding)", unit: "m³", rate: 81.46, scopeOfWork: "Additional charge for lift in excavation", source: "Hoarding Board" },
  { name: "Column shuttering", unit: "m²", rate: 661.09, scopeOfWork: "Shuttering for hoarding columns", source: "Hoarding Board" },
  { name: "MS tube", unit: "kg", rate: 129.25, scopeOfWork: "Medium/Heavy MS tubes for hoarding frame", source: "Hoarding Board" },
  { name: "Anchor bolt set", unit: "each", rate: 218.13, scopeOfWork: "Foundation anchor bolt with nuts/washers", source: "Hoarding Board" },
  { name: "LED 30 W IP65", unit: "each", rate: 2506.53, scopeOfWork: "30W IP65 LED floodlight for hoarding", source: "Hoarding Board" },

  // Kerb Wall
  { name: "Cement primer", unit: "m²", rate: 54.07, scopeOfWork: "Water thinnable cement primer application", source: "Kerb Wall" },
  { name: "Exterior acrylic paint", unit: "m²", rate: 148.40, scopeOfWork: "Two coats of exterior acrylic emulsion", source: "Kerb Wall" },
  { name: "Precast kerb stone", unit: "m³", rate: 7547.18, scopeOfWork: "M25 grade precast concrete kerb stones", source: "Kerb Wall" },

  // Miscellaneous
  { name: "Mass concrete shuttering", unit: "m²", rate: 256.66, scopeOfWork: "Basic shuttering for mass concrete works", source: "Miscellaneous" },
  { name: "Anchor bolt 16 mm", unit: "each", rate: 94.50, scopeOfWork: "16mm foundation bolt", source: "Miscellaneous" },

  // WORK ITEM 20 – NON-CIVIL
  { name: "Granite cladding (black)", unit: "m²", rate: 3449.33, scopeOfWork: "Black granite cladding for DU islands", source: "Non-Civil" },
  { name: "Granite slab", unit: "m²", rate: 3799.97, scopeOfWork: "Polished granite slabs for facility tops", source: "Non-Civil" },
  { name: "Manhole 900 mm", unit: "each", rate: 130945.00, scopeOfWork: "900mm diameter heavy duty manhole cover and frame", source: "Non-Civil" },

  // Electrification
  { name: "Cu cable 3C×1.5 (FRLS)", unit: "m", rate: 103.64, scopeOfWork: "3 Core 1.5 sqmm FRLS Copper cable", source: "Electrification" },
  { name: "Cu cable 3C×2.5 FRLS", unit: "m", rate: 137.42, scopeOfWork: "3 Core 2.5 sqmm FRLS Copper cable", source: "Electrification" },
  { name: "Al cable 3.5C×35", unit: "m", rate: 218.82, scopeOfWork: "3.5 Core 35 sqmm Aluminium Armoured cable", source: "Electrification" },
  { name: "Earthing GI strip 50×10", unit: "m", rate: 366.16, scopeOfWork: "50x10mm GI strip for earthing", source: "Electrification" },
  { name: "GI wire 8 SWG", unit: "m", rate: 35.32, scopeOfWork: "8 SWG Galvanized Iron wire", source: "Electrification" },
  { name: "Medium RO Electrical Panel", unit: "each", rate: 216848.28, scopeOfWork: "Main electrical control panel for petrol pump", source: "Electrification" },
  { name: "LED Yard light 100 W", unit: "each", rate: 7097.05, scopeOfWork: "100W IP66 LED Yard light fixture", source: "Electrification" },
  { name: "Octagonal pole 5 m", unit: "each", rate: 9663.45, scopeOfWork: "5m Hot Dip Galvanized octagonal pole", source: "Electrification" },
  { name: "Octagonal pole 7 m", unit: "each", rate: 10797.62, scopeOfWork: "7m Hot Dip Galvanized octagonal pole", source: "Electrification" },

  // Air Facility
  { name: "Air compressor 5 HP", unit: "each", rate: 54183.99, scopeOfWork: "5HP reciprocating air compressor", source: "Air Facility" },
  { name: "Digital tyre inflator", unit: "each", rate: 52744.53, scopeOfWork: "Automatic digital tyre inflation system", source: "Air Facility" },
];
