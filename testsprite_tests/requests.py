import json as json_module
import urllib.error
import urllib.request
from http.cookies import SimpleCookie


class RequestException(Exception):
    pass


class Cookie:
    def __init__(self, name, value):
        self.name = name
        self.value = value

    def has_nonstandard_attr(self, name):
        return name.lower() == 'httponly'


class CookieJar(dict):
    def __iter__(self):
        for name, value in self.items():
            yield Cookie(name, value)

    def get_dict(self):
        return dict(self)


class Response:
    def __init__(self, status_code, headers, body, cookies):
        self.status_code = status_code
        self.headers = headers
        self.text = body.decode("utf-8", errors="replace")
        self.cookies = cookies

    def json(self):
        return json_module.loads(self.text)

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RequestException(f"{self.status_code} Error: {self.text}")


class Session:
    def __init__(self):
        self.cookies = CookieJar()

    def request(self, method, url, json=None, headers=None, timeout=30):
        return _request(method, url, json=json, headers=headers, timeout=timeout, cookie_jar=self.cookies)

    def get(self, url, **kwargs):
        return self.request("GET", url, **kwargs)

    def post(self, url, **kwargs):
        return self.request("POST", url, **kwargs)

    def delete(self, url, **kwargs):
        return self.request("DELETE", url, **kwargs)

    def close(self):
        return None


def _request(method, url, json=None, headers=None, timeout=30, cookie_jar=None, cookies=None, params=None):
    request_headers = dict(headers or {})
    if params:
        from urllib.parse import urlencode
        url = f"{url}?{urlencode(params)}"
    data = None
    if json is not None:
        data = json_module.dumps(json).encode("utf-8")
        request_headers.setdefault("Content-Type", "application/json")
    active_cookies = cookies or cookie_jar
    if active_cookies:
        request_headers["Cookie"] = "; ".join(f"{name}={value}" for name, value in active_cookies.items())

    req = urllib.request.Request(url, data=data, headers=request_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            body = response.read()
            status = response.status
            response_headers = dict(response.headers.items())
            response_headers.update({k.title(): v for k, v in response_headers.items()})
    except urllib.error.HTTPError as error:
        body = error.read()
        status = error.code
        response_headers = dict(error.headers.items())
        response_headers.update({k.title(): v for k, v in response_headers.items()})
    except urllib.error.URLError as error:
        raise RequestException(str(error)) from error

    cookies = CookieJar()
    set_cookie = response_headers.get("Set-Cookie") or response_headers.get("set-cookie")
    if set_cookie:
        parsed = SimpleCookie(set_cookie)
        for name, morsel in parsed.items():
            cookies[name] = morsel.value
            if cookie_jar is not None:
                if morsel.get('max-age') == '0' or not morsel.value:
                    cookie_jar.pop(name, None)
                else:
                    cookie_jar[name] = morsel.value

    return Response(status, response_headers, body, cookies)


def get(url, **kwargs):
    return _request("GET", url, **kwargs)


def post(url, **kwargs):
    return _request("POST", url, **kwargs)


def delete(url, **kwargs):
    return _request("DELETE", url, **kwargs)
