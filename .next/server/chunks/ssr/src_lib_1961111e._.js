module.exports = [
"[project]/src/lib/auth.ts [app-ssr] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.resolve().then(() => {
        return parentImport("[project]/src/lib/auth.ts [app-ssr] (ecmascript)");
    });
});
}),
"[project]/src/lib/supabase/client.ts [app-ssr] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/ssr/node_modules_@supabase_node-fetch_lib_index_eb26751e.js",
  "server/chunks/ssr/node_modules_e6aa9121._.js",
  "server/chunks/ssr/[root-of-the-server]__417e3a19._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/src/lib/supabase/client.ts [app-ssr] (ecmascript)");
    });
});
}),
];