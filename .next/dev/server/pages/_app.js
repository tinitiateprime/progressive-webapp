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
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   ThemeContext: () => (/* binding */ ThemeContext)\n/* harmony export */ });\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);\n\nconst ThemeContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_0__.createContext)({\n    theme: \"light\",\n    toggleTheme: ()=>{}\n});\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL3NyYy9jb250ZXh0L1RoZW1lQ29udGV4dC50c3giLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQXNDO0FBSS9CLE1BQU1DLDZCQUFlRCxvREFBYUEsQ0FHdEM7SUFDREUsT0FBTztJQUNQQyxhQUFhLEtBQU87QUFDdEIsR0FBRyIsInNvdXJjZXMiOlsiL1VzZXJzL3RzbmlraGlsL0Rvd25sb2Fkcy9wcm9ncmVzc2l2ZS13ZWJhcHAvc3JjL2NvbnRleHQvVGhlbWVDb250ZXh0LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVDb250ZXh0IH0gZnJvbSBcInJlYWN0XCI7XG5cbmV4cG9ydCB0eXBlIFRoZW1lID0gXCJsaWdodFwiIHwgXCJkYXJrXCI7XG5cbmV4cG9ydCBjb25zdCBUaGVtZUNvbnRleHQgPSBjcmVhdGVDb250ZXh0PHtcbiAgdGhlbWU6IFRoZW1lO1xuICB0b2dnbGVUaGVtZTogKCkgPT4gdm9pZDtcbn0+KHtcbiAgdGhlbWU6IFwibGlnaHRcIixcbiAgdG9nZ2xlVGhlbWU6ICgpID0+IHt9LFxufSk7XG4iXSwibmFtZXMiOlsiY3JlYXRlQ29udGV4dCIsIlRoZW1lQ29udGV4dCIsInRoZW1lIiwidG9nZ2xlVGhlbWUiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(pages-dir-node)/./src/context/ThemeContext.tsx\n");

/***/ }),

