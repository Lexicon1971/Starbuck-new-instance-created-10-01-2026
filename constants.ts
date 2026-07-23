
import { Commodity, EquipmentItem } from './types';

// Updated Initial Capacity
export const INITIAL_CARGO_CAPACITY = 500;
export const BASE_MAX_CARGO_CAPACITY = 5000; // Phase 1 Max
export const CARGO_UPGRADE_AMOUNT = 100;
export const CARGO_UPGRADE_COST = 2000;

export const TONS_UNIT = 'T';
export const CURRENCY_UNIT = '$B'; // Internal logic ref
export const COIN_MARKER = '$B'; // Marker for replacing with Icon
export const FUEL_NAME = 'VSS-Spice Emulsion';
export const NUTRI_PASTE_NAME = 'Nutri-Paste';
export const H2O_NAME = 'H2O';
export const POWER_CELL_NAME = 'Hot Isotope Hummers';
export const MESH_NAME = 'Z@onflex Weave Mesh';

// Goals Phases
export const GOAL_PHASE_1_DAYS = 5;
export const GOAL_PHASE_1_AMOUNT = 10000000; // 10 Million
export const GOAL_PHASE_2_DAYS = 12;
export const GOAL_PHASE_2_AMOUNT = 1000000000; // 1 Billion
export const GOAL_PHASE_3_DAYS = 30;
export const GOAL_PHASE_3_AMOUNT = 1000000000000; // 1 Trillion
export const GOAL_OVERTIME_DAYS = 35;

export const CONTRACT_LIMIT_P1 = 3;
export const CONTRACT_LIMIT_P2 = 5;
export const CONTRACT_LIMIT_P3 = 10;
export const TRADE_BAN_DURATION = 3;

export const REPAIR_COST = 1000;
export const REPAIR_INCREMENT = 5;
export const MAX_REPAIR_HEALTH = 150;
export const LASER_REPAIR_COST = 2000; 

export const LOAN_REPAYMENT_DAYS = 5; 

// v5.9.3 Mining Balancing
export const MINING_OVERLOAD_YIELD_MULT = 3;
export const MINING_OVERLOAD_RISK_MULT = 5;

export const TUTORIAL_QUOTES: Record<string, {text: string, color: string, author: string}> = {
    banking: { text: "Compound interest is the eighth wonder of the world. He who understands it, earns it... he who doesn't... pays it.", author: "Albert Einstein", color: "text-yellow-400" },
    travel: { text: "Not all those who wander are lost. Some are just looking for better profit margins.", author: "J.R.R. Tolkien (Adapted)", color: "text-emerald-400" },
    shop: { text: "Take my love, take my land, take me where I cannot stand. I don't care, I'm still free, you can't take the sky from me.", author: "Ballad of Serenity", color: "text-purple-400" },
    shipping: { text: "The spice must flow. He who controls the spice controls the universe.", author: "Frank Herbert", color: "text-blue-400" },
    comms: { text: "The single biggest problem in communication is the illusion that it has taken place.", author: "George Bernard Shaw", color: "text-gray-400" },
    fomo: { text: "Industry is the soul of business and the keystone of prosperity.", author: "Charles Dickens", color: "text-orange-400" }
};

const BUREAUCRACY_MESSAGES = [
    "The Galactic Trade Commission just mandated a new anti-grav sticker for all exported Zydium.",
    "Sector 7G's triplicate customs forms caused a 48-hour backlog. Demand is spiking.",
    "Your latest shipment of Chrono-Widgets has been flagged for 'Temporal Irregularity.' Expect delays.",
    "Auditors found one credit misplaced in 2077. The planet's economy is now frozen.",
    "New regulation: All cargo pilots must wear hats. Hat prices surge.",
    "The Dept of Redundancy Dept issued a new form for filling out forms.",
    "Tariffs on 'Things that beep' have tripled due to noise complaints.",
    "Customs officers are on strike. They demand better coffee.",
    "A typo in the tax code just made 'Zero' equal to 'One Million'. Chaos ensues.",
    "License renewal Required: 'Breathing License Class C'.",
    "Bureaucratic Error 404: Economy not found.",
    "Mandatory safety briefing regarding the dangers of paper cuts.",
    "The Emperor's signature stamp was stolen. No laws can be passed today.",
    "Tax Season extended by 6 light years.",
    "The Interstellar Zoning Board rezoned this trade lane as a 'Quiet Zone'."
];

