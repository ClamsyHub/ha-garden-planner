// src/types.ts
var e = [
	"plants",
	"varieties",
	"growing_windows",
	"locations",
	"cultivations",
	"cultivation_events",
	"tasks",
	"seed_lots",
	"cultivation_journal"
], t = (e, t) => {
	let n = e?.data[t];
	return typeof n == "string" || typeof n == "number" ? String(n) : "";
}, n = (e, t) => {
	let n = e?.data[t];
	return typeof n == "number" ? n : void 0;
}, r = () => ({
	plants: [],
	varieties: [],
	growing_windows: [],
	locations: [],
	cultivations: [],
	cultivation_events: [],
	tasks: [],
	seed_lots: [],
	cultivation_journal: []
});
// src/dates.ts
function i(e, t = /* @__PURE__ */ new Date()) {
	let n = new Intl.DateTimeFormat("en-CA", {
		timeZone: e,
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).formatToParts(t);
	return [
		"year",
		"month",
		"day"
	].map((e) => n.find((t) => t.type === e)?.value).join("-");
}
function a(e) {
	return /* @__PURE__ */ new Date(`${e}T12:00:00Z`);
}
function o(e) {
	return e.toISOString().slice(0, 10);
}
function s(e, t) {
	let n = a(e);
	return n.setUTCDate(n.getUTCDate() + t), o(n);
}
function c(e, t) {
	return new Date(Date.UTC(e, t, 0)).getUTCDate();
}
function l(e, t, n) {
	return t >= 1 && t <= 12 && n >= 1 && n <= c(e, t);
}
function u(e, t) {
	let r = Number(t.slice(5, 7)) * 100 + Number(t.slice(8, 10)), i = (n(e, "start_month") ?? 0) * 100 + (n(e, "start_day") ?? 0), a = (n(e, "end_month") ?? 0) * 100 + (n(e, "end_day") ?? 0);
	return i <= a ? r >= i && r <= a : r >= i || r <= a;
}
function d(e, t, n) {
	let r = c(t, n), i = [], a;
	for (let o = 0; o <= r; o++) {
		let s = o < r && u(e, `${t}-${String(n).padStart(2, "0")}-${String(o + 1).padStart(2, "0")}`);
		s && a === void 0 && (a = o), !s && a !== void 0 && (i.push({
			offset: a / r * 100,
			width: (o - a) / r * 100
		}), a = void 0);
	}
	return i;
}
function f(e, t, n) {
	return Array.from({ length: c(t, n) }, (e, r) => `${t}-${String(n).padStart(2, "0")}-${String(r + 1).padStart(2, "0")}`).some((t) => u(e, t));
}
function p(e, t) {
	for (let n = 0; n < 2928; n++) {
		let r = s(t, n);
		if (e.some((e) => u(e, r))) return r;
	}
}
function m(e) {
	let t = s(e, -((a(e).getUTCDay() + 6) % 7));
	return Array.from({ length: 7 }, (e, n) => s(t, n));
}
function h(e, t) {
	return e ? new Intl.DateTimeFormat(t === "de" ? "de-DE" : "en-GB", {
		timeZone: "UTC",
		dateStyle: "medium"
	}).format(a(e)) : "—";
}
function g(e, n) {
	let r = t(e, "date"), i = t(e, "end_date"), a = h(r, n);
	return e.data.personal_generated && i && i > r ? `${a}${n === "de" ? " bis " : " to "}${h(i, n)}` : a;
}
function _(e, t, n, r = !1) {
	return new Intl.DateTimeFormat(n === "de" ? "de-DE" : "en-GB", {
		timeZone: "UTC",
		month: r ? "short" : "long",
		...r ? {} : { year: "numeric" }
	}).format(new Date(Date.UTC(e, t - 1, 15)));
}
function v(e, t) {
	let r = (r) => {
		let i = n(e, `${r}_month`) ?? 1;
		return `${n(e, `${r}_day`) ?? 1}. ${_(2e3, i, t, !0)}`;
	};
	return `${r("start")} – ${r("end")}`;
}
function y(e, n) {
	return n.filter((n) => t(n, "cultivation_id") === e.id).sort((e, n) => t(e, "date").localeCompare(t(n, "date")) || e.created_at.localeCompare(n.created_at) || e.id.localeCompare(n.id));
}
function b(e, n) {
	return t(y(e, n).at(-1), "status") || t(e, "initial_status") || "sown";
}
function x(e, n) {
	return t(y(e, n).find((e) => t(e, "status") === "sown"), "date");
}
function S(e, t) {
	let n = [];
	for (let r of m(t)) {
		if (!u(e, r)) continue;
		let t = n.at(-1);
		t && s(t.end, 1) === r ? t.end = r : n.push({
			start: r,
			end: r
		});
	}
	return n;
}
// src/temperature.ts
function C(e) {
	return e && typeof e == "object" && !Array.isArray(e) ? e : void 0;
}
function w(e) {
	let n = C(e.data.snapshot);
	if (!n) return;
	let r = {
		...C(n.plant),
		...C(n.variety)
	}, i = Array.isArray(n.windows) ? n.windows.filter((n) => {
		let r = C(n);
		return !r || r.activity !== t(e, "method") && r.method !== t(e, "method") ? !1 : u({
			...e,
			data: r
		}, t(e, "date"));
	}) : [];
	if (i.length > 1 && i.some((e) => {
		let t = C(e);
		return t && [
			"germination_min_c",
			"germination_optimal_min_c",
			"germination_optimal_max_c",
			"germination_max_c"
		].some((e) => e in t);
	})) return;
	i.length === 1 && (r = {
		...r,
		...C(i[0])
	});
	let a = r.germination_optimal_min_c, o = r.germination_optimal_max_c;
	return typeof a == "number" && typeof o == "number" ? {
		min: a,
		max: o
	} : void 0;
}
function T(e, n, r) {
	let i = e?.states?.[t(n, "sensor_entity_id")];
	if (!i || !i.state.trim() || ["unknown", "unavailable"].includes(i.state)) return { state: "missing" };
	let a = Number(i.state);
	if (!Number.isFinite(a)) return { state: "missing" };
	let o = i.attributes.unit_of_measurement;
	if (o === "°F") a = (a - 32) * 5 / 9;
	else if (o === "K") a -= 273.15;
	else if (o !== "°C") return { state: "unit" };
	return t(n, "measurement_kind") !== "substrate" || !r ? {
		value: a,
		state: "information"
	} : {
		value: a,
		state: a < r.min || a > r.max ? "outside" : "within"
	};
}
function E(e, t) {
	let n = t.trim().toLocaleLowerCase();
	return Object.entries(e?.states ?? {}).filter(([e, t]) => e.startsWith("sensor.") && (t.attributes.device_class === "temperature" || [
		"°C",
		"°F",
		"K"
	].includes(String(t.attributes.unit_of_measurement)))).map(([e, t]) => ({
		id: e,
		name: typeof t.attributes.friendly_name == "string" ? t.attributes.friendly_name : e
	})).filter(({ id: e, name: t }) => `${e} ${t}`.toLocaleLowerCase().includes(n)).sort((e, t) => e.name.localeCompare(t.name) || e.id.localeCompare(t.id));
}
// node_modules/@lit/reactive-element/css-tag.js
var D = globalThis, O = D.ShadowRoot && (D.ShadyCSS === void 0 || D.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, ee = Symbol(), k = /* @__PURE__ */ new WeakMap(), A = class {
	constructor(e, t, n) {
		if (this._$cssResult$ = !0, n !== ee) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = e, this.t = t;
	}
	get styleSheet() {
		let e = this.o, t = this.t;
		if (O && e === void 0) {
			let n = t !== void 0 && t.length === 1;
			n && (e = k.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), n && k.set(t, e));
		}
		return e;
	}
	toString() {
		return this.cssText;
	}
}, j = (e) => new A(typeof e == "string" ? e : e + "", void 0, ee), M = (e, ...t) => new A(e.length === 1 ? e[0] : t.reduce((t, n, r) => t + ((e) => {
	if (!0 === e._$cssResult$) return e.cssText;
	if (typeof e == "number") return e;
	throw Error("Value passed to 'css' function must be a 'css' function result: " + e + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
})(n) + e[r + 1], e[0]), e, ee), N = (e, t) => {
	if (O) e.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
	else for (let n of t) {
		let t = document.createElement("style"), r = D.litNonce;
		r !== void 0 && t.setAttribute("nonce", r), t.textContent = n.cssText, e.appendChild(t);
	}
}, P = O ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((e) => {
	let t = "";
	for (let n of e.cssRules) t += n.cssText;
	return j(t);
})(e) : e, { is: te, defineProperty: F, getOwnPropertyDescriptor: ne, getOwnPropertyNames: I, getOwnPropertySymbols: L, getPrototypeOf: R } = Object, z = globalThis, re = z.trustedTypes, ie = re ? re.emptyScript : "", ae = z.reactiveElementPolyfillSupport, oe = (e, t) => e, se = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? ie : null;
				break;
			case Object:
			case Array: e = e == null ? e : JSON.stringify(e);
		}
		return e;
	},
	fromAttribute(e, t) {
		let n = e;
		switch (t) {
			case Boolean:
				n = e !== null;
				break;
			case Number:
				n = e === null ? null : Number(e);
				break;
			case Object:
			case Array: try {
				n = JSON.parse(e);
			} catch {
				n = null;
			}
		}
		return n;
	}
}, ce = (e, t) => !te(e, t), le = {
	attribute: !0,
	type: String,
	converter: se,
	reflect: !1,
	useDefault: !1,
	hasChanged: ce
};
Symbol.metadata ??= Symbol("metadata"), z.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var ue = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = le) {
		if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
			let n = Symbol(), r = this.getPropertyDescriptor(e, n, t);
			r !== void 0 && F(this.prototype, e, r);
		}
	}
	static getPropertyDescriptor(e, t, n) {
		let { get: r, set: i } = ne(this.prototype, e) ?? {
			get() {
				return this[t];
			},
			set(e) {
				this[t] = e;
			}
		};
		return {
			get: r,
			set(t) {
				let a = r?.call(this);
				i?.call(this, t), this.requestUpdate(e, a, n);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(e) {
		return this.elementProperties.get(e) ?? le;
	}
	static _$Ei() {
		if (this.hasOwnProperty(oe("elementProperties"))) return;
		let e = R(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(oe("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(oe("properties"))) {
			let e = this.properties, t = [...I(e), ...L(e)];
			for (let n of t) this.createProperty(n, e[n]);
		}
		let e = this[Symbol.metadata];
		if (e !== null) {
			let t = litPropertyMetadata.get(e);
			if (t !== void 0) for (let [e, n] of t) this.elementProperties.set(e, n);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (let [e, t] of this.elementProperties) {
			let n = this._$Eu(e, t);
			n !== void 0 && this._$Eh.set(n, e);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(e) {
		let t = [];
		if (Array.isArray(e)) {
			let n = new Set(e.flat(1 / 0).reverse());
			for (let e of n) t.unshift(P(e));
		} else e !== void 0 && t.push(P(e));
		return t;
	}
	static _$Eu(e, t) {
		let n = t.attribute;
		return !1 === n ? void 0 : typeof n == "string" ? n : typeof e == "string" ? e.toLowerCase() : void 0;
	}
	constructor() {
		super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
	}
	_$Ev() {
		this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
	}
	addController(e) {
		(this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
	}
	removeController(e) {
		this._$EO?.delete(e);
	}
	_$E_() {
		let e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
		for (let n of t.keys()) this.hasOwnProperty(n) && (e.set(n, this[n]), delete this[n]);
		e.size > 0 && (this._$Ep = e);
	}
	createRenderRoot() {
		let e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return N(e, this.constructor.elementStyles), e;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
	}
	enableUpdating(e) {}
	disconnectedCallback() {
		this._$EO?.forEach((e) => e.hostDisconnected?.());
	}
	attributeChangedCallback(e, t, n) {
		this._$AK(e, n);
	}
	_$ET(e, t) {
		let n = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, n);
		if (r !== void 0 && !0 === n.reflect) {
			let i = (n.converter?.toAttribute === void 0 ? se : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? se : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? ce)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
			this.C(e, t, n);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(e, t, { useDefault: n, reflect: r, wrapped: i }, a) {
		n && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), !0 !== i || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || n || (t = void 0), this._$AL.set(e, t)), !0 === r && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (e) {
			Promise.reject(e);
		}
		let e = this.scheduleUpdate();
		return e != null && await e, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (let [e, t] of this._$Ep) this[e] = t;
				this._$Ep = void 0;
			}
			let e = this.constructor.elementProperties;
			if (e.size > 0) for (let [t, n] of e) {
				let { wrapped: e } = n, r = this[t];
				!0 !== e || this._$AL.has(t) || r === void 0 || this.C(t, void 0, n, r);
			}
		}
		let e = !1, t = this._$AL;
		try {
			e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((e) => e.hostUpdate?.()), this.update(t)) : this._$EM();
		} catch (t) {
			throw e = !1, this._$EM(), t;
		}
		e && this._$AE(t);
	}
	willUpdate(e) {}
	_$AE(e) {
		this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
	}
	_$EM() {
		this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
	}
	get updateComplete() {
		return this.getUpdateComplete();
	}
	getUpdateComplete() {
		return this._$ES;
	}
	shouldUpdate(e) {
		return !0;
	}
	update(e) {
		this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
	}
	updated(e) {}
	firstUpdated(e) {}
};
ue.elementStyles = [], ue.shadowRootOptions = { mode: "open" }, ue[oe("elementProperties")] = /* @__PURE__ */ new Map(), ue[oe("finalized")] = /* @__PURE__ */ new Map(), ae?.({ ReactiveElement: ue }), (z.reactiveElementVersions ??= []).push("2.1.2");
// node_modules/lit-html/lit-html.js
var de = globalThis, fe = (e) => e, pe = de.trustedTypes, me = pe ? pe.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, he = "$lit$", ge = `lit$${Math.random().toFixed(9).slice(2)}$`, _e = "?" + ge, ve = `<${_e}>`, ye = document, be = () => ye.createComment(""), xe = (e) => e === null || typeof e != "object" && typeof e != "function", Se = Array.isArray, Ce = (e) => Se(e) || typeof e?.[Symbol.iterator] == "function", we = "[ 	\n\f\r]", Te = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Ee = /-->/g, De = />/g, Oe = RegExp(`>|${we}(?:([^\\s"'>=/]+)(${we}*=${we}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), ke = /'/g, Ae = /"/g, je = /^(?:script|style|textarea|title)$/i, Me = (e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}), B = Me(1), Ne = Me(2), V = Symbol.for("lit-noChange"), H = Symbol.for("lit-nothing"), Pe = /* @__PURE__ */ new WeakMap(), Fe = ye.createTreeWalker(ye, 129);
function Ie(e, t) {
	if (!Se(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return me === void 0 ? t : me.createHTML(t);
}
var Le = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = Te;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === Te ? c[1] === "!--" ? o = Ee : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = Oe) : (je.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = Oe) : o = De : o === Oe ? c[0] === ">" ? (o = i ?? Te, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? Oe : c[3] === "\"" ? Ae : ke) : o === Ae || o === ke ? o = Oe : o === Ee || o === De ? o = Te : (o = Oe, i = void 0);
		let d = o === Oe && e[t + 1].startsWith("/>") ? " " : "";
		a += o === Te ? n + ve : l >= 0 ? (r.push(s), n.slice(0, l) + he + n.slice(l) + ge + d) : n + ge + (l === -2 ? t : d);
	}
	return [Ie(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, Re = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = Le(t, n);
		if (this.el = e.createElement(l, r), Fe.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = Fe.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(he)) {
					let t = u[o++], n = i.getAttribute(e).split(ge), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? Ue : r[1] === "?" ? We : r[1] === "@" ? Ge : He
					}), i.removeAttribute(e);
				} else e.startsWith(ge) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (je.test(i.tagName)) {
					let e = i.textContent.split(ge), t = e.length - 1;
					if (t > 0) {
						i.textContent = pe ? pe.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], be()), Fe.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], be());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === _e) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(ge, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += ge.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = ye.createElement("template");
		return n.innerHTML = e, n;
	}
};
function ze(e, t, n = e, r) {
	if (t === V) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = xe(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = ze(e, i._$AS(e, t.values), i, r)), t;
}
var Be = class {
	constructor(e, t) {
		this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
	}
	get parentNode() {
		return this._$AM.parentNode;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	u(e) {
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? ye).importNode(t, !0);
		Fe.currentNode = r;
		let i = Fe.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new Ve(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new Ke(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = Fe.nextNode(), a++);
		}
		return Fe.currentNode = ye, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, Ve = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = H, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
	}
	get parentNode() {
		let e = this._$AA.parentNode, t = this._$AM;
		return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(e, t = this) {
		e = ze(this, e, t), xe(e) ? e === H || e == null || e === "" ? (this._$AH !== H && this._$AR(), this._$AH = H) : e !== this._$AH && e !== V && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? Ce(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== H && xe(this._$AH) ? this._$AA.nextSibling.data = e : this.T(ye.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = Re.createElement(Ie(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new Be(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = Pe.get(e.strings);
		return t === void 0 && Pe.set(e.strings, t = new Re(e)), t;
	}
	k(t) {
		Se(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(be()), this.O(be()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = fe(e).nextSibling;
			fe(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, He = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = H, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = H;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = ze(this, e, t, 0), a = !xe(e) || e !== this._$AH && e !== V, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = ze(this, r[n + o], t, o), s === V && (s = this._$AH[o]), a ||= !xe(s) || s !== this._$AH[o], s === H ? e = H : e !== H && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === H ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, Ue = class extends He {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === H ? void 0 : e;
	}
}, We = class extends He {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== H);
	}
}, Ge = class extends He {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = ze(this, e, t, 0) ?? H) === V) return;
		let n = this._$AH, r = e === H && n !== H || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== H && (n === H || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, Ke = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		ze(this, e);
	}
}, qe = {
	M: he,
	P: ge,
	A: _e,
	C: 1,
	L: Le,
	R: Be,
	D: Ce,
	V: ze,
	I: Ve,
	H: He,
	N: We,
	U: Ge,
	B: Ue,
	F: Ke
}, Je = de.litHtmlPolyfillSupport;
Je?.(Re, Ve), (de.litHtmlVersions ??= []).push("3.3.3");
var Ye = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new Ve(t.insertBefore(be(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, Xe = globalThis, Ze = class extends ue {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Ye(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return V;
	}
};
Ze._$litElement$ = !0, Ze.finalized = !0, Xe.litElementHydrateSupport?.({ LitElement: Ze });
var Qe = Xe.litElementPolyfillSupport;
Qe?.({ LitElement: Ze }), (Xe.litElementVersions ??= []).push("4.2.2");
// node_modules/lit-html/directive.js
var $e = {
	ATTRIBUTE: 1,
	CHILD: 2,
	PROPERTY: 3,
	BOOLEAN_ATTRIBUTE: 4,
	EVENT: 5,
	ELEMENT: 6
}, et = (e) => (...t) => ({
	_$litDirective$: e,
	values: t
}), tt = class {
	constructor(e) {}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AT(e, t, n) {
		this._$Ct = e, this._$AM = t, this._$Ci = n;
	}
	_$AS(e, t) {
		return this.update(e, t);
	}
	update(e, t) {
		return this.render(...t);
	}
}, { I: nt } = qe, rt = (e) => e, it = (e) => e.strings === void 0, at = () => document.createComment(""), ot = (e, t, n) => {
	let r = e._$AA.parentNode, i = t === void 0 ? e._$AB : t._$AA;
	if (n === void 0) n = new nt(r.insertBefore(at(), i), r.insertBefore(at(), i), e, e.options);
	else {
		let t = n._$AB.nextSibling, a = n._$AM, o = a !== e;
		if (o) {
			let t;
			n._$AQ?.(e), n._$AM = e, n._$AP !== void 0 && (t = e._$AU) !== a._$AU && n._$AP(t);
		}
		if (t !== i || o) {
			let e = n._$AA;
			for (; e !== t;) {
				let t = rt(e).nextSibling;
				rt(r).insertBefore(e, i), e = t;
			}
		}
	}
	return n;
}, st = (e, t, n = e) => (e._$AI(t, n), e), ct = {}, lt = (e, t = ct) => e._$AH = t, ut = (e) => e._$AH, dt = (e) => {
	e._$AR(), e._$AA.remove();
}, ft = (e, t, n) => {
	let r = /* @__PURE__ */ new Map();
	for (let i = t; i <= n; i++) r.set(e[i], i);
	return r;
}, pt = et(class extends tt {
	constructor(e) {
		if (super(e), e.type !== $e.CHILD) throw Error("repeat() can only be used in text expressions");
	}
	dt(e, t, n) {
		let r;
		n === void 0 ? n = t : t !== void 0 && (r = t);
		let i = [], a = [], o = 0;
		for (let t of e) i[o] = r ? r(t, o) : o, a[o] = n(t, o), o++;
		return {
			values: a,
			keys: i
		};
	}
	render(e, t, n) {
		return this.dt(e, t, n).values;
	}
	update(e, [t, n, r]) {
		let i = ut(e), { values: a, keys: o } = this.dt(t, n, r);
		if (!Array.isArray(i)) return this.ut = o, a;
		let s = this.ut ??= [], c = [], l, u, d = 0, f = i.length - 1, p = 0, m = a.length - 1;
		for (; d <= f && p <= m;) if (i[d] === null) d++;
		else if (i[f] === null) f--;
		else if (s[d] === o[p]) c[p] = st(i[d], a[p]), d++, p++;
		else if (s[f] === o[m]) c[m] = st(i[f], a[m]), f--, m--;
		else if (s[d] === o[m]) c[m] = st(i[d], a[m]), ot(e, c[m + 1], i[d]), d++, m--;
		else if (s[f] === o[p]) c[p] = st(i[f], a[p]), ot(e, i[d], i[f]), f--, p++;
		else if (l === void 0 && (l = ft(o, p, m), u = ft(s, d, f)), l.has(s[d])) {
			if (l.has(s[f])) {
				let t = u.get(o[p]), n = t === void 0 ? null : i[t];
				if (n === null) {
					let t = ot(e, i[d]);
					st(t, a[p]), c[p] = t;
				} else c[p] = st(n, a[p]), ot(e, i[d], n), i[t] = null;
				p++;
			} else dt(i[f]), f--;
		} else dt(i[d]), d++;
		for (; p <= m;) {
			let t = ot(e, c[m + 1]);
			st(t, a[p]), c[p++] = t;
		}
		for (; d <= f;) {
			let e = i[d++];
			e !== null && dt(e);
		}
		return this.ut = o, lt(e, c), V;
	}
}), mt = et(class extends tt {
	constructor(e) {
		if (super(e), e.type !== $e.PROPERTY && e.type !== $e.ATTRIBUTE && e.type !== $e.BOOLEAN_ATTRIBUTE) throw Error("The `live` directive is not allowed on child or event bindings");
		if (!it(e)) throw Error("`live` bindings can only contain a single expression");
	}
	render(e) {
		return e;
	}
	update(e, [t]) {
		if (t === V || t === H) return t;
		let n = e.element, r = e.name;
		if (e.type === $e.PROPERTY) {
			if (t === n[r]) return V;
		} else if (e.type === $e.BOOLEAN_ATTRIBUTE) {
			if (!!t === n.hasAttribute(r)) return V;
		} else if (e.type === $e.ATTRIBUTE && n.getAttribute(r) === t + "") return V;
		return lt(e), t;
	}
}), ht = {}, gt = et(class extends tt {
	constructor() {
		super(...arguments), this.ot = ht;
	}
	render(e, t) {
		return t();
	}
	update(e, [t, n]) {
		if (Array.isArray(t)) {
			if (Array.isArray(this.ot) && this.ot.length === t.length && t.every((e, t) => e === this.ot[t])) return V;
		} else if (this.ot === t) return V;
		return this.ot = Array.isArray(t) ? Array.from(t) : t, this.render(t, n);
	}
}), _t = {
	harvestUnitsHint: "Gewicht und Stück werden getrennt ausgewertet. — bedeutet: Pflanzenanzahl nicht bekannt.",
	calculationHelp: "Wie wird gerechnet?",
	moreHarvestFilters: "Nach Pflanze, Sorte und Beet filtern",
	photoLoading: "Foto wird geladen …",
	photoLoadError: "Das Foto konnte nicht geladen werden.",
	stockQuantity: "Bestandsmenge",
	newSeedLot: "Saatgutlos hinzufügen",
	seedLots: "Saatgutbestände",
	manageStock: "Bestände öffnen",
	stockTotal: "Gesamtbestand nach Einheit",
	lot_label: "Packung / Los",
	unit: "Einheit",
	unit_seeds: "Samen",
	unit_packets: "Packungen",
	unit_g: "g",
	unit_kg: "kg",
	unit_pieces: "Stück",
	purchase_year: "Kaufjahr",
	best_before: "Haltbar / keimfähig bis",
	opened_on: "Angebrochen am",
	germination_percent: "Getestete Keimfähigkeit (%)",
	germination_tested_on: "Keimtest am",
	storage_location: "Lagerort",
	seedLotHint: "Ein Los entspricht zum Beispiel einer Packung. Mengen verschiedener Einheiten werden getrennt summiert. Die Keimfähigkeit wird nur aus deiner Eingabe übernommen. Der Einkaufsstatus bleibt unabhängig davon.",
	useOlderStock: "Zuerst nach angegebenem Haltbarkeitsdatum, dann nach Kaufjahr sortiert. Angebrochene und ältere Lose gezielt aufbrauchen.",
	seedPastDate: "Das angegebene Datum ist überschritten. Ein Keimtest kann helfen; das Datum allein bedeutet nicht, dass keine Samen mehr keimen.",
	noSeedLots: "Für diese Pflanze sind noch keine Saatgutlose erfasst.",
	plant_count: "Pflanzenanzahl für die Ertragsberechnung",
	plantCountHint: "Für Ertrag pro Pflanze bitte die tatsächlich ertragsbezogene Pflanzenanzahl in der Kultur pflegen. Die Aussaatmenge wird nicht automatisch dafür verwendet. Bei unbekannter Anzahl bleibt der Wert offen.",
	newJournal: "Tagebucheintrag",
	cultureJournal: "Gartentagebuch",
	entry_kind: "Eintragsart",
	kind_observation: "Beobachtung",
	kind_germination: "Keimung",
	kind_growth: "Wachstum",
	kind_pest: "Schädlinge / Krankheiten",
	kind_harvest: "Ernte",
	amount: "Erntemenge",
	pieces: "Stück",
	journalHint: "Dieser Eintrag gehört zur ausgewählten Kultur und ändert ihren Status nicht automatisch. Eine Einzelerntenmenge wird zur Gesamternte addiert. Ein Foto pro Eintrag; weitere Fotos als eigene Einträge erfassen.",
	takePhoto: "Foto aufnehmen",
	addObservation: "Beobachtung notieren",
	recordHarvest: "Ernte erfassen",
	finishWork: "Aufgabe erledigen",
	emptyJournal: "Noch keine Tagebucheinträge.",
	totalHarvest: "Gesamternte",
	singleHarvests: "Einzelernten",
	perPlant: "Ertrag pro Pflanze",
	noHarvests: "Noch keine Ernten für diese Auswahl.",
	cultureTools: "Kulturansichten",
	cultureView_list: "Kulturen & Aufgaben",
	cultureView_garden: "Gartenmodus",
	cultureView_harvest: "Ernte & Auswertung",
	chooseCulture: "Kultur auswählen",
	harvestAnalysisHint: "Gramm und Kilogramm werden als Kilogramm zusammengefasst; Stück bleiben getrennt. Pflanzen, Sorten und Beetzuordnungen werden beim Erfassen der Ernte festgehalten. Die Ertragsberechnung verwendet die aktuell gepflegte Pflanzenanzahl jeder beteiligten Kultur genau einmal je Einheit und Gruppe. Fehlt eine Anzahl, bleibt der entsprechende Durchschnitt offen. Jahre beziehen sich auf das Erntedatum.",
	groupHarvest: "Vergleichen nach",
	harvestYear: "Erntejahr",
	harvestPlant: "Erntepflanze",
	harvestVariety: "Erntesorte",
	harvestLocation: "Erntebeet / Standort",
	allValues: "Alle",
	group_plant: "Pflanze",
	group_variety: "Pflanze und Sorte",
	group_location: "Beet / Standort",
	group_year: "Erntejahr",
	group_culture: "Kultur",
	totalWeight: "Gesamtgewicht",
	totalPieces: "Gesamtstückzahl",
	weightPerPlant: "kg pro Pflanze",
	piecesPerPlant: "Stück pro Pflanze",
	backOverview: "Zurück zur Übersicht",
	uploadImage: "Bild hochladen",
	imagePreview: "Bildvorschau",
	imageHint: "JPEG, PNG oder WebP bis 12 MiB. Wird lokal als kleine PNG-Vorschau gespeichert; Originaldatei und Metadaten werden nicht übernommen.",
	imageProcessing: "Bild wird vorbereitet …",
	removeImage: "Bild entfernen",
	imageInvalid: "Das Bild konnte nicht verarbeitet werden. Bitte ein gültiges JPEG-, PNG- oder WebP-Bild bis 12 MiB wählen.",
	plantNeighbors: "Pflanznachbarn",
	neighborMatrix: "Nachbarschaftsmatrix",
	matrixFilter: "Pflanzen in Zeilen und Spalten filtern",
	matrixHint: "Zelle anklicken: nicht zugeordnet → gut → ungünstig → nicht zugeordnet. Jede Änderung gilt automatisch gegenseitig. Freie Namen lassen sich weiterhin unter „Nachbarn bearbeiten“ ergänzen.",
	neighbor_self: "Dieselbe Pflanze",
	neighbor_good: "Gut",
	neighbor_bad: "Ungünstig",
	neighbor_neutral: "Nicht zugeordnet / unklar",
	noPlantsMatch: "Keine Pflanzen für diese Auswahl.",
	growingAtGlance: "Anzucht auf einen Blick",
	germinationHint: "Abhängig von Temperatur und Saatgut",
	germinationTemperature: "Keimtemperatur",
	optimalShort: "optimal",
	substrateHint: "Grün zeigt den optimalen Bereich der Keimsubstrat-Temperatur.",
	plantYear: "Jahresübersicht",
	compact_managedPlants: "Pflanzen",
	compact_planned: "Geplant",
	compact_active: "Laufend",
	compact_successful: "Erfolgreich",
	compact_openTasks: "Aufgaben",
	cultureScope: "Kulturen anzeigen",
	currentCultures: "Alle aktuellen Kulturen",
	noCulturesMatch: "Keine Kulturen für diese Auswahl.",
	historySuccessOnly: "Nur erfolgreich dokumentiert",
	quickActivities: "Tätigkeit schnell filtern",
	showOnly: "Nur anzeigen:",
	seedSaving: "Saatgutauswahl wird gespeichert …",
	seedSaveFailed: "Die Auswahl ist noch nicht bestätigt gespeichert. Bitte erneut versuchen oder die Auswahl verwerfen und neu laden.",
	retrySeed: "Erneut speichern",
	neighbors: "Nachbarn",
	seeds: "Saatgut & Einkauf",
	goodNeighbors: "Gute Nachbarn",
	badNeighbors: "Schlechte Nachbarn",
	editNeighbors: "Nachbarn bearbeiten",
	neighborIntro: "Pflege deine eigenen Mischkultur-Erfahrungen. Katalog-Zuordnungen gelten automatisch für beide Pflanzen.",
	chooseNeighborPlant: "Pflanze auswählen",
	neighborSearch: "Nachbarn suchen",
	extraGoodNeighbors: "Weitere gute Nachbarn (ein Name pro Zeile)",
	extraBadNeighbors: "Weitere schlechte Nachbarn (ein Name pro Zeile)",
	freeNeighbor: "Freie Angabe",
	noNeighbors: "Noch keine Nachbarn zugeordnet.",
	neighborConflict: "Bitte ordne jeden Nachbarn nur einer Gruppe zu und wähle nicht die Pflanze selbst. Bei gleichen Pflanzennamen nutze die Katalogauswahl.",
	seedIntro: "Gemeinsame Saatgutplanung für deinen Pflanzenkatalog. Wähle je Pflanze einen Status. Deine Auswahl wird automatisch gespeichert; warte vor dem Schließen auf das Ende des Speichervorgangs.",
	seed_available: "Vorhanden",
	seed_buy: "Kaufen",
	seed_unneeded: "Nicht benötigt",
	seed_unplanned: "Offen",
	seedPending: "Ungespeicherte Änderungen",
	saveSeed: "Änderungen speichern",
	discardSeed: "Auswahl verwerfen",
	seedFilter: "Status filtern",
	seedAll: "Alle Zustände",
	seedHint: "„Nicht benötigt“ passt zu Bäumen, Sträuchern oder einer Pause. „Offen“ bedeutet: noch nicht entschieden. Bei einem Änderungskonflikt Auswahl verwerfen und neu auswählen.",
	completeTaskTitle: "Gartenarbeit erledigen?",
	completeTaskBody: "Möchtest du diese Aufgabe wirklich als erledigt markieren? Sie wird anschließend aus „Nächste Gartenarbeiten“ ausgeblendet.",
	confirmTask: "Ja, als erledigt markieren",
	savingReminders: "Änderungen werden gespeichert …",
	matrixScrollHint: "Für weitere Tätigkeiten seitlich wischen.",
	reminders: "Erinnerungen",
	personalTask: "Meine geplante Gartenarbeit",
	personalSubtitle: "Wähle, woran du erinnert werden möchtest.",
	personalUnavailable: "Persönliche Erinnerungen sind nur in der Home-Assistant-Integration verfügbar.",
	personalIntro: "Dein persönlicher Aufgabenplan. Markierte Tätigkeitszeiträume erzeugen Gartenarbeiten unter „Nächste Gartenarbeiten“. Deine Auswahl wird automatisch gespeichert.",
	personalGlobalOn: "Der Erinnerungsversand ist global aktiviert.",
	personalGlobalOff: "Der Erinnerungsversand ist global ausgeschaltet. Deine Gartenarbeiten werden trotzdem angelegt; ein Administrator muss den Versand aktivieren.",
	personalChannelOn: "Persönliche Versandziele sind eingerichtet.",
	personalChannelOff: "Für dich ist noch kein persönliches Versandziel aktiviert. Bitte einen Administrator um die Einrichtung von Push oder E-Mail.",
	personalNoWindow: "Kein Tätigkeitszeitraum für diese Tätigkeit vorhanden.",
	personalHint: "Vorhandene Tätigkeiten sind zunächst aktiviert. Ohne Tätigkeitszeitraum bleibt die Checkbox ausgegraut. Kommt eine Tätigkeit neu hinzu, ist sie zunächst aktiviert. Deine Abwahl entfernt zugehörige offene Aufgaben. Erledigte Einträge bleiben erhalten. Aufgaben entstehen für die nächsten zwölf Monate und lassen sich als erledigt markieren. Push und E-Mail folgen den vorhandenen Einstellungen. Beim Speichern wird keine Testnachricht gesendet.",
	personalSharedHint: "Zusätzlich ist ein gemeinsamer Kanal aktiviert. Er erinnert weiterhin an manuelle gemeinsame Aufgaben. Persönlich erzeugte Gartenarbeiten gehen ausschließlich an deine persönlichen Versandziele.",
	multiFilterHint: "Mehrere Werte möglich. Ohne Auswahl werden alle angezeigt.",
	windowDetail: "Tätigkeitszeitraum",
	recurringWindow: "Jährlich wiederkehrender Zeitraum",
	plantProfile: "Pflanzensteckbrief",
	openPlant: "Alle Pflanzendetails",
	editWindow: "Tätigkeitszeitraum bearbeiten",
	windowExtra: "Regionale Hinweise und Quelle",
	fullWindowNote: "Vollständige Notiz anzeigen",
	jumpWindows: "Zeiträume",
	jumpObservations: "Beobachtungen",
	haMenu: "Home-Assistant-Menü öffnen",
	plantSections: "Pflanzenbereiche",
	allPlantInformation: "Alle Pflanzeninformationen anzeigen",
	optimalGermination: "Keimtemperatur (optimal)",
	germinationLimits: "Keimtemperatur (Grenzen)",
	germinationDuration: "Keimdauer",
	cultivationDuration: "Kulturdauer",
	plantRowSpacing: "Pflanz- / Reihenabstand",
	sharedChannelEnabled: "An bisherigen gemeinsamen Kanal senden (ggf. zusätzliche Empfänger)",
	userRoles: "Benutzer und Benachrichtigungen",
	haUser: "Home-Assistant-Benutzer",
	canView: "Garden Planner sehen",
	canEdit: "Garden Planner bearbeiten",
	administrator: "Administrator · volle Rechte",
	push: "Push erhalten",
	email: "E-Mail erhalten",
	routeDestination: "Gerät / Versandziel",
	missingDestination: "nicht verfügbar",
	emailRecipient: "Empfänger-E-Mail-Adresse",
	sidebarHint: "Entzogenes Leserecht blendet den Menüpunkt in der nativen HA-Seitenleiste aus. Andere Menüeinträge bleiben unverändert. Administratoren behalten Zugriff. Bereits geöffnete Ansichten verlieren ihre Datenberechtigung; bei älteren Clients kann Neuladen nötig sein.",
	rolesHint: "Administratoren haben immer volle Rechte. Bearbeiten schließt Sehen ein. Diese Rechte schützen die Garden-Planner-Oberfläche und ihre Datenzugriffe; native HA-Entitäten unterliegen zusätzlich den Home-Assistant-Rechten.",
	routeHint: "Push und E-Mail lassen sich je Benutzer getrennt aktivieren. Wähle das tatsächliche Gerät oder die E-Mail-Entität; Home Assistant ordnet diese Ziele nicht automatisch einem Benutzer zu. Es werden keine Testnachrichten gesendet. Identische Versandziele werden pro Termin nur einmal angesprochen.",
	integrationSettings: "Home-Assistant-Einstellungen",
	writers: "Bearbeiten erlauben",
	settingsSaved: "Einstellungen gespeichert.",
	reminders_enabled: "Erinnerungen ausdrücklich aktivieren",
	lead_days: "Vorlaufzeit (Tage)",
	reminder_hour: "Versand ab Stunde (HA-Zeitzone)",
	notify_service: "Bisheriger gemeinsamer Kanal (optional)",
	notify_entity: "Benachrichtigungs-Entität",
	reminderLanguage: "Sprache der Erinnerungen",
	reminderInfo: "Nur gespeicherte Zeitfenster und Aufgaben werden berücksichtigt. Es werden keine Pflegezeitpunkte geschätzt. Pro Termin erfolgt höchstens ein Versandversuch; ein unklar fehlgeschlagener Versuch wird nicht automatisch wiederholt.",
	reminderCatchup: "Nach einer Unterbrechung werden Termine bis zu sieben Tage rückwirkend berücksichtigt. Die Aktivierung kann solche noch nicht versuchten Termine einschließen.",
	noChannel: "Kein Kanal gewählt",
	noSensor: "Sensor nicht verfügbar",
	badTemperatureUnit: "Keine vergleichbare Temperatureinheit",
	liveTemperature: "Aktuelle Messung",
	outsideRange: "Die Keimsubstrattemperatur liegt außerhalb des hinterlegten optimalen Keimbereichs.",
	notComparable: "Diese Messart ist keine direkte Messung des Keimsubstrats. Es erfolgt kein automatischer Keimtemperatur-Vergleich.",
	deliveryLog: "Versandprotokoll",
	sent: "Versendet",
	reserved: "Reserviert / Ergebnis offen",
	uncertain: "Ergebnis unklar, keine automatische Wiederholung",
	noDeliveries: "Noch keine Versandversuche.",
	grantedEditor: "Du hast eine Bearbeitungsfreigabe für diesen Garten.",
	notifyEntityHint: "Eine Benachrichtigungs-Entität ist eine vorhandene HA-Kennung wie notify.mail_martin, keine E-Mail-Adresse. Bei notify.send_message hier eine solche Entität wählen; SMTP-Empfänger werden in Home Assistant eingerichtet. Bei einem älteren Dienst wie notify.email bleibt dieses Entitätsfeld leer. Für getrennte Empfänger verwende die Benutzertabelle mit eigener E-Mail-Adresse je Benutzer. Bei Aktivierung eines Benutzerziels wird der bisherige gemeinsame Kanal ausgeschaltet. Nur wenn ausdrücklich wieder zugeschaltet, sendet er zusätzlich an seine konfigurierten Standardempfänger."
}, vt = {
	harvestUnitsHint: "Weights and pieces are separate. — means the plant count is unknown.",
	calculationHelp: "How are results calculated?",
	moreHarvestFilters: "Filter by plant, variety and bed",
	photoLoading: "Loading photo …",
	photoLoadError: "The photo could not be loaded.",
	stockQuantity: "Stock quantity",
	newSeedLot: "Add seed lot",
	seedLots: "Seed stock",
	manageStock: "Open stock",
	stockTotal: "Stock totals by unit",
	lot_label: "Packet / lot",
	unit: "Unit",
	unit_seeds: "Seeds",
	unit_packets: "Packets",
	unit_g: "g",
	unit_kg: "kg",
	unit_pieces: "Pieces",
	purchase_year: "Purchase year",
	best_before: "Best before / viable until",
	opened_on: "Opened on",
	germination_percent: "Tested germination (%)",
	germination_tested_on: "Germination tested on",
	storage_location: "Storage location",
	seedLotHint: "A lot can represent one packet. Units are summed separately. Germination is recorded from your input, never estimated. Shopping status remains independent.",
	useOlderStock: "Sorted by stated best-before date, then purchase year. Use opened and older lots first.",
	seedPastDate: "The stated date has passed. Consider a germination test; the date alone does not mean no seeds will germinate.",
	noSeedLots: "No seed lots recorded for this plant.",
	plant_count: "Plant count for yield calculation",
	plantCountHint: "Enter the actual plant count used for yield in the cultivation. Sowing quantity is not used automatically. Unknown counts leave per-plant yield blank.",
	newJournal: "Journal entry",
	cultureJournal: "Garden journal",
	entry_kind: "Entry kind",
	kind_observation: "Observation",
	kind_germination: "Germination",
	kind_growth: "Growth",
	kind_pest: "Pests / disease",
	kind_harvest: "Harvest",
	amount: "Harvest quantity",
	pieces: "Pieces",
	journalHint: "This entry belongs to the selected cultivation and does not change its lifecycle status automatically. Individual harvests contribute to the total. One photo per entry; add further photos as separate entries.",
	takePhoto: "Take photo",
	addObservation: "Record observation",
	recordHarvest: "Record harvest",
	finishWork: "Complete task",
	emptyJournal: "No journal entries yet.",
	totalHarvest: "Total harvest",
	singleHarvests: "Individual harvests",
	perPlant: "Yield per plant",
	noHarvests: "No harvests for this selection.",
	cultureTools: "Cultivation views",
	cultureView_list: "Cultivations & tasks",
	cultureView_garden: "Garden mode",
	cultureView_harvest: "Harvest & analysis",
	chooseCulture: "Select cultivation",
	harvestAnalysisHint: "Grams and kilograms are combined as kilograms; piece counts stay separate. Plant, variety and location are captured when recording the harvest. Per-plant results use the current plant count for each contributing cultivation once per unit and group. Any unknown count leaves that average blank. Years refer to the harvest date.",
	groupHarvest: "Compare by",
	harvestYear: "Harvest year",
	harvestPlant: "Harvest plant",
	harvestVariety: "Harvest variety",
	harvestLocation: "Harvest bed / location",
	allValues: "All",
	group_plant: "Plant",
	group_variety: "Plant and variety",
	group_location: "Bed / location",
	group_year: "Harvest year",
	group_culture: "Cultivation",
	totalWeight: "Total weight",
	totalPieces: "Total pieces",
	weightPerPlant: "kg per plant",
	piecesPerPlant: "Pieces per plant",
	backOverview: "Back to overview",
	uploadImage: "Upload image",
	imagePreview: "Image preview",
	imageHint: "JPEG, PNG or WebP up to 12 MiB. Saved locally as a small PNG preview; the original file and metadata are not retained.",
	imageProcessing: "Preparing image …",
	removeImage: "Remove image",
	imageInvalid: "The image could not be processed. Choose a valid JPEG, PNG or WebP image up to 12 MiB.",
	plantNeighbors: "Plant neighbors",
	neighborMatrix: "Neighbor matrix",
	matrixFilter: "Filter plants in rows and columns",
	matrixHint: "Click a cell: unassigned → good → unfavorable → unassigned. Changes apply reciprocally. Add external names using “Edit neighbors”.",
	neighbor_self: "Same plant",
	neighbor_good: "Good",
	neighbor_bad: "Unfavorable",
	neighbor_neutral: "Unassigned / unknown",
	noPlantsMatch: "No plants match this selection.",
	growingAtGlance: "Growing at a glance",
	germinationHint: "Depends on temperature and seed",
	germinationTemperature: "Germination temperature",
	optimalShort: "optimal",
	substrateHint: "Green indicates the optimal germination substrate temperature.",
	plantYear: "Year overview",
	compact_managedPlants: "Plants",
	compact_planned: "Planned",
	compact_active: "Active",
	compact_successful: "Successful",
	compact_openTasks: "Tasks",
	cultureScope: "Show cultures",
	currentCultures: "All current cultures",
	noCulturesMatch: "No cultures match this selection.",
	historySuccessOnly: "Successful records only",
	quickActivities: "Quick activity filter",
	showOnly: "Show only:",
	seedSaving: "Saving seed choices …",
	seedSaveFailed: "Your choices have not been confirmed as saved. Retry or discard and reload.",
	retrySeed: "Retry save",
	neighbors: "Neighbors",
	seeds: "Seeds & shopping",
	goodNeighbors: "Good neighbors",
	badNeighbors: "Bad neighbors",
	editNeighbors: "Edit neighbors",
	neighborIntro: "Record your own companion-planting observations. Catalog links automatically apply to both plants.",
	chooseNeighborPlant: "Select plant",
	neighborSearch: "Search neighbors",
	extraGoodNeighbors: "Other good neighbors (one name per line)",
	extraBadNeighbors: "Other bad neighbors (one name per line)",
	freeNeighbor: "Free entry",
	noNeighbors: "No neighbors assigned yet.",
	neighborConflict: "Assign each neighbor to only one group and do not select the plant itself. For duplicate plant names, use catalog selection.",
	seedIntro: "Shared seed planning for your plant catalog. Select one state per plant. Choices save automatically; wait for saving to finish before closing.",
	seed_available: "Available",
	seed_buy: "Buy",
	seed_unneeded: "Not needed",
	seed_unplanned: "Undecided",
	seedPending: "Unsaved changes",
	saveSeed: "Save changes",
	discardSeed: "Discard choices",
	seedFilter: "Filter by state",
	seedAll: "All states",
	seedHint: "Use “Not needed” for trees, shrubs or a seasonal break. “Undecided” means no choice yet. If another edit conflicts, discard choices and select again.",
	completeTaskTitle: "Complete garden task?",
	completeTaskBody: "Mark this task as complete? It will be removed from Upcoming garden work.",
	confirmTask: "Yes, mark as complete",
	savingReminders: "Saving changes …",
	matrixScrollHint: "Swipe sideways for more activities.",
	reminders: "Reminders",
	personalTask: "My planned garden task",
	personalSubtitle: "Choose what you want to be reminded about.",
	personalUnavailable: "Personal reminders are available in the Home Assistant integration.",
	personalIntro: "Your personal task plan. Selected activity periods create tasks under Upcoming garden work. Your choices save automatically.",
	personalGlobalOn: "Reminder delivery is globally enabled.",
	personalGlobalOff: "Reminder delivery is globally disabled. Tasks are still generated; an administrator must enable notification delivery.",
	personalChannelOn: "Personal delivery destinations are configured.",
	personalChannelOff: "No personal delivery destination is enabled for you. Ask an administrator to configure push or email.",
	personalNoWindow: "No activity period exists for this activity.",
	personalHint: "Available activities start enabled. Missing windows disable the checkbox. Newly available activities start enabled. Opting out removes related open tasks; completed history is preserved. Tasks cover the next twelve months and can be completed. Push/email use the existing settings. Saving sends no test message.",
	personalSharedHint: "A shared channel is also enabled. It continues to notify shared manual tasks. Personal generated tasks go only to your personal delivery destinations.",
	multiFilterHint: "Select multiple values. An empty selection shows all.",
	windowDetail: "Activity period",
	recurringWindow: "Annually recurring window",
	plantProfile: "Plant profile",
	openPlant: "All plant details",
	editWindow: "Edit activity period",
	windowExtra: "Regional notes and source",
	fullWindowNote: "Show complete note",
	jumpWindows: "Windows",
	jumpObservations: "Observations",
	haMenu: "Open Home Assistant menu",
	plantSections: "Plant sections",
	allPlantInformation: "Show all plant information",
	optimalGermination: "Germination temperature (optimal)",
	germinationLimits: "Germination temperature (limits)",
	germinationDuration: "Germination days",
	cultivationDuration: "Cultivation days",
	plantRowSpacing: "Plant / row spacing",
	sharedChannelEnabled: "Send to existing shared channel (may include additional recipients)",
	userRoles: "Users and notifications",
	haUser: "Home Assistant user",
	canView: "View Garden Planner",
	canEdit: "Edit Garden Planner",
	administrator: "Administrator · full access",
	push: "Receive push",
	email: "Receive email",
	routeDestination: "Device / destination",
	missingDestination: "unavailable",
	emailRecipient: "Recipient email address",
	sidebarHint: "Revoking viewing hides the native HA sidebar link and keeps other entries unchanged. Administrators retain access. Already-open views lose data access; older clients may need a reload.",
	rolesHint: "Administrators always have full access. Editing includes viewing. These permissions protect the Garden Planner panel and its data API; native HA entities also follow Home Assistant permissions.",
	routeHint: "Enable push and email independently for each user. Select the actual device or email entity; Home Assistant does not automatically assign destinations to users. No test messages are sent. Identical destinations receive at most one attempt per date.",
	integrationSettings: "Home Assistant settings",
	writers: "Allow editing",
	settingsSaved: "Settings saved.",
	reminders_enabled: "Explicitly enable reminders",
	lead_days: "Lead time (days)",
	reminder_hour: "Send from hour (HA timezone)",
	notify_service: "Existing shared channel (optional)",
	notify_entity: "Notification entity",
	reminderLanguage: "Reminder language",
	reminderInfo: "Only stored windows and tasks are considered. No care dates are guessed. At most one delivery attempt is made per date; an uncertain failed attempt is not automatically repeated.",
	reminderCatchup: "After downtime, dates up to seven days in the past are considered. Enabling reminders may include such dates that have not been attempted yet.",
	noChannel: "No channel selected",
	noSensor: "Sensor unavailable",
	badTemperatureUnit: "No comparable temperature unit",
	liveTemperature: "Current measurement",
	outsideRange: "The germination substrate temperature is outside the recorded optimal germination range.",
	notComparable: "This measurement is not a direct germination-substrate reading. No automatic germination comparison is made.",
	deliveryLog: "Delivery log",
	sent: "Sent",
	reserved: "Reserved / result pending",
	uncertain: "Result uncertain, no automatic retry",
	noDeliveries: "No delivery attempts yet.",
	grantedEditor: "You have permission to edit this shared garden.",
	notifyEntityHint: "A notification entity is an existing HA identifier such as notify.mail_martin, not an email address. Select it for notify.send_message; configure SMTP recipient entities in Home Assistant. Leave this field empty for legacy services such as notify.email. Use the user table with an explicit recipient address for separate legacy email recipients. Enabling a user destination switches off the existing shared channel. It sends additionally to its configured defaults only if explicitly switched back on."
};
function yt(e, t) {
	return (e === "de" ? _t : vt)[t];
}
// src/i18n.ts
var bt = {
	overview: "Übersicht",
	calendar: "Gartenkalender",
	plants: "Meine Pflanzen",
	cultures: "Aktuelle Kulturen",
	history: "Aussaat-Historie",
	locations: "Beete & Standorte",
	settings: "Einstellungen",
	tagline: "Kleine Schritte. Ein Garten voller Möglichkeiten.",
	garden: "Dein Garten im Blick",
	welcome: "Was wächst als Nächstes?",
	overviewIntro: "Planen, beobachten und aus jeder Gartensaison lernen.",
	newSowing: "Aussaat erfassen",
	newPlant: "Pflanze anlegen",
	newLocation: "Standort anlegen",
	newTask: "Aufgabe anlegen",
	newWindow: "Tätigkeitszeitraum hinzufügen",
	newVariety: "Sorte hinzufügen",
	newEvent: "Ereignis erfassen",
	thisMonth: "Das ist diesen Monat möglich",
	upcoming: "Nächste Gartenarbeiten",
	allTasks: "Alle Aufgaben",
	allPlants: "Alle Pflanzen",
	noWindows: "Für diesen Monat sind keine Tätigkeitszeiträume hinterlegt.",
	recommendation: "Aus deinen hinterlegten Zeiträumen. Boden, Standort und Witterung vor Ort prüfen.",
	emptyPlants: "Dein Garten beginnt mit einer Pflanze.",
	emptyPlantsBody: "Lege deine erste Pflanze an und halte ihre Tätigkeitszeiträume fest. Deine Beobachtungen bleiben über Jahre erhalten.",
	emptyCultures: "Noch keine Aussaat dokumentiert.",
	emptyHistory: "Hier wächst deine Gartengeschichte.",
	emptyLocations: "Gib deinen Pflanzen einen Platz.",
	noResults: "Keine passenden Einträge gefunden.",
	possibleThisWeek: "Diese Woche möglich",
	noWeekWindows: "Keine passenden Tätigkeitszeiträume in dieser Woche. Prüfe bei Bedarf die Filter oder die hinterlegten Zeiträume.",
	noAppointments: "Keine Termine",
	noSensors: "Keine passenden Temperatursensoren. Eine Sensor-ID kann auch manuell eingegeben werden.",
	noTasks: "Gerade steht nichts an. Zeit für einen Blick ins Grüne.",
	managedPlants: "Pflanzen im Garten",
	planned: "Geplant",
	active: "Laufende Kulturen",
	successful: "Erfolgreich dokumentiert",
	openTasks: "Offene Aufgaben",
	name: "Name",
	botanical_name: "Botanischer Name",
	category: "Kategorie",
	description: "Beschreibung",
	notes: "Notizen",
	light: "Lichtbedarf",
	water: "Wasserbedarf",
	frost: "Frostverträglichkeit",
	care: "Pflegehinweise",
	site: "Standortanforderungen",
	soil: "Bodenbeschaffenheit",
	location_type: "Standorttyp",
	source: "Quelle",
	source_url: "Quellen-URL",
	regional_notes: "Regionale Hinweise",
	title: "Titel",
	sensor_entity_id: "Temperatursensor (optional)",
	germination_min_c: "Keimtemperatur: Minimum (°C)",
	germination_optimal_min_c: "Keimtemperatur: optimal ab (°C)",
	germination_optimal_max_c: "Keimtemperatur: optimal bis (°C)",
	germination_max_c: "Keimtemperatur: Maximum (°C)",
	germination_days_min: "Keimdauer: mindestens (Tage)",
	germination_days_max: "Keimdauer: höchstens (Tage)",
	depth_cm: "Saattiefe (cm)",
	spacing_cm: "Pflanzabstand (cm)",
	row_spacing_cm: "Reihenabstand (cm)",
	duration_days_min: "Kulturdauer: mindestens (Tage)",
	duration_days_max: "Kulturdauer: höchstens (Tage)",
	quantity: "Anzahl Samen / Pflanzen",
	temperature_c: "Gemessene Temperatur (°C)",
	plant_id: "Pflanze",
	variety_id: "Sorte (optional)",
	location_id: "Standort / Beet (optional)",
	cultivation_id: "Kultur (optional)",
	date: "Datum",
	method: "Aussaatmethode",
	environment: "Anbauumgebung",
	activity: "Tätigkeit",
	measurement_kind: "Art der Temperaturmessung",
	status: "Kulturereignis",
	initial_status: "Erster Status",
	result: "Gesamtergebnis",
	germination_result: "Keimerfolg",
	harvest_result: "Ernteerfolg",
	completed: "Erledigt",
	archived: "Archiviert",
	start_month: "Startmonat",
	start_day: "Starttag",
	end_month: "Endmonat",
	end_day: "Endtag",
	vegetables: "Gemüse",
	herbs: "Kräuter",
	flowers: "Blumen",
	fruit: "Obst",
	other: "Sonstige",
	direct: "Direktsaat",
	indoors: "Vorziehen",
	transplant: "Auspflanzen",
	harvest: "Ernte",
	prick_out: "Pikieren",
	careActivity: "Pflege",
	fertilize: "Düngen",
	prune: "Rückschnitt",
	outdoors: "Freiland",
	greenhouse: "Gewächshaus",
	cold_frame: "Frühbeet",
	air: "Lufttemperatur",
	soilTemperature: "Bodentemperatur",
	substrate: "Keimsubstrattemperatur",
	sown: "Ausgesät",
	germinated: "Gekeimt",
	pricked_out: "Pikiert",
	planted_out: "Ausgepflanzt",
	growing: "Wachstumsphase",
	harvesting: "Ernte begonnen",
	completedStatus: "Abgeschlossen",
	failed: "Fehlgeschlagen",
	unknown: "Noch nicht bewertet",
	partial: "Teilweise erfolgreich",
	search: "Pflanzen suchen",
	allCategories: "Alle Kategorien",
	allActivities: "Alle Tätigkeiten",
	allMethods: "Alle Methoden",
	sort: "Sortierung",
	alphabetical: "Nach Name",
	nextSowing: "Nächster Tätigkeitszeitraum",
	showArchived: "Archivierte anzeigen",
	month: "Monat",
	year: "Jahr",
	week: "Woche",
	previous: "Zurück",
	next: "Weiter",
	today: "Heute",
	selectedMonth: "Monat auswählen",
	selectedYear: "Jahr auswählen",
	selectedWeek: "Woche auswählen",
	edit: "Bearbeiten",
	save: "Speichern",
	cancel: "Abbrechen",
	close: "Schließen",
	duplicate: "Duplizieren",
	archive: "Archivieren",
	unarchive: "Archivierung aufheben",
	delete: "Löschen",
	deleteTitle: "Eintrag wirklich löschen?",
	deleteBody: "Diese Aktion lässt sich nicht rückgängig machen. Verknüpfte Aufgaben oder Stammdaten können das Löschen verhindern. Beim Löschen einer Kultur wird ihr Ereignisverlauf mitgelöscht.",
	confirmDelete: "Ja, endgültig löschen",
	plantDetail: "Pflanzendetails",
	cultivationDetail: "Kulturverlauf",
	varieties: "Sorten",
	windows: "Tätigkeitszeiträume",
	observations: "Beobachtungen über die Jahre",
	timeline: "Ereignisse & Notizen",
	snapshot: "Angaben bei der Aussaat",
	snapshotHint: "Diese Momentaufnahme bleibt erhalten, auch wenn du die Pflanze später bearbeitest.",
	recorded: "Dokumentiert",
	plannedDate: "Angelegt / geplant am",
	sowingDate: "Tatsächlich ausgesät",
	details: "Details ansehen",
	noEvents: "Noch keine weiteren Ereignisse.",
	noVarieties: "Noch keine Sorten hinterlegt.",
	noAllWindows: "Noch keine Tätigkeitszeiträume hinterlegt.",
	noNotes: "Keine Notizen hinterlegt.",
	loading: "Dein Garten wird geladen …",
	refresh: "Aktualisieren",
	saved: "Gespeichert.",
	deleted: "Eintrag gelöscht.",
	copied: "Pflanze dupliziert.",
	readOnly: "Du kannst diesen gemeinsamen Garten ansehen. Für Änderungen an gemeinsamen Gartendaten brauchst du eine Freigabe. Deine persönlichen Aufgaben kannst du als erledigt markieren.",
	disconnected: "Garden Planner ist gerade nicht erreichbar. Deine Eingaben bleiben geöffnet.",
	invalid_data: "Die Angaben konnten nicht gespeichert werden. Bitte prüfe Pflichtfelder, Datumsangaben, Temperaturbereiche und Beziehungen.",
	not_found: "Dieser Eintrag ist nicht mehr vorhanden. Bitte aktualisiere die Ansicht.",
	conflict: "Die Daten wurden inzwischen geändert oder sind noch verknüpft. Aktualisiere die Ansicht und prüfe die Angaben erneut.",
	storage_error: "Die Daten konnten nicht verarbeitet werden. Bitte Speicher und Sicherungen prüfen.",
	unauthorized: "Für diese Aktion fehlt dir die Berechtigung.",
	not_loaded: "Garden Planner ist noch nicht geladen.",
	unexpected: "Die Aktion konnte nicht abgeschlossen werden. Bitte versuche es erneut.",
	language: "Sprache der Oberfläche",
	languageHint: "Gilt nur für diesen Browser. Ohne Auswahl wird die Home-Assistant-Sprache verwendet.",
	automatic: "Automatisch",
	dataSafety: "Deine Daten gehören dir",
	dataSafetyBody: "Exportiere deine Gartengeschichte oder lege eine lokale Sicherung an. Ein Ersetzungsimport braucht immer eine geprüfte Vorschau.",
	exportJson: "JSON exportieren",
	exportCsv: "CSV-Tabellen exportieren",
	importData: "Datei importieren",
	importMode: "Importverfahren",
	merge: "Zusammenführen, nichts überschreiben",
	replace: "Gesamten Datenbestand ersetzen",
	preview: "Vorschau prüfen",
	applyImport: "Geprüften Import übernehmen",
	importPreview: "Importvorschau",
	inserted: "Neu",
	updated: "Geändert",
	skipped: "Unverändert",
	removed: "Entfernt",
	conflicts: "Konflikte",
	replaceWarning: "Der gesamte Datenbestand wird durch die geprüfte Datei ersetzt. Vorher wird automatisch eine Sicherung erstellt.",
	confirmReplace: "Ich möchte den Datenbestand ersetzen.",
	backup: "Sicherung erstellen",
	backups: "Vorhandene Sicherungen",
	restorePreview: "Wiederherstellung prüfen",
	restore: "Geprüfte Sicherung wiederherstellen",
	backupSaved: "Sicherung erstellt.",
	restored: "Sicherung wiederhergestellt.",
	importDone: "Import abgeschlossen.",
	invalidFile: "Die Datei ist ungültig, unvollständig oder zu groß (maximal 20 MiB).",
	download: "Herunterladen",
	adminOnly: "Datensicherung und Import sind Administratoren vorbehalten.",
	timezone: "Zeitzone",
	notifications: "Erinnerungen",
	notificationsHint: "Erinnerungen sind noch nicht verfügbar. Es werden keine Nachrichten versendet.",
	observationHint: "Ergebnisse sind deine dokumentierten Beobachtungen, keine automatisch ermittelten Ursachen.",
	temperatureHint: "Keimtemperaturen beziehen sich auf das Keimsubstrat. Eine Luftmessung ist damit nicht automatisch vergleichbar.",
	optional: "Keine Auswahl",
	general: "Allgemeine Angaben",
	growingDetails: "Keimung & Abstände",
	additional: "Weitere Angaben",
	taskDone: "Als erledigt markieren",
	undoTask: "Wieder öffnen",
	initialEventHint: "Datum und Status dieses ersten Ereignisses werden über die Aussaat bearbeitet.",
	limitedTransport: "Dateiübertragungen unterliegen zusätzlich der Größenbegrenzung deiner Home-Assistant-Verbindung.",
	retry: "Erneut versuchen",
	yearlyHint: "Jede Zeile zeigt eine Tätigkeit. Tippe auf einen Balken für Zeitraumdetails und Pflanzensteckbrief.",
	actualWork: "Geplante Aufgaben und dokumentierte Ereignisse",
	untitled: "Unbenannter Eintrag",
	variety: "Sorte",
	numberRange: "Bitte prüfe die Zahlenbereiche und gültigen Kalendertage.",
	busy: "Wird gespeichert …",
	new: "Neu",
	historicalName: "Name zum Zeitpunkt der Aussaat"
}, xt = {
	overview: "Overview",
	calendar: "Garden calendar",
	plants: "My plants",
	cultures: "Current crops",
	history: "Sowing history",
	locations: "Beds & locations",
	settings: "Settings",
	tagline: "Small steps. A garden full of possibilities.",
	garden: "Your garden at a glance",
	welcome: "What will grow next?",
	overviewIntro: "Plan, observe and learn from every growing season.",
	newSowing: "Record a sowing",
	newPlant: "Add a plant",
	newLocation: "Add a location",
	newTask: "Add a task",
	newWindow: "Add a activity period",
	newVariety: "Add a variety",
	newEvent: "Record an event",
	thisMonth: "What you can do this month",
	upcoming: "Next garden tasks",
	allTasks: "All tasks",
	allPlants: "All plants",
	noWindows: "No activity periods are recorded for this month.",
	recommendation: "Based on your activity periods. Check local soil, location and weather.",
	emptyPlants: "Your garden starts with a plant.",
	emptyPlantsBody: "Add your first plant and its activity periods. Keep your observations for years to come.",
	emptyCultures: "No sowings recorded yet.",
	emptyHistory: "Your garden story grows here.",
	emptyLocations: "Give your plants a place to grow.",
	noResults: "No matching records.",
	possibleThisWeek: "Possible this week",
	noWeekWindows: "No matching activity periods this week. Check the filters or your recorded periods.",
	noAppointments: "No appointments",
	noSensors: "No matching temperature sensors. You can also enter a sensor ID manually.",
	noTasks: "Nothing due right now. A moment to enjoy your garden.",
	managedPlants: "Plants in the garden",
	planned: "Planned",
	active: "Growing crops",
	successful: "Recorded as successful",
	openTasks: "Open tasks",
	name: "Name",
	botanical_name: "Botanical name",
	category: "Category",
	description: "Description",
	notes: "Notes",
	light: "Light requirements",
	water: "Water requirements",
	frost: "Frost tolerance",
	care: "Care instructions",
	site: "Site requirements",
	soil: "Soil conditions",
	location_type: "Location type",
	source: "Source",
	source_url: "Source URL",
	regional_notes: "Regional notes",
	title: "Title",
	sensor_entity_id: "Temperature sensor (optional)",
	germination_min_c: "Germination: minimum (°C)",
	germination_optimal_min_c: "Germination: optimal from (°C)",
	germination_optimal_max_c: "Germination: optimal to (°C)",
	germination_max_c: "Germination: maximum (°C)",
	germination_days_min: "Germination: minimum days",
	germination_days_max: "Germination: maximum days",
	depth_cm: "Sowing depth (cm)",
	spacing_cm: "Plant spacing (cm)",
	row_spacing_cm: "Row spacing (cm)",
	duration_days_min: "Crop duration: minimum days",
	duration_days_max: "Crop duration: maximum days",
	quantity: "Number of seeds / plants",
	temperature_c: "Measured temperature (°C)",
	plant_id: "Plant",
	variety_id: "Variety (optional)",
	location_id: "Bed / location (optional)",
	cultivation_id: "Crop (optional)",
	date: "Date",
	method: "Sowing method",
	environment: "Growing environment",
	activity: "Activity",
	measurement_kind: "Temperature measurement kind",
	status: "Crop event",
	initial_status: "Initial status",
	result: "Overall result",
	germination_result: "Germination result",
	harvest_result: "Harvest result",
	completed: "Completed",
	archived: "Archived",
	start_month: "Start month",
	start_day: "Start day",
	end_month: "End month",
	end_day: "End day",
	vegetables: "Vegetables",
	herbs: "Herbs",
	flowers: "Flowers",
	fruit: "Fruit",
	other: "Other",
	direct: "Direct sowing",
	indoors: "Start indoors",
	transplant: "Plant out",
	harvest: "Harvest",
	prick_out: "Prick out",
	careActivity: "Care",
	fertilize: "Fertilize",
	prune: "Prune",
	outdoors: "Outdoors",
	greenhouse: "Greenhouse",
	cold_frame: "Cold frame",
	air: "Air temperature",
	soilTemperature: "Soil temperature",
	substrate: "Germination substrate temperature",
	sown: "Sown",
	germinated: "Germinated",
	pricked_out: "Pricked out",
	planted_out: "Planted out",
	growing: "Growing",
	harvesting: "Harvest started",
	completedStatus: "Completed",
	failed: "Failed",
	unknown: "Not rated yet",
	partial: "Partly successful",
	search: "Search plants",
	allCategories: "All categories",
	allActivities: "All activities",
	allMethods: "All methods",
	sort: "Sort order",
	alphabetical: "By name",
	nextSowing: "Next activity period",
	showArchived: "Show archived",
	month: "Month",
	year: "Year",
	week: "Week",
	previous: "Previous",
	next: "Next",
	today: "Today",
	selectedMonth: "Select month",
	selectedYear: "Select year",
	selectedWeek: "Select week",
	edit: "Edit",
	save: "Save",
	cancel: "Cancel",
	close: "Close",
	duplicate: "Duplicate",
	archive: "Archive",
	unarchive: "Unarchive",
	delete: "Delete",
	deleteTitle: "Permanently delete this record?",
	deleteBody: "This cannot be undone. Linked tasks or records may prevent deletion. Deleting a crop also removes its event timeline.",
	confirmDelete: "Yes, permanently delete",
	plantDetail: "Plant details",
	cultivationDetail: "Crop timeline",
	varieties: "Varieties",
	windows: "Activity periods",
	observations: "Observations across the years",
	timeline: "Events & notes",
	snapshot: "Details at sowing time",
	snapshotHint: "This snapshot stays unchanged when you edit the plant later.",
	recorded: "Recorded",
	plannedDate: "Created / planned on",
	sowingDate: "Actually sown",
	details: "View details",
	noEvents: "No further events yet.",
	noVarieties: "No varieties recorded yet.",
	noAllWindows: "No activity periods recorded yet.",
	noNotes: "No notes recorded.",
	loading: "Loading your garden …",
	refresh: "Refresh",
	saved: "Saved.",
	deleted: "Record deleted.",
	copied: "Plant duplicated.",
	readOnly: "You can view the shared garden. Editing shared data requires permission. You can complete your own personal tasks.",
	disconnected: "Garden Planner cannot be reached right now. Your open form is preserved.",
	invalid_data: "The details could not be saved. Check required fields, dates, temperature ranges and relationships.",
	not_found: "This record no longer exists. Refresh the view.",
	conflict: "Data has changed or still has linked records. Refresh and review before trying again.",
	storage_error: "Data could not be processed. Check storage and backups.",
	unauthorized: "You do not have permission for this action.",
	not_loaded: "Garden Planner is not loaded yet.",
	unexpected: "This action could not be completed. Please try again.",
	language: "Interface language",
	languageHint: "This browser only. Without a selection, the Home Assistant language is used.",
	automatic: "Automatic",
	dataSafety: "Your data belongs to you",
	dataSafetyBody: "Export your garden story or create a local backup. Replacement imports always require a reviewed preview.",
	exportJson: "Export JSON",
	exportCsv: "Export CSV tables",
	importData: "Import a file",
	importMode: "Import mode",
	merge: "Merge without overwriting",
	replace: "Replace the entire dataset",
	preview: "Review preview",
	applyImport: "Apply reviewed import",
	importPreview: "Import preview",
	inserted: "New",
	updated: "Changed",
	skipped: "Unchanged",
	removed: "Removed",
	conflicts: "Conflicts",
	replaceWarning: "The entire dataset will be replaced by the reviewed file. A backup is created first.",
	confirmReplace: "I want to replace the dataset.",
	backup: "Create backup",
	backups: "Available backups",
	restorePreview: "Preview restore",
	restore: "Restore reviewed backup",
	backupSaved: "Backup created.",
	restored: "Backup restored.",
	importDone: "Import completed.",
	invalidFile: "The file is invalid, incomplete or too large (maximum 20 MiB).",
	download: "Download",
	adminOnly: "Import and backups require an administrator.",
	timezone: "Time zone",
	notifications: "Reminders",
	notificationsHint: "Reminders are not available yet. No notifications are sent.",
	observationHint: "Results are your documented observations, not automatically inferred causes.",
	temperatureHint: "Germination ranges refer to the substrate. Air measurements are not automatically comparable.",
	optional: "No selection",
	general: "General details",
	growingDetails: "Germination & spacing",
	additional: "Additional details",
	taskDone: "Mark as completed",
	undoTask: "Reopen",
	initialEventHint: "Edit the initial event date and status through its sowing record.",
	limitedTransport: "File transfers are also subject to your Home Assistant connection size limit.",
	retry: "Try again",
	yearlyHint: "Each row shows an activity. Tap a bar for period details and the plant profile.",
	actualWork: "Planned tasks and recorded events",
	untitled: "Untitled record",
	variety: "Variety",
	numberRange: "Check numeric ranges and valid calendar dates.",
	busy: "Saving …",
	new: "New",
	historicalName: "Name at sowing time"
};
function St(e, t) {
	return (e === "de" ? bt : xt)[t] ?? yt(e, t) ?? t;
}
function Ct(e, t) {
	return St(e, {
		soil: "soilTemperature",
		care: "careActivity",
		completed: "completedStatus",
		successful: "successful"
	}[t] ?? t);
}
function U(e, t) {
	let n = t && typeof t == "object" && "code" in t ? String(t.code) : "";
	return St(e, [
		"invalid_data",
		"not_found",
		"conflict",
		"storage_error",
		"unauthorized",
		"not_loaded"
	].includes(n) ? n : "unexpected");
}
// src/journal-photo.ts
var wt = class extends Ze {
	static {
		this.properties = {
			api: { attribute: !1 },
			record: { attribute: !1 },
			language: { attribute: !1 },
			image: { state: !0 },
			failed: { state: !0 },
			loading: { state: !0 }
		};
	}
	static {
		this.styles = M`
    :host {
      display: block;
      aspect-ratio: 4/3;
      min-height: 120px;
      max-width: 360px;
      background: var(--gp-soft, #edf4ec);
      border-radius: 14px;
      overflow: hidden;
    }
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    div {
      padding: 16px;
      font: inherit;
    }
    button {
      font: inherit;
      padding: 10px;
      min-height: 44px;
      cursor: pointer;
      color: inherit;
      background: transparent;
      border: 1px solid currentColor;
      border-radius: 8px;
    }
  `;
	}
	constructor() {
		super(), this.image = "", this.failed = !1, this.loading = !1, this.visible = !1, this.generation = 0, this.language = "de";
	}
	connectedCallback() {
		super.connectedCallback(), this.observer = new IntersectionObserver((e) => {
			e.some((e) => e.isIntersecting) && (this.visible = !0, this.load());
		}, { rootMargin: "300px" }), this.observer.observe(this);
	}
	disconnectedCallback() {
		this.observer?.disconnect(), this.generation++, this.image = "", this.loading = !1, super.disconnectedCallback();
	}
	updated(e) {
		let t = e.get("record");
		(e.has("api") || e.has("record") && (t?.id !== this.record?.id || t?.revision !== this.record?.revision)) && (this.generation++, this.image = "", this.failed = !1, this.loading = !1, this.visible && this.load());
	}
	async load() {
		let e = this.api, n = this.record;
		if (!e || !n || this.loading || this.image || !this.isConnected) return;
		let r = ++this.generation;
		this.loading = !0, this.failed = !1;
		try {
			let i = await e.command("get", {
				table: "cultivation_journal",
				id: n.id
			});
			if (r !== this.generation || e !== this.api || !this.isConnected) return;
			let a = t(i, "image_data");
			if (!a.startsWith("data:image/png;base64,")) throw Error("missing_image");
			this.image = a;
		} catch {
			r === this.generation && this.isConnected && (this.failed = !0);
		} finally {
			r === this.generation && (this.loading = !1);
		}
	}
	render() {
		return this.image ? B`<img
          src=${this.image}
          alt=${t(this.record, "title") || St(this.language, "imagePreview")}
        />` : B`<div role="status">
          ${St(this.language, this.failed ? "photoLoadError" : "photoLoading")}${this.failed ? B`<button @click=${() => this.load()}>${St(this.language, "retry")}</button>` : B``}
        </div>`;
	}
};
customElements.define("garden-journal-photo", wt);
// src/harvest.ts
function Tt(e, n, r, i = {}) {
	let a = new Map(n.map((e) => [e.id, e])), o = /* @__PURE__ */ new Map();
	for (let n of e) {
		if (n.data.entry_kind !== "harvest") continue;
		let e = n.data.harvest_context;
		if (!e) continue;
		let s = t(n, "date").slice(0, 4);
		if (i.year && s !== i.year || i.plant && e.plant_id !== i.plant || i.variety && (e.variety_id || "_") !== i.variety || i.location && (e.location_id || "_") !== i.location) continue;
		let c = t(n, "cultivation_id"), l = String(e.plant_name || "—"), u = String(e.variety_name || "—"), d = String(e.location_name || "—"), f = r === "year" ? s : r === "plant" ? String(e.plant_id) : r === "variety" ? JSON.stringify([e.plant_id, e.variety_id]) : r === "location" ? String(e.location_id || "_") : c, p = r === "year" ? s : r === "plant" ? l : r === "variety" ? `${l} · ${u}` : r === "location" ? d : `${l} · ${t(a.get(c), "date")}`, m = o.get(f) ?? {
			label: p,
			mg: 0,
			pieces: 0,
			harvests: 0,
			mass: /* @__PURE__ */ new Set(),
			counts: /* @__PURE__ */ new Set()
		}, h = Number(n.data.amount);
		if (!(!Number.isFinite(h) || h <= 0)) {
			if (n.data.unit === "pieces") m.pieces += h, m.counts.add(c);
			else if (n.data.unit === "g" || n.data.unit === "kg") m.mg += Math.round(h * (n.data.unit === "kg" ? 1e6 : 1e3)), m.mass.add(c);
			else continue;
			m.harvests++, o.set(f, m);
		}
	}
	let s = (e) => {
		if (!e.size) return null;
		let t = 0;
		for (let n of e) {
			let e = a.get(n)?.data.plant_count;
			if (typeof e != "number" || !Number.isInteger(e) || e <= 0) return null;
			t += e;
		}
		return t;
	};
	return [...o].map(([e, t]) => {
		let n = s(t.mass), r = s(t.counts);
		return {
			key: e,
			label: t.label,
			kg: t.mg / 1e6,
			pieces: t.pieces,
			harvests: t.harvests,
			kgPerPlant: n === null ? null : t.mg / 1e6 / n,
			piecesPerPlant: r === null ? null : t.pieces / r,
			massPlantCount: n,
			piecePlantCount: r
		};
	}).sort((e, t) => e.label.localeCompare(t.label));
}
// src/image.ts
async function Et(e) {
	if (![
		"image/jpeg",
		"image/png",
		"image/webp"
	].includes(e.type) || e.size > 12582912) throw Error("invalid_image");
	let t = URL.createObjectURL(e);
	try {
		let e = new Image();
		if (e.src = t, await e.decode(), !e.naturalWidth || !e.naturalHeight || e.naturalWidth * e.naturalHeight > 4e7) throw Error("invalid_image");
		let n = 512;
		for (; n >= 64;) {
			let t = Math.min(1, n / Math.max(e.naturalWidth, e.naturalHeight)), r = document.createElement("canvas");
			r.width = Math.max(1, Math.round(e.naturalWidth * t)), r.height = Math.max(1, Math.round(e.naturalHeight * t));
			let i = r.getContext("2d");
			if (!i) throw Error("invalid_image");
			i.drawImage(e, 0, 0, r.width, r.height);
			let a = r.toDataURL("image/png");
			if (a.startsWith("data:image/png;base64,") && a.length <= 109250) return a;
			n = Math.floor(n * .8);
		}
		throw Error("invalid_image");
	} finally {
		URL.revokeObjectURL(t);
	}
}
// src/api.ts
var Dt = class {
	constructor(e) {
		this.hass = e, this.connection = e.connection;
	}
	command(e, t = {}) {
		if (this.hass.fetchWithAuth && [
			"export",
			"preview_import",
			"import",
			"list",
			"history"
		].includes(e)) return this.hass.fetchWithAuth("/api/garden_planner/exchange", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				operation: e,
				parameters: t
			})
		}).then(async (e) => {
			let t = await e.json();
			if (!e.ok) throw t;
			return t;
		});
		let n = {
			type: "garden_planner/command",
			operation: e,
			parameters: t
		};
		return this.connection.sendMessagePromise ? this.connection.sendMessagePromise(n) : this.hass.callWS(n);
	}
	async load() {
		let t = await Promise.all(e.map((e) => this.command("list", { table: e })));
		return Object.fromEntries(e.map((e, n) => [e, t[n]]));
	}
	subscribe(e) {
		return this.hass.connection.subscribeMessage(e, { type: "garden_planner/subscribe" });
	}
}, Ot = [
	"name",
	"botanical_name",
	"category",
	"description",
	"notes",
	"site",
	"light",
	"water",
	"frost",
	"care",
	"source",
	"source_url"
], kt = [
	"germination_min_c",
	"germination_optimal_min_c",
	"germination_optimal_max_c",
	"germination_max_c",
	"germination_days_min",
	"germination_days_max",
	"depth_cm",
	"spacing_cm",
	"row_spacing_cm",
	"duration_days_min",
	"duration_days_max"
], At = (e, t) => e.map((e) => ({
	value: e,
	label: Ct(t, e)
})), jt = (e, n) => e.map((e) => ({
	value: e.id,
	label: t(e, "name") || t(e, "title") || St(n, "untitled")
}));
function W(e) {
	return kt.includes(e) || [
		"quantity",
		"temperature_c",
		"start_day",
		"end_day",
		"plant_count",
		"amount",
		"purchase_year",
		"germination_percent"
	].includes(e) ? {
		key: e,
		type: "number",
		min: e.endsWith("_c") ? void 0 : 0,
		step: e.includes("days") || e.endsWith("_day") || ["plant_count", "purchase_year"].includes(e) ? "1" : "any"
	} : {
		key: e,
		type: [
			"description",
			"notes",
			"care",
			"regional_notes"
		].includes(e) ? "textarea" : "text",
		required: e === "name" || e === "title"
	};
}
function Mt(e, n, r, i, a) {
	let o = (e, t, n = !1) => ({
		key: e,
		type: "select",
		options: e === "unit" || e === "entry_kind" ? t.map((t) => ({
			value: t,
			label: St(i, (e === "unit" ? "unit_" : "kind_") + t)
		})) : At(t, i),
		required: n
	}), s = (e, t, n = !1, r = !1) => ({
		key: e,
		type: "select",
		options: jt(t, i),
		required: n,
		disabled: r
	}), c = (e, t) => e.filter((e) => !e.data.archived || e.id === t), l = String(n.plant_id ?? ""), u = s("plant_id", c(r.plants, l), !0, a && [
		"varieties",
		"growing_windows",
		"cultivations"
	].includes(e)), d = s("variety_id", c(r.varieties.filter((e) => t(e, "plant_id") === l), String(n.variety_id ?? "")), !1, a && e === "cultivations"), f = s("location_id", c(r.locations, String(n.location_id ?? ""))), p = [W("temperature_c"), o("measurement_kind", [
		"substrate",
		"soil",
		"air"
	])];
	return e === "seed_lots" ? [
		u,
		d,
		{
			key: "lot_label",
			required: !0
		},
		{
			key: "quantity",
			label: "stockQuantity",
			type: "number",
			min: 0,
			max: 1e6,
			step: n.unit === "seeds" ? "1" : "any",
			required: !0
		},
		o("unit", [
			"seeds",
			"g",
			"packets"
		], !0),
		{
			key: "purchase_year",
			type: "number",
			min: 1900,
			max: 9999,
			step: "1"
		},
		{
			key: "best_before",
			type: "date"
		},
		{
			key: "opened_on",
			type: "date"
		},
		{
			key: "germination_percent",
			type: "number",
			min: 0,
			max: 100,
			step: "any"
		},
		{
			key: "germination_tested_on",
			type: "date"
		},
		W("storage_location"),
		W("notes")
	] : e === "cultivation_journal" ? [
		{
			key: "date",
			type: "date",
			required: !0
		},
		{
			...o("entry_kind", [
				"observation",
				"germination",
				"growth",
				"pest",
				"harvest"
			], !0),
			disabled: a
		},
		{
			...W("title"),
			required: !1
		},
		...n.entry_kind === "harvest" ? [{
			key: "amount",
			type: "number",
			min: n.unit === "pieces" ? 1 : n.unit === "g" ? .001 : 1e-6,
			max: 1e5,
			step: n.unit === "pieces" ? "1" : n.unit === "g" ? ".001" : ".000001",
			required: !0
		}, o("unit", [
			"g",
			"kg",
			"pieces"
		], !0)] : [],
		{
			...W("notes"),
			wide: !0
		}
	] : e === "plants" || e === "varieties" ? [
		...e === "varieties" ? [u] : [],
		...Ot.map((e) => e === "category" ? {
			key: e,
			type: "select",
			options: At([.../* @__PURE__ */ new Set([
				"vegetables",
				"herbs",
				"flowers",
				"fruit",
				"other",
				...r.plants.map((e) => t(e, "category")).filter(Boolean)
			])], i)
		} : W(e)),
		...e === "plants" ? kt.map((e) => ({
			...W(e),
			rowStart: ["depth_cm", "spacing_cm"].includes(e)
		})) : []
	] : e === "growing_windows" ? [
		{
			...u,
			wide: !0
		},
		o("activity", [
			"indoors",
			"direct",
			"prick_out",
			"transplant",
			"care",
			"fertilize",
			"prune",
			"harvest",
			"other"
		], !0),
		o("environment", [
			"outdoors",
			"greenhouse",
			"cold_frame",
			"indoors"
		], !0),
		{
			...o("method", [
				"direct",
				"indoors",
				"transplant"
			]),
			wide: !0
		},
		...["start", "end"].flatMap((e) => [{
			key: `${e}_month`,
			type: "select",
			required: !0,
			options: Array.from({ length: 12 }, (e, t) => ({
				value: String(t + 1),
				label: _(2e3, t + 1, i).replace(/\s*2000/, "")
			}))
		}, {
			key: `${e}_day`,
			type: "number",
			min: 1,
			max: 31,
			step: "1",
			required: !0
		}]),
		...[
			"notes",
			"regional_notes",
			"source",
			"source_url"
		].map(W)
	] : e === "locations" ? [...[
		"name",
		"location_type",
		"light",
		"soil",
		"description",
		"notes",
		"sensor_entity_id"
	].map(W), o("measurement_kind", [
		"air",
		"soil",
		"substrate"
	])] : e === "cultivations" ? [
		u,
		d,
		{
			key: "date",
			type: "date",
			required: !0
		},
		o("method", [
			"direct",
			"indoors",
			"transplant"
		], !0),
		f,
		W("quantity"),
		{
			key: "plant_count",
			type: "number",
			min: 1,
			max: 1e6,
			step: "1"
		},
		...p,
		o("initial_status", ["sown", "planned"], !0),
		W("notes"),
		...[
			"result",
			"germination_result",
			"harvest_result"
		].map((e) => o(e, [
			"unknown",
			"successful",
			"partial",
			"failed"
		]))
	] : e === "cultivation_events" ? n.origin === "initial" ? [W("notes")] : [
		{
			key: "date",
			type: "date",
			required: !0
		},
		o("status", [
			"planned",
			"sown",
			"germinated",
			"pricked_out",
			"planted_out",
			"growing",
			"harvesting",
			"completed",
			"failed"
		], !0),
		W("notes")
	] : [
		W("title"),
		{
			key: "date",
			type: "date",
			required: !0
		},
		o("activity", [
			"indoors",
			"direct",
			"prick_out",
			"transplant",
			"care",
			"fertilize",
			"prune",
			"harvest",
			"other"
		], !0),
		s("plant_id", r.plants),
		s("cultivation_id", r.cultivations.map((e) => ({
			...e,
			data: { name: `${t(r.plants.find((n) => n.id === t(e, "plant_id")), "name")} · ${t(e, "date")}` }
		}))),
		f,
		W("notes")
	];
}
function Nt(e, t, n = {}) {
	return {
		...{
			plants: { category: "vegetables" },
			growing_windows: {
				activity: "direct",
				environment: "outdoors",
				start_month: 1,
				start_day: 1,
				end_month: 1,
				end_day: 31
			},
			cultivations: {
				date: i(t),
				method: "direct",
				initial_status: "sown",
				result: "unknown"
			},
			cultivation_events: {
				date: i(t),
				status: "germinated"
			},
			tasks: {
				date: i(t),
				activity: "care"
			},
			seed_lots: {
				quantity: 0,
				unit: "seeds"
			},
			cultivation_journal: {
				date: i(t),
				entry_kind: "observation",
				unit: "kg"
			}
		}[e],
		...n
	};
}
function Pt(e, t, n, r) {
	let i = {};
	for (let e of n) {
		if (e.disabled) continue;
		let n = t[e.key];
		if (n === "" || n == null) {
			if (e.required) throw Error("invalid_data");
			r && r.data[e.key] !== void 0 && (i[e.key] = null);
		} else i[e.key] = e.type === "number" || e.key.endsWith("_month") ? Number(n) : n;
	}
	e === "cultivation_journal" && !r && (i.cultivation_id = t.cultivation_id), e === "cultivation_events" && !r && (i.cultivation_id = t.cultivation_id), [
		"plants",
		"varieties",
		"cultivation_journal"
	].includes(e) && t.image_data !== void 0 && (i.image_data = t.image_data || null);
	let a = {
		...r?.data,
		...i
	}, o = [
		"germination_min_c",
		"germination_optimal_min_c",
		"germination_optimal_max_c",
		"germination_max_c"
	].map((e) => a[e]).filter((e) => typeof e == "number");
	if (o.some((e, t) => !Number.isFinite(e) || t > 0 && e < o[t - 1])) throw Error("invalid_data");
	for (let [e, t] of [["germination_days_min", "germination_days_max"], ["duration_days_min", "duration_days_max"]]) if (typeof a[e] == "number" && typeof a[t] == "number" && Number(a[e]) > Number(a[t])) throw Error("invalid_data");
	if (e === "growing_windows") {
		for (let e of ["start", "end"]) if (!l(2e3, Number(a[`${e}_month`]), Number(a[`${e}_day`]))) throw Error("invalid_data");
	}
	if (a.temperature_c !== void 0 && a.temperature_c !== null && !a.measurement_kind || a.sensor_entity_id && !a.measurement_kind) throw Error("invalid_data");
	return i;
}
// node_modules/fflate/esm/browser.js
var G = Uint8Array, K = Uint16Array, Ft = Int32Array, It = new G([
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	2,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	4,
	4,
	4,
	4,
	5,
	5,
	5,
	5,
	0,
	0,
	0,
	0
]), Lt = new G([
	0,
	0,
	0,
	0,
	1,
	1,
	2,
	2,
	3,
	3,
	4,
	4,
	5,
	5,
	6,
	6,
	7,
	7,
	8,
	8,
	9,
	9,
	10,
	10,
	11,
	11,
	12,
	12,
	13,
	13,
	0,
	0
]), Rt = new G([
	16,
	17,
	18,
	0,
	8,
	7,
	9,
	6,
	10,
	5,
	11,
	4,
	12,
	3,
	13,
	2,
	14,
	1,
	15
]), zt = function(e, t) {
	for (var n = new K(31), r = 0; r < 31; ++r) n[r] = t += 1 << e[r - 1];
	for (var i = new Ft(n[30]), r = 1; r < 30; ++r) for (var a = n[r]; a < n[r + 1]; ++a) i[a] = a - n[r] << 5 | r;
	return {
		b: n,
		r: i
	};
}, Bt = zt(It, 2), Vt = Bt.b, Ht = Bt.r;
Vt[28] = 258, Ht[258] = 28;
for (var Ut = zt(Lt, 0), Wt = Ut.b, Gt = Ut.r, Kt = new K(32768), q = 0; q < 32768; ++q) {
	var qt = (q & 43690) >> 1 | (q & 21845) << 1;
	qt = (qt & 52428) >> 2 | (qt & 13107) << 2, qt = (qt & 61680) >> 4 | (qt & 3855) << 4, Kt[q] = ((qt & 65280) >> 8 | (qt & 255) << 8) >> 1;
}
for (var J = (function(e, t, n) {
	for (var r = e.length, i = 0, a = new K(t); i < r; ++i) e[i] && ++a[e[i] - 1];
	var o = new K(t);
	for (i = 1; i < t; ++i) o[i] = o[i - 1] + a[i - 1] << 1;
	var s;
	if (n) {
		s = new K(1 << t);
		var c = 15 - t;
		for (i = 0; i < r; ++i) if (e[i]) for (var l = i << 4 | e[i], u = t - e[i], d = o[e[i] - 1]++ << u, f = d | (1 << u) - 1; d <= f; ++d) s[Kt[d] >> c] = l;
	} else for (s = new K(r), i = 0; i < r; ++i) e[i] && (s[i] = Kt[o[e[i] - 1]++] >> 15 - e[i]);
	return s;
}), Jt = new G(288), q = 0; q < 144; ++q) Jt[q] = 8;
for (var q = 144; q < 256; ++q) Jt[q] = 9;
for (var q = 256; q < 280; ++q) Jt[q] = 7;
for (var q = 280; q < 288; ++q) Jt[q] = 8;
for (var Yt = new G(32), q = 0; q < 32; ++q) Yt[q] = 5;
var Xt = /*#__PURE__*/ J(Jt, 9, 0), Zt = /*#__PURE__*/ J(Jt, 9, 1), Qt = /*#__PURE__*/ J(Yt, 5, 0), $t = /*#__PURE__*/ J(Yt, 5, 1), en = function(e) {
	for (var t = e[0], n = 1; n < e.length; ++n) e[n] > t && (t = e[n]);
	return t;
}, Y = function(e, t, n) {
	var r = t / 8 | 0;
	return (e[r] | e[r + 1] << 8) >> (t & 7) & n;
}, tn = function(e, t) {
	var n = t / 8 | 0;
	return (e[n] | e[n + 1] << 8 | e[n + 2] << 16) >> (t & 7);
}, nn = function(e) {
	return (e + 7) / 8 | 0;
}, rn = function(e, t, n) {
	return (t == null || t < 0) && (t = 0), (n == null || n > e.length) && (n = e.length), new G(e.subarray(t, n));
}, an = [
	"unexpected EOF",
	"invalid block type",
	"invalid length/literal",
	"invalid distance",
	"stream finished",
	"no stream handler",
	,
	"no callback",
	"invalid UTF-8 data",
	"extra field too long",
	"date not in range 1980-2099",
	"filename too long",
	"stream finishing",
	"invalid zip data"
], X = function(e, t, n) {
	var r = Error(t || an[e]);
	if (r.code = e, Error.captureStackTrace && Error.captureStackTrace(r, X), !n) throw r;
	return r;
}, on = function(e, t, n, r) {
	var i = e.length, a = r ? r.length : 0;
	if (!i || t.f && !t.l) return n || new G(0);
	var o = !n, s = o || t.i != 2, c = t.i;
	o && (n = new G(i * 3));
	var l = function(e) {
		var t = n.length;
		if (e > t) {
			var r = new G(Math.max(t * 2, e));
			r.set(n), n = r;
		}
	}, u = t.f || 0, d = t.p || 0, f = t.b || 0, p = t.l, m = t.d, h = t.m, g = t.n, _ = i * 8;
	do {
		if (!p) {
			u = Y(e, d, 1);
			var v = Y(e, d + 1, 3);
			if (d += 3, !v) {
				var y = nn(d) + 4, b = e[y - 4] | e[y - 3] << 8, x = y + b;
				if (x > i) {
					c && X(0);
					break;
				}
				s && l(f + b), n.set(e.subarray(y, x), f), t.b = f += b, t.p = d = x * 8, t.f = u;
				continue;
			}
			if (v == 1) p = Zt, m = $t, h = 9, g = 5;
			else if (v == 2) {
				var S = Y(e, d, 31) + 257, C = Y(e, d + 10, 15) + 4, w = S + Y(e, d + 5, 31) + 1;
				d += 14;
				for (var T = new G(w), E = new G(19), D = 0; D < C; ++D) E[Rt[D]] = Y(e, d + D * 3, 7);
				d += C * 3;
				for (var O = en(E), ee = (1 << O) - 1, k = J(E, O, 1), D = 0; D < w;) {
					var A = k[Y(e, d, ee)];
					d += A & 15;
					var y = A >> 4;
					if (y < 16) T[D++] = y;
					else {
						var j = 0, M = 0;
						for (y == 16 ? (M = 3 + Y(e, d, 3), d += 2, j = T[D - 1]) : y == 17 ? (M = 3 + Y(e, d, 7), d += 3) : y == 18 && (M = 11 + Y(e, d, 127), d += 7); M--;) T[D++] = j;
					}
				}
				var N = T.subarray(0, S), P = T.subarray(S);
				h = en(N), g = en(P), p = J(N, h, 1), m = J(P, g, 1);
			} else X(1);
			if (d > _) {
				c && X(0);
				break;
			}
		}
		s && l(f + 131072);
		for (var te = (1 << h) - 1, F = (1 << g) - 1, ne = d;; ne = d) {
			var j = p[tn(e, d) & te], I = j >> 4;
			if (d += j & 15, d > _) {
				c && X(0);
				break;
			}
			if (j || X(2), I < 256) n[f++] = I;
			else if (I == 256) {
				ne = d, p = null;
				break;
			} else {
				var L = I - 254;
				if (I > 264) {
					var D = I - 257, R = It[D];
					L = Y(e, d, (1 << R) - 1) + Vt[D], d += R;
				}
				var z = m[tn(e, d) & F], re = z >> 4;
				z || X(3), d += z & 15;
				var P = Wt[re];
				if (re > 3) {
					var R = Lt[re];
					P += tn(e, d) & (1 << R) - 1, d += R;
				}
				if (d > _) {
					c && X(0);
					break;
				}
				s && l(f + 131072);
				var ie = f + L;
				if (f < P) {
					var ae = a - P, oe = Math.min(P, ie);
					for (ae + f < 0 && X(3); f < oe; ++f) n[f] = r[ae + f];
				}
				for (; f < ie; ++f) n[f] = n[f - P];
			}
		}
		t.l = p, t.p = ne, t.b = f, t.f = u, p && (u = 1, t.m = h, t.d = m, t.n = g);
	} while (!u);
	return f != n.length && o ? rn(n, 0, f) : n.subarray(0, f);
}, sn = function(e, t, n) {
	n <<= t & 7;
	var r = t / 8 | 0;
	e[r] |= n, e[r + 1] |= n >> 8;
}, cn = function(e, t, n) {
	n <<= t & 7;
	var r = t / 8 | 0;
	e[r] |= n, e[r + 1] |= n >> 8, e[r + 2] |= n >> 16;
}, ln = function(e, t) {
	for (var n = [], r = 0; r < e.length; ++r) e[r] && n.push({
		s: r,
		f: e[r]
	});
	var i = n.length, a = n.slice();
	if (!i) return {
		t: gn,
		l: 0
	};
	if (i == 1) {
		var o = new G(n[0].s + 1);
		return o[n[0].s] = 1, {
			t: o,
			l: 1
		};
	}
	n.sort(function(e, t) {
		return e.f - t.f;
	}), n.push({
		s: -1,
		f: 25001
	});
	var s = n[0], c = n[1], l = 0, u = 1, d = 2;
	for (n[0] = {
		s: -1,
		f: s.f + c.f,
		l: s,
		r: c
	}; u != i - 1;) s = n[n[l].f < n[d].f ? l++ : d++], c = n[l != u && n[l].f < n[d].f ? l++ : d++], n[u++] = {
		s: -1,
		f: s.f + c.f,
		l: s,
		r: c
	};
	for (var f = a[0].s, r = 1; r < i; ++r) a[r].s > f && (f = a[r].s);
	var p = new K(f + 1), m = un(n[u - 1], p, 0);
	if (m > t) {
		var r = 0, h = 0, g = m - t, _ = 1 << g;
		for (a.sort(function(e, t) {
			return p[t.s] - p[e.s] || e.f - t.f;
		}); r < i; ++r) {
			var v = a[r].s;
			if (p[v] > t) h += _ - (1 << m - p[v]), p[v] = t;
			else break;
		}
		for (h >>= g; h > 0;) {
			var y = a[r].s;
			p[y] < t ? h -= 1 << t - p[y]++ - 1 : ++r;
		}
		for (; r >= 0 && h; --r) {
			var b = a[r].s;
			p[b] == t && (--p[b], ++h);
		}
		m = t;
	}
	return {
		t: new G(p),
		l: m
	};
}, un = function(e, t, n) {
	return e.s == -1 ? Math.max(un(e.l, t, n + 1), un(e.r, t, n + 1)) : t[e.s] = n;
}, dn = function(e) {
	for (var t = e.length; t && !e[--t];);
	for (var n = new K(++t), r = 0, i = e[0], a = 1, o = function(e) {
		n[r++] = e;
	}, s = 1; s <= t; ++s) if (e[s] == i && s != t) ++a;
	else {
		if (!i && a > 2) {
			for (; a > 138; a -= 138) o(32754);
			a > 2 && (o(a > 10 ? a - 11 << 5 | 28690 : a - 3 << 5 | 12305), a = 0);
		} else if (a > 3) {
			for (o(i), --a; a > 6; a -= 6) o(8304);
			a > 2 && (o(a - 3 << 5 | 8208), a = 0);
		}
		for (; a--;) o(i);
		a = 1, i = e[s];
	}
	return {
		c: n.subarray(0, r),
		n: t
	};
}, fn = function(e, t) {
	for (var n = 0, r = 0; r < t.length; ++r) n += e[r] * t[r];
	return n;
}, pn = function(e, t, n) {
	var r = n.length, i = nn(t + 2);
	e[i] = r & 255, e[i + 1] = r >> 8, e[i + 2] = e[i] ^ 255, e[i + 3] = e[i + 1] ^ 255;
	for (var a = 0; a < r; ++a) e[i + a + 4] = n[a];
	return (i + 4 + r) * 8;
}, mn = function(e, t, n, r, i, a, o, s, c, l, u) {
	sn(t, u++, n), ++i[256];
	for (var d = ln(i, 15), f = d.t, p = d.l, m = ln(a, 15), h = m.t, g = m.l, _ = dn(f), v = _.c, y = _.n, b = dn(h), x = b.c, S = b.n, C = new K(19), w = 0; w < v.length; ++w) ++C[v[w] & 31];
	for (var w = 0; w < x.length; ++w) ++C[x[w] & 31];
	for (var T = ln(C, 7), E = T.t, D = T.l, O = 19; O > 4 && !E[Rt[O - 1]]; --O);
	var ee = l + 5 << 3, k = fn(i, Jt) + fn(a, Yt) + o, A = fn(i, f) + fn(a, h) + o + 14 + 3 * O + fn(C, E) + 2 * C[16] + 3 * C[17] + 7 * C[18];
	if (c >= 0 && ee <= k && ee <= A) return pn(t, u, e.subarray(c, c + l));
	var j, M, N, P;
	if (sn(t, u, 1 + (A < k)), u += 2, A < k) {
		j = J(f, p, 0), M = f, N = J(h, g, 0), P = h;
		var te = J(E, D, 0);
		sn(t, u, y - 257), sn(t, u + 5, S - 1), sn(t, u + 10, O - 4), u += 14;
		for (var w = 0; w < O; ++w) sn(t, u + 3 * w, E[Rt[w]]);
		u += 3 * O;
		for (var F = [v, x], ne = 0; ne < 2; ++ne) for (var I = F[ne], w = 0; w < I.length; ++w) {
			var L = I[w] & 31;
			sn(t, u, te[L]), u += E[L], L > 15 && (sn(t, u, I[w] >> 5 & 127), u += I[w] >> 12);
		}
	} else j = Xt, M = Jt, N = Qt, P = Yt;
	for (var w = 0; w < s; ++w) {
		var R = r[w];
		if (R > 255) {
			var L = R >> 18 & 31;
			cn(t, u, j[L + 257]), u += M[L + 257], L > 7 && (sn(t, u, R >> 23 & 31), u += It[L]);
			var z = R & 31;
			cn(t, u, N[z]), u += P[z], z > 3 && (cn(t, u, R >> 5 & 8191), u += Lt[z]);
		} else cn(t, u, j[R]), u += M[R];
	}
	return cn(t, u, j[256]), u + M[256];
}, hn = /*#__PURE__*/ new Ft([
	65540,
	131080,
	131088,
	131104,
	262176,
	1048704,
	1048832,
	2114560,
	2117632
]), gn = /*#__PURE__*/ new G(0), _n = function(e, t, n, r, i, a) {
	var o = a.z || e.length, s = new G(r + o + 5 * (1 + Math.ceil(o / 7e3)) + i), c = s.subarray(r, s.length - i), l = a.l, u = (a.r || 0) & 7;
	if (t) {
		u && (c[0] = a.r >> 3);
		for (var d = hn[t - 1], f = d >> 13, p = d & 8191, m = (1 << n) - 1, h = a.p || new K(32768), g = a.h || new K(m + 1), _ = Math.ceil(n / 3), v = 2 * _, y = function(t) {
			return (e[t] ^ e[t + 1] << _ ^ e[t + 2] << v) & m;
		}, b = new Ft(25e3), x = new K(288), S = new K(32), C = 0, w = 0, T = a.i || 0, E = 0, D = a.w || 0, O = 0; T + 2 < o; ++T) {
			var ee = y(T), k = T & 32767, A = g[ee];
			if (h[k] = A, g[ee] = k, D <= T) {
				var j = o - T;
				if ((C > 7e3 || E > 24576) && (j > 423 || !l)) {
					u = mn(e, c, 0, b, x, S, w, E, O, T - O, u), E = C = w = 0, O = T;
					for (var M = 0; M < 286; ++M) x[M] = 0;
					for (var M = 0; M < 30; ++M) S[M] = 0;
				}
				var N = 2, P = 0, te = p, F = k - A & 32767;
				if (j > 2 && ee == y(T - F)) for (var ne = Math.min(f, j) - 1, I = Math.min(32767, T), L = Math.min(258, j); F <= I && --te && k != A;) {
					if (e[T + N] == e[T + N - F]) {
						for (var R = 0; R < L && e[T + R] == e[T + R - F]; ++R);
						if (R > N) {
							if (N = R, P = F, R > ne) break;
							for (var z = Math.min(F, R - 2), re = 0, M = 0; M < z; ++M) {
								var ie = T - F + M & 32767, ae = ie - h[ie] & 32767;
								ae > re && (re = ae, A = ie);
							}
						}
					}
					k = A, A = h[k], F += k - A & 32767;
				}
				if (P) {
					b[E++] = 268435456 | Ht[N] << 18 | Gt[P];
					var oe = Ht[N] & 31, se = Gt[P] & 31;
					w += It[oe] + Lt[se], ++x[257 + oe], ++S[se], D = T + N, ++C;
				} else b[E++] = e[T], ++x[e[T]];
			}
		}
		for (T = Math.max(T, D); T < o; ++T) b[E++] = e[T], ++x[e[T]];
		u = mn(e, c, l, b, x, S, w, E, O, T - O, u), l || (a.r = u & 7 | c[u / 8 | 0] << 3, u -= 7, a.h = g, a.p = h, a.i = T, a.w = D);
	} else {
		for (var T = a.w || 0; T < o + l; T += 65535) {
			var ce = T + 65535;
			ce >= o && (c[u / 8 | 0] = l, ce = o), u = pn(c, u + 1, e.subarray(T, ce));
		}
		a.i = o;
	}
	return rn(s, 0, r + nn(u) + i);
}, vn = /*#__PURE__*/ (function() {
	for (var e = /* @__PURE__ */ new Int32Array(256), t = 0; t < 256; ++t) {
		for (var n = t, r = 9; --r;) n = (n & 1 && -306674912) ^ n >>> 1;
		e[t] = n;
	}
	return e;
})(), yn = function() {
	var e = -1;
	return {
		p: function(t) {
			for (var n = e, r = 0; r < t.length; ++r) n = vn[n & 255 ^ t[r]] ^ n >>> 8;
			e = n;
		},
		d: function() {
			return ~e;
		}
	};
}, bn = function(e, t, n, r, i) {
	if (!i && (i = { l: 1 }, t.dictionary)) {
		var a = t.dictionary.subarray(-32768), o = new G(a.length + e.length);
		o.set(a), o.set(e, a.length), e = o, i.w = a.length;
	}
	return _n(e, t.level == null ? 6 : t.level, t.mem == null ? i.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(e.length))) * 1.5) : 20 : 12 + t.mem, n, r, i);
}, xn = function(e, t) {
	var n = {};
	for (var r in e) n[r] = e[r];
	for (var r in t) n[r] = t[r];
	return n;
}, Sn = function(e, t) {
	return e[t] | e[t + 1] << 8;
}, Cn = function(e, t) {
	return (e[t] | e[t + 1] << 8 | e[t + 2] << 16 | e[t + 3] << 24) >>> 0;
}, wn = function(e, t) {
	return Cn(e, t) + Cn(e, t + 4) * 4294967296;
}, Z = function(e, t, n) {
	for (; n; ++t) e[t] = n, n >>>= 8;
};
function Tn(e, t) {
	return bn(e, t || {}, 0, 0);
}
var En = /* @__PURE__ */ function() {
	function e(e, t) {
		typeof e == "function" && (t = e, e = {}), this.ondata = t;
		var n = e && e.dictionary && e.dictionary.subarray(-32768);
		this.s = {
			i: 0,
			b: n ? n.length : 0
		}, this.o = new G(32768), this.p = new G(0), n && this.o.set(n);
	}
	return e.prototype.e = function(e) {
		if (this.ondata || X(5), this.d && X(4), !this.p.length) this.p = e;
		else if (e.length) {
			var t = new G(this.p.length + e.length);
			t.set(this.p), t.set(e, this.p.length), this.p = t;
		}
	}, e.prototype.c = function(e) {
		this.s.i = +(this.d = e || !1);
		var t = this.s.b, n = on(this.p, this.s, this.o);
		this.ondata(rn(n, t, this.s.b), this.d), this.o = rn(n, this.s.b - 32768), this.s.b = this.o.length, this.p = rn(this.p, this.s.p / 8 | 0), this.s.p &= 7;
	}, e.prototype.push = function(e, t) {
		this.e(e), this.c(t);
	}, e;
}(), Dn = function(e, t, n, r) {
	for (var i in e) {
		var a = e[i], o = t + i, s = r;
		Array.isArray(a) && (s = xn(r, a[1]), a = a[0]), ArrayBuffer.isView(a) ? n[o] = [a, s] : (n[o += "/"] = [new G(0), s], Dn(a, o, n, r));
	}
}, On = typeof TextEncoder < "u" && /*#__PURE__*/ new TextEncoder(), kn = typeof TextDecoder < "u" && /*#__PURE__*/ new TextDecoder();
try {
	kn.decode(gn, { stream: !0 });
} catch {}
var An = function(e) {
	for (var t = "", n = 0;;) {
		var r = e[n++], i = (r > 127) + (r > 223) + (r > 239);
		if (n + i > e.length) return {
			s: t,
			r: rn(e, n - 1)
		};
		i ? i == 3 ? (r = ((r & 15) << 18 | (e[n++] & 63) << 12 | (e[n++] & 63) << 6 | e[n++] & 63) - 65536, t += String.fromCharCode(55296 | r >> 10, 56320 | r & 1023)) : i & 1 ? t += String.fromCharCode((r & 31) << 6 | e[n++] & 63) : t += String.fromCharCode((r & 15) << 12 | (e[n++] & 63) << 6 | e[n++] & 63) : t += String.fromCharCode(r);
	}
};
function jn(e, t) {
	if (t) {
		for (var n = new G(e.length), r = 0; r < e.length; ++r) n[r] = e.charCodeAt(r);
		return n;
	}
	if (On) return On.encode(e);
	for (var i = e.length, a = new G(e.length + (e.length >> 1)), o = 0, s = function(e) {
		a[o++] = e;
	}, r = 0; r < i; ++r) {
		if (o + 5 > a.length) {
			var c = new G(o + 8 + (i - r << 1));
			c.set(a), a = c;
		}
		var l = e.charCodeAt(r);
		l < 128 || t ? s(l) : l < 2048 ? (s(192 | l >> 6), s(128 | l & 63)) : l > 55295 && l < 57344 ? (l = 65536 + (l & 1047552) | e.charCodeAt(++r) & 1023, s(240 | l >> 18), s(128 | l >> 12 & 63), s(128 | l >> 6 & 63), s(128 | l & 63)) : (s(224 | l >> 12), s(128 | l >> 6 & 63), s(128 | l & 63));
	}
	return rn(a, 0, o);
}
function Mn(e, t) {
	if (t) {
		for (var n = "", r = 0; r < e.length; r += 16384) n += String.fromCharCode.apply(null, e.subarray(r, r + 16384));
		return n;
	}
	if (kn) return kn.decode(e);
	var i = An(e), a = i.s, n = i.r;
	return n.length && X(8), a;
}
var Nn = function(e, t, n, r, i, a, o) {
	var s = i == 4294967295, c = a == 4294967295, l = o == 4294967295, u = t + n, d = s + c + l;
	if (r && d) {
		for (; t + 4 < u; t += 4 + Sn(e, t + 2)) if (Sn(e, t) == 1) return [
			s ? wn(e, t + 4 + 8 * c) : i,
			c ? wn(e, t + 4) : a,
			l ? wn(e, t + 4 + 8 * (c + s)) : o,
			1
		];
		r < 2 && X(13);
	}
	return [
		i,
		a,
		o,
		0
	];
}, Pn = function(e) {
	var t = 0;
	if (e) for (var n in e) {
		var r = e[n].length;
		r > 65535 && X(9), t += r + 4;
	}
	return t;
}, Fn = function(e, t, n, r, i, a, o, s) {
	var c = r.length, l = n.extra, u = s && s.length, d = Pn(l);
	Z(e, t, o == null ? 67324752 : 33639248), t += 4, o != null && (e[t++] = 20, e[t++] = n.os), e[t] = 20, t += 2, e[t++] = n.flag << 1 | (a < 0 && 8), e[t++] = i && 8, e[t++] = n.compression & 255, e[t++] = n.compression >> 8;
	var f = new Date(n.mtime == null ? Date.now() : n.mtime), p = f.getFullYear() - 1980;
	if ((p < 0 || p > 119) && X(10), Z(e, t, p << 25 | f.getMonth() + 1 << 21 | f.getDate() << 16 | f.getHours() << 11 | f.getMinutes() << 5 | f.getSeconds() >> 1), t += 4, a != -1 && (Z(e, t, n.crc), Z(e, t + 4, a < 0 ? -a - 2 : a), Z(e, t + 8, n.size)), Z(e, t + 12, c), Z(e, t + 14, d), t += 16, o != null && (Z(e, t, u), Z(e, t + 6, n.attrs), Z(e, t + 10, o), t += 14), e.set(r, t), t += c, d) for (var m in l) {
		var h = l[m], g = h.length;
		Z(e, t, +m), Z(e, t + 2, g), e.set(h, t + 4), t += 4 + g;
	}
	return u && (e.set(s, t), t += u), t;
}, In = function(e, t, n, r, i) {
	Z(e, t, 101010256), Z(e, t + 8, n), Z(e, t + 10, n), Z(e, t + 12, r), Z(e, t + 16, i);
};
function Ln(e, t) {
	t ||= {};
	var n = {}, r = [];
	Dn(e, "", n, t);
	var i = 0, a = 0;
	for (var o in n) {
		var s = n[o], c = s[0], l = s[1], u = l.level == 0 ? 0 : 8, d = jn(o), f = d.length, p = l.comment, m = p && jn(p), h = m && m.length, g = Pn(l.extra);
		f > 65535 && X(11);
		var _ = u ? Tn(c, l) : c, v = _.length, y = yn();
		y.p(c), r.push(xn(l, {
			size: c.length,
			crc: y.d(),
			c: _,
			f: d,
			m,
			u: f != o.length || m && p.length != h,
			o: i,
			compression: u
		})), i += 30 + f + g + v, a += 76 + 2 * (f + g) + (h || 0) + v;
	}
	for (var b = new G(a + 22), x = i, S = a - i, C = 0; C < r.length; ++C) {
		var d = r[C];
		Fn(b, d.o, d, d.f, d.u, d.c.length);
		var w = 30 + d.f.length + Pn(d.extra);
		b.set(d.c, d.o + w), Fn(b, i, d, d.f, d.u, d.c.length, d.o, d.m), i += 16 + w + (d.m ? d.m.length : 0);
	}
	return In(b, i, r.length, S, x), b;
}
var Rn = /* @__PURE__ */ function() {
	function e() {}
	return e.prototype.push = function(e, t) {
		this.ondata(null, e, t);
	}, e.compression = 0, e;
}(), zn = /* @__PURE__ */ function() {
	function e() {
		var e = this;
		this.i = new En(function(t, n) {
			e.ondata(null, t, n);
		});
	}
	return e.prototype.push = function(e, t) {
		try {
			this.i.push(e, t);
		} catch (e) {
			this.ondata(e, null, t);
		}
	}, e.compression = 8, e;
}(), Bn = /* @__PURE__ */ function() {
	function e(e) {
		this.onfile = e, this.k = [], this.o = { 0: Rn }, this.p = gn;
	}
	return e.prototype.push = function(e, t) {
		var n = this;
		if (this.onfile || X(5), this.p || X(4), this.c > 0) {
			var r = Math.min(this.c, e.length), i = e.subarray(0, r);
			if (this.c -= r, this.d ? this.d.push(i, !this.c) : this.k[0].push(i), e = e.subarray(r), e.length) return this.push(e, t);
		} else {
			var a = 0, o = 0, s = void 0, c = void 0;
			this.p.length ? e.length ? (c = new G(this.p.length + e.length), c.set(this.p), c.set(e, this.p.length)) : c = this.p : c = e;
			for (var l = c.length, u = this.c, d = u && this.d, f = function() {
				var e = Cn(c, o);
				if (e == 67324752) {
					a = 1, s = o, p.d = null, p.c = 0;
					var t = Sn(c, o + 6), r = Sn(c, o + 8), i = t & 2048, d = t & 8, f = Sn(c, o + 26), m = Sn(c, o + 28);
					if (l > o + 30 + f + m) {
						var h = [];
						p.k.unshift(h), a = 2;
						var g = Cn(c, o + 18), _ = Cn(c, o + 22), v = Mn(c.subarray(o + 30, o += 30 + f), !i), y = Nn(c, o, m, 2, g, _, 0), b = y[0], x = y[1], S = y[3];
						d && (b = -1 - S), o += m, p.c = b;
						var C, w = {
							name: v,
							compression: r,
							start: function() {
								if (w.ondata || X(5), !b) w.ondata(null, gn, !0);
								else {
									var e = n.o[r];
									e || w.ondata(X(14, "unknown compression type " + r, 1), null, !1), C = b < 0 ? new e(v) : new e(v, b, x), C.ondata = function(e, t, n) {
										w.ondata(e, t, n);
									};
									for (var t = 0, i = h; t < i.length; t++) {
										var a = i[t];
										C.push(a, !1);
									}
									n.k[0] == h && n.c ? n.d = C : C.push(gn, !0);
								}
							},
							terminate: function() {
								C && C.terminate && C.terminate();
							}
						};
						b >= 0 && (w.size = b, w.originalSize = x), p.onfile(w);
					}
					return "break";
				}
				if (u) {
					if (e == 134695760) return s = o += 12 + (u == -2 && 8), a = 3, p.c = 0, "break";
					if (e == 33639248) return s = o -= 4, a = 3, p.c = 0, "break";
				}
			}, p = this; o < l - 4 && f() !== "break"; ++o);
			if (this.p = gn, u < 0) {
				var m = a ? c.subarray(0, s - 12 - (u == -2 && 8) - (Cn(c, s - 16) == 134695760 && 4)) : c.subarray(0, o);
				d ? d.push(m, !!a) : this.k[+(a == 2)].push(m);
			}
			if (a & 2) return this.push(c.subarray(o), t);
			this.p = c.subarray(o);
		}
		t && (this.c && X(13), this.p = null);
	}, e.prototype.register = function(e) {
		this.o[e.compression] = e;
	}, e;
}();
function Vn(e, t, n) {
	let r = URL.createObjectURL(new Blob([e], { type: n })), i = document.createElement("a");
	i.href = r, i.download = t, i.click(), setTimeout(() => URL.revokeObjectURL(r), 1e3);
}
function Hn(e) {
	return Ln(Object.fromEntries(Object.entries(e).map(([e, t]) => [e, [jn(t), { mtime: /* @__PURE__ */ new Date("2000-01-01T00:00:00Z") }]])), { level: 6 });
}
function Un(t) {
	if (t.byteLength > 20971520) throw Error("invalid_file");
	let n = /* @__PURE__ */ new Set(["metadata.json", ...e.map((e) => `${e}.csv`)]), r = {}, i = 0, a, o = new Bn((e) => {
		if (!n.has(e.name) || e.name in r || (e.originalSize ?? 0) > 20971520) {
			a = /* @__PURE__ */ Error("invalid_file"), e.terminate();
			return;
		}
		r[e.name] = "";
		let t = [];
		e.ondata = (n, o, s) => {
			if (n) a = /* @__PURE__ */ Error("invalid_file"), e.terminate();
			else if (i += o.byteLength, i > 20971520) a = /* @__PURE__ */ Error("invalid_file"), e.terminate();
			else if (t.push(o), s) {
				let n = new Uint8Array(t.reduce((e, t) => e + t.byteLength, 0)), i = 0;
				for (let e of t) n.set(e, i), i += e.byteLength;
				r[e.name] = Mn(n);
			}
		}, e.start();
	});
	if (o.register(zn), o.push(t, !0), a) throw Error("invalid_file");
	if (Object.keys(r).length === n.size) return r;
	let s = JSON.parse(r["metadata.json"] ?? "null"), c = /* @__PURE__ */ new Set(["seed_lots.csv", "cultivation_journal.csv"]);
	if (!s || typeof s.schema_version != "number" || [...n].some((e) => !(e in r) && !(s.schema_version < 4 && c.has(e)))) throw Error("invalid_file");
	return r;
}
// src/styles.ts
var Wn = M`
  :host {
    display: block;
    color: var(--primary-text-color, #263b30);
    background: var(--primary-background-color, #f5f7f3);
    font: 15px/1.55
      var(
        --paper-font-body1_-_font-family,
        system-ui,
        -apple-system,
        sans-serif
      );
    --gp-green: #31684a;
    --gp-pale: #edf4ec;
    --gp-border: var(--divider-color, #dce4da);
    --gp-muted: var(--secondary-text-color, #5b6b5f);
    --gp-card: var(--card-background-color, #fff);
    --gp-bg: var(--primary-background-color, #f5f7f3);
    --gp-soft: color-mix(in srgb, var(--gp-green) 9%, var(--gp-card));
    min-height: 100vh;
  }
  * {
    box-sizing: border-box;
  }
  button,
  input,
  select,
  textarea {
    font: inherit;
  }
  button,
  a,
  input,
  select,
  textarea {
    -webkit-tap-highlight-color: transparent;
  }
  button {
    cursor: pointer;
    min-height: 44px;
    border: 1px solid var(--gp-border);
    border-radius: 10px;
    background: var(--gp-card);
    color: inherit;
    padding: 9px 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 600;
  }
  button:hover:not(:disabled) {
    border-color: var(--gp-green);
    background: var(--gp-soft);
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  button:focus-visible,
  a:focus-visible {
    outline: 3px solid #c28b28;
    outline-offset: 3px;
  }
  button.primary {
    background: var(--gp-green);
    color: #fff;
    border-color: var(--gp-green);
  }
  button.primary:hover:not(:disabled) {
    background: #24583b;
    color: white;
  }
  button.danger {
    color: var(--error-color, #a52f32);
  }
  button.link {
    border: 0;
    background: transparent;
    justify-content: flex-start;
    padding: 4px 0;
    color: var(--gp-green);
    text-align: left;
  }
  button.icon {
    width: 44px;
    padding: 8px;
    flex-shrink: 0;
  }
  svg {
    width: 21px;
    height: 21px;
    flex-shrink: 0;
  }
  .app {
    display: grid;
    grid-template-columns: 236px minmax(0, 1fr);
    min-height: calc(100dvh - 56px);
  }
  aside {
    background: var(--gp-card);
    border-right: 1px solid var(--gp-border);
    padding: 30px 18px;
    position: sticky;
    top: 56px;
    height: calc(100dvh - 56px);
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  .brand {
    display: flex;
    gap: 11px;
    align-items: center;
    padding: 0 10px;
  }
  .brand-icon {
    display: grid;
    place-items: center;
    color: var(--gp-green);
    background: var(--gp-soft);
    width: 42px;
    height: 42px;
    border-radius: 14px;
  }
  .brand strong {
    font-size: 18px;
    letter-spacing: -0.5px;
  }
  .brand small {
    display: block;
    font-size: 10px;
    letter-spacing: 2.8px;
    text-transform: uppercase;
    color: var(--gp-muted);
  }
  nav {
    display: grid;
    gap: 7px;
  }
  nav button {
    background: transparent;
    border-color: transparent;
    justify-content: flex-start;
    font-size: 14px;
    padding: 12px;
    color: var(--gp-muted);
    font-weight: 500;
  }
  nav button[aria-current="page"] {
    color: var(--gp-green);
    background: var(--gp-soft);
    font-weight: 700;
  }
  .aside-footer {
    margin-top: auto;
    padding: 15px 10px;
    border-top: 1px solid var(--gp-border);
    font-size: 12px;
    color: var(--gp-muted);
  }
  main {
    min-width: 0;
    padding: 36px clamp(20px, 4vw, 60px) 60px;
    max-width: 1600px;
    width: 100%;
    margin: 0 auto;
    align-self: start;
  }
  .topbar,
  .section-head,
  .toolbar,
  .actions,
  .row {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }
  .topbar {
    margin-bottom: 30px;
  }
  .eyebrow {
    text-transform: uppercase;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.6px;
    color: var(--gp-muted);
  }
  h1 {
    font-size: clamp(25px, 3vw, 35px);
    font-weight: 650;
    letter-spacing: -1.2px;
    line-height: 1.25;
    margin: 7px 0;
  }
  h2 {
    font-size: 18px;
    letter-spacing: -0.3px;
    margin: 0;
  }
  h3 {
    font-size: 16px;
    margin: 0 0 7px;
  }
  p {
    margin: 8px 0;
  }
  .muted,
  small {
    color: var(--gp-muted);
  }
  .topbar p {
    font-size: 14px;
  }
  .hero {
    border-radius: 20px;
    background: #183f2d;
    color: #fff;
    padding: 30px 34px;
    margin-bottom: 24px;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 20px;
    align-items: center;
    overflow: hidden;
  }
  .hero .eyebrow,
  .hero .muted {
    color: #c5dccb;
  }
  .hero h2 {
    font-size: clamp(25px, 3vw, 36px);
    letter-spacing: -1px;
  }
  .hero p {
    max-width: 620px;
    color: #dce9df;
    font-size: 14px;
  }
  .hero .art svg {
    width: 100%;
    height: 100%;
  }
  .hero .art {
    color: #a8cca4;
    width: 100px;
    height: 130px;
    transform: rotate(-10deg);
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
    margin: 24px 0;
  }
  .stat {
    background: var(--gp-card);
    border: 1px solid var(--gp-border);
    border-radius: 14px;
    padding: 17px 18px;
  }
  .stat strong {
    display: block;
    font-size: 27px;
    font-weight: 650;
    line-height: 1.4;
  }
  .stat span {
    display: block;
    font-size: 12px;
    color: var(--gp-muted);
  }
  .columns {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(260px, 1fr);
    gap: 22px;
  }
  .panel {
    background: var(--gp-card);
    border: 1px solid var(--gp-border);
    border-radius: 16px;
    padding: 23px;
    min-width: 0;
    margin-bottom: 22px;
  }
  .section-head {
    margin-bottom: 18px;
  }
  .section-head p {
    font-size: 12px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
  .plant {
    background: var(--gp-card);
    border: 1px solid var(--gp-border);
    border-radius: 15px;
    padding: 21px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .plant .plant-title {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .plant-symbol {
    background: var(--gp-soft);
    border-radius: 12px;
    height: 46px;
    width: 46px;
    display: grid;
    place-items: center;
    color: var(--gp-green);
    flex-shrink: 0;
  }
  .plant p {
    font-size: 13px;
    overflow-wrap: anywhere;
  }
  .plant .actions {
    margin-top: auto;
    justify-content: flex-start;
  }
  .badge {
    display: inline-block;
    border-radius: 6px;
    background: var(--gp-soft);
    color: var(--gp-green);
    padding: 3px 8px;
    font-size: 11px;
    font-weight: 650;
  }
  .badge.failed {
    color: #a33435;
    background: #fbeeee;
  }
  .badge.partial {
    color: #825219;
    background: #faf2dc;
  }
  .badge.unknown {
    color: var(--gp-muted);
    background: var(--gp-bg);
  }
  .item {
    display: flex;
    gap: 13px;
    align-items: flex-start;
    padding: 15px 0;
    border-bottom: 1px solid var(--gp-border);
  }
  .item:last-child {
    border-bottom: 0;
  }
  .item-content {
    flex: 1;
    min-width: 0;
  }
  .item p {
    font-size: 13px;
  }
  .item .link {
    font-size: 14px;
  }
  .date-tile {
    text-align: center;
    background: var(--gp-bg);
    border: 1px solid var(--gp-border);
    border-radius: 9px;
    padding: 6px;
    min-width: 49px;
    line-height: 1.2;
  }
  .date-tile strong {
    display: block;
    font-size: 19px;
  }
  .date-tile small {
    font-size: 10px;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 12px;
    margin: 0 0 22px;
  }
  .filters label {
    min-width: 140px;
    flex: 1;
    max-width: 300px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
  }
  input,
  select,
  textarea {
    background: var(--gp-card);
    color: inherit;
    width: 100%;
    min-height: 44px;
    border: 1px solid var(--gp-border);
    border-radius: 9px;
    padding: 9px 11px;
    font-size: 14px;
  }
  input:focus,
  select:focus,
  textarea:focus {
    outline: 2px solid var(--gp-green);
    outline-offset: 1px;
  }
  textarea {
    min-height: 100px;
    resize: vertical;
  }
  input[type="checkbox"] {
    width: 20px;
    min-height: 20px;
    accent-color: var(--gp-green);
    flex-shrink: 0;
  }
  .check {
    flex-direction: row;
    align-items: center;
    min-height: 44px;
    font-size: 13px;
  }
  .empty {
    padding: 45px 20px;
    text-align: center;
    color: var(--gp-muted);
  }
  .empty svg {
    width: 50px;
    height: 50px;
    color: var(--gp-green);
    margin-bottom: 14px;
  }
  .empty h2 {
    color: var(--primary-text-color, #263b30);
    margin: 8px;
  }
  .empty p {
    max-width: 480px;
    margin: 8px auto 20px;
    font-size: 14px;
  }
  .notice {
    border-radius: 10px;
    background: var(--gp-soft);
    padding: 12px 15px;
    font-size: 13px;
    margin: 12px 0;
  }
  .error {
    background: color-mix(
      in srgb,
      var(--error-color, #b43436) 10%,
      var(--gp-card)
    );
    color: var(--error-color, #a1282b);
    border: 1px solid currentColor;
  }
  .toast {
    pointer-events: none;
    position: fixed;
    bottom: 22px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    padding: 12px 22px;
    border-radius: 12px;
    background: #193e2c;
    color: #fff;
    box-shadow: 0 4px 24px #0003;
    max-width: calc(100vw - 32px);
  }
  .segmented {
    display: flex;
    gap: 4px;
    background: var(--gp-soft);
    padding: 4px;
    border-radius: 11px;
  }
  .segmented button {
    border: 0;
    min-height: 38px;
    background: transparent;
    font-size: 13px;
    padding: 7px 13px;
  }
  .segmented button[aria-pressed="true"] {
    background: var(--gp-card);
    box-shadow: 0 1px 4px #0001;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    font-size: 12px;
    margin: 16px 0;
  }
  .dot {
    width: 9px;
    height: 9px;
    display: inline-block;
    border-radius: 3px;
    margin-right: 6px;
    background: var(--bar-color, #659377);
  }
  .indoors {
    --bar-color: #ad8952;
  }
  .direct {
    --bar-color: #397456;
  }
  .prick_out {
    --bar-color: #9167ad;
  }
  .care {
    --bar-color: #287f89;
  }
  .other {
    --bar-color: #767676;
  }
  .activity {
    border-left: 4px solid var(--bar-color);
  }
  .roles-scroll {
    overflow-x: auto;
    max-width: 100%;
    margin: 12px 0;
  }
  .roles-table {
    border-collapse: collapse;
    width: 100%;
    min-width: 640px;
  }
  .roles-table th,
  .roles-table td {
    padding: 12px;
    text-align: left;
    vertical-align: top;
    border-bottom: 1px solid var(--gp-border);
  }
  .roles-table td label {
    display: block;
    margin-bottom: 8px;
  }
  .roles-table small {
    display: block;
    font-weight: normal;
  }
  .roles-table input[type="checkbox"] {
    width: 22px;
    height: 22px;
    min-height: 22px;
    accent-color: var(--gp-accent);
  }
  .roles-table select,
  .roles-table input[type="email"] {
    min-width: 150px;
  }
  .transplant {
    --bar-color: #5986a0;
  }
  .fertilize {
    --bar-color: #a16c28;
  }
  .prune {
    --bar-color: #ac527f;
  }
  .harvest {
    --bar-color: #b97856;
  }
  .filters.calendar-filters {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: end;
  }
  .filters.calendar-filters > label {
    min-width: 0;
    max-width: none;
  }
  .calendar-toolbar {
    align-items: end;
  }
  .calendar-navigation {
    display: grid;
    grid-template-columns: 44px minmax(0, 220px) 44px auto;
    align-items: end;
    gap: 10px;
    max-width: 100%;
  }
  .calendar-navigation label {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    width: 100%;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    contain: inline-size;
  }
  .calendar-navigation input {
    display: block;
    appearance: none;
    -webkit-appearance: none;
    inline-size: 100%;
    min-inline-size: 0;
    max-inline-size: 100%;
    max-width: 100%;
    width: 100%;
    min-width: 0;
    height: 44px;
    box-sizing: border-box;
  }
  .calendar-navigation input:focus {
    outline-offset: -3px;
  }
  .calendar-navigation input::-webkit-date-and-time-value {
    min-width: 0;
    overflow: hidden;
    text-align: left;
  }
  .calendar-navigation button {
    min-width: 0;
    min-height: 44px;
  }
  .calendar-navigation > .icon:first-child {
    grid-column: 1;
    grid-row: 1;
  }
  .calendar-navigation > label {
    grid-column: 2;
    grid-row: 1;
  }
  .calendar-navigation > .icon {
    grid-column: 3;
    grid-row: 1;
  }
  .filter-label {
    font-size: 12px;
    font-weight: 600;
  }
  .multi-filter {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    min-width: 0;
    padding: 0;
    margin: 0;
    border: 0;
  }
  .multi-filter legend {
    font-weight: 600;
    margin-bottom: 8px;
    font-size: 13px;
  }
  .multi-filter details {
    position: relative;
    margin: 0;
  }
  .multi-filter summary {
    width: 100%;
    height: 44px;
    box-sizing: border-box;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border: 1px solid var(--gp-border);
    border-radius: 10px;
    background: var(--gp-card);
    padding: 12px;
    cursor: pointer;
    overflow-wrap: anywhere;
  }
  .multi-filter-options {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 6;
    max-height: min(320px, 45dvh);
    overflow: auto;
    padding: 12px;
    background: var(--gp-card);
    border: 1px solid var(--gp-border);
    border-radius: 10px;
    box-shadow: 0 8px 24px #0002;
  }
  .multi-filter-options .check {
    min-height: 44px;
    max-width: none;
    min-width: 0;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .multi-filter-options p {
    margin-top: 0;
    font-size: 12px;
  }
  .task-card {
    scroll-margin-top: 130px;
  }
  .reminder-save-status {
    min-height: 20px;
    margin: 8px 0;
    font-size: 12px;
    color: var(--gp-muted);
  }
  .matrix-scroll-hint {
    display: none;
  }
  .reminders-scroll {
    overflow: auto;
    touch-action: pan-x pan-y;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
    max-height: 65dvh;
    margin-top: 20px;
    border: 1px solid var(--gp-border);
    border-radius: 10px;
  }
  .reminders-table {
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
    min-width: 1050px;
    width: 100%;
  }
  .reminders-table th,
  .reminders-table td {
    padding: 10px;
    border-bottom: 1px solid var(--gp-border);
    border-right: 1px solid var(--gp-border);
  }
  .reminders-table th {
    background: var(--gp-card);
  }
  .reminders-table thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--gp-soft);
  }
  .reminders-table th:first-child {
    position: sticky;
    left: 0;
    width: 180px;
    white-space: normal;
    overflow-wrap: anywhere;
    text-align: left;
    z-index: 1;
  }
  .reminders-table thead th:first-child {
    z-index: 3;
  }
  .reminders-table td {
    text-align: center;
  }
  .reminders-table input {
    width: 24px;
    height: 24px;
    min-height: 24px;
    accent-color: var(--gp-accent);
    cursor: pointer;
  }
  .reminders-table .reminder-unavailable {
    background: var(--gp-soft);
  }
  .reminders-table input:disabled {
    cursor: default;
    opacity: 0.4;
  }
  .year-scroll {
    overflow: auto;
    max-height: min(65dvh, 720px);
    overscroll-behavior: contain;
    max-width: 100%;
    border: 1px solid var(--gp-border);
    border-radius: 12px;
  }
  .year-grid {
    min-width: 790px;
    display: grid;
    grid-template-columns: 190px repeat(12, minmax(42px, 1fr));
    background: var(--gp-card);
  }
  .year-grid > div,
  .year-grid > button {
    border: 0;
    border-bottom: 1px solid var(--gp-border);
    border-right: 1px solid var(--gp-border);
    border-radius: 0;
    min-height: 48px;
    padding: 7px;
  }
  .year-grid .month-head {
    position: sticky;
    top: 0;
    z-index: 3;
    text-align: center;
    background: var(--gp-soft);
    font-size: 11px;
    font-weight: 600;
    padding-top: 16px;
  }
  .year-grid .month-head:first-child {
    left: 0;
    z-index: 4;
  }
  .year-grid .row-title {
    justify-content: flex-start;
    text-align: left;
    font-size: 12px;
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--gp-card);
    display: block;
  }
  .row-title small {
    display: block;
    font-size: 10px;
  }
  .year-cell {
    position: relative;
    display: flex;
    align-items: center;
    padding: 14px 0 !important;
    background: transparent;
  }
  .year-cell .bar {
    position: absolute;
    top: 15px;
    background: var(--bar-color);
    min-height: 17px;
    width: 100%;
    border-radius: 4px;
    opacity: 0.85;
  }
  .year-cell:hover .bar {
    opacity: 1;
  }
  .month-event {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    font-weight: normal;
    gap: 8px;
  }
  .month-event-title {
    font-size: 16px;
  }
  .month-region-note {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .calendar-detail-body {
    display: grid;
    gap: 20px;
  }
  .calendar-window-card {
    padding: 18px;
    border: 1px solid var(--gp-border);
    border-left: 5px solid var(--bar-color);
    border-radius: 12px;
    background: color-mix(in srgb, var(--bar-color) 5%, var(--gp-card));
  }
  .calendar-window-card .calendar-window-dates {
    font-size: 21px;
    margin: 5px 0 10px;
  }
  .calendar-window-badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .calendar-window-note {
    margin: 16px 0;
  }
  .calendar-window-note h3 {
    font-size: 13px;
    color: var(--gp-muted);
  }
  .calendar-window-note p {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .calendar-plant-profile {
    padding-top: 2px;
    min-width: 0;
  }
  .calendar-plant-profile .section-head {
    flex-wrap: wrap;
    gap: 8px;
  }
  .calendar-plant-profile .plant-quick-facts {
    margin-bottom: 0;
  }
  .month-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 12px;
  }
  .week-windows {
    display: grid;
    gap: 10px;
    margin-top: 16px;
  }
  .week-window {
    width: 100%;
    text-align: left;
    justify-content: space-between;
    flex-wrap: wrap;
    border-left: 4px solid var(--bar-color, var(--gp-green));
    padding: 14px;
  }
  .week-window > span {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }
  .week-window strong {
    overflow-wrap: anywhere;
  }
  .week-window span span,
  .week-window small {
    font-size: 12px;
    font-weight: 400;
  }
  .week-heading {
    margin: 20px 0 12px;
    font-size: 17px;
  }
  .week-empty {
    font-size: 12px;
    margin-top: 10px;
  }
  .sensor-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .sensor-picker {
    position: relative;
    min-width: 0;
  }
  .sensor-options {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 5;
    max-height: var(--sensor-max-height, 240px);
    overflow-y: auto;
    overscroll-behavior: contain;
    background: var(--gp-card);
    border: 1px solid var(--gp-border);
    border-radius: 9px;
    box-shadow: 0 8px 22px #0002;
    padding: 4px;
  }
  .sensor-options.above {
    top: auto;
    bottom: calc(100% + 4px);
  }
  .sensor-options[hidden] {
    display: none;
  }
  .sensor-options button {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    width: 100%;
    text-align: left;
    border: 0;
    padding: 10px;
    min-height: 48px;
  }
  .sensor-options button[aria-selected="true"] {
    background: var(--gp-soft);
  }
  .sensor-options strong,
  .sensor-options small {
    overflow-wrap: anywhere;
  }
  .sensor-options strong {
    font-size: 13px;
  }
  .sensor-options small {
    font-size: 11px;
    font-weight: 400;
  }
  .sensor-empty {
    font-size: 12px;
    padding: 10px;
  }
  .week-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(120px, 1fr));
    gap: 10px;
    min-width: 900px;
  }
  .week-day {
    background: var(--gp-card);
    border: 1px solid var(--gp-border);
    border-radius: 12px;
    padding: 12px;
  }
  .week-day.today {
    border: 2px solid var(--gp-green);
  }
  .week-day h3 {
    font-size: 12px;
  }
  .week-event {
    width: 100%;
    justify-content: flex-start;
    font-size: 12px;
    text-align: left;
    margin: 6px 0;
    padding: 10px;
    border-left: 3px solid var(--bar-color, var(--gp-green));
  }
  .scroll {
    overflow-x: auto;
  }
  .table-wrap {
    overflow: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    text-align: left;
  }
  th,
  td {
    padding: 13px 10px;
    border-bottom: 1px solid var(--gp-border);
    vertical-align: top;
  }
  th {
    font-size: 11px;
    color: var(--gp-muted);
    font-weight: 600;
  }
  td {
    overflow-wrap: anywhere;
  }
  .timeline {
    margin: 20px 0;
    padding-left: 20px;
    border-left: 2px solid var(--gp-border);
  }
  .timeline article {
    position: relative;
    padding: 0 0 23px 16px;
  }
  .timeline article:before {
    content: "";
    position: absolute;
    left: -27px;
    top: 7px;
    width: 10px;
    height: 10px;
    border: 2px solid var(--gp-card);
    background: var(--gp-green);
    border-radius: 50%;
  }
  .timeline article p {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    font-size: 13px;
  }
  dl {
    display: grid;
    grid-template-columns: minmax(110px, 1fr) 2fr;
    gap: 8px 15px;
    font-size: 13px;
  }
  dt {
    color: var(--gp-muted);
  }
  dd {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  dialog {
    background: var(--gp-card);
    color: inherit;
    width: min(760px, calc(100vw - 32px));
    max-height: 90vh;
    border: 1px solid var(--gp-border);
    border-radius: 18px;
    padding: 0;
    box-shadow: 0 15px 70px #0004;
  }
  dialog::backdrop {
    background: #10291f88;
    backdrop-filter: blur(3px);
  }
  #editor-dialog {
    scroll-padding-top: 90px;
    scroll-padding-bottom: 80px;
  }
  .dialog-head {
    position: sticky;
    top: 0;
    background: var(--gp-card);
    border-bottom: 1px solid var(--gp-border);
    padding: 18px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    z-index: 3;
  }
  .dialog-body {
    padding: 24px;
  }
  .dialog-foot {
    position: sticky;
    bottom: 0;
    background: var(--gp-card);
    border-top: 1px solid var(--gp-border);
    padding: 15px 24px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  .form-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 17px;
  }
  .form-grid .row-start {
    grid-column-start: 1;
  }
  .ha-navigation {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 56px;
    padding: 4px 12px;
    background: var(--gp-card);
    border-bottom: 1px solid var(--gp-border);
  }
  .ha-navigation span {
    font-weight: 600;
  }
  .plant-detail-actions {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
  }
  .detail-jumps button {
    font-size: 13px;
    padding: 8px 10px;
  }
  .plant-title h2 {
    font-size: 16px;
    letter-spacing: normal;
    margin: 0 0 7px;
  }
  .plant-summary-heading {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }
  .plant-summary-heading p {
    margin: 0;
  }
  .plant-quick-facts {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin: 14px 0;
  }
  .plant-quick-facts > div {
    padding: 10px 12px;
    border: 1px solid var(--gp-border);
    border-radius: 10px;
    min-width: 0;
  }
  .plant-quick-facts dt {
    font-size: 12px;
    color: var(--gp-muted);
  }
  .plant-quick-facts dd {
    margin: 3px 0 0;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .detail-jumps {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 12px 0;
  }
  .plant-full-information {
    margin: 12px 0;
  }
  .form-grid .wide {
    min-width: 0;
    grid-column: 1/-1;
  }
  .dialog-body h3 {
    margin-top: 20px;
  }
  .dialog-body .section-head {
    margin-top: 24px;
  }
  details {
    margin: 18px 0;
  }
  summary {
    cursor: pointer;
    font-weight: 600;
    min-height: 44px;
    padding: 10px 0;
  }
  .file-input {
    max-width: 100%;
  }
  .settings-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    max-width: 850px;
  }
  .break {
    overflow-wrap: anywhere;
  }
  :host([dark]) {
    --gp-green: #87c39a;
  }
  :host([dark]) button.primary {
    background: #397452;
    color: white;
  }
  :host([dark]) .hero {
    background: #123624;
  }
  @media (max-width: 1100px) {
    .app {
      grid-template-columns: 200px minmax(0, 1fr);
    }
    aside {
      padding: 25px 12px;
    }
    .brand strong {
      font-size: 16px;
    }
    .columns {
      grid-template-columns: 1fr;
      gap: 0;
    }
    .stats {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 760px) {
    .app {
      display: block;
    }
    aside {
      position: sticky;
      top: 56px;
      height: auto;
      z-index: 1;
      padding: 10px 12px 0;
      border-right: 0;
      border-bottom: 1px solid var(--gp-border);
      gap: 8px;
    }
    .brand {
      padding: 0 4px;
    }
    .brand-icon {
      width: 31px;
      height: 31px;
      border-radius: 9px;
    }
    .brand strong {
      font-size: 15px;
    }
    .brand small,
    .aside-footer {
      display: none;
    }
    nav {
      display: flex;
      overflow: auto;
      gap: 3px;
      padding-bottom: 8px;
    }
    nav button {
      white-space: nowrap;
      min-height: 43px;
      padding: 8px 12px;
      font-size: 12px;
      flex-shrink: 0;
    }
    nav svg {
      width: 17px;
      height: 17px;
    }
    main {
      padding: 23px 16px 50px;
    }
    .topbar {
      margin-bottom: 20px;
      gap: 14px;
    }
    .topbar .actions {
      width: 100%;
    }
    .topbar .actions .primary {
      flex: 1;
    }
    .hero {
      padding: 23px;
      border-radius: 15px;
      grid-template-columns: 1fr;
    }
    .hero .art {
      display: none;
    }
    .stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 9px;
    }
    .stat:last-child {
      grid-column: 1/-1;
    }
    .stat {
      padding: 13px;
    }
    .stat strong {
      font-size: 24px;
    }
    .panel {
      padding: 17px;
    }
    .grid {
      grid-template-columns: 1fr;
    }
    .filters label {
      min-width: calc(50% - 12px);
      max-width: none;
    }
    .filters label:first-child {
      flex-basis: 100%;
    }
    .item {
      flex-wrap: wrap;
    }
    .item-content {
      min-width: 180px;
    }
    .plant-detail-actions button {
      font-size: 12px;
      padding: 7px 4px;
      min-width: 0;
    }
    .plant-quick-facts {
      grid-template-columns: 1fr;
      gap: 0;
      border: 1px solid var(--gp-border);
      border-radius: 10px;
      overflow: hidden;
    }
    .plant-quick-facts > div {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 10px;
      border: 0;
      border-bottom: 1px solid var(--gp-border);
      border-radius: 0;
      padding: 7px 10px;
    }
    .plant-quick-facts > div:last-child {
      border-bottom: 0;
    }
    .plant-quick-facts dt {
      max-width: 62%;
    }
    .plant-quick-facts dd {
      margin: 0;
      text-align: right;
      font-size: 13px;
    }

    .form-grid {
      grid-template-columns: minmax(0, 1fr);
    }
    dialog {
      width: calc(100vw - 16px);
      max-height: 94dvh;
      border-radius: 14px;
    }
    .dialog-body {
      padding: 18px;
    }
    .dialog-head,
    .dialog-foot {
      padding: 13px 18px;
    }
    .toolbar {
      align-items: stretch;
    }
    .toolbar > input {
      max-width: 100%;
    }
    dl {
      grid-template-columns: 1fr;
      gap: 2px;
    }
    dd {
      margin-bottom: 10px;
    }
  }
  @media (max-width: 900px) {
    .filters.calendar-filters {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .filters.calendar-filters > label:first-child {
      grid-column: 1 / -1;
    }
  }
  @media (max-width: 600px) {
    .filters.calendar-filters {
      grid-template-columns: minmax(0, 1fr);
    }
    .calendar-navigation {
      width: 100%;
      grid-template-columns: 44px minmax(0, 1fr) 44px;
    }
    .calendar-navigation input {
      font-size: 16px;
    }
    .calendar-today {
      grid-row: 2;
      grid-column: 1 / -1;
      justify-self: end;
    }
    .reminders-table {
      min-width: 950px;
    }
    .reminders-table th:first-child {
      width: 100px;
      padding: 8px;
    }
    .reminders-table thead th {
      overflow-wrap: anywhere;
    }
    .matrix-scroll-hint {
      display: block;
      font-size: 12px;
    }
  }
  .neighbor-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    margin-top: 18px;
  }
  .neighbor-grid > section {
    min-width: 0;
  }
  .neighbor-group li {
    margin: 10px 0;
    overflow-wrap: anywhere;
  }
  .neighbor-options {
    max-height: 280px;
    overflow: auto;
    margin-bottom: 14px;
    border: 1px solid var(--gp-border);
    padding: 8px;
    border-radius: 9px;
  }
  .neighbor-options .check {
    min-height: 44px;
    overflow-wrap: anywhere;
  }
  .seed-save {
    margin: 14px 0;
  }
  .seed-scroll {
    overflow: auto;
    max-height: 65dvh;
    border: 1px solid var(--gp-border);
    border-radius: 10px;
    touch-action: pan-x pan-y;
  }
  .seed-table {
    width: 100%;
    min-width: 580px;
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
  }
  .seed-table th,
  .seed-table td {
    padding: 8px;
    border-right: 1px solid var(--gp-border);
    border-bottom: 1px solid var(--gp-border);
    text-align: center;
  }
  .seed-table thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--gp-soft);
  }
  .seed-table th:first-child {
    position: sticky;
    left: 0;
    width: 180px;
    background: var(--gp-card);
    text-align: left;
    overflow-wrap: anywhere;
    z-index: 1;
  }
  .seed-table thead th:first-child {
    background: var(--gp-soft);
    z-index: 3;
  }
  .seed-choice {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    cursor: pointer;
  }
  .seed-choice input {
    width: 24px;
    height: 24px;
    min-height: 24px;
    accent-color: var(--gp-green);
  }
  @media (max-width: 600px) {
    .neighbor-grid {
      grid-template-columns: minmax(0, 1fr);
    }
    .seed-table {
      min-width: 500px;
    }
    .seed-table th:first-child {
      width: 100px;
    }
    .seed-save > .actions {
      width: 100%;
    }
    .seed-save button {
      flex: 1;
    }
  }
  .neighbor-toolbar {
    align-items: end;
  }
  .neighbor-toolbar > label {
    width: min(100%, 320px);
    min-width: 0;
  }
  .seed-table thead th {
    white-space: normal;
    overflow-wrap: anywhere;
  }
  @media (max-width: 600px) {
    .neighbor-toolbar > label,
    .neighbor-toolbar > button {
      width: 100%;
    }
  }
  .ha-navigation {
    z-index: 3;
  }
  aside {
    top: var(--gp-header-height, 56px);
  }
  .stats {
    position: sticky;
    top: var(--gp-sticky-top, 56px);
    z-index: 1;
    padding: 10px 0;
    background: var(--gp-bg);
  }
  button.stat {
    min-width: 0;
    text-align: left;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 0;
  }
  .stat .stat-label-short {
    display: none;
  }
  .upcoming-panel {
    scroll-margin-top: calc(
      var(--gp-sticky-top, 56px) + var(--gp-summary-height, 0px) + 12px
    );
  }
  .upcoming-panel:focus-visible {
    outline: 3px solid var(--gp-green);
    outline-offset: 3px;
  }
  .legend {
    gap: 6px;
  }
  .legend button {
    min-height: 40px;
    font-size: 12px;
    padding: 6px 9px;
    background: transparent;
    border-color: transparent;
  }
  .legend button[aria-pressed="true"] {
    background: var(--gp-soft);
    border-color: var(--bar-color);
    box-shadow: inset 0 0 0 1px var(--bar-color);
  }
  .seed-save-status {
    min-height: 24px;
    font-size: 12px;
    color: var(--gp-muted);
  }
  .history-success-filter {
    margin-bottom: 16px;
  }
  @media (max-width: 760px) {
    aside {
      z-index: 2;
    }
    .overview-page {
      padding-top: 16px;
    }
    .overview-page .topbar {
      display: flex;
      flex-wrap: nowrap;
      margin-bottom: 12px;
      gap: 8px;
    }
    .overview-page .topbar > div {
      min-width: 0;
    }
    .overview-page .topbar .eyebrow,
    .overview-page .topbar p,
    .overview-page .topbar-action-label {
      display: none;
    }
    .overview-page .topbar h1 {
      font-size: 25px;
    }
    .overview-page .topbar .actions {
      width: auto;
      flex-wrap: nowrap;
      flex-shrink: 0;
      gap: 8px;
    }
    .overview-page .topbar .actions .primary {
      width: 44px;
      padding: 8px;
      flex: none;
    }
    .overview-page .hero {
      padding: 14px 16px;
      margin-bottom: 12px;
    }
    .overview-page .hero .eyebrow {
      display: none;
    }
    .overview-page .hero h2 {
      font-size: 20px;
      margin: 0;
    }
    .overview-page .hero p {
      font-size: 12px;
      line-height: 1.4;
      margin: 4px 0;
    }
    .overview-page .stats {
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 5px;
      margin: 12px 0;
      padding: 8px 0;
    }
    .overview-page .stat:last-child {
      grid-column: auto;
    }
    .overview-page button.stat {
      padding: 6px 4px;
      border-radius: 9px;
      align-items: center;
      text-align: center;
      min-height: 64px;
      justify-content: center;
    }
    .overview-page .stat strong {
      font-size: 19px;
      line-height: 1.2;
    }
    .overview-page .stat span {
      font-size: 10px;
      line-height: 1.2;
      overflow-wrap: anywhere;
    }
    .overview-page .stat .stat-label-full {
      display: none;
    }
    .overview-page .stat .stat-label-short {
      display: block;
    }
    .legend button {
      min-height: 44px;
    }
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
  .back-overview-bar {
    position: sticky;
    top: var(--gp-sticky-top, 56px);
    z-index: 1;
    background: var(--gp-bg);
    padding: 8px 0;
    margin-bottom: 16px;
  }
  .plant-photo,
  .profile-photo,
  .variety-photo {
    object-fit: cover;
    border-radius: 18px;
    background: var(--gp-soft);
    flex-shrink: 0;
  }
  .plant-photo {
    width: 86px;
    height: 86px;
  }
  .profile-photo {
    width: 180px;
    height: 220px;
  }
  .variety-photo {
    width: 54px;
    height: 54px;
    border-radius: 10px;
  }
  .photo-placeholder {
    display: grid;
    place-items: center;
    color: var(--gp-green);
  }
  .photo-placeholder svg {
    width: 45%;
    height: 45%;
  }
  .catalog-card {
    gap: 18px;
  }
  .catalog-card-heading {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 0;
  }
  .catalog-card-heading > div {
    min-width: 0;
  }
  .catalog-card-heading h2 {
    margin: 0;
    font-size: 23px;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }
  .catalog-card-heading i {
    display: block;
    font-size: 12px;
    color: var(--gp-muted);
    margin: 5px 0;
    overflow-wrap: anywhere;
  }
  .catalog-facts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 12px;
    margin: 4px 0;
  }
  .catalog-facts dd {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 13px;
    overflow-wrap: anywhere;
  }
  .catalog-facts svg {
    color: var(--gp-green);
    width: 18px;
    height: 18px;
  }
  .catalog-neighbors {
    display: flex;
    gap: 12px;
    align-items: center;
    border-top: 1px solid var(--gp-border);
    padding-top: 15px;
    font-size: 13px;
  }
  .catalog-neighbors > span:first-child {
    margin-right: auto;
    color: var(--gp-muted);
  }
  .catalog-details {
    flex: 1;
  }
  .catalog-card .actions {
    flex-wrap: nowrap;
  }
  .neighbor-good {
    color: var(--success-color, #286644);
  }
  .neighbor-bad {
    color: var(--error-color, #a52f32);
  }
  :host([dark]) .neighbor-good {
    color: var(--success-color, #78c99a);
  }
  :host([dark]) .neighbor-bad {
    color: var(--error-color, #ff9494);
  }
  .image-editor {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    margin-bottom: 20px;
    border: 1px solid var(--gp-border);
    border-radius: 14px;
  }
  .image-editor > div {
    min-width: 0;
    flex: 1;
  }
  .image-editor input {
    max-width: 100%;
    width: 100%;
    padding: 8px 0;
    border: 0;
  }
  .image-editor small {
    display: block;
    margin: 8px 0;
  }
  .matrix-search {
    max-width: 440px;
    margin-bottom: 10px;
  }
  .neighbor-matrix-scroll {
    overflow: auto;
    max-height: 60dvh;
    border: 1px solid var(--gp-border);
    border-radius: 14px;
    isolation: isolate;
  }
  .neighbor-matrix {
    border-collapse: separate;
    border-spacing: 0;
    width: max-content;
    min-width: 100%;
    table-layout: fixed;
  }
  .neighbor-matrix th,
  .neighbor-matrix td {
    padding: 5px;
    border-bottom: 1px solid var(--gp-border);
    width: 100px;
    min-width: 100px;
    max-width: 100px;
    text-align: center;
    vertical-align: middle;
    overflow-wrap: anywhere;
  }
  .neighbor-matrix thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--gp-card);
    height: 70px;
    font-size: 12px;
  }
  .neighbor-matrix tr > :first-child {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--gp-card);
    width: 150px;
    min-width: 150px;
    max-width: 150px;
    text-align: left;
    font-size: 13px;
  }
  .neighbor-matrix thead th:first-child {
    z-index: 3;
  }
  .neighbor-matrix .matrix-highlight {
    background: var(--gp-soft);
  }
  .matrix-cell {
    width: 100%;
    min-height: 46px;
    padding: 5px;
    font-size: 22px;
    border-color: transparent;
    border-radius: 10px;
  }
  .matrix-cell.neighbor-good {
    background: color-mix(
      in srgb,
      var(--success-color, #397456) 13%,
      var(--gp-card)
    );
  }
  .matrix-cell.neighbor-bad {
    background: color-mix(
      in srgb,
      var(--error-color, #a52f32) 13%,
      var(--gp-card)
    );
  }
  .matrix-cell:disabled {
    opacity: 1;
  }
  .matrix-legend {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    font-size: 13px;
  }
  .plant-profile {
    padding-top: 14px;
  }
  .profile-heading {
    display: flex;
    align-items: flex-start;
    gap: 22px;
  }
  .profile-heading > div {
    min-width: 0;
  }
  .profile-heading h3 {
    font-size: 32px;
    line-height: 1.15;
    margin: 12px 0;
  }
  .profile-heading i {
    color: var(--gp-muted);
  }
  .profile-condition {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 12px;
    font-size: 13px;
    margin: 10px 0;
  }
  .profile-condition strong {
    color: var(--gp-muted);
    font-weight: 500;
  }
  .profile-description {
    color: var(--gp-muted);
    white-space: pre-wrap;
  }
  .profile-facts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin: 16px 0 26px;
  }
  .profile-facts > div {
    background: var(--gp-soft);
    padding: 18px;
    border-radius: 16px;
    min-width: 0;
  }
  .profile-facts dt {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--gp-muted);
  }
  .profile-facts dt svg {
    color: var(--gp-green);
  }
  .profile-facts dd {
    margin: 10px 0 0;
  }
  .profile-facts strong {
    display: block;
    font-size: 24px;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }
  .profile-facts small {
    display: block;
    font-size: 11px;
    color: var(--gp-muted);
    margin-top: 12px;
  }
  .plant-profile > section {
    padding: 18px 0;
    border-top: 1px solid var(--gp-border);
  }
  .temperature-scale {
    height: 24px;
    border-radius: 16px;
    background: #ad8952;
    position: relative;
    overflow: hidden;
    margin: 22px 0 10px;
  }
  .temperature-scale > span {
    display: block;
    position: absolute;
    height: 100%;
    background: #397456;
  }
  .temperature-labels {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 12px;
    flex-wrap: wrap;
  }
  .temperature-profile p {
    font-size: 12px;
  }
  .profile-year-scroll {
    max-width: 100%;
    overflow: auto;
  }
  .profile-year-grid {
    display: grid;
    grid-template-columns: 90px repeat(12, minmax(27px, 1fr));
    min-width: 460px;
    gap: 3px;
    align-items: center;
  }
  .mini-month {
    text-align: center;
    font-size: 10px;
    color: var(--gp-muted);
  }
  .mini-title {
    font-size: 11px;
    min-height: 35px;
    border: 0;
    padding: 5px 0;
    justify-content: flex-start;
    background: transparent;
  }
  .mini-cell > span {
    display: block;
    position: relative;
    height: 13px;
    background: var(--gp-soft);
    border-radius: 3px;
    overflow: hidden;
  }
  .mini-cell .bar {
    display: block;
    position: absolute;
    height: 100%;
    background: var(--bar-color);
  }
  .neighbor-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .profile-text {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  @media (max-width: 600px) {
    .catalog-card-heading {
      gap: 12px;
    }
    .plant-photo {
      width: 72px;
      height: 72px;
    }
    .profile-photo {
      width: 100px;
      height: 130px;
    }
    .profile-heading {
      gap: 14px;
    }
    .profile-heading h3 {
      font-size: 25px;
    }
    .profile-facts > div {
      padding: 12px;
    }
    .profile-facts strong {
      font-size: 19px;
    }
    .image-editor {
      flex-wrap: wrap;
    }
    .image-editor > div {
      flex-basis: 100%;
    }
    .neighbor-matrix th,
    .neighbor-matrix td {
      width: 78px;
      min-width: 78px;
      max-width: 78px;
    }
    .neighbor-matrix tr > :first-child {
      width: 108px;
      min-width: 108px;
      max-width: 108px;
    }
  }

  .culture-tools {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
  }
  .stock-panel {
    margin-top: 24px;
    scroll-margin-top: calc(var(--gp-sticky-top, 56px) + 80px);
  }
  .stock-total {
    font-weight: 600;
  }
  .stock-lot {
    border-top: 1px solid var(--gp-border);
    padding: 18px 0;
  }
  .stock-lot dl {
    display: grid;
    grid-template-columns: minmax(100px, 1fr) minmax(0, 1.4fr);
    gap: 6px 16px;
    font-size: 13px;
  }
  .stock-lot dd {
    margin: 0;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }
  .culture-journal {
    margin: 24px 0;
  }
  .journal-entry {
    border: 1px solid var(--gp-border);
    border-radius: 16px;
    padding: 16px;
    margin: 12px 0;
  }
  .journal-entry time {
    display: block;
    font-size: 12px;
    color: var(--gp-muted);
    margin-top: 8px;
  }
  .journal-entry h4 {
    margin: 8px 0;
  }
  .journal-photo {
    aspect-ratio: 4 / 3;
    min-height: 120px;
    display: block;
    max-width: 100%;
    width: min(100%, 360px);
    max-height: 360px;
    border-radius: 14px;
    object-fit: contain;
    background: var(--gp-soft);
    margin: 14px 0;
  }
  .single-harvest {
    display: block;
    font-size: 22px;
    margin: 10px 0;
  }
  .harvest-total {
    background: var(--gp-soft);
    border-radius: 16px;
    padding: 18px;
    margin: 18px 0;
  }
  .harvest-total h3 {
    margin-top: 0;
  }
  .harvest-total-values {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px 24px;
  }
  .harvest-total-values strong {
    font-size: 24px;
  }
  .garden-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin: 20px 0;
  }
  .garden-actions button {
    min-height: 88px;
    flex-direction: column;
    font-size: 16px;
    padding: 16px 10px;
  }
  .garden-actions svg {
    width: 28px;
    height: 28px;
  }
  .garden-mode select {
    width: 100%;
    max-width: 100%;
  }
  .camera-input {
    margin-top: 12px;
  }
  .harvest-table-scroll {
    overflow: auto;
    max-height: 65dvh;
    border: 1px solid var(--gp-border);
    border-radius: 12px;
  }
  .harvest-table {
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
    min-width: 720px;
    font-size: 13px;
  }
  .harvest-table th,
  .harvest-table td {
    padding: 12px;
    text-align: right;
    border-bottom: 1px solid var(--gp-border);
    white-space: nowrap;
  }
  .harvest-table thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--gp-card);
    white-space: normal;
  }
  .harvest-table tr > :first-child {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--gp-card);
    text-align: left;
    min-width: 110px;
    max-width: 200px;
    white-space: normal;
  }
  .harvest-table thead th:first-child {
    z-index: 3;
  }
  @media (max-width: 600px) {
    .culture-tools {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 5px;
    }
    .culture-tools button {
      min-width: 0;
      padding: 8px 4px;
      font-size: 11px;
    }
    .stock-lot .section-head,
    .journal-entry .section-head {
      align-items: flex-start;
      flex-wrap: wrap;
    }
    .garden-mode {
      padding: 16px;
    }
    .garden-actions button {
      min-height: 96px;
      font-size: 14px;
    }
    .harvest-table tr > :first-child {
      max-width: 130px;
    }
  }
  @media (max-width: 760px) {
    .garden-page .topbar .eyebrow,
    .garden-page .topbar p,
    .garden-page .topbar-action-label {
      display: none;
    }
    .garden-page .topbar h1 {
      font-size: 24px;
    }
    .garden-page .topbar {
      margin-bottom: 12px;
    }
    .garden-page .topbar .primary {
      width: 44px;
      padding: 8px;
    }
    .garden-page .garden-mode h3 {
      margin: 10px 0;
      font-size: 18px;
    }
    .garden-page .garden-actions {
      margin: 12px 0;
    }
    .garden-page .garden-actions button {
      min-height: 82px;
    }
  }
  .harvest-help,
  .harvest-extra {
    margin: 12px 0;
  }
  .harvest-help summary,
  .harvest-extra summary {
    cursor: pointer;
    min-height: 36px;
    font-size: 13px;
    color: var(--gp-muted);
  }
  .harvest-extra {
    grid-column: 1/-1;
  }
`, Gn = [
	"overview",
	"calendar",
	"plants",
	"cultures",
	"history",
	"locations",
	"reminders",
	"neighbors",
	"seeds",
	"settings"
], Q = [
	"indoors",
	"direct",
	"prick_out",
	"transplant",
	"care",
	"fertilize",
	"prune",
	"harvest",
	"other"
], Kn = {
	temperature: "M9 14V5a3 3 0 0 1 6 0v9a5 5 0 1 1-6 0M12 8v10",
	clock: "M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
	ruler: "M3 7l4-4 14 14-4 4zM7 7l2-2M10 10l2-2M13 13l2-2",
	camera: "M3 7h4l2-3h6l2 3h4v13H3zM16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
	harvest: "M6 10h12l2 11H4zM9 10V7a3 3 0 0 1 6 0v3",
	menu: "M3 6h18M3 12h18M3 18h18",
	overview: "M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z",
	calendar: "M4 5h16v16H4zM8 2v6m8-6v6M4 10h16",
	plants: "M12 21V10M12 15C3 15 3 6 3 6s9-1 9 9zm0-5c0-8 9-8 9-8s1 9-9 8z",
	cultures: "M5 20h14l2-10H3zM12 10V4m0 4C6 8 6 3 6 3s6 0 6 5zm0-2c0-5 6-5 6-5s0 5-6 5z",
	history: "M3 11a9 9 0 1 1 2 7M3 4v7h7m2-4v6l4 2",
	neighbors: "M4 20V8m16 12V8M4 10c0-6 8-6 8 0M12 10c0-6 8-6 8 0M8 20v-6m8 6v-6M2 20h20",
	seeds: "M4 5h16v16H4zM8 2v6m8-6v6M8 12h8M8 16h5",
	reminders: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
	locations: "M3 3l6 3 6-3 6 3v15l-6-3-6 3-6-3zm6 3v15m6-18v15",
	settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0-6v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2",
	edit: "M4 20h4L20 8l-4-4L4 16v4ZM14 6l4 4",
	plus: "M12 5v14M5 12h14",
	close: "M6 6l12 12M6 18 18 6",
	arrow: "M9 5l7 7-7 7",
	refresh: "M20 7a9 9 0 1 0 1 8M20 2v5h-5",
	check: "M4 12l5 5L20 6"
};
function $(e) {
	return Ne`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${Kn[e] ?? Kn.plants}></path></svg>`;
}
function qn() {
	try {
		return localStorage.getItem("garden-planner-language") ?? "";
	} catch {
		return "";
	}
}
var Jn = class extends Ze {
	constructor(...e) {
		super(...e), this.personalReminders = null, this.reminderConfirmed = null, this.reminderPending = /* @__PURE__ */ new Map(), this.reminderSaving = !1, this.reminderTasksDirty = !1, this.reminderTaskVersion = 0, this.navigationGeneration = 0, this.reminderQuery = "", this.preferencesGeneration = 0, this.capabilities = null, this.hostSettings = null, this.hostDraftRevision = 0, this.hostDraft = null, this.deliveries = [], this.page = "overview", this.tables = r(), this.loaded = !1, this.busy = !1, this.error = "", this.toast = "", this.languagePreference = qn(), this.query = "", this.category = "", this.method = "", this.sort = "name", this.showArchived = !1, this.calendarMode = "month", this.anchor = "", this.calendarCategories = [], this.calendarActivities = [], this.selected = null, this.editor = null, this.sensorOpen = !1, this.sensorIndex = -1, this.sensorAbove = !1, this.sensorMaxHeight = 240, this.completing = null, this.neighborPlant = "", this.neighborQuery = "", this.neighborEditor = null, this.stockPlant = "", this.cultureView = "list", this.gardenCulture = "", this.harvestBy = "plant", this.harvestYear = "", this.harvestPlant = "", this.harvestVariety = "", this.harvestLocation = "", this.imageLoading = !1, this.imageGeneration = 0, this.matrixQuery = "", this.cultureScope = "current", this.historySuccessOnly = !1, this.layoutNodes = /* @__PURE__ */ new Set(), this.seedSaving = !1, this.seedFailed = !1, this.seedFlight = /* @__PURE__ */ new Map(), this.seedDraft = /* @__PURE__ */ new Map(), this.seedRevisions = /* @__PURE__ */ new Map(), this.seedQuery = "", this.seedFilter = "", this.deleting = null, this.reviewed = null, this.importMode = "merge", this.replaceConfirmed = !1, this.backups = [], this.historyYear = "", this.historyPlant = "", this.boundUser = "", this.connectionGeneration = 0, this.loadGeneration = 0, this.reconnect = () => {
			this.refresh();
		}, this.dialogTriggers = /* @__PURE__ */ new Map(), this.rememberTrigger = (e) => {
			let t = e.composedPath().find((e) => e instanceof HTMLElement && e.matches("button, input, select, a[href]"));
			t && (this.lastTrigger = t);
		}, this.restoreDialogFocus = (e) => {
			if (!(e.target instanceof HTMLDialogElement)) return;
			let t = this.dialogTriggers.get(e.target.id);
			this.dialogTriggers.delete(e.target.id), queueMicrotask(() => {
				let e = [...this.renderRoot.querySelectorAll("dialog[open]")];
				t?.isConnected && (!e.length || e.at(-1).contains(t)) && t.focus({ preventScroll: !0 });
			});
		}, this.dismissCalendarFilters = (e) => {
			let t = e.composedPath().find((e) => e instanceof HTMLElement && e.classList.contains("multi-filter"));
			for (let e of this.renderRoot.querySelectorAll(".multi-filter details[open]")) t instanceof HTMLElement && t.contains(e) || (e.open = !1);
		}, this.closeCalendarFilters = (e) => {
			if (e.key !== "Escape" || this.renderRoot.querySelector("dialog[open]")) return;
			let t = [...this.renderRoot.querySelectorAll(".multi-filter details[open]")];
			if (!t.length) return;
			let n = t.find((t) => e.composedPath().some((e) => e instanceof Node && t.contains(e)));
			t.forEach((e) => {
				e.open = !1;
			}), n?.querySelector("summary")?.focus(), e.preventDefault();
		}, this.flushHiddenReminders = () => {
			document.visibilityState === "hidden" && (this.flushReminderChanges(), this.saveSeedInventory());
		}, this.confirmPendingReminders = (e) => {
			(this.reminderSaving || this.seedDraft.size || this.seedSaving) && (e.preventDefault(), e.returnValue = "");
		}, this.positionSensorOptions = () => {
			if (!this.sensorOpen) return;
			let e = this.renderRoot.querySelector("#field-sensor_entity_id");
			if (!e) return;
			let t = e.getBoundingClientRect(), n = e.closest("dialog")?.getBoundingClientRect(), r = window.visualViewport, i = Math.max((r?.offsetTop ?? 0) + 8, (n?.top ?? 0) + 8), a = Math.min((r?.offsetTop ?? 0) + (r?.height ?? window.innerHeight) - 8, (n?.bottom ?? window.innerHeight) - 8);
			if (t.bottom < i || t.top > a) {
				this.sensorMaxHeight = 0;
				return;
			}
			let o = Math.max(0, t.top - i - 4), s = Math.max(0, a - t.bottom - 4);
			this.sensorAbove = s < 240 && o > s, this.sensorMaxHeight = Math.floor(Math.min(240, this.sensorAbove ? o : s));
		}, this.measureOverviewLayout = () => {
			let e = this.renderRoot.querySelector(".ha-navigation"), t = this.renderRoot.querySelector("aside"), n = this.renderRoot.querySelector(".stats"), r = e?.getBoundingClientRect().height ?? 56, i = r + (window.matchMedia("(max-width: 760px)").matches ? t?.getBoundingClientRect().height ?? 0 : 0), a = {
				"--gp-header-height": `${r}px`,
				"--gp-sticky-top": `${i}px`,
				"--gp-summary-height": `${n?.getBoundingClientRect().height ?? 0}px`
			};
			for (let [e, t] of Object.entries(a)) this.style.getPropertyValue(e) !== t && this.style.setProperty(e, t);
		};
	}
	static {
		this.styles = Wn;
	}
	static {
		this.properties = {
			hass: { attribute: !1 },
			narrow: { type: Boolean },
			reminderSaving: { state: !0 },
			personalReminders: { state: !0 },
			reminderQuery: { state: !0 },
			capabilities: { state: !0 },
			hostSettings: { state: !0 },
			hostDraft: { state: !0 },
			deliveries: { state: !0 },
			page: { state: !0 },
			tables: { state: !0 },
			loaded: { state: !0 },
			busy: { state: !0 },
			error: { state: !0 },
			toast: { state: !0 },
			languagePreference: { state: !0 },
			query: { state: !0 },
			category: { state: !0 },
			method: { state: !0 },
			sort: { state: !0 },
			showArchived: { state: !0 },
			calendarMode: { state: !0 },
			anchor: { state: !0 },
			calendarCategories: { state: !0 },
			calendarActivities: { state: !0 },
			selected: { state: !0 },
			editor: { state: !0 },
			sensorOpen: { state: !0 },
			sensorIndex: { state: !0 },
			sensorAbove: { state: !0 },
			sensorMaxHeight: { state: !0 },
			deleting: { state: !0 },
			completing: { state: !0 },
			neighborPlant: { state: !0 },
			neighborEditor: { state: !0 },
			neighborQuery: { state: !0 },
			seedDraft: { state: !0 },
			imageLoading: { state: !0 },
			matrixQuery: { state: !0 },
			stockPlant: { state: !0 },
			cultureView: { state: !0 },
			gardenCulture: { state: !0 },
			harvestBy: { state: !0 },
			harvestYear: { state: !0 },
			harvestPlant: { state: !0 },
			harvestVariety: { state: !0 },
			harvestLocation: { state: !0 },
			seedSaving: { state: !0 },
			seedFailed: { state: !0 },
			seedFlight: { state: !0 },
			cultureScope: { state: !0 },
			historySuccessOnly: { state: !0 },
			seedQuery: { state: !0 },
			seedFilter: { state: !0 },
			reviewed: { state: !0 },
			importMode: { state: !0 },
			replaceConfirmed: { state: !0 },
			backups: { state: !0 },
			historyYear: { state: !0 },
			historyPlant: { state: !0 }
		};
	}
	get language() {
		return (this.languagePreference || this.hass?.locale?.language || this.hass?.language || "de").startsWith("de") ? "de" : "en";
	}
	tr(e) {
		return St(this.language, e);
	}
	lab(e) {
		return Ct(this.language, e);
	}
	get timeZone() {
		return this.hass?.config.time_zone || Intl.DateTimeFormat().resolvedOptions().timeZone;
	}
	get today() {
		return i(this.timeZone);
	}
	get editable() {
		return this.capabilities?.can_edit ?? this.hass?.user?.is_admin === !0;
	}
	get admin() {
		return this.hass?.user?.is_admin === !0;
	}
	get plantList() {
		return this.tables.plants.filter((e) => !e.data.archived);
	}
	get year() {
		return Number((this.anchor || this.today).slice(0, 4));
	}
	get month() {
		return Number((this.anchor || this.today).slice(5, 7));
	}
	get categories() {
		return [...new Set(this.tables.plants.map((e) => t(e, "category")).filter(Boolean))].sort();
	}
	connectedCallback() {
		super.connectedCallback(), document.addEventListener("pointerdown", this.dismissCalendarFilters, !0), document.addEventListener("keydown", this.closeCalendarFilters, !0), document.addEventListener("visibilitychange", this.flushHiddenReminders), window.addEventListener("beforeunload", this.confirmPendingReminders), this.addEventListener("click", this.rememberTrigger, !0), this.renderRoot.addEventListener("close", this.restoreDialogFocus, !0), this.renderRoot.addEventListener("scroll", this.positionSensorOptions, !0), window.addEventListener("resize", this.positionSensorOptions), window.visualViewport?.addEventListener("resize", this.positionSensorOptions), window.visualViewport?.addEventListener("scroll", this.positionSensorOptions), this.hass && this.bind();
	}
	disconnectedCallback() {
		this.flushReminderChanges(), this.saveSeedInventory(), this.layoutObserver?.disconnect(), this.layoutObserver = void 0, this.layoutNodes.clear(), super.disconnectedCallback(), document.removeEventListener("pointerdown", this.dismissCalendarFilters, !0), document.removeEventListener("keydown", this.closeCalendarFilters, !0), document.removeEventListener("visibilitychange", this.flushHiddenReminders), window.removeEventListener("beforeunload", this.confirmPendingReminders), this.removeEventListener("click", this.rememberTrigger, !0), this.renderRoot.removeEventListener("scroll", this.positionSensorOptions, !0), window.removeEventListener("resize", this.positionSensorOptions), window.visualViewport?.removeEventListener("resize", this.positionSensorOptions), window.visualViewport?.removeEventListener("scroll", this.positionSensorOptions), this.renderRoot.removeEventListener("close", this.restoreDialogFocus, !0), this.connectionGeneration++, this.loadGeneration++, this.boundConnection?.removeEventListener?.("ready", this.reconnect), this.unsubscribe?.().catch(() => void 0), this.unsubscribe = void 0, this.boundConnection = void 0, this.toastTimer && clearTimeout(this.toastTimer);
	}
	willUpdate(e) {
		e.has("hass") && this.isConnected && (this.hass?.connection !== this.boundConnection || this.hass?.user?.id !== this.boundUser) && this.bind();
	}
	updated() {
		this.observeOverviewLayout(), this.setAttribute("lang", this.language), this.hass?.themes && this.toggleAttribute("dark", this.hass.themes.darkMode), this.syncDialog("detail-dialog", this.selected !== null), this.syncDialog("editor-dialog", this.editor !== null), this.syncDialog("delete-dialog", this.deleting !== null), this.syncDialog("complete-task-dialog", this.completing !== null), this.syncDialog("neighbors-dialog", this.neighborEditor !== null), this.syncDialog("review-dialog", this.reviewed !== null);
	}
	syncDialog(e, t) {
		let n = this.renderRoot.querySelector(`#${e}`);
		if (t && n && !n.open) {
			let t = this.dialogTriggers.get(e), r = (this.lastTrigger?.isConnected ? this.lastTrigger : void 0) ?? (t?.isConnected ? t : void 0) ?? this.shadowRoot?.activeElement ?? this.ownerDocument.activeElement;
			r instanceof HTMLElement && this.dialogTriggers.set(e, r), n.showModal();
		}
		!t && n?.open && n.close();
	}
	async bind() {
		this.flushReminderChanges(), this.saveSeedInventory();
		let e = ++this.connectionGeneration;
		if (this.loadGeneration++, this.boundConnection?.removeEventListener?.("ready", this.reconnect), this.unsubscribe?.().catch(() => void 0), this.unsubscribe = void 0, this.boundConnection = this.hass?.connection, this.boundUser = this.hass?.user?.id ?? "", this.api = this.hass?.user ? new Dt(this.hass) : void 0, this.tables = r(), this.personalReminders = null, this.reminderConfirmed = null, this.reminderPending = /* @__PURE__ */ new Map(), this.reminderFlush = void 0, this.reminderSaving = !1, this.reminderTasksDirty = !1, this.reminderTaskVersion = 0, this.navigationGeneration++, this.preferencesGeneration++, this.capabilities = null, this.hostSettings = null, this.hostDraft = null, this.deliveries = [], this.loaded = !1, this.selected = null, this.editor = null, this.deleting = null, this.completing = null, this.neighborEditor = null, this.neighborPlant = "", this.neighborQuery = "", this.resetSeeds(), this.stockPlant = "", this.gardenCulture = "", this.cultureView = "list", this.harvestYear = this.harvestPlant = this.harvestVariety = this.harvestLocation = "", this.seedQuery = "", this.seedFilter = "", this.cultureScope = "current", this.historySuccessOnly = !1, this.reviewed = null, this.backups = [], this.lastTrigger = void 0, this.dialogTriggers.clear(), this.error = "", this.toast = "", this.busy = !1, this.toastTimer && clearTimeout(this.toastTimer), this.api && this.boundConnection) {
			this.anchor ||= this.today, this.boundConnection.addEventListener?.("ready", this.reconnect);
			try {
				let t = await this.api.subscribe(() => {
					this.refresh();
				});
				if (e !== this.connectionGeneration || !this.isConnected) {
					await t();
					return;
				}
				this.unsubscribe = t;
			} catch {
				e === this.connectionGeneration && (this.error = this.tr("disconnected"));
			}
			e === this.connectionGeneration && await this.refresh();
		}
	}
	async refresh() {
		if (!this.api) return;
		let e = ++this.loadGeneration;
		try {
			let [t, n] = await Promise.all([this.api.load(), this.api.command("capabilities")]);
			if (e !== this.loadGeneration || !this.isConnected) return;
			this.tables = t, this.capabilities = n, n.can_edit || (this.neighborEditor = null, this.resetSeeds(), this.completing && !this.completing.data.personal_generated && (this.completing = null)), this.loaded = !0, this.error = "", this.page === "reminders" && await this.loadPersonalReminders();
		} catch (t) {
			e === this.loadGeneration && (this.error = U(this.language, t), t && typeof t == "object" && "code" in t && t.code === "unauthorized" && (this.tables = r(), this.personalReminders = null, this.completing = null, this.neighborEditor = null, this.resetSeeds(), this.preferencesGeneration++, this.capabilities = null, this.selected = null, this.editor = null, this.loaded = !0));
		}
	}
	announce(e) {
		this.toast = this.tr(e), this.toastTimer && clearTimeout(this.toastTimer), this.toastTimer = setTimeout(() => {
			this.toast = "";
		}, 4500);
	}
	async action(e, t, n = "saved") {
		if (!this.api || this.busy) return;
		this.busy = !0, this.error = "";
		let r = this.connectionGeneration;
		try {
			let i = await this.api.command(e, t);
			return r !== this.connectionGeneration || (await this.refresh(), r !== this.connectionGeneration) ? void 0 : (n && this.announce(n), i);
		} catch (e) {
			r === this.connectionGeneration && (this.error = U(this.language, e));
			return;
		} finally {
			r === this.connectionGeneration && (this.busy = !1);
		}
	}
	async navigate(e) {
		let t = ++this.navigationGeneration, n = this.connectionGeneration;
		if (this.page !== "seeds" || e === "seeds" || !this.seedDraft.size && !this.seedSaving || await this.saveSeedInventory() && n === this.connectionGeneration && t === this.navigationGeneration && this.isConnected) {
			if (this.page === "reminders" && e !== "reminders") do
				if (!await this.flushReminderChanges() || n !== this.connectionGeneration || t !== this.navigationGeneration || !this.isConnected || this.reminderTasksDirty && !await this.refreshReminderTasks()) return;
			while (this.reminderPending.size || this.reminderSaving || this.reminderTasksDirty);
			else if (this.page === "reminders" && e === "reminders") return;
			n === this.connectionGeneration && t === this.navigationGeneration && (this.page = e, e === "cultures" && (this.cultureScope = "current", this.cultureView = "list"), e === "history" && (this.historySuccessOnly = !1), this.error = "", e === "reminders" && (this.personalReminders = null, this.loadPersonalReminders()), e === "settings" && this.admin && (this.loadBackups(), this.loadHostSettings()));
		}
	}
	plantName(e) {
		let n = e.data.snapshot;
		if (n && typeof n == "object" && !Array.isArray(n)) {
			let e = n.plant;
			if (e && typeof e == "object" && !Array.isArray(e) && typeof e.name == "string") return e.name;
		}
		return t(this.tables.plants.find((n) => n.id === t(e, "plant_id")), "name") || this.tr("untitled");
	}
	nameFor(e, n) {
		return t(this.tables[n].find((t) => t.id === e), "name") || "—";
	}
	plantWindows(e) {
		return this.tables.growing_windows.filter((n) => t(n, "plant_id") === e).sort((e, t) => this.compareWindows(e, t));
	}
	compareWindows(e, n) {
		return Q.indexOf(t(e, "activity")) - Q.indexOf(t(n, "activity")) || Number(e.data.start_month) - Number(n.data.start_month) || Number(e.data.start_day) - Number(n.data.start_day) || this.nameFor(t(e, "plant_id"), "plants").localeCompare(this.nameFor(t(n, "plant_id"), "plants"), this.language) || e.id.localeCompare(n.id);
	}
	status(e) {
		return b(e, this.tables.cultivation_events);
	}
	startEditor(e, t, n = {}) {
		this.imageGeneration++, this.imageLoading = !1, this.sensorOpen = !1, this.sensorIndex = -1, this.error = "", this.editor = {
			table: e,
			record: t,
			draft: t ? structuredClone(t.data) : Nt(e, this.timeZone, n)
		};
	}
	fieldList(e) {
		return Mt(e.table, e.draft, this.tables, this.language, !!e.record);
	}
	changeField(e, n) {
		if (!this.editor) return;
		let r = {
			...this.editor.draft,
			[e]: n
		};
		if (e !== "plant_id" || this.editor.record && this.editor.table !== "seed_lots" || (r = {
			...r,
			variety_id: ""
		}), e === "cultivation_id" && this.editor.table === "tasks") {
			let e = this.tables.cultivations.find((e) => e.id === n);
			e && (r = {
				...r,
				plant_id: t(e, "plant_id"),
				location_id: t(e, "location_id")
			});
		}
		this.editor = {
			...this.editor,
			draft: r
		};
	}
	async saveEditor(e) {
		if (e.preventDefault(), !this.editor || this.busy || this.imageLoading || !e.currentTarget.reportValidity()) return;
		let t = this.editor, n;
		try {
			n = Pt(t.table, t.draft, this.fieldList(t), t.record);
		} catch {
			this.error = this.tr("numberRange");
			return;
		}
		await this.action(t.record ? "update" : "create", {
			table: t.table,
			...t.record ? {
				id: t.record.id,
				revision: t.record.revision
			} : {},
			data: n
		}) && (this.editor = null);
	}
	async removeRecord() {
		if (!this.deleting) return;
		let { table: e, record: t } = this.deleting;
		await this.action("delete", {
			table: e,
			id: t.id,
			revision: t.revision,
			confirm: !0
		}, "deleted"), this.error || (this.deleting = null, this.selected?.id === t.id && (this.selected = null));
	}
	async archive(e, t) {
		await this.action("update", {
			table: t,
			id: e.id,
			revision: e.revision,
			data: { archived: !e.data.archived }
		});
	}
	async duplicate(e) {
		let n = await this.action("duplicate_plant", {
			id: e.id,
			name: `${t(e, "name")} · ${this.tr("new")}`
		}, "copied");
		n && (this.selected = {
			kind: "plant",
			id: n.id
		}, this.startEditor("plants", n));
	}
	openSensorOptions() {
		this.renderRoot.querySelector("#field-sensor_entity_id")?.scrollIntoView({ block: "nearest" }), this.sensorOpen = !0, this.positionSensorOptions();
	}
	chooseSensor(e) {
		this.changeField("sensor_entity_id", e), this.renderRoot.querySelector("#field-sensor_entity_id")?.focus(), this.sensorOpen = !1, this.sensorIndex = -1;
	}
	renderSensorField(e) {
		let t = String(this.editor?.draft.sensor_entity_id ?? ""), n = E(this.hass, t), r = this.sensorOpen && this.sensorIndex >= 0 && this.sensorIndex < n.length;
		return B`<div class="sensor-field">
      <label id="field-sensor_entity_id-label" for="field-sensor_entity_id"
        >${this.tr(e.key)}</label
      >
      <div
        class="sensor-picker"
        @focusout=${(e) => {
			e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget) || (this.sensorOpen = !1, this.sensorIndex = -1);
		}}
      >
        <input
          id="field-sensor_entity_id"
          name="sensor_entity_id"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-labelledby="field-sensor_entity_id-label"
          aria-controls="temperature-sensor-options"
          aria-expanded=${String(this.sensorOpen)}
          aria-activedescendant=${r ? `temperature-sensor-option-${this.sensorIndex}` : H}
          autocomplete="off"
          .value=${t}
          ?disabled=${this.busy || e.disabled}
          @focus=${() => this.openSensorOptions()}
          @click=${() => this.openSensorOptions()}
          @input=${(t) => {
			this.changeField(e.key, t.target.value), this.openSensorOptions(), this.sensorIndex = -1;
		}}
          @keydown=${(e) => {
			e.key === "Escape" && this.sensorOpen ? (e.preventDefault(), e.stopPropagation(), this.sensorOpen = !1, this.sensorIndex = -1) : e.key === "ArrowDown" || e.key === "ArrowUp" ? (e.preventDefault(), this.openSensorOptions(), n.length && (this.sensorIndex = e.key === "ArrowDown" ? Math.min(this.sensorIndex + 1, n.length - 1) : this.sensorIndex < 0 ? n.length - 1 : Math.max(0, Math.min(this.sensorIndex - 1, n.length - 1)), this.updateComplete.then(() => this.renderRoot.querySelector(`#temperature-sensor-option-${this.sensorIndex}`)?.scrollIntoView({ block: "nearest" })))) : e.key === "Enter" && r && (e.preventDefault(), this.chooseSensor(n[this.sensorIndex].id));
		}}
        />
        <div
          id="temperature-sensor-options"
          role="listbox"
          aria-labelledby="field-sensor_entity_id-label"
          class=${`sensor-options ${this.sensorAbove ? "above" : ""}`}
          style=${`--sensor-max-height:${this.sensorMaxHeight}px`}
          ?hidden=${!this.sensorOpen}
        >
          ${n.map((e, t) => B`<button
                type="button"
                role="option"
                tabindex="-1"
                id=${`temperature-sensor-option-${t}`}
                aria-selected=${String(t === this.sensorIndex)}
                @mousedown=${(e) => e.preventDefault()}
                @click=${() => this.chooseSensor(e.id)}
              >
                <strong>${e.name}</strong><small>${e.id}</small>
              </button>`)}
          ${n.length ? H : B`<div class="sensor-empty" role="option" aria-disabled="true">${this.tr("noSensors")}</div>`}
        </div>
      </div>
    </div>`;
	}
	renderField(e) {
		if (e.key === "sensor_entity_id") return this.renderSensorField(e);
		let t = this.editor.draft[e.key], n = (t) => this.changeField(e.key, t.target.value), r = `field-${e.key}`;
		return B`<label
      class=${[e.type === "textarea" || e.wide ? "wide" : "", e.rowStart ? "row-start" : ""].filter(Boolean).join(" ")}
      for=${r}
    >
      <span id=${`${r}-label`}
        >${this.tr(e.label ?? e.key)}${e.required ? " *" : ""}</span
      >
      ${e.type === "select" ? B`<select
              id=${r}
              aria-labelledby=${`${r}-label`}
              name=${e.key}
              ?required=${e.required}
              ?disabled=${e.disabled || this.busy}
              @change=${n}
            >
              <option
                value=""
                ?disabled=${e.required}
                .selected=${t === "" || t == null}
              >
                ${this.tr("optional")}
              </option>
              ${e.options?.map((e) => B`<option value=${e.value} .selected=${String(t ?? "") === e.value}>${e.label}</option>`)}
            </select>` : e.type === "textarea" ? B`<textarea
                id=${r}
                aria-labelledby=${`${r}-label`}
                name=${e.key}
                .value=${String(t ?? "")}
                ?disabled=${this.busy}
                maxlength="20000"
                @input=${n}
              ></textarea>` : B`<input
                id=${r}
                aria-labelledby=${`${r}-label`}
                name=${e.key}
                type=${e.type ?? "text"}
                .value=${String(t ?? "")}
                ?required=${e.required}
                ?disabled=${e.disabled || this.busy}
                min=${e.min ?? H}
                max=${e.max ?? H}
                step=${e.step ?? "any"}
                maxlength="20000"
                @input=${n}
              />`}
    </label>`;
	}
	async uploadImage(e) {
		let t = e.target, n = t.files?.[0];
		if (!n || !this.editor || this.busy || !this.editable) return;
		let r = ++this.imageGeneration, i = this.connectionGeneration;
		this.imageLoading = !0, this.error = "";
		try {
			let e = await Et(n);
			r === this.imageGeneration && i === this.connectionGeneration && this.editor && this.editable && this.changeField("image_data", e);
		} catch {
			r === this.imageGeneration && i === this.connectionGeneration && this.editor && (this.error = this.tr("imageInvalid"));
		} finally {
			r === this.imageGeneration && (this.imageLoading = !1), t.value = "";
		}
	}
	plantImage(e, n = "plant-photo") {
		let r = t(e, "image_data");
		return r.startsWith("data:image/png;base64,") ? B`<img
          class=${n}
          src=${r}
          alt=${t(e, "name") || t(e, "title") || this.tr("imagePreview")}
          loading="lazy"
        />` : B`<span class=${`${n} photo-placeholder`} aria-hidden="true"
          >${$("plants")}</span
        >`;
	}
	renderImageEditor() {
		let e = this.editor;
		return !e || ![
			"plants",
			"varieties",
			"cultivation_journal"
		].includes(e.table) ? H : B`<section class="image-editor">
      ${typeof e.draft.image_data == "string" && e.draft.image_data ? B`<img class="plant-photo" src=${e.draft.image_data} alt=${this.tr("imagePreview")} />` : H}
      <div>
        <label
          >${this.tr("uploadImage")}<input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ?disabled=${this.busy || this.imageLoading}
            @change=${this.uploadImage}
        /></label>
        ${e.table === "cultivation_journal" ? B`<label class="camera-input">${this.tr("takePhoto")}<input class="camera-file" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" ?disabled=${this.busy || this.imageLoading} @change=${this.uploadImage} /></label>` : H}
        <small class="muted">${this.tr("imageHint")}</small>
        ${this.imageLoading ? B`<p role="status">${this.tr("imageProcessing")}</p>` : H}
        ${e.draft.image_data ? B`<button type="button" ?disabled=${this.busy || this.imageLoading} @click=${() => this.changeField("image_data", null)}>${this.tr("removeImage")}</button>` : H}
      </div>
    </section>`;
	}
	renderEditor() {
		let e = this.editor;
		return B`<dialog
      id="editor-dialog"
      aria-labelledby="editor-title"
      @cancel=${(e) => {
			this.busy && e.preventDefault();
		}}
      @close=${() => {
			this.editor = null;
		}}
    >
      ${e ? B`<form @submit=${this.saveEditor}>
              <div class="dialog-head">
                <h2 id="editor-title">
                  ${this.tr(e.record ? "edit" : {
			seed_lots: "newSeedLot",
			cultivation_journal: "newJournal",
			plants: "newPlant",
			cultivations: "newSowing",
			locations: "newLocation",
			growing_windows: "newWindow",
			varieties: "newVariety",
			cultivation_events: "newEvent",
			tasks: "newTask"
		}[e.table] ?? "new")}
                </h2>
                <button
                  type="button"
                  class="icon"
                  aria-label=${this.tr("close")}
                  ?disabled=${this.busy}
                  @click=${() => {
			this.editor = null;
		}}
                >
                  ${$("close")}
                </button>
              </div>
              <div class="dialog-body">
                ${this.error ? B`<p class="notice error" role="alert">${this.error}</p>` : H}
                ${[
			"plants",
			"varieties",
			"growing_windows",
			"cultivations",
			"locations"
		].includes(e.table) ? B`<p class="notice">${this.tr("temperatureHint")}</p>` : H}
                ${e.draft.origin === "initial" ? B`<p class="notice">${this.tr("initialEventHint")}</p>` : H}
                ${e.table === "cultivations" ? B`<p class="notice">${this.tr("plantCountHint")}</p>` : H}
                ${e.table === "seed_lots" ? B`<p class="notice">${this.tr("seedLotHint")}</p>` : H}
                ${e.table === "cultivation_journal" ? B`<p class="notice">${this.tr("journalHint")}</p>` : H}
                ${this.renderImageEditor()}
                <div class="form-grid">
                  ${this.fieldList(e).map((e) => this.renderField(e))}
                </div>
              </div>
              <div class="dialog-foot">
                <button
                  type="button"
                  ?disabled=${this.busy}
                  @click=${() => {
			this.editor = null;
		}}
                >
                  ${this.tr("cancel")}</button
                ><button
                  class="primary"
                  type="submit"
                  ?disabled=${this.busy || this.imageLoading}
                >
                  ${this.tr(this.busy ? "busy" : "save")}
                </button>
              </div>
            </form>` : H}
    </dialog>`;
	}
	renderMultiFilter(e, t, n) {
		let r = this.tr(e === "category" ? "allCategories" : "allActivities");
		return B`<div
      class="multi-filter"
      role="group"
      aria-label=${this.tr(e)}
    >
      <span class="filter-label">${this.tr(e)}</span>
      <details>
        <summary
          title=${n.length ? n.map((e) => this.lab(e)).join(" · ") : r}
        >
          ${n.length ? n.map((e) => this.lab(e)).join(" · ") : r}
        </summary>
        <div class="multi-filter-options">
          <p class="muted">${this.tr("multiFilterHint")}</p>
          ${t.map((t) => B`<label class="check"
                ><input
                  type="checkbox"
                  .checked=${n.includes(t)}
                  @change=${(r) => {
			let i = r.target.checked ? [...n, t] : n.filter((e) => e !== t);
			e === "category" ? this.calendarCategories = i : this.calendarActivities = i;
		}}
                />${this.lab(t)}</label
              >`)}
          <button
            type="button"
            @click=${() => {
			e === "category" ? this.calendarCategories = [] : this.calendarActivities = [];
		}}
          >
            ${r}
          </button>
        </div>
      </details>
    </div>`;
	}
	calendarActivityMatches(e) {
		return !this.calendarActivities.length || this.calendarActivities.includes(e);
	}
	renderFilters(e = !1) {
		return B`<div class=${e ? "filters calendar-filters" : "filters"}>
      <label
        >${this.tr("search")}<input
          type="search"
          .value=${this.query}
          @input=${(e) => {
			this.query = e.target.value;
		}}
      /></label>
      ${e ? B`${this.renderMultiFilter("category", this.categories, this.calendarCategories)}${this.renderMultiFilter("activity", Q, this.calendarActivities)}` : B`
              <label
                >${this.tr("category")}<select
                  aria-label=${this.tr("category")}
                  @change=${(e) => {
			this.category = e.target.value;
		}}
                >
                  <option value="">${this.tr("allCategories")}</option>
                  ${this.categories.map((e) => B`<option value=${e} .selected=${this.category === e}>${this.lab(e)}</option>`)}
                </select></label
              >
              <label
                >${this.tr("method")}<select
                  aria-label=${this.tr("method")}
                  @change=${(e) => {
			this.method = e.target.value;
		}}
                >
                  <option value="">${this.tr("allMethods")}</option>
                  ${[
			"direct",
			"indoors",
			"transplant"
		].map((e) => B`<option value=${e} .selected=${this.method === e}>${this.lab(e)}</option>`)}
                </select></label
              >
            `}
      ${e ? H : B`<label
                >${this.tr("sort")}<select
                  @change=${(e) => {
			this.sort = e.target.value;
		}}
                >
                  <option value="name">${this.tr("alphabetical")}</option>
                  <option value="next" .selected=${this.sort === "next"}>
                    ${this.tr("nextSowing")}
                  </option>
                </select></label
              ><label class="check"
                ><input
                  type="checkbox"
                  .checked=${this.showArchived}
                  @change=${(e) => {
			this.showArchived = e.target.checked;
		}}
                />${this.tr("showArchived")}</label
              >`}
    </div>`;
	}
	filteredPlants(e = !1) {
		let n = /* @__PURE__ */ new Map();
		if (this.sort === "next" && !e) for (let e of this.tables.plants) n.set(e.id, p(this.plantWindows(e.id).filter((e) => !this.method || t(e, "method") === this.method || t(e, "activity") === this.method), this.today) ?? "9999");
		return this.tables.plants.filter((n) => (this.showArchived && !e || !n.data.archived) && (e ? !this.calendarCategories.length || this.calendarCategories.includes(t(n, "category")) : !this.category || t(n, "category") === this.category) && (!this.query || `${t(n, "name")} ${t(n, "botanical_name")}`.toLocaleLowerCase(this.language).includes(this.query.toLocaleLowerCase(this.language))) && (e || !this.method || this.plantWindows(n.id).some((e) => t(e, "method") === this.method || t(e, "activity") === this.method))).sort((r, i) => this.sort === "next" && !e && (n.get(r.id) ?? "").localeCompare(n.get(i.id) ?? "") || t(r, "name").localeCompare(t(i, "name"), this.language));
	}
	empty(e, t = "", n, r) {
		return B`<div class="empty">
      ${$("plants")}
      <h2>${this.tr(e)}</h2>
      ${t ? B`<p>${this.tr(t)}</p>` : H}${n && this.editable ? B`<button class="primary" @click=${r}>${$("plus")}${this.tr(n)}</button>` : H}
    </div>`;
	}
	plantRange(e, t, n, r) {
		let i = e.data[t], a = e.data[n], o = (e) => typeof e == "number" ? e.toLocaleString(this.language) : "—";
		return typeof i == "number" || typeof a == "number" ? `${o(i)}–${o(a)} ${r}` : "—";
	}
	renderPlantCard(e) {
		let n = this.language === "de" ? "Tage" : "days", r = [
			[
				"temperature",
				"optimalGermination",
				this.plantRange(e, "germination_optimal_min_c", "germination_optimal_max_c", "°C")
			],
			[
				"clock",
				"germinationDuration",
				this.plantRange(e, "germination_days_min", "germination_days_max", n)
			],
			[
				"ruler",
				"plantRowSpacing",
				`${e.data.spacing_cm ?? "—"} × ${e.data.row_spacing_cm ?? "—"} cm`
			],
			[
				"calendar",
				"cultivationDuration",
				this.plantRange(e, "duration_days_min", "duration_days_max", n)
			]
		];
		return B`<article class="plant catalog-card">
      <div class="catalog-card-heading">
        ${this.plantImage(e)}
        <div>
          <h2>
            <button
              class="link"
              @click=${() => {
			this.selected = {
				kind: "plant",
				id: e.id
			};
		}}
            >
              ${t(e, "name")}
            </button>
          </h2>
          <i>${t(e, "botanical_name")}</i>
          <div>
            <span class="badge"
              >${this.lab(t(e, "category")) || this.tr("other")}</span
            >${e.data.archived ? B`<span class="badge unknown">${this.tr("archived")}</span>` : H}
          </div>
        </div>
      </div>
      <dl class="catalog-facts">
        ${r.map(([e, t, n]) => B`<div title=${this.tr(t)}>
              <dt class="visually-hidden">${this.tr(t)}</dt>
              <dd>${$(e)}<span>${n}</span></dd>
            </div>`)}
      </dl>
      <div class="catalog-neighbors">
        <span>${this.tr("plantNeighbors")}</span
        ><span class="neighbor-good"
          >✓
          ${this.neighborIds(e, "good").length + this.neighborNames(e, "good").length}</span
        ><span class="neighbor-bad"
          >×
          ${this.neighborIds(e, "bad").length + this.neighborNames(e, "bad").length}</span
        >
      </div>
      <div class="actions">
        <button
          class="catalog-details"
          @click=${() => {
			this.selected = {
				kind: "plant",
				id: e.id
			};
		}}
        >
          ${this.tr("details")}${$("arrow")}</button
        >${this.editable && !e.data.archived ? B`<button class="primary icon" aria-label=${`${this.tr("newSowing")}: ${t(e, "name")}`} @click=${() => this.startEditor("cultivations", void 0, { plant_id: e.id })}>${$("plus")}</button>` : H}
      </div>
    </article>`;
	}
	observeOverviewLayout() {
		if (!this.isConnected) return;
		this.layoutObserver ??= new ResizeObserver(this.measureOverviewLayout);
		let e = new Set(this.renderRoot.querySelectorAll(".ha-navigation, aside, .stats"));
		for (let t of this.layoutNodes) e.has(t) || this.layoutObserver.unobserve(t);
		for (let t of e) this.layoutNodes.has(t) || this.layoutObserver.observe(t);
		this.layoutNodes = e, this.measureOverviewLayout();
	}
	async activateOverviewStat(e) {
		let t = this.connectionGeneration;
		if (e === "openTasks") {
			let e = this.renderRoot.querySelector("#upcoming-work"), t = e?.getBoundingClientRect(), n = this.renderRoot.querySelector(".stats")?.getBoundingClientRect();
			!window.matchMedia("(max-width: 1100px)").matches && t && n && t.top >= n.bottom && t.top < window.innerHeight - 60 || e?.scrollIntoView({
				block: "start",
				behavior: "auto"
			}), e?.focus({ preventScroll: !0 });
		} else e === "managedPlants" ? (this.query = "", this.category = "", this.method = "", this.showArchived = !1, await this.navigate("plants")) : e === "successful" ? (await this.navigate("history"), t === this.connectionGeneration && this.page === "history" && (this.historyPlant = "", this.historyYear = "", this.historySuccessOnly = !0)) : (await this.navigate("cultures"), t === this.connectionGeneration && this.page === "cultures" && (this.cultureScope = e));
	}
	renderOverview() {
		let e = this.tables.growing_windows.filter((e) => this.plantList.some((n) => n.id === t(e, "plant_id")) && f(e, Number(this.today.slice(0, 4)), Number(this.today.slice(5, 7)))).sort((e, t) => this.compareWindows(e, t)), n = this.tables.cultivations, r = [
			["managedPlants", this.plantList.length],
			["planned", n.filter((e) => this.status(e) === "planned").length],
			["active", n.filter((e) => ![
				"planned",
				"completed",
				"failed"
			].includes(this.status(e))).length],
			["successful", n.filter((e) => t(e, "result") === "successful").length],
			["openTasks", this.tables.tasks.filter((e) => !e.data.completed).length]
		];
		return B`<section class="hero">
        <div>
          <div class="eyebrow">${this.tr("garden")}</div>
          <h2>${this.tr("welcome")}</h2>
          <p>${this.tr("tagline")}</p>
          <p>
            ${_(Number(this.today.slice(0, 4)), Number(this.today.slice(5, 7)), this.language)}
          </p>
        </div>
        <div class="art">
          ${Ne`<svg viewBox="0 0 100 120" width="100" height="120" fill="none" aria-hidden="true"><path d="M49 115V35M49 79C10 81 10 41 10 41s40 1 39 38ZM49 53C48 16 89 10 89 10s4 42-40 43Z" stroke="currentColor" stroke-width="2"/><path d="M49 103c25 0 34-21 34-21s-29-2-34 21Z" fill="currentColor" opacity=".25"/></svg>`}
        </div>
      </section>
      <div class="stats">
        ${r.map(([e, t]) => B`<button type="button" class="stat" aria-label=${`${t} ${this.tr(e)}`} aria-controls=${e === "openTasks" ? "upcoming-work" : H} title=${this.tr(e)} @click=${() => this.activateOverviewStat(e)}><strong>${t}</strong><span class="stat-label-full">${this.tr(e)}</span><span class="stat-label-short" aria-hidden="true">${this.tr("compact_" + e)}</span></button>`)}
      </div>
      ${this.tables.plants.length ? H : B`<section class="panel">${this.empty("emptyPlants", "emptyPlantsBody", "newPlant", () => this.startEditor("plants"))}</section>`}
      <div class="columns">
        <section class="panel">
          <div class="section-head">
            <h2>${this.tr("thisMonth")}</h2>
            <button class="link" @click=${() => this.navigate("calendar")}>
              ${this.tr("calendar")}${$("arrow")}
            </button>
          </div>
          <p class="muted">${this.tr("recommendation")}</p>
          ${e.length ? e.map((e) => B`<div class=${`item activity ${t(e, "activity")}`}>
                      <span class="plant-symbol">${$("plants")}</span>
                      <div class="item-content">
                        <button
                          class="link"
                          @click=${() => {
			this.selected = {
				kind: "plant",
				id: t(e, "plant_id")
			};
		}}
                        >
                          ${this.nameFor(t(e, "plant_id"), "plants")}
                        </button>
                        <p>
                          <span class="badge"
                            >${this.lab(t(e, "activity"))}</span
                          >
                          · ${this.lab(t(e, "environment"))}
                        </p>
                        <small>${v(e, this.language)}</small>
                      </div>
                    </div>`) : B`<p class="empty">${this.tr("noWindows")}</p>`}
        </section>
        <section
          class="panel upcoming-panel"
          id="upcoming-work"
          tabindex="-1"
          aria-labelledby="upcoming-title"
        >
          <div class="section-head">
            <h2 id="upcoming-title">${this.tr("upcoming")}</h2>
            ${this.editable ? B`<button class="icon" aria-label=${this.tr("newTask")} @click=${() => this.startEditor("tasks")}>${$("plus")}</button>` : H}
          </div>
          ${this.renderTasks(!1)}
        </section>
      </div>`;
	}
	toggleTask(e) {
		this.busy || (e.data.completed ? this.setTaskCompleted(e, !1) : this.completing = e);
	}
	async setTaskCompleted(e, t) {
		return (e.data.personal_generated ? await this.action("set_personal_task_completed", {
			id: e.id,
			revision: e.revision,
			completed: t
		}) : await this.action("update", {
			table: "tasks",
			id: e.id,
			revision: e.revision,
			data: { completed: t }
		})) !== void 0;
	}
	renderTaskConfirmation() {
		let e = this.completing;
		return B`<dialog
      id="complete-task-dialog"
      aria-labelledby="complete-task-title"
      @cancel=${(e) => {
			this.busy && e.preventDefault();
		}}
      @close=${() => {
			this.completing = null;
		}}
    >
      <div class="dialog-head">
        <h2 id="complete-task-title">${this.tr("completeTaskTitle")}</h2>
      </div>
      <div class="dialog-body">
        <p>${this.tr("completeTaskBody")}</p>
        ${e ? B`<h3>${t(e, "title")}</h3>
                <p>${g(e, this.language)}</p>` : H}
        ${this.error ? B`<p role="alert" class="notice error">${this.error}</p>` : H}
      </div>
      <div class="dialog-foot">
        <button
          ?disabled=${this.busy}
          @click=${() => {
			this.completing = null;
		}}
        >
          ${this.tr("cancel")}
        </button>
        <button
          class="primary"
          ?disabled=${this.busy || !e}
          @click=${async () => {
			e && await this.setTaskCompleted(e, !0) && (this.completing = null);
		}}
        >
          ${this.tr("confirmTask")}
        </button>
      </div>
    </dialog>`;
	}
	neighborIds(e, t) {
		let n = e.data[`neighbor_${t}_ids`];
		return Array.isArray(n) ? n.filter((e) => typeof e == "string") : [];
	}
	neighborNames(e, t) {
		let n = e.data[`neighbor_${t}_names`];
		return Array.isArray(n) ? n.filter((e) => typeof e == "string") : [];
	}
	beginNeighbors(e) {
		this.error = "", this.neighborQuery = "", this.neighborEditor = {
			plant: e,
			good: new Set(this.neighborIds(e, "good")),
			bad: new Set(this.neighborIds(e, "bad")),
			goodNames: this.neighborNames(e, "good").join("\n"),
			badNames: this.neighborNames(e, "bad").join("\n")
		};
	}
	changeNeighbor(e, t, n) {
		let r = this.neighborEditor;
		if (!r) return;
		let i = {
			...r,
			good: new Set(r.good),
			bad: new Set(r.bad)
		};
		n ? (i[e].add(t), i[e === "good" ? "bad" : "good"].delete(t)) : i[e].delete(t), this.neighborEditor = i;
	}
	async saveNeighbors() {
		let e = this.neighborEditor;
		if (!e || this.busy) return;
		let n = new Set(e.good), r = new Set(e.bad), i = (n, r) => {
			let i = [];
			for (let a of n.split(/\r?\n/).map((e) => e.trim()).filter(Boolean)) {
				let n = this.tables.plants.filter((e) => t(e, "name").toLocaleLowerCase(this.language) === a.toLocaleLowerCase(this.language));
				if (n.length > 1 || n[0]?.id === e.plant.id) throw Error("neighbors");
				n[0] ? r.add(n[0].id) : i.push(a);
			}
			return i;
		}, a, o;
		try {
			if (a = i(e.goodNames, n), o = i(e.badNames, r), [...n].some((e) => r.has(e))) throw Error("neighbors");
		} catch {
			this.error = this.tr("neighborConflict");
			return;
		}
		await this.action("set_neighbors", {
			plant_id: e.plant.id,
			revision: e.plant.revision,
			neighbors: {
				neighbor_good_ids: [...n].sort(),
				neighbor_bad_ids: [...r].sort(),
				neighbor_good_names: a,
				neighbor_bad_names: o
			}
		}) !== void 0 && (this.neighborEditor = null);
	}
	async cycleNeighbor(e, t) {
		if (this.busy || !this.editable || e.id === t.id) return;
		let n = new Set(this.neighborIds(e, "good")), r = new Set(this.neighborIds(e, "bad"));
		n.has(t.id) ? (n.delete(t.id), r.add(t.id)) : r.has(t.id) ? r.delete(t.id) : n.add(t.id), await this.action("set_neighbors", {
			plant_id: e.id,
			revision: e.revision,
			neighbors: {
				neighbor_good_ids: [...n].sort(),
				neighbor_bad_ids: [...r].sort(),
				neighbor_good_names: this.neighborNames(e, "good"),
				neighbor_bad_names: this.neighborNames(e, "bad")
			}
		});
	}
	renderNeighborMatrix(e) {
		let n = this.matrixQuery.trim().toLocaleLowerCase(this.language), r = e.filter((e) => !n || t(e, "name").toLocaleLowerCase(this.language).includes(n));
		return B`<label class="matrix-search"
        >${this.tr("matrixFilter")}<input
          type="search"
          .value=${this.matrixQuery}
          @input=${(e) => {
			this.matrixQuery = e.target.value;
		}}
      /></label>
      <p class="muted">${this.tr("matrixHint")}</p>
      <div
        class="neighbor-matrix-scroll"
        tabindex="0"
        role="region"
        aria-label=${this.tr("neighborMatrix")}
      >
        <table class="neighbor-matrix">
          <thead>
            <tr>
              <th scope="col">${this.tr("plants")}</th>
              ${r.map((e) => B`<th scope="col" class=${e.id === this.neighborPlant ? "matrix-highlight" : ""}>${t(e, "name")}</th>`)}
            </tr>
          </thead>
          <tbody>
            ${r.map((e) => B`<tr
                  class=${e.id === this.neighborPlant ? "matrix-highlight" : ""}
                >
                  <th scope="row">${t(e, "name")}</th>
                  ${r.map((n) => {
			let r = e.id === n.id ? "self" : this.neighborIds(e, "good").includes(n.id) ? "good" : this.neighborIds(e, "bad").includes(n.id) ? "bad" : "neutral", i = this.tr("neighbor_" + r);
			return B`<td
                      class=${n.id === this.neighborPlant ? "matrix-highlight" : ""}
                    >
                      ${r === "self" ? B`<span aria-label=${i}>·</span>` : B`<button class=${"matrix-cell neighbor-" + r} title=${`${t(e, "name")} / ${t(n, "name")}: ${i}`} aria-label=${`${t(e, "name")} / ${t(n, "name")}: ${i}`} ?disabled=${this.busy || !this.editable} @click=${() => this.cycleNeighbor(e, n)}>${r === "good" ? "✓" : r === "bad" ? "×" : "−"}</button>`}
                    </td>`;
		})}
                </tr>`)}
          </tbody>
        </table>
      </div>
      ${r.length ? H : B`<p class="muted">${this.tr("noPlantsMatch")}</p>`}
      <p class="matrix-legend">
        <span class="neighbor-good">✓ ${this.tr("goodNeighbors")}</span
        ><span class="neighbor-bad">× ${this.tr("badNeighbors")}</span
        ><span>− ${this.tr("neighbor_neutral")}</span>
      </p>`;
	}
	renderNeighbors() {
		let e = [...this.plantList].sort((e, n) => t(e, "name").localeCompare(t(n, "name"), this.language)), n = e.find((e) => e.id === this.neighborPlant) ?? e[0], r = (e) => B`<section class="panel neighbor-group">
        <h2>${this.tr(e === "good" ? "goodNeighbors" : "badNeighbors")}</h2>
        ${n && (this.neighborIds(n, e).length || this.neighborNames(n, e).length) ? B`<ul>
                ${this.neighborIds(n, e).map((e) => B`<li>${this.nameFor(e, "plants")}</li>`)}${this.neighborNames(n, e).map((e) => B`<li>${e} <small class="muted">${this.tr("freeNeighbor")}</small></li>`)}
              </ul>` : B`<p class="muted">${this.tr("noNeighbors")}</p>`}
      </section>`;
		return B`<p>${this.tr("neighborIntro")}</p>
      ${n ? B`<div class="toolbar neighbor-toolbar">
                <label
                  >${this.tr("chooseNeighborPlant")}<select
                    aria-label=${this.tr("chooseNeighborPlant")}
                    .value=${n.id}
                    @change=${(e) => {
			this.neighborPlant = e.target.value;
		}}
                  >
                    ${e.map((e) => B`<option value=${e.id} .selected=${e.id === n.id}>${t(e, "name")}</option>`)}
                  </select></label
                >${this.editable ? B`<button class="primary" @click=${() => this.beginNeighbors(n)}>${this.tr("editNeighbors")}</button>` : H}
              </div>
              ${this.renderNeighborMatrix(e)}
              <div class="neighbor-grid">${r("good")}${r("bad")}</div>` : this.empty("emptyPlants")}`;
	}
	renderNeighborEditor() {
		let e = this.neighborEditor, n = e ? this.tables.plants.filter((n) => n.id !== e.plant.id && (!n.data.archived || e.good.has(n.id) || e.bad.has(n.id)) && t(n, "name").toLocaleLowerCase(this.language).includes(this.neighborQuery.toLocaleLowerCase(this.language))).sort((e, n) => t(e, "name").localeCompare(t(n, "name"), this.language)) : [], r = (r) => B`<section>
        <h3>${this.tr(r === "good" ? "goodNeighbors" : "badNeighbors")}</h3>
        <div class="neighbor-options">
          ${n.map((n) => B`<label class="check"><input type="checkbox" .checked=${e?.[r].has(n.id) ?? !1} ?disabled=${this.busy} aria-label=${`${t(n, "name")}: ${this.tr(r === "good" ? "goodNeighbors" : "badNeighbors")}`} @change=${(e) => this.changeNeighbor(r, n.id, e.target.checked)} />${t(n, "name")}${n.data.archived ? B` <small>${this.tr("archived")}</small>` : H}</label>`)}
        </div>
        <label
          >${this.tr(r === "good" ? "extraGoodNeighbors" : "extraBadNeighbors")}<textarea
            .value=${e?.[r === "good" ? "goodNames" : "badNames"] ?? ""}
            ?disabled=${this.busy}
            @input=${(e) => {
			this.neighborEditor &&= {
				...this.neighborEditor,
				[r === "good" ? "goodNames" : "badNames"]: e.target.value
			};
		}}
          ></textarea>
        </label>
      </section>`;
		return B`<dialog
      id="neighbors-dialog"
      aria-labelledby="neighbors-title"
      @cancel=${(e) => {
			this.busy && e.preventDefault();
		}}
      @close=${() => {
			this.neighborEditor = null;
		}}
    >
      <form
        @submit=${(e) => {
			e.preventDefault(), this.saveNeighbors();
		}}
      >
        <div class="dialog-head">
          <h2 id="neighbors-title">
            ${this.tr("editNeighbors")}${e ? ` · ${t(e.plant, "name")}` : ""}
          </h2>
        </div>
        <div class="dialog-body">
          <p>${this.tr("neighborIntro")}</p>
          <label
            >${this.tr("neighborSearch")}<input
              type="search"
              .value=${this.neighborQuery}
              @input=${(e) => {
			this.neighborQuery = e.target.value;
		}}
          /></label>
          <div class="neighbor-grid">${r("good")}${r("bad")}</div>
          ${this.error ? B`<p role="alert" class="notice error">${this.error}</p>` : H}
        </div>
        <div class="dialog-foot">
          <button
            type="button"
            ?disabled=${this.busy}
            @click=${() => {
			this.neighborEditor = null;
		}}
          >
            ${this.tr("cancel")}</button
          ><button type="submit" class="primary" ?disabled=${this.busy}>
            ${this.tr("save")}
          </button>
        </div>
      </form>
    </dialog>`;
	}
	resetSeeds() {
		this.seedTimer && clearTimeout(this.seedTimer), this.seedTimer = void 0, this.seedDraft = /* @__PURE__ */ new Map(), this.seedRevisions = /* @__PURE__ */ new Map(), this.seedFlight = /* @__PURE__ */ new Map(), this.seedSaving = !1, this.seedFailed = !1, this.seedFlush = void 0;
	}
	seedState(e) {
		return this.seedDraft.get(e.id) ?? this.seedFlight.get(e.id)?.state ?? (t(e, "seed_state") || "unplanned");
	}
	changeSeed(e, n) {
		this.editable && !this.busy && (n === (t(e, "seed_state") || "unplanned") && !this.seedFlight.has(e.id) ? (this.seedDraft.delete(e.id), this.seedRevisions.delete(e.id)) : (this.seedDraft.set(e.id, n), this.seedRevisions.has(e.id) || this.seedRevisions.set(e.id, e.revision)), this.seedFailed = !1, this.error = "", this.seedSaving = !!(this.seedDraft.size || this.seedFlight.size), this.requestUpdate(), this.seedTimer && clearTimeout(this.seedTimer), !this.seedFlush && this.seedDraft.size && (this.seedTimer = setTimeout(() => {
			this.saveSeedInventory();
		}, 80)));
	}
	saveSeedInventory(e = !1) {
		if (this.seedTimer && clearTimeout(this.seedTimer), this.seedTimer = void 0, this.seedFlush) return this.seedFlush;
		if (this.seedFailed && !e) return Promise.resolve(!1);
		if (!this.seedDraft.size) return Promise.resolve(!0);
		if (!this.api || !this.editable || this.busy) return Promise.resolve(!1);
		let t = this.api, n = this.connectionGeneration, r = this.seedDraft, i = this.seedRevisions, a = new Map(this.tables.plants.map((e) => [e.id, e])), o = () => n === this.connectionGeneration && r === this.seedDraft;
		this.seedSaving = !0, this.seedFailed = !1, this.error = "";
		let s = (async () => {
			try {
				for (; r.size;) {
					if (!o()) return !1;
					let e = [...r].slice(0, 500).map(([e, t]) => ({
						id: e,
						state: t,
						revision: i.get(e) ?? a.get(e).revision
					}));
					for (let t of e) r.delete(t.id);
					this.seedFlight = new Map(e.map((e) => [e.id, {
						state: e.state,
						revision: e.revision
					}])), this.requestUpdate();
					try {
						let n = await t.command("set_seed_inventory", { changes: e });
						if (!o()) return !1;
						this.loadGeneration++;
						let s = new Map(n.map((e) => [e.id, e]));
						this.tables = {
							...this.tables,
							plants: this.tables.plants.map((e) => s.get(e.id) ?? e)
						};
						for (let e of n) a.set(e.id, e), r.has(e.id) ? i.set(e.id, e.revision) : i.delete(e.id);
						this.seedFlight = /* @__PURE__ */ new Map();
					} catch (t) {
						if (o()) {
							for (let t of e) r.has(t.id) || r.set(t.id, t.state);
							this.seedFlight = /* @__PURE__ */ new Map(), this.seedFailed = !0, this.error = U(this.language, t);
						}
						return !1;
					}
				}
				return o() && this.announce("saved"), !0;
			} finally {
				o() && (this.seedSaving = !1, this.requestUpdate());
			}
		})();
		return this.seedFlush = s, s.then(() => {
			this.seedFlush === s && (this.seedFlush = void 0);
		}), s;
	}
	renderSeedLots() {
		let e = this.plantList.find((e) => e.id === this.stockPlant);
		if (!e) return B``;
		let n = this.tables.seed_lots.filter((n) => t(n, "plant_id") === e.id).sort((e, n) => (t(e, "best_before") || "9999").localeCompare(t(n, "best_before") || "9999") || Number(e.data.purchase_year || 9999) - Number(n.data.purchase_year || 9999) || t(e, "lot_label").localeCompare(t(n, "lot_label"))), r = /* @__PURE__ */ new Map();
		for (let e of n) r.set(t(e, "unit"), (r.get(t(e, "unit")) || 0) + Number(e.data.quantity));
		return B`<section id="seed-lots" class="panel stock-panel">
      <div class="section-head">
        <div>
          <h2>${this.tr("seedLots")} · ${t(e, "name")}</h2>
          <p class="muted">${this.tr("useOlderStock")}</p>
        </div>
        ${this.editable ? B`<button class="primary" @click=${() => this.startEditor("seed_lots", void 0, { plant_id: e.id })}>${$("plus")}${this.tr("newSeedLot")}</button>` : H}
      </div>
      <p class="stock-total">
        ${this.tr("stockTotal")}:
        ${[...r].map(([e, t]) => `${t.toLocaleString(this.language, { maximumFractionDigits: 3 })} ${this.tr("unit_" + e)}`).join(" · ") || "—"}
      </p>
      ${n.map((e) => B`<article class="stock-lot">
            <div class="section-head">
              <div>
                <h3>
                  ${t(e, "lot_label")}${t(e, "variety_id") ? ` · ${this.nameFor(t(e, "variety_id"), "varieties")}` : ""}
                </h3>
                <strong
                  >${Number(e.data.quantity).toLocaleString(this.language)}
                  ${this.tr("unit_" + t(e, "unit"))}</strong
                >
              </div>
              ${this.editable ? B`<div class="actions">
                      <button
                        @click=${() => this.startEditor("seed_lots", e)}
                      >
                        ${this.tr("edit")}</button
                      ><button
                        class="danger"
                        @click=${() => {
			this.deleting = {
				table: "seed_lots",
				record: e
			};
		}}
                      >
                        ${this.tr("delete")}
                      </button>
                    </div>` : H}
            </div>
            ${t(e, "opened_on") ? B`<span class="badge">${this.tr("opened_on")}: ${h(t(e, "opened_on"), this.language)}</span>` : H}
            ${t(e, "best_before") && t(e, "best_before") < this.today ? B`<p class="notice">${this.tr("seedPastDate")}</p>` : H}
            ${this.renderData(e.data, [
			"plant_id",
			"variety_id",
			"lot_label",
			"quantity",
			"unit"
		])}
          </article>`)}${n.length ? H : B`<p class="muted">${this.tr("noSeedLots")}</p>`}
    </section>`;
	}
	async editJournal(e) {
		if (!this.api || !this.editable || this.busy) return;
		let t = this.api, n = this.connectionGeneration;
		this.busy = !0;
		try {
			let r = await t.command("get", {
				table: "cultivation_journal",
				id: e.id
			});
			n === this.connectionGeneration && this.editable && this.startEditor("cultivation_journal", r);
		} catch (e) {
			n === this.connectionGeneration && (this.error = U(this.language, e));
		} finally {
			n === this.connectionGeneration && (this.busy = !1);
		}
	}
	async newJournal(e, t = "observation", n = !1) {
		this.editable && !this.busy && (this.startEditor("cultivation_journal", void 0, {
			cultivation_id: e.id,
			entry_kind: t
		}), n && (await this.updateComplete, this.renderRoot.querySelector("#editor-dialog .camera-file")?.click()));
	}
	renderHarvestSummary(e) {
		let t = Tt(this.tables.cultivation_journal, this.tables.cultivations, "culture").find((t) => t.key === e.id);
		return B`<section class="harvest-total">
      <h3>${this.tr("totalHarvest")}</h3>
      ${t ? B`<div class="harvest-total-values">
                <strong
                  >${t.kg.toLocaleString(this.language, { maximumFractionDigits: 6 })}
                  kg</strong
                ><strong
                  >${t.pieces.toLocaleString(this.language)}
                  ${this.tr("pieces")}</strong
                ><small>${t.harvests} ${this.tr("singleHarvests")}</small>
              </div>
              <p>
                ${this.tr("perPlant")}:
                ${t.kgPerPlant === null ? "—" : `${t.kgPerPlant.toLocaleString(this.language, { maximumFractionDigits: 6 })} kg`}
                ·
                ${t.piecesPerPlant === null ? "—" : `${t.piecesPerPlant.toLocaleString(this.language, { maximumFractionDigits: 3 })} ${this.tr("pieces")}`}
              </p>` : B`<p>${this.tr("noHarvests")}</p>`}<small class="muted">${this.tr("plantCountHint")}</small>
    </section>`;
	}
	renderJournal(e) {
		let n = this.tables.cultivation_journal.filter((n) => t(n, "cultivation_id") === e.id).sort((e, n) => t(n, "date").localeCompare(t(e, "date")) || n.created_at.localeCompare(e.created_at) || n.id.localeCompare(e.id));
		return B`<section class="culture-journal">
      <div class="section-head">
        <h3>${this.tr("cultureJournal")}</h3>
        ${this.editable ? B`<div class="actions"><button @click=${() => this.newJournal(e)}>${this.tr("addObservation")}</button><button class="primary" @click=${() => this.newJournal(e, "harvest")}>${this.tr("recordHarvest")}</button></div>` : H}
      </div>
      ${pt(n, (e) => e.id, (e) => B`<article class="journal-entry">
            <div class="section-head">
              <div>
                <span class="badge"
                  >${this.tr("kind_" + t(e, "entry_kind"))}</span
                ><time datetime=${t(e, "date")}
                  >${h(t(e, "date"), this.language)}</time
                >
                ${t(e, "title") ? B`<h4>${t(e, "title")}</h4>` : H}
              </div>
              ${this.editable ? B`<div class="actions">
                      <button @click=${() => this.editJournal(e)}>
                        ${this.tr("edit")}</button
                      ><button
                        class="danger"
                        @click=${() => {
			this.deleting = {
				table: "cultivation_journal",
				record: e
			};
		}}
                      >
                        ${this.tr("delete")}
                      </button>
                    </div>` : H}
            </div>
            ${e.data.entry_kind === "harvest" ? B`<strong class="single-harvest">${Number(e.data.amount).toLocaleString(this.language, { maximumFractionDigits: 6 })} ${this.tr("unit_" + t(e, "unit"))}</strong>` : H}
            ${e.image_present || t(e, "image_data") ? B`<garden-journal-photo class="journal-photo" .api=${this.api} .record=${e} .language=${this.language}></garden-journal-photo>` : H}
            <p class="profile-text">${t(e, "notes")}</p>
          </article>`)}
      ${n.length ? H : B`<p class="muted">${this.tr("emptyJournal")}</p>`}
    </section>`;
	}
	cultureTools() {
		return B`<div
      class="culture-tools"
      role="group"
      aria-label=${this.tr("cultureTools")}
    >
      ${[
			"list",
			"garden",
			"harvest"
		].map((e) => B`<button
            class=${this.cultureView === e ? "primary" : ""}
            aria-pressed=${this.cultureView === e}
            @click=${() => {
			this.cultureView = e;
		}}
          >
            ${this.tr("cultureView_" + e)}
          </button>`)}
    </div>`;
	}
	renderGardenMode() {
		let e = [...this.tables.cultivations].sort((e, n) => t(n, "date").localeCompare(t(e, "date"))), n = e.find((e) => e.id === this.gardenCulture) || e.find((e) => !["completed", "failed"].includes(this.status(e))) || e[0];
		return B`<section class="panel garden-mode">
      <h2>${this.tr("cultureView_garden")}</h2>
      ${n ? B`<label
                >${this.tr("chooseCulture")}<select
                  aria-label=${this.tr("chooseCulture")}
                  .value=${n.id}
                  @change=${(e) => {
			this.gardenCulture = e.target.value;
		}}
                >
                  ${e.map((e) => B`<option value=${e.id} .selected=${e.id === n.id}>${this.plantName(e)} · ${t(e, "date")} · ${this.nameFor(t(e, "location_id"), "locations")}</option>`)}
                </select></label
              >
              <h3>${this.plantName(n)}</h3>
              ${this.editable ? B`<div class="garden-actions">
                      <button
                        @click=${() => this.newJournal(n, "observation", !0)}
                      >
                        ${$("camera")}${this.tr("takePhoto")}</button
                      ><button @click=${() => this.newJournal(n)}>
                        ${$("edit")}${this.tr("addObservation")}</button
                      ><button
                        class="primary"
                        @click=${() => this.newJournal(n, "harvest")}
                      >
                        ${$("harvest")}${this.tr("recordHarvest")}</button
                      ><button
                        @click=${async () => {
			await this.navigate("overview"), await this.updateComplete, this.renderRoot.querySelector("#upcoming-work")?.scrollIntoView({ block: "start" });
		}}
                      >
                        ${$("check")}${this.tr("finishWork")}
                      </button>
                    </div>` : H}${this.renderHarvestSummary(n)}${this.renderJournal(n)}` : this.empty("emptyCultures")}
    </section>`;
	}
	renderHarvestAnalysis() {
		let e = this.tables.cultivation_journal.filter((e) => e.data.entry_kind === "harvest"), n = [...new Set(e.map((e) => t(e, "date").slice(0, 4)))].sort().reverse(), r = Tt(e, this.tables.cultivations, this.harvestBy, {
			year: this.harvestYear,
			plant: this.harvestPlant,
			variety: this.harvestVariety,
			location: this.harvestLocation
		}), i = (e, t, n) => B`<label
        >${this.tr(t)}<select
          aria-label=${this.tr(t)}
          .value=${this[e]}
          @change=${(t) => {
			this[e] = t.target.value;
		}}
        >
          <option value="">${this.tr("allValues")}</option>
          ${n.map((t) => B`<option value=${t.id} .selected=${t.id === this[e]}>${t.name}</option>`)}
        </select></label
      >`, a = (t, n) => {
			let r = /* @__PURE__ */ new Map();
			for (let i of e) {
				let e = i.data.harvest_context;
				r.set(String(e[t] || "_"), String(e[n] || "—"));
			}
			return [...r].map(([e, t]) => ({
				id: e,
				name: t
			})).sort((e, t) => e.name.localeCompare(t.name, this.language));
		}, o = (e, t = 6) => e === null ? "—" : e.toLocaleString(this.language, { maximumFractionDigits: t });
		return B`<section class="panel harvest-analysis">
      <h2>${this.tr("cultureView_harvest")}</h2>
      <p class="muted">${this.tr("harvestUnitsHint")}</p>
      <details class="harvest-help">
        <summary>${this.tr("calculationHelp")}</summary>
        <p class="notice">${this.tr("harvestAnalysisHint")}</p>
      </details>
      <div class="filters">
        <label
          >${this.tr("groupHarvest")}<select
            aria-label=${this.tr("groupHarvest")}
            .value=${this.harvestBy}
            @change=${(e) => {
			this.harvestBy = e.target.value;
		}}
          >
            ${[
			"plant",
			"variety",
			"location",
			"year",
			"culture"
		].map((e) => B`<option value=${e} .selected=${this.harvestBy === e}>${this.tr("group_" + e)}</option>`)}
          </select></label
        >
        ${i("harvestYear", "harvestYear", n.map((e) => ({
			id: e,
			name: e
		})))}
        <details class="harvest-extra">
          <summary>${this.tr("moreHarvestFilters")}</summary>
          <div class="filters">
            ${i("harvestPlant", "harvestPlant", a("plant_id", "plant_name"))}${i("harvestVariety", "harvestVariety", a("variety_id", "variety_name"))}${i("harvestLocation", "harvestLocation", a("location_id", "location_name"))}
          </div>
        </details>
      </div>
      <div
        class="harvest-table-scroll"
        tabindex="0"
        role="region"
        aria-label=${this.tr("cultureView_harvest")}
      >
        <table class="harvest-table">
          <thead>
            <tr>
              ${[
			"groupHarvest",
			"singleHarvests",
			"totalWeight",
			"totalPieces",
			"weightPerPlant",
			"piecesPerPlant"
		].map((e) => B`<th scope="col">${this.tr(e)}</th>`)}
            </tr>
          </thead>
          <tbody>
            ${r.map((e) => B`<tr>
                  <th scope="row">${e.label}</th>
                  <td>${e.harvests}</td>
                  <td>${o(e.kg)} kg</td>
                  <td>${o(e.pieces, 0)}</td>
                  <td>
                    ${o(e.kgPerPlant)}${e.kgPerPlant === null ? "" : " kg"}
                  </td>
                  <td>${o(e.piecesPerPlant, 3)}</td>
                </tr>`)}
          </tbody>
        </table>
      </div>
      ${r.length ? H : B`<p>${this.tr("noHarvests")}</p>`}
    </section>`;
	}
	renderSeeds() {
		let e = [
			"available",
			"buy",
			"unneeded",
			"unplanned"
		], n = this.plantList.filter((e) => t(e, "name").toLocaleLowerCase(this.language).includes(this.seedQuery.toLocaleLowerCase(this.language)) && (!this.seedFilter || this.seedDraft.has(e.id) || this.seedFlight.has(e.id) || this.seedState(e) === this.seedFilter)).sort((e, n) => t(e, "name").localeCompare(t(n, "name"), this.language));
		return B`<p>${this.tr("seedIntro")}</p>
      <div class="filters">
        <label
          >${this.tr("search")}<input
            type="search"
            .value=${this.seedQuery}
            @input=${(e) => {
			this.seedQuery = e.target.value;
		}} /></label
        ><label
          >${this.tr("seedFilter")}<select
            aria-label=${this.tr("seedFilter")}
            .value=${this.seedFilter}
            @change=${(e) => {
			this.seedFilter = e.target.value;
		}}
          >
            <option value="">${this.tr("seedAll")}</option>
            ${e.map((e) => B`<option value=${e}>${this.tr("seed_" + e)}</option>`)}
          </select></label
        >
      </div>
      <p class="muted">${this.tr("seedHint")}</p>
      ${this.editable ? B`<div class="toolbar seed-save">
              <span role="status" class="seed-save-status"
                >${this.seedSaving ? this.tr("seedSaving") : this.seedFailed ? this.tr("seedSaveFailed") : ""}</span
              >${this.seedFailed ? B`<div class="actions">
                      <button
                        ?disabled=${this.seedSaving}
                        @click=${() => {
			this.resetSeeds(), this.error = "", this.refresh();
		}}
                      >
                        ${this.tr("discardSeed")}</button
                      ><button
                        class="primary"
                        ?disabled=${this.seedSaving || !this.seedDraft.size}
                        @click=${() => this.saveSeedInventory(!0)}
                      >
                        ${this.tr("retrySeed")}
                      </button>
                    </div>` : H}
            </div>` : H}
      <div
        class="seed-scroll"
        tabindex="0"
        role="region"
        aria-label=${this.tr("seeds")}
      >
        <table class="seed-table">
          <thead>
            <tr>
              <th scope="col">${this.tr("plants")}</th>
              ${e.map((e) => B`<th scope="col">${this.tr("seed_" + e)}</th>`)}
              <th scope="col">${this.tr("seedLots")}</th>
            </tr>
          </thead>
          <tbody>
            ${n.map((n) => B`<tr>
                  <th scope="row">
                    <button
                      class="link stock-open"
                      aria-label=${`${this.tr("manageStock")}: ${t(n, "name")}`}
                      @click=${async () => {
			this.stockPlant = n.id, await this.updateComplete, this.renderRoot.querySelector("#seed-lots")?.scrollIntoView({ block: "start" });
		}}
                    >
                      ${t(n, "name")}
                    </button>
                  </th>
                  ${e.map((e) => B`<td>
                        <label class="seed-choice"
                          ><input
                            type="radio"
                            name=${`seed-${n.id}`}
                            aria-label=${`${t(n, "name")}: ${this.tr("seed_" + e)}`}
                            .checked=${mt(this.seedState(n) === e)}
                            ?disabled=${!this.editable || this.busy}
                            @change=${() => this.changeSeed(n, e)}
                        /></label>
                      </td>`)}
                  <td>
                    <button
                      aria-label=${`${this.tr("seedLots")}: ${t(n, "name")}`}
                      @click=${async () => {
			this.stockPlant = n.id, await this.updateComplete, this.renderRoot.querySelector("#seed-lots")?.scrollIntoView({ block: "start" });
		}}
                    >
                      ${this.tables.seed_lots.filter((e) => t(e, "plant_id") === n.id).length}
                      · ${this.tr("manageStock")}
                    </button>
                  </td>
                </tr>`)}
          </tbody>
        </table>
      </div>
      ${n.length ? H : this.empty("noResults")}${this.renderSeedLots()}`;
	}
	renderTasks(e = !0) {
		let n = this.tables.tasks.filter((t) => e || !t.data.completed).sort((e, n) => t(e, "date").localeCompare(t(n, "date")));
		return B`${n.length ? (e ? n : n.slice(0, 6)).map((e) => B`<article
                class="item task-card"
                id=${`task-${e.id}`}
                tabindex="-1"
              >
                <div class="date-tile">
                  <strong>${t(e, "date").slice(8)}</strong
                  ><small
                    >${_(Number(t(e, "date").slice(0, 4)), Number(t(e, "date").slice(5, 7)), this.language, !0)}</small
                  >
                </div>
                <div class="item-content">
                  <h3>${t(e, "title")}</h3>
                  <small
                    >${this.lab(t(e, "activity"))} ·
                    ${g(e, this.language)}</small
                  >${t(e, "notes") ? B`<p>${t(e, "notes")}</p>` : H}${e.data.completed ? B`<span class="badge">${this.tr("completed")}</span>` : H}
                </div>
                ${e.data.personal_generated ? B`<span class="badge">${this.tr("personalTask")}</span><button class="icon" aria-label=${this.tr(e.data.completed ? "undoTask" : "taskDone")} ?disabled=${this.busy} @click=${() => this.toggleTask(e)}>${$("check")}</button>` : this.editable ? B`<button class="icon" aria-label=${this.tr(e.data.completed ? "undoTask" : "taskDone")} ?disabled=${this.busy} @click=${() => this.toggleTask(e)}>${$("check")}</button><button @click=${() => this.startEditor("tasks", e)}>${this.tr("edit")}</button>` : H}
              </article>`) : B`<p class="empty">${this.tr("noTasks")}</p>`}`;
	}
	calendarWindows() {
		let e = new Set(this.filteredPlants(!0).map((e) => e.id));
		return this.tables.growing_windows.filter((n) => e.has(t(n, "plant_id")) && this.calendarActivityMatches(t(n, "activity"))).sort((e, t) => this.compareWindows(e, t));
	}
	shiftCalendar(e) {
		if (this.calendarMode === "week") this.anchor = s(this.anchor || this.today, e * 7);
		else if (this.calendarMode === "year") this.anchor = `${Math.min(9998, Math.max(1, this.year + e))}-01-01`;
		else {
			let t = new Date(Date.UTC(this.year, this.month - 1 + e, 1, 12));
			this.anchor = t.toISOString().slice(0, 10);
		}
	}
	renderCalendar() {
		let e = this.calendarWindows(), n = Array.from({ length: 12 }, (e, t) => t + 1);
		return B`${this.renderFilters(!0)}
      <div class="toolbar calendar-toolbar">
        <div class="segmented" aria-label=${this.tr("calendar")}>
          ${[
			"year",
			"month",
			"week"
		].map((e) => B`<button
                aria-pressed=${this.calendarMode === e}
                @click=${() => {
			this.calendarMode = e;
		}}
              >
                ${this.tr(e)}
              </button>`)}
        </div>
        <div class="calendar-navigation">
          <button
            class="icon"
            aria-label=${this.tr("previous")}
            @click=${() => this.shiftCalendar(-1)}
          >
            ‹</button
          >${this.calendarMode === "year" ? B`<label
                  >${this.tr("selectedYear")}<input
                    type="number"
                    min="1"
                    max="9998"
                    .value=${String(this.year)}
                    @change=${(e) => {
			let t = Number(e.target.value);
			t >= 1 && t <= 9998 && (this.anchor = `${String(t).padStart(4, "0")}-01-01`);
		}}
                /></label>` : B`<label
                  >${this.tr(this.calendarMode === "month" ? "selectedMonth" : "selectedWeek")}<input
                    type=${this.calendarMode === "month" ? "month" : "date"}
                    .value=${this.calendarMode === "month" ? (this.anchor || this.today).slice(0, 7) : this.anchor || this.today}
                    @change=${(e) => {
			let t = e.target.value;
			t && (this.anchor = this.calendarMode === "month" ? `${t}-01` : t);
		}}
                /></label>`}<button
            class="icon"
            aria-label=${this.tr("next")}
            @click=${() => this.shiftCalendar(1)}
          >
            ›</button
          ><button
            class="calendar-today"
            @click=${() => {
			this.anchor = this.today;
		}}
          >
            ${this.tr("today")}
          </button>
        </div>
      </div>
      <div class="legend" role="group" aria-label=${this.tr("quickActivities")}>
        ${Q.map((e) => {
			let t = this.calendarActivities.length === 1 && this.calendarActivities[0] === e;
			return B`<button
            type="button"
            class=${e}
            aria-pressed=${t}
            title=${t ? this.tr("allActivities") : `${this.tr("showOnly")} ${this.lab(e)}`}
            @click=${() => {
				this.calendarActivities = t ? [] : [e];
			}}
          >
            <span class="dot"></span>${this.lab(e)}
          </button>`;
		})}
      </div>
      ${this.calendarMode === "year" ? B`<p class="muted">${this.tr("yearlyHint")}</p>
              <div
                class="year-scroll"
                tabindex="0"
                aria-label=${`${this.tr("year")} ${this.year}`}
              >
                <div class="year-grid">
                  <div class="month-head">
                    ${this.tr("plants")} · ${this.year}
                  </div>
                  ${n.map((e) => B`<div class="month-head">${_(this.year, e, this.language, !0)}</div>`)}
                  ${e.map((e) => B`<button
                          class="row-title"
                          @click=${() => {
			this.selected = {
				kind: "window",
				id: e.id
			};
		}}
                        >
                          ${this.nameFor(t(e, "plant_id"), "plants")}<small
                            >${this.lab(t(e, "activity"))} ·
                            ${this.lab(t(e, "environment"))}</small
                          ></button
                        >${n.map((n) => f(e, this.year, n) ? B`<button
                                class=${`year-cell ${t(e, "activity")}`}
                                aria-label=${`${this.nameFor(t(e, "plant_id"), "plants")}, ${this.lab(t(e, "activity"))}, ${_(this.year, n, this.language)}`}
                                title=${this.windowTooltip(e)}
                                @click=${() => {
			this.selected = {
				kind: "window",
				id: e.id
			};
		}}
                              >
                                <span aria-hidden="true"
                                  >${d(e, this.year, n).map((e) => B`<span class="bar" style=${`left:${e.offset}%;width:${e.width}%`}></span>`)}</span
                                >
                              </button>` : B`<div class="year-cell"></div>`)}`)}
                </div>
              </div>
              ${e.length ? H : this.empty("noAllWindows")}` : this.calendarMode === "month" ? B`<section class="panel">
                <div class="section-head">
                  <h2>${_(this.year, this.month, this.language)}</h2>
                </div>
                <p class="muted">${this.tr("recommendation")}</p>
                <div class="month-list">
                  ${e.filter((e) => f(e, this.year, this.month)).map((e) => B`<button
                          type="button"
                          class=${`month-event plant activity ${t(e, "activity")}`}
                          aria-label=${`${this.nameFor(t(e, "plant_id"), "plants")}, ${this.lab(t(e, "activity"))}, ${v(e, this.language)}`}
                          title=${this.windowTooltip(e)}
                          @click=${() => {
			this.selected = {
				kind: "window",
				id: e.id
			};
		}}
                        >
                          <strong class="month-event-title"
                            >${this.nameFor(t(e, "plant_id"), "plants")}</strong
                          >
                          <span
                            class="badge"
                            title=${t(e, "notes") || v(e, this.language)}
                            >${this.lab(t(e, "activity"))}</span
                          >
                          <small
                            >${v(e, this.language)} ·
                            ${this.lab(t(e, "environment"))}</small
                          >
                          ${t(e, "regional_notes") ? B`<span class="month-region-note">${t(e, "regional_notes")}</span>` : H}
                        </button>`)}
                </div>
                ${e.some((e) => f(e, this.year, this.month)) ? H : this.empty("noWindows")}
              </section>` : this.renderWeek()}`;
	}
	eventActivity(e, n) {
		let r = t(e, "status");
		return ["planned", "sown"].includes(r) ? t(n, "method") : r === "planted_out" ? "transplant" : ["harvesting", "completed"].includes(r) ? "harvest" : r === "pricked_out" ? "prick_out" : "care";
	}
	renderWeek() {
		let e = m(this.anchor || this.today), n = new Set(this.filteredPlants(!0).map((e) => e.id)), r = this.calendarWindows().map((e) => ({
			window: e,
			segments: S(e, this.anchor || this.today)
		})).filter(({ segments: e }) => e.length);
		return B`<section class="panel" aria-labelledby="week-windows-title">
        <h2 id="week-windows-title">${this.tr("possibleThisWeek")}</h2>
        <p class="muted">${this.tr("recommendation")}</p>
        <div class="week-windows">
          ${r.map(({ window: e, segments: n }) => B`<button
                class=${`week-window ${t(e, "activity")}`}
                title=${this.windowTooltip(e)}
                @click=${() => {
			this.selected = {
				kind: "window",
				id: e.id
			};
		}}
              >
                <span
                  ><strong
                    >${this.nameFor(t(e, "plant_id"), "plants")}</strong
                  >
                  <span
                    >${this.lab(t(e, "activity"))} ·
                    ${this.lab(t(e, "environment"))}${t(e, "variety_id") ? ` · ${this.nameFor(t(e, "variety_id"), "varieties")}` : ""}</span
                  ></span
                >
                <small
                  >${n.map((e) => e.start === e.end ? h(e.start, this.language) : `${h(e.start, this.language)} – ${h(e.end, this.language)}`).join(" · ")}</small
                >
              </button>`)}
        </div>
        ${r.length ? H : B`<p class="muted">${this.tr("noWeekWindows")}</p>`}
      </section>
      <h2 class="week-heading">${this.tr("actualWork")}</h2>
      <div class="scroll" tabindex="0" aria-label=${this.tr("week")}>
        <div class="week-grid">
          ${e.map((e) => {
			let r = this.tables.tasks.filter((r) => t(r, "date") === e && this.calendarActivityMatches(t(r, "activity")) && (!t(r, "plant_id") || n.has(t(r, "plant_id"))));
			r.sort((e, n) => Q.indexOf(t(e, "activity")) - Q.indexOf(t(n, "activity")));
			let i = this.tables.cultivation_events.filter((r) => t(r, "date") === e && this.tables.cultivations.some((e) => e.id === t(r, "cultivation_id") && n.has(t(e, "plant_id")) && this.calendarActivityMatches(this.eventActivity(r, e)))), a = [...r.map((e) => ({
				kind: "task",
				record: e,
				activity: t(e, "activity")
			})), ...i.map((e) => ({
				kind: "event",
				record: e,
				activity: this.eventActivity(e, this.tables.cultivations.find((n) => n.id === t(e, "cultivation_id")))
			}))].sort((e, t) => Q.indexOf(e.activity) - Q.indexOf(t.activity) || e.record.id.localeCompare(t.record.id));
			return B`<section
              class=${`week-day ${e === this.today ? "today" : ""}`}
            >
              <h3>
                ${new Intl.DateTimeFormat(this.language === "de" ? "de-DE" : "en-GB", {
				weekday: "short",
				timeZone: "UTC"
			}).format(/* @__PURE__ */ new Date(`${e}T12:00:00Z`))}<br />${h(e, this.language)}
              </h3>
              ${!r.length && !i.length ? B`<p class="muted week-empty">${this.tr("noAppointments")}</p>` : H}
              ${a.map((e) => {
				if (e.kind === "task") return B`<button
                    class=${`week-event ${e.activity}`}
                    ?disabled=${!this.editable && !e.record.data.personal_generated}
                    @click=${async () => {
					if (e.record.data.personal_generated) {
						this.navigate("cultures"), await this.updateComplete;
						let t = this.renderRoot.querySelector(`#task-${e.record.id}`);
						t?.scrollIntoView({ block: "center" }), t?.focus({ preventScroll: !0 });
					} else this.startEditor("tasks", e.record);
				}}
                  >
                    ${t(e.record, "title")}${e.record.data.completed ? " ✓" : ""}
                  </button>`;
				let n = this.tables.cultivations.find((n) => n.id === t(e.record, "cultivation_id"));
				return B`<button
                  class=${`week-event ${e.activity}`}
                  @click=${() => {
					this.selected = {
						kind: "culture",
						id: n.id
					};
				}}
                >
                  ${this.plantName(n)} ·
                  ${this.lab(t(e.record, "status"))}
                </button>`;
			})}
            </section>`;
		})}
        </div>
      </div>`;
	}
	renderCultures() {
		let e = this.tables.cultivations.filter((e) => this.cultureScope === "planned" ? this.status(e) === "planned" : this.cultureScope === "active" ? ![
			"planned",
			"completed",
			"failed"
		].includes(this.status(e)) : !["completed", "failed"].includes(this.status(e)));
		return this.cultureView === "garden" ? B`${this.cultureTools()}${this.renderGardenMode()}` : this.cultureView === "harvest" ? B`${this.cultureTools()}${this.renderHarvestAnalysis()}` : B`${this.cultureTools()}
      <div class="filters culture-scope">
        <label
          >${this.tr("cultureScope")}<select
            aria-label=${this.tr("cultureScope")}
            .value=${this.cultureScope}
            @change=${(e) => {
			this.cultureScope = e.target.value;
		}}
          >
            <option value="current">${this.tr("currentCultures")}</option>
            <option value="planned">${this.tr("planned")}</option>
            <option value="active">${this.tr("active")}</option>
          </select></label
        >
      </div>
      ${e.length ? B`<div class="grid">
              ${e.map((e) => B`<article class="plant">
                    <div class="plant-title">
                      <span class="plant-symbol">${$("cultures")}</span>
                      <h3>${this.plantName(e)}</h3>
                    </div>
                    <div>
                      <span class="badge"
                        >${this.lab(this.status(e))}</span
                      >
                    </div>
                    <p>
                      ${h(x(e, this.tables.cultivation_events) || t(e, "date"), this.language)}
                      · ${this.lab(t(e, "method"))}<br /><span
                        class="muted"
                        >${this.nameFor(t(e, "location_id"), "locations")}</span
                      >
                    </p>
                    <div class="actions">
                      <button
                        @click=${() => {
			this.selected = {
				kind: "culture",
				id: e.id
			};
		}}
                      >
                        ${this.tr("details")}${$("arrow")}</button
                      >${this.editable ? B`<button class="icon" aria-label=${`${this.tr("newEvent")}: ${this.plantName(e)}`} @click=${() => this.startEditor("cultivation_events", void 0, { cultivation_id: e.id })}>${$("plus")}</button>` : H}
                    </div>
                  </article>`)}
            </div>` : this.empty(this.cultureScope === "current" ? "emptyCultures" : "noCulturesMatch")}
      <section class="panel" style="margin-top:24px">
        <div class="section-head">
          <h2>${this.tr("allTasks")}</h2>
          ${this.editable ? B`<button @click=${() => this.startEditor("tasks")}>${$("plus")}${this.tr("newTask")}</button>` : H}
        </div>
        ${this.renderTasks()}
      </section>`;
	}
	renderHistory(e = this.tables.cultivations, n = !1) {
		let r = [...new Set(e.map((e) => (x(e, this.tables.cultivation_events) || t(e, "date")).slice(0, 4)))].sort().reverse(), i = e.filter((e) => (n || !this.historySuccessOnly || t(e, "result") === "successful") && (n || !this.historyPlant || t(e, "plant_id") === this.historyPlant) && (n || !this.historyYear || (x(e, this.tables.cultivation_events) || t(e, "date")).startsWith(this.historyYear))).sort((e, n) => (x(n, this.tables.cultivation_events) || t(n, "date")).localeCompare(x(e, this.tables.cultivation_events) || t(e, "date")));
		return B`${n ? H : B`<p class="notice">${this.tr("observationHint")}</p>
            <label class="check history-success-filter"
              ><input
                type="checkbox"
                .checked=${this.historySuccessOnly}
                @change=${(e) => {
			this.historySuccessOnly = e.target.checked;
		}}
              />${this.tr("historySuccessOnly")}</label
            >
            <div class="filters">
              <label
                >${this.tr("plant_id")}<select
                  @change=${(e) => {
			this.historyPlant = e.target.value;
		}}
                >
                  <option value="">${this.tr("allPlants")}</option>
                  ${this.tables.plants.map((e) => B`<option value=${e.id} .selected=${this.historyPlant === e.id}>${t(e, "name")}</option>`)}
                </select></label
              ><label
                >${this.tr("year")}<select
                  @change=${(e) => {
			this.historyYear = e.target.value;
		}}
                >
                  <option value="">${this.tr("history")}</option>
                  ${r.map((e) => B`<option value=${e} .selected=${this.historyYear === e}>${e}</option>`)}
                </select></label
              >
            </div>`}
    ${i.length ? B`<div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>${this.tr("plant_id")}</th>
                  <th>${this.tr("sowingDate")}</th>
                  <th>${this.tr("method")}</th>
                  <th>${this.tr("location_id")}</th>
                  <th>${this.tr("result")}</th>
                  <th>${this.tr("details")}</th>
                </tr>
              </thead>
              <tbody>
                ${i.map((e) => B`<tr>
                      <td>${this.plantName(e)}</td>
                      <td>
                        ${h(x(e, this.tables.cultivation_events), this.language)}${x(e, this.tables.cultivation_events) ? H : B`<small> ${this.tr("planned")}</small>`}
                      </td>
                      <td>${this.lab(t(e, "method"))}</td>
                      <td>
                        ${this.nameFor(t(e, "location_id"), "locations")}
                      </td>
                      <td>
                        <span class=${`badge ${t(e, "result") || "unknown"}`}
                          >${this.lab(t(e, "result") || "unknown")}</span
                        >
                      </td>
                      <td>
                        <button
                          @click=${() => {
			this.selected = {
				kind: "culture",
				id: e.id
			};
		}}
                        >
                          ${this.tr("details")}
                        </button>
                      </td>
                    </tr>`)}
              </tbody>
            </table>
          </div>` : this.empty("emptyHistory")}`;
	}
	async loadPersonalReminders() {
		if (!this.api || !this.capabilities?.reminders || this.busy || this.reminderSaving) return;
		let e = ++this.preferencesGeneration, t = this.connectionGeneration;
		try {
			let n = await this.api.command("get_user_reminders");
			e === this.preferencesGeneration && t === this.connectionGeneration && this.isConnected && (this.personalReminders = n, this.reminderConfirmed = n);
		} catch (n) {
			e === this.preferencesGeneration && t === this.connectionGeneration && (this.error = U(this.language, n));
		}
	}
	reminderView(e, t) {
		let n = { ...e.cells };
		for (let e of t.values()) n[e.plant_id]?.[e.activity] !== void 0 && (n[e.plant_id] = {
			...n[e.plant_id],
			[e.activity]: e.enabled
		});
		return {
			...e,
			cells: n
		};
	}
	setPersonalReminder(e, t, n) {
		this.api && this.personalReminders && !this.busy && (this.preferencesGeneration++, this.reminderPending.set(JSON.stringify([e, t]), {
			plant_id: e,
			activity: t,
			enabled: n
		}), this.personalReminders = this.reminderView(this.personalReminders, this.reminderPending), this.reminderSaving = !0, this.error = "", this.reminderTimer && clearTimeout(this.reminderTimer), this.reminderFlush || (this.reminderTimer = setTimeout(() => {
			this.flushReminderChanges();
		}, 80)));
	}
	flushReminderChanges() {
		if (this.reminderTimer && clearTimeout(this.reminderTimer), this.reminderTimer = void 0, this.reminderFlush) return this.reminderFlush;
		if (!this.api || !this.reminderPending.size) return Promise.resolve(!0);
		let e = this.api, t = this.connectionGeneration, n = this.reminderPending, r = this.reminderConfirmed ?? this.personalReminders, i = (async () => {
			let i = !0;
			for (; n.size;) {
				let a = [...n.values()].slice(0, 500);
				for (let e of a) n.delete(JSON.stringify([e.plant_id, e.activity]));
				try {
					r = await e.command("set_user_reminders", { changes: a }), t === this.connectionGeneration && this.isConnected && (this.reminderConfirmed = r, this.personalReminders = this.reminderView(r, n), this.reminderTasksDirty = !0, this.reminderTaskVersion++);
				} catch (e) {
					i = !1, t === this.connectionGeneration && this.isConnected ? (this.personalReminders = this.reminderView(r, n), this.error = U(this.language, e)) : console.error("Garden Planner: queued reminder changes could not be saved.");
				}
			}
			return t === this.connectionGeneration && this.isConnected && (this.reminderSaving = !1, i && this.announce("saved")), i;
		})();
		return this.reminderFlush = i, i.then(() => {
			this.reminderFlush === i && (this.reminderFlush = void 0);
		}), i;
	}
	async refreshReminderTasks() {
		if (!this.api) return !1;
		let e = this.connectionGeneration, t = ++this.loadGeneration, n = this.reminderTaskVersion;
		try {
			let r = await this.api.command("list", { table: "tasks" });
			return e !== this.connectionGeneration || t !== this.loadGeneration || !this.isConnected ? !1 : (this.tables = {
				...this.tables,
				tasks: r
			}, n === this.reminderTaskVersion && (this.reminderTasksDirty = !1), !0);
		} catch (t) {
			return e === this.connectionGeneration && (this.error = U(this.language, t)), !1;
		}
	}
	renderPersonalReminders() {
		let e = this.personalReminders;
		if (!this.capabilities?.reminders) return B`<p class="notice">${this.tr("personalUnavailable")}</p>`;
		if (!e) return B`<p role="status">${this.tr("loading")}</p>`;
		let n = this.plantList.filter((e) => t(e, "name").toLocaleLowerCase(this.language).includes(this.reminderQuery.toLocaleLowerCase(this.language))).sort((e, n) => t(e, "name").localeCompare(t(n, "name"), this.language));
		return B`<section class="panel">
      <p>${this.tr("personalIntro")}</p>
      <p class="notice">
        ${this.tr(e.global_enabled ? "personalGlobalOn" : "personalGlobalOff")}
        ${this.tr(e.personal_destinations ? "personalChannelOn" : "personalChannelOff")}
      </p>
      ${e.shared_channel_enabled ? B`<p class="notice">${this.tr("personalSharedHint")}</p>` : H}
      <label
        >${this.tr("search")}<input
          type="search"
          .value=${this.reminderQuery}
          @input=${(e) => {
			this.reminderQuery = e.target.value;
		}}
      /></label>
      <p role="status" class="reminder-save-status">
        ${this.reminderSaving ? this.tr("savingReminders") : ""}
      </p>
      <p class="matrix-scroll-hint muted">${this.tr("matrixScrollHint")}</p>
      <div
        class="reminders-scroll"
        tabindex="0"
        role="region"
        aria-label=${this.tr("reminders")}
      >
        <table class="reminders-table">
          <thead>
            <tr>
              <th scope="col">${this.tr("plants")}</th>
              ${Q.map((e) => B`<th scope="col">${this.lab(e)}</th>`)}
            </tr>
          </thead>
          <tbody>
            ${pt(n, (e) => e.id, (n) => gt([
			n,
			e.cells[n.id],
			this.busy,
			this.language
		], () => B`<tr>
                      <th scope="row" title=${t(n, "name")}>
                        ${t(n, "name")}
                      </th>
                      ${Q.map((r) => {
			let i = e.cells[n.id]?.[r] !== void 0, a = e.cells[n.id]?.[r] ?? !1;
			return B`<td
                          class=${i ? "" : "reminder-unavailable"}
                          title=${i ? "" : this.tr("personalNoWindow")}
                        >
                          <input
                            type="checkbox"
                            aria-label=${`${t(n, "name")}: ${this.lab(r)}`}
                            .checked=${mt(a)}
                            ?disabled=${!i || this.busy}
                            @change=${(e) => void this.setPersonalReminder(n.id, r, e.target.checked)}
                          />
                        </td>`;
		})}
                    </tr>`))}
          </tbody>
        </table>
      </div>
      ${n.length ? H : B`<p class="muted">${this.tr("noResults")}</p>`}
      <p class="muted">${this.tr("personalHint")}</p>
    </section>`;
	}
	renderLocations() {
		return B`${this.tables.locations.length ? B`<div class="grid">
            ${this.tables.locations.map((e) => B`<article class="plant">
                  <div class="plant-title">
                    <span class="plant-symbol">${$("locations")}</span>
                    <h3>${t(e, "name")}</h3>
                  </div>
                  <p class="muted">
                    ${t(e, "location_type")} ·
                    ${t(e, "light")}
                  </p>
                  <p>
                    ${t(e, "description") || t(e, "soil") || this.tr("noNotes")}
                  </p>
                  ${t(e, "sensor_entity_id") ? B`<p class="break">
                          <small
                            >${this.lab(t(e, "measurement_kind"))}<br />${t(e, "sensor_entity_id")}</small
                          >
                        </p>` : H}${t(e, "sensor_entity_id") ? this.renderTemperature(e) : H}
                  ${e.data.archived ? B`<span class="badge unknown">${this.tr("archived")}</span>` : H}${this.editable ? B`<div class="actions">
                          <button
                            @click=${() => this.startEditor("locations", e)}
                          >
                            ${this.tr("edit")}</button
                          ><button
                            @click=${() => this.archive(e, "locations")}
                          >
                            ${this.tr(e.data.archived ? "unarchive" : "archive")}</button
                          ><button
                            class="danger"
                            @click=${() => {
			this.deleting = {
				table: "locations",
				record: e
			};
		}}
                          >
                            ${this.tr("delete")}
                          </button>
                        </div>` : H}
                </article>`)}
          </div>` : this.empty("emptyLocations", "", "newLocation", () => this.startEditor("locations"))}`;
	}
	renderData(e, t = []) {
		return B`<dl>
      ${Object.entries(e).filter(([e, n]) => !t.includes(e) && e !== "seed_state" && e !== "image_data" && n != null && n !== "" && !e.endsWith("_id") && typeof n != "object").map(([e, t]) => B`<dt>${this.tr(e)}</dt>
              <dd>
                ${[
			"category",
			"method",
			"environment",
			"initial_status",
			"result",
			"germination_result",
			"harvest_result",
			"measurement_kind"
		].includes(e) ? this.lab(String(t)) : typeof t == "boolean" ? t ? "✓" : "—" : [
			"best_before",
			"opened_on",
			"germination_tested_on"
		].includes(e) ? h(String(t), this.language) : String(t)}
              </dd>`)}
    </dl>`;
	}
	windowTooltip(e) {
		let n = t(e, "notes");
		return `${v(e, this.language)}${n ? `\n\n${n}` : ""}`;
	}
	renderWindowDetail(e) {
		let n = this.tables.growing_windows.find((t) => t.id === e), r = n ? this.tables.plants.find((e) => e.id === t(n, "plant_id")) : void 0, i = t(n, "notes"), a = i.length > 360 ? `${i.slice(0, 360).trimEnd()}…` : i, o = n && [
			"regional_notes",
			"source",
			"source_url"
		].some((e) => t(n, e));
		return B`<dialog
      id="detail-dialog"
      aria-labelledby="detail-title"
      @close=${() => {
			this.selected = null;
		}}
    >
      <div class="dialog-head">
        <div>
          <small>${this.tr("windowDetail")}</small>
          <h2 id="detail-title">
            ${n && r ? `${this.lab(t(n, "activity"))} · ${t(r, "name")}` : this.tr("windowDetail")}
          </h2>
        </div>
        <button
          class="icon"
          aria-label=${this.tr("close")}
          @click=${() => {
			this.selected = null;
		}}
        >
          ${$("close")}
        </button>
      </div>
      <div class="dialog-body calendar-detail-body">
        ${this.error ? B`<p class="notice error" role="alert">${this.error}</p>` : H}
        ${n && r ? B` <section
                  class=${`calendar-window-card ${t(n, "activity")}`}
                  aria-label=${this.tr("windowDetail")}
                >
                  <small>${this.tr("recurringWindow")}</small>
                  <h3 class="calendar-window-dates">
                    ${v(n, this.language)}
                  </h3>
                  <div class="calendar-window-badges">
                    <span class="badge"
                      >${this.lab(t(n, "environment"))}</span
                    >
                    ${t(n, "method") && t(n, "method") !== t(n, "activity") ? B`<span class="badge">${this.lab(t(n, "method"))}</span>` : H}
                  </div>
                  ${i ? B`<div class="calendar-window-note">
                          <h3>${this.tr("notes")}</h3>
                          <p>${a}</p>
                          ${i.length > 360 ? B`<details>
                                  <summary>
                                    ${this.tr("fullWindowNote")}
                                  </summary>
                                  <p>${i}</p>
                                </details>` : H}
                        </div>` : H}
                  ${o ? B`<details>
                          <summary>${this.tr("windowExtra")}</summary>
                          ${this.renderData({
			regional_notes: n.data.regional_notes,
			source: n.data.source,
			source_url: n.data.source_url
		})}
                        </details>` : H}
                  ${this.editable ? B`<button type="button" @click=${() => this.startEditor("growing_windows", n)}>${$("edit")}${this.tr("editWindow")}</button>` : H}
                </section>
                <section
                  class="calendar-plant-profile"
                  aria-labelledby="calendar-plant-profile-title"
                >
                  <div class="section-head">
                    <div>
                      <small>${this.tr("plantProfile")}</small>
                      <h3 id="calendar-plant-profile-title">
                        ${t(r, "name")}
                      </h3>
                    </div>
                    <button
                      type="button"
                      class="link"
                      @click=${() => {
			this.selected = {
				kind: "plant",
				id: r.id
			};
		}}
                    >
                      ${this.tr("openPlant")}${$("arrow")}
                    </button>
                  </div>
                  ${this.renderPlantSummary(r)}
                  <details class="plant-full-information">
                    <summary>${this.tr("allPlantInformation")}</summary>
                    ${this.renderData(r.data, ["name", "botanical_name"])}
                  </details>
                </section>` : B`<p role="alert">${this.tr("not_found")}</p>`}
      </div>
    </dialog>`;
	}
	renderDetail() {
		let e = this.selected;
		if (e?.kind === "window") return this.renderWindowDetail(e.id);
		let n = e ? this.tables[e.kind === "plant" ? "plants" : "cultivations"].find((t) => t.id === e.id) : void 0;
		return B`<dialog
      id="detail-dialog"
      aria-labelledby="detail-title"
      @close=${() => {
			this.selected = null;
		}}
    >
      ${e && n ? B`<div class="dialog-head">
                <div>
                  <small
                    >${this.tr(e.kind === "plant" ? "plantDetail" : "cultivationDetail")}</small
                  >
                  <h2 id="detail-title">
                    ${e.kind === "plant" ? t(n, "name") : this.plantName(n)}
                  </h2>
                </div>
                <button
                  class="icon"
                  aria-label=${this.tr("close")}
                  @click=${() => {
			this.selected = null;
		}}
                >
                  ${$("close")}
                </button>
              </div>
              <div class="dialog-body">
                ${this.error ? B`<p class="notice error" role="alert">${this.error}</p>` : H}
                ${this.editable ? B`<div
                        class=${e.kind === "plant" ? "actions plant-detail-actions" : "actions"}
                      >
                        <button
                          @click=${() => this.startEditor(e.kind === "plant" ? "plants" : "cultivations", n)}
                        >
                          ${this.tr("edit")}</button
                        >${e.kind === "plant" ? B`<button @click=${() => this.duplicate(n)} ?disabled=${this.busy}>${this.tr("duplicate")}</button><button @click=${() => this.archive(n, "plants")} ?disabled=${this.busy}>${this.tr(n.data.archived ? "unarchive" : "archive")}</button>` : B`<button class="primary" @click=${() => this.startEditor("cultivation_events", void 0, { cultivation_id: n.id })}>${$("plus")}${this.tr("newEvent")}</button>`}<button
                          class="danger"
                          @click=${() => {
			this.deleting = {
				table: e.kind === "plant" ? "plants" : "cultivations",
				record: n
			};
		}}
                        >
                          ${this.tr("delete")}
                        </button>
                      </div>` : H}
                ${e.kind === "plant" ? this.renderPlantDetail(n) : this.renderCultureDetail(n)}
              </div>` : e ? B`<div class="dialog-body">
                <p role="alert">${this.tr("not_found")}</p>
                <button
                  @click=${() => {
			this.selected = null;
		}}
                >
                  ${this.tr("close")}
                </button>
              </div>` : H}
    </dialog>`;
	}
	renderPlantSummary(e) {
		let n = e.data, r = (e) => typeof n[e] == "number" ? n[e].toLocaleString(this.language, { maximumFractionDigits: 20 }) : "—", i = (e, t, i) => typeof n[e] == "number" || typeof n[t] == "number" ? `${r(e)} – ${r(t)} ${i}` : "", a = this.language === "de" ? "Tage" : "days", o = i("germination_optimal_min_c", "germination_optimal_max_c", "°C"), s = [
			[o ? "optimalGermination" : "germinationLimits", o || i("germination_min_c", "germination_max_c", "°C")],
			["germinationDuration", i("germination_days_min", "germination_days_max", a)],
			["depth_cm", typeof n.depth_cm == "number" ? `${r("depth_cm")} cm` : ""],
			["plantRowSpacing", typeof n.spacing_cm == "number" || typeof n.row_spacing_cm == "number" ? `${r("spacing_cm")} / ${r("row_spacing_cm")} cm` : ""],
			["cultivationDuration", i("duration_days_min", "duration_days_max", a)],
			["site", t(e, "site")]
		];
		return B`<div class="plant-summary-heading">
        ${t(e, "botanical_name") ? B`<p><i>${t(e, "botanical_name")}</i></p>` : H}
        ${t(e, "category") ? B`<span class="badge">${this.lab(t(e, "category"))}</span>` : H}
      </div>
      <dl class="plant-quick-facts">
        ${s.filter(([, e]) => e).map(([e, t]) => B`<div>
                <dt>${this.tr(e)}</dt>
                <dd>${t}</dd>
              </div>`)}
      </dl>`;
	}
	renderPlantProfile(e) {
		let n = this.language === "de" ? "Tage" : "days", r = [
			[
				"optimalGermination",
				this.plantRange(e, "germination_optimal_min_c", "germination_optimal_max_c", "°C"),
				`${this.tr("germinationLimits")}: ${this.plantRange(e, "germination_min_c", "germination_max_c", "°C")}`,
				"temperature"
			],
			[
				"germinationDuration",
				this.plantRange(e, "germination_days_min", "germination_days_max", n),
				this.tr("germinationHint"),
				"clock"
			],
			[
				"spacing_cm",
				typeof e.data.spacing_cm == "number" ? `${e.data.spacing_cm.toLocaleString(this.language)} cm` : "—",
				`${this.tr("row_spacing_cm")}: ${e.data.row_spacing_cm ?? "—"} cm`,
				"ruler"
			],
			[
				"cultivationDuration",
				this.plantRange(e, "duration_days_min", "duration_days_max", n),
				`${this.tr("depth_cm")}: ${e.data.depth_cm ?? "—"} cm`,
				"calendar"
			]
		], i = e.data.germination_min_c, a = e.data.germination_optimal_min_c, o = e.data.germination_optimal_max_c, s = e.data.germination_max_c, c = [
			i,
			a,
			o,
			s
		].every((e) => typeof e == "number") && Number(s) > Number(i), l = c ? (Number(a) - Number(i)) / (Number(s) - Number(i)) * 100 : 0, u = c ? (Number(o) - Number(a)) / (Number(s) - Number(i)) * 100 : 0;
		return B`<section class="plant-profile">
      <div class="profile-heading">
        ${this.plantImage(e, "profile-photo")}
        <div>
          <span class="badge">${this.lab(t(e, "category"))}</span>
          <h3>${t(e, "name")}</h3>
          <i>${t(e, "botanical_name")}</i>
          ${[
			"site",
			"light",
			"water",
			"frost"
		].filter((n) => t(e, n)).map((n) => B`<p class="profile-condition"><strong>${this.tr(n)}</strong><span>${t(e, n)}</span></p>`)}
        </div>
      </div>
      ${t(e, "description") ? B`<p class="profile-description">${t(e, "description")}</p>` : H}
      <h3>${this.tr("growingAtGlance")}</h3>
      <dl class="profile-facts">
        ${r.map(([e, t, n, r]) => B`<div>
              <dt>${$(r)}${this.tr(e)}</dt>
              <dd><strong>${t}</strong><small>${n}</small></dd>
            </div>`)}
      </dl>
      ${c ? B`<section class="temperature-profile">
              <h3>${this.tr("germinationTemperature")}</h3>
              <div
                class="temperature-scale"
                role="img"
                aria-label=${`${i}–${s} °C; ${this.tr("optimalGermination")}: ${a}–${o} °C`}
              >
                <span style=${`left:${l}%;width:${u}%`}></span>
              </div>
              <div class="temperature-labels">
                <span>${i} °C</span
                ><strong>${a}–${o} °C ${this.tr("optimalShort")}</strong
                ><span>${s} °C</span>
              </div>
              <p class="muted">${this.tr("substrateHint")}</p>
            </section>` : H}
      ${this.renderPlantYear(e)}
      <section class="profile-neighbors">
        <h3>${this.tr("plantNeighbors")}</h3>
        ${["good", "bad"].map((t) => B`<h4 class=${"neighbor-" + t}>
                ${this.tr(t === "good" ? "goodNeighbors" : "badNeighbors")}
              </h4>
              <div class="neighbor-chips">
                ${[...this.neighborIds(e, t).map((e) => this.nameFor(e, "plants")), ...this.neighborNames(e, t)].map((e) => B`<span class=${"badge neighbor-" + t}>${e}</span>`)}${!this.neighborIds(e, t).length && !this.neighborNames(e, t).length ? B`<small class="muted">${this.tr("noNeighbors")}</small>` : H}
              </div>`)}
      </section>
      ${t(e, "care") ? B`<section>
              <h3>${this.tr("care")}</h3>
              <p class="profile-text">${t(e, "care")}</p>
            </section>` : H}
      ${t(e, "source") || t(e, "source_url") ? B`<p class="muted profile-text">${this.tr("source")}: ${t(e, "source")} ${t(e, "source_url")}</p>` : H}
    </section>`;
	}
	renderPlantYear(e) {
		let n = this.plantWindows(e.id), r = Number(this.today.slice(0, 4));
		if (!n.length) return B``;
		let i = Array.from({ length: 12 }, (e, t) => t + 1);
		return B`<section class="profile-year">
      <h3>${this.tr("plantYear")} · ${r}</h3>
      <div
        class="profile-year-scroll"
        tabindex="0"
        role="region"
        aria-label=${this.tr("plantYear")}
      >
        <div class="profile-year-grid">
          <div></div>
          ${i.map((e) => B`<div class="mini-month">${_(r, e, this.language, !0)}</div>`)}
          ${n.map((e) => B`<button
                  class="mini-title"
                  title=${this.windowTooltip(e)}
                  @click=${() => {
			this.selected = {
				kind: "window",
				id: e.id
			};
		}}
                >
                  ${this.lab(t(e, "activity"))}</button
                >${i.map((n) => B`<div class=${`mini-cell ${t(e, "activity")}`} title=${`${this.lab(t(e, "activity"))}: ${this.windowTooltip(e)}`}><span>${d(e, r, n).map((e) => B`<span class="bar" style=${`left:${e.offset}%;width:${e.width}%`}></span>`)}</span></div>`)}`)}
        </div>
      </div>
    </section>`;
	}
	renderPlantDetail(e) {
		let n = this.tables.varieties.filter((n) => t(n, "plant_id") === e.id);
		return B`${this.renderPlantProfile(e)}
      <div
        class="detail-jumps"
        role="group"
        aria-label=${this.tr("plantSections")}
      >
        ${[
			"varieties",
			"windows",
			"observations"
		].map((e) => B`<button
              type="button"
              @click=${() => {
			let t = this.renderRoot.querySelector("#detail-dialog"), n = t?.querySelector(`#plant-${e}`);
			if (t && n) {
				let e = t.querySelector(".dialog-head")?.getBoundingClientRect().height ?? 0;
				t.scrollTop += n.getBoundingClientRect().top - t.getBoundingClientRect().top - e - 12, n.focus({ preventScroll: !0 });
			}
		}}
            >
              ${this.tr(e === "windows" ? "jumpWindows" : e === "observations" ? "jumpObservations" : e)}
            </button>`)}
      </div>
      <details class="plant-full-information">
        <summary>${this.tr("allPlantInformation")}</summary>
        <p class="notice">${this.tr("temperatureHint")}</p>
        ${this.renderData(e.data, ["name", "botanical_name"])}
      </details>
      <div class="section-head">
        <h3 id="plant-varieties" tabindex="-1">${this.tr("varieties")}</h3>
        ${this.editable ? B`<button @click=${() => this.startEditor("varieties", void 0, { plant_id: e.id })}>${$("plus")}${this.tr("newVariety")}</button>` : H}
      </div>
      ${n.length ? n.map((e) => B`<article class="item">
                  ${t(e, "image_data") ? this.plantImage(e, "variety-photo") : H}
                  <div class="item-content">
                    <h3>
                      ${t(e, "name")}${t(e, "botanical_name") ? B` <span style="font-weight: normal">(${t(e, "botanical_name")})</span>` : H}
                    </h3>
                  </div>
                  ${this.editable ? B`<button
                            @click=${() => this.startEditor("varieties", e)}
                          >
                            ${this.tr("edit")}</button
                          ><button
                            class="danger"
                            @click=${() => {
			this.deleting = {
				table: "varieties",
				record: e
			};
		}}
                          >
                            ${this.tr("delete")}
                          </button>` : H}
                </article>`) : B`<p class="muted">${this.tr("noVarieties")}</p>`}
      <div class="section-head">
        <h3 id="plant-windows" tabindex="-1">${this.tr("windows")}</h3>
        ${this.editable ? B`<button @click=${() => this.startEditor("growing_windows", void 0, { plant_id: e.id })}>${$("plus")}${this.tr("newWindow")}</button>` : H}
      </div>
      ${this.plantWindows(e.id).length ? this.plantWindows(e.id).map((e) => B`<article class="item">
                  <div class="item-content">
                    <h3>
                      ${this.lab(t(e, "activity"))}${t(e, "variety_id") ? ` (${this.nameFor(t(e, "variety_id"), "varieties")})` : ""}
                      · ${v(e, this.language)}
                    </h3>
                    ${t(e, "notes") ? B`<p style="white-space: pre-wrap">${t(e, "notes")}</p>` : H}
                  </div>
                  ${this.editable ? B`<button
                            @click=${() => this.startEditor("growing_windows", e)}
                          >
                            ${this.tr("edit")}</button
                          ><button
                            class="danger"
                            @click=${() => {
			this.deleting = {
				table: "growing_windows",
				record: e
			};
		}}
                          >
                            ${this.tr("delete")}
                          </button>` : H}
                </article>`) : B`<p class="muted">${this.tr("noAllWindows")}</p>`}
      <div class="section-head">
        <h3 id="plant-observations" tabindex="-1">
          ${this.tr("observations")}
        </h3>
        ${this.editable && !e.data.archived ? B`<button class="primary" @click=${() => this.startEditor("cultivations", void 0, { plant_id: e.id })}>${$("plus")}${this.tr("newSowing")}</button>` : H}
      </div>
      ${this.renderHistory(this.tables.cultivations.filter((n) => t(n, "plant_id") === e.id), !0)}`;
	}
	renderCultureDetail(e) {
		let n = e.data.snapshot, r = n && typeof n == "object" && !Array.isArray(n) ? n : void 0;
		return B`<p>
        <span class="badge">${this.lab(this.status(e))}</span>
      </p>
      <dl>
        <dt>${this.tr("sowingDate")}</dt>
        <dd>
          ${h(x(e, this.tables.cultivation_events), this.language)}
        </dd>
        <dt>${this.tr("location_id")}</dt>
        <dd>${this.nameFor(t(e, "location_id"), "locations")}</dd>
        <dt>${this.tr("variety")}</dt>
        <dd>${this.nameFor(t(e, "variety_id"), "varieties")}</dd>
      </dl>
      ${this.renderData(e.data, ["snapshot", "date"])}
      ${this.tables.locations.find((n) => n.id === t(e, "location_id")) ? this.renderTemperature(this.tables.locations.find((n) => n.id === t(e, "location_id")), e) : H}
      ${this.renderHarvestSummary(e)}${this.renderJournal(e)}
      <h3>${this.tr("timeline")}</h3>
      <div class="timeline">
        ${y(e, this.tables.cultivation_events).map((e) => B`<article>
              <div class="row">
                <div>
                  <strong>${this.lab(t(e, "status"))}</strong
                  ><br /><small
                    >${h(t(e, "date"), this.language)}</small
                  >
                </div>
                ${this.editable ? B`<div class="actions">
                        <button
                          @click=${() => this.startEditor("cultivation_events", e)}
                        >
                          ${this.tr("edit")}</button
                        >${e.data.origin === "initial" ? H : B`<button
                                class="danger"
                                @click=${() => {
			this.deleting = {
				table: "cultivation_events",
				record: e
			};
		}}
                              >
                                ${this.tr("delete")}
                              </button>`}
                      </div>` : H}
              </div>
              <p>${t(e, "notes") || this.tr("noNotes")}</p>
            </article>`)}
      </div>
      <details>
        <summary>${this.tr("snapshot")}</summary>
        <p class="notice">${this.tr("snapshotHint")}</p>
        ${[
			"plant",
			"variety",
			"location"
		].map((e) => {
			let t = r?.[e];
			return t && typeof t == "object" && !Array.isArray(t) ? B`<h3>
                  ${this.tr(e === "plant" ? "plant_id" : e === "variety" ? "variety" : "location_id")}
                </h3>
                ${this.renderData(t)}` : H;
		})}${Array.isArray(r?.windows) ? B`<h3>${this.tr("windows")}</h3>
                ${r.windows.map((e) => e && typeof e == "object" && !Array.isArray(e) ? this.renderData(e) : H)}` : H}
      </details>`;
	}
	async loadBackups() {
		let e = this.api, t = this.connectionGeneration;
		if (e) try {
			let n = await e.command("backups");
			t === this.connectionGeneration && (this.backups = n);
		} catch (e) {
			t === this.connectionGeneration && (this.error = U(this.language, e));
		}
	}
	async exportFile(e) {
		if (!this.api || this.busy) return;
		this.busy = !0, this.error = "";
		let t = this.api, n = this.connectionGeneration;
		try {
			if (e === "json") {
				let r = await t.command("export", { format: e });
				if (n !== this.connectionGeneration) return;
				Vn(JSON.stringify(r, null, 2), `garden-planner-${this.today}.json`, "application/json");
			} else {
				let r = await t.command("export", { format: e });
				if (n !== this.connectionGeneration) return;
				Vn(Hn(r).slice().buffer, `garden-planner-csv-${this.today}.zip`, "application/zip");
			}
		} catch (e) {
			n === this.connectionGeneration && (this.error = U(this.language, e));
		} finally {
			n === this.connectionGeneration && (this.busy = !1);
		}
	}
	async selectImport(e) {
		let t = e.target, n = t.files?.[0];
		if (!n || !this.api || this.busy) return;
		this.busy = !0, this.error = "";
		let r = this.api, i = this.connectionGeneration;
		try {
			if (n.size > 20971520) throw Error("invalid_file");
			let e = new Uint8Array(await n.arrayBuffer());
			if (i !== this.connectionGeneration) return;
			let t = e[0] === 80 && e[1] === 75 ? "csv" : "json", a = t === "csv" ? Un(e) : JSON.parse(new TextDecoder("utf-8", { fatal: !0 }).decode(e)), o = await r.command("preview_import", {
				payload: a,
				format: t,
				mode: this.importMode
			});
			if (i !== this.connectionGeneration) return;
			this.replaceConfirmed = !1, this.reviewed = {
				plan: o,
				payload: a,
				format: t
			};
		} catch (e) {
			if (i !== this.connectionGeneration) return;
			this.error = e instanceof SyntaxError || e instanceof Error && e.message === "invalid_file" ? this.tr("invalidFile") : U(this.language, e);
		} finally {
			t.value = "", i === this.connectionGeneration && (this.busy = !1);
		}
	}
	async previewRestore(e) {
		if (!this.api || this.busy) return;
		this.busy = !0, this.error = "";
		let t = this.api, n = this.connectionGeneration;
		try {
			let r = await t.command("preview_restore", { name: e });
			if (n !== this.connectionGeneration) return;
			this.replaceConfirmed = !1, this.reviewed = {
				plan: r,
				backup: e
			};
		} catch (e) {
			n === this.connectionGeneration && (this.error = U(this.language, e));
		} finally {
			n === this.connectionGeneration && (this.busy = !1);
		}
	}
	async applyReviewed() {
		let e = this.reviewed;
		e && (e.plan.mode !== "replace" || this.replaceConfirmed) && await this.action(e.backup ? "restore" : "import", e.backup ? {
			name: e.backup,
			token: e.plan.token,
			confirm: !0
		} : {
			payload: e.payload,
			token: e.plan.token,
			format: e.format,
			mode: e.plan.mode,
			confirm: e.plan.mode === "replace"
		}, e.backup ? "restored" : "importDone") && (this.reviewed = null, await this.loadBackups());
	}
	renderReview() {
		let e = this.reviewed;
		return B`<dialog
      id="review-dialog"
      aria-labelledby="review-title"
      @cancel=${(e) => {
			this.busy && e.preventDefault();
		}}
      @close=${() => {
			this.reviewed = null;
		}}
    >
      ${e ? B`<div class="dialog-head">
                <h2 id="review-title">${this.tr("importPreview")}</h2>
                <button
                  class="icon"
                  ?disabled=${this.busy}
                  aria-label=${this.tr("close")}
                  @click=${() => {
			this.reviewed = null;
		}}
                >
                  ${$("close")}
                </button>
              </div>
              <div class="dialog-body">
                ${this.error ? B`<p class="notice error" role="alert">${this.error}</p>` : H}
                <dl>
                  ${[
			"inserted",
			"updated",
			"skipped",
			"deleted"
		].map((t) => B`<dt>
                          ${this.tr(t === "deleted" ? "removed" : t)}
                        </dt>
                        <dd>${e.plan[t]}</dd>`)}
                  <dt>${this.tr("conflicts")}</dt>
                  <dd>${e.plan.conflicts.length}</dd>
                </dl>
                ${e.plan.mode === "replace" ? B`<p class="notice error">
                          ${this.tr("replaceWarning")}
                        </p>
                        <label class="check"
                          ><input
                            type="checkbox"
                            .checked=${this.replaceConfirmed}
                            @change=${(e) => {
			this.replaceConfirmed = e.target.checked;
		}}
                          />${this.tr("confirmReplace")}</label
                        >` : H}
              </div>
              <div class="dialog-foot">
                <button
                  ?disabled=${this.busy}
                  @click=${() => {
			this.reviewed = null;
		}}
                >
                  ${this.tr("cancel")}</button
                ><button
                  class="primary"
                  ?disabled=${this.busy || e.plan.conflicts.length > 0 || e.plan.mode === "replace" && !this.replaceConfirmed}
                  @click=${this.applyReviewed}
                >
                  ${this.tr(e.backup ? "restore" : "applyImport")}
                </button>
              </div>` : H}
    </dialog>`;
	}
	async loadHostSettings() {
		let e = this.api, t = this.connectionGeneration, n = this.hostDraftRevision;
		if (e && this.admin && this.capabilities?.reminders) try {
			let [r, i] = await Promise.all([e.command("get_settings"), e.command("reminder_log")]);
			if (t !== this.connectionGeneration) return;
			this.hostSettings = r, n === this.hostDraftRevision && (this.hostDraft = structuredClone(r.settings)), this.deliveries = i;
		} catch (e) {
			t === this.connectionGeneration && (this.error = U(this.language, e));
		}
	}
	renderTemperature(e, n) {
		if (!t(e, "sensor_entity_id")) return H;
		let r = T(this.hass, e, n ? w(n) : void 0);
		return B`<div
      class="notice ${r.state === "outside" ? "error" : ""}"
    >
      <strong
        >${this.tr("liveTemperature")} ·
        ${this.lab(t(e, "measurement_kind"))}</strong
      >
      <p>
        ${r.value === void 0 ? this.tr(r.state === "unit" ? "badTemperatureUnit" : "noSensor") : `${r.value.toLocaleString(this.language, { maximumFractionDigits: 1 })} °C`}
      </p>
      ${r.state === "outside" ? B`<p>${this.tr("outsideRange")}</p>` : r.state === "information" && t(e, "measurement_kind") !== "substrate" ? B`<small>${this.tr("notComparable")}</small>` : H}
    </div>`;
	}
	setUserPermission(e, t, n) {
		this.hostDraftRevision++;
		let r = this.hostDraft, i = new Set(r.readers ?? this.hostSettings.users.map((e) => e.id)), a = new Set(r.writers), o = t === "readers" ? i : a;
		n ? o.add(e) : o.delete(e), t === "writers" && n && i.add(e), t === "readers" && !n && a.delete(e), this.hostDraft = {
			...r,
			readers: [...i],
			writers: [...a],
			notification_routes: r.notification_routes.map((r) => r.user_id === e && t === "readers" && !n ? {
				...r,
				enabled: !1
			} : r)
		}, this.reconcileReminderActivation();
	}
	updateRoute(e, t, n) {
		this.hostDraftRevision++;
		let r = this.hostDraft, i = r.notification_routes.find((n) => n.user_id === e && n.kind === t) ?? {
			user_id: e,
			kind: t,
			enabled: !1,
			service: "",
			entity: "",
			target: ""
		};
		this.hostDraft = {
			...r,
			shared_channel_enabled: n.enabled !== !0 && r.shared_channel_enabled,
			notification_routes: [...r.notification_routes.filter((n) => n.user_id !== e || n.kind !== t), {
				...i,
				...n
			}]
		}, this.reconcileReminderActivation();
	}
	reconcileReminderActivation() {
		let e = this.hostDraft;
		!e.notification_routes.some((e) => e.enabled) && !(e.shared_channel_enabled && e.notify_service) && (this.hostDraft = {
			...e,
			reminders_enabled: !1
		});
	}
	renderRoute(e, t, n) {
		let r = this.hostSettings, i = this.hostDraft.notification_routes.find((n) => n.user_id === e.id && n.kind === t), a = `${e.name}: ${this.tr(t)}`, o = i?.service === "notify.send_message" ? `entity:${i.entity}` : i?.service || "";
		return B`<td>
      <label class="check"
        ><input
          type="checkbox"
          aria-label=${a}
          .checked=${i?.enabled ?? !1}
          ?disabled=${!n}
          @change=${(n) => this.updateRoute(e.id, t, { enabled: n.target.checked })}
        />${this.tr(t)}</label
      >
      ${i?.enabled ? B`<label
                >${this.tr("routeDestination")}<select
                  aria-label=${`${a}: ${this.tr("routeDestination")}`}
                  required
                  @change=${(n) => {
			let r = n.target.value;
			this.updateRoute(e.id, t, r.startsWith("entity:") ? {
				service: "notify.send_message",
				entity: r.slice(7),
				target: ""
			} : {
				service: r,
				entity: "",
				target: ""
			});
		}}
                >
                  <option value="" .selected=${!o}>
                    ${this.tr("noChannel")}
                  </option>
                  ${r.channels.filter((e) => e !== "notify.send_message").map((e) => B`<option value=${e} .selected=${o === e}>${e}</option>`)}
                  ${(r.notify_entities ?? []).map((e) => B`<option value=${`entity:${e.id}`} .selected=${o === `entity:${e.id}`}>${e.name} (${e.id})</option>`)}
                  ${o && !r.channels.includes(o) && !(r.notify_entities ?? []).some((e) => o === `entity:${e.id}`) ? B`<option value=${o} selected>${o} · ${this.tr("missingDestination")}</option>` : H}
                </select></label
              >
              ${t === "email" && i.service && i.service !== "notify.send_message" ? B`<label
                      >${this.tr("emailRecipient")}<input
                        type="email"
                        required
                        autocomplete="off"
                        aria-label=${`${e.name}: ${this.tr("emailRecipient")}`}
                        .value=${i.target}
                        @input=${(n) => this.updateRoute(e.id, t, { target: n.target.value })}
                    /></label>` : H}` : H}
    </td>`;
	}
	renderUserRoles(e, t) {
		return B`<h3>${this.tr("userRoles")}</h3>
      <p class="muted">${this.tr("rolesHint")} ${this.tr("sidebarHint")}</p>
      <div class="roles-scroll" tabindex="0" aria-label=${this.tr("userRoles")}>
        <table class="roles-table">
          <thead>
            <tr>
              <th scope="col">${this.tr("haUser")}</th>
              <th scope="col">${this.tr("canView")}</th>
              <th scope="col">${this.tr("canEdit")}</th>
              <th scope="col">${this.tr("push")}</th>
              <th scope="col">${this.tr("email")}</th>
            </tr>
          </thead>
          <tbody>
            ${e.users.map((e) => {
			let n = !!e.is_admin || t.readers === null || t.readers.includes(e.id);
			return B`<tr>
                <th scope="row">
                  ${e.name}${e.is_admin ? B`<small>${this.tr("administrator")}</small>` : H}
                </th>
                <td>
                  <input
                    type="checkbox"
                    aria-label=${`${e.name}: ${this.tr("canView")}`}
                    .checked=${n}
                    ?disabled=${e.is_admin ?? !1}
                    @change=${(t) => this.setUserPermission(e.id, "readers", t.target.checked)}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    aria-label=${`${e.name}: ${this.tr("canEdit")}`}
                    .checked=${!!e.is_admin || t.writers.includes(e.id)}
                    ?disabled=${e.is_admin ?? !1}
                    @change=${(t) => this.setUserPermission(e.id, "writers", t.target.checked)}
                  />
                </td>
                ${this.renderRoute(e, "push", n)}${this.renderRoute(e, "email", n)}
              </tr>`;
		})}
          </tbody>
        </table>
      </div>
      <p class="muted">${this.tr("routeHint")}</p>`;
	}
	renderHostSettings() {
		if (!this.capabilities?.reminders || !this.admin) return H;
		let e = this.hostSettings, t = this.hostDraft;
		if (!e || !t) return B`<section class="panel">
        <button @click=${this.loadHostSettings}>
          ${this.tr("integrationSettings")}
        </button>
      </section>`;
		let n = (e, t) => {
			this.hostDraftRevision++, this.hostDraft = {
				...this.hostDraft,
				[e]: t
			};
		};
		return B`<section class="panel">
      <h2>${this.tr("integrationSettings")}</h2>
      <form
        @submit=${async (e) => {
			e.preventDefault();
			let t = this.hostDraftRevision, n = await this.action("set_settings", {
				settings: this.hostDraft,
				confirm: !0
			}, "");
			n && (this.hostSettings = {
				...this.hostSettings,
				settings: n
			}, t === this.hostDraftRevision && (this.hostDraft = structuredClone(n)), this.announce("settingsSaved"));
		}}
      >
        <div class="form-grid" style="margin-top:18px">
          <div class="wide">${this.renderUserRoles(e, t)}</div>
          <label class="check wide"
            ><input
              type="checkbox"
              .checked=${t.reminders_enabled}
              @change=${(e) => n("reminders_enabled", e.target.checked)}
            />${this.tr("reminders_enabled")}</label
          >
          <label
            >${this.tr("lead_days")}<input
              type="number"
              min="0"
              max="30"
              required
              .value=${String(t.lead_days)}
              @input=${(e) => n("lead_days", Number(e.target.value))}
          /></label>
          <label
            >${this.tr("reminder_hour")}<input
              type="number"
              min="0"
              max="23"
              required
              .value=${String(t.reminder_hour)}
              @input=${(e) => n("reminder_hour", Number(e.target.value))}
          /></label>
          <label class="check wide"
            ><input
              type="checkbox"
              .checked=${t.shared_channel_enabled}
              @change=${(e) => n("shared_channel_enabled", e.target.checked)}
            />${this.tr("sharedChannelEnabled")}</label
          >
          <label
            >${this.tr("notify_service")}<select
              aria-label=${this.tr("notify_service")}
              ?disabled=${!t.shared_channel_enabled}
              @change=${(e) => {
			n("notify_service", e.target.value), this.hostDraft = {
				...this.hostDraft,
				notify_entity: ""
			};
		}}
            >
              <option value="" .selected=${!t.notify_service}>
                ${this.tr("noChannel")}
              </option>
              ${[.../* @__PURE__ */ new Set([...e.channels, ...t.notify_service ? [t.notify_service] : []])].map((e) => B`<option value=${e} .selected=${t.notify_service === e}>${e}</option>`)}
            </select></label
          >
          <label
            >${this.tr("notify_entity")}<input
              aria-describedby="notify-entity-help"
              placeholder="notify.…"
              ?disabled=${!t.shared_channel_enabled || t.notify_service !== "notify.send_message"}
              .value=${t.notify_entity}
              ?required=${t.shared_channel_enabled && t.notify_service === "notify.send_message"}
              @input=${(e) => n("notify_entity", e.target.value)}
          /></label>
          <label
            >${this.tr("reminderLanguage")}<select
              aria-label=${this.tr("reminderLanguage")}
              @change=${(e) => n("language", e.target.value)}
            >
              <option value="de" .selected=${t.language === "de"}>
                Deutsch
              </option>
              <option value="en" .selected=${t.language === "en"}>
                English
              </option>
            </select></label
          >
        </div>
        <p class="notice">
          ${this.tr("reminderInfo")} ${this.tr("reminderCatchup")}
        </p>
        <p class="muted" id="notify-entity-help">
          ${this.tr("notifyEntityHint")}
        </p>
        <button class="primary" type="submit" ?disabled=${this.busy}>
          ${this.tr("save")}
        </button>
      </form>
      <details>
        <summary>${this.tr("deliveryLog")}</summary>
        ${this.deliveries.length ? this.deliveries.map((e) => B`<p><span class="badge">${this.tr(e.state)}</span> ${e.description}</p>`) : B`<p>${this.tr("noDeliveries")}</p>`}
      </details>
    </section>`;
	}
	renderSettings() {
		return B`<div class="settings-grid">
      <section class="panel">
        <h2>${this.tr("language")}</h2>
        <p class="muted">${this.tr("languageHint")}</p>
        <label
          >${this.tr("language")}<select
            aria-label=${this.tr("language")}
            @change=${(e) => {
			this.languagePreference = e.target.value;
			try {
				localStorage.setItem("garden-planner-language", this.languagePreference);
			} catch {}
		}}
          >
            <option value="" .selected=${this.languagePreference === ""}>
              ${this.tr("automatic")}
            </option>
            <option value="de" .selected=${this.languagePreference === "de"}>
              Deutsch
            </option>
            <option value="en" .selected=${this.languagePreference === "en"}>
              English
            </option>
          </select></label
        >
        <dl>
          <dt>${this.tr("timezone")}</dt>
          <dd>${this.timeZone}</dd>
        </dl>
      </section>
      <section class="panel">
        <h2>${this.tr("dataSafety")}</h2>
        <p class="muted">${this.tr("dataSafetyBody")}</p>
        ${this.admin ? B`<div class="actions" style="justify-content:flex-start">
                  <button
                    ?disabled=${this.busy}
                    @click=${() => this.exportFile("json")}
                  >
                    ${this.tr("exportJson")}</button
                  ><button
                    ?disabled=${this.busy}
                    @click=${() => this.exportFile("csv")}
                  >
                    ${this.tr("exportCsv")}</button
                  ><button
                    ?disabled=${this.busy}
                    @click=${async () => {
			await this.action("backup", {}, "backupSaved") && await this.loadBackups();
		}}
                  >
                    ${this.tr("backup")}
                  </button>
                </div>
                <div class="filters" style="margin-top:20px">
                  <label
                    >${this.tr("importMode")}<select
                      @change=${(e) => {
			this.importMode = e.target.value;
		}}
                    >
                      <option value="merge">${this.tr("merge")}</option>
                      <option value="replace">${this.tr("replace")}</option>
                    </select></label
                  ><label
                    >${this.tr("importData")}<input
                      class="file-input"
                      type="file"
                      accept=".json,.zip"
                      ?disabled=${this.busy}
                      @change=${this.selectImport}
                  /></label>
                </div>
                <p class="muted">${this.tr("limitedTransport")}</p>
                <h3>${this.tr("backups")}</h3>
                ${this.backups.map((e) => B`<div class="item"><small class="item-content break">${e}</small><button ?disabled=${this.busy} @click=${() => this.previewRestore(e)}>${this.tr("restorePreview")}</button></div>`)}` : B`<p class="notice">${this.tr("adminOnly")}</p>`}
      </section>
      ${this.renderHostSettings()}
      <section class="panel" ?hidden=${this.capabilities?.reminders === !0}>
        <h2>${this.tr("notifications")}</h2>
        <p class="muted">${this.tr("notificationsHint")}</p>
      </section>
    </div>`;
	}
	render() {
		let e = this.page === "plants" ? ["newPlant", "plants"] : this.page === "locations" ? ["newLocation", "locations"] : ["newSowing", "cultivations"];
		return B`<header class="ha-navigation">
        <button
          type="button"
          class="icon"
          aria-label=${this.tr("haMenu")}
          title=${this.tr("haMenu")}
          @click=${() => this.dispatchEvent(new CustomEvent("hass-toggle-menu", {
			bubbles: !0,
			composed: !0
		}))}
        >
          ${$("menu")}
        </button>
        <span>Home Assistant</span>
      </header>
      <div class="app">
        <aside>
          <div class="brand">
            <span class="brand-icon">${$("plants")}</span>
            <div>
              <strong>Garden Planner</strong
              ><small
                >${this.language === "de" ? "WACHSEN & ERINNERN" : "GROW & REMEMBER"}</small
              >
            </div>
          </div>
          <nav aria-label="Garden Planner">
            ${Gn.map((e) => B`<button aria-current=${this.page === e ? "page" : H} @click=${() => this.navigate(e)}>${$(e)}${this.tr(e)}</button>`)}
          </nav>
          <div class="aside-footer">${this.tr("tagline")}</div>
        </aside>
        <main
          class=${this.page === "overview" ? "overview-page" : this.page === "cultures" && this.cultureView === "garden" ? "garden-page" : ""}
        >
          ${this.page === "overview" ? H : B`<div class="back-overview-bar"><button class="back-overview" aria-label=${this.tr("backOverview")} @click=${() => this.navigate("overview")}>← ${this.tr("backOverview")}</button></div>`}
          <header class="topbar">
            <div>
              <div class="eyebrow">Garden Planner</div>
              <h1>${this.tr(this.page)}</h1>
              <p class="muted">
                ${this.tr(this.page === "reminders" ? "personalSubtitle" : "overviewIntro")}
              </p>
            </div>
            <div class="actions">
              <button
                class="icon"
                aria-label=${this.tr("refresh")}
                ?disabled=${this.busy}
                @click=${() => this.refresh()}
              >
                ${$("refresh")}</button
              >${this.editable && ![
			"settings",
			"reminders",
			"neighbors",
			"seeds"
		].includes(this.page) ? B`<button class="primary" aria-label=${this.tr(e[0])} ?disabled=${this.busy || !this.loaded || e[1] === "cultivations" && !this.plantList.length} @click=${() => this.startEditor(e[1])}>${$("plus")}<span class="topbar-action-label">${this.tr(e[0])}</span></button>` : H}
            </div>
          </header>
          ${this.error ? B`<p class="notice error" role="alert">${this.error}<button class="link" @click=${() => this.refresh()}>${this.tr("retry")}</button></p>` : H}
          ${this.loaded && !this.editable && this.page !== "reminders" ? B`<p class="notice">${this.tr("readOnly")}</p>` : H}
          ${this.loaded ? this.page === "overview" ? this.renderOverview() : this.page === "calendar" ? this.renderCalendar() : this.page === "plants" ? B`${this.renderFilters()}${this.tables.plants.length ? this.filteredPlants().length ? B`<div class="grid">
                                ${pt(this.filteredPlants(), (e) => e.id, (e) => this.renderPlantCard(e))}
                              </div>` : this.empty("noResults") : this.empty("emptyPlants", "emptyPlantsBody", "newPlant", () => this.startEditor("plants"))}` : this.page === "cultures" ? this.renderCultures() : this.page === "history" ? B`<section class="panel">
                            ${this.renderHistory()}
                          </section>` : this.page === "locations" ? this.renderLocations() : this.page === "reminders" ? this.renderPersonalReminders() : this.page === "neighbors" ? this.renderNeighbors() : this.page === "seeds" ? this.renderSeeds() : this.renderSettings() : B`<p role="status">${this.tr("loading")}</p>`}
        </main>
      </div>
      ${this.renderDetail()}${this.renderEditor()}${this.renderReview()}${this.renderTaskConfirmation()}${this.renderNeighborEditor()}
      <dialog
        id="delete-dialog"
        aria-labelledby="delete-title"
        @cancel=${(e) => {
			this.busy && e.preventDefault();
		}}
        @close=${() => {
			this.deleting = null;
		}}
      >
        <div class="dialog-head">
          <h2 id="delete-title">${this.tr("deleteTitle")}</h2>
        </div>
        <div class="dialog-body">
          <p>${this.tr("deleteBody")}</p>
          ${this.error ? B`<p class="notice error" role="alert">${this.error}</p>` : H}
        </div>
        <div class="dialog-foot">
          <button
            ?disabled=${this.busy}
            @click=${() => {
			this.deleting = null;
		}}
          >
            ${this.tr("cancel")}</button
          ><button
            class="danger"
            ?disabled=${this.busy}
            @click=${this.removeRecord}
          >
            ${this.tr("confirmDelete")}
          </button>
        </div>
      </dialog>
      <div role="status" aria-live="polite">
        ${this.toast ? B`<div class="toast">${this.toast}</div>` : H}
      </div>`;
	}
};
customElements.get("garden-planner-panel") || customElements.define("garden-planner-panel", Jn);
export { Jn as GardenPlannerPanel };
