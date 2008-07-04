var RubyService = 
{
	initialized : false,

	useGlobalStyleSheets : false,

	XHTMLNS : 'http://www.w3.org/1999/xhtml',
	RUBYNS  : 'http://piro.sakura.ne.jp/rubysupport',

	kSTATE : 'moz-ruby-parsed',
	kTYPE  : 'moz-ruby-type',
	kALIGN  : 'moz-ruby-align',
	kLINE_EDGE : 'moz-ruby-line-edge',
	kREFORMED : 'moz-ruby-reformed',

	kLETTERS_BOX : 'ruby-text-innerBox',
	kLAST_LETTER_BOX : 'ruby-text-lastLetterBox',
	kCANCEL_SPACING_BOX : 'ruby-text-cancelSpacingBox',

	kAUTO_EXPANDED : 'ruby-auto-expanded',

	kDONE     : 'moz-ruby-parsed',
	kLOADED   : 'moz-ruby-stylesheet-loaded',
	kEXPANDED : 'moz-ruby-expanded',

	kPREF_ENABLED       : 'rubysupport.general.enabled',
	kPREF_PROGRESSIVE   : 'rubysupport.general.progressive',
	kPREF_PROGRESS_UNIT : 'rubysupport.general.progressive.unit',
	kPREF_EXPAND        : 'rubysupport.expand.enabled',
	kPREF_EXPAND_LIST   : 'rubysupport.expand.list',
	kPREF_EXPAND_MODE   : 'rubysupport.expand.mode',
	kPREF_NOPSEUDS      : 'rubysupport.expand.noPseuds',

	kSTYLE_ALIGN    : 'rubysupport.style.default.ruby-align',
	kSTYLE_OVERHANG : 'rubysupport.style.default.ruby-overhang',
	kSTYLE_STACKING : 'rubysupport.style.default.line-stacking-ruby',

	kNARROW_CHARACTERS_PATTERN : /[\u0020-\u024F]+/ig,

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
	get isGecko18OrLater()
	{
		if (!('_isGecko18OrLater' in this)) {
			var version = this.XULAppInfo.platformVersion.split('.');
			this._isGecko18OrLater = parseInt(version[0]) >= 1 || parseInt(version[1]) >= 8;
		}
		return this._isGecko18OrLater;
	},
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
		if (!this.useGlobalStyleSheets) return;

		var enabled = nsPreferences.getBoolPref(this.kPREF_ENABLED);

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
			enabled && nsPreferences.getBoolPref(this.kPREF_NOPSEUDS) &&
			!this.SSS.sheetRegistered(sheet, this.SSS.AGENT_SHEET)
			)
			this.SSS.loadAndRegisterSheet(sheet, this.SSS.AGENT_SHEET);
		else if (
			(!enabled || !nsPreferences.getBoolPref(this.kPREF_NOPSEUDS)) &&
			this.SSS.sheetRegistered(sheet, this.SSS.AGENT_SHEET)
			)
			this.SSS.unregisterSheet(sheet, this.SSS.AGENT_SHEET);
	},
 
	parseRubyNodes : function(aWindow) 
	{
		if (!aWindow.document) return false;

		if (nsPreferences.getBoolPref(this.kPREF_PROGRESSIVE)) {
			this.startProgressiveParse(aWindow);
		}
		else {
			var expression = this.parseTargetExpression+'[last()]';
			var root = aWindow.document.documentElement;
			var target;
			while (target = this.evaluateXPath(
					expression,
					root,
					XPathResult.FIRST_ORDERED_NODE_TYPE
				).singleNodeValue)
			{
				this.parseOneNode(target);
			}

			if (!this.useGlobalStyleSheets)
				this.setRubyStyle(aWindow);
		}

		return true;
	},
	 
	get parseTargetExpression() 
	{
		var conditions = [
				'contains(" ruby RUBY ", concat(" ", local-name(), " "))'
			];

		if (nsPreferences.getBoolPref(this.kPREF_EXPAND)) {
			var list = nsPreferences.copyUnicharPref(this.kPREF_EXPAND_LIST);
			if (list)
				conditions.push('contains(" '+list.toLowerCase()+' '+list.toUpperCase()+' ", concat(" ", local-name(), " ")) and @title');
		}

		return [
			'/descendant::*[((',
			conditions.join(') or ('),
			')) and (not(@'+this.kSTATE+') or not(@'+this.kREFORMED+'))]'
		].join('');
	},
 
	parseOneNode : function(aNode) 
	{
		if (!aNode.hasAttribute(this.kSTATE)) {
			aNode.setAttribute(this.kSTATE, 'progress');
			try {
				if (aNode.localName.toLowerCase() != 'ruby') {
					this.expandAttribute(aNode);
				}
				else {
					this.parseRuby(aNode);
				}
			}
			catch(e) {
					dump(e+'\n > '+aNode+'\n');
			}
			aNode.setAttribute(this.kSTATE, 'done');
		}

		if (this.isGecko19OrLater)
			aNode.setAttribute(this.kTYPE, 'inline-table');

		this.delayedReformRubyElement(aNode);
	},
 
	progressiveParse : function(aWindow) 
	{
		var doc = aWindow.document;

		var unit = nsPreferences.getIntPref(this.kPREF_PROGRESS_UNIT);
		var target;
		var count = 0;
		while (
				(target = this.evaluateXPath(
					this.parseTargetExpression,
					doc.documentElement,
					XPathResult.FIRST_ORDERED_NODE_TYPE
				).singleNodeValue) &&
				(count++ < unit)
				)
		{
			this.parseOneNode(target);
		}

		if (!count) return;

		if (!this.useGlobalStyleSheets)
			this.setRubyStyle(aWindow);

		this.startProgressiveParse(aWindow);
	},
	
	startProgressiveParse : function(aWindow) 
	{
		aWindow.setTimeout(function(aSelf) {
			aSelf.progressiveParse(aWindow);
		}, 0, this);
	},
  
	parseRuby : function(aNode) 
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
		}
	},
	
	// IE用のマークアップをXHTMLの仕様に準拠したものに修正 
	fixUpMSIERuby : function(aNode)
	{
try{
		var namespace = this.isGecko18OrLater ? this.XHTMLNS : this.RUBYNS;

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
				this.parseRuby(movedContents);
		}


		// 複数あるrtを、一つにまとめる
		var rts = this.evaluateXPath('child::*[contains(" rt RT ", concat(" ", local-name(), " "))]', aNode);
		if (rts.snapshotLength > 1) {
			var text = doc.createElementNS(namespace, 'rtc-ie');
			aNode.insertBefore(text, rts.snapshotItem(0));

			for (i = rts.snapshotLength-1; i > -1; i--)
				text.insertBefore(aNode.removeChild(rts.snapshotItem(i)), text.firstChild);
		}
}catch(e){
	dump(e+'\n');
}
	},
  
	expandAttribute : function(aNode) 
	{
		var root = aNode.ownerDocument.documentElement;

		var mode = nsPreferences.getIntPref(this.kPREF_EXPAND_MODE);
		if (mode == 1) {
			// 既に展開した略語はもう展開しない
			var expanded = root.getAttribute(this.kEXPANDED) || '';
			var key = encodeURIComponent([
						aNode.localName,
						aNode.textContent,
						aNode.title
					].join('::'));
			if (('|'+expanded+'|').indexOf('|'+key+'|') > -1) return;
			root.setAttribute(this.kEXPANDED, (expanded ? expanded + '|' : '' ) + key);
		}

		aNode.setAttribute('rubytext', aNode.title);

		this.reformRubyElement(aNode);
	},
 
	// Apply Stylesheet (legacy operation, for old Mozilla) 
	setRubyStyle : function(targetWindow)
	{
		var doc = targetWindow.document;
		var node = doc.documentElement;
		if (
			!nsPreferences.getBoolPref(this.kPREF_ENABLED) ||
			node.getAttribute(this.kLOADED) == 'true'
			)
			return;

		// ルビ用のスタイルシートを追加する
		this.addStyleSheet('chrome://rubysupport/content/styles/ruby.css', targetWindow);

		if (nsPreferences.getBoolPref(this.kPREF_NOPSEUDS))
			this.addStyleSheet('chrome://rubysupport/content/styles/ruby-expanded-nopseuds.css', targetWindow);

		node.setAttribute(this.kLOADED, true);
	},
	
	addStyleSheet : function(path, targetWindow) 
	{
		var d     = targetWindow.document,
			newPI = document.createProcessingInstruction('xml-stylesheet',
				'href="'+path+'" type="text/css" media="all"');
		d.insertBefore(newPI, d.firstChild);
		return;
	},
   
	reformRubyElement : function(aNode) 
	{
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
		aNode.setAttribute(this.kREFORMED, 'progress');

		window.setTimeout(function(aSelf) {
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
			var rbBox = doc.getBoxObjectFor(baseBoxNode);

			var parent = node.parentNode;
			parent.insertBefore(beforeBoxNode, node);
			parent.insertBefore(afterBoxNode, node.nextSibling);

			var beforeBox = doc.getBoxObjectFor(beforeBoxNode);
			var afterBox  = doc.getBoxObjectFor(afterBoxNode);

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
				rbBox.screenY > beforeBox.screenY ? 'left' :
				rbBox.screenY < afterBox.screenY ? 'right' :
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
		var bases = this.evaluateXPath('descendant::*[contains(" rb RB ", concat(" ", local-name(), " "))]', aNode);
		if (bases.snapshotLength)
			return bases.snapshotItem(0);

		return aNode.getElementsByTagName('*')[0] || aNode.firstChild;
	},
 
	getRubyTexts : function(aNode) 
	{
		var nodes = { top: null, bottom: null };
		if (!aNode) return nodes;

		var texts = this.evaluateXPath('child::*[contains(" rt rtc RT RTC ", concat(" ", local-name(), " "))]', aNode);

		if (texts.snapshotLength > 0)
			nodes.top = texts.snapshotItem(0);
		if (texts.snapshotLength > 1)
			nodes.bottom = texts.snapshotItem(1);

		return nodes;
	},
  
	applyRubyAlign : function(aNode) 
	{
		var align = nsPreferences.copyUnicharPref(this.kSTYLE_ALIGN).toLowerCase();
		aNode.setAttribute(this.kALIGN, align);
		if (/left|start|right|end|center/.test(align)) return;

		var boxes = this.evaluateXPath('descendant::*[contains(" rb rt RB RT ", concat(" ", local-name(), " "))]', aNode);
		for (var i = 0, maxi = boxes.snapshotLength; i < maxi; i++)
			this.justifyText(boxes.snapshotItem(i));
	},
	 
	justifyText : function(aNode) 
	{
		var isWrapped = false;
		var align = nsPreferences.copyUnicharPref(this.kSTYLE_ALIGN).toLowerCase();

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

		var lettersBox = doc.getBoxObjectFor(letters);
		var wholeBox = doc.getBoxObjectFor(
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
		var overhang = nsPreferences.copyUnicharPref(this.kSTYLE_OVERHANG).toLowerCase();
		var align = nsPreferences.copyUnicharPref(this.kSTYLE_ALIGN).toLowerCase();
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

		var doc = aNode.ownerDocument;

		var isWrapped = (aNode.getAttribute('class') == this.kAUTO_EXPANDED);
		var wholeBox = doc.getBoxObjectFor(aNode);

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
			lettersBox = doc.getBoxObjectFor(firstLetters);
			delta = lettersBox.screenX - wholeBox.screenX;
			if (delta >= 0) style += 'margin-left: '+(-delta)+'px !important;';
		}

		if (overhang == 'auto' || overhang == 'end') {
			lastLetters = this.getLettersBox(lastBase, isWrapped);
			if (!lastLetters) {
				lastLettersBoxInserted = true;
				lastLetters = this.insertLettersBox(lastBase);
			}
			lettersBox = doc.getBoxObjectFor(lastLetters);
			delta = (wholeBox.screenX + wholeBox.width)-(lettersBox.screenX + lettersBox.width);
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

		var stacking = nsPreferences.copyUnicharPref(this.kSTYLE_STACKING).toLowerCase();
		if (stacking == 'include-ruby') return;

		var texts = this.getRubyTexts(aNode);
		if (!texts.top && !texts.bottom) return;

		var doc = aNode.ownerDocument;

		var box;
		var style = aNode.getAttribute('style');
		if (texts.top) {
			style += '; margin-top: -'+doc.getBoxObjectFor(texts.top).height+'px !important';
		}
		if (texts.bottom) {
			style += '; margin-bottom: -'+doc.getBoxObjectFor(texts.bottom).height+'px !important';
		}
		aNode.setAttribute('style', style);
	},
  
	init : function() 
	{
		if (this.initialized) return;
		this.initialized = true;

		window.removeEventListener('load', this, false);

		if (!('gBrowser' in window)) return;

		window.addEventListener('unload', this, false);

		try {
			if (this.SSS) {
				this.useGlobalStyleSheets = true;
				this.updateGlobalStyleSheets();
			}

			gBrowser.addEventListener('DOMContentLoaded', this, false);
			gBrowser.addEventListener('DOMNodeInserted', this, false);

			this.overrideFunctions();
		}
		catch(e) {
			dump('CAUTION: XHTML Ruby Support fails to initialize!\n  Error: '+e+'\n');
		}
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

		target = RubyService.findParentNodeWithLocalName(elem, 'ruby');

		if (
			target &&
			!(/^\[object .*Document\]$/.test(String(target))) &&
			!RubyService.evaluateXPath('descendant-or-self::*[@title and not(@title = "")]', target).snapshotLength
			) {
			var rtc = RubyService.evaluateXPath('descendant::*[contains(" rtc RTC ", concat(" ", local-name(), " "))]', target);
			if (rtc.snapshotLength) {
				popuptext = rtc.snapshotItem(0).textContent;
				if (rtc.snapshotLength > 1)
					popuptext += ' / '+rtc.snapshotItem(1).textContent;
			}
			else {
				var rt = RubyService.evaluateXPath('descendant::*[contains(" rt RT ", concat(" ", local-name(), " "))]', target);
				popuptext = rt.snapshotItem(0).textContent;
			}
		}

		if (popuptext) {
			var popup = document.getElementById('aHTMLTooltip');
			popup.removeAttribute('label');
			popup.setAttribute('label', popuptext.replace(/\s\s+/g, ' '));
			return true;
		}

		return __rubysupport__FillInHTMLTooltip(elem);
	},
	findParentNodeWithLocalName : function(aNode, aLocalName)
	{
		var name = String(aLocalName).toLowerCase();
		var node = aNode;
		while (node &&
			String(Components.lookupMethod(node, 'localName').call(node)).toLowerCase() != name)
			node = Components.lookupMethod(node, 'parentNode').call(node);

		return node;
	},
   
	destroy : function() 
	{
		window.removeEventListener('unload', this, false);
		try {
			gBrowser.removeEventListener('DOMContentLoaded', this, false);
			gBrowser.removeEventListener('DOMNodeInserted', this, false);
		}
		catch(e) {
		}
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
			case 'DOMNodeInserted':
				if (!nsPreferences.getBoolPref(this.kPREF_ENABLED)) return;
				var node = aEvent.target;
				var doc = node.ownerDocument || node;
				if (doc == document) return;
				this.parseRubyNodes(doc.defaultView);
				return;
		}
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
 
