goog.provide('cogito.edn_parser');
/**
 * Clean up the response string to make it valid EDN
 */
cogito.edn_parser.clean_response_string = (function cogito$edn_parser$clean_response_string(s){
return clojure.string.replace(clojure.string.replace(clojure.string.trim(s),/\\n/,"\n"),/\\t/,"\t");
});
/**
 * Parse a ClojureScript/EDN response string into Clojure data.
 * Falls back to a text response on parse errors.
 */
cogito.edn_parser.parse_cljs_response = (function cogito$edn_parser$parse_cljs_response(response_str){
try{console.log("EDN Parser: Starting to parse response");

console.log("EDN Parser Raw response length:",cljs.core.count(response_str));

var cleaned = cogito.edn_parser.clean_response_string(response_str);
console.log("EDN Parser: Cleaned response length:",((cleaned).length));

var parsed = cljs.reader.read_string.cljs$core$IFn$_invoke$arity$1(cleaned);
console.log("Successfully parsed:",cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([parsed], 0)));

return parsed;
}catch (e12065){if((e12065 instanceof Error)){
var e = e12065;
console.error("Failed to parse EDN response:",response_str);

console.error("Parse error details:",e.message);

console.error("Error stack:",e.stack);

try{var start_idx = response_str.indexOf("{");
var end_idx = response_str.lastIndexOf("}");
if((((start_idx >= (0))) && ((end_idx > start_idx)))){
var extracted = response_str.substring(start_idx,(end_idx + (1)));
var cleaned = cogito.edn_parser.clean_response_string(extracted);
console.log("Trying extracted EDN:",cleaned);

return cljs.reader.read_string.cljs$core$IFn$_invoke$arity$1(cleaned);
} else {
throw e;
}
}catch (e12066){if((e12066 instanceof Error)){
var e2 = e12066;
console.error("Extraction also failed:",e2.message);

return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"response-type","response-type",-1493770458),new cljs.core.Keyword(null,"text","text",-1790561697),new cljs.core.Keyword(null,"content","content",15833224),response_str], null);
} else {
throw e12066;

}
}} else {
throw e12065;

}
}});

//# sourceMappingURL=cogito.edn_parser.js.map
