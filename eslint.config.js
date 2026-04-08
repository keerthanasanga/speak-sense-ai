const js = require("@eslint/js");
const react = require("eslint-plugin-react");
const globals = require("globals");

module.exports = [
    {
        ignores: [
            "**/node_modules/**",
            "client/build/**",
            "client/public/avatar-system/**",
            "client/src/components/Interview3D/three.module.js"
        ]
    },
    js.configs.recommended,
    {
        files: ["**/*.{js,jsx}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.jest
            },
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                }
            }
        },
        plugins: {
            react
        },
        settings: {
            react: {
                version: "detect"
            }
        },
        rules: {
            "react/prop-types": "off",
            "react/jsx-uses-vars": "error",
            "react/jsx-uses-react": "off",
            "no-unused-vars": "off",
            "no-undef": "off",
            "no-useless-escape": "off",
            "no-dupe-keys": "off"
        }
    }
];
