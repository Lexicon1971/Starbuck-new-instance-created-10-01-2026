
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronsRight, Zap, PiggyBank, Briefcase, Anchor, Shield, Ship, Gem, Bot, BrainCircuit, Activity, Dna, Factory, Lightbulb, User, MessageSquare, Cog, Warehouse, Truck, Coins, ArrowRight, X, ChevronDown, ChevronUp, Droplets, Flame, HelpCircle, Swords, Target, CircleDotDashed, Scale, Microscope, Package, Sprout, Handshake, University, Hammer, Wrench, Sparkles, Siren, FlaskConical, Drill, Pickaxe, Info, Star, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react';

// Assuming types.ts is in the same directory or accessible
import {
    Commodity, Market, CargoItem, WarehouseItem, GameState, LoanOffer, ActiveLoan,
    Contract, LogEntry, DailyReport, Stats, HighScore, EquipmentItem,
    PendingTrade, Stock, Encounter, BankInvestment, CommodityId
} from './types';
import { initial } from 'cypress/types/lodash';

// Constants
const GAME_VERSION = "v10.2.7 RETROSPEAK";
const INITIAL_CASH = 35000;
const INITIAL_CARGO_CAPACITY = 500;
const SHIP_MAX_HEALTH = 100;
const LASER_MAX_HEALTH = 100;
const DAILY_MAINTENANCE_FEE = 1000;
const VENUES = ["Hub", "Cronus", "Rhea", "Iapetus", "Hyperion", "Phoebe", "Tethys", "Dione", "Enceladus"];
const COMMODITIES: Record<CommodityId, Commodity> = {
    'common_minerals': { name: "Common Minerals", icon: "💎", unitWeight: 10, minPrice: 20, maxPrice: 80, rarity: 1, description: "Basic minerals for industrial use." },
    'precious_metals': { name: "Precious Metals", icon: "🥇", unitWeight: 5, minPrice: 100, maxPrice: 500, rarity: 2, description: "Gold, silver, and platinum." },
    'industrial_gems': { name: "Industrial Gems", icon: "💍", unitWeight: 2, minPrice: 500, maxPrice: 2000, rarity: 3, description: "Used in high-tech manufacturing." },
    'alien_artifacts': { name: "Alien Artifacts", icon: "👽", unitWeight: 1, minPrice: 2000, maxPrice: 10000, rarity: 4, description: "Mysterious objects from another civilization." },
    'water': { name: "Hydro-Fuel", icon: "💧", unitWeight: 1, minPrice: 10, maxPrice: 30, rarity: 1, description: "Essential for life support and basic travel." },
    'food_supplies': { name: "Nutri-Paste", icon: "🍎", unitWeight: 2, minPrice: 30, maxPrice: 100, rarity: 1, description: "Standardized nutritional substance." },
    'medical_supplies': { name: "Medi-Kits", icon: "⚕️", unitWeight: 1, minPrice: 80, maxPrice: 300, rarity: 2, description: "Advanced medical equipment and drugs." },
    'technology_parts': { name: "Tech Components", icon: "⚙️", unitWeight: 3, minPrice: 200, maxPrice: 800, rarity: 2, description: "Parts for repairing and building machinery." },
    'weaponry': { name: "Weaponry", icon: "🔫", unitWeight: 4, minPrice: 400, maxPrice: 1500, rarity: 3, description: "Personal and ship-grade arms." },
    'narcotics': { name: "Illegal Narcotics", icon: "💊", unitWeight: 0.5, minPrice: 1000, maxPrice: 5000, rarity: 4, description: "Highly illegal and highly profitable substances." },
    'space_marines': { name: "Mercenaries", icon: "👨‍🚀", unitWeight: 1, minPrice: 1500, maxPrice: 6000, rarity: 4, description: "Hired guns for 'special' missions." },
    'ai_constructs': { name: "AI Cores", icon: "🤖", unitWeight: 2, minPrice: 3000, maxPrice: 12000, rarity: 5, description: "Sophisticated artificial intelligences." },
    'quantum_computers': { name: "Quantum Computers", icon: "💻", unitWeight: 5, minPrice: 5000, maxPrice: 20000, rarity: 5, description: "Cutting-edge computational devices." },
    'exotic_matter': { name: "Exotic Matter", icon: "✨", unitWeight: 0.1, minPrice: 10000, maxPrice: 50000, rarity: 6, description: "Matter with unusual physical properties." },
    'fusion_reactors': { name: "Fusion Reactors", icon: "⚛️", unitWeight: 20, minPrice: 8000, maxPrice: 30000, rarity: 5, description: "Powerful energy sources for colonies." },
    'terraforming_kits': { name: "Terraforming Kits", icon: "🌍", unitWeight: 15, minPrice: 12000, maxPrice: 45000, rarity: 6, description: "Equipment to make planets habitable." },
    'livestock': { name: "Genetic Livestock", icon: "🐄", unitWeight: 10, minPrice: 600, maxPrice: 2500, rarity: 3, description: "Engineered animals for food and labor." },
    'robots': { name: "Service Robots", icon: "🤖", unitWeight: 5, minPrice: 1000, maxPrice: 4000, rarity: 3, description: "Automated helpers for various tasks." },
    'luxury_goods': { name: "Luxury Goods", icon: "👑", unitWeight: 1, minPrice: 2000, maxPrice: 8000, rarity: 4, description: "High-end items for the wealthy." },
    'research_data': { name: "Scientific Data", icon: "🔬", unitWeight: 0.1, minPrice: 500, maxPrice: 3000, rarity: 2, description: "Valuable research findings." },
    'cultural_artifacts': { name: "Cultural Relics", icon: "🏛️", unitWeight: 2, minPrice: 1500, maxPrice: 7000, rarity: 4, description: "Historical items from various cultures." },
    'software': { name: "Software Licenses", icon: "📜", unitWeight: 0, minPrice: 300, maxPrice: 1200, rarity: 2, description: "Licenses for advanced software." },
    'building_materials': { name: "Construction Materials", icon: "🏗️", unitWeight: 25, minPrice: 100, maxPrice: 400, rarity: 1, description: "Materials for building structures." },
    'mining_equipment': { name: "Mining Drones", icon: "🔧", unitWeight: 8, minPrice: 2000, maxPrice: 8000, rarity: 3, description: "Automated equipment for mining." },
    'communication_systems': { name: "Communication Arrays", icon: "📡", unitWeight: 6, minPrice: 1500, maxPrice: 6000, rarity: 3, description: "Systems for long-range communication." },
    'life_support_systems': { name: "Life Support Units", icon: "🌬️", unitWeight: 12, minPrice: 3000, maxPrice: 12000, rarity: 4, description: "Systems for maintaining habitable environments." },
    'entertainment_media': { name: "Holo-Reels", icon: "🎬", unitWeight: 0.1, minPrice: 50, maxPrice: 200, rarity: 1, description: "Popular entertainment media." },
    'art': { name: "Fine Art", icon: "🎨", unitWeight: 1, minPrice: 2500, maxPrice: 10000, rarity: 5, description: "Unique and valuable works of art." },
    'historical_documents': { name: "Historical Texts", icon: "📚", unitWeight: 0.5, minPrice: 1000, maxPrice: 5000, rarity: 4, description: "Important documents from the past." },
    'black_market_data': { name: "Black Market Intel", icon: "🤫", unitWeight: 0, minPrice: 5000, maxPrice: 20000, rarity: 5, description: "Illicit but valuable information." },
    'unstable_isotopes': { name: "Unstable Isotopes", icon: "💥", unitWeight: 0.2, minPrice: 8000, maxPrice: 35000, rarity: 6, description: "Highly volatile and dangerous materials." },
    'alien_pets': { name: "Exotic Pets", icon: "🐾", unitWeight: 2, minPrice: 1500, maxPrice: 6000, rarity: 4, description: "Rare and exotic creatures from other worlds." },
    'pharmaceuticals': { name: "Advanced Pharmaceuticals", icon: "💊", unitWeight: 0.5, minPrice: 1200, maxPrice: 5000, rarity: 3, description: "Life-enhancing or performance-boosting drugs." },
    'military_grade_armor': { name: "Combat Armor", icon: "🛡️", unitWeight: 8, minPrice: 3000, maxPrice: 12000, rarity: 4, description: "Armor for high-risk combat situations." },
    'nebula_gas': { name: "Nebula Gas", icon: "☁️", unitWeight: 0.1, minPrice: 4000, maxPrice: 18000, rarity: 5, description: "Rare gas with unique properties." },
    'dark_matter': { name: "Dark Matter", icon: "⚫", unitWeight: 0.01, minPrice: 50000, maxPrice: 200000, rarity: 7, description: "The most mysterious substance in the universe." },
    'antimatter': { name: "Antimatter", icon: "💥", unitWeight: 0.01, minPrice: 100000, maxPrice: 500000, rarity: 8, description: "Extremely volatile and powerful energy source." },
    'time_crystals': { name: "Time Crystals", icon: "⏳", unitWeight: 0.1, minPrice: 200000, maxPrice: 1000000, rarity: 9, description: "Crystals that oscillate at a constant frequency." },
    'sentient_plants': { name: "Sentient Plants", icon: "🌿", unitWeight: 3, minPrice: 2000, maxPrice: 9000, rarity: 4, description: "Plants with a form of consciousness." },
    'nanobots': { name: "Nanobots", icon: "🤖", unitWeight: 0.1, minPrice: 6000, maxPrice: 25000, rarity: 5, description: "Microscopic robots for construction or destruction." },
    'zero_point_energy_modules': { name: "ZPE Modules", icon: "⚡", unitWeight: 1, minPrice: 15000, maxPrice: 60000, rarity: 7, description: "Devices that tap into zero-point energy." },
};

