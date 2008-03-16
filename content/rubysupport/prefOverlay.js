const ID = '{0620B69D-7B58-416d-A92A-0198860C2757}'; 

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
 
// Uninstall 
var unreg = new exUnregisterer(
	'chrome://rubysupport/content/contents.rdf',
	'jar:%chromeFolder%rubysupport.jar!/locale/en-US/rubysupport/contents.rdf',
	'jar:%chromeFolder%rubysupport.jar!/locale/ja-JP/rubysupport/contents.rdf'
);
var STRBUNDLE = Components.classes['@mozilla.org/intl/stringbundle;1'].getService(Components.interfaces.nsIStringBundleService);
var msg = STRBUNDLE.createBundle('chrome://rubysupport/locale/rubysupport.properties');


function Unregister()
{
	if (!confirm(msg.GetStringFromName('uninstall_confirm'))) return;

	if (!confirm(msg.GetStringFromName('uninstall_prefs_confirm')))
		window.unreg.removePrefs('rubysupport');

	window.unreg.unregister();

	alert(
		msg.GetStringFromName('uninstall_removefile').replace(/%S/i,
			window.unreg.getFilePathFromURLSpec(
				(window.unreg.exists(window.unreg.UChrome+'rubysupport.jar') ? window.unreg.UChrome+'rubysupport.jar' : window.unreg.Chrome+'rubysupport.jar' )
			)
		)
	);

	window.close();
}
 
var prefService = { 
	get Prefs()
	{
		if (!this._Prefs) {
			this._Prefs = Components.classes['@mozilla.org/preferences;1'].getService(Components.interfaces.nsIPrefBranch);
		}
		return this._Prefs;
	},
	_Prefs : null,

	getPref : function(aPrefstring)
	{
		try {
			var type = this.Prefs.getPrefType(aPrefstring);
			switch (type)
			{
				case this.Prefs.PREF_STRING:
					return nsPreferences.copyUnicharPref(aPrefstring);
					break;
				case this.Prefs.PREF_INT:
					return nsPreferences.getIntPref(aPrefstring);
					break;
				default:
					return nsPreferences.getBoolPref(aPrefstring);
					break;
			}
		}
		catch(e) {
		}

		return null;
	},

	setPref : function(aPrefstring, aNewValue)
	{
		var type;
		try {
			type = typeof aNewValue;
		}
		catch(e) {
			type = null;
		}

		switch (type)
		{
			case 'string':
				nsPreferences.setUnicharPref(aPrefstring, aNewValue);
				break;
			case 'number':
				nsPreferences.setIntPref(aPrefstring, parseInt(aNewValue));
				break;
			default:
				nsPreferences.setBoolPref(aPrefstring, aNewValue ? true : false );
				break;
		}
		return true;
	},

	clearPref : function(aPrefstring)
	{
		try {
			this.Prefs.clearUserPref(aPrefstring);
		}
		catch(e) {
		}

		return;
	}
};

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
 
