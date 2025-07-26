goog.provide('cogito.core');
cogito.core.app = (function cogito$core$app(){
var authenticated_QMARK_ = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"authenticated?","authenticated?",-1988130123)], null));
var pending_client_selection_QMARK_ = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pending-client-selection?","pending-client-selection?",268730804)], null));
return (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.conversational-repl","div.conversational-repl",454578380),(cljs.core.truth_(cljs.core.deref(authenticated_QMARK_))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.workbench.panel], null):(cljs.core.truth_(cljs.core.deref(pending_client_selection_QMARK_))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.client_selection.client_selection_form], null):new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.login.login_form], null)
))], null);
});
});
cogito.core.mount_root = (function cogito$core$mount_root(){
return reagent.dom.render.cljs$core$IFn$_invoke$arity$2(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.core.app], null),document.getElementById("app"));
});
cogito.core.init_BANG_ = (function cogito$core$init_BANG_(){
re_frame.core.dispatch_sync(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"initialize-db","initialize-db",230998432)], null));

re_frame.core.dispatch(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"check-auth-status","check-auth-status",898872782)], null));

return cogito.core.mount_root();
});

//# sourceMappingURL=cogito.core.js.map
