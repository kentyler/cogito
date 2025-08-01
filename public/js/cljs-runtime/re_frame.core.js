goog.provide('re_frame.core');
/**
 * Queue `event` for processing (handling).
 * 
 *   `event` is a vector and the first element is typically a keyword
 *   which identifies the kind of event.
 * 
 *   The event will be added to a FIFO processing queue, so event
 *   handling does not happen immediately. It will happen 'very soon'
 *   but not now. And if the queue already contains events, they
 *   will be processed first.
 * 
 *   Usage:
 * 
 *    #!clj
 *    (dispatch [:order "pizza" {:supreme 2 :meatlovers 1 :veg 1}])
 *   
 */
re_frame.core.dispatch = (function re_frame$core$dispatch(event){
return re_frame.router.dispatch(event);
});
/**
 * Synchronously (immediately) process `event`. It does **not** queue
 *   the event for handling later as `dispatch` does.
 * 
 *   `event` is a vector and the first element is typically a keyword
 *   which identifies the kind of event.
 * 
 *   It is an error to use `dispatch-sync` within an event handler because
 *   you can't immediately process an new event when one is already
 *   part way through being processed.
 * 
 *   Generally, avoid using this function, and instead, use `dispatch`.
 *   Only use it in the narrow set of cases where any delay in
 *   processing is a problem:
 * 
 *  1. the `:on-change` handler of a text field where we are expecting fast typing
 *  2. when initialising your app - see 'main' in examples/todomvc/src/core.cljs
 *  3. in a unit test where immediate, synchronous processing is useful
 * 
 *   Usage:
 * 
 *    #!clj
 *    (dispatch-sync [:sing :falsetto "piano accordion"])
 *   
 */
re_frame.core.dispatch_sync = (function re_frame$core$dispatch_sync(event){
return re_frame.router.dispatch_sync(event);
});
/**
 * Register the given event `handler` (function) for the given `id`. Optionally, provide
 *   an `interceptors` chain:
 * 
 *  - `id` is typically a namespaced keyword  (but can be anything)
 *  - `handler` is a function: (db event) -> db
 *  - `interceptors` is a collection of interceptors. Will be flattened and nils removed.
 * 
 *   Example Usage:
 * 
 *    #!clj
 *    (reg-event-db
 *      :token
 *      (fn [db event]
 *        (assoc db :some-key (get event 2)))  ;; return updated db
 * 
 *   Or perhaps:
 * 
 *    #!clj
 *    (reg-event-db
 *      :namespaced/id           ;; <-- namespaced keywords are often used
 *      [one two three]          ;; <-- a seq of interceptors
 *      (fn [db [_ arg1 arg2]]   ;; <-- event vector is destructured
 *        (-> db
 *          (dissoc arg1)
 *          (update :key + arg2))))   ;; return updated db
 *   
 */
