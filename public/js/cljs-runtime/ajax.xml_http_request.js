goog.provide('ajax.xml_http_request');
ajax.xml_http_request.ready_state = (function ajax$xml_http_request$ready_state(e){
var G__12511 = e.target.readyState;
var fexpr__12510 = new cljs.core.PersistentArrayMap(null, 5, [(0),new cljs.core.Keyword(null,"not-initialized","not-initialized",-1937378906),(1),new cljs.core.Keyword(null,"connection-established","connection-established",-1403749733),(2),new cljs.core.Keyword(null,"request-received","request-received",2110590540),(3),new cljs.core.Keyword(null,"processing-request","processing-request",-264947221),(4),new cljs.core.Keyword(null,"response-ready","response-ready",245208276)], null);
return (fexpr__12510.cljs$core$IFn$_invoke$arity$1 ? fexpr__12510.cljs$core$IFn$_invoke$arity$1(G__12511) : fexpr__12510.call(null,G__12511));
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

(ajax.xml_http_request.xmlhttprequest.prototype.ajax$protocols$AjaxImpl$_js_ajax_request$arity$3 = (function (this$,p__12514,handler){
var map__12519 = p__12514;
var map__12519__$1 = cljs.core.__destructure_map(map__12519);
var uri = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12519__$1,new cljs.core.Keyword(null,"uri","uri",-774711847));
var method = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12519__$1,new cljs.core.Keyword(null,"method","method",55703592));
var body = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12519__$1,new cljs.core.Keyword(null,"body","body",-2049205669));
var headers = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12519__$1,new cljs.core.Keyword(null,"headers","headers",-835030129));
var timeout = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__12519__$1,new cljs.core.Keyword(null,"timeout","timeout",-318625318),(0));
var with_credentials = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__12519__$1,new cljs.core.Keyword(null,"with-credentials","with-credentials",-1163127235),false);
var response_format = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12519__$1,new cljs.core.Keyword(null,"response-format","response-format",1664465322));
var this$__$1 = this;
(this$__$1.withCredentials = with_credentials);

(this$__$1.onreadystatechange = (function (p1__12513_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"response-ready","response-ready",245208276),ajax.xml_http_request.ready_state(p1__12513_SHARP_))){
return (handler.cljs$core$IFn$_invoke$arity$1 ? handler.cljs$core$IFn$_invoke$arity$1(this$__$1) : handler.call(null,this$__$1));
} else {
return null;
}
}));

this$__$1.open(method,uri,true);

(this$__$1.timeout = timeout);

var temp__5804__auto___12548 = new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(response_format);
if(cljs.core.truth_(temp__5804__auto___12548)){
var response_type_12549 = temp__5804__auto___12548;
(this$__$1.responseType = cljs.core.name(response_type_12549));
} else {
}

var seq__12522_12550 = cljs.core.seq(headers);
var chunk__12523_12551 = null;
var count__12524_12552 = (0);
var i__12525_12553 = (0);
while(true){
if((i__12525_12553 < count__12524_12552)){
var vec__12539_12554 = chunk__12523_12551.cljs$core$IIndexed$_nth$arity$2(null,i__12525_12553);
var k_12555 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12539_12554,(0),null);
var v_12556 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12539_12554,(1),null);
this$__$1.setRequestHeader(k_12555,v_12556);


var G__12557 = seq__12522_12550;
var G__12558 = chunk__12523_12551;
var G__12559 = count__12524_12552;
var G__12560 = (i__12525_12553 + (1));
seq__12522_12550 = G__12557;
chunk__12523_12551 = G__12558;
count__12524_12552 = G__12559;
i__12525_12553 = G__12560;
continue;
} else {
var temp__5804__auto___12561 = cljs.core.seq(seq__12522_12550);
if(temp__5804__auto___12561){
var seq__12522_12562__$1 = temp__5804__auto___12561;
if(cljs.core.chunked_seq_QMARK_(seq__12522_12562__$1)){
var c__5525__auto___12563 = cljs.core.chunk_first(seq__12522_12562__$1);
var G__12564 = cljs.core.chunk_rest(seq__12522_12562__$1);
var G__12565 = c__5525__auto___12563;
var G__12566 = cljs.core.count(c__5525__auto___12563);
var G__12567 = (0);
seq__12522_12550 = G__12564;
chunk__12523_12551 = G__12565;
count__12524_12552 = G__12566;
i__12525_12553 = G__12567;
continue;
} else {
var vec__12542_12568 = cljs.core.first(seq__12522_12562__$1);
var k_12569 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12542_12568,(0),null);
var v_12570 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12542_12568,(1),null);
this$__$1.setRequestHeader(k_12569,v_12570);


var G__12571 = cljs.core.next(seq__12522_12562__$1);
var G__12572 = null;
var G__12573 = (0);
var G__12574 = (0);
seq__12522_12550 = G__12571;
chunk__12523_12551 = G__12572;
count__12524_12552 = G__12573;
i__12525_12553 = G__12574;
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
