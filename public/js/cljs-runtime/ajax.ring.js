goog.provide('ajax.ring');
ajax.ring.make_ring_read = (function ajax$ring$make_ring_read(body_read){
return (function ajax$ring$make_ring_read_$_ring_read(response){
return new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"status","status",-1997798413),ajax.protocols._status(response),new cljs.core.Keyword(null,"headers","headers",-835030129),ajax.protocols._get_all_headers(response),new cljs.core.Keyword(null,"body","body",-2049205669),(body_read.cljs$core$IFn$_invoke$arity$1 ? body_read.cljs$core$IFn$_invoke$arity$1(response) : body_read.call(null,response))], null);
});
});
/**
 * Returns a Ring-compatible response map.
 * 
 * Optionally can be passed a :format option. This should be another
 * response-format map. If format is provided it will be used to
 * specify the content-type, and the read method will be used to
 * populate the :body key in the response map.
 */
ajax.ring.ring_response_format = (function ajax$ring$ring_response_format(var_args){
var G__11220 = arguments.length;
switch (G__11220) {
case 0:
return ajax.ring.ring_response_format.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return ajax.ring.ring_response_format.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(ajax.ring.ring_response_format.cljs$core$IFn$_invoke$arity$0 = (function (){
return ajax.ring.ring_response_format.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"format","format",-1306924766),ajax.formats.raw_response_format.cljs$core$IFn$_invoke$arity$0()], null));
}));

(ajax.ring.ring_response_format.cljs$core$IFn$_invoke$arity$1 = (function (p__11221){
var map__11222 = p__11221;
var map__11222__$1 = cljs.core.__destructure_map(map__11222);
var map__11223 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__11222__$1,new cljs.core.Keyword(null,"format","format",-1306924766));
var map__11223__$1 = cljs.core.__destructure_map(map__11223);
var read = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__11223__$1,new cljs.core.Keyword(null,"read","read",1140058661));
var description = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__11223__$1,new cljs.core.Keyword(null,"description","description",-1428560544));
var content_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__11223__$1,new cljs.core.Keyword(null,"content-type","content-type",-508222634));
return ajax.interceptors.map__GT_ResponseFormat(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"read","read",1140058661),ajax.ring.make_ring_read(read),new cljs.core.Keyword(null,"description","description",-1428560544),["ring/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(description)].join(''),new cljs.core.Keyword(null,"content-type","content-type",-508222634),content_type], null));
}));

(ajax.ring.ring_response_format.cljs$lang$maxFixedArity = 1);


//# sourceMappingURL=ajax.ring.js.map