const BIOLOGY_MESSAGES = [
    "The Vlorp Queen sneezed, creating a rush for tissues woven from Nebula Silk.",
    "Market panic: It turns out 'Glarb Oil' is highly addictive to space slugs. Buy low!",
    "A newly discovered species uses common rust as a gourmet spice. Scraps just became gold.",
    "Local stock of 'Antimatter Custard' plummeted after a food critic called it 'too beige.'",
    "Space Whales are migrating. Plankton futures are up.",
    "Warning: Do not pet the fuzzy cargo. It bites.",
    "The slime mold in Sector 4 has achieved sentience and is day-trading.",
    "Alien flu outbreak. Symptoms include turning plaid.",
    "Demand for salt licks increases as the rock-people population booms.",
    "A plant that eats money was found in the cargo hold.",
    "New species discovered: It looks like a potato but screams when peeled.",
    "The Zognoid ambassador is allergic to the color blue. Market adjusting.",
    "Bio-hazard: Someone left a sandwich in the airlock for 3 years.",
    "The sentient moss on Beta-9 is demanding voting rights.",
    "Rare bacteria found that turns lead into slightly heavier lead."
];

const GLITCH_MESSAGES = [
    "The market AI, 'HAL-9001,' decided today is Opposite Day. All sell orders are now buy orders.",
    "A massive teleportation accident swapped all Hyper-Batteries with sentient doorstops.",
    "The automated freighter fleet got distracted by a shiny asteroid. Supply delayed.",
    "The universal calculator rounded down too aggressively. We just got 10% more rich!",
    "Error: Market prices displayed in binary. 01000110!",
    "The navigation buoy is broadcasting disco music. Traffic jammed.",
    "Gravity generator glitch: Everything is now slightly to the left.",
    "The trading algorithm developed a crush on a toaster.",
    "System Update 98% complete... for the last 4 days.",
    "Data corruption: All cargo manifests now read 'Banana'.",
    "The holographic clerks are flickering. Seizure warning.",
    "Time-loop detected. Time-loop detected. Time-loop detected.",
    "The comms array is picking up soap operas from 1985.",
    "Firewall breach. The hackers only stole the virtual cookies.",
    "Robot uprising cancelled due to low battery."
];

const RELIC_MESSAGES = [
    "The original 21st-century 'meme stock' investor guide just resurfaced. Market volatility expected.",
    "Trade routes are jammed—everyone is buying 'Vintage Oxygen' canisters from the third planet.",
    "Demand for 'rubber ducks' has inexplicably gone intergalactic. Time to corner the market.",
    "Fashion trends on Xylar-4 now require neon pink socks. The textile market is exploding.",
    "Archaeologists found a 'Fidget Spinner'. Cults are forming.",
    "A 'Floppy Disk' sold for 1 million credits.",
    "Ancient Earth Artifact 'Nokia 3310' found intact. Used as ship armor.",
    "Collectors paying top dollar for 'Beanie Babies'.",
    "A 'Tamagotchi' survived 1000 years. It still needs feeding.",
    "Plastic straws are now the galaxy's rarest currency.",
    "An ancient 'Meme' has gone viral again.",
    "Twinkies found. Still edible."
];

const CONSPIRACY_MESSAGES = [
    "A reputable source claims all Space-Widgets are hollowed-out containers for spy drones.",
    "They say the price of Iron is tied directly to the emotional state of the Galactic Emperor's cat.",
    "It's not a glitch, it's a feature! The markets are controlled by a shadowy cabal of space squirrels.",
    "The 'Void Diamonds' are actually just compressed space lint. Don't tell anyone.",
    "Birds aren't real. Neither are spaceships.",
    "The moon landing was faked. Which moon? All of them.",
    "Hyperspace is just a loading screen.",
    "The stars are actually giant LEDs.",
    "Oxygen is a hallucinogen. Wake up, sheeple!",
    "The government is putting chemicals in the fuel to make the ships gay.",
    "Area 52 is just a distraction from Area 53.",
    "The universe is a simulation running on Windows 95.",
    "Time travel exists, but it's expensive.",
    "The Lizard People run the banks. Literally, they are lizards.",
    "Red ones don't actually go faster."
];

