from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from checkout.webhook_handlers import StripeWH_Handler

import stripe
import json


@require_POST
@csrf_exempt
def webhook(request):
    """ Listen for Stripe webhooks"""

    # Setup webhook
    wh_secret = settings.STRIPE_WH_SECRET_MS4
    stripe.api_key = settings.STRIPE_SECRET_KEY_MS4

    # Get webhook data
    payload = request.body
    sig_header = request.META['HTTP_STRIPE_SIGNATURE']
    event = None

    try:
        event = stripe.Event.construct_from(
            json.loads(payload.decode('utf-8')), sig_header, stripe.api_key
        )
    except ValueError as e:
        # Invalid payload
        return HttpResponse(status=400)
    except Exception as e:
        return HttpResponse(content=e, status=400)

    #  Init webhook handler
    handler = StripeWH_Handler(request)

    # Map webhook events to handler functions
    event_map = {
        'payment_intent.succeeded': handler.handle_payment_succeeded_event,
        'payment_intent.payment_failed': handler.handle_payment_failed_event,
        'payment_intent.canceled': handler.handle_payment_cancelled_event,
        'customer.subscription.created': handler.handle_subscription_create_event,
        'customer.subscription.updated': handler.handle_subscription_update_event,
        'customer.subscription.deleted': handler.handle_subscription_deleted_event,
        'customer.deleted': handler.handle_customer_deleted_event,
        'charge.failed': handler.handle_payment_failed_event,
        'invoice.payment_succeeded': handler.handle_invoice_payment_succeeded_event,
        'invoice.payment_succeeded': handler.handle_payment_succeeded_event,
        'invoice.paid': handler.handle_invoice_paid_event
    }

    # Get webhook event from Stripe
    event_type = event['type']

    # Use specific handler if function exists, otherwise use generic handler
    event_handler = event_map.get(event_type, handler.handle_stripe_event)

    # Call the handler with event
    response = event_handler(event)
    return response
