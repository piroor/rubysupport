function initGeneralPane()
{
	updateExpandCheck();
	controlLinkedItems(document.getElementById('rubysupport.expand.enabled-check'));
}

function initStylePane()
{
	var stackingGroup = document.getElementById('line-stacking-ruby-group');
	if (RubyService.isGecko19OrLater)
		stackingGroup.removeAttribute('hidden');
	else
		stackingGroup.setAttribute('hidden', true);
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
