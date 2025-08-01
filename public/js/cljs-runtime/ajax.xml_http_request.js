goog.provide('ajax.xml_http_request');
ajax.xml_http_request.ready_state = (function ajax$xml_http_request$ready_state(e){
var G__11230 = e.target.readyState;
var fexpr__11229 = new cljs.core.PersistentArrayMap(null, 5, [(0),new cljs.core.Keyword(null,"not-initialized","not-initialized",-1937378906),(1),new cljs.core.Keyword(null,"connection-established","connection-established",-1403749733),(2),new cljs.core.Keyword(null,"request-received","request-received",2110590540),(3),new cljs.core.Keyword(null,"processing-request","processing-request",-264947221),(4),new cljs.core.Keyword(null,"response-ready","response-ready",245208276)], null);
return (fexpr__11229.cljs$core$IFn$_invoke$arity$1 ? fexpr__11229.cljs$core$IFn$_invoke$arity$1(G__11230) : fexpr__11229.call(null,G__11230));
});
ajax.xml_http_request.append = (function ajax$xml_http_request$append(current,next){
if(cljs.core.truth_(current)){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(current),", ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(next)].join('');
} else {
return next;
}
});
ajax.xml_http_request.process_headers = (function ajax$xml_http_request$process_headers(header_str){
if(cljs.core.truth_(header_str)){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (headers,header_line){
if(cljs.core.truth_(goog.string.isEmptyOrWhitespace(header_line))){
return headers;
} else {
var key_value = goog.string.splitLimit(header_line,": ",(2));
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(headers,(key_value[(0)]),ajax.xml_http_request.append,(key_value[(1)]));
}
}),cljs.core.PersistentArrayMap.EMPTY,header_str.split("\r\n"));
} else {
return cljs.core.PersistentArrayMap.EMPTY;
}
});
ajax.xml_http_request.xmlhttprequest = (((typeof goog !== 'undefined') && (typeof goog.global !== 'undefined') && (typeof goog.global.XMLHttpRequest !== 'undefined'))?goog.global.XMLHttpRequest:(((typeof require !== 'undefined'))?(function (){var req = require;
return (req.cljs$core$IFn$_invoke$arity$1 ? req.cljs$core$IFn$_invoke$arity$1("xmlhttprequest") : req.call(null,"xmlhttprequest")).XMLHttpRequest;
})():null));
(ajax.xml_http_request.xmlhttprequest.prototype.ajax$protocols$AjaxImpl$ = cljs.core.PROTOCOL_SENTINEL);

(ajax.xml_http_request.xmlhttprequest.prototype.ajax$protocols$AjaxImpl$_js_ajax_request$arity$3 = (function (this$,p__11237,handler){
var map__11238 = p__11237;
var map__11238__$1 = cljs.core.__destructure_map(map__11238);
var uri = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__11238__$1,new cljs.core.Keyword(null,"uri","uri",-774711847));
var method = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__11238__$1,new cljs.core.Keyword(null,"method","method",55703592));
var body = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__11238__$1,new cljs.core.Keyword(null,"body","body",-2049205669));
var headers = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__11238__$1,new cljs.core.Keyword(null,"headers","headers",-835030129));
var timeout = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__11238__$1,new cljs.core.Keyword(null,"timeout","timeout",-318625318),(0));
var with_credentials = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__11238__$1,new cljs.core.Keyword(null,"with-credentials","with-credentials",-1163127235),false);
var response_format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__11238__$1,new cljs.core.Keyword(null,"response-format","response-format",1664465322));
var this$__$1 = this;
(this$__$1.withCredentials = with_credentials);

(this$__$1.onreadystatechange = (function (p1__11236_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"response-ready","response-ready",245208276),ajax.xml_http_request.ready_state(p1__11236_SHARP_))){
return (handler.cljs$core$IFn$_invoke$arity$1 ? handler.cljs$core$IFn$_invoke$arity$1(this$__$1) : handler.call(null,this$__$1));
} else {
return null;
}
}));

this$__$1.open(method,uri,true);

(this$__$1.timeout = timeout);

var temp__5804__auto___11270 = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(response_format);
if(cljs.core.truth_(temp__5804__auto___11270)){
var response_type_11271 = temp__5804__auto___11270;
(this$__$1.responseType = cljs.core.name(response_type_11271));
} else {
}

