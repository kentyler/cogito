goog.provide('ajax.core');
ajax.core.to_interceptor = ajax.interceptors.to_interceptor;
/**
 * Call this on the result of `ajax-request` to cancel the request.
 */
ajax.core.abort = (function ajax$core$abort(this$){
return ajax.protocols._abort(this$);
});
ajax.core.json_request_format = ajax.json.json_request_format;
ajax.core.json_response_format = ajax.json.json_response_format;
ajax.core.transit_request_format = ajax.transit.transit_request_format;
ajax.core.transit_response_format = ajax.transit.transit_response_format;
ajax.core.ring_response_format = ajax.ring.ring_response_format;
ajax.core.url_request_format = ajax.url.url_request_format;
ajax.core.text_request_format = ajax.formats.text_request_format;
ajax.core.text_response_format = ajax.formats.text_response_format;
ajax.core.raw_response_format = ajax.formats.raw_response_format;
ajax.core.success_QMARK_ = ajax.util.success_QMARK_;
ajax.core.default_interceptors = ajax.simple.default_interceptors;
ajax.core.ajax_request = ajax.simple.ajax_request;
ajax.core.default_formats = ajax.easy.default_formats;
ajax.core.detect_response_format = ajax.easy.detect_response_format;
/**
 * accepts the URI and an optional map of options, options include:
 *      :handler - the handler function for successful operation
 *                 should accept a single parameter which is the
 *                 deserialized response
 *      :progress-handler - the handler function for progress events.
 *                          this handler is only available when using the goog.net.XhrIo API
 *      :error-handler - the handler function for errors, should accept a
 *                       map with keys :status and :status-text
 *      :format - the format for the request
 *      :response-format - the format for the response
 *      :params - a map of parameters that will be sent with the request
 */
