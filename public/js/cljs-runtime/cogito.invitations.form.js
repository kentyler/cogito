goog.provide('cogito.invitations.form');
cogito.invitations.form.invitation_form = (function cogito$invitations$form$invitation_form(){
var email = reagent.core.atom.cljs$core$IFn$_invoke$arity$1("");
return (function (){
var sending = cljs.core.deref(re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("invitations","sending","invitations/sending",-209691876)], null)));
var error = cljs.core.deref(re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("invitations","error","invitations/error",634757678)], null)));
var success = cljs.core.deref(re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("invitations","success-message","invitations/success-message",-569479151)], null)));
return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mb-8","div.mb-8",255255619),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h3.text-lg.font-semibold.mb-4","h3.text-lg.font-semibold.mb-4",938611169),"Send Invitation"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.gap-2","div.flex.gap-2",-268700868),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input.flex-1.px-3.py-2.border.rounded","input.flex-1.px-3.py-2.border.rounded",1286489282),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"type","type",1174270348),"email",new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Enter email address",new cljs.core.Keyword(null,"value","value",305978217),cljs.core.deref(email),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),sending,new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__11584_SHARP_){
return cljs.core.reset_BANG_(email,p1__11584_SHARP_.target.value);
}),new cljs.core.Keyword(null,"on-key-press","on-key-press",-399563677),(function (p1__11585_SHARP_){
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2((13),p1__11585_SHARP_.keyCode)){
if(((cljs.core.not(sending)) && ((!(clojure.string.blank_QMARK_(cljs.core.deref(email))))))){
re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("invitations","send","invitations/send",963721900),cljs.core.deref(email)], null));

return cljs.core.reset_BANG_(email,"");
} else {
return null;
}
} else {
return null;
}
})], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.px-4.py-2.bg-blue-500.text-white.rounded.hover:bg-blue-600.disabled:opacity-50","button.px-4.py-2.bg-blue-500.text-white.rounded.hover:bg-blue-600.disabled:opacity-50",1865706167),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(function (){var or__5002__auto__ = sending;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return clojure.string.blank_QMARK_(cljs.core.deref(email));
}
})(),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("invitations","send","invitations/send",963721900),cljs.core.deref(email)], null));

return cljs.core.reset_BANG_(email,"");
})], null),(cljs.core.truth_(sending)?"Sending...":"Send Invitation")], null)], null),(cljs.core.truth_(error)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mt-2.text-red-600.text-sm","div.mt-2.text-red-600.text-sm",-1306781768),error], null):null),(cljs.core.truth_(success)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mt-2.text-green-600.text-sm","div.mt-2.text-green-600.text-sm",-569368143),success], null):null)], null);
});
});

//# sourceMappingURL=cogito.invitations.form.js.map
