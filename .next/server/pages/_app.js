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

/***/ "./src/context/AppContext.js":
/*!***********************************!*\
  !*** ./src/context/AppContext.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   AppProvider: () => (/* binding */ AppProvider),\n/* harmony export */   useApp: () => (/* binding */ useApp)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n\n\nconst AppContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_1__.createContext)();\nconst initialState = {\n    openApps: [],\n    activeApp: null,\n    nextZIndex: 1000\n};\nfunction appReducer(state, action) {\n    switch(action.type){\n        case \"OPEN_APP\":\n            if (state.openApps.find((app)=>app.id === action.payload.id)) {\n                return {\n                    ...state,\n                    activeApp: action.payload.id,\n                    openApps: state.openApps.map((app)=>app.id === action.payload.id ? {\n                            ...app,\n                            zIndex: state.nextZIndex\n                        } : app),\n                    nextZIndex: state.nextZIndex + 1\n                };\n            }\n            return {\n                ...state,\n                openApps: [\n                    ...state.openApps,\n                    {\n                        ...action.payload,\n                        zIndex: state.nextZIndex\n                    }\n                ],\n                activeApp: action.payload.id,\n                nextZIndex: state.nextZIndex + 1\n            };\n        case \"CLOSE_APP\":\n            return {\n                ...state,\n                openApps: state.openApps.filter((app)=>app.id !== action.payload),\n                activeApp: state.activeApp === action.payload ? null : state.activeApp\n            };\n        case \"SET_ACTIVE_APP\":\n            return {\n                ...state,\n                activeApp: action.payload,\n                openApps: state.openApps.map((app)=>app.id === action.payload ? {\n                        ...app,\n                        zIndex: state.nextZIndex\n                    } : app),\n                nextZIndex: state.nextZIndex + 1\n            };\n        case \"MINIMIZE_APP\":\n            return {\n                ...state,\n                openApps: state.openApps.map((app)=>app.id === action.payload ? {\n                        ...app,\n                        minimized: !app.minimized\n                    } : app)\n            };\n        default:\n            return state;\n    }\n}\nfunction AppProvider({ children }) {\n    const [state, dispatch] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useReducer)(appReducer, initialState);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(AppContext.Provider, {\n        value: {\n            state,\n            dispatch\n        },\n        children: children\n    }, void 0, false, {\n        fileName: \"/Users/huang/OrbitOS/src/context/AppContext.js\",\n        lineNumber: 61,\n        columnNumber: 5\n    }, this);\n}\nfunction useApp() {\n    const context = (0,react__WEBPACK_IMPORTED_MODULE_1__.useContext)(AppContext);\n    if (!context) {\n        throw new Error(\"useApp must be used within AppProvider\");\n    }\n    return context;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvY29udGV4dC9BcHBDb250ZXh0LmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBOEQ7QUFFOUQsTUFBTUcsMkJBQWFILG9EQUFhQTtBQUVoQyxNQUFNSSxlQUFlO0lBQ25CQyxVQUFVLEVBQUU7SUFDWkMsV0FBVztJQUNYQyxZQUFZO0FBQ2Q7QUFFQSxTQUFTQyxXQUFXQyxLQUFLLEVBQUVDLE1BQU07SUFDL0IsT0FBUUEsT0FBT0MsSUFBSTtRQUNqQixLQUFLO1lBQ0gsSUFBSUYsTUFBTUosUUFBUSxDQUFDTyxJQUFJLENBQUNDLENBQUFBLE1BQU9BLElBQUlDLEVBQUUsS0FBS0osT0FBT0ssT0FBTyxDQUFDRCxFQUFFLEdBQUc7Z0JBQzVELE9BQU87b0JBQ0wsR0FBR0wsS0FBSztvQkFDUkgsV0FBV0ksT0FBT0ssT0FBTyxDQUFDRCxFQUFFO29CQUM1QlQsVUFBVUksTUFBTUosUUFBUSxDQUFDVyxHQUFHLENBQUNILENBQUFBLE1BQzNCQSxJQUFJQyxFQUFFLEtBQUtKLE9BQU9LLE9BQU8sQ0FBQ0QsRUFBRSxHQUFHOzRCQUFFLEdBQUdELEdBQUc7NEJBQUVJLFFBQVFSLE1BQU1GLFVBQVU7d0JBQUMsSUFBSU07b0JBRXhFTixZQUFZRSxNQUFNRixVQUFVLEdBQUc7Z0JBQ2pDO1lBQ0Y7WUFDQSxPQUFPO2dCQUNMLEdBQUdFLEtBQUs7Z0JBQ1JKLFVBQVU7dUJBQUlJLE1BQU1KLFFBQVE7b0JBQUU7d0JBQUUsR0FBR0ssT0FBT0ssT0FBTzt3QkFBRUUsUUFBUVIsTUFBTUYsVUFBVTtvQkFBQztpQkFBRTtnQkFDOUVELFdBQVdJLE9BQU9LLE9BQU8sQ0FBQ0QsRUFBRTtnQkFDNUJQLFlBQVlFLE1BQU1GLFVBQVUsR0FBRztZQUNqQztRQUNGLEtBQUs7WUFDSCxPQUFPO2dCQUNMLEdBQUdFLEtBQUs7Z0JBQ1JKLFVBQVVJLE1BQU1KLFFBQVEsQ0FBQ2EsTUFBTSxDQUFDTCxDQUFBQSxNQUFPQSxJQUFJQyxFQUFFLEtBQUtKLE9BQU9LLE9BQU87Z0JBQ2hFVCxXQUFXRyxNQUFNSCxTQUFTLEtBQUtJLE9BQU9LLE9BQU8sR0FBRyxPQUFPTixNQUFNSCxTQUFTO1lBQ3hFO1FBQ0YsS0FBSztZQUNILE9BQU87Z0JBQ0wsR0FBR0csS0FBSztnQkFDUkgsV0FBV0ksT0FBT0ssT0FBTztnQkFDekJWLFVBQVVJLE1BQU1KLFFBQVEsQ0FBQ1csR0FBRyxDQUFDSCxDQUFBQSxNQUMzQkEsSUFBSUMsRUFBRSxLQUFLSixPQUFPSyxPQUFPLEdBQUc7d0JBQUUsR0FBR0YsR0FBRzt3QkFBRUksUUFBUVIsTUFBTUYsVUFBVTtvQkFBQyxJQUFJTTtnQkFFckVOLFlBQVlFLE1BQU1GLFVBQVUsR0FBRztZQUNqQztRQUNGLEtBQUs7WUFDSCxPQUFPO2dCQUNMLEdBQUdFLEtBQUs7Z0JBQ1JKLFVBQVVJLE1BQU1KLFFBQVEsQ0FBQ1csR0FBRyxDQUFDSCxDQUFBQSxNQUMzQkEsSUFBSUMsRUFBRSxLQUFLSixPQUFPSyxPQUFPLEdBQUc7d0JBQUUsR0FBR0YsR0FBRzt3QkFBRU0sV0FBVyxDQUFDTixJQUFJTSxTQUFTO29CQUFDLElBQUlOO1lBRXhFO1FBQ0Y7WUFDRSxPQUFPSjtJQUNYO0FBQ0Y7QUFFTyxTQUFTVyxZQUFZLEVBQUVDLFFBQVEsRUFBRTtJQUN0QyxNQUFNLENBQUNaLE9BQU9hLFNBQVMsR0FBR3BCLGlEQUFVQSxDQUFDTSxZQUFZSjtJQUVqRCxxQkFDRSw4REFBQ0QsV0FBV29CLFFBQVE7UUFBQ0MsT0FBTztZQUFFZjtZQUFPYTtRQUFTO2tCQUMzQ0Q7Ozs7OztBQUdQO0FBRU8sU0FBU0k7SUFDZCxNQUFNQyxVQUFVekIsaURBQVVBLENBQUNFO0lBQzNCLElBQUksQ0FBQ3VCLFNBQVM7UUFDWixNQUFNLElBQUlDLE1BQU07SUFDbEI7SUFDQSxPQUFPRDtBQUNUIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vd2ViLW9zLXByb2plY3QvLi9zcmMvY29udGV4dC9BcHBDb250ZXh0LmpzPzc2OWUiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3JlYXRlQ29udGV4dCwgdXNlQ29udGV4dCwgdXNlUmVkdWNlciB9IGZyb20gJ3JlYWN0JztcblxuY29uc3QgQXBwQ29udGV4dCA9IGNyZWF0ZUNvbnRleHQoKTtcblxuY29uc3QgaW5pdGlhbFN0YXRlID0ge1xuICBvcGVuQXBwczogW10sXG4gIGFjdGl2ZUFwcDogbnVsbCxcbiAgbmV4dFpJbmRleDogMTAwMFxufTtcblxuZnVuY3Rpb24gYXBwUmVkdWNlcihzdGF0ZSwgYWN0aW9uKSB7XG4gIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICBjYXNlICdPUEVOX0FQUCc6XG4gICAgICBpZiAoc3RhdGUub3BlbkFwcHMuZmluZChhcHAgPT4gYXBwLmlkID09PSBhY3Rpb24ucGF5bG9hZC5pZCkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAuLi5zdGF0ZSxcbiAgICAgICAgICBhY3RpdmVBcHA6IGFjdGlvbi5wYXlsb2FkLmlkLFxuICAgICAgICAgIG9wZW5BcHBzOiBzdGF0ZS5vcGVuQXBwcy5tYXAoYXBwID0+XG4gICAgICAgICAgICBhcHAuaWQgPT09IGFjdGlvbi5wYXlsb2FkLmlkID8geyAuLi5hcHAsIHpJbmRleDogc3RhdGUubmV4dFpJbmRleCB9IDogYXBwXG4gICAgICAgICAgKSxcbiAgICAgICAgICBuZXh0WkluZGV4OiBzdGF0ZS5uZXh0WkluZGV4ICsgMVxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4uc3RhdGUsXG4gICAgICAgIG9wZW5BcHBzOiBbLi4uc3RhdGUub3BlbkFwcHMsIHsgLi4uYWN0aW9uLnBheWxvYWQsIHpJbmRleDogc3RhdGUubmV4dFpJbmRleCB9XSxcbiAgICAgICAgYWN0aXZlQXBwOiBhY3Rpb24ucGF5bG9hZC5pZCxcbiAgICAgICAgbmV4dFpJbmRleDogc3RhdGUubmV4dFpJbmRleCArIDFcbiAgICAgIH07XG4gICAgY2FzZSAnQ0xPU0VfQVBQJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLnN0YXRlLFxuICAgICAgICBvcGVuQXBwczogc3RhdGUub3BlbkFwcHMuZmlsdGVyKGFwcCA9PiBhcHAuaWQgIT09IGFjdGlvbi5wYXlsb2FkKSxcbiAgICAgICAgYWN0aXZlQXBwOiBzdGF0ZS5hY3RpdmVBcHAgPT09IGFjdGlvbi5wYXlsb2FkID8gbnVsbCA6IHN0YXRlLmFjdGl2ZUFwcFxuICAgICAgfTtcbiAgICBjYXNlICdTRVRfQUNUSVZFX0FQUCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5zdGF0ZSxcbiAgICAgICAgYWN0aXZlQXBwOiBhY3Rpb24ucGF5bG9hZCxcbiAgICAgICAgb3BlbkFwcHM6IHN0YXRlLm9wZW5BcHBzLm1hcChhcHAgPT5cbiAgICAgICAgICBhcHAuaWQgPT09IGFjdGlvbi5wYXlsb2FkID8geyAuLi5hcHAsIHpJbmRleDogc3RhdGUubmV4dFpJbmRleCB9IDogYXBwXG4gICAgICAgICksXG4gICAgICAgIG5leHRaSW5kZXg6IHN0YXRlLm5leHRaSW5kZXggKyAxXG4gICAgICB9O1xuICAgIGNhc2UgJ01JTklNSVpFX0FQUCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5zdGF0ZSxcbiAgICAgICAgb3BlbkFwcHM6IHN0YXRlLm9wZW5BcHBzLm1hcChhcHAgPT5cbiAgICAgICAgICBhcHAuaWQgPT09IGFjdGlvbi5wYXlsb2FkID8geyAuLi5hcHAsIG1pbmltaXplZDogIWFwcC5taW5pbWl6ZWQgfSA6IGFwcFxuICAgICAgICApXG4gICAgICB9O1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gc3RhdGU7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEFwcFByb3ZpZGVyKHsgY2hpbGRyZW4gfSkge1xuICBjb25zdCBbc3RhdGUsIGRpc3BhdGNoXSA9IHVzZVJlZHVjZXIoYXBwUmVkdWNlciwgaW5pdGlhbFN0YXRlKTtcblxuICByZXR1cm4gKFxuICAgIDxBcHBDb250ZXh0LlByb3ZpZGVyIHZhbHVlPXt7IHN0YXRlLCBkaXNwYXRjaCB9fT5cbiAgICAgIHtjaGlsZHJlbn1cbiAgICA8L0FwcENvbnRleHQuUHJvdmlkZXI+XG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VBcHAoKSB7XG4gIGNvbnN0IGNvbnRleHQgPSB1c2VDb250ZXh0KEFwcENvbnRleHQpO1xuICBpZiAoIWNvbnRleHQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3VzZUFwcCBtdXN0IGJlIHVzZWQgd2l0aGluIEFwcFByb3ZpZGVyJyk7XG4gIH1cbiAgcmV0dXJuIGNvbnRleHQ7XG59Il0sIm5hbWVzIjpbImNyZWF0ZUNvbnRleHQiLCJ1c2VDb250ZXh0IiwidXNlUmVkdWNlciIsIkFwcENvbnRleHQiLCJpbml0aWFsU3RhdGUiLCJvcGVuQXBwcyIsImFjdGl2ZUFwcCIsIm5leHRaSW5kZXgiLCJhcHBSZWR1Y2VyIiwic3RhdGUiLCJhY3Rpb24iLCJ0eXBlIiwiZmluZCIsImFwcCIsImlkIiwicGF5bG9hZCIsIm1hcCIsInpJbmRleCIsImZpbHRlciIsIm1pbmltaXplZCIsIkFwcFByb3ZpZGVyIiwiY2hpbGRyZW4iLCJkaXNwYXRjaCIsIlByb3ZpZGVyIiwidmFsdWUiLCJ1c2VBcHAiLCJjb250ZXh0IiwiRXJyb3IiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/context/AppContext.js\n");

/***/ }),

