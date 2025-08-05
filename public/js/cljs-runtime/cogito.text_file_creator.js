goog.provide('cogito.text_file_creator');
cogito.text_file_creator.text_file_creator = (function cogito$text_file_creator$text_file_creator(){
var uploading_QMARK_ = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","uploading?","upload-files/uploading?",-1390868191)], null));
var show_input_QMARK_ = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(false);
var title = reagent.core.atom.cljs$core$IFn$_invoke$arity$1("");
var content = reagent.core.atom.cljs$core$IFn$_invoke$arity$1("");
return (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mb-4","div.mb-4",-1002350692),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"class","class",-2030961996),"w-full px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","show-text-creator","upload-files/show-text-creator",1353714354)], null));
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core.deref(uploading_QMARK_)], null),"Create Text File"], null)], null);
});
});

//# sourceMappingURL=cogito.text_file_creator.js.map
