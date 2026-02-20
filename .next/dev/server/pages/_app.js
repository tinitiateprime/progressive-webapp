/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "(pages-dir-node)/./src/context/ThemeContext.tsx":
/*!**************************************!*\
  !*** ./src/context/ThemeContext.tsx ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   ThemeContext: () => (/* binding */ ThemeContext)\n/* harmony export */ });\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);\n\nconst ThemeContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_0__.createContext)({\n    theme: \"light\",\n    toggleTheme: ()=>{}\n});\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL3NyYy9jb250ZXh0L1RoZW1lQ29udGV4dC50c3giLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQXNDO0FBSS9CLE1BQU1DLDZCQUFlRCxvREFBYUEsQ0FHdEM7SUFDREUsT0FBTztJQUNQQyxhQUFhLEtBQU87QUFDdEIsR0FBRyIsInNvdXJjZXMiOlsiQzpcXFVzZXJzXFxkZXZlbG9wZXJcXERlc2t0b3BcXE5ldyBmb2xkZXIgKDMpXFxwd2EgbWFpbiBmb2xkZXJcXHB3YVxcc3JjXFxjb250ZXh0XFxUaGVtZUNvbnRleHQudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZUNvbnRleHQgfSBmcm9tIFwicmVhY3RcIjtcclxuXHJcbmV4cG9ydCB0eXBlIFRoZW1lID0gXCJsaWdodFwiIHwgXCJkYXJrXCI7XHJcblxyXG5leHBvcnQgY29uc3QgVGhlbWVDb250ZXh0ID0gY3JlYXRlQ29udGV4dDx7XHJcbiAgdGhlbWU6IFRoZW1lO1xyXG4gIHRvZ2dsZVRoZW1lOiAoKSA9PiB2b2lkO1xyXG59Pih7XHJcbiAgdGhlbWU6IFwibGlnaHRcIixcclxuICB0b2dnbGVUaGVtZTogKCkgPT4ge30sXHJcbn0pO1xyXG4iXSwibmFtZXMiOlsiY3JlYXRlQ29udGV4dCIsIlRoZW1lQ29udGV4dCIsInRoZW1lIiwidG9nZ2xlVGhlbWUiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(pages-dir-node)/./src/context/ThemeContext.tsx\n");

/***/ }),

