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
		var winWrapper = new XPCNativeWrapper(aWindow, 'document');
		if (!winWrapper.document) return false;

		if (nsPreferences.getBoolPref(this.kPREF_PROGRESSIVE)) {
			this.startProgressiveParse(aWindow);
		}
		else {
			var expression = this.parseTargetExpression+'[last()]';
			var root = (new XPCNativeWrapper(winWrapper.document, 'documentElement')).documentElement;
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
		var nodeWrapper = new XPCNativeWrapper(aNode,
				'localName',
				'hasAttribute()',
				'setAttribute()'
			);
		if (!nodeWrapper.hasAttribute(this.kSTATE)) {
			nodeWrapper.setAttribute(this.kSTATE, 'progress');
			try {
				if (nodeWrapper.localName.toLowerCase() != 'ruby') {
					this.expandAttribute(aNode);
				}
				else {
					this.parseRuby(aNode);
				}
			}
			catch(e) {
					dump(e+'\n > '+aNode+'\n');
			}
			nodeWrapper.setAttribute(this.kSTATE, 'done');
		}

		if (this.isGecko19OrLater)
			nodeWrapper.setAttribute(this.kTYPE, 'inline-table');

		this.delayedReformRubyElement(aNode);
	},
 
	progressiveParse : function(aWindow) 
	{
		var winWrapper = new XPCNativeWrapper(aWindow, 'document');
		var docWrapper = new XPCNativeWrapper(winWrapper.document, 'documentElement');

		var unit = nsPreferences.getIntPref(this.kPREF_PROGRESS_UNIT);
		var target;
		var count = 0;
		while (
				(target = this.evaluateXPath(
					this.parseTargetExpression,
					docWrapper.documentElement,
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
		var winWrapper = new XPCNativeWrapper(aWindow, 'setTimeout()');
		aWindow.setTimeout(function(aSelf) {
			aSelf.progressiveParse(aWindow);
		}, 0, this);
	},
  
	parseRuby : function(aNode) 
	{
		var nodeWrapper = new XPCNativeWrapper(aNode,
				'ownerDocument',
				'setAttribute()'
			);
		var docWrapper = new XPCNativeWrapper(nodeWrapper.ownerDocument,
				'compatMode',
				'contentType',
				'doctype',
				'createElementNS()'
			);


		// 後方互換モードあるいは非XHTMLの場合でのみタグの補完を行う
		if (docWrapper.compatMode == 'BackCompat' ||
			docWrapper.contentType == 'text/html' ||
			!/XHTML/.test(docWrapper.doctype.publicId))
			this.fixUpMSIERuby(aNode);


		// rbspan付きのrtをtdで包む
		// マークアップを破壊するので宜しくないけど、どうせ視覚系ブラウザだし……（ぉぃ
		var rtcs = this.evaluateXPath('descendant::*[contains(" rtc RTC ", concat(" ", local-name(), " "))]', aNode);
		if (rtcs.snapshotLength) {
			var rts = this.evaluateXPath('descendant::*[contains(" rt RT ", concat(" ", local-name(), " ")) and @rbspan and not((@rbspan = "") or (number(@rbspan) < 2) or parent::xhtml:td)]', aNode);

			var tmp_td, tmp_td_content;
			var rtWrapper, parentWrapper;
			for (var i = rts.snapshotLength-1; i > -1; i--)
			{
				rtWrapper = new XPCNativeWrapper(rts.snapshotItem(i),
						'getAttribute()',
						'parentNode'
					);
				parentWrapper = new XPCNativeWrapper(rtWrapper.parentNode,
						'localName',
						'replaceChild()'
					);

				tmp_td = docWrapper.createElementNS(this.XHTMLNS, 'td');
				tmp_td.setAttribute('moz-ruby-inserted', true);
				tmp_td.setAttribute('colspan', rtWrapper.getAttribute('rbspan'));
				// 以下の2行は、一行にまとめて書こうとすると何故かエラーになる
				tmp_td_content = parentWrapper.replaceChild(tmp_td, rts.snapshotItem(i));
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
		var nodeWrapper = new XPCNativeWrapper(aNode,
				'nextSibling',
				'parentNode',
				'childNodes',
				'firstChild',
				'lastChild',
				'insertBefore()',
				'removeChild()',
				'ownerDocument'
			);
		var docWrapper = new XPCNativeWrapper(nodeWrapper.ownerDocument,
				'defaultView',
				'createElementNS()',
				'createRange()'
			);

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


		var range = docWrapper.createRange();
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
		var startWrapper,
			startNextWrapper,
			endWrapper,
			endPreviousWrapper,
			rangeContents,
			rangeContentWrapper;
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
				startWrapper = new XPCNativeWrapper(rts.snapshotItem(i-1), 'nextSibling');
				startNextWrapper = new XPCNativeWrapper(startWrapper.nextSibling, 'localName');
				if (startNextWrapper.localName &&
					startNextWrapper.localName.toLowerCase() == 'rp')
					range.setStartAfter(startWrapper.nextSibling);
				else
					range.setStartAfter(rts.snapshotItem(i-1));
			}

			endWrapper = new XPCNativeWrapper(rts.snapshotItem(i), 'previousSibling');
			endPreviousWrapper = new XPCNativeWrapper(endWrapper.previousSibling, 'localName');
			if (endPreviousWrapper.localName &&
				endPreviousWrapper.localName.toLowerCase() == 'rp')
				range.setEndBefore(endWrapper.previousSibling);
			else
				range.setEndBefore(rts.snapshotItem(i));

			// ルビテキストより前にあるのが単一のrb要素なら、
			// マークアップを補正する必要はないので、ここで処理を終える。
			rangeContents = range.cloneContents();
			if (!rangeContents.childNodes.length) continue;
			if (rangeContents.childNodes.length == 1) {
				rangeContentWrapper = new XPCNativeWrapper(rangeContents.firstChild, 'nodeType');
				if (
					rangeContentWrapper.nodeType == Node.ELEMENT_NODE &&
					(rangeContentWrapper = new XPCNativeWrapper(rangeContents.firstChild, 'localName')).localName.toLowerCase() == 'rb'
					)
					continue;
			}

			containerRubyBase = docWrapper.createElementNS(namespace, 'rb');
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
				var newRubyElement = docWrapper.createElementNS(namespace, 'ruby');
				newRubyElement.appendChild(movedContents);
				movedContents = newRubyElement;
			}

			range.selectNodeContents(nodeWrapper.parentNode);
			range.setStartAfter(aNode);
			range.setEndAfter(aNode);
			range.insertNode(movedContents);
			if (shouldCreateNewRubyElement)
				this.parseRuby(movedContents);
		}


		// 複数あるrtを、一つにまとめる
		var rts = this.evaluateXPath('child::*[contains(" rt RT ", concat(" ", local-name(), " "))]', aNode);
		if (rts.snapshotLength > 1) {
			var text = docWrapper.createElementNS(namespace, 'rtc-ie');
			nodeWrapper.insertBefore(text, rts.snapshotItem(0));

			for (i = rts.snapshotLength-1; i > -1; i--)
				text.insertBefore(nodeWrapper.removeChild(rts.snapshotItem(i)), text.firstChild);
		}
}catch(e){
	dump(e+'\n');
}
	},
  
	expandAttribute : function(aNode) 
	{
		var nodeWrapper = new XPCNativeWrapper(aNode,
				'title',
				'localName',
				'ownerDocument',
				'getAttribute()',
				'setAttribute()'
			);
		var docWrapper = new XPCNativeWrapper(nodeWrapper.ownerDocument,
				'documentElement'
			);
		var rootWrapper = new XPCNativeWrapper(docWrapper.documentElement,
				'getAttribute()',
				'setAttribute()'
			);

		var mode = nsPreferences.getIntPref(this.kPREF_EXPAND_MODE);
		if (mode == 1) {
			// 既に展開した略語はもう展開しない
			var expanded = rootWrapper.getAttribute(this.kEXPANDED) || '';
			var key = encodeURIComponent([
						aNode.localName,
						aNode.textContent,
						nodeWrapper.title
					].join('::'));
			if (('|'+expanded+'|').indexOf('|'+key+'|') > -1) return;
			rootWrapper.setAttribute(this.kEXPANDED, (expanded ? expanded + '|' : '' ) + key);
		}

		nodeWrapper.setAttribute('rubytext', nodeWrapper.title);

		this.reformRubyElement(aNode);
	},
 
	// Apply Stylesheet (legacy operation, for old Mozilla) 
	setRubyStyle : function(targetWindow)
	{
		var winWrapper = new XPCNativeWrapper(targetWindow, 'document');
		var docWrapper = new XPCNativeWrapper(winWrapper.document, 'documentElement');
		var nodeWrapper = new XPCNativeWrapper(docWrapper.documentElement,
				'getAttribute()',
				'setAttribute()'
			);
		if (
			!nsPreferences.getBoolPref(this.kPREF_ENABLED) ||
			nodeWrapper.getAttribute(this.kLOADED) == 'true'
			)
			return;

		// ルビ用のスタイルシートを追加する
		this.addStyleSheet('chrome://rubysupport/content/styles/ruby.css', targetWindow);

		if (nsPreferences.getBoolPref(this.kPREF_NOPSEUDS))
			this.addStyleSheet('chrome://rubysupport/content/styles/ruby-expanded-nopseuds.css', targetWindow);

		nodeWrapper.setAttribute(this.kLOADED, true);
	},
	
	addStyleSheet : function(path, targetWindow) 
	{
		var winWrapper = new XPCNativeWrapper(targetWindow, 'document');

		var d     = winWrapper.document,
			newPI = document.createProcessingInstruction('xml-stylesheet',
				'href="'+path+'" type="text/css" media="all"');

		var docWrapper = new XPCNativeWrapper(d, 'firstChild', 'insertBefore()');
		docWrapper.insertBefore(newPI, docWrapper.firstChild);
		return;
	},
   
	reformRubyElement : function(aNode) 
	{
		var nodeWrapper = new XPCNativeWrapper(aNode,
				'localName',
				'ownerDocument',
				'getAttribute()',
				'setAttribute()'
			);
		var originalNodeWrapper = nodeWrapper;
		if (String(nodeWrapper.localName).toLowerCase() != 'ruby') {
			var docWrapper = new XPCNativeWrapper(nodeWrapper.ownerDocument,
					'getAnonymousElementByAttribute()'
				);
			var ruby = docWrapper.getAnonymousElementByAttribute(aNode, 'class', this.kAUTO_EXPANDED);
			if (!ruby) {
				this.delayedReformRubyElement(aNode);
				return;
			}
			aNode = ruby;
			nodeWrapper = new XPCNativeWrapper(
				aNode,
				'hasAttribute()',
				'setAttribute()'
			);
		}

		if (originalNodeWrapper.getAttribute(this.kREFORMED) == 'done')
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

		originalNodeWrapper.setAttribute(this.kREFORMED, 'done');
	},
	 
	delayedReformRubyElement : function(aNode) 
	{
		var nodeWrapper = new XPCNativeWrapper(aNode,
				'setAttribute()'
			);
		nodeWrapper.setAttribute(this.kREFORMED, 'progress');

		window.setTimeout(function(aSelf) {
			aSelf.reformRubyElement(aNode);
		}, 0, this);
	},
 
	correctVerticalPosition : function(aNode) 
	{
		var node = aNode;
		var nodeWrapper = new XPCNativeWrapper(node,
				'ownerDocument',
				'parentNode',
				'nextSibling',
				'hasAttribute()',
				'getAttribute()',
				'setAttribute()'
			);

		if (!nodeWrapper.parentNode)
			return;

		var docWrapper = new XPCNativeWrapper(nodeWrapper.ownerDocument,
				'getAnonymousElementByAttribute()',
				'getBoxObjectFor()',
				'createElementNS()',
				'createTextNode()'
			);

		if (nodeWrapper.getAttribute('class') == this.kAUTO_EXPANDED) {
			node = nodeWrapper.parentNode;
			nodeWrapper = new XPCNativeWrapper(node,
				'parentNode',
				'nextSibling',
				'hasAttribute()',
				'getAttribute()',
				'setAttribute()'
			);
		}

		try {
			nodeWrapper.setAttribute('style', 'vertical-align: baseline !important;');

			var base = this.getRubyBase(aNode);
			if (!base) return; // if we get box object for "undefined", Mozilla makes crash.


			// 仮のボックスを挿入し、高さ補正の基準にする
			var beforeBoxNode = docWrapper.createElementNS(this.RUBYNS, 'dummyBox');
			beforeBoxNode.appendChild(docWrapper.createTextNode('?'));
			var afterBoxNode  = docWrapper.createElementNS(this.RUBYNS, 'dummyBox');
			afterBoxNode.appendChild(docWrapper.createTextNode('?'));
			var baseBoxNode  = docWrapper.createElementNS(this.RUBYNS, 'dummyBox');
			baseBoxNode.appendChild(docWrapper.createTextNode('?'));

			var baseWrapper = new XPCNativeWrapper(base,
					'firstChild',
					'insertBefore()',
					'removeChild()'
				);
			base.insertBefore(baseBoxNode, base.firstChild);
			var rbBox = docWrapper.getBoxObjectFor(baseBoxNode);

			var parentWrapper = new XPCNativeWrapper(nodeWrapper.parentNode,
					'insertBefore()',
					'removeChild()'
				);
			parentWrapper.insertBefore(beforeBoxNode, node);
			parentWrapper.insertBefore(afterBoxNode, nodeWrapper.nextSibling);

			var beforeBox = docWrapper.getBoxObjectFor(beforeBoxNode);
			var afterBox  = docWrapper.getBoxObjectFor(afterBoxNode);

			var baseBox = (
					Math.abs((rbBox.y+rbBox.height) - (beforeBox.y+beforeBox.height)) >
					Math.abs((rbBox.y+rbBox.height) - (afterBox.y+afterBox.height))
				) ?
					afterBox :
					beforeBox ;

			var offset = (rbBox.y+rbBox.height) - (baseBox.y+baseBox.height);
			if (offset != 0)
				nodeWrapper.setAttribute('style', 'vertical-align: '+offset+'px !important;');

			nodeWrapper.setAttribute(this.kLINE_EDGE,
				rbBox.screenY > beforeBox.screenY ? 'left' :
				rbBox.screenY < afterBox.screenY ? 'right' :
				'none'
			);

			parentWrapper.removeChild(beforeBoxNode);
			parentWrapper.removeChild(afterBoxNode);
			baseWrapper.removeChild(baseBoxNode);
		}
		catch(e) {
//dump(e+'\n');
		}

		return;
	},
	
	getRubyBase : function(aNode) 
	{
		if (!aNode) return null;
		var bases = this.evaluateXPath('child::*[contains(" rb rbc RB RBC ", concat(" ", local-name(), " "))]', aNode);
		if (bases.snapshotLength)
			return bases.snapshotItem(0);

		var nodeWrapper = new XPCNativeWrapper(aNode, 'firstChild', 'getElementsByTagName()');
		return nodeWrapper.getElementsByTagName('*')[0] || nodeWrapper.firstChild;
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
		var nodeWrapper = new XPCNativeWrapper(aNode,
				'setAttribute()'
			);
		var align = nsPreferences.copyUnicharPref(this.kSTYLE_ALIGN).toLowerCase();
		nodeWrapper.setAttribute(this.kALIGN, align);
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
		var wholeWrapper = new XPCNativeWrapper(aNode,
				'textContent',
				'localName',
				'parentNode',
				'ownerDocument',
				'setAttribute()',
				'getAttribute()',
				'appendChild()'
			);
		text = wholeWrapper.textContent;
		if (!text && wholeWrapper.localName.toLowerCase() == 'rb') {
			var ruby = new XPCNativeWrapper(
					wholeWrapper.parentNode,
					'parentNode',
					'getAttribute()'
				);
			if (ruby.getAttribute('class') != this.kAUTO_EXPANDED) return;
			text = (new XPCNativeWrapper(ruby.parentNode, 'textContent')).textContent;
			isWrapped = true;
		}
		text = text.replace(/\s\s+|^\s+|\s+$/g, '');

		// 英単語の間に字間を入れるかどうか
		if (align != 'distribute-letter' && align != 'distribute-space')
			text = text.replace(/[\u0020-\u024F]+/ig, 'a');

		// 1文字しかなければ処理をスキップ
		if (text.length <= 1) return;


		// 字間を求める
		var docWrapper = new XPCNativeWrapper(wholeWrapper.ownerDocument,
				'createTextNode()',
				'createElementNS()',
				'getBoxObjectFor()'
			);
		var boxInserted = false;
		var letters = this.getLettersBox(aNode, isWrapped);
		if (!letters) {
			boxInserted = true;
			letters = this.insertLettersBox(aNode);
		}

		var lettersBox = docWrapper.getBoxObjectFor(letters);
		var wholeBox = docWrapper.getBoxObjectFor(
				(new XPCNativeWrapper(wholeWrapper.parentNode, 'localName'))
					.localName.toLowerCase() == 'td' ?
					wholeWrapper.parentNode :
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


		if (isWrapped) {
			wholeWrapper.setAttribute('style',
				wholeWrapper.getAttribute('style')+
				'; text-align: right !important;'
			);
		}
		else {
			// 最後の文字をspanで囲う
			var lastLetterNode = this.findLastLetterNode(aNode);
			if (!lastLetterNode) return;

			var nodeWrapper = new XPCNativeWrapper(lastLetterNode,
					'nodeValue',
					'parentNode'
				);
			nodeWrapper.nodeValue = nodeWrapper.nodeValue.replace(/([^\s]\s*)$/, '');
			var lastLetter = docWrapper.createElementNS(this.XHTMLNS, 'span');
			lastLetter.setAttribute('class', this.kLAST_LETTER_BOX);
			lastLetter.appendChild(docWrapper.createTextNode(RegExp.$1));

			var parentWrapper = new XPCNativeWrapper(nodeWrapper.parentNode,
					'appendChild()'
				);
			parentWrapper.appendChild(lastLetter);
		}


		wholeWrapper.setAttribute('style',
			wholeWrapper.getAttribute('style')+
			'; letter-spacing: '+space+'px !important;'
		);
	},
 	
	getLettersBox : function(aNode, aWrapped) 
	{
		var nodeWrapper = new XPCNativeWrapper(aNode,
				'ownerDocument',
				'parentNode'
			);
		var docWrapper = new XPCNativeWrapper(nodeWrapper.ownerDocument,
				'getAnonymousElementByAttribute()',
				'defaultView'
			);

		var letters = null;
		if (aWrapped) {
			var ruby = new XPCNativeWrapper(nodeWrapper.parentNode,
					'parentNode'
				);
			letters = docWrapper.getAnonymousElementByAttribute(ruby.parentNode, 'class', this.kLETTERS_BOX);
		}
		else {
			var letters = docWrapper.getAnonymousElementByAttribute(aNode, 'class', this.kLETTERS_BOX);
			var winWrapper = new XPCNativeWrapper(docWrapper.defaultView,
					'getComputedStyle()'
				);
			if (!letters &&
				winWrapper.getComputedStyle(aNode, null).getPropertyValue('display') == 'inline')
				letters = aNode;
		}
		return letters;
	},
 
	insertLettersBox : function(aNode, aWrapped) 
	{
		var nodeWrapper = new XPCNativeWrapper(aNode,
				'ownerDocument'
			);
		var docWrapper = new XPCNativeWrapper(nodeWrapper.ownerDocument,
				'createElementNS()',
				'createRange()'
			);

		var letters = docWrapper.createElementNS(this.XHTMLNS, 'span');
		letters.setAttribute('class', this.kLETTERS_BOX);

		var range = docWrapper.createRange();
		range.selectNodeContents(aNode);
		letters.appendChild(range.extractContents());
		range.insertNode(letters);
		range.detach();

		return letters;
	},
 
	clearInnerBox : function(aNode, aInnerBox) 
	{
		var nodeWrapper = new XPCNativeWrapper(aNode,
				'ownerDocument'
			);
		var docWrapper = new XPCNativeWrapper(nodeWrapper.ownerDocument,
				'createRange()'
			);
		var range = docWrapper.createRange();
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
		var nodeWrapper = new XPCNativeWrapper(aNode, 'childNodes');
		var nodes = nodeWrapper.childNodes;
		var node;
		for (var i = nodes.length-1; i > -1; i--)
		{
			node = new XPCNativeWrapper(nodes[i],
				'nodeType',
				'nodeValue'
			);
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

		var baseWrapper = new XPCNativeWrapper(base,
				'localName',
				'ownerDocument'
			);
		if (baseWrapper.localName.toLowerCase() == 'rbc') {
			var expression = 'child::*[contains(" rb RB ", concat(" ", local-name(), " "))]';
			firstBase = this.evaluateXPath(expression+'[1]', base, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
			lastBase = this.evaluateXPath(expression+'[last()]', base, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;
		}

		var nodeWrapper = new XPCNativeWrapper(aNode,
				'ownerDocument',
				'setAttribute()',
				'getAttribute()'
			);
		var docWrapper = new XPCNativeWrapper(nodeWrapper.ownerDocument,
				'getBoxObjectFor()'
			);

		var isWrapped = (nodeWrapper.getAttribute('class') == this.kAUTO_EXPANDED);
		var wholeBox = docWrapper.getBoxObjectFor(aNode);

		var style = nodeWrapper.getAttribute('style');

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
			lettersBox = docWrapper.getBoxObjectFor(firstLetters);
			delta = lettersBox.screenX - wholeBox.screenX;
			if (delta >= 0) style += 'margin-left: '+(-delta)+'px !important;';
		}

		if (overhang == 'auto' || overhang == 'end') {
			lastLetters = this.getLettersBox(lastBase, isWrapped);
			if (!lastLetters) {
				lastLettersBoxInserted = true;
				lastLetters = this.insertLettersBox(lastBase);
			}
			lettersBox = docWrapper.getBoxObjectFor(lastLetters);
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

		nodeWrapper.setAttribute('style', style);
	},
 
	applyLineStacking : function(aNode) 
	{
		if (!this.isGecko19OrLater) return;

		var stacking = nsPreferences.copyUnicharPref(this.kSTYLE_STACKING).toLowerCase();
		if (stacking == 'include-ruby') return;

		var texts = this.getRubyTexts(aNode);
		if (!texts.top && !texts.bottom) return;

		var nodeWrapper = new XPCNativeWrapper(aNode,
				'ownerDocument',
				'setAttribute()',
				'getAttribute()'
			);
		var docWrapper = new XPCNativeWrapper(nodeWrapper.ownerDocument,
				'getBoxObjectFor()'
			);

		var box;
		var style = nodeWrapper.getAttribute('style');
		if (texts.top) {
			style += '; margin-top: -'+docWrapper.getBoxObjectFor(texts.top).height+'px !important';
		}
		if (texts.bottom) {
			style += '; margin-bottom: -'+docWrapper.getBoxObjectFor(texts.bottom).height+'px !important';
		}
		nodeWrapper.setAttribute('style', style);
	},
  
	init : function() 
	{
		if (this.initialized) return;
		this.initialized = true;

		window.addEventListener('unload', this, false);

		try {
			window.removeEventListener('load', this, false);
			window.removeEventListener('load', this, false);
		}
		catch(e) {
		}

		try {
			if (nsPreferences.getBoolPref(this.kPREF_ENABLED) === null)
				nsPreferences.setBoolPref(this.kPREF_ENABLED, true);

			if (nsPreferences.getBoolPref(this.kPREF_PROGRESSIVE) === null)
				nsPreferences.setBoolPref(this.kPREF_PROGRESSIVE, true);

			if (nsPreferences.getIntPref(this.kPREF_PROGRESS_UNIT) === null)
				nsPreferences.setIntPref(this.kPREF_PROGRESS_UNIT, 30);

			if (nsPreferences.getBoolPref(this.kPREF_EXPAND) === null)
				nsPreferences.setBoolPref(this.kPREF_EXPAND, true);

			if (nsPreferences.copyUnicharPref(this.kPREF_EXPAND_LIST) === null)
				nsPreferences.setUnicharPref(this.kPREF_EXPAND_LIST, 'abbr acronym dfn');

			if (nsPreferences.getIntPref(this.kPREF_EXPAND_MODE) === null)
				nsPreferences.setIntPref(this.kPREF_EXPAND_MODE, 1);

			if (nsPreferences.getBoolPref(this.kPREF_NOPSEUDS) === null)
				nsPreferences.setBoolPref(this.kPREF_NOPSEUDS, true);

			if (nsPreferences.copyUnicharPref(this.kSTYLE_ALIGN) === null)
				nsPreferences.setUnicharPref(this.kSTYLE_ALIGN, 'auto');
			if (nsPreferences.copyUnicharPref(this.kSTYLE_OVERHANG) === null)
				nsPreferences.setUnicharPref(this.kSTYLE_OVERHANG, 'none');
			if (nsPreferences.copyUnicharPref(this.kSTYLE_STACKING) === null)
				nsPreferences.setUnicharPref(this.kSTYLE_STACKING, 'exclude-ruby');

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
				var nodeWrapper = new XPCNativeWrapper(node, 'ownerDocument');
				var doc = nodeWrapper.ownerDocument || node;
				if (doc == document) return;
				var docWrapper = new XPCNativeWrapper(doc, 'defaultView');
				this.parseRubyNodes(docWrapper.defaultView);
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
		var doc = aContextNode ? (new XPCNativeWrapper(aContextNode, 'ownerDocument')).ownerDocument : document ;
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
window.addEventListener('load', RubyService, false);
 
