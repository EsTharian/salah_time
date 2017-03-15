#!/usr/bin/python3
# -*- coding: utf-8 -*-
import gi
gi.require_version("Notify", "0.7")
from gi.repository import Notify
Notify.init("Salah")
Hello = Notify.Notification.new("Hatirla", "Hatirla", "dialog-information")
Hello.show()