/***/ "./src/pages/_app.js":
/*!***************************!*\
  !*** ./src/pages/_app.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ App)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/styles/globals.css */ \"./src/styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _context_AppContext__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/context/AppContext */ \"./src/context/AppContext.js\");\n\n\n\nfunction App({ Component, pageProps }) {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_context_AppContext__WEBPACK_IMPORTED_MODULE_2__.AppProvider, {\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n            ...pageProps\n        }, void 0, false, {\n            fileName: \"/Users/huang/OrbitOS/src/pages/_app.js\",\n            lineNumber: 7,\n            columnNumber: 7\n        }, this)\n    }, void 0, false, {\n        fileName: \"/Users/huang/OrbitOS/src/pages/_app.js\",\n        lineNumber: 6,\n        columnNumber: 5\n    }, this);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvcGFnZXMvX2FwcC5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQThCO0FBQ3FCO0FBRXBDLFNBQVNDLElBQUksRUFBRUMsU0FBUyxFQUFFQyxTQUFTLEVBQUU7SUFDbEQscUJBQ0UsOERBQUNILDREQUFXQTtrQkFDViw0RUFBQ0U7WUFBVyxHQUFHQyxTQUFTOzs7Ozs7Ozs7OztBQUc5QiIsInNvdXJjZXMiOlsid2VicGFjazovL3dlYi1vcy1wcm9qZWN0Ly4vc3JjL3BhZ2VzL19hcHAuanM/OGZkYSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJ0Avc3R5bGVzL2dsb2JhbHMuY3NzJztcbmltcG9ydCB7IEFwcFByb3ZpZGVyIH0gZnJvbSAnQC9jb250ZXh0L0FwcENvbnRleHQnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBBcHAoeyBDb21wb25lbnQsIHBhZ2VQcm9wcyB9KSB7XG4gIHJldHVybiAoXG4gICAgPEFwcFByb3ZpZGVyPlxuICAgICAgPENvbXBvbmVudCB7Li4ucGFnZVByb3BzfSAvPlxuICAgIDwvQXBwUHJvdmlkZXI+XG4gICk7XG59Il0sIm5hbWVzIjpbIkFwcFByb3ZpZGVyIiwiQXBwIiwiQ29tcG9uZW50IiwicGFnZVByb3BzIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./src/pages/_app.js\n");

/***/ }),

/***/ "./src/styles/globals.css":
/*!********************************!*\
  !*** ./src/styles/globals.css ***!
  \********************************/
/***/ (() => {



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

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("./src/pages/_app.js"));
module.exports = __webpack_exports__;

})();