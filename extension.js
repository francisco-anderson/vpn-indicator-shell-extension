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

        this.btn_vpn = new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
            style: 'color: #68A213; font-weight: bold; font-size: small; margin: 0px; padding: 0px;',            
            text: ''
        });
        this.actor.add_actor(this.btn_vpn);
        
        this.mi_snx_disconnect = new PopupMenu.PopupMenuItem("Disconnect SNX");
        this.mi_snx_disconnect.connect('activate', Lang.bind(this, this._disconnectSNX));
        this.menu.addMenuItem(this.mi_snx_disconnect);
        
        Main.panel.addToStatusArea('vpn-snx-indicator', this);

        this._refresh();
        
        this._timer = Mainloop.timeout_add_seconds(2, Lang.bind(this, this._refresh));
    },

    _checkVPN: function() {
        let [res, out, err, exit] = GLib.spawn_sync(
            null, ["/bin/bash", "-c", "ifconfig -a | grep -E '^(tun0|proton0)'"], null, GLib.SpawnFlags.SEARCH_PATH, null
        ); 
        return exit;
    },

    _checkSNX: function() {
        let [res, out, err, exit] = GLib.spawn_sync(
            null, ["ip", "link", "show", "tunsnx"], null, GLib.SpawnFlags.SEARCH_PATH, null
        );  
        return exit;
    },

    _disconnectSNX: function () {
        GLib.spawn_async(null, ['snx', '-d'], null, GLib.SpawnFlags.SEARCH_PATH, null);
        this._refresh();
    },

    _refresh() {
        let check_standert_vpn = this._checkVPN();
        let check_snx_vpn = this._checkSNX();
                        
        this.mi_snx_disconnect.visible = check_snx_vpn == 0;
        this.visible = check_standert_vpn == 0 || check_snx_vpn == 0;
    
        if (check_standert_vpn + check_snx_vpn == 0) {
            this.btn_vpn.set_text('SNX / VPN');
        } else if (check_standert_vpn == 0) {
            this.btn_vpn.set_text('VPN');
        } else if (check_snx_vpn == 0) {
            this.btn_vpn.set_text('SNX');
        } else {
            this.btn_vpn.set_text('');
        }

        return true;        
    },

    destroy() {
        this.mi_snx_disconnect.destroy();
        this.btn_vpn.destroy();

        if (this._timer) {
            Mainloop.source_remove(this._timer);
            this._timer = undefined;
        }
        this.parent();
    }
});

var indicator = null;

function init() {
}

function enable() {
    indicator = new VpnIndicator;
}

function disable() {
    indicator.destroy();
    indicator = null;
}
