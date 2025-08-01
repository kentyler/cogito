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
var G__7663__delegate = function (args){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(reagent.debug.warnings,cljs.core.update_in,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"warn","warn",-436710552)], null),cljs.core.conj,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,args)], 0));
};
var G__7663 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__7664__i = 0, G__7664__a = new Array(arguments.length -  0);
while (G__7664__i < G__7664__a.length) {G__7664__a[G__7664__i] = arguments[G__7664__i + 0]; ++G__7664__i;}
  args = new cljs.core.IndexedSeq(G__7664__a,0,null);
} 
return G__7663__delegate.call(this,args);};
G__7663.cljs$lang$maxFixedArity = 0;
G__7663.cljs$lang$applyTo = (function (arglist__7665){
var args = cljs.core.seq(arglist__7665);
return G__7663__delegate(args);
});
G__7663.cljs$core$IFn$_invoke$arity$variadic = G__7663__delegate;
return G__7663;
})()
);

(o.error = (function() { 
var G__7666__delegate = function (args){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(reagent.debug.warnings,cljs.core.update_in,new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"error","error",-978969032)], null),cljs.core.conj,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.str,args)], 0));
};
var G__7666 = function (var_args){
var args = null;
if (arguments.length > 0) {
var G__7667__i = 0, G__7667__a = new Array(arguments.length -  0);
while (G__7667__i < G__7667__a.length) {G__7667__a[G__7667__i] = arguments[G__7667__i + 0]; ++G__7667__i;}
  args = new cljs.core.IndexedSeq(G__7667__a,0,null);
} 
return G__7666__delegate.call(this,args);};
G__7666.cljs$lang$maxFixedArity = 0;
G__7666.cljs$lang$applyTo = (function (arglist__7668){
var args = cljs.core.seq(arglist__7668);
return G__7666__delegate(args);
});
G__7666.cljs$core$IFn$_invoke$arity$variadic = G__7666__delegate;
return G__7666;
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
