const St = imports.gi.St;
const Main = imports.ui.main;
const Lang = imports.lang;
const Util = imports.misc.util;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;
const Clutter = imports.gi.Clutter;

const VpnIndicator = new Lang.Class({
    Name: 'VpnIndicator',
    Extends: PanelMenu.Button,

    _init: function() {
        this.parent(0.0, "VPN and SNX Indicator", false);
        
        this.buttonText = new St.Label({
            y_align: Clutter.ActorAlign.CENTER
        });

        this.disconnectMenuItem = new PopupMenu.PopupMenuItem("Disconnect");
        this.disconnectMenuItemClickId = this.disconnectMenuItem.connect('activate', Lang.bind(this, this._disconnectSNX));
        this.menu.addMenuItem(this.disconnectMenuItem);
        
        this._refresh();
    },

    _checkVPN: function() {
        let [res, out, err, exit] = GLib.spawn_sync(null, ["/bin/bash", "-c", "ifconfig -a | grep -E '^(tun0|proton0)'"], null, GLib.SpawnFlags.SEARCH_PATH, null); 
        return exit;
    },

    _checkSNX: function() {
        let [res, out, err, exit] = GLib.spawn_sync(null, ["ip", "link", "show", "tunsnx"], null, GLib.SpawnFlags.SEARCH_PATH, null);  
        return exit;
    },

    _disconnectSNX: function () {
        GLib.spawn_async(null, ['snx', '-d'], null, GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD, null);
        this._refreshUI();
    },

    _refresh: function() {
        this._refreshUI();

        if (this._timeout) {
            Mainloop.source_remove(this._timeout);
            this._timeout = null;
        }

        this._timeout = Mainloop.timeout_add_seconds(2, Lang.bind(this, this._refresh));
    },

    _refreshUI: function() {
        let check = this._checkVPN();
        let snx = false;
        if (check != 0) {
           check = this._checkSNX();
           snx = true; 
        }   
        
        this.disconnectMenuItem.visible = check == 0 && snx;

        if (check == 0) { 
            this.buttonText.set_style('color: #68A213; font-weight: bold; font-size: small;'); 
            this.buttonText.set_text((snx ? 'SNX' : 'VPN') + ' Active');
            this.actor.add_actor(this.buttonText);            
        } else { 
            this.buttonText.set_style('');
            this.buttonText.set_text('');
            this.actor.remove_actor(this.buttonText);
        }
    }            
});

let twMenu;

function init() {
}

function enable() {
    twMenu = new VpnIndicator;
    Main.panel.addToStatusArea('vpn-indicator', twMenu);
}

function disable() {
    twMenu.destroy();
}