var seq__11247_11272 = cljs.core.seq(headers);
var chunk__11248_11273 = null;
var count__11249_11274 = (0);
var i__11250_11275 = (0);
while(true){
if((i__11250_11275 < count__11249_11274)){
var vec__11257_11276 = chunk__11248_11273.cljs$core$IIndexed$_nth$arity$2(null,i__11250_11275);
var k_11277 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11257_11276,(0),null);
var v_11278 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11257_11276,(1),null);
this$__$1.setRequestHeader(k_11277,v_11278);


var G__11280 = seq__11247_11272;
var G__11281 = chunk__11248_11273;
var G__11282 = count__11249_11274;
var G__11283 = (i__11250_11275 + (1));
seq__11247_11272 = G__11280;
chunk__11248_11273 = G__11281;
count__11249_11274 = G__11282;
i__11250_11275 = G__11283;
continue;
} else {
var temp__5804__auto___11287 = cljs.core.seq(seq__11247_11272);
if(temp__5804__auto___11287){
var seq__11247_11288__$1 = temp__5804__auto___11287;
if(cljs.core.chunked_seq_QMARK_(seq__11247_11288__$1)){
var c__5525__auto___11289 = cljs.core.chunk_first(seq__11247_11288__$1);
var G__11290 = cljs.core.chunk_rest(seq__11247_11288__$1);
var G__11291 = c__5525__auto___11289;
var G__11292 = cljs.core.count(c__5525__auto___11289);
var G__11293 = (0);
seq__11247_11272 = G__11290;
chunk__11248_11273 = G__11291;
count__11249_11274 = G__11292;
i__11250_11275 = G__11293;
continue;
} else {
var vec__11263_11295 = cljs.core.first(seq__11247_11288__$1);
var k_11296 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11263_11295,(0),null);
var v_11297 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11263_11295,(1),null);
this$__$1.setRequestHeader(k_11296,v_11297);


var G__11298 = cljs.core.next(seq__11247_11288__$1);
var G__11299 = null;
var G__11300 = (0);
var G__11301 = (0);
seq__11247_11272 = G__11298;
chunk__11248_11273 = G__11299;
count__11249_11274 = G__11300;
i__11250_11275 = G__11301;
continue;
}
} else {
}
}
break;
}

this$__$1.send((function (){var or__5002__auto__ = body;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "";
}
})());

return this$__$1;
}));

(ajax.xml_http_request.xmlhttprequest.prototype.ajax$protocols$AjaxRequest$ = cljs.core.PROTOCOL_SENTINEL);

(ajax.xml_http_request.xmlhttprequest.prototype.ajax$protocols$AjaxRequest$_abort$arity$1 = (function (this$){
var this$__$1 = this;
return this$__$1.abort();
}));

(ajax.xml_http_request.xmlhttprequest.prototype.ajax$protocols$AjaxResponse$ = cljs.core.PROTOCOL_SENTINEL);

(ajax.xml_http_request.xmlhttprequest.prototype.ajax$protocols$AjaxResponse$_body$arity$1 = (function (this$){
var this$__$1 = this;
return this$__$1.response;
}));

(ajax.xml_http_request.xmlhttprequest.prototype.ajax$protocols$AjaxResponse$_status$arity$1 = (function (this$){
var this$__$1 = this;
return this$__$1.status;
}));

(ajax.xml_http_request.xmlhttprequest.prototype.ajax$protocols$AjaxResponse$_status_text$arity$1 = (function (this$){
var this$__$1 = this;
return this$__$1.statusText;
}));

(ajax.xml_http_request.xmlhttprequest.prototype.ajax$protocols$AjaxResponse$_get_all_headers$arity$1 = (function (this$){
var this$__$1 = this;
return ajax.xml_http_request.process_headers(this$__$1.getAllResponseHeaders());
}));

(ajax.xml_http_request.xmlhttprequest.prototype.ajax$protocols$AjaxResponse$_get_response_header$arity$2 = (function (this$,header){
var this$__$1 = this;
return this$__$1.getResponseHeader(header);
}));

(ajax.xml_http_request.xmlhttprequest.prototype.ajax$protocols$AjaxResponse$_was_aborted$arity$1 = (function (this$){
var this$__$1 = this;
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((0),this$__$1.readyState);
}));

//# sourceMappingURL=ajax.xml_http_request.js.map
