goog.provide('reagent.dom');
var module$node_modules$react_dom$index=shadow.js.require("module$node_modules$react_dom$index", {});
if((typeof reagent !== 'undefined') && (typeof reagent.dom !== 'undefined') && (typeof reagent.dom.roots !== 'undefined')){
} else {
reagent.dom.roots = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
}
reagent.dom.unmount_comp = (function reagent$dom$unmount_comp(container){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(reagent.dom.roots,cljs.core.dissoc,container);

return module$node_modules$react_dom$index.unmountComponentAtNode(container);
});
reagent.dom.render_comp = (function reagent$dom$render_comp(comp,container,callback){
var _STAR_always_update_STAR__orig_val__8529 = reagent.impl.util._STAR_always_update_STAR_;
var _STAR_always_update_STAR__temp_val__8530 = true;
(reagent.impl.util._STAR_always_update_STAR_ = _STAR_always_update_STAR__temp_val__8530);

try{return module$node_modules$react_dom$index.render((comp.cljs$core$IFn$_invoke$arity$0 ? comp.cljs$core$IFn$_invoke$arity$0() : comp.call(null)),container,(function (){
var _STAR_always_update_STAR__orig_val__8533 = reagent.impl.util._STAR_always_update_STAR_;
var _STAR_always_update_STAR__temp_val__8534 = false;
(reagent.impl.util._STAR_always_update_STAR_ = _STAR_always_update_STAR__temp_val__8534);

try{cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(reagent.dom.roots,cljs.core.assoc,container,comp);

reagent.impl.batching.flush_after_render();

if((!((callback == null)))){
return (callback.cljs$core$IFn$_invoke$arity$0 ? callback.cljs$core$IFn$_invoke$arity$0() : callback.call(null));
} else {
return null;
}
}finally {(reagent.impl.util._STAR_always_update_STAR_ = _STAR_always_update_STAR__orig_val__8533);
}}));
}finally {(reagent.impl.util._STAR_always_update_STAR_ = _STAR_always_update_STAR__orig_val__8529);
}});
reagent.dom.re_render_component = (function reagent$dom$re_render_component(comp,container){
return reagent.dom.render_comp(comp,container,null);
});
/**
 * Render a Reagent component into the DOM. The first argument may be
 *   either a vector (using Reagent's Hiccup syntax), or a React element.
 *   The second argument should be a DOM node.
 * 
 *   Optionally takes a callback that is called when the component is in place.
 * 
 *   Returns the mounted component instance.
 */
reagent.dom.render = (function reagent$dom$render(var_args){
var G__8552 = arguments.length;
switch (G__8552) {
case 2:
return reagent.dom.render.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return reagent.dom.render.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(reagent.dom.render.cljs$core$IFn$_invoke$arity$2 = (function (comp,container){
return reagent.dom.render.cljs$core$IFn$_invoke$arity$3(comp,container,reagent.impl.template.default_compiler);
}));

(reagent.dom.render.cljs$core$IFn$_invoke$arity$3 = (function (comp,container,callback_or_compiler){
reagent.ratom.flush_BANG_();

var vec__8570 = ((cljs.core.fn_QMARK_(callback_or_compiler))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [reagent.impl.template.default_compiler,callback_or_compiler], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [callback_or_compiler,new cljs.core.Keyword(null,"callback","callback",-705136228).cljs$core$IFn$_invoke$arity$1(callback_or_compiler)], null));
var compiler = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__8570,(0),null);
var callback = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__8570,(1),null);
var f = (function (){
return reagent.impl.protocols.as_element(compiler,((cljs.core.fn_QMARK_(comp))?(comp.cljs$core$IFn$_invoke$arity$0 ? comp.cljs$core$IFn$_invoke$arity$0() : comp.call(null)):comp));
});
return reagent.dom.render_comp(f,container,callback);
}));

(reagent.dom.render.cljs$lang$maxFixedArity = 3);

/**
 * Remove a component from the given DOM node.
 */
reagent.dom.unmount_component_at_node = (function reagent$dom$unmount_component_at_node(container){
return reagent.dom.unmount_comp(container);
});
/**
 * Returns the root DOM node of a mounted component.
 */
reagent.dom.dom_node = (function reagent$dom$dom_node(this$){
return module$node_modules$react_dom$index.findDOMNode(this$);
});
/**
 * Force re-rendering of all mounted Reagent components. This is
 *   probably only useful in a development environment, when you want to
 *   update components in response to some dynamic changes to code.
 * 
 *   Note that force-update-all may not update root components. This
 *   happens if a component 'foo' is mounted with `(render [foo])` (since
 *   functions are passed by value, and not by reference, in
 *   ClojureScript). To get around this you'll have to introduce a layer
 *   of indirection, for example by using `(render [#'foo])` instead.
 */
reagent.dom.force_update_all = (function reagent$dom$force_update_all(){
reagent.ratom.flush_BANG_();

var seq__8598_8641 = cljs.core.seq(cljs.core.deref(reagent.dom.roots));
var chunk__8600_8642 = null;
var count__8601_8643 = (0);
var i__8602_8644 = (0);
while(true){
if((i__8602_8644 < count__8601_8643)){
var vec__8619_8647 = chunk__8600_8642.cljs$core$IIndexed$_nth$arity$2(null,i__8602_8644);
var container_8648 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__8619_8647,(0),null);
var comp_8649 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__8619_8647,(1),null);
reagent.dom.re_render_component(comp_8649,container_8648);


var G__8651 = seq__8598_8641;
var G__8652 = chunk__8600_8642;
var G__8653 = count__8601_8643;
var G__8654 = (i__8602_8644 + (1));
seq__8598_8641 = G__8651;
chunk__8600_8642 = G__8652;
count__8601_8643 = G__8653;
i__8602_8644 = G__8654;
continue;
} else {
var temp__5804__auto___8656 = cljs.core.seq(seq__8598_8641);
if(temp__5804__auto___8656){
var seq__8598_8657__$1 = temp__5804__auto___8656;
if(cljs.core.chunked_seq_QMARK_(seq__8598_8657__$1)){
var c__5525__auto___8658 = cljs.core.chunk_first(seq__8598_8657__$1);
var G__8660 = cljs.core.chunk_rest(seq__8598_8657__$1);
var G__8661 = c__5525__auto___8658;
var G__8662 = cljs.core.count(c__5525__auto___8658);
var G__8663 = (0);
seq__8598_8641 = G__8660;
chunk__8600_8642 = G__8661;
count__8601_8643 = G__8662;
i__8602_8644 = G__8663;
continue;
} else {
var vec__8624_8664 = cljs.core.first(seq__8598_8657__$1);
var container_8665 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__8624_8664,(0),null);
var comp_8666 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__8624_8664,(1),null);
reagent.dom.re_render_component(comp_8666,container_8665);


var G__8671 = cljs.core.next(seq__8598_8657__$1);
var G__8672 = null;
var G__8673 = (0);
var G__8674 = (0);
seq__8598_8641 = G__8671;
chunk__8600_8642 = G__8672;
count__8601_8643 = G__8673;
i__8602_8644 = G__8674;
continue;
}
} else {
}
}
break;
}

return reagent.impl.batching.flush_after_render();
});

//# sourceMappingURL=reagent.dom.js.map
