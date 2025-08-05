goog.provide('cogito.monthly_summary');
cogito.monthly_summary.get_year_options = (function cogito$monthly_summary$get_year_options(){

var current_year = (new Date()).getFullYear();
var start_year = (current_year - (2));
var iter__5480__auto__ = (function cogito$monthly_summary$get_year_options_$_iter__11392(s__11393){
return (new cljs.core.LazySeq(null,(function (){
var s__11393__$1 = s__11393;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__11393__$1);
if(temp__5804__auto__){
var s__11393__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__11393__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__11393__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__11395 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__11394 = (0);
while(true){
if((i__11394 < size__5479__auto__)){
var year = cljs.core._nth(c__5478__auto__,i__11394);
cljs.core.chunk_append(b__11395,new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),year,new cljs.core.Keyword(null,"label","label",1718410804),cljs.core.str.cljs$core$IFn$_invoke$arity$1(year)], null));

var G__11501 = (i__11394 + (1));
i__11394 = G__11501;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__11395),cogito$monthly_summary$get_year_options_$_iter__11392(cljs.core.chunk_rest(s__11393__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__11395),null);
}
} else {
var year = cljs.core.first(s__11393__$2);
return cljs.core.cons(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"value","value",305978217),year,new cljs.core.Keyword(null,"label","label",1718410804),cljs.core.str.cljs$core$IFn$_invoke$arity$1(year)], null),cogito$monthly_summary$get_year_options_$_iter__11392(cljs.core.rest(s__11393__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.range.cljs$core$IFn$_invoke$arity$2(start_year,((current_year + (1)) + (1))));
});
cogito.monthly_summary.monthly_summary_tab = (function cogito$monthly_summary$monthly_summary_tab(){
var yearly_summaries = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("monthly-summary","yearly-summaries","monthly-summary/yearly-summaries",-1498482836)], null));
var yearly_generating_QMARK_ = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("monthly-summary","yearly-summaries-generating?","monthly-summary/yearly-summaries-generating?",243544254)], null));
var selected_year = reagent.core.atom.cljs$core$IFn$_invoke$arity$1((new Date()).getFullYear());
return (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.monthly-summary-tab.h-full.flex.flex-col","div.monthly-summary-tab.h-full.flex.flex-col",-1773224497),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.header.border-b.pb-4.mb-4","div.header.border-b.pb-4.mb-4",-556773263),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.justify-between.items-center","div.flex.justify-between.items-center",-1855308582),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2.text-xl.font-semibold.text-gray-900","h2.text-xl.font-semibold.text-gray-900",713028381),"Monthly Summary"], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.space-x-4","div.flex.items-center.space-x-4",1559862292),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"select.text-sm.bg-white.border.border-gray-300.rounded.px-3.py-2.focus:outline-none.focus:ring-2.focus:ring-blue-500","select.text-sm.bg-white.border.border-gray-300.rounded.px-3.py-2.focus:outline-none.focus:ring-2.focus:ring-blue-500",-1422361691),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"value","value",305978217),cljs.core.deref(selected_year),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__11413_SHARP_){
return cljs.core.reset_BANG_(selected_year,parseInt(p1__11413_SHARP_.target.value));
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core.deref(yearly_generating_QMARK_)], null),(function (){var iter__5480__auto__ = (function cogito$monthly_summary$monthly_summary_tab_$_iter__11421(s__11422){
return (new cljs.core.LazySeq(null,(function (){
var s__11422__$1 = s__11422;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__11422__$1);
if(temp__5804__auto__){
var s__11422__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__11422__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__11422__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__11424 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__11423 = (0);
while(true){
if((i__11423 < size__5479__auto__)){
var option = cljs.core._nth(c__5478__auto__,i__11423);
cljs.core.chunk_append(b__11424,cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"option","option",65132272),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(option)], null),new cljs.core.Keyword(null,"label","label",1718410804).cljs$core$IFn$_invoke$arity$1(option)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(option)], null)));

var G__11508 = (i__11423 + (1));
i__11423 = G__11508;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__11424),cogito$monthly_summary$monthly_summary_tab_$_iter__11421(cljs.core.chunk_rest(s__11422__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__11424),null);
}
} else {
var option = cljs.core.first(s__11422__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"option","option",65132272),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(option)], null),new cljs.core.Keyword(null,"label","label",1718410804).cljs$core$IFn$_invoke$arity$1(option)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(option)], null)),cogito$monthly_summary$monthly_summary_tab_$_iter__11421(cljs.core.rest(s__11422__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cogito.monthly_summary.get_year_options());
})()], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.px-4.py-2.text-sm.bg-green-500.text-white.rounded.hover:bg-green-600.disabled:opacity-50.flex.items-center.space-x-2","button.px-4.py-2.text-sm.bg-green-500.text-white.rounded.hover:bg-green-600.disabled:opacity-50.flex.items-center.space-x-2",1689907076),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("monthly-summary","generate-yearly-summaries","monthly-summary/generate-yearly-summaries",112671599),cljs.core.deref(selected_year)], null));
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core.deref(yearly_generating_QMARK_)], null),(cljs.core.truth_(cljs.core.deref(yearly_generating_QMARK_))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.animate-spin.rounded-full.h-4.w-4.border-b-2.border-white","div.animate-spin.rounded-full.h-4.w-4.border-b-2.border-white",1806146279)], null):null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),(cljs.core.truth_(cljs.core.deref(yearly_generating_QMARK_))?"Generating...":"Generate Year")], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-xs.text-green-500.font-mono","p.text-xs.text-green-500.font-mono",127517957),"v1.0.0"], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-sm.text-gray-600","p.text-sm.text-gray-600",-1212846130),"AI summaries for each month of the selected year"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex-1.overflow-y-auto.p-4","div.flex-1.overflow-y-auto.p-4",-1791789067),(cljs.core.truth_(cljs.core.deref(yearly_generating_QMARK_))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.justify-center.items-center.py-12","div.flex.justify-center.items-center.py-12",695335457),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.animate-spin.rounded-full.h-8.w-8.border-b-2.border-green-600.mr-3","div.animate-spin.rounded-full.h-8.w-8.border-b-2.border-green-600.mr-3",-1096446555)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-gray-600","span.text-gray-600",-825179194),"Generating yearly summaries..."], null)], null):(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.deref(yearly_summaries);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(cljs.core.deref(yearly_summaries));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.space-y-6","div.space-y-6",-1218954066),(function (){var iter__5480__auto__ = (function cogito$monthly_summary$monthly_summary_tab_$_iter__11447(s__11448){
return (new cljs.core.LazySeq(null,(function (){
var s__11448__$1 = s__11448;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__11448__$1);
if(temp__5804__auto__){
var s__11448__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__11448__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__11448__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__11450 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__11449 = (0);
while(true){
if((i__11449 < size__5479__auto__)){
var vec__11451 = cljs.core._nth(c__5478__auto__,i__11449);
var month = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11451,(0),null);
var summary_data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11451,(1),null);
cljs.core.chunk_append(b__11450,cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.border.border-gray-200.rounded-lg.p-6.bg-white.shadow-sm","div.border.border-gray-200.rounded-lg.p-6.bg-white.shadow-sm",-285235472),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mb-4","div.mb-4",-1002350692),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h4.text-xl.font-semibold.text-gray-800","h4.text-xl.font-semibold.text-gray-800",-305600821),(function (){try{var month_num = ((typeof month === 'string')?parseInt(month):month);
var date_obj = (new Date(cljs.core.deref(selected_year),month_num,(1)));
if(cljs.core.truth_(isNaN(date_obj.getTime()))){
return ["Month ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(month)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(selected_year))].join('');
} else {
return date_obj.toLocaleDateString("en-US",({"month": "long", "year": "numeric"}));
}
}catch (e11454){if((e11454 instanceof Error)){
var e = e11454;
return ["Month ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(month)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(selected_year))," (Error: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(e.message),")"].join('');
} else {
throw e11454;

}
}})()], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-gray-700.leading-relaxed.space-y-3","div.text-gray-700.leading-relaxed.space-y-3",1069243840),(function (){var summary_text = new cljs.core.Keyword(null,"summary","summary",380847952).cljs$core$IFn$_invoke$arity$1(summary_data);
var paragraphs = clojure.string.split.cljs$core$IFn$_invoke$arity$2(summary_text,/\n\n/);
var iter__5480__auto__ = ((function (i__11449,summary_text,paragraphs,vec__11451,month,summary_data,c__5478__auto__,size__5479__auto__,b__11450,s__11448__$2,temp__5804__auto__,yearly_summaries,yearly_generating_QMARK_,selected_year){
return (function cogito$monthly_summary$monthly_summary_tab_$_iter__11447_$_iter__11472(s__11473){
return (new cljs.core.LazySeq(null,((function (i__11449,summary_text,paragraphs,vec__11451,month,summary_data,c__5478__auto__,size__5479__auto__,b__11450,s__11448__$2,temp__5804__auto__,yearly_summaries,yearly_generating_QMARK_,selected_year){
return (function (){
var s__11473__$1 = s__11473;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__11473__$1);
if(temp__5804__auto____$1){
var s__11473__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__11473__$2)){
var c__5478__auto____$1 = cljs.core.chunk_first(s__11473__$2);
var size__5479__auto____$1 = cljs.core.count(c__5478__auto____$1);
var b__11475 = cljs.core.chunk_buffer(size__5479__auto____$1);
if((function (){var i__11474 = (0);
while(true){
if((i__11474 < size__5479__auto____$1)){
var paragraph = cljs.core._nth(c__5478__auto____$1,i__11474);
cljs.core.chunk_append(b__11475,(((!(cljs.core.empty_QMARK_(paragraph))))?cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),paragraph], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),paragraph], null)):null));

var G__11543 = (i__11474 + (1));
i__11474 = G__11543;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__11475),cogito$monthly_summary$monthly_summary_tab_$_iter__11447_$_iter__11472(cljs.core.chunk_rest(s__11473__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__11475),null);
}
} else {
var paragraph = cljs.core.first(s__11473__$2);
return cljs.core.cons((((!(cljs.core.empty_QMARK_(paragraph))))?cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),paragraph], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),paragraph], null)):null),cogito$monthly_summary$monthly_summary_tab_$_iter__11447_$_iter__11472(cljs.core.rest(s__11473__$2)));
}
} else {
return null;
}
break;
}
});})(i__11449,summary_text,paragraphs,vec__11451,month,summary_data,c__5478__auto__,size__5479__auto__,b__11450,s__11448__$2,temp__5804__auto__,yearly_summaries,yearly_generating_QMARK_,selected_year))
,null,null));
});})(i__11449,summary_text,paragraphs,vec__11451,month,summary_data,c__5478__auto__,size__5479__auto__,b__11450,s__11448__$2,temp__5804__auto__,yearly_summaries,yearly_generating_QMARK_,selected_year))
;
return iter__5480__auto__(cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.string.trim,paragraphs));
})()], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),month], null)));

