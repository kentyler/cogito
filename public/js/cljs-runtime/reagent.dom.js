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
var _STAR_always_update_STAR__orig_val__8612 = reagent.impl.util._STAR_always_update_STAR_;
var _STAR_always_update_STAR__temp_val__8613 = true;
(reagent.impl.util._STAR_always_update_STAR_ = _STAR_always_update_STAR__temp_val__8613);

try{return module$node_modules$react_dom$index.render((comp.cljs$core$IFn$_invoke$arity$0 ? comp.cljs$core$IFn$_invoke$arity$0() : comp.call(null)),container,(function (){
var _STAR_always_update_STAR__orig_val__8614 = reagent.impl.util._STAR_always_update_STAR_;
var _STAR_always_update_STAR__temp_val__8615 = false;
(reagent.impl.util._STAR_always_update_STAR_ = _STAR_always_update_STAR__temp_val__8615);

try{cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(reagent.dom.roots,cljs.core.assoc,container,comp);

reagent.impl.batching.flush_after_render();

if((!((callback == null)))){
return (callback.cljs$core$IFn$_invoke$arity$0 ? callback.cljs$core$IFn$_invoke$arity$0() : callback.call(null));
} else {
return null;
}
}finally {(reagent.impl.util._STAR_always_update_STAR_ = _STAR_always_update_STAR__orig_val__8614);
}}));
}finally {(reagent.impl.util._STAR_always_update_STAR_ = _STAR_always_update_STAR__orig_val__8612);
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
var G__8625 = arguments.length;
switch (G__8625) {
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

var vec__8633 = ((cljs.core.fn_QMARK_(callback_or_compiler))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [reagent.impl.template.default_compiler,callback_or_compiler], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [callback_or_compiler,new cljs.core.Keyword(null,"callback","callback",-705136228).cljs$core$IFn$_invoke$arity$1(callback_or_compiler)], null));
var compiler = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__8633,(0),null);
var callback = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__8633,(1),null);
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

var seq__8645_8666 = cljs.core.seq(cljs.core.deref(reagent.dom.roots));
var chunk__8646_8667 = null;
var count__8647_8668 = (0);
var i__8648_8669 = (0);
while(true){
if((i__8648_8669 < count__8647_8668)){
var vec__8657_8670 = chunk__8646_8667.cljs$core$IIndexed$_nth$arity$2(null,i__8648_8669);
var container_8671 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__8657_8670,(0),null);
var comp_8672 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__8657_8670,(1),null);
reagent.dom.re_render_component(comp_8672,container_8671);


var G__8673 = seq__8645_8666;
var G__8674 = chunk__8646_8667;
var G__8675 = count__8647_8668;
var G__8676 = (i__8648_8669 + (1));
seq__8645_8666 = G__8673;
chunk__8646_8667 = G__8674;
count__8647_8668 = G__8675;
i__8648_8669 = G__8676;
continue;
} else {
var temp__5804__auto___8677 = cljs.core.seq(seq__8645_8666);
if(temp__5804__auto___8677){
var seq__8645_8678__$1 = temp__5804__auto___8677;
if(cljs.core.chunked_seq_QMARK_(seq__8645_8678__$1)){
var c__5525__auto___8679 = cljs.core.chunk_first(seq__8645_8678__$1);
var G__8680 = cljs.core.chunk_rest(seq__8645_8678__$1);
var G__8681 = c__5525__auto___8679;
var G__8682 = cljs.core.count(c__5525__auto___8679);
var G__8683 = (0);
seq__8645_8666 = G__8680;
chunk__8646_8667 = G__8681;
count__8647_8668 = G__8682;
i__8648_8669 = G__8683;
continue;
} else {
var vec__8660_8684 = cljs.core.first(seq__8645_8678__$1);
var container_8685 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__8660_8684,(0),null);
var comp_8686 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__8660_8684,(1),null);
reagent.dom.re_render_component(comp_8686,container_8685);


var G__8687 = cljs.core.next(seq__8645_8678__$1);
var G__8688 = null;
var G__8689 = (0);
var G__8690 = (0);
seq__8645_8666 = G__8687;
chunk__8646_8667 = G__8688;
count__8647_8668 = G__8689;
i__8648_8669 = G__8690;
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