const EQUIPMENT: Record<string, EquipmentItem> = {
    // Lasers
    'laser_1': { id: 'laser_1', name: "Standard Mining Laser", type: 'laser', level: 1, cost: 5000, description: "Basic laser for mining.", owned: true, canBeDamaged: true },
    'laser_2': { id: 'laser_2', name: "Advanced Mining Laser", type: 'laser', level: 2, cost: 20000, description: "More efficient and powerful laser.", owned: false, canBeDamaged: true },
    'laser_3': { id: 'laser_3', name: "Crystal-Fusion Laser", type: 'laser', level: 3, cost: 80000, description: "Top-tier laser, cuts through anything.", owned: false, canBeDamaged: true },

    // Defense
    'defense_1': { id: 'defense_1', name: "Basic Shields", type: 'defense', level: 1, cost: 7000, description: "Standard shielding against pirates.", owned: true },
    'defense_2': { id: 'defense_2', name: "Reinforced Shields", type: 'defense', level: 2, cost: 25000, description: "Improved defense capabilities.", owned: false },
    'defense_3': { id: 'defense_3', name: "Aegis Shield Matrix", type: 'defense', level: 3, cost: 90000, description: "Ultimate protection against all threats.", owned: false },

    // Scanners
    'scanner_1': { id: 'scanner_1', name: "Basic Market Scanner", type: 'scanner', level: 1, cost: 10000, description: "Reveals buy/sell prices at all venues.", owned: false },
    'scanner_2': { id: 'scanner_2', name: "Advanced Intel Scanner", type: 'scanner', level: 2, cost: 40000, description: "Unlocks commodity price fixing ability.", owned: false },
    'scanner_3': { id: 'scanner_3', name: "Quantum Flux Scanner", type: 'scanner', level: 3, cost: 120000, description: "Unlocks market manipulation abilities.", owned: false },
};

const ENCOUNTERS: Encounter[] = [
    { type: 'pirate', title: "Pirate Attack!", description: "A pirate ship is demanding a tribute.", riskDamage: 20, demandAmount: 5000 },
    { type: 'accident', title: "Asteroid Field!", description: "You've strayed into a dense asteroid field.", riskDamage: 30, itemLoss: 'random' },
    { type: 'derelict', title: "Derelict Ship", description: "You've found a derelict ship. You might find something valuable.", riskDamage: 5 },
    { type: 'fuel_breach', title: "Fuel Line Breach", description: "A fuel line has ruptured, venting precious fuel into space!", riskDamage: 10, targetItem: 'Hydro-Fuel' },
    { type: 'police', title: "Customs Inspection", description: "A customs patrol wants to inspect your cargo for contraband.", riskDamage: 5, demandAmount: 2000 },
];
// Speech Synthesis Queue
class SpeechSynthesisQueue {
    private queue: string[];
    private speaking: boolean;
    private synth: SpeechSynthesis;
    private voices: SpeechSynthesisVoice[];
    private onSpeakingChange: (speaking: boolean) => void;

    constructor(onSpeakingChange: (speaking: boolean) => void = () => {}) {
        this.queue = [];
        this.speaking = false;
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.onSpeakingChange = onSpeakingChange;
        this.synth.onvoiceschanged = () => {
            this.voices = this.synth.getVoices().filter(v => v.lang.startsWith('en'));
        };
    }

    speak(text: string, pitch = 1, rate = 1) {
        if (text) {
            this.queue.push(JSON.stringify({ text, pitch, rate }));
            if (!this.speaking) {
                this.processQueue();
            }
        }
    }

    private processQueue() {
        if (this.queue.length === 0) {
            this.speaking = false;
            this.onSpeakingChange(false);
            return;
        }

        this.speaking = true;
        this.onSpeakingChange(true);
        const { text, pitch, rate } = JSON.parse(this.queue.shift()!);
        const utterance = new SpeechSynthesisUtterance(text);

        const retroVoice = this.voices.find(voice => voice.name.includes("Google US English") || voice.name.includes("Daniel"));
        utterance.voice = retroVoice || this.voices[0] || null;

        utterance.pitch = pitch;
        utterance.rate = rate;
        utterance.onend = () => {
            this.processQueue();
        };
        this.synth.speak(utterance);
    }
}

const speechSynthesisQueue = new SpeechSynthesisQueue();