ajax.core.GET = (function ajax$core$GET(var_args){
var args__5732__auto__ = [];
var len__5726__auto___11382 = arguments.length;
var i__5727__auto___11383 = (0);
while(true){
if((i__5727__auto___11383 < len__5726__auto___11382)){
args__5732__auto__.push((arguments[i__5727__auto___11383]));

var G__11384 = (i__5727__auto___11383 + (1));
i__5727__auto___11383 = G__11384;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return ajax.core.GET.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(ajax.core.GET.cljs$core$IFn$_invoke$arity$variadic = (function (uri,opts){
var f__10613__auto__ = cljs.core.first(opts);
return ajax.easy.easy_ajax_request(uri,"GET",(((f__10613__auto__ instanceof cljs.core.Keyword))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,opts):f__10613__auto__));
}));

(ajax.core.GET.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(ajax.core.GET.cljs$lang$applyTo = (function (seq11350){
var G__11351 = cljs.core.first(seq11350);
var seq11350__$1 = cljs.core.next(seq11350);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__11351,seq11350__$1);
}));

/**
 * accepts the URI and an optional map of options, options include:
 *      :handler - the handler function for successful operation
 *                 should accept a single parameter which is the
 *                 deserialized response
 *      :progress-handler - the handler function for progress events.
 *                          this handler is only available when using the goog.net.XhrIo API
 *      :error-handler - the handler function for errors, should accept a
 *                       map with keys :status and :status-text
 *      :format - the format for the request
 *      :response-format - the format for the response
 *      :params - a map of parameters that will be sent with the request
 */
ajax.core.HEAD = (function ajax$core$HEAD(var_args){
var args__5732__auto__ = [];
var len__5726__auto___11387 = arguments.length;
var i__5727__auto___11388 = (0);
while(true){
if((i__5727__auto___11388 < len__5726__auto___11387)){
args__5732__auto__.push((arguments[i__5727__auto___11388]));

var G__11389 = (i__5727__auto___11388 + (1));
i__5727__auto___11388 = G__11389;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return ajax.core.HEAD.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(ajax.core.HEAD.cljs$core$IFn$_invoke$arity$variadic = (function (uri,opts){
var f__10613__auto__ = cljs.core.first(opts);
return ajax.easy.easy_ajax_request(uri,"HEAD",(((f__10613__auto__ instanceof cljs.core.Keyword))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,opts):f__10613__auto__));
}));

(ajax.core.HEAD.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(ajax.core.HEAD.cljs$lang$applyTo = (function (seq11353){
var G__11354 = cljs.core.first(seq11353);
var seq11353__$1 = cljs.core.next(seq11353);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__11354,seq11353__$1);
}));

/**
 * accepts the URI and an optional map of options, options include:
 *      :handler - the handler function for successful operation
 *                 should accept a single parameter which is the
 *                 deserialized response
 *      :progress-handler - the handler function for progress events.
 *                          this handler is only available when using the goog.net.XhrIo API
 *      :error-handler - the handler function for errors, should accept a
 *                       map with keys :status and :status-text
 *      :format - the format for the request
 *      :response-format - the format for the response
 *      :params - a map of parameters that will be sent with the request
 */
ajax.core.POST = (function ajax$core$POST(var_args){
var args__5732__auto__ = [];
var len__5726__auto___11390 = arguments.length;
var i__5727__auto___11391 = (0);
while(true){
if((i__5727__auto___11391 < len__5726__auto___11390)){
args__5732__auto__.push((arguments[i__5727__auto___11391]));

var G__11392 = (i__5727__auto___11391 + (1));
i__5727__auto___11391 = G__11392;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return ajax.core.POST.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(ajax.core.POST.cljs$core$IFn$_invoke$arity$variadic = (function (uri,opts){
var f__10613__auto__ = cljs.core.first(opts);
return ajax.easy.easy_ajax_request(uri,"POST",(((f__10613__auto__ instanceof cljs.core.Keyword))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,opts):f__10613__auto__));
}));

(ajax.core.POST.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(ajax.core.POST.cljs$lang$applyTo = (function (seq11363){
var G__11364 = cljs.core.first(seq11363);
var seq11363__$1 = cljs.core.next(seq11363);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__11364,seq11363__$1);
}));

/**
 * accepts the URI and an optional map of options, options include:
 *      :handler - the handler function for successful operation
 *                 should accept a single parameter which is the
 *                 deserialized response
 *      :progress-handler - the handler function for progress events.
 *                          this handler is only available when using the goog.net.XhrIo API
 *      :error-handler - the handler function for errors, should accept a
 *                       map with keys :status and :status-text
 *      :format - the format for the request
 *      :response-format - the format for the response
 *      :params - a map of parameters that will be sent with the request
 */
ajax.core.PUT = (function ajax$core$PUT(var_args){
var args__5732__auto__ = [];
var len__5726__auto___11393 = arguments.length;
var i__5727__auto___11394 = (0);
while(true){
if((i__5727__auto___11394 < len__5726__auto___11393)){
args__5732__auto__.push((arguments[i__5727__auto___11394]));

var G__11395 = (i__5727__auto___11394 + (1));
i__5727__auto___11394 = G__11395;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return ajax.core.PUT.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(ajax.core.PUT.cljs$core$IFn$_invoke$arity$variadic = (function (uri,opts){
var f__10613__auto__ = cljs.core.first(opts);
return ajax.easy.easy_ajax_request(uri,"PUT",(((f__10613__auto__ instanceof cljs.core.Keyword))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,opts):f__10613__auto__));
}));

(ajax.core.PUT.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(ajax.core.PUT.cljs$lang$applyTo = (function (seq11367){
var G__11368 = cljs.core.first(seq11367);
var seq11367__$1 = cljs.core.next(seq11367);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__11368,seq11367__$1);
}));

/**
 * accepts the URI and an optional map of options, options include:
 *      :handler - the handler function for successful operation
 *                 should accept a single parameter which is the
 *                 deserialized response
 *      :progress-handler - the handler function for progress events.
 *                          this handler is only available when using the goog.net.XhrIo API
 *      :error-handler - the handler function for errors, should accept a
 *                       map with keys :status and :status-text
 *      :format - the format for the request
 *      :response-format - the format for the response
 *      :params - a map of parameters that will be sent with the request
 */
ajax.core.DELETE = (function ajax$core$DELETE(var_args){
var args__5732__auto__ = [];
var len__5726__auto___11396 = arguments.length;
var i__5727__auto___11397 = (0);
while(true){
if((i__5727__auto___11397 < len__5726__auto___11396)){
args__5732__auto__.push((arguments[i__5727__auto___11397]));

var G__11398 = (i__5727__auto___11397 + (1));
i__5727__auto___11397 = G__11398;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return ajax.core.DELETE.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(ajax.core.DELETE.cljs$core$IFn$_invoke$arity$variadic = (function (uri,opts){
var f__10613__auto__ = cljs.core.first(opts);
return ajax.easy.easy_ajax_request(uri,"DELETE",(((f__10613__auto__ instanceof cljs.core.Keyword))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,opts):f__10613__auto__));
}));

(ajax.core.DELETE.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(ajax.core.DELETE.cljs$lang$applyTo = (function (seq11370){
var G__11371 = cljs.core.first(seq11370);
var seq11370__$1 = cljs.core.next(seq11370);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__11371,seq11370__$1);
}));

/**
 * accepts the URI and an optional map of options, options include:
 *      :handler - the handler function for successful operation
 *                 should accept a single parameter which is the
 *                 deserialized response
 *      :progress-handler - the handler function for progress events.
 *                          this handler is only available when using the goog.net.XhrIo API
 *      :error-handler - the handler function for errors, should accept a
 *                       map with keys :status and :status-text
 *      :format - the format for the request
 *      :response-format - the format for the response
 *      :params - a map of parameters that will be sent with the request
 */
ajax.core.OPTIONS = (function ajax$core$OPTIONS(var_args){
var args__5732__auto__ = [];
var len__5726__auto___11399 = arguments.length;
var i__5727__auto___11400 = (0);
while(true){
if((i__5727__auto___11400 < len__5726__auto___11399)){
args__5732__auto__.push((arguments[i__5727__auto___11400]));

var G__11401 = (i__5727__auto___11400 + (1));
i__5727__auto___11400 = G__11401;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return ajax.core.OPTIONS.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(ajax.core.OPTIONS.cljs$core$IFn$_invoke$arity$variadic = (function (uri,opts){
var f__10613__auto__ = cljs.core.first(opts);
return ajax.easy.easy_ajax_request(uri,"OPTIONS",(((f__10613__auto__ instanceof cljs.core.Keyword))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,opts):f__10613__auto__));
}));

(ajax.core.OPTIONS.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(ajax.core.OPTIONS.cljs$lang$applyTo = (function (seq11372){
var G__11373 = cljs.core.first(seq11372);
var seq11372__$1 = cljs.core.next(seq11372);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__11373,seq11372__$1);
}));

/**
 * accepts the URI and an optional map of options, options include:
 *      :handler - the handler function for successful operation
 *                 should accept a single parameter which is the
 *                 deserialized response
 *      :progress-handler - the handler function for progress events.
 *                          this handler is only available when using the goog.net.XhrIo API
 *      :error-handler - the handler function for errors, should accept a
 *                       map with keys :status and :status-text
 *      :format - the format for the request
 *      :response-format - the format for the response
 *      :params - a map of parameters that will be sent with the request
 */
ajax.core.TRACE = (function ajax$core$TRACE(var_args){
var args__5732__auto__ = [];
var len__5726__auto___11402 = arguments.length;
var i__5727__auto___11403 = (0);
while(true){
if((i__5727__auto___11403 < len__5726__auto___11402)){
args__5732__auto__.push((arguments[i__5727__auto___11403]));

var G__11404 = (i__5727__auto___11403 + (1));
i__5727__auto___11403 = G__11404;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return ajax.core.TRACE.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(ajax.core.TRACE.cljs$core$IFn$_invoke$arity$variadic = (function (uri,opts){
var f__10613__auto__ = cljs.core.first(opts);
return ajax.easy.easy_ajax_request(uri,"TRACE",(((f__10613__auto__ instanceof cljs.core.Keyword))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,opts):f__10613__auto__));
}));

(ajax.core.TRACE.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(ajax.core.TRACE.cljs$lang$applyTo = (function (seq11375){
var G__11376 = cljs.core.first(seq11375);
var seq11375__$1 = cljs.core.next(seq11375);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__11376,seq11375__$1);
}));

/**
 * accepts the URI and an optional map of options, options include:
 *      :handler - the handler function for successful operation
 *                 should accept a single parameter which is the
 *                 deserialized response
 *      :progress-handler - the handler function for progress events.
 *                          this handler is only available when using the goog.net.XhrIo API
 *      :error-handler - the handler function for errors, should accept a
 *                       map with keys :status and :status-text
 *      :format - the format for the request
 *      :response-format - the format for the response
 *      :params - a map of parameters that will be sent with the request
 */
ajax.core.PATCH = (function ajax$core$PATCH(var_args){
var args__5732__auto__ = [];
var len__5726__auto___11405 = arguments.length;
var i__5727__auto___11406 = (0);
while(true){
if((i__5727__auto___11406 < len__5726__auto___11405)){
args__5732__auto__.push((arguments[i__5727__auto___11406]));

var G__11407 = (i__5727__auto___11406 + (1));
i__5727__auto___11406 = G__11407;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return ajax.core.PATCH.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(ajax.core.PATCH.cljs$core$IFn$_invoke$arity$variadic = (function (uri,opts){
var f__10613__auto__ = cljs.core.first(opts);
return ajax.easy.easy_ajax_request(uri,"PATCH",(((f__10613__auto__ instanceof cljs.core.Keyword))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,opts):f__10613__auto__));
}));

(ajax.core.PATCH.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(ajax.core.PATCH.cljs$lang$applyTo = (function (seq11377){
var G__11378 = cljs.core.first(seq11377);
var seq11377__$1 = cljs.core.next(seq11377);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__11378,seq11377__$1);
}));

/**
 * accepts the URI and an optional map of options, options include:
 *      :handler - the handler function for successful operation
 *                 should accept a single parameter which is the
 *                 deserialized response
 *      :progress-handler - the handler function for progress events.
 *                          this handler is only available when using the goog.net.XhrIo API
 *      :error-handler - the handler function for errors, should accept a
 *                       map with keys :status and :status-text
 *      :format - the format for the request
 *      :response-format - the format for the response
 *      :params - a map of parameters that will be sent with the request
 */
ajax.core.PURGE = (function ajax$core$PURGE(var_args){
var args__5732__auto__ = [];
var len__5726__auto___11408 = arguments.length;
var i__5727__auto___11409 = (0);
while(true){
if((i__5727__auto___11409 < len__5726__auto___11408)){
args__5732__auto__.push((arguments[i__5727__auto___11409]));

var G__11410 = (i__5727__auto___11409 + (1));
i__5727__auto___11409 = G__11410;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return ajax.core.PURGE.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(ajax.core.PURGE.cljs$core$IFn$_invoke$arity$variadic = (function (uri,opts){
var f__10613__auto__ = cljs.core.first(opts);
return ajax.easy.easy_ajax_request(uri,"PURGE",(((f__10613__auto__ instanceof cljs.core.Keyword))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,opts):f__10613__auto__));
}));

(ajax.core.PURGE.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(ajax.core.PURGE.cljs$lang$applyTo = (function (seq11380){
var G__11381 = cljs.core.first(seq11380);
var seq11380__$1 = cljs.core.next(seq11380);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__11381,seq11380__$1);
}));


//# sourceMappingURL=ajax.core.js.map
