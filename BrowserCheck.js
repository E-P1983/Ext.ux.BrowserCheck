/**
 * @class Ext.ux.BrowserDetect
 * @extends Ext.window.Window
 * @author Edwin Platteel (http://sencha.com)
 * Plugin for Browser detection
 *
 * This plugin detects the current type and version of the browser and compares it to a list of allowed browsers&versions.
 * If the current version is 'blacklisted', a notification box can be shown alerting the user of alternative browsers.
 * To be used in conjunction with Ext.ux.BrowserDetect
 */
Ext.define('Ext.ux.BrowserCheck', {
  extend : 'Ext.window.Window',
  requires : ['Ext.window.Window'],
  alias : 'plugin.browsercheck',

  /**
   * Public var that tells if the current browser&version is allowed.
   * Use this var in your callback function if you want to check if current browser/version is allowed.
   */
  allowed : true,

  config : {

    /**
     * Title of the notification box that shows up.
     * Defaults to ''.
     */
    title : '',

    /**
     * Height of the notification box that shows up.
     * Defaults to 500.
     */
    height : 500,

    /**
     * Width of the notification box that shows up.
     * Defaults to 1024.
     */
    width : 1024,

    /**
     * Default HTML value of the notification box.
     * Is populated by the header, footer and content templates during runtime.
     */
    html : '',

    /**
     * Show notification box as modal.
     * Defaults to true.
     */
    modal : true,

    /**
     * Show notification box close button right corner.
     * Defaults to false. If you wish to add this button,
     * you need to write your own custom listener for it.
     */
    closable : false,

    /**
     * The redirect URL that the user will be taken to when clicking the custom
     * close button.
     * Defaults to null.
     */
    redirectUrl : null,

    /**
     * Callback function that can be called instead of specifying the redirectUrl.
     * Use this callback for handling your own custom logout/redirect functionality.
     * The callback receives the whole BrowserCheck object as argument.
     */
    callback : null,

    /**
     * Show custom close button or not.
     * Defaults to true.
     */
    closeButton : true,

    /**
     * Show the notification box or not.
     * Defaults to true. If you set this to false, you can use this plugin
     * to just check the current browser type&version against your blacklist and use the callback function
     * to receive the output(e.g. callback:function(check){ console.log(check.allowed)})
     */
    showNotificationBox : true,

    /**
     * Text for the custom close button.
     */
    closeText : 'Close application',

    /**
     * Title that will be shown if browser not supported. Title shows up in panel.
     */
    notSupportedTitle : 'Your current browser is not supported.',

    /**
     * Text that will be shown if browser not supported. Text shows up in panel.
     */
    notSupportedText : 'Below is a list of alternatives that is supported by this web application.',

    /**
     * Default Header Template to use that will render the html for the notification box.
     */
    headerTpl : ['<div class="uxBrowserCheckPanelHeader"><h1>{notSupportedTitle}</h1><br/>', '<span class="uxBrowserCheckNotSupportedSubText">{notSupportedText}</span>', '</div>'],

    /**
     * Default Body Template to use that will render the html for the notification box.
     */
    bodyTpl : ['<div class="uxBrowserCheckPanelParent">', '<tpl for="alternatives">', '<a href={url} target=_blank>', '<div class="uxBrowserCheckPanelElement">', '<img class="uxBrowserCheckBrowserImage" src="{iconUrl}"><br/>', '<span class="uxBrowserCheckBrowserImageSubtext">{name}</span>', '</div>', '</a>', '</tpl>', '</div>'],

    /**
     * Default Footer Template to use that will render the html for the notification box.
     * If you set this to null, no footer/close button will be shown and the user is effectively 'trapped'.
     */
    footerTpl : ['<div class="uxBrowserCheckPanelFooter"><button id="uxBrowserCheckCloseButton" class="uxBrowserCheckPanelCloseButton">{closeText}</button></div>'],

    /**
     * The list of alternative browsers and their names & urls to download the browser from.
     */
    alternatives : null,

    /**
     * The blacklist of browsers that will be checked against.
     * The format is as follows:
     *
     * IE/FF/Safari/Chrome: { allowed: true (all browsers are allowed of this type)}
     * IE/FF/Safari/Chrome: { versions: { 6: {allowed: false} (6 is not allowed, the rest is allowed)}
     */
    browsers : null
  },

  /**
   * Creates the plugin instance, applies defaults
   * @constructor
   * @param {Object} config Optional config object
   */
  constructor : function(cfg) {
    this.BD = new Ext.ux.BrowserDetect();
    this.callParent(arguments);
    this.initConfig(cfg);
  },

  /**
   * Checks for valid browser & version.
   * Main method.
   */
  check : function() {
    var currentBrowser = this.BD.getBrowser();
    Ext.Array.forEach(this.config.browsers, function(browser, index) {
      if(browser.type.toUpperCase() == currentBrowser.toUpperCase()) {
        browserCfg = browser;
      }
    });
    
    /**
     * If a valid browser cfg has been found, check it.
     * Otherwise, do nothing. 
     */ 
    if(browserCfg){
      this.allowed = this.checkBrowserAndVersion(browserCfg);;
      if(!this.allowed) this.createNotificationBox();  
    }
  },

  /**
   * Create Notification Box if neccessary
   */
  createNotificationBox : function() {
    if(this.config.showNotificationBox) {
      this.constructHeader();
      this.constructAlternatives();
      this.constructFooter();
      this.show();
      this.attachCloseButtonListener();
    } else {
      this.config.callback.apply(this, [this]);
    }
  },

  /**
   * Construct the header in HTML.
   */
  constructHeader : function() {
    var headerTpl = Ext.create('Ext.XTemplate', this.config.headerTpl);
    var header = headerTpl.apply({
      notSupportedTitle : this.config.notSupportedTitle,
      notSupportedText : this.config.notSupportedText
    });
    this.html += header;
  },

  /**
   * Constructs the different alternatives in HTML.
   */
  constructAlternatives : function() {
    var bodyTpl = Ext.create('Ext.XTemplate', this.config.bodyTpl);
    var html = bodyTpl.apply({
      alternatives : this.config.alternatives
    });
    this.bodyStyle = 'background-color: #FFFFFF;';
    this.html += html;
  },

  /**
   * Constructs the footer in HTML.
   */
  constructFooter : function() {
    if(this.config.closeButton) {
      var footerTpl = Ext.create('Ext.XTemplate', this.config.footerTpl);
      var footer = footerTpl.apply({
        closeText : this.config.closeText
      });
      this.html += footer;
    }
  },

  /**
   * Attach a custom listener on the close button
   */
  attachCloseButtonListener : function() {
    Ext.get('uxBrowserCheckCloseButton').on('click', this.onCloseButtonEvent, this);
  },

  /**
   * Handle custom close button click event
   */
  onCloseButtonEvent : function() {
    if(this.config.redirectUrl) {
      this.close();
      window.location.href = this.config.redirectUrl;
    } else if(this.config.callback) {
      this.config.callback.apply(this, [this]);
    } else {
      this.close();
    }
  },

  /**
   * Internal function to check browser valid
   * @param {Object} browserCfg
   */
  checkBrowserAndVersion : function(browserCfg) {
    var allowed = true;
    var version = this.BD.getVersion();

    // check browser level
    if( typeof (browserCfg.allowed) !== 'undefined') {
      if(browserCfg.allowed) {
        allowed = true;
      } else {
        allowed = false;
      }
    } else {
      // check version level
      Ext.Array.forEach(browserCfg.versions, function(versionCfg, index) {
        if(versionCfg[version]) {
          if(!versionCfg[version].allowed) {
            allowed = false;
          } else {
            allowed = true;
          }
        }
      }, this);
    }
    return allowed;
  }
});

