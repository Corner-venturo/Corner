(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/auth.ts [app-client] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.resolve().then(() => {
        return parentImport("[project]/src/lib/auth.ts [app-client] (ecmascript)");
    });
});
}),
"[project]/src/lib/supabase/client.ts [app-client] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "static/chunks/node_modules_@supabase_node-fetch_browser_ebbd8575.js",
  "static/chunks/node_modules_@supabase_13ba49e6._.js",
  "static/chunks/src_lib_supabase_client_ts_06263c4c._.js",
  "static/chunks/src_lib_supabase_client_ts_0479d67b._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/src/lib/supabase/client.ts [app-client] (ecmascript)");
    });
});
}),
]);