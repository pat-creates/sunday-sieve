/* @ds-bundle: {"format":4,"namespace":"SundaySieve","components":[{"name":"Button"},{"name":"StatusBadge"},{"name":"Notice"},{"name":"OrderNumber"},{"name":"BakeDayPanel"},{"name":"BakeDayBar"},{"name":"CapacityIndicator"},{"name":"HowItWorks"},{"name":"FaqItem"},{"name":"BoxSizeCard"},{"name":"QuantityStepper"},{"name":"TextField"},{"name":"OrderSummary"},{"name":"PaymentCountdown"},{"name":"PaymentQRCard"},{"name":"PaymentMethodPicker"},{"name":"ProofUpload"},{"name":"OrderProgress"},{"name":"PickupDetails"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;
  var useState = React.useState, useEffect = React.useEffect, useId = React.useId;

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) { if (arguments[i]) out.push(arguments[i]); }
    return out.join(' ');
  }
  function omit(obj, keys) {
    var o = {};
    for (var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k) && keys.indexOf(k) < 0) o[k] = obj[k]; }
    return o;
  }

  function hTag(level, dflt) { var l = parseInt(level, 10); if (!(l >= 1 && l <= 6)) l = dflt; return 'h' + l; }

  /* Money: centavos (integer) -> "₱1,234.00" (TDD §12.5) */
  function formatPeso(centavos) {
    var n = Math.round(Number(centavos) || 0);
    var neg = n < 0; n = Math.abs(n);
    var pesos = Math.floor(n / 100), cents = String(n % 100).padStart(2, '0');
    return (neg ? '-' : '') + '₱' + pesos.toLocaleString('en-PH') + '.' + cents;
  }

  /* ---------- Button ---------- */
  function Button(props) {
    var variant = props.variant || 'primary', size = props.size || 'md';
    var rest = omit(props, ['variant', 'size', 'block', 'className', 'children', 'href']);
    var cls = cx('ss-btn', 'ss-btn--' + variant, 'ss-btn--' + size, props.block && 'ss-btn--block', props.className);
    if (props.href && !props.disabled) return h('a', Object.assign({ className: cls, href: props.href }, rest), props.children);
    return h('button', Object.assign({ type: 'button', className: cls }, rest), props.children);
  }

  /* ---------- StatusBadge (TDD §4.1 customer-facing labels) ---------- */
  var STATUS = {
    AWAITING_PAYMENT: { label: 'Awaiting your payment', tone: 'action' },
    PAYMENT_UNDER_REVIEW: { label: 'Payment received — verifying', tone: 'neutral' },
    CONFIRMED: { label: 'Confirmed', emoji: '\uD83C\uDF89', tone: 'success' },
    BAKING: { label: 'In the oven', tone: 'sun' },
    READY_FOR_PICKUP: { label: 'Ready for pickup', tone: 'strong' },
    COMPLETED: { label: 'Picked up', tone: 'muted' },
    CANCELLED: { label: 'Cancelled', tone: 'danger' }
  };
  function StatusBadge(props) {
    var s = STATUS[props.status] || { label: props.status, tone: 'neutral' };
    return h('span', { className: cx('ss-badge', 'ss-badge--' + s.tone, props.className) }, props.label || s.label,
      !props.label && s.emoji ? h('span', { 'aria-hidden': 'true' }, s.emoji) : null);
  }

  /* ---------- Notice ---------- */
  function Notice(props) {
    var tone = props.tone || 'info';
    var role = tone === 'danger' ? 'alert' : 'status';
    return h('div', { className: cx('ss-notice', 'ss-notice--' + tone, props.className), role: role },
      props.title ? h('p', { className: 'ss-notice__title' }, props.title) : null,
      props.children ? h('div', { className: 'ss-notice__body' }, props.children) : null,
      props.action ? h('div', { className: 'ss-notice__action' }, props.action) : null);
  }

  /* ---------- Icons (inline, 20px, currentColor) ---------- */
  function icon(paths) {
    return h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true', focusable: 'false' }, paths);
  }
  var ICON_COPY = icon([h('rect', { key: 'a', x: 9, y: 9, width: 12, height: 12, rx: 2 }), h('path', { key: 'b', d: 'M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1' })]);
  var ICON_CHECK = icon(h('path', { d: 'M5 12.5l4.5 4.5L19 7.5' }));

  /* ---------- OrderNumber ---------- */
  function OrderNumber(props) {
    var st = useState(false), copied = st[0], setCopied = st[1];
    function copy() {
      try {
        navigator.clipboard.writeText(props.value).then(function () { setCopied(true); setTimeout(function () { setCopied(false); }, 1600); });
      } catch (e) { /* clipboard unavailable */ }
    }
    return h('div', { className: cx('ss-ordernum', props.className) },
      h('span', { className: 'ss-ordernum__label' }, props.label || 'Order number'),
      h('span', { className: 'ss-ordernum__row' },
        h('span', { className: 'ss-ordernum__value' }, props.value),
        props.copyable === false ? null : h('button', { type: 'button', className: cx('ss-ordernum__copy', copied && 'ss-ordernum__copy--done'), onClick: copy,
          'aria-label': copied ? 'Order number copied' : 'Copy order number', title: copied ? 'Copied' : 'Copy order number' },
          copied ? ICON_CHECK : ICON_COPY)),
      h('span', { className: 'ss-visually-hidden', 'aria-live': 'polite' }, copied ? 'Order number copied' : ''));
  }

  /* ---------- CapacityIndicator (TDD §9.1) ---------- */
  function capacityState(remaining, almostAt) {
    if (remaining <= 0) return 'soldout';
    if (remaining <= almostAt) return 'almost';
    return 'open';
  }
  function CapacityIndicator(props) {
    var remaining = Math.max(0, props.remaining || 0), capacity = props.capacity || 96;
    var almostAt = props.almostSoldOutAt == null ? 24 : props.almostSoldOutAt;
    var state = capacityState(remaining, almostAt);
    var taken = Math.min(100, Math.round(((capacity - remaining) / capacity) * 100));
    var label = state === 'soldout' ? 'Sold out' : state === 'almost' ? 'Only ' + remaining + (remaining === 1 ? ' tart left' : ' tarts left') : remaining + ' tarts left';
    return h('div', { className: cx('ss-cap', 'ss-cap--' + state, props.inverse && 'ss-cap--inverse', props.className) },
      state === 'almost' ? h('span', { className: 'ss-cap__flag' }, h('span', { className: 'ss-cap__dot', 'aria-hidden': 'true' }), 'Almost sold out') : null,
      h('div', { className: 'ss-cap__text' },
        h('strong', { className: 'ss-cap__label' }, label)),
      h('div', { className: 'ss-cap__track', role: 'meter', 'aria-valuemin': 0, 'aria-valuemax': capacity, 'aria-valuenow': capacity - remaining, 'aria-valuetext': (capacity - remaining) + ' of ' + capacity + ' tarts reserved, ' + remaining + ' left', 'aria-label': 'Tarts reserved' },
        h('span', { className: 'ss-cap__fill', style: { width: taken + '%' } })));
  }

  /* The one label for the main order action everywhere: "Order for Saturday". */
  function orderLabel(bakeDate) {
    var day = bakeDate ? String(bakeDate).split(/[ ,]/)[0] : '';
    return /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i.test(day) ? 'Order for ' + day : 'Order now';
  }

  /* ---------- BakeDayBar: the bake day in one line, for the top of a phone screen ---------- */
  function BakeDayBar(props) {
    var state = props.state || 'open';
    var remaining = props.remaining;
    var almostAt = props.almostSoldOutAt == null ? 24 : props.almostSoldOutAt;
    var full = state === 'soldout' || (state === 'open' && remaining <= 0);
    var quiet = full || state === 'closed' || state === 'none';
    var almost = !quiet && remaining <= almostAt;
    var parts;
    if (state === 'none') parts = [h('strong', { key: 'a' }, 'No batch scheduled yet')];
    else if (quiet) parts = [h('strong', { key: 'a' }, props.bakeDate), ' \u00b7 ', full ? 'Sold out' : 'Orders closed'];
    else parts = [
      h('strong', { key: 'a', className: 'ss-bar__lead' }, 'Next batch: ' + props.bakeDate),
      almost ? h('span', { key: 'b', className: 'ss-bar__urgent' }, h('span', { className: 'ss-cap__dot', 'aria-hidden': 'true' }), 'Only ' + remaining + ' left') : remaining + ' tarts left',
      props.cutoff ? ' \u00b7 Order by ' + props.cutoff : null];
    var action = quiet
      ? (props.followHref ? h('a', { className: 'ss-bar__link', href: props.followHref }, props.followLabel || 'Follow us for the next batch') : null)
      : h(Button, { variant: 'sun', href: props.orderHref, onClick: props.onOrder, className: 'ss-bar__btn' }, props.ctaLabel || 'Order');
    return h('div', { className: cx('ss-bar', quiet && 'ss-bar--quiet', almost && 'ss-bar--almost', props.className), role: 'region', 'aria-label': 'Next batch' },
      h('p', { className: 'ss-bar__text' }, parts), action);
  }

  /* ---------- BakeDayPanel (TDD §9.1 item 2) ---------- */
  function BakeDayPanel(props) {
    var reasonId = useId(), headId = useId();
    var state = props.state || 'open';
    var HT = hTag(props.headingLevel, 2);
    var follow = props.followHref ? h(Button, { variant: 'primary', size: 'lg', block: true, href: props.followHref }, props.followLabel || 'Follow us on Facebook') : null;
    if (state === 'none') {
      return h('section', { className: cx('ss-bakeday', 'ss-bakeday--quiet', 'ss-bakeday--none', props.className), 'aria-labelledby': headId },
        h('p', { className: 'ss-bakeday__eyebrow' }, 'Next batch'),
        h(HT, { id: headId, className: 'ss-bakeday__date' }, 'No batch scheduled yet'),
        h('p', { className: 'ss-bakeday__line' }, props.noneText || 'New bake days are announced on our Facebook page.'),
        follow ? h('div', { className: 'ss-bakeday__cta' }, follow) : null);
    }
    var remaining = props.remaining;
    var almostAt = props.almostSoldOutAt == null ? 24 : props.almostSoldOutAt;
    var full = state === 'soldout' || remaining <= 0;
    var closed = !full && state === 'closed';
    var quiet = full || closed;
    var almost = !quiet && remaining <= almostAt;
    var reason = full ? 'This batch is sold out.' : closed ? 'Orders for this batch have closed.' : null;
    var base = props.ctaLabel || orderLabel(props.bakeDate);
    var label = almost ? base + ' \u00b7 ' + remaining + ' left' : base;
    return h('section', { className: cx('ss-bakeday', quiet && 'ss-bakeday--quiet', almost && 'ss-bakeday--almost', props.className), 'aria-labelledby': headId },
      h('div', { className: 'ss-bakeday__head' },
        h('p', { className: 'ss-bakeday__eyebrow' }, props.eyebrow || 'Next batch'),
        quiet ? h('span', { className: 'ss-bakeday__status' }, full ? 'Sold out' : 'Orders closed') : null),
      h(HT, { id: headId, className: 'ss-bakeday__date' }, props.bakeDate),
      h('dl', { className: 'ss-bakeday__facts' },
        h('div', null, h('dt', null, 'Pickup'), h('dd', null, props.pickupWindow)),
        h('div', null, h('dt', null, closed ? 'Orders closed' : 'Orders close'), h('dd', null, props.cutoff))),
      props.note && !quiet ? h('p', { className: 'ss-bakeday__note' }, props.note) : null,
      closed ? null : h(CapacityIndicator, { remaining: full ? 0 : remaining, capacity: props.capacity, almostSoldOutAt: almostAt, inverse: !quiet }),
      quiet
        ? h('div', { className: 'ss-bakeday__cta' },
            h('p', { id: reasonId, className: 'ss-bakeday__reason' }, reason, props.reasonExtra ? ' ' + props.reasonExtra : ''),
            follow)
        : h('div', { className: 'ss-bakeday__cta' },
            h(Button, { variant: 'sun', size: 'lg', block: true, href: props.orderHref, onClick: props.onOrder }, label)));
  }

  /* ---------- HowItWorks (TDD §9.1 item 4) ---------- */
  var DEFAULT_STEPS = [
    { title: 'Choose', text: 'Pick your box size and how many.' },
    { title: 'Pay', text: 'Scan the QR code and upload your receipt.' },
    { title: 'We confirm', text: 'We check your payment and email you.' },
    { title: 'Pick up', text: 'Collect your tarts on bake day.' }
  ];
  function HowItWorks(props) {
    var steps = props.steps || DEFAULT_STEPS;
    return h('ol', { className: cx('ss-how', props.className) }, steps.map(function (s, i) {
      return h('li', { key: i, className: 'ss-how__step' },
        h('span', { className: 'ss-how__num', 'aria-hidden': 'true' }, i + 1),
        h('span', { className: 'ss-how__body' }, h('strong', { className: 'ss-how__title' }, s.title), h('span', { className: 'ss-how__text' }, s.text)));
    }));
  }

  /* ---------- FaqItem (TDD §9.1 item 6) ---------- */
  function FaqItem(props) {
    return h('details', { className: cx('ss-faq', props.className), open: props.defaultOpen },
      h('summary', { className: 'ss-faq__q' }, h('span', null, props.question), h('span', { className: 'ss-faq__sign', 'aria-hidden': 'true' })),
      h('div', { className: 'ss-faq__a' }, props.children));
  }

  /* ---------- QuantityStepper ---------- */
  function QuantityStepper(props) {
    var value = props.value || 0, min = props.min == null ? 0 : props.min, max = props.max == null ? 99 : props.max;
    var label = props.label || 'Quantity';
    var item = props.itemName ? ' ' + props.itemName : '';
    function set(v) { if (props.onChange) props.onChange(Math.max(min, Math.min(max, v))); }
    return h('div', { className: cx('ss-stepper', props.className), role: 'group', 'aria-label': label },
      h('button', { type: 'button', className: 'ss-stepper__btn', onClick: function () { set(value - 1); }, disabled: props.disabled || value <= min, 'aria-label': 'Remove one' + item }, '−'),
      h('output', { className: 'ss-stepper__value', 'aria-live': 'polite' }, value),
      h('button', { type: 'button', className: 'ss-stepper__btn', onClick: function () { set(value + 1); }, disabled: props.disabled || value >= max, 'aria-label': 'Add one' + item }, '+'));
  }

  /* ---------- BoxSizeCard (TDD §3 products, §9.2) ---------- */
  function BoxSizeCard(props) {
    var selected = (props.quantity || 0) > 0;
    var HT = hTag(props.headingLevel, 3);
    var media = props.image
      ? h('img', { className: 'ss-box__img', src: props.image, alt: props.imageAlt || '' })
      : h('div', { className: 'ss-box__ph', 'aria-hidden': 'true' }, h('span', { className: 'ss-box__phnum' }, props.tartCount), h('span', { className: 'ss-box__phlabel' }, 'tarts'));
    var linked = props.href && !props.onQuantityChange && !props.disabled;
    return h('article', { className: cx('ss-box', props.layout === 'row' && 'ss-box--row', selected && 'ss-box--selected', props.disabled && 'ss-box--disabled', linked && 'ss-box--link', props.className) },
      h('div', { className: 'ss-box__media' }, media),
      h('div', { className: 'ss-box__body' },
        h(HT, { className: 'ss-box__name' }, linked ? h('a', { className: 'ss-box__link', href: props.href }, props.name) : props.name),
        h('p', { className: 'ss-box__meta' }, props.subtitle ? props.subtitle + ' \u00B7 ' + props.tartCount + ' egg tarts' : props.tartCount + ' egg tarts'),
        h('p', { className: 'ss-box__price' }, props.price),
        linked ? h('span', { className: 'ss-box__go', 'aria-hidden': 'true' }, props.linkLabel || 'Choose this box \u2192') : null,
        props.onQuantityChange ? h(QuantityStepper, { value: props.quantity || 0, max: props.max, disabled: props.disabled, onChange: props.onQuantityChange, label: 'Number of ' + props.name, itemName: props.name }) : null));
  }

  /* ---------- TextField ---------- */
  function TextField(props) {
    var autoId = useId();
    var id = props.id || autoId;
    var hintId = id + '-hint', errId = id + '-err';
    var describedBy = [props.hint && hintId, props.error && errId].filter(Boolean).join(' ') || undefined;
    var rest = omit(props, ['label', 'hint', 'error', 'multiline', 'className', 'id', 'optional']);
    var field = h(props.multiline ? 'textarea' : 'input', Object.assign({
      id: id, className: 'ss-field__input', 'aria-invalid': props.error ? 'true' : undefined, 'aria-describedby': describedBy,
      rows: props.multiline ? 3 : undefined
    }, rest));
    return h('div', { className: cx('ss-field', props.error && 'ss-field--error', props.className) },
      h('label', { className: 'ss-field__label', htmlFor: id }, props.label, props.optional ? h('span', { className: 'ss-field__opt' }, ' (optional)') : null),
      field,
      props.error ? h('p', { id: errId, className: 'ss-field__error' }, props.error) : null,
      props.hint ? h('p', { id: hintId, className: 'ss-field__hint' }, props.hint) : null);
  }

  /* ---------- OrderSummary (TDD §9.2, §3.2) ---------- */
  function OrderSummary(props) {
    var items = props.items || [];
    var maxTarts = props.maxTarts == null ? 24 : props.maxTarts;
    var over = props.totalTarts > maxTarts;
    var HT = hTag(props.headingLevel, 3), headId = useId();
    return h('section', { className: cx('ss-summary', props.className), 'aria-labelledby': headId },
      h(HT, { id: headId, className: 'ss-summary__title' }, props.title || 'Your order'),
      items.length === 0 ? h('p', { className: 'ss-summary__empty' }, 'No boxes yet. Choose a box size to start.') :
        h('ul', { className: 'ss-summary__lines' }, items.map(function (it, i) {
          return h('li', { key: i, className: 'ss-summary__line' },
            h('span', null, it.quantity + ' × ' + it.name),
            h('span', { className: 'ss-summary__amt' }, it.lineTotal));
        })),
      h('dl', { className: 'ss-summary__totals' },
        h('div', null, h('dt', null, 'Tarts'), h('dd', { className: over ? 'ss-summary__over' : undefined }, props.totalTarts + (maxTarts ? ' of ' + maxTarts + ' max' : ''))),
        h('div', { className: 'ss-summary__grand' }, h('dt', null, 'Total'), h('dd', null, props.total))),
      over ? h(Notice, { tone: 'warning', title: 'For orders over ' + maxTarts + ' tarts, please message me directly.' }, props.overLimitAction || null) : null,
      props.deadline && !over ? h('p', { className: 'ss-summary__deadline' }, 'Pay by ', h('strong', null, props.deadline)) : null);
  }

  /* ---------- PaymentCountdown (TDD §9.3, §9.6) ---------- */
  function remainingText(ms) {
    if (ms <= 0) return null;
    var m = Math.floor(ms / 60000), d = Math.floor(m / 1440), hrs = Math.floor((m % 1440) / 60), mins = m % 60;
    if (d > 0) return d + 'd ' + hrs + 'h left';
    if (hrs > 0) return hrs + 'h ' + mins + 'm left';
    return mins + 'm left';
  }
  function PaymentCountdown(props) {
    var state = props.state || 'running';
    var target = props.deadlineAt ? new Date(props.deadlineAt).getTime() : null;
    var st = useState(Date.now()), now = st[0], setNow = st[1];
    useEffect(function () {
      if (state !== 'running' || !target) return;
      var t = setInterval(function () { setNow(Date.now()); }, 30000);
      return function () { clearInterval(t); };
    }, [state, target]);
    if (state === 'paused') {
      return h('div', { className: cx('ss-count', 'ss-count--paused', props.className), role: 'status' },
        h('p', { className: 'ss-count__head' }, 'Payment received — verifying'),
        h('p', { className: 'ss-count__text' }, 'Thanks! We’ll verify your payment ' + (props.slaText || 'by the evening of the next day') + ' — you’ll get an email.'));
    }
    var left = target ? remainingText(target - now) : props.remainingText;
    var expired = state === 'expired' || (target && target - now <= 0);
    if (expired) {
      return h('div', { className: cx('ss-count', 'ss-count--expired', props.className), role: 'status' },
        h('p', { className: 'ss-count__head' }, 'Payment window closed'),
        h('p', { className: 'ss-count__text' }, 'This order was cancelled because payment didn’t arrive by ' + props.deadline + '. If you already paid, reply to your order email or message us.'));
    }
    if (props.compact) {
      return h('div', { className: cx('ss-count', 'ss-count--compact', props.className), role: 'timer', 'aria-live': 'off' },
        h('p', { className: 'ss-count__head' }, h('span', null, props.amount ? 'Pay ' + props.amount + ' by ' : 'Pay by ', h('strong', null, props.deadline)),
          left ? h('span', { className: 'ss-count__inline' }, left) : null));
    }
    return h('div', { className: cx('ss-count', props.className), role: 'timer', 'aria-live': 'off' },
      h('p', { className: 'ss-count__head' }, 'Pay by ', h('strong', null, props.deadline)),
      left ? h('p', { className: 'ss-count__left' }, left) : null,
      h('p', { className: 'ss-count__text' }, props.hint || 'Unpaid orders are cancelled automatically so others can take the slot.'));
  }

  /* ---------- PaymentQRCard (TDD §6 payment_qr_codes, §9.3) ---------- */
  function PaymentQRCard(props) {
    var HT = hTag(props.headingLevel, 3);
    return h('article', { className: cx('ss-qr', props.className) },
      h('div', { className: 'ss-qr__head' },
        h(HT, { className: 'ss-qr__provider' }, props.provider),
        props.amount ? h('p', { className: 'ss-qr__amount' }, 'Send exactly ', h('strong', null, props.amount)) : null),
      h('div', { className: 'ss-qr__code' }, props.qrSrc
        ? h('img', { src: props.qrSrc, alt: props.provider + ' QR code for ' + props.accountName })
        : h('div', { className: 'ss-qr__ph' }, 'QR code')),
      h('dl', { className: 'ss-qr__acct' },
        h('div', null, h('dt', null, 'Account name'), h('dd', null, props.accountName)),
        props.accountHint ? h('div', null, h('dt', null, 'Account'), h('dd', null, props.accountHint)) : null));
  }

  /* ---------- PaymentMethodPicker (TDD §9.3) ---------- */
  function PaymentMethodPicker(props) {
    var methods = props.methods || [];
    var st = useState(props.defaultValue || (methods[0] && methods[0].provider)), inner = st[0], setInner = st[1];
    var value = props.value !== undefined ? props.value : inner;
    var current = methods.filter(function (m) { return m.provider === value; })[0] || methods[0];
    function pick(p) { if (props.value === undefined) setInner(p); if (props.onChange) props.onChange(p); }
    var prov = current ? current.provider : 'payment';
    var tip = props.tip === undefined
      ? 'Paying from this phone? Take a screenshot of the QR code, then in your ' + prov + ' app choose “Upload QR” or scan from your gallery.'
      : props.tip;
    var deskTip = props.desktopTip === undefined ? 'Open ' + prov + ' on your phone and scan this code.' : props.desktopTip;
    return h('div', { className: cx('ss-picker', props.className) },
      h('div', { className: 'ss-picker__options', role: 'group', 'aria-label': props.label || 'Payment method' },
        methods.map(function (m) {
          var on = current && m.provider === current.provider;
          return h('button', { key: m.provider, type: 'button', className: cx('ss-picker__option', on && 'ss-picker__option--on'),
            'aria-pressed': on ? 'true' : 'false', onClick: function () { pick(m.provider); } }, m.provider);
        })),
      current ? h(PaymentQRCard, { provider: current.provider, qrSrc: current.qrSrc, accountName: current.accountName,
        accountHint: current.accountHint, amount: props.amount, headingLevel: props.headingLevel, className: 'ss-picker__card' }) : null,
      tip ? h('p', { className: 'ss-picker__tip ss-picker__tip--touch' }, tip) : null,
      deskTip ? h('p', { className: 'ss-picker__tip ss-picker__tip--mouse' }, deskTip) : null);
  }

  /* ---------- ProofUpload (TDD §9.3, §7.3) ---------- */
  function ProofUpload(props) {
    var whyId = useId();
    var autoId = useId();
    var state = props.state || 'empty';
    var id = props.id || autoId;
    var busy = state === 'uploading';
    var errId = id + '-err';
    var hasErr = state === 'error' && props.error;
    return h('div', { className: cx('ss-upload', 'ss-upload--' + state, props.className) },
      h('label', { className: 'ss-upload__zone', htmlFor: id },
        h('span', { className: 'ss-upload__title' }, props.fileName ? props.fileName : 'Upload your payment receipt'),
        h('span', { className: 'ss-upload__hint' }, props.fileName ? 'Tap to choose a different file' : 'Tap to choose a screenshot or PDF (JPG, PNG, HEIC or PDF, up to 8 MB)'),
        h('input', { id: id, type: 'file', className: 'ss-upload__input', accept: 'image/jpeg,image/png,image/heic,application/pdf', disabled: busy, 'aria-invalid': hasErr ? 'true' : undefined, 'aria-describedby': hasErr ? errId : undefined,
          onChange: function (e) { if (props.onFileSelect) props.onFileSelect(e.target.files && e.target.files[0]); } })),
      hasErr ? h('p', { id: errId, className: 'ss-field__error', role: 'alert' }, props.error) : null,
      props.showReference === false ? null : h(TextField, { label: 'Reference number', required: true, autoComplete: 'off', hint: props.referenceHint || 'On your receipt. GCash: \u201CRef No.\u201D under the amount. Bank apps: \u201CReference no.\u201D or \u201CTransaction ID\u201D.', error: props.referenceError, value: props.referenceNote, onChange: props.onReferenceChange, disabled: busy }),
      (function () {
        var noFile = !props.fileName, noRef = props.referenceNote !== undefined && !String(props.referenceNote).trim();
        var blocked = busy || state === 'error' || noFile || noRef;
        var why = busy || state === 'error' ? null
          : noFile && noRef ? 'Add your receipt and reference number to send.'
          : noFile ? 'Add your receipt to send.' : noRef ? 'Add the reference number to send.' : null;
        return h(React.Fragment, null,
          h(Button, { variant: 'primary', block: true, disabled: blocked, onClick: props.onSubmit, 'aria-describedby': why ? whyId : undefined }, busy ? 'Uploading…' : 'Send receipt'),
          why ? h('p', { id: whyId, className: 'ss-upload__why' }, why) : null);
      })());
  }

  /* ---------- OrderProgress (TDD §4) ---------- */
  var STEPS = [
    { key: 'placed', label: 'Order placed' },
    { key: 'pay', label: 'Payment' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'BAKING', label: 'In the oven' },
    { key: 'READY_FOR_PICKUP', label: 'Ready for pickup' },
    { key: 'COMPLETED', label: 'Picked up' }
  ];
  var INDEX = { AWAITING_PAYMENT: 1, PAYMENT_UNDER_REVIEW: 1, CONFIRMED: 2, BAKING: 3, READY_FOR_PICKUP: 4, COMPLETED: 5 };
  function OrderProgress(props) {
    var status = props.status;
    if (status === 'CANCELLED') {
      return h(Notice, { tone: 'danger', title: 'This order was cancelled', className: props.className }, props.reason || null);
    }
    var cur = INDEX[status] == null ? 0 : INDEX[status];
    if (props.title) {
      var HT = hTag(props.headingLevel, 3);
      return h('section', { className: cx('ss-progress-card', props.className) },
        h(HT, { className: 'ss-progress-card__title' }, props.title),
        h(OrderProgress, { status: status }));
    }
    return h('ol', { className: cx('ss-progress', props.className), 'aria-label': 'Order progress' }, STEPS.map(function (s, i) {
      var state = i < cur || (status === 'COMPLETED' && i === cur) ? 'done' : i === cur ? 'current' : 'todo';
      var label = s.label;
      if (i === 1 && status === 'AWAITING_PAYMENT') label = 'Awaiting your payment';
      if (i === 1 && status === 'PAYMENT_UNDER_REVIEW') label = 'Payment received — verifying';
      return h('li', { key: s.key, className: 'ss-progress__step ss-progress__step--' + state, 'aria-current': state === 'current' ? 'step' : undefined },
        h('span', { className: 'ss-progress__dot', 'aria-hidden': 'true' }, state === 'done' ? '✓' : ''),
        h('span', { className: 'ss-progress__label' }, label,
          state === 'done' ? h('span', { className: 'ss-visually-hidden' }, ' (done)') : null));
    }));
  }

  /* ---------- PickupDetails (TDD §7.4) ---------- */
  function PickupDetails(props) {
    var HT = hTag(props.headingLevel, 3), headId = useId();
    function title(def) {
      var t = props.title === undefined ? def : props.title;
      return t ? h(HT, { id: headId, className: 'ss-pickup__title' }, t) : null;
    }
    function labelled(def) { var t = props.title === undefined ? def : props.title; return t ? { 'aria-labelledby': headId } : { 'aria-label': def }; }
    if (!props.revealed) {
      return h('section', Object.assign({ className: cx('ss-pickup', props.className) }, labelled('Pickup area')),
        title('Pickup area'),
        h('p', { className: 'ss-pickup__area' }, props.publicBlurb),
        props.pickupWindow ? h('p', { className: 'ss-pickup__window' }, props.pickupWindow) : null,
        h('p', { className: 'ss-pickup__hint' }, 'Exact address sent when your order is ready.'));
    }
    return h('section', Object.assign({ className: cx('ss-pickup', 'ss-pickup--revealed', props.className) }, labelled('Pickup address')),
      title('Pickup address'),
      h('p', { className: 'ss-pickup__address' }, props.fullAddress),
      props.pickupWindow ? h('p', { className: 'ss-pickup__window' }, props.pickupWindow) : null,
      props.instructions ? h('p', { className: 'ss-pickup__instr' }, props.instructions) : null,
      h('div', { className: 'ss-pickup__actions' },
        props.mapUrl ? h(Button, { variant: 'primary', href: props.mapUrl }, 'Open map') : null,
        props.contactNumber ? h(Button, { variant: 'secondary', href: 'tel:' + props.contactNumber.replace(/[^+\d]/g, '') }, 'Call ' + props.contactNumber) : null));
  }

  var api = {
    Button: Button, StatusBadge: StatusBadge, Notice: Notice, OrderNumber: OrderNumber,
    BakeDayPanel: BakeDayPanel, BakeDayBar: BakeDayBar, CapacityIndicator: CapacityIndicator, HowItWorks: HowItWorks, FaqItem: FaqItem,
    BoxSizeCard: BoxSizeCard, QuantityStepper: QuantityStepper, TextField: TextField, OrderSummary: OrderSummary,
    PaymentCountdown: PaymentCountdown, PaymentQRCard: PaymentQRCard, PaymentMethodPicker: PaymentMethodPicker, ProofUpload: ProofUpload,
    OrderProgress: OrderProgress, PickupDetails: PickupDetails,
    formatPeso: formatPeso, STATUS_LABELS: STATUS
  };
  window.SundaySieve = Object.assign(window.SundaySieve || {}, api);
})();