/***/ "(pages-dir-node)/./src/pages/_app.tsx":
/*!****************************!*\
  !*** ./src/pages/_app.tsx ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ App)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/head */ \"(pages-dir-node)/./node_modules/next/head.js\");\n/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_head__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../styles/globals.css */ \"(pages-dir-node)/./src/styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var _context_ThemeContext__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../context/ThemeContext */ \"(pages-dir-node)/./src/context/ThemeContext.tsx\");\n\n\n\n\n\nfunction App({ Component, pageProps }) {\n    const [theme, setTheme] = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(\"light\");\n    (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)({\n        \"App.useEffect\": ()=>{\n            const saved = localStorage.getItem(\"theme\");\n            if (saved) setTheme(saved);\n            else setTheme(window.matchMedia(\"(prefers-color-scheme: dark)\").matches ? \"dark\" : \"light\");\n        }\n    }[\"App.useEffect\"], []);\n    (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)({\n        \"App.useEffect\": ()=>{\n            document.documentElement.classList.toggle(\"dark\", theme === \"dark\");\n            localStorage.setItem(\"theme\", theme);\n        }\n    }[\"App.useEffect\"], [\n        theme\n    ]);\n    const toggleTheme = ()=>setTheme((p)=>p === \"light\" ? \"dark\" : \"light\");\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_context_ThemeContext__WEBPACK_IMPORTED_MODULE_4__.ThemeContext.Provider, {\n        value: {\n            theme,\n            toggleTheme\n        },\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)((next_head__WEBPACK_IMPORTED_MODULE_1___default()), {\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"link\", {\n                        rel: \"preconnect\",\n                        href: \"https://fonts.googleapis.com\"\n                    }, void 0, false, {\n                        fileName: \"C:\\\\Users\\\\developer\\\\Desktop\\\\New folder (3)\\\\pwa main folder\\\\pwa\\\\src\\\\pages\\\\_app.tsx\",\n                        lineNumber: 27,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"link\", {\n                        rel: \"preconnect\",\n                        href: \"https://fonts.gstatic.com\",\n                        crossOrigin: \"anonymous\"\n                    }, void 0, false, {\n                        fileName: \"C:\\\\Users\\\\developer\\\\Desktop\\\\New folder (3)\\\\pwa main folder\\\\pwa\\\\src\\\\pages\\\\_app.tsx\",\n                        lineNumber: 28,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"link\", {\n                        href: \"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;750&display=swap\",\n                        rel: \"stylesheet\"\n                    }, void 0, false, {\n                        fileName: \"C:\\\\Users\\\\developer\\\\Desktop\\\\New folder (3)\\\\pwa main folder\\\\pwa\\\\src\\\\pages\\\\_app.tsx\",\n                        lineNumber: 29,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"meta\", {\n                        name: \"viewport\",\n                        content: \"width=device-width,initial-scale=1\"\n                    }, void 0, false, {\n                        fileName: \"C:\\\\Users\\\\developer\\\\Desktop\\\\New folder (3)\\\\pwa main folder\\\\pwa\\\\src\\\\pages\\\\_app.tsx\",\n                        lineNumber: 33,\n                        columnNumber: 9\n                    }, this)\n                ]\n            }, void 0, true, {\n                fileName: \"C:\\\\Users\\\\developer\\\\Desktop\\\\New folder (3)\\\\pwa main folder\\\\pwa\\\\src\\\\pages\\\\_app.tsx\",\n                lineNumber: 26,\n                columnNumber: 7\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n                ...pageProps\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\developer\\\\Desktop\\\\New folder (3)\\\\pwa main folder\\\\pwa\\\\src\\\\pages\\\\_app.tsx\",\n                lineNumber: 36,\n                columnNumber: 7\n            }, this)\n        ]\n    }, void 0, true, {\n        fileName: \"C:\\\\Users\\\\developer\\\\Desktop\\\\New folder (3)\\\\pwa main folder\\\\pwa\\\\src\\\\pages\\\\_app.tsx\",\n        lineNumber: 25,\n        columnNumber: 5\n    }, this);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL3NyYy9wYWdlcy9fYXBwLnRzeCIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUE2QjtBQUVlO0FBQ2I7QUFFK0I7QUFFL0MsU0FBU0ksSUFBSSxFQUFFQyxTQUFTLEVBQUVDLFNBQVMsRUFBWTtJQUM1RCxNQUFNLENBQUNDLE9BQU9DLFNBQVMsR0FBR04sK0NBQVFBLENBQVE7SUFFMUNELGdEQUFTQTt5QkFBQztZQUNSLE1BQU1RLFFBQVFDLGFBQWFDLE9BQU8sQ0FBQztZQUNuQyxJQUFJRixPQUFPRCxTQUFTQztpQkFDZkQsU0FBU0ksT0FBT0MsVUFBVSxDQUFDLGdDQUFnQ0MsT0FBTyxHQUFHLFNBQVM7UUFDckY7d0JBQUcsRUFBRTtJQUVMYixnREFBU0E7eUJBQUM7WUFDUmMsU0FBU0MsZUFBZSxDQUFDQyxTQUFTLENBQUNDLE1BQU0sQ0FBQyxRQUFRWCxVQUFVO1lBQzVERyxhQUFhUyxPQUFPLENBQUMsU0FBU1o7UUFDaEM7d0JBQUc7UUFBQ0E7S0FBTTtJQUVWLE1BQU1hLGNBQWMsSUFBTVosU0FBUyxDQUFDYSxJQUFPQSxNQUFNLFVBQVUsU0FBUztJQUVwRSxxQkFDRSw4REFBQ2xCLCtEQUFZQSxDQUFDbUIsUUFBUTtRQUFDQyxPQUFPO1lBQUVoQjtZQUFPYTtRQUFZOzswQkFDakQsOERBQUNwQixrREFBSUE7O2tDQUNILDhEQUFDd0I7d0JBQUtDLEtBQUk7d0JBQWFDLE1BQUs7Ozs7OztrQ0FDNUIsOERBQUNGO3dCQUFLQyxLQUFJO3dCQUFhQyxNQUFLO3dCQUE0QkMsYUFBWTs7Ozs7O2tDQUNwRSw4REFBQ0g7d0JBQ0NFLE1BQUs7d0JBQ0xELEtBQUk7Ozs7OztrQ0FFTiw4REFBQ0c7d0JBQUtDLE1BQUs7d0JBQVdDLFNBQVE7Ozs7Ozs7Ozs7OzswQkFHaEMsOERBQUN6QjtnQkFBVyxHQUFHQyxTQUFTOzs7Ozs7Ozs7Ozs7QUFHOUIiLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcZGV2ZWxvcGVyXFxEZXNrdG9wXFxOZXcgZm9sZGVyICgzKVxccHdhIG1haW4gZm9sZGVyXFxwd2FcXHNyY1xccGFnZXNcXF9hcHAudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBIZWFkIGZyb20gXCJuZXh0L2hlYWRcIjtcclxuaW1wb3J0IHR5cGUgeyBBcHBQcm9wcyB9IGZyb20gXCJuZXh0L2FwcFwiO1xyXG5pbXBvcnQgeyB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSBcInJlYWN0XCI7XHJcbmltcG9ydCBcIi4uL3N0eWxlcy9nbG9iYWxzLmNzc1wiO1xyXG5cclxuaW1wb3J0IHsgVGhlbWVDb250ZXh0LCBUaGVtZSB9IGZyb20gXCIuLi9jb250ZXh0L1RoZW1lQ29udGV4dFwiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQXBwKHsgQ29tcG9uZW50LCBwYWdlUHJvcHMgfTogQXBwUHJvcHMpIHtcclxuICBjb25zdCBbdGhlbWUsIHNldFRoZW1lXSA9IHVzZVN0YXRlPFRoZW1lPihcImxpZ2h0XCIpO1xyXG5cclxuICB1c2VFZmZlY3QoKCkgPT4ge1xyXG4gICAgY29uc3Qgc2F2ZWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInRoZW1lXCIpIGFzIFRoZW1lIHwgbnVsbDtcclxuICAgIGlmIChzYXZlZCkgc2V0VGhlbWUoc2F2ZWQpO1xyXG4gICAgZWxzZSBzZXRUaGVtZSh3aW5kb3cubWF0Y2hNZWRpYShcIihwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaylcIikubWF0Y2hlcyA/IFwiZGFya1wiIDogXCJsaWdodFwiKTtcclxuICB9LCBbXSk7XHJcblxyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XHJcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZShcImRhcmtcIiwgdGhlbWUgPT09IFwiZGFya1wiKTtcclxuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwidGhlbWVcIiwgdGhlbWUpO1xyXG4gIH0sIFt0aGVtZV0pO1xyXG5cclxuICBjb25zdCB0b2dnbGVUaGVtZSA9ICgpID0+IHNldFRoZW1lKChwKSA9PiAocCA9PT0gXCJsaWdodFwiID8gXCJkYXJrXCIgOiBcImxpZ2h0XCIpKTtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxUaGVtZUNvbnRleHQuUHJvdmlkZXIgdmFsdWU9e3sgdGhlbWUsIHRvZ2dsZVRoZW1lIH19PlxyXG4gICAgICA8SGVhZD5cclxuICAgICAgICA8bGluayByZWw9XCJwcmVjb25uZWN0XCIgaHJlZj1cImh0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb21cIiAvPlxyXG4gICAgICAgIDxsaW5rIHJlbD1cInByZWNvbm5lY3RcIiBocmVmPVwiaHR0cHM6Ly9mb250cy5nc3RhdGljLmNvbVwiIGNyb3NzT3JpZ2luPVwiYW5vbnltb3VzXCIgLz5cclxuICAgICAgICA8bGlua1xyXG4gICAgICAgICAgaHJlZj1cImh0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb20vY3NzMj9mYW1pbHk9SW50ZXI6d2dodEA0MDA7NTAwOzYwMDs3MDA7NzUwJmRpc3BsYXk9c3dhcFwiXHJcbiAgICAgICAgICByZWw9XCJzdHlsZXNoZWV0XCJcclxuICAgICAgICAvPlxyXG4gICAgICAgIDxtZXRhIG5hbWU9XCJ2aWV3cG9ydFwiIGNvbnRlbnQ9XCJ3aWR0aD1kZXZpY2Utd2lkdGgsaW5pdGlhbC1zY2FsZT0xXCIgLz5cclxuICAgICAgPC9IZWFkPlxyXG5cclxuICAgICAgPENvbXBvbmVudCB7Li4ucGFnZVByb3BzfSAvPlxyXG4gICAgPC9UaGVtZUNvbnRleHQuUHJvdmlkZXI+XHJcbiAgKTtcclxufVxyXG4iXSwibmFtZXMiOlsiSGVhZCIsInVzZUVmZmVjdCIsInVzZVN0YXRlIiwiVGhlbWVDb250ZXh0IiwiQXBwIiwiQ29tcG9uZW50IiwicGFnZVByb3BzIiwidGhlbWUiLCJzZXRUaGVtZSIsInNhdmVkIiwibG9jYWxTdG9yYWdlIiwiZ2V0SXRlbSIsIndpbmRvdyIsIm1hdGNoTWVkaWEiLCJtYXRjaGVzIiwiZG9jdW1lbnQiLCJkb2N1bWVudEVsZW1lbnQiLCJjbGFzc0xpc3QiLCJ0b2dnbGUiLCJzZXRJdGVtIiwidG9nZ2xlVGhlbWUiLCJwIiwiUHJvdmlkZXIiLCJ2YWx1ZSIsImxpbmsiLCJyZWwiLCJocmVmIiwiY3Jvc3NPcmlnaW4iLCJtZXRhIiwibmFtZSIsImNvbnRlbnQiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(pages-dir-node)/./src/pages/_app.tsx\n");

/***/ }),

/***/ "(pages-dir-node)/./src/styles/globals.css":
/*!********************************!*\
  !*** ./src/styles/globals.css ***!
  \********************************/
/***/ (() => {



/***/ }),

/***/ "next/dist/compiled/next-server/pages.runtime.dev.js":
/*!**********************************************************************!*\
  !*** external "next/dist/compiled/next-server/pages.runtime.dev.js" ***!
  \**********************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/pages.runtime.dev.js");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "react/jsx-runtime":
/*!************************************!*\
  !*** external "react/jsx-runtime" ***!
  \************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-runtime");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@swc"], () => (__webpack_exec__("(pages-dir-node)/./src/pages/_app.tsx")));
module.exports = __webpack_exports__;

})();