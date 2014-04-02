# History

 - master/HEAD
   * Modified: "jar" archive is no longer included.
   * Many tiny fixes. See the [commit log](https://github.com/piroor/rubysupport/commits/master) for more information.
 - 3.0.2009060901
   * Improved: Dynamic changes for RUBY elements, insertions and modifications of shown/hidden are observed. (Modifications of shown/hidden are observed only on Firefox 3.5 or later.)
   * Fixed: RUBY are disabled for abbreviations which have TITLE attribute equals to their content.
   * Fixed: Wrong letter-spacings between not-wide-cell characters (Greek alphabets, Cyrillic alphabet, etc.) disappeared.
 - 3.0.2009040901
   * Improved: Works for Split Browser panes and sidebar contents.
 - 3.0.2009040201
   * Works on Minefield.
   * Drop support for old Firefox.
 - 2.1.2008040101
   * Fixed: Wrong vertical-align of complex ruby elements disappeared.
   * Fixed: Wrong letter-spacing of narrow characters and wide characters in ruby base or ruby text disappeared.
 - 2.1.2008031701
   * Improved: Alignment and overflowing of ruby elements become customizable based on [CSS3 Ruby Module](http://www.w3.org/TR/css3-ruby/) specification.
   * Improved: Line height of lines including ruby elements can keep its original height based on [CSS3 Line Module](http://www.w3.org/TR/css3-linebox/#line-stacking-ruby) specification. (available on Minefield)
   * Fixed: Some settings work correctly.
 - 2.0.2008031401
   * Fixed: CPU usage issue disappeared.
 - 2.0.2008031301
   * Improved: Base texts of ruby from abbreviations (or others) are shown with justified spaces.
   * Improved: You can show not only abbreviations but definitiosn (and others) also as ruby.
   * Modified: Ruby elements are parsed progressively.
   * Improved: Appearance of ruby elements inserted after the page is completely loaded are corrected automatically.
   * Fixed: Line-breaks in tooltips disappeared on Minefield.
 - 1.6.2008031201
   * Improved: Texts in ruby markups are aligned with justified spaces.
   * Fixed: Abbreviations are shown as ruby correctly.
 - 1.5.2008031101
   * Improved: Works on Minefield 3.0b5pre.
   * Improved: Performance of switching tabs, back/forward, and other cases are optimized.
 - 1.4.2006100801
   * Fixed: Internal operations for correcting vertical position of ruby elements work correctly even if fullspels of abbreviations are not shown as ruby.
 - 1.4.2005110501
   * Fixed: Fullspells of abbreviations are shown as ruby correctly.
   * Fixed: Uninstallation button disappeared for Forefox.
 - 1.4.20050828
   * Fixed: Internal operations for correcting vertical position of ruby elements are improved (by Takeshi Nishimura.)
 - 1.4.20050713
   * Fixed: Works correctly on Deer Park Alpha2.
 - 1.4.20050604
   * Fixed: The algorithm of parsing ruby elements written for MSIE is corrected.
   * Modified: Implementations are rewritten with DOM3 XPath.
 - 1.3.20050422
   * Fixed: The algorithm of parsing ruby elements written for MSIE is corrected.
 - 1.3.20050420
   * Fixed: Vanishing ruby-base problem disappeared.
   * Fixed: Some internal operations are brushed up.
 - 1.3.20050419
   * Improved: Appearance of ruby text is corrected.
   * Improved: Vertical position of ruby element is calculated more correctly.
 - 1.3.20050227
   * Fixed: The algorithm of parsing ruby elements written for MSIE is improved.
   * Fixed: An error in the algorithm of parsing ruby elements written for MSIE disappeared.
 - 1.3.20050224
   * Fixed: The algorithm of parsing ruby elements written for MSIE is improved.
 - 1.3.20050218
   * Fixed: The algorithm of parsing ruby elements written for MSIE is improved.
 - 1.3.20050121
   * Fixed: The algorithm of parsing ruby elements written for MSIE is improved.
 - 1.3.20050115
   * Fixed: The algorithm of parsing ruby elements written for MSIE is improved. (by Takeshi Nishimura)
   * Fixed: Rubys are shown correctly for pages in subframes. (by Takeshi Nishimura)
   * Fixed: Complex Ruby elements are shown correctly even if they have "rbspan" attribute. (by Takeshi Nishimura)
   * Fixed: The first abbreviation, not the last one, is shown as ruby correctly.
 - 1.3.20040818
   * Fixed: Danger of freezing the dialog of Firefox options is resolved.
 - 1.3.20040523
   * Improved: Configuration dialog for Firefox has been available.
 - 1.3.20030612
   * Fixed: Broken behavior in the latest Mozilla has been corrected.
 - 1.3.20030413
   * Fixed: Garbages in overlays.rdf in the profile directory have been removed completely by self uninstaller. (These garbages obstructed installing into the directory Mozilla installed, after uninstalling from the profile directory.)
 - 1.3.20030405
   * Fixed: Popups of rubytexts have been available again.
   * Fixed: A fatal error in the uninstaller has been removed.
 - 1.3.20021222
   * Modified:
No stylesheet has been appended when the page have no RUBY elements.
(This is a fix for a problem which XML resources weren't shown with
tree-style.)
   * Fixed: A fatal error on parsing has been fixed.
 - 1.3.20021127
   * Fixed: A fatal problem which latest Mozilla failed to open new tabs has been fixed.
 - 1.3.20021120
   * Fixed: Ruby rendering has been available again.
 - 1.3.20021119
   * Modified: The function  `getBrowser()`  has been not used in this package.
   * Modified: The operation to gather texts in a element has been rewrited.
 - 1.3.20021004
   * Improved: The service of this package has been able to change activity with "Extensions" panel of Phoenix
 - 1.3.20021003
   * Experiment: Phoenix has been tentatively supported.
 - 1.3.20020930
   * Fixed: A crash bug, which is caused by RUBY elements in "text/html" pages with Mozilla 1.2 later, has been fixed.
 - 1.3.20020928
   * Fixed: A problem in concatenation of node lists has been fixed.
   * Fixed: Problems caused by  `Array.concat()`  have been fixed.
 - 1.3.20020925
   * Fixed: Self uninstaller has been available.
   * Modified:
Recovering broken DOM tree by invalid ruby markups has been available
not only in the Quirks Mode but with a HTML document which is not XHTML.
 - 1.3.20020923
   * Improved: Ruby rendering has been worked without JavaScript in Navigator.
   * Modified: The operation to locate ruby elements to best positions has been available always.
 - 1.2.20020918
   * Fixed: Self uninstaller has been available in Mozilla 1.2a later.
 - 1.2.20020912
   * Fixed: This addon has been independent from other extensions completely.
   * Improved: Multiple rubytexts for IE have been rendered properly.
   * Fixed: The operation to locate ruby elements to best positions has been work anytime.
 - 1.2.20020907
   * Improved: Each ruby elements has been able to be rendered in the best position with XBL implementation. (*risky)
 - 1.1.20020830
   * Modified: Codes for NS6 have been removed.
   * Fixed: Complex ruby rendering has been available again.
   * Improved: You can view ruby texts with tooltips.
   * Improved: The self uninstaller has been launched.
 - 1.0.20020821
   * Fixed: The feature to restore broken ruby markups for IE has been available again.
 - 1.0.20020628
   * Modified:
Under environments of Mozilla 1.0 or later,
"@mozilla.org/appshell/window-mediator;1" got to be used instead of
"@mozilla.org/rdf/datasource;1?name=window-mediator".
 - 1.0.20020531
   * Fixed: Irrelevant codes were eliminated.
 - 1.0.20020528
   * Fixed: Functional confiliction problem with the ContextMenu Extentions was amended.
 - 1.0.20020527
   * Separated from the package of ContextMenu Extentions.
   * Modified: Some expressions of configurations were changed a little.