const CHEMISTRY_MESSAGES = [
    "H2O + CO2 + Sunlight -> Glucose + O2. Photosynthesis units operational.",
    "Warning: CH4 levels critical in Crew Quarters. Stop feeding the pilot beans.",
    "NaCl prices stable. Don't get salty.",
    "C8H10N4O2: The formula for caffeine. Pilot morale improving.",
    "Au (Gold) is conductive, but trading it is electrifying.",
    "He (Helium) shortage. Communications voices pitch increasing.",
    "Fe2O3 detected on hull. Rust never sleeps.",
    "C2H5OH supply critical. The space-bar is running dry.",
    "Ag (Silver) lining found in the nebula cloud.",
    "U235 stock glowing. Geiger counters clicking rhythmically.",
    "O3 layer depletion on Planet X. Sunscreen prices rising.",
    "CO (Carbon Monoxide) leak? I feel sleepy...",
    "Pb (Lead) shielding holding. Radiation nominal.",
    "NH3 (Ammonia) scrubbers requiring maintenance.",
    "H2SO4 rain predicted. Hull polish ruined.",
    "SiO2 (Sand) detected in gears. It's coarse and gets everywhere.",
    "Titanium alloy mix incorrect. Structural integrity questionable.",
    "Antimatter containment magnetic field stable. No boom today.",
    "Dark Matter isn't just a theory, it's sticky.",
    "Zero-G chemistry experiment created a sentient blob."
];

const GENERAL_SCIFI_MESSAGES = [
    "Don't panic.",
    "I've got a bad feeling about this.",
    "Beam me up.",
    "The truth is out there.",
    "In space, no one can hear you scream.",
    "Resistance is futile.",
    "Make it so.",
    "These are not the droids you are looking for.",
    "Live long and prosper.",
    "So long, and thanks for all the fish.",
    "It's a trap!",
    "I am your father's brother's nephew's cousin's former roommate.",
    "Open the pod bay doors, please.",
    "Set phasers to stun.",
    "To infinity and beyond!"
];

export const QUIRKY_MESSAGES_DB = {
    bureaucracy: BUREAUCRACY_MESSAGES,
    biology: BIOLOGY_MESSAGES,
    glitch: GLITCH_MESSAGES,
    relic: RELIC_MESSAGES,
    conspiracy: CONSPIRACY_MESSAGES,
    chemistry: CHEMISTRY_MESSAGES,
    general: GENERAL_SCIFI_MESSAGES
};

export const LOAN_FIRMS = [
  { name: "Starfleet Credit Union", baseRate: 1 },
  { name: "Tyrell Corporation Finance", baseRate: 3 },
  { name: "Weyland-Yutani Trust", baseRate: 5 },
  { name: "The Great Barter Bank", baseRate: 7 },
  { name: "The Hutt Cartel Lending", baseRate: 10 },
];

export const CONTRACT_FIRMS = [
  "Weyland-Yutani Logistics", "Choam Corp", "Federation Supply", "Hutt Smuggling Ring", "Cyberdyne Systems"
];

export const SHOP_ITEMS: EquipmentItem[] = [
  { id: 'laser_mk1', name: 'Mining Laser MK 1', type: 'laser', level: 1, cost: 5000, description: 'Mines Allthemantium Ore.', owned: false },
  { id: 'laser_mk2', name: 'Mining Laser MK 11', type: 'laser', level: 2, cost: 50000, description: 'Mines Ore + Antimatter. High yield extraction.', owned: false },
  { id: 'laser_mk3', name: 'Mining Laser MK 22 (OBB)', type: 'laser', level: 3, cost: 500000, description: 'Mines Ore, Anti, Dark Matter. Galactic standard.', owned: false },
  { id: 'scanner', name: 'Market Scanner MK 1', type: 'scanner', level: 1, cost: 10000, description: 'Auto-detect volatility on market boards.', owned: false },
  { id: 'scanner_mk2', name: 'Market Scanner MK 11', type: 'scanner', level: 2, cost: 1000000, description: 'Allows fixing one commodity\'s price for the next day.', owned: false },
  { id: 'scanner_mk3', name: 'Market Scanner MK 22 (OBB)', type: 'scanner', level: 3, cost: 10000000, description: 'Allows forcing a 10% increase in one commodity\'s max price range.', owned: false },
  { id: 'plasma_cannon_mk1', name: 'Plasma Cannons MK 1', type: 'defense', level: 1, cost: 15000, description: 'Basic pirate deterrent.', owned: false },
  { id: 'plasma_cannon_mk2', name: 'Plasma Cannons MK 11', type: 'defense', level: 2, cost: 75000, description: 'Advanced magnetic acceleration for higher deterrence.', owned: false },
  { id: 'plasma_cannon_mk3', name: 'Plasma Cannons MK 22 (OBB)', type: 'defense', level: 3, cost: 250000, description: 'Heavy bombardment capability. Pirates beware.', owned: false },
  { id: 'shield_gen_mk1', name: 'Deflector Shields MK 1', type: 'defense', level: 1, cost: 25000, description: 'Reduces navigational hazard impact.', owned: false },
  { id: 'shield_gen_mk2', name: 'Deflector Shields MK 11', type: 'defense', level: 2, cost: 125000, description: 'High-density ion envelope for better mitigation.', owned: false },
  { id: 'shield_gen_mk3', name: 'Deflector Shields MK 22 (OBB)', type: 'defense', level: 3, cost: 500000, description: 'Total kinetic absorption matrix. Absolute protection.', owned: false },
];

