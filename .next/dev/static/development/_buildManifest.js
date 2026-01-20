self.__BUILD_MANIFEST = {
  "/dashboard": [
    "static/chunks/pages/dashboard.js"
  ],
  "__rewrites": {
    "afterFiles": [],
    "beforeFiles": [],
    "fallback": []
  },
  "sortedPages": [
    "/",
    "/_app",
    "/_error",
    "/api/auth/[...nextauth]",
    "/dashboard",
    "/repo/[slug]",
    "/subject",
    "/subject/[subject]",
    "/topic/[topic]"
  ]
};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()