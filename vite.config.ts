/**
 * Vite Configuration File
 * Purpose: Sets up the build environment, development server, and plugins for the application.
 * Key Features:
 *   - Configures the relative base path (`./`) for correct asset loading on subpaths like GitHub Pages.
 *   - Integrates the React plugin for hot module reloading and transpilation.
 *   - Integrates Tailwind CSS v4 compiler for build-time stylesheet generation.
 *   - Defines environment variables such as the Gemini API Key.
 *   - Establishes a module path alias (`@`) pointing to the root directory.
 */

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    // Load environment variables based on the current mode (development/production)
    const env = loadEnv(mode, '.', '');

    return {
      base: '/Starbuck-new-instance-created-10-01-2026/', // Essential for GitHub Pages subfolder routing
      server: {
        port: 3000,
        host: '0.0.0.0',
      },

      // Build-time plugins (React Support & Tailwind CSS v4)
      plugins: [
        react(),
        tailwindcss(),
      ],

      // Define global constants for process.env references
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },

      // Resolve path aliases to make imports cleaner
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
