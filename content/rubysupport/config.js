var _elementIDs = [
	'rubysupport.general.enabled',
	'rubysupport.expand.enabled',
	'rubysupport.expand.list',
	'rubysupport.expand.mode',
	'rubysupport.expand.noPseuds',
	'rubysupport.style.default.ruby-align',
	'rubysupport.style.default.ruby-overhang',
	'rubysupport.style.default.line-stacking-ruby'
];

function controlLinkedItems(elem, aShouldEnable, aAttr)
{
	var target = elem.getAttribute(aAttr || 'linked').split(/ +/);
	var item;

	var disabled = (aShouldEnable !== void(0)) ? !aShouldEnable :
				(elem.localName == 'textbox' ? (!elem.value || !Number(elem.value)) : !elem.checked );

	for (var i in target)
	{
		item = document.getElementById(target[i]);
		if (item) item.disabled = disabled;
	}
}
 
// About 
const WindowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
function opener()
{
	return WindowManager.getMostRecentWindow('navigator:browser');
}

function loadURI(aURI, aEvent)
{
	var w = opener();
	if (w) {
		if (
			aEvent.button == 1 ||
			(aEvent.button == 0 && (aEvent.ctrlKey || aEvent.metaKey))
			)
			w.gBrowser.selectedTab = w.gBrowser.addTab(aURI);
		else
			w.loadURI(aURI);
	}
	else
		window.open(aURI);
}
 

function updateExpandCheck()
{
	var value = document.getElementById('rubysupport.expand.list').value;
	document.getElementById('rubysupport.expand.list.abbr').checked = /\b(abbr\s+acronym|acronym\s+abbr)\b/i.test(value);
	document.getElementById('rubysupport.expand.list.dfn').checked = /\bdfn\b/i.test(value);
}

function updateExpandList()
{
	var textbox = document.getElementById('rubysupport.expand.list');

	var value = textbox.value.replace(/\b(abbr|acronym|dfn)\b/g, '');

	if (document.getElementById('rubysupport.expand.list.abbr').checked) {
		value += ' abbr acronym';
	}
	if (document.getElementById('rubysupport.expand.list.dfn').checked) {
		value += ' dfn';
	}

	textbox.value = value.replace(/^\s+|\s+$/g, '').replace(/\s\s+/g, ' ');
}
 
function initGeneralPane()
{
	var node,
		value;
	for (var i in _elementIDs)
	{
		node  = document.getElementById(_elementIDs[i]);
		value = prefService.getPref(node.getAttribute('prefstring'));

		switch (typeof value)
		{
			case 'string':
				node.value = value;
				break;
			case 'number':
				node.selectedIndex = value;
				node.value = value;
				break;
			case 'boolean':
				node.checked = value;
				break;
			default:
				break;
		}
		if (node.localName == 'radiogroup')
			node.selectedItem = node.getElementsByAttribute('value', value)[0];
	}

	updateExpandCheck();

	controlLinkedItems(document.getElementById('rubysupport.expand.enabled'));

	document.getElementById('uninstallBox').setAttribute('hidden', true);

	var stackingGroup = document.getElementById('line-stacking-ruby-group');
	if (RubyService.isGecko19OrLater)
		stackingGroup.removeAttribute('hidden');
	else
		stackingGroup.setAttribute('hidden', true);
}

function apply()
{
	var node,
		prefstring,
		value;
	for (var i in _elementIDs)
	{
		node       = document.getElementById(_elementIDs[i]);
		prefstring = node.getAttribute('prefstring');
		value      = prefService.getPref(prefstring);
		switch (typeof value)
		{
			case 'string':
				if (node.value != value)
					prefService.setPref(prefstring, String(node.value));
				break;
			case 'number':
				if (node.value != value)
					prefService.setPref(prefstring, Number(node.value));
				break;
			case 'boolean':
				if (node.checked != value)
					prefService.setPref(prefstring, node.checked != false);
				break;
			default:
				break;
		}
	}
	window.close();
}
 
