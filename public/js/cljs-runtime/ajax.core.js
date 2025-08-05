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
var len__5726__auto___11502 = arguments.length;
var i__5727__auto___11503 = (0);
while(true){
if((i__5727__auto___11503 < len__5726__auto___11502)){
args__5732__auto__.push((arguments[i__5727__auto___11503]));

var G__11504 = (i__5727__auto___11503 + (1));
i__5727__auto___11503 = G__11504;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return ajax.core.GET.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(ajax.core.GET.cljs$core$IFn$_invoke$arity$variadic = (function (uri,opts){
var f__10491__auto__ = cljs.core.first(opts);
return ajax.easy.easy_ajax_request(uri,"GET",(((f__10491__auto__ instanceof cljs.core.Keyword))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,opts):f__10491__auto__));
}));

(ajax.core.GET.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(ajax.core.GET.cljs$lang$applyTo = (function (seq11390){
var G__11391 = cljs.core.first(seq11390);
var seq11390__$1 = cljs.core.next(seq11390);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__11391,seq11390__$1);
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
var len__5726__auto___11505 = arguments.length;
var i__5727__auto___11506 = (0);
while(true){
if((i__5727__auto___11506 < len__5726__auto___11505)){
args__5732__auto__.push((arguments[i__5727__auto___11506]));

var G__11507 = (i__5727__auto___11506 + (1));
i__5727__auto___11506 = G__11507;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return ajax.core.HEAD.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(ajax.core.HEAD.cljs$core$IFn$_invoke$arity$variadic = (function (uri,opts){
var f__10491__auto__ = cljs.core.first(opts);
return ajax.easy.easy_ajax_request(uri,"HEAD",(((f__10491__auto__ instanceof cljs.core.Keyword))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,opts):f__10491__auto__));
}));

(ajax.core.HEAD.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(ajax.core.HEAD.cljs$lang$applyTo = (function (seq11405){
var G__11406 = cljs.core.first(seq11405);
var seq11405__$1 = cljs.core.next(seq11405);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__11406,seq11405__$1);
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
var len__5726__auto___11513 = arguments.length;
var i__5727__auto___11514 = (0);
while(true){
if((i__5727__auto___11514 < len__5726__auto___11513)){
args__5732__auto__.push((arguments[i__5727__auto___11514]));

var G__11515 = (i__5727__auto___11514 + (1));
i__5727__auto___11514 = G__11515;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return ajax.core.POST.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(ajax.core.POST.cljs$core$IFn$_invoke$arity$variadic = (function (uri,opts){
var f__10491__auto__ = cljs.core.first(opts);
return ajax.easy.easy_ajax_request(uri,"POST",(((f__10491__auto__ instanceof cljs.core.Keyword))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,opts):f__10491__auto__));
}));

(ajax.core.POST.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(ajax.core.POST.cljs$lang$applyTo = (function (seq11411){
var G__11412 = cljs.core.first(seq11411);
var seq11411__$1 = cljs.core.next(seq11411);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__11412,seq11411__$1);
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
var len__5726__auto___11517 = arguments.length;
var i__5727__auto___11519 = (0);
while(true){
if((i__5727__auto___11519 < len__5726__auto___11517)){
args__5732__auto__.push((arguments[i__5727__auto___11519]));

var G__11520 = (i__5727__auto___11519 + (1));
i__5727__auto___11519 = G__11520;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return ajax.core.PUT.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(ajax.core.PUT.cljs$core$IFn$_invoke$arity$variadic = (function (uri,opts){
var f__10491__auto__ = cljs.core.first(opts);
return ajax.easy.easy_ajax_request(uri,"PUT",(((f__10491__auto__ instanceof cljs.core.Keyword))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,opts):f__10491__auto__));
}));

(ajax.core.PUT.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(ajax.core.PUT.cljs$lang$applyTo = (function (seq11419){
var G__11420 = cljs.core.first(seq11419);
var seq11419__$1 = cljs.core.next(seq11419);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__11420,seq11419__$1);
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
var len__5726__auto___11521 = arguments.length;
var i__5727__auto___11522 = (0);
while(true){
if((i__5727__auto___11522 < len__5726__auto___11521)){
args__5732__auto__.push((arguments[i__5727__auto___11522]));

var G__11523 = (i__5727__auto___11522 + (1));
i__5727__auto___11522 = G__11523;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return ajax.core.DELETE.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(ajax.core.DELETE.cljs$core$IFn$_invoke$arity$variadic = (function (uri,opts){
var f__10491__auto__ = cljs.core.first(opts);
return ajax.easy.easy_ajax_request(uri,"DELETE",(((f__10491__auto__ instanceof cljs.core.Keyword))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,opts):f__10491__auto__));
}));

(ajax.core.DELETE.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(ajax.core.DELETE.cljs$lang$applyTo = (function (seq11445){
var G__11446 = cljs.core.first(seq11445);
var seq11445__$1 = cljs.core.next(seq11445);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__11446,seq11445__$1);
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
var len__5726__auto___11534 = arguments.length;
var i__5727__auto___11535 = (0);
while(true){
if((i__5727__auto___11535 < len__5726__auto___11534)){
args__5732__auto__.push((arguments[i__5727__auto___11535]));

var G__11536 = (i__5727__auto___11535 + (1));
i__5727__auto___11535 = G__11536;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return ajax.core.OPTIONS.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(ajax.core.OPTIONS.cljs$core$IFn$_invoke$arity$variadic = (function (uri,opts){
var f__10491__auto__ = cljs.core.first(opts);
return ajax.easy.easy_ajax_request(uri,"OPTIONS",(((f__10491__auto__ instanceof cljs.core.Keyword))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,opts):f__10491__auto__));
}));

(ajax.core.OPTIONS.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(ajax.core.OPTIONS.cljs$lang$applyTo = (function (seq11464){
var G__11465 = cljs.core.first(seq11464);
var seq11464__$1 = cljs.core.next(seq11464);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__11465,seq11464__$1);
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
var len__5726__auto___11538 = arguments.length;
var i__5727__auto___11539 = (0);
while(true){
if((i__5727__auto___11539 < len__5726__auto___11538)){
args__5732__auto__.push((arguments[i__5727__auto___11539]));

var G__11555 = (i__5727__auto___11539 + (1));
i__5727__auto___11539 = G__11555;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return ajax.core.TRACE.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(ajax.core.TRACE.cljs$core$IFn$_invoke$arity$variadic = (function (uri,opts){
var f__10491__auto__ = cljs.core.first(opts);
return ajax.easy.easy_ajax_request(uri,"TRACE",(((f__10491__auto__ instanceof cljs.core.Keyword))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,opts):f__10491__auto__));
}));

(ajax.core.TRACE.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(ajax.core.TRACE.cljs$lang$applyTo = (function (seq11470){
var G__11471 = cljs.core.first(seq11470);
var seq11470__$1 = cljs.core.next(seq11470);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__11471,seq11470__$1);
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
var len__5726__auto___11557 = arguments.length;
var i__5727__auto___11558 = (0);
while(true){
if((i__5727__auto___11558 < len__5726__auto___11557)){
args__5732__auto__.push((arguments[i__5727__auto___11558]));

var G__11559 = (i__5727__auto___11558 + (1));
i__5727__auto___11558 = G__11559;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return ajax.core.PATCH.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(ajax.core.PATCH.cljs$core$IFn$_invoke$arity$variadic = (function (uri,opts){
var f__10491__auto__ = cljs.core.first(opts);
return ajax.easy.easy_ajax_request(uri,"PATCH",(((f__10491__auto__ instanceof cljs.core.Keyword))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,opts):f__10491__auto__));
}));

(ajax.core.PATCH.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(ajax.core.PATCH.cljs$lang$applyTo = (function (seq11481){
var G__11482 = cljs.core.first(seq11481);
var seq11481__$1 = cljs.core.next(seq11481);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__11482,seq11481__$1);
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
var len__5726__auto___11564 = arguments.length;
var i__5727__auto___11575 = (0);
while(true){
if((i__5727__auto___11575 < len__5726__auto___11564)){
args__5732__auto__.push((arguments[i__5727__auto___11575]));

var G__11576 = (i__5727__auto___11575 + (1));
i__5727__auto___11575 = G__11576;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return ajax.core.PURGE.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(ajax.core.PURGE.cljs$core$IFn$_invoke$arity$variadic = (function (uri,opts){
var f__10491__auto__ = cljs.core.first(opts);
return ajax.easy.easy_ajax_request(uri,"PURGE",(((f__10491__auto__ instanceof cljs.core.Keyword))?cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map,opts):f__10491__auto__));
}));

(ajax.core.PURGE.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(ajax.core.PURGE.cljs$lang$applyTo = (function (seq11493){
var G__11494 = cljs.core.first(seq11493);
var seq11493__$1 = cljs.core.next(seq11493);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__11494,seq11493__$1);
}));


//# sourceMappingURL=ajax.core.js.map
