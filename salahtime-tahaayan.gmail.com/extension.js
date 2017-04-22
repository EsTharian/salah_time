const St = imports.gi.St;
const Main = imports.ui.main;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Soup = imports.gi.Soup;
const Util = imports.misc.util;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const City = Me.imports.city;

let stMenu, now, tomorrow;
let vakit = ["imsak", "gunes", "ogle", "ikindi", "aksam", "yatsi"];
let timeof = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];


const buton = new Lang.Class({
    Name: 'buton',
    Extends: PanelMenu.Button,

    _init: function () {
        this.parent(0.0, "Salah Time", false);
        this.buttonText = new St.Label({
            text: _("Salah Time"),
            y_align: Clutter.ActorAlign.CENTER,
            style_class: "panel-button-salah"
        });
        this.actor.add_actor(this.buttonText);

        let params = {
            tarih: "cities"
        };
        let json;
        let link = "http://www.namazvaktim.net/json/sehirler/turkiye.json";
        _httpSession = new Soup.Session();
        let message = Soup.form_request_new_from_hash('GET', link, params);
        _httpSession.queue_message(message, Lang.bind(this, function (_httpSession, message) {
            this.json = JSON.parse(message.response_body.data);
            let l = this.json.cities.length;
            this.sehir = [];
            this.main = new PopupMenu.PopupMenuItem(_("Salah Time Options"));
            this.selecter = new PopupMenu.PopupSubMenuMenuItem(_(City.jsonf.name));
            this.menu.addMenuItem(this.main);
            this.menu.addMenuItem(this.selecter);
            for(let i=0; i < l; i++) {
                this.sehir[i] = new PopupMenu.PopupMenuItem(_(this.json.cities[i].name));
                this.selecter.menu.addMenuItem(this.sehir[i]);
                let s = this.json.cities[i].url;
                let t = this.json.cities[i].name;
                this.sehir[i].connect("activate", Lang.bind(this, function () {
                    stMenu._loadData(s);
                    Util.spawnCommandLine("gnome-terminal -e 'sh -c \" chmod +x " + Me.dir.get_path() + "/cith.sh \"'");
                    Util.spawnCommandLine("gnome-terminal -e 'sh -c \""+ Me.dir.get_path() +"/city.sh "+ s +" "+ t +"> "+ Me.dir.get_path() +"/city.js \" '");
                    stMenu.selecter.label.set_text(t);
                }));
            }
        }));
        this._loadData(City.jsonf.url);
    },

    _loadData: function (city) {
        //TODO: How to do without "params", not running without it
        let params = {
            tarih: "bugun"
        };
        let link = "http://www.namazvaktim.net/json/aylik/"+ city +".json";
        _httpSession = new Soup.Session();
        let message = Soup.form_request_new_from_hash('GET', link, params);
        _httpSession.queue_message(message, Lang.bind(this, function (_httpSession, message) {
            let json = JSON.parse(message.response_body.data);
            this._refreshUI(json);
        }));
    },

    _refreshUI: function (data) {
        let bugun = data.namazvakitleri.vakitler[0];
        let yarin = data.namazvakitleri.vakitler[1];
        global.bugun = bugun;
        global.yarin = yarin;
        this._refresh();
    },

    _addZero: function (val) {
        if(val<10) {
            val = "0" + val;
        }
        return val;
    },

    _refresh: function () {
        now = new Date();
        tomorrow = new Date();
        tomorrow.setDate(now.getDate() + 1);
        for (let i = 0; i < 6; i++) {
            now = new Date();
            let saat = new Date((now.getMonth() + 1) + " " + (now.getDate()) + "," + now.getFullYear() + " " + global.bugun[vakit[i]] + ":00").getTime();
            let yatsi = new Date((now.getMonth() + 1) + " " + (now.getDate()) + "," + now.getFullYear() + " " + global.bugun[vakit[5]] + ":00").getTime();
            let sirada = new Date((tomorrow.getMonth() + 1) + " " + (tomorrow.getMonth()) + "," + tomorrow.getFullYear() + " " + global.yarin[vakit[0]] + ":00").getTime();
            if (saat > now.getTime()) {
                let txt = this._addZero(new Date(saat - now).getHours() - 2) + ":" + this._addZero(new Date(saat - now).getMinutes()) + ":" + this._addZero(new Date(saat - now).getSeconds()) + " to " + timeof[i];
                this.buttonText.set_text(txt);
                break;
            }
            else if (yatsi < now.getTime()) {
                let txt = this._addZero(new Date(sirada - now).getHours() - 2) + ":" + this._addZero(new Date(sirada - now).getMinutes()) + ":" + this._addZero(new Date(sirada - now).getSeconds()) + " to " + timeof[0];
                this.buttonText.set_text(txt);
                break;
            }
        }
        this._doAgain();
    },

    _doAgain: function () {
        if(this._timeout) {
            Mainloop.source_remove(this._timeout);
            this._timeout = null;
        }
        this._timeout = Mainloop.timeout_add_seconds(1, Lang.bind(this, this._refresh));
    }
});

function istanbul() {

}

function init() {

}

function enable() {
    stMenu = new buton;
    Main.panel.addToStatusArea('tw-indicator', stMenu, 1, "left");
}

function disable() {
    stMenu.destroy();
}