re_frame.core.reg_event_db = (function re_frame$core$reg_event_db(var_args){
var G__10383 = arguments.length;
switch (G__10383) {
case 2:
return re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2 = (function (id,handler){
return re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$3(id,null,handler);
}));

(re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$3 = (function (id,interceptors,handler){
return re_frame.events.register(id,new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [re_frame.cofx.inject_db,re_frame.fx.do_fx,re_frame.std_interceptors.inject_global_interceptors,interceptors,re_frame.std_interceptors.db_handler__GT_interceptor(handler)], null));
}));

(re_frame.core.reg_event_db.cljs$lang$maxFixedArity = 3);

/**
 * Register the given event `handler` (function) for the given `id`. Optionally, provide
 *   an `interceptors` chain:
 * 
 *  - `id` is typically a namespaced keyword  (but can be anything)
 *  - `handler` is a function: (coeffects-map event-vector) -> effects-map
 *  - `interceptors` is a collection of interceptors. Will be flattened and nils removed.
 * 
 * 
 *   Example Usage:
 * 
 *    #!clj
 *    (reg-event-fx
 *      :event-id
 *      (fn [cofx event]
 *        {:db (assoc (:db cofx) :some-key (get event 2))}))   ;; return a map of effects
 * 
 * 
 *   Or perhaps:
 * 
 *    #!clj
 *    (reg-event-fx
 *      :namespaced/id           ;; <-- namespaced keywords are often used
 *      [one two three]          ;; <-- a seq of interceptors
 *      (fn [{:keys [db] :as cofx} [_ arg1 arg2]] ;; destructure both arguments
 *        {:db (assoc db :some-key arg1)          ;; return a map of effects
 *         :fx [[:dispatch [:some-event arg2]]]}))
 *   
 */
re_frame.core.reg_event_fx = (function re_frame$core$reg_event_fx(var_args){
var G__10421 = arguments.length;
switch (G__10421) {
case 2:
return re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2 = (function (id,handler){
return re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$3(id,null,handler);
}));

(re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$3 = (function (id,interceptors,handler){
return re_frame.events.register(id,new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [re_frame.cofx.inject_db,re_frame.fx.do_fx,re_frame.std_interceptors.inject_global_interceptors,interceptors,re_frame.std_interceptors.fx_handler__GT_interceptor(handler)], null));
}));

(re_frame.core.reg_event_fx.cljs$lang$maxFixedArity = 3);

/**
 * Register the given event `handler` (function) for the given `id`. Optionally, provide
 *   an `interceptors` chain:
 * 
 *  - `id` is typically a namespaced keyword  (but can be anything)
 *  - `handler` is a function: context-map -> context-map
 * 
 *   You can explore what is provided in `context` [here](https://day8.github.io/re-frame/Interceptors/#what-is-context).
 * 
 *   Example Usage:
 * 
 *    #!clj
 *    (reg-event-ctx
 *      :event-id
 *      (fn [{:keys [coeffects] :as context}]
 *        (let [initial  {:db     (:db coeffects)
 *                        :event  (:event coeffects)
 *                        :fx     []}
 *              result   (-> initial
 *                           function1
 *                           function2
 *                           function3)
 *              effects  (select-keys result [:db :fx])]
 *           (assoc context :effects effects))))
 *   
 */
re_frame.core.reg_event_ctx = (function re_frame$core$reg_event_ctx(var_args){
var G__10455 = arguments.length;
switch (G__10455) {
case 2:
return re_frame.core.reg_event_ctx.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return re_frame.core.reg_event_ctx.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(re_frame.core.reg_event_ctx.cljs$core$IFn$_invoke$arity$2 = (function (id,handler){
return re_frame.core.reg_event_ctx.cljs$core$IFn$_invoke$arity$3(id,null,handler);
}));

(re_frame.core.reg_event_ctx.cljs$core$IFn$_invoke$arity$3 = (function (id,interceptors,handler){
return re_frame.events.register(id,new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [re_frame.cofx.inject_db,re_frame.fx.do_fx,re_frame.std_interceptors.inject_global_interceptors,interceptors,re_frame.std_interceptors.ctx_handler__GT_interceptor(handler)], null));
}));

(re_frame.core.reg_event_ctx.cljs$lang$maxFixedArity = 3);

/**
 * Unregisters event handlers (presumably registered previously via the use of `reg-event-db` or `reg-event-fx`).
 * 
 *   When called with no args, it will unregister all currently registered event handlers.
 * 
 *   When given one arg, assumed to be the `id` of a previously registered
 *   event handler, it will unregister the associated handler. Will produce a warning to
 *   console if it finds no matching registration.
 */
re_frame.core.clear_event = (function re_frame$core$clear_event(var_args){
var G__10466 = arguments.length;
switch (G__10466) {
case 0:
return re_frame.core.clear_event.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return re_frame.core.clear_event.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(re_frame.core.clear_event.cljs$core$IFn$_invoke$arity$0 = (function (){
return re_frame.registrar.clear_handlers.cljs$core$IFn$_invoke$arity$1(re_frame.events.kind);
}));

(re_frame.core.clear_event.cljs$core$IFn$_invoke$arity$1 = (function (id){
return re_frame.registrar.clear_handlers.cljs$core$IFn$_invoke$arity$2(re_frame.events.kind,id);
}));

(re_frame.core.clear_event.cljs$lang$maxFixedArity = 1);

/**
 * A call to `reg-sub` associates a `query-id` WITH two functions.
 * 
 *   The two functions provide 'a mechanism' for creating a node
 *   in the Signal Graph. When a node of type `query-id` is needed,
 *   the two functions can be used to create it.
 * 
 *   The three arguments are:
 * 
 *  - `query-id` - typically a namespaced keyword (later used in subscribe)
 *  - optionally, an `input signals` function which returns the input data
 *    flows required by this kind of node.
 *  - a `computation function` which computes the value (output) of the
 *    node (from the input data flows)
 * 
 *   Later, during app execution, a call to `(subscribe [:sub-id 3 :blue])`,
 *   will trigger the need for a new `:sub-id` Signal Graph node (matching the
 *   query `[:sub-id 3 :blue]`). And, to create that node the two functions
 *   associated with `:sub-id` will be looked up and used.
 * 
 *   Just to be clear: calling `reg-sub` does not immediately create a node.
 *   It only registers 'a mechanism' (the two functions) by which nodes
 *   can be created later, when a node is bought into existence by the
 *   use of `subscribe` in a `View Function`.
 * 
 *   `reg-sub` arguments are:
 * 
 *  - a `query-id` (typically a namespaced keyword)
 *  - a function which returns the inputs required by this kind of node (can be supplied  in one of three ways)
 *  - a function which computes the value of this kind of node (can be supplied in one of three ways)
 * 
 *   The `computation function` is always the last argument supplied and has three ways to be called.
 *   Two of these methods are syntactic sugar to provide easier access to functional abstractions around your data.
 * 
 *   1. A function that will accept two parameters, the `input-values` and `query-vector`. This is the
 *   standard way to provide a `computation-function`
 * 
 *        #!clj
 *        (reg-sub
 *          :query-id
 *          (fn [input-values query-vector]
 *            (:foo input-values)))
 * 
 *   2. A single sugary tuple of `:->` and a 1-arity `computation-function`:
 * 
 *        #!clj
 *        (reg-sub
 *          :query-id
 *          :-> computation-fn)
 * 
 *    This sugary variation allows you to pass a function that will expect only one parameter,
 *    namely the `input-values` and entirely omit the `query-vector`. A typical `computation-function`
 *    expects two parameters which can cause unfortunate results when attempting to use
 *    clojure standard library functions, or other functions, in a functional manner.
 * 
 *    For example, a significant number of subscriptions exist only to get a value
 *    from the `input-values`. As shown below, this subscription will simply retrieve
 *    the value associated with the `:foo` key in our db:
 * 
 *        #!clj
 *        (reg-sub
 *          :query-id
 *          (fn [db _]    ;; :<---- trivial boilerplate we might want to skip over
 *            (:foo db)))
 * 
 *    This is slightly more boilerplate than we might like to do,
 *    as we can use a keyword directly as a function, and we might like to do this:
 * 
 *        #!clj
 *        (reg-sub
 *          :query-id
 *          :foo)  ;; :<---- This could be dangerous. If `:foo` is not in db, we get the `query-vector` instead of `nil`.
 * 
 *    By using `:->` our function would not contain the `query-vector`, and any
 *    missing keys would be represented as such:
 * 
 *        #!clj
 *        (reg-sub
 *          :query-id
 *          :-> :foo)
 * 
 *    This form allows us to ignore the `query-vector` if our `computation-function`
 *    has no need for it, and be safe from any accidents. Any 1-arity function can be provided,
 *    and for more complicated use cases, `partial`, `comp`, and anonymous functions can still be used.
 * 
 *   3. A single sugary tuple of `:=>` and a multi-arity `computation-function`
 * 
 *        #!clj
 *        (reg-sub
 *          :query-id
 *          :=> computation-fn)
 * 
 *    The `query-vector` can be broken into two components `[query-id & optional-values]`, and
 *    some subscriptions require the `optional-values` for extra work within the subscription.
 *    To use them in variation #1, we need to destructure our `computation-function` parameters
 *    in order to use them.
 * 
 *        #!clj
 *        (reg-sub
 *          :query-id
 *          (fn [db [_ foo]]
 *            [db foo]))
 * 
 *    Again we are writing boilerplate just to reach our values, and we might prefer to
 *    have direction access through a parameter vector like `[input-values optional-values]`
 *    instead, so we might be able to use a multi-arity function directly as our `computation-function`.
 *    A rewrite of the above sub using this sugary syntax would look like this:
 * 
 *        #!clj
 *        (reg-sub
 *          :query-id
 *          :=> vector)  ;; :<---- Could also be `(fn [db foo] [db foo])`
 * 
 *   The `computation function` is expected to take two arguments:
 * 
 *  - `input-values` - the values which flow into this node (how is it wired into the graph?)
 *  - `query-vector` - the vector given to `subscribe`
 * 
 *   and it returns a computed value (which then becomes the output of the node)
 * 
 *   When `computation function` is called, the 2nd `query-vector` argument will be that
 *   vector supplied to the `subscribe`. So, if the call was `(subscribe [:sub-id 3 :blue])`,
 *   then the `query-vector` supplied to the computation function will be `[:sub-id 3 :blue]`.
 * 
 *   The argument(s) supplied to `reg-sub` between `query-id` and the `computation-function`
 *   can vary in 3 ways, but whatever is there defines the `input signals` part
 *   of `the mechanism`, specifying what input values "flow into" the
 *   `computation function` (as the 1st argument) when it is called.
 * 
 *   So, `reg-sub` can be called in one of three ways, because there are three ways
 *   to define the input signals part. But note, the 2nd method, in which a
 *   `signals function` is explicitly supplied, is the most canonical and
 *   instructive. The other two are really just sugary variations.
 * 
 *   **First variation** - no input signal function given:
 * 
 *    #!clj
 *    (reg-sub
 *      :query-id
 *      a-computation-fn)   ;; has signature:  (fn [db query-vec]  ... ret-value)
 * 
 *   In the absence of an explicit `signals function`, the node's input signal defaults to `app-db`
 *   and, as a result, the value within `app-db` (a map) is
 *   given as the 1st argument when `a-computation-fn` is called.
 * 
 * 
 *   **Second variation** - a signal function is explicitly supplied:
 * 
 *    #!clj
 *    (reg-sub
 *      :query-id
 *      signal-fn     ;; <-- here
 *      computation-fn)
 * 
 *   This is the most canonical and instructive of the three variations.
 * 
 *   When a node is created from the template, the `signal function` will be called and it
 *   is expected to return the input signal(s) as either a singleton, if there is only
 *   one, or a sequence if there are many, or a map with the signals as the values.
 * 
 *   The current values of the returned signals will be supplied as the 1st argument to
 *   the `a-computation-fn` when it is called - and subject to what this `signal-fn` returns,
 *   this value will be either a singleton, sequence or map of them (paralleling
 *   the structure returned by the `signal function`).
 * 
 *   This example `signal function` returns a 2-vector of input signals.
 * 
 *    #!clj
 *    (fn [query-vec dynamic-vec]
 *       [(subscribe [:a-sub])
 *        (subscribe [:b-sub])])
 * 
 *   The associated computation function must be written
 *   to expect a 2-vector of values for its first argument:
 * 
 *    #!clj
 *    (fn [[a b] query-vec]     ;; 1st argument is a seq of two values
 *      ....)
 * 
 *   If, on the other hand, the signal function was simpler and returned a singleton, like this:
 * 
 *    #!clj
 *    (fn [query-vec dynamic-vec]
 *      (subscribe [:a-sub]))      ;; <-- returning a singleton
 * 
 *   then the associated computation function must be written to expect a single value
 *   as the 1st argument:
 * 
 *    #!clj
 *    (fn [a query-vec]       ;; 1st argument is a single value
 *       ...)
 * 
 *   Further Note: variation #1 above, in which an `input-fn` was not supplied, like this:
 * 
 *    #!clj
 *    (reg-sub
 *      :query-id
 *      a-computation-fn)   ;; has signature:  (fn [db query-vec]  ... ret-value)
 * 
 *   is the equivalent of using this
 *   2nd variation and explicitly supplying a `signal-fn` which returns `app-db`:
 * 
 *    #!clj
 *    (reg-sub
 *      :query-id
 *      (fn [_ _]  re-frame/app-db)   ;; <--- explicit signal-fn
 *      a-computation-fn)             ;; has signature:  (fn [db query-vec]  ... ret-value)
 * 
 *   **Third variation** - syntax Sugar
 * 
 *    #!clj
 *    (reg-sub
 *      :a-b-sub
 *      :<- [:a-sub]
 *      :<- [:b-sub]
 *      (fn [[a b] query-vec]    ;; 1st argument is a seq of two values
 *        {:a a :b b}))
 * 
 *   This 3rd variation is just syntactic sugar for the 2nd.  Instead of providing an
 *   `signals-fn` you provide one or more pairs of `:<-` and a subscription vector.
 * 
 *   If you supply only one pair a singleton will be supplied to the computation function,
 *   as if you had supplied a `signal-fn` returning only a single value:
 * 
 *    #!clj
 *    (reg-sub
 *      :a-sub
 *      :<- [:a-sub]
 *      (fn [a query-vec]      ;; only one pair, so 1st argument is a single value
 *        ...))
 * 
 *   Syntactic sugar for both the `signal-fn` and `computation-fn` can be used together
 *   and the direction of arrows shows the flow of data and functions. The example from
 *   directly above is reproduced here:
 * 
 *    #!clj
 *    (reg-sub
 *      :a-b-sub
 *      :<- [:a-sub]
 *      :<- [:b-sub]
 *      :-> (partial zipmap [:a :b]))
 * 
 *   For further understanding, read the tutorials, and look at the detailed comments in
 *   /examples/todomvc/src/subs.cljs.
 * 
 *   See also: `subscribe`
 *   
 */
re_frame.core.reg_sub = (function re_frame$core$reg_sub(var_args){
var args__5732__auto__ = [];
var len__5726__auto___10765 = arguments.length;
var i__5727__auto___10766 = (0);
while(true){
if((i__5727__auto___10766 < len__5726__auto___10765)){
args__5732__auto__.push((arguments[i__5727__auto___10766]));

var G__10767 = (i__5727__auto___10766 + (1));
i__5727__auto___10766 = G__10767;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return re_frame.core.reg_sub.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(re_frame.core.reg_sub.cljs$core$IFn$_invoke$arity$variadic = (function (query_id,args){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(re_frame.subs.reg_sub,query_id,args);
}));

(re_frame.core.reg_sub.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(re_frame.core.reg_sub.cljs$lang$applyTo = (function (seq10478){
var G__10479 = cljs.core.first(seq10478);
var seq10478__$1 = cljs.core.next(seq10478);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__10479,seq10478__$1);
}));

/**
 * Given a `query` vector, returns a Reagent `reaction` which will, over
 *   time, reactively deliver a stream of values. So, in FRP-ish terms,
 *   it returns a `Signal`.
 * 
 *   To obtain the current value from the Signal, it must be dereferenced:
 * 
 *    #!clj
 *    (let [signal (subscribe [:items])
 *          value  (deref signal)]     ;; could be written as @signal
 *      ...)
 * 
 * which is typically written tersely as simple:
 * 
 *    #!clj
 *    (let [items  @(subscribe [:items])]
 *      ...)
 * 
 * 
 *   `query` is a vector of at least one element. The first element is the
 *   `query-id`, typically a namespaced keyword. The rest of the vector's
 *   elements are optional, additional values which parameterise the query
 *   performed.
 * 
 *   `dynv` is an optional 3rd argument, which is a vector of further input
 *   signals (atoms, reactions, etc), NOT values. This argument exists for
 *   historical reasons and is borderline deprecated these days.
 * 
 *   **Example Usage**:
 * 
 *    #!clj
 *    (subscribe [:items])
 *    (subscribe [:items "blue" :small])
 *    (subscribe [:items {:colour "blue"  :size :small}])
 * 
 *   Note: for any given call to `subscribe` there must have been a previous call
 *   to `reg-sub`, registering the query handler (functions) associated with
 *   `query-id`.
 * 
 *   **Hint**
 * 
 *   When used in a view function BE SURE to `deref` the returned value.
 *   In fact, to avoid any mistakes, some prefer to define:
 * 
 *    #!clj
 *    (def <sub  (comp deref re-frame.core/subscribe))
 * 
 *   And then, within their views, they call  `(<sub [:items :small])` rather
 *   than using `subscribe` directly.
 * 
 *   **De-duplication**
 * 
 *   Two, or more, concurrent subscriptions for the same query will
 *   source reactive updates from the one executing handler.
 * 
 *   See also: `reg-sub`
 *   
 */
re_frame.core.subscribe = (function re_frame$core$subscribe(var_args){
var G__10486 = arguments.length;
switch (G__10486) {
case 1:
return re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1 = (function (query){
return re_frame.subs.subscribe.cljs$core$IFn$_invoke$arity$1(query);
}));

(re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$2 = (function (query,dynv){
return re_frame.subs.subscribe.cljs$core$IFn$_invoke$arity$2(query,dynv);
}));

(re_frame.core.subscribe.cljs$lang$maxFixedArity = 2);

/**
 * Unregisters subscription handlers (presumably registered previously via the use of `reg-sub`).
 * 
 *   When called with no args, it will unregister all currently registered subscription handlers.
 * 
 *   When given one arg, assumed to be the `id` of a previously registered
 *   subscription handler, it will unregister the associated handler. Will produce a warning to
 *   console if it finds no matching registration.
 * 
 *   NOTE: Depending on the usecase, it may be necessary to call `clear-subscription-cache!` afterwards
 */
re_frame.core.clear_sub = (function re_frame$core$clear_sub(var_args){
var G__10492 = arguments.length;
switch (G__10492) {
case 0:
return re_frame.core.clear_sub.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return re_frame.core.clear_sub.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(re_frame.core.clear_sub.cljs$core$IFn$_invoke$arity$0 = (function (){
return re_frame.registrar.clear_handlers.cljs$core$IFn$_invoke$arity$1(re_frame.subs.kind);
}));

(re_frame.core.clear_sub.cljs$core$IFn$_invoke$arity$1 = (function (query_id){
return re_frame.registrar.clear_handlers.cljs$core$IFn$_invoke$arity$2(re_frame.subs.kind,query_id);
}));

(re_frame.core.clear_sub.cljs$lang$maxFixedArity = 1);

/**
 * This is a low level, advanced function.  You should probably be
 *   using `reg-sub` instead.
 * 
 *   Some explanation is available in the docs at
 *   <a href="http://day8.github.io/re-frame/flow-mechanics/" target="_blank">http://day8.github.io/re-frame/flow-mechanics/</a>
 */
re_frame.core.reg_sub_raw = (function re_frame$core$reg_sub_raw(query_id,handler_fn){
return re_frame.registrar.register_handler(re_frame.subs.kind,query_id,handler_fn);
});
/**
 * Removes all subscriptions from the cache.
 * 
 *   This function can be used at development time or test time. Useful when hot reloading
 *   namespaces containing subscription handlers. Also call it after a React/render exception,
 *   because React components won't have been cleaned up properly. And this, in turn, means
 *   the subscriptions within those components won't have been cleaned up correctly. So this
 *   forces the issue.
 *   
 */
re_frame.core.clear_subscription_cache_BANG_ = (function re_frame$core$clear_subscription_cache_BANG_(){
return re_frame.subs.clear_subscription_cache_BANG_();
});
/**
 * Register the given effect `handler` for the given `id`:
 * 
 *  - `id` is keyword, often namespaced.
 *  - `handler` is a side-effecting function which takes a single argument and whose return
 *    value is ignored.
 * 
 *   To use, first, associate `:effect2` with a handler:
 * 
 *    #!clj
 *    (reg-fx
 *       :effect2
 *       (fn [value]
 *          ... do something side-effect-y))
 * 
 *   Then, later, if an event handler were to return this effects map:
 * 
 *    #!clj
 *    {:effect2  [1 2]}
 * 
 *   then the `handler` `fn` we registered previously, using `reg-fx`, will be
 *   called with an argument of `[1 2]`.
 *   
 */
re_frame.core.reg_fx = (function re_frame$core$reg_fx(id,handler){
return re_frame.fx.reg_fx(id,handler);
});
/**
 * Unregisters effect handlers (presumably registered previously via the use of `reg-fx`).
 * 
 *   When called with no args, it will unregister all currently registered effect handlers.
 * 
 *   When given one arg, assumed to be the `id` of a previously registered
 *   effect handler, it will unregister the associated handler. Will produce a warning to
 *   console if it finds no matching registration.
 *   
 */
re_frame.core.clear_fx = (function re_frame$core$clear_fx(var_args){
var G__10517 = arguments.length;
switch (G__10517) {
case 0:
return re_frame.core.clear_fx.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return re_frame.core.clear_fx.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(re_frame.core.clear_fx.cljs$core$IFn$_invoke$arity$0 = (function (){
return re_frame.registrar.clear_handlers.cljs$core$IFn$_invoke$arity$1(re_frame.fx.kind);
}));

(re_frame.core.clear_fx.cljs$core$IFn$_invoke$arity$1 = (function (id){
return re_frame.registrar.clear_handlers.cljs$core$IFn$_invoke$arity$2(re_frame.fx.kind,id);
}));

(re_frame.core.clear_fx.cljs$lang$maxFixedArity = 1);

/**
 * Register the given coeffect `handler` for the given `id`, for later use
 *   within `inject-cofx`:
 * 
 *  - `id` is keyword, often namespaced.
 *  - `handler` is a function which takes either one or two arguments, the first of which is
 *     always `coeffects` and which returns an updated `coeffects`.
 * 
 *   See also: `inject-cofx`
 *   
 */
re_frame.core.reg_cofx = (function re_frame$core$reg_cofx(id,handler){
return re_frame.cofx.reg_cofx(id,handler);
});
/**
 * Given an `id`, and an optional, arbitrary `value`, returns an interceptor
 *   whose `:before` adds to the `:coeffects` (map) by calling a pre-registered
 *   'coeffect handler' identified by the `id`.
 * 
 *   The previous association of a `coeffect handler` with an `id` will have
 *   happened via a call to `re-frame.core/reg-cofx` - generally on program startup.
 * 
 *   Within the created interceptor, this 'looked up' `coeffect handler` will
 *   be called (within the `:before`) with two arguments:
 * 
 *   - the current value of `:coeffects`
 *   - optionally, the originally supplied arbitrary `value`
 * 
 *   This `coeffect handler` is expected to modify and return its first, `coeffects` argument.
 * 
 *   **Example of `inject-cofx` and `reg-cofx` working together**
 * 
 * 
 *   First - Early in app startup, you register a `coeffect handler` for `:datetime`:
 * 
 *    #!clj
 *    (re-frame.core/reg-cofx
 *      :datetime                        ;; usage  (inject-cofx :datetime)
 *      (fn coeffect-handler
 *        [coeffect]
 *        (assoc coeffect :now (js/Date.))))   ;; modify and return first arg
 * 
 *   Second - Later, add an interceptor to an -fx event handler, using `inject-cofx`:
 * 
 *    #!clj
 *    (re-frame.core/reg-event-fx            ;; when registering an event handler
 *      :event-id
 *      [ ... (inject-cofx :datetime) ... ]  ;; <-- create an injecting interceptor
 *      (fn event-handler
 *        [coeffect event]
 *          ;;... in here can access (:now coeffect) to obtain current datetime ...
 *        )))
 * 
 *   **Background**
 * 
 *   `coeffects` are the input resources required by an event handler
 *   to perform its job. The two most obvious ones are `db` and `event`.
 *   But sometimes an event handler might need other resources.
 * 
 *   Perhaps an event handler needs a random number or a GUID or the current
 *   datetime. Perhaps it needs access to a DataScript database connection.
 * 
 *   If an event handler directly accesses these resources, it stops being
 *   pure and, consequently, it becomes harder to test, etc. So we don't
 *   want that.
 * 
 *   Instead, the interceptor created by this function is a way to 'inject'
 *   'necessary resources' into the `:coeffects` (map) subsequently given
 *   to the event handler at call time.
 * 
 *   See also `reg-cofx`
 *   
 */
re_frame.core.inject_cofx = (function re_frame$core$inject_cofx(var_args){
var G__10522 = arguments.length;
switch (G__10522) {
case 1:
return re_frame.core.inject_cofx.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return re_frame.core.inject_cofx.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(re_frame.core.inject_cofx.cljs$core$IFn$_invoke$arity$1 = (function (id){
return re_frame.cofx.inject_cofx.cljs$core$IFn$_invoke$arity$1(id);
}));

(re_frame.core.inject_cofx.cljs$core$IFn$_invoke$arity$2 = (function (id,value){
return re_frame.cofx.inject_cofx.cljs$core$IFn$_invoke$arity$2(id,value);
}));

(re_frame.core.inject_cofx.cljs$lang$maxFixedArity = 2);

/**
 * Unregisters coeffect handlers (presumably registered previously via the use of `reg-cofx`).
 * 
 *   When called with no args, it will unregister all currently registered coeffect handlers.
 * 
 *   When given one arg, assumed to be the `id` of a previously registered
 *   coeffect handler, it will unregister the associated handler. Will produce a warning to
 *   console if it finds no matching registration.
 */
re_frame.core.clear_cofx = (function re_frame$core$clear_cofx(var_args){
var G__10524 = arguments.length;
switch (G__10524) {
case 0:
return re_frame.core.clear_cofx.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return re_frame.core.clear_cofx.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(re_frame.core.clear_cofx.cljs$core$IFn$_invoke$arity$0 = (function (){
return re_frame.registrar.clear_handlers.cljs$core$IFn$_invoke$arity$1(re_frame.cofx.kind);
}));

(re_frame.core.clear_cofx.cljs$core$IFn$_invoke$arity$1 = (function (id){
return re_frame.registrar.clear_handlers.cljs$core$IFn$_invoke$arity$2(re_frame.cofx.kind,id);
}));

(re_frame.core.clear_cofx.cljs$lang$maxFixedArity = 1);

/**
 * An interceptor which logs/instruments an event handler's actions to
 *   `js/console.debug`. See examples/todomvc/src/events.cljs for use.
 * 
 *   Output includes:
 * 
 *  1. the event vector
 *  2. a `clojure.data/diff` of db, before vs after, which shows
 *     the changes caused by the event handler. To understand the output,
 *     you should understand:
 *     <a href="https://clojuredocs.org/clojure.data/diff" target="_blank">https://clojuredocs.org/clojure.data/diff</a>.
 * 
 *   You'd typically include this interceptor after (to the right of) any
 *   `path` interceptor.
 * 
 *   Warning:  calling `clojure.data/diff` on large, complex data structures
 *   can be slow. So, you won't want this interceptor present in production
 *   code. So, you should condition it out like this:
 * 
 *    #!clj
 *    (re-frame.core/reg-event-db
 *      :evt-id
 *      [(when ^boolean goog.DEBUG re-frame.core/debug)]  ;; <-- conditional
 *      (fn [db v]
 *         ...))
 * 
 *   To make this code fragment work, you'll also have to set `goog.DEBUG` to
 *   `false` in your production builds. For an example, look in `project.clj` of /examples/todomvc.
 *   
 */
re_frame.core.debug = re_frame.std_interceptors.debug;
/**
 * Returns an interceptor which acts somewhat like `clojure.core/update-in`, in the sense that
 *   the event handler is given a specific part of `app-db` to change, not all of `app-db`.
 * 
 *   The interceptor has both a `:before` and `:after` functions. The `:before` replaces
 *   the `:db` key within coeffects with a sub-path within `app-db`. The `:after` reverses the process,
 *   and it grafts the handler's return value back into db, at the right path.
 * 
 *   Examples:
 * 
 *    #!clj
 *    (path :some :path)
 *    (path [:some :path])
 *    (path [:some :path] :to :here)
 *    (path [:some :path] [:to] :here)
 * 
 *   Example Use:
 * 
 *    #!clj
 *    (reg-event-db
 *      :event-id
 *      (path [:a :b])  ;; <-- used here, in interceptor chain
 *      (fn [b v]       ;; 1st arg is not db. Is the value from path [:a :b] within db
 *        ... new-b))   ;; returns a new value for that path (not the entire db)
 * 
 *   Notes:
 * 
 *  1. `path` may appear more than once in an interceptor chain. Progressive narrowing.
 *  2. if `:effects` contains no `:db` effect, can't graft a value back in.
 *   
 */
re_frame.core.path = (function re_frame$core$path(var_args){
var args__5732__auto__ = [];
var len__5726__auto___10817 = arguments.length;
var i__5727__auto___10818 = (0);
while(true){
if((i__5727__auto___10818 < len__5726__auto___10817)){
args__5732__auto__.push((arguments[i__5727__auto___10818]));

var G__10821 = (i__5727__auto___10818 + (1));
i__5727__auto___10818 = G__10821;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return re_frame.core.path.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(re_frame.core.path.cljs$core$IFn$_invoke$arity$variadic = (function (args){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(re_frame.std_interceptors.path,args);
}));

(re_frame.core.path.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(re_frame.core.path.cljs$lang$applyTo = (function (seq10529){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq10529));
}));

/**
 * Returns an interceptor which will run the given function `f` in the `:after`
 *   position.
 * 
 *   `f` is called with two arguments: `db` and `event`, and is expected to
 *   return a modified `db`.
 * 
 *   Unlike the `after` interceptor which is only about side effects, `enrich`
 *   expects `f` to process and alter the given `db` coeffect in some useful way,
 *   contributing to the derived data, flowing vibe.
 * 
 *   If `f` returns `nil`, the `db` value passed to `f` will be returned instead.
 * 
 *   #### Example Use:
 * 
 *   Imagine that todomvc needed to do duplicate detection - if any two todos had
 *   the same text, then highlight their background, and report them via a warning
 *   at the bottom of the panel.
 * 
 *   Almost any user action (edit text, add new todo, remove a todo) requires a
 *   complete reassessment of duplication errors and warnings. E.g. that edit
 *   just made might have introduced a new duplicate, or removed one. Same with
 *   any todo removal. So we need to re-calculate warnings after any CRUD events
 *   associated with the todos list.
 * 
 *   Unless we are careful, we might end up coding subtly different checks
 *   for each kind of CRUD operation.  The duplicates check made after
 *   'delete todo' event might be subtly different to that done after an
 *   editing operation. Nice and efficient, but fiddly. A bug generator
 *   approach.
 * 
 *   So, instead, we create an `f` which recalculates ALL warnings from scratch
 *   every time there is ANY change. It will inspect all the todos, and
 *   reset ALL FLAGS every time (overwriting what was there previously)
 *   and fully recalculate the list of duplicates (displayed at the bottom?).
 * 
 *   <a href="https://twitter.com/nathanmarz/status/879722740776939520" target="_blank">https://twitter.com/nathanmarz/status/879722740776939520</a>
 * 
 *   By applying `f` in an `:enrich` interceptor, after every CRUD event,
 *   we keep the handlers simple and yet we ensure this important step
 *   (of getting warnings right) is not missed on any change.
 * 
 *   We can test `f` easily - it is a pure function - independently of
 *   any CRUD operation.
 * 
 *   This brings huge simplicity at the expense of some re-computation
 *   each time. This may be a very satisfactory trade-off in many cases.
 * 
 *   #### Returning nil
 * 
 *   In some cases, it's useful to apply a change to specific situations that can
 *   be determined at runtime instead of when defining the handler with an
 *   `:enrich` interceptor. Instead of forcing you to return the `db` from every
 *   non-applicable branch, you can return `nil` to use the given `db` value:
 * 
 *    #!clj
 *    (def set-last-update
 *      (core/enrich
 *        (fn [{db :db} [_ {user :user}]]
 *          (when (active-user? user)  ;; <- Only perform an update if user is active
 *            ...))))
 *   
 */
re_frame.core.enrich = (function re_frame$core$enrich(f){
return re_frame.std_interceptors.enrich(f);
});
/**
 * > New in v1.2.0
 * 
 * An interceptor which decreases the amount of destructuring necessary in an
 * event handler where the event is structured as a 2-vector of
 * [event-id payload-map].
 * 
 * It promotes the `payload-map` part to be the event ultimately given to the
 * event handler. Should you want the full original event, it can be found in
 * `coeffects` under the key `:original-event`.
 * 
 * If a dispatch looked like this:
 * 
 *    #!clj
 *     (dispatch [:event-id {:x 1 :y 2 :z 3}])
 * 
 * Your event handlers can look like this:
 * 
 *    #!clj
 *     (reg-event-fx
 *       :event-id
 *       [... unwrap ...]                    ;; <-- added to the interceptors
 *       (fn [{:keys [db]} {:keys [x y z]}]  ;; <-- instead of [_ {:keys [x y z]}]
 *         ...)
 * 
 */
re_frame.core.unwrap = re_frame.std_interceptors.unwrap;
/**
 * An interceptor which removes the first element of the event vector,
 *   before it is supplied to the event handler, allowing you to write more
 * aesthetically pleasing event handlers. No leading underscore on the event-v!
 * 
 *   Should you want the full original event, it can be found in `coeffects` under
 *   the key `:original-event`.
 * 
 *   Your event handlers will look like this:
 * 
 *    #!clj
 *    (reg-event-db
 *      :event-id
 *      [... trim-v ...]    ;; <-- added to the interceptors
 *      (fn [db [x y z]]    ;; <-- instead of [_ x y z]
 *        ...)
 *  
 */
re_frame.core.trim_v = re_frame.std_interceptors.trim_v;
/**
 * Returns an interceptor which runs the given function `f` in the `:after`
 *   position, presumably for side effects.
 * 
 *   `f` is called with two arguments: the `:effects` value for `:db`
 *   (or the `:coeffect` value of `:db` if no `:db` effect is returned) and the event.
 *   Its return value is ignored, so `f` can only side-effect.
 * 
 *   An example of use can be seen in the re-frame github repo in `/examples/todomvc/events.cljs`:
 * 
 *   - `f` runs schema validation (reporting any errors found).
 *   - `f` writes to localstorage.
 */
re_frame.core.after = (function re_frame$core$after(f){
return re_frame.std_interceptors.after(f);
});
/**
 * Returns an interceptor which will observe N paths within `db`, and if any of them
 *   test not `identical?` to their previous value  (as a result of a event handler
 *   being run), then it will run `f` to compute a new value, which is then assoc-ed
 *   into the given `out-path` within `db`.
 * 
 *   Example Usage:
 * 
 *    #!clj
 *    (defn my-f
 *      [a-val b-val]
 *      ... some computation on a and b in here)
 * 
 *    ;; use it
 *    (def my-interceptor (on-changes my-f [:c] [:a] [:b]))
 * 
 *    (reg-event-db
 *      :event-id
 *      [... my-interceptor ...]  ;; <-- ultimately used here
 *      (fn [db v]
 *         ...))
 * 
 * 
 *   If you put this interceptor on handlers which might change paths `:a` or `:b`,
 *   it will:
 * 
 *  - call `f` each time the value at path `[:a]` or `[:b]` changes
 *  - call `f` with the values extracted from `[:a]` `[:b]`
 *  - assoc the return value from `f` into the path  `[:c]`
 *   
 */
re_frame.core.on_changes = (function re_frame$core$on_changes(var_args){
var args__5732__auto__ = [];
var len__5726__auto___10856 = arguments.length;
var i__5727__auto___10860 = (0);
while(true){
if((i__5727__auto___10860 < len__5726__auto___10856)){
args__5732__auto__.push((arguments[i__5727__auto___10860]));

var G__10861 = (i__5727__auto___10860 + (1));
i__5727__auto___10860 = G__10861;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((2) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((2)),(0),null)):null);
return re_frame.core.on_changes.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),(arguments[(1)]),argseq__5733__auto__);
});

(re_frame.core.on_changes.cljs$core$IFn$_invoke$arity$variadic = (function (f,out_path,in_paths){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(re_frame.std_interceptors.on_changes,f,out_path,in_paths);
}));

(re_frame.core.on_changes.cljs$lang$maxFixedArity = (2));

/** @this {Function} */
(re_frame.core.on_changes.cljs$lang$applyTo = (function (seq10549){
var G__10550 = cljs.core.first(seq10549);
var seq10549__$1 = cljs.core.next(seq10549);
var G__10551 = cljs.core.first(seq10549__$1);
var seq10549__$2 = cljs.core.next(seq10549__$1);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__10550,G__10551,seq10549__$2);
}));

/**
 * Registers the given `interceptor` as a global interceptor. Global interceptors are
 * included in the processing chain of every event.
 * 
 * When you register an event handler, you have the option of supplying an
 * interceptor chain. Any global interceptors you register are effectively
 * prepending to this chain.
 * 
 * Global interceptors are run in the order that they are registered.
 */
re_frame.core.reg_global_interceptor = (function re_frame$core$reg_global_interceptor(interceptor){
return re_frame.settings.reg_global_interceptor(interceptor);
});
/**
 * Unregisters global interceptors (presumably registered previously via the use of `reg-global-interceptor`).
 * 
 *   When called with no args, it will unregister all currently registered global interceptors.
 * 
 *   When given one arg, assumed to be the `id` of a previously registered
 *   global interceptors, it will unregister the associated interceptor. Will produce a warning to
 *   console if it finds no matching registration.
 */
re_frame.core.clear_global_interceptor = (function re_frame$core$clear_global_interceptor(var_args){
var G__10565 = arguments.length;
switch (G__10565) {
case 0:
return re_frame.core.clear_global_interceptor.cljs$core$IFn$_invoke$arity$0();

break;
case 1:
return re_frame.core.clear_global_interceptor.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(re_frame.core.clear_global_interceptor.cljs$core$IFn$_invoke$arity$0 = (function (){
return re_frame.settings.clear_global_interceptors.cljs$core$IFn$_invoke$arity$0();
}));

(re_frame.core.clear_global_interceptor.cljs$core$IFn$_invoke$arity$1 = (function (id){
return re_frame.settings.clear_global_interceptors.cljs$core$IFn$_invoke$arity$1(id);
}));

(re_frame.core.clear_global_interceptor.cljs$lang$maxFixedArity = 1);

/**
 * A utility function for creating interceptors.
 * 
 *   Accepts three optional, named arguments:
 * 
 *   - `:id` - an id for the interceptor (decorative only)
 *   - `:before` - the interceptor's before function
 *   - `:after`  - the interceptor's after function
 * 
 *   Example use:
 * 
 *    #!clj
 *    (def my-interceptor
 *      (->interceptor
 *       :id     :my-interceptor
 *       :before (fn [context]
 *                 ... modifies and returns `context`)
 *       :after  (fn [context]
 *                 ... modifies and returns `context`)))
 * 
 *   Notes:
 * 
 *  - `:before` functions modify and return their `context` argument. Sometimes they
 *    only side effect, in which case, they'll perform the side effect and return
 *    `context` unchanged.
 *  - `:before` functions often modify the `:coeffects` map within `context` and,
 *    if they do, then they should use the utility functions `get-coeffect` and
 *    `assoc-coeffect`.
 *  - `:after` functions modify and return their `context` argument. Sometimes they
 *    only side effect, in which case, they'll perform the side effect and return
 *    `context` unchanged.
 *  - `:after` functions often modify the `:effects` map within `context` and,
 *    if they do, then they should use the utility functions `get-effect`
 *    and `assoc-effect`
 */
re_frame.core.__GT_interceptor = (function re_frame$core$__GT_interceptor(var_args){
var args__5732__auto__ = [];
var len__5726__auto___10863 = arguments.length;
var i__5727__auto___10864 = (0);
while(true){
if((i__5727__auto___10864 < len__5726__auto___10863)){
args__5732__auto__.push((arguments[i__5727__auto___10864]));

var G__10865 = (i__5727__auto___10864 + (1));
i__5727__auto___10864 = G__10865;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return re_frame.core.__GT_interceptor.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(re_frame.core.__GT_interceptor.cljs$core$IFn$_invoke$arity$variadic = (function (p__10583){
var map__10584 = p__10583;
var map__10584__$1 = cljs.core.__destructure_map(map__10584);
var m = map__10584__$1;
var id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__10584__$1,new cljs.core.Keyword(null,"id","id",-1388402092));
var before = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__10584__$1,new cljs.core.Keyword(null,"before","before",-1633692388));
var after = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__10584__$1,new cljs.core.Keyword(null,"after","after",594996914));
return re_frame.utils.apply_kw.cljs$core$IFn$_invoke$arity$variadic(re_frame.interceptor.__GT_interceptor,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([m], 0));
}));

(re_frame.core.__GT_interceptor.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(re_frame.core.__GT_interceptor.cljs$lang$applyTo = (function (seq10578){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq10578));
}));

/**
 * A utility function, typically used when writing an interceptor's `:before` function.
 * 
 * When called with one argument, it returns the `:coeffects` map from within that `context`.
 * 
 * When called with two or three arguments, behaves like `clojure.core/get` and
 * returns the value mapped to `key` in the `:coeffects` map within `context`, `not-found` or
 * `nil` if `key` is not present.
 */
re_frame.core.get_coeffect = (function re_frame$core$get_coeffect(var_args){
var G__10606 = arguments.length;
switch (G__10606) {
case 1:
return re_frame.core.get_coeffect.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return re_frame.core.get_coeffect.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return re_frame.core.get_coeffect.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(re_frame.core.get_coeffect.cljs$core$IFn$_invoke$arity$1 = (function (context){
return re_frame.interceptor.get_coeffect.cljs$core$IFn$_invoke$arity$1(context);
}));

(re_frame.core.get_coeffect.cljs$core$IFn$_invoke$arity$2 = (function (context,key){
return re_frame.interceptor.get_coeffect.cljs$core$IFn$_invoke$arity$2(context,key);
}));

(re_frame.core.get_coeffect.cljs$core$IFn$_invoke$arity$3 = (function (context,key,not_found){
return re_frame.interceptor.get_coeffect.cljs$core$IFn$_invoke$arity$3(context,key,not_found);
}));

(re_frame.core.get_coeffect.cljs$lang$maxFixedArity = 3);

/**
 * A utility function, typically used when writing an interceptor's `:before` function.
 * 
 * Adds or updates a key/value pair in the `:coeffects` map within `context`. 
 */
re_frame.core.assoc_coeffect = (function re_frame$core$assoc_coeffect(context,key,value){
return re_frame.interceptor.assoc_coeffect(context,key,value);
});
/**
 * A utility function, used when writing interceptors, typically within an `:after` function.
 * 
 * When called with one argument, returns the `:effects` map from the `context`.
 * 
 * When called with two or three arguments, behaves like `clojure.core/get` and
 * returns the value mapped to `key` in the effects map, `not-found` or
 * `nil` if `key` is not present.
 */
re_frame.core.get_effect = (function re_frame$core$get_effect(var_args){
var G__10612 = arguments.length;
switch (G__10612) {
case 1:
return re_frame.core.get_effect.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return re_frame.core.get_effect.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
case 3:
return re_frame.core.get_effect.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(re_frame.core.get_effect.cljs$core$IFn$_invoke$arity$1 = (function (context){
return re_frame.interceptor.get_effect.cljs$core$IFn$_invoke$arity$1(context);
}));

(re_frame.core.get_effect.cljs$core$IFn$_invoke$arity$2 = (function (context,key){
return re_frame.interceptor.get_effect.cljs$core$IFn$_invoke$arity$2(context,key);
}));

(re_frame.core.get_effect.cljs$core$IFn$_invoke$arity$3 = (function (context,key,not_found){
return re_frame.interceptor.get_effect.cljs$core$IFn$_invoke$arity$3(context,key,not_found);
}));

(re_frame.core.get_effect.cljs$lang$maxFixedArity = 3);

/**
 * A utility function, typically used when writing an interceptor's `:after` function.
 * 
 * Adds or updates a key/value pair in the `:effects` map within `context`. 
 */
re_frame.core.assoc_effect = (function re_frame$core$assoc_effect(context,key,value){
return re_frame.interceptor.assoc_effect(context,key,value);
});
/**
 * A utility function, used when writing an interceptor's `:before` function.
 * 
 *   Adds the given collection of `interceptors` to those already in `context's`
 *   execution `:queue`. It returns the updated `context`.
 * 
 *   So, it provides a way for one interceptor to add more interceptors to the
 *   currently executing interceptor chain.
 *   
 */
re_frame.core.enqueue = (function re_frame$core$enqueue(context,interceptors){
return re_frame.interceptor.enqueue(context,interceptors);
});
/**
 * re-frame outputs warnings and errors via the API function `console`
 * which, by default, delegates to `js/console`'s default implementation for
 *   `log`, `error`, `warn`, `debug`, `group` and `groupEnd`. But, using this function,
 * you can override that behaviour with your own functions.
 * 
 *   The argument `new-loggers` should be a map containing a subset of they keys
 *   for the standard `loggers`, namely  `:log` `:error` `:warn` `:debug` `:group`
 *   or `:groupEnd`.
 * 
 *   Example Usage:
 * 
 *    #!clj
 *    (defn my-logger      ;; my alternative logging function
 *      [& args]
 *      (post-it-somewhere (apply str args)))
 * 
 *    ;; now install my alternative loggers
 *    (re-frame.core/set-loggers!  {:warn my-logger :log my-logger})
 * 
 */
re_frame.core.set_loggers_BANG_ = (function re_frame$core$set_loggers_BANG_(new_loggers){
return re_frame.loggers.set_loggers_BANG_(new_loggers);
});
/**
 * A utility logging function which is used internally within re-frame to produce
 *   warnings and other output. It can also be used by libraries which
 *   extend re-frame, such as effect handlers.
 * 
 *   By default, it will output the given `args` to `js/console` at the given log `level`.
 *   However, an application using re-frame can redirect `console` output via `set-loggers!`.
 * 
 *   `level` can be one of `:log`, `:error`, `:warn`, `:debug`, `:group` or `:groupEnd`.
 * 
 *   Example usage:
 * 
 *    #!clj
 *    (console :error "Sure enough it happened:" a-var "and" another)
 *    (console :warn "Possible breach of containment wall at:" dt)
 *   
 */
re_frame.core.console = (function re_frame$core$console(var_args){
var args__5732__auto__ = [];
var len__5726__auto___10894 = arguments.length;
var i__5727__auto___10895 = (0);
while(true){
if((i__5727__auto___10895 < len__5726__auto___10894)){
args__5732__auto__.push((arguments[i__5727__auto___10895]));

var G__10897 = (i__5727__auto___10895 + (1));
i__5727__auto___10895 = G__10897;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((1) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((1)),(0),null)):null);
return re_frame.core.console.cljs$core$IFn$_invoke$arity$variadic((arguments[(0)]),argseq__5733__auto__);
});

(re_frame.core.console.cljs$core$IFn$_invoke$arity$variadic = (function (level,args){
return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(re_frame.loggers.console,level,args);
}));

(re_frame.core.console.cljs$lang$maxFixedArity = (1));

/** @this {Function} */
(re_frame.core.console.cljs$lang$applyTo = (function (seq10615){
var G__10616 = cljs.core.first(seq10615);
var seq10615__$1 = cljs.core.next(seq10615);
var self__5711__auto__ = this;
return self__5711__auto__.cljs$core$IFn$_invoke$arity$variadic(G__10616,seq10615__$1);
}));

/**
 * This is a utility function, typically used in testing.
 * 
 *   It checkpoints the current state of re-frame and returns a function which, when
 *   later called, will restore re-frame to the checkpointed state.
 * 
 *   The checkpoint includes `app-db`, all registered handlers and all subscriptions.
 *   
 */
re_frame.core.make_restore_fn = (function re_frame$core$make_restore_fn(){
var handlers = cljs.core.deref(re_frame.registrar.kind__GT_id__GT_handler);
var app_db = cljs.core.deref(re_frame.db.app_db);
var subs_cache = cljs.core.deref(re_frame.subs.query__GT_reaction);
return (function (){
var original_subs_10904 = cljs.core.set(cljs.core.vals(subs_cache));
var current_subs_10905 = cljs.core.set(cljs.core.vals(cljs.core.deref(re_frame.subs.query__GT_reaction)));
var seq__10627_10906 = cljs.core.seq(clojure.set.difference.cljs$core$IFn$_invoke$arity$2(current_subs_10905,original_subs_10904));
var chunk__10628_10907 = null;
var count__10629_10908 = (0);
var i__10630_10909 = (0);
while(true){
if((i__10630_10909 < count__10629_10908)){
var sub_10913 = chunk__10628_10907.cljs$core$IIndexed$_nth$arity$2(null,i__10630_10909);
re_frame.interop.dispose_BANG_(sub_10913);


var G__10915 = seq__10627_10906;
var G__10916 = chunk__10628_10907;
var G__10917 = count__10629_10908;
var G__10918 = (i__10630_10909 + (1));
seq__10627_10906 = G__10915;
chunk__10628_10907 = G__10916;
count__10629_10908 = G__10917;
i__10630_10909 = G__10918;
continue;
} else {
var temp__5804__auto___10919 = cljs.core.seq(seq__10627_10906);
if(temp__5804__auto___10919){
var seq__10627_10920__$1 = temp__5804__auto___10919;
if(cljs.core.chunked_seq_QMARK_(seq__10627_10920__$1)){
var c__5525__auto___10921 = cljs.core.chunk_first(seq__10627_10920__$1);
var G__10922 = cljs.core.chunk_rest(seq__10627_10920__$1);
var G__10923 = c__5525__auto___10921;
var G__10924 = cljs.core.count(c__5525__auto___10921);
var G__10925 = (0);
seq__10627_10906 = G__10922;
chunk__10628_10907 = G__10923;
count__10629_10908 = G__10924;
i__10630_10909 = G__10925;
continue;
} else {
var sub_10926 = cljs.core.first(seq__10627_10920__$1);
re_frame.interop.dispose_BANG_(sub_10926);


var G__10927 = cljs.core.next(seq__10627_10920__$1);
var G__10928 = null;
var G__10929 = (0);
var G__10930 = (0);
seq__10627_10906 = G__10927;
chunk__10628_10907 = G__10928;
count__10629_10908 = G__10929;
i__10630_10909 = G__10930;
continue;
}
} else {
}
}
break;
}

cljs.core.reset_BANG_(re_frame.registrar.kind__GT_id__GT_handler,handlers);

cljs.core.reset_BANG_(re_frame.db.app_db,app_db);

return null;
});
});
/**
 * Removes all events currently queued for processing
 */
re_frame.core.purge_event_queue = (function re_frame$core$purge_event_queue(){
return re_frame.router.event_queue.re_frame$router$IEventQueue$purge$arity$1(null);
});
/**
 * Registers the given function `f` to be called after each event is processed.
 * 
 * `f` will be called with two arguments:
 * 
 *  - `event`: a vector. The event just processed.
 *  - `queue`: a PersistentQueue, possibly empty, of events yet to be processed.
 * 
 * This facility is useful in advanced cases like:
 * 
 *   - you are implementing a complex bootstrap pipeline
 *   - you want to create your own handling infrastructure, with perhaps multiple
 *     handlers for the one event, etc.  Hook in here.
 *   - libraries providing 'isomorphic javascript' rendering on  Nodejs or Nashorn.
 * 
 *   `id` is typically a keyword. If it supplied when an `f` is added, it can be
 *   subsequently be used to identify it for removal. See `remove-post-event-callback`.
 *   
 */
re_frame.core.add_post_event_callback = (function re_frame$core$add_post_event_callback(var_args){
var G__10648 = arguments.length;
switch (G__10648) {
case 1:
return re_frame.core.add_post_event_callback.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return re_frame.core.add_post_event_callback.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(re_frame.core.add_post_event_callback.cljs$core$IFn$_invoke$arity$1 = (function (f){
return re_frame.core.add_post_event_callback.cljs$core$IFn$_invoke$arity$2(f,f);
}));

(re_frame.core.add_post_event_callback.cljs$core$IFn$_invoke$arity$2 = (function (id,f){
return re_frame.router.event_queue.re_frame$router$IEventQueue$add_post_event_callback$arity$3(null,id,f);
}));

(re_frame.core.add_post_event_callback.cljs$lang$maxFixedArity = 2);

/**
 * Unregisters a post event callback function, identified by `id`.
 * 
 *   Such a function must have been previously registered via `add-post-event-callback`
 */
re_frame.core.remove_post_event_callback = (function re_frame$core$remove_post_event_callback(id){
return re_frame.router.event_queue.re_frame$router$IEventQueue$remove_post_event_callback$arity$2(null,id);
});
/**
 * Deprecated. Use `reg-event-db` instead.
 */
re_frame.core.register_handler = (function re_frame$core$register_handler(var_args){
var args__5732__auto__ = [];
var len__5726__auto___10978 = arguments.length;
var i__5727__auto___10979 = (0);
while(true){
if((i__5727__auto___10979 < len__5726__auto___10978)){
args__5732__auto__.push((arguments[i__5727__auto___10979]));

var G__10980 = (i__5727__auto___10979 + (1));
i__5727__auto___10979 = G__10980;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return re_frame.core.register_handler.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(re_frame.core.register_handler.cljs$core$IFn$_invoke$arity$variadic = (function (args){
re_frame.core.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: \"register-handler\" has been renamed \"reg-event-db\" (look for registration of ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.first(args)),")"], 0));

return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(re_frame.core.reg_event_db,args);
}));

(re_frame.core.register_handler.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(re_frame.core.register_handler.cljs$lang$applyTo = (function (seq10649){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq10649));
}));

/**
 * Deprecated. Use `reg-sub-raw` instead.
 */
re_frame.core.register_sub = (function re_frame$core$register_sub(var_args){
var args__5732__auto__ = [];
var len__5726__auto___10982 = arguments.length;
var i__5727__auto___10983 = (0);
while(true){
if((i__5727__auto___10983 < len__5726__auto___10982)){
args__5732__auto__.push((arguments[i__5727__auto___10983]));

var G__10984 = (i__5727__auto___10983 + (1));
i__5727__auto___10983 = G__10984;
continue;
} else {
}
break;
}

var argseq__5733__auto__ = ((((0) < args__5732__auto__.length))?(new cljs.core.IndexedSeq(args__5732__auto__.slice((0)),(0),null)):null);
return re_frame.core.register_sub.cljs$core$IFn$_invoke$arity$variadic(argseq__5733__auto__);
});

(re_frame.core.register_sub.cljs$core$IFn$_invoke$arity$variadic = (function (args){
re_frame.core.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: \"register-sub\" is used to register the event ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.first(args))," but it is a deprecated part of the API. Please use \"reg-sub-raw\" instead."], 0));

return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(re_frame.core.reg_sub_raw,args);
}));

(re_frame.core.register_sub.cljs$lang$maxFixedArity = (0));

/** @this {Function} */
(re_frame.core.register_sub.cljs$lang$applyTo = (function (seq10655){
var self__5712__auto__ = this;
return self__5712__auto__.cljs$core$IFn$_invoke$arity$variadic(cljs.core.seq(seq10655));
}));


//# sourceMappingURL=re_frame.core.js.map