var G__11544 = (i__11449 + (1));
i__11449 = G__11544;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__11450),cogito$monthly_summary$monthly_summary_tab_$_iter__11447(cljs.core.chunk_rest(s__11448__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__11450),null);
}
} else {
var vec__11484 = cljs.core.first(s__11448__$2);
var month = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11484,(0),null);
var summary_data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11484,(1),null);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.border.border-gray-200.rounded-lg.p-6.bg-white.shadow-sm","div.border.border-gray-200.rounded-lg.p-6.bg-white.shadow-sm",-285235472),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mb-4","div.mb-4",-1002350692),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h4.text-xl.font-semibold.text-gray-800","h4.text-xl.font-semibold.text-gray-800",-305600821),(function (){try{var month_num = ((typeof month === 'string')?parseInt(month):month);
var date_obj = (new Date(cljs.core.deref(selected_year),month_num,(1)));
if(cljs.core.truth_(isNaN(date_obj.getTime()))){
return ["Month ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(month)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(selected_year))].join('');
} else {
return date_obj.toLocaleDateString("en-US",({"month": "long", "year": "numeric"}));
}
}catch (e11487){if((e11487 instanceof Error)){
var e = e11487;
return ["Month ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(month)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(selected_year))," (Error: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(e.message),")"].join('');
} else {
throw e11487;

}
}})()], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-gray-700.leading-relaxed.space-y-3","div.text-gray-700.leading-relaxed.space-y-3",1069243840),(function (){var summary_text = new cljs.core.Keyword(null,"summary","summary",380847952).cljs$core$IFn$_invoke$arity$1(summary_data);
var paragraphs = clojure.string.split.cljs$core$IFn$_invoke$arity$2(summary_text,/\n\n/);
var iter__5480__auto__ = ((function (summary_text,paragraphs,vec__11484,month,summary_data,s__11448__$2,temp__5804__auto__,yearly_summaries,yearly_generating_QMARK_,selected_year){
return (function cogito$monthly_summary$monthly_summary_tab_$_iter__11447_$_iter__11488(s__11489){
return (new cljs.core.LazySeq(null,(function (){
var s__11489__$1 = s__11489;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__11489__$1);
if(temp__5804__auto____$1){
var s__11489__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__11489__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__11489__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__11491 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__11490 = (0);
while(true){
if((i__11490 < size__5479__auto__)){
var paragraph = cljs.core._nth(c__5478__auto__,i__11490);
cljs.core.chunk_append(b__11491,(((!(cljs.core.empty_QMARK_(paragraph))))?cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),paragraph], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),paragraph], null)):null));

var G__11566 = (i__11490 + (1));
i__11490 = G__11566;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__11491),cogito$monthly_summary$monthly_summary_tab_$_iter__11447_$_iter__11488(cljs.core.chunk_rest(s__11489__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__11491),null);
}
} else {
var paragraph = cljs.core.first(s__11489__$2);
return cljs.core.cons((((!(cljs.core.empty_QMARK_(paragraph))))?cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),paragraph], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),paragraph], null)):null),cogito$monthly_summary$monthly_summary_tab_$_iter__11447_$_iter__11488(cljs.core.rest(s__11489__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});})(summary_text,paragraphs,vec__11484,month,summary_data,s__11448__$2,temp__5804__auto__,yearly_summaries,yearly_generating_QMARK_,selected_year))
;
return iter__5480__auto__(cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.string.trim,paragraphs));
})()], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),month], null)),cogito$monthly_summary$monthly_summary_tab_$_iter__11447(cljs.core.rest(s__11448__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.sort_by.cljs$core$IFn$_invoke$arity$2(cljs.core.first,cljs.core.deref(yearly_summaries)));
})()], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-center.py-12","div.text-center.py-12",875911986),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-gray-500.mb-4","p.text-gray-500.mb-4",525276662),"No summaries generated yet"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-sm.text-gray-400","p.text-sm.text-gray-400",542560567),"Click 'Generate Year' to create AI summaries for each month of the selected year"], null)], null)
))], null)], null);
});
});

//# sourceMappingURL=cogito.monthly_summary.js.map
