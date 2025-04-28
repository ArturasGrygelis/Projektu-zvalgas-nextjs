from fastapi import APIRouter, Request, HTTPException
import stripe
import os
from typing import Dict, Any

router = APIRouter()

# Initialize Stripe - use environment variables in production
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "your_stripe_secret_key")
webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "your_stripe_webhook_secret")

@router.post("/webhook")
async def stripe_webhook(request: Request):
    data = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload=data,
            sig_header=sig_header,
            secret=webhook_secret
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")
    
    # Handle the event
    if event['type'] == 'checkout.session.completed':
        handle_checkout_session(event['data']['object'])
    elif event['type'] == 'payment_intent.succeeded':
        handle_payment_intent_succeeded(event['data']['object'])
    
    return {"status": "success"}

def handle_checkout_session(session: Dict[str, Any]):
    """Handle completed checkout session"""
    # Implement your business logic
    print(f"Processing completed checkout: {session.get('id')}")
    # You could save to database, activate subscription, etc.

def handle_payment_intent_succeeded(payment_intent: Dict[str, Any]):
    """Handle successful payment intent"""
    # Implement your business logic
    print(f"Processing successful payment: {payment_intent.get('id')}")