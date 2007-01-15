const ID = '{0620B69D-7B58-416d-A92A-0198860C2757}'; 

var _elementIDs = [
	'rubysupport.general.enabled',
	'rubysupport.abbrToRuby.enabled',
	'rubysupport.abbrToRuby.mode',
	'rubysupport.abbrToRuby.noPseuds'
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

function loadURI(uri)
{
	if (opener())
		opener().loadURI(uri);
	else
		window.open(uri);
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
	knsISupportsString : ('nsISupportsWString' in Components.interfaces) ? Components.interfaces.nsISupportsWString : Components.interfaces.nsISupportsString,

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
					return this.Prefs.getComplexValue(aPrefstring, this.knsISupportsString).data;
					break;
				case this.Prefs.PREF_INT:
					return this.Prefs.getIntPref(aPrefstring);
					break;
				default:
					return this.Prefs.getBoolPref(aPrefstring);
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
				var string = Components.classes[this.kSupportsString].createInstance(this.knsISupportsString);
				string.data = aNewValue;
				this.Prefs.setComplexValue(aPrefstring, this.knsISupportsString, string);
				break;
			case 'number':
				this.Prefs.setIntPref(aPrefstring, parseInt(aNewValue));
				break;
			default:
				this.Prefs.setBoolPref(aPrefstring, aNewValue);
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
 
