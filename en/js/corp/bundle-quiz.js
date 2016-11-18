/// <reference path="Signal.ts" />
/*
*	@desc   	An object that represents a binding between a Signal and a listener function.
*               Released under the MIT license
*				http://millermedeiros.github.com/js-signals/
*
*	@version	1.0 - 7th March 2013
*
*	@author 	Richard Davey, TypeScript conversion
*	@author		Miller Medeiros, JS Signals
*	@author		Robert Penner, AS Signals
*
*	@url		http://www.kiwijs.org
*
*/
var SignalBinding = (function () {
    /**
    * Object that represents a binding between a Signal and a listener function.
    * <br />- <strong>This is an internal constructor and shouldn't be called by regular users.</strong>
    * <br />- inspired by Joa Ebert AS3 SignalBinding and Robert Penner's Slot classes.
    * @author Miller Medeiros
    * @constructor
    * @internal
    * @name SignalBinding
    * @param {Signal} signal Reference to Signal object that listener is currently bound to.
    * @param {Function} listener Handler function bound to the signal.
    * @param {boolean} isOnce If binding should be executed just once.
    * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
    * @param {Number} [priority] The priority level of the event listener. (default = 0).
    */
    function SignalBinding(signal, listener, isOnce, listenerContext, priority) {
        if (priority === void 0) { priority = 0; }
        /**
        * If binding is active and should be executed.
        * @type boolean
        */
        this.active = true;
        /**
        * Default parameters passed to listener during `Signal.dispatch` and `SignalBinding.execute`. (curried parameters)
        * @type Array|null
        */
        this.params = null;
        this._listener = listener;
        this._isOnce = isOnce;
        this.context = listenerContext;
        this._signal = signal;
        this.priority = priority || 0;
    }
    /**
    * Call listener passing arbitrary parameters.
    * <p>If binding was added using `Signal.addOnce()` it will be automatically removed from signal dispatch queue, this method is used internally for the signal dispatch.</p>
    * @param {Array} [paramsArr] Array of parameters that should be passed to the listener
    * @return {*} Value returned by the listener.
    */
    SignalBinding.prototype.execute = function (paramsArr) {
        var handlerReturn;
        var params;
        if (this.active && !!this._listener) {
            params = this.params ? this.params.concat(paramsArr) : paramsArr;
            handlerReturn = this._listener.apply(this.context, params);
            if (this._isOnce) {
                this.detach();
            }
        }
        return handlerReturn;
    };
    /**
    * Detach binding from signal.
    * - alias to: mySignal.remove(myBinding.getListener());
    * @return {Function|null} Handler function bound to the signal or `null` if binding was previously detached.
    */
    SignalBinding.prototype.detach = function () {
        return this.isBound() ? this._signal.remove(this._listener, this.context) : null;
    };
    /**
    * @return {Boolean} `true` if binding is still bound to the signal and have a listener.
    */
    SignalBinding.prototype.isBound = function () {
        return (!!this._signal && !!this._listener);
    };
    /**
    * @return {boolean} If SignalBinding will only be executed once.
    */
    SignalBinding.prototype.isOnce = function () {
        return this._isOnce;
    };
    /**
    * @return {Function} Handler function bound to the signal.
    */
    SignalBinding.prototype.getListener = function () {
        return this._listener;
    };
    /**
    * @return {Signal} Signal that listener is currently bound to.
    */
    SignalBinding.prototype.getSignal = function () {
        return this._signal;
    };
    /**
    * Delete instance properties
    * @private
    */
    SignalBinding.prototype._destroy = function () {
        delete this._signal;
        delete this._listener;
        delete this.context;
    };
    /**
    * @return {string} String representation of the object.
    */
    SignalBinding.prototype.toString = function () {
        return '[SignalBinding isOnce:' + this._isOnce + ', isBound:' + this.isBound() + ', active:' + this.active + ']';
    };
    return SignalBinding;
})();
/// <reference path="SignalBinding.ts" />
/**
*	@desc       A TypeScript conversion of JS Signals by Miller Medeiros
*               Released under the MIT license
*				http://millermedeiros.github.com/js-signals/
*
*	@version	1.0 - 7th March 2013
*
*	@author 	Richard Davey, TypeScript conversion
*	@author		Miller Medeiros, JS Signals
*	@author		Robert Penner, AS Signals
*
*	@url		http://www.photonstorm.com
*/
/**
* Custom event broadcaster
* <br />- inspired by Robert Penner's AS3 Signals.
* @name Signal
* @author Miller Medeiros
* @constructor
*/
var Signal = (function () {
    function Signal() {
        /**
        * @property _bindings
        * @type Array
        * @private
        */
        this._bindings = [];
        /**
        * @property _prevParams
        * @type Any
        * @private
        */
        this._prevParams = null;
        /**
        * If Signal should keep record of previously dispatched parameters and
        * automatically execute listener during `add()`/`addOnce()` if Signal was
        * already dispatched before.
        * @type boolean
        */
        this.memorize = false;
        /**
        * @type boolean
        * @private
        */
        this._shouldPropagate = true;
        /**
        * If Signal is active and should broadcast events.
        * <p><strong>IMPORTANT:</strong> Setting this property during a dispatch will only affect the next dispatch, if you want to stop the propagation of a signal use `halt()` instead.</p>
        * @type boolean
        */
        this.active = true;
    }
    /**
    * @method validateListener
    * @param {Any} listener
    * @param {Any} fnName
    */
    Signal.prototype.validateListener = function (listener, fnName) {
        if (typeof listener !== 'function') {
            throw new Error('listener is a required param of {fn}() and should be a Function.'.replace('{fn}', fnName));
        }
    };
    /**
    * @param {Function} listener
    * @param {boolean} isOnce
    * @param {Object} [listenerContext]
    * @param {Number} [priority]
    * @return {SignalBinding}
    * @private
    */
    Signal.prototype._registerListener = function (listener, isOnce, listenerContext, priority) {
        var prevIndex = this._indexOfListener(listener, listenerContext);
        var binding;
        if (prevIndex !== -1) {
            binding = this._bindings[prevIndex];
            if (binding.isOnce() !== isOnce) {
                throw new Error('You cannot add' + (isOnce ? '' : 'Once') + '() then add' + (!isOnce ? '' : 'Once') + '() the same listener without removing the relationship first.');
            }
        }
        else {
            binding = new SignalBinding(this, listener, isOnce, listenerContext, priority);
            this._addBinding(binding);
        }
        if (this.memorize && this._prevParams) {
            binding.execute(this._prevParams);
        }
        return binding;
    };
    /**
    * @method _addBinding
    * @param {SignalBinding} binding
    * @private
    */
    Signal.prototype._addBinding = function (binding) {
        //simplified insertion sort
        var n = this._bindings.length;
        do {
            --n;
        } while (this._bindings[n] && binding.priority <= this._bindings[n].priority);
        this._bindings.splice(n + 1, 0, binding);
    };
    /**
    * @method _indexOfListener
    * @param {Function} listener
    * @return {number}
    * @private
    */
    Signal.prototype._indexOfListener = function (listener, context) {
        var n = this._bindings.length;
        var cur;
        while (n--) {
            cur = this._bindings[n];
            if (cur.getListener() === listener && cur.context === context) {
                return n;
            }
        }
        return -1;
    };
    /**
    * Check if listener was attached to Signal.
    * @param {Function} listener
    * @param {Object} [context]
    * @return {boolean} if Signal has the specified listener.
    */
    Signal.prototype.has = function (listener, context) {
        if (context === void 0) { context = null; }
        return this._indexOfListener(listener, context) !== -1;
    };
    /**
    * Add a listener to the signal.
    * @param {Function} listener Signal handler function.
    * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
    * @param {Number} [priority] The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0)
    * @return {SignalBinding} An Object representing the binding between the Signal and listener.
    */
    Signal.prototype.add = function (listener, listenerContext, priority) {
        if (listenerContext === void 0) { listenerContext = null; }
        if (priority === void 0) { priority = 0; }
        this.validateListener(listener, 'add');
        return this._registerListener(listener, false, listenerContext, priority);
    };
    /**
    * Add listener to the signal that should be removed after first execution (will be executed only once).
    * @param {Function} listener Signal handler function.
    * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
    * @param {Number} [priority] The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0)
    * @return {SignalBinding} An Object representing the binding between the Signal and listener.
    */
    Signal.prototype.addOnce = function (listener, listenerContext, priority) {
        if (listenerContext === void 0) { listenerContext = null; }
        if (priority === void 0) { priority = 0; }
        this.validateListener(listener, 'addOnce');
        return this._registerListener(listener, true, listenerContext, priority);
    };
    /**
    * Remove a single listener from the dispatch queue.
    * @param {Function} listener Handler function that should be removed.
    * @param {Object} [context] Execution context (since you can add the same handler multiple times if executing in a different context).
    * @return {Function} Listener handler function.
    */
    Signal.prototype.remove = function (listener, context) {
        if (context === void 0) { context = null; }
        this.validateListener(listener, 'remove');
        var i = this._indexOfListener(listener, context);
        if (i !== -1) {
            this._bindings[i]._destroy(); //no reason to a SignalBinding exist if it isn't attached to a signal
            this._bindings.splice(i, 1);
        }
        return listener;
    };
    /**
    * Remove all listeners from the Signal.
    */
    Signal.prototype.removeAll = function () {
        var n = this._bindings.length;
        while (n--) {
            this._bindings[n]._destroy();
        }
        this._bindings.length = 0;
    };
    /**
    * @return {number} Number of listeners attached to the Signal.
    */
    Signal.prototype.getNumListeners = function () {
        return this._bindings.length;
    };
    /**
    * Stop propagation of the event, blocking the dispatch to next listeners on the queue.
    * <p><strong>IMPORTANT:</strong> should be called only during signal dispatch, calling it before/after dispatch won't affect signal broadcast.</p>
    * @see Signal.prototype.disable
    */
    Signal.prototype.halt = function () {
        this._shouldPropagate = false;
    };
    /**
    * Dispatch/Broadcast Signal to all listeners added to the queue.
    * @param {...*} [params] Parameters that should be passed to each handler.
    */
    Signal.prototype.dispatch = function () {
        var paramsArr = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            paramsArr[_i - 0] = arguments[_i];
        }
        if (!this.active) {
            return;
        }
        var n = this._bindings.length;
        var bindings;
        if (this.memorize) {
            this._prevParams = paramsArr;
        }
        if (!n) {
            //should come after memorize
            return;
        }
        bindings = this._bindings.slice(0); //clone array in case add/remove items during dispatch
        this._shouldPropagate = true; //in case `halt` was called before dispatch or during the previous dispatch.
        //execute all callbacks until end of the list or until a callback returns `false` or stops propagation
        //reverse loop since listeners with higher priority will be added at the end of the list
        do {
            n--;
        } while (bindings[n] && this._shouldPropagate && bindings[n].execute(paramsArr) !== false);
    };
    /**
    * Forget memorized arguments.
    * @see Signal.memorize
    */
    Signal.prototype.forget = function () {
        this._prevParams = null;
    };
    /**
    * Remove all bindings from signal and destroy any reference to external objects (destroy Signal object).
    * <p><strong>IMPORTANT:</strong> calling any method on the signal instance after calling dispose will throw errors.</p>
    */
    Signal.prototype.dispose = function () {
        this.removeAll();
        delete this._bindings;
        delete this._prevParams;
    };
    /**
    * @return {string} String representation of the object.
    */
    Signal.prototype.toString = function () {
        return '[Signal active:' + this.active + ' numListeners:' + this.getNumListeners() + ']';
    };
    /**
    * Signals Version Number
    * @property VERSION
    * @type String
    * @const
    */
    Signal.VERSION = '1.0.0';
    return Signal;
})();
///<reference path="../interfaces/jquery/jquery.d.ts" />
///<reference path="../libs/Signal.ts" />
var OpIndexState = (function () {
    function OpIndexState() {
        var _this = this;
        this.onScoreChange = new Signal();
        this.onStateChange = new Signal();
        this.onReady = new Signal();
        this.onReset = new Signal();
        this.quizComplete = false;
        this.quizStarted = false;
        this.dataSRC = "/prototype/external/app/tribal/data/QuizData-en.json";
        this.quizState = 'unstarted'; // 'started', 'completed'
        this.persona = 'default';
        this.score = 0;
        this.dataHnd = function (e) {
            var response = e.target.responseText;
            _this.pData = JSON.parse(response);
            _this.build();
            _this.onReady.dispatch();
        };
    }
    OpIndexState.prototype.init = function (dsrc) {
        if (dsrc === void 0) { dsrc = null; }
        if (dsrc)
            this.dataSRC = dsrc;
        var req = new XMLHttpRequest();
        req.addEventListener("load", this.dataHnd);
        req.open("GET", this.dataSRC, true);
        req.send();
    };
    OpIndexState.prototype.getSetupData = function () {
        return this.pData;
    };
    OpIndexState.prototype.isCompleted = function () {
        return (this.quizState === "completed");
    };
    OpIndexState.prototype.reset = function () {
        this.areasInterestLabels = [];
        this.areaOrder = [];
        this.pScores = [];
        this.quizState = 'unstarted';
        this.persona = this.pData.persona_default || "default";
        this.areasInterest = JSON.parse(JSON.stringify(this.pData.personas[this.persona].area_order));
        this.score = 0;
        this.onReset.dispatch();
        delete this.pScores;
        this.pScores = new Array();
        localStorage.setItem('results', '');
        this.setStateOnBody();
    };
    OpIndexState.prototype.setQuizSelection = function (value) {
        // value will come in as an array?
        for (var i = 0; i < value.length; i++) {
            this.pScores[i] = (this.pScores[i] > 0) ? this.pScores[i] + value[i] : value[i];
        }
        this.quizStarted = true;
        this.quizState = "started";
        this.onStateChange.dispatch();
        this.setStateOnBody();
    };
    OpIndexState.prototype.calcResults = function () {
        this.quizState = "completed";
        this.calcPersona();
        this.calcScore();
        localStorage.setItem('results', this.getResultsForCookie());
        this.setStateOnBody();
    };
    OpIndexState.prototype.setPolarSelection = function (key, value) {
        var keys = this.areasInterest.map(function (area) {
            return area.area_id;
        });
        var ix = keys.indexOf(key);
        this.areasInterest[ix].polar_state = value;
        this.calcScore();
        localStorage.setItem('results', this.getResultsForCookie());
    };
    OpIndexState.prototype.getPersona = function () {
        return this.persona;
    };
    OpIndexState.prototype.getAreaOrder = function () {
        return this.areaOrder;
    };
    OpIndexState.prototype.getAreasInterestLabels = function () {
        return this.areasInterestLabels;
    };
    OpIndexState.prototype.getResultsForCookie = function () {
        var res = this.getResults();
        delete res.opIndex;
        return JSON.stringify(res);
    };
    OpIndexState.prototype.getResults = function () {
        return {
            quizState: this.quizState,
            persona: this.persona,
            score: this.score,
            areaOrder: this.areaOrder,
            areasInterestLabels: this.areasInterestLabels,
            areasInterestOrdered: this.areasInterest,
            tips: this.pData.tips[this.persona],
            pScores: this.pScores,
            opIndex: {
                instructions: this.getOpIndexInstructions(),
                downloadLabel: this.pData.op_index.instructions.download,
                restartLabel: this.pData.op_index.instructions.restart,
                viewLabel: this.pData.op_index.instructions.view,
                ctaCopy: this.pData.op_index.cta[this.quizState].copy,
                ctaLabel: this.pData.op_index.cta[this.quizState].label,
                scoreLabel: this.pData.op_index.score.label
            }
        };
    };
    OpIndexState.prototype.getOpIndexInstructions = function () {
        var inst = (this.score == 0 && this.quizState === 'completed') ? this.pData.op_index.instructions.zero : this.pData.op_index.instructions[this.quizState].replace(/{{opportunities available}}/g, this.pData.copy.numbers[this.score - 1]);
        return inst;
    };
    OpIndexState.prototype.getInterestedLabelsOnly = function () {
        var arr = new Array();
        //areasInterest
        for (var i = 0; i < this.areasInterest.length; i++) {
            if (this.areasInterest[i].polar_state == 0) {
                var id = this.areasInterest[i].area_id;
                arr.push(this.pData.area_labels[id]);
            }
        }
        return arr;
    };
    OpIndexState.prototype.getReportData = function () {
        var obj = {};
        var arr = new Array();
        var interest = new Array();
        for (var i = 0; i < this.areasInterest.length; i++) {
            if (this.areasInterest[i].polar_state == 0) {
                var id = this.areasInterest[i].area_id;
                interest.push(id);
                arr.push(this.pData.area_labels[id]);
            }
        }
        var tiplist = this.pData.tips[this.persona];
        var tips = new Array();
        var ids = new Array();
        var n = 0;
        var cnt = 0;
        var area;
        var lap = 0;
        while (cnt < 3 && lap < 3) {
            area = interest[n % interest.length];
            if (tiplist[area][lap]) {
                tips.push(tiplist[area][lap]);
                cnt++;
            }
            n++;
            lap = Math.floor(n / interest.length);
        }
        obj.areas = arr;
        obj.ids = interest;
        obj.numOps = arr.length;
        obj.tips = tips;
        return obj;
    };
    OpIndexState.prototype.calcPersona = function () {
        var persona;
        var max = this.pScores[0];
        var maxIndex = 0;
        for (var i = 1; i < this.pScores.length; i++) {
            if (this.pScores[i] > max) {
                maxIndex = i;
                max = this.pScores[i];
            }
        }
        persona = this.pData.persona_index[maxIndex];
        this.persona = persona;
        this.areasInterest = JSON.parse(JSON.stringify(this.pData.personas[this.persona].area_order));
    };
    OpIndexState.prototype.calcScore = function () {
        if (!this.persona)
            return;
        var newScore;
        var scoreUpdated;
        newScore = 0;
        this.areasInterest.forEach(function (area) {
            if (!area.polar_state)
                newScore++;
        }.bind(this));
        scoreUpdated = this.score !== newScore;
        this.score = newScore;
        this.areaOrder = this.pData.personas[this.persona].area_order;
        this.areasInterestLabels = this.areasInterest.map(function (area) {
            return this.pData.area_labels[area.area_id];
        }.bind(this));
        if (scoreUpdated) {
            this.onScoreChange.dispatch();
        }
    };
    OpIndexState.prototype.setStateOnBody = function () {
        $('body')[this.isCompleted() ? 'addClass' : 'removeClass']('quiz-complete');
        $('body')[this.isCompleted() ? 'removeClass' : 'addClass']('quiz-unstarted');
    };
    OpIndexState.prototype.build = function () {
        this.pScores = new Array();
        this.persona = this.pData.persona_default || "default";
        var res = localStorage.getItem('results');
        if (res) {
            res = JSON.parse(res);
            this.quizState = res.quizState;
            this.persona = res.persona;
            this.score = res.score;
            this.areaOrder = res.areaOrder;
            this.areasInterestLabels = res.areasInterestLabels;
            this.areasInterest = res.areasInterestOrdered;
            // this.pData.tips[this.persona] = res.tips;
            this.pScores = res.pScores;
        }
        this.setStateOnBody();
    };
    return OpIndexState;
})();
///<reference path="../interfaces/greensock/greensock.d.ts" />
var ui;
(function (ui) {
    var QuizProgress = (function () {
        function QuizProgress(el, num) {
            this.el = el;
            this.numItems = num;
            if (this.el == null)
                this.el = document.createElement("div");
            this.el.className = "progress";
            this.build();
        }
        QuizProgress.prototype.build = function () {
            this.el.style.opacity = "0";
            this.items = new Array();
            for (var i = 0; i < this.numItems; i++) {
                var dv = document.createElement("div");
                this.items[i] = new Digit(dv, (i + 1));
                this.el.appendChild(this.items[i].el);
            }
        };
        QuizProgress.prototype.update = function (n) {
            var m;
            for (var i = 0; i < this.numItems; i++) {
                if (i == n)
                    m = 1;
                else if (i < n)
                    m = 0;
                else
                    m = 2;
                this.items[i].setMode(m);
            }
        };
        QuizProgress.prototype.animIn = function (d, t) {
            if (d === void 0) { d = 0; }
            if (t === void 0) { t = 0.3; }
            TweenLite.to(this.el, t, { delay: d, opacity: "1" });
        };
        QuizProgress.prototype.animOut = function (d, t, oc) {
            if (d === void 0) { d = 0; }
            if (t === void 0) { t = 0.3; }
            if (oc === void 0) { oc = null; }
            TweenLite.to(this.el, t, { delay: d, opacity: "0", onComplete: oc });
        };
        return QuizProgress;
    })();
    ui.QuizProgress = QuizProgress;
    var Digit = (function () {
        function Digit(el, num) {
            this.el = el;
            this.num = num;
            this.el.className = "digit";
            this.build();
        }
        Digit.prototype.build = function () {
            this.el.innerHTML = this.num.toString();
        };
        Digit.prototype.setMode = function (n) {
            switch (n) {
                case 0:
                    this.el.className = "digit answered";
                    break;
                case 1:
                    this.el.className = "digit current";
                    break;
                case 2:
                    this.el.className = "digit";
                    break;
            }
        };
        return Digit;
    })();
})(ui || (ui = {}));
var utils;
(function (utils) {
    var Formatter = (function () {
        function Formatter() {
        }
        Formatter.killOrphans = function (s) {
            var str = s;
            var ind = s.lastIndexOf(" ");
            if (ind > 0)
                str = s.substr(0, ind) + "&nbsp;" + s.substr(ind + 1);
            return str;
        };
        Formatter.addZeros = function (s, num_zero) {
            if (num_zero === void 0) { num_zero = 4; }
            var r = s;
            while (r.length < num_zero) {
                r = "0" + r;
            }
            return r;
        };
        return Formatter;
    })();
    utils.Formatter = Formatter;
})(utils || (utils = {}));
///<reference path="../utils/Formatter.ts" />
///<reference path="../interfaces/greensock/greensock.d.ts" />
var ui;
(function (ui) {
    var QuizQuestion = (function () {
        function QuizQuestion(el, dat) {
            var _this = this;
            this.destroy = function () {
                _this.el.parentNode.removeChild(_this.el);
                delete (_this.el);
            };
            this.el = el;
            this.qDat = dat;
            if (this.el == null)
                this.el = document.createElement("div");
            this.el.className = "question";
            this.build();
        }
        QuizQuestion.prototype.build = function () {
            this.qDiv = document.createElement("div");
            this.iconDiv = document.createElement("div");
            this.elCell = document.createElement("div");
            this.elCell.className = "cell";
            this.qDiv.style.overflow = "hidden";
            this.qp = document.createElement("p");
            this.qp.innerHTML = utils.Formatter.killOrphans(this.qDat.question);
            this.qDiv.appendChild(this.qp);
            this.iconDiv.className = "question-icon";
            this.iconDiv.style.backgroundImage = "url(" + this.qDat.image + ")"; //"#d6f4d1";	// replace with bg image from data
            this.elCell.appendChild(this.iconDiv);
            this.elCell.appendChild(this.qDiv);
            this.el.appendChild(this.elCell);
            this.preAnimState();
        };
        QuizQuestion.prototype.preAnimState = function () {
            TweenLite.to(this.qp, 0, { opacity: 0, y: "-100" });
            TweenLite.to(this.iconDiv, 0, { scale: "0" });
            this.el.style.opacity = "0";
        };
        QuizQuestion.prototype.animIn = function (d, t) {
            if (d === void 0) { d = 0.1; }
            if (t === void 0) { t = 0.6; }
            TweenLite.to(this.el, t, { delay: d, opacity: 1, ease: Sine.easeOut });
            TweenLite.to(this.iconDiv, t, { delay: d, scale: "1", ease: Sine.easeOut });
            TweenLite.to(this.qp, t, { delay: d, opacity: 1, y: "0", ease: Sine.easeOut });
        };
        QuizQuestion.prototype.animOut = function (d, t) {
            if (d === void 0) { d = 0; }
            if (t === void 0) { t = 0.3; }
            TweenLite.to(this.el, t, { delay: d, opacity: 0, ease: Sine.easeIn, onComplete: this.destroy });
            TweenLite.to(this.iconDiv, t - 0.1, { delay: d, scale: "0", ease: Sine.easeIn });
            TweenLite.to(this.qp, t, { delay: d, opacity: 0, y: "100", ease: Sine.easeIn });
        };
        return QuizQuestion;
    })();
    ui.QuizQuestion = QuizQuestion;
})(ui || (ui = {}));
///<reference path="../utils/Formatter.ts" />
var ui;
(function (ui) {
    var QuizSummary = (function () {
        function QuizSummary(el, sdat, dat) {
            var _this = this;
            if (el === void 0) { el = null; }
            if (sdat === void 0) { sdat = null; }
            if (dat === void 0) { dat = null; }
            this.onInteraction = new Signal();
            // handlers ---------------------------
            this.handleContact = function (e) {
                _this.onInteraction.dispatch("contact");
            };
            this.handleDownload = function (e) {
                _this.onInteraction.dispatch("download");
            };
            this.handleViewReport = function (e) {
                _this.onInteraction.dispatch("viewreport");
            };
            this.handleRestart = function (e) {
                _this.removeEvents();
                _this.onInteraction.dispatch("restart");
            };
            this.el = el;
            this.setupData = sdat;
            this.sData = dat;
            if (this.el == null)
                this.el = document.createElement("div");
            this.el.className = "quiz-summary";
            this.build();
        }
        QuizSummary.prototype.build = function () {
            this.el.style.opacity = "0";
            this.elContent = document.createElement("div");
            this.elContent.className = "content";
            this.elHeader = document.createElement("div");
            this.elHeader.className = "thanks";
            this.elHeader.innerHTML = this.setupData.copy.summary.header;
            this.elSummary = document.createElement("div");
            this.elSummary.className = "summary";
            this.elCount = document.createElement("div");
            this.elCount.className = "count";
            this.elCountScore = document.createElement("span");
            this.elCountScore.className = "opportunity-score three-d";
            this.elCountLbl = document.createElement("span");
            this.elCountLbl.className = "lbl";
            this.elCount.appendChild(this.elCountScore);
            this.elCount.appendChild(this.elCountLbl);
            this.elCountLbl.innerHTML = this.setupData.copy.opportunity_num;
            this.el.appendChild(this.elHeader);
            this.el.appendChild(this.elContent);
            this.elContent.appendChild(this.elCount);
            this.elContent.appendChild(this.elSummary);
            this.sumTitle = document.createElement("h1");
            this.sumBody = document.createElement("p");
            this.elSummary.appendChild(this.sumTitle);
            this.elSummary.appendChild(this.sumBody);
            this.addButtons();
            this.updateContent();
        };
        QuizSummary.prototype.addButtons = function () {
            this.elBtnContact = document.createElement('div');
            this.elBtnDownload = document.createElement('div');
            this.elBtnReport = document.createElement('div');
            this.elBtnRestart = document.createElement('div');
            this.elBtnContact.className = "outline-btn";
            this.elBtnDownload.className = "underline-link stacked";
            this.elBtnReport.className = "underline-link stacked";
            this.elBtnRestart.className = "underline-link stacked";
            this.elBtnContact.style.marginBottom = "25px";
            this.elBtnContact.innerHTML = this.setupData.copy.btn_contact;
            this.elBtnDownload.innerHTML = this.setupData.copy.btn_download;
            this.elBtnReport.innerHTML = this.setupData.copy.btn_view;
            this.elBtnRestart.innerHTML = this.setupData.copy.btn_restart;
            this.elSummary.appendChild(this.elBtnContact);
            this.elSummary.appendChild(this.elBtnReport);
            this.elSummary.appendChild(this.elBtnDownload);
            this.elSummary.appendChild(this.elBtnRestart);
            this.elBtnContact.addEventListener("click", this.handleContact);
            this.elBtnReport.addEventListener("click", this.handleViewReport);
            this.elBtnDownload.addEventListener("click", this.handleDownload);
            this.elBtnRestart.addEventListener("click", this.handleRestart);
        };
        QuizSummary.prototype.updateContent = function () {
            this.numOps = this.sData.length;
            this.elCountScore.innerHTML = this.sData.length.toString();
            var tit = "";
            var sp = "";
            var st = "";
            var txt_and = (window['LANG'].toLowerCase() == "fr") ? " et&nbsp;" : " &&nbsp;";
            for (var i = 0; i < this.numOps; i++) {
                st = this.sData[i];
                if (i > 0) {
                    if (window['LANG'].toLowerCase() == "fr")
                        st = st.toLowerCase();
                    sp = (i < (this.numOps - 1)) ? ", " : txt_and;
                }
                tit += sp + utils.Formatter.killOrphans(st);
            }
            var bs = (this.numOps > 0) ? this.setupData.copy.summary.body : this.setupData.copy.summary.body_zero;
            if (this.numOps > 0) {
                bs = bs.replace("[NUM]", this.setupData.copy.numbers[(this.numOps - 1)]);
                this.elBtnDownload.style.display = "";
                this.elBtnReport.style.display = "";
                this.elCountScore.style.display = "";
                this.elCountLbl.style.display = "";
                this.sumTitle.style.display = "";
            }
            else {
                this.elBtnDownload.style.display = "none";
                this.elBtnReport.style.display = "none";
                this.elCountScore.style.display = "none";
                this.elCountLbl.style.display = "none";
                this.sumTitle.style.display = "none";
            }
            this.sumTitle.innerHTML = tit;
            this.sumBody.innerHTML = utils.Formatter.killOrphans(bs);
        };
        QuizSummary.prototype.removeEvents = function () {
            if (this.elBtnContact)
                this.elBtnContact.removeEventListener("click", this.handleContact);
            if (this.elBtnReport)
                this.elBtnReport.removeEventListener("click", this.handleViewReport);
            if (this.elBtnDownload)
                this.elBtnDownload.removeEventListener("click", this.handleDownload);
            if (this.elBtnRestart)
                this.elBtnRestart.removeEventListener("click", this.handleRestart);
        };
        // public -----------------------------
        QuizSummary.prototype.animIn = function (d, t, oc) {
            if (d === void 0) { d = 0; }
            if (t === void 0) { t = 1; }
            if (oc === void 0) { oc = null; }
            TweenLite.to(this.el, t, { delay: d, opacity: "1", onComplete: oc });
        };
        QuizSummary.prototype.animOut = function (d, t, oc) {
            if (d === void 0) { d = 0; }
            if (t === void 0) { t = 0.4; }
            if (oc === void 0) { oc = null; }
            TweenLite.to(this.el, t, { delay: d, opacity: "0", onComplete: oc });
        };
        /*
            called when changes to the Opportunity score need to reflect back
            on the Quiz Summary. ie. Score value & title.
        */
        QuizSummary.prototype.update = function (dat) {
            console.log("[QuizSummary] update");
            this.sData = dat;
            this.updateContent();
        };
        return QuizSummary;
    })();
    ui.QuizSummary = QuizSummary;
})(ui || (ui = {}));
///<reference path="../interfaces/greensock/greensock.d.ts" />
var ui;
(function (ui) {
    var QuizChoice = (function () {
        function QuizChoice(el, idx, txt) {
            var _this = this;
            this.preAnimState = function () {
                _this.elRing.style.opacity = "0";
                //this.elLabelHold.style.width = "0";
            };
            this.animIn = function (d) {
                if (d === void 0) { d = 0; }
                TweenLite.to(_this.elRing, 0.3, { delay: d, opacity: "1" });
                TweenLite.to(_this.elTxt, 0.3, { delay: d, x: 0 });
            };
            this.destroy = function (oc) {
                if (oc === void 0) { oc = null; }
                _this.el.parentNode.removeChild(_this.el);
                delete (_this.el);
                if (oc)
                    oc();
            };
            this.el = el;
            this.idNum = idx;
            this.txt = txt;
            if (this.el == null)
                this.el = document.createElement("div");
            this.el.className = "quiz-choice";
            this.el.id = "c_" + idx;
            this.build();
        }
        QuizChoice.prototype.build = function () {
            this.elIcon = document.createElement("div");
            this.elLabelHold = document.createElement("div");
            this.elLabel = document.createElement("div");
            this.elRing = document.createElement("div");
            this.elCheckmark = document.createElement("div");
            this.elLine = document.createElement("div");
            this.elTxt = document.createElement("div");
            this.elIcon.className = "choice-icon";
            this.elLabelHold.className = "choice-label-hold";
            this.elLabel.className = "choice-label";
            this.elRing.className = "ring";
            this.elCheckmark.className = "checkmark";
            this.elLine.className = "choice-underline";
            this.elTxt.className = "choice-txt";
            var hl = document.createElement("div");
            hl.className = "highlight";
            var p = document.createElement("span");
            p.innerHTML = this.txt;
            //this.elTxt.innerHTML = this.txt;
            this.elLine.appendChild(hl);
            this.elTxt.appendChild(p);
            this.elLabel.appendChild(this.elTxt);
            this.elTxt.appendChild(this.elLine);
            this.elLabelHold.appendChild(this.elLabel);
            this.elIcon.appendChild(this.elRing);
            this.elIcon.appendChild(this.elCheckmark);
            this.el.appendChild(this.elIcon);
            this.el.appendChild(this.elLabelHold);
            //console.log( this.elTxt.offsetWidth  + " is this when does why" );
            this.preAnimState();
        };
        QuizChoice.prototype.getTextWidth = function () {
            return this.elLabelHold.clientWidth;
        };
        QuizChoice.prototype.setTextWidth = function (n) {
            //console.log("trying to set width to " + n);
            this.elLabelHold.style.width = n.toString() + "px";
        };
        QuizChoice.prototype.disableCursor = function () {
            this.el.classList.add("disabled");
        };
        QuizChoice.prototype.showSelected = function () {
            this.el.classList.add("selected");
        };
        QuizChoice.prototype.animOut = function (d, cb) {
            //TweenLite.to( this.el, 0.3, { opacity:"0", onComplete:this.destroy, onCompleteParams:[cb] } );
            if (d === void 0) { d = 0; }
            if (cb === void 0) { cb = null; }
            TweenLite.to(this.elRing, 0.2, { delay: d, opacity: "0", onComplete: this.destroy, onCompleteParams: [cb] });
            TweenLite.to(this.elTxt, 0.3, { delay: d, x: "100%", ease: Sine.easeIn });
            TweenLite.to(this.elCheckmark, 0.1, { delay: d, opacity: "0", ease: Sine.easeIn });
            //this.destroy();
        };
        return QuizChoice;
    })();
    ui.QuizChoice = QuizChoice;
})(ui || (ui = {}));
///<reference path="QuizChoice.ts" />
var ui;
(function (ui) {
    var QuizChoiceSelector = (function () {
        function QuizChoiceSelector(el, arr) {
            var _this = this;
            this.onSelect = new Signal();
            // events ------------------------------
            this.handleClick = function (e) {
                var tar = e.currentTarget;
                var num = tar.id.substr(2, tar.id.length);
                _this.onSelect.dispatch(num);
            };
            this.handleResize = function (e) {
                if (e === void 0) { e = null; }
                var areaWidth = _this.el.clientWidth;
                var p = _this.choices[0].el;
                if (p) {
                    var style = p.currentStyle || window.getComputedStyle(p);
                    var ww = _this.choices[0].el.clientWidth + parseInt(style.marginLeft) + parseInt(style.marginRight); // width of 1 unit. 
                    var npl = _this.choices.length;
                    for (var i = 0; i < _this.choices.length; i++)
                        _this.choices[i].el.classList.remove("cl");
                    if (areaWidth < Math.floor(npl / 2) * ww) {
                        for (var j = 0; j < _this.choices.length; j++) {
                            _this.choices[j].el.classList.add("cl");
                        }
                        _this.cc.style.width = ww + "px";
                    }
                    else if (areaWidth < npl * ww) {
                        // if 4 across is larger than area width
                        var bp = Math.ceil(npl / 2);
                        _this.choices[bp].el.classList.add("cl");
                        _this.cc.style.width = (ww * bp) + "px";
                    }
                    else {
                        // else default to 4 across
                        _this.cc.style.width = (npl * ww) + "px";
                    }
                }
            };
            this.el = el;
            this.arr = arr;
            if (this.el == null)
                this.el = document.createElement("div");
            this.el.className = "quiz-choice-selector";
            this.cc = document.createElement("div");
            this.cc.className = "c-break";
            this.el.appendChild(this.cc);
            this.build();
        }
        QuizChoiceSelector.prototype.build = function () {
            this.currentChoice = -1;
            this.choices = new Array();
            this.widest = 0;
            for (var i = 0; i < this.arr.length; i++) {
                this.choices[i] = new ui.QuizChoice(null, i, this.arr[i].answer);
                this.cc.appendChild(this.choices[i].el);
                this.widest = Math.max(this.widest, this.choices[i].getTextWidth());
                this.choices[i].el.addEventListener("click", this.handleClick);
                this.choices[i].animIn(i * 0.15);
            }
            for (var j = 0; j < this.choices.length; j++) {
                this.choices[j].setTextWidth(this.widest);
            }
            window.addEventListener("resize", this.handleResize);
            this.handleResize();
        };
        // public ------------------------------
        QuizChoiceSelector.prototype.cmAnswer = function (n) {
            for (var i = 0; i < this.arr.length; i++) {
                this.choices[i].el.removeEventListener("click", this.handleClick);
                this.choices[i].disableCursor();
            }
            this.choices[n].showSelected();
        };
        QuizChoiceSelector.prototype.update = function (arr) {
            this.arr = arr;
            this.build();
        };
        QuizChoiceSelector.prototype.animIn = function () {
        };
        QuizChoiceSelector.prototype.animOut = function (oc) {
            if (oc === void 0) { oc = null; }
            var n = this.arr.length;
            for (var i = 0; i < n; i++) {
                this.choices[i].animOut(0, (i == (n - 1)) ? oc : null);
            }
        };
        return QuizChoiceSelector;
    })();
    ui.QuizChoiceSelector = QuizChoiceSelector;
})(ui || (ui = {}));
var ui;
(function (ui) {
    var ButtonBackNext = (function () {
        function ButtonBackNext(el, dir) {
            if (dir === void 0) { dir = "back"; }
            this.el = el;
            this.dir = dir;
            if (this.el == null)
                this.el = document.createElement("div");
            this.build();
        }
        ButtonBackNext.prototype.build = function () {
            this.el.className = "backnext " + this.dir;
            this.svgID = "arrow-" + this.dir;
            this.drawArrow();
        };
        ButtonBackNext.prototype.drawArrow = function () {
            var pth = (this.dir == ui.ButtonBackNext.DIR_BACK) ? "M 26.85 2.1 L 24.75 0 0 24.75 24.75 49.5 26.85 47.4 4.2 24.75 26.85 2.1 Z" : "M 2.1 0 L 0 2.1 22.65 24.75 0 47.4 2.1 49.5 26.85 24.75 2.1 0 Z";
            var elSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            var elPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            elSVG.setAttributeNS(null, "viewBox", "0 0 27 50");
            elSVG.setAttributeNS(null, "width", "27");
            elSVG.setAttributeNS(null, "height", "50");
            elPath.setAttributeNS(null, "class", "arrow-img");
            elPath.setAttributeNS(null, "id", this.svgID);
            elPath.setAttributeNS(null, "fill", "#86E6C1");
            elPath.setAttributeNS(null, "stroke", "none");
            elPath.setAttributeNS(null, "d", pth);
            elSVG.appendChild(elPath);
            this.el.appendChild(elSVG);
        };
        ButtonBackNext.DIR_BACK = "back";
        ButtonBackNext.DIR_NEXT = "next";
        return ButtonBackNext;
    })();
    ui.ButtonBackNext = ButtonBackNext;
})(ui || (ui = {}));
///<reference path="../ui/QuizProgress.ts" />
///<reference path="../ui/QuizQuestion.ts" />
///<reference path="../ui/QuizSummary.ts" />
///<reference path="../ui/QuizChoiceSelector.ts" />
///<reference path="../ui/ButtonBackNext.ts" />
///<reference path="../interfaces/greensock/greensock.d.ts" />
var Quiz = (function () {
    function Quiz(el, dat) {
        var _this = this;
        this.onRestart = new Signal();
        this.onSubmit = new Signal();
        this.onComplete = new Signal();
        this.onContact = new Signal();
        this.onDownload = new Signal();
        this.onViewReport = new Signal();
        this.build = function (comp) {
            if (comp === void 0) { comp = false; }
            _this.currentQuestion = 0;
            _this.setupHelp(comp);
            _this.numQ = _this.setupData.questions.length;
            _this.divPH = document.createElement("div");
            _this.divPH.className = "progress-holder";
            var divProgress = document.createElement("div");
            _this.qProgress = new ui.QuizProgress(divProgress, _this.numQ);
            _this.el.appendChild(_this.divPH);
            _this.divPH.appendChild(_this.qProgress.el);
            _this.divQuestion = document.createElement("div");
            _this.divQuestion.className = "question-holder";
            _this.el.appendChild(_this.divQuestion);
            _this.divAnswers = document.createElement("div");
            _this.el.appendChild(_this.divAnswers);
            var qs = new Array();
            for (var i = 0; i < _this.setupData.questions.length; i++) {
                qs[i] = _this.setupData.questions[i].question;
            }
            if (!comp) {
                _this.qProgress.animIn();
                _this.changeQuestion(_this.currentQuestion);
            }
            else {
                _this.quizComplete(0);
            }
        };
        this.continueNextQ = function () {
            if (_this.quizQuestion)
                delete _this.quizQuestion;
            if (_this.currentQuestion < (_this.numQ)) {
                _this.quizQuestion = new ui.QuizQuestion(null, _this.setupData.questions[_this.currentQuestion]);
                _this.divQuestion.appendChild(_this.quizQuestion.el);
                _this.quizQuestion.animIn();
                _this.createChoices();
            }
            else {
                _this.quizComplete();
            }
        };
        this.helpOff = function () {
            _this.btnHelp.classList.remove("on");
            _this.modalHelp.classList.remove("on");
            _this.helpIsOn = false;
        };
        this.animOutComplete = function () {
            _this.el.removeChild(_this.divPH);
            _this.el.removeChild(_this.divQuestion);
            _this.el.removeChild(_this.divAnswers);
            _this.onComplete.dispatch();
        };
        this.restartComplete = function () {
            _this.summary.onInteraction.remove(_this.handleInteraction);
            _this.el.removeChild(_this.summary.el);
            delete _this.summary;
            _this.el.appendChild(_this.divPH);
            _this.el.appendChild(_this.divQuestion);
            _this.el.appendChild(_this.divAnswers);
            _this.qProgress.animIn();
            _this.changeQuestion(0);
        };
        // handlers ------------------
        this.toggleHelp = function (e) {
            _this.btnHelp.classList.toggle("on");
            _this.modalHelp.classList.toggle("on");
            _this.helpIsOn = _this.modalHelp.classList.contains("on");
        };
        this.handleInteraction = function (value) {
            switch (value) {
                case "contact":
                    igTrack('QUIZ_SUMMARY_CTA', 'OS_Contact_An_Advisor');
                    _this.onContact.dispatch();
                    break;
                case "download":
                    igTrack('QUIZ_SUMMARY_CTA', 'OS_Download_Your_Report');
                    _this.onDownload.dispatch();
                    break;
                case "viewreport":
                    igTrack('QUIZ_SUMMARY_CTA', 'OS_View_Your_Report');
                    _this.onViewReport.dispatch();
                    break;
                case "restart":
                    igTrack('QUIZ_SUMMARY_CTA', 'OS_Retake_The_Quiz');
                    _this.onRestart.dispatch();
                    // this.restartQuiz();
                    break;
            }
        };
        this.handleAnswer = function (num) {
            if (_this.helpIsOn)
                _this.helpOff();
            if (_this.currentQuestion === 0) {
                igTrack('QUIZ_START');
            }
            igTrack('QUIZ_PROGRESS', _this.currentQuestion + 1);
            igTrack('QUIZ_ANSWER', _this.currentQuestion + 1, num);
            _this.choices.cmAnswer(num);
            var ans = _this.setupData.questions[_this.currentQuestion].answers[num].val;
            _this.onSubmit.dispatch(ans);
            TweenLite.delayedCall(1, _this.handleNext);
        };
        this.handleNext = function (e) {
            if (e === void 0) { e = null; }
            if (e)
                e.preventDefault();
            var n = _this.currentQuestion + 1;
            _this.changeQuestion(n);
        };
        this.handleBack = function (e) {
            if (e === void 0) { e = null; }
            if (e)
                e.preventDefault();
            var n = Math.max(_this.currentQuestion - 1, 0);
            _this.changeQuestion(n);
        };
        this.el = el;
        this.setupData = dat;
        //this.build(comp);
    }
    Quiz.prototype.setupHelp = function (comp) {
        if (comp === void 0) { comp = false; }
        this.btnHelp = document.querySelector('.help-icon');
        this.modalHelp = document.querySelector('#quiz-help-modal');
        this.btnCloseHelp = document.querySelector('#quiz-help-btn-close');
        this.helpIsOn = this.modalHelp.classList.contains("on");
        if (this.helpIsOn && comp)
            this.helpOff();
        this.btnHelp.addEventListener("click", this.toggleHelp);
        this.btnCloseHelp.addEventListener("click", this.helpOff);
    };
    Quiz.prototype.createChoices = function () {
        console.log("[Quiz] createChoices");
        var arr = new Array();
        var sd = this.setupData.questions[this.currentQuestion].answers;
        for (var i = 0; i < sd.length; i++) {
            arr[i] = sd[i];
        }
        if (!this.choices) {
            this.choices = new ui.QuizChoiceSelector(this.divAnswers, arr);
            //this.choices.el.addEventListener("on-select", this.handleAnswer);
            this.choices.onSelect.add(this.handleAnswer);
        }
        else {
            this.choices.update(arr);
        }
    };
    Quiz.prototype.changeQuestion = function (n) {
        this.currentQuestion = n;
        this.qProgress.update(n);
        if (this.quizQuestion) {
            this.quizQuestion.animOut();
            this.choices.animOut(this.continueNextQ);
        }
        else
            this.continueNextQ();
        // update question holder
        // update answer holder
    };
    Quiz.prototype.quizComplete = function (t) {
        if (t === void 0) { t = 0.3; }
        this.qProgress.animOut(0, t, this.animOutComplete);
    };
    // public --------------------
    Quiz.prototype.restartQuiz = function () {
        // restart the quiz
        if (this.summary) {
            this.summary.animOut(0, 0.4, this.restartComplete);
        }
    };
    Quiz.prototype.showSummary = function (dat) {
        // pass in summary data?
        if (!this.summary) {
            this.summary = new ui.QuizSummary(null, this.setupData, dat);
            this.summary.onInteraction.add(this.handleInteraction);
            this.el.appendChild(this.summary.el);
            this.summary.animIn();
        }
        else {
            this.summary.update(dat);
        }
    };
    return Quiz;
})();
///<reference path="../libs/Signal.ts" />
var PolarSelectOption = (function () {
    function PolarSelectOption(el) {
        this.onPolarSelect = new Signal();
        this.el = el;
        this.build();
    }
    PolarSelectOption.prototype.setSelected = function (doSelect) {
        var isSelected = this.el.classList.contains('selected');
        if (isSelected !== doSelect) {
            this.el.classList[doSelect ? 'add' : 'remove']('selected');
        }
    };
    PolarSelectOption.prototype.build = function () {
        this.el.addEventListener('click', this.onPolarSelect.dispatch.bind(this.onPolarSelect, this));
    };
    return PolarSelectOption;
})();
///<reference path="../libs/Signal.ts" />
///<reference path="./PolarSelectOption.ts" />
var PolarSelect = (function () {
    function PolarSelect(el, id) {
        var _this = this;
        this.onPolarSelect = new Signal();
        this.selectHnd = function (target) {
            _this.onPolarSelect.dispatch(_this.id, target === _this.optYes ? 1 : 0);
        };
        this.el = el;
        this.id = id;
        this.build();
    }
    PolarSelect.prototype.setSelectionState = function (val) {
        this.optYes.setSelected(val === 1);
        this.optNo.setSelected(val === 0);
    };
    PolarSelect.prototype.build = function () {
        this.optYes = new PolarSelectOption(this.el.querySelector('.yes-no--yes'));
        this.optYes.onPolarSelect.add(this.selectHnd);
        this.optNo = new PolarSelectOption(this.el.querySelector('.yes-no--no'));
        this.optNo.onPolarSelect.add(this.selectHnd);
    };
    return PolarSelect;
})();
///<reference path="../interfaces/jquery/jquery.d.ts" />
///<reference path="../interfaces/slick/slick.d.ts" />
///<reference path="../libs/Signal.ts" />
///<reference path="../ui/PolarSelect.ts" />
var Area = (function () {
    function Area(el) {
        this.slickOpts = {
            dots: true,
            arrows: true,
            prevArrow: '<div class="line-arrow line-arrow--left"></div>',
            nextArrow: '<div class="line-arrow line-arrow--right"></div>'
        };
        this.onPolarSelect = new Signal();
        this.el = el;
        this.tips = this.el.querySelector('.tips .slick-wrap');
        this.ps = new PolarSelect(this.el.querySelector('.yes-no'), this.el.getAttribute('data-areaId'));
        this.ps.onPolarSelect.add(this.onPolarSelect.dispatch.bind(this.onPolarSelect));
        this.elPolar = this.el.querySelector('.yes-no');
        this.elDYK = this.el.querySelector('.did-you-know');
        this.build();
    }
    Area.prototype.showPolar = function () {
        $(this.elDYK).removeClass('solo');
        $(this.elPolar).show();
    };
    Area.prototype.hidePolar = function () {
        $(this.elDYK).addClass('solo');
        $(this.elPolar).hide();
    };
    Area.prototype.setTips = function (tips) {
        if (this.$slick) {
            this.$slick.slick('unslick');
            this.$slick = null;
        }
        var container = this.tips;
        var oldtips = $(container).find('> div:not(.line-arrow)');
        if (oldtips) {
            oldtips = [].slice.call(oldtips);
            oldtips.forEach(function (tip) {
                container.removeChild(tip);
            });
        }
        tips.forEach(function (tip) {
            var tipEl = document.createElement('div');
            tipEl.innerHTML = "<div><p>{{TIP}}</p></div>".replace(/{{TIP}}/g, tip);
            container.appendChild(tipEl);
        }.bind(this));
        this.$slick = $(this.tips).slick(this.slickOpts);
    };
    Area.prototype.getPolarCtl = function () {
        return this.ps;
    };
    Area.prototype.initSlick = function () {
    };
    Area.prototype.build = function () {
    };
    return Area;
})();
///<reference path="../interfaces/jquery/jquery.d.ts" />
///<reference path="Area.ts" />
///<reference path="../libs/Signal.ts" />
var Areas = (function () {
    function Areas(el) {
        this.areas = {};
        this.curPersona = 'default';
        this.onPolarSelect = new Signal();
        this.el = el;
        this.el.setAttribute('data-persona', 'default');
        this.build();
    }
    Areas.prototype.initTips = function (tips) {
    };
    Areas.prototype.reset = function (d) {
        var areas = [].slice.call(this.el.querySelectorAll('.area'));
        areas.forEach(function (area) {
            $(area).removeClass('opportunity');
        }.bind(this));
        this.update(d, true);
    };
    Areas.prototype.update = function (d, isReset) {
        if (isReset === void 0) { isReset = false; }
        if (!isReset)
            this.updatePolar(d);
        var areas = [].slice.call(this.el.querySelectorAll('.area'));
        areas.forEach(function (area) {
            var id = area.getAttribute('data-areaId');
            this.areas[id].setTips(d.tips[id]);
            if (d.quizState === 'completed') {
                this.areas[id].showPolar();
            }
            else {
                this.areas[id].hidePolar();
            }
        }.bind(this));
        if (d.areasInterestOrdered) {
            this.el.setAttribute('data-persona', d.persona);
            var container = this.el.querySelector('.accordion.container');
            d.areasInterestOrdered.forEach(function (area) {
                var selector = '[data-areaId={{area}}]'.replace(/{{area}}/g, area.area_id);
                container.appendChild(this.el.querySelector(selector));
            }.bind(this));
        }
    };
    Areas.prototype.updatePolar = function (d) {
        if (d.areasInterestOrdered) {
            d.areasInterestOrdered.forEach(function (area) {
                this.areas[area.area_id].getPolarCtl().setSelectionState(area.polar_state);
                var selector = '[data-areaId={{area}}]'.replace(/{{area}}/g, area.area_id);
                $(selector)[area.polar_state === 1 ? 'removeClass' : 'addClass']('opportunity');
            }.bind(this));
        }
    };
    Areas.prototype.build = function () {
        var areas = [].slice.call(this.el.querySelectorAll('.area'));
        areas.forEach(function (area) {
            var areaCtl = new Area(area);
            areaCtl.onPolarSelect.add(this.onPolarSelect.dispatch.bind(this.onPolarSelect));
            this.areas[area.getAttribute('data-areaId')] = areaCtl;
        }.bind(this));
        // this.$accordionCtl = $(this.el.querySelector('.accordion'));
        // this.$accordionCtl.on('toggled',  function(e){
        //     console.log(
        //         'toggled has active:', e, arguments,
        //         $(e.target).hasClass('active')
        //     )
        // })
    };
    return Areas;
})();
///<reference path="../interfaces/greensock/greensock.d.ts" />
///<reference path="../interfaces/jquery/jquery.d.ts" />
///<reference path="../interfaces/Scrollman.d.ts" />
var OpIndex = (function () {
    function OpIndex(el) {
        var _this = this;
        this.positionState = 'relative';
        this.visibilityState = 'closed';
        this.visibilityOffset = 0;
        this.transitionTimeout = null;
        this.floating = false;
        this.onViewReport = new Signal();
        this.onRestart = new Signal();
        this.onDownloadReport = new Signal();
        this.onContact = new Signal();
        this.prevScroll = 0;
        this.scrollDirection = 0;
        this.userToggled = false;
        this.isSML_VP = false;
        this.initPos = function () {
            _this.isSML_VP = _this.$win.width() < 768;
            if (_this.isSML_VP) {
                $(_this.el.nextElementSibling).css({ marginTop: 0 });
            }
            _this.$el.removeClass('floating');
            _this.scrollTg = _this.$el.offset().top - _this.$win.height();
            _this.setDisplayState();
        };
        this.scrollHnd = function () {
            _this.setDisplayState();
            _this.scrollDirection = _this.prevScroll < _this.$win.scrollTop() ? 1 : 0;
            _this.prevScroll = _this.$win.scrollTop();
            if (!_this.userToggled) {
                if ((_this.scrollDirection === 1) && (_this.visibilityState === 'collapsed')) {
                    // check scrollTop of areas
                    if (_this.prevScroll > _this.$areas.offset().top) {
                        _this.open();
                    }
                }
                else if ((_this.scrollDirection === 0) && (_this.visibilityState === 'expanded')) {
                    // check scrollTop of areas
                    if (_this.prevScroll < (_this.$areas.offset().top - _this.$win.height() / 2)) {
                        _this.collapse();
                    }
                }
            }
        };
        this.setDisplayState = function (force) {
            if (force === void 0) { force = false; }
            if (_this.isSML_VP)
                return;
            if (_this.$win.scrollTop() < (-_this.$win.height() + _this.$about.offset().top + _this.$about.outerHeight() + _this.visibilityOffset)) {
                if (!_this.$el.hasClass('floating')) {
                    _this.$el.addClass('floating');
                }
                ;
                if (!_this.$el.hasClass(_this.visibilityState)) {
                    _this.$el.addClass(_this.visibilityState);
                }
                ;
                var toRemove = 'closed expanded collapsed'.replace(_this.visibilityState, '');
                _this.$el.removeClass(toRemove);
                if (_this.floating === false) {
                    _this.floating = true;
                    if (_this.transitionTimeout) {
                        clearTimeout(_this.transitionTimeout);
                        _this.transitionTimeout = null;
                    }
                    _this.transitionTimeout = setTimeout(function () {
                        this.$el.addClass('do-transition');
                    }.bind(_this), 250);
                }
                $(_this.el.nextElementSibling).css({
                    marginTop: _this.$el.outerHeight()
                });
            }
            else {
                if (_this.transitionTimeout) {
                    clearTimeout(_this.transitionTimeout);
                    _this.transitionTimeout = null;
                }
                _this.floating = false;
                _this.$el
                    .removeClass('do-transition')
                    .removeClass('floating');
                $(_this.el.nextElementSibling).css({
                    marginTop: 0
                });
            }
            _this.$el.css({
                bottom: -_this.$el.outerHeight()
            });
            // this.$el.css({
            //     top: 'calc(100vh + '+ this.$win.scrollTop() +'px)'
            // });
        };
        this.ctaHnd = function (e) {
            e.preventDefault();
            var curLoc = window.location.pathname.split('/');
            if (_this.quizStateCache !== 'completed') {
                if (document.querySelector("#quiz")) {
                    ScrollMan.to("#quiz");
                }
                else {
                    var backButton = document.querySelector(".backbtn");
                    if (backButton) {
                        window.location = (backButton.href + "#quiz");
                    }
                    else {
                        var ix = curLoc.indexOf('en');
                        if (ix === -1)
                            ix = curLoc.indexOf('fr');
                        var rootlang = curLoc.slice(0, ix + 1).join('/');
                        window.location = (rootlang + '#quiz');
                    }
                }
            }
            else {
                _this.onContact.dispatch();
            }
        };
        this.toggleHnd = function () {
            _this.userToggled = true;
            _this.visibilityState === 'expanded' ? _this.collapse() : _this.open();
            _this.setDisplayState();
        };
        this.el = el;
        this.$el = $(el);
        this.$win = $(window);
        this.$about = $(document.querySelector('.footer-about'));
        this.$areas = $(document.querySelector('.areas.section'));
        this.build();
        this.close();
        this.setDisplayState();
        this.$btn_cta.on('click', this.ctaHnd);
        this.btn_view.addEventListener('click', this.onViewReport.dispatch.bind(this.onViewReport));
        this.btn_download.addEventListener('click', this.onDownloadReport.dispatch.bind(this.onDownloadReport));
        this.btn_restart.addEventListener('click', this.onRestart.dispatch.bind(this.onRestart));
        window.addEventListener('resize', this.initPos);
        window.addEventListener('scroll', this.scrollHnd);
        // window['OI'] = this;
    }
    OpIndex.prototype.updateResults = function (d) {
        var spass = parseInt(d.score) > 0;
        // copy
        this.copy_instructions.innerHTML = d.opIndex.instructions;
        this.score_num.innerHTML = d.score;
        this.score_label.innerHTML = d.opIndex.scoreLabel;
        this.$copy_cta.text(d.opIndex.ctaCopy);
        this.$btn_cta.text(d.opIndex.ctaLabel);
        this.btn_download.innerHTML = d.opIndex.downloadLabel;
        this.btn_restart.innerHTML = d.opIndex.restartLabel;
        this.btn_view.innerHTML = d.opIndex.viewLabel;
        this.quizStateCache = d.quizState;
        var visibility = ((d.quizState === "completed") && spass) ? "show" : "hide";
        $(this.score)[visibility]();
        $(this.btn_download)[visibility]();
        $(this.btn_restart)[visibility]();
        $(this.btn_view)[visibility]();
        this.$el.css({
            bottom: -this.$el.outerHeight()
        });
    };
    OpIndex.prototype.open = function () {
        this.visibilityState = 'expanded';
        this.visibilityOffset = this.$el.outerHeight();
        this.initPos();
    };
    OpIndex.prototype.collapse = function () {
        this.visibilityState = 'collapsed';
        this.visibilityOffset = 30;
        this.initPos();
    };
    OpIndex.prototype.close = function () {
        this.visibilityState = 'closed';
        this.visibilityOffset = 0;
        this.initPos();
    };
    OpIndex.prototype.getEl = function (sel) {
        return this.el.querySelector(sel);
    };
    OpIndex.prototype.build = function () {
        var qs = this.getEl.bind(this);
        this.toggle = qs('.icon--toggle');
        this.toggle.addEventListener('click', this.toggleHnd);
        this.score = qs('.score');
        this.score_num = qs('.score--number');
        this.score_label = qs('.score--label');
        this.copy_instructions = qs('.block--instructions .copy');
        this.btn_download = qs('.oplink--download');
        this.btn_restart = qs('.oplink--restart');
        this.btn_view = qs('.oplink--view');
        this.$btn_cta = $(this.el).find('.oplink--cta');
        this.$copy_cta = $(this.el).find('.copy-alt');
    };
    return OpIndex;
})();
var ui;
(function (ui) {
    var ButtonCloseIcon = (function () {
        function ButtonCloseIcon(el) {
            this.el = el;
            if (this.el == null)
                this.el = document.createElement("div");
            this.el.className = "button-close-icon";
            this.build();
        }
        ButtonCloseIcon.prototype.build = function () {
            this.drawX();
        };
        ButtonCloseIcon.prototype.drawX = function () {
            var elSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            var l1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
            var l2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
            elSVG.setAttributeNS(null, "viewBox", "0 0 16 16");
            elSVG.setAttributeNS(null, "width", "16");
            elSVG.setAttributeNS(null, "height", "16");
            l1.setAttributeNS(null, "fill", "none");
            l1.setAttributeNS(null, "stroke", "#0ED59A");
            l1.setAttributeNS(null, "stroke-width", "2");
            l1.setAttributeNS(null, "stroke-linecap", "round");
            l1.setAttributeNS(null, "stroke-miterlimit", "10");
            l1.setAttributeNS(null, "x1", "1");
            l1.setAttributeNS(null, "y1", "1");
            l1.setAttributeNS(null, "x2", "15");
            l1.setAttributeNS(null, "y2", "15");
            l2.setAttributeNS(null, "fill", "none");
            l2.setAttributeNS(null, "stroke", "#0ED59A");
            l2.setAttributeNS(null, "stroke-width", "2");
            l2.setAttributeNS(null, "stroke-linecap", "round");
            l2.setAttributeNS(null, "stroke-miterlimit", "10");
            l2.setAttributeNS(null, "x1", "15");
            l2.setAttributeNS(null, "y1", "1");
            l2.setAttributeNS(null, "x2", "1");
            l2.setAttributeNS(null, "y2", "15");
            elSVG.appendChild(l1);
            elSVG.appendChild(l2);
            this.el.appendChild(elSVG);
        };
        return ButtonCloseIcon;
    })();
    ui.ButtonCloseIcon = ButtonCloseIcon;
})(ui || (ui = {}));
///<reference path="../ui/ButtonCloseIcon.ts" />
///<reference path="../interfaces/greensock/greensock.d.ts" />
var ReportModal = (function () {
    function ReportModal(el, sdat, rdat, print_mode) {
        var _this = this;
        if (el === void 0) { el = null; }
        if (sdat === void 0) { sdat = null; }
        if (rdat === void 0) { rdat = null; }
        if (print_mode === void 0) { print_mode = false; }
        this.onClose = new Signal();
        this.onContact = new Signal();
        this.onDownload = new Signal();
        this.handleClose = function (e) {
            _this.onClose.dispatch();
        };
        this.handleDownload = function (e) {
            _this.onDownload.dispatch();
        };
        this.handleContact = function (e) {
            _this.onContact.dispatch();
        };
        this.el = el;
        this.setupData = sdat;
        this.reportData = rdat;
        this.printMode = print_mode;
        if (this.el == null)
            this.el = document.createElement("div");
        this.el.className = "report-modal";
        this.build();
        igTrack('REPORT_VIEW');
    }
    ReportModal.prototype.build = function () {
        this.elScreen = document.createElement("div");
        this.elScreen.className = "screen";
        this.elContainer = document.createElement("div");
        this.elContainer.className = "container";
        this.elModal = document.createElement("div");
        this.elModal.className = "modal";
        this.elContainer.appendChild(this.elModal);
        this.el.appendChild(this.elScreen);
        this.el.appendChild(this.elContainer);
        this.flowContent();
        if (!this.printMode)
            this.preAnimState();
    };
    ReportModal.prototype.preAnimState = function () {
        this.el.style.opacity = "0";
    };
    ReportModal.prototype.flowContent = function () {
        this.numOps = this.reportData.numOps;
        var logo = document.createElement("div");
        var img = document.createElement("img");
        var lbl = document.createElement("h3");
        logo.className = "logo";
        lbl.innerHTML = this.setupData.copy.logo_sub;
        img.src = this.setupData.copy.logo_src;
        logo.appendChild(img);
        logo.appendChild(lbl);
        this.elModal.appendChild(logo);
        var header = document.createElement("h2");
        header.innerHTML = this.setupData.copy.report.header;
        this.elModal.appendChild(header);
        this.btnIconClose = new ui.ButtonCloseIcon(null);
        this.btnIconClose.el.addEventListener("click", this.handleClose);
        this.elModal.appendChild(this.btnIconClose.el);
        this.addCount();
        this.addIcons();
        this.addTitle();
        // body
        var sumBody = document.createElement("div");
        sumBody.className = "copy";
        sumBody.innerHTML = this.setupData.copy.report.body;
        this.elModal.appendChild(sumBody);
        this.addTips();
        this.addFooter();
    };
    ReportModal.prototype.addCount = function () {
        var elCount = document.createElement("div");
        elCount.className = "count";
        var cnt = document.createElement("span");
        cnt.className = "opportunity-score three-d";
        var lbl = document.createElement("span");
        lbl.className = "lbl";
        cnt.innerHTML = this.numOps.toString();
        lbl.innerHTML = this.setupData.copy.opportunity_num;
        elCount.appendChild(cnt);
        elCount.appendChild(lbl);
        this.elModal.appendChild(elCount);
    };
    ReportModal.prototype.addTitle = function () {
        var sumTitle = document.createElement("h1");
        var tit = "";
        var sp = "";
        var st = "";
        for (var i = 0; i < this.numOps; i++) {
            st = this.reportData.areas[i];
            if (i > 0) {
                if (window['LANG'].toLowerCase() == "fr")
                    st = st.toLowerCase();
                sp = (i < (this.numOps - 1)) ? ", " : " " + this.setupData.copy.report.and + "&nbsp;";
            }
            tit += sp + utils.Formatter.killOrphans(st);
        }
        sumTitle.innerHTML = tit;
        this.elModal.appendChild(sumTitle);
    };
    ReportModal.prototype.addIcons = function () {
        this.elIcons = document.createElement("div");
        this.elIcons.className = "area-icons";
        this.elModal.appendChild(this.elIcons);
        var grp;
        var ico;
        var spn;
        for (var i = 0; i < this.numOps; i++) {
            grp = document.createElement("div");
            grp.className = "icon-group";
            ico = document.createElement("div");
            ico.className = "icon";
            var img = document.createElement("img");
            img.src = this.setupData.icon_src + this.reportData.ids[i] + ".png";
            ico.appendChild(img);
            grp.appendChild(ico);
            spn = document.createElement("div");
            spn.className = "lbl";
            grp.appendChild(spn);
            spn.innerHTML = this.reportData.areas[i];
            this.elIcons.appendChild(grp);
        }
    };
    ReportModal.prototype.addTips = function () {
        var tips = document.createElement("div");
        tips.className = "tips";
        var tipsHeader = document.createElement("div");
        tipsHeader.className = "header";
        tipsHeader.innerHTML = this.setupData.copy.report.tips_header;
        tips.appendChild(tipsHeader);
        this.elModal.appendChild(tips);
        var tipHolder = document.createElement("div");
        tipHolder.className = "tip-holder";
        tips.appendChild(tipHolder);
        var ntips = this.reportData.tips.length;
        var ct;
        for (var i = 0; i < ntips; i++) {
            ct = document.createElement("div");
            ct.className = "tip";
            ct.innerHTML = this.reportData.tips[i];
            tipHolder.appendChild(ct);
        }
    };
    ReportModal.prototype.addFooter = function () {
        var footer = document.createElement("div");
        footer.className = "report-footer";
        this.elModal.appendChild(footer);
        this.elBtnContact = document.createElement('div');
        this.elBtnDownload = document.createElement('div');
        this.elBtnClose = document.createElement('div');
        this.elBtnContact.className = "outline-btn";
        this.elBtnDownload.className = "underline-link";
        this.elBtnClose.className = "underline-link close";
        this.elBtnContact.innerHTML = this.setupData.copy.btn_contact;
        this.elBtnDownload.innerHTML = this.setupData.copy.btn_download;
        this.elBtnClose.innerHTML = this.setupData.copy.report.close;
        footer.appendChild(this.elBtnContact);
        footer.appendChild(this.elBtnDownload);
        footer.appendChild(this.elBtnClose);
        this.elBtnContact.addEventListener("click", this.handleContact);
        this.elBtnDownload.addEventListener("click", this.handleDownload);
        this.elBtnClose.addEventListener("click", this.handleClose);
    };
    ReportModal.prototype.removeEvents = function () {
        if (this.elBtnContact)
            this.elBtnContact.removeEventListener("click", this.handleContact);
        if (this.elBtnDownload)
            this.elBtnDownload.removeEventListener("click", this.handleDownload);
        if (this.elBtnClose)
            this.elBtnClose.removeEventListener("click", this.handleClose);
        if (this.btnIconClose)
            this.btnIconClose.el.removeEventListener("click", this.handleClose);
    };
    ReportModal.prototype.animIn = function (d, t, oc) {
        if (d === void 0) { d = 0; }
        if (t === void 0) { t = 0.5; }
        if (oc === void 0) { oc = null; }
        TweenLite.to(this.el, t, { opacity: 1, onComplete: oc });
    };
    ReportModal.prototype.animOut = function (d, t, oc) {
        if (d === void 0) { d = 0; }
        if (t === void 0) { t = 0.5; }
        if (oc === void 0) { oc = null; }
        TweenLite.to(this.el, t, { opacity: 0, onComplete: oc });
    };
    ReportModal.prototype.destroy = function () {
        this.removeEvents();
    };
    return ReportModal;
})();
///<reference path="../interfaces/jquery/jquery.d.ts" />
///<reference path="../interfaces/greensock/greensock.d.ts" />
///<reference path="../libs/Signal.ts" />
var Toggle = (function () {
    function Toggle(el) {
        var _this = this;
        this.toggle = false;
        this.onStateChange = new Signal;
        this.toggleHnd = function (e) {
            var newState = e.target === _this.btns[1];
            $(_this.el)[newState ? 'addClass' : 'removeClass']('toggled');
            if (_this.toggle !== newState)
                _this.onStateChange.dispatch(newState);
            _this.toggle = newState;
        };
        this.el = el;
        this.btns = [].slice.call(this.el.querySelectorAll('.toggle--opt'));
        this.btns.forEach(function (btn) {
            btn.addEventListener('click', this.toggleHnd);
        }.bind(this));
        this.build();
    }
    Toggle.prototype.build = function () {
    };
    return Toggle;
})();
///<reference path="../interfaces/jquery/jquery.d.ts" />
// import sa = require('superagent');
var LocationsAutocomplete = (function () {
    function LocationsAutocomplete(el, data) {
        var _this = this;
        this.citiesWithIntructions = function (q, sync) {
            if (q === '') {
                sync(["Entrez les trois premières lettres de la ville la plus près de chez vous et sélectionnez-la dans la liste proposée."]);
            }
            else {
                _this.cities.search(q, sync);
            }
        };
        // private renderDisplay = (d:any):string => {
        //     return (
        //         '{{city}}, {{province}}'
        //             .replace(/{{city}}/g, d.city)
        //             .replace(/{{province}}/g, d.province)
        //     )
        // }
        //
        this.renderSuggestion = function (d) {
            console.log(d);
            return ('<div>{{formatted}}</div>'
                .replace(/{{formatted}}/g, d.value));
        };
        this.renderNotFound = function (d) {
            return ('<div class="no-results">{{copy}}</div>'
                .replace(/{{copy}}/g, _this.el.getAttribute('data-copyNoResults').toLowerCase()));
        };
        this.el = el;
        this.data = data;
        this.build();
    }
    LocationsAutocomplete.prototype.build = function () {
        this.cities = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.whitespace,
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            local: this.data
        });
        $(this.el).typeahead({
            hint: true,
            highlight: true,
            minLength: 3
        }, {
            name: 'cities',
            source: this.cities,
            templates: {
                notFound: this.renderNotFound
            }
        });
    };
    return LocationsAutocomplete;
})();
///<reference path="../interfaces/jquery/jquery.d.ts" />
///<reference path="../libs/Signal.ts" />
///<reference path="./Toggle.ts" />
///<reference path="./LocationsAutocomplete.ts" />
var FINDER_URL = '/';
var ConsultantFinder = (function () {
    function ConsultantFinder(el) {
        var _this = this;
        this.dataSRC = "/prototype/external/app/tribal/data/cities-en.json";
        this.dataHnd = function (e) {
            var response = e.target.responseText;
            _this.data = JSON.parse(response);
            _this.build();
        };
        this.toggleHnd = function (_type) {
            var type = _type ? 'name' : 'location';
            _this.user_selection.searchType = type;
            _this.searchUI.setAttribute('data-searchType', type);
            $(_this.searchUI).removeClass('name location');
            $(_this.searchUI).addClass(type);
            if (type === "name") {
                _this.user_selection.prov_ID = null;
                _this.user_selection.ciyt_ID = null;
            }
            else {
                _this.user_selection.searchString = null;
            }
        };
        this.onProvSelect = function () {
            if (_this.user_selection.prov_ID) {
                var lng = _this.data.cities[_this.user_selection.prov_ID].length;
                var toRemove = [];
                for (var i = 0; i < lng; i++) {
                    toRemove.push(i + 1);
                }
                _this.dd_cityCtl.remove(toRemove);
                _this.dd_cityCtl.selectOption(0);
            }
            ;
            _this.user_selection.prov_ID = _this.$dd_prov.val();
            _this.user_selection.city_ID = null;
            _this.dd_cityCtl.add(_this.data.cities[_this.user_selection.prov_ID]);
        };
        this.onCitySelect = function () {
            _this.user_selection.city_ID = _this.$dd_city.val();
            _this.user_selection.prov_ID = _this.$dd_prov.val();
        };
        this.keyHnd = function (e) {
            if (e.keyCode == 13) {
                _this.submitHnd();
            }
        };
        this.submitHnd = function (e) {
            if (e === void 0) { e = null; }
            _this.itf_location = _this.el.querySelector('.itf_location[placeholder]');
            if (e)
                e.preventDefault();
            var tgURL;
            var suggestions = [].slice.call(_this.el.querySelectorAll('.tt-suggestion'));
            if (suggestions.length === 1) {
                _this.locationsAC.cities.search(_this.itf_location.value, function (datums) {
                    _this.itf_location.value = datums[0];
                });
            }
            if (_this.validateLocation()) {
                igTrack('ADVISOR_SEARCH', 'Location', _this.itf_location.value);
                tgURL = _this.el.getAttribute('data-advisor-search-url-location');
                window.location = (tgURL + _this.itf_location.value);
            }
            else if (_this.validateName()) {
                igTrack('ADVISOR_SEARCH', 'Name', _this.itf_name.value);
                tgURL = _this.el.getAttribute('data-advisor-search-url-name');
                window.location = (tgURL + _this.itf_name.value);
            }
        };
        this.el = el;
        this.user_selection = {
            'searchType': 'location',
            'searchStringLocation': null,
            'searchString': null,
            'prov_ID': null,
            'city_ID': null
        };
    }
    ConsultantFinder.prototype.init = function (dsrc) {
        if (dsrc === void 0) { dsrc = null; }
        if (dsrc)
            this.dataSRC = dsrc;
        var req = new XMLHttpRequest();
        req.addEventListener("load", this.dataHnd);
        req.open("GET", this.dataSRC, true);
        req.send();
    };
    ConsultantFinder.prototype.validateName = function () {
        return (this.user_selection.searchType === 'name') && !!this.itf_name.value;
    };
    ConsultantFinder.prototype.validateLocation = function () {
        return (this.user_selection.searchType === 'location') && (this.data.indexOf(this.itf_location.value) !== -1);
    };
    ConsultantFinder.prototype.build = function () {
        this.searchUI = this.el.querySelector('.search-ui');
        this.loupeBtn = this.searchUI.querySelector('.icon--loupe');
        this.submitBtn = this.searchUI.querySelector('.search-ui--location .outline-btn');
        this.submitBtn2 = this.searchUI.querySelector('.search-ui--name .outline-btn');
        this.loupeBtn.addEventListener('click', this.submitHnd);
        this.submitBtn.addEventListener('click', this.submitHnd);
        this.submitBtn2.addEventListener('click', this.submitHnd);
        this.toggle = new Toggle(this.el.querySelector('.toggle'));
        this.toggle.onStateChange.add(this.toggleHnd);
        this.itf_name = this.el.querySelector('.itf_name');
        $(this.itf_name).keyup(this.keyHnd);
        this.itf_location = this.el.querySelector('.itf_location[placeholder]');
        $(this.itf_location).keyup(this.keyHnd);
        this.locationsAC = new LocationsAutocomplete(this.itf_location, this.data);
        // this.$dd_prov = $(this.el.querySelector('.dropdown.dd-province'));
        // this.dd_provCtl = this.$dd_prov.selectBoxIt().data("selectBox-selectBoxIt");
        // this.dd_provCtl.add(LOCATIONS.provinces);
        //
        // this.$dd_city = $(this.el.querySelector('.dropdown.dd-city'));
        // this.dd_cityCtl = this.$dd_city.selectBoxIt().data("selectBox-selectBoxIt");
        //
        //
        // this.$dd_prov.on('change', this.onProvSelect);
        // this.$dd_city.on('change', this.onCitySelect);
    };
    return ConsultantFinder;
})();
///<reference path="states/OpIndexState.ts" />
///<reference path="components/Quiz.ts" />
///<reference path="components/Areas.ts" />
///<reference path="components/OpIndex.ts" />
///<reference path="components/ReportModal.ts" />
///<reference path="components/ConsultantFinder.ts" />
///<reference path="interfaces/Scrollman.d.ts" />
var QuizMain = (function () {
    function QuizMain() {
        var _this = this;
        this.build = function () {
            _this.opIndexState.onScoreChange.add(_this.scoreChangeHnd);
            _this.opIndexState.onStateChange.add(_this.stateChangeHnd);
            _this.opIndexState.onReset.add(_this.resetHnd);
            _this.setupData = _this.opIndexState.getSetupData();
            _this.quiz = new Quiz(document.querySelector('.quiz'), _this.setupData);
            _this.quiz.onRestart.add(_this.restartHnd);
            _this.quiz.onSubmit.add(_this.submitHnd);
            _this.quiz.onComplete.add(_this.completeHnd);
            _this.quiz.onContact.add(_this.contactHnd);
            _this.quiz.onDownload.add(_this.downloadHnd);
            _this.quiz.onViewReport.add(_this.viewReportHnd);
            _this.quiz.onRestart.add(_this.restartHnd);
            _this.areas = new Areas(document.querySelector('.areas.section'));
            _this.opIndex = new OpIndex(document.querySelector('.op-index.section'));
            _this.opIndex.onViewReport.add(_this.viewReportHnd);
            _this.opIndex.onDownloadReport.add(_this.downloadHnd);
            _this.opIndex.onContact.add(_this.contactHnd);
            _this.opIndex.onRestart.add(_this.restartHnd);
            _this.areas.onPolarSelect.add(_this.polarSelectHnd);
            var results = _this.opIndexState.getResults();
            var hasCachedState = (results.quizState === 'completed');
            _this.quiz.build(hasCachedState);
            if (!hasCachedState) {
                _this.areas.update(results);
                _this.opIndex.updateResults(results);
            }
        };
        this.closeReportComplete = function (e) {
            if (e === void 0) { e = null; }
            var parent = document.body;
            //parent.style.overflow = "";
            parent.classList.remove("locked");
            if (_this.report) {
                parent.removeChild(_this.report.el);
                _this.report.onClose.remove(_this.closeReport);
                delete _this.report;
            }
        };
        this.closeReport = function () {
            if (_this.report) {
                _this.report.animOut(0, 0.5, _this.closeReportComplete);
            }
        };
        this.contactHnd = function (value) {
            var t = 0.25;
            if (_this.report) {
                _this.report.animOut(0, 0.5, _this.closeReportComplete);
                t = 0;
            }
            ScrollMan.to("#contact", 0, t);
        };
        this.downloadHnd = function (value) {
            _this.printReport();
        };
        this.viewReportHnd = function (value) {
            _this.viewReport();
        };
        this.restartHnd = function (value) {
            _this.opIndexState.reset();
            _this.quiz.restartQuiz();
        };
        this.submitHnd = function (value) {
            _this.opIndexState.setQuizSelection(value);
        };
        this.completeHnd = function () {
            console.log('QuizMain:completeHnd');
            igTrack('QUIZ_COMPLETED');
            _this.opIndexState.calcResults();
            _this.opIndex.collapse();
            _this.areas.update(_this.opIndexState.getResults());
            var summaryResults = _this.opIndexState.getInterestedLabelsOnly();
            _this.quiz.showSummary(summaryResults);
            var results = _this.opIndexState.getResults();
            _this.opIndex.updateResults(results);
        };
        this.stateChangeHnd = function () {
            console.log('QuizMain:stateChangeHnd');
            var results = _this.opIndexState.getResults();
            _this.opIndex.updateResults(results);
        };
        this.scoreChangeHnd = function () {
            var results = _this.opIndexState.getResults();
            _this.opIndex.updateResults(results);
            _this.areas.updatePolar(results);
        };
        this.resetHnd = function () {
            var results = _this.opIndexState.getResults();
            _this.opIndex.updateResults(results);
            _this.areas.reset(results);
        };
        this.polarSelectHnd = function (key, val) {
            _this.opIndexState.setPolarSelection(key, val);
            var summaryResults = _this.opIndexState.getInterestedLabelsOnly();
            _this.quiz.showSummary(summaryResults);
        };
        this.finder = new ConsultantFinder(document.querySelector('.contact.section'));
        var dataSRCCities = this.finder.el.getAttribute('data-cities');
        this.finder.init(dataSRCCities);
        this.opIndexState = new OpIndexState();
        this.opIndexState.onReady.add(this.build);
        var dataSRC = document.body.getAttribute('data-quiz');
        this.opIndexState.init(dataSRC);
    }
    QuizMain.prototype.printReport = function () {
        var parent = document.body;
        var reportData = this.opIndexState.getReportData();
        var pr = new ReportModal(null, this.setupData, reportData, true);
        parent.appendChild(pr.el);
        window.print();
        parent.removeChild(pr.el);
        igTrack('REPORT_PRINT_DL');
    };
    QuizMain.prototype.viewReport = function () {
        var parent = document.body;
        parent.classList.add("locked");
        //parent.style.overflow = "hidden";
        var reportData = this.opIndexState.getReportData();
        if (!this.report)
            this.report = new ReportModal(null, this.setupData, reportData);
        this.report.onClose.add(this.closeReport);
        this.report.onContact.add(this.contactHnd);
        this.report.onDownload.add(this.downloadHnd);
        parent.appendChild(this.report.el);
        this.report.animIn();
    };
    return QuizMain;
})();
window['QuizMain'] = QuizMain;
window.addEventListener('load', function () {
    window.removeEventListener('load', this);
    console.log('QuizMain onload');
    new QuizMain();
});
