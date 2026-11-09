// src/types.ts
var e = [
	"plants",
	"varieties",
	"growing_windows",
	"locations",
	"cultivations",
	"cultivation_events",
	"tasks"
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
	tasks: []
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
function g(e, t, n, r = !1) {
	return new Intl.DateTimeFormat(n === "de" ? "de-DE" : "en-GB", {
		timeZone: "UTC",
		month: r ? "short" : "long",
		...r ? {} : { year: "numeric" }
	}).format(new Date(Date.UTC(e, t - 1, 15)));
}
function _(e, t) {
	let r = (r) => {
		let i = n(e, `${r}_month`) ?? 1;
		return `${n(e, `${r}_day`) ?? 1}. ${g(2e3, i, t, !0)}`;
	};
	return `${r("start")} – ${r("end")}`;
}
function v(e, n) {
	return n.filter((n) => t(n, "cultivation_id") === e.id).sort((e, n) => t(e, "date").localeCompare(t(n, "date")) || e.created_at.localeCompare(n.created_at) || e.id.localeCompare(n.id));
}
function y(e, n) {
	return t(v(e, n).at(-1), "status") || t(e, "initial_status") || "sown";
}
function b(e, n) {
	return t(v(e, n).find((e) => t(e, "status") === "sown"), "date");
}
function x(e, t) {
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
function S(e) {
	return e && typeof e == "object" && !Array.isArray(e) ? e : void 0;
}
function C(e) {
	let n = S(e.data.snapshot);
	if (!n) return;
	let r = {
		...S(n.plant),
		...S(n.variety)
	}, i = Array.isArray(n.windows) ? n.windows.filter((n) => {
		let r = S(n);
		return !r || r.activity !== t(e, "method") && r.method !== t(e, "method") ? !1 : u({
			...e,
			data: r
		}, t(e, "date"));
	}) : [];
	if (i.length > 1 && i.some((e) => {
		let t = S(e);
		return t && [
			"germination_min_c",
			"germination_optimal_min_c",
			"germination_optimal_max_c",
			"germination_max_c"
		].some((e) => e in t);
	})) return;
	i.length === 1 && (r = {
		...r,
		...S(i[0])
	});
	let a = r.germination_optimal_min_c, o = r.germination_optimal_max_c;
	return typeof a == "number" && typeof o == "number" ? {
		min: a,
		max: o
	} : void 0;
}
function w(e, n, r) {
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
function T(e, t) {
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
var E = globalThis, D = E.ShadowRoot && (E.ShadyCSS === void 0 || E.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, O = Symbol(), ee = /* @__PURE__ */ new WeakMap(), k = class {
	constructor(e, t, n) {
		if (this._$cssResult$ = !0, n !== O) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = e, this.t = t;
	}
	get styleSheet() {
		let e = this.o, t = this.t;
		if (D && e === void 0) {
			let n = t !== void 0 && t.length === 1;
			n && (e = ee.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), n && ee.set(t, e));
		}
		return e;
	}
	toString() {
		return this.cssText;
	}
}, A = (e) => new k(typeof e == "string" ? e : e + "", void 0, O), j = (e, ...t) => new k(e.length === 1 ? e[0] : t.reduce((t, n, r) => t + ((e) => {
	if (!0 === e._$cssResult$) return e.cssText;
	if (typeof e == "number") return e;
	throw Error("Value passed to 'css' function must be a 'css' function result: " + e + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
})(n) + e[r + 1], e[0]), e, O), M = (e, t) => {
	if (D) e.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
	else for (let n of t) {
		let t = document.createElement("style"), r = E.litNonce;
		r !== void 0 && t.setAttribute("nonce", r), t.textContent = n.cssText, e.appendChild(t);
	}
}, N = D ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((e) => {
	let t = "";
	for (let n of e.cssRules) t += n.cssText;
	return A(t);
})(e) : e, { is: P, defineProperty: te, getOwnPropertyDescriptor: F, getOwnPropertyNames: ne, getOwnPropertySymbols: I, getPrototypeOf: L } = Object, R = globalThis, z = R.trustedTypes, re = z ? z.emptyScript : "", ie = R.reactiveElementPolyfillSupport, B = (e, t) => e, ae = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? re : null;
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
}, oe = (e, t) => !P(e, t), se = {
	attribute: !0,
	type: String,
	converter: ae,
	reflect: !1,
	useDefault: !1,
	hasChanged: oe
};
Symbol.metadata ??= Symbol("metadata"), R.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var ce = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = se) {
		if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
			let n = Symbol(), r = this.getPropertyDescriptor(e, n, t);
			r !== void 0 && te(this.prototype, e, r);
		}
	}
	static getPropertyDescriptor(e, t, n) {
		let { get: r, set: i } = F(this.prototype, e) ?? {
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
		return this.elementProperties.get(e) ?? se;
	}
	static _$Ei() {
		if (this.hasOwnProperty(B("elementProperties"))) return;
		let e = L(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(B("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(B("properties"))) {
			let e = this.properties, t = [...ne(e), ...I(e)];
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
			for (let e of n) t.unshift(N(e));
		} else e !== void 0 && t.push(N(e));
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
		return M(e, this.constructor.elementStyles), e;
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
			let i = (n.converter?.toAttribute === void 0 ? ae : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? ae : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? oe)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
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
ce.elementStyles = [], ce.shadowRootOptions = { mode: "open" }, ce[B("elementProperties")] = /* @__PURE__ */ new Map(), ce[B("finalized")] = /* @__PURE__ */ new Map(), ie?.({ ReactiveElement: ce }), (R.reactiveElementVersions ??= []).push("2.1.2");
// node_modules/lit-html/lit-html.js
var le = globalThis, ue = (e) => e, de = le.trustedTypes, fe = de ? de.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, pe = "$lit$", V = `lit$${Math.random().toFixed(9).slice(2)}$`, me = "?" + V, he = `<${me}>`, ge = document, _e = () => ge.createComment(""), ve = (e) => e === null || typeof e != "object" && typeof e != "function", ye = Array.isArray, be = (e) => ye(e) || typeof e?.[Symbol.iterator] == "function", xe = "[ 	\n\f\r]", Se = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Ce = /-->/g, we = />/g, Te = RegExp(`>|${xe}(?:([^\\s"'>=/]+)(${xe}*=${xe}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), Ee = /'/g, De = /"/g, Oe = /^(?:script|style|textarea|title)$/i, ke = (e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}), H = ke(1), Ae = ke(2), je = Symbol.for("lit-noChange"), U = Symbol.for("lit-nothing"), Me = /* @__PURE__ */ new WeakMap(), Ne = ge.createTreeWalker(ge, 129);
function Pe(e, t) {
	if (!ye(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return fe === void 0 ? t : fe.createHTML(t);
}
var Fe = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = Se;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === Se ? c[1] === "!--" ? o = Ce : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = Te) : (Oe.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = Te) : o = we : o === Te ? c[0] === ">" ? (o = i ?? Se, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? Te : c[3] === "\"" ? De : Ee) : o === De || o === Ee ? o = Te : o === Ce || o === we ? o = Se : (o = Te, i = void 0);
		let d = o === Te && e[t + 1].startsWith("/>") ? " " : "";
		a += o === Se ? n + he : l >= 0 ? (r.push(s), n.slice(0, l) + pe + n.slice(l) + V + d) : n + V + (l === -2 ? t : d);
	}
	return [Pe(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, Ie = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = Fe(t, n);
		if (this.el = e.createElement(l, r), Ne.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = Ne.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(pe)) {
					let t = u[o++], n = i.getAttribute(e).split(V), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? Ve : r[1] === "?" ? He : r[1] === "@" ? Ue : Be
					}), i.removeAttribute(e);
				} else e.startsWith(V) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (Oe.test(i.tagName)) {
					let e = i.textContent.split(V), t = e.length - 1;
					if (t > 0) {
						i.textContent = de ? de.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], _e()), Ne.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], _e());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === me) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(V, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += V.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = ge.createElement("template");
		return n.innerHTML = e, n;
	}
};
function Le(e, t, n = e, r) {
	if (t === je) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = ve(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = Le(e, i._$AS(e, t.values), i, r)), t;
}
var Re = class {
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
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? ge).importNode(t, !0);
		Ne.currentNode = r;
		let i = Ne.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new ze(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new We(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = Ne.nextNode(), a++);
		}
		return Ne.currentNode = ge, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, ze = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = U, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
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
		e = Le(this, e, t), ve(e) ? e === U || e == null || e === "" ? (this._$AH !== U && this._$AR(), this._$AH = U) : e !== this._$AH && e !== je && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? be(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== U && ve(this._$AH) ? this._$AA.nextSibling.data = e : this.T(ge.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = Ie.createElement(Pe(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new Re(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = Me.get(e.strings);
		return t === void 0 && Me.set(e.strings, t = new Ie(e)), t;
	}
	k(t) {
		ye(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(_e()), this.O(_e()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = ue(e).nextSibling;
			ue(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, Be = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = U, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = U;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = Le(this, e, t, 0), a = !ve(e) || e !== this._$AH && e !== je, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = Le(this, r[n + o], t, o), s === je && (s = this._$AH[o]), a ||= !ve(s) || s !== this._$AH[o], s === U ? e = U : e !== U && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === U ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, Ve = class extends Be {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === U ? void 0 : e;
	}
}, He = class extends Be {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== U);
	}
}, Ue = class extends Be {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = Le(this, e, t, 0) ?? U) === je) return;
		let n = this._$AH, r = e === U && n !== U || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== U && (n === U || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, We = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		Le(this, e);
	}
}, Ge = {
	M: pe,
	P: V,
	A: me,
	C: 1,
	L: Fe,
	R: Re,
	D: be,
	V: Le,
	I: ze,
	H: Be,
	N: He,
	U: Ue,
	B: Ve,
	F: We
}, Ke = le.litHtmlPolyfillSupport;
Ke?.(Ie, ze), (le.litHtmlVersions ??= []).push("3.3.3");
var qe = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new ze(t.insertBefore(_e(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, Je = globalThis, Ye = class extends ce {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = qe(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return je;
	}
};
Ye._$litElement$ = !0, Ye.finalized = !0, Je.litElementHydrateSupport?.({ LitElement: Ye });
var Xe = Je.litElementPolyfillSupport;
Xe?.({ LitElement: Ye }), (Je.litElementVersions ??= []).push("4.2.2");
// node_modules/lit-html/directive.js
var Ze = {
	ATTRIBUTE: 1,
	CHILD: 2,
	PROPERTY: 3,
	BOOLEAN_ATTRIBUTE: 4,
	EVENT: 5,
	ELEMENT: 6
}, Qe = (e) => (...t) => ({
	_$litDirective$: e,
	values: t
}), $e = class {
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
}, { I: et } = Ge, tt = (e) => e, nt = () => document.createComment(""), rt = (e, t, n) => {
	let r = e._$AA.parentNode, i = t === void 0 ? e._$AB : t._$AA;
	if (n === void 0) n = new et(r.insertBefore(nt(), i), r.insertBefore(nt(), i), e, e.options);
	else {
		let t = n._$AB.nextSibling, a = n._$AM, o = a !== e;
		if (o) {
			let t;
			n._$AQ?.(e), n._$AM = e, n._$AP !== void 0 && (t = e._$AU) !== a._$AU && n._$AP(t);
		}
		if (t !== i || o) {
			let e = n._$AA;
			for (; e !== t;) {
				let t = tt(e).nextSibling;
				tt(r).insertBefore(e, i), e = t;
			}
		}
	}
	return n;
}, it = (e, t, n = e) => (e._$AI(t, n), e), at = {}, ot = (e, t = at) => e._$AH = t, st = (e) => e._$AH, ct = (e) => {
	e._$AR(), e._$AA.remove();
}, lt = (e, t, n) => {
	let r = /* @__PURE__ */ new Map();
	for (let i = t; i <= n; i++) r.set(e[i], i);
	return r;
}, ut = Qe(class extends $e {
	constructor(e) {
		if (super(e), e.type !== Ze.CHILD) throw Error("repeat() can only be used in text expressions");
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
		let i = st(e), { values: a, keys: o } = this.dt(t, n, r);
		if (!Array.isArray(i)) return this.ut = o, a;
		let s = this.ut ??= [], c = [], l, u, d = 0, f = i.length - 1, p = 0, m = a.length - 1;
		for (; d <= f && p <= m;) if (i[d] === null) d++;
		else if (i[f] === null) f--;
		else if (s[d] === o[p]) c[p] = it(i[d], a[p]), d++, p++;
		else if (s[f] === o[m]) c[m] = it(i[f], a[m]), f--, m--;
		else if (s[d] === o[m]) c[m] = it(i[d], a[m]), rt(e, c[m + 1], i[d]), d++, m--;
		else if (s[f] === o[p]) c[p] = it(i[f], a[p]), rt(e, i[d], i[f]), f--, p++;
		else if (l === void 0 && (l = lt(o, p, m), u = lt(s, d, f)), l.has(s[d])) {
			if (l.has(s[f])) {
				let t = u.get(o[p]), n = t === void 0 ? null : i[t];
				if (n === null) {
					let t = rt(e, i[d]);
					it(t, a[p]), c[p] = t;
				} else c[p] = it(n, a[p]), rt(e, i[d], n), i[t] = null;
				p++;
			} else ct(i[f]), f--;
		} else ct(i[d]), d++;
		for (; p <= m;) {
			let t = rt(e, c[m + 1]);
			it(t, a[p]), c[p++] = t;
		}
		for (; d <= f;) {
			let e = i[d++];
			e !== null && ct(e);
		}
		return this.ut = o, ot(e, c), je;
	}
}), dt = class {
	constructor(e) {
		this.hass = e;
	}
	command(e, t = {}) {
		return this.hass.fetchWithAuth && [
			"export",
			"preview_import",
			"import",
			"list",
			"history"
		].includes(e) ? this.hass.fetchWithAuth("/api/garden_planner/exchange", {
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
		}) : this.hass.callWS({
			type: "garden_planner/command",
			operation: e,
			parameters: t
		});
	}
	async load() {
		let t = await Promise.all(e.map((e) => this.command("list", { table: e })));
		return Object.fromEntries(e.map((e, n) => [e, t[n]]));
	}
	subscribe(e) {
		return this.hass.connection.subscribeMessage(e, { type: "garden_planner/subscribe" });
	}
}, ft = {
	multiFilterHint: "Mehrere Werte möglich. Ohne Auswahl werden alle angezeigt.",
	windowDetail: "Anbauzeitraum",
	recurringWindow: "Jährlich wiederkehrender Zeitraum",
	plantProfile: "Pflanzensteckbrief",
	openPlant: "Alle Pflanzendetails",
	editWindow: "Anbauzeitraum bearbeiten",
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
}, pt = {
	multiFilterHint: "Select multiple values. An empty selection shows all.",
	windowDetail: "Growing window",
	recurringWindow: "Annually recurring window",
	plantProfile: "Plant profile",
	openPlant: "All plant details",
	editWindow: "Edit growing window",
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
function mt(e, t) {
	return (e === "de" ? ft : pt)[t];
}
// src/i18n.ts
var ht = {
	overview: "Übersicht",
	calendar: "Aussaatkalender",
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
	newWindow: "Anbauzeitraum hinzufügen",
	newVariety: "Sorte hinzufügen",
	newEvent: "Ereignis erfassen",
	thisMonth: "Das ist diesen Monat möglich",
	upcoming: "Nächste Gartenarbeiten",
	allTasks: "Alle Aufgaben",
	allPlants: "Alle Pflanzen",
	noWindows: "Für diesen Monat sind keine Anbauzeiträume hinterlegt.",
	recommendation: "Aus deinen hinterlegten Zeiträumen. Boden, Standort und Witterung vor Ort prüfen.",
	emptyPlants: "Dein Garten beginnt mit einer Pflanze.",
	emptyPlantsBody: "Lege deine erste Pflanze an und halte ihre Anbauzeiträume fest. Deine Beobachtungen bleiben über Jahre erhalten.",
	emptyCultures: "Noch keine Aussaat dokumentiert.",
	emptyHistory: "Hier wächst deine Gartengeschichte.",
	emptyLocations: "Gib deinen Pflanzen einen Platz.",
	noResults: "Keine passenden Einträge gefunden.",
	possibleThisWeek: "Diese Woche möglich",
	noWeekWindows: "Keine passenden Anbauzeiträume in dieser Woche. Prüfe bei Bedarf die Filter oder die hinterlegten Zeiträume.",
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
	nextSowing: "Nächster Anbauzeitraum",
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
	windows: "Anbauzeiträume",
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
	noAllWindows: "Noch keine Anbauzeiträume hinterlegt.",
	noNotes: "Keine Notizen hinterlegt.",
	loading: "Dein Garten wird geladen …",
	refresh: "Aktualisieren",
	saved: "Gespeichert.",
	deleted: "Eintrag gelöscht.",
	copied: "Pflanze dupliziert.",
	readOnly: "Du kannst diesen gemeinsamen Garten ansehen. Zum Bearbeiten brauchst du eine Freigabe.",
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
}, gt = {
	overview: "Overview",
	calendar: "Sowing calendar",
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
	newWindow: "Add a growing window",
	newVariety: "Add a variety",
	newEvent: "Record an event",
	thisMonth: "What you can do this month",
	upcoming: "Next garden tasks",
	allTasks: "All tasks",
	allPlants: "All plants",
	noWindows: "No growing windows are recorded for this month.",
	recommendation: "Based on your growing windows. Check local soil, location and weather.",
	emptyPlants: "Your garden starts with a plant.",
	emptyPlantsBody: "Add your first plant and its growing windows. Keep your observations for years to come.",
	emptyCultures: "No sowings recorded yet.",
	emptyHistory: "Your garden story grows here.",
	emptyLocations: "Give your plants a place to grow.",
	noResults: "No matching records.",
	possibleThisWeek: "Possible this week",
	noWeekWindows: "No matching growing windows this week. Check the filters or your recorded periods.",
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
	nextSowing: "Next growing window",
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
	windows: "Growing windows",
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
	noAllWindows: "No growing windows recorded yet.",
	noNotes: "No notes recorded.",
	loading: "Loading your garden …",
	refresh: "Refresh",
	saved: "Saved.",
	deleted: "Record deleted.",
	copied: "Plant duplicated.",
	readOnly: "You can view this shared garden. Editing requires permission.",
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
function _t(e, t) {
	return (e === "de" ? ht : gt)[t] ?? mt(e, t) ?? t;
}
function vt(e, t) {
	return _t(e, {
		soil: "soilTemperature",
		care: "careActivity",
		completed: "completedStatus",
		successful: "successful"
	}[t] ?? t);
}
function yt(e, t) {
	let n = t && typeof t == "object" && "code" in t ? String(t.code) : "";
	return _t(e, [
		"invalid_data",
		"not_found",
		"conflict",
		"storage_error",
		"unauthorized",
		"not_loaded"
	].includes(n) ? n : "unexpected");
}
// src/fields.ts
var bt = [
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
], xt = [
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
], St = (e, t) => e.map((e) => ({
	value: e,
	label: vt(t, e)
})), Ct = (e, n) => e.map((e) => ({
	value: e.id,
	label: t(e, "name") || t(e, "title") || _t(n, "untitled")
}));
function W(e) {
	return xt.includes(e) || [
		"quantity",
		"temperature_c",
		"start_day",
		"end_day"
	].includes(e) ? {
		key: e,
		type: "number",
		min: e.endsWith("_c") ? void 0 : 0,
		step: e.includes("days") || e.endsWith("_day") ? "1" : "any"
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
function wt(e, n, r, i, a) {
	let o = (e, t, n = !1) => ({
		key: e,
		type: "select",
		options: St(t, i),
		required: n
	}), s = (e, t, n = !1, r = !1) => ({
		key: e,
		type: "select",
		options: Ct(t, i),
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
	return e === "plants" || e === "varieties" ? [
		...e === "varieties" ? [u] : [],
		...bt.map((e) => e === "category" ? {
			key: e,
			type: "select",
			options: St([.../* @__PURE__ */ new Set([
				"vegetables",
				"herbs",
				"flowers",
				"fruit",
				"other",
				...r.plants.map((e) => t(e, "category")).filter(Boolean)
			])], i)
		} : W(e)),
		...e === "plants" ? xt.map((e) => ({
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
				label: g(2e3, t + 1, i).replace(/\s*2000/, "")
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
function Tt(e, t, n = {}) {
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
			}
		}[e],
		...n
	};
}
function Et(e, t, n, r) {
	let i = {};
	for (let e of n) {
		if (e.disabled) continue;
		let n = t[e.key];
		if (n === "" || n == null) {
			if (e.required) throw Error("invalid_data");
			r && r.data[e.key] !== void 0 && (i[e.key] = null);
		} else i[e.key] = e.type === "number" || e.key.endsWith("_month") ? Number(n) : n;
	}
	e === "cultivation_events" && !r && (i.cultivation_id = t.cultivation_id);
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
var G = Uint8Array, K = Uint16Array, Dt = Int32Array, Ot = new G([
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
]), kt = new G([
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
]), At = new G([
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
]), jt = function(e, t) {
	for (var n = new K(31), r = 0; r < 31; ++r) n[r] = t += 1 << e[r - 1];
	for (var i = new Dt(n[30]), r = 1; r < 30; ++r) for (var a = n[r]; a < n[r + 1]; ++a) i[a] = a - n[r] << 5 | r;
	return {
		b: n,
		r: i
	};
}, Mt = jt(Ot, 2), Nt = Mt.b, Pt = Mt.r;
Nt[28] = 258, Pt[258] = 28;
for (var Ft = jt(kt, 0), It = Ft.b, Lt = Ft.r, Rt = new K(32768), q = 0; q < 32768; ++q) {
	var zt = (q & 43690) >> 1 | (q & 21845) << 1;
	zt = (zt & 52428) >> 2 | (zt & 13107) << 2, zt = (zt & 61680) >> 4 | (zt & 3855) << 4, Rt[q] = ((zt & 65280) >> 8 | (zt & 255) << 8) >> 1;
}
for (var J = (function(e, t, n) {
	for (var r = e.length, i = 0, a = new K(t); i < r; ++i) e[i] && ++a[e[i] - 1];
	var o = new K(t);
	for (i = 1; i < t; ++i) o[i] = o[i - 1] + a[i - 1] << 1;
	var s;
	if (n) {
		s = new K(1 << t);
		var c = 15 - t;
		for (i = 0; i < r; ++i) if (e[i]) for (var l = i << 4 | e[i], u = t - e[i], d = o[e[i] - 1]++ << u, f = d | (1 << u) - 1; d <= f; ++d) s[Rt[d] >> c] = l;
	} else for (s = new K(r), i = 0; i < r; ++i) e[i] && (s[i] = Rt[o[e[i] - 1]++] >> 15 - e[i]);
	return s;
}), Bt = new G(288), q = 0; q < 144; ++q) Bt[q] = 8;
for (var q = 144; q < 256; ++q) Bt[q] = 9;
for (var q = 256; q < 280; ++q) Bt[q] = 7;
for (var q = 280; q < 288; ++q) Bt[q] = 8;
for (var Vt = new G(32), q = 0; q < 32; ++q) Vt[q] = 5;
var Ht = /*#__PURE__*/ J(Bt, 9, 0), Ut = /*#__PURE__*/ J(Bt, 9, 1), Wt = /*#__PURE__*/ J(Vt, 5, 0), Gt = /*#__PURE__*/ J(Vt, 5, 1), Kt = function(e) {
	for (var t = e[0], n = 1; n < e.length; ++n) e[n] > t && (t = e[n]);
	return t;
}, Y = function(e, t, n) {
	var r = t / 8 | 0;
	return (e[r] | e[r + 1] << 8) >> (t & 7) & n;
}, qt = function(e, t) {
	var n = t / 8 | 0;
	return (e[n] | e[n + 1] << 8 | e[n + 2] << 16) >> (t & 7);
}, Jt = function(e) {
	return (e + 7) / 8 | 0;
}, Yt = function(e, t, n) {
	return (t == null || t < 0) && (t = 0), (n == null || n > e.length) && (n = e.length), new G(e.subarray(t, n));
}, Xt = [
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
	var r = Error(t || Xt[e]);
	if (r.code = e, Error.captureStackTrace && Error.captureStackTrace(r, X), !n) throw r;
	return r;
}, Zt = function(e, t, n, r) {
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
				var y = Jt(d) + 4, b = e[y - 4] | e[y - 3] << 8, x = y + b;
				if (x > i) {
					c && X(0);
					break;
				}
				s && l(f + b), n.set(e.subarray(y, x), f), t.b = f += b, t.p = d = x * 8, t.f = u;
				continue;
			}
			if (v == 1) p = Ut, m = Gt, h = 9, g = 5;
			else if (v == 2) {
				var S = Y(e, d, 31) + 257, C = Y(e, d + 10, 15) + 4, w = S + Y(e, d + 5, 31) + 1;
				d += 14;
				for (var T = new G(w), E = new G(19), D = 0; D < C; ++D) E[At[D]] = Y(e, d + D * 3, 7);
				d += C * 3;
				for (var O = Kt(E), ee = (1 << O) - 1, k = J(E, O, 1), D = 0; D < w;) {
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
				h = Kt(N), g = Kt(P), p = J(N, h, 1), m = J(P, g, 1);
			} else X(1);
			if (d > _) {
				c && X(0);
				break;
			}
		}
		s && l(f + 131072);
		for (var te = (1 << h) - 1, F = (1 << g) - 1, ne = d;; ne = d) {
			var j = p[qt(e, d) & te], I = j >> 4;
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
					var D = I - 257, R = Ot[D];
					L = Y(e, d, (1 << R) - 1) + Nt[D], d += R;
				}
				var z = m[qt(e, d) & F], re = z >> 4;
				z || X(3), d += z & 15;
				var P = It[re];
				if (re > 3) {
					var R = kt[re];
					P += qt(e, d) & (1 << R) - 1, d += R;
				}
				if (d > _) {
					c && X(0);
					break;
				}
				s && l(f + 131072);
				var ie = f + L;
				if (f < P) {
					var B = a - P, ae = Math.min(P, ie);
					for (B + f < 0 && X(3); f < ae; ++f) n[f] = r[B + f];
				}
				for (; f < ie; ++f) n[f] = n[f - P];
			}
		}
		t.l = p, t.p = ne, t.b = f, t.f = u, p && (u = 1, t.m = h, t.d = m, t.n = g);
	} while (!u);
	return f != n.length && o ? Yt(n, 0, f) : n.subarray(0, f);
}, Z = function(e, t, n) {
	n <<= t & 7;
	var r = t / 8 | 0;
	e[r] |= n, e[r + 1] |= n >> 8;
}, Qt = function(e, t, n) {
	n <<= t & 7;
	var r = t / 8 | 0;
	e[r] |= n, e[r + 1] |= n >> 8, e[r + 2] |= n >> 16;
}, $t = function(e, t) {
	for (var n = [], r = 0; r < e.length; ++r) e[r] && n.push({
		s: r,
		f: e[r]
	});
	var i = n.length, a = n.slice();
	if (!i) return {
		t: sn,
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
	var p = new K(f + 1), m = en(n[u - 1], p, 0);
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
}, en = function(e, t, n) {
	return e.s == -1 ? Math.max(en(e.l, t, n + 1), en(e.r, t, n + 1)) : t[e.s] = n;
}, tn = function(e) {
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
}, nn = function(e, t) {
	for (var n = 0, r = 0; r < t.length; ++r) n += e[r] * t[r];
	return n;
}, rn = function(e, t, n) {
	var r = n.length, i = Jt(t + 2);
	e[i] = r & 255, e[i + 1] = r >> 8, e[i + 2] = e[i] ^ 255, e[i + 3] = e[i + 1] ^ 255;
	for (var a = 0; a < r; ++a) e[i + a + 4] = n[a];
	return (i + 4 + r) * 8;
}, an = function(e, t, n, r, i, a, o, s, c, l, u) {
	Z(t, u++, n), ++i[256];
	for (var d = $t(i, 15), f = d.t, p = d.l, m = $t(a, 15), h = m.t, g = m.l, _ = tn(f), v = _.c, y = _.n, b = tn(h), x = b.c, S = b.n, C = new K(19), w = 0; w < v.length; ++w) ++C[v[w] & 31];
	for (var w = 0; w < x.length; ++w) ++C[x[w] & 31];
	for (var T = $t(C, 7), E = T.t, D = T.l, O = 19; O > 4 && !E[At[O - 1]]; --O);
	var ee = l + 5 << 3, k = nn(i, Bt) + nn(a, Vt) + o, A = nn(i, f) + nn(a, h) + o + 14 + 3 * O + nn(C, E) + 2 * C[16] + 3 * C[17] + 7 * C[18];
	if (c >= 0 && ee <= k && ee <= A) return rn(t, u, e.subarray(c, c + l));
	var j, M, N, P;
	if (Z(t, u, 1 + (A < k)), u += 2, A < k) {
		j = J(f, p, 0), M = f, N = J(h, g, 0), P = h;
		var te = J(E, D, 0);
		Z(t, u, y - 257), Z(t, u + 5, S - 1), Z(t, u + 10, O - 4), u += 14;
		for (var w = 0; w < O; ++w) Z(t, u + 3 * w, E[At[w]]);
		u += 3 * O;
		for (var F = [v, x], ne = 0; ne < 2; ++ne) for (var I = F[ne], w = 0; w < I.length; ++w) {
			var L = I[w] & 31;
			Z(t, u, te[L]), u += E[L], L > 15 && (Z(t, u, I[w] >> 5 & 127), u += I[w] >> 12);
		}
	} else j = Ht, M = Bt, N = Wt, P = Vt;
	for (var w = 0; w < s; ++w) {
		var R = r[w];
		if (R > 255) {
			var L = R >> 18 & 31;
			Qt(t, u, j[L + 257]), u += M[L + 257], L > 7 && (Z(t, u, R >> 23 & 31), u += Ot[L]);
			var z = R & 31;
			Qt(t, u, N[z]), u += P[z], z > 3 && (Qt(t, u, R >> 5 & 8191), u += kt[z]);
		} else Qt(t, u, j[R]), u += M[R];
	}
	return Qt(t, u, j[256]), u + M[256];
}, on = /*#__PURE__*/ new Dt([
	65540,
	131080,
	131088,
	131104,
	262176,
	1048704,
	1048832,
	2114560,
	2117632
]), sn = /*#__PURE__*/ new G(0), cn = function(e, t, n, r, i, a) {
	var o = a.z || e.length, s = new G(r + o + 5 * (1 + Math.ceil(o / 7e3)) + i), c = s.subarray(r, s.length - i), l = a.l, u = (a.r || 0) & 7;
	if (t) {
		u && (c[0] = a.r >> 3);
		for (var d = on[t - 1], f = d >> 13, p = d & 8191, m = (1 << n) - 1, h = a.p || new K(32768), g = a.h || new K(m + 1), _ = Math.ceil(n / 3), v = 2 * _, y = function(t) {
			return (e[t] ^ e[t + 1] << _ ^ e[t + 2] << v) & m;
		}, b = new Dt(25e3), x = new K(288), S = new K(32), C = 0, w = 0, T = a.i || 0, E = 0, D = a.w || 0, O = 0; T + 2 < o; ++T) {
			var ee = y(T), k = T & 32767, A = g[ee];
			if (h[k] = A, g[ee] = k, D <= T) {
				var j = o - T;
				if ((C > 7e3 || E > 24576) && (j > 423 || !l)) {
					u = an(e, c, 0, b, x, S, w, E, O, T - O, u), E = C = w = 0, O = T;
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
								var ie = T - F + M & 32767, B = ie - h[ie] & 32767;
								B > re && (re = B, A = ie);
							}
						}
					}
					k = A, A = h[k], F += k - A & 32767;
				}
				if (P) {
					b[E++] = 268435456 | Pt[N] << 18 | Lt[P];
					var ae = Pt[N] & 31, oe = Lt[P] & 31;
					w += Ot[ae] + kt[oe], ++x[257 + ae], ++S[oe], D = T + N, ++C;
				} else b[E++] = e[T], ++x[e[T]];
			}
		}
		for (T = Math.max(T, D); T < o; ++T) b[E++] = e[T], ++x[e[T]];
		u = an(e, c, l, b, x, S, w, E, O, T - O, u), l || (a.r = u & 7 | c[u / 8 | 0] << 3, u -= 7, a.h = g, a.p = h, a.i = T, a.w = D);
	} else {
		for (var T = a.w || 0; T < o + l; T += 65535) {
			var se = T + 65535;
			se >= o && (c[u / 8 | 0] = l, se = o), u = rn(c, u + 1, e.subarray(T, se));
		}
		a.i = o;
	}
	return Yt(s, 0, r + Jt(u) + i);
}, ln = /*#__PURE__*/ (function() {
	for (var e = /* @__PURE__ */ new Int32Array(256), t = 0; t < 256; ++t) {
		for (var n = t, r = 9; --r;) n = (n & 1 && -306674912) ^ n >>> 1;
		e[t] = n;
	}
	return e;
})(), un = function() {
	var e = -1;
	return {
		p: function(t) {
			for (var n = e, r = 0; r < t.length; ++r) n = ln[n & 255 ^ t[r]] ^ n >>> 8;
			e = n;
		},
		d: function() {
			return ~e;
		}
	};
}, dn = function(e, t, n, r, i) {
	if (!i && (i = { l: 1 }, t.dictionary)) {
		var a = t.dictionary.subarray(-32768), o = new G(a.length + e.length);
		o.set(a), o.set(e, a.length), e = o, i.w = a.length;
	}
	return cn(e, t.level == null ? 6 : t.level, t.mem == null ? i.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(e.length))) * 1.5) : 20 : 12 + t.mem, n, r, i);
}, fn = function(e, t) {
	var n = {};
	for (var r in e) n[r] = e[r];
	for (var r in t) n[r] = t[r];
	return n;
}, pn = function(e, t) {
	return e[t] | e[t + 1] << 8;
}, mn = function(e, t) {
	return (e[t] | e[t + 1] << 8 | e[t + 2] << 16 | e[t + 3] << 24) >>> 0;
}, hn = function(e, t) {
	return mn(e, t) + mn(e, t + 4) * 4294967296;
}, Q = function(e, t, n) {
	for (; n; ++t) e[t] = n, n >>>= 8;
};
function gn(e, t) {
	return dn(e, t || {}, 0, 0);
}
var _n = /* @__PURE__ */ function() {
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
		var t = this.s.b, n = Zt(this.p, this.s, this.o);
		this.ondata(Yt(n, t, this.s.b), this.d), this.o = Yt(n, this.s.b - 32768), this.s.b = this.o.length, this.p = Yt(this.p, this.s.p / 8 | 0), this.s.p &= 7;
	}, e.prototype.push = function(e, t) {
		this.e(e), this.c(t);
	}, e;
}(), vn = function(e, t, n, r) {
	for (var i in e) {
		var a = e[i], o = t + i, s = r;
		Array.isArray(a) && (s = fn(r, a[1]), a = a[0]), ArrayBuffer.isView(a) ? n[o] = [a, s] : (n[o += "/"] = [new G(0), s], vn(a, o, n, r));
	}
}, yn = typeof TextEncoder < "u" && /*#__PURE__*/ new TextEncoder(), bn = typeof TextDecoder < "u" && /*#__PURE__*/ new TextDecoder();
try {
	bn.decode(sn, { stream: !0 });
} catch {}
var xn = function(e) {
	for (var t = "", n = 0;;) {
		var r = e[n++], i = (r > 127) + (r > 223) + (r > 239);
		if (n + i > e.length) return {
			s: t,
			r: Yt(e, n - 1)
		};
		i ? i == 3 ? (r = ((r & 15) << 18 | (e[n++] & 63) << 12 | (e[n++] & 63) << 6 | e[n++] & 63) - 65536, t += String.fromCharCode(55296 | r >> 10, 56320 | r & 1023)) : i & 1 ? t += String.fromCharCode((r & 31) << 6 | e[n++] & 63) : t += String.fromCharCode((r & 15) << 12 | (e[n++] & 63) << 6 | e[n++] & 63) : t += String.fromCharCode(r);
	}
};
function Sn(e, t) {
	if (t) {
		for (var n = new G(e.length), r = 0; r < e.length; ++r) n[r] = e.charCodeAt(r);
		return n;
	}
	if (yn) return yn.encode(e);
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
	return Yt(a, 0, o);
}
function Cn(e, t) {
	if (t) {
		for (var n = "", r = 0; r < e.length; r += 16384) n += String.fromCharCode.apply(null, e.subarray(r, r + 16384));
		return n;
	}
	if (bn) return bn.decode(e);
	var i = xn(e), a = i.s, n = i.r;
	return n.length && X(8), a;
}
var wn = function(e, t, n, r, i, a, o) {
	var s = i == 4294967295, c = a == 4294967295, l = o == 4294967295, u = t + n, d = s + c + l;
	if (r && d) {
		for (; t + 4 < u; t += 4 + pn(e, t + 2)) if (pn(e, t) == 1) return [
			s ? hn(e, t + 4 + 8 * c) : i,
			c ? hn(e, t + 4) : a,
			l ? hn(e, t + 4 + 8 * (c + s)) : o,
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
}, Tn = function(e) {
	var t = 0;
	if (e) for (var n in e) {
		var r = e[n].length;
		r > 65535 && X(9), t += r + 4;
	}
	return t;
}, En = function(e, t, n, r, i, a, o, s) {
	var c = r.length, l = n.extra, u = s && s.length, d = Tn(l);
	Q(e, t, o == null ? 67324752 : 33639248), t += 4, o != null && (e[t++] = 20, e[t++] = n.os), e[t] = 20, t += 2, e[t++] = n.flag << 1 | (a < 0 && 8), e[t++] = i && 8, e[t++] = n.compression & 255, e[t++] = n.compression >> 8;
	var f = new Date(n.mtime == null ? Date.now() : n.mtime), p = f.getFullYear() - 1980;
	if ((p < 0 || p > 119) && X(10), Q(e, t, p << 25 | f.getMonth() + 1 << 21 | f.getDate() << 16 | f.getHours() << 11 | f.getMinutes() << 5 | f.getSeconds() >> 1), t += 4, a != -1 && (Q(e, t, n.crc), Q(e, t + 4, a < 0 ? -a - 2 : a), Q(e, t + 8, n.size)), Q(e, t + 12, c), Q(e, t + 14, d), t += 16, o != null && (Q(e, t, u), Q(e, t + 6, n.attrs), Q(e, t + 10, o), t += 14), e.set(r, t), t += c, d) for (var m in l) {
		var h = l[m], g = h.length;
		Q(e, t, +m), Q(e, t + 2, g), e.set(h, t + 4), t += 4 + g;
	}
	return u && (e.set(s, t), t += u), t;
}, Dn = function(e, t, n, r, i) {
	Q(e, t, 101010256), Q(e, t + 8, n), Q(e, t + 10, n), Q(e, t + 12, r), Q(e, t + 16, i);
};
function On(e, t) {
	t ||= {};
	var n = {}, r = [];
	vn(e, "", n, t);
	var i = 0, a = 0;
	for (var o in n) {
		var s = n[o], c = s[0], l = s[1], u = l.level == 0 ? 0 : 8, d = Sn(o), f = d.length, p = l.comment, m = p && Sn(p), h = m && m.length, g = Tn(l.extra);
		f > 65535 && X(11);
		var _ = u ? gn(c, l) : c, v = _.length, y = un();
		y.p(c), r.push(fn(l, {
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
		En(b, d.o, d, d.f, d.u, d.c.length);
		var w = 30 + d.f.length + Tn(d.extra);
		b.set(d.c, d.o + w), En(b, i, d, d.f, d.u, d.c.length, d.o, d.m), i += 16 + w + (d.m ? d.m.length : 0);
	}
	return Dn(b, i, r.length, S, x), b;
}
var kn = /* @__PURE__ */ function() {
	function e() {}
	return e.prototype.push = function(e, t) {
		this.ondata(null, e, t);
	}, e.compression = 0, e;
}(), An = /* @__PURE__ */ function() {
	function e() {
		var e = this;
		this.i = new _n(function(t, n) {
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
}(), jn = /* @__PURE__ */ function() {
	function e(e) {
		this.onfile = e, this.k = [], this.o = { 0: kn }, this.p = sn;
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
				var e = mn(c, o);
				if (e == 67324752) {
					a = 1, s = o, p.d = null, p.c = 0;
					var t = pn(c, o + 6), r = pn(c, o + 8), i = t & 2048, d = t & 8, f = pn(c, o + 26), m = pn(c, o + 28);
					if (l > o + 30 + f + m) {
						var h = [];
						p.k.unshift(h), a = 2;
						var g = mn(c, o + 18), _ = mn(c, o + 22), v = Cn(c.subarray(o + 30, o += 30 + f), !i), y = wn(c, o, m, 2, g, _, 0), b = y[0], x = y[1], S = y[3];
						d && (b = -1 - S), o += m, p.c = b;
						var C, w = {
							name: v,
							compression: r,
							start: function() {
								if (w.ondata || X(5), !b) w.ondata(null, sn, !0);
								else {
									var e = n.o[r];
									e || w.ondata(X(14, "unknown compression type " + r, 1), null, !1), C = b < 0 ? new e(v) : new e(v, b, x), C.ondata = function(e, t, n) {
										w.ondata(e, t, n);
									};
									for (var t = 0, i = h; t < i.length; t++) {
										var a = i[t];
										C.push(a, !1);
									}
									n.k[0] == h && n.c ? n.d = C : C.push(sn, !0);
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
			if (this.p = sn, u < 0) {
				var m = a ? c.subarray(0, s - 12 - (u == -2 && 8) - (mn(c, s - 16) == 134695760 && 4)) : c.subarray(0, o);
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
function Mn(e, t, n) {
	let r = URL.createObjectURL(new Blob([e], { type: n })), i = document.createElement("a");
	i.href = r, i.download = t, i.click(), setTimeout(() => URL.revokeObjectURL(r), 1e3);
}
function Nn(e) {
	return On(Object.fromEntries(Object.entries(e).map(([e, t]) => [e, [Sn(t), { mtime: /* @__PURE__ */ new Date("2000-01-01T00:00:00Z") }]])), { level: 6 });
}
function Pn(t) {
	if (t.byteLength > 20971520) throw Error("invalid_file");
	let n = /* @__PURE__ */ new Set(["metadata.json", ...e.map((e) => `${e}.csv`)]), r = {}, i = 0, a, o = new jn((e) => {
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
				r[e.name] = Cn(n);
			}
		}, e.start();
	});
	if (o.register(An), o.push(t, !0), a || Object.keys(r).length !== n.size) throw Error("invalid_file");
	return r;
}
// src/styles.ts
var Fn = j`
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
  .harvest {
    --bar-color: #b97856;
  }
  .multi-filter {
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
  }
  .multi-filter summary {
    min-height: 44px;
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
  }
  .multi-filter-options p {
    margin-top: 0;
    font-size: 12px;
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
`, In = [
	"overview",
	"calendar",
	"plants",
	"cultures",
	"history",
	"locations",
	"settings"
], Ln = [
	"indoors",
	"direct",
	"prick_out",
	"transplant",
	"care",
	"harvest",
	"other"
], Rn = {
	menu: "M3 6h18M3 12h18M3 18h18",
	overview: "M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z",
	calendar: "M4 5h16v16H4zM8 2v6m8-6v6M4 10h16",
	plants: "M12 21V10M12 15C3 15 3 6 3 6s9-1 9 9zm0-5c0-8 9-8 9-8s1 9-9 8z",
	cultures: "M5 20h14l2-10H3zM12 10V4m0 4C6 8 6 3 6 3s6 0 6 5zm0-2c0-5 6-5 6-5s0 5-6 5z",
	history: "M3 11a9 9 0 1 1 2 7M3 4v7h7m2-4v6l4 2",
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
	return Ae`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${Rn[e] ?? Rn.plants}></path></svg>`;
}
function zn() {
	try {
		return localStorage.getItem("garden-planner-language") ?? "";
	} catch {
		return "";
	}
}
var Bn = class extends Ye {
	constructor(...e) {
		super(...e), this.capabilities = null, this.hostSettings = null, this.hostDraftRevision = 0, this.hostDraft = null, this.deliveries = [], this.page = "overview", this.tables = r(), this.loaded = !1, this.busy = !1, this.error = "", this.toast = "", this.languagePreference = zn(), this.query = "", this.category = "", this.method = "", this.sort = "name", this.showArchived = !1, this.calendarMode = "month", this.anchor = "", this.calendarCategories = [], this.calendarActivities = [], this.selected = null, this.editor = null, this.sensorOpen = !1, this.sensorIndex = -1, this.sensorAbove = !1, this.sensorMaxHeight = 240, this.deleting = null, this.reviewed = null, this.importMode = "merge", this.replaceConfirmed = !1, this.backups = [], this.historyYear = "", this.historyPlant = "", this.boundUser = "", this.connectionGeneration = 0, this.loadGeneration = 0, this.reconnect = () => {
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
		};
	}
	static {
		this.styles = Fn;
	}
	static {
		this.properties = {
			hass: { attribute: !1 },
			narrow: { type: Boolean },
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
		return _t(this.language, e);
	}
	lab(e) {
		return vt(this.language, e);
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
		super.connectedCallback(), this.addEventListener("click", this.rememberTrigger, !0), this.renderRoot.addEventListener("close", this.restoreDialogFocus, !0), this.renderRoot.addEventListener("scroll", this.positionSensorOptions, !0), window.addEventListener("resize", this.positionSensorOptions), window.visualViewport?.addEventListener("resize", this.positionSensorOptions), window.visualViewport?.addEventListener("scroll", this.positionSensorOptions), this.hass && this.bind();
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.removeEventListener("click", this.rememberTrigger, !0), this.renderRoot.removeEventListener("scroll", this.positionSensorOptions, !0), window.removeEventListener("resize", this.positionSensorOptions), window.visualViewport?.removeEventListener("resize", this.positionSensorOptions), window.visualViewport?.removeEventListener("scroll", this.positionSensorOptions), this.renderRoot.removeEventListener("close", this.restoreDialogFocus, !0), this.connectionGeneration++, this.loadGeneration++, this.boundConnection?.removeEventListener?.("ready", this.reconnect), this.unsubscribe?.().catch(() => void 0), this.unsubscribe = void 0, this.boundConnection = void 0, this.toastTimer && clearTimeout(this.toastTimer);
	}
	willUpdate(e) {
		e.has("hass") && this.isConnected && (this.hass?.connection !== this.boundConnection || this.hass?.user?.id !== this.boundUser) && this.bind();
	}
	updated() {
		this.setAttribute("lang", this.language), this.hass?.themes && this.toggleAttribute("dark", this.hass.themes.darkMode), this.syncDialog("detail-dialog", this.selected !== null), this.syncDialog("editor-dialog", this.editor !== null), this.syncDialog("delete-dialog", this.deleting !== null), this.syncDialog("review-dialog", this.reviewed !== null);
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
		let e = ++this.connectionGeneration;
		if (this.loadGeneration++, this.boundConnection?.removeEventListener?.("ready", this.reconnect), this.unsubscribe?.().catch(() => void 0), this.unsubscribe = void 0, this.boundConnection = this.hass?.connection, this.boundUser = this.hass?.user?.id ?? "", this.api = this.hass?.user ? new dt(this.hass) : void 0, this.tables = r(), this.capabilities = null, this.hostSettings = null, this.hostDraft = null, this.deliveries = [], this.loaded = !1, this.selected = null, this.editor = null, this.deleting = null, this.reviewed = null, this.backups = [], this.lastTrigger = void 0, this.dialogTriggers.clear(), this.error = "", this.toast = "", this.busy = !1, this.toastTimer && clearTimeout(this.toastTimer), this.api && this.boundConnection) {
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
			this.tables = t, this.capabilities = n, this.loaded = !0, this.error = "";
		} catch (t) {
			e === this.loadGeneration && (this.error = yt(this.language, t), t && typeof t == "object" && "code" in t && t.code === "unauthorized" && (this.tables = r(), this.capabilities = null, this.selected = null, this.editor = null, this.loaded = !0));
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
			r === this.connectionGeneration && (this.error = yt(this.language, e));
			return;
		} finally {
			r === this.connectionGeneration && (this.busy = !1);
		}
	}
	navigate(e) {
		this.page = e, this.error = "", e === "settings" && this.admin && (this.loadBackups(), this.loadHostSettings());
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
		return Ln.indexOf(t(e, "activity")) - Ln.indexOf(t(n, "activity")) || Number(e.data.start_month) - Number(n.data.start_month) || Number(e.data.start_day) - Number(n.data.start_day) || this.nameFor(t(e, "plant_id"), "plants").localeCompare(this.nameFor(t(n, "plant_id"), "plants"), this.language) || e.id.localeCompare(n.id);
	}
	status(e) {
		return y(e, this.tables.cultivation_events);
	}
	startEditor(e, t, n = {}) {
		this.sensorOpen = !1, this.sensorIndex = -1, this.error = "", this.editor = {
			table: e,
			record: t,
			draft: t ? structuredClone(t.data) : Tt(e, this.timeZone, n)
		};
	}
	fieldList(e) {
		return wt(e.table, e.draft, this.tables, this.language, !!e.record);
	}
	changeField(e, n) {
		if (!this.editor) return;
		let r = {
			...this.editor.draft,
			[e]: n
		};
		if (e === "plant_id" && !this.editor.record && (r = {
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
		if (e.preventDefault(), !this.editor || this.busy || !e.currentTarget.reportValidity()) return;
		let t = this.editor, n;
		try {
			n = Et(t.table, t.draft, this.fieldList(t), t.record);
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
		let t = String(this.editor?.draft.sensor_entity_id ?? ""), n = T(this.hass, t), r = this.sensorOpen && this.sensorIndex >= 0 && this.sensorIndex < n.length;
		return H`<div class="sensor-field">
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
          aria-activedescendant=${r ? `temperature-sensor-option-${this.sensorIndex}` : U}
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
          ${n.map((e, t) => H`<button
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
          ${n.length ? U : H`<div class="sensor-empty" role="option" aria-disabled="true">${this.tr("noSensors")}</div>`}
        </div>
      </div>
    </div>`;
	}
	renderField(e) {
		if (e.key === "sensor_entity_id") return this.renderSensorField(e);
		let t = this.editor.draft[e.key], n = (t) => this.changeField(e.key, t.target.value), r = `field-${e.key}`;
		return H`<label
      class=${[e.type === "textarea" || e.wide ? "wide" : "", e.rowStart ? "row-start" : ""].filter(Boolean).join(" ")}
      for=${r}
    >
      <span id=${`${r}-label`}
        >${this.tr(e.key)}${e.required ? " *" : ""}</span
      >
      ${e.type === "select" ? H`<select
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
              ${e.options?.map((e) => H`<option value=${e.value} .selected=${String(t ?? "") === e.value}>${e.label}</option>`)}
            </select>` : e.type === "textarea" ? H`<textarea
                id=${r}
                aria-labelledby=${`${r}-label`}
                name=${e.key}
                .value=${String(t ?? "")}
                ?disabled=${this.busy}
                maxlength="20000"
                @input=${n}
              ></textarea>` : H`<input
                id=${r}
                aria-labelledby=${`${r}-label`}
                name=${e.key}
                type=${e.type ?? "text"}
                .value=${String(t ?? "")}
                ?required=${e.required}
                ?disabled=${e.disabled || this.busy}
                min=${e.min ?? U}
                max=${e.max ?? U}
                step=${e.step ?? "any"}
                maxlength="20000"
                @input=${n}
              />`}
    </label>`;
	}
	renderEditor() {
		let e = this.editor;
		return H`<dialog
      id="editor-dialog"
      aria-labelledby="editor-title"
      @cancel=${(e) => {
			this.busy && e.preventDefault();
		}}
      @close=${() => {
			this.editor = null;
		}}
    >
      ${e ? H`<form @submit=${this.saveEditor}>
              <div class="dialog-head">
                <h2 id="editor-title">
                  ${this.tr(e.record ? "edit" : {
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
                ${this.error ? H`<p class="notice error" role="alert">${this.error}</p>` : U}
                ${[
			"plants",
			"varieties",
			"growing_windows",
			"cultivations",
			"locations"
		].includes(e.table) ? H`<p class="notice">${this.tr("temperatureHint")}</p>` : U}
                ${e.draft.origin === "initial" ? H`<p class="notice">${this.tr("initialEventHint")}</p>` : U}
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
                ><button class="primary" type="submit" ?disabled=${this.busy}>
                  ${this.tr(this.busy ? "busy" : "save")}
                </button>
              </div>
            </form>` : U}
    </dialog>`;
	}
	renderMultiFilter(e, t, n) {
		let r = this.tr(e === "category" ? "allCategories" : "allActivities");
		return H`<fieldset class="multi-filter">
      <legend>${this.tr(e)}</legend>
      <details>
        <summary>
          ${n.length ? n.map((e) => this.lab(e)).join(" · ") : r}
        </summary>
        <div class="multi-filter-options">
          <p class="muted">${this.tr("multiFilterHint")}</p>
          ${t.map((t) => H`<label class="check"
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
    </fieldset>`;
	}
	calendarActivityMatches(e) {
		return !this.calendarActivities.length || this.calendarActivities.includes(e);
	}
	renderFilters(e = !1) {
		return H`<div class="filters">
      <label
        >${this.tr("search")}<input
          type="search"
          .value=${this.query}
          @input=${(e) => {
			this.query = e.target.value;
		}}
      /></label>
      ${e ? H`${this.renderMultiFilter("category", this.categories, this.calendarCategories)}${this.renderMultiFilter("activity", Ln, this.calendarActivities)}` : H`
              <label
                >${this.tr("category")}<select
                  aria-label=${this.tr("category")}
                  @change=${(e) => {
			this.category = e.target.value;
		}}
                >
                  <option value="">${this.tr("allCategories")}</option>
                  ${this.categories.map((e) => H`<option value=${e} .selected=${this.category === e}>${this.lab(e)}</option>`)}
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
		].map((e) => H`<option value=${e} .selected=${this.method === e}>${this.lab(e)}</option>`)}
                </select></label
              >
            `}
      ${e ? U : H`<label
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
		return H`<div class="empty">
      ${$("plants")}
      <h2>${this.tr(e)}</h2>
      ${t ? H`<p>${this.tr(t)}</p>` : U}${n && this.editable ? H`<button class="primary" @click=${r}>${$("plus")}${this.tr(n)}</button>` : U}
    </div>`;
	}
	renderPlantCard(e) {
		let n = this.plantWindows(e.id), r = n.length ? p(n, this.today) : void 0;
		return H`<article class="plant">
      <div class="plant-title">
        <div class="plant-symbol">${$("plants")}</div>
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
          <small
            >${t(e, "botanical_name") || this.lab(t(e, "category"))}</small
          >
        </div>
      </div>
      <div>
        <span class="badge"
          >${this.lab(t(e, "category")) || this.tr("other")}</span
        >${e.data.archived ? H` <span class="badge unknown">${this.tr("archived")}</span>` : U}
      </div>
      <p class="muted">
        ${r ? `${this.tr("nextSowing")} · ${h(r, this.language)}` : this.tr("noAllWindows")}
      </p>
      <div class="actions">
        <button
          @click=${() => {
			this.selected = {
				kind: "plant",
				id: e.id
			};
		}}
        >
          ${this.tr("details")}${$("arrow")}</button
        >${this.editable && !e.data.archived ? H`<button class="icon" aria-label=${`${this.tr("newSowing")}: ${t(e, "name")}`} @click=${() => this.startEditor("cultivations", void 0, { plant_id: e.id })}>${$("plus")}</button>` : U}
      </div>
    </article>`;
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
		return H`<section class="hero">
        <div>
          <div class="eyebrow">${this.tr("garden")}</div>
          <h2>${this.tr("welcome")}</h2>
          <p>${this.tr("tagline")}</p>
          <p>
            ${g(Number(this.today.slice(0, 4)), Number(this.today.slice(5, 7)), this.language)}
          </p>
        </div>
        <div class="art">
          ${Ae`<svg viewBox="0 0 100 120" width="100" height="120" fill="none" aria-hidden="true"><path d="M49 115V35M49 79C10 81 10 41 10 41s40 1 39 38ZM49 53C48 16 89 10 89 10s4 42-40 43Z" stroke="currentColor" stroke-width="2"/><path d="M49 103c25 0 34-21 34-21s-29-2-34 21Z" fill="currentColor" opacity=".25"/></svg>`}
        </div>
      </section>
      <div class="stats">
        ${r.map(([e, t]) => H`<div class="stat"><strong>${t}</strong><span>${this.tr(e)}</span></div>`)}
      </div>
      ${this.tables.plants.length ? U : H`<section class="panel">${this.empty("emptyPlants", "emptyPlantsBody", "newPlant", () => this.startEditor("plants"))}</section>`}
      <div class="columns">
        <section class="panel">
          <div class="section-head">
            <h2>${this.tr("thisMonth")}</h2>
            <button class="link" @click=${() => this.navigate("calendar")}>
              ${this.tr("calendar")}${$("arrow")}
            </button>
          </div>
          <p class="muted">${this.tr("recommendation")}</p>
          ${e.length ? e.map((e) => H`<div class=${`item activity ${t(e, "activity")}`}>
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
                        <small>${_(e, this.language)}</small>
                      </div>
                    </div>`) : H`<p class="empty">${this.tr("noWindows")}</p>`}
        </section>
        <section class="panel">
          <div class="section-head">
            <h2>${this.tr("upcoming")}</h2>
            ${this.editable ? H`<button class="icon" aria-label=${this.tr("newTask")} @click=${() => this.startEditor("tasks")}>${$("plus")}</button>` : U}
          </div>
          ${this.renderTasks(!1)}
        </section>
      </div>`;
	}
	renderTasks(e = !0) {
		let n = this.tables.tasks.filter((t) => e || !t.data.completed).sort((e, n) => t(e, "date").localeCompare(t(n, "date")));
		return H`${n.length ? (e ? n : n.slice(0, 6)).map((e) => H`<article class="item">
                <div class="date-tile">
                  <strong>${t(e, "date").slice(8)}</strong
                  ><small
                    >${g(Number(t(e, "date").slice(0, 4)), Number(t(e, "date").slice(5, 7)), this.language, !0)}</small
                  >
                </div>
                <div class="item-content">
                  <h3>${t(e, "title")}</h3>
                  <small
                    >${this.lab(t(e, "activity"))} ·
                    ${h(t(e, "date"), this.language)}</small
                  >${t(e, "notes") ? H`<p>${t(e, "notes")}</p>` : U}${e.data.completed ? H`<span class="badge">${this.tr("completed")}</span>` : U}
                </div>
                ${this.editable ? H`<button class="icon" aria-label=${this.tr(e.data.completed ? "undoTask" : "taskDone")} ?disabled=${this.busy} @click=${() => this.action("update", {
			table: "tasks",
			id: e.id,
			revision: e.revision,
			data: { completed: !e.data.completed }
		})}>${$("check")}</button><button @click=${() => this.startEditor("tasks", e)}>${this.tr("edit")}</button>` : U}
              </article>`) : H`<p class="empty">${this.tr("noTasks")}</p>`}`;
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
		return H`${this.renderFilters(!0)}
      <div class="toolbar">
        <div class="segmented" aria-label=${this.tr("calendar")}>
          ${[
			"year",
			"month",
			"week"
		].map((e) => H`<button
                aria-pressed=${this.calendarMode === e}
                @click=${() => {
			this.calendarMode = e;
		}}
              >
                ${this.tr(e)}
              </button>`)}
        </div>
        <div class="actions">
          <button
            class="icon"
            aria-label=${this.tr("previous")}
            @click=${() => this.shiftCalendar(-1)}
          >
            ‹</button
          >${this.calendarMode === "year" ? H`<label
                  >${this.tr("selectedYear")}<input
                    type="number"
                    min="1"
                    max="9998"
                    .value=${String(this.year)}
                    @change=${(e) => {
			let t = Number(e.target.value);
			t >= 1 && t <= 9998 && (this.anchor = `${String(t).padStart(4, "0")}-01-01`);
		}}
                /></label>` : H`<label
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
            @click=${() => {
			this.anchor = this.today;
		}}
          >
            ${this.tr("today")}
          </button>
        </div>
      </div>
      <div class="legend">
        ${Ln.map((e) => H`<span class=${e}><span class="dot"></span>${this.lab(e)}</span>`)}
      </div>
      ${this.calendarMode === "year" ? H`<p class="muted">${this.tr("yearlyHint")}</p>
              <div
                class="year-scroll"
                tabindex="0"
                aria-label=${`${this.tr("year")} ${this.year}`}
              >
                <div class="year-grid">
                  <div class="month-head">
                    ${this.tr("plants")} · ${this.year}
                  </div>
                  ${n.map((e) => H`<div class="month-head">${g(this.year, e, this.language, !0)}</div>`)}
                  ${e.map((e) => H`<button
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
                        >${n.map((n) => f(e, this.year, n) ? H`<button
                                class=${`year-cell ${t(e, "activity")}`}
                                aria-label=${`${this.nameFor(t(e, "plant_id"), "plants")}, ${this.lab(t(e, "activity"))}, ${g(this.year, n, this.language)}`}
                                title=${this.windowTooltip(e)}
                                @click=${() => {
			this.selected = {
				kind: "window",
				id: e.id
			};
		}}
                              >
                                <span aria-hidden="true"
                                  >${d(e, this.year, n).map((e) => H`<span class="bar" style=${`left:${e.offset}%;width:${e.width}%`}></span>`)}</span
                                >
                              </button>` : H`<div class="year-cell"></div>`)}`)}
                </div>
              </div>
              ${e.length ? U : this.empty("noAllWindows")}` : this.calendarMode === "month" ? H`<section class="panel">
                <div class="section-head">
                  <h2>${g(this.year, this.month, this.language)}</h2>
                </div>
                <p class="muted">${this.tr("recommendation")}</p>
                <div class="month-list">
                  ${e.filter((e) => f(e, this.year, this.month)).map((e) => H`<button
                          type="button"
                          class=${`month-event plant activity ${t(e, "activity")}`}
                          aria-label=${`${this.nameFor(t(e, "plant_id"), "plants")}, ${this.lab(t(e, "activity"))}, ${_(e, this.language)}`}
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
                            title=${t(e, "notes") || _(e, this.language)}
                            >${this.lab(t(e, "activity"))}</span
                          >
                          <small
                            >${_(e, this.language)} ·
                            ${this.lab(t(e, "environment"))}</small
                          >
                          ${t(e, "regional_notes") ? H`<span class="month-region-note">${t(e, "regional_notes")}</span>` : U}
                        </button>`)}
                </div>
                ${e.some((e) => f(e, this.year, this.month)) ? U : this.empty("noWindows")}
              </section>` : this.renderWeek()}`;
	}
	eventActivity(e, n) {
		let r = t(e, "status");
		return ["planned", "sown"].includes(r) ? t(n, "method") : r === "planted_out" ? "transplant" : ["harvesting", "completed"].includes(r) ? "harvest" : r === "pricked_out" ? "prick_out" : "care";
	}
	renderWeek() {
		let e = m(this.anchor || this.today), n = new Set(this.filteredPlants(!0).map((e) => e.id)), r = this.calendarWindows().map((e) => ({
			window: e,
			segments: x(e, this.anchor || this.today)
		})).filter(({ segments: e }) => e.length);
		return H`<section class="panel" aria-labelledby="week-windows-title">
        <h2 id="week-windows-title">${this.tr("possibleThisWeek")}</h2>
        <p class="muted">${this.tr("recommendation")}</p>
        <div class="week-windows">
          ${r.map(({ window: e, segments: n }) => H`<button
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
        ${r.length ? U : H`<p class="muted">${this.tr("noWeekWindows")}</p>`}
      </section>
      <h2 class="week-heading">${this.tr("actualWork")}</h2>
      <div class="scroll" tabindex="0" aria-label=${this.tr("week")}>
        <div class="week-grid">
          ${e.map((e) => {
			let r = this.tables.tasks.filter((r) => t(r, "date") === e && this.calendarActivityMatches(t(r, "activity")) && (!t(r, "plant_id") || n.has(t(r, "plant_id"))));
			r.sort((e, n) => Ln.indexOf(t(e, "activity")) - Ln.indexOf(t(n, "activity")));
			let i = this.tables.cultivation_events.filter((r) => t(r, "date") === e && this.tables.cultivations.some((e) => e.id === t(r, "cultivation_id") && n.has(t(e, "plant_id")) && this.calendarActivityMatches(this.eventActivity(r, e)))), a = [...r.map((e) => ({
				kind: "task",
				record: e,
				activity: t(e, "activity")
			})), ...i.map((e) => ({
				kind: "event",
				record: e,
				activity: this.eventActivity(e, this.tables.cultivations.find((n) => n.id === t(e, "cultivation_id")))
			}))].sort((e, t) => Ln.indexOf(e.activity) - Ln.indexOf(t.activity) || e.record.id.localeCompare(t.record.id));
			return H`<section
              class=${`week-day ${e === this.today ? "today" : ""}`}
            >
              <h3>
                ${new Intl.DateTimeFormat(this.language === "de" ? "de-DE" : "en-GB", {
				weekday: "short",
				timeZone: "UTC"
			}).format(/* @__PURE__ */ new Date(`${e}T12:00:00Z`))}<br />${h(e, this.language)}
              </h3>
              ${!r.length && !i.length ? H`<p class="muted week-empty">${this.tr("noAppointments")}</p>` : U}
              ${a.map((e) => {
				if (e.kind === "task") return H`<button
                    class=${`week-event ${e.activity}`}
                    ?disabled=${!this.editable}
                    @click=${() => this.startEditor("tasks", e.record)}
                  >
                    ${t(e.record, "title")}${e.record.data.completed ? " ✓" : ""}
                  </button>`;
				let n = this.tables.cultivations.find((n) => n.id === t(e.record, "cultivation_id"));
				return H`<button
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
		let e = this.tables.cultivations.filter((e) => !["completed", "failed"].includes(this.status(e)));
		return H`${e.length ? H`<div class="grid">
              ${e.map((e) => H`<article class="plant">
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
                      ${h(b(e, this.tables.cultivation_events) || t(e, "date"), this.language)}
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
                      >${this.editable ? H`<button class="icon" aria-label=${`${this.tr("newEvent")}: ${this.plantName(e)}`} @click=${() => this.startEditor("cultivation_events", void 0, { cultivation_id: e.id })}>${$("plus")}</button>` : U}
                    </div>
                  </article>`)}
            </div>` : this.empty("emptyCultures")}
      <section class="panel" style="margin-top:24px">
        <div class="section-head">
          <h2>${this.tr("allTasks")}</h2>
          ${this.editable ? H`<button @click=${() => this.startEditor("tasks")}>${$("plus")}${this.tr("newTask")}</button>` : U}
        </div>
        ${this.renderTasks()}
      </section>`;
	}
	renderHistory(e = this.tables.cultivations, n = !1) {
		let r = [...new Set(e.map((e) => (b(e, this.tables.cultivation_events) || t(e, "date")).slice(0, 4)))].sort().reverse(), i = e.filter((e) => (n || !this.historyPlant || t(e, "plant_id") === this.historyPlant) && (n || !this.historyYear || (b(e, this.tables.cultivation_events) || t(e, "date")).startsWith(this.historyYear))).sort((e, n) => (b(n, this.tables.cultivation_events) || t(n, "date")).localeCompare(b(e, this.tables.cultivation_events) || t(e, "date")));
		return H`${n ? U : H`<p class="notice">${this.tr("observationHint")}</p>
            <div class="filters">
              <label
                >${this.tr("plant_id")}<select
                  @change=${(e) => {
			this.historyPlant = e.target.value;
		}}
                >
                  <option value="">${this.tr("allPlants")}</option>
                  ${this.tables.plants.map((e) => H`<option value=${e.id} .selected=${this.historyPlant === e.id}>${t(e, "name")}</option>`)}
                </select></label
              ><label
                >${this.tr("year")}<select
                  @change=${(e) => {
			this.historyYear = e.target.value;
		}}
                >
                  <option value="">${this.tr("history")}</option>
                  ${r.map((e) => H`<option value=${e} .selected=${this.historyYear === e}>${e}</option>`)}
                </select></label
              >
            </div>`}
    ${i.length ? H`<div class="table-wrap">
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
                ${i.map((e) => H`<tr>
                      <td>${this.plantName(e)}</td>
                      <td>
                        ${h(b(e, this.tables.cultivation_events), this.language)}${b(e, this.tables.cultivation_events) ? U : H`<small> ${this.tr("planned")}</small>`}
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
	renderLocations() {
		return H`${this.tables.locations.length ? H`<div class="grid">
            ${this.tables.locations.map((e) => H`<article class="plant">
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
                  ${t(e, "sensor_entity_id") ? H`<p class="break">
                          <small
                            >${this.lab(t(e, "measurement_kind"))}<br />${t(e, "sensor_entity_id")}</small
                          >
                        </p>` : U}${t(e, "sensor_entity_id") ? this.renderTemperature(e) : U}
                  ${e.data.archived ? H`<span class="badge unknown">${this.tr("archived")}</span>` : U}${this.editable ? H`<div class="actions">
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
                        </div>` : U}
                </article>`)}
          </div>` : this.empty("emptyLocations", "", "newLocation", () => this.startEditor("locations"))}`;
	}
	renderData(e, t = []) {
		return H`<dl>
      ${Object.entries(e).filter(([e, n]) => !t.includes(e) && n != null && n !== "" && !e.endsWith("_id") && typeof n != "object").map(([e, t]) => H`<dt>${this.tr(e)}</dt>
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
		].includes(e) ? this.lab(String(t)) : typeof t == "boolean" ? t ? "✓" : "—" : String(t)}
              </dd>`)}
    </dl>`;
	}
	windowTooltip(e) {
		let n = t(e, "notes");
		return `${_(e, this.language)}${n ? `\n\n${n}` : ""}`;
	}
	renderWindowDetail(e) {
		let n = this.tables.growing_windows.find((t) => t.id === e), r = n ? this.tables.plants.find((e) => e.id === t(n, "plant_id")) : void 0, i = t(n, "notes"), a = i.length > 360 ? `${i.slice(0, 360).trimEnd()}…` : i, o = n && [
			"regional_notes",
			"source",
			"source_url"
		].some((e) => t(n, e));
		return H`<dialog
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
        ${this.error ? H`<p class="notice error" role="alert">${this.error}</p>` : U}
        ${n && r ? H` <section
                  class=${`calendar-window-card ${t(n, "activity")}`}
                  aria-label=${this.tr("windowDetail")}
                >
                  <small>${this.tr("recurringWindow")}</small>
                  <h3 class="calendar-window-dates">
                    ${_(n, this.language)}
                  </h3>
                  <div class="calendar-window-badges">
                    <span class="badge"
                      >${this.lab(t(n, "environment"))}</span
                    >
                    ${t(n, "method") && t(n, "method") !== t(n, "activity") ? H`<span class="badge">${this.lab(t(n, "method"))}</span>` : U}
                  </div>
                  ${i ? H`<div class="calendar-window-note">
                          <h3>${this.tr("notes")}</h3>
                          <p>${a}</p>
                          ${i.length > 360 ? H`<details>
                                  <summary>
                                    ${this.tr("fullWindowNote")}
                                  </summary>
                                  <p>${i}</p>
                                </details>` : U}
                        </div>` : U}
                  ${o ? H`<details>
                          <summary>${this.tr("windowExtra")}</summary>
                          ${this.renderData({
			regional_notes: n.data.regional_notes,
			source: n.data.source,
			source_url: n.data.source_url
		})}
                        </details>` : U}
                  ${this.editable ? H`<button type="button" @click=${() => this.startEditor("growing_windows", n)}>${$("edit")}${this.tr("editWindow")}</button>` : U}
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
                </section>` : H`<p role="alert">${this.tr("not_found")}</p>`}
      </div>
    </dialog>`;
	}
	renderDetail() {
		let e = this.selected;
		if (e?.kind === "window") return this.renderWindowDetail(e.id);
		let n = e ? this.tables[e.kind === "plant" ? "plants" : "cultivations"].find((t) => t.id === e.id) : void 0;
		return H`<dialog
      id="detail-dialog"
      aria-labelledby="detail-title"
      @close=${() => {
			this.selected = null;
		}}
    >
      ${e && n ? H`<div class="dialog-head">
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
                ${this.error ? H`<p class="notice error" role="alert">${this.error}</p>` : U}
                ${this.editable ? H`<div
                        class=${e.kind === "plant" ? "actions plant-detail-actions" : "actions"}
                      >
                        <button
                          @click=${() => this.startEditor(e.kind === "plant" ? "plants" : "cultivations", n)}
                        >
                          ${this.tr("edit")}</button
                        >${e.kind === "plant" ? H`<button @click=${() => this.duplicate(n)} ?disabled=${this.busy}>${this.tr("duplicate")}</button><button @click=${() => this.archive(n, "plants")} ?disabled=${this.busy}>${this.tr(n.data.archived ? "unarchive" : "archive")}</button>` : H`<button class="primary" @click=${() => this.startEditor("cultivation_events", void 0, { cultivation_id: n.id })}>${$("plus")}${this.tr("newEvent")}</button>`}<button
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
                      </div>` : U}
                ${e.kind === "plant" ? this.renderPlantDetail(n) : this.renderCultureDetail(n)}
              </div>` : e ? H`<div class="dialog-body">
                <p role="alert">${this.tr("not_found")}</p>
                <button
                  @click=${() => {
			this.selected = null;
		}}
                >
                  ${this.tr("close")}
                </button>
              </div>` : U}
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
		return H`<div class="plant-summary-heading">
        ${t(e, "botanical_name") ? H`<p><i>${t(e, "botanical_name")}</i></p>` : U}
        ${t(e, "category") ? H`<span class="badge">${this.lab(t(e, "category"))}</span>` : U}
      </div>
      <dl class="plant-quick-facts">
        ${s.filter(([, e]) => e).map(([e, t]) => H`<div>
                <dt>${this.tr(e)}</dt>
                <dd>${t}</dd>
              </div>`)}
      </dl>`;
	}
	renderPlantDetail(e) {
		let n = this.tables.varieties.filter((n) => t(n, "plant_id") === e.id);
		return H`${this.renderPlantSummary(e)}
      <div
        class="detail-jumps"
        role="group"
        aria-label=${this.tr("plantSections")}
      >
        ${[
			"varieties",
			"windows",
			"observations"
		].map((e) => H`<button
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
        ${this.editable ? H`<button @click=${() => this.startEditor("varieties", void 0, { plant_id: e.id })}>${$("plus")}${this.tr("newVariety")}</button>` : U}
      </div>
      ${n.length ? n.map((e) => H`<article class="item">
                  <div class="item-content">
                    <h3>
                      ${t(e, "name")}${t(e, "botanical_name") ? H` <span style="font-weight: normal">(${t(e, "botanical_name")})</span>` : U}
                    </h3>
                  </div>
                  ${this.editable ? H`<button
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
                          </button>` : U}
                </article>`) : H`<p class="muted">${this.tr("noVarieties")}</p>`}
      <div class="section-head">
        <h3 id="plant-windows" tabindex="-1">${this.tr("windows")}</h3>
        ${this.editable ? H`<button @click=${() => this.startEditor("growing_windows", void 0, { plant_id: e.id })}>${$("plus")}${this.tr("newWindow")}</button>` : U}
      </div>
      ${this.plantWindows(e.id).length ? this.plantWindows(e.id).map((e) => H`<article class="item">
                  <div class="item-content">
                    <h3>
                      ${this.lab(t(e, "activity"))}${t(e, "variety_id") ? ` (${this.nameFor(t(e, "variety_id"), "varieties")})` : ""}
                      · ${_(e, this.language)}
                    </h3>
                    ${t(e, "notes") ? H`<p style="white-space: pre-wrap">${t(e, "notes")}</p>` : U}
                  </div>
                  ${this.editable ? H`<button
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
                          </button>` : U}
                </article>`) : H`<p class="muted">${this.tr("noAllWindows")}</p>`}
      <div class="section-head">
        <h3 id="plant-observations" tabindex="-1">
          ${this.tr("observations")}
        </h3>
        ${this.editable && !e.data.archived ? H`<button class="primary" @click=${() => this.startEditor("cultivations", void 0, { plant_id: e.id })}>${$("plus")}${this.tr("newSowing")}</button>` : U}
      </div>
      ${this.renderHistory(this.tables.cultivations.filter((n) => t(n, "plant_id") === e.id), !0)}`;
	}
	renderCultureDetail(e) {
		let n = e.data.snapshot, r = n && typeof n == "object" && !Array.isArray(n) ? n : void 0;
		return H`<p>
        <span class="badge">${this.lab(this.status(e))}</span>
      </p>
      <dl>
        <dt>${this.tr("sowingDate")}</dt>
        <dd>
          ${h(b(e, this.tables.cultivation_events), this.language)}
        </dd>
        <dt>${this.tr("location_id")}</dt>
        <dd>${this.nameFor(t(e, "location_id"), "locations")}</dd>
        <dt>${this.tr("variety")}</dt>
        <dd>${this.nameFor(t(e, "variety_id"), "varieties")}</dd>
      </dl>
      ${this.renderData(e.data, ["snapshot", "date"])}
      ${this.tables.locations.find((n) => n.id === t(e, "location_id")) ? this.renderTemperature(this.tables.locations.find((n) => n.id === t(e, "location_id")), e) : U}
      <h3>${this.tr("timeline")}</h3>
      <div class="timeline">
        ${v(e, this.tables.cultivation_events).map((e) => H`<article>
              <div class="row">
                <div>
                  <strong>${this.lab(t(e, "status"))}</strong
                  ><br /><small
                    >${h(t(e, "date"), this.language)}</small
                  >
                </div>
                ${this.editable ? H`<div class="actions">
                        <button
                          @click=${() => this.startEditor("cultivation_events", e)}
                        >
                          ${this.tr("edit")}</button
                        >${e.data.origin === "initial" ? U : H`<button
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
                      </div>` : U}
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
			return t && typeof t == "object" && !Array.isArray(t) ? H`<h3>
                  ${this.tr(e === "plant" ? "plant_id" : e === "variety" ? "variety" : "location_id")}
                </h3>
                ${this.renderData(t)}` : U;
		})}${Array.isArray(r?.windows) ? H`<h3>${this.tr("windows")}</h3>
                ${r.windows.map((e) => e && typeof e == "object" && !Array.isArray(e) ? this.renderData(e) : U)}` : U}
      </details>`;
	}
	async loadBackups() {
		let e = this.api, t = this.connectionGeneration;
		if (e) try {
			let n = await e.command("backups");
			t === this.connectionGeneration && (this.backups = n);
		} catch (e) {
			t === this.connectionGeneration && (this.error = yt(this.language, e));
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
				Mn(JSON.stringify(r, null, 2), `garden-planner-${this.today}.json`, "application/json");
			} else {
				let r = await t.command("export", { format: e });
				if (n !== this.connectionGeneration) return;
				Mn(Nn(r).slice().buffer, `garden-planner-csv-${this.today}.zip`, "application/zip");
			}
		} catch (e) {
			n === this.connectionGeneration && (this.error = yt(this.language, e));
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
			let t = e[0] === 80 && e[1] === 75 ? "csv" : "json", a = t === "csv" ? Pn(e) : JSON.parse(new TextDecoder("utf-8", { fatal: !0 }).decode(e)), o = await r.command("preview_import", {
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
			this.error = e instanceof SyntaxError || e instanceof Error && e.message === "invalid_file" ? this.tr("invalidFile") : yt(this.language, e);
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
			n === this.connectionGeneration && (this.error = yt(this.language, e));
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
		return H`<dialog
      id="review-dialog"
      aria-labelledby="review-title"
      @cancel=${(e) => {
			this.busy && e.preventDefault();
		}}
      @close=${() => {
			this.reviewed = null;
		}}
    >
      ${e ? H`<div class="dialog-head">
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
                ${this.error ? H`<p class="notice error" role="alert">${this.error}</p>` : U}
                <dl>
                  ${[
			"inserted",
			"updated",
			"skipped",
			"deleted"
		].map((t) => H`<dt>
                          ${this.tr(t === "deleted" ? "removed" : t)}
                        </dt>
                        <dd>${e.plan[t]}</dd>`)}
                  <dt>${this.tr("conflicts")}</dt>
                  <dd>${e.plan.conflicts.length}</dd>
                </dl>
                ${e.plan.mode === "replace" ? H`<p class="notice error">
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
                        >` : U}
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
              </div>` : U}
    </dialog>`;
	}
	async loadHostSettings() {
		let e = this.api, t = this.connectionGeneration, n = this.hostDraftRevision;
		if (e && this.admin && this.capabilities?.reminders) try {
			let [r, i] = await Promise.all([e.command("get_settings"), e.command("reminder_log")]);
			if (t !== this.connectionGeneration) return;
			this.hostSettings = r, n === this.hostDraftRevision && (this.hostDraft = structuredClone(r.settings)), this.deliveries = i;
		} catch (e) {
			t === this.connectionGeneration && (this.error = yt(this.language, e));
		}
	}
	renderTemperature(e, n) {
		if (!t(e, "sensor_entity_id")) return U;
		let r = w(this.hass, e, n ? C(n) : void 0);
		return H`<div
      class="notice ${r.state === "outside" ? "error" : ""}"
    >
      <strong
        >${this.tr("liveTemperature")} ·
        ${this.lab(t(e, "measurement_kind"))}</strong
      >
      <p>
        ${r.value === void 0 ? this.tr(r.state === "unit" ? "badTemperatureUnit" : "noSensor") : `${r.value.toLocaleString(this.language, { maximumFractionDigits: 1 })} °C`}
      </p>
      ${r.state === "outside" ? H`<p>${this.tr("outsideRange")}</p>` : r.state === "information" && t(e, "measurement_kind") !== "substrate" ? H`<small>${this.tr("notComparable")}</small>` : U}
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
		return H`<td>
      <label class="check"
        ><input
          type="checkbox"
          aria-label=${a}
          .checked=${i?.enabled ?? !1}
          ?disabled=${!n}
          @change=${(n) => this.updateRoute(e.id, t, { enabled: n.target.checked })}
        />${this.tr(t)}</label
      >
      ${i?.enabled ? H`<label
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
                  ${r.channels.filter((e) => e !== "notify.send_message").map((e) => H`<option value=${e} .selected=${o === e}>${e}</option>`)}
                  ${(r.notify_entities ?? []).map((e) => H`<option value=${`entity:${e.id}`} .selected=${o === `entity:${e.id}`}>${e.name} (${e.id})</option>`)}
                  ${o && !r.channels.includes(o) && !(r.notify_entities ?? []).some((e) => o === `entity:${e.id}`) ? H`<option value=${o} selected>${o} · ${this.tr("missingDestination")}</option>` : U}
                </select></label
              >
              ${t === "email" && i.service && i.service !== "notify.send_message" ? H`<label
                      >${this.tr("emailRecipient")}<input
                        type="email"
                        required
                        autocomplete="off"
                        aria-label=${`${e.name}: ${this.tr("emailRecipient")}`}
                        .value=${i.target}
                        @input=${(n) => this.updateRoute(e.id, t, { target: n.target.value })}
                    /></label>` : U}` : U}
    </td>`;
	}
	renderUserRoles(e, t) {
		return H`<h3>${this.tr("userRoles")}</h3>
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
			return H`<tr>
                <th scope="row">
                  ${e.name}${e.is_admin ? H`<small>${this.tr("administrator")}</small>` : U}
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
		if (!this.capabilities?.reminders || !this.admin) return U;
		let e = this.hostSettings, t = this.hostDraft;
		if (!e || !t) return H`<section class="panel">
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
		return H`<section class="panel">
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
              ${[.../* @__PURE__ */ new Set([...e.channels, ...t.notify_service ? [t.notify_service] : []])].map((e) => H`<option value=${e} .selected=${t.notify_service === e}>${e}</option>`)}
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
        ${this.deliveries.length ? this.deliveries.map((e) => H`<p><span class="badge">${this.tr(e.state)}</span> ${e.description}</p>`) : H`<p>${this.tr("noDeliveries")}</p>`}
      </details>
    </section>`;
	}
	renderSettings() {
		return H`<div class="settings-grid">
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
        ${this.admin ? H`<div class="actions" style="justify-content:flex-start">
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
                ${this.backups.map((e) => H`<div class="item"><small class="item-content break">${e}</small><button ?disabled=${this.busy} @click=${() => this.previewRestore(e)}>${this.tr("restorePreview")}</button></div>`)}` : H`<p class="notice">${this.tr("adminOnly")}</p>`}
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
		return H`<header class="ha-navigation">
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
            ${In.map((e) => H`<button aria-current=${this.page === e ? "page" : U} @click=${() => this.navigate(e)}>${$(e)}${this.tr(e)}</button>`)}
          </nav>
          <div class="aside-footer">${this.tr("tagline")}</div>
        </aside>
        <main>
          <header class="topbar">
            <div>
              <div class="eyebrow">Garden Planner</div>
              <h1>${this.tr(this.page)}</h1>
              <p class="muted">${this.tr("overviewIntro")}</p>
            </div>
            <div class="actions">
              <button
                class="icon"
                aria-label=${this.tr("refresh")}
                ?disabled=${this.busy}
                @click=${() => this.refresh()}
              >
                ${$("refresh")}</button
              >${this.editable && this.page !== "settings" ? H`<button class="primary" ?disabled=${this.busy || !this.loaded || e[1] === "cultivations" && !this.plantList.length} @click=${() => this.startEditor(e[1])}>${$("plus")}${this.tr(e[0])}</button>` : U}
            </div>
          </header>
          ${this.error ? H`<p class="notice error" role="alert">${this.error}<button class="link" @click=${() => this.refresh()}>${this.tr("retry")}</button></p>` : U}
          ${this.loaded && !this.editable ? H`<p class="notice">${this.tr("readOnly")}</p>` : U}
          ${this.loaded ? this.page === "overview" ? this.renderOverview() : this.page === "calendar" ? this.renderCalendar() : this.page === "plants" ? H`${this.renderFilters()}${this.tables.plants.length ? this.filteredPlants().length ? H`<div class="grid">
                                ${ut(this.filteredPlants(), (e) => e.id, (e) => this.renderPlantCard(e))}
                              </div>` : this.empty("noResults") : this.empty("emptyPlants", "emptyPlantsBody", "newPlant", () => this.startEditor("plants"))}` : this.page === "cultures" ? this.renderCultures() : this.page === "history" ? H`<section class="panel">
                            ${this.renderHistory()}
                          </section>` : this.page === "locations" ? this.renderLocations() : this.renderSettings() : H`<p role="status">${this.tr("loading")}</p>`}
        </main>
      </div>
      ${this.renderDetail()}${this.renderEditor()}${this.renderReview()}
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
          ${this.error ? H`<p class="notice error" role="alert">${this.error}</p>` : U}
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
        ${this.toast ? H`<div class="toast">${this.toast}</div>` : U}
      </div>`;
	}
};
customElements.get("garden-planner-panel") || customElements.define("garden-planner-panel", Bn);
export { Bn as GardenPlannerPanel };