const speak = (text: string, pitch = 1.2, rate = 1.5) => {
    speechSynthesisQueue.speak(text, pitch, rate);
};
const speakRetro = (text: string) => speak(text, 0.8, 1.2);
const speakComputer = (text: string) => speak(text, 1.5, 1.8);
const speakNews = (text: string) => speak(text, 1, 1);
// Game App Component
const App: React.FC = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const speechSynthesisQueue = useRef(new SpeechSynthesisQueue(setIsSpeaking)).current;

    const speak = (text: string, pitch = 1.2, rate = 1.5) => {
        speechSynthesisQueue.speak(text, pitch, rate);
    };
    const speakRetro = (text: string) => speak(text, 0.8, 1.2);

    const [gameState, setGameState] = useState<GameState>(() => {
        const savedGame = localStorage.getItem('gameState_v10.2.7');
        return savedGame ? JSON.parse(savedGame) : null;
    });
    const [activeTab, setActiveTab] = useState('console');
    const [logisticsTab, setLogisticsTab] =
    useState('shipping');
    const [showIntro, setShowIntro] = useState(!localStorage.getItem('gameState_v10.2.7'));
    const [showModal, setShowModal] = useState<React.ReactNode | null>(null);
    const [selectedCommodity, setSelectedCommodity] = useState<string | null>(null);
    const [showFullLog, setShowFullLog] = useState(false);
    const [tradeQuantities, setTradeQuantities] = useState<Record<string, string>>({});
    const [shippingQuantities, setShippingQuantities] = useState<Record<string, { quantity: string, destination: string }>>({});
    const [storageQuantities, setStorageQuantities] = useState<Record<string, Record<string, string>>>({});
    const [miningInput, setMiningInput] = useState<{ [key: string]: string }>({});
    const [fabricationQuantities, setFabricationQuantities] = useState<Record<string, string>>({});

    const initializeGame = useCallback(() => {
        const initialMarkets = VENUES.map(() => {
            const market: Market = {};
            Object.keys(COMMODITIES).forEach(id => {
                const comm = COMMODITIES[id];
                const price = Math.floor(Math.random() * (comm.maxPrice - comm.minPrice + 1) + comm.minPrice);
                const quantity = Math.floor(Math.random() * 200 / comm.rarity);
                market[id] = { price, quantity, standardQuantity: quantity, depletionDays: 0 };
            });
            return market;
        });

        const newGameState: GameState = {
            day: 1,
            cash: INITIAL_CASH,
            currentVenueIndex: 0,
            cargo: {},
            warehouse: {},
            cargoWeight: 0,
            cargoCapacity: INITIAL_CARGO_CAPACITY,
            markets: initialMarkets,
            shipHealth: SHIP_MAX_HEALTH,
            laserHealth: LASER_MAX_HEALTH,
            equipment: { 'laser_1': true, 'defense_1': true, 'scanner_1': false, 'scanner_2': false, 'scanner_3': false },
            activeLoans: [],
            investments: [],
            loanOffers: [],
            activeContracts: [],
            availableContracts: [],
            loanTakenToday: false,
            venueTradeBans: {},
            messages: [{ id: Date.now(), message: `Game started. Welcome, Captain! Version: ${GAME_VERSION}`, type: 'info' }],
            stats: { largestSingleWin: 0, largestSingleLoss: 0 },
            gameOver: false,
            gamePhase: 1,
            highScores: [],
            tutorialActive: true,
            tutorialFlags: {},
            dailyTransactions: {},
            fomoDailyUse: { mesh: false, stims: false },
            warrantLevel: 0,
            sectorPasses: [],
            stocks: [
                { name: 'StarBux', price: 100, quantity: 0, risk: 'low' },
                { name: 'Galacticorp', price: 250, quantity: 0, risk: 'medium' },
                { name: 'Nebula Mining', price: 500, quantity: 0, risk: 'high' }
            ],
            jackpot: 1000000,
            hasTradedStocksToday: false,
        };
        setGameState(newGameState);
        setShowIntro(false);
    }, []);
    // Utility functions
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
    };

    const addLog = (message: string, type: LogEntry['type'] = 'info') => {
        setGameState(prev => {
            if (!prev) return null;
            const newLog = { id: Date.now() + Math.random(), message, type };
            return { ...prev, messages: [newLog, ...prev.messages] };
        });
    };
    // Game logic functions
    const evolveMarkets = (prevGameState: GameState): GameState => {
        const newMarkets = [...prevGameState.markets];
        const events: string[] = [];

        // Market evolution logic
        newMarkets.forEach((market, venueIndex) => {
            Object.keys(market).forEach(id => {
                const comm = COMMODITIES[id];
                let price = market[id].price;
                const change = (Math.random() - 0.5) * (comm.maxPrice - comm.minPrice) * 0.2;
                price += change;
                price = Math.max(comm.minPrice, Math.min(comm.maxPrice, price));
                market[id].price = Math.round(price);
            });
        });

        // Generate random market events
        if (Math.random() < 0.3) {
            const venueIndex = Math.floor(Math.random() * VENUES.length);
            const commodityId = Object.keys(COMMODITIES)[Math.floor(Math.random() * Object.keys(COMMODITIES).length)];
            const eventType = Math.random() > 0.5 ? 'boom' : 'bust';
            const eventMessage = `${COMMODITIES[commodityId].name} prices have ${eventType === 'boom' ? 'skyrocketed' : 'plummeted'} at ${VENUES[venueIndex]}!`;
            events.push(eventMessage);
            addLog(eventMessage, 'info');

            const priceChangeFactor = eventType === 'boom' ? 1.5 : 0.5;
            newMarkets[venueIndex][commodityId].price = Math.round(newMarkets[venueIndex][commodityId].price * priceChangeFactor);
        }

        return { ...prevGameState, markets: newMarkets };
    };
    const processDay = () => {
        setGameState(prev => {
            if (!prev) return null;
            let newState = { ...prev };

            // Daily maintenance
            newState.cash -= DAILY_MAINTENANCE_FEE;
            addLog(`Paid ${formatCurrency(DAILY_MAINTENANCE_FEE)} for daily maintenance.`, 'maintenance');

            // Evolve markets
            newState = evolveMarkets(newState);

            // Process loans
            const newLoans = newState.activeLoans.map(loan => {
                const dailyInterest = loan.principal * (loan.interestRate / 100);
                const newDebt = loan.currentDebt + dailyInterest;
                return { ...loan, currentDebt: newDebt, daysRemaining: loan.daysRemaining - 1 };
            }).filter(loan => loan.daysRemaining > 0);
            newState.activeLoans = newLoans;

            // Process contracts
            const newContracts = newState.activeContracts.map(c => {
                if (c.status === 'active') {
                    c.daysRemaining -= 1;
                    if (c.daysRemaining <= 0) {
                        c.status = 'failed';
                        newState.cash -= c.penalty;
                        const message = `Unfortunately, the contract for ${c.firm} consignment of ${c.commodity} failed. You have been fined ${formatCurrency(c.penalty)} and are banned from trading at ${VENUES[c.destinationIndex]} for 3 days.`;
                        addLog(message, 'danger');
                        speakRetro(message);

                        const banDuration = 3;
                        newState.venueTradeBans = {
                            ...newState.venueTradeBans,
                            [c.destinationIndex]: banDuration
                        };
                    }
                }
                return c;
            });
            newState.activeContracts = newContracts;

            // Check for completed contracts
            Object.keys(newState.warehouse).forEach(vIdx => {
                const venueIndex = parseInt(vIdx);
                const venueWarehouse = newState.warehouse[venueIndex];
                Object.keys(venueWarehouse).forEach(commName => {
                    const item = venueWarehouse[commName];
                    if (newState.day >= item.arrivalDay) {
                        const contractIndex = newState.activeContracts.findIndex(c =>
                            c.commodity === commName &&
                            c.destinationIndex === venueIndex &&
                            c.quantity <= item.quantity &&
                            c.status === 'active'
                        );

                        if (contractIndex > -1) {
                            const c = newState.activeContracts[contractIndex];
                            newState.cash += c.reward;
                            const message = `The contract for ${c.firm} consignment of ${c.commodity} has arrived at ${VENUES[c.destinationIndex]} the contact has been successfully completed.`;
                            addLog(message, 'contract');
                            speakRetro(message);
                            c.status = 'completed';
                            item.quantity -= c.quantity;
                        }
                    }
                });
            });

            // Reset daily flags
            newState.loanTakenToday = false;
            newState.dailyTransactions = {};

            // Reset scanner boosts
            if (newState.fixedCommodity) {
                newState.fixedCommodity = undefined;
            }
            if (newState.boostedCommodity && newState.day > newState.boostedCommodity.boostedDay) {
                newState.boostedCommodity = undefined;
            }

            // Update day
            newState.day += 1;

            runTutorialCheck(newState.day);

            return newState;
        });

        // After state update, generate new offers
        generateNewLoanOffers();
        generateNewContracts();
    };
    const handleTrade = (commodityId: string, action: 'buy' | 'sell') => {
        setGameState(prev => {
            if (!prev) return null;
            const quantityStr = tradeQuantities[commodityId] || '0';
            const quantity = parseInt(quantityStr, 10);
            if (isNaN(quantity) || quantity <= 0) return prev;

            const market = prev.markets[prev.currentVenueIndex];
            const price = market[commodityId].price;
            const totalCost = quantity * price;

            if (action === 'buy') {
                if (prev.cash < totalCost) {
                    addLog("Not enough cash to complete purchase.", 'danger');
                    return prev;
                }
                const newWeight = prev.cargoWeight + quantity * COMMODITIES[commodityId].unitWeight;
                if (newWeight > prev.cargoCapacity) {
                    addLog("Not enough cargo space.", 'danger');
                    return prev;
                }
                const newCargo = { ...prev.cargo };
                const existing = newCargo[commodityId] || { quantity: 0, averageCost: 0 };
                const totalQuantity = existing.quantity + quantity;
                const newAverageCost = ((existing.quantity * existing.averageCost) + totalCost) / totalQuantity;
                newCargo[commodityId] = { quantity: totalQuantity, averageCost: newAverageCost };

                addLog(`Bought ${quantity} units of ${COMMODITIES[commodityId].name} for ${formatCurrency(totalCost)}.`, 'buy');
                return { ...prev, cash: prev.cash - totalCost, cargo: newCargo, cargoWeight: newWeight };
            } else { // sell
                const existing = prev.cargo[commodityId];
                if (!existing || existing.quantity < quantity) {
                    addLog("Not enough items to sell.", 'danger');
                    return prev;
                }

                const newCargo = { ...prev.cargo };
                if (existing.quantity === quantity) {
                    delete newCargo[commodityId];
                } else {
                    newCargo[commodityId] = { ...existing, quantity: existing.quantity - quantity };
                }
                const newWeight = prev.cargoWeight - quantity * COMMODITIES[commodityId].unitWeight;

                const profit = totalCost - (quantity * existing.averageCost);
                if (profit > 0) {
                    addLog(`Sold ${quantity} units of ${COMMODITIES[commodityId].name} for ${formatCurrency(totalCost)}. Profit: ${formatCurrency(profit)}.`, 'sell');
                } else {
                    addLog(`Sold ${quantity} units of ${COMMODITIES[commodityId].name} for ${formatCurrency(totalCost)}. Loss: ${formatCurrency(Math.abs(profit))}.`, 'sell');
                }
                return { ...prev, cash: prev.cash + totalCost, cargo: newCargo, cargoWeight: newWeight };
            }
        });
        setTradeQuantities(prev => ({ ...prev, [commodityId]: '' }));
    };
    const handleShipping = (commodityId: string) => {
        setGameState(prev => {
            if (!prev) return null;
            const { quantity: quantityStr, destination: destStr } = shippingQuantities[commodityId] || { quantity: '0', destination: '0' };
            const quantity = parseInt(quantityStr, 10);
            const destinationIndex = parseInt(destStr, 10);

            if (isNaN(quantity) || quantity <= 0 || isNaN(destinationIndex)) {
                addLog("Invalid shipping details.", 'danger');
                return prev;
            }

            const cargoItem = prev.cargo[commodityId];
            if (!cargoItem || cargoItem.quantity < quantity) {
                addLog(`Not enough ${COMMODITIES[commodityId].name} in cargo.`, 'danger');
                return prev;
            }

            const shippingCost = quantity * 10; // Example shipping cost
            if (prev.cash < shippingCost) {
                addLog(`Not enough cash for shipping. Cost: ${formatCurrency(shippingCost)}`, 'danger');
                return prev;
            }
            // Calculate arrival day
            const travelTime = 1; // Simplified: 1 day travel
            const arrivalDay = prev.day + travelTime;

            // Update cargo
            const newCargo = { ...prev.cargo };
            cargoItem.quantity -= quantity;
            if (cargoItem.quantity === 0) {
                delete newCargo[commodityId];
            }

            // Update warehouse
            const newWarehouse = JSON.parse(JSON.stringify(prev.warehouse));
            if (!newWarehouse[destinationIndex]) {
                newWarehouse[destinationIndex] = {};
            }
            if (!newWarehouse[destinationIndex][commodityId]) {
                newWarehouse[destinationIndex][commodityId] = { quantity: 0, originalAvgCost: 0, arrivalDay: 0 };
            }
            const whItem = newWarehouse[destinationIndex][commodityId];
            whItem.quantity += quantity;
            whItem.originalAvgCost = cargoItem.averageCost; // Keep track of original cost
            whItem.arrivalDay = arrivalDay;


            // Update cargo weight
            const newWeight = prev.cargoWeight - (quantity * COMMODITIES[commodityId].unitWeight);

            addLog(`Shipped ${quantity} ${COMMODITIES[commodityId].name} to ${VENUES[destinationIndex]}. Arrival on day ${arrivalDay}.`, 'info');

            return { ...prev, cash: prev.cash - shippingCost, cargo: newCargo, warehouse: newWarehouse, cargoWeight: newWeight };
        });
        setShippingQuantities(prev => ({ ...prev, [commodityId]: { quantity: '', destination: '0' } }));
    };
    const sellFromWarehouse = (venueIndex: number, commodityId: string) => {
        setGameState(prev => {
            if (!prev) return null;
            const quantityStr = storageQuantities[venueIndex]?.[commodityId] || '0';
            const quantity = parseInt(quantityStr, 10);

            if (isNaN(quantity) || quantity <= 0) {
                addLog("Invalid quantity.", 'danger');
                return prev;
            }

            const warehouse = prev.warehouse[venueIndex];
            const item = warehouse?.[commodityId];

            if (!item || item.quantity < quantity) {
                addLog("Not enough items in storage.", 'danger');
                return prev;
            }

            const market = prev.markets[venueIndex];
            const price = market[commodityId].price;
            const totalValue = quantity * price;

            // Update warehouse
            const newWarehouse = JSON.parse(JSON.stringify(prev.warehouse));
            item.quantity -= quantity;
            if (item.quantity === 0) {
                delete newWarehouse[venueIndex][commodityId];
            }

            const profit = totalValue - (quantity * item.originalAvgCost);
            if (profit > 0) {
                addLog(`Sold ${quantity} ${COMMODITIES[commodityId].name} from ${VENUES[venueIndex]} for ${formatCurrency(totalValue)}. Profit: ${formatCurrency(profit)}.`, 'sell');
            } else {
                addLog(`Sold ${quantity} ${COMMODITIES[commodityId].name} from ${VENUES[venueIndex]} for ${formatCurrency(totalValue)}. Loss: ${formatCurrency(Math.abs(profit))}.`, 'sell');
            }

            return { ...prev, cash: prev.cash + totalValue, warehouse: newWarehouse };
        });
        setStorageQuantities(prev => {
            const newQuantities = { ...prev };
            if (newQuantities[venueIndex]) {
                newQuantities[venueIndex][commodityId] = '';
            }
            return newQuantities;
        });
    };
    const generateNewLoanOffers = () => {
        setGameState(prev => {
            if (!prev) return null;
            const offers: LoanOffer[] = [];
            for (let i = 0; i < 3; i++) {
                offers.push({
                    firmName: `Firm ${String.fromCharCode(65 + i)}`,
                    amount: Math.floor(Math.random() * 20000) + 5000,
                    interestRate: Math.floor(Math.random() * 10) + 5
                });
            }
            return { ...prev, loanOffers: offers };
        });
    };
    const takeLoan = (offer: LoanOffer) => {
        setGameState(prev => {
            if (!prev || prev.loanTakenToday) return prev;
            const newLoan: ActiveLoan = {
                id: Date.now(),
                firmName: offer.firmName,
                principal: offer.amount,
                currentDebt: offer.amount,
                interestRate: offer.interestRate,
                daysRemaining: 10, // 10 day loan term
                originalDay: prev.day,
            };
            addLog(`Took a loan of ${formatCurrency(offer.amount)} from ${offer.firmName}.`, 'info');
            return { ...prev, cash: prev.cash + offer.amount, activeLoans: [...prev.activeLoans, newLoan], loanTakenToday: true };
        });
    };
    const repayLoan = (loanId: number) => {
        setGameState(prev => {
            if (!prev) return null;
            const loan = prev.activeLoans.find(l => l.id === loanId);
            if (!loan) return prev;
            if (prev.cash < loan.currentDebt) {
                addLog("Not enough cash to repay loan.", 'danger');
                return prev;
            }
            addLog(`Repaid loan from ${loan.firmName} for ${formatCurrency(loan.currentDebt)}.`, 'info');
            return { ...prev, cash: prev.cash - loan.currentDebt, activeLoans: prev.activeLoans.filter(l => l.id !== loanId) };
        });
    };

    const generateNewContracts = () => {
        setGameState(prev => {
            if (!prev || !COMMODITIES) return null;
            const availableCommodities = Object.keys(COMMODITIES);
            if (availableCommodities.length === 0) return prev;

            const newContracts: Contract[] = [];
            for (let i = 0; i < 5; i++) {
                const commodityId = availableCommodities[Math.floor(Math.random() * availableCommodities.length)];
                const commodity = COMMODITIES[commodityId];
                const quantity = Math.floor(Math.random() * 50) + 10;
                const destinationIndex = Math.floor(Math.random() * (VENUES.length - 1)) + 1; // Not Hub
                const baseValue = quantity * ((commodity.minPrice + commodity.maxPrice) / 2);
                const reward = Math.floor(baseValue * (1.5 + Math.random()));
                const penalty = Math.floor(reward * 0.5);

                newContracts.push({
                    id: Date.now() + i,
                    firm: `Corp ${i + 1}`,
                    commodity: commodity.name,
                    quantity,
                    destinationIndex,
                    reward,
                    daysRemaining: 5,
                    penalty,
                    status: 'active',
                });
            }
            return { ...prev, availableContracts: newContracts };
        });
    };
    const acceptContract = (contractId: number) => {
        setGameState(prev => {
            if (!prev) return prev;
            const contract = prev.availableContracts.find(c => c.id === contractId);
            if (!contract) return prev;
            addLog(`Accepted contract from ${contract.firm}.`, 'contract');
            return {
                ...prev,
                activeContracts: [...prev.activeContracts, contract],
                availableContracts: prev.availableContracts.filter(c => c.id !== contractId),
            };
        });
    };
    const repairShip = (amount: number) => {
        setGameState(prev => {
            if (!prev) return prev;
            const cost = amount * 100;
            if (prev.cash < cost) {
                addLog("Not enough cash for repairs.", 'danger');
                return prev;
            }
            const newHealth = Math.min(SHIP_MAX_HEALTH, prev.shipHealth + amount);
            addLog(`Repaired ship hull for ${formatCurrency(cost)}.`, 'repair');
            return { ...prev, cash: prev.cash - cost, shipHealth: newHealth };
        });
    };
    const repairLaser = (amount: number) => {
        setGameState(prev => {
            if (!prev) return prev;
            const cost = amount * 50;
            if (prev.cash < cost) {
                addLog("Not enough cash for laser realignment.", 'danger');
                return prev;
            }
            const newHealth = Math.min(LASER_MAX_HEALTH, prev.laserHealth + amount);
            addLog(`Realigned laser for ${formatCurrency(cost)}.`, 'repair');
            return { ...prev, cash: prev.cash - cost, laserHealth: newHealth };
        });
    };
    const buyEquipment = (itemId: string) => {
        setGameState(prev => {
            if (!prev) return prev;
            const item = EQUIPMENT[itemId];
            if (!item || item.owned) return prev;
            if (prev.cash < item.cost) {
                addLog("Not enough cash to buy equipment.", 'danger');
                return prev;
            }
            const newEquipment = { ...prev.equipment, [itemId]: true };
            addLog(`Purchased ${item.name}.`, 'info');
            return { ...prev, cash: prev.cash - item.cost, equipment: newEquipment };
        });
    };

    const expandCargo = (amount: number) => {
        setGameState(prev => {
            if (!prev) return prev;
            const cost = amount * 150;
            if (prev.cash < cost) {
                addLog("Not enough cash for cargo expansion.", 'danger');
                return prev;
            }
            addLog(`Expanded cargo capacity by ${amount}T for ${formatCurrency(cost)}.`, 'info');
            return { ...prev, cash: prev.cash - cost, cargoCapacity: prev.cargoCapacity + amount };
        });
    };
    const performMining = () => {
        const { 'Hydro-Fuel': fuel, 'Common Minerals': probes } = miningInput;
        const fuelAmount = parseInt(fuel, 10) || 0;
        const probeAmount = parseInt(probes, 10) || 0;

        if (fuelAmount <= 0 || probeAmount <= 0) {
            addLog("Fuel and probes are required for mining.", 'danger');
            return;
        }

        setGameState(prev => {
            if (!prev) return null;

            const fuelInCargo = prev.cargo['water']?.quantity || 0;
            const probesInCargo = prev.cargo['common_minerals']?.quantity || 0;

            if (fuelInCargo < fuelAmount || probesInCargo < probeAmount) {
                addLog("Not enough fuel or probes in cargo.", 'danger');
                return prev;
            }

            // Consume resources
            let newCargo = { ...prev.cargo };
            newCargo['water'].quantity -= fuelAmount;
            if (newCargo['water'].quantity === 0) delete newCargo['water'];
            newCargo['common_minerals'].quantity -= probeAmount;
            if (newCargo['common_minerals'].quantity === 0) delete newCargo['common_minerals'];

            const laserEfficiency = prev.equipment['laser_3'] ? 1.5 : (prev.equipment['laser_2'] ? 1.2 : 1);
            const yieldAmount = Math.floor((fuelAmount * 0.5 + probeAmount * 2) * laserEfficiency);

            const minedCommodityId = 'precious_metals';
            const minedCommodity = COMMODITIES[minedCommodityId];

            const newWeight = prev.cargoWeight - (fuelAmount * COMMODITIES['water'].unitWeight) - (probeAmount * COMMODITIES['common_minerals'].unitWeight) + (yieldAmount * minedCommodity.unitWeight);

            if (newWeight > prev.cargoCapacity) {
                addLog("Not enough cargo space for mined materials.", 'danger');
                return prev;
            }

            if (!newCargo[minedCommodityId]) {
                newCargo[minedCommodityId] = { quantity: 0, averageCost: 0 };
            }
            newCargo[minedCommodityId].quantity += yieldAmount;

            addLog(`Mining successful! Acquired ${yieldAmount} units of ${minedCommodity.name}.`, 'mining');

            return { ...prev, cargo: newCargo, cargoWeight: newWeight };
        });

        setMiningInput({});
    };

    const handleFabrication = (itemId: string, required: { id: string, amount: number }[]) => {
        setGameState(prev => {
            if (!prev) return null;

            const quantityStr = fabricationQuantities[itemId] || '0';
            const quantity = parseInt(quantityStr, 10);
            if (isNaN(quantity) || quantity <= 0) return prev;

            let canFabricate = true;
            let totalCost = 0;
            const newCargo = { ...prev.cargo };

            required.forEach(req => {
                const itemInCargo = prev.cargo[req.id];
                if (!itemInCargo || itemInCargo.quantity < req.amount * quantity) {
                    canFabricate = false;
                    addLog(`Not enough ${COMMODITIES[req.id].name}.`, 'danger');
                }
            });

            if (!canFabricate) return prev;

            required.forEach(req => {
                newCargo[req.id].quantity -= req.amount * quantity;
                if (newCargo[req.id].quantity === 0) delete newCargo[req.id];
            });

            if (!newCargo[itemId]) {
                newCargo[itemId] = { quantity: 0, averageCost: 0 };
            }
            newCargo[itemId].quantity += quantity;

            const newWeight = calculateCargoWeight(newCargo);

            if (newWeight > prev.cargoCapacity) {
                addLog("Not enough cargo space for fabricated items.", 'danger');
                return prev; // Revert changes
            }

            addLog(`Fabricated ${quantity} unit(s) of ${COMMODITIES[itemId].name}.`, 'info');

            return { ...prev, cargo: newCargo, cargoWeight: newWeight };
        });
        setFabricationQuantities(prev => ({...prev, [itemId]: ''}));
    };

    const calculateCargoWeight = (cargo: Record<string, CargoItem>) => {
        return Object.entries(cargo).reduce((total, [id, item]) => {
            return total + (item.quantity * COMMODITIES[id].unitWeight);
        }, 0);
    };

    const handleEncounter = () => {
        const encounter = ENCOUNTERS[Math.floor(Math.random() * ENCOUNTERS.length)];
        let message = encounter.description;
        setGameState(prev => {
            if (!prev) return null;
            let newCash = prev.cash;
            let newShipHealth = prev.shipHealth;
            let newCargo = { ...prev.cargo };

            if (encounter.type === 'pirate') {
                const demanded = encounter.demandAmount || 5000;
                if (newCash > demanded) {
                    newCash -= demanded;
                    message += ` You paid ${formatCurrency(demanded)} to avoid a fight.`;
                } else {
                    newShipHealth -= encounter.riskDamage;
                    message += ` You couldn't pay and your ship was damaged.`;
                }
            } else if (encounter.type === 'accident') {
                newShipHealth -= encounter.riskDamage;
                const cargoKeys = Object.keys(newCargo);
                if (cargoKeys.length > 0) {
                    const lostItemId = cargoKeys[Math.floor(Math.random() * cargoKeys.length)];
                    const lostQuantity = Math.min(newCargo[lostItemId].quantity, 10);
                    newCargo[lostItemId].quantity -= lostQuantity;
                    if (newCargo[lostItemId].quantity === 0) delete newCargo[lostItemId];
                    message += ` You lost ${lostQuantity} units of ${COMMODITIES[lostItemId].name}.`;
                }
            } else if (encounter.type === 'derelict') {
                const foundCash = Math.floor(Math.random() * 5000);
                newCash += foundCash;
                message += ` You salvaged ${formatCurrency(foundCash)}!`;
            }

            const newWeight = calculateCargoWeight(newCargo);
            addLog(message, 'danger');
            return { ...prev, cash: newCash, shipHealth: newShipHealth, cargo: newCargo, cargoWeight: newWeight };
        });
    };
    const showCommodityIntel = (commodityId: string, source: 'market' | 'storage' = 'market', venueIndex?: number) => {
        if (!gameState || !gameState.equipment['scanner_1']) {
            addLog("Market Scanner required for this feature.", 'danger');
            return;
        }
        const prices = gameState.markets.map((market, i) => ({ venue: VENUES[i], price: market[commodityId].price }));
        prices.sort((a, b) => a.price - b.price);
        const bestBuy = prices[0];
        const bestSell = prices[prices.length - 1];

        const intelContent = (
            <div className="text-sm">
                <h3 className="text-lg font-bold text-emerald-300 mb-2">{COMMODITIES[commodityId].name} Market Intel</h3>
                <p>Global Average Price: <span className="text-yellow-400">{formatCurrency(prices.reduce((acc, p) => acc + p.price, 0) / prices.length)}</span></p>
                <div className="mt-4">
                    <h4 className="font-bold text-emerald-400">Best Buy Location:</h4>
                    <p>{bestBuy.venue} at {formatCurrency(bestBuy.price)}</p>
                </div>
                <div className="mt-2">
                    <h4 className="font-bold text-emerald-400">Best Sell Location:</h4>
                    <p>{bestSell.venue} at {formatCurrency(bestSell.price)}</p>
                </div>
                <div className="flex justify-around mt-4">
                    {source === 'market' ? (
                        <>
                            <button onClick={() => fixCommodityPrice(commodityId)} disabled={!gameState.equipment['scanner_2']} className="btn-secondary">Fix Price</button>
                            <button onClick={() => boostPriceRange(commodityId)} disabled={!gameState.equipment['scanner_3']} className="btn-secondary">Boost Prices</button>
                        </>
                    ) : (
                        <button onClick={() => {
                            setShowModal(null);
                            // This needs a modal to ask for quantity
                            const quantity = gameState.warehouse[venueIndex!][commodityId].quantity;
                            setStorageQuantities(prev => ({ ...prev, [venueIndex!]: { ...prev[venueIndex!], [commodityId]: String(quantity) }}));
                            sellFromWarehouse(venueIndex!, commodityId);
                        }} className="btn-primary">Sell</button>
                    )}
                </div>
            </div>
        );
        setShowModal(intelContent);
    };

    const fixCommodityPrice = (commodityId: string) => {
        setGameState(prev => {
            if (!prev || !prev.equipment['scanner_2']) return prev;
            const currentPrices = prev.markets.map(m => m[commodityId].price);
            addLog(`Locked prices for ${COMMODITIES[commodityId].name} for one day.`, 'info');
            const newMarkets = prev.markets.map((market, index) => ({
                ...market,
                [commodityId]: { ...market[commodityId], price: currentPrices[index] }
            }));
            return {
                ...prev,
                markets: newMarkets,
                fixedCommodity: { name: commodityId, venuePrices: currentPrices }
            };
        });
        setShowModal(null);
    };

    const boostPriceRange = (commodityId: string) => {
        setGameState(prev => {
            if (!prev || !prev.equipment['scanner_3']) return prev;
            addLog(`Boosting price range for ${COMMODITIES[commodityId].name} for one day.`, 'info');
            return {
                ...prev,
                boostedCommodity: { name: commodityId, boostedDay: prev.day }
            };
        });
        setShowModal(null);
    };

    // Use effects
    useEffect(() => {
        if (!gameState) {
            initializeGame();
        }
    }, [gameState, initializeGame]);

    useEffect(() => {
        if (gameState) {
            localStorage.setItem('gameState_v10.2.7', JSON.stringify(gameState));
        }
    }, [gameState]);

    useEffect(() => {
        if (!showIntro) {
            speakRetro("Welcome, Captain.");
        }
    }, [showIntro]);

    const runTutorialCheck = (day: number) => {
        if(day === 2) {
            speakRetro("Captain, it is day 2. Time to mine some asteroids. Use your fuel and probes wisely.");
        }
        if(day === 5) {
            speakRetro("It is day 5, Captain. Remember to manage your finances. A wise captain saves for a rainy day.");
        }
    };

    if (!gameState) {
        return (
            <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Loading...</h1>
                    <p>If the game doesn't load, please click below to start a new game.</p>
                    <button className="mt-4 px-4 py-2 bg-emerald-500 rounded" onClick={initializeGame}>
                        Start New Game
                    </button>
                </div>
            </div>
        );
    }

    if (showIntro) {
        return (
            <div className="h-screen bg-black text-white flex flex-col items-center justify-center font-mono p-8">
                <h1 className="text-5xl font-bold text-emerald-400 mb-4 animate-pulse">
                    $TAR BUCKS
                </h1>
                <h2 className="text-2xl text-yellow-300 mb-8">TRADE EMPIRE 5: {GAME_VERSION}</h2>
                <p className="max-w-2xl text-center text-lg text-gray-300 mb-8 leading-relaxed">
                    The year is 2242. You are a down-on-your-luck space trader with a mountain of debt, a rusty ship, and a dream. The galaxy is your marketplace, a sprawling network of planets and stations buzzing with opportunity and danger. Can you navigate the volatile markets, outsmart corporate rivals, and build a trading empire that will be remembered for centuries? Or will you be just another forgotten spacer, lost to the cold void?
                </p>
                <button
                    className="text-2xl bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-3 px-8 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg shadow-emerald-500/30"
                    onClick={initializeGame}
                >
                    Board Ship
                </button>
            </div>
        );
    }
    const renderModal = () => {
        if (!showModal) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
                <div className="bg-gray-800 border border-emerald-500 rounded-lg p-6 max-w-lg w-full">
                    <div className="flex justify-end">
                        <button onClick={() => setShowModal(null)} className="text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                    {showModal}
                </div>
            </div>
        );
    };

    // UI Rendering
    const CargoStatusDial = () => {
        const usage = (gameState.cargoWeight / gameState.cargoCapacity) * 100;
        const colorClass = usage > 100 ? 'text-red-500' : 'text-green-500';
        const label = usage > 100 ? 'Overloaded' : 'Within Limits';

        return (
          <div className="flex flex-col items-center">
            <p>Cargo: {gameState.cargoWeight.toFixed(1)}T / {gameState.cargoCapacity}T</p>
            <p className={colorClass}>{label}</p>
          </div>
        );
      };

    return (
        <div className="bg-black text-gray-200 min-h-screen font-mono flex flex-col">
            {renderModal()}
            <header className="bg-gray-900 p-2 border-b-2 border-emerald-700 grid grid-cols-3 sm:grid-cols-6 items-center gap-2 text-xs">
                <div className="col-span-1">
                    <h1 className="text-lg font-bold text-emerald-400">$TAR BUCKS <span className="text-xs text-yellow-400">{GAME_VERSION}</span></h1>
                </div>
                <div className="flex flex-col items-center">
                    <p>Day: {gameState.day}</p>
                    <p>Phase: {gameState.gamePhase}</p>
                </div>
                <div className="flex flex-col items-center">
                    <p className="text-emerald-300">{formatCurrency(gameState.cash)}</p>
                    <p>Net Worth: {formatCurrency(gameState.cash /* + assets */)}</p>
                </div>
                <div className="flex items-center justify-center space-x-4">
                    <p>Hull: {gameState.shipHealth}%</p>
                    <p>Laser: {gameState.laserHealth}%</p>
                </div>
                <div className="flex flex-col items-center">
                    <p>Fuel/Cells: ...</p>
                </div>
                <div className="flex flex-col items-center">
                    <CargoStatusDial />
                </div>
            </header>

            <main className="flex-grow flex">
                <nav className="w-16 bg-gray-900 flex flex-col items-center py-4 space-y-4 border-r-2 border-emerald-700">
                    {['console', 'ibank', 'upgrades', 'logistics', 'fomo', 'gigo'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`p-2 rounded-lg ${activeTab === tab ? 'bg-emerald-700' : 'hover:bg-gray-700'}`}
                            title={tab.charAt(0).toUpperCase() + tab.slice(1)}
                        >
                            {/* Icons would go here */}
                            {tab === 'console' && <ChevronsRight size={24} />}
                            {tab === 'ibank' && <PiggyBank size={24} />}
                            {tab === 'upgrades' && <Zap size={24} />}
                            {tab === 'logistics' && <Briefcase size={24} />}
                            {tab === 'fomo' && <Factory size={24} />}
                            {tab === 'gigo' && <Bot size={24} />}
                        </button>
                    ))}
                </nav>

                <div className="flex-grow p-4">
                    {/* Console View */}
                    {activeTab === 'console' && (
                        <div>
                            <h2 className="text-xl font-bold text-emerald-400">Venue: {VENUES[gameState.currentVenueIndex]}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <h3 className="text-lg font-bold">Market</h3>
                                    <div className="h-96 overflow-y-auto border border-emerald-600 p-2">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-emerald-300">
                                                    <th>Commodity</th>
                                                    <th>Price</th>
                                                    <th>Qty</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.keys(gameState.markets[gameState.currentVenueIndex]).map(id => (
                                                    <tr key={id} className="border-b border-gray-700">
                                                        <td>{COMMODITIES[id].name} <button onClick={() => showCommodityIntel(id)}><Info size={12}/></button></td>
                                                        <td>{formatCurrency(gameState.markets[gameState.currentVenueIndex][id].price)}</td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                className="w-16 bg-gray-800 border border-gray-600 rounded px-1"
                                                                value={tradeQuantities[id] || ''}
                                                                onChange={(e) => setTradeQuantities({ ...tradeQuantities, [id]: e.target.value })}
                                                            />
                                                        </td>
                                                        <td>
                                                            <button onClick={() => handleTrade(id, 'buy')} className="text-green-400 px-2">B</button>
                                                            <button onClick={() => handleTrade(id, 'sell')} className="text-red-400 px-2">S</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Cargo Hold</h3>
                                    <div className="h-96 overflow-y-auto border border-emerald-600 p-2">
                                        <table className="w-full text-sm">
                                        <thead>
                                                <tr className="text-left text-emerald-300">
                                                    <th>Item</th>
                                                    <th>Qty</th>
                                                    <th>Avg Cost</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.keys(gameState.cargo).map(id => (
                                                    <tr key={id} className="border-b border-gray-700">
                                                        <td>{COMMODITIES[id].name}</td>
                                                        <td>{gameState.cargo[id].quantity}</td>
                                                        <td>{formatCurrency(gameState.cargo[id].averageCost)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                     {activeTab === 'logistics' && (
                        <div>
                            <h2 className="text-xl font-bold text-emerald-400 mb-4">Logistics Deck</h2>
                            <div className="flex space-x-2 border-b border-emerald-700 mb-4">
                                <button onClick={() => setLogisticsTab('shipping')} className={`pb-2 ${logisticsTab === 'shipping' ? 'border-b-2 border-emerald-400' : ''}`}>Shipping</button>
                                <button onClick={() => setLogisticsTab('storage')} className={`pb-2 ${logisticsTab === 'storage' ? 'border-b-2 border-emerald-400' : ''}`}>Storage</button>
                                <button onClick={() => setLogisticsTab('contracts')} className={`pb-2 ${logisticsTab === 'contracts' ? 'border-b-2 border-emerald-400' : ''}`}>Contracts</button>
                            </div>
                            {/* Shipping Tab */}
                            {logisticsTab === 'shipping' && (
                                <div>
                                    <h3 className="text-lg font-bold mb-2">Ship Cargo to Warehouse</h3>
                                    <div className="h-[450px] overflow-y-auto">
                                        {Object.keys(gameState.cargo).map(id => (
                                            <div key={id} className="grid grid-cols-4 gap-2 items-center p-2 border-b border-gray-700">
                                                <div>{COMMODITIES[id].name} ({gameState.cargo[id].quantity})</div>
                                                <input
                                                    type="number"
                                                    placeholder="Qty"
                                                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1"
                                                    value={shippingQuantities[id]?.quantity || ''}
                                                    onChange={(e) => setShippingQuantities({...shippingQuantities, [id]: {...shippingQuantities[id], quantity: e.target.value }})}
                                                />
                                                <select
                                                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1"
                                                    value={shippingQuantities[id]?.destination || '0'}
                                                    onChange={(e) => setShippingQuantities({...shippingQuantities, [id]: {...shippingQuantities[id], destination: e.target.value }})}
                                                >
                                                    {VENUES.map((v, i) => (
                                                        <option key={i} value={i}>{v}</option>
                                                    ))}
                                                </select>
                                                <button onClick={() => handleShipping(id)} className="bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded">Ship</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Storage Tab */}
                            {logisticsTab === 'storage' && (
                                <div>
                                    <h3 className="text-lg font-bold mb-2">Warehouse Storage</h3>
                                    <div className="h-[450px] overflow-y-auto">
                                        {Object.entries(gameState.warehouse).map(([venueIndex, items]) => (
                                            <div key={venueIndex}>
                                                <h4 className="font-bold text-emerald-300 mt-2">{VENUES[parseInt(venueIndex)]}</h4>
                                                {Object.entries(items).map(([commodityId, item]) => (
                                                    <div key={commodityId} className="grid grid-cols-5 gap-2 items-center p-2 border-b border-gray-700">
                                                        <div>{COMMODITIES[commodityId].name} ({item.quantity})</div>
                                                        <input
                                                            type="number"
                                                            placeholder="Qty"
                                                            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1"
                                                            value={storageQuantities[parseInt(venueIndex)]?.[commodityId] || ''}
                                                            onChange={e => {
                                                                const newQuantities = {...storageQuantities};
                                                                if (!newQuantities[parseInt(venueIndex)]) newQuantities[parseInt(venueIndex)] = {};
                                                                newQuantities[parseInt(venueIndex)][commodityId] = e.target.value;
                                                                setStorageQuantities(newQuantities);
                                                            }}
                                                        />
                                                        <div className="text-xs">Arrives: Day {item.arrivalDay}</div>
                                                        <button onClick={() => showCommodityIntel(commodityId, 'storage', parseInt(venueIndex))} className="bg-blue-600 px-3 py-1 rounded text-xs">Intel</button>
                                                        <button
                                                            onClick={() => sellFromWarehouse(parseInt(venueIndex), commodityId)}
                                                            disabled={gameState.day < item.arrivalDay}
                                                            className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded disabled:bg-gray-600"
                                                        >
                                                            Sell
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Contracts Tab */}
                            {logisticsTab === 'contracts' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold mb-2">Available Contracts</h3>
                                        <div className="h-[420px] overflow-y-auto">
                                            {gameState.availableContracts.map(c => (
                                                <div key={c.id} className="p-2 border rounded border-gray-600 mb-2">
                                                    <p>From: {c.firm}</p>
                                                    <p>Deliver: {c.quantity} of {c.commodity}</p>
                                                    <p>To: {VENUES[c.destinationIndex]}</p>
                                                    <p>Reward: {formatCurrency(c.reward)}</p>
                                                    <button onClick={() => acceptContract(c.id)} className="bg-green-600 w-full mt-1 py-1 rounded">Accept</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold mb-2">Active Contracts</h3>
                                        <div className="h-[420px] overflow-y-auto">
                                        {gameState.activeContracts.map(c => (
                                                <div key={c.id} className={`p-2 border rounded mb-2 ${c.status === 'completed' ? 'border-green-500' : c.status === 'failed' ? 'border-red-500' : 'border-yellow-500'}`}>
                                                    <p>To: {VENUES[c.destinationIndex]} ({c.quantity} {c.commodity})</p>
                                                    <p>Reward: {formatCurrency(c.reward)}</p>
                                                    <p>Days Left: {c.daysRemaining}</p>
                                                    <p>Status: {c.status}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'upgrades' && (
                        <div className="border border-emerald-700 p-4 rounded">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-emerald-400">Fixathing'u'ma Jig Deck</h2>
                                <div className="flex space-x-4">
                                    <div>
                                        <p>Hull Integrity: {gameState.shipHealth}%</p>
                                        <button onClick={() => repairShip(10)} className="bg-blue-600 px-3 py-1 rounded text-xs">Repair 10%</button>
                                    </div>
                                    <div>
                                        <p>Laser Realignment: {gameState.laserHealth}%</p>
                                        <button onClick={() => repairLaser(10)} className="bg-blue-600 px-3 py-1 rounded text-xs">Realign 10%</button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Left Column */}
                                <div>
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-bold mb-2">Cargo Expansion</h3>
                                            <p>Cargo Capacity: {gameState.cargoCapacity}T</p>
                                            <button onClick={() => expandCargo(50)} className="bg-blue-600 px-3 py-1 rounded text-xs">Expand 50T</button>
                                        </div>
                                        {/* Other left column items can go here */}
                                    </div>
                                </div>
                                {/* Right Column */}
                                <div>
                                    <h3 className="text-lg font-bold mb-2">Market Intelligence Scanners</h3>
                                    <div className="space-y-2">
                                        {Object.values(EQUIPMENT).filter(item => item.type === 'scanner').map(item => {
                                            const disabled =
                                                (item.id === 'scanner_2' && gameState.gamePhase < 2) ||
                                                (item.id === 'scanner_3' && gameState.gamePhase < 3) ||
                                                gameState.equipment[item.id];
                                            return (
                                                <div key={item.id} className={`flex justify-between items-center p-2 rounded ${disabled ? 'opacity-50' : ''}`}>
                                                    <div>
                                                        <p>{item.name} (Lvl {item.level})</p>
                                                        <p className="text-xs text-gray-400">{item.description}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => buyEquipment(item.id)}
                                                        disabled={disabled}
                                                        className="bg-purple-600 px-3 py-1 rounded text-xs disabled:bg-gray-600"
                                                    >
                                                        {gameState.equipment[item.id] ? 'Owned' : formatCurrency(item.cost)}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                     {activeTab === 'ibank' && (
                        <div>
                            <h2 className="text-xl font-bold text-emerald-400 mb-4">I.B.A.N.K. Hub</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Loans */}
                                <div className="border border-yellow-500 p-4 rounded">
                                    <h3 className="text-lg font-bold text-yellow-300 mb-2">Loans</h3>
                                    <div>
                                        <h4 className="font-bold mb-1">Available Loan Offers</h4>
                                        {gameState.loanOffers.map(offer => (
                                            <div key={offer.firmName} className="text-sm p-2 border-b border-gray-700">
                                                <p>Amount: {formatCurrency(offer.amount)} @ {offer.interestRate}%</p>
                                                <button onClick={() => takeLoan(offer)} disabled={gameState.loanTakenToday} className="bg-yellow-600 w-full mt-1 py-1 rounded text-xs disabled:bg-gray-600">Take Loan</button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4">
                                        <h4 className="font-bold mb-1">Active Loans</h4>
                                        {gameState.activeLoans.map(loan => (
                                            <div key={loan.id} className="text-sm p-2 border-b border-gray-700">
                                                <p>Debt: {formatCurrency(loan.currentDebt)} ({loan.daysRemaining} days left)</p>
                                                <button onClick={() => repayLoan(loan.id)} className="bg-red-600 w-full mt-1 py-1 rounded text-xs">Repay</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Investments (Placeholder) */}
                                <div className="border border-yellow-500 p-4 rounded">
                                    <h3 className="text-lg font-bold text-yellow-300 mb-2">Investments</h3>
                                    <p className="text-sm">Investment opportunities coming soon.</p>
                                </div>
                            </div>
                        </div>
                    )}
                     {activeTab === 'fomo' && (
                        <div>
                            <h2 className="text-xl font-bold text-emerald-400 mb-4">F.O.M.O. Deck (Fabrication)</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Mining */}
                                <div className="border border-orange-500 p-4 rounded">
                                    <h3 className="text-lg font-bold text-orange-300 mb-2">Asteroid Mining</h3>
                                    <p className="text-xs mb-2">Use Fuel and Probes to mine for valuable materials.</p>
                                    <div className="space-y-2">
                                        <div>
                                            <label>Hydro-Fuel (in cargo: {gameState.cargo['water']?.quantity || 0})</label>
                                            <input type="number" value={miningInput['Hydro-Fuel'] || ''} onChange={e => setMiningInput({...miningInput, 'Hydro-Fuel': e.target.value})} className="w-full bg-gray-800 p-1 rounded" />
                                        </div>
                                        <div>
                                            <label>Probes (in cargo: {gameState.cargo['common_minerals']?.quantity || 0})</label>
                                            <input type="number" value={miningInput['Common Minerals'] || ''} onChange={e => setMiningInput({...miningInput, 'Common Minerals': e.target.value})} className="w-full bg-gray-800 p-1 rounded" />
                                        </div>
                                        <button onClick={performMining} className="bg-orange-600 w-full py-1 rounded">Start Mining</button>
                                    </div>
                                </div>
                                {/* Fabrication */}
                                <div className="border border-cyan-500 p-4 rounded">
                                    <h3 className="text-lg font-bold text-cyan-300 mb-2">Fabrication</h3>
                                    <div className="space-y-3">
                                        {/* Example Fabrication Item */}
                                        <div>
                                            <p className="font-bold">Fabricate Tech Components</p>
                                            <p className="text-xs text-gray-400">Req: 5 Common Minerals, 2 Precious Metals</p>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <input type="number" className="w-20 bg-gray-800 p-1 rounded"
                                                       value={fabricationQuantities['technology_parts'] || ''}
                                                       onChange={e => setFabricationQuantities({...fabricationQuantities, 'technology_parts': e.target.value})}
                                                />
                                                <button onClick={() => handleFabrication('technology_parts', [{id: 'common_minerals', amount: 5}, {id: 'precious_metals', amount: 2}])} className="bg-cyan-600 px-3 py-1 rounded text-xs">Fabricate</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                </div>
            </main>

            <footer className="bg-gray-900 p-2 border-t-2 border-emerald-700 flex justify-between items-center">
                <div className="w-1/3">
                    <button
                        onClick={processDay}
                        className={`bg-emerald-600 px-4 py-2 rounded ${isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isSpeaking}
                    >
                        Proceed to Operations
                    </button>
                </div>
                <div className="w-2/3">
                    <h4 className="text-sm font-bold">Captain's Log</h4>
                    <div className="h-16 overflow-y-auto text-xs border bg-black border-gray-700 p-1">
                        {gameState.messages.map(msg => (
                             <p key={msg.id} className={`
                             ${msg.type === 'danger' ? 'text-red-400' : ''}
                             ${msg.type === 'buy' ? 'text-green-400' : ''}
                             ${msg.type === 'sell' ? 'text-yellow-400' : ''}
                             ${msg.type === 'contract' ? 'text-cyan-400' : ''}
                             ${msg.type === 'maintenance' ? 'text-gray-500' : ''}
                           `}>{msg.message}</p>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default App;
