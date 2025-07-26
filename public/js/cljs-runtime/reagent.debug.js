goog.provide('reagent.debug');
reagent.debug.has_console = (typeof console !== 'undefined');
reagent.debug.tracking = false;
if((typeof reagent !== 'undefined') && (typeof reagent.debug !== 'undefined') && (typeof reagent.debug.warnings !== 'undefined')){
} else {
reagent.debug.warnings = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null);
}
if((typeof reagent !== 'undefined') && (typeof reagent.debug !== 'undefined') && (typeof reagent.debug.track_console !== 'undefined')){
} else {
reagent.debug.track_console = (function (){var o = ({});
(o.warn = (function() { 
var G__11818__delegate = function (args){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(reagent.debug.warnings,cljs.core.update_in,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"warn","warn",-436710552)], null),cljs.core.conj,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,args)], 0));
};
var G__11818 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__11819__i = 0, G__11819__a = new Array(arguments.length -  0);
while (G__11819__i < G__11819__a.length) {G__11819__a[G__11819__i] = arguments[G__11819__i + 0]; ++G__11819__i;}
  args = new cljs.core.IndexedSeq(G__11819__a,0,null);
} 
return G__11818__delegate.call(this,args);};
G__11818.cljs$lang$maxFixedArity = 0;
G__11818.cljs$lang$applyTo = (function (arglist__11820){
var args = cljs.core.seq(arglist__11820);
return G__11818__delegate(args);
});
G__11818.cljs$core$IFn$_invoke$arity$variadic = G__11818__delegate;
return G__11818;
})()
);

(o.error = (function() { 
var G__11821__delegate = function (args){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(reagent.debug.warnings,cljs.core.update_in,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"error","error",-978969032)], null),cljs.core.conj,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,args)], 0));
};
var G__11821 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__11822__i = 0, G__11822__a = new Array(arguments.length -  0);
while (G__11822__i < G__11822__a.length) {G__11822__a[G__11822__i] = arguments[G__11822__i + 0]; ++G__11822__i;}
  args = new cljs.core.IndexedSeq(G__11822__a,0,null);
} 
return G__11821__delegate.call(this,args);};
G__11821.cljs$lang$maxFixedArity = 0;
G__11821.cljs$lang$applyTo = (function (arglist__11823){
var args = cljs.core.seq(arglist__11823);
return G__11821__delegate(args);
});
G__11821.cljs$core$IFn$_invoke$arity$variadic = G__11821__delegate;
return G__11821;
})()
);

return o;
})();
}
reagent.debug.track_warnings = (function reagent$debug$track_warnings(f){
(reagent.debug.tracking = true);

cljs.core.reset_BANG_(reagent.debug.warnings,null);

(f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null));

var warns = cljs.core.deref(reagent.debug.warnings);
cljs.core.reset_BANG_(reagent.debug.warnings,null);

(reagent.debug.tracking = false);

return warns;
});

//# sourceMappingURL=reagent.debug.js.map
