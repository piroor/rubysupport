(function() {
var prefs = window['piro.sakura.ne.jp'].prefs;
var RubyService = window.RubyService = 
{
	initialized : false,

	XHTMLNS : 'http://www.w3.org/1999/xhtml',
	RUBYNS  : 'http://piro.sakura.ne.jp/rubysupport',

	kSTATE     : 'moz-ruby-state',
	kMODE      : 'moz-ruby-mode',
	kTYPE      : 'moz-ruby-type',
	kALIGN     : 'moz-ruby-align',
	kLINE_EDGE : 'moz-ruby-line-edge',
	kREFORMED  : 'moz-ruby-reformed',

	kLETTERS_BOX : 'ruby-text-innerBox',
	kLAST_LETTER_BOX : 'ruby-text-lastLetterBox',
	kCANCEL_SPACING_BOX : 'ruby-text-cancelSpacingBox',

	kAUTO_EXPANDED : 'ruby-auto-expanded',

	kLOADED   : 'moz-ruby-stylesheet-loaded',
	kEXPANDED : 'moz-ruby-expanded',

	kPREF_ENABLED         : 'rubysupport.general.enabled',
	kPREF_PROGRESSIVE     : 'rubysupport.general.progressive',
	kPREF_PROGRESS_UNIT   : 'rubysupport.general.progressive.unit',
	kPREF_OBSERVE_CHANGES : 'rubysupport.general.observeDynamicChanges',
	kPREF_EXPAND          : 'rubysupport.expand.enabled',
	kPREF_EXPAND_LIST     : 'rubysupport.expand.list',
	kPREF_EXPAND_MODE     : 'rubysupport.expand.mode',
	kPREF_NOPSEUDS        : 'rubysupport.expand.noPseuds',

	kSTYLE_ALIGN    : 'rubysupport.style.default.ruby-align',
	kSTYLE_OVERHANG : 'rubysupport.style.default.ruby-overhang',
	kSTYLE_STACKING : 'rubysupport.style.default.line-stacking-ruby',

	kNARROW_CHARACTERS_PATTERN : /[^\u1100-\u11FF\u2190-\u21FF\u2460-\u257F\u2600-\u26FF\u27F0-\u297F\u2B00-\u2BFF\u2E00-\u2FDF\u2FF0-\u2FFF\u3000-\u318F\u31A0-\u4DBF\u4E00-\u9FFF\uAC00-\uD79F\uF900-\uFAFF\uFE10-\uFE1F\uFE30-\uFE4F]+/ig,
	/*
		\u1100-\u11FF Hangul Jamo
		\u2190-\u21FF Arrows
		\u2460-\u24FF Enclosed Alphanumerics
		\u2500-\u257F Box Drawing
		\u2600-\u26FF Miscellaneous Symbols
		\u27F0-\u27FF Supplemental Arrows-A
		\u2800-\u28FF Braille Patterns
		\u2900-\u297F Supplemental Arrows-B
		\u2B00-\u2BFF Miscellaneous Symbols and Arrows
		\u2E00-\u2E7F Supplemental Punctuation
		\u2E80-\u2EFF CJK Radicals Supplement
		\u2F00-\u2FDF Kangxi Radicals
		\u2FF0-\u2FFF Ideographic Description Characters
		\u3000-\u303F CJK Symbols and Punctuation
		\u3040-\u309F Hiragana
		\u30A0-\u30FF Katakana
		\u3100-\u312F Bopomofo
		\u3130-\u318F Hangul Compatibility Jamo
		\u31A0-\u31BF Bopomofo Extended
		\u31C0-\u31EF CJK Strokes
		\u31F0-\u31FF Katakana Phonetic Extensions
		\u3200-\u32FF Enclosed CJK Letters and Months
		\u3300-\u33FF CJK Compatibility
		\u3400-\u4DBF CJK Unified Ideographs Extension A
		\u4E00-\u9FFF CJK Unified Ideographs
		\uAC00-\uD79F Hangul Syllables
		\uF900-\uFAFF CJK Compatibility Ideographs
		\uFE10-\uFE1F Vertical Forms
		\uFE30-\uFE4F CJK Compatibility Forms
	*/

	get SSS()
	{
		if (this._SSS === void(0)) {
			if ('@mozilla.org/content/style-sheet-service;1' in Components.classes) {
				this._SSS = Components.classes['@mozilla.org/content/style-sheet-service;1'].getService(Components.interfaces.nsIStyleSheetService);
			}
			if (!this._SSS)
				this._SSS = null;
		}
		return this._SSS;
	},
//	_SSS : null,

	get IOService()
	{
		if (!this._IOService)
			this._IOService = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
		return this._IOService;
	},
	_IOService : null,

	get XULAppInfo()
	{
		if (!this._XULAppInfo)
			this._XULAppInfo = Components.classes['@mozilla.org/xre/app-info;1']
				.getService(Components.interfaces.nsIXULAppInfo);
		return this._XULAppInfo;
	},
	_XULAppInfo : null,
	get isGecko19OrLater()
	{
		if (!('_isGecko19OrLater' in this)) {
			var version = this.XULAppInfo.platformVersion.split('.');
			this._isGecko19OrLater = parseInt(version[0]) >= 1 && parseInt(version[1]) >= 9;
		}
		return this._isGecko19OrLater;
	},
	
	updateGlobalStyleSheets : function() 
	{
		var enabled = prefs.getPref(this.kPREF_ENABLED);

		var sheet = this.IOService.newURI('chrome://rubysupport/content/styles/ruby.css', null, null);
		if (
			enabled &&
			!this.SSS.sheetRegistered(sheet, this.SSS.AGENT_SHEET)
			) {
			this.SSS.loadAndRegisterSheet(sheet, this.SSS.AGENT_SHEET);
		}
		else if (
			!enabled &&
			this.SSS.sheetRegistered(sheet, this.SSS.AGENT_SHEET)
			) {
			this.SSS.unregisterSheet(sheet, this.SSS.AGENT_SHEET);
		}


		sheet = this.IOService.newURI('chrome://rubysupport/content/styles/ruby-expanded-nopseuds.css', null, null);
		if (
			enabled && prefs.getPref(this.kPREF_NOPSEUDS) &&
			!this.SSS.sheetRegistered(sheet, this.SSS.AGENT_SHEET)
			)
			this.SSS.loadAndRegisterSheet(sheet, this.SSS.AGENT_SHEET);
		else if (
			(!enabled || !prefs.getPref(this.kPREF_NOPSEUDS)) &&
			this.SSS.sheetRegistered(sheet, this.SSS.AGENT_SHEET)
			)
			this.SSS.unregisterSheet(sheet, this.SSS.AGENT_SHEET);
	},
 
	processRubyNodes : function(aWindow, aPending) 
	{
		if (!aWindow.document) return false;

		if (prefs.getPref(this.kPREF_PROGRESSIVE)) {
			this.startProgressiveProcess(aWindow, aPending);
		}
		else {
			var expression = this.getProcessTargetExpression(aPending)+'[last()]';
			var root = aWindow.document.documentElement;
			var target;
			while (target = this.evaluateXPath(
					expression,
					root,
					XPathResult.FIRST_ORDERED_NODE_TYPE
				).singleNodeValue)
			{
				this.processOneNode(target, aPending);
			}
		}

		return true;
	},
	
	getProcessTargetExpression : function(aPending) 
	{
		var conditions = [
				'contains(" ruby RUBY ", concat(" ", local-name(), " "))'
			];

		if (prefs.getPref(this.kPREF_EXPAND)) {
			var list = prefs.getPref(this.kPREF_EXPAND_LIST);
			if (list)
				conditions.push('contains(" '+list.toLowerCase()+' '+list.toUpperCase()+' ", concat(" ", local-name(), " ")) and @title');
		}
		var additionalCondition = aPending ?
				' and @'+this.kREFORMED+'="pending"' :
				' and (not(@'+this.kSTATE+') or not(@'+this.kREFORMED+'))' ;

		return [
			'/descendant::*[((',
			conditions.join(') or ('),
			'))'+additionalCondition+']'
		].join('');
	},
 
	processOneNode : function(aNode, aPending) 
	{
		if (aPending) {
			this.delayedReformRubyElement(aNode);
			return;
		}

		if (!aNode.hasAttribute(this.kSTATE)) {
			aNode.setAttribute(this.kSTATE, 'progress');
			try {
				if (aNode.localName.toLowerCase() != 'ruby') {
					this.expandAttribute(aNode);
				}
				else {
					this.processRuby(aNode);
				}
			}
			catch(e) {
					dump(e+'\n > '+aNode+'\n');
			}
			aNode.setAttribute(this.kSTATE, 'done');
		}

		if (this.isGecko19OrLater)
			aNode.setAttribute(this.kMODE, 'block');

		this.delayedReformRubyElement(aNode);
	},
 
	progressiveProcess : function(aWindow, aPending) 
	{
		var doc = aWindow.document;

		var unit = prefs.getPref(this.kPREF_PROGRESS_UNIT);
		var target;
		var count = 0;
		while (
				(target = this.evaluateXPath(
					this.getProcessTargetExpression(aPending),
					doc.documentElement,
					XPathResult.FIRST_ORDERED_NODE_TYPE
				).singleNodeValue) &&
				(count++ < unit)
				)
		{
			this.processOneNode(target, aPending);
		}

		if (!count) return;

		this.startProgressiveProcess(aWindow, aPending);
	},
	
	startProgressiveProcess : function(aWindow, aPending) 
	{
		var timerName = '_progressiveProcessTimer';
		if (aPending) timerName += 'Pending';
		if (aWindow[timerName]) return;
		aWindow[timerName] = aWindow.setTimeout(function(aSelf) {
				aWindow[timerName] = null;
				aSelf.progressiveProcess(aWindow, aPending);
			}, 10, this);
	},
  
	processRuby : function(aNode) 
	{
		var doc = aNode.ownerDocument;

		// 後方互換モードあるいは非XHTMLの場合でのみタグの補完を行う
		if (doc.compatMode == 'BackCompat' ||
			doc.contentType == 'text/html' ||
			!/XHTML/.test(doc.doctype.publicId))
			this.fixUpMSIERuby(aNode);


		// rbspan付きのrtをtdで包む
		// マークアップを破壊するので宜しくないけど、どうせ視覚系ブラウザだし……（ぉぃ
		var rtcs = this.evaluateXPath('descendant::*[contains(" rtc RTC ", concat(" ", local-name(), " "))]', aNode);
		if (rtcs.snapshotLength) {
			var rts = this.evaluateXPath('descendant::*[contains(" rt RT ", concat(" ", local-name(), " ")) and @rbspan and not((@rbspan = "") or (number(@rbspan) < 2) or parent::xhtml:td)]', aNode);

			var tmp_td, tmp_td_content;
			var rt;
			for (var i = rts.snapshotLength-1; i > -1; i--)
			{
				rt = rts.snapshotItem(i);
				tmp_td = doc.createElementNS(this.XHTMLNS, 'td');
				tmp_td.setAttribute('moz-ruby-inserted', true);
				tmp_td.setAttribute('colspan', rt.getAttribute('rbspan'));
				// 以下の2行は、一行にまとめて書こうとすると何故かエラーになる
				tmp_td_content = rt.parentNode.replaceChild(tmp_td, rts.snapshotItem(i));
				tmp_td.appendChild(tmp_td_content);
			}

			aNode.setAttribute(this.kTYPE, 'complex');
		}
	},
	
	// IE用のマークアップをXHTMLの仕様に準拠したものに修正 
	fixUpMSIERuby : function(aNode)
	{
try{
		var namespace = this.XHTMLNS;

		var i, j;
		var doc = aNode.ownerDocument;

		/*
			複雑ルビが使用されている場合、この処理は行わない。
			（XHTMLでは終了タグは省略され得ないので）
		*/
		var rbcs = this.evaluateXPath('descendant::*[contains(" rbc RBC ", concat(" ", local-name(), " "))]', aNode);
		if (rbcs.snapshotLength) return;


		/*
			終了タグが省略されたために破壊されたマークアップを修正する。
			written by Takeshi Nishimura

			以下、
			* RB,RP,RT要素をまとめて「RUBY構成要素」、
			* ツリー上でRUBYノードの子ノードの階層を「レベル1」階層、
			* ツリー上でRUBYノードの孫ノードの階層を「レベル2」階層、
			* ツリー上でRUBYノードと同レベルの階層を「レベル0」階層、
			と呼ぶ。
			1) レベル1のノードを先頭から順に見ていき、RUBY構成要素があればそのレベル2ノードを見る。レベル2にRUBY構成要素があれば、その直前に終了タグが省略されているということなのでそれ以降全てをレベル1に追い出す。（追い出されたノードは結果的に次以降のレベル1調査対象となる）
			2) 1が終了したら、再度レベル1を見る。最後のRUBY構成要素の後に他の要素があればその直前に終了タグが省略されているということなのでそれらをレベル0に追い出す。
		*/


		var range = doc.createRange();
		var notClosedRubyElements,
			childRubyElement,
			movedContents;

		// まず、閉じられていないタグによって破壊されたツリーを復元する。
		while (
			(
				notClosedRubyElements = this.evaluateXPath(
					'child::*[contains(" rb RB rt RT rp RP ", concat(" ", local-name(), " "))][child::*[contains(" rb RB rt RT rp RP ", concat(" ", local-name(), " "))]]',
					aNode
				)
			).snapshotLength
			)
		{
			childRubyElement = this.evaluateXPath(
				'child::*[contains(" rb RB rt RT rp RP ", concat(" ", local-name(), " "))]',
				notClosedRubyElements.snapshotItem(0)
			);

			range.selectNodeContents(notClosedRubyElements.snapshotItem(0));
			range.setStartBefore(childRubyElement.snapshotItem(0));
			movedContents = range.extractContents();

			range.selectNodeContents(aNode);
			range.setStartAfter(notClosedRubyElements.snapshotItem(0));
			range.setEndAfter(notClosedRubyElements.snapshotItem(0));
			range.insertNode(movedContents);
		}


		// マークアップされていないrbをマークアップし直す。
		// rtより前にあるものはすべてrbにする。
		var rts = this.evaluateXPath('child::*[contains(" rt RT ", concat(" ", local-name(), " "))]', aNode);
		var start,
			startNext,
			end,
			endPrevious,
			rangeContents,
			rangeContent;
		for (i = rts.snapshotLength-1; i > -1; i--)
		{
			range.selectNodeContents(aNode);

			// <ruby>hoge<rp>(</rp><rt>foobar</rt><rp>)</rp></ruby>
			// という風にrpが存在するときは、
			// <ruby>[hoge<rp>(</rp>]<rt>foobar</rt><rp>)</rp></ruby>
			// とするとrpまでrb内に入れられてしまうので、
			// <ruby>[hoge]<rp>(</rp><rt>foobar</rt><rp>)</rp></ruby>
			// という風にRangeの開始位置・終了位置をrpを除く位置に移動してやらないといけない。
			if (i > 0) {
				start = rts.snapshotItem(i-1);
				startNext = start.nextSibling;
				if (startNext.localName &&
					startNext.localName.toLowerCase() == 'rp')
					range.setStartAfter(start.nextSibling);
				else
					range.setStartAfter(rts.snapshotItem(i-1));
			}

			end = rts.snapshotItem(i);
			endPrevious = end.previousSibling;
			if (endPrevious.localName &&
				endPrevious.localName.toLowerCase() == 'rp')
				range.setEndBefore(end.previousSibling);
			else
				range.setEndBefore(rts.snapshotItem(i));

			// ルビテキストより前にあるのが単一のrb要素なら、
			// マークアップを補正する必要はないので、ここで処理を終える。
			rangeContents = range.cloneContents();
			if (!rangeContents.childNodes.length) continue;
			if (rangeContents.childNodes.length == 1) {
				rangeContent = rangeContents.firstChild;
				if (
					rangeContent.nodeType == Node.ELEMENT_NODE &&
					(rangeContent = rangeContents.firstChild).localName.toLowerCase() == 'rb'
					)
					continue;
			}

			containerRubyBase = doc.createElementNS(namespace, 'rb');
			containerRubyBase.appendChild(range.extractContents());
			range.insertNode(containerRubyBase);

			// 新しく生成したrbの中にすべてまとめてぶち込んであるため、
			// <ruby>hoge<rb></rb><rt>foobar</rt></ruby> のようなマークアップは
			// <ruby><RB>hoge<rb></rb></RB><rt>foobar</rt></ruby> という風になってしまっている。
			// なので、ここで入れ子になったrbを削除しておく。
			rangeContents = this.evaluateXPath('child::*[contains(" rb RB ", concat(" ", local-name(), " "))]', containerRubyBase);
			for (var j = rangeContents.snapshotLength-1; j > -1; j--)
			{
				range.selectNodeContents(rangeContents.snapshotItem(j));
				movedContents = range.extractContents();

				range.selectNode(rangeContents.snapshotItem(j));
				range.deleteContents();
				range.insertNode(movedContents);
			}
		}


		// 2つめのrb以降、あるいは最後のルビ関連要素よりも後の要素は、すべて外に追い出す。
		var nextStart = this.evaluateXPath(
			'(child::*[contains(" rb RB ", concat(" ", local-name(), " "))][2] | child::*[contains(" rb RB rt RT rp RP ", concat(" ", local-name(), " "))][last()]/following-sibling::node()[1])',
			aNode
		);
		if (nextStart.snapshotLength) {
			var shouldCreateNewRubyElement = this.evaluateXPath('child::*[contains(" rb RB ", concat(" ", local-name(), " "))][2]', aNode).snapshotLength > 0;

			range.selectNodeContents(aNode);
			range.setStartBefore(nextStart.snapshotItem(0));
			movedContents = range.extractContents();

			if (shouldCreateNewRubyElement) {
				var newRubyElement = doc.createElementNS(namespace, 'ruby');
				newRubyElement.appendChild(movedContents);
				movedContents = newRubyElement;
			}

			range.selectNodeContents(aNode.parentNode);
			range.setStartAfter(aNode);
			range.setEndAfter(aNode);
			range.insertNode(movedContents);
			if (shouldCreateNewRubyElement)
				this.processRuby(movedContents);
		}


		// 複数あるrtを、一つにまとめる
		var rts = this.evaluateXPath('child::*[contains(" rt RT ", concat(" ", local-name(), " "))]', aNode);
		if (rts.snapshotLength > 1) {
			var text = doc.createElementNS(namespace, 'rtc-ie');
			aNode.insertBefore(text, rts.snapshotItem(0));

			for (i = rts.snapshotLength-1; i > -1; i--)
				text.insertBefore(rts.snapshotItem(i), text.firstChild);
		}
}catch(e){
	dump(e+'\n');
}
	},
  
	expandAttribute : function(aNode) 
	{
		var title = aNode.title || aNode.getAttribute('title');
		if (!title ||
			!aNode.textContent ||
			title.replace(/\s/g, '') == aNode.textContent.replace(/\s/g, ''))
			return;

		var root = aNode.ownerDocument.documentElement;
		var mode = prefs.getPref(this.kPREF_EXPAND_MODE);
		if (mode == 1) {
			// 既に展開した略語はもう展開しない
			var expanded = root.getAttribute(this.kEXPANDED) || '';
			var key = encodeURIComponent([
						aNode.localName,
						aNode.textContent,
						title
					].join('::'));
			if (('|'+expanded+'|').indexOf('|'+key+'|') > -1) return;
			root.setAttribute(this.kEXPANDED, (expanded ? expanded + '|' : '' ) + key);
		}
		aNode.setAttribute('rubytext', title);
		this.reformRubyElement(aNode);
	},
  
	reformRubyElement : function(aNode) 
	{
		// skip for hidden nodes
		if (!this.getBoxObjectFor(aNode).width) {
			aNode.setAttribute(this.kREFORMED, 'pending');
			return;
		}

		var originalNode = aNode;
		if (String(aNode.localName).toLowerCase() != 'ruby') {
			var doc = aNode.ownerDocument;
			var ruby = doc.getAnonymousElementByAttribute(aNode, 'class', this.kAUTO_EXPANDED);
			if (!ruby) {
				this.delayedReformRubyElement(aNode);
				return;
			}
			aNode = ruby;
		}

		if (originalNode.getAttribute(this.kREFORMED) == 'done')
			return;

		try {
			this.correctVerticalPosition(aNode);
			this.applyRubyAlign(aNode);
			this.applyRubyOverhang(aNode);
			this.applyLineStacking(aNode);
		}
		catch(e) {
dump(e+'\n');
		}

		originalNode.setAttribute(this.kREFORMED, 'done');
	},
	
	delayedReformRubyElement : function(aNode) 
	{
		if (!aNode.hasAttribute(this.kREFORMED))
			aNode.setAttribute(this.kREFORMED, 'progress');

		aNode.ownerDocument.defaultView.setTimeout(function(aSelf) {
			aSelf.reformRubyElement(aNode);
		}, 0, this);
	},
 
	correctVerticalPosition : function(aNode) 
	{
		var node = aNode;
		if (!node.parentNode)
			return;

		var doc = node.ownerDocument;

		if (node.getAttribute('class') == this.kAUTO_EXPANDED) {
			node = node.parentNode;
		}

		try {
			node.setAttribute('style', 'vertical-align: baseline !important;');

			var base = this.getRubyBase(aNode);
			if (!base) return; // if we get box object for "undefined", Mozilla makes crash.


			// 仮のボックスを挿入し、高さ補正の基準にする
			var beforeBoxNode = doc.createElementNS(this.RUBYNS, 'dummyBox');
			beforeBoxNode.appendChild(doc.createTextNode('?'));
			var afterBoxNode  = doc.createElementNS(this.RUBYNS, 'dummyBox');
			afterBoxNode.appendChild(doc.createTextNode('?'));
			var baseBoxNode  = doc.createElementNS(this.RUBYNS, 'dummyBox');
			baseBoxNode.appendChild(doc.createTextNode('?'));

			base.insertBefore(baseBoxNode, base.firstChild);
			var rbBox = this.getBoxObjectFor(baseBoxNode);

			var parent = node.parentNode;
			parent.insertBefore(beforeBoxNode, node);
			parent.insertBefore(afterBoxNode, node.nextSibling);

			var beforeBox = this.getBoxObjectFor(beforeBoxNode);
			var afterBox  = this.getBoxObjectFor(afterBoxNode);

			var baseBox = (
					Math.abs((rbBox.y+rbBox.height) - (beforeBox.y+beforeBox.height)) >
					Math.abs((rbBox.y+rbBox.height) - (afterBox.y+afterBox.height))
				) ?
					afterBox :
					beforeBox ;

			var offset = (rbBox.y+rbBox.height) - (baseBox.y+baseBox.height);
			if (offset != 0)
				node.setAttribute('style', 'vertical-align: '+offset+'px !important;');

			node.setAttribute(this.kLINE_EDGE,
				rbBox.y > beforeBox.y ? 'left' :
				rbBox.y < afterBox.y ? 'right' :
				'none'
			);

			parent.removeChild(beforeBoxNode);
			parent.removeChild(afterBoxNode);
			base.removeChild(baseBoxNode);
		}
		catch(e) {
//dump(e+'\n');
		}

		return;
	},
	
	getRubyBase : function(aNode) 
	{
		if (!aNode) return null;
		return this.evaluateXPath(
				'descendant::*[contains(" rb RB ", concat(" ", local-name(), " "))]',
				aNode,
				XPathResult.FIRST_ORDERED_NODE_TYPE
			).singleNodeValue ||
			aNode.getElementsByTagName('*')[0] ||
			aNode.firstChild;
	},
 
	getRubyTexts : function(aNode) 
	{
		var rtc = 'child::*[contains(" rt rtc RT RTC ", concat(" ", local-name(), " "))]';
		return {
			top: this.evaluateXPath(rtc+'[1]', aNode, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue,
			bottom: this.evaluateXPath(rtc+[2], aNode, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue
		};
	},
  
	applyRubyAlign : function(aNode) 
	{
		var align = prefs.getPref(this.kSTYLE_ALIGN).toLowerCase();
		aNode.setAttribute(this.kALIGN, align);
		if (/left|start|right|end|center/.test(align)) return;

		var boxes = this.evaluateXPath('descendant::*[contains(" rb rt RB RT ", concat(" ", local-name(), " "))]', aNode);
		for (var i = 0, maxi = boxes.snapshotLength; i < maxi; i++)
			this.justifyText(boxes.snapshotItem(i));
	},
	
	justifyText : function(aNode) 
	{
		var isWrapped = false;
		var align = prefs.getPref(this.kSTYLE_ALIGN).toLowerCase();

		// まず、字間を調整する対象かどうかを判別
		var whole = aNode;
		text = whole.textContent;
		if (!text && whole.localName.toLowerCase() == 'rb') {
			var ruby = whole.parentNode;
			if (ruby.getAttribute('class') != this.kAUTO_EXPANDED) return;
			text = ruby.parentNode.textContent;
			isWrapped = true;
		}
		text = text.replace(/\s\s+|^\s+|\s+$/g, '');

		// 英単語の間に字間を入れるかどうか
		if (align != 'distribute-letter' && align != 'distribute-space')
			text = text.replace(this.kNARROW_CHARACTERS_PATTERN, 'a');

		// 1文字しかなければ処理をスキップ
		if (text.length <= 1) return;


		// 字間を求める
		var doc = whole.ownerDocument;
		var boxInserted = false;
		var letters = this.getLettersBox(aNode, isWrapped);
		if (!letters) {
			boxInserted = true;
			letters = this.insertLettersBox(aNode);
		}

		var lettersBox = this.getBoxObjectFor(letters);
		var wholeBox = this.getBoxObjectFor(
				whole.parentNode.localName.toLowerCase() == 'td' ?
					whole.parentNode :
					aNode
			);
		var padding = wholeBox.width - lettersBox.width;

		if (boxInserted) this.clearInnerBox(aNode, letters);

		if (padding <= 0) return;

		var spacesCount = text.length;
		if (!isWrapped && align == 'distribute-letter') spacesCount--;
		var space = parseInt(padding / spacesCount);
		if (isWrapped) {
			space = parseInt((padding - space) / spacesCount);
		}
		if (space <= 0) return;

		if (align == 'auto' || align == 'line-edge')
			this.wrapNarrowCharacters(aNode);

		if (isWrapped) {
			whole.setAttribute('style',
				whole.getAttribute('style')+
				'; text-align: right !important;'
			);
		}
		else {
			// 最後の文字をspanで囲う
			var lastLetterNode = this.findLastLetterNode(aNode);
			if (!lastLetterNode) return;

			lastLetterNode.nodeValue = lastLetterNode.nodeValue.replace(/([^\s]\s*)$/, '');
			var lastLetter = doc.createElementNS(this.XHTMLNS, 'span');
			lastLetter.setAttribute('class', this.kLAST_LETTER_BOX);
			lastLetter.appendChild(doc.createTextNode(RegExp.$1));

			lastLetterNode.parentNode.appendChild(lastLetter);
		}


		whole.setAttribute('style',
			whole.getAttribute('style')+
			'; letter-spacing: '+space+'px !important;'
		);
	},
 
	getLettersBox : function(aNode, aWrapped) 
	{
		var doc = aNode.ownerDocument;

		var letters = null;
		if (aWrapped) {
			var ruby = aNode.parentNode;
			letters = doc.getAnonymousElementByAttribute(ruby.parentNode, 'class', this.kLETTERS_BOX);
		}
		else {
			var letters = doc.getAnonymousElementByAttribute(aNode, 'class', this.kLETTERS_BOX);
			if (!letters &&
				doc.defaultView.getComputedStyle(aNode, null).getPropertyValue('display') == 'inline')
				letters = aNode;
		}
		return letters;
	},
 
	insertLettersBox : function(aNode, aWrapped) 
	{
		var doc = aNode.ownerDocument;

		var letters = doc.createElementNS(this.XHTMLNS, 'span');
		letters.setAttribute('class', this.kLETTERS_BOX);

		var range = doc.createRange();
		range.selectNodeContents(aNode);
		letters.appendChild(range.extractContents());
		range.insertNode(letters);
		range.detach();

		return letters;
	},
 
	clearInnerBox : function(aNode, aInnerBox) 
	{
		var doc = aNode.ownerDocument;
		var range = doc.createRange();
		range.selectNodeContents(aInnerBox);
		var contents = range.extractContents();
		range.selectNode(aInnerBox);
		range.deleteContents(true);
		range.insertNode(contents);
		range.detach();
		return;
	},
 
	findLastLetterNode : function(aNode) 
	{
		var nodes = aNode.childNodes;
		var node;
		for (var i = nodes.length-1; i > -1; i--)
		{
			node = nodes[i];
			if (node.nodeType == Node.TEXT_NODE) {
				if (/[^\s]/.test(node.nodeValue))
					return nodes[i];
			}
			else if (node.nodeType == Node.ELEMENT_NODE) {
				node = this.findLastLetterNode(nodes[i]);
				if (node)
					return node;
			}
		}
		return null;
	},
 
	wrapNarrowCharacters : function(aNode) 
	{
		var doc = aNode.ownerDocument;
		var nodes = aNode.childNodes;
		var node;
		var matched;
		var range = doc.createRange();

		var wrapper = doc.createElementNS(this.XHTMLNS, 'span');
		wrapper.setAttribute('class', this.kCANCEL_SPACING_BOX);
		wrapper.appendChild(doc.createTextNode(''));
		var cloned;

		for (var i = nodes.length-1; i > -1; i--)
		{
			node = nodes[i];
			if (node.nodeType == Node.TEXT_NODE) {
				matched = node.nodeValue.match(this.kNARROW_CHARACTERS_PATTERN);
				if (!matched || !matched.length) continue;
				for (var j = matched.length-1; j > -1; j--)
				{
					matched[j] = matched[j].replace(/\s+/g, '');
					if (!matched[j] || matched[j].length == 1) continue;
					range.selectNode(nodes[i]);
					var pos = node.nodeValue.lastIndexOf(matched[j]);
					range.setStart(nodes[i], pos);
					range.setEnd(nodes[i], pos + matched[j].length - 1); // except the last letter
					cloned = wrapper.cloneNode(true);
					cloned.firstChild.nodeValue = range.toString();
					range.deleteContents();
					range.insertNode(cloned);
				}
			}
			else if (node.nodeType == Node.ELEMENT_NODE) {
				this.wrapNarrowCharacters(nodes[i]);
			}
		}
		range.detach();
	},
  
	applyRubyOverhang : function(aNode) 
	{
		var overhang = prefs.getPref(this.kSTYLE_OVERHANG).toLowerCase();
		var align = prefs.getPref(this.kSTYLE_ALIGN).toLowerCase();
		if (
			overhang == 'none' ||
			(overhang == 'start' && (align == 'left' || align == 'start')) ||
			(overhang == 'end' && (align == 'right' || align == 'end'))
			)
			return;

		var base = this.getRubyBase(aNode);
		var firstBase = base;
		var lastBase = base;

		if (base.localName.toLowerCase() == 'rbc') {
			var expression = 'child::*[contains(" rb RB ", concat(" ", local-name(), " "))]';
			firstBase = this.evaluateXPath(expression+'[1]', base, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
			lastBase = this.evaluateXPath(expression+'[last()]', base, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
		}

		var isWrapped = (aNode.getAttribute('class') == this.kAUTO_EXPANDED);
		var wholeBox = this.getBoxObjectFor(aNode);

		var style = aNode.getAttribute('style');

		var firstLettersBoxInserted = false,
			lastLettersBoxInserted = false,
			firstLetters,
			lastLetters,
			lettersBox,
			delta;

		if (overhang == 'auto' || overhang == 'start') {
			firstLetters = this.getLettersBox(firstBase, isWrapped);
			if (!firstLetters) {
				firstLettersBoxInserted = true;
				firstLetters = this.insertLettersBox(firstBase);
			}
			lettersBox = this.getBoxObjectFor(firstLetters);
			delta = lettersBox.x - wholeBox.x;
			if (delta >= 0) style += 'margin-left: '+(-delta)+'px !important;';
		}

		if (overhang == 'auto' || overhang == 'end') {
			lastLetters = this.getLettersBox(lastBase, isWrapped);
			if (!lastLetters) {
				lastLettersBoxInserted = true;
				lastLetters = this.insertLettersBox(lastBase);
			}
			lettersBox = this.getBoxObjectFor(lastLetters);
			delta = (wholeBox.x + wholeBox.width)-(lettersBox.x + lettersBox.width);
			if (delta >= 0) style += 'margin-right: '+(-delta)+'px !important;';
		}

		if (firstLettersBoxInserted)
			this.clearInnerBox(firstBase, firstLetters);
		if (
			lastLettersBoxInserted &&
			(
				!firstLettersBoxInserted ||
				firstBase != lastBase
			)
			)
			this.clearInnerBox(lastBase, lastLetters);

		aNode.setAttribute('style', style);
	},
 
	applyLineStacking : function(aNode) 
	{
		if (!this.isGecko19OrLater) return;

		var stacking = prefs.getPref(this.kSTYLE_STACKING).toLowerCase();
		if (stacking == 'include-ruby') return;

		var texts = this.getRubyTexts(aNode);
		if (!texts.top && !texts.bottom) return;

		var box;
		var style = aNode.getAttribute('style');
		if (texts.top) {
			style += '; margin-top: -'+this.getBoxObjectFor(texts.top).height+'px !important';
		}
		if (texts.bottom) {
			style += '; margin-bottom: -'+this.getBoxObjectFor(texts.bottom).height+'px !important';
		}
		aNode.setAttribute('style', style);
	},
  
	processPendingItems : function(aWindow) 
	{
		this.delayedReformRubyElement();
	},
 
	init : function() 
	{
		if (this.initialized) return;
		this.initialized = true;

		window.removeEventListener('load', this, false);

		if (!('gBrowser' in window)) return;

		window.addEventListener('unload', this, false);

		prefs.addPrefListener(this);

		try {
			this.updateGlobalStyleSheets();
			this.overrideFunctions();
			this.initBrowsers();

			var appcontent = document.getElementById('appcontent');
			appcontent.addEventListener('SubBrowserAdded', this, false);
			appcontent.addEventListener('SubBrowserRemoveRequest', this, false);
		}
		catch(e) {
			dump('CAUTION: XHTML Ruby Support fails to initialize!\n  Error: '+e+'\n');
		}
	},
	
	initBrowsers : function() 
	{
		this.initBrowser(document.getElementById('sidebar'));
		this.initTabBrowser(gBrowser);
	},
	
	initBrowser : function(aBrowser) 
	{
		aBrowser.addEventListener('DOMContentLoaded', this, true);
		if (prefs.getPref(this.kPREF_OBSERVE_CHANGES)) {
			aBrowser.addEventListener('XHTMLRubyInserted', this, true, true);
			aBrowser.addEventListener('MozAfterPaint', this, true);
			aBrowser.__rubysupport__observeDynamicChanges = true;
		}
	},
 
	initTabBrowser : function(aTabBrowser) 
	{
		Array.slice(aTabBrowser.mTabContainer.childNodes)
			.forEach(function(aTab) {
				this.initBrowser(aTab.linkedBrowser);
			}, this);

		aTabBrowser.mTabContainer.addEventListener('TabOpen', this, false);
		aTabBrowser.mTabContainer.addEventListener('TabClose', this, false);
	},
  
	overrideFunctions : function() 
	{
		if (window.FillInHTMLTooltip) {
			window.__rubysupport__FillInHTMLTooltip = window.FillInHTMLTooltip;
			window.FillInHTMLTooltip = this.FillInHTMLTooltip;
		}
	},
	
	FillInHTMLTooltip : function(elem) 
	{
		var popuptext = '',
			target;

		target = RubyService.evaluateXPath(elem, 'ancestor-or-self::*[local-name()="ruby" or local-name()="RUBY"]', XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;

		if (
			target &&
			!(/^\[object .*Document\]$/.test(String(target))) &&
			!RubyService.evaluateXPath('descendant-or-self::*[@title and not(@title = "")]', target).snapshotLength
			) {
			var expression;
			var rtcs = 'descendant::*[contains(" rtc RTC ", concat(" ", local-name(), " "))]';
			switch (parseInt(RubyService.evaluateXPath('count('+rtcs+')', target, XPathResult.NUMBER_TYPE).numberValue))
			{
				case 1:
					expression = rtcs+'[1]';
					break;

				case 2:
					expression = 'concat('+rtcs+'[1], " / ", '+rtcs+'[2])';
					break;

				default:
					expression = 'descendant::*[contains(" rt RT ", concat(" ", local-name(), " "))][1]';
					break;
			}
			popuptext = RubyService.evaluateXPath('normalize-space('+expression+')', target, XPathResult.STRING_TYPE).stringValue;
		}

		if (popuptext) {
			var popup = document.getElementById('aHTMLTooltip');
			popup.removeAttribute('label');
			popup.setAttribute('label', popuptext);
			return true;
		}

		return __rubysupport__FillInHTMLTooltip(elem);
	},
   
	destroy : function() 
	{
		window.removeEventListener('unload', this, false);

		prefs.removePrefListener(this);

		try {
			this.destroyBrowsers();

			var appcontent = document.getElementById('appcontent');
			appcontent.removeEventListener('SubBrowserAdded', this, false);
			appcontent.removeEventListener('SubBrowserRemoveRequest', this, false);
		}
		catch(e) {
		}
	},
	
	destroyBrowsers : function() 
	{
		this.destroyBrowser(document.getElementById('sidebar'));
		this.destroyTabBrowser(gBrowser);
	},
	
	destroyBrowser : function(aBrowser) 
	{
		aBrowser.removeEventListener('DOMContentLoaded', this, true);
		if (aBrowser.__rubysupport__observeDynamicChanges) {
			aBrowser.removeEventListener('XHTMLRubyInserted', this, true, true);
			aBrowser.removeEventListener('MozAfterPaint', this, true);
			aBrowser.__rubysupport__observeDynamicChanges = false;
		}
	},
 
	destroyTabBrowser : function(aTabBrowser) 
	{
		Array.slice(aTabBrowser.mTabContainer.childNodes)
			.forEach(function(aTab) {
				this.destroyBrowser(aTab.linkedBrowser);
			}, this);

		aTabBrowser.mTabContainer.removeEventListener('TabOpen', this, false);
		aTabBrowser.mTabContainer.removeEventListener('TabClose', this, false);
	},
   
	handleEvent : function(aEvent) 
	{
		switch (aEvent.type)
		{
			case 'load':
				this.init();
				return;

			case 'unload':
				this.destroy();
				return;

			case 'DOMContentLoaded':
				if (!prefs.getPref(this.kPREF_ENABLED)) return;
				var node = aEvent.originalTarget || aEvent.target;
				var doc = node.ownerDocument || node;
				if (doc == document) return;
				this.processRubyNodes(doc.defaultView);
				return;

			case 'XHTMLRubyInserted':
			case 'MozAfterPaint':
				if (!prefs.getPref(this.kPREF_ENABLED)) return;
				var target = aEvent.originalTarget || aEvent.target;
				if (target instanceof Element)
					target = target.ownerDocument.defaultView;
				else if (target instanceof Document)
					target = target.defaultView;
				if (target.document == document ||
					target.__rewindforward__processRubyNodesTimer)
					return;
				target.__rewindforward__processRubyNodesTimer = window.setTimeout(function(aSelf, aTarget) {
//Application.console.log(aEvent.type+Date.now()+_inspect(aEvent.boundingClientRect));
					aSelf.processRubyNodes(aTarget, true);
					aTarget.__rewindforward__processRubyNodesTimer = null;
				}, 500, this, target);
				return;

			case 'TabOpen':
				this.initBrowser(aEvent.originalTarget.linkedBrowser);
				return;
			case 'TabClose':
				this.destroyBrowser(aEvent.originalTarget.linkedBrowser);
				return;

			case 'SubBrowserAdded':
				this.initBrowser(aEvent.originalTarget.browser);
				return;
			case 'SubBrowserRemoveRequest':
				this.destroyBrowser(aEvent.originalTarget.browser);
				return;
		}
	},
 
/* Pref Listener */ 
	
	domains : [ 
		'rubysupport.'
	],
 
	observe : function(aSubject, aTopic, aPrefName) 
	{
		if (aTopic != 'nsPref:changed') return;

		var value = prefs.getPref(aPrefName);
		switch (aPrefName)
		{
			case this.kPREF_OBSERVE_CHANGES:
				this.destroyBrowsers();
				this.initBrowsers();
				break;

			default:
				break;
		}
	},
  
	getBoxObjectFor : function(aNode) 
	{
		if ('getBoxObjectFor' in aNode.ownerDocument)
			return aNode.ownerDocument.getBoxObjectFor(aNode);

		var box = {
				x       : 0,
				y       : 0,
				width   : 0,
				height  : 0,
				screenX : 0,
				screenY : 0
			};
		try {
			var rect = aNode.getBoundingClientRect();
			box.x = rect.left+1;
			box.y = rect.top+1;
			box.width  = rect.right-rect.left;
			box.height = rect.bottom-rect.top;
		}
		catch(e) {
		}
		return box;
	},
 
	evaluateXPath : function(aExpression, aContextNode, aType) 
	{
		const resolver = {
			lookupNamespaceURI : function(aPrefix)
			{
				switch (aPrefix)
				{
					case 'html':
					case 'xhtml':
					default:
						return RubyService.XHTMLNS;
	//					return '';
					case 'ruby':
						return RubyService.RUBYNS;
				}
			}
		};
		var doc = aContextNode ? aContextNode.ownerDocument : document ;
		try {
			return doc.evaluate(
					aExpression,
					aContextNode || document,
					resolver,
					aType || XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
					{}
				);
		}
		catch(e) {
		}

		return {
			snapshotLength : 0,
			snapshotItem : function() {
				return null;
			},
			singleNodeValue : null,
			iterateNext : function() {
				return null;
			},
			stringValue : ''
		};
	}
 
}; 
  
window.addEventListener('load', RubyService, false); 
 
})();
