from core.helper import API_KEY_COOKIE_NAME


class CookieAuthorizationMiddleware:
    """
    Promote the encrypted api key cookie into the Authorization header.

    This keeps the existing view code working while moving the browser-side
    storage to an httpOnly cookie.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if (
            "HTTP_AUTHORIZATION" not in request.META
            and request.COOKIES.get(API_KEY_COOKIE_NAME)
        ):
            request.META["HTTP_AUTHORIZATION"] = (
                f"Bearer {request.COOKIES[API_KEY_COOKIE_NAME]}"
            )

        return self.get_response(request)
