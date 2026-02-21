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
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ App)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/head */ \"(pages-dir-node)/./node_modules/next/head.js\");\n/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_head__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../styles/globals.css */ \"(pages-dir-node)/./src/styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var _context_ThemeContext__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../context/ThemeContext */ \"(pages-dir-node)/./src/context/ThemeContext.tsx\");\n\n\n\n\n\nfunction App({ Component, pageProps }) {\n    const [theme, setTheme] = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(\"light\");\n    const [mounted, setMounted] = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(false);\n    (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)({\n        \"App.useEffect\": ()=>{\n            setMounted(true);\n            const saved = localStorage.getItem(\"theme\");\n            if (saved) {\n                setTheme(saved);\n            } else {\n                setTheme(window.matchMedia(\"(prefers-color-scheme: dark)\").matches ? \"dark\" : \"light\");\n            }\n        }\n    }[\"App.useEffect\"], []);\n    (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)({\n        \"App.useEffect\": ()=>{\n            if (!mounted) return; // ✅ skip on server\n            document.documentElement.classList.toggle(\"dark\", theme === \"dark\");\n            localStorage.setItem(\"theme\", theme);\n        }\n    }[\"App.useEffect\"], [\n        theme,\n        mounted\n    ]);\n    // SW registration unchanged\n    (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)({\n        \"App.useEffect\": ()=>{\n            if (\"serviceWorker\" in navigator) {\n                navigator.serviceWorker.register(\"/sw.js\").catch(console.error);\n            }\n        }\n    }[\"App.useEffect\"], []);\n    const toggleTheme = ()=>setTheme((p)=>p === \"light\" ? \"dark\" : \"light\");\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_context_ThemeContext__WEBPACK_IMPORTED_MODULE_4__.ThemeContext.Provider, {\n        value: {\n            theme,\n            toggleTheme: ()=>setTheme((p)=>p === \"light\" ? \"dark\" : \"light\")\n        },\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)((next_head__WEBPACK_IMPORTED_MODULE_1___default()), {\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"link\", {\n                        rel: \"preconnect\",\n                        href: \"https://fonts.googleapis.com\"\n                    }, void 0, false, {\n                        fileName: \"/Users/tsnikhil/Downloads/progressive-webapp/src/pages/_app.tsx\",\n                        lineNumber: 44,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"link\", {\n                        rel: \"preconnect\",\n                        href: \"https://fonts.gstatic.com\",\n                        crossOrigin: \"anonymous\"\n                    }, void 0, false, {\n                        fileName: \"/Users/tsnikhil/Downloads/progressive-webapp/src/pages/_app.tsx\",\n                        lineNumber: 45,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"link\", {\n                        href: \"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;750&display=swap\",\n                        rel: \"stylesheet\"\n                    }, void 0, false, {\n                        fileName: \"/Users/tsnikhil/Downloads/progressive-webapp/src/pages/_app.tsx\",\n                        lineNumber: 46,\n                        columnNumber: 9\n                    }, this),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"meta\", {\n                        name: \"viewport\",\n                        content: \"width=device-width,initial-scale=1\"\n                    }, void 0, false, {\n                        fileName: \"/Users/tsnikhil/Downloads/progressive-webapp/src/pages/_app.tsx\",\n                        lineNumber: 50,\n                        columnNumber: 9\n                    }, this)\n                ]\n            }, void 0, true, {\n                fileName: \"/Users/tsnikhil/Downloads/progressive-webapp/src/pages/_app.tsx\",\n                lineNumber: 43,\n                columnNumber: 7\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n                ...pageProps\n            }, void 0, false, {\n                fileName: \"/Users/tsnikhil/Downloads/progressive-webapp/src/pages/_app.tsx\",\n                lineNumber: 52,\n                columnNumber: 7\n            }, this)\n        ]\n    }, void 0, true, {\n        fileName: \"/Users/tsnikhil/Downloads/progressive-webapp/src/pages/_app.tsx\",\n        lineNumber: 42,\n        columnNumber: 5\n    }, this);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL3NyYy9wYWdlcy9fYXBwLnRzeCIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUE2QjtBQUVlO0FBQ2I7QUFFK0I7QUFFL0MsU0FBU0ksSUFBSSxFQUFFQyxTQUFTLEVBQUVDLFNBQVMsRUFBWTtJQUM1RCxNQUFNLENBQUNDLE9BQU9DLFNBQVMsR0FBR04sK0NBQVFBLENBQVE7SUFDMUMsTUFBTSxDQUFDTyxTQUFTQyxXQUFXLEdBQUdSLCtDQUFRQSxDQUFDO0lBRXZDRCxnREFBU0E7eUJBQUM7WUFDUlMsV0FBVztZQUNYLE1BQU1DLFFBQVFDLGFBQWFDLE9BQU8sQ0FBQztZQUNuQyxJQUFJRixPQUFPO2dCQUNUSCxTQUFTRztZQUNYLE9BQU87Z0JBQ0xILFNBQ0VNLE9BQU9DLFVBQVUsQ0FBQyxnQ0FBZ0NDLE9BQU8sR0FDckQsU0FDQTtZQUVSO1FBQ0Y7d0JBQUcsRUFBRTtJQUVMZixnREFBU0E7eUJBQUM7WUFDUixJQUFJLENBQUNRLFNBQVMsUUFBUSxtQkFBbUI7WUFDekNRLFNBQVNDLGVBQWUsQ0FBQ0MsU0FBUyxDQUFDQyxNQUFNLENBQUMsUUFBUWIsVUFBVTtZQUM1REssYUFBYVMsT0FBTyxDQUFDLFNBQVNkO1FBQ2hDO3dCQUFHO1FBQUNBO1FBQU9FO0tBQVE7SUFFbkIsNEJBQTRCO0lBQzVCUixnREFBU0E7eUJBQUM7WUFDUixJQUFJLG1CQUFtQnFCLFdBQVc7Z0JBQ2hDQSxVQUFVQyxhQUFhLENBQUNDLFFBQVEsQ0FBQyxVQUFVQyxLQUFLLENBQUNDLFFBQVFDLEtBQUs7WUFDaEU7UUFDRjt3QkFBRyxFQUFFO0lBRUwsTUFBTUMsY0FBYyxJQUFNcEIsU0FBUyxDQUFDcUIsSUFBT0EsTUFBTSxVQUFVLFNBQVM7SUFFbkUscUJBQ0MsOERBQUMxQiwrREFBWUEsQ0FBQzJCLFFBQVE7UUFBQ0MsT0FBTztZQUFFeEI7WUFBT3FCLGFBQWEsSUFBTXBCLFNBQVNxQixDQUFBQSxJQUFLQSxNQUFNLFVBQVUsU0FBUztRQUFTOzswQkFDeEcsOERBQUM3QixrREFBSUE7O2tDQUNILDhEQUFDZ0M7d0JBQUtDLEtBQUk7d0JBQWFDLE1BQUs7Ozs7OztrQ0FDNUIsOERBQUNGO3dCQUFLQyxLQUFJO3dCQUFhQyxNQUFLO3dCQUE0QkMsYUFBWTs7Ozs7O2tDQUNwRSw4REFBQ0g7d0JBQ0NFLE1BQUs7d0JBQ0xELEtBQUk7Ozs7OztrQ0FFTiw4REFBQ0c7d0JBQUtDLE1BQUs7d0JBQVdDLFNBQVE7Ozs7Ozs7Ozs7OzswQkFFaEMsOERBQUNqQztnQkFBVyxHQUFHQyxTQUFTOzs7Ozs7Ozs7Ozs7QUFHOUIiLCJzb3VyY2VzIjpbIi9Vc2Vycy90c25pa2hpbC9Eb3dubG9hZHMvcHJvZ3Jlc3NpdmUtd2ViYXBwL3NyYy9wYWdlcy9fYXBwLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgSGVhZCBmcm9tIFwibmV4dC9oZWFkXCI7XG5pbXBvcnQgdHlwZSB7IEFwcFByb3BzIH0gZnJvbSBcIm5leHQvYXBwXCI7XG5pbXBvcnQgeyB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgXCIuLi9zdHlsZXMvZ2xvYmFscy5jc3NcIjtcblxuaW1wb3J0IHsgVGhlbWVDb250ZXh0LCBUaGVtZSB9IGZyb20gXCIuLi9jb250ZXh0L1RoZW1lQ29udGV4dFwiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBBcHAoeyBDb21wb25lbnQsIHBhZ2VQcm9wcyB9OiBBcHBQcm9wcykge1xuICBjb25zdCBbdGhlbWUsIHNldFRoZW1lXSA9IHVzZVN0YXRlPFRoZW1lPihcImxpZ2h0XCIpO1xuICBjb25zdCBbbW91bnRlZCwgc2V0TW91bnRlZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIFxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHNldE1vdW50ZWQodHJ1ZSk7XG4gICAgY29uc3Qgc2F2ZWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInRoZW1lXCIpIGFzIFRoZW1lIHwgbnVsbDtcbiAgICBpZiAoc2F2ZWQpIHtcbiAgICAgIHNldFRoZW1lKHNhdmVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2V0VGhlbWUoXG4gICAgICAgIHdpbmRvdy5tYXRjaE1lZGlhKFwiKHByZWZlcnMtY29sb3Itc2NoZW1lOiBkYXJrKVwiKS5tYXRjaGVzXG4gICAgICAgICAgPyBcImRhcmtcIlxuICAgICAgICAgIDogXCJsaWdodFwiXG4gICAgICApO1xuICAgIH1cbiAgfSwgW10pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCFtb3VudGVkKSByZXR1cm47IC8vIOKchSBza2lwIG9uIHNlcnZlclxuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKFwiZGFya1wiLCB0aGVtZSA9PT0gXCJkYXJrXCIpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwidGhlbWVcIiwgdGhlbWUpO1xuICB9LCBbdGhlbWUsIG1vdW50ZWRdKTtcblxuICAvLyBTVyByZWdpc3RyYXRpb24gdW5jaGFuZ2VkXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKFwic2VydmljZVdvcmtlclwiIGluIG5hdmlnYXRvcikge1xuICAgICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIucmVnaXN0ZXIoXCIvc3cuanNcIikuY2F0Y2goY29uc29sZS5lcnJvcik7XG4gICAgfVxuICB9LCBbXSk7XG5cbiAgY29uc3QgdG9nZ2xlVGhlbWUgPSAoKSA9PiBzZXRUaGVtZSgocCkgPT4gKHAgPT09IFwibGlnaHRcIiA/IFwiZGFya1wiIDogXCJsaWdodFwiKSk7XG5cbiAgIHJldHVybiAoXG4gICAgPFRoZW1lQ29udGV4dC5Qcm92aWRlciB2YWx1ZT17eyB0aGVtZSwgdG9nZ2xlVGhlbWU6ICgpID0+IHNldFRoZW1lKHAgPT4gcCA9PT0gXCJsaWdodFwiID8gXCJkYXJrXCIgOiBcImxpZ2h0XCIpIH19PlxuICAgICAgPEhlYWQ+XG4gICAgICAgIDxsaW5rIHJlbD1cInByZWNvbm5lY3RcIiBocmVmPVwiaHR0cHM6Ly9mb250cy5nb29nbGVhcGlzLmNvbVwiIC8+XG4gICAgICAgIDxsaW5rIHJlbD1cInByZWNvbm5lY3RcIiBocmVmPVwiaHR0cHM6Ly9mb250cy5nc3RhdGljLmNvbVwiIGNyb3NzT3JpZ2luPVwiYW5vbnltb3VzXCIgLz5cbiAgICAgICAgPGxpbmtcbiAgICAgICAgICBocmVmPVwiaHR0cHM6Ly9mb250cy5nb29nbGVhcGlzLmNvbS9jc3MyP2ZhbWlseT1JbnRlcjp3Z2h0QDQwMDs1MDA7NjAwOzcwMDs3NTAmZGlzcGxheT1zd2FwXCJcbiAgICAgICAgICByZWw9XCJzdHlsZXNoZWV0XCJcbiAgICAgICAgLz5cbiAgICAgICAgPG1ldGEgbmFtZT1cInZpZXdwb3J0XCIgY29udGVudD1cIndpZHRoPWRldmljZS13aWR0aCxpbml0aWFsLXNjYWxlPTFcIiAvPlxuICAgICAgPC9IZWFkPlxuICAgICAgPENvbXBvbmVudCB7Li4ucGFnZVByb3BzfSAvPlxuICAgIDwvVGhlbWVDb250ZXh0LlByb3ZpZGVyPlxuICApO1xufVxuIl0sIm5hbWVzIjpbIkhlYWQiLCJ1c2VFZmZlY3QiLCJ1c2VTdGF0ZSIsIlRoZW1lQ29udGV4dCIsIkFwcCIsIkNvbXBvbmVudCIsInBhZ2VQcm9wcyIsInRoZW1lIiwic2V0VGhlbWUiLCJtb3VudGVkIiwic2V0TW91bnRlZCIsInNhdmVkIiwibG9jYWxTdG9yYWdlIiwiZ2V0SXRlbSIsIndpbmRvdyIsIm1hdGNoTWVkaWEiLCJtYXRjaGVzIiwiZG9jdW1lbnQiLCJkb2N1bWVudEVsZW1lbnQiLCJjbGFzc0xpc3QiLCJ0b2dnbGUiLCJzZXRJdGVtIiwibmF2aWdhdG9yIiwic2VydmljZVdvcmtlciIsInJlZ2lzdGVyIiwiY2F0Y2giLCJjb25zb2xlIiwiZXJyb3IiLCJ0b2dnbGVUaGVtZSIsInAiLCJQcm92aWRlciIsInZhbHVlIiwibGluayIsInJlbCIsImhyZWYiLCJjcm9zc09yaWdpbiIsIm1ldGEiLCJuYW1lIiwiY29udGVudCJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(pages-dir-node)/./src/pages/_app.tsx\n");

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