/***/ "(pages-dir-node)/./src/pages/_app.tsx":
/*!****************************!*\
  !*** ./src/pages/_app.tsx ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ App)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/head */ \"(pages-dir-node)/./node_modules/next/head.js\");\n/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_head__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../styles/globals.css */ \"(pages-dir-node)/./src/styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var _context_ThemeContext__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../context/ThemeContext */ \"(pages-dir-node)/./src/context/ThemeContext.tsx\");\n\n\n\n\n\nfunction App({ Component, pageProps }) {\n    const [theme, setTheme] = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(\"light\");\n    (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)({\n        \"App.useEffect\": ()=>{\n            const saved = localStorage.getItem(\"theme\");\n            if (saved) setTheme(saved);\n            else setTheme(window.matchMedia(\"(prefers-color-scheme: dark)\").matches ? \"dark\" : \"light\");\n        }\n    }[\"App.useEffect\"], []);\n    (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)({\n        \"App.useEffect\": ()=>{\n            document.documentElement.classList.toggle(\"dark\", theme === \"dark\");\n            localStorage.setItem(\"theme\", theme);\n        }\n    }[\"App.useEffect\"], [\n        theme\n    ]);\n    (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)({\n        \"App.useEffect\": ()=>{\n            if ('serviceWorker' in navigator) {\n                navigator.serviceWorker.register('/sw.js').catch(console.error);\n            }\n        }\n    }[\"App.useEffect\"], []);\n    const toggleTheme = ()=>setTheme((p)=>p === \"light\" ? \"dark\" : \"light\");\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_context_ThemeContext__WEBPACK_IMPORTED_MODULE_4__.ThemeContext.Provider, {\n        value: {\n            theme,\n            toggleTheme\n        },\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)((next_head__WEBPACK_IMPORTED_MODULE_1___default()), {\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"link\", {\n                        rel: \"preconnect\",\n                        href: \"https://fonts.googleapis.com\"\n                    }, void 0, false, {\n                        fileName: \"/Users/tsnikhil/Downloads/progressive-webapp/src/pages/_app.tsx\",\n                        lineNumber: 33,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"link\", {\n                        rel: \"preconnect\",\n                        href: \"https://fonts.gstatic.com\",\n                        crossOrigin: \"anonymous\"\n                    }, void 0, false, {\n                        fileName: \"/Users/tsnikhil/Downloads/progressive-webapp/src/pages/_app.tsx\",\n                        lineNumber: 34,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"link\", {\n                        href: \"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;750&display=swap\",\n                        rel: \"stylesheet\"\n                    }, void 0, false, {\n                        fileName: \"/Users/tsnikhil/Downloads/progressive-webapp/src/pages/_app.tsx\",\n                        lineNumber: 35,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"meta\", {\n                        name: \"viewport\",\n                        content: \"width=device-width,initial-scale=1\"\n                    }, void 0, false, {\n                        fileName: \"/Users/tsnikhil/Downloads/progressive-webapp/src/pages/_app.tsx\",\n                        lineNumber: 39,\n                        columnNumber: 9\n                    }, this)\n                ]\n            }, void 0, true, {\n                fileName: \"/Users/tsnikhil/Downloads/progressive-webapp/src/pages/_app.tsx\",\n                lineNumber: 32,\n                columnNumber: 7\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n                ...pageProps\n            }, void 0, false, {\n                fileName: \"/Users/tsnikhil/Downloads/progressive-webapp/src/pages/_app.tsx\",\n                lineNumber: 42,\n                columnNumber: 7\n            }, this)\n        ]\n    }, void 0, true, {\n        fileName: \"/Users/tsnikhil/Downloads/progressive-webapp/src/pages/_app.tsx\",\n        lineNumber: 31,\n        columnNumber: 5\n    }, this);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL3NyYy9wYWdlcy9fYXBwLnRzeCIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUE2QjtBQUVlO0FBQ2I7QUFFK0I7QUFFL0MsU0FBU0ksSUFBSSxFQUFFQyxTQUFTLEVBQUVDLFNBQVMsRUFBWTtJQUM1RCxNQUFNLENBQUNDLE9BQU9DLFNBQVMsR0FBR04sK0NBQVFBLENBQVE7SUFFMUNELGdEQUFTQTt5QkFBQztZQUNSLE1BQU1RLFFBQVFDLGFBQWFDLE9BQU8sQ0FBQztZQUNuQyxJQUFJRixPQUFPRCxTQUFTQztpQkFDZkQsU0FBU0ksT0FBT0MsVUFBVSxDQUFDLGdDQUFnQ0MsT0FBTyxHQUFHLFNBQVM7UUFDckY7d0JBQUcsRUFBRTtJQUVMYixnREFBU0E7eUJBQUM7WUFDUmMsU0FBU0MsZUFBZSxDQUFDQyxTQUFTLENBQUNDLE1BQU0sQ0FBQyxRQUFRWCxVQUFVO1lBQzVERyxhQUFhUyxPQUFPLENBQUMsU0FBU1o7UUFDaEM7d0JBQUc7UUFBQ0E7S0FBTTtJQUVWTixnREFBU0E7eUJBQUM7WUFDVixJQUFJLG1CQUFtQm1CLFdBQVc7Z0JBQ2hDQSxVQUFVQyxhQUFhLENBQUNDLFFBQVEsQ0FBQyxVQUFVQyxLQUFLLENBQUNDLFFBQVFDLEtBQUs7WUFDaEU7UUFDRjt3QkFBRyxFQUFFO0lBRUgsTUFBTUMsY0FBYyxJQUFNbEIsU0FBUyxDQUFDbUIsSUFBT0EsTUFBTSxVQUFVLFNBQVM7SUFFcEUscUJBQ0UsOERBQUN4QiwrREFBWUEsQ0FBQ3lCLFFBQVE7UUFBQ0MsT0FBTztZQUFFdEI7WUFBT21CO1FBQVk7OzBCQUNqRCw4REFBQzFCLGtEQUFJQTs7a0NBQ0gsOERBQUM4Qjt3QkFBS0MsS0FBSTt3QkFBYUMsTUFBSzs7Ozs7O2tDQUM1Qiw4REFBQ0Y7d0JBQUtDLEtBQUk7d0JBQWFDLE1BQUs7d0JBQTRCQyxhQUFZOzs7Ozs7a0NBQ3BFLDhEQUFDSDt3QkFDQ0UsTUFBSzt3QkFDTEQsS0FBSTs7Ozs7O2tDQUVOLDhEQUFDRzt3QkFBS0MsTUFBSzt3QkFBV0MsU0FBUTs7Ozs7Ozs7Ozs7OzBCQUdoQyw4REFBQy9CO2dCQUFXLEdBQUdDLFNBQVM7Ozs7Ozs7Ozs7OztBQUc5QiIsInNvdXJjZXMiOlsiL1VzZXJzL3RzbmlraGlsL0Rvd25sb2Fkcy9wcm9ncmVzc2l2ZS13ZWJhcHAvc3JjL3BhZ2VzL19hcHAudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBIZWFkIGZyb20gXCJuZXh0L2hlYWRcIjtcbmltcG9ydCB0eXBlIHsgQXBwUHJvcHMgfSBmcm9tIFwibmV4dC9hcHBcIjtcbmltcG9ydCB7IHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCBcIi4uL3N0eWxlcy9nbG9iYWxzLmNzc1wiO1xuXG5pbXBvcnQgeyBUaGVtZUNvbnRleHQsIFRoZW1lIH0gZnJvbSBcIi4uL2NvbnRleHQvVGhlbWVDb250ZXh0XCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEFwcCh7IENvbXBvbmVudCwgcGFnZVByb3BzIH06IEFwcFByb3BzKSB7XG4gIGNvbnN0IFt0aGVtZSwgc2V0VGhlbWVdID0gdXNlU3RhdGU8VGhlbWU+KFwibGlnaHRcIik7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBzYXZlZCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwidGhlbWVcIikgYXMgVGhlbWUgfCBudWxsO1xuICAgIGlmIChzYXZlZCkgc2V0VGhlbWUoc2F2ZWQpO1xuICAgIGVsc2Ugc2V0VGhlbWUod2luZG93Lm1hdGNoTWVkaWEoXCIocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspXCIpLm1hdGNoZXMgPyBcImRhcmtcIiA6IFwibGlnaHRcIik7XG4gIH0sIFtdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKFwiZGFya1wiLCB0aGVtZSA9PT0gXCJkYXJrXCIpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwidGhlbWVcIiwgdGhlbWUpO1xuICB9LCBbdGhlbWVdKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICBpZiAoJ3NlcnZpY2VXb3JrZXInIGluIG5hdmlnYXRvcikge1xuICAgIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLnJlZ2lzdGVyKCcvc3cuanMnKS5jYXRjaChjb25zb2xlLmVycm9yKTtcbiAgfVxufSwgW10pO1xuXG4gIGNvbnN0IHRvZ2dsZVRoZW1lID0gKCkgPT4gc2V0VGhlbWUoKHApID0+IChwID09PSBcImxpZ2h0XCIgPyBcImRhcmtcIiA6IFwibGlnaHRcIikpO1xuXG4gIHJldHVybiAoXG4gICAgPFRoZW1lQ29udGV4dC5Qcm92aWRlciB2YWx1ZT17eyB0aGVtZSwgdG9nZ2xlVGhlbWUgfX0+XG4gICAgICA8SGVhZD5cbiAgICAgICAgPGxpbmsgcmVsPVwicHJlY29ubmVjdFwiIGhyZWY9XCJodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tXCIgLz5cbiAgICAgICAgPGxpbmsgcmVsPVwicHJlY29ubmVjdFwiIGhyZWY9XCJodHRwczovL2ZvbnRzLmdzdGF0aWMuY29tXCIgY3Jvc3NPcmlnaW49XCJhbm9ueW1vdXNcIiAvPlxuICAgICAgICA8bGlua1xuICAgICAgICAgIGhyZWY9XCJodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tL2NzczI/ZmFtaWx5PUludGVyOndnaHRANDAwOzUwMDs2MDA7NzAwOzc1MCZkaXNwbGF5PXN3YXBcIlxuICAgICAgICAgIHJlbD1cInN0eWxlc2hlZXRcIlxuICAgICAgICAvPlxuICAgICAgICA8bWV0YSBuYW1lPVwidmlld3BvcnRcIiBjb250ZW50PVwid2lkdGg9ZGV2aWNlLXdpZHRoLGluaXRpYWwtc2NhbGU9MVwiIC8+XG4gICAgICA8L0hlYWQ+XG5cbiAgICAgIDxDb21wb25lbnQgey4uLnBhZ2VQcm9wc30gLz5cbiAgICA8L1RoZW1lQ29udGV4dC5Qcm92aWRlcj5cbiAgKTtcbn1cbiJdLCJuYW1lcyI6WyJIZWFkIiwidXNlRWZmZWN0IiwidXNlU3RhdGUiLCJUaGVtZUNvbnRleHQiLCJBcHAiLCJDb21wb25lbnQiLCJwYWdlUHJvcHMiLCJ0aGVtZSIsInNldFRoZW1lIiwic2F2ZWQiLCJsb2NhbFN0b3JhZ2UiLCJnZXRJdGVtIiwid2luZG93IiwibWF0Y2hNZWRpYSIsIm1hdGNoZXMiLCJkb2N1bWVudCIsImRvY3VtZW50RWxlbWVudCIsImNsYXNzTGlzdCIsInRvZ2dsZSIsInNldEl0ZW0iLCJuYXZpZ2F0b3IiLCJzZXJ2aWNlV29ya2VyIiwicmVnaXN0ZXIiLCJjYXRjaCIsImNvbnNvbGUiLCJlcnJvciIsInRvZ2dsZVRoZW1lIiwicCIsIlByb3ZpZGVyIiwidmFsdWUiLCJsaW5rIiwicmVsIiwiaHJlZiIsImNyb3NzT3JpZ2luIiwibWV0YSIsIm5hbWUiLCJjb250ZW50Il0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(pages-dir-node)/./src/pages/_app.tsx\n");

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