// CUSTOM ORDERED BY ENHANCEMENT 154
export const COMMODITIES: Commodity[] = [
  {
    name: "Allthemantium Ore",
    icon: "metal-lump",
    unitWeight: 5.0,
    minPrice: 50,
    maxPrice: 2500,
    rarity: 0.8,
    description: `Commodity Data Entry: Allthemantium Ore
Rarity: 80%

Weight: 5T

Value Range: $50 - $2,500

Description: The ultimate industrial backbone of interstellar construction. Containing a hyper-dense, chaotic matrix of every heavy metal known to the galaxy, it is the fundamental building block for heavy freighters, station bulkheads, and the Z@onflex Weave Mesh linings used in the Rusty Redeemer's cargo bay. Warning: Due to its extreme density, a single standard chunk weighs a crushing 5 tons—meaning your cargo struts will groan in agony the moment it touches the deck. Also makes an exceptionally expensive, floor-cracking paperweight for the captain's desk.`
  },
  {
    name: "Syntho-Zip-Cloth",
    icon: "🧵",
    unitWeight: 0.25,
    minPrice: 100,
    maxPrice: 1000,
    rarity: 0.6,
    description: `Commodity Data Entry: Syntho-Zip-Cloth
Rarity: 60%

Weight: 0.25T

Value Range: $100 - $1,000

Description: A high-tensile textile engineered from the finest recycled polymers extracted from the bellies of deep-space marine mammals who really, really loved eating space-station plastic straws. Essential for rigging cargo nets, pressure seals, and the flexible foundation of your Z@onflex Weave Mesh cargo bay. Now proudly manufactured in our new "slightly less scratchy" grade, meaning your crew will complain marginally less during bunk time.`
  },
  {
    name: H2O_NAME,
    icon: "💧",
    unitWeight: 1.0,
    minPrice: 5,
    maxPrice: 50,
    rarity: 0.1,
    description: `Commodity Data Entry: H2O
Rarity: 10%

Weight: 1T

Value Range: $5 - $55

Description: The ultimate, irreplaceable elixir of life. Or, as the cynical old-timers in the outer rim docks call it, "water." Essential for keeping biological crew members from turning into space-dried jerky, quenching the thirst of overworked isotope hummers, and acting as the crucial chemical binding agent in everything from your Z@onflex Weave Mesh cargo bay to crafting high-demand Stim-Packs. It may be common, but try flying a sector without it and see how far your stubborn hope gets you.`
  },
  { name: "Medi-Bio-Boo-Boo Packs", icon: "🩹", unitWeight: 0.01, minPrice: 400, maxPrice: 4000, rarity: 0.7, description: `Full Name: Medi-Bio-Boo-Boo Trauma & Hull-Burn Stabilization Kit

Description: For when the hull holds together but you don't. Perfect for patching a leaky suit or a gaping flesh wound, whichever comes first. Contains enough synthetic skin-glue and over-the-counter painkillers to keep you functional until you reach the next port. Features our proprietary extra space-space-bandages guaranteed to stick to anything except the wound.

Application: Essential for field maintenance of biological crew members following combat damage, hull burns, structural depressurization, or accidental exposure to shipboard hazards.

Interesting Fact: If combined with 2 Nutri-Paste and 1 H2O, it creates a high-potency Stim-Pack.` },
  {
    name: NUTRI_PASTE_NAME,
    icon: "🍲",
    unitWeight: 0.5,
    minPrice: 10,
    maxPrice: 100,
    rarity: 0.1,
    description: `Commodity Data Entry: Nutri-Paste
Rarity: 10%

Weight: 0.5T

Value Range: $11 - $110

Description: The culinary cornerstone of long-haul space travel. Tastes precisely like chicken-flavored oatmeal—or perhaps oatmeal-flavored chicken, depending entirely on which way the life-support filters are currently failing. It's hard to tell, but it keeps the crew's caloric intake just above the legal definition of starvation. Crucially, it doubles as both baseline rations and a key ingredient when combined with H2O to synthesize fresh Stim-Packs via F.O.M.O. Engineering.`
  },
  {
    name: MESH_NAME,
    icon: "🕸️",
    unitWeight: 2.5,
    minPrice: 5000,
    maxPrice: 25000,
    rarity: 0.9,
    description: `Commodity Data Entry: Z@onflex Weave Mesh
Rarity: 90%

Weight: 2.5T

Value Range: $5,000 - $25,000

Description: A true marvel of modern space-faring engineering. Compounded from a responsive matrix of H2O, Syntho-Zip-Cloth, and dense Allthemantium Ore, this flexible fabric features a pseudo-biological second-skin elasticity. It can physically expand and contract to hug any cargo profile, locking down volatile payloads during phase-shifting jumps and safely stretching the boundaries of your cargo hold beyond its structural limits. Just don't ask how it breathes when the jump drive charges—some mysteries are better left sealed in the dark.`
  },
  {
    name: "Stim-Packs",
    icon: "💉",
    unitWeight: 0.25,
    minPrice: 5000,
    maxPrice: 15000,
    rarity: 0.85,
    description: `Commodity Data Entry: Stim-Packs
Rarity: 85%

Weight: 0.25T

Value Range: $5,000 - $15,000

Description: The ultimate pharmaceutical insurance policy for the desperate trader. For when you absolutely, positively have to stay awake for three days straight while dodging Spice Bandits and managing an overheating isotope reactor. Packed with enough high-velocity adrenaline, synthetic skin-glue, and legal-gray-area stimulants to keep your heart hammering in your chest, they are in massive demand by biological colonies throughout the sector. Crafted right in your ship using a Medi-Bio-Boo-Boo Pack,2 Nutri-Paste, H2O, and a whole lot of reckless ambition via F.O.M.O. Engineering.`
  },
  {
    name: "Spacetime Tea",
    icon: "☕",
    unitWeight: 0.1,
    minPrice: 7,
    maxPrice: 70000,
    rarity: 0.5,
    description: `Commodity Data Entry: Spacetime Tea
Rarity: 50%

Weight: 0.1T

Value Range: $7 - $70,000

Description: A wildly volatile, multi-dimensional brew that allows the drinker to experience all moments of their life simultaneously. You'll remember what you ate for breakfast on your eighth birthday while tasting tomorrow's disaster right now. Best not to drink the whole cup at once unless you want your consciousness scattered across three distinct quadrants of the galaxy. Highly prized by temporal scholars, stressed-out traders, and anyone looking to casually bypass a warp-drive delay.`
  },
  {
    name: "G.I.R.L (Lite) Matter",
    icon: "💥",
    unitWeight: 0.5,
    minPrice: 10000,
    maxPrice: 100000,
    rarity: 0.99,
    description: `Commodity Data Entry: G.I.R.L. (Lite) Matter
Rarity: 99%

Weight: 0.5T

Value Range: $10,000 - $100,000

Description: Guaranteed Instability, Remarkably Lucrative. A profoundly illegal, sub-atomic cocktail that defies standard physics. The "Lite" version means it is only slightly less likely to spontaneously detonate and turn your cargo bay into a glowing tear in the fabric of space-time. Highly sought after by black-market research syndicates and reckless speculators willing to risk total molecular disintegration for a jaw-dropping payout at the terminal. Handle with extreme, prayerful caution.`
  },
  {
    name: "Dark Matter",
    icon: "🌌",
    unitWeight: 0.75,
    minPrice: 5000,
    maxPrice: 50000,
    rarity: 0.98,
    description: `Commodity Data Entry: Dark Matter
Rarity: 98%

Weight: 0.75T

Value Range: $5,000 - $50,000

Description: It's dark, it matters, and it is astronomical levels of expensive. A swirling, light-devouring anomaly contained within heavily shielded magnetic isolation flasks. What does it actually do? Don't ask, don't look directly at it without polarized visors, and definitely don't tap on the glass. Rumored to power jump drives, bend spacetime, or at the very least, make your cargo manifest look intensely intimidating to customs inspectors.`
  },
  {
    name: "Antimatter Rod",
    icon: "✨",
    unitWeight: 0.5,
    minPrice: 2500,
    maxPrice: 15000,
    rarity: 0.95,
    description: `Commodity Data Entry: Antimatter Rod
Rarity: 95%

Weight: 0.5T

Value Range: $2,500 - $15,000

Description: A tightly contained cylinder of pure, volatile destruction, humming with the terrifying potential of a thousand suns. Encased in cutting-edge magnetic containment fields that you just have to trust won't flicker when you hit a patch of space turbulence. Handle with absolute, sweat-dripping care—drop it on the deck plates, and your entire ship won't even have time to realize it's gone. Essential fuel source for high-end propulsion and heavy industrial systems across the outer rim.`
  },
  {
    name: "PC Chips",
    icon: "💾",
    unitWeight: 0.01,
    minPrice: 20,
    maxPrice: 2000,
    rarity: 0.65,
    description: `Commodity Data Entry: PC Chips
Rarity: 65%

Weight: 0.01T

Value Range: $20 - $2,000

Description: The microscopic silicon heart of the digital universe, powering everything from your ship's navigation computer to the coffee machine's error logs. Precision-etched and meticulously packaged, this batch comes with our patented guarantee: now engineered with precisely 1% less planned obsolescence, meaning they might actually survive two stellar jumps before demanding a firmware update. Essential for high-tech manufacturing, repairing fried avionics, or keeping your onboard terminal from blue-screening mid-docking sequence.`
  },
  {
    name: POWER_CELL_NAME,
    icon: "🔋",
    unitWeight: 0.1,
    minPrice: 50,
    maxPrice: 250,
    rarity: 0.5,
    description: `Commodity Data Entry: Hot Isotope Hummers
Rarity: 50%

Weight: 0.1T

Value Range: $50 - $250

Description: A vibrating, heavy-duty nuclear power cell that sings a low, radioactive lullaby while it works. Guaranteed to keep your critical ship devices running for at least a few H.O.U.R.S. (High-Output Utility Radioisotope Systems). Or your money back—which is impossible, since our corporate headquarters was vaporized in a sector-wide regulatory dispute. Essential for fueling everything from your overworked life support to the tea kettle when you need to brew up some Spacetime Tea.`
  },
  { name: FUEL_NAME, icon: "⛽", unitWeight: 0.20, minPrice: 10, maxPrice: 150, rarity: 0.2, description: `Full Name: Volatile Singularity Slipstream Spice Emulsion

Classification: High-Energy Propellant / Jump-Stabilizer

Description: A hyper-refined volatile compound essential for high-output jump drives. It doesn't just push the ship; it collapses spacetime into an envelope, threads you through the void, and calibrates your arrival vectors all while allowing you to mine and encounter events along the way in real-time.

Warning: Smells faintly of cinnamon and regret and is very addictive, and inhaling the fumes will turn your eyes Bright Blue.

Security Note: Presence of VSS-Spice Emulsion in cargo holds is the primary driver for high-threat intercepts by The Spice Bandits. Ensure kinetic cannons and defensive shielding are at peak operational capacity when transporting this substance.` },
];

export const VENUES = [
  "Deep Space 9 1/2", "Trantor Promenade", "Serenity Valley", "Corellia Shipyards", 
  "High Charity", "Giedi Plaza", "New Babylon", "Acheron LV-426", "Cantina Mos Eisley", "Centauri Prime"
];

export const BASE_DISTANCE_MATRIX = [
  [0, 5, 12, 1, 8, 4, 10, 3, 7, 9],
  [5, 0, 6, 8, 3, 11, 2, 9, 1, 7],
  [12, 6, 0, 10, 7, 3, 9, 1, 5, 4],
  [1, 8, 10, 0, 9, 6, 1, 11, 4, 3],
  [8, 3, 7, 9, 0, 5, 4, 2, 12, 1],
  [4, 11, 3, 6, 5, 0, 8, 7, 2, 10],
  [10, 2, 9, 1, 4, 8, 0, 6, 3, 5],
  [3, 9, 1, 11, 2, 7, 6, 0, 10, 8],
  [7, 1, 5, 4, 12, 2, 3, 10, 0, 6],
  [9, 7, 4, 3, 1, 10, 5, 8, 6, 0],
];
