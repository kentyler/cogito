goog.provide('cogito.logout_button');
cogito.logout_button.logout_button = (function cogito$logout_button$logout_button(){
var logging_out_QMARK_ = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"logging-out?","logging-out?",-1351512203)], null));
return (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.px-3.py-1.text-sm.bg-red-500.text-white.rounded.hover:bg-red-600.disabled:opacity-50","button.px-3.py-1.text-sm.bg-red-500.text-white.rounded.hover:bg-red-600.disabled:opacity-50",164118949),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"logout","logout",1418564329)], null));
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core.deref(logging_out_QMARK_)], null),(cljs.core.truth_(cljs.core.deref(logging_out_QMARK_))?"Logging out...":"Logout")], null);
});
});

//# sourceMappingURL=cogito.logout_button.js.map
