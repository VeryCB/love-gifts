#!/usr/bin/env python
# -*- coding: utf-8 -*-

import oauth2 as oauth
import urllib
from datetime import date

def oauth_req(url, post_body, http_headers=None):
    consumer = oauth.Consumer(key="", secret="")
    token = oauth.Token(key="", secret="")
    client = oauth.Client(consumer, token)

    resp, content = client.request(
        url,
        method="POST",
        body=post_body,
        headers=http_headers,
        force_auth_header=True
    )
    return content

acquaintance_day = date(2010,8,11) 
love_day = date(2011,12,9)
today = date.today()

acquaintanced = (today - acquaintance_day).days
loved = (today - love_day).days

message = "今天是我们相识的第%s天，也是我们相爱的第%s天。" % (acquaintanced, loved)

post_body = "status=" + urllib.quote(message)

req = oauth_req(
        "http://api.twitter.com/1/statuses/update.json",
        post_body
        )
