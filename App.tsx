/**
 * ============================================================================
 * PROJECT: STAR BUCKS GALAXY TRADE EMPIRE 
 * VERSION: v.13.0.3
 * ============================================================================
 *
 * DEVELOPER'S NOTE: All future code changes must be accompanied by comments
 * explaining the purpose and functionality of the code. This is to ensure
 * maintainability and clarity for all developers.
 *
 * ============================================================================
 * 
 * FEATURE MANIFEST / INTEGRITY CHECKLIST:
 * [✓] External Services (Firebase & Audio)
 * [✓] Utility & Formatting Functions
 * [✓] Atomic UI Components (StarCoin, PriceDisplay, etc.)
 * [✓] Core Game State Management
 * [✓] Game Initialization & Persistence (Save/Load)
 * [✓] Tutorial System
 * [✓] Market Generation & Evolution
 * [✓] Contract & Loan Generation
 * [✓] Trading Logic (Buy/Sell)
 * [✓] Ship Upgrades & Repairs
 * [✓] Travel, Encounters & Mining Logic
 * [✓] Daily Cycle Processing
 * [✓] Stock Market System
 * [✓] Phase Advancement
 * [✓] Logistics (Contracts, Shipping, Warehouse)
 * [✓] Fabrication System (F.O.M.O.)
 * [✓] Main UI Rendering Engine
 * 
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  COMMODITIES, VENUES, BASE_DISTANCE_MATRIX, LOAN_FIRMS, SHOP_ITEMS, CONTRACT_FIRMS,
  INITIAL_CARGO_CAPACITY, BASE_MAX_CARGO_CAPACITY, CARGO_UPGRADE_AMOUNT, CARGO_UPGRADE_COST,
  TONS_UNIT, CURRENCY_UNIT, COIN_MARKER, FUEL_NAME, NUTRI_PASTE_NAME, H2O_NAME, POWER_CELL_NAME, MESH_NAME,
  GOAL_PHASE_1_DAYS, GOAL_PHASE_1_AMOUNT, GOAL_PHASE_2_DAYS, GOAL_PHASE_2_AMOUNT, GOAL_PHASE_3_DAYS, GOAL_PHASE_3_AMOUNT, GOAL_OVERTIME_DAYS,
  CONTRACT_LIMIT_P1, CONTRACT_LIMIT_P2, CONTRACT_LIMIT_P3, TRADE_BAN_DURATION,
  REPAIR_COST, REPAIR_INCREMENT, MAX_REPAIR_HEALTH, LOAN_REPAYMENT_DAYS, LASER_REPAIR_COST, QUIRKY_MESSAGES_DB, TUTORIAL_QUOTES,
  MINING_OVERLOAD_YIELD_MULT, MINING_OVERLOAD_RISK_MULT
} from './constants';
import { GameState, Market, LoanOffer, LogEntry, DailyReport, Commodity, HighScore, CargoItem, EquipmentItem, Encounter, ActiveLoan, Contract, WarehouseItem, PendingTrade, Warehouse, MarketItem, Stock } from './types';
import Starfield from './Starfield';
import { Building2, Rocket, XCircle, Trophy, Zap, Truck, Shield, Wrench, Fuel, Crosshair, Heart, Swords, Skull, Box, AlertTriangle, Radar, ClipboardList, Radio, HelpCircle, Warehouse as WarehouseIcon, RefreshCw, Factory, Map as MapIcon, BarChart3, PowerOff, Droplets, Pill, Save, Volume2, VolumeX, Menu, Anchor, Cpu, Hourglass, ToggleLeft, ToggleRight, Info, LineChart, ChevronUp, ChevronDown, Circle, CheckCircle2, BookOpen, Lock } from 'lucide-react';
import { subscribeToLeaderboard, postHighScore } from './src/services/scores';
import { db } from './src/firebase';

// Resolve path to intro_ship.png correctly for Vite environment (including GitHub Pages base path)
const introShip = new URL('./intro_ship.png', import.meta.url).href;
const gorskyIcon = new URL('./gorsky.png', import.meta.url).href;

// Map venues to their respective PNG files
const VENUE_IMAGES: Record<string, string> = {
  "Acheron LV-426": new URL('./Acheron_LV-426.png', import.meta.url).href,
  "Cantina Mos Eisley": new URL('./Cantina_Mos_Eisley.png', import.meta.url).href,
  "Centauri Prime": new URL('./Centauri_Prime.png', import.meta.url).href,
  "Corellia Shipyards": new URL('./Corellia_Shipyards.png', import.meta.url).href,
  "Deep Space 9 1/2": new URL('./Deep_Space_9.png', import.meta.url).href,
  "Giedi Plaza": new URL('./Giedi_Plaza.png', import.meta.url).href,
  "High Charity": new URL('./High_Charity.png', import.meta.url).href,
  "New Babylon": new URL('./New_Babylon.png', import.meta.url).href,
  "Serenity Valley": new URL('./Serenity_Valley.png', import.meta.url).href,
  "Trantor Promenade": new URL('./Trantor_Promenade.png', import.meta.url).href,
};

// Map terminal screens and tabs to background image files
const ibankBg = new URL('./IBANK.png', import.meta.url).href;
const gigoBg = new URL('./GIGO.png', import.meta.url).href;
const catBg = new URL('./CAT_station.png', import.meta.url).href;
const codexBg = new URL('./Codex.png', import.meta.url).href;
const upgradesBg = new URL('./Upgrades.png', import.meta.url).href;
const logisticBg = new URL('./Logistic.png', import.meta.url).href;
const fomoBg = new URL('./FOMO.png', import.meta.url).href;
const strikeBg = new URL('./On_Strike.png', import.meta.url).href;

// --- BLOCK 1: EXTERNAL SERVICES (FIREBASE & AUDIO) --------------------------
// This block handles the integration of external services, specifically Firebase for data persistence
// and the Web Audio API for sound effects and speech synthesis.

// A. FIREBASE INITIALIZATION
// Initializes the Firebase app and Firestore database if the configuration is valid.
// This allows the game to save high scores and other persistent data.
import { collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';

// B. SOUND ENGINE
// Manages all audio within the game, including sound effects and ambient noises.
// It uses the Web Audio API to create and play sounds programmatically.
class SoundEngine {
    // Core AudioContext and master gain node for volume control.
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    public isMuted: boolean = false;
    private voiceInterval: any = null;

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.6; 
            this.startAmbience();
        } else if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
          this.init();
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.6, this.ctx!.currentTime, 0.1);
        }
        if (this.isMuted) {
            window.speechSynthesis.cancel();
        }
        return this.isMuted;
    }

    startAmbience() {
        if (this.voiceInterval) clearInterval(this.voiceInterval);
        this.voiceInterval = setInterval(() => {
            if(!this.isMuted && Math.random() < 0.5) this.playComputerNoise();
        }, 12000);
    }

    playComputerNoise() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, t);
        for(let i=0; i<6; i++) {
            osc.frequency.linearRampToValueAtTime(800 + Math.random() * 1000, t + (i*0.05));
        }
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.3);

        const bSize = this.ctx.sampleRate * 0.5;
        const b = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
        const d = b.getChannelData(0);
        for (let i = 0; i < bSize; i++) d[i] = (Math.random() * 2 - 1) * 0.1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = b;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 1000;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.02, t);
        noiseGain.gain.linearRampToValueAtTime(0, t + 0.2);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(t);
    }

        play(type: 'click' | 'coin' | 'warp' | 'error' | 'success' | 'alarm' | 'contract_success' | 'phase_change' | 'high_value_trade' | 'kaching' | 'swipe' | 'raspberry') {
        this.init();
        if (this.isMuted || !this.ctx || !this.masterGain) return;
            const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        switch (type) {
            case 'click':
                osc.type = 'square';
                osc.frequency.setValueAtTime(880, t); 
                gain.gain.setValueAtTime(0.05, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                osc.start(t);
                osc.stop(t + 0.1);
                break;
            case 'coin':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200, t);
                osc.frequency.setValueAtTime(1800, t + 0.08); 
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
                osc.start(t);
                osc.stop(t + 0.4);
                break;
            case 'error':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(110, t);
                osc.frequency.linearRampToValueAtTime(80, t + 0.3);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.3);
                osc.start(t);
                osc.stop(t + 0.3);
                break;
            case 'warp':
                {
                    const bSize = this.ctx.sampleRate * 2;
                    const b = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
                    const d = b.getChannelData(0);
                    for (let i = 0; i < bSize; i++) d[i] = Math.random() * 2 - 1;
                    const noise = this.ctx.createBufferSource();
                    noise.buffer = b;
                    const nf = this.ctx.createBiquadFilter();
                    nf.type = 'lowpass';
                    nf.frequency.setValueAtTime(100, t);
                    nf.frequency.exponentialRampToValueAtTime(5000, t + 1.5);
                    const ng = this.ctx.createGain();
                    ng.gain.setValueAtTime(0.3, t);
                    ng.gain.linearRampToValueAtTime(0, t + 2);
                    noise.connect(nf);
                    nf.connect(ng);
                    ng.connect(this.masterGain);
                    noise.start(t);
                }
                break;
            case 'success':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, t); 
                osc.frequency.setValueAtTime(659.25, t + 0.1); 
                osc.frequency.setValueAtTime(783.99, t + 0.2); 
                gain.gain.setValueAtTime(0.05, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.5);
                osc.start(t);
                osc.stop(t + 0.5);
                break;
            case 'alarm':
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, t);
                osc.frequency.linearRampToValueAtTime(1200, t + 0.15);
                osc.frequency.linearRampToValueAtTime(800, t + 0.3);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.3);
                osc.start(t);
                osc.stop(t + 0.3);
                break;
            case 'contract_success':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, t); // C5
                osc.frequency.linearRampToValueAtTime(659.25, t + 0.1); // E5
                osc.frequency.linearRampToValueAtTime(783.99, t + 0.2); // G5
                osc.frequency.linearRampToValueAtTime(1046.50, t + 0.4); // C6
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
                osc.start(t);
                osc.stop(t + 0.8);
                break;
            case 'phase_change':
                {
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(100, t);
                    osc.frequency.exponentialRampToValueAtTime(400, t + 1);
                    gain.gain.setValueAtTime(0.2, t);
                    gain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);
                    osc.start(t);
                    osc.stop(t + 1.5);

                    const osc2 = this.ctx.createOscillator();
                    const gain2 = this.ctx.createGain();
                    osc2.type = 'square';
                    osc2.frequency.setValueAtTime(101, t); // Slight detune for chorus effect
                    osc2.frequency.exponentialRampToValueAtTime(404, t + 1);
                    gain2.gain.setValueAtTime(0.2, t);
                    gain2.gain.exponentialRampToValueAtTime(0.01, t + 1.5);
                    osc2.connect(gain2);
                    gain2.connect(this.masterGain);
                    osc2.start(t);
                    osc2.stop(t + 1.5);
                }
                break;
            case 'high_value_trade':
                {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(1500, t);
                    osc.frequency.linearRampToValueAtTime(2500, t + 0.1);
                    gain.gain.setValueAtTime(0.15, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
                    osc.start(t);
                    osc.stop(t + 0.5);

                    const osc3 = this.ctx.createOscillator();
                    const gain3 = this.ctx.createGain();
                    osc3.type = 'triangle';
                    osc3.frequency.setValueAtTime(1510, t);
                    osc3.frequency.linearRampToValueAtTime(2510, t + 0.1);
                    gain3.gain.setValueAtTime(0.1, t+0.05);
                    gain3.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

                    osc3.connect(gain3);
                    gain3.connect(this.masterGain);

                    osc3.start(t);
                    osc3.stop(t + 0.5);
                }
                break;
                case 'kaching':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1046.50, t); // C6
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
                osc.start(t);
                osc.stop(t + 0.5);

                const osc2 = this.ctx.createOscillator();
                const gain2 = this.ctx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(1396.91, t + 0.05); // F#6
                gain2.gain.setValueAtTime(0.08, t + 0.05);
                gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
                osc2.connect(gain2);
                gain2.connect(this.masterGain);
                osc2.start(t);
                osc2.stop(t + 0.5);
                break;
            case 'swipe':
                const bufferSize = this.ctx.sampleRate * 0.2;
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(1500, t);
                filter.Q.setValueAtTime(10, t);
                const envelope = this.ctx.createGain();
                envelope.gain.setValueAtTime(0.2, t);
                envelope.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
                noise.connect(filter);
                filter.connect(envelope);
                envelope.connect(this.masterGain);
                noise.start(t);
                noise.stop(t + 0.2);
                break;
            case 'raspberry':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(120, t);
                osc.frequency.linearRampToValueAtTime(100, t + 0.3);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.3);
                osc.start(t);
                osc.stop(t + 0.3);
                break;
        }
    }
}

const SFX = new SoundEngine();

// C. SPEECH SYNTHESIS QUEUE
// Manages the playback of speech synthesis, ensuring that utterances are spoken
// one after another without interrupting each other. It includes a watchdog timer
// to prevent the queue from getting stuck.
class SpeechSynthesisQueue {
    // `queue` holds the list of utterances to be spoken.
    // `speaking` is a flag to prevent multiple utterances from playing at once.
    private queue: SpeechSynthesisUtterance[] = [];
    private speaking: boolean = false;
    private voices: SpeechSynthesisVoice[] = [];
    private voiceReady: boolean = false;
    private watchdogTimer: number | null = null;

    constructor() {
        // Check if voices are already loaded
        const currentVoices = window.speechSynthesis.getVoices();
        if (currentVoices.length) {
            this.loadVoices(currentVoices);
        } else {
            // Otherwise, wait for the event
            window.speechSynthesis.onvoiceschanged = () => this.loadVoices(window.speechSynthesis.getVoices());
        }
    }

    private loadVoices(voices: SpeechSynthesisVoice[]) {
        this.voices = voices;
        this.voiceReady = true;
        // If there are items in the queue, start processing
        this.processQueue();
    }

    private getVoice(): SpeechSynthesisVoice | null {
        return this.voices.find(v => v.name.toLowerCase().includes('google uk english male') || v.name.toLowerCase().includes('robot')) || this.voices[0] || null;
    }

    public add(utterance: SpeechSynthesisUtterance) {
        this.queue.push(utterance);
        // Only start processing if not already speaking and voices are ready
        if (!this.speaking && this.voiceReady) {
            this.processQueue();
        }
    }

    private processQueue = () => {
        if (this.queue.length === 0 || !this.voiceReady) {
            this.setSpeaking(false);
            return;
        }

        this.setSpeaking(true);
        const utterance = this.queue.shift()!;

        // Assign a voice if it doesn't have one yet
        if (!utterance.voice) {
             const roboticVoice = this.getVoice();
             if (roboticVoice) utterance.voice = roboticVoice;
        }

        utterance.onend = () => {
            if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
            this.processQueue();
        };

        utterance.onerror = (event) => {
            console.error("SpeechSynthesisUtterance.onerror", event);
            if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
            this.processQueue(); // Continue queue even if one fails
        };

        window.speechSynthesis.speak(utterance);

        // Watchdog to prevent queue from getting stuck
        this.watchdogTimer = window.setTimeout(() => {
            console.warn("Speech synthesis watchdog triggered. Force-advancing queue.");
            this.processQueue();
        }, (utterance.text.length * 100) + 5000); // Generous timeout based on text length
    }

    private setSpeaking(isSpeaking: boolean) {
        if (this.speaking === isSpeaking) return;
        this.speaking = isSpeaking;
        window.dispatchEvent(new CustomEvent('speech-state-change', { detail: { speaking: isSpeaking } }));
        if (!isSpeaking && this.watchdogTimer) {
            clearTimeout(this.watchdogTimer);
            this.watchdogTimer = null;
        }
    }

    cancel() {
        window.speechSynthesis.cancel();
        this.queue = [];
        this.setSpeaking(false);
    }
}

const speechQueue = new SpeechSynthesisQueue();

// D. SPEECH UTILITY FUNCTIONS
// These functions prepare and queue text to be spoken by the speech synthesis engine.

/**
 * Processes text to make it more intelligible for the speech synthesis engine.
 * Replaces currency markers and abbreviations with spoken words.
 * @param text The raw text to process.
 * @returns The processed text, ready for speech synthesis.
 */
const processTextForSpeech = (text: string): string => {
    let processedText = text.replace(/\$B\s*([\d,]+)/g, (match, number) => {
        return `${number} Star bucks`;
    });
    processedText = processedText.replace(/G\.I\.R\.L \(Lite\) Matter/g, "light matter");
    processedText = processedText.replace(/Z@onflex Weave Mesh/g, "Zay on flex Weave Mesh");
    processedText = processedText.replace(/Antimatter Rod/g, "Anti matter Rods");
    processedText = processedText.replace(/I\.B\.A\.N\.K\./g, "Banking Hub");
    processedText = processedText.replace(/C\.A\.T\./g, "Travel Bridge");
    processedText = processedText.replace(/F\.O\.M\.O\./g, "Fabrication Deck");
    processedText = processedText.replace(/G\.I\.G\.O\./g, "Comms console");
    return processedText;
};

/**
 * Queues text to be spoken with a retro, robotic voice.
 * This is the standard voice for most in-game announcements.
 * Calls processTextForSpeech.
 * @param text The text to be spoken.
 */
const speakRetro = (text: string) => {
    if (SFX.isMuted) return;
    const processedText = processTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(processedText);
    utterance.pitch = 0.5;
    utterance.rate = 0.9;
    utterance.volume = 0.8;
    speechQueue.add(utterance);
};

/**
 * Queues text to be spoken with a high-pitched, panicked voice.
 * Used for critical warnings and emergencies.
 * Calls processTextForSpeech.
 * @param text The text to be spoken.
 */
const speakPanicked = (text: string) => {
    if (SFX.isMuted) return;
    const processedText = processTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(processedText);
    utterance.pitch = 1.5;
    utterance.rate = 1.2;
    utterance.volume = 1.0;
    speechQueue.add(utterance);
};

const PET_NAMES = ["Star-Lord", "Hotshot", "Maverick", "Ace", "Boss", "Skipper", "Captain, oh my Captain", "Rocket Man", "Solo", "Skywalker", "Driller", "Counsellor", "My lord", "Our Commander and Chief", " My liege", "My Brother from another Mother", "Cuz", "My Presidentte", "My peeps", "Master", "Bee deee bee dee Beep"];

/**
 * Provides a daily status update to the player via speech synthesis.
 * Checks for outstanding debts, ship damage, and items in storage.
 * Calls speakRetro.
 * @param s The current game state.
 */
const speakDailyStatusAlerts = (s: GameState) => {
    if (s.activeLoans.length > 0 || s.cash < 0) {
        speakRetro("Captain, a reminder that we have outstanding debts requiring your attention.");
    }
    if (s.shipHealth < 100 || s.laserHealth < 100) {
        speakRetro("Warning, the ship has sustained damage. Repairs are recommended at your earliest convenience.");
    }
    const hasItemsInStorage = Object.values(s.warehouse).some(venue =>
        Object.values(venue).some(item => item.arrivalDay <= s.day)
    );
    if (hasItemsInStorage) {
        speakRetro("Logistics alert: You have items in storage requiring management.");
    }
    const randomPetName = PET_NAMES[Math.floor(Math.random() * PET_NAMES.length)];
    speakRetro(`That is all, ${randomPetName}.`);
};

// --- BLOCK 2: UTILITIES & FORMATTERS -----------------------------------------
// This block contains helper functions for formatting numbers and calculating game values.

/**
 * Formats a number as a currency string for use in the game log.
 * Calls formatCompactNumber.
 * @param amount The number to format.
 * @returns A string representing the currency amount (e.g., "$ 1.2M").
 */
const formatCurrencyLog = (amount: number) => {
  return `${COIN_MARKER} ${formatCompactNumber(amount)}`;
};

/**
 * Formats a number into a compact, human-readable string (e.g., 1200 => "1.2K").
 * @param num The number to format.
 * @param useMForMillions A flag to specify the suffix for millions.
 * @returns The compact number string.
 */
const formatCompactNumber = (num: number, useMForMillions: boolean = false) => {
    if (Math.abs(num) >= 1000000000000) return (num / 1000000000000).toFixed(1).replace(/\.0$/, '') + 'T';
    if (Math.abs(num) >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + (useMForMillions ? 'M' : 'M');
    if (Math.abs(num) >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toLocaleString();
};

/**
 * Calculates the fuel cost for a trip between two venues.
 * The cost is affected by distance, cargo weight, and the current game phase.
 * @param from The starting venue index.
 * @param to The destination venue index.
 * @param weight The current cargo weight.
 * @param phase The current game phase.
 * @returns The calculated fuel cost.
 */

/**
 * Calculates the total market value of the player's cargo.
 * @param cargo The player's current cargo.
 * @param currentMarket The market data for the current venue.
 * @returns The total value of the cargo.
 */
const getCargoValue = (cargo: Record<string, CargoItem>, currentMarket: Market) => {
  return Object.entries(cargo).reduce((sum, [name, item]) => sum + (item.quantity * (currentMarket[name]?.price || 0)), 0);
};

/**
 * Determines the CSS color class for a log entry based on its type.
 * @param type The type of the log entry.
 * @returns A string containing Tailwind CSS color classes.
 */
const getLogColorClass = (type: LogEntry['type']) => {
    switch (type) {
        case 'critical':
        case 'breach':
        case 'debt':
        case 'danger': 
        case 'overdraft':
        case 'surrender':
        case 'combat_win':
        case 'combat_loss':
        case 'defense_win':
        case 'defense_loss': return 'text-red-400 font-bold';
        case 'mining': return 'text-cyan-400';
        case 'investment':
        case 'profit': return 'text-green-400';
        case 'maintenance': 
        case 'evasion': return 'text-orange-400';
        case 'contract':
        case 'buy': return 'text-blue-400';
        case 'phase': return 'text-purple-400';
        case 'jump': return 'text-yellow-400';
        case 'repair': return 'text-lime-400';
        case 'sell': return 'text-green-400';
        default: return 'text-gray-400';
    }
};

/**
 * Determines the CSS color class for a daily report event based on its content.
 * @param e The event string from the daily report.
 * @returns A string containing Tailwind CSS color classes.
 */
const getReportEventColorClass = (e: string) => {
    if (e.includes('WARNING') || e.includes('CRITICAL') || e.includes('DEFAULT') || e.includes('BREACH') || e.includes('LOSS') || e.includes('TRAP') || e.includes('OVERDRAFT') || e.includes('SURRENDER') || e.includes('Laser Overload') || e.includes('MATURITY') || e.includes('P.I.G.S') || e.includes('SEIZURE')) return 'text-red-400 font-bold';
    if (e.includes('MINING') || e.includes('FABRICATION')) return 'text-cyan-400';
    if (e.includes('INVESTMENT') || e.includes('PROFIT') || e.includes('SALVAGE')) return 'text-green-400';
    if (e.includes('CONTRACT') || e.includes('ARRIVAL')) return 'text-blue-400';
    if (e.includes('PHASE')) return 'text-purple-400 font-bold';
    if (e.includes('MAINTENANCE')) return 'text-orange-400';
    return 'text-gray-300';
};

// --- BLOCK 3: ATOMIC UI COMPONENTS ------------------------------------------
// This block contains small, reusable React components that are used throughout the UI.

/**
 * Renders the Star Bucks currency icon as an SVG.
 * @param {object} props - Component props.
 * @param {number} [props.size=18] - The size of the icon.
 * @returns A React component rendering the StarCoin SVG.
 */
const StarCoin = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block align-middle mb-0.5 mx-0.5">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
    <text x="12" y="17.5" fontSize="13" fontWeight="900" textAnchor="middle" fill="#000" fontFamily="sans-serif">B</text>
  </svg>
);

/**
 * A component for displaying a price, including the StarCoin icon and formatted number.
 * Can be colored for positive/negative values and can display in compact format.
 * Calls StarCoin and formatCompactNumber.
 * @param {object} props - Component props.
 * @returns A React component for displaying the price.
 */
const PriceDisplay = ({ value, colored = false, size, compact = false }: { value: number, colored?: boolean, size?: string, compact?: boolean }) => (
  <span className={`font-mono font-bold whitespace-nowrap inline-flex items-center ${size || ''} ${colored ? (value >= 0 ? 'text-green-400' : 'text-red-400') : ''}`}>
    <StarCoin size={size && size.includes('text-xs') ? 14 : (size && size.includes('text-sm') ? 16 : 20)} /> {compact ? formatCompactNumber(Math.round(Math.abs(value))) : Math.round(Math.abs(value)).toLocaleString()} {value < 0 ? '(DR)' : ''}
  </span>
);

/**
 * A vertical toggle switch component.
 * @param {object} props - Component props.
 * @returns A React component for the vertical toggle.
 */
const VerticalToggle = ({ checked, onChange, disabled, label, rightContent }: { checked: boolean, onChange: (e: any) => void, disabled?: boolean, label?: string, rightContent?: React.ReactNode }) => (
    <div className={`flex items-center space-x-2 ${disabled ? 'opacity-30 pointer-events-none' : ''}`}>
        {label && <span className="text-[9px] text-gray-400 uppercase font-black text-left leading-tight w-20">{label}</span>}
        <div 
            onClick={() => !disabled && onChange({ target: { checked: !checked } })} 
            className={`relative w-5 h-10 rounded-lg cursor-pointer border-2 transition-all duration-300 overflow-hidden ${
                checked
                    ? 'border-green-400 bg-green-950 shadow-[0_0_12px_rgba(0,255,102,0.85)]'
                    : 'border-red-500 bg-red-950 shadow-[0_0_12px_rgba(255,0,51,0.85)]'
            }`}
        >
            <div className={`absolute left-0 w-full h-1/2 flex items-center justify-center transition-all duration-300 ${
                checked
                    ? 'bg-green-500 text-white shadow-[inset_0_0_4px_#00ff66]'
                    : 'bg-transparent text-gray-700 opacity-20'
            }`}>
                <ChevronUp size={10} style={checked ? { filter: 'drop-shadow(0 0 4px #00ff66)' } : undefined} />
            </div>
            <div className={`absolute bottom-0 left-0 w-full h-1/2 flex items-center justify-center transition-all duration-300 ${
                checked
                    ? 'bg-transparent text-gray-700 opacity-20'
                    : 'bg-red-500 text-white shadow-[inset_0_0_4px_#ff0033]'
            }`}>
                <ChevronDown size={10} style={!checked ? { filter: 'drop-shadow(0 0 4px #ff0033)' } : undefined} />
            </div>
            {/* Handle/Knob */}
            <div
                className={`absolute left-0 w-full h-1/3 bg-gray-950 border-y transition-all duration-300 z-10 ${
                    checked ? 'border-green-400' : 'border-red-500'
                }`}
                style={{ top: checked ? '0%' : '66.6%' }}
            ></div>
        </div>
        {rightContent && <div className="ml-1">{rightContent}</div>}
    </div>
);

/**
 * Renders a log message, replacing currency markers with the StarCoin component.
 * @param msg The log message string.
 * @returns A React fragment with the formatted message.
 */
const renderLogMessage = (msg: string | null | undefined) => {
    if (!msg) return '';
    const markerRegex = /\$B/g;
    const parts = msg.split(markerRegex);
    if (parts.length === 1) return msg;
    
    return (
        <span>
            {parts.map((part, i) => (
                <React.Fragment key={i}>
                    {part}
                    {i < parts.length - 1 && <StarCoin size={14} />}
                </React.Fragment>
            ))}
        </span>
    );
};

/**
 * A circular status dial component, used for displaying ship health, fuel, etc.
 * @param {object} props - Component props.
 * @returns A React component for the status dial.
 */
const StatusDial = ({ value, max, icon: Icon, color, label, isPercent }: { value: number, max: number, icon: any, color: string, label: string, isPercent?: boolean }) => {
  const percentage = Math.min(Math.max(value / max, 0), 1) * 100;
  
  // Statically map text-color class to background hex for robust Tailwind v4 rendering
  const getBgColorHex = (textColorClass: string) => {
    if (textColorClass.includes('green')) return '#22c55e'; // green-500
    if (textColorClass.includes('blue')) return '#3b82f6';  // blue-500
    if (textColorClass.includes('red')) return '#ef4444';   // red-500
    if (textColorClass.includes('orange')) return '#f97316'; // orange-500
    if (textColorClass.includes('yellow')) return '#eab308'; // yellow-500
    return '#4b5563'; // gray-600
  };

  return (
    <div className="flex flex-col items-center mx-1 md:mx-1 p-1 bg-black/40 rounded border border-gray-700 w-16 md:w-20">
        <div className="flex justify-between items-center w-full mb-0.5">
            <Icon size={12} className={color} />
            <span className={`text-[8px] md:text-[10px] font-bold ${color}`}>{value}{isPercent?'%':''}</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1 mb-0.5 overflow-hidden">
            <div className="h-1 rounded-full" style={{ width: `${percentage}%`, backgroundColor: getBgColorHex(color) }}></div>
        </div>
        <div className="text-[7px] md:text-[8px] text-white uppercase tracking-wider font-bold">{label}</div>
    </div>
  );
};

// --- BLOCK 4: MAIN APP COMPONENT & ENGINE ------------------------------------
// This is the main component that contains the entire game logic and UI.

export default function App() {
  
  // A. CORE GAME STATE
  // These state variables manage the fundamental aspects of the game.
  // `state` holds the entire game state object.
  // `modal` controls which modal window is currently displayed.
  const [state, setState] = useState<GameState | null>(null);
  const [preWelcomeClicked, setPreWelcomeClicked] = useState(false);

  /**
   * Helper function to calculate corporate synergy perks based on stock ownership.
   * Redefined within App component scope to correctly access the state variable.
   * @param perkType The type of perk to check (logistics or banking).
   * @returns A multiplier (e.g. 0.85 for a 15% discount, or 1.0 for no perk).
   */
  const hasCorporateSynergy = (currentState: GameState | null, companyKeyword: 'weyland' | 'starfleet' | 'hutt'): boolean => {
    if (!currentState || !currentState.stocks) return false;
    const threshold = 0.22; // >22% total shares

    // Find any stock whose name matches the keyword (e.g. "Weyland", "Starfleet", "Hutt")
    const matchingStocks = currentState.stocks.filter(s => s.name.toLowerCase().includes(companyKeyword));
    for (const stock of matchingStocks) {
      if (stock.quantity > 0 && stock.totalShares) {
        const ownershipPercentage = stock.quantity / stock.totalShares;
        if (ownershipPercentage > threshold) {
          return true;
        }
      }
    }
    return false;
  };

  const useCorporateSynergy = (perkType: 'logistics' | 'banking') => {
    if (!state || !state.stocks) return 1.0; // No discount by default

    let firmName: string;
    let ownershipThreshold = 0.05; // 5%

    if (perkType === 'logistics') {
      firmName = "Weyland-Yutani Logistics";
    } else { // banking
      firmName = "Starfleet Credit Union";
    }

    const stock = state.stocks.find(s => s.name === firmName);

    if (stock && stock.quantity > 0 && stock.totalShares) {
      const ownershipPercentage = stock.quantity / stock.totalShares;
      if (ownershipPercentage > ownershipThreshold) {
        if (perkType === 'logistics') return 0.85; // 15% discount
        if (perkType === 'banking') return 0.99; // 1% interest rate reduction (multiplier)
      }
    }

    return 1.0; // No perk applicable
  };

  /**
   * Calculates the fuel cost for a trip between two venues.
   * Redefined within App component scope to correctly utilize useCorporateSynergy.
   * @param from The starting venue index.
   * @param to The destination venue index.
   * @param weight The current cargo weight.
   * @param phase The current game phase.
   * @returns The calculated fuel cost.
   */
  const getFuelCost = (from: number, to: number, weight: number, phase: number) => {
    const distance = BASE_DISTANCE_MATRIX[from][to];
    let cost;
    if (phase === 1) {
      cost = distance * 2;
    } else {
      const fuelPerDist = Math.max(1, Math.ceil(weight / 1000));
      cost = fuelPerDist * distance;
    }
    const logisticsDiscount = useCorporateSynergy('logistics');
    return Math.round(cost * logisticsDiscount);
  };
  const [modal, setModal] = useState<{ type: string, data: any, color?: string }>({ type: 'none', data: null });
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const commsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSpeechStateChange = (event: Event) => {
        const customEvent = event as CustomEvent<{ speaking: boolean }>;
        setIsSpeaking(customEvent.detail.speaking);
    };

    window.addEventListener('speech-state-change', handleSpeechStateChange);

    return () => {
        window.removeEventListener('speech-state-change', handleSpeechStateChange);
    };
  }, []);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (reason) {
        // Gracefully capture and suppress Firestore/Firebase background sync rejections
        // (such as permission denied, domain restriction, network blocks, or 403 errors)
        const isFirebaseError =
          reason.name === 'FirebaseError' ||
          reason.name === 'n' ||
          reason.code === 403 ||
          reason.code === 'permission-denied' ||
          reason.code === 'auth/operation-not-allowed' ||
          reason.httpStatus === 200 ||
          (reason.message && (
            reason.message.includes('Firebase') ||
            reason.message.includes('Firestore') ||
            reason.message.includes('permission_denied') ||
            reason.message.includes('restricted') ||
            reason.message.includes('403')
          ));

        if (isFirebaseError) {
          console.warn("Handled third-party database connection rejection gracefully:", reason);
          event.preventDefault(); // Suppresses browser global unhandled promise rejection errors
        }
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    if (state && !state.isMutinyActive) {
      setDismissedStrikeOverlay(false);
    }
  }, [state?.isMutinyActive]);

  const [hasSave, setHasSave] = useState(false);
  
  // B. UI & INPUT STATE
  // These state variables manage the user interface and input fields.
  const [buyQuantities, setBuyQuantities] = useState<Record<string, string>>({});
  const [sellQuantities, setSellQuantities] = useState<Record<string, string>>({});
  const [shippingQuantities, setShippingQuantities] = useState<Record<string, string>>({});
  const [shippingDestinations, setShippingDestinations] = useState<Record<string, string>>({}); 
  const [shippingSource, setShippingSource] = useState<Record<string, { type: 'cargo' | 'warehouse', venueIdx: number }>>({}); 
  const [shippingTiers, setShippingTiers] = useState<Record<string, string>>({});
  const [logisticsTab, setLogisticsTab] = useState<'shipping' | 'contracts' | 'warehouse'>('contracts');
  const [highScoreName, setHighScoreName] = useState('');
  const [tempSaveName, setTempSaveName] = useState('CAPTAIN SHANE');
  const [highlightShippingItem, setHighlightShippingItem] = useState<string | null>(null);
  const [stagedContract, setStagedContract] = useState<Contract | null>(null);
  const [pulsingContractId, setPulsingContractId] = useState<number | null>(null);
  const [shippingSuccessMessage, setShippingSuccessMessage] = useState<string | null>(null);
  const [cargoUpgradeQty, setCargoUpgradeQty] = useState<string>('1');
  const [fomoQty, setFomoQty] = useState<string>(''); 
  const [fomoStimQty, setFomoStimQty] = useState<string>(''); 
  const [donateChipsQty, setDonateChipsQty] = useState<string>('');
  const [claimQuantities, setClaimQuantities] = useState<Record<string, string>>({});
  const [shippingPriorityItem, setShippingPriorityItem] = useState<string | null>(null);
  const [bankInvestAmount, setBankInvestAmount] = useState<string>('');
  const [bankInvestTerm, setBankInvestTerm] = useState<string>('1');
  const [wikiTab, setWikiTab] = useState('General');
  const [bankingTab, setBankingTab] = useState<'loans' | 'stocks'>('loans');
  const [stockBuyQuantities, setStockBuyQuantities] = useState<Record<string, string>>({});
  const [stockSellQuantities, setStockSellQuantities] = useState<Record<string, string>>({});
  const [expandedCommodityPrices, setExpandedCommodityPrices] = useState<Record<string, boolean>>({});
  const [countdown, setCountdown] = useState(0);
  const [universalLeaderboard, setUniversalLeaderboard] = useState<any[]>([]);
  const [dismissedStrikeOverlay, setDismissedStrikeOverlay] = useState(false);
  
  const consoleScrollRef = useRef<HTMLDivElement>(null);
  const [consoleScrollPosition, setConsoleScrollPosition] = useState(0);
  const localAssetsScrollRef = useRef<HTMLDivElement>(null);
  const leaderboardScrollRef = useRef<HTMLDivElement>(null);

  // C. TRAVEL CONFIGURATION STATE
  // Manages the player's choices for the next travel action.
  const [priorityAcknowledged, setPriorityAcknowledged] = useState(false);
  const [justShipped, setJustShipped] = useState(false);

  // -- STATE: TRAVEL CONFIG ---------------------------------------------------
  const [travelConfig, setTravelConfig] = useState({
      insurance: false,
      mining: false,
      overload: false,
      invest95: false
  });

  // D. HELPER FUNCTIONS
  // These functions provide various calculations and data retrieval needed by the game logic.

  /**
   * Finds the venue with the highest price for a given commodity.
   * @param commodityName The name of the commodity.
   * @param markets The array of all venue markets.
   * @param currentVenueIndex The index of the current venue.
   * @returns The index of the venue with the highest price.
   */
  const getHighestPayingVenue = (commodityName: string, markets: Market[], currentVenueIndex: number): number => {
    let bestPrice = -1;
    let bestVenues: number[] = [];

    markets.forEach((market, index) => {
        if (index === currentVenueIndex) return;

        const price = market[commodityName]?.price || 0;
        if (price > bestPrice) {
            bestPrice = price;
            bestVenues = [index];
        } else if (price === bestPrice) {
            bestVenues.push(index);
        }
    });

    if (bestVenues.length === 0) {
        const fallbackVenues = VENUES.map((_, i) => i).filter(i => i !== currentVenueIndex);
        return fallbackVenues[Math.floor(Math.random() * fallbackVenues.length)];
    }

    return bestVenues[Math.floor(Math.random() * bestVenues.length)];
  };

  /**
   * Loads the high scores from Firebase or local storage.
   * @returns A promise that resolves to an array of high scores.
   */
  const loadHighScores = async () => {
    let scores: HighScore[] = [];
    const isFirebaseConfigured = import.meta.env.VITE_FIREBASE_PROJECT_ID && import.meta.env.VITE_FIREBASE_PROJECT_ID !== "PROJECT_ID";
    if (db && isFirebaseConfigured) {
      try {
        const q = query(collection(db, "highscores"), orderBy("score", "desc"), limit(100));
        const s = await getDocs(q);
        s.forEach((doc) => scores.push(doc.data() as HighScore));
      } catch (e) {}
    }
    if (scores.length === 0) {
      const local = localStorage.getItem('sbe_highscores');
      if (local) scores = JSON.parse(local);
    }
    return scores.length ? scores : [
      { name: "Han S.", score: 5000000000, days: 35, date: "20XX" },
      { name: "Jean-Luc", score: 2500000000, days: 35, date: "2364" },
      { name: "Ellen Ripley", score: 1000000000, days: 35, date: "2122" },
      { name: "Starbuck", score: 500000000, days: 35, date: "2003" },
      { name: "Mal Reynolds", score: 250000000, days: 35, date: "2517" },
      { name: "Korben Dallas", score: 100000000, days: 30, date: "2263" },
      { name: "Dave Bowman", score: 50000000, days: 20, date: "2001" },
      { name: "Sarah Connor", score: 10000000, days: 15, date: "1984" },
      { name: "Rick Deckard", score: 5000000, days: 10, date: "2019" },
      { name: "Arthur Dent", score: 42000, days: 4, date: "1979" }
    ];
  };

  /**
   * Creates the initial state object for a new game.
   * @param startingCash The initial cash amount.
   * @param startIdx The starting venue index.
   * @param markets The initial market data.
   * @param initialLoan The initial loan object.
   * @param initialCargo The initial cargo object.
   * @param cargoWeight The initial cargo weight.
   * @returns The initial game state object.
   */
  /**
   * Helper function to calculate a new daily purchase limit for a stock
   * based on its risk/volatility level (Enhancement 131).
   * Percentages: Low: 1-10%, Medium: 5-20%, High: 10-25% of total shares.
   */
  const calculateDailyStockLimit = (stock: any): number => {
    const total = stock.totalShares ?? 1000000;
    let minPct = 0.01;
    let maxPct = 0.10;
    if (stock.risk === 'medium') {
      minPct = 0.05;
      maxPct = 0.20;
    } else if (stock.risk === 'high') {
      minPct = 0.10;
      maxPct = 0.25;
    }
    const pct = minPct + Math.random() * (maxPct - minPct);
    return Math.max(1, Math.round(total * pct));
  };

  function initializeStocks(s: GameState) {
    // Combine all firms from loan and contract lists to create the full list of publicly traded companies.
    const allFirms = [...LOAN_FIRMS, ...CONTRACT_FIRMS];
    const initialStocks = allFirms.map((firm, index) => {
      // Determine the firm's name, whether it's a string or an object.
      const name = typeof firm === 'string' ? firm : firm.name;

      // Assign a risk level based on a random tier.
      const riskTier = Math.random();
      let risk: 'low' | 'medium' | 'high';
      let price: number;

      if (riskTier < 0.33) {
        risk = 'low';
        price = 2500 + Math.random() * (15000 - 2500);
      } else if (riskTier < 0.66) {
        risk = 'medium';
        price = 5000 + Math.random() * (50000 - 5000);
      } else {
        risk = 'high';
        price = 7 + Math.random() * (70000 - 7);
      }

      // Lower prestige (higher index) results in more shares. This creates a market with varied capitalizations.
      const prestigeMultiplier = allFirms.length - index;
      const totalShares = 100000 * prestigeMultiplier;

      const stockObj = {
        name,
        price,
        quantity: 0, // Player starts with 0 shares.
        risk,
        averageCost: 0,
        history: [price], // Initialize price history for sparkline charts.
        totalShares,
        availableQuantity: Math.floor(totalShares * 0.60), // Ensure available shares are populated to 60% for takeover opportunities
        dailyBuyLimitRemaining: 0
      };

      // Calculate and assign the initial day buy limit
      stockObj.dailyBuyLimitRemaining = calculateDailyStockLimit(stockObj);

      return stockObj;
    });

    // Update the stocks directly in the passed state to prevent async overwriting bugs
    s.stocks = initialStocks;
  }

  const renderAchievementIcons = (s: any) => {
    if (!s || !s.achievements) return null;
    const list = s.achievements;
    return (
      <span className="inline-flex gap-1 items-center ml-2">
        {list.includes('elon') && (
          <span className="inline-flex items-center justify-center bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-slate-900 font-black rounded-full w-5 h-5 shadow-[0_0_12px_#f59e0b] text-xs border border-yellow-300 animate-pulse animate-bounce" title="E.L.O.N. Award: Executive Lord of Orbital Networks (Richest Man)">E</span>
        )}
        {list.includes('mutant_survivor') && (
          <span className="inline-flex items-center justify-center bg-purple-900 text-purple-300 font-bold rounded-full w-5 h-5 text-xs border border-purple-500" title="Mutant Crew Uprising Survivor">👾</span>
        )}
        {list.includes('master_fabricator') && (
          <span className="inline-flex items-center justify-center bg-orange-900 text-orange-300 font-bold rounded-full w-5 h-5 text-xs border border-orange-500" title="Master Fabricator (Fabricated 20+ times)">🛠️</span>
        )}
        {list.includes('corruption_master') && (
          <span className="inline-flex items-center justify-center bg-yellow-950 text-yellow-300 font-bold rounded-full w-5 h-5 text-xs border border-yellow-600" title="Corruption Master (Bribed inspectors 5+ times)">💼</span>
        )}
        {list.includes('jetsetter') && (
          <img src={gorskyIcon} className="inline-block w-5 h-5 object-contain rounded-full border border-yellow-500/50" title="and GOOD LUCK, MR. GORSKY (Visited every venue)" alt="Gorsky" />
        )}
        {list.includes('traveller') && (
          <span className="inline-flex items-center justify-center bg-cyan-900 text-cyan-300 font-bold rounded-full w-5 h-5 text-xs border border-cyan-500" title="Traveller Award (Travelled 25+ days)">🚀</span>
        )}
        {list.includes('hermit') && (
          <span className="inline-flex items-center justify-center bg-slate-800 text-slate-300 font-bold rounded-full w-5 h-5 text-xs border border-slate-500" title="Hermit Award (Stayed at a venue 3+ days)">🏡</span>
        )}
        {list.includes('overachiever') && (
          <span className="inline-flex items-center justify-center bg-red-900 text-red-300 font-bold rounded-full w-5 h-5 text-xs border border-red-500 animate-pulse" title="Overachiever Award (Reached final phase before day 20)">⚡</span>
        )}
        {list.includes('steel_hull') && (
          <span className="inline-flex items-center justify-center bg-emerald-900 text-emerald-300 font-bold rounded-full w-5 h-5 text-xs border border-emerald-500" title="Steel Hull Survivor (Survived with <= 10% Hull)">🛡️</span>
        )}
        {list.includes('death') && (
          <span className="inline-flex items-center justify-center bg-black text-red-500 font-bold rounded-full w-5 h-5 text-xs border border-red-600 animate-pulse" title="Deceased (Killed in Sector)">💀</span>
        )}
        {list.includes('outlaw') && (
          <span className="inline-flex items-center justify-center bg-orange-950 text-orange-400 font-bold rounded-full w-5 h-5 text-xs border border-orange-500 animate-pulse" title="Sector Outlaw (Arrest Warrant Active)">🚨</span>
        )}
      </span>
    );
  };

  const getAchievementName = (id: string) => {
    switch (id) {
      case 'elon': return 'E.L.O.N. (Executive Lord of Orbital Networks) Award';
      case 'mutant_survivor': return 'Mutant Crew Uprising Survivor';
      case 'master_fabricator': return 'Master Fabricator';
      case 'corruption_master': return 'Corruption Master / Bribe Expert';
      case 'jetsetter': return 'and GOOD LUCK, MR. GORSKY';
      case 'traveller': return 'Traveller Award';
      case 'hermit': return 'Hermit Award';
      case 'overachiever': return 'Overachiever Award';
      case 'steel_hull': return 'Steel Hull Survivor';
      case 'death': return 'Killed in Action / Deceased';
      case 'outlaw': return 'Sector Outlaw';
      default: return id;
    }
  };

  const getInitialState = (startingCash: number, startIdx: number, markets: Market[], initialLoan: any, initialCargo: any, cargoWeight: number) => {
    const s = {
        day: 1,
        cash: startingCash,
        currentVenueIndex: startIdx,
        cargo: initialCargo,
        warehouse: {},
        cargoWeight,
        cargoCapacity: INITIAL_CARGO_CAPACITY,
        markets,
        shipHealth: 100,
        laserHealth: 100,
        equipment: {}, 
        activeLoans: [initialLoan],
        investments: [],
        loanOffers: [], 
        activeContracts: [],
        availableContracts: [], 
        loanTakenToday: false,
        venueTradeBans: {},
        messages: [
          { id: 1, message: `System Init v.13.0.3 ... Welcome aboard, Captain.`, type: 'info' },
          { id: 2, message: `Widow's Gift Sent: ${formatCurrencyLog(30000)}. Loan secured from ${initialLoan.firmName}.`, type: 'debt' },
          { id: 3, message: `System Status: S.H.A.N.E. Online.`, type: 'info' }
        ],
        gameOver: false,
        gamePhase: 1,
        stats: { largestSingleWin: 0, largestSingleLoss: 0 },
        highScores: [], 
        tutorialActive: true,
        tutorialFlags: { asked_intro: true },
        dailyTransactions: {},
        fomoDailyUse: { mesh: false, stims: false }, // Fixed 'boolean' syntax error
        warrantLevel: 0,
        sectorPasses: [],
        isMutinyActive: false,
        mutantUnrest: 10,
        scannerLastUsedDay: 0,
        scannerConsecutiveDays: 0,
        fixedCommodity: undefined,
        boostedCommodity: undefined,
        pendingFixedCommodity: undefined,
        pendingBoostedCommodity: undefined,
        stocks: [],
        achievements: [],
        fabricationCount: 0,
        survivedMutiny: false,
        bribeCount: 0,
        visitedVenues: [VENUES[startIdx]],
        daysTravelledCount: 0,
        daysStayedCount: 0,
        reachedPhase4BeforeDay20: false,
        survivedCriticalHull: false,
        jackpot: 1000000,
        hasTradedStocksToday: false,
        optimalVenueToday: -1,
        hasSpokenOptimalVenue: false,
        dailyDividends: 0,
    } as GameState;
    initializeStocks(s);
    return s;
  };

  /**
   * Initializes the stock market when the game advances to Phase 3.
   * This function sets the initial public offering (IPO) price and total shares for each company.
   * Prices are randomized, and total shares are assigned based on the firm's prestige.
   */
  const initializeStocks_DEPRECATED = (s: GameState) => {
    // Combine all firms from loan and contract lists to create the full list of publicly traded companies.
    const allFirms = [...LOAN_FIRMS, ...CONTRACT_FIRMS];
    const initialStocks = allFirms.map((firm, index) => {
      // Determine the firm's name, whether it's a string or an object.
      const name = typeof firm === 'string' ? firm : firm.name;

      // Assign a risk level based on a random tier.
      const riskTier = Math.random();
      let risk: 'low' | 'medium' | 'high';
      let price: number;

      if (riskTier < 0.33) {
        risk = 'low';
        price = 2500 + Math.random() * (15000 - 2500);
      } else if (riskTier < 0.66) {
        risk = 'medium';
        price = 5000 + Math.random() * (50000 - 5000);
      } else {
        risk = 'high';
        price = 7 + Math.random() * (70000 - 7);
      }

      // Lower prestige (higher index) results in more shares. This creates a market with varied capitalizations.
      const prestigeMultiplier = allFirms.length - index;
      const totalShares = 100000 * prestigeMultiplier;

      // Return the newly created stock object.
      return {
        name,
        price,
        quantity: 0, // Player starts with 0 shares.
        risk,
        averageCost: 0,
        history: [price], // Initialize price history for sparkline charts.
        totalShares,
        availableQuantity: Math.floor(totalShares * 0.60) // Ensure available shares are populated to 60% for takeover opportunities
      };
    });

    // Update the stocks directly in the passed state to prevent async overwriting bugs
    s.stocks = initialStocks;
  };

  // E. GAME INITIALIZATION & LIFECYCLE
  // These useEffect hooks manage the game's startup, save/load functionality,
  // and other lifecycle events.

  // This effect is no longer needed as stock initialization is now handled by the `advancePhase` function.
  useEffect(() => {
    // Stock initialization is now triggered when the game advances to Phase 3.
  }, []);

  // Main game initialization effect. Runs once on component mount.
  // Calls initGame.
  useEffect(() => {
      initGame(true);
  }, []);

  /**
   * Initializes a new game or loads a saved game.
   * Calls generateMarket, getInitialState, generateLoanOffers, generateContracts, and loadHighScores.
   * @param checkSave If true, checks for a saved game in local storage.
   */
  const initGame = async (checkSave: boolean = true) => {
    const markets: Market[] = VENUES.map((_, idx) => generateMarket(true, idx === 0));
    const startIdx = Math.floor(Math.random() * VENUES.length);
    markets[startIdx] = generateMarket(true, true);
    
    const initialCargo: Record<string, CargoItem> = {};
    let cargoWeight = 0;
    
    const startingCash = -5000; 
    const randomBank = LOAN_FIRMS[Math.floor(Math.random() * LOAN_FIRMS.length)];
    const initialLoan = { id: Date.now(), firmName: randomBank.name, principal: 30000, currentDebt: 30000, interestRate: randomBank.baseRate, daysRemaining: LOAN_REPAYMENT_DAYS, originalDay: 1 };
    
    const baseState = getInitialState(startingCash, startIdx, markets, initialLoan, initialCargo, cargoWeight);
    baseState.loanOffers = generateLoanOffers(baseState.gamePhase, baseState.day);
    baseState.availableContracts = generateContracts(baseState.currentVenueIndex, baseState.day, baseState.gamePhase, {}, [], []);

    baseState.tutorialActive = true;
    baseState.tutorialFlags = { asked_intro: true };

    const scores = await loadHighScores();
    baseState.highScores = scores;

    // Check for save existence to update indicator
    const saveString = localStorage.getItem('sbe_savegame');
    setHasSave(!!saveString);

    if (checkSave && saveString) {
        try {
            const savedData = JSON.parse(saveString);
            const mergedState = {
                ...baseState,
                ...savedData,
                tutorialFlags: savedData.tutorialFlags || { asked_intro: true },
                fomoDailyUse: savedData.fomoDailyUse || { mesh: false, stims: false },
                equipment: savedData.equipment || {},
                warrantLevel: savedData.warrantLevel || 0,
                sectorPasses: savedData.sectorPasses || [],
                mutantUnrest: typeof savedData.mutantUnrest === 'number' ? savedData.mutantUnrest : 10
            };
            setState(mergedState);
            setModal({ type: 'load_save', data: null });
            return;
        } catch(e) {
            console.error("Save load failed", e);
        }
    }

    setState(baseState);
    setModal({ type: 'welcome', data: null });
  };

  // This effect updates the recommended shipping destinations when the game state changes.
  // Calls getHighestPayingVenue.
  useEffect(() => {
    if (state) {
        const newShippingDestinations: Record<string, string> = {};
        Object.keys(state.cargo).forEach(commodityName => {
            const bestVenue = getHighestPayingVenue(commodityName, state.markets, state.currentVenueIndex);
            newShippingDestinations[commodityName] = bestVenue.toString();
        });
        setShippingDestinations(newShippingDestinations);
    }
  }, [state?.day, state?.markets, state?.cargo]);
  
  // Runs the tutorial check when the day changes or a modal is closed.
  // Calls runTutorialCheck.
  useEffect(() => { runTutorialCheck(); }, [state?.day, modal.type]);

  // Self-healing hook: If the player has advanced to Phase 3 or 4, but their stock market state
  // is empty or uninitialized (e.g. from an older save merge), automatically populate the stocks.
  useEffect(() => {
    if (state && state.gamePhase >= 3 && (!state.stocks || state.stocks.length === 0)) {
        setState(prev => {
            if (!prev) return null;
            const ns = JSON.parse(JSON.stringify(prev));
            initializeStocks(ns);
            return ns;
        });
    }
  }, [state?.gamePhase, state?.stocks]);

  // Subscribes to the real-time universal leaderboard
  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard((scores) => {
      setUniversalLeaderboard(scores);
    });
    return () => unsubscribe();
  }, []);

  // Auto-closes certain success modals after a short delay.
  useEffect(() => {
    if (modal.type === 'fabrication_success' || modal.type === 'banking_transaction_success') {
      const timer = setTimeout(() => setModal({ type: 'none', data: null }), 1500); // Auto-close after 1.5s
      return () => clearTimeout(timer);
    }
  }, [modal.type]);

  // Restores the scroll position of the main console when it is displayed (Enhancement 136)
  useEffect(() => {
    const scrollableDiv = consoleScrollRef.current;
    if (scrollableDiv && modal.type === 'none') {
      // Slight delay to ensure elements have fully rendered and sizes are calculated
      const timer = setTimeout(() => {
        scrollableDiv.scrollTop = consoleScrollPosition;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [modal.type]);

  // Pre-populate the maximum quantities for each stock for buy and sell values (Enhancement 136)
  useEffect(() => {
    if (state && state.stocks && state.gamePhase >= 3) {
      setStockBuyQuantities(prevBuys => {
        const nextBuys = { ...prevBuys };
        let updated = false;
        state.stocks!.forEach(stock => {
          const maxAffordable = Math.floor((state.cash * 0.9) / stock.price);
          const maxBuy = Math.max(0, Math.min(stock.availableQuantity ?? 0, maxAffordable));
          if (nextBuys[stock.name] === undefined || nextBuys[stock.name] === '') {
            nextBuys[stock.name] = maxBuy.toString();
            updated = true;
          }
        });
        return updated ? nextBuys : prevBuys;
      });

      setStockSellQuantities(prevSells => {
        const nextSells = { ...prevSells };
        let updated = false;
        state.stocks!.forEach(stock => {
          const maxSell = stock.quantity;
          if (nextSells[stock.name] === undefined || nextSells[stock.name] === '') {
            nextSells[stock.name] = maxSell.toString();
            updated = true;
          }
        });
        return updated ? nextSells : prevSells;
      });
    }
  }, [state?.stocks, state?.cash, state?.gamePhase]);

  // Dynamically monitors, tracks, and unlocks achievements in the Game State (Enhancement 136)
  useEffect(() => {
    if (state && !state.gameOver) {
      let updated = false;
      const s = { ...state };
      const achievements = [...(s.achievements || [])];

      const add = (id: string) => {
        if (!achievements.includes(id)) {
          achievements.push(id);
          updated = true;
          log(`ACHIEVEMENT UNLOCKED: ${getAchievementName(id)}!`, 'profit');
          SFX.play('success');
        }
      };

      // 1. E.L.O.N.
      if (s.stocks && s.stocks.length > 0 && s.stocks.every(st => st.takeoverSuccessful)) {
        add('elon');
      }
      // 2. Mutant survivor
      if (s.survivedMutiny) {
        add('mutant_survivor');
      }
      // 3. Master Fabricator
      if ((s.fabricationCount || 0) >= 20) {
        add('master_fabricator');
      }
      // 4. Corruption Master
      if ((s.bribeCount || 0) >= 5) {
        add('corruption_master');
      }
      // 5. Jetsetter
      if (s.visitedVenues && s.visitedVenues.length === 10) {
        add('jetsetter');
      }
      // 6. Traveller
      if ((s.daysTravelledCount || 0) >= 25) {
        add('traveller');
      }
      // 7. Hermit
      if ((s.daysStayedCount || 0) >= 3) {
        add('hermit');
      }
      // 8. Overachiever
      if (s.reachedPhase4BeforeDay20) {
        add('overachiever');
      }
      // 9. Steel Hull (lived/survived with <= 10% hull)
      if (s.shipHealth > 0 && s.shipHealth <= 10) {
        if (!s.survivedCriticalHull) {
          s.survivedCriticalHull = true;
          updated = true;
        }
        add('steel_hull');
      }
      // 10. Sector Outlaw (warrantLevel > 0)
      if (s.warrantLevel > 0) {
        add('outlaw');
      }

      if (updated) {
        setState(prev => prev ? ({
          ...prev,
          achievements,
          survivedCriticalHull: s.survivedCriticalHull || prev.survivedCriticalHull
        }) : null);
      }
    }
  }, [
    state?.stocks,
    state?.survivedMutiny,
    state?.fabricationCount,
    state?.bribeCount,
    state?.visitedVenues,
    state?.daysTravelledCount,
    state?.daysStayedCount,
    state?.reachedPhase4BeforeDay20,
    state?.shipHealth,
    state?.survivedCriticalHull,
    state?.warrantLevel
  ]);

  // Automatically switches to the warehouse tab after a shipment is made (Removed in v10.4.4 for direct console return).

  // Scrolls the comms/shipping log to the top when the modal is opened.
  useEffect(() => {
    if ((modal.type === 'comms' || (modal.type === 'shipping' && logisticsTab === 'shipping')) && commsContainerRef.current) {
      commsContainerRef.current.scrollTop = 0;
    }
  }, [modal.type, logisticsTab, shippingPriorityItem]);

  useEffect(() => {
    if (localAssetsScrollRef.current) {
      localAssetsScrollRef.current.scrollTop = 0;
    }
  }, [shippingPriorityItem]);

  // Updates the default buy/sell quantities when the main console is displayed.
  useEffect(() => {
    if (modal.type === 'none' && state) {
      const newBuyQuantities: Record<string, string> = {};
      const newSellQuantities: Record<string, string> = {};
      const currentMarket = state.markets[state.currentVenueIndex];

      COMMODITIES.forEach(c => {
        const marketItem = currentMarket[c.name];
        if (marketItem) {
          const cashMax = Math.floor(state.cash / marketItem.price);
          const maxBuy = Math.max(0, Math.min(cashMax, marketItem.quantity));
          newBuyQuantities[c.name] = maxBuy.toString();
        }

        const cargoItem = state.cargo[c.name];
        if (cargoItem) {
          newSellQuantities[c.name] = cargoItem.quantity.toString();
        }
      });

      setBuyQuantities(newBuyQuantities);
      setSellQuantities(newSellQuantities);
    }
  }, [modal.type, state?.cash, state?.cargo, state?.markets, state?.currentVenueIndex]);

  const openingMessage = `Welcome, Captain. Your former business partner has passed, leaving his debts... and his dreams... to you. We have secured a 30,000 Star Bucks loan to buy out his Widow and reinstate our trading license, but your ship has been stripped down by mutiny. Prepare to board the RR Firefox 22 RustyRedeemer: She’s 60% oxidation and 40% hope, but she’ll get your cargo across the sector if you treat her right.`;

  // Plays the opening message when the welcome modal is displayed.
  // Commented out to prevent duplicate speaking as it is now directly linked
  // to the user's explicit Connect Neural Uplink click gesture.
  useEffect(() => {
    if (modal.type === 'welcome') {
      // speakRetro(openingMessage);
    }
  }, [modal.type]);

  useEffect(() => {
    if (modal.type === 'fomo' && state) {
      const h2oAmt = state.cargo[H2O_NAME]?.quantity || 0;
      const oreAmt = state.cargo['Allthemantium Ore']?.quantity || 0;
      const clothAmt = state.cargo['Synthetic Cloth']?.quantity || 0;
      const cashMaxAmtMesh = Math.floor(state.cash / 2000);
      const maxMesh = Math.max(0, Math.min(h2oAmt, oreAmt, clothAmt, cashMaxAmtMesh));
      setFomoQty(maxMesh.toString());

      const pasteAmt = state.cargo[NUTRI_PASTE_NAME]?.quantity || 0;
      const kitsAmt = state.cargo['Medical Kits']?.quantity || 0;
      const cashMaxAmtStims = Math.floor(state.cash / 200);
      const maxStims = Math.max(0, Math.min(h2oAmt, Math.floor(pasteAmt / 2), kitsAmt, cashMaxAmtStims));
      setFomoStimQty(maxStims.toString());
    }
  }, [modal.type, state]);
  // F. PERSISTENCE & TUTORIAL LOGIC
  // These functions handle saving/loading the game and managing the tutorial system.

  /**
   * Saves the current game state to local storage.
   * Calls SFX.play.
   * @param e Optional mouse event to prevent default behavior.
   */
  const saveAndExit = (e?: React.MouseEvent) => {
      if (e) {
          e.preventDefault();
          e.stopPropagation();
      }
      SFX.play('click');
      setTempSaveName(state?.playerName || 'CAPTAIN SHANE');
      setModal({ type: 'save_prompt', data: null });
  };

  /**
   * Loads a saved game from local storage.
   * Calls SFX.init and SFX.play.
   */
  const loadSavedGame = () => {
      SFX.init(); 
      setModal({ type: 'none', data: null });
      log('System: Save game loaded successfully.', 'info');
      SFX.play('success');
  };

  /**
   * Initializes the audio context for a new game.
   * Calls SFX.init.
   */
  const startNewGame = () => {
      setPriorityAcknowledged(false);
      SFX.init();
  };

  /**
   * Checks for and triggers time-based tutorial events.
   * Calls speakRetro.
   */
  const runTutorialCheck = () => {
     if (!state) return;
     
     if (state.day === 5 && !state.tutorialFlags['day5_save_msg'] && modal.type === 'none') {
        setState(prev => prev ? ({...prev, tutorialFlags: {...prev.tutorialFlags, day5_save_msg: true}}) : null);
        speakRetro("Captain, we have added an option to save and continue your progress. Select the Save icon in the HUD.");
     }
     if (!state.tutorialActive) return;
     if (state.day === 2 && !state.tutorialFlags['day2_mining'] && modal.type === 'none') {
        setState(prev => prev ? ({...prev, tutorialFlags: {...prev.tutorialFlags, day2_mining: true}}) : null);
        speakRetro(`Reminder: Free resources are floating in space! Buy a Mining Laser (Upgrades Deck) and enable 'Mining Run' in C.A.T. Station. Drill Baby, Drill!`);
     }
  };

  /**
   * Handles clicks on the main feature tabs.
   * Displays a tutorial popup if the feature hasn't been seen before.
   * Calls SFX.play.
   * @param feature The name of the feature being clicked.
   * @param callback The function to execute after the tutorial (or immediately if seen).
   */
  const handleFeatureClick = (feature: string, callback: () => void) => {
      SFX.play('click');
      if (state?.isMutinyActive && (feature === 'shop' || feature === 'fomo')) {
        return setModal({
            type: 'message',
            data: "The crew has seized control of this deck. Pay the ransom at the I.B.A.N.K. Hub to regain access.",
            color: 'text-red-400'
        });
      }
      if (state && state.tutorialActive && !state.tutorialFlags[feature]) {
          let title = "", text = "";
          if (feature === 'shop') { title = "Fixathing'u'ma Jig Deck"; text = "Buy, install, and upgrade the Mining Laser. \nRepair your Ship Hull and Laser.\nAcquire: Shields, Cannon and scanner. \nAnd expand your cargo Bay to the Max using Z@onflex Weave Mesh (to be bought at the market) before expanding.\n\nPro tip: Captain, you can increase the Cargo Bay even further every time you reach a new phase."; }
          else if (feature === 'banking') { title = "I.B.A.N.K. Hub"; text = "The Hub to manage all your Starbucks Financial needs. Take advantage of a new loan , 1 per institution and 1 new one per day for a total of 3, (Giving out further credit at that point would be irresponsible).\n\nYou can also invest idle cash in Term Deposits for safe returns with very favourable interest rates, but only if you are debt-free.\n\nPro tip: Captain, please avoid defaults! and rather take another loan if possible, as landing yourself in the negative will incur a 15% per day charge."; }
          else if (feature === 'travel') { title = "C.A.T. Station"; text = "Chart and Travel. Check 'Risk' levels. High risk = Pirates/Hazards. Ensure you have Fuel, Cash if you want to insure your commodities in transit, and please take advantage of our \"Before you Jump\" offer of depositing 95% of your $tarBucks in the bank at 5% per day (only available if debt fee, those are the terms and they always apply).\n\nPro-Tip: Captain, fuel costs increase significantly with Phase advancement and heavy cargo loads (1 Fuel per 1000T)."; }
          else if (feature === 'shipping') { title = "Void-Ex Logistics"; text = "Take advantage of Corporate Contracts and fulfil them by shipping the goods within the term limit. Only shipped goods allowed, delivered within or before the term expires, will be accepted so long as they are the exact quantities requested. Use the Fulfil option to ensure you comply; no in-person or further correspondence is needed. \nFailure to meet these terms will result in a 3 day ban to the market associated with that request. \nWe offer high-paying rewards for those who comply. \n\nPro-Tip: Captain, if your bay is too small to hold a large load, you can always use the 'Private Shipping' to move goods to a warehouse at any venue; no one else needs to know. However, any goods left unmoved for 3 days will be sold to defray storage costs."; }
          else if (feature === 'comms') { title = "G.I.G.O. Panel"; text = "Review daily logs, market intel, and previous event reports. Garbage In, Garbage Out... usually."; }
          else if (feature === 'fomo') { title = "F.O.M.O. Engineering Deck"; text = "Fabricate Output Management Operations. Craft valuable Z@onflex Weave Mesh and Stim-Packs from resources. Fabrication is limited to one batch per day per item type. Maximize your output!\n\nPro-Tip: Remember what happened to your Partner when he asked the Mutant Leader about the possibility of doing more Batches."; }
          else if (feature === 'highscores') { title = "Galactic Legends Registry"; text = "Behold the titans of industry. These captains turned oxidation into empire."; }
          else if (feature === 'wiki') { title = "Sector Codex Explorer"; text = "Gain deeper insight into the lore, mechanics, and survival tactics of the StarBucks Sector. Knowledge is the most valuable cargo of all."; }
          setModal({ type: 'tutorial_popup', data: { title, text, feature, callback } });
      } else {
          callback();
      }
  };

  // G. MARKET & GENERATION LOGIC
  // These functions handle the creation and evolution of the in-game markets.

  /**
   * Generates a new market for a single venue.
   * @param isInitial Whether this is the initial market generation.
   * @param isLocal Whether this is the player's starting location.
   * @returns A market object with prices and quantities for all commodities.
   */
  const generateMarket = (isInitial: boolean, isLocal: boolean): Market => {
    const market: Market = {};
    COMMODITIES.forEach(c => {
      const rarity = 1 - c.rarity;
      const base = Math.floor(100 + 1000 * rarity);
      let qty = isLocal ? Math.floor(base * (1 + (Math.random()*0.4 - 0.1))) : Math.floor(base * (1 + (Math.random()-0.5)));
      qty = Math.max(1, qty);
      const ratio = qty / base;
      const mid = (c.minPrice + c.maxPrice) / 2;
      let price = mid / Math.sqrt(ratio);
      price = Math.round(Math.min(c.maxPrice, Math.max(c.minPrice, price)));
      market[c.name] = { price, quantity: qty, standardQuantity: base, depletionDays: 0 };
    });
    return market;
  };

  /**
   * Evolves all markets for a new day.
   * Adjusts prices and quantities based on supply, demand, and game phase.
   * @param s The current game state.
   * @returns An array of updated market objects.
   */
  const evolveMarkets = (s: GameState): Market[] => {
    const phaseMult = 1 + ((s.gamePhase - 1) * 0.25); 
    const stockMult = s.gamePhase === 1 ? 1 : (s.gamePhase === 2 ? 5 : (s.gamePhase === 3 ? 10 : 20));
    const globalIncreasePct = 0.10 + Math.random() * 0.15;
    const h2oPasteMinMult = Math.pow(1.05, s.day);
    const h2oPasteMaxMult = Math.pow(1.10, s.day);

    const globalStocks: Record<string, number> = {};
    COMMODITIES.forEach(c => {
        let total = 0;
        s.markets.forEach(m => {
            if (m && m[c.name]) {
                total += m[c.name].quantity || 0;
            }
        });
        globalStocks[c.name] = total / s.markets.length;
    });

    return s.markets.map(m => {
      const newM: Market = {};
      Object.keys(m).forEach(key => {
        const item = m[key];
        const c = COMMODITIES.find(x => x.name === key)!;
        const adjustedStdQty = item.standardQuantity * stockMult; 
        let newQty = Math.floor(item.quantity * (1 + (Math.random()-0.5))); 
        if (Math.random() < 0.2) {
             const boost = Math.ceil(adjustedStdQty * globalIncreasePct);
             newQty += boost;
        }
        let dDays = item.quantity <= 0 ? item.depletionDays + 1 : 0;
        if (dDays > 2) {
           newQty = Math.floor(adjustedStdQty * 0.5); 
           dDays = 0;
        }
        newQty = Math.max(0, newQty);
        const effectiveRatio = (newQty+1) / adjustedStdQty; 
        let rangeMin = s.commodityPriceOverrides?.[key]?.min || c.minPrice * phaseMultiplier;
        let rangeMax = s.commodityPriceOverrides?.[key]?.max || c.maxPrice * phaseMultiplier;
        if (key === H2O_NAME || key === NUTRI_PASTE_NAME) {
            rangeMin = c.minPrice * h2oPasteMinMult;
            rangeMax = c.maxPrice * h2oPasteMaxMult;
        }
        if (key === FUEL_NAME) {
            const fluct = 1 + (Math.random() * 0.3 - 0.15);
            rangeMax *= fluct;
        }
        let price = 0;
        if (s.fixedCommodity?.name === key) {
          price = s.fixedCommodity.venuePrices[s.markets.indexOf(m)];
        } else if (key === 'Spacetime Tea') {
             const logMin = Math.log(rangeMin);
             const logMax = Math.log(rangeMax);
             const scale = logMin + (logMax - logMin) * Math.random();
             price = Math.round(Math.exp(scale));
             const avgStock = globalStocks[key] || 1;
             const relativeRatio = avgStock / (newQty + 1);
             const swing = Math.min(1.25, Math.max(0.75, relativeRatio));
             price = Math.round(price * swing);
             price = Math.round(Math.min(rangeMax, Math.max(rangeMin, price)));
        } else {
             const mid = (rangeMin + rangeMax) / 2;
             price = mid / Math.sqrt(effectiveRatio);
             price = Math.round(Math.min(rangeMax, Math.max(rangeMin, price)));
        }
        newM[key] = { price, quantity: newQty, standardQuantity: item.standardQuantity, depletionDays: dDays };
      });
      return newM;
    });
  };

  // H. CONTRACT & LOAN LOGIC
  // These functions handle the generation of new contracts and loan offers.

  /**
   * Generates new contracts for the player.
   * @param currentVenue The player's current location.
   * @param day The current game day.
   * @param phase The current game phase.
   * @param bans A record of any trade bans the player has.
   * @param existingAvailable The list of currently available contracts.
   * @param active The list of currently active contracts.
   * @returns An array of new and existing available contracts.
   */
  const generateContracts = (currentVenue: number, day: number, phase: number, bans: Record<number, number>, existingAvailable: Contract[], active: Contract[]): Contract[] => {
    const kept = existingAvailable.filter(c => c.daysRemaining > 0);
    kept.forEach(c => { if(c.daysRemaining > 0) c.daysRemaining--; }); 
    const keptActive = kept.filter(c => c.daysRemaining > 0);
    
    const contracts: Contract[] = [...keptActive];
    const limitCount = phase === 1 ? CONTRACT_LIMIT_P1 : (phase === 2 ? CONTRACT_LIMIT_P2 : CONTRACT_LIMIT_P3);
    const phaseMult = 1 + ((phase - 1) * 0.5); 
    const qtyMult = phase === 1 ? 1 : (phase === 2 ? 10 : (phase === 3 ? 50 : 100));

    if (contracts.length < limitCount) { 
        for (let i = 0; i < 3; i++) {
            const dest = Math.floor(Math.random() * VENUES.length);
            if (dest === currentVenue || (bans[dest] && bans[dest] > 0)) continue; 
            const firm = CONTRACT_FIRMS[Math.floor(Math.random() * CONTRACT_FIRMS.length)];
            const commod = COMMODITIES[Math.floor(Math.random() * COMMODITIES.length)];
            const alreadyExists = [...active, ...contracts].some(c => c.commodity === commod.name && c.status === 'active');
            if (alreadyExists) continue;
            const baseQty = Math.floor(Math.random() * 50) + 10;
            const qty = Math.floor(baseQty * qtyMult); 
            const reward = Math.round(commod.maxPrice * qty * (1.5 + Math.random() * 0.5) * phaseMult);
            const penalty = Math.round(reward * 0.5);
            const time = Math.floor(Math.random() * 3) + 1; 
            contracts.push({
                id: Date.now() + Math.random(), firm, commodity: commod.name, quantity: qty, destinationIndex: dest, reward, daysRemaining: time, penalty, status: 'active'
            });
        }
    }
    return contracts;
  };

  /**
   * Generates new loan offers for the player.
   * @param phase The current game phase.
   * @param day The current game day.
   * @returns An array of new loan offers.
   */
  const generateLoanOffers = (phase: number, day: number): LoanOffer[] => {
    const goalAmt = phase === 1 ? GOAL_PHASE_1_AMOUNT : (phase === 2 ? GOAL_PHASE_2_AMOUNT : GOAL_PHASE_3_AMOUNT);
    const maxLoan = goalAmt * 0.10; 

    const createOffers = (): LoanOffer[] => {
        const bankingDiscount = useCorporateSynergy('banking');
        const offers = [];
        for(let i=0; i<5; i++) {
            const firm = LOAN_FIRMS[i % LOAN_FIRMS.length];
            const minAmt = Math.max(5000, maxLoan * 0.05);
            const baseInterest = Math.max(1, Math.min(15, firm.baseRate + Math.random() * 5));
            let interestRate = baseInterest * bankingDiscount;
            if (hasCorporateSynergy(state, 'hutt')) {
                interestRate = interestRate * 0.75;
            }
            offers.push({
                firmName: firm.name,
                amount: Math.ceil((Math.random() * (maxLoan - minAmt) + minAmt) / 1000) * 1000,
                interestRate: interestRate
            });
        }
        return offers;
    };

    if (day === 1) {
      let offers: LoanOffer[] = [];
      for (let attempt = 0; attempt < 3; attempt++) {
        offers = createOffers();
        const highOffersCount = offers.filter(o => o.amount > 900000).length;
        if (highOffersCount >= 2) {
          return offers;
        }
      }

      offers.sort((a, b) => a.amount - b.amount);
      let highOffersCount = offers.filter(o => o.amount > 900000).length;
      let adjustmentsNeeded = Math.max(0, 2 - highOffersCount);

      if (adjustmentsNeeded > 0) offers[0].amount = 911000;
      if (adjustmentsNeeded > 1) offers[1].amount = 952000;

      // Shuffle offers
      for (let i = offers.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [offers[i], offers[j]] = [offers[j], offers[i]];
      }

      return offers;
    }

    return createOffers();
  };

  // I. TRADING LOGIC
  // These functions handle the buying and selling of commodities.

  /**
   * Executes a trade (buy or sell) and updates the game state.
   * Calls log and SFX.play.
   * @param pt A PendingTrade object containing the details of the trade.
   */
  const executeTrade = (pt: PendingTrade) => {
      if (!state) return;
      const { action, commodity: c, marketItem: mItem, ownedItem: owned, quantity: qty, tax } = pt;
      const txKey = `${state.currentVenueIndex}_${c.name}`;
      const txCount = state.dailyTransactions[txKey] || 0;

      if (action === 'buy') {
          let cost = qty * mItem.price + tax;
          const weight = qty * c.unitWeight;
          if (state.cash < cost && state.cash - cost < -10000) return setModal({type:'message', data:`Overdraft limit exceeded. Cannot buy.`});
          const newM = [...state.markets];
          newM[state.currentVenueIndex][c.name].quantity = Math.max(0, newM[state.currentVenueIndex][c.name].quantity - qty);
          const cur = state.cargo[c.name] || { quantity: 0, averageCost: 0 };
          const newTotal = cur.quantity + qty;
          const newAvg = ((cur.quantity * cur.averageCost) + (qty * mItem.price)) / newTotal;
          setState(prev => prev ? ({ 
              ...prev, 
              cash: prev.cash - cost, 
              cargoWeight: prev.cargoWeight + weight, 
              markets: newM, 
              cargo: { ...prev.cargo, [c.name]: { quantity: newTotal, averageCost: newAvg } },
              dailyTransactions: { ...prev.dailyTransactions, [txKey]: txCount + 1 }
          }) : null);
          if (tax > 0) log(`TAX: Paid ${formatCurrencyLog(tax)} for frequent trading.`, 'overdraft');
          setBuyQuantities(prev => ({...prev, [c.name]: ''}));
          SFX.play('swipe');
      } else {
          let rev = qty * mItem.price - tax;
          const weight = qty * c.unitWeight;
          if (owned.quantity < qty) return;
          const newM = [...state.markets];
          newM[state.currentVenueIndex][c.name].quantity += qty;
          const newC = { ...state.cargo };
          newC[c.name].quantity = Math.max(0, newC[c.name].quantity - qty);
          if (newC[c.name].quantity <= 0) delete newC[c.name];
          const profit = rev - (qty * owned.averageCost);
          const isProfitable = profit > 0;
          setState(prev => prev ? ({ 
              ...prev, 
              cash: prev.cash + rev, 
              cargoWeight: prev.cargoWeight - weight, 
              markets: newM, 
              cargo: newC, 
              stats: { ...prev.stats, largestSingleWin: Math.max(prev.stats.largestSingleWin, rev) },
              dailyTransactions: { ...prev.dailyTransactions, [txKey]: txCount + 1 }
          }) : null);
          if (tax > 0) log(`TAX: Paid ${formatCurrencyLog(tax)} for frequent trading.`, 'overdraft');
          log(isProfitable ? `PROFIT: Made ${formatCurrencyLog(profit)} selling ${c.name}` : `LOSS: Lost ${formatCurrencyLog(Math.abs(profit))} selling ${c.name}`, isProfitable ? 'profit' : 'danger');
          setSellQuantities(prev => ({...prev, [c.name]: ''}));
          if (isProfitable) {
            SFX.play('kaching');
            setTimeout(() => SFX.play('kaching'), 150);
            setTimeout(() => SFX.play('kaching'), 300);
          } else {
            SFX.play('raspberry');
          }
      }
      setModal({type:'none', data:null});
  };

  /**
   * Handles the initial click on a buy or sell button.
   * Checks for trade limits and taxes before calling executeTrade.
   * @param action Whether the trade is a 'buy' or 'sell'.
   * @param c The commodity being traded.
   * @param mItem The market data for the commodity.
   * @param owned The player's current holdings of the commodity.
   */
  const handleTrade = (action: 'buy' | 'sell', c: Commodity, mItem: any, owned: any) => {
    if (!state) return;
    const rawQ = action === 'buy' ? buyQuantities[c.name] : sellQuantities[c.name];
    let qty = parseInt(rawQ || '0');
    if (qty <= 0) return;
    if (action === 'buy' && qty > mItem.quantity) {
        const pending: PendingTrade = { action, commodity: c, marketItem: mItem, ownedItem: owned, quantity: qty, tax: 0 };
        setModal({ type: 'stock_limit_confirm', data: { ...pending, actualStock: mItem.quantity } });
        return;
    }
    const txKey = `${state.currentVenueIndex}_${c.name}`;
    const txCount = state.dailyTransactions[txKey] || 0;
    let tax = 0;
    if (txCount > 0 && !hasCorporateSynergy(state, 'starfleet')) {
        const val = qty * mItem.price;
        tax = Math.floor(val * 0.05);
        const pending: PendingTrade = { action, commodity: c, marketItem: mItem, ownedItem: owned, quantity: qty, tax };
        setModal({ type: 'tax_confirm', data: pending });
        return;
    }
    const pending: PendingTrade = { action, commodity: c, marketItem: mItem, ownedItem: owned, quantity: qty, tax: 0 };
    executeTrade(pending);
  };

  // J. UPGRADE & REPAIR LOGIC
  // These functions handle the purchasing of equipment and repairing the ship.

  /**
   * Buys a new piece of equipment for the ship.
   * Calls log and SFX.play.
   * @param item The equipment item to be purchased.
   */
  const buyEquipment = (item: EquipmentItem) => {
     if (!state) return;
     let scaledCost = (item.type === 'defense') ? item.cost * state.gamePhase : item.cost;
     if (hasCorporateSynergy(state, 'weyland')) {
         scaledCost = Math.round(scaledCost * 0.85);
     }
     if (state.cash < scaledCost) return setModal({type:'message', data:"Insufficient Funds."});
     let newLaserHealth = state.laserHealth;
     if (item.type === 'laser') newLaserHealth = 100;
     setState(prev => prev ? ({ ...prev, cash: prev.cash - scaledCost, laserHealth: newLaserHealth, equipment: { ...prev.equipment, [item.id]: true } }) : null);
     log(`UPGRADES: Purchased ${item.name}`, 'buy');
     SFX.play('success');
  };
  
  /**
   * Repairs the ship's hull or laser.
   * Calls log and SFX.play.
   * @param type The type of repair to perform.
   */
  const performRepair = (type: 'hull' | 'laser' | 'full_hull' | 'full_laser') => {
      if (!state) return;
      const MAX_LASER_HEALTH = 100;
      if (type === 'full_hull') {
          if (state.shipHealth >= MAX_REPAIR_HEALTH) return setModal({type:'message', data:"Hull integrity at maximum."});
          const cost = calculateFullRepairCost();
          if (state.cash < cost) return setModal({type:'message', data:`Insufficient funds. Need ${formatCurrencyLog(cost)}.`});
          setState(prev => prev ? ({...prev, cash: prev.cash - cost, shipHealth: MAX_REPAIR_HEALTH}) : null);
          log(`REPAIR: Hull fully restored.`, 'repair');
          SFX.play('success');
          return;
      }
      if (type === 'full_laser' || type === 'laser') {
          if (!hasLaser(state)) return;
          if (state.laserHealth >= MAX_LASER_HEALTH) return setModal({type:'message', data:"Laser operational."});
          const needed = Math.ceil((MAX_LASER_HEALTH - state.laserHealth) / REPAIR_INCREMENT);
          const cost = needed * LASER_REPAIR_COST;
          if (state.cash < cost) return setModal({type:'message', data:`Insufficient funds. Need ${formatCurrencyLog(cost)}.`});
          setState(prev => prev ? ({...prev, cash: prev.cash - cost, laserHealth: MAX_LASER_HEALTH}) : null);
          log(`REPAIR: Laser fully realigned.`, 'repair');
          SFX.play('success');
          return;
      }
  };

  // K. TRAVEL & ENCOUNTER LOGIC
  // These functions handle player travel between venues and random encounters.

  /**
   * Calculates the amount of cargo lost due to hull damage.
   * @param s The current game state.
   * @param hullHealth The ship's hull health.
   * @param hasInsurance Whether the player has insurance.
   * @returns An object containing the lost items and any insurance payout.
   */
  const calculateCargoLoss = (s: GameState, hullHealth: number, hasInsurance: boolean): { lostItems: Record<string, number>, payout: number } => {
      const results = { lostItems: {} as Record<string, number>, payout: 0 };
      if (hullHealth >= 100) return results;

      const lossRatio = (100 - hullHealth) / 100;
      const totalWeight = s.cargoWeight;
      const targetWeightToLose = totalWeight * lossRatio;
      
      let weightLostSoFar = 0;
      let totalValueLost = 0;
      const cargoNames = Object.keys(s.cargo);
      const currentMarket = s.markets[s.currentVenueIndex];

      while (weightLostSoFar < targetWeightToLose && cargoNames.length > 0) {
          const randomIndex = Math.floor(Math.random() * cargoNames.length);
          const name = cargoNames[randomIndex];
          const item = s.cargo[name];
          const cData = COMMODITIES.find(c => c.name === name)!;
          
          const maxLossQty = Math.min(item.quantity, Math.ceil((targetWeightToLose - weightLostSoFar) / cData.unitWeight));
          const lossQty = Math.max(1, Math.floor(Math.random() * maxLossQty) + 1);

          s.cargo[name].quantity -= lossQty;
          weightLostSoFar += lossQty * cData.unitWeight;
          totalValueLost += lossQty * (currentMarket[name]?.price || 0);
          results.lostItems[name] = (results.lostItems[name] || 0) + lossQty;

          if (s.cargo[name].quantity <= 0) {
              delete s.cargo[name];
              cargoNames.splice(randomIndex, 1);
          }
      }
      
      s.cargoWeight = Math.max(0, s.cargoWeight - weightLostSoFar);
      
      if (hasInsurance) {
          results.payout = Math.floor(totalValueLost * 0.95);
          s.cash += results.payout;
      }

      return results;
  };

  /**
   * Handles the player's travel to a new venue.
   * This is a major function that triggers encounters, processes the day, and checks for game over conditions.
   * Calls processDay, getNetWorth, getMarketTips, speakRetro, speakDailyStatusAlerts, and SFX.play.
   * @param destIdx The index of the destination venue.
   * @param fuelCost The cost of fuel for the trip.
   * @param ins Whether the player has insurance.
   * @param mine Whether the player is mining during travel.
   * @param overload Whether the mining laser is overloaded.
   * @param invest95 Whether the player is investing 95% of their cash.
   * @param stateOverride An optional game state to use instead of the current state.
   */
  const handleTravel = (destIdx: number, fuelCost: number, ins: boolean, mine: boolean, overload: boolean, invest95: boolean, stateOverride?: GameState) => {
     const sourceState = stateOverride || state;
     if (!sourceState) return;
     const s = { ...sourceState };
     const report: DailyReport = { events: [], totalHullDamage: 0, totalLaserDamage: 0, fuelUsed: fuelCost, lostItems: {}, gainedItems: {}, insuranceBought: ins };
     
     if (destIdx === s.currentVenueIndex) {
         s.day++;
         s.daysStayedCount = (s.daysStayedCount || 0) + 1; // Track stay days (Enhancement 136)
         processDay(s, report);
         const curGoal = s.gamePhase === 1 ? GOAL_PHASE_1_AMOUNT : (s.gamePhase === 2 ? GOAL_PHASE_2_AMOUNT : GOAL_PHASE_3_AMOUNT);
         const deadlineLimit = s.gamePhase === 1 ? GOAL_PHASE_1_DAYS : (state.gamePhase === 2 ? GOAL_PHASE_2_DAYS : (state.gamePhase === 3 ? GOAL_PHASE_3_DAYS : GOAL_OVERTIME_DAYS));
         const nw = getNetWorth(s);

         if (s.day > GOAL_OVERTIME_DAYS) {
             s.gameOver = true;
             const isHS = s.highScores.length < 100 || nw > s.highScores[s.highScores.length - 1].score;
             setModal({ type: 'endgame', data: { reason: "Retirement Day: Trade License Expired Successfully", netWorth: nw, stats: s.stats, isHighScore: isHS, days: GOAL_OVERTIME_DAYS } });
             SFX.play('success');
             return;
         }

         if (s.day > deadlineLimit && nw < curGoal) {
             s.gameOver = true;
             const isHS = s.highScores.length < 100 || nw > s.highScores[s.highScores.length - 1].score;
             setModal({ type: 'endgame', data: { reason: "Phase Deadline Missed. License Revoked.", netWorth: nw, stats: s.stats, isHighScore: isHS, days: s.day - 1 } });
             SFX.play('error');
             return;
         }
         
         if (s.day === deadlineLimit) {
             setModal({type:'message', data: "URGENT WARNING: Today is the Phase Deadline. Meet the goal or face license revocation!", color: 'text-red-500'});
             SFX.play('alarm');
         } else if (!s.gameOver) {
            setModal({ type: 'report', data: { events: report.events, day: s.day, tips: getMarketTips(s), quirky: report.quirkyMessage } });
            if (report.quirkyMessage) speakRetro(report.quirkyMessage.text);
            speakDailyStatusAlerts(s);
            setState(s);
         }
         return;
     }

     SFX.play('warp');
     s.daysTravelledCount = (s.daysTravelledCount || 0) + 1; // Track travel days (Enhancement 136)
     const visited = s.visitedVenues || [];
     const destName = VENUES[destIdx];
     if (!visited.includes(destName)) {
         visited.push(destName);
     }
     s.visitedVenues = visited; // Track visited venues for Jetsetter (Enhancement 136)

     if (invest95 && s.activeLoans.length === 0) {
         const investAmt = Math.floor(s.cash * 0.95);
         if (investAmt > 0) {
             s.cash -= investAmt;
             s.investments.push({
                 id: Date.now(),
                 amount: investAmt,
                 daysRemaining: 1,
                 maturityValue: Math.floor(investAmt * 1.05),
                 interestRate: 0.05
             });
             report.events.push(`PROTECTION: Invested ${formatCurrencyLog(investAmt)} (95%) in 1-Day CD.`);
         }
     }
     
     const currentMarketLocal = s.markets[s.currentVenueIndex];
     const insuranceCost = Math.round(getCargoValue(s.cargo, currentMarketLocal) * 0.02); 
     if (ins) {
         s.cash -= insuranceCost;
         if (s.cash < 0) report.events.push(`OVERDRAFT: Insurance payment pushed account into negative.`);
     }
     
     const f = COMMODITIES.find(c=>c.name===FUEL_NAME)!;
     s.cargo[FUEL_NAME].quantity -= fuelCost;
     s.cargoWeight -= fuelCost * f.unitWeight;
     if (s.cargo[FUEL_NAME].quantity <= 0) delete s.cargo[FUEL_NAME];
     
     let encounterChance = 0.55;
     if (s.warrantLevel > 0) encounterChance *= 2;
     if (s.sectorPasses.includes(VENUES[destIdx])) encounterChance -= 0.20;
     if (s.fixedCommodity || s.boostedCommodity) encounterChance += 0.25;

     if (Math.random() < encounterChance) {
        const types: Encounter['type'][] = ['visa_audit', 'scam_customs', 'god_license', 'cargo_tax', 'pirate', 'fuel_breach', 'accident', 'structural', 'rust_rats', 'derelict', 'mutiny', 'fold_error', 'spice_bandits'];
        const typeEncounter = types[Math.floor(Math.random()*types.length)];
        let encounter: Encounter = { type: typeEncounter, title: '', description: '', riskDamage: 0 };
        let riskMult = ins ? 1.5 : 4.0; 
        const shieldLv = s.equipment['shield_gen_mk3'] ? 3 : (s.equipment['shield_gen_mk2'] ? 2 : (s.equipment['shield_gen_mk1'] ? 1 : 0));
        
        const activeWarrant = s.warrantLevel || 0;
        switch(typeEncounter) {
            case 'spice_bandits':
                encounter.title = 'The Spice Bandits Ambush';
                encounter.description = `The notorious 'Double-Sniffer' Barnaby B Barabas and his Spice Bandits have intercepted your ship! "Hand over the cash, or we'll turn your ship into space dust."`;
                encounter.demandAmount = Math.floor(s.cash * 0.25);
                encounter.riskDamage = 35 * riskMult * (1 - (shieldLv * 0.15));
                break;
            case 'visa_audit':
                encounter.title = 'V.I.S.A. Safety Audit (Code 22-V)';
                encounter.description = `Enforcers flag your 60% oxidation as a "Public Hazard." They demand a "Refurbishment Waiver" payment.`;
                encounter.demandAmount = Math.floor(s.cash * 0.22);
                if (activeWarrant > 0) {
                    encounter.description = `[WARRANT OUTLAW DETECTED] Galactic patrols have recognized your active arrest record! ` + encounter.description;
                    encounter.demandAmount = Math.floor(encounter.demandAmount * (1 + activeWarrant * 0.20));
                }
                break;
            case 'scam_customs':
                encounter.title = 'S.C.A.M. Customs Inspection';
                encounter.description = `Galactic Police perform a "Surprise Scan" for unregulated goods. They suggest a "Processing Fee" to look the other way.`;
                encounter.demandAmount = Math.floor(s.cash * 0.25);
                if (activeWarrant > 0) {
                    encounter.description = `[WARRANT OUTLAW DETECTED] Galactic patrols have recognized your active arrest record! ` + encounter.description;
                    encounter.demandAmount = Math.floor(encounter.demandAmount * (1 + activeWarrant * 0.20));
                }
                break;
            case 'god_license':
                encounter.title = 'The G.O.D. License Check';
                encounter.description = `The Galactic Overlord Department checks your operating license and ship compliance data.`;
                encounter.demandAmount = 5000 * s.gamePhase;
                if (activeWarrant > 0) {
                    encounter.description = `[WARRANT OUTLAW DETECTED] Galactic patrols have recognized your active arrest record! ` + encounter.description;
                    encounter.demandAmount = Math.floor(encounter.demandAmount * (1 + activeWarrant * 0.20));
                }
                break;
            case 'cargo_tax':
                encounter.title = 'Sector Cargo Tax';
                encounter.description = `A surprise checkpoint levies a transit tax based on total cargo weight. Efficiency is expensive.`;
                encounter.demandAmount = Math.ceil(s.cargoWeight * 15);
                if (activeWarrant > 0) {
                    encounter.description = `[WARRANT OUTLAW DETECTED] Galactic patrols have recognized your active arrest record! ` + encounter.description;
                    encounter.demandAmount = Math.floor(encounter.demandAmount * (1 + activeWarrant * 0.20));
                }
                break;
            case 'pirate':
                encounter.title = 'Crimson Fleet Interdiction';
                encounter.description = `A pirate frigate cornered you in the jump-lane. "Give us the credits, and we'll let your rust-bucket drift."`;
                encounter.demandAmount = Math.floor(s.cash * 0.30);
                encounter.riskDamage = 45 * riskMult * (1 - (shieldLv * 0.15));
                break;
            case 'fuel_breach':
                encounter.title = 'Spice-Fuel Tank Breach';
                encounter.description = `60% oxidation causes a fuel seam to split! High risk of fire near the Hot Isotope Hummers.`;
                encounter.riskDamage = 10;
                break;
            case 'accident':
                encounter.title = 'Navigational Hazard: Debris Field';
                encounter.description = `You drifted into space junk. The Firefox 22's sensors only beeped AFTER the first impact.`;
                encounter.riskDamage = 30 * (1 - (shieldLv * 0.25));
                break;
            case 'structural':
                encounter.title = 'Structural Failure';
                encounter.description = `Warp stress causes cargo bay beams to buckle. Permanent loss of 100T storage capacity detected.`;
                encounter.capacityLoss = 100;
                break;
            case 'rust_rats':
                encounter.title = 'Rust Rat Infestation';
                encounter.description = `Vermin attracted to the warmth of the Hummers have chewed through critical Logic-Slates.`;
                encounter.targetItem = Math.random() > 0.5 ? 'PC Chips' : POWER_CELL_NAME;
                break;
            case 'derelict':
                encounter.title = 'Echoing Distress Signal';
                encounter.description = `An abandoned freighter drifts in the void. "The RR Firefox 22 RustyRedeemer" groans as you approach.`;
                break;
            case 'mutiny':
                encounter.title = 'Crew Mutiny';
                encounter.description = `Morale is low. The crew demands a "Profit Share" bonus to keep the engines running.`;
                encounter.demandAmount = Math.floor(s.cash * 0.15);
                break;
            case 'fold_error':
                encounter.title = 'Spacetime Fold Alignment Failure';
                encounter.description = `The fold-drive failed to align one of the spatial corners during hyper-jump. A cosmic anomaly is forcing your ship out of warp at an unexpected coordinates matrix!`;
                break;
        }

        setModal({ type: 'event_encounter', data: { state: s, report, encounter, destIdx, mine, overload } });
        SFX.play('alarm');
        return; 
     }
     finalizeJump(s, report, destIdx, mine, overload);
  };

  /**
   * Resolves the outcome of a random encounter based on the player's decision.
   * Calls speakPanicked.
   * @param decision The player's choice in the encounter.
   */
  const resolveEncounterOutcome = (decision: 'check' | 'leave' | 'pay' | 'fight' | 'evade' | 'ignore') => {
      if (!modal.data) return;
      const { state: stateData, report: reportData, encounter, destIdx, mine, overload } = modal.data;
      let outcomeMsg = "";
      let outcomeType: 'info' | 'profit' | 'danger' = 'info';
      let resolvedDestIdx = destIdx;
      
      const s = { ...stateData } as GameState;
      const r = { ...reportData } as DailyReport;

      switch(encounter.type) {
          case 'fold_error': {
              let randIdx = s.currentVenueIndex;
              const availableIndices = VENUES.map((_, idx) => idx).filter(idx => idx !== s.currentVenueIndex);
              if (availableIndices.length > 0) {
                  randIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
              }
              resolvedDestIdx = randIdx;
              outcomeMsg = `FOLD SPACE FAILURE: A dimensional corner of hyperspace did not fold correctly! Your warp coordinates collapsed, forcing drop-out at ${VENUES[randIdx]}. Onboard cargo arrived with you, but shipped cargo has reached the original destination.`;
              outcomeType = 'danger';
              r.events.push(`NAVIGATION ANOMALY: Diverted to ${VENUES[randIdx]}.`);
              break;
          }
          case 'visa_audit':
              if (decision === 'pay') {
                  s.cash -= encounter.demandAmount;
                  outcomeMsg = `BRIBE ACCEPTED: You paid the 22% "Refurbishment Waiver." The enforcers ignored the rust. Lost ${formatCurrencyLog(encounter.demandAmount)}.`;
                  r.events.push(`ENCOUNTER: Paid V.I.S.A. bribe of ${formatCurrencyLog(encounter.demandAmount)}.`);
                  s.bribeCount = (s.bribeCount || 0) + 1;
              } else {
                  s.laserHealth = Math.max(0, s.laserHealth - 50);
                  outcomeMsg = `AUDIT FAILURE: You refused to pay. They remotely "shorted" your Hot Isotope Hummers. Laser integrity halved.`;
                  if (activeWarrant > 0) {
                      s.warrantLevel = (s.warrantLevel || 0) + 1;
                      outcomeMsg += ` Refusing enforcers while wanted has increased your warrant level!`;
                  }
                  outcomeType = 'danger';
                  r.events.push(`ENCOUNTER: V.I.S.A. audit failed. Hummers shorted.`);
              }
              break;
          case 'scam_customs':
              if (decision === 'pay') {
                  s.cash -= encounter.demandAmount;
                  outcomeMsg = `CLEARED: The 25% "Processing Fee" was accepted. No cargo was scanned. Lost ${formatCurrencyLog(encounter.demandAmount)}.`;
                  r.events.push(`ENCOUNTER: Paid S.C.A.M. fees.`);
                  s.bribeCount = (s.bribeCount || 0) + 1;
              } else {
                  const confiscated = ['Antimatter Rod', 'G.I.G.O (Lite) Matter', 'Spacetime Tea'];
                  let itemLost = '';
                  confiscated.forEach(name => {
                      if (!itemLost && s.cargo[name]) {
                          itemLost = name;
                          const lostQty = s.cargo[name].quantity;
                          const cData = COMMODITIES.find(c => c.name === name)!;
                          s.cargoWeight -= lostQty * cData.unitWeight;
                          delete s.cargo[name];
                          r.events.push(`SEIZURE: S.C.A.M. confiscated all ${name}.`);
                      }
                  });
                  outcomeMsg = itemLost ? `CONFISCATED: They found ${itemLost} and seized the entire lot.` : `LUCKY: They scanned, but your cargo was too worthless for them to bother with a seizure.`;
                  if (activeWarrant > 0) {
                      s.shipHealth = Math.max(0, s.shipHealth - 15);
                      s.warrantLevel = (s.warrantLevel || 0) + 1;
                      outcomeMsg += ` Resisting search while wanted resulted in live weapon fire! Sustained 15% Hull damage and warrant level increased!`;
                  }
                  outcomeType = 'danger';
              }
              break;
          case 'pirate':
              if (decision === 'pay') {
                  s.cash -= encounter.demandAmount;
                  outcomeMsg = `SAFE PASSAGE: The Crimson Fleet took their 30% cut. Lost ${formatCurrencyLog(encounter.demandAmount)}.`;
                  r.events.push(`ENCOUNTER: Paid Crimson Fleet tribute.`);
              } else if (decision === 'fight') {
                  const hasCannon = s.equipment['plasma_cannon_mk3'] ? 3 : (s.equipment['plasma_cannon_mk2'] ? 2 : (s.equipment['plasma_cannon_mk1'] ? 1 : 0));
                  if (hasCannon > 0) {
                      const scrapReward = 5000 * hasCannon;
                      s.cash += scrapReward;
                      outcomeMsg = `VICTORY: Your Plasma Cannons shredded the pirate frigate. Salvaged ${formatCurrencyLog(scrapReward)} in scrap.`;
                      outcomeType = 'profit';
                      r.events.push(`COMBAT: Defeated pirates. Salvaged ${formatCurrencyLog(scrapReward)}.`);
                      if (Math.random() < 0.2) {
                          s.sectorPasses.push(VENUES[destIdx]);
                          outcomeMsg += ` Word spread - you have free passage in this sector!`;
                      }
                  } else {
                      s.shipHealth -= 60;
                      outcomeMsg = `DEFEAT: Without cannons, the pirates mauled your hull. Sustained 60% damage.`;
                      outcomeType = 'danger';
                      r.events.push(`COMBAT: Hull mauled by pirates.`);
                  }
              }
              break;
          case 'spice_bandits':
              if (decision === 'pay') {
                  s.cash -= encounter.demandAmount;
                  outcomeMsg = `SAFE PASSAGE: You paid off the Spice Bandits. Lost ${formatCurrencyLog(encounter.demandAmount)}.`;
                  r.events.push(`ENCOUNTER: Paid Spice Bandits tribute of ${formatCurrencyLog(encounter.demandAmount)}.`);
              } else if (decision === 'fight') {
                  const hasCannon = s.equipment['plasma_cannon_mk3'] ? 3 : (s.equipment['plasma_cannon_mk2'] ? 2 : (s.equipment['plasma_cannon_mk1'] ? 1 : 0));
                  if (hasCannon > 0) {
                      const scrapReward = 4000 * hasCannon;
                      s.cash += scrapReward;
                      outcomeMsg = `VICTORY: Your Plasma Cannons blasted the Spice Bandits. Salvaged ${formatCurrencyLog(scrapReward)} of fuel scrap.`;
                      outcomeType = 'profit';
                      r.events.push(`COMBAT: Defeated Spice Bandits. Salvaged ${formatCurrencyLog(scrapReward)}.`);
                  } else {
                      s.shipHealth -= 45;
                      outcomeMsg = `DEFEAT: The Spice Bandits boarded and looted your hull. Sustained 45% damage.`;
                      outcomeType = 'danger';
                      r.events.push(`COMBAT: Damaged by Spice Bandits.`);
                  }
              }
              break;
          case 'fuel_breach':
              const fuelLoss = Math.floor((s.cargo[FUEL_NAME]?.quantity || 0) * 0.4);
              if (s.cargo[FUEL_NAME]) {
                  s.cargo[FUEL_NAME].quantity -= fuelLoss;
                  const fData = COMMODITIES.find(c => c.name === FUEL_NAME)!;
                  s.cargoWeight -= fuelLoss * fData.unitWeight;
                  if (s.cargo[FUEL_NAME].quantity <= 0) delete s.cargo[FUEL_NAME];
              }
              outcomeMsg = `BREACH: ${fuelLoss} units of Spice-Fuel leaked into the void before the seal held.`;
              outcomeType = 'danger';
              r.events.push(`ENCOUNTER: Fuel tank breach. Lost ${fuelLoss} Fuel.`);
              break;
          case 'structural':
              s.cargoCapacity = Math.max(100, s.cargoCapacity - 100);
              outcomeMsg = `CRACKED: The Firefox 22's spine groaned. 100T of storage is now inaccessible due to structural warping.`;
              outcomeType = 'danger';
              r.events.push(`ENCOUNTER: Structural failure. -100T Capacity.`);
              break;
          case 'rust_rats':
              if (encounter.targetItem && s.cargo[encounter.targetItem]) {
                  const amt = Math.floor(s.cargo[encounter.targetItem].quantity * 0.5);
                  s.cargo[encounter.targetItem].quantity -= amt;
                  const cData = COMMODITIES.find(c => c.name === encounter.targetItem)!;
                  s.cargoWeight -= amt * cData.unitWeight;
                  if (s.cargo[encounter.targetItem].quantity <= 0) delete s.cargo[encounter.targetItem];
                  outcomeMsg = `INFESTATION: Rust Rats ate ${amt} units of ${encounter.targetItem}. Squeaky little monsters.`;
                  r.events.push(`ENCOUNTER: Rust Rats ate ${amt} ${encounter.targetItem}.`);
              } else {
                  s.cash -= 50;
                  outcomeMsg = `INFESTATION: Rats found nothing tasty, so they chewed the pilot's left boot. Deducted ${formatCurrencyLog(50)} for boot repairs.`;
                  r.events.push(`ENCOUNTER: Rust Rats chewed boot. Paid ${formatCurrencyLog(50)}.`);
              }
              outcomeType = 'danger';
              break;
            case 'god_license':
                if (decision === 'pay') {
                    s.cash -= encounter.demandAmount;
                    outcomeMsg = `LICENSED: Paid ${formatCurrencyLog(encounter.demandAmount)} G.O.D. compliance fee. Operating license is active.`;
                    r.events.push(`ENCOUNTER: Paid G.O.D. license check of ${formatCurrencyLog(encounter.demandAmount)}.`);
                    s.bribeCount = (s.bribeCount || 0) + 1;
                } else {
                    const baseDmg = activeWarrant > 0 ? 40 : 30;
                    s.shipHealth = Math.max(0, s.shipHealth - baseDmg);
                    outcomeMsg = `LICENSE REVOCATION: You refused compliance. G.O.D enforcers remotely fried your hull shields. Sustained ${baseDmg}% damage.`;
                    if (activeWarrant > 0) {
                        s.warrantLevel = (s.warrantLevel || 0) + 1;
                        outcomeMsg += ` Non-compliance by a known fugitive has escalated your warrant level!`;
                    }
                    outcomeType = 'danger';
                    r.events.push(`ENCOUNTER: Refused G.O.D. check. ${baseDmg}% damage.`);
                }
                break;
            case 'cargo_tax':
                if (decision === 'pay') {
                    s.cash -= encounter.demandAmount;
                    outcomeMsg = `TAXED: Paid ${formatCurrencyLog(encounter.demandAmount)} cargo transit tax. Cargo cleared.`;
                    r.events.push(`ENCOUNTER: Paid cargo tax of ${formatCurrencyLog(encounter.demandAmount)}.`);
                    s.bribeCount = (s.bribeCount || 0) + 1;
                } else {
                    const baseDmg = activeWarrant > 0 ? 35 : 25;
                    s.shipHealth = Math.max(0, s.shipHealth - baseDmg);
                    outcomeMsg = `TAX EVASION: Refused tax payment. Customs officers fired warning shots, grazing your cargo hold. Sustained ${baseDmg}% damage.`;
                    if (activeWarrant > 0) {
                        s.warrantLevel = (s.warrantLevel || 0) + 1;
                        outcomeMsg += ` Tax evasion while wanted has further escalated your warrant level!`;
                    }
                    outcomeType = 'danger';
                    r.events.push(`ENCOUNTER: Evaded cargo tax. ${baseDmg}% damage.`);
                }
                break;
            case 'mutiny':
                if (decision === 'pay') {
                    s.cash -= encounter.demandAmount;
                    outcomeMsg = `APPEASED: The crew accepted their "Profit Share." Lost ${formatCurrencyLog(encounter.demandAmount)}.`;
                    r.events.push(`ENCOUNTER: Paid crew ${formatCurrencyLog(encounter.demandAmount)} to avert mutiny.`);
                    s.survivedMutiny = true; // Track mutiny survivor!
                    s.mutantUnrest = Math.max(10, Math.floor((s.mutantUnrest || 10) - 50));
                } else {
                    s.isMutinyActive = true;
                    s.mutantUnrest = 100;
                    const pcChipsQuantity = s.markets[s.currentVenueIndex]?.["PC Chips"]?.quantity || 0;
                    s.mutinyPcChipsRequirement = Math.floor((pcChipsQuantity * 0.22) / 5) * 5;
                    outcomeMsg = `MUTINY: The crew has seized control of the F.O.M.O. and Upgrades decks! You must pay their ransom at an I.B.A.N.K. Hub to regain access.`;
                    outcomeType = 'critical';
                    r.events.push(`CRITICAL: Crew mutiny! F.O.M.O. & Upgrades locked.`);
                }
                break;
          case 'derelict':
              if (decision === 'check') {
                  if (Math.random() < 0.5) {
                      const reward = Math.floor(Math.random() * 5) + 2;
                      const cData = COMMODITIES.find(c => c.name === POWER_CELL_NAME)!;
                      const cur = s.cargo[POWER_CELL_NAME] || { quantity: 0, averageCost: 0 };
                      s.cargo[POWER_CELL_NAME] = { quantity: cur.quantity + reward, averageCost: cur.averageCost };
                      s.cargoWeight += reward * cData.unitWeight;
                      outcomeMsg = `SALVAGE: Found ${reward} abandoned Hot Isotope Hummers! Today is a good day.`;
                      outcomeType = 'profit';
                      r.events.push(`ENCOUNTER: Salvaged ${reward} Hummers.`);
                  } else {
                      s.shipHealth -= 20;
                      outcomeMsg = `TRAP: The derelict was an explosive decoy. Sustained 20% hull damage.`;
                      outcomeType = 'danger';
                      r.events.push(`ENCOUNTER: Derelict explosion trap.`);
                  }
              } else {
                  outcomeMsg = `BYPASS: You left the ghost ship to the void. Safety first.`;
              }
              break;
          default:
              if (decision === 'ignore') {
                 s.shipHealth -= encounter.riskDamage;
                 outcomeMsg = `Impact reported! Sustained ${Math.round(encounter.riskDamage)}% Hull Damage.`;
                 outcomeType = 'danger';
                 r.events.push(`ENCOUNTER: ${encounter.title} impact: ${Math.round(encounter.riskDamage)}% damage.`);
              }
      }

      if (outcomeType === 'danger' || outcomeType === 'critical') {
        speakPanicked(outcomeMsg);
      }

      setModal({ type: 'encounter_resolution', data: { state: s, report: r, outcomeMsg, outcomeType, destIdx: resolvedDestIdx, mine, overload } });
  };

  /**
   * Finalizes the travel action after any encounters have been resolved.
   * Handles cargo loss, mining, and arrival at the destination.
   * Calls calculateCargoLoss, processDay, getNetWorth, and other game logic functions.
   * @param s The current game state.
   * @param report The daily report object.
   * @param destIdx The destination venue index.
   * @param mine Whether the player is mining.
   * @param overload Whether the mining laser is overloaded.
   */
  const finalizeJump = (s: GameState, report: DailyReport, destIdx: number, mine: boolean, overload: boolean) => {
     if (s.shipHealth < 100) {
        const lossResults = calculateCargoLoss(s, s.shipHealth, report.insuranceBought);
        if (Object.keys(lossResults.lostItems).length > 0) {
            const lostStr = Object.entries(lossResults.lostItems).map(([n,q]) => `${q} ${n}`).join(', ');
            report.events.push(`HULL BREACH LOSS: Structural damage caused loss of cargo: ${lostStr}.`);
            if (report.insuranceBought) {
                report.events.push(`INSURANCE (E.X.C.E.S.S.): 95% value replacement credited: ${formatCurrencyLog(lossResults.payout)}.`);
                report.insurancePayout = lossResults.payout;
            } else {
                report.events.push(`WARNING: No insurance active. Total cargo value loss sustained.`);
            }
        }
     }

     if (mine && hasLaser(s)) {
        const pc = s.cargo[POWER_CELL_NAME];
        
        // v5.9.4 Mining Rework: Cost strictly scales Phase * 3^(Level-1)
        const laserLevel = s.equipment['laser_mk3'] ? 3 : (s.equipment['laser_mk2'] ? 2 : 1);
        const cellsNeeded = s.gamePhase * Math.pow(3, (laserLevel - 1));

        if (pc && pc.quantity >= cellsNeeded) {
            s.cargo[POWER_CELL_NAME].quantity -= cellsNeeded;
            s.cargoWeight -= cellsNeeded * COMMODITIES.find(c=>c.name===POWER_CELL_NAME)!.unitWeight;
            if (s.cargo[POWER_CELL_NAME].quantity <= 0) delete s.cargo[POWER_CELL_NAME];
            
            // v5.9.4 Yield Balancing: yield is scaled strictly by laser health %
            const healthYieldMult = s.laserHealth / 100;
            const phaseYieldMult = s.gamePhase === 1 ? 1 : (s.gamePhase === 2 ? 5 : (s.gamePhase === 3 ? 10 : 20));
            const equipmentMult = (laserLevel === 3 ? 5 : (laserLevel === 2 ? 2 : 1)) * (overload ? MINING_OVERLOAD_YIELD_MULT : 1); 
            
            const baseYield = Math.floor(Math.random() * 10) + 5; 
            const finalYieldScale = equipmentMult * phaseYieldMult * healthYieldMult;
            const amt = Math.max(1, Math.round(baseYield * finalYieldScale)); 

            const minedItems: {name: string, amt: number}[] = [];
            if (laserLevel >= 1) minedItems.push({name: 'Allthemantium Ore', amt: amt});
            if (laserLevel >= 2 && Math.random() > 0.4) minedItems.push({name: 'Antimatter Rod', amt: Math.ceil(amt * 0.2)});
            if (laserLevel >= 3 && Math.random() > 0.7) minedItems.push({name: 'Dark Matter', amt: Math.ceil(amt * 0.05)});

            // v5.9.4 Overload Risk: 5x damage amount/risk
            if (overload && Math.random() < 0.6) { 
                const baseDmg = Math.floor(Math.random() * 8) + 4;
                const selfDmg = baseDmg * MINING_OVERLOAD_RISK_MULT; 
                s.laserHealth = Math.max(0, s.laserHealth - selfDmg); 
                report.totalLaserDamage += selfDmg;
                report.events.push(`Laser Overload: Massive resonance backfire! Sustained -${selfDmg}% Laser Damage.`);
            } else if (!overload && Math.random() < 0.1) {
                const selfDmg = Math.floor(Math.random() * 5) + 1;
                s.laserHealth = Math.max(0, s.laserHealth - selfDmg);
                report.events.push(`Mining Maintenance: Minor focal burn. Sustained -${selfDmg}% Laser Damage.`);
            }

            minedItems.forEach(item => {
                const cData = COMMODITIES.find(c=>c.name===item.name)!;
                const cur = s.cargo[item.name] || { quantity: 0, averageCost: 0 };
                const newTotal = cur.quantity + item.amt;
                const newAvg = ((cur.quantity * cur.averageCost) + (item.amt * 0)) / newTotal;
                s.cargo[item.name] = { quantity: newTotal, averageCost: newAvg }; 
                s.cargoWeight += item.amt*cData.unitWeight;
                report.gainedItems[item.name] = (report.gainedItems[item.name]||0) + item.amt;
            });
            report.events.push(`MINING: Extraction cycle complete. Used ${cellsNeeded} ${POWER_CELL_NAME}. Efficiency: ${Math.round(healthYieldMult*100)}%. Yield: ${minedItems.map(i=>`${i.amt} ${i.name}`).join(', ')}`);
        } else {
             report.events.push(`MINING FAILED: Insufficient ${POWER_CELL_NAME} (Need ${cellsNeeded}).`);
        }
     }
     s.day++;
     s.currentVenueIndex = destIdx;
     
     const arrivedItems = s.warehouse[destIdx];
     const claimed: string[] = [];
     if (arrivedItems) {
         Object.keys(arrivedItems).forEach(key => {
             const item = arrivedItems[key];
             if (item.arrivalDay <= s.day && !item.isContractReserved) {
                 const c = COMMODITIES.find(x => x.name === key)!;
                 const cur = s.cargo[key] || { quantity: 0, averageCost: 0 };
                 const newTotal = cur.quantity + item.quantity;
                 const newAvg = ((cur.quantity * cur.averageCost) + (item.quantity * item.originalAvgCost)) / newTotal;
                 s.cargo[key] = { quantity: newTotal, averageCost: newAvg };
                 s.cargoWeight += item.quantity * c.unitWeight;
                 claimed.push(`${item.quantity} ${key}`);
                 delete s.warehouse[destIdx][key];
             }
         });
         if (Object.keys(s.warehouse[destIdx]).length === 0) delete s.warehouse[destIdx];
     }
     
     if (claimed.length > 0) {
         report.events.unshift(`ARRIVAL LOGISTICS: Shipment automatically transferred to cargo: ${claimed.join(', ')}`);
     }

     processDay(s, report);
     const nw = getNetWorth(s);

     if (s.day > GOAL_OVERTIME_DAYS) {
        s.gameOver = true;
        const isHS = s.highScores.length < 100 || nw > s.highScores[s.highScores.length - 1].score;
        setModal({ type: 'endgame', data: { reason: "Retirement Day: Trade License Expired Successfully", netWorth: nw, stats: s.stats, isHighScore: isHS, days: GOAL_OVERTIME_DAYS } });
        SFX.play('success');
        return;
     }

     const curGoal = s.gamePhase === 1 ? GOAL_PHASE_1_AMOUNT : (s.gamePhase === 2 ? GOAL_PHASE_2_AMOUNT : (s.gamePhase === 3 ? GOAL_PHASE_3_AMOUNT : 0));
     if (nw >= curGoal && s.gamePhase < 3) {
         const daysCurrent = s.gamePhase === 1 ? GOAL_PHASE_1_DAYS : GOAL_PHASE_2_DAYS;
         const daysNext = s.gamePhase === 1 ? GOAL_PHASE_2_DAYS : GOAL_PHASE_3_DAYS;
         const daysExt = daysNext - daysCurrent;
         let message = `Congratulations, you have completed the Net worth required in time to proceed to Phase ${s.gamePhase + 1} and have been granted ${daysExt} additional days to trade by Galactic Overlord Decree.`;
         if (s.gamePhase + 1 === 3) {
          message += ` The stock market is now available in the I.B.A.N.K. Hub.`;
         }
         speakRetro(message);
         setModal({ type: 'goal_achieved', data: { phase: s.gamePhase, nextPhase: s.gamePhase + 1, state: s, report, daysExtended: daysExt } });
         SFX.play('success');
         return; 
     }
     if (nw >= curGoal && s.gamePhase === 3) {
         const daysExt = GOAL_OVERTIME_DAYS - GOAL_PHASE_3_DAYS;
         speakRetro(`Congratulations, you have completed the Net worth required in time to proceed to Phase 4 and have been granted ${daysExt} additional days to trade by Galactic Overlord Decree.`);
         setModal({ type: 'goal_achieved', data: { phase: 3, nextPhase: 4, state: s, report, daysExtended: daysExt } });
         SFX.play('success');
         return;
     }
     const deadlineLimit = s.gamePhase === 1 ? GOAL_PHASE_1_DAYS : (s.gamePhase === 2 ? GOAL_PHASE_2_DAYS : (s.gamePhase === 3 ? GOAL_PHASE_3_DAYS : GOAL_OVERTIME_DAYS));
     if (s.gamePhase <= 4 && s.day > deadlineLimit && nw < curGoal) s.gameOver = true;
     
     if (!s.gameOver) {
        if (s.day === deadlineLimit) {
             setModal({type:'message', data: "URGENT WARNING: Today is the Phase Deadline. Meet the goal or face license revocation!", color: 'text-red-500'});
             setTimeout(() => {
                setModal({ type: 'report', data: { events: report.events, day: s.day, tips: getMarketTips(s), quirky: report.quirkyMessage } });
                if (report.quirkyMessage) speakRetro(report.quirkyMessage.text);
             }, 2000);
             setState(s);
             SFX.play('alarm');
             return;
        }
        setModal({ type: 'report', data: { events: report.events, day: s.day, tips: getMarketTips(s), quirky: report.quirkyMessage } });
        if (report.quirkyMessage) speakRetro(report.quirkyMessage.text);
        speakDailyStatusAlerts(s);
        setState(s);
     } else {
        const isHS = s.highScores.length < 100 || nw > s.highScores[s.highScores.length - 1].score;
        setModal({ type: 'endgame', data: { reason: "Deadline Missed. License Revoked.", netWorth: nw, stats: s.stats, isHighScore: isHS, days: s.day - 1 } });
        SFX.play('error');
     }
  };

  const triggerTravelExecution = (
      destIdx: number,
      fuel: number,
      missingFuel: number,
      missingCells: number,
      newStateForTravel?: GameState
  ) => {
      if (missingFuel > 0 || missingCells > 0) {
          let ns = newStateForTravel;
          if (!ns) {
              const fuelPrice = COMMODITIES.find(c => c.name === FUEL_NAME)!.maxPrice;
              const cellPrice = COMMODITIES.find(c => c.name === POWER_CELL_NAME)!.maxPrice;
              const cost = (missingFuel * fuelPrice) + (missingCells * cellPrice);
              const overdraftFee = state!.cash < cost ? cost * 0.10 : 0;
              const totalCost = cost + overdraftFee;

              ns = JSON.parse(JSON.stringify(state));
              ns.cash -= totalCost;

              const newCargo = ns.cargo;
              if (missingFuel > 0) {
                  const curF = newCargo[FUEL_NAME] || { quantity: 0, averageCost: 0 };
                  newCargo[FUEL_NAME] = {
                      quantity: curF.quantity + missingFuel,
                      averageCost: ((curF.quantity * curF.averageCost) + (missingFuel * fuelPrice)) / (curF.quantity + missingFuel)
                  };
              }
              if (missingCells > 0) {
                  const curC = newCargo[POWER_CELL_NAME] || { quantity: 0, averageCost: 0 };
                  newCargo[POWER_CELL_NAME] = {
                      quantity: curC.quantity + missingCells,
                      averageCost: ((curC.quantity * curC.averageCost) + (missingCells * cellPrice)) / (curC.quantity + missingCells)
                  };
              }

              ns.cargoWeight += (missingFuel * COMMODITIES.find(c => c.name === FUEL_NAME)!.unitWeight) + (missingCells * COMMODITIES.find(c => c.name === POWER_CELL_NAME)!.unitWeight);

              log(`EMERGENCY: Auto-bought ${missingFuel} Fuel and ${missingCells} Cells at max price.`, 'maintenance');
              if (overdraftFee > 0) log(`OVERDRAFT FEE: Paid ${formatCurrencyLog(overdraftFee)} for emergency purchase.`, 'overdraft');
              SFX.play('coin');
          }
          handleTravel(destIdx, fuel, travelConfig.insurance, travelConfig.mining, travelConfig.overload, travelConfig.invest95, ns);
      } else {
          handleTravel(destIdx, fuel, travelConfig.insurance, travelConfig.mining, travelConfig.overload, travelConfig.invest95, newStateForTravel);
      }
  };

  const checkCargoBeforeTravel = (
      destIdx: number,
      fuel: number,
      missingFuel: number,
      missingCells: number,
      newStateForTravel?: GameState
  ) => {
      const currentState = newStateForTravel || state;
      if (!currentState) return;

      const laserLevel = currentState.equipment['laser_mk3'] ? 3 : (currentState.equipment['laser_mk2'] ? 2 : 1);
      const cellsNeeded = travelConfig.mining ? (currentState.gamePhase * Math.pow(3, (laserLevel - 1))) : 0;

      // Spice Fuel and Hot Isotope Hummers needed to travel are excluded:
      const fuelNeededToTravel = fuel;
      const cellsNeededToTravel = cellsNeeded;

      // Find excess and eligible items to ship
      // For Strategy 1 and Strategy 2, we subtract required travel fuel & hot isotopes first.
      const stratShippedItems: Array<{ name: string; quantity: number; averageCost: number; unitWeight: number }> = [];

      Object.entries(currentState.cargo).forEach(([name, item]) => {
          if (name === FUEL_NAME) {
              const excess = Math.max(0, item.quantity - fuelNeededToTravel);
              if (excess > 0) {
                  const cData = COMMODITIES.find(c => c.name === name);
                  stratShippedItems.push({ name, quantity: excess, averageCost: item.averageCost, unitWeight: cData?.unitWeight || 0 });
              }
          } else if (name === POWER_CELL_NAME) {
              const excess = Math.max(0, item.quantity - cellsNeededToTravel);
              if (excess > 0) {
                  const cData = COMMODITIES.find(c => c.name === name);
                  stratShippedItems.push({ name, quantity: excess, averageCost: item.averageCost, unitWeight: cData?.unitWeight || 0 });
              }
          } else if (item.quantity > 0) {
              const cData = COMMODITIES.find(c => c.name === name);
              stratShippedItems.push({ name, quantity: item.quantity, averageCost: item.averageCost, unitWeight: cData?.unitWeight || 0 });
          }
      });

      // Shipped weight and remaining cargo weight
      const totalShippedWeight = stratShippedItems.reduce((sum, item) => sum + (item.quantity * item.unitWeight), 0);
      const remainingWeightAfterShipping = currentState.cargoWeight - totalShippedWeight;

      const isOverfilled = currentState.cargoWeight > currentState.cargoCapacity;

      if (isOverfilled) {
          const cannotProceedEvenAfterShipping = remainingWeightAfterShipping > currentState.cargoCapacity;

          if (cannotProceedEvenAfterShipping) {
              // Direct player to move cargo themselves
              setModal({
                  type: 'message',
                  data: `CARGO OVERFILL BLOCK: Captain, your cargo hold is overloaded (${Math.round(currentState.cargoWeight)}/${currentState.cargoCapacity}T). Even after auto-shipping all excess cargo, your remaining required Spice Fuel (${fuelNeededToTravel} units) and Hot Isotope Hummers (${cellsNeededToTravel} units) needed to travel still weigh ${Math.round(remainingWeightAfterShipping)}T, exceeding your cargo capacity. Please manually move, sell, or discard cargo to fit within capacity before you can depart!`,
                  color: 'text-red-500'
              });
              SFX.play('error');
          } else {
              setModal({
                  type: 'cargo_capacity_ship_confirm',
                  data: {
                      destIdx,
                      fuel,
                      missingFuel,
                      missingCells,
                      newStateForTravel,
                      shippedItems: stratShippedItems,
                      totalShippedWeight,
                      remainingWeightAfterShipping,
                      isProactive: false
                  }
              });
          }
      } else {
          // Flow Optimization: offer proactive cargo space optimization if cargo hold is close to full (>85% capacity)
          const isCloseToFull = currentState.cargoWeight > (currentState.cargoCapacity * 0.85);

          if (isCloseToFull && stratShippedItems.length > 0) {
              setModal({
                  type: 'cargo_capacity_ship_confirm',
                  data: {
                      destIdx,
                      fuel,
                      missingFuel,
                      missingCells,
                      newStateForTravel,
                      shippedItems: stratShippedItems,
                      totalShippedWeight,
                      remainingWeightAfterShipping,
                      isProactive: true
                  }
              });
          } else {
              triggerTravelExecution(destIdx, fuel, missingFuel, missingCells, newStateForTravel);
          }
      }
  };

  // L. DAILY CYCLE & CORE SYSTEMS LOGIC
  // These functions handle the end-of-day processing and other core game systems.

  // This effect provides a spoken tip about the optimal venue for the next day.
  // Calls speakRetro.
  useEffect(() => {
    if (modal.type === 'travel' && state?.optimalVenueToday && state.optimalVenueToday !== -1 && !state.hasSpokenOptimalVenue) {
        speakRetro(`According to all calculation available, I would suggest ${VENUES[state.optimalVenueToday]} as the optimal venue to Buy, Fabricate and Sell commodities tomorrow.`);
        setState(prev => prev ? { ...prev, hasSpokenOptimalVenue: true } : null);
    }
  }, [modal.type, state?.optimalVenueToday, state?.hasSpokenOptimalVenue]);

  /**
   * Helper function to calculate the current maximum range price of a given commodity c.
   * This respects the game's active phase multiplier, custom price overrides,
   * and special multipliers for biological commodities such as H2O and Nutri-Paste.
   */
  const getCommodityMaxPrice = (s: GameState, c: Commodity): number => {
    const key = c.name;
    const phaseMultiplierVal = 1 + ((s.gamePhase - 1) * 0.25);
    const h2oPasteMaxMult = Math.pow(1.10, s.day);
    let rangeMax = s.commodityPriceOverrides?.[key]?.max || c.maxPrice * phaseMultiplierVal;
    if (key === H2O_NAME || key === NUTRI_PASTE_NAME) {
        rangeMax = c.maxPrice * h2oPasteMaxMult;
    }
    return Math.round(rangeMax);
  };

  /**
   * Processes the end of a day, updating loans, investments, contracts, and other daily events.
   * Calls speakRetro, evolveMarkets, generateLoanOffers, and generateContracts.
   * @param s The current game state.
   * @param report The daily report object.
   */
  const processDay = (s: GameState, report: DailyReport) => {
    // Apply pending scanner changes for the new day
    if (s.pendingFixedCommodity) {
      s.fixedCommodity = s.pendingFixedCommodity;
      s.pendingFixedCommodity = undefined;
    } else {
      s.fixedCommodity = undefined;
    }

    if (s.pendingBoostedCommodity) {
      const boost = 1.15 + Math.random() * 0.15;
      const c = COMMODITIES.find(item => item.name === s.pendingBoostedCommodity!.name);
      if (c) {
          const currentMin = s.commodityPriceOverrides?.[c.name]?.min || c.minPrice;
          const currentMax = s.commodityPriceOverrides?.[c.name]?.max || c.maxPrice;
          const newMin = currentMin * boost;
          const newMax = currentMax * boost;
          s.commodityPriceOverrides = {
              ...s.commodityPriceOverrides,
              [c.name]: { min: newMin, max: newMax }
          };
      }
      s.boostedCommodity = s.pendingBoostedCommodity;
      s.pendingBoostedCommodity = undefined;
    } else {
      s.boostedCommodity = undefined;
    }

    s.dailyTransactions = {};
    s.fomoDailyUse = { mesh: false, stims: false };
    s.hasSpokenOptimalVenue = false;

    // Increase mutant crew unrest daily as phases increase (Enhancement 142)
    const dailyUnrestIncrease = s.gamePhase * 2;
    s.mutantUnrest = Math.min(100, (s.mutantUnrest || 10) + dailyUnrestIncrease);
    if (s.mutantUnrest >= 100 && !s.isMutinyActive) {
        s.isMutinyActive = true;
        s.mutantUnrest = 100;
        const pcChipsQuantity = s.markets[s.currentVenueIndex]?.["PC Chips"]?.quantity || 0;
        s.mutinyPcChipsRequirement = Math.floor((pcChipsQuantity * 0.22) / 5) * 5;
        report.events.push(`MUTINY DECLARED: Mutant crew unrest reached 100%! F.O.M.O. and Upgrades decks have been locked.`);
    }

    // Calculate optimal venue for the next day
    let bestVenueIndex = -1;
    let bestScore = -Infinity;

    s.markets.forEach((market, index) => {
        let score = 0;
        // Fabrication score (lower cost of raw materials)
        const h2oPrice = market[H2O_NAME]?.price || Infinity;
        const orePrice = market['Allthemantium Ore']?.price || Infinity;
        const clothPrice = market['Synthetic Cloth']?.price || Infinity;
        score -= (h2oPrice + orePrice + clothPrice);

        // Buy score (lower prices on high-value goods)
        COMMODITIES.forEach(c => {
            if (c.rarity > 0.5) { // Prioritize rare/expensive items
                score -= market[c.name]?.price || Infinity;
            }
        });

        // Sell score (higher prices on fabricated goods)
        score += market[MESH_NAME]?.price || 0;
        score += market['Stim-Packs']?.price || 0;

        if (score > bestScore) {
            bestScore = score;
            bestVenueIndex = index;
        }
    });
    s.optimalVenueToday = bestVenueIndex;
    
    s.activeContracts = s.activeContracts.filter(c => c.status === 'active' || c.dayCompleted === s.day);

    COMMODITIES.forEach(c => {
        let total = 0;
        s.markets.forEach(m => {
            if (m && m[c.name]) {
                total += m[c.name].quantity || 0;
            }
        });
        const injection = Math.ceil(total * 0.10);
        let remaining = injection;
        while(remaining > 0) {
             const chunk = Math.min(remaining, Math.ceil(injection/10));
             const vIdx = Math.floor(Math.random() * VENUES.length);
             if (s.markets[vIdx] && s.markets[vIdx][c.name]) {
                 s.markets[vIdx][c.name].quantity += chunk;
             }
             remaining -= chunk;
        }
    });
    if (s.day > 1) {
        const themes = Object.keys(QUIRKY_MESSAGES_DB);
        const theme = themes[Math.floor(Math.random() * themes.length)];
        const msgs = QUIRKY_MESSAGES_DB[theme as keyof typeof QUIRKY_MESSAGES_DB];
        report.quirkyMessage = { text: msgs[Math.floor(Math.random() * msgs.length)], theme };
    }
    if (s.cash < 0) {
       const interest = Math.abs(s.cash) * 0.15;
       s.cash -= interest;
       report.events.push(`OVERDRAFT: Charged ${formatCurrencyLog(interest)} interest (15%).`);
    }
    const girlMatter = s.cargo['G.I.R.L (Lite) Matter'];
    if (girlMatter && Math.random() < 0.33) {
        const pct = 0.05 + Math.random() * 0.10; 
        const loss = Math.ceil(girlMatter.quantity * pct);
        s.cargo['G.I.R.L (Lite) Matter'].quantity = Math.max(0, s.cargo['G.I.R.L (Lite) Matter'].quantity - loss);
        const cData = COMMODITIES.find(c => c.name === 'G.I.R.L (Lite) Matter')!;
        s.cargoWeight -= loss * cData.unitWeight;
        if (s.cargo['G.I.R.L (Lite) Matter'].quantity <= 0) delete s.cargo['G.I.R.L (Lite) Matter'];
        report.events.push(`WARNING: G.I.R.L Matter instability detected! ${loss} units evaporated/exploded.`);
    }
    const powerCells = s.cargo[POWER_CELL_NAME];
    if (powerCells && Math.random() < 0.25) {
        const loss = Math.ceil(powerCells.quantity * 0.02);
        s.cargo[POWER_CELL_NAME].quantity = Math.max(0, s.cargo[POWER_CELL_NAME].quantity - loss);
        const cData = COMMODITIES.find(c => c.name === POWER_CELL_NAME)!;
        s.cargoWeight -= loss * cData.unitWeight;
        if (s.cargo[POWER_CELL_NAME].quantity <= 0) delete s.cargo[POWER_CELL_NAME];
        report.events.push(`MAINTENANCE: ${loss} ${POWER_CELL_NAME} found dead and were discarded.`);
    }

    // Process daily dividends from successful corporate takeovers (Enhancement 135)
    if (s.dailyDividends && s.dailyDividends > 0) {
        s.cash += s.dailyDividends;
        report.events.push(`DIVIDENDS: Received +${formatCurrencyLog(s.dailyDividends)} from your corporate acquisitions.`);
    }

    let keepLoans: any[] = [];
    s.activeLoans.forEach(l => {
       l.daysRemaining--;
       l.currentDebt += Math.round(l.currentDebt * (l.interestRate/100));
       if (l.daysRemaining <= 0) {
          s.cash -= l.currentDebt;
          report.events.push(`LOAN MATURITY: ${l.firmName} collected ${formatCurrencyLog(l.currentDebt)}. Account debited.`);
       } else {
          keepLoans.push(l);
       }
    });
    s.activeLoans = keepLoans;
    let keepInv: any[] = [];
    s.investments.forEach(i => {
       i.daysRemaining--;
       if (i.daysRemaining <= 0) {
          s.cash += i.maturityValue;
          report.events.push(`INVESTMENT MATURED: Received ${formatCurrencyLog(i.maturityValue)}.`);
       } else {
          keepInv.push(i);
       }
    });
    s.investments = keepInv;
    Object.keys(s.warehouse).forEach(vIdxKey => {
        const vIdx = parseInt(vIdxKey);
        const venueItems = s.warehouse[vIdx];
        const keptItems: Record<string, WarehouseItem> = {};
        Object.entries(venueItems).forEach(([name, item]) => {
             const relevantContracts = s.activeContracts.filter(c => c.commodity === name && c.destinationIndex === vIdx && c.status === 'active');
             let consumed = false;
             relevantContracts.forEach(c => {
                 if (!consumed && item.quantity >= c.quantity && item.arrivalDay <= s.day) {
                     item.quantity -= c.quantity;
                     s.cash += c.reward;
                     s.stats.largestSingleWin = Math.max(s.stats.largestSingleWin, c.reward);
                     const fulfillmentMsg = `CONTRACT FULFILLED: ${c.firm} received shipment at ${VENUES[c.destinationIndex]}. Reward: ${formatCurrencyLog(c.reward)}`;
                     report.events.push(fulfillmentMsg);
                     speakRetro(`The contract for ${c.firm} consignment of ${c.commodity} has arrived at ${VENUES[c.destinationIndex]} the contract has been successfully completed.`);
                     c.status = 'completed';
                     c.dayCompleted = s.day;
                     if (item.quantity <= 0) consumed = true;
                 }
             });
             if (consumed) {
             } else if (item.quantity > 0) {
                 if (item.arrivalDay > s.day) {
                     if (Math.random() < 0.1) {
                         item.arrivalDay++;
                         report.events.push(`DELAY: Shipment of ${name} to ${VENUES[vIdx]} delayed 1 day due to logistics hiccups.`);
                     }
                     keptItems[name] = item;
                 } else {
                     if (s.day > item.arrivalDay + 3) {
                         report.events.push(`SEIZURE: ${item.quantity} ${name} at ${VENUES[vIdx]} sold to defray storage costs.`);
                     } else {
                         keptItems[name] = item;
                     }
                 }
             }
        });
        s.warehouse[vIdx] = keptItems;
        if (Object.keys(s.warehouse[vIdx]).length === 0) delete s.warehouse[vIdx];
    });
    Object.keys(s.venueTradeBans).forEach(idxKey => {
        const idxVal = parseInt(idxKey);
        if (s.venueTradeBans[idxVal] > 0) s.venueTradeBans[idxVal]--;
        if (s.venueTradeBans[idxVal] <= 0) delete s.venueTradeBans[idxVal];
    });

    s.activeContracts.forEach(c => {
        if (c.status === 'active') {
            c.daysRemaining--;
            if (c.daysRemaining <= 0) {
                s.cash -= c.penalty;
                s.venueTradeBans[c.destinationIndex] = TRADE_BAN_DURATION;
                const message = `Unfortunately, the contract for ${c.firm} consignment of ${c.commodity} failed. You have been fined ${formatCurrencyLog(c.penalty)} and are banned from trading at ${VENUES[c.destinationIndex]} for 3 days.`;
                report.events.push(message);
                speakRetro(message);
                c.status = 'failed';
                c.dayCompleted = s.day;
            } else if (c.daysRemaining === 1) {
                report.events.push(`WARNING: Contract for ${c.firm} due TOMORROW.`);
            }
        }
    });


    if (s.scannerLastUsedDay !== s.day -1) {
      s.scannerConsecutiveDays = 0;
    }

    if (s.scannerConsecutiveDays === 3) {
      s.warrantLevel = (s.warrantLevel || 0) + 1;
      report.events.push(`WARRANT ISSUED: Your market manipulation has been detected. A warrant has been issued for your arrest.`);
      s.scannerConsecutiveDays = 0; // Reset after issuing warrant
    }

    if (s.stocks) {
      let updatedStocks = s.stocks.map(stock => {
        let priceChange = 0;
        const roll = Math.random();

        // 30% chance of simulated active trading by NPCs on this stock today (Enhancement 136)
        if (roll < 0.15) {
          // Simulated Institutional Buy
          const volume = Math.floor((stock.totalShares ?? 100000) * (0.005 + Math.random() * 0.025));
          const actualVolume = Math.min(stock.availableQuantity ?? 0, volume);
          if (actualVolume > 0) {
            const priceImpactPercent = 0.02 + Math.random() * 0.08; // 2% to 10% price increase
            priceChange = stock.price * priceImpactPercent;
            stock.availableQuantity = Math.max(0, (stock.availableQuantity ?? 0) - actualVolume);

            // Log to messages so it appears in the G.I.G.O feed!
            const logEntry = `SIMULATOR: Institution purchased ${actualVolume.toLocaleString()} shares of ${stock.name}, driving price up +${(priceImpactPercent * 100).toFixed(1)}%.`;
            s.messages.push({
              id: Date.now() + Math.random(),
              message: logEntry,
              type: 'info'
            });
            report.events.push(`MARKET: NPC buying increased ${stock.name} price by +${(priceImpactPercent * 100).toFixed(1)}%.`);
          }
        } else if (roll < 0.30) {
          // Simulated Retail/Whale Sell
          const volume = Math.floor((stock.totalShares ?? 100000) * (0.005 + Math.random() * 0.025));
          const priceImpactPercent = -(0.02 + Math.random() * 0.08); // 2% to 10% price drop
          priceChange = stock.price * priceImpactPercent;
          stock.availableQuantity = (stock.availableQuantity ?? 0) + volume;

          const logEntry = `SIMULATOR: Large stakeholder divested ${volume.toLocaleString()} shares of ${stock.name}, lowering price by ${(priceImpactPercent * 100).toFixed(1)}%.`;
          s.messages.push({
            id: Date.now() + Math.random(),
            message: logEntry,
            type: 'info'
          });
          report.events.push(`MARKET: NPC selling dropped ${stock.name} price by ${(priceImpactPercent * 100).toFixed(1)}%.`);
        } else {
          // Standard organic drift
          if (stock.risk === 'low') {
            priceChange = stock.price * (Math.random() * 0.1 - 0.03);
          } else if (stock.risk === 'medium') {
            priceChange = stock.price * (Math.random() * 0.25 - 0.1);
          } else {
            priceChange = stock.price * (Math.random() * 0.72 - 0.22);
          }
        }

        const newPrice = Math.max(1, stock.price + priceChange);
        const availableQuantity = stock.availableQuantity || (1000 + Math.floor(Math.random() * 99001));
        return { ...stock, price: newPrice, availableQuantity };
      });

      // E. Daily Supply Replenishment ("The Float")
      s.stocks = updatedStocks.map(stock => {
        const randomWeight = Math.random() * 2 - 1; // -1 to 1
        const change = Math.round((stock.totalShares ?? 1000000) * 0.05 * randomWeight);
        const newAvailable = Math.max(0, (stock.availableQuantity ?? 0) + change);

        // B. Stock Splits
        let newPrice = stock.price;
        let newQuantity = stock.quantity;
        let newAvailableQuantity = newAvailable;
        if (newPrice > 1000000) {
          newPrice /= 2;
          newQuantity *= 2;
          newAvailableQuantity *= 2;
          log(`STOCK SPLIT: ${stock.name} has split 2-for-1 due to high valuation.`, 'phase');
        }

        const newHistory = [...(stock.history || []), newPrice].slice(-5);

        // Calculate new volatility-dependent daily purchase limit for the new day
        const limitRemaining = calculateDailyStockLimit({ ...stock, price: newPrice, quantity: newQuantity, availableQuantity: newAvailableQuantity });

        return {
          ...stock,
          price: newPrice,
          quantity: newQuantity,
          availableQuantity: newAvailableQuantity,
          history: newHistory,
          dailyBuyLimitRemaining: limitRemaining
        };
      }).sort((a, b) => a.name.localeCompare(b.name));

      if (Math.random() < 0.22) {
        if (s.hasTradedStocksToday) {
          s.cash += (s.jackpot || 0) * 10;
          report.events.push(`JACKPOT! You won the stock market jackpot of ${formatCurrencyLog((s.jackpot || 0) * 10)}!`);
        } else {
          s.cash += s.jackpot || 0;
          report.events.push(`You won the stock market jackpot of ${formatCurrencyLog(s.jackpot || 0)}!`);
        }
        s.jackpot = 1000000;
      }
    }

    s.hasTradedStocksToday = false;

    s.markets = evolveMarkets(s);

    // ============================================================================
    // COMMODITY REBALANCING SYSTEM (Enhancement 131)
    // Checks each commodity individually at day transition. If a commodity is at
    // max price in 3 or more venues, it means there is a galaxy-wide shortage.
    // We:
    // 1) Expand its maximum price override ceiling by 5%.
    // 2) Select 2 random venues from those currently at the ceiling price limit.
    // 3) Inject a huge amount of stock into the first venue and half of that first amount in the second.
    // 4) Recalculate commodity prices iteratively based on new supply to satisfy supply-demand formulas.
    // 5) Repeat/loop until at most one venue is left at the maximum price.
    // ============================================================================
    COMMODITIES.forEach(c => {
        let iterations = 0;
        const maxIterations = 10; // Guard against potential infinite loops
        let isTriggered = false; // Track if rebalancing was triggered by >= 3 sites at max
        while (iterations < maxIterations) {
            // Determine current max standard price limit for this commodity
            const currentMaxPrice = getCommodityMaxPrice(s, c);

            // Find all venues where the commodity price is at or exceeds the ceiling
            const maxPriceVenues: number[] = [];
            s.markets.forEach((m, idx) => {
                if (m[c.name] && m[c.name].price >= currentMaxPrice) {
                    maxPriceVenues.push(idx);
                }
            });

            // If not triggered yet, check if we meet the 3-site trigger threshold.
            // If already triggered, continue rebalancing until only 1 or 0 venues remain at max price.
            if (!isTriggered) {
                if (maxPriceVenues.length >= 3) {
                    isTriggered = true;
                } else {
                    break;
                }
            } else {
                if (maxPriceVenues.length <= 1) {
                    break;
                }
            }

            // Perform 5% range expansion
            const phaseMultiplierVal = 1 + ((s.gamePhase - 1) * 0.25);
            const defaultMin = c.minPrice * phaseMultiplierVal;
            const defaultMax = c.maxPrice * phaseMultiplierVal;

            const existingMin = s.commodityPriceOverrides?.[c.name]?.min ?? defaultMin;
            const existingMax = s.commodityPriceOverrides?.[c.name]?.max ?? defaultMax;
            const newMaxOverride = existingMax * 1.05;

            if (!s.commodityPriceOverrides) {
                s.commodityPriceOverrides = {};
            }
            s.commodityPriceOverrides[c.name] = {
                min: existingMin,
                max: newMaxOverride
            };

            // Randomly pick exactly 2 of the sites that are at max price
            const shuffledVenues = [...maxPriceVenues].sort(() => Math.random() - 0.5);
            const v1 = shuffledVenues[0];
            const v2 = shuffledVenues[1];

            // Quantities injected are scaled by current phase stock multipliers for proper game balancing
            const stockMult = s.gamePhase === 1 ? 1 : (s.gamePhase === 2 ? 5 : (s.gamePhase === 3 ? 10 : 20));

            // Calculate total global stock of c.name prior to standard injections (Enhancement 135)
            let totalGlobalStockBefore = 0;
            s.markets.forEach(m => {
                totalGlobalStockBefore += m[c.name]?.quantity || 0;
            });
            const baselineStock = totalGlobalStockBefore > 0 ? totalGlobalStockBefore : 500 * stockMult;

            // Distribute an additional 10% of global stock randomly into the pool (Enhancement 135)
            const extraStock10 = Math.round(baselineStock * 0.10);
            if (extraStock10 > 0) {
                let rem = extraStock10;
                while (rem > 0) {
                    const randomVenueIdx = Math.floor(Math.random() * s.markets.length);
                    const amt = Math.min(rem, Math.max(1, Math.floor(Math.random() * (rem / 2 + 1))));
                    if (s.markets[randomVenueIdx] && s.markets[randomVenueIdx][c.name]) {
                        s.markets[randomVenueIdx][c.name].quantity += amt;
                    }
                    rem -= amt;
                }
            }

            // Calculate +7% and +5% of global stock (baseline) for v1 and v2 (Enhancement 135)
            const v1Amt = Math.max(1, Math.round(baselineStock * 0.07));
            const v2Amt = Math.max(1, Math.round(baselineStock * 0.05));

            if (s.markets[v1] && s.markets[v1][c.name]) {
                s.markets[v1][c.name].quantity += v1Amt;
            }
            if (s.markets[v2] && s.markets[v2][c.name]) {
                s.markets[v2][c.name].quantity += v2Amt;
            }

            // Log rebalancing event to player's terminal report feed (Enhancement 135)
            report.events.push(`REBALANCE: ${c.name} reached peak demand globally. Price ceiling expanded +5%. Distributed +10% (+${extraStock10} units) of global stock randomly, and shipped emergency supply to ${VENUES[v1]} (+${v1Amt} units, +7%) and ${VENUES[v2]} (+${v2Amt} units, +5%).`);

            // Recalculate commodity prices across all markets to reflect the newly injected stock quantities
            const globalStocks: Record<string, number> = {};
            COMMODITIES.forEach(com => {
                let total = 0;
                s.markets.forEach(m => total += m[com.name]?.quantity || 0);
                globalStocks[com.name] = total / s.markets.length;
            });

            const h2oPasteMinMult = Math.pow(1.05, s.day);
            const h2oPasteMaxMult = Math.pow(1.10, s.day);

            s.markets.forEach((m, mIdx) => {
                const item = m[c.name];
                if (!item) return;

                const adjustedStdQty = item.standardQuantity * stockMult;
                const effectiveRatio = (item.quantity + 1) / adjustedStdQty;

                let rMin = s.commodityPriceOverrides?.[c.name]?.min || c.minPrice * phaseMultiplierVal;
                let rMax = s.commodityPriceOverrides?.[c.name]?.max || c.maxPrice * phaseMultiplierVal;

                if (c.name === H2O_NAME || c.name === NUTRI_PASTE_NAME) {
                    rMin = c.minPrice * h2oPasteMinMult;
                    rMax = c.maxPrice * h2oPasteMaxMult;
                }

                let newPrice = 0;
                if (s.fixedCommodity?.name === c.name) {
                    newPrice = s.fixedCommodity.venuePrices[mIdx];
                } else if (c.name === 'Spacetime Tea') {
                    const logMin = Math.log(rMin);
                    const logMax = Math.log(rMax);
                    const scale = logMin + (logMax - logMin) * Math.random();
                    newPrice = Math.round(Math.exp(scale));
                    const avgStock = globalStocks[c.name] || 1;
                    const relativeRatio = avgStock / (item.quantity + 1);
                    const swing = Math.min(1.25, Math.max(0.75, relativeRatio));
                    newPrice = Math.round(newPrice * swing);
                    newPrice = Math.round(Math.min(rMax, Math.max(rMin, newPrice)));
                } else {
                    const mid = (rMin + rMax) / 2;
                    newPrice = mid / Math.sqrt(effectiveRatio);
                    newPrice = Math.round(Math.min(rMax, Math.max(rMin, newPrice)));
                }

                m[c.name].price = newPrice;
            });

            iterations++;
        }
    });

    // ============================================================================
    // CRITICAL SHORTAGE DETECTION & INJECTION SYSTEM (Enhancement 135)
    // If there are more than 3 venues with 0 stock for a commodity, we inject
    // an additional 10-20% of global stock into the venues, with empty venues
    // having a 4x higher weighted probability of receiving stock as a remedy.
    // ============================================================================
    COMMODITIES.forEach(c => {
        const emptyMarkets = s.markets.filter(m => (m[c.name]?.quantity || 0) <= 0);
        if (emptyMarkets.length > 3) {
            // Calculate total global stock of c.name
            let globalStock = 0;
            s.markets.forEach(m => {
                globalStock += m[c.name]?.quantity || 0;
            });

            // Random injection percentage between 10% and 20%
            const injectPct = 0.10 + Math.random() * 0.10;
            const stockMult = s.gamePhase === 1 ? 1 : (s.gamePhase === 2 ? 5 : (s.gamePhase === 3 ? 10 : 20));

            // Handle edge case where globalStock is 0 or extremely low by having a baseline fallback
            const baseStockAmount = globalStock > 0 ? globalStock : 500 * stockMult;
            let injectAmount = Math.round(baseStockAmount * injectPct);
            if (injectAmount < 20) {
                injectAmount = 20 * stockMult;
            }

            // Assign weights: empty venues have a 4x greater chance of selection (Enhancement 135)
            const weights = s.markets.map(m => {
                const qty = m[c.name]?.quantity || 0;
                return qty <= 0 ? 4 : 1;
            });
            const totalWeight = weights.reduce((acc, w) => acc + w, 0);

            // Select index using weighted distribution
            const selectWeightedIndex = () => {
                let r = Math.random() * totalWeight;
                for (let i = 0; i < weights.length; i++) {
                    r -= weights[i];
                    if (r <= 0) return i;
                }
                return 0;
            };

            // Distribute injectAmount
            let remainingToDistribute = injectAmount;
            while (remainingToDistribute > 0) {
                const chunkSize = Math.min(remainingToDistribute, Math.max(1, Math.floor(injectAmount / 10)));
                const targetIdx = selectWeightedIndex();
                if (s.markets[targetIdx] && s.markets[targetIdx][c.name]) {
                    s.markets[targetIdx][c.name].quantity += chunkSize;
                }
                remainingToDistribute -= chunkSize;
            }

            // Recalculate prices for this commodity based on new stock levels
            const phaseMultiplierVal = 1 + ((s.gamePhase - 1) * 0.25);
            const h2oPasteMinMult = Math.pow(1.05, s.day);
            const h2oPasteMaxMult = Math.pow(1.10, s.day);

            s.markets.forEach((m, mIdx) => {
                const item = m[c.name];
                if (!item) return;

                const adjustedStdQty = item.standardQuantity * stockMult;
                const effectiveRatio = (item.quantity + 1) / adjustedStdQty;

                let rMin = s.commodityPriceOverrides?.[c.name]?.min || c.minPrice * phaseMultiplierVal;
                let rMax = s.commodityPriceOverrides?.[c.name]?.max || c.maxPrice * phaseMultiplierVal;

                if (c.name === H2O_NAME || c.name === NUTRI_PASTE_NAME) {
                    rMin = c.minPrice * h2oPasteMinMult;
                    rMax = c.maxPrice * h2oPasteMaxMult;
                }

                let newPrice = 0;
                if (s.fixedCommodity?.name === c.name) {
                    newPrice = s.fixedCommodity.venuePrices[mIdx];
                } else if (c.name === 'Spacetime Tea') {
                    const logMin = Math.log(rMin);
                    const logMax = Math.log(rMax);
                    const scale = logMin + (logMax - logMin) * Math.random();
                    newPrice = Math.round(Math.exp(scale));
                    const avgStock = (globalStock + injectAmount) / s.markets.length;
                    const relativeRatio = avgStock / (item.quantity + 1);
                    const swing = Math.min(1.25, Math.max(0.75, relativeRatio));
                    newPrice = Math.round(newPrice * swing);
                    newPrice = Math.round(Math.min(rMax, Math.max(rMin, newPrice)));
                } else {
                    const mid = (rMin + rMax) / 2;
                    newPrice = mid / Math.sqrt(effectiveRatio);
                    newPrice = Math.round(Math.min(rMax, Math.max(rMin, newPrice)));
                }

                m[c.name].price = newPrice;
            });

            report.events.push(`STOCK ALERT: Critical shortage of ${c.name} detected at ${emptyMarkets.length} venues. Emergency reserve stock of +${injectAmount} units has been injected, prioritizing empty markets.`);
        }
    });

    s.loanOffers = generateLoanOffers(s.gamePhase, s.day);
    s.availableContracts = generateContracts(s.currentVenueIndex, s.day, s.gamePhase, s.venueTradeBans, s.availableContracts, s.activeContracts);
    s.loanTakenToday = false;
  };

  /**
   * Handles the buying of stocks.
   * Calls log and SFX.play.
   * @param stockName The name of the stock to buy.
   */
  const handleBuyStock = (stockName: string) => {
    if (!state || !state.stocks) return;
    const qty = parseInt(stockBuyQuantities[stockName] || '0');
    if (qty <= 0) return;

    const stockIndex = state.stocks.findIndex(s => s.name === stockName);
    if (stockIndex === -1) return;

    const stock = state.stocks[stockIndex];

    let transactionPrice = stock.price;

    // Validate that the quantity does not exceed the Market Float Available and the cash balance minus 10% transaction fee buffer.
    const maxAffordable = Math.floor((state.cash * 0.9) / transactionPrice);
    const maxAllowed = Math.min(stock.availableQuantity ?? 0, maxAffordable);
    if (qty > maxAllowed) {
      setModal({ type: 'message', data: `Transaction Blocked: Maximum purchase amount is ${maxAllowed.toLocaleString()} shares (limited by Market Float Available and cash balance minus 10% buffer).` });
      return;
    }

    // C. Market Impact Simulation (Slippage) for buying
    if (stock.availableQuantity && qty > stock.availableQuantity * 0.10) {
      const slippagePercent = 1 + (Math.random() * 0.01 + 0.01); // 1-2% increase
      transactionPrice *= slippagePercent;
      log(`SLIPPAGE: High volume purchase increased ${stockName} price for this transaction.`, 'maintenance');
    }

    const cost = qty * transactionPrice;
    const fee = cost * 0.022;
    const totalCost = cost + fee;

    if (state.cash < totalCost) {
      setModal({ type: 'message', data: "Insufficient funds." });
      return;
    }

    const newStocks = [...state.stocks];
    const updatedStock = { ...newStocks[stockIndex] };

    const currentTotalValue = (updatedStock.averageCost || 0) * updatedStock.quantity;
    const newTotalValue = currentTotalValue + (qty * transactionPrice);
    const newTotalQuantity = updatedStock.quantity + qty;
    updatedStock.averageCost = newTotalValue / newTotalQuantity;
    updatedStock.quantity = newTotalQuantity;

    // A. Decrement available quantity from the global state.
    updatedStock.availableQuantity = (updatedStock.availableQuantity ?? 0) - qty;

    // Dropped Today's Purchase Limit in v10.4.4

    newStocks[stockIndex] = updatedStock;

    setState(prev => prev ? ({
      ...prev,
      cash: prev.cash - totalCost,
      stocks: newStocks,
      jackpot: (prev.jackpot || 0) + fee,
      hasTradedStocksToday: true,
    }) : null);

    log(`STOCKS: Bought ${qty} shares of ${stockName}.`, 'buy');
    setStockBuyQuantities(prev => ({ ...prev, [stockName]: '' }));
    SFX.play('coin');
  };

  /**
   * Handles the selling of stocks, including liquidity and slippage effects.
   * Calls log and SFX.play.
   * @param stockName The name of the stock to sell.
   */
  const handleSellStock = (stockName: string) => {
    if (!state || !state.stocks) return;
    const qty = parseInt(stockSellQuantities[stockName] || '0');
    if (qty <= 0) return;

    const stockIndex = state.stocks.findIndex(s => s.name === stockName);
    if (stockIndex === -1) return;

    const stock = state.stocks[stockIndex];

    if (stock.quantity < qty) {
      setModal({ type: 'message', data: "Insufficient shares." });
      return;
    }

    let transactionPrice = stock.price;
    // C. Market Impact Simulation (Slippage) for selling
    if (stock.availableQuantity && qty > stock.availableQuantity * 0.10) {
      const slippagePercent = 1 - (Math.random() * 0.01 + 0.01); // 1-2% decrease
      transactionPrice *= slippagePercent;
      log(`SLIPPAGE: High volume sale decreased ${stockName} price for this transaction.`, 'maintenance');
    }

    const revenue = qty * transactionPrice;
    const fee = revenue * 0.022;
    const totalRevenue = revenue - fee;

    const newStocks = [...state.stocks];
    const updatedStock = { ...newStocks[stockIndex] };

    updatedStock.quantity -= qty;
    // A. Increment available quantity (add back to the market pool).
    updatedStock.availableQuantity = (updatedStock.availableQuantity ?? 0) + qty;

    newStocks[stockIndex] = updatedStock;

    setState(prev => prev ? ({
      ...prev,
      cash: prev.cash + totalRevenue,
      stocks: newStocks,
      jackpot: (prev.jackpot || 0) + fee,
      hasTradedStocksToday: true,
    }) : null);

    log(`STOCKS: Sold ${qty} shares of ${stockName}.`, 'sell');
    setStockSellQuantities(prev => ({ ...prev, [stockName]: '' }));
    SFX.play('coin');
  };

  /**
   * Triggers a random scenario roll for a Hostile Takeover on a firm (Enhancement 135).
   * Scenarios are weighted as follows:
   * - 40% Clean Absorption
   * - 30% Board Resistance
   * - 20% Executive Sabotage
   * - 10% Regulatory Antitrust Block
   */
  const handleHostileTakeover = (stockName: string) => {
    if (!state || !state.stocks) return;
    const stockIdx = state.stocks.findIndex(st => st.name === stockName);
    if (stockIdx === -1) return;
    const stock = state.stocks[stockIdx];

    const roll = Math.random();
    let outcomeType: 'success' | 'resistance' | 'sabotage' | 'regulatory' = 'success';
    if (roll < 0.40) {
      outcomeType = 'success';
    } else if (roll < 0.70) {
      outcomeType = 'resistance';
    } else if (roll < 0.90) {
      outcomeType = 'sabotage';
    } else {
      outcomeType = 'regulatory';
    }

    setModal({
      type: 'hostile_takeover_resolution',
      data: {
        stockName,
        outcomeType,
        sharesCount: stock.quantity,
        totalShares: stock.totalShares,
        stockPrice: stock.price,
        stockVal: stock.price * stock.quantity
      }
    });
  };

  /**
   * Advances the game to the next phase.
   * This function is called when the player reaches a net worth goal.
   * @param s The current game state.
   * @param nextPhase The next game phase.
   * @param report The daily report object.
   */
  const advancePhase = (s: GameState, nextPhase: 1|2|3|4, report: DailyReport) => {
    // Perform a deep copy of the game state to ensure React registers a fresh object reference
    const ns = JSON.parse(JSON.stringify(s)) as GameState;
    ns.gamePhase = nextPhase;

    if (nextPhase === 4 && ns.day < 20) {
      ns.reachedPhase4BeforeDay20 = true; // Track overachiever achievement (Enhancement 136)
    }

    // Initialize the stock market when the player reaches Phase 3.
    if (nextPhase === 3) {
      initializeStocks(ns);
    }

    const multiplier = nextPhase === 1 ? 1 : (nextPhase === 2 ? 5 : (nextPhase === 3 ? 10 : 20));
    const glutFactor = 2.0; 
    ns.markets = ns.markets.map(m => {
      const newM: Market = {};
      Object.entries(m).forEach(([k, v]) => {
          newM[k] = { 
              ...v, 
              quantity: Math.floor(v.quantity * multiplier * glutFactor), 
              standardQuantity: v.standardQuantity * multiplier 
          };
      });
      return newM;
    });
    setModal({ type: 'report', data: { events: [...report.events, `PHASE ${nextPhase} STARTED. Markets expanded. Stock Levels Multiplied by ${multiplier}x. Supply Glut detected!`], day: ns.day, tips: getMarketTips(ns) } });
    setState(ns);
  };

  /**
   * Generates market tips based on the current market data.
   * @param s The current game state.
   * @returns An array of market tip objects.
   */
  const getMarketTips = (s: GameState) => {
    if (!s || !s.markets) return [];
    const tips: any[] = [];
    const currentMarketLocal = s.markets[s.currentVenueIndex];
    if (!currentMarketLocal) return [];
    COMMODITIES.forEach(c => {
      const mItemLocal = currentMarketLocal[c.name];
      if (!mItemLocal) return;
      const cp = mItemLocal.price || 0;
      let minP = Infinity, maxP = 0, maxV = '';
      s.markets.forEach((m, i) => {
        const mItem = m?.[c.name];
        const p = mItem ? mItem.price : 0;
        if (p > 0) {
          if (p < minP) minP = p;
          if (p > maxP) { maxP = p; maxV = VENUES[i] || 'Unknown'; }
        }
      });
      if (minP !== Infinity && maxP > 0 && cp > 0) {
        if (cp <= minP * 1.1) tips.push({ type: 'buy', text: `BUY ${c.name}: Low (${formatCurrencyLog(cp)}). Sell at ${maxV} (~${formatCurrencyLog(maxP)}).`, score: maxP/cp });
        if (cp >= maxP * 0.9) tips.push({ type: 'sell', text: `SELL ${c.name}: High (${formatCurrencyLog(cp)}).`, score: cp });
      }
    });
    return tips.sort((a,b) => b.score - a.score).slice(0, 3);
  };

  /**
   * Adds a new entry to the game log.
   * @param msg The message to log.
   * @param type The type of the log entry (e.g., 'info', 'profit', 'danger').
   */
  const log = (msg: string, type: LogEntry['type']) => {
    setState(prev => {
        if (!prev) return null;
        const entry: LogEntry = { id: Date.now() + Math.random(), message: `[D${prev.day}] ${msg}`, type };
        const filtered = prev.messages.slice(-49);
        return { ...prev, messages: [...filtered, entry] };
    });
  };

  /**
   * Calculates the player's current net worth.
   * @param s The current game state.
   * @returns The player's net worth.
   */
  const getNetWorth = (s: GameState) => {
    const debt = s.activeLoans.reduce((a,b) => a + b.currentDebt, 0);
    const cargoVal = Object.entries(s.cargo).reduce((sum, [name, item]) => sum + (item.quantity * (s.markets[s.currentVenueIndex][name]?.price || 0)), 0);
    const invVal = s.investments.reduce((a,b) => a + b.amount, 0);
    return s.cash + cargoVal + invVal - debt;
  };

  /**
   * Saves a new high score.
   * Calls loadHighScores.
   * @param name The player's name.
   * @param score The player's score.
   * @param days The number of days survived.
   * @returns The updated list of high scores.
   */
  const saveHighScore = async (name: string, score: number, days: number, achievements?: string[]) => {
    const newScore = { name, score, days, date: new Date().toLocaleDateString(), achievements: achievements || [] };
    const currentScores = await loadHighScores();
    const updated = [...currentScores, newScore].sort((a,b) => b.score - a.score).slice(0, 100);
    localStorage.setItem('sbe_highscores', JSON.stringify(updated));
    const isFirebaseConfigured = import.meta.env.VITE_FIREBASE_PROJECT_ID && import.meta.env.VITE_FIREBASE_PROJECT_ID !== "PROJECT_ID";
    if (db && isFirebaseConfigured) {
        try {
            await addDoc(collection(db, "highscores"), newScore);
        } catch(e) {}
    }
    return updated;
  };

  /**
   * Gets the maximum cargo capacity for the current game phase.
   * @param phase The current game phase.
   * @returns The maximum cargo capacity.
   */
  const getMaxCargo = (phase: number) => {
    if (phase === 1) return BASE_MAX_CARGO_CAPACITY; 
    if (phase === 2) return BASE_MAX_CARGO_CAPACITY * 10; 
    if (phase === 3) return 250000; 
    return 500000; 
  };
  
  /**
   * Allows the player to voluntarily end the game.
   * Calls getNetWorth.
   */
  const attemptVoluntaryRestart = async () => {
      if (!state) return;
      const currentNetWorth = getNetWorth(state);
      const scores = state.highScores;
      const threshold = scores.length < 100 ? 0 : scores[scores.length-1].score;
      const isHighScore = currentNetWorth > threshold;
      if (isHighScore) {
          setModal({ type: 'endgame', data: { reason: "Legendary Status Achieved (Voluntary Retirement)", netWorth: currentNetWorth, stats: state.stats, isHighScore: true, days: state.day } });
      } else {
          setModal({ type: 'endgame', data: { reason: "Retirement", netWorth: currentNetWorth, stats: state.stats, isHighScore: false, days: state.day } });
      }
  };

  /**
   * Toggles the game's sound on and off.
   * Calls SFX.toggleMute.
   */
  const toggleSound = () => {
      const muted = SFX.toggleMute();
      setIsMuted(muted);
  };

  /**
   * Compiles interesting real-time live game status information into a single
   * continuous retro LED ticker feed (Enhancement 135).
   * Features actual live prices of stocks, commodities, hull levels, liquidity, and active liabilities,
   * interspersed with "WOULD YOU LIKE TO KNOW MORE?" headlines.
   */
  const getTickerText = () => {
    if (!state) return "";
    const parts: string[] = [];

    parts.push(`SYSTEM TELEMETRY: CYCLE DAY ${state.day} OF DEBT LICENSE DECREE`);
    parts.push(`HULL STABILITY: ${Math.round(state.shipHealth)}%`);
    parts.push(`NET WORTH VALUE: $B ${getNetWorth(state).toLocaleString()}`);
    parts.push(`LIQUID ASSETS: $B ${Math.round(state.cash).toLocaleString()}`);
    parts.push(`WOULD YOU LIKE TO KNOW MORE?`);

    if (state.stocks && state.stocks.length > 0) {
      const stockFeed = state.stocks.map(st => `${st.name}: $B ${Math.round(st.price).toLocaleString()}`).join(" • ");
      parts.push(`GALACTIC SECURITIES BOARD: ${stockFeed}`);
    }

    const currentMarket = state.markets[state.currentVenueIndex];
    if (currentMarket) {
      const commFeed = COMMODITIES.slice(0, 5).map(c => {
        const item = currentMarket[c.name];
        return `${c.name}: $B ${item ? item.price : "N/A"}`;
      }).join(" • ");
      parts.push(`LOCAL MARKET EXCHANGE (${VENUES[state.currentVenueIndex].toUpperCase()}): ${commFeed}`);
      parts.push(`WOULD YOU LIKE TO KNOW MORE?`);
    }

    if (state.dailyDividends && state.dailyDividends > 0) {
      parts.push(`TAKEOVER INCOME DIVIDEND FEED: +$B ${state.dailyDividends.toLocaleString()} DAILY CREDIT`);
    }

    if (state.activeLoans && state.activeLoans.length > 0) {
      const activeDebts = state.activeLoans.map(l => l.firmName.toUpperCase()).join(", ");
      parts.push(`ACTIVE LIABILITIES WITH: ${activeDebts}`);
    } else {
      parts.push(`CAPITAL STANDING: AAA PRIME`);
    }
    parts.push(`WOULD YOU LIKE TO KNOW MORE?`);

    return parts.join("   ||   ");
  };

  // M. HELPER FUNCTIONS & SHORTCUTS
  // A series of small helper functions for quick checks.

  const hasLaser = (s: GameState) => s.equipment['laser_mk1'] || s.equipment['laser_mk2'] || s.equipment['laser_mk3'];
  const hasScanner = (s: GameState) => s.equipment['scanner'];
  const hasScanner2 = (s: GameState) => s.equipment['scanner_mk2'];
  const hasScanner3 = (s: GameState) => s.equipment['scanner_mk3'];
  const isContractCovered = (s: GameState, c: Contract) => {
      const wh = s.warehouse[c.destinationIndex];
      if (wh && wh[c.commodity] && wh[c.commodity].quantity >= c.quantity) return true;
      return false;
  };

  /**
   * Directly and immediately fulfills an active contract from the player's cargo.
   * Awards the contract reward immediately, removes cargo, updates weight, and marks contract completed.
   * This implements the direct fulfillment system, avoiding any express shipping costs/delays.
   * @param c The contract to fulfill.
   */
  const directFulfillContract = (c: Contract) => {
    if (!state) return;

    const nameVal = c.commodity;
    const qtyInt = c.quantity;
    const itemOwned = state.cargo[nameVal];

    if (!itemOwned || itemOwned.quantity < qtyInt) {
        SFX.play('error');
        setModal({type:'message', data: `Insufficient ${nameVal} to fulfill contract.`});
        return;
    }

    const cData = COMMODITIES.find(x => x.name === nameVal)!;
    const totalWeightVal = qtyInt * cData.unitWeight;

    // Build the new cargo dictionary by deducting the required goods
    const newCargoDict = { ...state.cargo };
    newCargoDict[nameVal].quantity -= qtyInt;
    if (newCargoDict[nameVal].quantity <= 0) delete newCargoDict[nameVal];

    // Mark contract as completed in activeContracts immediately
    const newActive = state.activeContracts.map(ac => {
        if (ac.id === c.id) return { ...ac, status: 'completed' as const, dayCompleted: state.day };
        return ac;
    });

    if (stagedContract && stagedContract.id === c.id) {
        setStagedContract(null);
        setHighlightShippingItem(null);
    }

    setState(prev => prev ? ({
        ...prev,
        cash: prev.cash + c.reward,
        cargo: newCargoDict,
        cargoWeight: Math.max(0, prev.cargoWeight - totalWeightVal),
        activeContracts: newActive,
        stats: { ...prev.stats, largestSingleWin: Math.max(prev.stats.largestSingleWin, c.reward) }
    }) : null);

    SFX.play('kaching');
    setTimeout(() => SFX.play('kaching'), 150);
    const fulfillmentMsg = `CONTRACT: Direct fulfillment of ${c.firm} contract. Reward: ${formatCurrencyLog(c.reward)}`;
    log(fulfillmentMsg, 'profit');
    speakRetro(`The contract for ${c.firm} consignment of ${c.commodity} has been completed and fully fulfilled directly. Capital reward received.`);
  };

  /**
   * Accepts a new contract.
   * If stock is on hand, immediately completes the contract and awards rewards on the spot.
   * Otherwise, stages the contract and sets up the shipping parameters.
   * Calls log and SFX.play.
   * @param c The contract to accept.
   */
  const acceptContract = (c: Contract) => {
    if (!state) return;
    const activeOnly = state.activeContracts.filter(ac => ac.status === 'active');
    const limitAmt = state.gamePhase === 1 ? CONTRACT_LIMIT_P1 : (state.gamePhase === 2 ? CONTRACT_LIMIT_P2 : CONTRACT_LIMIT_P3);
    if (activeOnly.length >= limitAmt) { SFX.play('error'); return setModal({type:'message', data: `Contract limit reached (${limitAmt}).`}); }
    
    const newAvail = state.availableContracts.filter(con => con.id !== c.id);
    const acceptedContract = { ...c, status: 'active' as const };
    
    // Check if player has the stock on hand to auto-fulfill immediately!
    const itemOwned = state.cargo[c.commodity];
    if (itemOwned && itemOwned.quantity >= c.quantity) {
        const qtyInt = c.quantity;
        const cData = COMMODITIES.find(x => x.name === c.commodity)!;
        const totalWeightVal = qtyInt * cData.unitWeight;

        const newCargoDict = { ...state.cargo };
        newCargoDict[c.commodity].quantity -= qtyInt;
        if (newCargoDict[c.commodity].quantity <= 0) delete newCargoDict[c.commodity];

        const completedContract = { ...acceptedContract, status: 'completed' as const, dayCompleted: state.day };
        const newActive = [...state.activeContracts, completedContract];

        setState(prev => prev ? ({
            ...prev,
            availableContracts: newAvail,
            activeContracts: newActive,
            cash: prev.cash + c.reward,
            cargo: newCargoDict,
            cargoWeight: Math.max(0, prev.cargoWeight - totalWeightVal),
            stats: { ...prev.stats, largestSingleWin: Math.max(prev.stats.largestSingleWin, c.reward) }
        }) : null);

        SFX.play('kaching');
        setTimeout(() => SFX.play('kaching'), 150);
        const fulfillmentMsg = `CONTRACT: Accepted & Auto-fulfilled ${c.firm} contract immediately. Reward: ${formatCurrencyLog(c.reward)}`;
        log(fulfillmentMsg, 'profit');
        speakRetro(`The contract for ${c.firm} has been accepted and auto-fulfilled immediately with stock on hand. Capital reward received.`);
        return; // Avoid redirecting to shipping!
    }

    const newActive = [...state.activeContracts, acceptedContract];
    setState(prev => prev ? ({ ...prev, availableContracts: newAvail, activeContracts: newActive }) : null);
    log(`CONTRACT: Accepted ${c.firm} contract.`, 'contract');
    SFX.play('click');

    setStagedContract(acceptedContract);
    setLogisticsTab('shipping');
    setHighlightShippingItem(c.commodity);
    setShippingQuantities(prev => ({ ...prev, [c.commodity]: c.quantity.toString() }));
    setShippingDestinations(prev => ({ ...prev, [c.commodity]: c.destinationIndex.toString() }));
  };

  /**
   * Handles the fulfillment of a contract from the player's cargo.
   * Directly completes the contract without any intermediate shipping steps.
   * Calls directFulfillContract and SFX.play.
   * @param c The contract to fulfill.
   */
  const handleFulfill = (c: Contract) => {
    if (!state) return;
    const itemOwned = state.cargo[c.commodity];
    if (!itemOwned || itemOwned.quantity < c.quantity) {
        SFX.play('error');
        setModal({ type: 'message', data: `Insufficient ${c.commodity} to fulfill contract.` });
        return;
    }
    setPulsingContractId(c.id);
    directFulfillContract(c);
    setTimeout(() => {
        setPulsingContractId(null);
        // Do not close or change open modals (e.g. shipping / logistics screens) when auto-completing!
        setModal(prev => prev.type === 'shipping' ? prev : { type: 'none', data: null });
    }, 2000);
  };

  /**
   * Automatically fulfills a contract by shipping the required goods.
   * Calls log and SFX.play.
   * @param c The contract to fulfill.
   */
  const autoFulfillContract = (c: Contract) => {
    if (!state) return;

    const nameVal = c.commodity;
    const qtyInt = c.quantity;
    const destInt = c.destinationIndex;
    const itemOwned = state.cargo[nameVal];

    if (!itemOwned || itemOwned.quantity < qtyInt) {
        SFX.play('error');
        setModal({type:'message', data: `Insufficient ${nameVal} to fulfill contract.`});
        return;
    }

    const cData = COMMODITIES.find(x => x.name === nameVal)!;
    const totalWeightVal = qtyInt * cData.unitWeight;
    const costVal = Math.ceil(totalWeightVal * 100); // Express shipping cost

    if (state.cash < costVal) {
        SFX.play('error');
        setModal({type:'message', data: `Insufficient funds for express shipping: ${formatCurrencyLog(costVal)}`});
        return;
    }

    const newCargoDict = { ...state.cargo };
    newCargoDict[nameVal].quantity -= qtyInt;
    if (newCargoDict[nameVal].quantity <= 0) delete newCargoDict[nameVal];

    const newWarehouseDict: Warehouse = { ...state.warehouse };
    if (!newWarehouseDict[destInt]) newWarehouseDict[destInt] = {};
    const existingWare = newWarehouseDict[destInt][nameVal];

    let newArrivalDay = state.day + 1; // 1-day express shipping
    let newAvgCostVal = itemOwned.averageCost;
    let newQtyVal = qtyInt;

    if (existingWare) {
        newArrivalDay = Math.max(existingWare.arrivalDay, newArrivalDay);
        newAvgCostVal = ((existingWare.quantity * existingWare.originalAvgCost) + (qtyInt * itemOwned.averageCost)) / (existingWare.quantity + qtyInt);
        newQtyVal += existingWare.quantity;
    }

    newWarehouseDict[destInt][nameVal] = {
        quantity: newQtyVal,
        originalAvgCost: newAvgCostVal,
        arrivalDay: newArrivalDay,
        isContractReserved: true
    };

    setState(prev => prev ? ({
        ...prev,
        cash: prev.cash - costVal,
        cargo: newCargoDict,
        cargoWeight: prev.cargoWeight - totalWeightVal,
        warehouse: newWarehouseDict
    }) : null);

    SFX.play('warp');
    log(`LOGISTICS: Express shipment for ${c.firm} contract sent to ${VENUES[destInt]}.`, 'contract');
  };

  /**
   * Settles a contract that has been fulfilled.
   * Calls log and speakRetro.
   * @param c The contract to settle.
   */

  /**
   * Automates shipping the full warehouse storage amount of a commodity from a source
   * venue to a destination venue with 1-day express shipping (100 credits/T).
   * If there is an active contract at the destination, it is set to contract-reserved.
   * It handles all checks and balances, followed by returning to the console screen.
   * @param commodityName Name of the commodity to ship.
   * @param sourceIndex The source warehouse venue index.
   * @param destinationIndex The destination venue index.
   */
  const automateStorageShipment = (commodityName: string, sourceIndex: number, destinationIndex: number) => {
    if (!state) return;
    const commodity = COMMODITIES.find(c => c.name === commodityName);
    if (!commodity) return;

    const whItem = state.warehouse[sourceIndex]?.[commodityName];
    if (!whItem || whItem.quantity <= 0) {
      SFX.play('error');
      setModal({ type: 'message', data: `No ${commodityName} in storage at ${VENUES[sourceIndex]} to ship.` });
      return;
    }

    const qtyOwned = whItem.quantity;
    const avgCost = whItem.originalAvgCost;
    const totalWeight = qtyOwned * commodity.unitWeight;
    const shippingFee = Math.ceil(totalWeight * 100); // 1-day express shipping is 100 per T

    if (state.cash < shippingFee) {
      SFX.play('error');
      setModal({ type: 'message', data: `Insufficient funds. Express shipping fee is ${formatCurrencyLog(shippingFee)}.` });
      return;
    }

    const newWarehouseDict: Warehouse = JSON.parse(JSON.stringify(state.warehouse));
    // Remove from source warehouse
    delete newWarehouseDict[sourceIndex][commodityName];
    if (Object.keys(newWarehouseDict[sourceIndex]).length === 0) {
      delete newWarehouseDict[sourceIndex];
    }

    // Check if there is an active contract for this commodity at the destination index
    const hasActiveContract = state.activeContracts.some(
      ac => ac.commodity === commodityName && ac.destinationIndex === destinationIndex && ac.status === 'active'
    );

    // Add to destination warehouse
    if (!newWarehouseDict[destinationIndex]) newWarehouseDict[destinationIndex] = {};
    const existingWare = newWarehouseDict[destinationIndex][commodityName];

    let newArrivalDay = state.day + 1; // 1-day shipping
    let newAvgCostVal = avgCost;
    let newQtyVal = qtyOwned;

    if (existingWare) {
      newArrivalDay = Math.max(existingWare.arrivalDay, newArrivalDay);
      newAvgCostVal = ((existingWare.quantity * existingWare.originalAvgCost) + (qtyOwned * avgCost)) / (existingWare.quantity + qtyOwned);
      newQtyVal += existingWare.quantity;
    }

    newWarehouseDict[destinationIndex][commodityName] = {
      quantity: newQtyVal,
      originalAvgCost: newAvgCostVal,
      arrivalDay: newArrivalDay,
      isContractReserved: hasActiveContract || existingWare?.isContractReserved || false
    };

    setState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        cash: prev.cash - shippingFee,
        warehouse: newWarehouseDict
      };
    });

    SFX.play('warp');
    log(`LOGISTICS: Automated express 1-day shipment of stored ${qtyOwned} ${commodityName} from ${VENUES[sourceIndex]} to ${VENUES[destinationIndex]}. Fee: ${formatCurrencyLog(shippingFee)} paid.`, 'buy');

    // Return to the console screen
    setModal({ type: 'none', data: null });
  };

  /**
   * Automates shipping the full cargo amount of a commodity to a specific destination
   * venue with 1-day express shipping (100 credits/T).
   * It handles all checks and balances, followed by returning to the console screen.
   * @param commodityName Name of the commodity to ship.
   * @param destinationIndex The destination venue index.
   */
  const automateCargoShipment = (commodityName: string, destinationIndex: number) => {
    if (!state) return;
    const commodity = COMMODITIES.find(c => c.name === commodityName);
    if (!commodity) return;

    // Strict separation check: Only ship owned stock from the current venue's cargo hold.
    // Explicitly exclude any stored or warehouse stock of said item from other venues.
    const qtyOwned = state.cargo[commodityName]?.quantity || 0;
    if (qtyOwned <= 0) {
      SFX.play('error');
      setModal({ type: 'message', data: `No ${commodityName} in cargo to ship.` });
      return;
    }

    const totalWeight = qtyOwned * commodity.unitWeight;
    const shippingFee = Math.ceil(totalWeight * 100); // 1-day express shipping is 100 per T

    if (state.cash < shippingFee) {
      SFX.play('error');
      setModal({ type: 'message', data: `Insufficient funds. Express shipping fee is ${formatCurrencyLog(shippingFee)}.` });
      return;
    }

    const newCargoDict = { ...state.cargo };
    const avgCost = newCargoDict[commodityName].averageCost;
    delete newCargoDict[commodityName];

    const newWarehouseDict: Warehouse = JSON.parse(JSON.stringify(state.warehouse));
    if (!newWarehouseDict[destinationIndex]) newWarehouseDict[destinationIndex] = {};
    const existingWare = newWarehouseDict[destinationIndex][commodityName];

    let newArrivalDay = state.day + 1; // 1-day shipping
    let newAvgCostVal = avgCost;
    let newQtyVal = qtyOwned;

    if (existingWare) {
      newArrivalDay = Math.max(existingWare.arrivalDay, newArrivalDay);
      newAvgCostVal = ((existingWare.quantity * existingWare.originalAvgCost) + (qtyOwned * avgCost)) / (existingWare.quantity + qtyOwned);
      newQtyVal += existingWare.quantity;
    }

    newWarehouseDict[destinationIndex][commodityName] = {
      quantity: newQtyVal,
      originalAvgCost: newAvgCostVal,
      arrivalDay: newArrivalDay
    };

    setState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        cash: prev.cash - shippingFee,
        cargo: newCargoDict,
        cargoWeight: Math.max(0, prev.cargoWeight - totalWeight),
        warehouse: newWarehouseDict
      };
    });

    SFX.play('warp');
    log(`LOGISTICS: Automated express 1-day shipment of ${qtyOwned} ${commodityName} to ${VENUES[destinationIndex]}. Fee: ${formatCurrencyLog(shippingFee)} paid.`, 'buy');

    // Return to the console screen
    setModal({ type: 'none', data: null });
  };

  const omniShip = (commodityName: string, destinationIndex: number) => {
    if (!state) return;
    const commodity = COMMODITIES.find(c => c.name === commodityName);
    if (!commodity) return;

    // Strict separation check: Only ship owned stock from the current venue's cargo hold.
    // Explicitly exclude any stored or warehouse stock of said item from other venues.
    const cargoQty = state.cargo[commodityName]?.quantity || 0;
    const totalSectorStock = cargoQty;
    const unitWeight = commodity.unitWeight;
    const totalWeight = totalSectorStock * unitWeight;
    const logisticsFee = Math.ceil(totalWeight * 100);

    if (state.cash < logisticsFee) {
        SFX.play('error');
        setModal({ type: 'message', data: `Insufficient funds. Omni-Ship fee is ${formatCurrencyLog(logisticsFee)}.` });
        return;
    }

    setState(prev => {
      if (!prev) return null;
      const prevCargoQty = prev.cargo[commodityName]?.quantity || 0;
      const prevCargoAvgCost = prev.cargo[commodityName]?.averageCost || 0;

      const totalSectorStock = prevCargoQty;
      const unitWeight = commodity.unitWeight;
      const totalWeight = totalSectorStock * unitWeight;
      const logisticsFee = Math.ceil(totalWeight * 100);

      const newState = { ...prev };
      newState.cash -= logisticsFee;

      const newWarehouse: Warehouse = JSON.parse(JSON.stringify(newState.warehouse));

      // Add to destination warehouse
      if (!newWarehouse[destinationIndex]) newWarehouse[destinationIndex] = {};
      const existingWare = newWarehouse[destinationIndex][commodityName];
      let newArrivalDay = prev.day + 1; // 1-day shipping
      let newAvgCostVal = prevCargoAvgCost;
      let newQtyVal = totalSectorStock;

      if (existingWare) {
          newArrivalDay = Math.max(existingWare.arrivalDay, newArrivalDay);
          newAvgCostVal = ((existingWare.quantity * existingWare.originalAvgCost) + (totalSectorStock * prevCargoAvgCost)) / (existingWare.quantity + totalSectorStock);
          newQtyVal += existingWare.quantity;
      }

      newWarehouse[destinationIndex][commodityName] = {
        quantity: newQtyVal,
        originalAvgCost: newAvgCostVal,
        arrivalDay: newArrivalDay
      };

      const newCargo = { ...newState.cargo };
      delete newCargo[commodityName];

      const weightLost = prevCargoQty * unitWeight;
      newState.cargoWeight = Math.max(0, newState.cargoWeight - weightLost);

      return { ...newState, cargo: newCargo, warehouse: newWarehouse };
    });

    SFX.play('warp');
    log(`OMNI-SHIP: Moving ${totalSectorStock} ${commodityName} to ${VENUES[destinationIndex]}. Fee: ${formatCurrencyLog(logisticsFee)}`, 'buy');
    setModal({ type: 'none', data: null });
  };

  const instantSell = (commodityName: string, venueIndex: number) => {
    if(!state) return;
    const marketPrice = state.markets[venueIndex][commodityName]?.price || 0;
    let totalToSell = 0;

    const newCargo = { ...state.cargo };
    let cargoQuantitySold = 0;
    if (venueIndex === state.currentVenueIndex && newCargo[commodityName]) {
        cargoQuantitySold = newCargo[commodityName].quantity;
        totalToSell += cargoQuantitySold;
        delete newCargo[commodityName];
    }

    const newWarehouse = JSON.parse(JSON.stringify(state.warehouse));
    const whItem = newWarehouse[venueIndex]?.[commodityName];
    let warehouseQuantitySold = 0;
    if (whItem) {
        // Safe check: Only allow selling unreserved warehouse stock to protect contract commitments
        if (!whItem.isContractReserved) {
            warehouseQuantitySold = whItem.quantity;
            totalToSell += warehouseQuantitySold;
            delete newWarehouse[venueIndex][commodityName];
        }
    }

    if (totalToSell > 0) {
        const revenue = totalToSell * marketPrice;
        const unitWeight = COMMODITIES.find(c => c.name === commodityName)!.unitWeight;
        const weightLost = cargoQuantitySold * unitWeight;

        setState(prev => prev ? ({
            ...prev,
            cash: prev.cash + revenue,
            cargo: newCargo,
            warehouse: newWarehouse,
            cargoWeight: Math.max(0, prev.cargoWeight - weightLost)
        }) : null);
        SFX.play('coin');
        log(`SOLD: ${totalToSell} ${commodityName} at ${VENUES[venueIndex]} for ${formatCurrencyLog(revenue)}.`, 'sell');
    }
  };

  const settleContract = (c: Contract) => {
      if (!state) return;
      const wh = state.warehouse[c.destinationIndex];
      if (wh && wh[c.commodity] && wh[c.commodity].quantity >= c.quantity && wh[c.commodity].arrivalDay <= state.day) {
          const newW = { ...state.warehouse };
          newW[c.destinationIndex][c.commodity].quantity -= c.quantity;
          if (newW[c.destinationIndex][c.commodity].quantity <= 0) delete newW[c.destinationIndex][c.commodity];
          if (Object.keys(newW[c.destinationIndex]).length === 0) delete newW[c.destinationIndex];
          
          const newActive = state.activeContracts.map(ac => {
              if (ac.id === c.id) return { ...ac, status: 'completed' as const, dayCompleted: state.day };
              return ac;
          });

          setState(prev => prev ? ({
              ...prev,
              cash: prev.cash + c.reward,
              warehouse: newW,
              activeContracts: newActive,
              stats: { ...prev.stats, largestSingleWin: Math.max(prev.stats.largestSingleWin, c.reward) }
          }) : null);
          const fulfillmentMsg = `CONTRACT: Manual fulfillment of ${c.firm} contract. Reward: ${formatCurrencyLog(c.reward)}`;
          log(fulfillmentMsg, 'profit');
          speakRetro(`The contract for ${c.firm} consignment of ${c.commodity} has been shipped to ${VENUES[c.destinationIndex]} for fulfilment, expect to be paid any day now.`);
      }
  };

  /**
   * Shows the commodity intelligence modal.
   * Calls SFX.play.
   * @param name The name of the commodity.
   * @param source The source of the request ('market' or 'storage').
   * @param venueIndex The index of the venue if the source is 'storage'.
   */
  const showCommodityIntel = (name: string, source: 'market' | 'storage' = 'market', venueIndex?: number) => {
      if (!state) return;
      setModal({ type: 'commodity_intel', data: { name, source, venueIndex } });
      SFX.play('click');
  };

  /**
   * Fabricates Z@onflex Weave Mesh.
   * Calls SFX.play.
   * @param q The quantity to fabricate.
   */
  const fabricateItem = (q: number) => {
    if (!state) return;
    const meshCost = 2000;
    const totalCost = q * meshCost;
    const h2oNeeded = q;
    const oreNeeded = q;
    const clothNeeded = q;
    const h2o = state.cargo[H2O_NAME]?.quantity || 0;
    const ore = state.cargo['Allthemantium Ore']?.quantity || 0;
    const cloth = state.cargo['Synthetic Cloth']?.quantity || 0;

    if (state.cash < totalCost) return setModal({type:'message', data: "Insufficient funds."});
    if (h2o < h2oNeeded || ore < oreNeeded || cloth < clothNeeded) return setModal({type:'message', data: "Insufficient resources."});

    const newCargo = { ...state.cargo };
    newCargo[H2O_NAME].quantity -= h2oNeeded;
    if (newCargo[H2O_NAME].quantity <= 0) delete newCargo[H2O_NAME];
    newCargo['Allthemantium Ore'].quantity -= oreNeeded;
    if (newCargo['Allthemantium Ore'].quantity <= 0) delete newCargo['Allthemantium Ore'];
    newCargo['Synthetic Cloth'].quantity -= clothNeeded;
    if (newCargo['Synthetic Cloth'].quantity <= 0) delete newCargo['Synthetic Cloth'];

    const cData = COMMODITIES.find(c => c.name === MESH_NAME)!;
    const cur = newCargo[MESH_NAME] || { quantity: 0, averageCost: 0 };
    const newTotal = cur.quantity + q;
    const newAvg = ((cur.quantity * cur.averageCost) + (q * 0)) / newTotal;
    newCargo[MESH_NAME] = { quantity: newTotal, averageCost: newAvg };

    const weightDelta = (q * cData.unitWeight) - (h2oNeeded * 1.0) - (oreNeeded * 5.0) - (clothNeeded * 0.25);

    const prevUnrest = state.mutantUnrest || 10;
    const unrestIncrease = 5 + (state.gamePhase * 4) + Math.min(10, Math.floor(q * 0.1));
    const nextUnrest = Math.min(100, prevUnrest + unrestIncrease);
    const mutinyTriggered = nextUnrest >= 100 && !state.isMutinyActive;

    setState(prev => {
      if (!prev) return null;
      let pcChipsReq = prev.mutinyPcChipsRequirement;
      if (mutinyTriggered) {
          const pcChipsQuantity = prev.markets[prev.currentVenueIndex]?.["PC Chips"]?.quantity || 0;
          pcChipsReq = Math.floor((pcChipsQuantity * 0.22) / 5) * 5;
      }
      return {
        ...prev,
        cash: prev.cash - totalCost,
        cargo: newCargo,
        cargoWeight: prev.cargoWeight + weightDelta,
        fomoDailyUse: { ...prev.fomoDailyUse, mesh: true },
        fabricationCount: (prev.fabricationCount || 0) + 1,
        mutantUnrest: nextUnrest,
        isMutinyActive: mutinyTriggered ? true : prev.isMutinyActive,
        mutinyPcChipsRequirement: pcChipsReq
      };
    });

    log(`FABRICATION: Used ${h2oNeeded} ${H2O_NAME}, ${oreNeeded} Allthemantium Ore, and ${clothNeeded} Synthetic Cloth to produce ${q} units of ${MESH_NAME}. (Crew Unrest: ${nextUnrest}%)`, 'mining');
    setFomoQty('');
    SFX.play('success');

    if (mutinyTriggered) {
      log(`MUTINY: Mutant crew has revolted! F.O.M.O. and Upgrades decks are locked.`, 'critical');
      setModal({
        type: 'message',
        data: `ON STRIKE: Mutant crew unrest reached 100% due to fabrication strain! The crew has mutinied and locked the F.O.M.O. and Upgrades decks. You must pay their ransom at an I.B.A.N.K. Hub to pacify them.`,
        color: 'text-red-500'
      });
      SFX.play('alarm');
      return;
    }

    const stimsAvailable = !state.fomoDailyUse.stims;
    if (stimsAvailable) {
      setModal({
        type: 'fabrication_prompt',
        data: {
          name: MESH_NAME,
          quantity: q,
          remainingName: 'Stim-Packs'
        }
      });
    } else {
      setModal({ type: 'fabrication_success', data: { quantity: q, name: MESH_NAME } });
    }
  };

  /**
   * Fabricates Stim-Packs.
   * Calls SFX.play.
   * @param q The quantity to fabricate.
   */
  const fabricateStimPacks = (q: number) => {
    if (!state) return;
    const processFee = 200;
    const totalCost = q * processFee;
    const h2oNeeded = q;
    const pasteNeeded = q * 2;
    const medKitsNeeded = q;
    
    const h2o = state.cargo[H2O_NAME]?.quantity || 0;
    const paste = state.cargo[NUTRI_PASTE_NAME]?.quantity || 0;
    const medKits = state.cargo['Medical Kits']?.quantity || 0;

    if (state.cash < totalCost) return setModal({type:'message', data: "Insufficient funds."});
    if (h2o < h2oNeeded || paste < pasteNeeded || medKits < medKitsNeeded) return setModal({type:'message', data: "Insufficient resources."});

    const newCargo = { ...state.cargo };
    newCargo[H2O_NAME].quantity -= h2oNeeded;
    if (newCargo[H2O_NAME].quantity <= 0) delete newCargo[H2O_NAME];
    newCargo[NUTRI_PASTE_NAME].quantity -= pasteNeeded;
    if (newCargo[NUTRI_PASTE_NAME].quantity <= 0) delete newCargo[NUTRI_PASTE_NAME];
    newCargo['Medical Kits'].quantity -= medKitsNeeded;
    if (newCargo['Medical Kits'].quantity <= 0) delete newCargo['Medical Kits'];

    const cData = COMMODITIES.find(c => c.name === 'Stim-Packs')!;
    const cur = newCargo['Stim-Packs'] || { quantity: 0, averageCost: 0 };
    const newTotal = cur.quantity + q;
    const newAvg = ((cur.quantity * cur.averageCost) + (q * 0)) / newTotal;
    newCargo['Stim-Packs'] = { quantity: newTotal, averageCost: newAvg };

    const weightDelta = (q * cData.unitWeight) - (h2oNeeded * 1.0) - (pasteNeeded * 0.5) - (medKitsNeeded * 0.01);

    const prevUnrest = state.mutantUnrest || 10;
    const unrestIncrease = 5 + (state.gamePhase * 4) + Math.min(10, Math.floor(q * 0.1));
    const nextUnrest = Math.min(100, prevUnrest + unrestIncrease);
    const mutinyTriggered = nextUnrest >= 100 && !state.isMutinyActive;

    setState(prev => {
      if (!prev) return null;
      let pcChipsReq = prev.mutinyPcChipsRequirement;
      if (mutinyTriggered) {
          const pcChipsQuantity = prev.markets[prev.currentVenueIndex]?.["PC Chips"]?.quantity || 0;
          pcChipsReq = Math.floor((pcChipsQuantity * 0.22) / 5) * 5;
      }
      return {
        ...prev,
        cash: prev.cash - totalCost,
        cargo: newCargo,
        cargoWeight: prev.cargoWeight + weightDelta,
        fomoDailyUse: { ...prev.fomoDailyUse, stims: true },
        fabricationCount: (prev.fabricationCount || 0) + 1,
        mutantUnrest: nextUnrest,
        isMutinyActive: mutinyTriggered ? true : prev.isMutinyActive,
        mutinyPcChipsRequirement: pcChipsReq
      };
    });

    log(`FABRICATION: Used ${h2oNeeded} ${H2O_NAME}, ${pasteNeeded} ${NUTRI_PASTE_NAME}, and ${medKitsNeeded} Medical Kits to produce ${q} Stim-Packs. (Crew Unrest: ${nextUnrest}%)`, 'mining');
    setFomoStimQty('');
    SFX.play('success');

    if (mutinyTriggered) {
      log(`MUTINY: Mutant crew has revolted! F.O.M.O. and Upgrades decks are locked.`, 'critical');
      setModal({
        type: 'message',
        data: `ON STRIKE: Mutant crew unrest reached 100% due to synthesis strain! The crew has mutinied and locked the F.O.M.O. and Upgrades decks. You must pay their ransom at an I.B.A.N.K. Hub to pacify them.`,
        color: 'text-red-500'
      });
      SFX.play('alarm');
      return;
    }

    const meshAvailable = !state.fomoDailyUse.mesh;
    if (meshAvailable) {
      setModal({
        type: 'fabrication_prompt',
        data: {
          name: 'Stim-Packs',
          quantity: q,
          remainingName: MESH_NAME
        }
      });
    } else {
      setModal({ type: 'fabrication_success', data: { quantity: q, name: 'Stim-Packs' } });
    }
  };

  /**
   * Sells an item directly from a remote warehouse.
   * Calls log and SFX.play.
   * @param vIdx The index of the venue where the item is stored.
   * @param name The name of the item to sell.
   * @param q The quantity to sell.
   */
  const sellWarehouseItem = (vIdx: number, name: string, q: number) => {
    if (!state) return;
    const whItem = state.warehouse[vIdx]?.[name];
    if (!whItem || whItem.quantity < q) return;

    const price = state.markets[vIdx][name].price;
    const revenue = q * price;
    const profit = revenue - (q * whItem.originalAvgCost);

    const newW = { ...state.warehouse };
    newW[vIdx][name].quantity -= q;
    if (newW[vIdx][name].quantity <= 0) delete newW[vIdx][name];
    if (Object.keys(newW[vIdx]).length === 0) delete newW[vIdx];

    setState(prev => prev ? ({
        ...prev,
        cash: prev.cash + revenue,
        warehouse: newW,
        stats: { ...prev.stats, largestSingleWin: Math.max(prev.stats.largestSingleWin, revenue) }
    }) : null);

    log(`REMOTE SELL: Sold ${q} ${name} at ${VENUES[vIdx]} for ${formatCurrencyLog(revenue)}.`, profit > 0 ? 'profit' : 'danger');
    SFX.play('coin');
    // Bypassed swapping to G.I.G.O. comms modal for remote warehouse sales to ensure smoother game flow.
  };

  /**
   * Claims an item from a local warehouse and moves it to the ship's cargo.
   * Calls log and SFX.play.
   * @param vIdx The index of the venue.
   * @param name The name of the item.
   * @param q The quantity to claim.
   */
  const claimWarehouseItem = (vIdx: number, name: string, q: number) => {
      if (!state) return;
      const whItem = state.warehouse[vIdx]?.[name];
      if (!whItem || whItem.quantity < q) return;

      const c = COMMODITIES.find(x => x.name === name)!;
      const weight = q * c.unitWeight;

      if (state.cargoWeight + weight > state.cargoCapacity) {
          SFX.play('error');
          return setModal({type:'message', data: "Insufficient cargo capacity to claim items."});
      }

      const newW = { ...state.warehouse };
      newW[vIdx][name].quantity -= q;
      if (newW[vIdx][name].quantity <= 0) delete newW[vIdx][name];
      if (Object.keys(newW[vIdx]).length === 0) delete newW[vIdx];

      const newCargo = { ...state.cargo };
      const cur = newCargo[name] || { quantity: 0, averageCost: 0 };
      const newTotal = cur.quantity + q;
      const newAvg = ((cur.quantity * cur.averageCost) + (q * whItem.originalAvgCost)) / newTotal;
      newCargo[name] = { quantity: newTotal, averageCost: newAvg };

      setState(prev => prev ? ({
          ...prev,
          cargo: newCargo,
          warehouse: newW,
          cargoWeight: prev.cargoWeight + weight
      }) : null);

      log(`LOGISTICS: Claimed ${q} ${name} from ${VENUES[vIdx]} storage.`, 'buy');
      setClaimQuantities(prev => ({...prev, [name]: ''}));
      SFX.play('success');
  };

  /**
   * Forwards a warehouse item to the commodity intel screen.
   * Calls showCommodityIntel.
   * @param vIdx The index of the venue.
   * @param name The name of the item.
   */
  const forwardWarehouseItem = (vIdx: number, name: string) => {
      if (!state) return;
      showCommodityIntel(name, 'storage', vIdx);
  };

  /**
   * Sets the buy quantity for a commodity to the maximum affordable amount.
   * Calls SFX.play.
   * @param c The commodity.
   * @param mItem The market data for the commodity.
   */
  const setMaxBuy = (c: Commodity, mItem: any) => {
    SFX.play('click');
    if (!state) return;
    const cashMax = Math.floor(state.cash / mItem.price);
    const val = Math.max(0, Math.min(cashMax, mItem.quantity));
    setBuyQuantities(prev => ({...prev, [c.name]: val.toString()}));
  };

  /**
   * Buys the PC Chips required to secure an end to the strike.
   * Performs full transaction checks for market quantity, cash, and tax.
   */
  const handleBuyStrikeChips = () => {
    SFX.play('click');
    if (!state) return;

    // 1. Calculate PC Chips required and owned
    const pcChipsRequirement = state.mutinyPcChipsRequirement !== undefined ? state.mutinyPcChipsRequirement : (() => {
        const pcChipsQuantity = state.markets[state.currentVenueIndex]?.["PC Chips"]?.quantity || 0;
        return Math.floor((pcChipsQuantity * 0.22) / 5) * 5;
    })();
    const playerOwnedChips = state.cargo["PC Chips"]?.quantity || 0;
    const qtyToBuy = pcChipsRequirement - playerOwnedChips;

    // If they already have enough PC Chips, notify them
    if (qtyToBuy <= 0) {
      SFX.play('error');
      return setModal({
        type: 'message',
        data: `You already have enough PC Chips (${playerOwnedChips} units) in your cargo to meet the demands (${pcChipsRequirement} required). Make payment at I.B.A.N.K.`
      });
    }

    // 2. Validate market item and availability
    const mItem = state.markets[state.currentVenueIndex]?.["PC Chips"];
    if (!mItem) {
      SFX.play('error');
      return setModal({ type: 'message', data: "PC Chips market data not found." });
    }

    if (mItem.quantity < qtyToBuy) {
      SFX.play('error');
      return setModal({
        type: 'message',
        data: `The market only has ${mItem.quantity} PC Chips, but you need to buy ${qtyToBuy} to end the strike. Try traveling to another system first.`
      });
    }

    // 3. Calculate price and tax (frequent trading)
    const price = mItem.price;
    const cost = qtyToBuy * price;
    const txKey = `${state.currentVenueIndex}_PC Chips`;
    const txCount = state.dailyTransactions[txKey] || 0;
    let tax = 0;
    if (txCount > 0) {
      tax = Math.floor(cost * 0.05);
    }
    const totalCost = cost + tax;

    // 4. Overdraft check
    if (state.cash < totalCost && (state.cash - totalCost < -10000)) {
      SFX.play('error');
      return setModal({
        type: 'message',
        data: `Overdraft limit exceeded. Cannot buy ${qtyToBuy} PC Chips. Total cost: ${formatCurrencyLog(totalCost)} (including any frequent trading taxes).`
      });
    }

    // 5. Update state (cash, cargo, market quantity, transactions log)
    const newM = [...state.markets];
    newM[state.currentVenueIndex]["PC Chips"].quantity = Math.max(0, newM[state.currentVenueIndex]["PC Chips"].quantity - qtyToBuy);

    const cur = state.cargo["PC Chips"] || { quantity: 0, averageCost: 0 };
    const newTotal = cur.quantity + qtyToBuy;
    const newAvg = ((cur.quantity * cur.averageCost) + (qtyToBuy * price)) / newTotal;

    const weightDelta = qtyToBuy * 0.01; // Each PC Chip weighs 0.01 T

    setState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        cash: prev.cash - totalCost,
        cargoWeight: prev.cargoWeight + weightDelta,
        markets: newM,
        cargo: {
          ...prev.cargo,
          "PC Chips": { quantity: newTotal, averageCost: newAvg }
        },
        dailyTransactions: {
          ...prev.dailyTransactions,
          [txKey]: txCount + 1
        }
      };
    });

    // Clean up buyQuantities input box for PC Chips
    setBuyQuantities(prev => ({ ...prev, "PC Chips": '' }));

    SFX.play('swipe');
    log(`MUTINY: Bought ${qtyToBuy} PC Chips for ${formatCurrencyLog(totalCost)} to secure an end to the strike.`, 'buy');
    setModal({
      type: 'message',
      data: `Successfully purchased ${qtyToBuy} PC Chips for ${formatCurrencyLog(totalCost)}. Go to the I.B.A.N.K. Hub to pay off the strike!`
    });
  };

  /**
   * Donates PC Chips to mutants to subdue their unrest.
   * Each PC Chip reduces unrest by 2%. If unrest falls below 100%, mutiny is pacified.
   */
  const handleDonateChips = (qty: number) => {
    SFX.play('click');
    if (!state) return;

    const ownedChips = state.cargo["PC Chips"]?.quantity || 0;
    if (qty <= 0) return;
    if (ownedChips < qty) {
      SFX.play('error');
      setModal({ type: 'message', data: `Insufficient PC Chips in cargo hold to donate (Have ${ownedChips}, need ${qty}).` });
      return;
    }

    const currentUnrest = state.mutantUnrest || 0;
    const reduction = qty * 2; // 2% per chip
    const nextUnrest = Math.max(0, currentUnrest - reduction);
    const resolvedMutiny = nextUnrest < 100 && state.isMutinyActive;

    const newCargo = { ...state.cargo };
    newCargo["PC Chips"].quantity -= qty;
    const weightLost = qty * 0.01;
    if (newCargo["PC Chips"].quantity <= 0) {
      delete newCargo["PC Chips"];
    }

    setState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        cargo: newCargo,
        cargoWeight: Math.max(0, prev.cargoWeight - weightLost),
        mutantUnrest: nextUnrest,
        isMutinyActive: nextUnrest >= 100 ? prev.isMutinyActive : false,
        survivedMutiny: resolvedMutiny ? true : prev.survivedMutiny,
        mutinyPcChipsRequirement: nextUnrest >= 100 ? prev.mutinyPcChipsRequirement : undefined
      };
    });

    setDonateChipsQty('');
    SFX.play('success');
    log(`MUTINY: Donated ${qty} PC Chips to subdue mutant crew unrest. Unrest reduced by ${reduction}% to ${nextUnrest}%.`, 'buy');
    if (resolvedMutiny) {
      log(`MUTINY PACIFIED: Mutant crew unrest dropped below 100%. Decks unlocked. Returning to Console.`, 'profit');
      setModal({
        type: 'message',
        data: `MUTINY PACIFIED: Your generous donation of ${qty} PC Chips has pacified the crew! Unrest reduced to ${nextUnrest}%. Returning to Console.`
      });
    }
  };

  /**
   * Calculates the cost to fully repair the ship's hull.
   * @returns The total repair cost.
   */
  const calculateFullRepairCost = () => {
    if (!state) return 0;
    if (state.shipHealth >= MAX_REPAIR_HEALTH) return 0;
    const needed = Math.ceil((MAX_REPAIR_HEALTH - state.shipHealth) / REPAIR_INCREMENT);
    const baseCost = needed * REPAIR_COST;
    if (hasCorporateSynergy(state, 'weyland')) {
        return Math.round(baseCost * 0.85);
    }
    return baseCost;
  };

  /**
   * Calculates the cost to fully repair the mining laser.
   * @returns The total repair cost.
   */
  const calculateFullLaserRepairCost = () => {
    if (!state) return 0;
    if (state.laserHealth >= 100) return 0;
    const needed = Math.ceil((100 - state.laserHealth) / REPAIR_INCREMENT);
    return needed * LASER_REPAIR_COST;
  };

  // --- BLOCK 5: UI RENDER ----------------------------------------------------
  // This block contains the main JSX for rendering the game's UI.

  // Display a loading message if the game state has not yet been initialized.
  if (!state) return <div className="text-center text-white p-10 font-scifi">Loading <span className="bg-yellow-400 text-black px-1">v.13.0.3</span>...</div>;

  // Pre-calculate some values for easier access in the JSX.
  const currentMarketLocal = state.markets[state.currentVenueIndex];
  const phaseMultiplier = 1 + ((state.gamePhase - 1) * 0.25);
  const netWorth = getNetWorth(state);
  const goalAmt = state.gamePhase===1 ? GOAL_PHASE_1_AMOUNT : (state.gamePhase===2 ? GOAL_PHASE_2_AMOUNT : (state.gamePhase === 3 ? GOAL_PHASE_3_AMOUNT : 0)); 
  const deadlineLimit = state.gamePhase===1 ? GOAL_PHASE_1_DAYS : (state.gamePhase === 2 ? GOAL_PHASE_2_DAYS : (state.gamePhase === 3 ? GOAL_PHASE_3_DAYS : GOAL_OVERTIME_DAYS));
  const totalDebt = state.activeLoans.reduce((a,b)=>a+b.currentDebt,0);
  const totalInv = state.investments.reduce((a,b)=>a+b.amount,0);
  const isOverfilled = state.cargoWeight > state.cargoCapacity;

  /**
   * Renders the tabbed, reworked, and highly interactive Sector Codex (Wiki).
   * Contains Lore, Trading Venues, Commodities, Banks & Stocks, Neural Intercepts, and Acronym Directory.
   */
  const renderSectorCodex = () => {
    if (!state) return null;

    const currentTab = wikiTab === 'General' ? 'lore' : wikiTab;

    const codexTabs = [
      { id: 'lore', label: "Lore & History", icon: BookOpen },
      { id: 'venues', label: "Trading Venues", icon: Building2 },
      { id: 'commodities', label: "Commodities Guide", icon: Box },
      { id: 'banks', label: "Banks & Stocks", icon: BarChart3 },
      { id: 'achievements', label: "Achievements & Awards", icon: Trophy },
      { id: 'frontpanels', label: "Console Guide", icon: Info },
      { id: 'broadcasts', label: "Neural Intercepts", icon: Radio },
      { id: 'acronyms', label: "Acronym Directory", icon: HelpCircle },
      { id: 'credits', label: "Credits", icon: Heart }
    ];

    const sections = [
      { title: "The Rusty Redeemer", icon: Anchor, content: "The RR Firefox 22 'RustyRedeemer' is a decommissioned cargo frigate of the 60/40 class. It consists of 60% oxidation and 40% hope. Originally designed for short-range hauling, its isotope hummers have been modified to handle the stress of phase-shifting market dynamics." },
      { title: "The Starbucks Conglomerate", icon: Building2, content: "Underneath the glossy emerald corporate facade lies the ultimate hyper-capitalist machine. Operating under S.H.A.N.E. guidelines, the Conglomerate turns entire solar systems into drive-thru retail outlets. Their main mission is clear: absolute dominance of the space lanes, converting every planetary body into a standardized franchise." },
      { title: "The Spice Bandits", icon: Skull, content: "The Spice Bandits A rogue gang of Spice-dependent outlaws who terrorize the trade lanes. Led by the notorious 'Double-Sniffer' Barnaby B Barabas, they target cargo vessels carrying high-value commodities which they sell to buy Spice fuel. Installing sturdy kinetic cannons and defensive shields is the only proven method to deter their relentless boarding manoeuvres." },
      { title: "The Great Tea Wars", icon: Swords, content: "A devastating sector-wide conflict that lasted over 44 D.A.Y.S. and N.I.G.H.T.S. Fought between the elite Tea Cartels and the synthetic Tea Alliance over the rights to fertile agricultural belts on Nexus Prime. The war concluded with the historic 'I.N.D.I.A.N. Accord,' establishing the current trade of Spacetime Tea is strictly forbidden in all Star Systems. This is a reminder never to be found trading in Spacetime Tea." },
      { title: "S.H.A.N.E. Protocols", icon: Shield, content: "Sector Health, Allocation, & Network Enforcement (S.H.A.N.E.) governs all trade lanes. They enforce the Galactic Overlord Decree (G.O.D.), which dictates that any trader failing to meet net-worth thresholds within specific time cycles will have their license revoked and their vessel reclaimed by the state." },
      { title: "D.A.Y. (Depreciating Astrological Yardstick)", icon: Hourglass, content: "The D.A.Y. system is a key tracking framework mandated by the Galactic Overlord Department (G.O.D.). By mapping orbital star alignments against the physical degradation of your ship, the G.O.D. enforces a relentless, depreciating tracking scale. It treats your very existence as a steadily shrinking corporate asset, creating an ominous countdown that squeeze-charges your trade license duration." },
      { title: "Extraction Logic", icon: Zap, content: "Mining lasers (Upgrades Deck) allow for the harvesting of resources from asteroid belts during transit. Higher-tier lasers and 'Overload' toggles increase yield but drastically spike the risk of structural realignment failures or laser burnout. Yield is directly proportional to laser focal integrity." },
      { title: "F.O.M.O. Engineering", icon: Factory, content: "Fabricate Output Management Operations allows captains to synthesize raw materials into high-value commodities. Z@onflex Weave Mesh is critical for cargo bay expansions, while Stim-Packs are in high demand by biological colonies throughout the sector. Don't miss out on using it each D.A.Y." },
      { title: "Void-Ex Logistics", icon: Truck, content: "Shipping goods across the void via Private or Corporate contracts is the most reliable way to secure multi-million credit payouts. Beware of auto-seizure policies: goods left in third-party warehouses for more than 3 cycles are sold to defray storage costs." },
      { title: "Void-Sickness", icon: Info, content: "Hauling massive cargo loads across unmapped dark systems often induces Void-Sickness. Affected crew members report hearing the faint, chilling voices of ancient marketing executives whispering long-forgotten quarterly sales targets in their minds. It is recommended to administer high-potency Stim-Packs to any crew showing signs of auditory advertising hallucinations." },
      { title: "Temporal Phase Shifts", icon: Rocket, content: "Advancing through Phase 1, Phase 2, and Phase 3 is not just a commercial progression—it is a literal spatial-temporal shift. The S.H.A.N.E. network employs quantum algorithms that rewrite the physics of trade: spiking fuel costs, increasing pirate encounter frequencies, and creating highly volatile stock market dynamics." },
      { title: "Crew Mutiny & Unrest", icon: Skull, content: "Mutant crew members working on the F.O.M.O. Engineering Deck are prone to severe unrest under intensive fabrication shifts. Their mutiny status increases with every fabrication done by the team and rises as temporal phases advance. If unrest reaches 100%, they will initiate a hostile mutiny, locking control of the F.O.M.O. and Upgrades decks! Resolving a mutiny event with an appeasing payment decreases their unrest, while paying their ransom at an I.B.A.N.K. Hub fully pacifies them." },
      {
        title: "PC Chip Donations & Mutant Diet",
        icon: HelpCircle,
        content: `While humans and standard humanoids view PC Chips as crucial semiconductor boards for navigation and digital trading, the mutant crew members working in the hot, radioactive depths of the F.O.M.O. deck consider them a gourmet delicacy.

Highly crunchy, with a delightful electric metallic tang, these chips are valued by mutants far more than organic food—as they are, in their own words, "Better than Peanuts!"

Providing PC Chips directly to the mutants via the F.O.M.O. interface immediately quells their psychological and biological unrest, reducing the mutant unrest meter and preventing costly mutinies and strikes without needing complex banking ransom settlements.`
      },
      { title: "Spacetime Folding Anomalies", icon: Rocket, content: "Folding 4D spacetime during travel is a highly volatile process. If one of the universe's dimensional corners fails to fold correctly, a fold alignment failure occurs, diverting the ship to a completely random venue. While any pre-shipped cargo continues on its logistics vector to its original planned destination, onboard items not shipped remain in the ship cargo and safely arrive with you at the random coordinate anomaly." },
      {
        title: "PRODUCT SPECIFICATION: \"HOT ISOTOPE HUMMERS\"",
        icon: Zap,
        content: `Colloquially known as "Hummers" across the trade sectors due to the persistent, warm, low-frequency radioactive vibration they emit when slotted into a system drive.

Official G.O.D. Designation: H.O.U.R.S.

Full System Acronym: Hazardous Overcharged Utility Reactor Shunts

COMMERCIAL WARRANTY & MERCHANDISING SLOGAN
"Guaranteed to power your devices for at least a few H.O.U.R.S. Or your money back (not really)."

OPERATIONAL HAZARD ADVISORY
Vessel Integrity Risk: Slotting an active Hummer into your cargo bay will bypass standard power regulators, but the intense thermal output accelerates hull oxidation.

Illicit Applications: Do not attempt to use the thermal output of a Hummer to boil water for illegal Spacetime Tea. Doing so violates the I.N.D.I.A.N. Accord and will result in localized atomic dispersion.

Disposal Protocol: Depleted H.O.U.R.S. units must not be jettisoned into planetary atmospheres. Please return them to a G.U.I.L.D. reclamation dock for standard bureaucratic recycling.`
      }
    ];

    const venueDetails = [
      { name: "Deep Space 9 1/2", desc: "Deep Space 9 1/2 A cozy waystation on the edge of civilized space. Halfway to everywhere, but mostly serves mediocre synthetic Spacetime tea." },
      { name: "Trantor Promenade", desc: "The sprawling economic heart of the core worlds. High density, fast-paced trading, and aggressive tax collectors." },
      { name: "Serenity Valley", desc: "A quiet, rust-belt agricultural colony. Great prices on H2O and Nutri-Paste, but local outlaws frequently target high-value cargo." },
      { name: "Corellia Shipyards", desc: "The ultimate industrial hub of the sector. Heavily guarded by planetary defense forces, specializing in heavy metal refinement." },
      { name: "High Charity", desc: "A massive, levitating space cathedral. Home to spiritual relic traders and highly volatile crystal speculations." },
      { name: "Giedi Plaza", desc: "A dark, smog-choked corporate syndicate. High risk, high reward, with zero oversight on high-volume mining transactions." },
      { name: "New Babylon", desc: "A luxurious botanical garden station. Frequently hosts diplomatic summits, leading to extreme fluctuations in luxury goods." },
      { name: "Acheron LV-426", desc: "A dangerous, wind-swept mining outpost on a hostile world. High risk of natural disasters and pirate ambushes, but rich in Dark Matter." },
      { name: "Cantina Mos Eisley", desc: "A wretched hive of scum and villainy. Perfect for off-the-books transactions, illegal stim smuggling, and high-interest Hutt loans." },
      { name: "Centauri Prime", desc: "An ancient, aristocratic cultural capital. High demand for luxury Spacetime Teas and advanced PC electronics." }
    ];

    const acronymsList = [
      { term: "S.H.A.N.E.", exp: "Sector Health, Allocation, & Network Enforcement", desc: "The primary automated diagnostic and compliance matrix onboard the Redeemer. It monitors ship health, handles emergency overrides, and reports net worth directly to the sector government. (Named in honor of S.H.A.N.E., the Captain)." },
      { term: "D.A.Y.", exp: "Depreciating Astrological Yardstick", desc: "A mandatory celestial progress tracker implemented by G.O.D. It measures physical ship degradation against local solar rotations to construct a steadily shrinking operational deadline for your trade license." },
      { term: "G.O.D.", exp: "Galactic Overlord Department / Galactic Overlord Decree", desc: "The supreme judicial and regulatory agency of the trade sector. They dictate phase guidelines, enforce net-worth requirements, and impose trade bans on non-compliant traders." },
      { term: "C.A.T.", exp: "Customs, Audits, & Tariffs", desc: "The law enforcement branch responsible for scanning cargo holds, imposing transaction taxes on frequent trading, auditing corporate records, and tracking high-risk cargo across warp lanes." },
      { term: "F.O.M.O.", exp: "Fabricate Output Management Operations", desc: "The ship's automated crafting unit. Utilizing atomic restructuring, it synthesizes advanced components such as expansion mesh or biological stimulants from basic inventory resources." },
      { term: "G.I.G.O.", exp: "Garbage In, Garbage Out", desc: "The ship's main real-time communication antenna and system logging device. It captures live market volatility reports, event feed summaries, and wacky neural network broadcasts." },
      { term: "T.O.N.S.", exp: "Tactical Orbital Navigation & Storage", desc: "The standard metric unit (T) of mass used to measure cargo weight capacity and shipping logistics limits across all interstellar freighters." },
      { term: "I.B.A.N.K.", exp: "Interstellar Banking, Assets, & Net-worth Keepers", desc: "The centralized financial server that manages micro-loans, secure investment lockups, and real-time high-score Sync Registries." },
      { term: "E.L.O.N.", exp: "Executive Lord of Orbital Networks", desc: "A legendary executive title awarded only to the absolute richest tycoon who successfully secures a hostile takeover of every single public corporation in the known galaxy." },
      { term: "N.I.G.H.T.S.", exp: "Nebulous Injunction against Galactic Herbal Time Smuggling", desc: "Signed at the end of the 44 D.A.Y.s and N.I.G.H.T.S. war, this treaty is considered a \"nebulous\" injunction because of the massive legal loopholes. While it technically made trading Spacetime Tea completely illegal, it secretly allowed high-ranking G.O.D. executives to keep private cellars of the vintage leaves to extend their own lifespans." },
      { term: "I.N.D.I.A.N.", exp: "Interstellar Neutralization Decree on Intransigent Agrarian Networks", desc: "Both the elite Tea Cartels and the synthetic Tea Alliance as stubborn, rogue \"Intransigent Agrarian Networks.\" G.O.D. didn't just stop the war; he forcefully neutralized the entire infrastructure to make sure nobody could farm temporal leaves again." },
      { term: "H.O.U.R.S.", exp: "Hazardous Overcharged Utility Reactor Shunts", desc: "Colloquially known as \"Hummers\" across the trade sectors due to the persistent, warm, low-frequency radioactive vibration they emit when slotted into a system drive." }
    ];

    const broadcastTypes = Object.keys(QUIRKY_MESSAGES_DB) as Array<keyof typeof QUIRKY_MESSAGES_DB>;

    return (
      <div className="flex flex-col h-full bg-transparent p-4 md:p-6 animate-in fade-in duration-300">
        {/* Codex Header */}
        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <BookOpen className="text-orange-500 animate-pulse" size={28} />
            <div>
              <h2 className="text-2xl font-scifi text-orange-400 uppercase tracking-widest leading-none">Sector Codex</h2>
              <span className="text-[10px] text-gray-500 font-mono tracking-wider">v.13.0.3 // S.H.A.N.E. DIRECTIVE ACTIVE</span>
            </div>
          </div>
          <button onClick={() => setModal({ type: 'none', data: null })} className="text-red-500 hover:text-red-400 hover:scale-110 transition-all font-bold">
            <XCircle size={28} />
          </button>
        </div>

        {/* Tab Selection Row */}
        <div className="flex flex-wrap gap-2 mb-6 shrink-0 bg-black/40 p-2 rounded-xl border border-gray-800">
          {codexTabs.map(tab => {
            const TabIcon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setWikiTab(tab.id); SFX.play('click'); }}
                className={`px-3 py-1.5 rounded-lg border font-scifi text-[10px] md:text-xs transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-orange-950/70 border-orange-500/80 text-orange-400 shadow-[0_0_8px_rgba(234,88,12,0.3)]'
                    : 'bg-transparent border-transparent text-gray-400 hover:border-gray-800 hover:text-gray-200'
                }`}
              >
                <TabIcon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Box */}
        <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 min-h-0">
          {currentTab === 'lore' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sections.map((sec, i) => {
                const SecIcon = sec.icon;
                return (
                  <div key={i} className="bg-black/35 p-5 rounded-2xl border border-gray-800/80 hover:border-orange-500/20 transition-all">
                    <div className="flex items-center gap-3 mb-3 border-b border-gray-900 pb-2">
                      <div className="p-2 bg-orange-900/10 rounded-lg text-orange-400"><SecIcon size={18}/></div>
                      <h3 className="text-md font-black text-white uppercase tracking-wider">{sec.title}</h3>
                    </div>
                    <p className="text-gray-400 font-mono text-xs leading-relaxed">{sec.content}</p>
                  </div>
                );
              })}
            </div>
          )}

          {currentTab === 'venues' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {venueDetails.map((v, i) => {
                const isCurrent = state.currentVenueIndex === i;
                return (
                  <div key={i} className={`p-5 rounded-2xl border transition-all flex gap-4 ${
                    isCurrent
                      ? 'bg-emerald-950/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                      : 'bg-black/35 border-gray-800/80 hover:border-cyan-500/10'
                  }`}>
                    {/* Small image clip */}
                    <div
                      onClick={() => {
                          SFX.play('click');
                          setModal({ type: 'view_venue_codex', data: i });
                      }}
                      className="w-20 h-20 shrink-0 overflow-hidden rounded-xl border border-gray-700/50 cursor-pointer hover:border-orange-500 hover:scale-105 active:scale-95 transition-all shadow-md bg-black/40"
                      title="Click to view full-screen venue"
                    >
                      <img
                          src={VENUE_IMAGES[v.name]}
                          alt={v.name}
                          className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Venue Details */}
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start mb-2 border-b border-gray-900 pb-1.5">
                        <h3 className="text-md font-bold text-white uppercase tracking-wide flex items-center gap-2">
                          {v.name}
                        </h3>
                        {isCurrent && <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-widest animate-pulse">SHIP HERE</span>}
                      </div>
                      <p className="text-gray-400 text-xs font-mono leading-relaxed">{v.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {currentTab === 'commodities' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {COMMODITIES.map((c, i) => {
                return (
                  <div key={i} className="bg-black/35 p-5 rounded-2xl border border-gray-800/80 flex gap-4 hover:border-orange-500/10 transition-all">
                    <div className="text-4xl p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-center shrink-0 w-16 h-16">
                      {c.icon === 'metal-lump' ? '🌑' : c.icon}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-baseline border-b border-gray-900 pb-1 mb-1">
                        <h4 className="text-sm font-black text-white uppercase tracking-wider truncate">{c.name}</h4>
                        <span className="text-[9px] text-orange-400 font-mono font-bold uppercase bg-orange-400/10 px-1 border border-orange-500/10">Rarity: {Math.round(c.rarity * 100)}%</span>
                      </div>
                      {(() => {
                          const phaseMultiplierVal = 1 + ((state.gamePhase - 1) * 0.25);
                          const isH2OOrPaste = c.name === H2O_NAME || c.name === NUTRI_PASTE_NAME;
                          const h2oPasteMinMult = Math.pow(1.05, state.day);
                          const h2oPasteMaxMult = Math.pow(1.10, state.day);

                          let displayMin = state.commodityPriceOverrides?.[c.name]?.min !== undefined
                              ? Math.round(state.commodityPriceOverrides[c.name].min)
                              : Math.round(isH2OOrPaste ? c.minPrice * h2oPasteMinMult : c.minPrice * phaseMultiplierVal);

                          let displayMax = state.commodityPriceOverrides?.[c.name]?.max !== undefined
                              ? Math.round(state.commodityPriceOverrides[c.name].max)
                              : Math.round(isH2OOrPaste ? c.maxPrice * h2oPasteMaxMult : c.maxPrice * phaseMultiplierVal);

                          const hasOverride = state.commodityPriceOverrides?.[c.name] !== undefined;

                          return (
                            <div className="grid grid-cols-2 gap-x-4 text-[10px] font-mono text-gray-500 mb-2">
                              <div>Weight: <span className="text-gray-300 font-bold">{c.unitWeight}T</span></div>
                              <div>
                                Range: <span className="text-yellow-500 font-bold">{displayMin}-{displayMax}$B</span>
                                {hasOverride && <span className="text-[8px] text-green-400 font-bold uppercase ml-1 shrink-0 animate-pulse bg-green-500/10 px-0.5 border border-green-500/10">EXPANDED</span>}
                              </div>
                            </div>
                          );
                      })()}
                      <p className="text-gray-400 text-xs font-mono leading-relaxed italic">"{c.description || 'No direct telemetry available.'}"</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {currentTab === 'banks' && (
            <div className="space-y-4">
              <div className="bg-black/35 p-6 rounded-2xl border border-gray-800/80">
                <h3 className="text-lg font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-2 border-b border-gray-900 pb-2">
                  <BarChart3 className="text-yellow-400" size={18} />
                  The I.B.A.N.K. Banking Network
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-400 font-mono leading-relaxed">
                  <div className="space-y-3">
                    <p className="font-bold text-white uppercase">1. Micro-Lending Regulations:</p>
                    <p>Secured from any of the five major lending syndicates (e.g. Starfleet, Weyland-Yutani, Hutt Cartel). Base interest rates vary dynamically from <span className="text-emerald-400 font-bold">1% to 10% daily</span>.</p>
                    <p>Debt must be paid back within <span className="text-yellow-500 font-bold">5 cycles</span>, or compound interest penalties will rapidly exhaust your liquid capital reserves.</p>
                  </div>
                  <div className="space-y-3">
                    <p className="font-bold text-white uppercase">2. Interest Lockup Deposits:</p>
                    <p>The network allows locking capital assets inside quantum trust accounts for <span className="text-white font-bold">1, 2, or 3 days</span>.</p>
                    <p>Upon maturity, guaranteed yields of <span className="text-emerald-400 font-bold">5%, 20%, or 50%</span> are added directly to ship credit accounts. Note: Capital deposits are strictly blocked while holding active micro-loans.</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/35 p-6 rounded-2xl border border-gray-800/80">
                <h3 className="text-lg font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-2 border-b border-gray-900 pb-2">
                  <LineChart className="text-cyan-400" size={18} />
                  Stock Market & Corporate Synergies (Phase 2+)
                </h3>
                <p className="text-xs text-gray-400 font-mono leading-relaxed mb-4">
                  The stock exchange allows Day-trading in shares of key galactic corporations. Dividends are computed and prices shift heavily during warp jumps.
                  Risk indices specify volatility bounds: Low Risk (highly stable), Medium Risk (moderate fluctuations), High Risk (extreme delta swings).
                </p>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-cyan-500/10 space-y-2 text-xs font-mono">
                  <p className="text-cyan-400 font-bold uppercase tracking-widest text-[10px] mb-2 border-b border-cyan-900 pb-1">CORPORATE SYNERGY PERKS (OWNERSHIP THRESHOLD: &gt;22% TOTAL SHARES)</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-slate-800 p-3 rounded-lg bg-black/30">
                      <p className="text-white font-bold mb-1 uppercase">Weyland Corp (Mining Synergy)</p>
                      <p className="text-gray-400 text-[10px]">Grants 15% discount on all Upgrades Deck prices and hull repair transactions.</p>
                    </div>
                    <div className="border border-slate-800 p-3 rounded-lg bg-black/30">
                      <p className="text-white font-bold mb-1 uppercase">Starfleet (Logistics Synergy)</p>
                      <p className="text-gray-400 text-[10px]">Bypasses local transaction tax entirely, saving 5% credit on repeated daily deals.</p>
                    </div>
                    <div className="border border-slate-800 p-3 rounded-lg bg-black/30">
                      <p className="text-white font-bold mb-1 uppercase">Hutt Cartel (Credit Synergy)</p>
                      <p className="text-gray-400 text-[10px]">Lowers base borrowing interest rates by 25% across all loan offers.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'broadcasts' && (
            <div className="space-y-4">
              <div className="bg-black/30 p-4 rounded-xl border border-gray-800 flex justify-between items-center text-xs font-mono">
                <span className="text-orange-400 uppercase font-bold flex items-center gap-1.5 animate-pulse">
                  <Radar size={14} className="animate-spin" /> Live Neural Telemetry intercept feed
                </span>
                <span className="text-gray-600 text-[10px] uppercase">G.I.G.O Antenna Array // Active</span>
              </div>
              <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                {broadcastTypes.map(category => {
                  const items = QUIRKY_MESSAGES_DB[category];
                  return (
                    <div key={category} className="bg-black/45 p-4 rounded-2xl border border-slate-800/80">
                      <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-2 border-b border-gray-900 pb-1">{category} Transmissions</h4>
                      <ul className="space-y-2 font-mono text-xs text-gray-400 leading-relaxed list-disc list-inside">
                        {items.map((msg, i) => (
                          <li key={i} className="hover:text-white transition-colors">
                            "{msg}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentTab === 'achievements' && (
            <div className="space-y-6">
              <div className="bg-black/35 p-6 rounded-2xl border border-gray-800/80">
                <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-gray-900 pb-2">
                  <Trophy className="text-yellow-400 animate-pulse" size={18} />
                  Achievements & Awards Registry
                </h3>
                <p className="text-xs text-gray-400 font-mono leading-relaxed mb-6">
                  Earn legendary honors across the space lanes by meeting unique gameplay conditions. Unlocked badges will be dynamically synchronized with your neural backup profile and visible on your Save and Load screens.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'elon', name: "E.L.O.N. Award", desc: "Executive Lord of Orbital Networks. Successfully initiate hostile takeovers for every single public stock in the Known Galaxy.", reward: "Eternal Prestige & Golden Shiny E Badge", icon: <span className="inline-flex items-center justify-center bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-slate-900 font-black rounded-full w-6 h-6 shadow-[0_0_10px_#f59e0b] border border-yellow-300">E</span> },
                    { id: 'mutant_survivor', name: "Mutant Crew Uprising Survivor", desc: "Successfully pacify, bribe, or pay off a rogue crew mutiny to regain control of your ship decks.", reward: "Moral boost & mutant skull badge", icon: "👾" },
                    { id: 'master_fabricator', name: "Master Fabricator", desc: "Fabricate 20 or more batches of items using the F.O.M.O. Engineering Deck.", reward: "Crafting mastery badge", icon: "🛠️" },
                    { id: 'corruption_master', name: "Corruption Master / Bribe Expert", desc: "Successfully bribe or pay off safety inspectors, customs checkpoints, and tax enforcers 5 or more times.", reward: "Waiver clearance badge", icon: "💼" },
                    { id: 'jetsetter', name: "and GOOD LUCK, MR. GORSKY", desc: "Successfully land on all 10 distinct venues in the Rusty Redeemer.", reward: "Good Luck, Mr. Gorsky badge", icon: <img src={gorskyIcon} className="w-12 h-12 object-contain rounded-full border border-yellow-500/30" alt="Gorsky" /> },
                    { id: 'traveller', name: "Traveller Award", desc: "Spend 25 or more cycles travelling to trade venues in the Known star systems.", reward: "Cosmic odometer badge", icon: "🚀" },
                    { id: 'hermit', name: "Hermit Award", desc: "Remain anchored at the exact same venue for 3 or more days using stay-in-place actions.", reward: "Planetary anchor badge", icon: "🏡" },
                    { id: 'overachiever', name: "Overachiever Award", desc: "Advance to the final trading phase (Phase 4) in record time, before D.A.Y. 20.", reward: "Chronos speedrunner badge", icon: "⚡" },
                    { id: 'steel_hull', name: "Steel Hull Survivor", desc: "Survive or travel through danger zones with hull integrity depleted to 10% or less.", reward: "Unyielding chassis badge", icon: "🛡️" },
                    { id: 'outlaw', name: "Sector Outlaw", desc: "Attract the attention of law enforcement by carrying an arrest warrant in your name.", reward: "Outlaw Badge of Infamy", icon: "🚨" },
                    { id: 'death', name: "Killed in Action / Deceased", desc: "Meet your tragic demise through structural failure or mutant worker uprising in the StarBucks Sector.", reward: "Tombstone Memorial in Sector", icon: "💀" }
                  ].map(ach => {
                    const isUnlocked = state.achievements?.includes(ach.id);
                    return (
                      <div key={ach.id} className={`p-4 rounded-xl border flex gap-3 items-start transition-all ${
                        isUnlocked
                          ? 'bg-yellow-950/20 border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.15)]'
                          : 'bg-black/35 border-gray-800/80 opacity-60 hover:opacity-85'
                      }`}>
                        <div className="text-3xl bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex items-center justify-center shrink-0 w-12 h-12">
                          {ach.icon}
                        </div>
                        <div className="min-w-0 flex-grow">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="text-sm font-black text-white uppercase tracking-wide truncate">{ach.name}</h4>
                            <span className={`text-[8px] font-bold uppercase font-mono px-1.5 py-0.5 rounded tracking-widest ${
                              isUnlocked ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse' : 'bg-gray-800 text-gray-500'
                            }`}>
                              {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs font-mono leading-relaxed mb-1">{ach.desc}</p>
                          <p className="text-[10px] text-gray-500 font-mono italic">Reward: {ach.reward}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {currentTab === 'frontpanels' && (
            <div className="space-y-6">
              <div className="bg-black/35 p-6 rounded-2xl border border-gray-800/80">
                <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-gray-900 pb-2">
                  <Info className="text-cyan-400" size={18} />
                  Main Terminal Console Guide
                </h3>
                <p className="text-xs text-gray-400 font-mono leading-relaxed mb-6">
                  Review and analyze complete structural logs and operational guidelines for each primary terminal deck. Click any deck guide below to preview its neural system description directly.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'shop', title: "Fixathing'u'ma Jig Deck (Upgrades)", desc: "Buy, install, and upgrade the Mining Laser. Repair your Ship Hull and Laser focal lenses. Acquire Shields, Cannons, and scanners. Expand cargo bay to maximum size using Z@onflex Weave Mesh (to be bought at the market) before expanding. (Pro tip: Cargo bay limits expand at each Phase threshold).", image: upgradesBg },
                    { id: 'banking', title: "I.B.A.N.K. Hub (Banking)", desc: "Manage your Starbucks Financial needs. Take out institution-specific loans (max 3 total, up to 1 per day). Invest idle capital in high-interest fixed-term deposits (1, 2, or 3 days) for guaranteed returns (only if debt-free!).", image: ibankBg },
                    { id: 'travel', title: "C.A.T. Station (Travel & Jump)", desc: "Chart flight paths and warp. Check lane Risk levels (High risk increases Crimson Fleet pirates and asteroid storm chances). Purchase warp transit cargo insurance. Place 95% of cash in safe 1-day CDs at 5% interest (debt-free only!).", image: catBg },
                    { id: 'shipping', title: "Void-Ex Logistics (Logistics & Contracts)", desc: "Access high-paying Corporate contracts and private logistics transfers. Corporate contracts require shipping exact commodity quantities to destination venues before the deadline. Failed contracts result in market trade bans and heavy liquidated damages fines. Private logistics allows 1-day express storage transfers to local warehouses. Warning: Unmoved warehouse stock is sold off after 3 cycles.", image: logisticBg },
                    { id: 'comms', title: "G.I.G.O. Panel (Communications)", desc: "Garbage In, Garbage Out. Access and monitor system logs, galactic volatility feeds, space-news flashcasts, and intercept signals.", image: gigoBg },
                    { id: 'fomo', title: "F.O.M.O. Engineering Deck (Fabrication)", desc: "Craft valuable Z@onflex Weave Mesh and high-potency Stim-Packs from basic mined raw materials and cargo stock. Fabrication is restricted to one batch run per item type per cycle. Maximize your batch sizes to optimize yield!", image: fomoBg },
                    { id: 'highscores', title: "Galactic Legends Registry (Universal Sync)", desc: "High-resolution registry of the top 100 interstellar tycoons. Syncs real-time net-worth indexes to the Universal I.B.A.N.K. Leaderboard." },
                    { id: 'wiki', title: "Sector Codex Explorer (Wiki Systems)", desc: "Your universal repository of galactic lore, corporate compliance regulations, acronym directories, and achievement records.", image: codexBg }
                  ].map(panel => {
                    return (
                      <div key={panel.id} className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between hover:border-cyan-500/20 transition-all">
                        <div className="flex gap-4 mb-4 items-start">
                          {panel.image && (
                            <div
                              onClick={() => {
                                  SFX.play('click');
                                  setModal({ type: 'view_guide_image', data: { title: panel.title, image: panel.image } });
                              }}
                              className="w-16 h-16 shrink-0 overflow-hidden rounded-xl border border-gray-700/50 cursor-pointer hover:border-orange-500 hover:scale-105 active:scale-95 transition-all shadow-md bg-black/40"
                              title="Click to view full-screen guide preview"
                            >
                              <img
                                  src={panel.image}
                                  alt={panel.title}
                                  className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-grow min-w-0">
                            <h4 className="text-sm font-black text-cyan-400 uppercase tracking-wide mb-2">{panel.title}</h4>
                            <p className="text-gray-300 font-mono text-xs leading-relaxed">{panel.desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            SFX.play('click');
                            handleFeatureClick(panel.id, () => {
                              if (panel.id === 'wiki') {
                                setWikiTab('lore');
                              } else if (panel.id === 'highscores') {
                                setModal({ type: 'highscores', data: null });
                              } else {
                                setModal({ type: panel.id, data: null });
                              }
                            });
                          }}
                          className="w-full text-center bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-800/40 font-scifi uppercase text-[10px] py-1.5 px-3 rounded-lg tracking-wider transition-colors"
                        >
                          🔗 Access Live Deck 🔗
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {currentTab === 'acronyms' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {acronymsList.map((acr, i) => {
                return (
                  <div key={i} className="bg-black/35 p-5 rounded-2xl border border-gray-800/80 hover:border-orange-500/15 transition-all">
                    <div className="flex justify-between items-baseline mb-2 border-b border-gray-900 pb-1">
                      <h3 className="text-lg font-black text-orange-400 font-scifi uppercase tracking-wider">{acr.term}</h3>
                      <span className="text-[10px] text-gray-500 uppercase font-mono font-bold">{acr.exp}</span>
                    </div>
                    <p className="text-gray-400 text-xs font-mono leading-relaxed">{acr.desc}</p>
                  </div>
                );
              })}
            </div>
          )}

          {currentTab === 'credits' && (
            <div className="flex-grow flex items-center justify-center relative overflow-hidden h-[50vh] bg-black border border-gray-800 rounded-2xl">
              <div className="credits-container">
                  <div className="credits-content space-y-12 pb-24 text-center">
                      <div className="space-y-3">
                          <h1 className="text-4xl md:text-5xl font-scifi text-yellow-500 font-black tracking-widest uppercase animate-pulse">$TAR BUCKS</h1>
                          <p className="text-cyan-400 font-mono text-xs tracking-[0.3em] uppercase font-bold">GALAXY TRADE EMPIRE</p>
                           <p className="text-gray-500 font-mono text-[10px] uppercase">v.13.0.3</p>
                      </div>

                      <div className="border-t border-b border-gray-800 py-6 my-10 space-y-2">
                          <p className="text-yellow-500 text-[10px] font-mono uppercase tracking-widest font-black">--- LEAD DESIGN & ARCHITECTURE ---</p>
                          <p className="text-white text-2xl font-black font-scifi">Jules</p>
                      </div>

                      <div className="border-b border-gray-800 pb-6 my-10 space-y-2">
                          <p className="text-yellow-500 text-[10px] font-mono uppercase tracking-widest font-black">--- CO-ENGINE & INTELLIGENCE ---</p>
                          <p className="text-white text-2xl font-black font-scifi">Gemini</p>
                      </div>

                      <div className="space-y-6">
                          <p className="text-yellow-500 text-[10px] font-mono uppercase tracking-widest font-black">--- SPECIAL THANKS TO THE BANKS & CREDITORS ---</p>
                          <div className="space-y-3 text-base font-mono">
                              <p className="text-white font-bold">Starfleet Credit Union</p>
                              <p className="text-white font-bold">Tyrell Corporation Finance</p>
                              <p className="text-white font-bold">Weyland-Yutani Trust</p>
                              <p className="text-white font-bold">The Great Barter Bank</p>
                              <p className="text-white font-bold">The Hutt Cartel Lending</p>
                          </div>
                      </div>

                      <div className="space-y-6 pt-6">
                          <p className="text-yellow-500 text-[10px] font-mono uppercase tracking-widest font-black">--- WITH APPRECIATION TO THE CONGLOMERATES & CORPORATIONS ---</p>
                          <div className="space-y-3 text-base font-mono">
                              <p className="text-white font-bold">Choam Corp</p>
                              <p className="text-white font-bold">Cyberdyne Systems</p>
                              <p className="text-white font-bold">Tyrell Corporation</p>
                              <p className="text-white font-bold">Weyland-Yutani Logistics</p>
                              <p className="text-white font-bold">Void-Ex Logistics</p>
                          </div>
                      </div>

                      <div className="space-y-6 pt-6">
                          <p className="text-yellow-500 text-[10px] font-mono uppercase tracking-widest font-black">--- HONORABLE SECTOR ENTITIES & REGULATORS ---</p>
                          <div className="space-y-3 text-base font-mono">
                              <p className="text-white font-bold">Galactic Overlord Department (G.O.D.)</p>
                              <p className="text-white font-bold">V.I.S.A. Checkpoint Control</p>
                              <p className="text-white font-bold">S.C.A.M. Customs Board</p>
                              <p className="text-white font-bold">Federation Supply Hub</p>
                              <p className="text-white font-bold">Sector Health, Allocation, & Network Enforcement</p>
                          </div>
                      </div>

                      <div className="space-y-6 pt-6">
                          <p className="text-yellow-500 text-[10px] font-mono uppercase tracking-widest font-black">--- RIVAL SYNDICATES & THREATS ---</p>
                          <div className="space-y-3 text-base font-mono">
                              <p className="text-white font-bold">The Crimson Fleet</p>
                              <p className="text-white font-bold">The Spice Bandits</p>
                              <p className="text-white font-bold">The Void-Sickness Whispers</p>
                              <p className="text-white font-bold">The Sentient Rust Rats</p>
                          </div>
                      </div>

                      <div className="pt-16 pb-20 space-y-4">
                          <p className="text-yellow-500 text-xs font-mono uppercase tracking-widest font-black">--- FINAL COGNITIVE DOCKING TRANSMISSION ---</p>
                          <p className="text-white text-2xl font-scifi font-black animate-pulse leading-snug">Love S.H.A.N.E.</p>
                      </div>
                  </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTerminalContent = () => {
      if (!state) return null;

      if (modal.type === 'tutorial_popup') {
          return (
              <div className="p-8 flex flex-col items-center justify-center h-full text-center max-w-3xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
                   <div className="bg-yellow-500 text-black px-4 py-1 font-bold text-sm rounded-full mb-2 uppercase">Neural Link Established</div>
                   <h2 className="text-3xl font-bold text-white tracking-tight">{modal.data.title}</h2>
                   <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">{modal.data.text}</p>
                   {TUTORIAL_QUOTES[modal.data.feature] && (<div className={`p-4 bg-slate-800/50 rounded-xl italic text-sm ${TUTORIAL_QUOTES[modal.data.feature].color} border-l-4 ${TUTORIAL_QUOTES[modal.data.feature].color.replace('text-', 'border-')}`}>"{TUTORIAL_QUOTES[modal.data.feature].text}" <br/> - {TUTORIAL_QUOTES[modal.data.feature].author}</div>)}
                   <button onClick={()=>{ 
                       setState(prev => { 
                           if(!prev) return null; 
                           const newFlags = {...prev.tutorialFlags, [modal.data.feature]: true}; 
                           return {...prev, tutorialFlags: newFlags}; 
                       }); 
                       modal.data.callback(); 
                   }} className="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-12 rounded-xl text-2xl shadow-xl action-btn uppercase">INITIATE SYSTEM</button>
              </div>
          );
      }

      if (modal.type === 'report') {
        return (
            <div className="flex flex-col h-full bg-black/40 p-4 md:p-8 animate-in fade-in duration-500">
                 <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                     <h2 className="text-3xl font-scifi text-yellow-500 uppercase tracking-widest">Daily Cycle Summary</h2>
                     <div className="text-xs text-white font-mono uppercase font-bold">CYCLE_D{state.day}_STATUS</div>
                 </div>
                 <div className="flex-grow overflow-y-auto custom-scrollbar space-y-4 mb-8">
                     {modal.data.quirky && (
                         <div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 italic text-blue-100 text-lg font-mono">
                             "{modal.data.quirky.text}"
                         </div>
                     )}
                     <div className="space-y-2">
                         {modal.data.events.map((e: string, i: number) => (
                             <div key={i} className={`p-3 bg-slate-800/40 rounded-lg border border-gray-800 flex items-center ${getReportEventColorClass(e)}`}>
                                 <span className="mr-3 font-black opacity-20">[{i+1}]</span>
                                 <span className="text-sm md:text-base">{renderLogMessage(e)}</span>
                             </div>
                         ))}
                     </div>
                 </div>
                 <div className="text-center mb-6">
                     <span className="text-cyan-400 font-bold font-mono tracking-widest text-xs animate-pulse bg-cyan-950/40 border border-cyan-500/30 px-4 py-2 rounded-full uppercase">
                         ★ WOULD YOU LIKE TO KNOW MORE? ★
                     </span>
                 </div>
                 <button onClick={() => { setModal({type:'none', data:null}); SFX.play('click'); }} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl shadow-xl action-btn uppercase text-2xl">Proceed to Operations</button>
            </div>
        );
      }


      if (modal.type === 'venue_intel') {
        return (
            <div className="flex flex-col h-full p-4 md:p-8 bg-black/40 animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
                    <h2 className="text-3xl font-scifi text-blue-400 uppercase">{VENUES[modal.data.venueIdx]} Market Intel</h2>
                    <button onClick={()=>setModal({type:'travel', data:null})} className="text-red-500 hover:text-red-400"><XCircle size={32}/></button>
                </div>
                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-gray-800/90 text-gray-400 uppercase text-xs sticky top-0">
                            <tr><th className="p-4">Commodity</th><th className="p-4 text-right">Local Price</th><th className="p-4 text-right">Available Stock</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {COMMODITIES.map(c => {
                                const item = modal.data.market[c.name];
                                return (
                                    <tr key={c.name} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4 font-bold text-white flex items-center gap-3"><span className="text-2xl">{c.icon === 'metal-lump' ? '🌑' : c.icon}</span>{c.name}</td>
                                        <td className="p-4 text-right">
                                          <PriceDisplay value={item.price} size="text-lg" compact />
                                          {state.fixedCommodity?.name === c.name && (
                                            <div className="text-cyan-400 text-xs font-bold">FROZEN</div>
                                          )}
                                        </td>
                                        <td className="p-4 text-right font-mono text-gray-400">{item.quantity}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
      }

      if (modal.type === 'commodity_intel') {
        const { name, source, venueIndex } = modal.data;
        const c = COMMODITIES.find(x=>x.name === name)!;

        let minPrice = Infinity;
        let maxPrice = 0;
        state.markets.forEach(m => {
            const price = m?.[name]?.price || 0;
            if (price > 0) {
                if (price < minPrice) minPrice = price;
                if (price > maxPrice) maxPrice = price;
            }
        });
        if (minPrice === Infinity) minPrice = 0;

        return (
            <div className="flex flex-col h-full p-4 md:p-8 bg-black/40 animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
                    <h2 className="text-3xl font-scifi text-cyan-400 uppercase">{name} Neural Intel</h2>
                    <button onClick={()=>{setModal({type:'shipping', data:null}); setLogisticsTab('shipping');}} className="text-red-500 hover:text-red-400"><XCircle size={32}/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">
                        <div className="bg-slate-800/50 p-6 rounded-3xl border border-cyan-500/20">
                            <h3 className="text-gray-400 uppercase text-[10px] font-black tracking-[0.3em] mb-4">Neural Profile</h3>
                            <div className="flex items-center gap-6 mb-4">
                                <div className="text-6xl p-4 bg-black/40 rounded-2xl border border-cyan-500/30">{c.icon === 'metal-lump' ? '🌑' : c.icon}</div>
                                <div>
                                    <div className="text-white font-black text-2xl uppercase">{c.name}</div>
                                    <div className="text-cyan-500 font-mono text-sm uppercase">Sector Rarity: {Math.round(c.rarity * 100)}%</div>
                                </div>
                            </div>
                            <div className="text-gray-300 text-sm italic leading-relaxed">System Analysis: A core commodity within the current sector cycle. Volatility remains locked within predictable neural thresholds.</div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-white font-bold uppercase tracking-widest text-sm border-l-2 border-cyan-500 pl-4">Sector Market Spreads</h3>
                        <div className="flex justify-between text-[10px] text-gray-500 uppercase font-black px-4">
                            <span>Venue</span>
                            <span>Local Stock / Price</span>
                        </div>
                        {state.markets.map((m, i) => {
                            const mItem = m?.[name];
                            const price = mItem ? mItem.price : 0;
                            const stock = mItem ? mItem.quantity : 0;
                            const isStored = state.warehouse[i]?.[name] !== undefined;

                            const h2oPasteMinMult = Math.pow(1.05, state.day);
                            const h2oPasteMaxMult = Math.pow(1.10, state.day);
                            let dMin = Math.round(c.minPrice * phaseMultiplier);
                            let dMax = Math.round(c.maxPrice * phaseMultiplier);
                            if (c.name === H2O_NAME || c.name === NUTRI_PASTE_NAME) {
                                dMin = Math.round(c.minPrice * h2oPasteMinMult);
                                dMax = Math.round(c.maxPrice * h2oPasteMaxMult);
                            }
                            const priceRangeAmt = dMax - dMin;
                            const relativePrice = (price - dMin) / priceRangeAmt;
                            let priceColorClass = 'text-yellow-400';
                            if (relativePrice <= 0.33) priceColorClass = 'text-green-400';
                            if (relativePrice >= 0.66) priceColorClass = 'text-red-400';

                            const isBestBuy = price === minPrice;
                            const isBestSell = price === maxPrice;
                            const isFrozen = state.fixedCommodity?.name === name;

                            return (
                                <div key={i} className="flex justify-between items-center bg-black/30 p-4 rounded-xl border border-gray-800 hover:border-cyan-500/20 transition-all">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 font-bold">{VENUES[i]}</span>
                                        {isStored && <span className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded animate-pulse">STORED</span>}
                                        {isBestBuy && stock > 0 && <span className="bg-green-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded">BEST BUY</span>}
                                        {isBestSell && <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded">BEST SELL</span>}
                                        {isFrozen && <span className="bg-cyan-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded">FROZEN</span>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {source === 'storage' && venueIndex === i ? (
                                            <button
                                                onClick={() => {
                                                    const whItem = state.warehouse[venueIndex!]?.[name];
                                                    if (whItem) {
                                                        sellWarehouseItem(venueIndex!, name, whItem.quantity);
                                                    }
                                                    setModal({type: 'none', data: null});
                                                }}
                                                className="text-[10px] bg-red-600 hover:bg-red-500 border border-red-400 text-white px-2 py-1 rounded font-black shrink-0"
                                            >
                                                SELL
                                            </button>
                                        ) : source === 'storage' ? (
                                            <button
                                                disabled={!((state.warehouse[venueIndex!]?.[name]?.quantity || 0) > 0)}
                                                onClick={() => {
                                                    automateStorageShipment(name, venueIndex!, i);
                                                }}
                                                className="text-[10px] bg-cyan-900 hover:bg-cyan-800 disabled:bg-gray-700 border border-cyan-500 disabled:border-gray-600 text-cyan-300 disabled:text-gray-500 px-2 py-1 rounded font-black shrink-0"
                                            >
                                                SET DESTINATION
                                            </button>
                                        ) : (
                                            <button
                                                disabled={!((state.cargo[name]?.quantity || 0) > 0)}
                                                onClick={() => {
                                                    automateCargoShipment(name, i);
                                                }}
                                                className="text-[10px] bg-cyan-900 hover:bg-cyan-800 disabled:bg-gray-700 border border-cyan-500 disabled:border-gray-600 text-cyan-300 disabled:text-gray-500 px-2 py-1 rounded font-black shrink-0"
                                            >
                                                SET DESTINATION
                                            </button>
                                        )}
                                        <span className="text-xs text-gray-500 font-mono">Stock: <span className="text-white">{stock}</span></span>
                                        <div className={priceColorClass}><PriceDisplay value={price} size="text-md" compact /></div>
                                        {source === 'storage' && (
                                            <div className="text-xs">
                                                <PriceDisplay value={price - (state.warehouse[venueIndex!]?.[name]?.originalAvgCost || 0)} colored size="text-xs" compact />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
      }

      if (modal.type === 'wiki') {
        return renderSectorCodex();
      }
      
      if (modal.type === 'none') {
          if (!priorityAcknowledged) {
              return (
                  <div className="flex flex-col h-full bg-transparent p-8 space-y-6 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex justify-between items-start border-b border-cyan-900 pb-4">
                        <h2 className="text-4xl font-scifi text-cyan-400 tracking-tighter">Things to do First</h2>
                        <span className="text-[10px] text-cyan-800 font-mono uppercase mt-2">Directive: 098-ALPHA</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start w-full max-w-6xl">
                          <div className="space-y-4 text-lg md:text-xl font-bold text-gray-200 leading-snug">
                              <div className="flex items-start"><span className="text-cyan-500 mr-4 font-black">1.)</span> Take out another loan from I.B.A.N.K. Hub to continue trading.</div>
                              <div className="flex items-start"><span className="text-cyan-500 mr-4 font-black">2.)</span> Do some fabricating in the F.O.M.O deck.</div>
                              <div className="flex items-start"><span className="text-cyan-500 mr-4 font-black">3.)</span> Buy some commodities Low and stock up on fuel (Space Spice) and cells (Hot Isotope Hummers) to mine asteroids.</div>
                              <div className="flex items-start"><span className="text-cyan-500 mr-4 font-black">4.)</span> Buy a mining laser and protection for the ship from the upgrade deck.</div>
                          </div>
                          
                          <div className="bg-cyan-950/20 border-l-4 border-cyan-500 p-6 space-y-4 rounded-r-lg">
                              <p className="text-yellow-400 font-black uppercase tracking-widest text-sm">Most important: Keep your Trading license for as many days as possible.</p>
                              <p className="text-emerald-400 font-black italic">Don't forget to buy commodities low and sell high.</p>
                          </div>
                      </div>

                      <div className="mt-auto pt-6 border-t border-cyan-900/30 flex flex-col items-center">
                          <div className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.5em] mb-2">By order</div>
                          <div className="text-cyan-600 font-scifi text-lg md:text-xl tracking-[0.2em] font-black uppercase text-center mb-6">Sector Health, Allocation, & Network Enforcement (S.H.A.N.E.).</div>
                          <button onClick={() => { setPriorityAcknowledged(true); SFX.play('success'); }} className="w-full md:w-1/2 bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-xl text-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all action-btn">ACKNOWLEDGE DIRECTIVE</button>
                      </div>
                  </div>
              );
          }

          return (
              <>
                <div className="flex justify-between items-center p-3 border-b border-gray-700 bg-gray-900/90 sticky top-0 z-20">
                    <div className="flex items-center gap-2 w-1/3 text-left">
                        <h2 className="font-scifi text-blue-500 text-lg md:text-2xl truncate">{VENUES[state.currentVenueIndex]}</h2>
                        <button
                            onClick={() => {
                                SFX.play('click');
                                setModal({ type: 'view_venue', data: state.currentVenueIndex });
                            }}
                            className="bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-cyan-300 px-2 py-1 rounded text-[10px] font-black uppercase shrink-0 active:scale-95 transition-all shadow-[0_0_8px_rgba(6,182,212,0.3)] cursor-pointer"
                        >
                            View Venue
                        </button>
                    </div>
                    <div className={`text-lg md:text-2xl font-scifi font-bold w-1/3 text-center flex justify-center items-center ${state.cash >= 0 ? 'text-green-500' : 'text-red-500'}`}><PriceDisplay value={state.cash} size="text-lg md:text-2xl" /></div>
                    <span className={`${isOverfilled ? 'text-red-500' : 'text-yellow-400'} text-sm md:text-xl font-bold font-mono w-1/3 text-right`}>{Math.round(state.cargoWeight)}/{state.cargoCapacity}T</span>
                </div>
                
                <div className="overflow-y-auto custom-scrollbar flex-grow p-2" ref={consoleScrollRef} onScroll={(e) => setConsoleScrollPosition(e.currentTarget.scrollTop)}>
                    <table className="w-full border-collapse hidden md:table">
                        <thead className="bg-gray-800/90 text-gray-400 sticky top-0 z-10 text-base">
                            <tr>
                                <th className="p-2 text-left w-[20%]">Commodity</th>
                                <th className="p-2 text-left w-[20%]">Intel (Contract/Price)</th>
                                <th className="p-2 text-right w-[10%]">Price</th>
                                <th className="p-2 text-center w-[10%]">Stock</th>
                                <th className="p-2 text-center w-[10%]">Owned</th>
                                <th className="p-2 text-center w-[30%]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {COMMODITIES.map(c => {
                                const mItem = currentMarketLocal ? currentMarketLocal[c.name] : null;
                                const owned = state.cargo[c.name] || {quantity:0, averageCost:0};
                                const activeContract = state.activeContracts.find(con => con.commodity === c.name && con.status === 'active');
                                const isCovered = activeContract ? isContractCovered(state, activeContract) : false;
                                const availableContract = !activeContract ? state.availableContracts.find(con => con.commodity === c.name) : null;
                                let minP=Infinity, maxP=0, minV='', maxV='';
                                state.markets.forEach((m, i) => {
                                    if (m && m[c.name]) {
                                        if (m[c.name].price < minP) { minP = m[c.name].price; minV = VENUES[i]; }
                                        if (m[c.name].price > maxP) { maxP = m[c.name].price; maxV = VENUES[i]; }
                                    }
                                });
                                const h2oPasteMinMult = Math.pow(1.05, state.day);
                                const h2oPasteMaxMult = Math.pow(1.10, state.day);
                                let dMin = state.commodityPriceOverrides?.[c.name]?.min !== undefined
                                    ? Math.round(state.commodityPriceOverrides[c.name].min)
                                    : Math.round(c.minPrice * phaseMultiplier);
                                let dMax = state.commodityPriceOverrides?.[c.name]?.max !== undefined
                                    ? Math.round(state.commodityPriceOverrides[c.name].max)
                                    : Math.round(c.maxPrice * phaseMultiplier);
                                if (c.name === H2O_NAME || c.name === NUTRI_PASTE_NAME) {
                                    if (state.commodityPriceOverrides?.[c.name]?.min !== undefined) {
                                        dMin = Math.round(state.commodityPriceOverrides[c.name].min);
                                    } else {
                                        dMin = Math.round(c.minPrice * h2oPasteMinMult);
                                    }
                                    if (state.commodityPriceOverrides?.[c.name]?.max !== undefined) {
                                        dMax = Math.round(state.commodityPriceOverrides[c.name].max);
                                    } else {
                                        dMax = Math.round(c.maxPrice * h2oPasteMaxMult);
                                    }
                                }
                                const priceRangeAmt = dMax - dMin;
                                const relativePrice = ((mItem?.price || 0) - dMin) / (priceRangeAmt || 1);
                                let priceColorClass = 'text-yellow-400';
                                if (relativePrice <= 0.33) priceColorClass = 'text-green-400';
                                if (relativePrice >= 0.66) priceColorClass = 'text-red-400';

                                return (
                                    <React.Fragment key={c.name}>
                                        <tr className="hover:bg-gray-800/50 transition-colors">
                                            <td className="p-2">
                                                <div className="font-bold text-gray-200 flex items-center text-lg">
                                                    <span className="mr-2 text-2xl">{c.icon === 'metal-lump' ? '🌑' : c.icon}</span>
                                                    {c.name}
                                                    <button
                                                        onClick={() => {
                                                            SFX.play('click');
                                                            setExpandedCommodityPrices(prev => ({ ...prev, [c.name]: !prev[c.name] }));
                                                        }}
                                                        className="ml-3 text-[10px] bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 px-2 py-0.5 rounded font-black tracking-tighter"
                                                    >
                                                        {expandedCommodityPrices[c.name] ? '▲ INTEL' : '▼ INTEL'}
                                                    </button>
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1 flex items-center">
                                                    {c.unitWeight} T | Range: <PriceDisplay value={dMin} size="text-sm ml-1" compact /> - <PriceDisplay value={dMax} size="text-sm" compact />
                                                    {state.commodityPriceOverrides?.[c.name] !== undefined && (
                                                        <span className="text-[8px] text-green-400 font-bold uppercase ml-2 animate-pulse bg-green-500/10 px-1 border border-green-500/20">EXPANDED</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-2 text-sm text-gray-500 align-top pt-3 text-left">
                                            {activeContract ? (
                                                isCovered ? (
                                                    <><div className="text-green-400 font-bold mb-1 flex items-center">READY TO FULFILL <span className="text-lg ml-1">✓</span></div><div className="text-green-400 flex items-center text-xs opacity-70">Low: <PriceDisplay value={minP} size="text-xs mx-1" compact /> @ {minV}</div><div className="text-red-400 flex items-center text-xs opacity-70">High: <PriceDisplay value={maxP} size="text-xs mx-1" compact /> @ {maxV}</div></>
                                                ) : (
                                                    <div className="text-yellow-400 font-bold">ACTIVE CONTRACT: Ship {activeContract.quantity} to {VENUES[activeContract.destinationIndex]}</div>
                                                )
                                            ) : (
                                                availableContract ? (
                                                    <div className="text-blue-400 font-bold">CONTRACT AVAIL: {availableContract.quantity} → {VENUES[availableContract.destinationIndex]} (<PriceDisplay value={availableContract.reward} size="text-sm" compact/>)</div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <div className="text-green-400 flex items-center">Low: <PriceDisplay value={minP} size="text-sm mx-1" compact /> @ {minV}</div>
                                                        <div className="text-red-400 flex items-center">High: <PriceDisplay value={maxP} size="text-sm mx-1" compact /> @ {maxV}</div>
                                                        {hasScanner(state) && (<div className="text-cyan-600 text-[10px] uppercase font-mono tracking-tighter">VOLATILITY: {Math.round(relativePrice*100)}% DETECTED</div>)}
                                                    </div>
                                                )
                                            )}
                                        </td>
                                        <td className={`p-2 text-right align-middle`}>
                                             <div className={`flex justify-end font-bold text-xl ${priceColorClass}`}>{mItem ? Math.round(mItem.price).toLocaleString() : '0'} <StarCoin size={20} /></div>
                                        </td>
                                        <td className="p-2 text-center text-gray-400 text-lg align-middle">
                                             <div>{mItem ? mItem.quantity : 0}</div>
                                            {(() => {
                                                const stockArrivedElsewhere = Object.entries(state.warehouse).some(([vIdxStr, venueWarehouse]) => {
                                                    const vIdx = parseInt(vIdxStr);
                                                    if (vIdx === state.currentVenueIndex) return false;
                                                    const item = venueWarehouse[c.name];
                                                    return item && item.quantity > 0 && !item.isContractReserved && state.day >= item.arrivalDay;
                                                });
                                                if (stockArrivedElsewhere) {
                                                    return (
                                                        <button
                                                            onClick={() => {
                                                                let targetStorageVenueIdx = -1;
                                                                for (const [vIdxStr, venueWarehouse] of Object.entries(state.warehouse)) {
                                                                    const vIdx = parseInt(vIdxStr);
                                                                    if (vIdx !== state.currentVenueIndex) {
                                                                        const item = venueWarehouse[c.name];
                                                                        if (item && item.quantity > 0 && !item.isContractReserved && state.day >= item.arrivalDay) {
                                                                            targetStorageVenueIdx = vIdx;
                                                                            break;
                                                                        }
                                                                    }
                                                                }
                                                                if (targetStorageVenueIdx !== -1) {
                                                                    showCommodityIntel(c.name, 'storage', targetStorageVenueIdx);
                                                                }
                                                            }}
                                                            className="mt-1 text-[10px] bg-red-600 hover:bg-red-500 hover:scale-105 active:scale-95 text-white px-2 py-1 rounded font-black border border-red-800 shadow-[0_0_8px_rgba(220,38,38,0.5)] transition-all uppercase block mx-auto animate-pulse whitespace-nowrap"
                                                            title="Arrived Storage Detected! Click to open Storage Intel."
                                                        >
                                                            STORE
                                                        </button>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </td>
                                        <td className="p-2 text-center align-middle">
                                            {owned.quantity > 0 ? (
                                                 <div className="leading-tight flex flex-col items-center"><div className="text-white font-bold text-lg">{owned.quantity}</div><PriceDisplay value={((mItem?.price || 0)-owned.averageCost)*owned.quantity} colored={true} size="text-sm" compact /></div>
                                            ) : <span className="text-gray-700">-</span>}
                                        </td>
                                        <td className="p-2 align-middle">
                                            <div className="flex flex-col space-y-2">
                                                <div className="flex space-x-1 items-center bg-gray-900/50 p-1 rounded">
                                                    {/* Expanded quantity input for phase 4 values (10 digits + scroll room) */}
                                                    <input type="number" min="0" placeholder="Qty" className="w-[170px] bg-gray-800 text-white text-center rounded border border-gray-600 text-sm p-1.5" value={buyQuantities[c.name]||''} onChange={e=>setBuyQuantities({...buyQuantities, [c.name]: e.target.value})} />
                                                    <button
                                                         onClick={()=>mItem && setMaxBuy(c, mItem)}
                                                         disabled={!mItem || mItem.quantity === 0}
                                                         className={`w-auto px-4 bg-gray-700 hover:bg-gray-600 text-sm text-white rounded py-1 action-btn ${(!mItem || mItem.quantity === 0) ? 'opacity-30 pointer-events-none' : ''}`}
                                                    >
                                                        MAX
                                                    </button>
                                                    <button
                                                         onClick={()=>mItem && handleTrade('buy', c, mItem, owned)}
                                                         disabled={!mItem || mItem.quantity === 0}
                                                         className={`w-auto px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded font-bold py-1 action-btn ${(!mItem || mItem.quantity === 0) ? 'opacity-30 pointer-events-none' : ''}`}
                                                    >
                                                        BUY
                                                    </button>
                                                    {c.name === "PC Chips" && state.isMutinyActive && (
                                                         <button
                                                              onClick={() => handleBuyStrikeChips()}
                                                              className="w-auto px-4 bg-red-600 hover:bg-red-500 text-white text-sm rounded font-bold py-1 action-btn animate-pulse"
                                                         >
                                                              STRIKE
                                                         </button>
                                                    )}
                                                    {availableContract && (
                                                        <button onClick={() => acceptContract(availableContract)} className="w-auto px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded font-bold py-1 action-btn">
                                                            ACCEPT
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex space-x-1 items-center bg-gray-900/50 p-1 rounded">
                                                    {/* Expanded quantity input for phase 4 values (10 digits + scroll room) */}
                                                    <input type="number" min="0" placeholder="Qty" className="w-[170px] bg-gray-800 text-white text-center rounded border border-gray-600 text-sm p-1.5" value={sellQuantities[c.name]||''} onChange={e=>setSellQuantities({...sellQuantities, [c.name]: e.target.value})} />
                                                    <button onClick={()=>setSellQuantities({...sellQuantities, [c.name]: owned.quantity.toString()})} disabled={owned.quantity===0} className="w-auto px-4 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-sm text-white rounded py-1 action-btn">ALL</button>
                                                     <button onClick={()=>mItem && handleTrade('sell', c, mItem, owned)} disabled={owned.quantity===0} className="w-auto px-4 bg-green-700 hover:bg-green-600 disabled:opacity-30 text-white text-sm rounded font-bold py-1 action-btn">SELL</button>
                                                    <button
                                                        disabled={owned.quantity===0}
                                                        onClick={() => { const ownedQuantity = state.cargo[c.name]?.quantity || 0; setShippingQuantities(prev => ({ ...prev, [c.name]: ownedQuantity.toString() })); setModal({ type: 'shipping', data: null }); setLogisticsTab('shipping'); setShippingPriorityItem(c.name); }}
                                                        className="w-auto px-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-white text-sm rounded font-bold py-1 action-btn"
                                                    >
                                                        SHIP
                                                    </button>
                                                    {activeContract && !isCovered && (
                                                        <button onClick={() => handleFulfill(activeContract)} disabled={owned.quantity < activeContract.quantity || pulsingContractId !== null} className={`w-auto px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:opacity-50 text-white text-sm rounded font-bold py-1 action-btn ${pulsingContractId === activeContract.id ? 'animate-pulse' : ''}`}>FULFILL</button>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedCommodityPrices[c.name] && (
                                        <tr className="bg-slate-900/50">
                                            <td colSpan={6} className="p-4 border-b border-gray-800">
                                                <div className="p-4 bg-black/40 rounded-2xl border border-slate-700/50 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs font-mono">
                                                    {(() => {
                                                        const quantities = VENUES.map((_, idx) => state.markets[idx][c.name]?.quantity || 0);
                                                        const maxQ = Math.max(...quantities);
                                                        const minQ = Math.min(...quantities);

                                                        return VENUES.map((venueName, vIdx) => {
                                                            const price = state.markets[vIdx][c.name]?.price || 0;
                                                            const qty = state.markets[vIdx][c.name]?.quantity || 0;

                                                            const isLowest = price === minP;
                                                            const isHighest = price === maxP;
                                                            let prefix = "";
                                                            let styleClass = "border border-slate-800 bg-slate-900/20 text-gray-400";
                                                            if (isLowest) {
                                                                prefix = "Buy: ";
                                                                styleClass = "border-2 border-green-500 bg-green-950/30 text-green-400 font-bold shadow-[0_0_15px_rgba(34,197,94,0.1)]";
                                                            } else if (isHighest) {
                                                                prefix = "Sell: ";
                                                                styleClass = "border-2 border-red-500 bg-red-950/30 text-red-400 font-bold shadow-[0_0_15px_rgba(239,68,68,0.1)]";
                                                            }

                                                            // Stock styling
                                                            let stockStyle = "text-sky-300"; // default light blue (small)
                                                            if (qty === maxQ && maxQ > 0) {
                                                                stockStyle = "text-blue-600 font-black animate-pulse"; // blinking dark blue
                                                            } else if (qty > minQ + (maxQ - minQ) * 0.33) {
                                                                stockStyle = "text-sky-500 font-semibold"; // medium
                                                            }

                                                            // Price styling
                                                            let priceStyle = "text-yellow-500 font-semibold"; // static yellow/orange
                                                            if (isLowest) {
                                                                priceStyle = "text-green-400 font-black animate-pulse"; // blinking bright green
                                                            } else if (isHighest) {
                                                                priceStyle = "text-red-500 font-black animate-pulse"; // blinking red
                                                            }

                                                            return (
                                                                <div key={vIdx} className={`p-3 rounded-xl flex flex-col justify-between ${styleClass} transition-all hover:scale-[1.02]`}>
                                                                    <span className="text-[10px] uppercase text-slate-500 truncate font-sans font-semibold mb-1">{venueName}</span>

                                                                    <div className="text-[10px] font-mono mb-2">
                                                                        Stock: <span className={stockStyle}>{qty.toLocaleString()}</span>
                                                                    </div>

                                                                    <span className={`text-sm flex items-center gap-0.5 mt-auto font-black ${priceStyle}`}>
                                                                        {prefix}
                                                                        <PriceDisplay value={price} size="text-sm" compact />
                                                                    </span>
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
              </>
          );
      }

      if (modal.type === 'travel') {
          const currentMarketLocalMarket = state.markets[state.currentVenueIndex];
          const insuranceCost = Math.round(getCargoValue(state.cargo, currentMarketLocalMarket) * 0.02);
          const currentCells = state.cargo[POWER_CELL_NAME]?.quantity || 0;
          const currentFuel = state.cargo[FUEL_NAME]?.quantity || 0;
          const laserRepairCostVal = calculateFullLaserRepairCost();

          return (
              <div className="flex flex-col h-full bg-slate-900/60 p-4 md:p-6 space-y-4">
                  <div className="flex flex-col md:flex-row justify-start items-center mb-2 gap-3">
                      <h2 className="text-2xl font-scifi text-emerald-400 whitespace-nowrap">C.A.T. Station</h2>
                      
                      <div className="flex space-x-2 bg-black/40 px-3 py-1.5 rounded-full border border-emerald-500/30">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Cells : <span className="text-white font-mono text-xs">{currentCells}</span></div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Fuel : <span className="text-white font-mono text-xs">{currentFuel}</span></div>
                      </div>

                      <div className="flex items-center gap-3 flex-grow ml-2">
                        {state.laserHealth === 100 ? (
                           <span className="text-emerald-400 font-bold text-[10px] uppercase animate-pulse">Optional Laser at 100%</span>
                        ) : (
                           <div className="flex items-center gap-3">
                             <span className="text-red-500 font-black text-[10px] uppercase animate-[shake_0.5s_infinite]">Warning !!! Laser at {state.laserHealth}% repair</span>
                             <button onClick={() => performRepair('laser')} className="bg-red-600 hover:bg-red-500 text-white text-[9px] font-black px-3 py-1 rounded shadow-lg border-b-2 border-red-900 transition-all uppercase whitespace-nowrap">Repair Laser (<PriceDisplay value={laserRepairCostVal} size="text-[9px]" compact/>)</button>
                           </div>
                        )}
                        {state.optimalVenueToday !== -1 && (
                            <span className="text-cyan-400 font-bold text-[10px] uppercase ml-4">Optimal Venue: {VENUES[state.optimalVenueToday]}</span>
                        )}
                      </div>

                      <button onClick={()=>{setModal({type:'none', data:null}); SFX.play('click');}} className="text-red-500 font-bold hover:text-red-400 ml-auto"><XCircle /></button>
                  </div>

                  <div className="bg-black/40 p-4 rounded border border-gray-700 mb-2 shrink-0">
                      <div className="text-emerald-400 font-bold text-sm mb-4 uppercase tracking-wider flex items-center"><Cpu size={16} className="mr-1"/> Flight Configuration Matrix</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <VerticalToggle label="Hull Insurance" checked={travelConfig.insurance} onChange={(e)=>setTravelConfig({...travelConfig, insurance: e.target.checked})} rightContent={<PriceDisplay value={insuranceCost} size="text-[10px]" compact />} />
                          
                          <VerticalToggle 
                            label="Mining Laser" 
                            disabled={!hasLaser(state)} 
                            checked={travelConfig.mining} 
                            onChange={(e)=>{
                                const isChecked = e.target.checked;
                                setTravelConfig(prev => ({
                                    ...prev, 
                                    mining: isChecked,
                                    overload: isChecked ? prev.overload : false 
                                }));
                            }} 
                          />
                          
                          <VerticalToggle 
                            label="Laser Overload" 
                            disabled={!hasLaser(state) || !travelConfig.mining} 
                            checked={travelConfig.overload} 
                            onChange={(e)=>setTravelConfig({...travelConfig, overload: e.target.checked})} 
                          />
                          
                          <VerticalToggle label="Deposit 95% of capital" disabled={state.activeLoans.length > 0} checked={travelConfig.invest95} onChange={(e)=>setTravelConfig({...travelConfig, invest95: e.target.checked})} />
                      </div>
                  </div>
                  <button onClick={() => handleTravel(state.currentVenueIndex, 0, false, false, false, false)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded mb-2 shrink-0 flex items-center justify-center border border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]"><Hourglass size={20} className="mr-2 animate-pulse"/> Stay at {VENUES[state.currentVenueIndex]} & trade (advance day)</button>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar flex-grow p-1">
                      {VENUES.map((v, i) => {
                          if (i === state.currentVenueIndex) return null;
                          const dist = BASE_DISTANCE_MATRIX[state.currentVenueIndex][i];
                          const fuel = getFuelCost(state.currentVenueIndex, i, state.cargoWeight, state.gamePhase);
                          const missingFuel = Math.max(0, fuel - (state.cargo[FUEL_NAME]?.quantity||0));
                          
                          const laserLevel = state.equipment['laser_mk3'] ? 3 : (state.equipment['laser_mk2'] ? 2 : 1);
                          const cellsNeeded = travelConfig.mining ? (state.gamePhase * Math.pow(3, (laserLevel - 1))) : 0;
                          const missingCells = Math.max(0, cellsNeeded - (state.cargo[POWER_CELL_NAME]?.quantity||0));
                          
                          const autoBuyCost = (missingFuel * (state.markets[state.currentVenueIndex][FUEL_NAME]?.price||0)) + (missingCells * (state.markets[state.currentVenueIndex][POWER_CELL_NAME]?.price||0));
                          const risk = dist > 8 ? 'High' : (dist > 4 ? 'Med' : 'Low');
                          const riskColor = risk === 'High' ? 'text-red-500' : (risk === 'Med' ? 'text-yellow-500' : 'text-green-500');
                          const isBanned = state.venueTradeBans[i] > 0;
                          return (
                              <div key={i} className={`bg-slate-800 p-4 rounded-xl border-2 border-slate-700 flex flex-col justify-between hover:border-emerald-500/50 transition-all ${isBanned?'opacity-50 grayscale':''}`}>
                                  <div className="mb-4">
                                      <div className="flex justify-between items-center mb-2">
                                          <div className="flex items-center gap-2 min-w-0">
                                              <div className="text-white font-bold text-lg leading-tight truncate">{v}</div>
                                              <button onClick={() => setModal({ type: 'venue_intel', data: { venueIdx: i, market: state.markets[i] } })} className="text-[10px] bg-blue-900 hover:bg-blue-800 border border-blue-500 text-blue-300 px-2 py-1 rounded font-black shrink-0">INTEL</button>
                                          </div>

                                          {state.visitedVenues?.includes(v) && (
                                              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 mx-2 animate-pulse">
                                                  <CheckCircle2 size={10} className="text-emerald-400" /> Visited
                                              </span>
                                          )}

                                          <div className={`text-[10px] font-bold px-2 py-1 rounded bg-black shrink-0 ${riskColor}`}>{risk} RISK {travelConfig.overload ? ' (CRITICAL)' : ''}</div>
                                      </div>
                                      <div className="text-gray-400 text-xs font-mono mb-2">{dist} Parsecs distance.</div>
                                      {isBanned && <div className="text-red-500 text-xs font-bold uppercase animate-pulse">TRADE BAN ACTIVE: {state.venueTradeBans[i]} DAYS</div>}
                                  </div>
                                  <div className="mt-auto space-y-3">
                                      <div className="flex justify-between text-xs bg-slate-900 p-2 rounded-lg border border-slate-700">
                                          <span className={missingFuel > 0 ? 'text-red-400 font-bold' : 'text-gray-300'}><Fuel size={14} className="inline mr-1"/>{fuel} Fuel</span>
                                          <span className={missingCells > 0 ? 'text-red-400 font-bold' : 'text-gray-300'}><Zap size={14} className="inline mr-1"/>{cellsNeeded} Cells</span>
                                      </div>
                                      <button onClick={()=>{
                                          if (isBanned) return;
                                          checkCargoBeforeTravel(i, fuel, missingFuel, missingCells);
                                      }} disabled={isBanned} className={`w-full font-bold py-3 rounded-xl text-sm transition-all border-b-4 ${(missingFuel > 0 || missingCells > 0) ? 'bg-red-700 hover:bg-red-600 text-red-100 border-red-900' : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-900 shadow-lg'}`}>
                                          {(missingFuel > 0 || missingCells > 0) ? (
                                              <span className="flex items-center justify-center">BUY & JUMP (<PriceDisplay value={autoBuyCost} size="text-[10px]" compact/>)</span>
                                          ) : `JUMP TO ${v.toUpperCase()}`}
                                      </button>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          );
      }

      if (modal.type === 'shop') {
          const groups = [
            { id: 'laser', name: 'Mining Laser Systems', icon: Zap, color: 'text-orange-400', items: ['laser_mk1', 'laser_mk2', 'laser_mk3'] },
            { id: 'scanner', name: 'Market Intelligence Scanners', icon: Radar, color: 'text-cyan-400', items: ['scanner', 'scanner_mk2', 'scanner_mk3'] },
            { id: 'shield', name: 'Hull Protection Arrays', icon: Shield, color: 'text-emerald-400', items: ['shield_gen_mk1', 'shield_gen_mk2', 'shield_gen_mk3'] },
            { id: 'cannon', name: 'Offensive Deterrent Systems', icon: Swords, color: 'text-red-400', items: ['plasma_cannon_mk1', 'plasma_cannon_mk2', 'plasma_cannon_mk3'] }
          ];

          const getUpgradeLevelText = (groupItems: string[]) => {
              const owned = groupItems.filter(id => state.equipment[id]);
              if (owned.length === 0) return "UNOWNED";
              const highestId = owned[owned.length - 1];
              const item = SHOP_ITEMS.find(s => s.id === highestId);
              return `LVL ${item?.level || 0} (${item?.name})`;
          };

          const laserLvl = getUpgradeLevelText(['laser_mk1', 'laser_mk2', 'laser_mk3']);
          const scannerLvl = getUpgradeLevelText(['scanner', 'scanner_mk2', 'scanner_mk3']);
          const shieldLvl = getUpgradeLevelText(['shield_gen_mk1', 'shield_gen_mk2', 'shield_gen_mk3']);
          const cannonLvl = getUpgradeLevelText(['plasma_cannon_mk1', 'plasma_cannon_mk2', 'plasma_cannon_mk3']);

          const frozenComm = state.fixedCommodity ? state.fixedCommodity.name : 'NONE';
          const pendingFrozen = state.pendingFixedCommodity ? state.pendingFixedCommodity.name : 'NONE';
          const boostedComm = state.boostedCommodity ? state.boostedCommodity.name : 'NONE';
          const pendingBoosted = state.pendingBoostedCommodity ? state.pendingBoostedCommodity.name : 'NONE';

          const upgradesTickerText = `DECK STATUS MATRIX // MINING LASER: ${laserLvl} • SCANNER: ${scannerLvl} • SHIELDS: ${shieldLvl} • CANNONS: ${cannonLvl} // INTEL TELEMETRY // CURRENT PRICE FREEZE: ${frozenComm} • PENDING PRICE FREEZE: ${pendingFrozen} • CURRENT RANGE BOOST: ${boostedComm} • PENDING RANGE BOOST: ${pendingBoosted}`;

          return (
              <div className="p-4 md:p-6 custom-scrollbar overflow-y-auto h-full">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-2xl font-scifi text-purple-400">Fixathing'u'ma Jig Deck</h2>
                   <div className="flex-grow flex justify-center"><PriceDisplay value={state.cash} size="text-2xl" colored /></div>
                   <span className="text-xs text-gray-500 font-mono">MODULE: SHIP_REPAIR_v5.8.0</span>
                </div>

                {/* Upgrades Deck Retro LED Ticker */}
                <div className="shrink-0 mb-6 led-ticker-container border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                    <div className="led-ticker-text text-purple-400">
                        {upgradesTickerText}
                    </div>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-lime-700/50 shadow-lg mb-4">
                    <h3 className="text-lime-400 font-bold mb-4 flex items-center text-lg"><Wrench size={20} className="mr-2"/> Dockyard Repairs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-white/5">
                           <span className="text-gray-300">Hull Integrity ({state.shipHealth}%)</span>
                           <button onClick={()=>performRepair('full_hull')} className={`px-4 py-2 rounded-lg text-white text-xs font-bold transition-all ${state.shipHealth >= MAX_REPAIR_HEALTH ? 'bg-green-700/50 cursor-default' : 'bg-red-700 hover:bg-red-600 shadow-md border-b-4 border-red-900'}`}>{state.shipHealth >= MAX_REPAIR_HEALTH ? 'NOMINAL' : `Repair MAX (${formatCompactNumber(calculateFullRepairCost())})`}</button>
                        </div>
                        <div className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-white/5">
                           <span className="text-gray-300">Laser Realignment ({state.laserHealth}%)</span>
                           <button onClick={()=>performRepair('full_laser')} disabled={!hasLaser(state)} className={`px-4 py-2 rounded-lg text-white text-xs font-bold transition-all ${state.laserHealth >= 100 ? 'bg-green-700/50 cursor-default' : 'bg-red-700 hover:bg-red-600 shadow-md disabled:opacity-20 border-b-4 border-red-900'}`}>
                              {state.laserHealth >= 100 ? 'NOMINAL' : `Repair MAX (${formatCompactNumber(calculateFullLaserRepairCost())})`}
                          </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                   <div className="bg-slate-800/80 p-4 rounded-xl border border-blue-700/50 shadow-lg">
                      <div className="flex justify-between items-start mb-4">
                          <div className="text-white font-bold text-lg flex items-center"><Box size={20} className="mr-2 text-blue-400"/>Cargo Expansion</div>
                          <div className="text-[10px] text-gray-400 font-mono text-right">CURRENT: {state.cargoCapacity}T<br/>MAX: {getMaxCargo(state.gamePhase)}T</div>
                      </div>
                      <div className="text-xs text-gray-400 mb-4 bg-black/20 p-2 rounded border border-white/5">
                          {state.cargoCapacity < 5000 && <p className="text-blue-300">Tier 1: <PriceDisplay value={2000} size="text-xs"/> + 1 {MESH_NAME} / 100T</p>}
                          {state.cargoCapacity >= 5000 && state.cargoCapacity < 50000 && <p className="text-purple-300">Tier 2: <PriceDisplay value={5000} size="text-xs"/> + 3 {MESH_NAME} / 100T</p>}
                          {state.cargoCapacity >= 50000 && state.cargoCapacity < 250000 && <p className="text-orange-300">Tier 3: <PriceDisplay value={10000} size="text-xs"/> + 5 {MESH_NAME} / 100T</p>}
                          {state.cargoCapacity >= 250000 && <p className="text-yellow-400 font-bold animate-pulse">Tier 4: <PriceDisplay value={15000} size="text-xs"/> + 5 {MESH_NAME} / 100T</p>}
                      </div>
                      <div className="flex gap-3 items-center">
                          {/* Expanded quantity input for phase 4 values (10 digits + scroll room) */}
                          <input type="number" min="1" className="w-[170px] bg-gray-900 text-white text-center rounded-lg border border-gray-700 text-lg p-2" value={cargoUpgradeQty || ''} onChange={e=>setCargoUpgradeQty(e.target.value)} />
                          <button onClick={() => {
                              let upgradeCostAmt = 2000; let meshReqAmt = 1;
                              if (state.cargoCapacity >= 250000) { upgradeCostAmt = 15000; meshReqAmt = 5; }
                              else if (state.cargoCapacity >= 50000) { upgradeCostAmt = 10000; meshReqAmt = 5; }
                              else if (state.cargoCapacity >= 5000) { upgradeCostAmt = 5000; meshReqAmt = 3; }
                              const meshOwned = state.cargo[MESH_NAME]?.quantity || 0;
                              const cashMaxUpgrade = Math.floor(state.cash / upgradeCostAmt);
                              const capMaxUpgrade = (getMaxCargo(state.gamePhase) - state.cargoCapacity) / 100;
                              const meshMaxUpgrade = Math.floor(meshOwned / meshReqAmt);
                              const maxPossibleUpgrade = Math.max(0, Math.floor(Math.min(meshMaxUpgrade, cashMaxUpgrade, capMaxUpgrade)));
                              setCargoUpgradeQty(maxPossibleUpgrade.toString());
                          }} className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-white text-xs font-bold transition-colors">MAX</button>
                          <button onClick={() => {
                              const qtyVal = parseInt(cargoUpgradeQty);
                              if (isNaN(qtyVal) || qtyVal <= 0) return;
                              let costPerAmt = 2000; let meshPerAmt = 1;
                              if (state.cargoCapacity >= 250000) { costPerAmt = 15000; meshPerAmt = 5; }
                              else if (state.cargoCapacity >= 50000) { costPerAmt = 10000; meshPerAmt = 5; }
                              else if (state.cargoCapacity >= 5000) { costPerAmt = 5000; meshPerAmt = 3; }
                              const totalUpgradeCost = qtyVal * costPerAmt;
                              const totalMeshReq = qtyVal * meshPerAmt;
                              const newCapacityAmt = state.cargoCapacity + (qtyVal * 100);
                              if (newCapacityAmt > getMaxCargo(state.gamePhase)) { SFX.play('error'); return setModal({type:'message', data: "Exceeds Max Capacity."}); }
                              if (state.cash < totalUpgradeCost) { SFX.play('error'); return setModal({type:'message', data: "Insufficient Cash."}); }
                              if ((state.cargo[MESH_NAME]?.quantity||0) < totalMeshReq) { SFX.play('error'); return setModal({type:'message', data: `Insufficient ${MESH_NAME}. Need ${totalMeshReq}.`}); }
                              const newCargoDict = {...state.cargo};
                              newCargoDict[MESH_NAME].quantity = Math.max(0, newCargoDict[MESH_NAME].quantity - totalMeshReq);
                              if (newCargoDict[MESH_NAME].quantity <= 0) delete newCargoDict[MESH_NAME];
                              setState(prev => prev ? ({...prev, cash: prev.cash - totalUpgradeCost, cargo: newCargoDict, cargoCapacity: newCapacityAmt, cargoWeight: prev.cargoWeight - (totalMeshReq * 2.5)}) : null);
                              setCargoUpgradeQty('1'); SFX.play('success'); log(`UPGRADES: Expanded Cargo Bay by ${qtyVal*100}T.`, 'buy');
                          }} className="flex-grow bg-blue-600 hover:bg-blue-500 px-4 py-3 rounded-xl text-white font-bold shadow-lg action-btn border-b-4 border-blue-900">INSTALL EXPANSION</button>
                      </div>
                   </div>

                   <div className="bg-slate-800/80 p-4 rounded-xl border border-cyan-700/50 shadow-lg">
                      <h3 className="text-cyan-400 font-bold mb-4 flex items-center text-lg"><Radar size={20} className="mr-2"/> Scanner Intel</h3>
                      <div className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-white/5 mb-4">
                        <span className="text-gray-300">Consecutive Days Used:</span>
                        <span className="text-white font-bold text-lg">{state.scannerConsecutiveDays || 0}</span>
                      </div>
                      {state.scannerConsecutiveDays === 2 && (
                        <div className="text-red-400 text-xs font-bold uppercase animate-pulse mb-4 p-2 bg-red-900/20 rounded">
                          Warning: Using scanner powers again tomorrow will issue a warrant for your arrest!
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={() => {
                            if (!state.tutorialFlags['scanner_mk2']) {
                              setModal({ type: 'tutorial_popup', data: { title: "Scanner MK II", text: "Fix a commodity's price for the next day. Use this power for 3 days straight and you'll get a warrant for your arrest.", feature: 'scanner_mk2', callback: () => setModal({ type: 'scanner_actions', data: { level: 2 } }) } });
                            } else {
                              setModal({ type: 'scanner_actions', data: { level: 2 } });
                            }
                          }}
                          disabled={!hasScanner2(state) || state.gamePhase < 2}
                          className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg text-xs transition-all shadow-md border-b-4 border-cyan-900 action-btn animate-in fade-in"
                        >
                          {state.pendingFixedCommodity
                            ? `Fix for Tomorrow: ${state.pendingFixedCommodity.name}`
                            : state.fixedCommodity
                            ? `Currently Price Fixed: ${state.fixedCommodity.name} (Reopen)`
                            : 'Fix Commodity Price (Lvl 2)'}
                        </button>
                        <button
                          onClick={() => {
                            if (!state.tutorialFlags['scanner_mk3']) {
                              setModal({ type: 'tutorial_popup', data: { title: "Scanner MK III", text: "Force a 10% increase in one product's price range per day. Use this power for 3 days straight and you'll get a warrant for your arrest.", feature: 'scanner_mk3', callback: () => setModal({ type: 'scanner_actions', data: { level: 3 } }) } });
                            } else {
                              setModal({ type: 'scanner_actions', data: { level: 3 } });
                            }
                          }}
                          disabled={!hasScanner3(state) || state.gamePhase < 3}
                          className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg text-xs transition-all shadow-md border-b-4 border-cyan-900 action-btn animate-in fade-in"
                        >
                          {state.pendingBoostedCommodity
                            ? `Boost for Tomorrow: ${state.pendingBoostedCommodity.name}`
                            : state.boostedCommodity
                            ? `Currently Range Boosted: ${state.boostedCommodity.name} (Reopen)`
                            : 'Boost Price Range (Lvl 3)'}
                        </button>
                      </div>
                      <p className="text-[9px] text-gray-500 text-center mt-4 italic uppercase">Level 2 requires Phase 2. Level 3 requires Phase 3.</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {groups.map(group => {
                        const GroupIcon = group.icon;
                        const ownedItemsIds = group.items.filter(id => state.equipment[id]);
                        const nextUpgradeId = group.items.find(id => !state.equipment[id]);
                        const nextUpgradeItem = nextUpgradeId ? SHOP_ITEMS.find(s => s.id === nextUpgradeId) : null;
                        const highestOwnedUpgrade = ownedItemsIds.length > 0 ? SHOP_ITEMS.find(s => s.id === ownedItemsIds[ownedItemsIds.length-1]) : null;

                        return (
                            <div key={group.id} className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 flex flex-col justify-between hover:border-purple-500/30 transition-all shadow-md">
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <div className={`flex items-center font-bold text-lg ${group.color}`}><GroupIcon className="mr-2" size={24}/> {group.name}</div>
                                        <div className="flex gap-1">
                                            {group.items.map((id) => (
                                                <Circle
                                                    key={id}
                                                    size={12}
                                                    fill={state.equipment[id] ? '#00ff66' : '#1e293b'}
                                                    style={state.equipment[id] ? { filter: 'drop-shadow(0 0 6px #00ff66) drop-shadow(0 0 10px #00ff66)' } : undefined}
                                                    className={state.equipment[id] ? 'text-emerald-400 animate-pulse' : 'text-slate-700'}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {highestOwnedUpgrade ? (
                                        <div className="mb-4 p-3 bg-black/30 rounded-xl border border-white/5">
                                            <div className="text-white font-bold text-sm uppercase tracking-widest mb-1">Active: {highestOwnedUpgrade.name}</div>
                                            <div className="text-xs text-gray-400 italic">Level {highestOwnedUpgrade.level} System Operational. {highestOwnedUpgrade.description}</div>
                                        </div>
                                    ) : (
                                        <div className="mb-4 p-3 bg-red-900/10 rounded-xl border border-red-500/20 text-red-300 text-xs italic">No system installed. Vessel vulnerable.</div>
                                    )}

                                    {nextUpgradeItem ? (
                                        (() => {
                                            const isScannerMk2Locked = nextUpgradeItem.id === 'scanner_mk2' && state.gamePhase < 2;
                                            const isScannerMk3Locked = nextUpgradeItem.id === 'scanner_mk3' && state.gamePhase < 3;
                                            const isLockedByPhase = isScannerMk2Locked || isScannerMk3Locked;
                                            let cost = nextUpgradeItem.cost * (nextUpgradeItem.type === 'defense' ? state.gamePhase : 1);
                                            if (hasCorporateSynergy(state, 'weyland')) {
                                                cost = Math.round(cost * 0.85);
                                            }
                                            const isAffordable = state.cash >= cost;
                                            const isDisabled = isLockedByPhase || !isAffordable;

                                            let buttonText = "INITIATE UPGRADE";
                                            if (isScannerMk2Locked) buttonText = "LOCKED: REQUIRES PHASE 2";
                                            if (isScannerMk3Locked) buttonText = "LOCKED: REQUIRES PHASE 3";

                                            return (
                                                <div className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/20">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="text-purple-300 font-bold text-sm">UPGRADE: {nextUpgradeItem.name}</div>
                                                        <PriceDisplay value={cost} size="text-sm" compact />
                                                    </div>
                                                    <div className="text-xs text-gray-500 mb-4">{nextUpgradeItem.description}</div>
                                                    <button
                                                        onClick={() => buyEquipment(nextUpgradeItem)}
                                                        disabled={isDisabled}
                                                        className={`w-full font-bold py-2 rounded-lg text-xs transition-all shadow-md border-b-4 action-btn ${
                                                            isLockedByPhase
                                                            ? 'bg-slate-800 text-slate-500 border-slate-950 opacity-40 cursor-not-allowed hover:bg-slate-800'
                                                            : isDisabled
                                                            ? 'bg-slate-700 text-gray-400 border-slate-900 opacity-60'
                                                            : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-900'
                                                        }`}
                                                    >
                                                        {buttonText}
                                                    </button>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div className="p-4 bg-emerald-900/10 rounded-xl border border-emerald-500/20 text-center">
                                            <div className="text-emerald-400 font-bold text-sm uppercase tracking-tighter">MAXIMUM LEVEL ACHIEVED</div>
                                            <div className="text-[10px] text-emerald-600 mt-1 uppercase font-mono">System Optimized for Phase {state.gamePhase}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
              </div>
          );
      }

      if (modal.type === 'fomo') {
          const availResources = [H2O_NAME, NUTRI_PASTE_NAME, "Medical Kits", "Allthemantium Ore", "Synthetic Cloth"];
          return (
              <div className="p-3 md:p-4 flex h-full gap-4 md:gap-6 max-w-full overflow-hidden">
                   {/* Mutant PC Chips Donation Box (Subdue Unrest) */}
                   <div className="w-56 flex flex-col shrink-0 overflow-y-auto custom-scrollbar bg-black/20 p-3 rounded-2xl border border-red-500/20">
                        <h3 className="text-red-400 font-scifi text-base mb-4 uppercase border-b border-red-500/40 pb-1.5">Subdue Unrest</h3>
                        <div className="flex-grow flex flex-col justify-between">
                            <div className="space-y-3">
                                <p className="text-xs text-gray-400 font-mono uppercase leading-tight">
                                    Donate PC Chips to satisfy the mutant crew's craving.
                                </p>
                                <div className="bg-slate-900/60 p-3 rounded-xl border border-gray-700 shadow-inner flex flex-col">
                                    <span className="text-gray-400 text-[10px] uppercase font-bold mb-1 tracking-widest">PC Chips Owned</span>
                                    <span className="text-white font-mono text-xl">{state.cargo["PC Chips"]?.quantity || 0}</span>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Quantity</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="Qty"
                                            className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700 text-sm font-bold text-center"
                                            value={donateChipsQty || ''}
                                            onChange={e => setDonateChipsQty(e.target.value)}
                                        />
                                        <button
                                            onClick={() => setDonateChipsQty((state.cargo["PC Chips"]?.quantity || 0).toString())}
                                            className="bg-gray-700 hover:bg-gray-600 px-3 rounded text-white font-black text-xs uppercase"
                                        >
                                            MAX
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <button
                                    onClick={() => {
                                        const qVal = parseInt(donateChipsQty);
                                        if (!isNaN(qVal) && qVal > 0) {
                                            handleDonateChips(qVal);
                                        }
                                    }}
                                    className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-2 rounded-xl text-sm uppercase transition-colors"
                                >
                                    Donate Chips
                                </button>
                                <p className="text-[10px] text-gray-400 italic mt-1.5 text-center">"Better than Peanuts!"</p>
                            </div>
                        </div>
                   </div>

                   <div className="w-56 flex flex-col shrink-0 overflow-y-auto custom-scrollbar bg-black/20 p-3 rounded-2xl border border-orange-500/20">
                        <h3 className="text-orange-400 font-scifi text-base mb-4 uppercase border-b border-orange-500/40 pb-1.5">Commodities</h3>
                        <div className="space-y-3">
                            {availResources.map(name => {
                                const qtyOwned = state.cargo[name]?.quantity || 0;
                                return (
                                    <div key={name} className="bg-slate-900/60 p-3 rounded-xl border border-gray-700 shadow-inner flex flex-col">
                                        <span className="text-gray-400 text-[10px] uppercase font-bold mb-1 tracking-widest">{name}</span>
                                        <span className="text-white font-mono text-xl">{qtyOwned}</span>
                                    </div>
                                );
                            })}
                        </div>
                   </div>

                   <div className="flex-grow flex flex-col overflow-y-auto custom-scrollbar">
                        {/* Top Header Row containing Title on the left and Mutant Unrest Box on the right */}
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4 shrink-0">
                            {/* F.O.M.O Title Block: Realigned to be physically between the "Commodities box" (left) and the "Mutant unrest" box (right) */}
                            <div className="text-left space-y-1">
                                <h2 className="text-3xl md:text-4xl font-scifi text-orange-400 uppercase tracking-tighter leading-none">F.O.M.O. Fabrication</h2>
                                <p className="text-orange-600 font-mono text-xs tracking-widest uppercase italic">Sector Efficiency Matrix</p>
                            </div>

                            {/* Mutant Unrest HUD Block on the right */}
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <div className="text-[10px] text-orange-600 font-mono text-right italic leading-tight uppercase opacity-70">
                                    SYSTEM LOG: FABRICATION MATRIX v.13.0.3 ACTIVE
                                </div>
                                <div className="bg-slate-950/90 border border-red-500/40 p-2.5 rounded-xl w-56 font-mono text-xs shadow-[0_0_15px_rgba(239,68,68,0.15)] flex flex-col gap-1 text-left">
                                    <div className="flex justify-between items-center text-red-400 font-bold tracking-wider">
                                        <span>👾 MUTANT UNREST</span>
                                        <span className="animate-pulse font-mono text-[10px]">{state.mutantUnrest || 10}%</span>
                                    </div>
                                    <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden border border-red-950">
                                        <div
                                            className={`h-full transition-all duration-300 ${(state.mutantUnrest || 10) >= 80 ? 'bg-red-500 animate-pulse' : ((state.mutantUnrest || 10) >= 50 ? 'bg-yellow-500' : 'bg-emerald-500')}`}
                                            style={{ width: `${state.mutantUnrest || 10}%` }}
                                        />
                                    </div>
                                    <div className="text-[9px] text-gray-500 uppercase tracking-tight flex justify-between mt-0.5">
                                        <span>Status:</span>
                                        <span className={state.isMutinyActive ? 'text-red-500 font-bold animate-pulse' : 'text-emerald-500'}>
                                            {state.isMutinyActive ? 'MUTINY ACTIVE' : 'PACIFIED'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* WARNING: Batch Limit Policy Enforced (moved above the fabrication boxes) */}
                        <div className="mb-4 text-center">
                            <span className="text-base md:text-lg text-orange-500 font-black uppercase tracking-[0.2em] animate-pulse">
                                WARNING: Batch Limit Policy Enforced.
                            </span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 w-full">
                            <div className="bg-slate-800/80 p-5 rounded-2xl border border-orange-500/30 flex flex-col justify-between hover:border-orange-500/60 transition-all shadow-xl min-h-[330px]">
                                <div className="space-y-3 mb-4">
                                    <h3 className="text-xl md:text-2xl font-bold text-white flex items-center"><Box className="mr-3 text-orange-400"/> {MESH_NAME}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">Advanced structural weaving for cargo expansion modules. Essential for ship upgrades.</p>
                                    <div className="bg-black/40 p-3 rounded-xl border border-orange-500/10 space-y-1">
                                        <div className="flex justify-between text-xs"><span className="text-gray-500 uppercase font-bold">Input A:</span><span className="text-white font-bold">1x {H2O_NAME}</span></div>
                                        <div className="flex justify-between text-xs"><span className="text-gray-500 uppercase font-bold">Input B:</span><span className="text-white font-bold">1x Allthemantium Ore</span></div>
                                        <div className="flex justify-between text-xs"><span className="text-gray-500 uppercase font-bold">Input C:</span><span className="text-white font-bold">1x Synthetic Cloth</span></div>
                                        <div className="flex justify-between text-sm pt-2 border-t border-gray-900 mt-2"><span className="text-gray-500 uppercase font-bold">Power Charge:</span><PriceDisplay value={2000} size="text-sm"/></div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    {/* Expanded quantity input for phase 4 values (10 digits + scroll room) */}
                                    <input type="number" placeholder="Qty" className="w-[190px] bg-gray-900 text-white text-center rounded-xl border border-gray-700 text-lg font-bold p-3" value={fomoQty || ''} onChange={e=>setFomoQty(e.target.value)} />
                                    <button onClick={()=>{
                                        const h2oAmt = state.cargo[H2O_NAME]?.quantity || 0;
                                        const oreAmt = state.cargo['Allthemantium Ore']?.quantity || 0;
                                        const clothAmt = state.cargo['Synthetic Cloth']?.quantity || 0;
                                        const cashMaxAmt = Math.floor(state.cash / 2000);
                                        const maxFab = Math.max(0, Math.min(h2oAmt, oreAmt, clothAmt, cashMaxAmt));
                                        setFomoQty(maxFab.toString());
                                    }} className="bg-gray-700 hover:bg-gray-600 px-4 rounded-xl text-white font-bold text-sm uppercase transition-colors">MAX</button>
                                    <button onClick={()=>{ const qVal = parseInt(fomoQty); if(!isNaN(qVal) && qVal>0) fabricateItem(qVal); }} disabled={state.fomoDailyUse.mesh} className="flex-grow bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 text-white font-black rounded-xl text-xl shadow-lg action-btn uppercase">{state.fomoDailyUse.mesh ? 'LOCKOUT' : 'FABRICATE'}</button>
                                </div>
                            </div>

                            <div className="bg-slate-800/80 p-5 rounded-2xl border border-orange-500/30 flex flex-col justify-between hover:border-orange-500/60 transition-all shadow-xl min-h-[330px]">
                                <div className="space-y-3 mb-4">
                                    <h3 className="text-xl md:text-2xl font-bold text-white flex items-center"><Pill className="mr-3 text-orange-400"/> Stim-Packs</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">Medical Grade adrenaline synthesizers. Highly valuable for biological trade hubs.</p>
                                    <div className="bg-black/40 p-3 rounded-xl border border-orange-500/10 space-y-1">
                                        <div className="flex justify-between text-xs"><span className="text-gray-500 uppercase font-bold">Input A:</span><span className="text-white font-bold">1x {H2O_NAME}</span></div>
                                        <div className="flex justify-between text-xs"><span className="text-gray-500 uppercase font-bold">Input B:</span><span className="text-white font-bold">2x {NUTRI_PASTE_NAME}</span></div>
                                        <div className="flex justify-between text-xs"><span className="text-gray-500 uppercase font-bold">Input C:</span><span className="text-white font-bold">1x Medical Kits</span></div>
                                        <div className="flex justify-between text-sm pt-2 border-t border-gray-900 mt-2"><span className="text-gray-500 uppercase font-bold">Process Fee:</span><PriceDisplay value={200} size="text-sm"/></div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    {/* Expanded quantity input for phase 4 values (10 digits + scroll room) */}
                                    <input type="number" placeholder="Qty" className="w-[190px] bg-gray-900 text-white text-center rounded-xl border border-gray-700 text-lg font-bold p-3" value={fomoStimQty || ''} onChange={e=>setFomoStimQty(e.target.value)} />
                                    <button onClick={()=>{
                                        const h2oAmt = state.cargo[H2O_NAME]?.quantity || 0;
                                        const pasteAmt = state.cargo[NUTRI_PASTE_NAME]?.quantity || 0;
                                        const kitsAmt = state.cargo['Medical Kits']?.quantity || 0;
                                        const cashMaxAmt = Math.floor(state.cash / 200);
                                        const maxFab = Math.max(0, Math.min(h2oAmt, Math.floor(pasteAmt/2), kitsAmt, cashMaxAmt));
                                        setFomoStimQty(maxFab.toString());
                                    }} className="bg-gray-700 hover:bg-gray-600 px-4 rounded-xl text-white font-bold text-sm uppercase transition-colors">MAX</button>
                                    <button onClick={()=>{ const qVal = parseInt(fomoStimQty); if(!isNaN(qVal) && qVal>0) fabricateStimPacks(qVal); }} disabled={state.fomoDailyUse.stims} className="flex-grow bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 text-white font-black rounded-xl text-xl shadow-lg action-btn uppercase">{state.fomoDailyUse.stims ? 'LOCKOUT' : 'SYNTHESIZE'}</button>
                                </div>
                            </div>
                        </div>

                        {/* Request Additional Fabrication Button */}
                        {/* Verified: This is the third request for this change (originally created in Enh. 159, styled in Enh. 161, and changed/verified as bright red here in Enh. 163) */}
                        <div className="mt-6 flex justify-center w-full">
                            <button
                                onClick={() => {
                                    SFX.play('alarm');
                                    const nw = getNetWorth(state);
                                    const isHS = state.highScores.length < 100 || nw > (state.highScores[state.highScores.length - 1]?.score || 0);
                                    const updatedAchievements = Array.from(new Set([...(state.achievements || []), 'death']));
                                    setState(prev => {
                                        if (!prev) return null;
                                        return { ...prev, gameOver: true, achievements: updatedAchievements };
                                    });
                                    setModal({
                                        type: 'endgame',
                                        data: {
                                            reason: " Like your former Partner, you were stupid enough to request additional work to be done for you by your Mutant workers. They don't seem to like being asked. Pretty sure given another chance you would have avoided being killed by them. R.I.P",
                                            netWorth: nw,
                                            stats: state.stats,
                                            isHighScore: isHS,
                                            days: state.day
                                        }
                                    });
                                }}
                                className="w-full md:w-2/3 bg-red-600 hover:bg-red-500 border-2 border-red-600 text-white font-black py-4 px-6 rounded-xl text-lg md:text-xl shadow-[0_0_30px_rgba(220,38,38,1)] transition-all uppercase tracking-wider action-btn animate-pulse"
                            >
                                Request Additional Fabrication per D.A.Y.
                            </button>
                        </div>
                   </div>
              </div>
          );
      }

      if (modal.type === 'banking') {
          return (
              <div className="p-4 md:p-8 h-full flex flex-col animate-in fade-in duration-300">
                  <div className="grid grid-cols-3 items-center mb-6 border-b border-gray-700 pb-4">
                    <h2 className="text-3xl font-scifi text-yellow-500 tracking-tighter">I.B.A.N.K. Hub</h2>
                    <div className="flex justify-center"><PriceDisplay value={state.cash} size="text-2xl" colored /></div>
                    <div className="text-right">
                        <div className="text-[10px] text-yellow-600 font-mono uppercase tracking-widest font-black">Node: Star-Bank-TX-34</div>
                        <div className="text-[10px] text-yellow-600 font-mono uppercase font-black">Status: Connected</div>
                    </div>
                  </div>

                  <div className="flex bg-slate-800/50 p-1 rounded-xl mb-4">
                    <button onClick={() => { setBankingTab('loans'); SFX.play('click'); }} className={`flex-1 px-6 py-2 rounded-lg font-bold text-xs uppercase transition-all ${bankingTab === 'loans' ? 'bg-yellow-600 text-white shadow-md' : 'text-gray-400 hover:bg-slate-700'}`}>Loans & Deposits</button>
                    <button onClick={() => { setBankingTab('stocks'); SFX.play('click'); }} className={`flex-1 px-6 py-2 rounded-lg font-bold text-xs uppercase transition-all ${bankingTab === 'stocks' ? 'bg-yellow-600 text-white shadow-md' : 'text-gray-400 hover:bg-slate-700'} flex items-center justify-center gap-1.5`}>
                      {state.gamePhase < 3 && <Lock size={12} className="text-gray-500" />}
                      Stock Market
                    </button>
                  </div>

                  {bankingTab === 'loans' && (
                    <div className="flex flex-col flex-grow overflow-y-auto custom-scrollbar space-y-6">
                       {/* Ransom demand placed ABOVE everything in the Loans tab */}
                       {state.isMutinyActive && (() => {
                             const pcChipsRequirement = state.mutinyPcChipsRequirement !== undefined ? state.mutinyPcChipsRequirement : (() => {
                                 const pcChipsQuantity = state.markets[state.currentVenueIndex]?.["PC Chips"]?.quantity || 0;
                                 return Math.floor((pcChipsQuantity * 0.22) / 5) * 5;
                             })();
                             const playerOwnedChips = state.cargo["PC Chips"]?.quantity || 0;
                             return (
                                 <div className="bg-red-900/20 p-6 rounded-2xl border border-red-500/30 animate-pulse">
                                     <h4 className="text-red-400 font-bold mb-4 text-lg uppercase tracking-tighter">Crew Demands</h4>
                                     <p className="text-red-200 text-sm mb-4">
                                         The crew demands a ransom of {formatCurrencyLog(50000)} and {pcChipsRequirement} PC Chips to unlock the F.O.M.O. and Upgrades decks.
                                     </p>
                                     <button onClick={() => {
                                         if (state.cash < 50000) return setModal({type:'message', data: "Insufficient funds to pay ransom."});
                                         if (playerOwnedChips < pcChipsRequirement) return setModal({type:'message', data: `Insufficient PC Chips in cargo hold to meet demands (Need ${pcChipsRequirement}).`});

                                         const newCargo = { ...state.cargo };
                                         let weightDeduction = 0;
                                         if (pcChipsRequirement > 0) {
                                             newCargo["PC Chips"].quantity -= pcChipsRequirement;
                                             weightDeduction = pcChipsRequirement * 0.01;
                                             if (newCargo["PC Chips"].quantity <= 0) {
                                                 delete newCargo["PC Chips"];
                                             }
                                         }

                                         setState(prev => prev ? ({
                                             ...prev,
                                             cash: prev.cash - 50000,
                                             cargo: newCargo,
                                             cargoWeight: Math.max(0, prev.cargoWeight - weightDeduction),
                                             isMutinyActive: false,
                                             survivedMutiny: true,
                                             mutantUnrest: 10,
                                             mutinyPcChipsRequirement: undefined
                                         }) : null);
                                         log(`MUTINY: Paid crew ransom ($50,000) and delivered ${pcChipsRequirement} PC Chips. F.O.M.O. & Upgrades unlocked.`, 'buy');
                                         SFX.play('success');
                                          setDismissedStrikeOverlay(false);
                                         setModal({
                                             type: 'message',
                                             data: `STRIKE RESOLVED: Paid crew ransom ($50,000) and delivered ${pcChipsRequirement} PC Chips. Demands fully pacified. Returning to Console.`
                                         });
                                     }} className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-3 rounded-xl text-lg uppercase">PAY RANSOM</button>
                                 </div>
                             );
                        })()}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                       <div className="space-y-6">
                           <h3 className="text-xl font-bold text-white flex items-center border-l-4 border-red-500 pl-4 uppercase tracking-widest">Liabilities</h3>
                           {state.activeLoans.length === 0 && <div className="p-8 border border-dashed border-gray-700 rounded-2xl text-gray-500 text-center italic">No outstanding credit.</div>}
                           {state.activeLoans.map((l, i) => {
                               const feeAmt = Math.round(l.principal * 0.02 * l.daysRemaining);
                               const totalRepayAmt = l.currentDebt + feeAmt;
                               return (
                                   <div key={l.id} className="bg-red-900/10 p-5 rounded-2xl border border-red-500/30 shadow-inner">
                                       <div className="flex justify-between items-center mb-4"><span className="text-white font-black text-xl">{l.firmName}</span><PriceDisplay value={l.currentDebt} size="text-xl" /></div>
                                       <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                           <div className="text-gray-400 uppercase tracking-widest text-[10px]">Time Remaining: <span className="text-white block text-sm font-bold">{l.daysRemaining} days</span></div>
                                           <div className="text-gray-400 uppercase tracking-widest text-[10px]">Early Settlement: <span className="text-orange-400 block text-sm font-bold"><PriceDisplay value={feeAmt} size="text-sm" compact/></span></div>
                                       </div>
                                       <button onClick={()=>{ if(state.cash < totalRepayAmt) { SFX.play('error'); return setModal({type:'message', data:`Insufficient funds. Need ${formatCurrencyLog(totalRepayAmt)}`}); } const newLoans=[...state.activeLoans]; newLoans.splice(i,1); setState(prev=>prev?({...prev, cash:prev.cash-totalRepayAmt, activeLoans:newLoans}):null); SFX.play('coin'); log(`LOAN: Repaid ${l.firmName} (${formatCurrencyLog(l.currentDebt)} + ${formatCurrencyLog(feeAmt)} fee)`, 'buy'); }} className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl transition-all shadow-md uppercase">SETTLE DEBT (<PriceDisplay value={totalRepayAmt} size="text-sm" compact/>)</button>
                                   </div>
                               );
                           })}
                           <div className="pt-6 border-t border-gray-800">
                               <h4 className="text-blue-400 font-bold mb-4 flex items-center text-lg uppercase"><Shield className="mr-2" size={20}/> Available Credit</h4>
                               <div className="space-y-3">
                                   {state.activeLoans.length >= 3 ? <div className="p-4 bg-red-900/20 rounded-xl text-red-400 italic text-center">Regulatory credit block: Maximum loan limit (3) reached.</div> : state.loanOffers.map((o,i)=>{ const alreadyOwe = state.activeLoans.some(l=>l.firmName===o.firmName); const dailyLimitHit = state.loanTakenToday; return (<div key={i} className={`bg-slate-800/50 p-4 rounded-xl flex justify-between items-center border border-transparent transition-all ${(alreadyOwe || dailyLimitHit) ? 'opacity-30' : 'hover:border-blue-500/50'}`}><div><div className="text-white font-bold text-lg">{o.firmName}</div><div className="text-gray-400 text-xs flex items-center"><PriceDisplay value={o.amount} size="text-xs mr-2"/> @ {o.interestRate.toFixed(1)}% APR</div></div><button onClick={()=>{ if(state.activeLoans.length>=3 || alreadyOwe || state.loanTakenToday) return; 
                                   // Fix: Corrected assignment of o.firmName (string) to loanEntry.firmName instead of o.amount (number)
                                   const loanEntry = {id:Date.now(), firmName:o.firmName, principal:o.amount, currentDebt:o.amount, interestRate:o.interestRate, daysRemaining:5, originalDay:state.day}; setState(prev=>prev?({...prev, cash:prev.cash+o.amount, activeLoans:[...prev.activeLoans, loanEntry], loanTakenToday:true}):null); SFX.play('coin'); log(`LOAN: Secured ${formatCurrencyLog(o.amount)} from ${o.firmName}`, 'buy'); setModal({ type: 'banking_transaction_success', data: { message: `Successfully secured loan of ${formatCurrencyLog(o.amount)}` } }); }} disabled={alreadyOwe || dailyLimitHit} className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white px-6 py-2 rounded-xl font-black uppercase text-xs transition-all">DRAW FUNDS</button></div>);})}
                               </div>
                           </div>
                       </div>
                       <div className="space-y-6">
                           <h3 className="text-xl font-bold text-white flex items-center border-l-4 border-green-500 pl-4 uppercase tracking-widest">Capital Growth</h3>
                           {state.investments.length > 0 && (<div className="space-y-3">{state.investments.map(inv => (<div key={inv.id} className="bg-green-900/10 border border-green-500/30 p-5 rounded-2xl flex justify-between items-center shadow-inner animate-pulse"><div className="text-sm"><span className="text-gray-400 block uppercase text-[9px] tracking-widest font-black">Mature In</span><span className="text-green-400 font-black text-xl">{inv.daysRemaining} D.A.Y.s</span></div><div className="text-right"><span className="text-gray-400 block uppercase text-[9px] tracking-widest font-black">Value</span><PriceDisplay value={inv.maturityValue} size="text-xl"/></div></div>))}</div>)}

                           <div className="bg-slate-800/80 p-8 rounded-3xl border border-green-500/20 shadow-xl">
                               <h4 className="text-green-400 font-bold mb-6 text-lg uppercase tracking-tighter">New Term Deposit (CD)</h4>
                               <div className="flex flex-col gap-6 mb-8">
                                   <div className="space-y-2">
                                       <label className="text-[10px] text-gray-500 uppercase tracking-widest ml-1 font-black">Principal Investment</label>
                                       <div className="flex gap-3">
                                           {/* Expanded quantity input for phase 4 values (10 digits + scroll room) */}
                                           <input type="number" value={bankInvestAmount || ''} onChange={(e) => setBankInvestAmount(e.target.value)} min="1" placeholder="Amount..." className="flex-grow min-w-[180px] bg-gray-900 text-white p-4 rounded-xl border border-gray-700 focus:border-green-500 outline-none transition-all text-xl font-mono" />
                                           <button onClick={() => setBankInvestAmount(Math.floor(Math.max(0, state.cash)).toString())} className="bg-gray-700 hover:bg-gray-600 px-6 rounded-xl text-white font-black text-xs uppercase border border-gray-600 transition-all shadow-md">MAX</button>
                                       </div>
                                   </div>
                                   <div className="space-y-2">
                                       <label className="text-[10px] text-gray-500 uppercase tracking-widest ml-1 font-black">Maturity Window</label>
                                       <select value={bankInvestTerm || '1'} onChange={(e) => setBankInvestTerm(e.target.value)} className="w-full bg-gray-900 text-white p-4 rounded-xl border border-gray-700 focus:border-green-500 outline-none transition-all text-lg font-mono">
                                          <option value="1">1 D.A.Y. (5% Yield)</option>
                                          <option value="2">2 D.A.Y.s (20% Yield)</option>
                                          <option value="3">3 D.A.Y.s (50% Yield)</option>
                                       </select>
                                   </div>
                               </div>
                               <button onClick={()=>{ if(state.activeLoans.length > 0) { SFX.play('error'); return setModal({type:'message', data:"Regulatory Block: Capital deposits are prohibited while holding active liabilities."}); } const amtVal = parseInt(bankInvestAmount); const termVal = parseInt(bankInvestTerm); if(isNaN(amtVal) || amtVal<=0 || state.cash<amtVal) { SFX.play('error'); return; } const ratesDict: any = {1:0.05, 2:0.20, 3:0.50}; const rateVal = ratesDict[termVal]; const matVal = Math.floor(amtVal * (1 + rateVal)); const invEntry = {id:Date.now(), amount:amtVal, daysRemaining:termVal, maturityValue:matVal, interestRate:rateVal}; setState(prev=>prev?({...prev, cash:prev.cash-amtVal, investments:[...prev.investments, invEntry]}):null); setBankInvestAmount(''); SFX.play('coin'); log(`INVESTMENT: Locked ${formatCurrencyLog(amtVal)} for ${termVal} days.`, 'investment'); setModal({ type: 'banking_transaction_success', data: { message: `Successfully deposited ${formatCurrencyLog(amtVal)}` } }); }} className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-5 rounded-2xl text-2xl transition-all shadow-lg shadow-green-900/20 action-btn uppercase">INITIATE LOCKUP</button>
                               <p className="text-[9px] text-gray-500 text-center mt-4 italic uppercase tracking-widest opacity-60">All fixed-term investments are non-liquid until settlement day.</p>
                           </div>
                       </div>
                   </div>
                  </div>
                  )}

                  {bankingTab === 'stocks' && (
                    <div className="flex flex-col h-full relative">
                      {state.gamePhase < 3 && (
                        <div className="absolute inset-0 bg-slate-950/80 z-50 flex flex-col items-center justify-center p-8 rounded-3xl text-center border border-slate-700">
                          <Lock size={48} className="text-yellow-500 mb-4 animate-bounce" />
                          <h3 className="text-2xl font-scifi text-yellow-500 mb-2 uppercase">Stock Market Locked</h3>
                          <p className="text-gray-400 font-mono text-sm max-w-md uppercase tracking-tight">Access to the Galactic Stock Exchange requires a Phase 3 trading license. Achieve your Phase 2 net worth goals to unlock stock trading.</p>
                        </div>
                      )}

                      {/* 1-Line Real-Time Retro LED Marquee Ticker (Enhancement 135) */}
                      <div className="shrink-0 mb-4 led-ticker-container">
                          <div className="led-ticker-text">
                              {getTickerText()}
                          </div>
                      </div>
                      <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 pb-16">
                        <div className="grid grid-cols-1 gap-8">
                          <div className="bg-slate-800/80 p-4 rounded-xl border border-yellow-700/50 shadow-lg">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-yellow-400 font-bold flex items-center text-lg"><Trophy size={20} className="mr-2"/> Daily Jackpot</h3>
                              <PriceDisplay value={state.jackpot ? state.jackpot * 10 : 0} size="text-2xl" />
                            </div>
                            <p className="text-xs text-gray-400 mb-2">2.2% of every transaction is added to the jackpot. You have a 22% chance to win 10x the pool each day you trade stocks.</p>
                            <div className="border-t border-slate-700/60 mt-3 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 text-xs">
                              <span className="text-gray-400 uppercase tracking-wider font-bold">Total Galaxy Corporate Shares Outstanding (Held Universally):</span>
                              <span className="text-cyan-400 font-mono font-black text-sm">{(state.stocks?.reduce((acc, stock) => acc + (stock.totalShares || 0), 0) || 0).toLocaleString()} shares</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                            {state.stocks?.map(stock => {
                              const profitLoss = stock.quantity > 0 && stock.averageCost ? (stock.price - stock.averageCost) * stock.quantity : 0;
                              return (
                              <div key={stock.name} className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700 relative">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-black text-lg">{stock.name}</span>
                                    {/* Inline Stock Trend Sparkline */}
                                    {stock.history && stock.history.length > 1 && (
                                      <span className="w-12 h-6 flex items-center inline-block" title="Individual Stock Price Trend Pattern">
                                        <svg viewBox="0 0 100 50" className="w-full h-full">
                                          <polyline
                                            fill="none"
                                            stroke={stock.price >= (stock.history[stock.history.length - 2] || stock.price) ? "#22c55e" : "#ef4444"}
                                            strokeWidth="4"
                                            points={
                                              stock.history.slice(-5).map((price, i, arr) => {
                                                const x = (i / (arr.length - 1)) * 100;
                                                const max = Math.max(...arr);
                                                const min = Math.min(...arr);
                                                const range = max - min || 1;
                                                const y = 45 - ((price - min) / range) * 40;
                                                return `${x},${y}`;
                                              }).join(' ')
                                            }
                                          />
                                        </svg>
                                      </span>
                                    )}
                                  </div>
                                  <PriceDisplay value={stock.price} size="text-lg"/>
                                </div>
                                <div className="text-sm text-gray-400 mb-1">Risk: <span className={`font-bold ${stock.risk === 'high' ? 'text-red-500' : stock.risk === 'medium' ? 'text-yellow-500' : 'text-green-500'}`}>{stock.risk}</span></div>
                                <div className="text-sm text-gray-400 mb-1">Owned: {stock.quantity}</div>
                                <div className="text-sm text-gray-400 mb-1">Global Total Shares: {stock.totalShares?.toLocaleString() ?? "N/A"}</div>
                                <div className="text-sm text-gray-400 mb-4">Market Float Available: {stock.availableQuantity?.toLocaleString() ?? "N/A"}</div>
                                {stock.quantity > 0 && (
                                    <div className="text-sm text-gray-400 mb-4">P/L: <PriceDisplay value={profitLoss} colored size="text-sm" /></div>
                                  )}
                                <div className="flex flex-col space-y-2">
                                  <div className="flex space-x-1 items-center bg-gray-900/50 p-1 rounded">
                                    {/* Expanded quantity input for phase 4 values (10 digits + scroll room) */}
                                    <input type="number" min="0" placeholder="Qty" disabled={state.gamePhase < 3} className="w-[170px] bg-gray-800 text-white text-center rounded border border-gray-600 text-sm p-1.5 disabled:opacity-50" value={stockBuyQuantities[stock.name]||''} onChange={e=>setStockBuyQuantities({...stockBuyQuantities, [stock.name]: e.target.value})} />
                                    <button disabled={state.gamePhase < 3} onClick={() => {
                                      const maxAffordable = Math.floor((state.cash * 0.9) / stock.price);
                                      const maxBuy = Math.min(stock.availableQuantity ?? 0, maxAffordable);
                                      setStockBuyQuantities({...stockBuyQuantities, [stock.name]: Math.max(0, maxBuy).toString()});
                                    }} className="w-auto px-4 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded font-bold py-1 disabled:opacity-50">MAX</button>
                                    <button disabled={state.gamePhase < 3} onClick={() => handleBuyStock(stock.name)} className="w-auto px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded font-bold py-1 action-btn disabled:opacity-50">BUY</button>
                                  </div>
                                  <div className="flex space-x-1 items-center bg-gray-900/50 p-1 rounded">
                                    {/* Expanded quantity input for phase 4 values (10 digits + scroll room) */}
                                    <input type="number" min="0" placeholder="Qty" disabled={state.gamePhase < 3} className="w-[170px] bg-gray-800 text-white text-center rounded border border-gray-600 text-sm p-1.5 disabled:opacity-50" value={stockSellQuantities[stock.name]||''} onChange={e=>setStockSellQuantities({...stockSellQuantities, [stock.name]: e.target.value})} />
                                    <button disabled={state.gamePhase < 3} onClick={() => setStockSellQuantities({...stockSellQuantities, [stock.name]: stock.quantity.toString()})} className="w-auto px-4 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded font-bold py-1 disabled:opacity-50">MAX</button>
                                    <button disabled={state.gamePhase < 3} onClick={() => handleSellStock(stock.name)} className="w-auto px-4 bg-green-700 hover:bg-green-600 text-white text-sm rounded font-bold py-1 action-btn disabled:opacity-50">SELL</button>
                                  </div>
                                  {stock.takeoverSuccessful ? (
                                    <div className="pt-2 border-t border-slate-700/60 mt-2 text-center">
                                      <div className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                        ✅ Takeover Successful
                                      </div>
                                    </div>
                                  ) : stock.quantity >= (stock.totalShares || 100000) * 0.5 ? (
                                    <div className="pt-2 border-t border-slate-700/60 mt-2">
                                      <button
                                        onClick={() => {
                                          SFX.play('click');
                                          setModal({ type: 'hostile_takeover_confirm', data: stock });
                                        }}
                                        className="w-full bg-gradient-to-r from-red-600 via-yellow-600 to-cyan-600 hover:from-red-500 hover:to-cyan-500 text-white font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse"
                                      >
                                        ⚡ Attempt Takeover ⚡
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            )})}
                          </div>
                          <div className="h-24"></div> {/* Spacer for scroll room */}
                        </div>
                      </div>
                    </div>
                  )}
              </div>
          );
      }

      if (modal.type === 'comms') {
          return (
              <div className="flex flex-col h-full bg-black/40 animate-in fade-in duration-300">
                  <div className="p-4 border-b border-gray-700 flex justify-between items-center"><h2 className="text-xl font-scifi text-cyan-400">G.I.G.O. Comms Array</h2><span className="text-[10px] text-cyan-800 font-mono uppercase animate-pulse">Signal: Strong</span></div>
                  <div className="flex-grow overflow-y-auto p-6 font-mono text-base md:text-lg custom-scrollbar space-y-2" ref={commsContainerRef}>
                      {state.messages.slice().reverse().map((msg) => (<div key={msg.id} className={`p-2 border-b border-gray-800/30 ${getLogColorClass(msg.type)}`}><span className="opacity-30 mr-4 font-black">[{new Date(msg.id).toLocaleTimeString()}]</span>{renderLogMessage(msg.message)}</div>))}
                      {state.messages.length === 0 && <div className="text-gray-700 italic text-center py-20">Monitoring frequencies...</div>}
                  </div>
              </div>
          );
      }

      if (modal.type === 'shipping') {
          return (
              <div className="flex flex-col h-full p-4 md:p-6 space-y-4 overflow-hidden animate-in slide-in-from-right-4 duration-300">
                   <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-gray-700 pb-4">
                       <h2 className="text-2xl font-scifi text-blue-500 uppercase tracking-widest">Void-Ex Logistics</h2>
                       <div className="flex-grow flex justify-center"><PriceDisplay value={state.cash} size="text-2xl" colored /></div>
                       <div className="flex bg-slate-800/50 p-1 rounded-xl">
                           <button onClick={()=>{setLogisticsTab('contracts'); SFX.play('click');}} className={`px-6 py-2 rounded-lg font-bold text-xs uppercase transition-all ${logisticsTab==='contracts'?'bg-blue-600 text-white shadow-md':'text-gray-400 hover:bg-slate-700'}`}>Contracts</button>
                           <button onClick={()=>{setLogisticsTab('shipping'); SFX.play('click');}} className={`px-6 py-2 rounded-lg font-bold text-xs uppercase transition-all ${logisticsTab==='shipping'?'bg-blue-600 text-white shadow-md':'text-gray-400 hover:bg-slate-700'}`}>Shipping</button>
                           <button onClick={()=>{setLogisticsTab('warehouse'); SFX.play('click');}} className={`px-6 py-2 rounded-lg font-bold text-xs uppercase transition-all ${logisticsTab==='warehouse'?'bg-blue-600 text-white shadow-md':'text-gray-400 hover:bg-slate-700'}`}>Storage</button>
                       </div>
                   </div>

                   <div className="flex-grow overflow-y-auto custom-scrollbar pr-2" ref={logisticsTab === 'shipping' ? commsContainerRef : undefined}>
                       {logisticsTab === 'contracts' && (
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                               <div>
                                   <h3 className="text-white font-bold mb-4 uppercase tracking-widest text-sm border-l-2 border-blue-500 pl-4">Sector Board</h3>
                                   {state.availableContracts.length === 0 && <div className="p-10 border border-dashed border-gray-700 rounded-3xl text-gray-500 text-center italic">No tenders found.</div>}
                                   {state.availableContracts.map(c => {
                                       const isBanned = state.venueTradeBans[c.destinationIndex] > 0;
                                       return (
                                           <div key={c.id} className={`bg-slate-800/60 p-5 rounded-2xl mb-3 border border-slate-700 transition-all hover:border-blue-500/50 ${isBanned?'opacity-30' : ''}`}>
                                               <div className="flex justify-between items-start mb-2"><span className="text-white font-black text-lg">{c.firm}</span><PriceDisplay value={c.reward} size="text-lg"/></div>
                                               <div className="text-sm text-gray-400 mb-4">Deliver <span className="text-white font-black">{c.quantity} {c.commodity}</span> to <span className="text-blue-300 font-bold">{VENUES[c.destinationIndex]}</span>. <br/>Window: <span className="text-white">{c.daysRemaining} Days</span>.</div>
                                               <div className="flex justify-between items-center"><span className="text-[10px] text-red-400 font-mono uppercase font-bold">Penalty: <PriceDisplay value={c.penalty} size="text-[10px]"/></span><button onClick={() => acceptContract(c)} disabled={isBanned} className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white px-8 py-2 rounded-lg font-bold shadow-md transition-all">SIGN</button></div>
                                           </div>
                                       );
                                   })}
                               </div>
                               <div>
                                   <h3 className="text-white font-bold mb-4 uppercase tracking-widest text-sm border-l-2 border-blue-500 pl-4">
                                       Active Operations ({state.activeContracts.filter(c => c.status === 'active').length})
                                   </h3>
                                   {state.activeContracts.filter(c => c.status === 'active').length === 0 && <div className="p-10 border border-dashed border-gray-700 rounded-3xl text-gray-500 text-center italic">No active contracts.</div>}
                                   {state.activeContracts.filter(c => c.status === 'active').map(c => {
                                       const wh = state.warehouse[c.destinationIndex];
                                       const hasItems = wh && wh[c.commodity] && wh[c.commodity].quantity >= c.quantity;
                                       const isReady = c.status === 'active' && hasItems && wh[c.commodity].arrivalDay <= state.day;
                                       
                                       return (
                                           <div key={c.id} className={`p-5 rounded-2xl mb-3 border shadow-inner transition-all ${c.status === 'completed' ? 'bg-emerald-900/40 border-emerald-500' : (c.status === 'failed' ? 'bg-red-900/40 border-red-500' : (isReady ? 'bg-purple-900/40 border-purple-500 animate-in fade-in zoom-in-95' : 'bg-blue-900/10 border-blue-500/50'))}`}>
                                               <div className="flex justify-between items-center mb-2">
                                                   <span className="text-white font-black">{c.firm}</span>
                                                   <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-tighter ${c.status === 'completed' ? 'bg-emerald-600 text-white' : (c.status === 'failed' ? 'bg-red-600 text-white' : (isReady ? 'bg-purple-600 text-white animate-pulse' : 'bg-blue-500 text-white'))}`}>
                                                       {c.status === 'completed' ? 'COMPLETED' : (c.status === 'failed' ? 'FAILED' : `${c.daysRemaining} Left`)}
                                                   </span>
                                               </div>
                                               <div className="text-sm text-gray-300">Deliver {c.quantity} {c.commodity} to {VENUES[c.destinationIndex]}</div>
                                               <div className={`mt-4 p-3 rounded-xl text-xs font-mono ${isReady ? 'bg-purple-950/40 border border-purple-500/30' : 'bg-black/40'}`}>
                                                   {c.status === 'completed' ? (
                                                       <span className="text-emerald-400 font-black">SETTLEMENT FINALIZED: {formatCurrencyLog(c.reward)} REWARD CREDITED</span>
                                                   ) : c.status === 'failed' ? (
                                                       <span className="text-red-400 font-black">BREACH: {formatCurrencyLog(c.penalty)} PENALTY</span>
                                                   ) : isReady ? (
                                                       <div className="flex justify-between items-center">
                                                           <span className="text-purple-300 font-black">READY TO FULFILL</span>
                                                           <button onClick={() => settleContract(c)} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-black text-[10px] uppercase">SETTLE</button>
                                                       </div>
                                                   ) : (
                                                       <div className="flex flex-col gap-2">
                                                           {hasItems ? (
                                                               <span className="text-yellow-400">STATUS: Transit...</span>
                                                           ) : (
                                                               <span className="text-red-400">STATUS: Pending arrival...</span>
                                                           )}
                                                           {state.cargo[c.commodity] && state.cargo[c.commodity].quantity >= c.quantity && (
                                                               <div className="flex justify-between items-center bg-purple-950/20 p-2 rounded border border-purple-500/30 mt-2">
                                                                   <span className="text-purple-300 font-bold">CARGO ON HAND</span>
                                                                   <button onClick={() => handleFulfill(c)} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-black text-[10px] uppercase">FULFILL</button>
                                                               </div>
                                                           )}
                                                       </div>
                                                   )}
                                               </div>
                                           </div>
                                       );
                                   })}
                               </div>
                           </div>
                       )}

                       {logisticsTab === 'shipping' && (
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                               <div>
                                   <h3 className="text-white font-bold mb-4 uppercase tracking-widest text-sm border-l-2 border-blue-500 pl-4">Local Assets</h3>
                                   <div className="space-y-3" ref={localAssetsScrollRef}>
                                     {Object.entries(state.cargo).filter(([name, item]) => !(stagedContract && stagedContract.commodity === name))
                                     .sort(([nameA], [nameB]) => {
                                        if (shippingPriorityItem) {
                                            if (nameA === shippingPriorityItem) return -1;
                                            if (nameB === shippingPriorityItem) return 1;
                                        }
                                        return nameA.localeCompare(nameB);
                                     })
                                     .map(([name, item]: [string, CargoItem]) => {
                                           const isSelected = highlightShippingItem === name && !shippingSource[name]?.type;
                                           const qtyValStr = shippingQuantities[name] || '';
                                           const destValStr = shippingDestinations[name] || '';
                                           const methodValStr = shippingTiers[name] || 'fast'; 

                                           return (
                                               <div key={name} className={`p-5 rounded-2xl border transition-all ${isSelected ? 'border-blue-500 bg-blue-900/20 shadow-2xl' : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'}`}>
                                                  <div className="flex justify-between items-center mb-4">
                                                      <div className="flex items-center gap-2">
                                                        <span className="text-white font-black text-lg">{name}</span>
                                                        <button onClick={() => showCommodityIntel(name)} className="text-[10px] bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-cyan-300 px-2 py-1 rounded font-black shrink-0">INTEL</button>
                                                      </div>
                                                      <span className="text-[10px] text-gray-500 font-mono uppercase">Avail: {item.quantity}</span>
                                                   </div>
                                                   <div className="grid grid-cols-3 gap-3 mb-4">
                                                       {/* Expanded quantity input for phase 4 values (10 digits + scroll room) */}
                                                       <input type="number" placeholder="Qty" className="min-w-[170px] bg-gray-900 text-white p-3 rounded-xl border border-gray-700 text-lg font-bold outline-none col-span-1" value={qtyValStr || ''} onChange={e=>setShippingQuantities({...shippingQuantities, [name]:e.target.value})} />
                                                       <button onClick={()=>setShippingQuantities({...shippingQuantities, [name]: item.quantity.toString()})} className="bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors">ALL</button>
                                                       <select className="bg-gray-900 text-white p-3 rounded-xl border border-gray-700 font-bold outline-none col-span-1" value={destValStr || ''} onChange={e=>setShippingDestinations({...shippingDestinations, [name]:e.target.value})}>
                                                           <option value="">Dest...</option>
                                                           {VENUES.map((v,i)=>(i!==state.currentVenueIndex ? <option key={i} value={i}>{v}</option> : null))}
                                                       </select>
                                                   </div>
                                                   <div className="flex gap-3 mb-4">
                                                       <select className="flex-grow bg-gray-900 text-white p-3 rounded-xl border border-gray-700 font-bold outline-none text-sm" value={methodValStr} onChange={e=>setShippingTiers({...shippingTiers, [name]:e.target.value})}>
                                                           <option value="fast">EXPRESS (1 Day, 100/T)</option>
                                                           <option value="standard">STANDARD (2 Days, 50/T)</option>
                                                           <option value="slow">FREIGHT (3 Days, 20/T)</option>
                                                       </select>
                                                   </div>
                                                   <button
                                                        disabled={!qtyValStr || parseInt(qtyValStr) <= 0 || !destValStr || item.quantity === 0}
                                                        onClick={() => {
                                                                const qtyInt = parseInt(qtyValStr);
                                                                const destInt = parseInt(destValStr);
                                                                if (isNaN(qtyInt) || qtyInt <= 0 || isNaN(destInt)) return;
                                                                const unitCostAmt = methodValStr === 'fast' ? 100 : (methodValStr === 'standard' ? 50 : 20);
                                                                const durationDays = methodValStr === 'fast' ? 1 : (methodValStr === 'standard' ? 2 : 3);
                                                                const cData = COMMODITIES.find(x => x.name === name)!;
                                                                const totalWeightVal = qtyInt * cData.unitWeight;
                                                                const costVal = Math.ceil(totalWeightVal * unitCostAmt);
                                                                if (item.quantity < qtyInt) return;
                                                                if (state.cash < costVal) { SFX.play('error'); return setModal({ type: 'message', data: "Insufficient funds for logistics." }); }
                                                                const newCargoDict = { ...state.cargo };
                                                                newCargoDict[name].quantity -= qtyInt;
                                                                if (newCargoDict[name].quantity <= 0) delete newCargoDict[name];
                                                                const newWarehouseDict: Warehouse = { ...state.warehouse };
                                                                if (!newWarehouseDict[destInt]) newWarehouseDict[destInt] = {};
                                                                const existingWare = newWarehouseDict[destInt][name];
                                                                let newArrivalDay = state.day + durationDays;
                                                                let newAvgCostVal = item.averageCost;
                                                                let newQtyVal = qtyInt;
                                                                if (existingWare) { newArrivalDay = Math.max(existingWare.arrivalDay, newArrivalDay); newAvgCostVal = ((existingWare.quantity * existingWare.originalAvgCost) + (qtyInt * item.averageCost)) / (existingWare.quantity + qtyInt); newQtyVal += existingWare.quantity; }
                                                                newWarehouseDict[destInt][name] = { quantity: newQtyVal, originalAvgCost: newAvgCostVal, arrivalDay: newArrivalDay };
                                                                setState(prev => prev ? ({ ...prev, cash: prev.cash - costVal, cargo: newCargoDict, cargoWeight: prev.cargoWeight - totalWeightVal, warehouse: newWarehouseDict }) : null);
                                                                setShippingQuantities({ ...shippingQuantities, [name]: '' }); setHighlightShippingItem(null); SFX.play('warp');
                                                                setModal({ type: 'none', data: null }); // Direct Return to Console in v10.4.4
                                                            }} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg action-btn uppercase font-scifi disabled:bg-gray-700 disabled:opacity-50">SHIP</button>
                                               </div>
                                           );
                                       })}
                                   </div>
                               </div>
                               <div>
                                   <h3 className="text-white font-bold mb-4 uppercase tracking-widest text-sm border-l-2 border-purple-500 pl-4">Queue</h3>
                                   <div className="space-y-4">
                                       {stagedContract && (() => {
                                           const nameVal = stagedContract.commodity;
                                           const qtyInt = stagedContract.quantity;
                                           const destInt = stagedContract.destinationIndex;
                                           const itemOwned = state.cargo[nameVal];
                                           const hasEnoughStock = itemOwned && itemOwned.quantity >= qtyInt;

                                           return (
                                               <div className={`p-5 rounded-2xl border-2 shadow-xl animate-in zoom-in-95 transition-all ${hasEnoughStock ? 'border-purple-500 bg-purple-900/60' : 'border-red-900/50 bg-red-950/10 opacity-70'}`}>
                                                   <div className="flex justify-between items-center mb-2">
                                                       <span className="text-white font-black text-lg uppercase">Staged Fulfillment</span>
                                                       <button onClick={() => setStagedContract(null)} className="text-red-400 hover:text-red-300"><XCircle size={18}/></button>
                                                   </div>
                                                   <div className="text-xs text-purple-100 mb-6 bg-purple-950/40 p-4 rounded-xl border border-purple-400/30 font-mono leading-relaxed">
                                                       Deliver <span className="font-black text-white">{stagedContract.quantity} {stagedContract.commodity}</span> to <span className="font-black text-white">{VENUES[stagedContract.destinationIndex]}</span>.
                                                       {!hasEnoughStock && (
                                                           <div className="text-red-400 font-bold font-mono text-[10px] mt-2 uppercase tracking-wide flex items-center gap-1 animate-pulse">
                                                               ⚠ Insufficient stock on hand to fulfill (Need {stagedContract.quantity}, have {itemOwned?.quantity || 0})
                                                           </div>
                                                       )}
                                                   </div>
                                                   <button
                                                       disabled={!hasEnoughStock}
                                                       onClick={() => {
                                                           if (!itemOwned || itemOwned.quantity < qtyInt) return setModal({type:'message', data: `Insufficient ${nameVal}.`});

                                                           const cData = COMMODITIES.find(x=>x.name===nameVal)!;
                                                           const totalWeightVal = qtyInt * cData.unitWeight;

                                                           const newCargoDict = {...state.cargo};
                                                           newCargoDict[nameVal].quantity -= qtyInt;
                                                           if(newCargoDict[nameVal].quantity<=0) delete newCargoDict[nameVal];

                                                           // Directly complete the contract and award the cash immediately with no shipping fee!
                                                           const newActive = state.activeContracts.map(ac => {
                                                               if (ac.id === stagedContract.id) return { ...ac, status: 'completed' as const, dayCompleted: state.day };
                                                               return ac;
                                                           });

                                                           setState(prev => prev ? ({
                                                               ...prev,
                                                               cash: prev.cash + stagedContract.reward,
                                                               cargo: newCargoDict,
                                                               cargoWeight: Math.max(0, prev.cargoWeight - totalWeightVal),
                                                               activeContracts: newActive,
                                                               stats: { ...prev.stats, largestSingleWin: Math.max(prev.stats.largestSingleWin, stagedContract.reward) }
                                                           }) : null);

                                                           setStagedContract(null);
                                                           setHighlightShippingItem(null);
                                                           SFX.play('kaching');
                                                           setTimeout(() => SFX.play('kaching'), 150);
                                                           const fulfillmentMsg = `CONTRACT: Direct fulfillment of ${stagedContract.firm} contract from Queue. Reward: ${formatCurrencyLog(stagedContract.reward)}`;
                                                           log(fulfillmentMsg, 'profit');
                                                           speakRetro(`The contract for ${stagedContract.firm} has been completed and fully fulfilled directly. Capital reward received.`);
                                                       }}
                                                       className={`w-full font-black py-5 rounded-2xl shadow-xl uppercase action-btn transition-all ${hasEnoughStock ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-gray-800 border border-gray-700 text-gray-500 cursor-not-allowed opacity-50'}`}
                                                   >
                                                       {hasEnoughStock ? "Fulfill contract" : "Insufficient Stock"}
                                                   </button>
                                               </div>
                                           );
                                       })()}
                                       {(() => {
                                           const remoteItemSourceName = Object.keys(shippingSource).find(name => shippingSource[name]?.type === 'warehouse');
                                           if (!remoteItemSourceName || !state) return null;

                                           const sourceInfo = shippingSource[remoteItemSourceName];
                                           const whItem = state.warehouse[sourceInfo.venueIdx]?.[remoteItemSourceName];
                                           if (!whItem) return null;

                                           const name = remoteItemSourceName;
                                           const vIdx = sourceInfo.venueIdx;

                                           const destValStr = shippingDestinations[name] || '';
                                           const methodValStr = shippingTiers[name] || 'fast';
                                           const destInt = parseInt(destValStr);
                                           const sellPrice = state.markets[vIdx][name].price;
                                           const forwardPrice = !isNaN(destInt) ? state.markets[destInt][name].price : 0;
                                           const qtyInt = parseInt(shippingQuantities[name] || '0');
                                           const potentialProfit = !isNaN(qtyInt) && qtyInt > 0 ? (forwardPrice - sellPrice) * qtyInt : 0;

                                           return (
                                               <div className="p-5 rounded-2xl border-2 border-purple-500 bg-purple-900/60 shadow-xl animate-pulse">
                                                   <div className="flex justify-between items-center mb-2">
                                                   <div className="flex items-center gap-2">
                                                       <span className="text-white font-black text-lg uppercase">Remote Hub Op</span>
                                                           <button onClick={() => showCommodityIntel(name)} className="text-[10px] bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-cyan-300 px-2 py-1 rounded font-black shrink-0">INTEL</button>
                                                      </div>
                                                       <button onClick={() => {
                                                           setShippingSource({});
                                                           setHighlightShippingItem(null);
                                                           setShippingQuantities({});
                                                       }} className="text-red-400 hover:text-red-300"><XCircle size={18}/></button>
                                                   </div>
                                                   <div className="text-xs text-purple-100 mb-6 bg-purple-950/40 p-4 rounded-xl border border-purple-400/30 font-mono leading-relaxed">
                                                       Staged <span className="font-black text-white">{whItem.quantity} {name}</span> from <span className="font-black text-white">{VENUES[vIdx]}</span>.
                                                   </div>

                                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                                        {/* Expanded quantity input for phase 4 values (10 digits + scroll room) */}
                                                        <input type="number" placeholder="Qty" className="min-w-[170px] bg-gray-900 text-white p-3 rounded-xl border border-gray-700 text-lg font-bold outline-none col-span-2" value={shippingQuantities[name] || ''} onChange={e=>setShippingQuantities({...shippingQuantities, [name]:e.target.value})} />
                                                        <button onClick={()=>setShippingQuantities({...shippingQuantities, [name]: whItem.quantity.toString()})} className="bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors">MAX</button>
                                                    </div>

                                                   <select className="w-full bg-gray-900 text-white p-3 rounded-xl border border-gray-700 font-bold outline-none col-span-1 mb-4" value={destValStr || ''} onChange={e=>setShippingDestinations({...shippingDestinations, [name]:e.target.value})}>
                                                       <option value="">Select Destination...</option>
                                                       {VENUES.map((v,i)=>(i !== vIdx ? <option key={i} value={i}>{v}</option> : null))}
                                                   </select>

                                                   <select className="w-full flex-grow bg-gray-900 text-white p-3 rounded-xl border border-gray-700 font-bold outline-none text-sm mb-4" value={methodValStr} onChange={e=>setShippingTiers({...shippingTiers, [name]:e.target.value})}>
                                                       <option value="fast">EXPRESS (1 Day, 100/T)</option>
                                                       <option value="standard">STANDARD (2 Days, 50/T)</option>
                                                       <option value="slow">FREIGHT (3 Days, 20/T)</option>
                                                   </select>

                                                   {destValStr && qtyInt > 0 && (
                                                        <div className="text-center mb-4 p-3 bg-black/30 rounded-lg">
                                                            <div className="text-[10px] uppercase font-bold text-gray-400">Potential Profit vs. Local Sale</div>
                                                            <PriceDisplay value={potentialProfit} colored size="text-lg" />
                                                        </div>
                                                    )}

                                                   <div className="grid grid-cols-2 gap-3">
                                                       <button onClick={() => {
                                                            const qtyInt = parseInt(shippingQuantities[name] || '0');
                                                            if (qtyInt <= 0 || qtyInt > whItem.quantity) { SFX.play('error'); return; }
                                                            sellWarehouseItem(vIdx, name, qtyInt);
                                                            setShippingSource({});
                                                            setHighlightShippingItem(null);
                                                            setShippingQuantities({});
                                                        }} className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-3 rounded-xl shadow-lg uppercase">SELL AT HUB</button>

                                                       <button onClick={() => {
                                                           const qtyInt = parseInt(shippingQuantities[name] || '0');
                                                            if (qtyInt <= 0 || qtyInt > whItem.quantity) { SFX.play('error'); return; }
                                                           const destInt = parseInt(destValStr);
                                                           if (isNaN(destInt)) return;

                                                           const unitCostAmt = methodValStr === 'fast' ? 100 : (methodValStr === 'standard' ? 50 : 20);
                                                           const durationDays = methodValStr === 'fast' ? 1 : (methodValStr === 'standard' ? 2 : 3);
                                                           const cData = COMMODITIES.find(x=>x.name===name)!;
                                                           const totalWeightVal = qtyInt * cData.unitWeight;
                                                           const costVal = Math.ceil(totalWeightVal * unitCostAmt);

                                                           if (state.cash < costVal) { SFX.play('error'); return setModal({type:'message', data: "Insufficient funds for logistics."}); }

                                                           const newWarehouseDict: Warehouse = JSON.parse(JSON.stringify(state.warehouse));

                                                           newWarehouseDict[vIdx][name].quantity -= qtyInt;
                                                            if (newWarehouseDict[vIdx][name].quantity <= 0) {
                                                                delete newWarehouseDict[vIdx][name];
                                                            }
                                                            if (Object.keys(newWarehouseDict[vIdx]).length === 0) {
                                                                delete newWarehouseDict[vIdx];
                                                            }

                                                           if(!newWarehouseDict[destInt]) newWarehouseDict[destInt] = {};
                                                           const existingWare = newWarehouseDict[destInt][name];
                                                           let newArrivalDay = state.day + durationDays;
                                                           let newAvgCostVal = whItem.originalAvgCost;
                                                           let newQtyVal = qtyInt;

                                                           if (existingWare) {
                                                               newArrivalDay = Math.max(existingWare.arrivalDay, newArrivalDay);
                                                               newAvgCostVal = ((existingWare.quantity * existingWare.originalAvgCost) + (qtyInt * whItem.originalAvgCost)) / (existingWare.quantity + qtyInt);
                                                               newQtyVal += existingWare.quantity;
                                                           }

                                                           newWarehouseDict[destInt][name] = { quantity: newQtyVal, originalAvgCost: newAvgCostVal, arrivalDay: newArrivalDay };

                                                           setState(prev => prev ? ({ ...prev, cash: prev.cash - costVal, warehouse: newWarehouseDict }) : null);

                                                           setShippingSource({});
                                                           setHighlightShippingItem(null);
                                                           setShippingQuantities({});
                                                           setShippingDestinations({});
                                                           SFX.play('warp');
                                                           log(`LOGISTICS: Forwarded ${qtyInt} ${name} from ${VENUES[vIdx]} to ${VENUES[destInt]}.`, 'buy');
                                                           setModal({ type: 'none', data: null }); // Direct Return to Console in v10.4.4
                                                       }} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-3 rounded-xl shadow-lg uppercase" disabled={!destValStr || destInt === vIdx}>
                                                            {destInt === vIdx ? 'CANNOT FORWARD TO SOURCE' : 'FORWARD'}
                                                       </button>
                                                   </div>
                                               </div>
                                           )
                                       })()}
                                   </div>
                               </div>
                           </div>
                       )}

                       {logisticsTab === 'warehouse' && (
                           <div className="max-w-4xl mx-auto py-4 animate-in fade-in duration-300">
                               <h3 className="text-2xl font-black text-white mb-8 text-center uppercase tracking-widest">Registry</h3>
                               {Object.keys(state.warehouse).length === 0 && <div className="py-20 border-2 border-dashed border-gray-800 rounded-3xl text-gray-600 text-center italic text-xl">Empty.</div>}
                               <div className="grid grid-cols-1 gap-6">
                                   {Object.entries(state.warehouse).map(([vIdxStr, items]) => {
                                       const vIdxInt = parseInt(vIdxStr);
                                       return (
                                           <div key={vIdxInt} className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700 shadow-xl">
                                               <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4"><h4 className="text-xl font-black text-blue-400 tracking-tighter uppercase">{VENUES[vIdxInt]} HUB</h4>{vIdxInt === state.currentVenueIndex ? <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest animate-pulse">LOCAL</span> : <span className="text-gray-500 text-[10px] font-mono">REMOTE</span>}</div>
                                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                   {Object.entries(items).map(([name, item]) => {
                                                       const daysUntil = item.arrivalDay - state.day;
                                                       const isHere = vIdxInt === state.currentVenueIndex;
                                                       const arrived = daysUntil <= 0;
                                                       const seizureDays = (item.arrivalDay + 3) - state.day;
                                                       return (
                                                           <div key={name} className={`flex justify-between items-center bg-black/40 p-5 rounded-2xl border group hover:border-white/10 transition-all ${highlightShippingItem === name ? 'border-purple-500 shadow-lg' : 'border-white/5'}`}>
                                                               <div className="space-y-1">
                                                                   <div className="text-white text-lg font-black">{name} <span className="text-blue-500">x{item.quantity}</span></div>
                                                                   <div className="text-xs font-mono uppercase tracking-tighter">
                                                                       {item.isContractReserved && <span className="text-purple-400 font-bold block mb-1">CONTRACT RESERVED</span>}
                                                                       {arrived ? (<><span className="text-green-400 font-bold block mb-1">ARRIVED</span><span className="text-red-400/60 block uppercase">SEIZURE IN {seizureDays}D</span></>) : <span className="text-yellow-400 font-bold">ETA: {daysUntil}D</span>}
                                                                   </div>
                                                               </div>
                                                               <div className="flex flex-col gap-2">
                                                                   {arrived && isHere && !item.isContractReserved && (<div className="flex gap-2">
                                                                       {/* Expanded quantity input for phase 4 values (10 digits + scroll room) */}
                                                                       <input type="number" placeholder="Qty" className="w-[170px] bg-gray-900 text-white text-center text-xs rounded-lg border border-gray-700 font-bold" value={claimQuantities[name]||''} onChange={e=>setClaimQuantities({...claimQuantities, [name]:e.target.value})} />
                                                                       <button onClick={()=>{ const qVal = parseInt(claimQuantities[name]); if(!isNaN(qVal) && qVal>0) claimWarehouseItem(vIdxInt, name, qVal); }} className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase transition-all shadow-md">CLAIM</button>
                                                                   </div>)}
                                                                    {arrived && !isHere && !item.isContractReserved && (<button onClick={()=>{setHighlightShippingItem(name); setLogisticsTab('shipping'); setShippingSource({ [name]: { type: 'warehouse', venueIdx: vIdxInt } }); setModal({type:'shipping', data:null});}} className="bg-purple-700 hover:bg-purple-600 text-white px-6 py-3 rounded-xl text-sm font-black uppercase transition-all shadow-lg">MANAGE</button>)}
                                                                    {arrived && isHere && !item.isContractReserved && (<button onClick={()=>{setHighlightShippingItem(name); setLogisticsTab('shipping'); setShippingSource({ [name]: { type: 'warehouse', venueIdx: vIdxInt } }); setModal({type:'shipping', data:null});}} className="bg-purple-700/50 hover:bg-purple-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase transition-all">MANAGE</button>)}
                                                                    {item.isContractReserved && <div className="text-purple-400 font-bold flex items-center"><Lock size={14} className="mr-1"/> CONTRACT</div>}
                                                               </div>
                                                           </div>
                                                       );
                                                   })}
                                               </div>
                                           </div>
                                       );
                                   })}
                               </div>
                           </div>
                       )}
                    </div>
              </div>
          );
      }

      if (modal.type === 'wiki') {
        return renderSectorCodex();
      }

      if (modal.type === 'commodity_intel' && state) {
        const { commodityName } = modal.data;
        const commodity = COMMODITIES.find(c => c.name === commodityName);
        if (!commodity) return null;

        const totalWarehouseStock = Object.values(state.warehouse).reduce((total, venue) => {
            return total + (venue[commodityName]?.quantity || 0);
        }, 0);

        const globalStock = (state.cargo[commodityName]?.quantity || 0) + totalWarehouseStock;

        if (globalStock === 0 && modal.type === 'commodity_intel') {
             setTimeout(() => setModal({ type: 'none', data: null }), 100);
             return null;
        }

        return (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-900 border border-cyan-500 p-6 rounded-2xl w-full max-w-6xl h-[80vh] sci-fi-box flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-scifi text-cyan-400">Neural Intel: {commodityName}</h2>
                        <button onClick={() => setModal({ type: 'none', data: null })} className="text-red-500 font-bold hover:text-red-400"><XCircle /></button>
                    </div>
                    <div className="flex-grow flex gap-6 overflow-hidden">
                        {/* Left Panel (30%) */}
                        <div className="w-[30%] flex flex-col gap-4 bg-black/30 p-4 rounded-xl border border-cyan-500/20">
                            <h3 className="text-xl font-bold text-white text-center">{commodity.name}</h3>
                            <div className="flex justify-center text-6xl">{commodity.icon}</div>
                            <div className="text-center text-cyan-400 font-mono">Sector Rarity: {commodity.rarity}</div>
                            <div className="text-sm text-gray-400 flex-grow custom-scrollbar overflow-y-auto pr-2">
                                <p className="font-bold text-white mb-2">System Analysis:</p>
                                <p>Detailed analysis and market trends for {commodityName} would be displayed here. This includes historical price data, demand forecasts, and potential market-moving events.</p>
                            </div>
                        </div>

                        {/* Right Panel (70%) */}
                        <div className="w-[70%] flex flex-col gap-4 bg-black/30 p-4 rounded-xl border border-cyan-500/20 overflow-y-auto custom-scrollbar">
                             {VENUES.map((venueName, i) => {
                                const marketPrice = state.markets[i][commodityName]?.price || 0;
                                const cargoQty = i === state.currentVenueIndex ? (state.cargo[commodityName]?.quantity || 0) : 0;
                                const warehouseItem = state.warehouse[i]?.[commodityName];
                                const warehouseQty = warehouseItem?.quantity || 0;
                                const isReserved = warehouseItem?.isContractReserved;
                                const sellableQty = isReserved ? cargoQty : (cargoQty + warehouseQty);

                                return (
                                    <div key={i} className="grid grid-cols-[2fr_1fr_2fr_1fr] items-center gap-4 bg-slate-800/50 p-3 rounded-lg">
                                        <div className="font-bold text-white">{venueName}</div>
                                        <div>
                                            <div className="text-xs text-gray-400">Owned</div>
                                            <div className="font-bold flex flex-col text-sm">
                                                <span>Total: {cargoQty + warehouseQty}</span>
                                                {warehouseQty > 0 && (
                                                    <span className={`text-[9px] uppercase tracking-tighter ${isReserved ? 'text-purple-400 font-bold' : 'text-green-400 font-bold animate-pulse'}`}>
                                                        {isReserved ? 'Contract Lock' : 'Unreserved Stock'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => instantSell(commodityName, i)}
                                                disabled={sellableQty <= 0}
                                                className="bg-red-600 hover:bg-red-500 disabled:bg-gray-700 text-white font-bold py-2 px-4 rounded text-xs transition-all active:scale-95"
                                            >
                                                SELL
                                            </button>
                                            <button
                                              onClick={() => omniShip(commodityName, i)}
                                              disabled={!((state.cargo[commodityName]?.quantity || 0) > 0)}
                                              className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 text-white font-bold py-2 px-4 rounded text-xs"
                                            >
                                              SET DESTINATION
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-400">Price</div>
                                            <PriceDisplay value={marketPrice} size="text-sm" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
      }

      if (modal.type === 'highscores') {
          const displayScores = universalLeaderboard.length > 0 ? universalLeaderboard : state.highScores;

          return (
              <div className="flex flex-col h-full bg-slate-900/40 p-4 md:p-8 animate-in fade-in duration-300">
                  <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 border-b border-gray-700 pb-4 gap-4">
                      <div>
                          <h2 className="text-3xl font-scifi text-yellow-500 uppercase tracking-widest">Universal Legends</h2>
                          <div className="text-[10px] text-gray-500 font-mono uppercase mt-1 tracking-wider">Top 100 Real-Time Sync Registry (G.O.D. Monitored)</div>
                      </div>

                      {/* Real-time sync status indicator */}
                      <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-yellow-500/20 self-start">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[9px] text-green-400 font-mono uppercase font-black tracking-wider">UPLINK ACTIVE</span>
                      </div>
                  </div>

                  <div className="flex gap-4 flex-grow overflow-hidden relative">
                      {/* Left: Scroll buttons */}
                      <div className="flex flex-col justify-center gap-4 shrink-0 pr-2">
                          <button
                              onClick={() => {
                                  SFX.play('click');
                                  leaderboardScrollRef.current?.scrollBy({ top: -180, behavior: 'smooth' });
                              }}
                              className="bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-500/40 p-4 rounded-xl text-yellow-500 transition-all active:scale-95 shadow-md flex items-center justify-center"
                              title="Scroll Up"
                          >
                              <ChevronUp size={24} />
                          </button>
                          <button
                              onClick={() => {
                                  SFX.play('click');
                                  leaderboardScrollRef.current?.scrollBy({ top: 180, behavior: 'smooth' });
                              }}
                              className="bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-500/40 p-4 rounded-xl text-yellow-500 transition-all active:scale-95 shadow-md flex items-center justify-center"
                              title="Scroll Down"
                          >
                              <ChevronDown size={24} />
                          </button>
                      </div>

                      {/* Leaderboard entries */}
                      <div ref={leaderboardScrollRef} className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-3">
                          {displayScores.map((s, i) => (
                              <div key={s.id || i} className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-gray-800 group hover:border-yellow-500/50 transition-all">
                                  <div className="flex items-center gap-6">
                                      <span className={`font-mono text-xl w-8 text-center ${i < 3 ? 'text-yellow-400 font-black animate-pulse' : 'text-gray-600'}`}>{i + 1}</span>
                                      <div className="flex flex-col">
                                          <div className="flex items-center gap-1">
                                              <span className="text-white font-bold text-lg uppercase tracking-tighter">{s.name}</span>
                                              {renderAchievementIcons(s)}
                                          </div>
                                          <span className="text-[10px] text-gray-500 font-mono">{s.date}</span>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <div className="text-yellow-400 font-mono font-bold text-xl"><PriceDisplay value={s.score} size="text-xl" compact /></div>
                                      <div className="text-[10px] text-gray-400 uppercase font-black">{s.days} D.A.Y.s Survived</div>
                                  </div>
                              </div>
                          ))}
                          {displayScores.length === 0 && (
                              <div className="py-20 text-center text-gray-600 italic">No legends recorded in the Galactic Registry.</div>
                          )}
                      </div>
                  </div>

                  <div className="mt-6 flex gap-4 shrink-0">
                      <button onClick={attemptVoluntaryRestart} className="flex-1 bg-red-950/20 hover:bg-red-900/30 border border-red-900/50 text-red-400 font-black py-4 rounded-xl text-sm uppercase tracking-widest transition-all">Relinquish Command</button>
                      <button onClick={() => { setModal({ type: 'none', data: null }); SFX.play('click'); }} className="px-8 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all font-scifi">Back</button>
                  </div>
              </div>
          );
      }

      if (modal.type === 'credits') {
          return (
              <div className="flex flex-col h-full bg-black p-4 md:p-8 animate-in fade-in duration-500 relative">
                  <Starfield />

                  {/* Floating HUD Back Button */}
                  <div className="absolute top-4 right-4 z-50">
                      <button
                          onClick={() => { setModal({ type: 'none', data: null }); SFX.play('click'); }}
                          className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all border border-gray-700 shadow-md font-scifi flex items-center gap-1.5"
                      >
                          <XCircle size={14} /> Close Credits
                      </button>
                  </div>

                  <div className="flex-grow flex items-center justify-center relative overflow-hidden h-[70vh]">
                      <div className="credits-container">
                          <div className="credits-content space-y-12 pb-24">
                              <div className="space-y-3">
                                  <h1 className="text-5xl md:text-7xl font-scifi text-yellow-500 font-black tracking-widest uppercase animate-pulse">$TAR BUCKS</h1>
                                  <p className="text-cyan-400 font-mono text-sm tracking-[0.3em] uppercase font-bold">GALAXY TRADE EMPIRE</p>
                                  <p className="text-gray-500 font-mono text-xs uppercase">v.13.0.3</p>
                              </div>

                              <div className="border-t border-b border-gray-800 py-6 my-10 space-y-2">
                                  <p className="text-yellow-500 text-xs font-mono uppercase tracking-widest font-black">--- LEAD DESIGN & ARCHITECTURE ---</p>
                                  <p className="text-white text-3xl font-black font-scifi">Jules</p>
                              </div>

                              <div className="border-b border-gray-800 pb-6 my-10 space-y-2">
                                  <p className="text-yellow-500 text-xs font-mono uppercase tracking-widest font-black">--- CO-ENGINE & INTELLIGENCE ---</p>
                                  <p className="text-white text-3xl font-black font-scifi">Gemini</p>
                              </div>

                              <div className="space-y-6">
                                  <p className="text-yellow-500 text-xs font-mono uppercase tracking-widest font-black">--- SPECIAL THANKS TO THE BANKS & CREDITORS ---</p>
                                  <div className="space-y-3 text-lg font-mono">
                                      <p className="text-white font-bold">Starfleet Credit Union</p>
                                      <p className="text-white font-bold">Tyrell Corporation Finance</p>
                                      <p className="text-white font-bold">Weyland-Yutani Trust</p>
                                      <p className="text-white font-bold">The Great Barter Bank</p>
                                      <p className="text-white font-bold">The Hutt Cartel Lending</p>
                                  </div>
                              </div>

                              <div className="space-y-6 pt-6">
                                  <p className="text-yellow-500 text-xs font-mono uppercase tracking-widest font-black">--- WITH APPRECIATION TO THE CONGLOMERATES & CORPORATIONS ---</p>
                                  <div className="space-y-3 text-lg font-mono">
                                      <p className="text-white font-bold">Choam Corp</p>
                                      <p className="text-white font-bold">Cyberdyne Systems</p>
                                      <p className="text-white font-bold">Tyrell Corporation</p>
                                      <p className="text-white font-bold">Weyland-Yutani Logistics</p>
                                      <p className="text-white font-bold">Void-Ex Logistics</p>
                                  </div>
                              </div>

                              <div className="space-y-6 pt-6">
                                  <p className="text-yellow-500 text-xs font-mono uppercase tracking-widest font-black">--- HONORABLE SECTOR ENTITIES & REGULATORS ---</p>
                                  <div className="space-y-3 text-lg font-mono">
                                      <p className="text-white font-bold">Galactic Overlord Department (G.O.D.)</p>
                                      <p className="text-white font-bold">V.I.S.A. Checkpoint Control</p>
                                      <p className="text-white font-bold">S.C.A.M. Customs Board</p>
                                      <p className="text-white font-bold">Federation Supply Hub</p>
                                      <p className="text-white font-bold">Sector Health, Allocation, & Network Enforcement</p>
                                  </div>
                              </div>

                              <div className="space-y-6 pt-6">
                                  <p className="text-yellow-500 text-xs font-mono uppercase tracking-widest font-black">--- RIVAL SYNDICATES & THREATS ---</p>
                                  <div className="space-y-3 text-lg font-mono">
                                      <p className="text-white font-bold">The Crimson Fleet</p>
                                      <p className="text-white font-bold">The Spice Bandits</p>
                                      <p className="text-white font-bold">The Void-Sickness Whispers</p>
                                      <p className="text-white font-bold">The Sentient Rust Rats</p>
                                  </div>
                              </div>

                              <div className="pt-16 pb-20 space-y-4">
                                  <p className="text-yellow-500 text-sm font-mono uppercase tracking-widest font-black">--- FINAL COGNITIVE DOCKING TRANSMISSION ---</p>
                                  <p className="text-white text-3xl font-scifi font-black animate-pulse leading-snug">Love S.H.A.N.E.</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          );
      }

      return null;
  };

  if (!preWelcomeClicked) {
    return (
      <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center p-4">
        <Starfield />
        <div className="text-center space-y-6 max-w-2xl p-8 bg-slate-900/80 rounded-3xl border-2 border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.15)] relative z-50 animate-in zoom-in-95 duration-500">
          <h1 className="text-5xl md:text-6xl font-scifi text-white font-black tracking-widest uppercase animate-pulse">STAR BUCKS</h1>
          <p className="text-yellow-500 font-mono text-sm tracking-widest uppercase font-bold">GALAXY TRADE EMPIRE</p>

          {/* Detailed retro sci-fi illustration of RR Firefox 22 RustyRedeemer */}
          <div className="border border-cyan-500/30 p-2 rounded-xl bg-black/40 shadow-inner">
            <img
              src={introShip}
              alt="RR Firefox 22 RustyRedeemer"
              className="w-full h-auto max-h-[360px] object-contain opacity-90 my-2 rounded"
            />
          </div>

          <div className="text-gray-300 text-sm md:text-base leading-relaxed space-y-3">
            <p>
              This experience utilizes browser Speech Synthesis and the Web Audio API for immersive, voice-narrated retro computer reports and ambient effects.
            </p>
            <p className="text-xs text-cyan-400 font-mono">
              [RECOMMENDED: Enable sound to receive critical market intel and crew updates]
            </p>
          </div>
          <button
            onClick={() => {
              // Initialize SFX audio engine
              SFX.init();
              // Pre-unlock speech synthesis with a silent utterance to bypass browser autoplay policies
              try {
                if ('speechSynthesis' in window) {
                  const utterance = new SpeechSynthesisUtterance("");
                  window.speechSynthesis.speak(utterance);
                }
              } catch (e) {
                console.warn("Failed to pre-unlock speech synthesis:", e);
              }
              // Immersive voice narration initialized directly on user gesture
              speakRetro(openingMessage);
              setPreWelcomeClicked(true);
            }}
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-black py-4 px-6 rounded-xl text-lg md:text-xl shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-all uppercase border-b-4 border-yellow-900 active:scale-95 z-50 relative animate-bounce"
          >
            Connect Neural Uplink
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-viewport flex flex-col p-2 md:p-4 space-y-4 no-scrollbar custom-scrollbar overflow-y-auto bg-transparent">
       {(() => {
         let bgImage: string | null = null;
         let useStarfield = false;

         if (!state) {
           useStarfield = true;
         } else {
           if (modal.type === 'highscores' || modal.type === 'save_prompt' || modal.type === 'save_confirm') {
             useStarfield = true;
           } else if (modal.type === 'none' && priorityAcknowledged) {
             bgImage = VENUE_IMAGES[VENUES[state.currentVenueIndex]];
           } else if (modal.type === 'banking') {
             bgImage = ibankBg;
           } else if (modal.type === 'comms') {
             bgImage = gigoBg;
           } else if (modal.type === 'travel') {
             bgImage = catBg;
           } else if (modal.type === 'wiki' || modal.type === 'view_venue_codex') {
             bgImage = codexBg;
           } else if (modal.type === 'shop') {
             bgImage = upgradesBg;
           } else if (modal.type === 'shipping') {
             bgImage = logisticBg;
           } else if (modal.type === 'fomo') {
             bgImage = state.isMutinyActive ? strikeBg : fomoBg;
           } else {
             useStarfield = true;
           }
         }

         if (useStarfield) {
           return <Starfield />;
         } else if (bgImage) {
           return (
             <div
               className="fixed inset-0 z-[-1] transition-all duration-1000"
               style={{
                 backgroundImage: `url(${bgImage})`,
                 backgroundSize: 'cover',
                 backgroundPosition: 'center',
                 backgroundRepeat: 'no-repeat',
               }}
             />
           );
         }
         return null;
       })()}
       {state?.isMutinyActive && modal.type !== 'message' && !dismissedStrikeOverlay && (() => {
           const pcChipsQuantity = state.markets[state.currentVenueIndex]?.["PC Chips"]?.quantity || 0;
           const pcChipsRequirement = state.mutinyPcChipsRequirement !== undefined ? state.mutinyPcChipsRequirement : Math.floor((pcChipsQuantity * 0.22) / 5) * 5;
           const playerOwnedChips = state.cargo["PC Chips"]?.quantity || 0;
           return (
               <div
                   className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300"
                   style={{
                       backgroundImage: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(${strikeBg})`,
                       backgroundSize: 'cover',
                       backgroundPosition: 'center',
                       backgroundRepeat: 'no-repeat',
                   }}
               >
                   <div className="max-w-xl w-full bg-red-950/40 border-2 border-red-500 rounded-3xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.4)] relative overflow-hidden">
                       {/* Minimize Button */}
                       <button
                           onClick={() => {
                               SFX.play('click');
                               setDismissedStrikeOverlay(true);
                           }}
                           className="absolute top-4 left-4 text-red-400 hover:text-red-300 font-mono text-xs uppercase border border-red-500/20 px-2 py-1 rounded transition-all active:scale-95 cursor-pointer z-50"
                       >
                           ✕ Minimize
                       </button>

                       {/* Blinking red indicator */}
                       <div className="absolute top-4 right-4 flex items-center space-x-1">
                           <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping"></span>
                           <span className="w-3.5 h-3.5 rounded-full bg-red-500 absolute"></span>
                       </div>

                       {/* Large Banner */}
                       <h1 className="text-5xl md:text-6xl font-scifi font-black text-red-500 animate-pulse uppercase tracking-wider mb-6">
                           ON STRIKE
                       </h1>

                       <p className="text-red-200 font-mono text-sm mb-8 uppercase tracking-wide leading-relaxed">
                           The mutant crew has shut down vital ship decks! They refuse to lift their strike until their demands are fully met.
                       </p>

                       {/* Demands Details */}
                       <div className="bg-slate-900/90 border border-red-500/30 p-6 rounded-2xl mb-8 text-left space-y-4">
                           <h3 className="text-md font-bold text-red-400 uppercase tracking-wider border-b border-red-500/20 pb-2">Crew Settlement Requirements:</h3>

                           <div className="flex justify-between items-center text-sm md:text-base">
                               <span className="text-gray-400 font-mono uppercase">Ransom Funds:</span>
                               <span className={`font-mono font-bold ${state.cash >= 50000 ? 'text-green-400' : 'text-red-400'}`}>
                                   {formatCurrencyLog(50000)} / {formatCurrencyLog(state.cash)}
                               </span>
                           </div>

                           <div className="flex justify-between items-center text-sm md:text-base">
                               <span className="text-gray-400 font-mono uppercase">PC Chips Required:</span>
                               <span className={`font-mono font-bold ${playerOwnedChips >= pcChipsRequirement ? 'text-green-400' : 'text-red-400'}`}>
                                   {pcChipsRequirement} units / {playerOwnedChips} owned
                               </span>
                           </div>

                           <p className="text-[10px] text-gray-500 italic uppercase tracking-wider pt-2 border-t border-red-500/10">
                               * Requirements are calculated based on 22% (rounded down to the nearest 5) of the PC Chips available at the current venue ({pcChipsQuantity} units).
                           </p>
                       </div>

                       {/* Button to Fulfill Demands */}
                       <div className="flex flex-col gap-3">
                           <button
                               onClick={() => {
                                   if (state.cash < 50000) {
                                       SFX.play('error');
                                       return setModal({ type: 'message', data: "Insufficient Star Bucks to pay ransom." });
                                   }
                                   if (playerOwnedChips < pcChipsRequirement) {
                                       SFX.play('error');
                                       return setModal({ type: 'message', data: "Insufficient PC Chips in cargo hold to meet demands." });
                                   }

                                   // Deduct ransom and PC Chips
                                   const newCargo = { ...state.cargo };
                                   let weightDeduction = 0;
                                   if (pcChipsRequirement > 0) {
                                       newCargo["PC Chips"].quantity -= pcChipsRequirement;
                                       weightDeduction = pcChipsRequirement * 0.01; // PC Chips weight is 0.01
                                       if (newCargo["PC Chips"].quantity <= 0) {
                                           delete newCargo["PC Chips"];
                                       }
                                   }

                                   setState(prev => {
                                       if (!prev) return null;
                                       return {
                                           ...prev,
                                           cash: prev.cash - 50000,
                                           cargo: newCargo,
                                           cargoWeight: Math.max(0, prev.cargoWeight - weightDeduction),
                                           isMutinyActive: false,
                                           survivedMutiny: true,
                                           mutantUnrest: 10
                                       };
                                   });

                                   log(`MUTINY: Paid crew ransom ($50,000) and delivered ${pcChipsRequirement} PC Chips. Strike resolved.`, 'buy');
                                   SFX.play('success');
                                    setDismissedStrikeOverlay(false);
                                   setModal({
                                       type: 'message',
                                       data: `STRIKE RESOLVED: Successfully paid crew ransom ($50,000) and delivered ${pcChipsRequirement} PC Chips. Demands fully pacified. Returning to Console.`
                                   });
                               }}
                               className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl text-xl uppercase transition-all shadow-lg active:scale-95"
                           >
                               MAKE PAYMENT AT I.B.A.N.K
                           </button>
                       </div>
                   </div>
               </div>
           );
       })()}
       {modal.type !== 'welcome' && (
         <>
           <header className="flex flex-col md:flex-row justify-between items-center px-4 py-2 gap-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-30 sci-fi-box">
              <div className="flex flex-col items-start md:w-1/4">
                 <div className="flex items-baseline space-x-2 whitespace-nowrap overflow-visible">
                    <h1 className="font-scifi text-2xl md:text-3xl font-bold text-white tracking-widest shrink-0 uppercase">$tar Bucks</h1>
                     <span className="text-xs text-yellow-500 font-mono bg-yellow-400/10 px-1 border border-yellow-500/20 font-bold shrink-0">v.13.0.3</span>
                    
                    <div className="flex items-center space-x-2 ml-4 border-l border-gray-700 pl-4 shrink-0 relative z-50">
                        {/* Audio Toggle */}
                        <button onClick={toggleSound} 
                                className="w-9 h-9 rounded-full bg-gray-800/80 border border-gray-700 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg text-white hover:text-cyan-400" 
                                title="Toggle Audio">
                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                        
                        {/* Legends Toggle */}
                        <button onClick={()=>handleFeatureClick('highscores', ()=>setModal({type:'highscores', data:null}))} 
                                className="w-9 h-9 rounded-full bg-gray-800/80 border border-gray-700 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg text-yellow-500 hover:text-yellow-400" 
                                title="Galactic Legends">
                            <Trophy size={18} />
                        </button>
                        
                        {/* Save Game */}
                        <button onClick={(e)=>saveAndExit(e)} 
                                className={`w-9 h-9 rounded-full bg-gray-800/80 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg border ${hasSave ? 'border-green-900/50 text-green-500 hover:border-green-500' : 'border-red-900/50 text-red-500 hover:border-red-500'}`} 
                                title="Save Neural State">
                            <Save size={18} />
                        </button>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col items-center flex-grow md:w-2/4">
                 <div className="flex flex-wrap justify-center items-center gap-3 md:gap-6 text-cyan-300 font-mono text-sm md:text-lg">
                    <div className="flex flex-col items-center"><span className={state.day >= deadlineLimit ? 'text-red-400 animate-pulse' : 'text-cyan-400'}>D.A.Y. {state.day}/{deadlineLimit}</span><span className="text-[8px] text-white uppercase font-bold">Cycle Status</span></div>
                    <div className="flex flex-col items-center"><span className="text-purple-400 font-bold">{state.gamePhase === 4 ? "Final Phase" : `Phase ${state.gamePhase}`}</span><span className="text-[8px] text-white uppercase font-bold">Global Phase</span></div>
                    <div className="flex flex-col items-center border-x border-gray-800 px-4"><div className="flex items-center">{state.gamePhase === 4 ? (<>Goal: <span className="text-xl md:text-2xl font-bold mx-1">&infin;</span></>) : (<PriceDisplay value={goalAmt} size="text-sm md:text-lg" compact={state.gamePhase>=2} />)}</div><span className="text-[8px] text-white uppercase font-bold">Phase Goal</span></div>
                    <div className="flex flex-col items-center"><div className="text-yellow-400 font-bold flex items-center"><PriceDisplay value={netWorth} size="text-sm md:text-lg" compact={state.gamePhase>=2} /></div><span className="text-[8px] text-white uppercase font-bold">Net Worth</span></div>
                 </div>
              </div>

              <div className="flex items-center justify-center md:justify-end md:w-1/4 space-x-1">
                 <StatusDial value={state.warrantLevel || 0} max={5} icon={AlertTriangle} color={(state.warrantLevel || 0) > 0 ? "text-orange-500 animate-pulse font-bold" : "text-gray-600 font-bold"} label="Warrant" />
                 <StatusDial value={Math.round(state.shipHealth)} max={150} icon={Heart} color="text-green-500" label="Hull" isPercent />
                 <StatusDial value={(state.cargo[FUEL_NAME]?.quantity||0)} max={200} icon={Fuel} color="text-blue-500" label="Fuel" />
                 <StatusDial value={hasLaser(state) ? Math.round(state.laserHealth || 0) : 0} max={100} icon={Crosshair} color={hasLaser(state)?'text-red-500':'text-gray-600'} label={hasLaser(state)?'Laser':'Off'} isPercent />
                 <div className="flex flex-col items-center">
                    <div className={`text-sm font-bold ${state.cargoWeight > state.cargoCapacity ? 'text-red-500' : 'text-green-500'}`}>
                        {state.cargoWeight > state.cargoCapacity ? 'Overloaded' : 'Within Limits'}
                    </div>
                    <div className="text-xs">Cargo</div>
                 </div>
              </div>
           </header>

           <div className="flex flex-col items-stretch">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-1 px-1">
                 <button onClick={()=>handleFeatureClick('shop', ()=>setModal({type:'shop', data:null}))} 
                         className={`tab-btn flex flex-col items-center justify-center p-2 rounded-t-xl border-x border-t border-purple-600/50 ${modal.type==='shop'?'bg-purple-900/60 text-white shadow-[0_-5px_15px_rgba(147,51,234,0.3)]':'bg-purple-900/20 text-purple-300 hover:bg-purple-900/40'} font-scifi font-bold text-[10px] md:text-xs transition-all`}>
                    <Zap className="mb-1" size={14}/> Upgrades
                 </button>
                 <button onClick={()=>handleFeatureClick('banking', ()=>setModal({type:'banking', data:null}))} 
                         className={`tab-btn flex flex-col items-center justify-center p-2 rounded-t-xl border-x border-t border-yellow-600/50 ${modal.type==='banking'?'bg-yellow-900/60 text-white shadow-[0_-5px_15px_rgba(234,179,8,0.3)]':'bg-yellow-900/20 text-yellow-500 hover:bg-yellow-900/40'} font-scifi font-bold text-[10px] md:text-xs transition-all`}>
                    <Building2 className="mb-1" size={14}/> I.B.A.N.K.
                    <span className={`text-[8px] flex items-center font-bold ${totalDebt > 0 ? 'text-red-500' : (totalInv > 0 ? 'text-green-500' : 'text-yellow-600')}`}>{totalDebt > 0 ? formatCompactNumber(totalDebt) : (totalInv > 0 ? formatCompactNumber(totalInv) : '')}</span>
                 </button>
                 <button onClick={()=>{setModal({type:'none', data:null}); SFX.play('click');}} 
                         className={`tab-btn flex flex-col items-center justify-center p-2 rounded-t-xl border-x border-t border-blue-500/50 ${modal.type==='none'?'bg-blue-900/60 text-white shadow-[0_-5px_15px_rgba(37,99,235,0.3)]':'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40'} font-scifi font-bold text-[10px] md:text-xs transition-all`}>
                    <LineChart className="mb-1" size={14}/> Console
                 </button>
                 <button onClick={()=>handleFeatureClick('fomo', ()=>setModal({type:'fomo', data:null}))} 
                         className={`tab-btn flex flex-col items-center justify-center p-2 rounded-t-xl border-x border-t border-orange-600/50 ${modal.type==='fomo'?'bg-orange-900/60 text-white shadow-[0_-5px_15px_rgba(234,88,12,0.3)]':'bg-orange-900/20 text-orange-300 hover:bg-orange-900/40'} font-scifi font-bold text-[10px] md:text-xs transition-all`}>
                    <Factory className="mb-1" size={14}/> F.O.M.O.
                 </button>
                 <button onClick={()=>handleFeatureClick('travel', ()=>setModal({type:'travel', data:null}))} 
                         className={`tab-btn flex flex-col items-center justify-center p-2 rounded-t-xl border-x border-t border-emerald-600/50 ${modal.type==='travel' || modal.type==='venue_intel' ?'bg-emerald-900/60 text-white shadow-[0_-5px_15px_rgba(16,185,129,0.3)]':'bg-emerald-900/20 text-emerald-300 hover:bg-emerald-900/40'} font-scifi font-bold text-[10px] md:text-xs transition-all`}>
                    <Rocket className="mb-1" size={14}/> Travel
                 </button>
                 <button onClick={()=>handleFeatureClick('shipping', ()=>setModal({type:'shipping', data:null}))} 
                         className={`tab-btn flex flex-col items-center justify-center p-2 rounded-t-xl border-x border-t border-blue-600/50 ${modal.type==='shipping' ?'bg-blue-800/60 text-white shadow-[0_-5px_15px_rgba(37,99,235,0.3)]':'bg-blue-900/20 text-blue-300 hover:bg-blue-900/40'} font-scifi font-bold text-[10px] md:text-xs transition-all`}>
                    <Truck className="mb-1" size={14}/> Logistics
                 </button>
                 <button onClick={()=>handleFeatureClick('comms', ()=>setModal({type:'comms', data:null}))} 
                         className={`tab-btn flex flex-col items-center justify-center p-2 rounded-t-xl border-x border-t border-cyan-500/50 ${modal.type==='comms'?'bg-cyan-900/60 text-white shadow-[0_-5px_15px_rgba(6,182,212,0.3)]':'bg-cyan-900/20 text-cyan-300 hover:bg-cyan-900/40'} font-scifi font-bold text-[10px] md:text-xs transition-all`}>
                    <Radio className="mb-1" size={14}/> G.I.G.O.
                 </button>
                 <button onClick={()=>handleFeatureClick('wiki', ()=>setModal({type:'wiki', data:null}))} 
                         className={`tab-btn flex flex-col items-center justify-center p-2 rounded-t-xl border-x border-t border-orange-600/50 ${modal.type==='wiki'?'bg-orange-800/60 text-white shadow-[0_-5px_15px_rgba(234,88,12,0.3)]':'bg-orange-900/20 text-orange-400 hover:bg-orange-800/60'} font-scifi font-bold text-[10px] md:text-xs transition-all`}>
                    <BookOpen className="mb-1" size={14}/> Codex
                 </button>
              </div>
           </div>

           <div id="main-console" className={`card sci-fi-box rounded-b-xl rounded-t-none p-0 flex-grow flex flex-col bg-transparent overflow-hidden min-h-0 border-t-2 border-t-blue-500/30 ${
               modal.type === 'none' || modal.type === 'comms' || modal.type === 'shipping' || modal.type === 'fomo' || modal.type === 'shop' || modal.type === 'banking' || modal.type === 'wiki' ? 'retro-terminal-background' : ''
             }`}>
              {renderTerminalContent()}

              {/*
                G.I.G.O Live Feed Window:
                Displays the 2 most recent messages from G.I.G.O logs right inside the main terminal console,
                allowing remote sales and logs feedback to be viewed dynamically without modal interruptions.
              */}
              <div className="bg-black/80 border-t border-cyan-500/20 px-4 py-2.5 font-mono text-xs flex flex-col gap-1 shrink-0 z-40 select-none">
                  <div className="flex justify-between items-center text-[10px] text-cyan-400 uppercase tracking-widest font-black border-b border-cyan-500/10 pb-1 mb-1">
                      <span>G.I.G.O. Live Feed Ticker</span>
                      <span className="animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>LIVE SIGNAL
                      </span>
                  </div>
                  {state.messages && state.messages.length > 0 ? (
                      state.messages.slice(-2).reverse().map((msg) => (
                          <div key={msg.id} className={`flex items-start overflow-hidden text-ellipsis whitespace-nowrap leading-tight ${getLogColorClass(msg.type)}`}>
                              <span className="opacity-40 mr-2 font-bold shrink-0">[{new Date(msg.id).toLocaleTimeString()}]</span>
                              <span className="truncate">{renderLogMessage(msg.message)}</span>
                          </div>
                      ))
                  ) : (
                      <div className="text-gray-600 italic">No live G.I.G.O comms signals detected.</div>
                  )}
              </div>
           </div>
         </>
       )}
       
       {modal.type === 'event_encounter' && modal.data && (
           <div className="absolute inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
               <div className="bg-slate-900 border border-red-600 p-8 rounded-2xl max-w-2xl w-full sci-fi-box animate-[shake_0.5s_ease-in-out]">
                   <h2 className="text-3xl font-scifi text-red-500 mb-4 animate-pulse uppercase">Alert: {modal.data.encounter.title}</h2>
                   <p className="text-white text-xl mb-8 leading-relaxed italic font-mono">"{modal.data.encounter.description}"</p>
                   
                   <div className="flex flex-col gap-4">
                       {modal.data.encounter.type === 'derelict' ? (
                           <>
                               <button onClick={() => resolveEncounterOutcome('check')} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] action-btn uppercase">Salvage Freighter</button>
                               <button onClick={() => resolveEncounterOutcome('leave')} className="bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold py-3 rounded-xl text-lg uppercase">Maintain Course</button>
                           </>
                       ) : (modal.data.encounter.type === 'pirate' || modal.data.encounter.type === 'spice_bandits') ? (
                           <>
                               <button onClick={() => resolveEncounterOutcome('pay')} className="bg-yellow-600 hover:bg-yellow-500 text-white font-black py-4 rounded-xl text-xl shadow-[0_0_15px_rgba(234,179,8,0.4)] action-btn uppercase">Pay Tribute ({formatCurrencyLog(modal.data.encounter.demandAmount)})</button>
                               <button onClick={() => resolveEncounterOutcome('fight')} className="bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl text-xl shadow-[0_0_15px_rgba(220,38,38,0.4)] action-btn uppercase">Engage (Battle Reward)</button>
                           </>
                       ) : modal.data.encounter.demandAmount ? (
                           <>
                               <button onClick={() => resolveEncounterOutcome('pay')} className="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl text-xl action-btn uppercase">Pay Settlement ({formatCurrencyLog(modal.data.encounter.demandAmount)})</button>
                               <button onClick={() => resolveEncounterOutcome('ignore')} className="bg-red-700 hover:bg-red-600 text-white font-black py-4 rounded-xl text-xl action-btn uppercase">Refuse (Code Breach)</button>
                           </>
                       ) : (
                           <button onClick={() => resolveEncounterOutcome('ignore')} className="bg-gray-700 hover:bg-gray-600 text-white font-black py-5 rounded-xl text-2xl action-btn uppercase">Acknowledge Status</button>
                       )}
                   </div>
               </div>
           </div>
       )}

       {modal.type === 'view_guide_image' && modal.data && (
           <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-[9999] p-4 md:p-8 animate-in fade-in duration-300">
               <div className="max-w-4xl w-full h-[85vh] flex flex-col bg-slate-900 border border-orange-500 rounded-3xl p-6 sci-fi-box relative shadow-[0_0_50px_rgba(234,88,12,0.3)]">
                   <h2 className="text-3xl font-scifi text-orange-400 mb-4 text-center uppercase tracking-widest">{modal.data.title}</h2>
                   <div className="flex-grow overflow-hidden rounded-2xl border border-orange-500/20 bg-black/40 flex items-center justify-center p-2 mb-6">
                       <img
                           src={modal.data.image}
                           alt={modal.data.title}
                           className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                       />
                   </div>
                   <button
                       onClick={() => {
                           SFX.play('click');
                           setWikiTab('frontpanels');
                           setModal({ type: 'wiki', data: null });
                       }}
                       className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-xl text-xl shadow-lg uppercase transition-all active:scale-95 shrink-0 cursor-pointer"
                   >
                       Return to Codex
                   </button>
               </div>
           </div>
       )}

       {modal.type === 'encounter_resolution' && modal.data && (
           <div className="absolute inset-0 bg-black/98 flex items-center justify-center z-50 p-4">
               <div className={`bg-slate-900 border-2 ${modal.data.outcomeType === 'danger' ? 'border-red-500' : (modal.data.outcomeType === 'profit' ? 'border-green-500' : 'border-blue-500')} p-10 rounded-2xl max-xl w-full sci-fi-box text-center shadow-2xl`}>
                   <div className="flex justify-center mb-6">
                       {modal.data.outcomeType === 'danger' ? <Skull size={64} className="text-red-500" /> : (modal.data.outcomeType === 'profit' ? <Zap size={64} className="text-green-500" /> : <Radar size={64} className="text-blue-500" />)}
                   </div>
                   <h2 className={`text-2xl font-black mb-6 uppercase tracking-tighter ${modal.data.outcomeType === 'danger' ? 'text-red-400' : (modal.data.outcomeType === 'profit' ? 'text-green-400' : 'text-blue-400')}`}>Comm-Log Update</h2>
                   <p className="text-white text-xl mb-10 leading-relaxed font-mono">"{modal.data.outcomeMsg}"</p>
                   
                   <button onClick={() => {
                        if (!modal || !modal.data) return;
                        const { state: sData, report: rData, destIdx, mine, overload } = modal.data;
                        if (sData) {
                            if (sData.shipHealth <= 0) {
                                sData.gameOver = true;
                                const nw = getNetWorth(sData);
                                const isHS = sData.highScores.length < 100 || nw > (sData.highScores[sData.highScores.length - 1]?.score || 0);
                                sData.achievements = Array.from(new Set([...(sData.achievements || []), 'death']));
                                setModal({ type: 'endgame', data: { reason: "Structural Integrity Failure: Ship Destroyed", netWorth: nw, stats: sData.stats, isHighScore: isHS, days: sData.day } });
                            } else {
                                finalizeJump(sData, rData, destIdx, mine, overload);
                            }
                        }
                   }} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-xl text-2xl shadow-xl action-btn uppercase">Acknowledged</button>
               </div>
           </div>
       )}

       {modal.type === 'save_prompt' && (
           <div className="absolute inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
               <div className="bg-slate-900 border border-blue-500 p-8 rounded-2xl max-w-md w-full sci-fi-box text-center shadow-2xl">
                   <div className="flex justify-center mb-4 text-cyan-400 animate-pulse"><Save size={48} /></div>
                   <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Initiate Neural Backup</h2>
                   <p className="text-xs text-gray-400 font-mono mb-6 uppercase leading-relaxed">
                       Only 3 save points are allowed per neural cycle.
                       <br />
                       Saves Used: <span className="text-yellow-400 font-bold">{(state?.saveCount || 0)} / 3</span>
                   </p>

                   <div className="mb-6 text-left">
                       <label className="block text-xs text-cyan-400 uppercase font-bold mb-2">Captain Alias</label>
                       <input
                           type="text"
                           placeholder="Captain Alias"
                           className="w-full p-3 bg-gray-950 border border-cyan-500 text-white text-lg rounded-xl text-center outline-none uppercase font-mono"
                           value={tempSaveName}
                           onChange={e => setTempSaveName(e.target.value.toUpperCase())}
                           maxLength={15}
                       />
                   </div>

                   <div className="flex flex-col gap-3">
                       <button
                           onClick={async () => {
                               if (!tempSaveName.trim()) return;
                               const currentSaves = state?.saveCount || 0;
                               if (currentSaves >= 3) {
                                   SFX.play('error');
                                   alert("Neural Uplink Blocked: Maximum of 3 save points utilized.");
                                   return;
                               }

                               const nextSaveCount = currentSaves + 1;
                               const updatedState = {
                                   ...state,
                                   playerName: tempSaveName.trim(),
                                   saveCount: nextSaveCount
                               } as GameState;

                               try {
                                   localStorage.setItem('sbe_savegame', JSON.stringify(updatedState));
                                   setHasSave(true);
                                   SFX.play('success');

                                   const nw = getNetWorth(updatedState);
                                   const displayScores = universalLeaderboard.length > 0 ? universalLeaderboard : state.highScores;
                                   const threshold = displayScores.length < 100 ? 0 : displayScores[displayScores.length - 1].score;
                                   const isLegend = nw > threshold;

                                   if (isLegend) {
                                       await postHighScore(tempSaveName.trim(), nw, state.day, state.achievements || []);
                                       const updatedLocal = await saveHighScore(tempSaveName.trim(), nw, state.day, state.achievements || []);
                                       setState({ ...updatedState, highScores: updatedLocal });
                                   } else {
                                       setState(updatedState);
                                   }

                                   setModal({
                                       type: 'save_confirm',
                                       data: {
                                           name: tempSaveName.trim(),
                                           isLegend,
                                           saveCount: nextSaveCount
                                       }
                                   });
                               } catch (e) {
                                   console.error("Save failed", e);
                                   SFX.play('error');
                                   setModal({ type: 'message', data: "Neural Uplink Failed: Local Storage limit exceeded." });
                               }
                           }}
                           disabled={(state?.saveCount || 0) >= 3}
                           className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-black py-3 rounded-xl text-lg shadow-lg action-btn uppercase"
                       >
                           {(state?.saveCount || 0) >= 3 ? "Save Locked" : "Confirm Neural Backup"}
                       </button>
                       <button
                           onClick={() => {
                               setModal({ type: 'none', data: null });
                               SFX.play('click');
                           }}
                           className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-3 rounded-xl text-lg uppercase transition-all"
                       >
                           Abort
                       </button>
                   </div>
               </div>
           </div>
       )}

       {modal.type === 'save_confirm' && modal.data && (
           <div className="absolute inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
               <div className="bg-slate-900 border border-blue-500 p-10 rounded-2xl max-w-md w-full sci-fi-box text-center shadow-2xl">
                   <div className="flex justify-center mb-6 text-green-400 animate-pulse"><Save size={64} /></div>
                   <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Save Successful</h2>

                   {/* Captain Name and Achievements (Enhancement 136) */}
                   <div className="mb-4 text-yellow-500 font-mono font-bold flex items-center justify-center gap-1 uppercase tracking-widest text-lg">
                       <span>{modal.data?.name || state?.playerName || "CAPTAIN SHANE"}</span>
                       {renderAchievementIcons(state)}
                   </div>

                   <p className="text-gray-200 mb-2 font-bold text-md uppercase tracking-wider">Neural State Secured.</p>

                   {/* Save Point Counter Instruction & Counter */}
                   <div className="mb-6 bg-black/30 p-3 rounded border border-gray-800 text-xs font-mono text-gray-400 uppercase leading-relaxed">
                       Only 3 save points are allowed per neural cycle.
                       <br />
                       Save Point: <span className="text-yellow-400 font-bold">{modal.data?.saveCount || state?.saveCount || 1} / 3</span>
                       <br />
                       Saves remaining: <span className="text-cyan-400 font-bold">{3 - (modal.data?.saveCount || state?.saveCount || 1)}</span>
                   </div>

                   {/* Universal Legends List feedback */}
                   <div className="mb-8 font-mono text-xs uppercase leading-relaxed">
                       {modal.data?.isLegend ? (
                           <div className="text-green-400 font-bold animate-pulse bg-green-500/10 p-2 border border-green-500/20 rounded">
                               Neural link established! Successfully registered in the Universal Legends list!
                           </div>
                       ) : (
                           <div className="text-red-400 font-bold bg-red-500/10 p-2 border border-red-500/20 rounded">
                               You have not made it into the Legend list.
                           </div>
                       )}
                   </div>

                   <div className="flex flex-col gap-3">
                       <button
                           onClick={() => {
                               setModal({ type: 'none', data: null });
                               SFX.play('click');
                           }}
                           className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-xl shadow-lg action-btn uppercase"
                       >
                           Return to Console
                       </button>
                       <button
                           onClick={() => window.location.reload()}
                           className="w-full bg-red-700 hover:bg-red-600 text-white font-black py-4 rounded-xl text-xl shadow-lg action-btn uppercase"
                       >
                           Leave Ship (Disconnect)
                       </button>
                   </div>
               </div>
           </div>
       )}

       {modal.type === 'goal_achieved' && modal.data && (
           <div className="absolute inset-0 bg-black/95 flex items-center justify-center z-50 p-4"><div className="text-center max-w-2xl px-4"><h1 className="text-4xl md:text-6xl font-scifi text-yellow-400 mb-4">PHASE {modal.data.phase} COMPLETE!</h1><div className="text-2xl text-white mb-6 font-bold tracking-widest uppercase">Target Net Worth Achieved</div><div className="space-y-2 mb-10"><div className="text-lg md:text-xl text-cyan-300 italic opacity-95 leading-relaxed">BY Decree (G.O.D - Galactic Overlord Department / Galactic Overlord Decree):</div><div className="text-2xl md:text-4xl text-green-400 font-bold animate-pulse uppercase tracking-tight">License extended +{modal.data.daysExtended} D.A.Y.s (Depreciating Astrological Yardsticks)!</div><div className="text-xs text-white font-mono opacity-80 mt-4 uppercase">Neural verification complete. Advance to next threshold.</div></div><button onClick={()=>{ const { state: sData, nextPhase, report: rData } = modal.data; advancePhase(sData, nextPhase, rData); }} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-10 rounded-xl text-2xl shadow-[0_0_30px_rgba(16,185,129,0.6)] uppercase tracking-widest">Advance to Phase {modal.data.nextPhase}</button></div></div>
       )}

       {modal.type === 'endgame' && modal.data && (
           <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
               <h1 className="text-5xl md:text-7xl font-scifi text-red-600 mb-4 uppercase">{modal.data.isHighScore ? "Legendary Status" : "Neural Link Severed"}</h1>
               <div className="text-2xl text-white mb-2 uppercase font-black">{modal.data.reason}</div>
               <div className="text-4xl text-yellow-400 font-bold mb-8 font-mono"><PriceDisplay value={modal.data.netWorth} size="text-4xl" /></div>

               {!modal.data.isHighScore && (
                   <div className="text-red-500 font-bold text-lg mb-6 uppercase tracking-wider bg-red-950/20 px-6 py-3 border border-red-900/30 rounded animate-pulse text-center max-w-md">
                       You have not made it into the Legend list.
                   </div>
               )}

               {modal.data.isHighScore && (
                   <div className="mb-8 w-full max-w-md">
                       <input type="text" placeholder="Hall of Fame Alias" className="w-full p-4 bg-gray-900 border border-yellow-500 text-white text-xl rounded-xl text-center mb-3 outline-none" value={highScoreName || ''} onChange={e=>setHighScoreName(e.target.value)} maxLength={15} />
                       <button onClick={async ()=>{ if(!highScoreName) return; await postHighScore(highScoreName, modal.data.netWorth, modal.data.days, state?.achievements || []); const updated = await saveHighScore(highScoreName, modal.data.netWorth, modal.data.days, state?.achievements || []); setState(prev => prev ? ({...prev, highScores: updated}) : null); setModal({type:'highscores', data:null}); }} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-black py-3 rounded-xl text-lg uppercase shadow-xl">Submit Legacy</button>
                   </div>
               )}
               <div className="grid grid-cols-2 gap-8 text-center mb-8 text-gray-400">
                   <div>
                       <div className="text-[10px] uppercase font-bold tracking-widest mb-1">D.A.Y.s Survived</div>
                       <div className="text-3xl text-white font-mono">{modal.data.days}</div>
                   </div>
                   <div>
                       <div className="text-[10px] uppercase font-bold tracking-widest mb-1">Single Win Record</div>
                       <div className="text-3xl text-green-400 font-mono"><PriceDisplay value={modal.data.stats.largestSingleWin} size="text-3xl" compact/></div>
                   </div>
               </div>
               <div className="flex flex-wrap gap-4 justify-center mt-6">
                   <button onClick={() => { localStorage.removeItem('sbe_savegame'); initGame(false); }} className="bg-emerald-700 hover:bg-emerald-600 text-white font-black py-4 px-8 rounded-xl text-lg uppercase tracking-widest shadow-lg">New License</button>
                   <button onClick={() => { setModal({ type: 'credits', data: null }); SFX.play('click'); }} className="bg-blue-700 hover:bg-blue-600 text-white font-black py-4 px-8 rounded-xl text-lg uppercase tracking-widest shadow-lg">Watch Credits</button>
                   <button onClick={() => window.location.reload()} className="bg-red-700 hover:bg-red-600 text-white font-black py-4 px-8 rounded-xl text-lg uppercase tracking-widest shadow-lg">Sever Link</button>
               </div>
           </div>
       )}

       {modal.type === 'view_venue' && modal.data !== null && state && (
           <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-[9999] p-4 md:p-8 animate-in fade-in duration-300">
               <div className="max-w-4xl w-full h-[85vh] flex flex-col bg-slate-900 border border-cyan-500 rounded-3xl p-6 sci-fi-box relative shadow-[0_0_50px_rgba(6,182,212,0.3)]">
                   <h2 className="text-3xl font-scifi text-cyan-400 mb-4 text-center uppercase tracking-widest">{VENUES[modal.data]}</h2>
                   <div className="flex-grow overflow-hidden rounded-2xl border border-cyan-500/20 bg-black/40 flex items-center justify-center p-2 mb-6">
                       <img
                           src={VENUE_IMAGES[VENUES[modal.data]]}
                           alt={VENUES[modal.data]}
                           className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                       />
                   </div>
                   <button
                       onClick={() => {
                           SFX.play('click');
                           setModal({ type: 'none', data: null });
                       }}
                       className="w-full bg-cyan-600 hover:bg-cyan-505 text-white font-black py-4 rounded-xl text-xl shadow-lg uppercase transition-all active:scale-95 shrink-0 cursor-pointer"
                   >
                       Return to Trade Console
                   </button>
               </div>
           </div>
       )}

       {modal.type === 'view_venue_codex' && modal.data !== null && state && (
           <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-[9999] p-4 md:p-8 animate-in fade-in duration-300">
               <div className="max-w-4xl w-full h-[85vh] flex flex-col bg-slate-900 border border-orange-500 rounded-3xl p-6 sci-fi-box relative shadow-[0_0_50px_rgba(234,88,12,0.3)]">
                   <h2 className="text-3xl font-scifi text-orange-400 mb-4 text-center uppercase tracking-widest">{VENUES[modal.data]}</h2>
                   <div className="flex-grow overflow-hidden rounded-2xl border border-orange-500/20 bg-black/40 flex items-center justify-center p-2 mb-6">
                       <img
                           src={VENUE_IMAGES[VENUES[modal.data]]}
                           alt={VENUES[modal.data]}
                           className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                       />
                   </div>
                   <button
                       onClick={() => {
                           SFX.play('click');
                           setWikiTab('venues');
                           setModal({ type: 'wiki', data: null });
                       }}
                       className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-xl text-xl shadow-lg uppercase transition-all active:scale-95 shrink-0 cursor-pointer"
                   >
                       Return to Codex
                   </button>
               </div>
           </div>
       )}

       {modal.type === 'welcome' && (
           <div className="absolute inset-0 flex flex-col items-center justify-center z-50 overflow-hidden bg-transparent">
               <div className="crawl-container h-[70%]">
                  <div className="crawl-content space-y-12">
                     <h1 className="text-7xl md:text-9xl font-scifi text-white font-black text-center tracking-[0.2em] mb-20 uppercase whitespace-nowrap">$TAR BUCKS</h1>
                     <div className="text-yellow-500 text-4xl md:text-6xl font-bold leading-relaxed font-mono">
                        <p className="mb-10">Welcome, Captain.</p>
                        <p className="mb-10">Your former business partner has passed, leaving his debts... and his dreams... to you.</p>
                        <p className="mb-10">We have secured a <StarCoin size={48}/> 30,000 loan to buy out his Widow and reinstate our trading license, but your ship has been stripped down by mutiny.</p>
                        <p className="mb-10">Prepare to board the RR Firefox 22 RustyRedeemer: She’s 60% oxidation and 40% hope, but she’ll get your cargo across the sector if you treat her right.</p>
                     </div>
                  </div>
               </div>
               <div className="h-[30%] w-full flex flex-col items-center justify-center bg-gradient-to-t from-black via-black/50 to-transparent z-[100]">
                  <div className="flex justify-center px-4 w-full max-w-2xl">
                    <button onClick={()=>{setModal({type:'none', data:null}); startNewGame();}} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-6 px-4 md:px-16 rounded-xl text-2xl md:text-4xl shadow-[0_0_40px_rgba(16,185,129,0.5)] action-btn border-4 border-emerald-400 uppercase tracking-widest">Board Ship</button>
                  </div>
                   <p className="text-gray-500 font-mono text-[10px] mt-6 uppercase tracking-[0.4em]">Neural Link Interface v.13.0.3</p>
               </div>
           </div>
       )}

       {modal.type === 'load_save' && (
           <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
               <div className="bg-slate-900 border border-blue-500 p-8 rounded-3xl max-sm w-full sci-fi-box text-center relative shadow-2xl animate-in zoom-in-95 duration-300">
                   <h2 className="text-2xl font-black text-blue-400 mb-4 uppercase tracking-tighter">Backup Detected</h2>

                   {/* Name and Achievements (Enhancement 136) */}
                   {(() => {
                       try {
                           const sData = JSON.parse(localStorage.getItem('sbe_savegame') || '{}');
                           return (
                               <div className="mb-4 text-yellow-500 font-mono font-bold flex items-center justify-center gap-1">
                                   <span>{sData.playerName || "CAPTAIN SHANE"}</span>
                                   {renderAchievementIcons(sData)}
                               </div>
                           );
                       } catch {
                           return null;
                       }
                   })()}

                   <p className="text-gray-300 mb-8 font-mono text-sm uppercase">Neural backup detected from local cache. Resume active cycle?</p>
                   <div className="flex gap-4 justify-center">
                       <button onClick={()=>loadSavedGame()} className="bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-8 rounded-xl uppercase shadow-xl">Resume</button>
                       <button onClick={()=>{ localStorage.removeItem('sbe_savegame'); initGame(false); }} className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-8 rounded-xl uppercase">New Game</button>
                   </div>
               </div>
           </div>
       )}

       {modal.type === 'message' && (
           <div
               className="absolute inset-0 flex items-center justify-center z-50 p-4"
               style={state?.isMutinyActive ? {
                   backgroundImage: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(${strikeBg})`,
                   backgroundSize: 'cover',
                   backgroundPosition: 'center',
                   backgroundRepeat: 'no-repeat',
               } : {
                   backgroundColor: 'rgba(0,0,0,0.8)'
               }}
           >
               <div className="bg-slate-900 border border-gray-500 p-8 rounded-2xl max-w-lg w-full sci-fi-box text-center relative shadow-2xl">
                   <p className={`text-xl font-black mb-8 whitespace-pre-wrap leading-tight uppercase ${modal.color || 'text-white'}`}>{renderLogMessage(modal.data)}</p>
                   <button onClick={()=>{setModal({type:'none', data:null}); SFX.play('click'); if (state?.isMutinyActive) { setDismissedStrikeOverlay(true); } }} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-xl shadow-lg action-btn uppercase">Acknowledge</button>
               </div>
           </div>
       )}

       {modal.type === 'hostile_takeover_confirm' && modal.data && (
           <div className="absolute inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
               <div className="bg-slate-900 border-2 border-red-500 p-8 rounded-3xl max-w-xl w-full sci-fi-box text-center relative shadow-2xl animate-in zoom-in-95 duration-300">
                   <div className="text-red-500 text-5xl mb-4 animate-pulse font-scifi">⚠️</div>
                   <h3 className="text-red-400 font-bold text-2xl mb-4 uppercase tracking-widest font-scifi">Takeover Directive</h3>
                   <p className="text-gray-200 mb-6 text-sm uppercase leading-relaxed font-mono">
                       {state?.playerName || "Captain Shane"}, you are initiating a Hostile Takeover of <span className="text-cyan-400 font-black">{modal.data.name}</span>. You own <span className="text-yellow-400 font-black">{modal.data.quantity.toLocaleString()}</span> shares ({((modal.data.quantity / modal.data.totalShares) * 100).toFixed(1)}%).
                   </p>
                   <p className="text-gray-400 mb-8 text-xs uppercase leading-relaxed font-mono">
                       WARNING: SEIZING CONTROL INVOLVES EXTREME RISKS OF CORPORATE SABOTAGE, ANTITRUST REGULATORY FINES, AND LITIGATION INJUNCTIONS. PROCEED WITH EXTREME CAUTION.
                   </p>
                   <div className="flex flex-col gap-3">
                       <button
                           onClick={() => {
                               SFX.play('click');
                               handleHostileTakeover(modal.data.name);
                           }}
                           className="w-full bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-500 hover:to-yellow-500 text-white font-black py-4 rounded-xl text-lg uppercase tracking-wider shadow-lg action-btn"
                       >
                           ENACT TAKEOVER DIRECTIVE
                       </button>
                       <button
                           onClick={() => {
                               setModal({ type: 'banking', data: null });
                               SFX.play('click');
                           }}
                           className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold py-3 rounded-xl text-md uppercase"
                       >
                           ABORT MISSION
                       </button>
                   </div>
               </div>
           </div>
       )}

       {modal.type === 'hostile_takeover_resolution' && modal.data && (
           <div className="absolute inset-0 bg-black/98 flex items-center justify-center z-50 p-4">
               <div className="bg-slate-900 border-2 border-cyan-500 p-8 rounded-3xl max-w-2xl w-full sci-fi-box relative shadow-2xl animate-in zoom-in-95 duration-500 overflow-y-auto max-h-[90vh]">
                   <h3 className="text-cyan-400 font-black text-3xl mb-6 text-center uppercase tracking-widest font-scifi">Takeover Assessment</h3>

                   {modal.data.outcomeType === 'success' && (
                       <div className="space-y-6 text-center">
                           <div className="text-green-400 text-6xl animate-bounce">🏆</div>
                           <h4 className="text-green-400 font-bold text-xl uppercase tracking-wider font-scifi">Board Capitulation Successful</h4>
                           <p className="text-gray-300 font-mono text-sm leading-relaxed uppercase">
                               The Board of Directors has surrendered! You have successfully acquired <span className="text-white font-bold">{modal.data.stockName}</span>. Choose how to merge the corporate assets:
                           </p>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                               <button
                                   onClick={() => {
                                       const val = modal.data.stockVal * 1.5;
                                       setState(prev => {
                                           if (!prev || !prev.stocks) return null;
                                           const updatedStocks = prev.stocks.map(st =>
                                               st.name === modal.data.stockName ? { ...st, quantity: 0, availableQuantity: st.totalShares, takeoverSuccessful: true } : st
                                           );
                                           return {
                                               ...prev,
                                               cash: prev.cash + val,
                                               stocks: updatedStocks
                                           };
                                       });
                                       log(`TAKEOVER: Successfully liquidated ${modal.data.stockName} for Golden Parachute payout of +${formatCurrencyLog(val)}!`, 'sell');
                                       SFX.play('success');
                                        setModal({ type: 'banking', data: null });
                                        setBankingTab('stocks');
                                   }}
                                   className="bg-green-700 hover:bg-green-600 text-white p-4 rounded-xl border border-green-500 flex flex-col items-center justify-center transition-all action-btn"
                               >
                                   <span className="font-bold text-sm uppercase mb-1">Golden Parachute Cash-Out</span>
                                   <span className="text-xs font-mono text-green-200">Payout: +<PriceDisplay value={modal.data.stockVal * 1.5} size="text-xs" compact /></span>
                               </button>
                               <button
                                   onClick={() => {
                                       setState(prev => {
                                           if (!prev || !prev.stocks) return null;
                                           const updatedStocks = prev.stocks.map(st =>
                                               st.name === modal.data.stockName ? { ...st, quantity: 0, availableQuantity: st.totalShares, takeoverSuccessful: true } : st
                                           );
                                           return {
                                               ...prev,
                                               dailyDividends: (prev.dailyDividends || 0) + 25000,
                                               stocks: updatedStocks
                                           };
                                       });
                                       log(`TAKEOVER: Secured control of ${modal.data.stockName}. Permanent daily dividend of +$B 25,000 established.`, 'buy');
                                       SFX.play('success');
                                        setModal({ type: 'banking', data: null });
                                        setBankingTab('stocks');
                                   }}
                                   className="bg-cyan-700 hover:bg-cyan-600 text-white p-4 rounded-xl border border-cyan-500 flex flex-col items-center justify-center transition-all action-btn"
                               >
                                   <span className="font-bold text-sm uppercase mb-1">Establish Dividend Feed</span>
                                   <span className="text-xs font-mono text-cyan-200">Yield: +$B 25,000 / Day</span>
                               </button>
                           </div>
                       </div>
                   )}

                   {modal.data.outcomeType === 'resistance' && (() => {
                       const soldCount = Math.floor(modal.data.sharesCount * 0.5);
                       const payout = soldCount * modal.data.stockPrice * 1.25;
                       return (
                           <div className="space-y-6 text-center">
                               <div className="text-yellow-500 text-6xl animate-pulse">⚖️</div>
                               <h4 className="text-yellow-400 font-bold text-xl uppercase tracking-wider font-scifi">Injunction Filed by Board</h4>
                               <p className="text-gray-300 font-mono text-sm leading-relaxed uppercase">
                                   The Board is fighting back! They have hired an elite legal defense team and filed a federal antitrust injunction to freeze your shares.
                               </p>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                   <button
                                       disabled={state.cash < 250000}
                                       onClick={() => {
                                           setState(prev => {
                                               if (!prev || !prev.stocks) return null;
                                               const updatedStocks = prev.stocks.map(st =>
                                                   st.name === modal.data.stockName ? { ...st, quantity: 0, availableQuantity: st.totalShares, takeoverSuccessful: true } : st
                                               );
                                               return {
                                                   ...prev,
                                                   cash: prev.cash - 250000,
                                                   dailyDividends: (prev.dailyDividends || 0) + 25000,
                                                   stocks: updatedStocks
                                               };
                                           });
                                           log(`TAKEOVER: Overpowered litigation of ${modal.data.stockName} for $250,000. Permanent dividend of +$B 25,000 established.`, 'buy');
                                           SFX.play('success');
                                            setModal({ type: 'banking', data: null });
                                            setBankingTab('stocks');
                                       }}
                                       className="bg-blue-700 hover:bg-blue-600 disabled:bg-gray-800 disabled:opacity-50 text-white p-4 rounded-xl border border-blue-500 flex flex-col items-center justify-center transition-all action-btn"
                                   >
                                       <span className="font-bold text-sm uppercase mb-1">Retain Elite Defense lawyers</span>
                                       <span className="text-xs font-mono text-blue-200">Cost: -$B 250,000 || Yield: +$B 25,000 / Day</span>
                                   </button>
                                   <button
                                       onClick={() => {
                                           setState(prev => {
                                               if (!prev || !prev.stocks) return null;
                                               const updatedStocks = prev.stocks.map(st =>
                                                   st.name === modal.data.stockName ? { ...st, quantity: st.quantity - soldCount, availableQuantity: (st.availableQuantity || 0) + soldCount } : st
                                               );
                                               return {
                                                   ...prev,
                                                   cash: prev.cash + payout,
                                                   stocks: updatedStocks
                                               };
                                           });
                                           log(`TAKEOVER: Settled out of court with ${modal.data.stockName}. Sold ${soldCount.toLocaleString()} shares at 1.25x premium for +${formatCurrencyLog(payout)}.`, 'sell');
                                           SFX.play('success');
                                            setModal({ type: 'banking', data: null });
                                            setBankingTab('stocks');
                                       }}
                                       className="bg-yellow-700 hover:bg-yellow-600 text-white p-4 rounded-xl border border-yellow-500 flex flex-col items-center justify-center transition-all action-btn"
                                   >
                                       <span className="font-bold text-sm uppercase mb-1">Settle & Divest Stake</span>
                                       <span className="text-xs font-mono text-yellow-200">Payout: +<PriceDisplay value={payout} size="text-xs" compact /> (Divests 50%)</span>
                                   </button>
                               </div>
                           </div>
                       );
                   })()}

                   {modal.data.outcomeType === 'sabotage' && (
                       <div className="space-y-6 text-center">
                           <div className="text-red-500 text-6xl animate-bounce">💥</div>
                           <h4 className="text-red-500 font-bold text-xl uppercase tracking-wider font-scifi">Rogue Executive Sabotage</h4>
                           <p className="text-gray-300 font-mono text-sm leading-relaxed uppercase">
                               The corporate executives panicked! They ransacked the vault, liquidated core assets, sabotaged operations, and fled to the Outer Rim, crashing stock values by 60%.
                           </p>
                           <p className="text-green-400 font-mono text-xs uppercase leading-relaxed">
                               However, your salvage crews raided their physical warehouses, recovering +20% consolidation buyout in cash, plus 15 units of <span className="font-bold">{MESH_NAME}</span> and 50 units of <span className="font-bold">Allthemantium Ore</span>!
                           </p>
                           <div className="pt-4">
                               <button
                                   onClick={() => {
                                       const consolidationCash = modal.data.stockVal * 0.20;
                                       setState(prev => {
                                           if (!prev || !prev.stocks) return null;
                                           const updatedStocks = prev.stocks.map(st => {
                                               if (st.name === modal.data.stockName) {
                                                   return { ...st, price: Math.round(st.price * 0.40), quantity: 0, availableQuantity: st.totalShares };
                                               }
                                               return st;
                                           });
                                           const newCargo = { ...prev.cargo };
                                           newCargo[MESH_NAME] = { quantity: (newCargo[MESH_NAME]?.quantity || 0) + 15, averageCost: 0 };
                                           newCargo['Allthemantium Ore'] = { quantity: (newCargo['Allthemantium Ore']?.quantity || 0) + 50, averageCost: 0 };

                                           return {
                                               ...prev,
                                               cash: prev.cash + consolidationCash,
                                               cargo: newCargo,
                                               cargoWeight: prev.cargoWeight + (15 * 2.5) + (50 * 5.0),
                                               stocks: updatedStocks
                                           };
                                       });
                                       log(`TAKEOVER: ${modal.data.stockName} executives sabotaged the firm. Salvaged +${formatCurrencyLog(consolidationCash)} cash, 15 Mesh, and 50 Allthemantium Ore.`, 'maintenance');
                                       SFX.play('explosion');
                                        setModal({ type: 'banking', data: null });
                                        setBankingTab('stocks');
                                   }}
                                   className="w-full bg-red-700 hover:bg-red-600 text-white font-black py-4 rounded-xl text-lg uppercase tracking-widest shadow-lg action-btn"
                               >
                                    RETURN TO I.B.A.N.K. HUB
                               </button>
                           </div>
                       </div>
                   )}

                   {modal.data.outcomeType === 'regulatory' && (
                       <div className="space-y-6 text-center">
                           <div className="text-red-500 text-6xl animate-pulse">🚨</div>
                           <h4 className="text-red-500 font-bold text-xl uppercase tracking-wider font-scifi">Antitrust Regulatory Fine</h4>
                           <p className="text-gray-300 font-mono text-sm leading-relaxed uppercase">
                               The Interstellar Trade Commission stepped in! They blocked the monopoly and hit you with an antitrust policy fine of -$B 150,000, forcing divestment of 10% of total shares at a 10% discount.
                           </p>
                           <div className="pt-4">
                               <button
                                   onClick={() => {
                                       const forcedShares = Math.floor(modal.data.totalShares * 0.10);
                                       const divestedShares = Math.min(modal.data.sharesCount, forcedShares);
                                       const divestmentRevenue = divestedShares * modal.data.stockPrice * 0.90;

                                       setState(prev => {
                                           if (!prev || !prev.stocks) return null;
                                           const updatedStocks = prev.stocks.map(st => {
                                               if (st.name === modal.data.stockName) {
                                                   return {
                                                       ...st,
                                                       quantity: st.quantity - divestedShares,
                                                       availableQuantity: (st.availableQuantity || 0) + divestedShares
                                                   };
                                               }
                                               return st;
                                           });
                                           return {
                                               ...prev,
                                               cash: prev.cash - 150000 + divestmentRevenue,
                                               stocks: updatedStocks
                                           };
                                       });
                                       log(`TAKEOVER: Monopolization fine paid (-$150,000). Forced divestment of ${divestedShares.toLocaleString()} shares of ${modal.data.stockName} for +${formatCurrencyLog(divestmentRevenue)}.`, 'maintenance');
                                       SFX.play('laser');
                                        setModal({ type: 'banking', data: null });
                                        setBankingTab('stocks');
                                   }}
                                   className="w-full bg-red-700 hover:bg-red-600 text-white font-black py-4 rounded-xl text-lg uppercase tracking-widest shadow-lg action-btn"
                               >
                                    RETURN TO I.B.A.N.K. HUB
                               </button>
                           </div>
                       </div>
                   )}
               </div>
           </div>
       )}

       {modal.type === 'cargo_capacity_ship_confirm' && modal.data && (
           <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
               <div className="bg-slate-900 border-2 border-red-500 p-8 rounded-3xl max-w-xl w-full sci-fi-box text-center relative shadow-2xl">
                   <h3 className="text-red-400 font-bold text-2xl mb-4 uppercase tracking-widest font-scifi">
                       {modal.data.isProactive ? "Cargo Space Optimization" : "Cargo Overfill Warning"}
                   </h3>
                   <p className="text-gray-300 mb-6 text-sm uppercase leading-relaxed font-mono">
                       {modal.data.isProactive
                           ? `You have commodities in cargo that can be stored to free up space. Choose an optimized logistics strategy before departure:`
                           : `Your cargo hold is currently overloaded (${Math.round(state.cargoWeight)}/${state.cargoCapacity}T). Please optimize your cargo hold by auto-shipping commodities to remote storage:`
                       }
                   </p>
                   <div className="bg-black/40 p-4 rounded-xl border border-gray-800 mb-6 text-left text-xs font-mono space-y-2">
                       <div className="text-yellow-400 font-bold uppercase border-b border-gray-800 pb-2 mb-2">Logistics Summary</div>
                       <div>Eligible Shipped Weight: <span className="text-white font-bold">{Math.round(modal.data.totalShippedWeight)}T</span></div>
                       <div>Required Travel Reserved Weight: <span className="text-white font-bold">{Math.round(modal.data.remainingWeightAfterShipping)}T</span></div>
                       <div>Logistics Fee Per Cargo Unit: <span className="text-white font-bold">100 / T</span></div>
                       <div>Total estimated logistics fee: <span className="text-yellow-500 font-bold"><PriceDisplay value={Math.ceil(modal.data.totalShippedWeight * 100)} size="text-xs" compact /></span></div>
                   </div>
                   <div className="flex flex-col gap-3">
                       {/*
                         STRATEGY 1: Ship item individually to best-selling location.
                         Ships each commodity directly to its highest-paying venue across the sector.
                         This is ideal for securing peak sale opportunities upon arrival.
                       */}
                       <button onClick={() => {
                           const { destIdx, fuel, missingFuel, missingCells, newStateForTravel, shippedItems, totalShippedWeight } = modal.data;
                           const baseState = newStateForTravel || state;
                           const ns = JSON.parse(JSON.stringify(baseState));

                           // 1. Resolve spice fuel and hot isotopes required for the trip first!
                           if (missingFuel > 0 || missingCells > 0) {
                               const fuelPrice = COMMODITIES.find(c => c.name === FUEL_NAME)!.maxPrice;
                               const cellPrice = COMMODITIES.find(c => c.name === POWER_CELL_NAME)!.maxPrice;
                               const cost = (missingFuel * fuelPrice) + (missingCells * cellPrice);

                               const overdraftFee = ns.cash < cost ? cost * 0.10 : 0;
                               const totalCost = cost + overdraftFee;
                               ns.cash -= totalCost;

                               if (missingFuel > 0) {
                                   if (!ns.cargo[FUEL_NAME]) ns.cargo[FUEL_NAME] = { quantity: 0, averageCost: 0 };
                                   const curF = ns.cargo[FUEL_NAME];
                                   ns.cargo[FUEL_NAME] = {
                                       quantity: curF.quantity + missingFuel,
                                       averageCost: ((curF.quantity * curF.averageCost) + (missingFuel * fuelPrice)) / (curF.quantity + missingFuel)
                                   };
                                   ns.cargoWeight += missingFuel * COMMODITIES.find(c => c.name === FUEL_NAME)!.unitWeight;
                               }
                               if (missingCells > 0) {
                                   if (!ns.cargo[POWER_CELL_NAME]) ns.cargo[POWER_CELL_NAME] = { quantity: 0, averageCost: 0 };
                                   const curC = ns.cargo[POWER_CELL_NAME];
                                   ns.cargo[POWER_CELL_NAME] = {
                                       quantity: curC.quantity + missingCells,
                                       averageCost: ((curC.quantity * curC.averageCost) + (missingCells * cellPrice)) / (curC.quantity + missingCells)
                                   };
                                   ns.cargoWeight += missingCells * COMMODITIES.find(c => c.name === POWER_CELL_NAME)!.unitWeight;
                               }

                               log(`EMERGENCY: Auto-bought ${missingFuel} Fuel and ${missingCells} Cells at max price.`, 'maintenance');
                               if (overdraftFee > 0) log(`OVERDRAFT FEE: Paid ${formatCurrencyLog(overdraftFee)} for emergency purchase.`, 'overdraft');
                               SFX.play('coin');
                           }

                           // 2. Compute logistics/shipping cost and subtract it (allowing overdraft)
                           const shippingCost = Math.ceil(totalShippedWeight * 100);
                           const willDebit = ns.cash < shippingCost;
                           const interestFee = willDebit ? Math.ceil(shippingCost * 0.10) : 0;
                           const totalCost = shippingCost + interestFee;
                           ns.cash -= totalCost;
                           ns.cargoWeight = Math.max(0, ns.cargoWeight - totalShippedWeight);

                           // 3. Ship items individually to their highest-paying venues
                           shippedItems.forEach((item: any) => {
                               const targetDest = getHighestPayingVenue(item.name, ns.markets, ns.currentVenueIndex);

                               const cargoItem = ns.cargo[item.name];
                               if (cargoItem) {
                                   cargoItem.quantity -= item.quantity;
                                   if (cargoItem.quantity <= 0) {
                                       delete ns.cargo[item.name];
                                   }
                               }

                               if (!ns.warehouse[targetDest]) ns.warehouse[targetDest] = {};
                               const existing = ns.warehouse[targetDest][item.name];
                               if (existing) {
                                   existing.quantity += item.quantity;
                                   existing.originalAvgCost = ((existing.quantity * existing.originalAvgCost) + (item.quantity * item.averageCost)) / (existing.quantity + item.quantity);
                               } else {
                                   ns.warehouse[targetDest][item.name] = {
                                       quantity: item.quantity,
                                       originalAvgCost: item.averageCost,
                                       arrivalDay: ns.day + 1
                                   };
                               }
                           });

                           log(`LOGISTICS: Shipped overloaded cargo individually to best-selling venues. Fee: ${formatCurrencyLog(shippingCost)} paid.`, 'buy');
                           if (interestFee > 0) {
                               log(`OVERDRAFT FEE: Paid interest of ${formatCurrencyLog(interestFee)} for traveling overloaded in debit.`, 'overdraft');
                               SFX.play('error');
                           }

                           // 4. Travel! Calling handleTravel directly bypasses the redundant/broken triggerTravelExecution
                           handleTravel(destIdx, fuel, travelConfig.insurance, travelConfig.mining, travelConfig.overload, travelConfig.invest95, ns);
                       }} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl text-md shadow-lg action-btn uppercase">
                           Ship item individually to best-selling location & Jump (-<PriceDisplay value={Math.ceil(modal.data.totalShippedWeight * 100)} size="text-sm" compact />)
                       </button>

                       {/*
                         STRATEGY 2: Ship all to destination travelling to.
                         Ships all commodities directly to the destination venue index.
                       */}
                       <button onClick={() => {
                           const { destIdx, fuel, missingFuel, missingCells, newStateForTravel, shippedItems, totalShippedWeight } = modal.data;
                           const baseState = newStateForTravel || state;
                           const ns = JSON.parse(JSON.stringify(baseState));

                           // 1. Resolve spice fuel and hot isotopes required for the trip first!
                           if (missingFuel > 0 || missingCells > 0) {
                               const fuelPrice = COMMODITIES.find(c => c.name === FUEL_NAME)!.maxPrice;
                               const cellPrice = COMMODITIES.find(c => c.name === POWER_CELL_NAME)!.maxPrice;
                               const cost = (missingFuel * fuelPrice) + (missingCells * cellPrice);

                               const overdraftFee = ns.cash < cost ? cost * 0.10 : 0;
                               const totalCost = cost + overdraftFee;
                               ns.cash -= totalCost;

                               if (missingFuel > 0) {
                                   if (!ns.cargo[FUEL_NAME]) ns.cargo[FUEL_NAME] = { quantity: 0, averageCost: 0 };
                                   const curF = ns.cargo[FUEL_NAME];
                                   ns.cargo[FUEL_NAME] = {
                                       quantity: curF.quantity + missingFuel,
                                       averageCost: ((curF.quantity * curF.averageCost) + (missingFuel * fuelPrice)) / (curF.quantity + missingFuel)
                                   };
                                   ns.cargoWeight += missingFuel * COMMODITIES.find(c => c.name === FUEL_NAME)!.unitWeight;
                               }
                               if (missingCells > 0) {
                                   if (!ns.cargo[POWER_CELL_NAME]) ns.cargo[POWER_CELL_NAME] = { quantity: 0, averageCost: 0 };
                                   const curC = ns.cargo[POWER_CELL_NAME];
                                   ns.cargo[POWER_CELL_NAME] = {
                                       quantity: curC.quantity + missingCells,
                                       averageCost: ((curC.quantity * curC.averageCost) + (missingCells * cellPrice)) / (curC.quantity + missingCells)
                                   };
                                   ns.cargoWeight += missingCells * COMMODITIES.find(c => c.name === POWER_CELL_NAME)!.unitWeight;
                               }

                               log(`EMERGENCY: Auto-bought ${missingFuel} Fuel and ${missingCells} Cells at max price.`, 'maintenance');
                               if (overdraftFee > 0) log(`OVERDRAFT FEE: Paid ${formatCurrencyLog(overdraftFee)} for emergency purchase.`, 'overdraft');
                               SFX.play('coin');
                           }

                           // 2. Compute logistics/shipping cost and subtract it (allowing overdraft)
                           const shippingCost = Math.ceil(totalShippedWeight * 100);
                           const willDebit = ns.cash < shippingCost;
                           const interestFee = willDebit ? Math.ceil(shippingCost * 0.10) : 0;
                           const totalCost = shippingCost + interestFee;
                           ns.cash -= totalCost;
                           ns.cargoWeight = Math.max(0, ns.cargoWeight - totalShippedWeight);

                           // 3. Ship all items to the chosen destination venue index
                           shippedItems.forEach((item: any) => {
                               const targetDest = destIdx;

                               const cargoItem = ns.cargo[item.name];
                               if (cargoItem) {
                                   cargoItem.quantity -= item.quantity;
                                   if (cargoItem.quantity <= 0) {
                                       delete ns.cargo[item.name];
                                   }
                               }

                               if (!ns.warehouse[targetDest]) ns.warehouse[targetDest] = {};
                               const existing = ns.warehouse[targetDest][item.name];
                               if (existing) {
                                   existing.quantity += item.quantity;
                                   existing.originalAvgCost = ((existing.quantity * existing.originalAvgCost) + (item.quantity * item.averageCost)) / (existing.quantity + item.quantity);
                               } else {
                                   ns.warehouse[targetDest][item.name] = {
                                       quantity: item.quantity,
                                       originalAvgCost: item.averageCost,
                                       arrivalDay: ns.day + 1
                                   };
                               }
                           });

                           log(`LOGISTICS: Shipped overloaded cargo to destination travelling to (${VENUES[destIdx]}). Fee: ${formatCurrencyLog(shippingCost)} paid.`, 'buy');
                           if (interestFee > 0) {
                               log(`OVERDRAFT FEE: Paid interest of ${formatCurrencyLog(interestFee)} for traveling overloaded in debit.`, 'overdraft');
                               SFX.play('error');
                           }

                           // 4. Travel! Calling handleTravel directly bypasses the redundant/broken triggerTravelExecution
                           handleTravel(destIdx, fuel, travelConfig.insurance, travelConfig.mining, travelConfig.overload, travelConfig.invest95, ns);
                       }} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-md shadow-lg action-btn uppercase">
                           Ship all to destination travelling to & Jump (-<PriceDisplay value={Math.ceil(modal.data.totalShippedWeight * 100)} size="text-sm" compact />)
                       </button>

                       <button onClick={() => { setModal({ type: 'travel', data: null }); SFX.play('click'); }} className="w-full bg-slate-800 hover:bg-slate-700 text-gray-400 font-bold py-2 rounded-xl uppercase">
                           Cancel Flight
                       </button>
                   </div>
               </div>
           </div>
       )}

       {modal.type === 'stock_limit_confirm' && modal.data && (
           <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4"><div className="bg-slate-900 border border-yellow-500 p-6 rounded-xl max-w-sm w-full sci-fi-box relative shadow-2xl"><h3 className="text-yellow-400 font-bold mb-2 uppercase tracking-widest">Insufficient Stock</h3><p className="text-gray-300 mb-4 text-sm font-bold uppercase">Requested: {modal.data.quantity} <br/>Available: {modal.data.actualStock}</p><div className="flex gap-2"><button onClick={()=>{ executeTrade({...modal.data, quantity: modal.data.actualStock}); }} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-2 rounded-xl font-black shadow-md uppercase">Buy Available</button><button onClick={()=>{setModal({type:'none', data:null}); SFX.play('click');}} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-xl uppercase">Cancel</button></div></div></div>
       )}

       {modal.type === 'tax_confirm' && modal.data && (
           <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4"><div className="bg-slate-900 border border-red-500 p-6 rounded-xl max-sm w-full sci-fi-box relative shadow-2xl"><h3 className="text-red-400 font-bold mb-2 uppercase tracking-widest">Trade Tax</h3><p className="text-gray-300 mb-4 text-sm font-bold uppercase leading-relaxed">Multiple transactions on this commodity today. A 5% tax (<PriceDisplay value={modal.data.tax} size="text-sm"/>) applied.</p><div className="flex gap-2"><button onClick={()=>{ executeTrade(modal.data); }} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-xl font-black shadow-md uppercase">Trade</button><button onClick={()=>{setModal({type:'none', data:null}); SFX.play('click');}} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-xl uppercase">Cancel</button></div></div></div>
       )}

      {modal.type === 'fabrication_prompt' && modal.data && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-orange-500 p-8 rounded-2xl max-w-lg w-full sci-fi-box text-center relative shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                <p className="text-xl font-black mb-4 text-orange-400 font-scifi tracking-wider uppercase">FABRICATION MATRIX ACTIVE</p>
                <p className="text-lg mb-4 text-gray-200">Successfully created <span className="text-white font-black">{modal.data.quantity}</span> unit(s) of <span className="text-emerald-400 font-black">{modal.data.name}</span>.</p>
                <div className="bg-black/40 border border-orange-500/20 rounded-xl p-4 mb-6">
                    <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">Matrix Status Scan</p>
                    <p className="text-sm font-bold text-yellow-500 uppercase">{modal.data.remainingName} fabrication is still available and UNLOCKED.</p>
                </div>
                <div className="flex flex-col gap-3">
                     <button
                        onClick={() => { setModal({ type: 'fomo', data: null }); SFX.play('click'); }}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-xl text-md shadow-lg action-btn uppercase font-scifi"
                    >
                        Remain & Fabricate {modal.data.remainingName}
                    </button>
                     <button
                        onClick={() => { setModal({ type: 'none', data: null }); SFX.play('click'); }}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold py-3 rounded-xl text-sm transition-all uppercase"
                    >
                        Return to Console Screen
                    </button>
                </div>
            </div>
        </div>
      )}

      {modal.type === 'fabrication_success' && modal.data && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-green-500 p-8 rounded-2xl max-w-lg w-full sci-fi-box text-center relative shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                <p className="text-xl font-black mb-4 text-white">FABRICATION SUCCESSFUL</p>
                <p className="text-lg mb-8 text-gray-300">Successfully created {modal.data.quantity} unit(s) of {modal.data.name}.</p>
                 <button
                    onClick={() => { setModal({ type: 'none', data: null }); SFX.play('click'); }}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-xl shadow-lg action-btn uppercase"
                >
                    Return to Console
                </button>
            </div>
        </div>
      )}

      {modal.type === 'banking_transaction_success' && modal.data && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-green-500 p-8 rounded-2xl max-w-lg w-full sci-fi-box text-center relative shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                <p className="text-xl font-black mb-4 text-white">TRANSACTION SUCCESSFUL</p>
                <p className="text-lg mb-8 text-gray-300">{renderLogMessage(modal.data.message)}</p>
                <button
                    onClick={() => { setModal({ type: 'none', data: null }); SFX.play('click'); }}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-xl shadow-lg action-btn uppercase"
                >
                    Return to Console
                </button>
            </div>
        </div>
      )}

      {modal.type === 'scanner_actions' && modal.data && (
        (() => {
          const level = modal.data.level;
          const title = level === 2 ? "Fix Commodity Price" : "Boost Price Range";
          const description = level === 2
              ? "Select a commodity. Its price at all venues will be locked for the next day."
              : "Select a commodity. Its maximum price range will be permanently increased by 11-22%.";

          return (
              <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
                  <div className="bg-slate-900 border border-cyan-500 p-8 rounded-2xl max-w-4xl w-full sci-fi-box">
                      <div className="flex justify-between items-center mb-2">
                          <h2 className="text-2xl font-scifi text-cyan-400">{title}</h2>
                          <button onClick={() => setModal({ type: 'shop', data: null })} className="text-red-500 font-bold hover:text-red-400"><XCircle /></button>
                      </div>
                      <p className="text-cyan-200 text-sm mb-4">{description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar flex-grow p-1 max-h-96">
                          {COMMODITIES.map(c => (
                              <button
                                  key={c.name}
                                  onClick={() => {
                                      if (level === 2) {
                                          const prices = state.markets.map(m => m?.[c.name]?.price || 0);
                                          setState(prev => {
                                              if (!prev) return null;
                                              let consecutive = prev.scannerConsecutiveDays || 0;
                                              if (prev.scannerLastUsedDay !== prev.day) {
                                                  consecutive = (prev.scannerLastUsedDay === prev.day - 1) ? consecutive + 1 : 1;
                                              }
                                              return {
                                                  ...prev,
                                                  pendingFixedCommodity: { name: c.name, venuePrices: prices, daySet: prev.day },
                                                  scannerLastUsedDay: prev.day,
                                                  scannerConsecutiveDays: consecutive
                                              };
                                          });
                                          log(`SCANNER: Price of ${c.name} fixed for next day.`, 'info');
                                      } else {
                                          setState(prev => {
                                              if (!prev) return null;
                                              let consecutive = prev.scannerConsecutiveDays || 0;
                                              if (prev.scannerLastUsedDay !== prev.day) {
                                                  consecutive = (prev.scannerLastUsedDay === prev.day - 1) ? consecutive + 1 : 1;
                                              }
                                              return {
                                                  ...prev,
                                                  pendingBoostedCommodity: { name: c.name, boostedDay: prev.day },
                                                  scannerLastUsedDay: prev.day,
                                                  scannerConsecutiveDays: consecutive
                                              };
                                          });
                                          log(`SCANNER: Price range of ${c.name} permanently boosted for next day.`, 'info');
                                      }
                                      SFX.play('success');
                                      setModal({ type: 'shop', data: null });
                                  }}
                                  className="bg-slate-800 p-4 rounded-xl border-2 border-slate-700 flex flex-col items-center justify-center hover:border-cyan-500/50 transition-all"
                              >
                                  <div className="text-4xl mb-2">{c.icon === 'metal-lump' ? '🌑' : c.icon}</div>
                                  <div className="text-white font-bold text-center">{c.name}</div>
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          );
        })()
      )}
    </div>
  );
}
