import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default tseslint.config(
    {
        plugins: {
            ['@typescript-eslint']: tseslint.plugin,
            ['import']: importPlugin,
            ['react']: reactPlugin,
            ['react-hooks']: reactHooksPlugin,
            ['react-hooks']: fixupPluginRules(reactHooksPlugin),
            ['react-refresh']: reactRefresh,
        },
    },

    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
        ],
    },

    js.configs.recommended,
    ...tseslint.configs.recommended,
    compat.extends('airbnb-base'),

    {
        files: ['**/*.{js,jsx,ts,tsx}'],

        extends: [
            reactPlugin.configs.flat.recommended,
            fixupConfigRules(compat.config(reactHooksPlugin.configs.recommended)),
        ],

        languageOptions: {
            globals: {
                ...globals.browser,
                React: true,
            },

            ecmaVersion: 'latest',
            sourceType: 'module',

            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },

                requireConfigFile: false,
            },
        },

        settings: {
            react: {
                version: 'detect',
            },

            'import/parsers': {
                '@typescript-eslint/parser': ['.ts', '.tsx'],
            },

            'import/resolver': {
                typescript: true,
                node: true,
            },
        },

        rules: {
            indent: ['error', 4],
            'no-continue': ['warn'],
            'no-console': ['error'],
            'class-methods-use-this': ['warn'],

            'no-restricted-syntax': [
                'error',
                {
                    selector: 'LabeledStatement',
                    message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
                },
                {
                    selector: 'WithStatement',
                    message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
                },
            ],

            'import/no-cycle': ['warn'],
            'import/prefer-default-export': ['warn'],
            'import/extensions': ['error', 'ignorePackages'],

            'react-refresh/only-export-components': ['warn', {
                allowConstantExport: true,
            }],

            'no-plusplus': 'off',
            'no-bitwise': 'off',
            'no-await-in-loop': 'off',
            'no-use-before-define': 'off',
            'react/prop-types': 'off',

            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['error'],
        },
    },
);
