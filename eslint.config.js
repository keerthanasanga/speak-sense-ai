const js = require("@eslint/js");
const react = require("eslint-plugin-react");
const globals = require("globals");

module.exports = [
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
            "react/prop-types": "off"
        }
    }
];
